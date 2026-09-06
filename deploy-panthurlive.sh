#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FTP_HOST="${FTP_HOST:-ftp.universalmind.tv}"
FTP_USER="${FTP_USER:-codexdeploy@universalmind.tv}"
FTP_PASS_FILE="${FTP_PASS_FILE:-/private/tmp/um-public-html-ftp-pass.txt}"
FTP_KEYCHAIN_SERVICE="${FTP_KEYCHAIN_SERVICE:-universalmind-production-ftp}"
IAM_DIR="${IAM_DIR:-$ROOT_DIR/i  a m}"
MANIFEST_FILE="${MANIFEST_FILE:-$ROOT_DIR/.panthur-deploy-manifest.tsv}"
ROBOTS_FILE="${ROBOTS_FILE:-$ROOT_DIR/robots.txt}"
REMOTE_ROOT="${REMOTE_ROOT:-}"
REMOTE_ROOT="${REMOTE_ROOT#/}"
REMOTE_ROOT="${REMOTE_ROOT%/}"
OWNER_STATE_REFERENCE_ORIGIN="${OWNER_STATE_REFERENCE_ORIGIN:-https://staging.universalmind.tv/vogue/iam}"
OWNER_STATE_REFERENCE_ORIGIN="${OWNER_STATE_REFERENCE_ORIGIN%/}"

if [[ -f "$FTP_PASS_FILE" ]]; then
  FTP_PASS="$(cat "$FTP_PASS_FILE")"
elif command -v security >/dev/null 2>&1; then
  FTP_PASS="$(security find-generic-password \
    -a "$FTP_USER" \
    -s "$FTP_KEYCHAIN_SERVICE" \
    -w 2>/dev/null || true)"
else
  FTP_PASS=""
fi

if [[ -z "$FTP_PASS" ]]; then
  echo "Missing production FTP credential in $FTP_PASS_FILE or macOS Keychain service $FTP_KEYCHAIN_SERVICE." >&2
  exit 1
fi

encode_path() {
  python3 - "$1" <<'PY'
import sys
from urllib.parse import quote

print("/".join(quote(part) for part in sys.argv[1].split("/")))
PY
}

remote_target() {
  local remote_path="$1"

  if [[ -n "$REMOTE_ROOT" ]]; then
    printf '%s/%s\n' "$REMOTE_ROOT" "$remote_path"
  else
    printf '%s\n' "$remote_path"
  fi
}

put_file() {
  local source_file="$1"
  local remote_path="$2"
  local encoded_path

  encoded_path="$(encode_path "$(remote_target "$remote_path")")"
  curl --globoff --fail --silent --show-error --ftp-create-dirs \
    --retry 5 --retry-delay 2 --retry-max-time 180 --retry-all-errors \
    --user "$FTP_USER:$FTP_PASS" \
    --upload-file "$source_file" \
    "ftp://$FTP_HOST/$encoded_path"
}

file_hash() {
  shasum -a 256 "$1" | awk '{ print $1 }'
}

should_skip_iam_source() {
  local source_file="$1"
  local relative_path="${source_file#"$IAM_DIR"/}"

  case "$relative_path" in
    "api/mantra-library.json"|"api/quantum-tree-settings.json"|"api/happiness-ledger.json"|"apple-wallet/happiness-apple-registrations.json"|"api/.owner-state-history/"*|"api/.happiness-private/"*|"api/.runtime-private/"*|"a s s e t s/m a n t r a [ u p l o a d s ]/"*)
      return 0
      ;;
  esac

  [[ "$(basename "$source_file")" == ".DS_Store" ]] ||
    [[ "$source_file" == */__pycache__/* ]] ||
    [[ "$source_file" == *.pyc ]]
}

remote_file_exists() {
  local remote_path="$1"
  local encoded_path

  encoded_path="$(encode_path "$(remote_target "$remote_path")")"
  curl --globoff --fail --silent \
    --user "$FTP_USER:$FTP_PASS" \
    "ftp://$FTP_HOST/$encoded_path" \
    --output /dev/null
}

download_remote_file() {
  local remote_path="$1"
  local destination="$2"
  local encoded_path

  encoded_path="$(encode_path "$(remote_target "$remote_path")")"
  curl --globoff --fail --silent --show-error \
    --retry 5 --retry-delay 2 --retry-max-time 180 --retry-all-errors \
    --user "$FTP_USER:$FTP_PASS" \
    "ftp://$FTP_HOST/$encoded_path" \
    --output "$destination"
}

OWNER_STATE_SNAPSHOT_DIR=""
OWNER_STATE_BEFORE=""
OWNER_STATE_REFERENCE_BEFORE=""

cleanup_owner_state_snapshot() {
  if [[ -n "$OWNER_STATE_SNAPSHOT_DIR" && -d "$OWNER_STATE_SNAPSHOT_DIR" ]]; then
    rm -rf -- "$OWNER_STATE_SNAPSHOT_DIR"
  fi
}

trap cleanup_owner_state_snapshot EXIT

snapshot_owner_runtime_state() {
  local output_file="$1"
  local phase="$2"
  local scratch_dir json_path asset_list remote_path checksum index asset_path
  local -a protected_json_paths=(
    "api/mantra-library.json"
    "api/quantum-tree-settings.json"
    "api/happiness-ledger.json"
    "apple-wallet/happiness-apple-registrations.json"
  )

  scratch_dir="$OWNER_STATE_SNAPSHOT_DIR/$phase"
  mkdir -p "$scratch_dir"
  : > "$output_file"
  index=0

  for remote_path in "${protected_json_paths[@]}"; do
    json_path="$scratch_dir/state-$index.json"
    if [[ "$remote_path" != "api/mantra-library.json" ]] && ! remote_file_exists "vogue/iam/$remote_path"; then
      printf '%s\t%s\n' "MISSING" "$remote_path" >> "$output_file"
      index=$((index + 1))
      continue
    fi
    if ! download_remote_file "vogue/iam/$remote_path" "$json_path"; then
      echo "Release blocked: protected runtime state is unavailable: $remote_path" >&2
      return 1
    fi
    checksum="$(file_hash "$json_path")"
    printf '%s\t%s\n' "$checksum" "$remote_path" >> "$output_file"
    index=$((index + 1))
  done

  json_path="$scratch_dir/state-0.json"
  asset_list="$scratch_dir/mantra-upload-paths.txt"
  if ! extract_mantra_upload_paths "$json_path" > "$asset_list"; then
    echo "Release blocked: live Mantra owner state is invalid." >&2
    return 1
  fi
  while IFS= read -r asset_path; do
    [[ -n "$asset_path" ]] || continue
    remote_path="$asset_path"
    if ! download_remote_file "vogue/iam/$remote_path" "$scratch_dir/asset-$index"; then
      echo "Release blocked: a live Mantra sample referenced by owner state is unavailable: $remote_path" >&2
      return 1
    fi
    checksum="$(file_hash "$scratch_dir/asset-$index")"
    printf '%s\t%s\n' "$checksum" "$remote_path" >> "$output_file"
    index=$((index + 1))
  done < "$asset_list"

  LC_ALL=C sort -k2,2 "$output_file" -o "$output_file"
}

extract_mantra_upload_paths() {
  python3 - "$1" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    library = json.load(handle)

banks = library.get("banks")
if not isinstance(banks, dict) or not banks:
    raise SystemExit("Mantra library has no banks")

paths = set()
for slots in banks.values():
    if not isinstance(slots, list):
        raise SystemExit("Mantra bank is not a list")
    for slot in slots:
        asset = slot.get("asset") if isinstance(slot, dict) else None
        if isinstance(asset, str) and asset.startswith("a s s e t s/m a n t r a [ u p l o a d s ]/"):
            if "\n" in asset or "\r" in asset or ".." in asset.split("/"):
                raise SystemExit("Mantra asset path is unsafe")
            paths.add(asset)

for asset in sorted(paths):
    print(asset)
PY
}

download_reference_file() {
  local relative_path="$1"
  local destination="$2"
  local encoded_path

  encoded_path="$(encode_path "$relative_path")"
  curl --globoff --fail --silent --show-error \
    --retry 5 --retry-delay 2 --retry-max-time 180 --retry-all-errors \
    -H 'Cache-Control: no-cache' \
    "$OWNER_STATE_REFERENCE_ORIGIN/$encoded_path?ownerStateGuard=$(date +%s)" \
    --output "$destination"
}

snapshot_reference_mantra_state() {
  local output_file="$1"
  local phase="$2"
  local scratch_dir json_path asset_list asset_path checksum index

  scratch_dir="$OWNER_STATE_SNAPSHOT_DIR/$phase"
  mkdir -p "$scratch_dir"
  json_path="$scratch_dir/mantra-library.json"
  asset_list="$scratch_dir/mantra-upload-paths.txt"
  : > "$output_file"

  if ! download_reference_file "api/mantra-library.json" "$json_path"; then
    echo "Release blocked: approved staging Mantra state is unavailable." >&2
    return 1
  fi
  if ! extract_mantra_upload_paths "$json_path" > "$asset_list"; then
    echo "Release blocked: approved staging Mantra state is invalid." >&2
    return 1
  fi

  checksum="$(file_hash "$json_path")"
  printf '%s\t%s\n' "$checksum" "api/mantra-library.json" >> "$output_file"
  index=0
  while IFS= read -r asset_path; do
    [[ -n "$asset_path" ]] || continue
    if ! download_reference_file "$asset_path" "$scratch_dir/asset-$index"; then
      echo "Release blocked: approved staging Mantra sample is unavailable: $asset_path" >&2
      return 1
    fi
    checksum="$(file_hash "$scratch_dir/asset-$index")"
    printf '%s\t%s\n' "$checksum" "$asset_path" >> "$output_file"
    index=$((index + 1))
  done < "$asset_list"

  LC_ALL=C sort -k2,2 "$output_file" -o "$output_file"
}

is_production_target() {
  case "${OWNER_STATE_REFERENCE_REQUIRED:-auto}" in
    1|true|yes)
      return 0
      ;;
    0|false|no)
      return 1
      ;;
  esac

  [[ "$FTP_HOST" == "ftp.universalmind.tv" ]]
}

target_mantra_snapshot() {
  local source_snapshot="$1"
  local output_file="$2"

  awk -F '\t' '$2 == "api/mantra-library.json" || index($2, "a s s e t s/m a n t r a [ u p l o a d s ]/") == 1' \
    "$source_snapshot" > "$output_file"
}

verify_target_matches_reference() {
  local target_snapshot="$1"
  local reference_snapshot="$2"
  local phase="$3"
  local target_mantra="$OWNER_STATE_SNAPSHOT_DIR/target-mantra-$phase.tsv"

  target_mantra_snapshot "$target_snapshot" "$target_mantra"
  if ! cmp -s "$target_mantra" "$reference_snapshot"; then
    echo "Release blocked: production Mantra state does not match the approved staging state ($phase)." >&2
    diff -u "$reference_snapshot" "$target_mantra" >&2 || true
    return 1
  fi
}

deployment_requires_owner_state_guard() {
  case "$1" in
    iam|iam-fast|fast|media|changed|iam-changed|all|all-fast|all-changed)
      return 0
      ;;
  esac
  return 1
}

capture_owner_state_before_deploy() {
  OWNER_STATE_SNAPSHOT_DIR="$(mktemp -d)"
  OWNER_STATE_BEFORE="$OWNER_STATE_SNAPSHOT_DIR/before.tsv"
  snapshot_owner_runtime_state "$OWNER_STATE_BEFORE" "before"
  if is_production_target; then
    OWNER_STATE_REFERENCE_BEFORE="$OWNER_STATE_SNAPSHOT_DIR/reference-before.tsv"
    snapshot_reference_mantra_state "$OWNER_STATE_REFERENCE_BEFORE" "reference-before"
    verify_target_matches_reference "$OWNER_STATE_BEFORE" "$OWNER_STATE_REFERENCE_BEFORE" "before"
  fi
  echo "Protected owner runtime state captured before deployment."
}

verify_owner_runtime_state_preserved() {
  local after_snapshot="$OWNER_STATE_SNAPSHOT_DIR/after.tsv"
  local reference_after="$OWNER_STATE_SNAPSHOT_DIR/reference-after.tsv"

  snapshot_owner_runtime_state "$after_snapshot" "after"
  if ! cmp -s "$OWNER_STATE_BEFORE" "$after_snapshot"; then
    echo "Release failed: protected owner runtime state changed during deployment." >&2
    diff -u "$OWNER_STATE_BEFORE" "$after_snapshot" >&2 || true
    return 1
  fi

  if is_production_target; then
    snapshot_reference_mantra_state "$reference_after" "reference-after"
    if ! cmp -s "$OWNER_STATE_REFERENCE_BEFORE" "$reference_after"; then
      echo "Release failed: approved staging Mantra state changed during deployment." >&2
      diff -u "$OWNER_STATE_REFERENCE_BEFORE" "$reference_after" >&2 || true
      return 1
    fi
    verify_target_matches_reference "$after_snapshot" "$reference_after" "after"
  fi

  echo "Protected owner runtime state verified unchanged after deployment."
}

deploy_owner_state_seeds() {
  local relative_path

  for relative_path in "api/mantra-library.json" "api/quantum-tree-settings.json" "api/happiness-ledger.json" "apple-wallet/happiness-apple-registrations.json"; do
    if remote_file_exists "vogue/iam/$relative_path"; then
      echo "Owner state already exists; preserved: $relative_path"
      continue
    fi

    put_file "$IAM_DIR/$relative_path" "vogue/iam/$relative_path"
    echo "Owner state seeded because no live file existed: $relative_path"
  done
}

write_fast_manifest() {
  local manifest_tmp source_file relative_path checksum

  manifest_tmp="$(mktemp)"
  find "$IAM_DIR" -type f -print0 | while IFS= read -r -d '' source_file; do
    if should_skip_iam_source "$source_file"; then
      continue
    fi

    if [[ "$source_file" == *.mp4 ]]; then
      continue
    fi

    relative_path="${source_file#"$IAM_DIR"/}"
    checksum="$(file_hash "$source_file")"
    printf '%s\t%s\n' "$checksum" "$relative_path"
  done > "$manifest_tmp"

  mv "$manifest_tmp" "$MANIFEST_FILE"
}

deploy_redirects() {
  local current_htaccess preserved_htaccess merged_htaccess encoded_htaccess_path

  current_htaccess="$(mktemp)"
  preserved_htaccess="$(mktemp)"
  merged_htaccess="$(mktemp)"
  encoded_htaccess_path="$(encode_path "$(remote_target ".htaccess")")"

  if ! curl --fail --silent --show-error \
    --user "$FTP_USER:$FTP_PASS" \
    "ftp://$FTP_HOST/$encoded_htaccess_path" \
    -o "$current_htaccess"; then
    : > "$current_htaccess"
  fi

  if grep -q "# BEGIN Universal Mind I AM redirects" "$current_htaccess"; then
    awk '
      /^# BEGIN Universal Mind I AM redirects$/ { skip = 1; next }
      /^# END Universal Mind I AM redirects$/ { skip = 0; next }
      !skip { print }
    ' "$current_htaccess" > "$preserved_htaccess"
  elif grep -q "Canonical Universal Mind I AM entrypoints" "$current_htaccess" \
    && grep -q "# php -- BEGIN cPanel-generated handler" "$current_htaccess"; then
    sed -n '/# php -- BEGIN cPanel-generated handler/,$p' "$current_htaccess" > "$preserved_htaccess"
  else
    cp "$current_htaccess" "$preserved_htaccess"
  fi

  {
    printf '%s\n' '# BEGIN Universal Mind I AM redirects'
    printf '%s\n' 'Options -MultiViews'
    printf '%s\n' 'DirectoryIndex index.html'
    printf '\n'
    printf '%s\n' '# Keep app-shell HTML current while versioned assets retain their normal cache behaviour.'
    printf '%s\n' '<IfModule mod_headers.c>'
    printf '%s\n' '  <FilesMatch "\.html?$">'
    printf '%s\n' '    Header always set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"'
    printf '%s\n' '    Header always set Pragma "no-cache"'
    printf '%s\n' '    Header always set Expires "0"'
    printf '%s\n' '  </FilesMatch>'
    printf '%s\n' '</IfModule>'
    printf '\n'
    printf '%s\n' 'RewriteEngine On'
    printf '\n'
    printf '%s\n' '# Smartphone visitors receive the lightweight editorial surface while the'
    printf '%s\n' '# full media application remains available on desktop and tablet. `full=1`'
    printf '%s\n' '# is the private QA escape hatch for deliberate phone testing.'
    printf '%s\n' 'RewriteCond %{HTTP_USER_AGENT} !(iPad|Macintosh.*Mobile) [NC]'
    printf '%s\n' 'RewriteCond %{HTTP_USER_AGENT} "(Mobile|iPhone|iPod|IEMobile|Opera Mini|BlackBerry|webOS)" [NC]'
    printf '%s\n' 'RewriteCond %{QUERY_STRING} !(^|&)full=1(&|$) [NC]'
    printf '%s\n' 'RewriteRule ^shop/?$ /vogue/iam/shop.html [R=302,L,NE]'
    printf '\n'
    printf '%s\n' 'RewriteCond %{HTTP_USER_AGENT} !(iPad|Macintosh.*Mobile) [NC]'
    printf '%s\n' 'RewriteCond %{HTTP_USER_AGENT} "(Mobile|iPhone|iPod|IEMobile|Opera Mini|BlackBerry|webOS)" [NC]'
    printf '%s\n' 'RewriteCond %{QUERY_STRING} !(^|&)full=1(&|$) [NC]'
    printf '%s\n' 'RewriteCond %{QUERY_STRING} (^|&)shop=1(&|$) [NC]'
    printf '%s\n' 'RewriteRule ^vogue/iam/index\.html$ /vogue/iam/shop.html [R=302,L,NE]'
    printf '\n'
    printf '%s\n' 'RewriteCond %{HTTP_USER_AGENT} !(iPad|Macintosh.*Mobile) [NC]'
    printf '%s\n' 'RewriteCond %{HTTP_USER_AGENT} "(Mobile|iPhone|iPod|IEMobile|Opera Mini|BlackBerry|webOS)" [NC]'
    printf '%s\n' 'RewriteCond %{QUERY_STRING} !(^|&)full=1(&|$) [NC]'
    printf '%s\n' 'RewriteCond %{REQUEST_URI} !^/vogue/iam/(induction|about|program|science|research|light|privacy-first|business-model|traction|impact|our-team|shop|shop-science)\.html$ [NC]'
    printf '%s\n' 'RewriteRule ^vogue/iam/.*\.html$ /vogue/iam/induction.html?mobile=1 [R=302,L,NE]'
    printf '\n'
    printf '%s\n' '# Password-free Universal Mind I AM entrypoints.'
    printf '%s\n' 'RewriteRule ^light/?$ /vogue/iam/light.html [L]'
    printf '%s\n' 'RewriteRule ^wallet/?$ /vogue/iam/wallet.html [L]'
    printf '%s\n' 'RewriteRule ^shop/?$ /vogue/iam/index.html?shop=1 [R=302,L,NE]'
    printf '%s\n' 'RewriteRule ^iam/?$ /vogue/iam/induction.html [R=302,L]'
    printf '%s\n' 'RewriteRule ^vogue/?$ /vogue/iam/induction.html [R=302,L]'
    printf '%s\n' 'RewriteRule ^vogue/iam/?$ /vogue/iam/induction.html [R=302,L]'
    printf '\n'
    printf '%s\n' '# If a deploy does not contain physical /vogue/iam files, fall back to the local source folder.'
    printf '%s\n' 'RewriteCond %{REQUEST_FILENAME} !-f'
    printf '%s\n' 'RewriteCond %{REQUEST_FILENAME} !-d'
    printf '%s\n' 'RewriteRule ^vogue/iam/(.+)$ /i%20%20a%20m/$1 [B,L]'
    printf '%s\n' '# END Universal Mind I AM redirects'
    printf '\n'
    cat "$preserved_htaccess"
  } > "$merged_htaccess"

  put_file "$merged_htaccess" ".htaccess"
  put_file "$ROOT_DIR/_redirects" "_redirects"
  put_file "$ROOT_DIR/index.html" "index.html"
  put_file "$ROOT_DIR/iam/index.html" "iam/index.html"
  put_file "$ROOT_DIR/vogue/index.html" "vogue/index.html"
  put_file "$ROBOTS_FILE" "robots.txt"
  put_file "$ROOT_DIR/sitemap.xml" "sitemap.xml"
  put_file "$ROOT_DIR/llms.txt" "llms.txt"
}

deploy_iam() {
  local media_mode="${1:-include-media}"

  if [[ ! -d "$IAM_DIR" ]]; then
    echo "Missing I AM directory: $IAM_DIR" >&2
    exit 1
  fi

  find "$IAM_DIR" -type f -print0 | while IFS= read -r -d '' source_file; do
    if should_skip_iam_source "$source_file"; then
      continue
    fi

    if [[ "$media_mode" == "skip-media" && "$source_file" == *.mp4 ]]; then
      continue
    fi

    if [[ "$media_mode" == "media-only" && "$source_file" != *.mp4 ]]; then
      continue
    fi

    local relative_path="${source_file#"$IAM_DIR"/}"
    put_file "$source_file" "vogue/iam/$relative_path"
  done

  if [[ "$media_mode" != "media-only" ]]; then
    write_fast_manifest
  fi
}

deploy_iam_changed() {
  local old_manifest new_manifest source_file relative_path checksum previous_checksum upload_count skip_count

  if [[ ! -d "$IAM_DIR" ]]; then
    echo "Missing I AM directory: $IAM_DIR" >&2
    exit 1
  fi

  old_manifest="$(mktemp)"
  new_manifest="$(mktemp)"
  upload_count=0
  skip_count=0

  if [[ -f "$MANIFEST_FILE" ]]; then
    cp "$MANIFEST_FILE" "$old_manifest"
  else
    : > "$old_manifest"
  fi

  while IFS= read -r -d '' source_file; do
    if should_skip_iam_source "$source_file"; then
      continue
    fi

    if [[ "$source_file" == *.mp4 ]]; then
      continue
    fi

    relative_path="${source_file#"$IAM_DIR"/}"
    checksum="$(file_hash "$source_file")"
    previous_checksum="$(awk -F '\t' -v path="$relative_path" '$2 == path { print $1; exit }' "$old_manifest")"
    printf '%s\t%s\n' "$checksum" "$relative_path" >> "$new_manifest"

    if [[ "$checksum" == "$previous_checksum" ]]; then
      skip_count=$((skip_count + 1))
      continue
    fi

    put_file "$source_file" "vogue/iam/$relative_path"
    upload_count=$((upload_count + 1))
  done < <(find "$IAM_DIR" -type f -print0)

  mv "$new_manifest" "$MANIFEST_FILE"
  echo "Changed non-video files uploaded: $upload_count; unchanged skipped: $skip_count"
}

issue_staging_owner_password_reset() {
  # Explicit owner recovery uses the existing Panthur connection. Ordinary
  # deployments still never upload or overwrite private runtime credentials.
  if [[ "$FTP_USER" != "stagingdeploy@universalmind.tv" || "$FTP_HOST" != "sh00023.pa.smartservers.com.au" || -n "$REMOTE_ROOT" ]]; then
    echo "Owner password reset is restricted to the configured staging account." >&2
    exit 1
  fi
  local reset_dir reset_path download_status
  reset_dir="$(mktemp -d)"
  chmod 700 "$reset_dir"
  reset_path="vogue/iam/api/.runtime-private/quantum-tree-owner-reset.json"
  if download_remote_file "vogue/iam/api/.runtime-private/quantum-tree-owner.json" "$reset_dir/credentials.json"; then
    chmod 600 "$reset_dir/credentials.json"
  else
    download_status=$?
    # A missing credential is the original legacy state. Any other transport
    # error must fail rather than guessing the current credential revision.
    if [[ "$download_status" -ne 78 ]]; then
      rm -rf "$reset_dir"
      echo "Could not read the current administrator credential revision." >&2
      exit 1
    fi
    printf '%s\n' '{"revision":"legacy"}' > "$reset_dir/credentials.json"
  fi
  python3 - "$reset_dir" <<'PY'
import hashlib, json, os, pathlib, secrets, sys, time
root = pathlib.Path(sys.argv[1])
os.umask(0o077)
revision = json.loads((root / 'credentials.json').read_text())['revision']
if not isinstance(revision, str) or not revision or revision == 'unavailable':
    raise SystemExit('Credential revision is unavailable; no reset issued.')
token = secrets.token_hex(32)
record = {'schema_version': 1, 'credential_revision': revision,
          'token_hash': hashlib.sha256(token.encode()).hexdigest(), 'expires_at': int(time.time()) + 86400}
(root / 'reset.json').write_text(json.dumps(record) + '\n')
(root / 'link.txt').write_text('https://staging.universalmind.tv/vogue/iam/quantum-tree-control.html#reset=' + token + '\n')
PY
  if ! put_file "$reset_dir/reset.json" "$reset_path"; then
    rm -rf "$reset_dir"
    echo "Reset link was not issued." >&2
    exit 1
  fi
  # Verify token validity over HTTPS without consuming it. Never put the token
  # in a query string, an audit record, or a command argument.
  python3 - "$reset_dir" <<'PY'
import json, pathlib, sys, urllib.request
root = pathlib.Path(sys.argv[1])
token = (root / 'link.txt').read_text().strip().split('#reset=')[1]
request = urllib.request.Request('https://staging.universalmind.tv/vogue/iam/api/quantum-tree-settings.php',
    data=json.dumps({'action':'verify_reset', 'reset_token':token}).encode(),
    headers={'Content-Type':'application/json','Origin':'https://staging.universalmind.tv'})
with urllib.request.urlopen(request, timeout=30) as response:
    if json.load(response).get('valid') is not True: raise SystemExit('Reset verification failed.')
PY
  rm -f "$reset_dir/credentials.json" "$reset_dir/reset.json"
  echo "One-use staging password reset verified; expires in 24 hours. Private link file: $reset_dir/link.txt"
}

DEPLOY_MODE="${1:-iam}"

if deployment_requires_owner_state_guard "$DEPLOY_MODE"; then
  capture_owner_state_before_deploy
fi

case "$DEPLOY_MODE" in
  iam)
    deploy_iam "include-media"
    ;;
  iam-fast|fast)
    deploy_iam "skip-media"
    ;;
  media)
    deploy_iam "media-only"
    ;;
  changed|iam-changed)
    deploy_iam_changed
    ;;
  mark)
    write_fast_manifest
    ;;
  redirects)
    deploy_redirects
    ;;
  all)
    deploy_redirects
    deploy_iam "include-media"
    ;;
  all-fast)
    deploy_redirects
    deploy_iam "skip-media"
    ;;
  all-changed)
    deploy_redirects
    deploy_iam_changed
    ;;
  seed-owner-state)
    deploy_owner_state_seeds
    ;;
  owner-password-reset)
    issue_staging_owner_password_reset
    ;;
  *)
    echo "Usage: $0 [iam|iam-fast|fast|changed|iam-changed|mark|media|redirects|all|all-fast|all-changed|seed-owner-state|owner-password-reset]" >&2
    exit 2
    ;;
esac

if deployment_requires_owner_state_guard "$DEPLOY_MODE"; then
  verify_owner_runtime_state_preserved
fi

echo "Deploy complete: $DEPLOY_MODE"
