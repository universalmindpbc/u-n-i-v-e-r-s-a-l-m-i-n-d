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
    "api/mantra-library.json"|"api/quantum-tree-settings.json"|"api/happiness-ledger.json"|"apple-wallet/happiness-apple-registrations.json"|"api/.owner-state-history/"*|"api/.happiness-private/"*|"api/.runtime-private/"*|"a s s e t s/m a n t r a [ u p l o a d s ]/"*|"a s s e t s/s o v e r e i g n t y/"*|".private/"*)
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
    printf '%s\n' '# Serve AI reading guides with their declared text encoding.'
    printf '%s\n' '<Files "llms.txt">'
    printf '%s\n' '  AddDefaultCharset UTF-8'
    printf '%s\n' '</Files>'
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
    printf '%s\n' '# Confidential owner documents must never be served as public assets.'
    printf '%s\n' 'RewriteRule (^|/)s[[:space:]]o[[:space:]]v[[:space:]]e[[:space:]]r[[:space:]]e[[:space:]]i[[:space:]]g[[:space:]]n[[:space:]]t[[:space:]]y(/|$) - [F,L,NC]'
    printf '%s\n' 'RewriteRule (^|/)\.private(/|$) - [F,L]'
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
    printf '%s\n' 'RewriteRule ^study/dashboard/?$ /vogue/iam/study.php?dashboard=1 [R=302,L,NE]'
    printf '%s\n' 'RewriteRule ^study/?$ /vogue/iam/study.php?login=1 [R=302,L,NE,QSA]'
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
  # Legacy accounts have no private credential directory until their first
  # password change. Create it without touching any existing credential.
  curl --globoff --fail --silent --show-error --user "$FTP_USER:$FTP_PASS" \
    --quote "*MKD vogue/iam/api/.runtime-private" \
    --output /dev/null "ftp://$FTP_HOST/"
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
  "$NODE_BIN" --input-type=module - "$reset_dir" <<'JS'
import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.argv[2];
const link = (await fs.readFile(path.join(root, 'link.txt'), 'utf8')).trim();
const response = await fetch('https://staging.universalmind.tv/vogue/iam/api/quantum-tree-settings.php', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://staging.universalmind.tv' },
  body: JSON.stringify({ action: 'verify_reset', reset_token: link.split('#reset=')[1] }),
  signal: AbortSignal.timeout(30000),
});
if (!response.ok || (await response.json()).valid !== true) throw Error('Reset verification failed.');
JS
  rm -f "$reset_dir/credentials.json" "$reset_dir/reset.json"
  echo "One-use staging password reset verified; expires in 24 hours. Private link file: $reset_dir/link.txt"
}

provision_sovereignty_runtime() {
  if [[ -z "${SOVEREIGNTY_SEED_DIR:-}" ]]; then
    echo "A private Sovereignty runtime directory is required." >&2
    return 1
  fi
  SOVEREIGNTY_FTP_PASS="$FTP_PASS" SOVEREIGNTY_FTP_HOST="$FTP_HOST" SOVEREIGNTY_FTP_USER="$FTP_USER" \
  SOVEREIGNTY_REMOTE_ROOT="$REMOTE_ROOT" \
    python3 "$ROOT_DIR/tools/provision-sovereignty-runtime.py" "$1" "$SOVEREIGNTY_SEED_DIR"
}

# Scoped Informatics deployment, using the existing Panthur transport.
deploy_informatics() {
  local manifest_tmp queue_tmp
  python3 "$ROOT_DIR/tools/check-informatics-discovery.py" || return 1
  # Public dataset exports travel with every Informatics release.
  python3 "$ROOT_DIR/tools/export-informatics.py" --check || return 1
  # Same Panthur FTP transport and manifest. Validate the entire scoped source
  # before uploading; publish entry points only after all referenced assets exist.
  if ! git -C "$ROOT_DIR" diff --quiet HEAD -- Informatics research/informatics/legacy-uppercase.htaccess; then
    echo "Refusing to deploy uncommitted Informatics source." >&2
    return 1
  fi
  manifest_tmp="$(mktemp)"
  queue_tmp="$(mktemp)"
  if [[ -f "$MANIFEST_FILE" ]]; then
    awk -F '\t' '$2 !~ /^(Informatics|informatics)\//' "$MANIFEST_FILE" > "$manifest_tmp"
  fi
  python3 - "$ROOT_DIR" "$MANIFEST_FILE" "$manifest_tmp" "$queue_tmp" <<'PYQUEUE'
import hashlib, pathlib, subprocess, sys
root, old_file, manifest, queue = map(pathlib.Path, sys.argv[1:])
old = {}
if old_file.exists():
    for line in old_file.read_text().splitlines():
        digest, path = line.split('\t', 1)
        old[path] = digest
tracked = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z', 'Informatics', 'research/informatics/legacy-uppercase.htaccess']).decode().split('\0')
entries = []
for path in filter(None, tracked):
    remote = 'Informatics/.htaccess' if path.endswith('legacy-uppercase.htaccess') else 'informatics/' + path.removeprefix('Informatics/')
    digest = hashlib.sha256((root / path).read_bytes()).hexdigest()
    entries.append((path, remote, digest))
# Data and images first; the index and HTML/JS entry points form the final batch.
entries.sort(key=lambda x: (x[0].endswith(('index.json', '.html', '.js')), x[0]))
with manifest.open('a') as f, queue.open('w') as q:
    for path, remote, digest in entries:
        f.write(digest + '\t' + remote + '\n')
        if old.get(remote) != digest:
            q.write(path + '\t' + remote + '\n')
print(f'Informatics: {len(entries)} tracked assets; {sum(old.get(r) != h for _, r, h in entries)} changed uploads via Panthur FTP.')
PYQUEUE
  if [[ ! -s "$queue_tmp" ]]; then
    rm -f "$queue_tmp"
    mv "$manifest_tmp" "$MANIFEST_FILE"
    return 0
  fi
  # A single sequential curl invocation reuses the FTP control connection.
  # Credentials travel through stdin only; no credential-bearing config is saved.
  if ! PAN_UPLOAD_HOST="$FTP_HOST" PAN_UPLOAD_USER="$FTP_USER" PAN_UPLOAD_PASS="$FTP_PASS" \
    PAN_UPLOAD_ROOT="$REMOTE_ROOT" python3 - "$ROOT_DIR" "$queue_tmp" <<'PYCONFIG' | curl --fail-early --config -
import json, os, pathlib, sys, urllib.parse
root, queue = map(pathlib.Path, sys.argv[1:])
rows = [line.split('\t') for line in queue.read_text().splitlines()]
for i, (source, remote) in enumerate(rows, 1):
    if i > 1: print('next')
    for option in ('globoff', 'fail', 'silent', 'show-error', 'ftp-create-dirs', 'retry-all-errors'):
        print(option)
    for option, value in [('retry', '5'), ('retry-delay', '2'), ('retry-max-time', '180')]:
        print(option + ' = ' + value)
    prefix = os.environ['PAN_UPLOAD_ROOT'].strip('/')
    target = (prefix + '/' if prefix else '') + remote
    values = {'user': os.environ['PAN_UPLOAD_USER'] + ':' + os.environ['PAN_UPLOAD_PASS'],
              'upload-file': str(root / source),
              'url': 'ftp://' + os.environ['PAN_UPLOAD_HOST'] + '/' + urllib.parse.quote(target, safe='/')}
    if i % 200 == 0 or i == len(rows):
        values['write-out'] = f'Informatics: uploaded {i}/{len(rows)} changed assets.\n'
    for key, value in values.items(): print(key + ' = ' + json.dumps(value, ensure_ascii=False))
PYCONFIG
  then
    rm -f "$manifest_tmp" "$queue_tmp"
    return 1
  fi
  rm -f "$queue_tmp"
  mv "$manifest_tmp" "$MANIFEST_FILE"
  echo "Informatics: completed changed uploads through the existing Panthur curl/FTP transport."
}

# Protected patent route. Runtime records never enter Git or public assets.
patent_target_guard() {
  if [[ -n "$REMOTE_ROOT" ]]; then echo "Unexpected patent deployment root." >&2; return 1; fi
  case "$FTP_USER" in
    stagingdeploy@universalmind.tv) PATENT_TARGET_ORIGIN="https://staging.universalmind.tv" ;;
    codexdeploy@universalmind.tv)
      [[ "${PATENT_PRODUCTION_APPROVED:-}" == "1" ]] || { echo "Explicit production release authorization is required." >&2; return 1; }
      PATENT_TARGET_ORIGIN="https://universalmind.tv" ;;
    *) echo "Unrecognised patent deployment target." >&2; return 1 ;;
  esac
}

deploy_patent() {
  patent_target_guard || return 1
  git -C "$ROOT_DIR" diff --quiet HEAD -- patent Informatics/universal-one.js deploy-panthur-staging.sh deploy-panthurlive.sh || return 1
  local patent_manifest patent_source patent_remote
  patent_manifest="$(mktemp)"
  if [[ -f "$MANIFEST_FILE" ]]; then
    awk -F '\t' '$2 !~ /^patent\// && $2 != "informatics/universal-one.js"' "$MANIFEST_FILE" > "$patent_manifest"
  fi
  put_file "$ROOT_DIR/patent/private-deny.htaccess" "patent/.private/.htaccess"
  put_file "$ROOT_DIR/Informatics/universal-one.js" "informatics/universal-one.js"
  printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/Informatics/universal-one.js")" "informatics/universal-one.js" >> "$patent_manifest"
  while IFS= read -r patent_source; do
    [[ -n "$patent_source" ]] || continue
    patent_remote="$patent_source"
    [[ "$patent_source" == "patent/private-deny.htaccess" ]] && patent_remote="patent/.private/.htaccess"
    put_file "$ROOT_DIR/$patent_source" "$patent_remote"
    printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/$patent_source")" "$patent_remote" >> "$patent_manifest"
  done < <(git -C "$ROOT_DIR" ls-files patent | sort | awk '$0 != "patent/index.php" {print} END {print "patent/index.php"}')
  mv "$patent_manifest" "$MANIFEST_FILE"
}

configure_patent_content() {
  patent_target_guard || return 1
  local runtime="${PATENT_RUNTIME_DIR:-}" image status
  [[ -f "$runtime/chapters.json" && -f "$runtime/drawing-gallery.json" ]] || return 1
  [[ "$(find "$runtime/drawings" -name 'image-*.jpg' -type f | wc -l | tr -d ' ')" == "91" ]] || return 1
  put_file "$ROOT_DIR/patent/private-deny.htaccess" "patent/.private/.htaccess"
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$PATENT_TARGET_ORIGIN/patent/.private/document.json")"
  [[ "$status" == "403" ]] || { echo "Private storage denial failed." >&2; return 1; }
  for image in "$runtime"/drawings/image-*.jpg; do put_file "$image" "patent/.private/drawings/$(basename "$image")"; done
  put_file "$runtime/drawing-gallery.json" "patent/.private/drawing-gallery.json"
  put_file "$runtime/chapters.json" "patent/.private/chapters.json"
  if [[ -f "$runtime/ai-config.json" ]]; then put_file "$runtime/ai-config.json" "patent/.private/ai-config.json"; fi
  echo "Private patent chapters and 91 drawings uploaded through Panthur."
}

configure_patent_ai() {
  patent_target_guard || return 1
  local runtime="${PATENT_RUNTIME_DIR:-}" status
  [[ -f "$runtime/ai-config.json" ]] || return 1
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$PATENT_TARGET_ORIGIN/patent/.private/ai-config.json")"
  [[ "$status" == "403" ]] || { echo "Private storage denial failed." >&2; return 1; }
  put_file "$runtime/ai-config.json" "patent/.private/ai-config.json"
  echo "Private patent service configuration uploaded through Panthur."
}

configure_patent_private() {
  patent_target_guard || return 1
  local patent_runtime="${PATENT_RUNTIME_DIR:-}" patent_probe patent_status
  [[ -n "$patent_runtime" && -f "$patent_runtime/access.json" && -f "$patent_runtime/document.json" && -f "$patent_runtime/specification.pdf" ]] || return 1
  put_file "$ROOT_DIR/patent/private-deny.htaccess" "patent/.private/.htaccess"
  patent_probe="$(mktemp)"
  printf 'Private route access test\n' > "$patent_probe"
  put_file "$patent_probe" "patent/.private/access-probe.txt"
  rm -f "$patent_probe"
  patent_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$PATENT_TARGET_ORIGIN/patent/.private/access-probe.txt")"
  [[ "$patent_status" == "403" ]] || { echo "Private storage denial failed; no private content uploaded." >&2; return 1; }
  put_file "$patent_runtime/access.json" "patent/.private/access.json"
  put_file "$patent_runtime/document.json" "patent/.private/document.json"
  put_file "$patent_runtime/specification.pdf" "patent/.private/specification.pdf"
  if [[ -f "$patent_runtime/receipt.jpg" ]]; then
    put_file "$patent_runtime/receipt.jpg" "patent/.private/receipt.jpg"
  fi
  echo "Private patent runtime uploaded after denial verification."
}


# Scoped Events publishing retains the same Panthur FTP transport and manifest.
deploy_events() {
  local source relative checksum manifest_tmp
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain --untracked-files=all -- events)" ]]; then
    echo "Refusing to deploy uncommitted Events source." >&2
    return 1
  fi
  manifest_tmp="$(mktemp)"
  if [[ -f "$MANIFEST_FILE" ]]; then
    awk -F '\t' '$2 !~ /^events\//' "$MANIFEST_FILE" > "$manifest_tmp"
  fi
  # Install directory protection first, then assets and the PHP entry point last.
  put_file "$ROOT_DIR/events/private/.htaccess" "events/private/.htaccess"
  while IFS= read -r relative; do
    [[ "$relative" == "events/index.php" ]] && continue
    source="$ROOT_DIR/$relative"
    checksum="$(file_hash "$source")"
    put_file "$source" "$relative"
    printf '%s\t%s\n' "$checksum" "$relative" >> "$manifest_tmp"
  done < <(git -C "$ROOT_DIR" ls-files events)
  put_file "$ROOT_DIR/events/index.php" "events/index.php"
  printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/events/index.php")" "events/index.php" >> "$manifest_tmp"
  mv "$manifest_tmp" "$MANIFEST_FILE"
  echo "Events: committed source published through Panthur FTP."
}

# Publish the organisation guide through the existing Panthur transport.
deploy_ai_wiki() {
  local relative manifest_tmp
  local paths=(read/wiki.css read/resources.json read/index.html home/ai-wiki-link.css home/directory.css llms.txt sitemap.xml home/index.html index.html)
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain --untracked-files=all -- "${paths[@]}" robots.txt robots-staging.txt)" ]]; then
    echo "Refusing to deploy uncommitted AI wiki source." >&2
    return 1
  fi
  for relative in "${paths[@]}"; do
    git -C "$ROOT_DIR" ls-files --error-unmatch "$relative" >/dev/null || return 1
  done
  manifest_tmp="$(mktemp)"
  if [[ -f "$MANIFEST_FILE" ]]; then
    awk -F '\t' '$2 !~ /^read\// && $2 != "home/ai-wiki-link.css" && $2 != "home/directory.css" && $2 != "llms.txt" && $2 != "sitemap.xml" && $2 != "robots.txt" && $2 != "home/index.html" && $2 != "index.html"' "$MANIFEST_FILE" > "$manifest_tmp"
  fi
  put_file "$ROBOTS_FILE" "robots.txt"
  printf '%s\t%s\n' "$(file_hash "$ROBOTS_FILE")" "robots.txt" >> "$manifest_tmp"
  for relative in "${paths[@]}"; do
    put_file "$ROOT_DIR/$relative" "$relative"
    printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/$relative")" "$relative" >> "$manifest_tmp"
  done
  mv "$manifest_tmp" "$MANIFEST_FILE"
  echo "AI wiki: committed source published through Panthur FTP."
}

# The directory is published by the existing transport, with the root entry last.
deploy_directory() {
  local relative manifest_tmp
  local paths=(home/assets/festival-loop.mp4 home/assets/festival-poster.jpg home/entry-shell.css home/entry-shell.js home/directory.css home/directory.js home/directory-story.js home/directory-rain.js events/portal-entry.php home/index.html index.html)
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain --untracked-files=all -- "${paths[@]}")" ]]; then
    echo "Refusing to deploy uncommitted directory source." >&2
    return 1
  fi
  for relative in "${paths[@]}"; do
    git -C "$ROOT_DIR" ls-files --error-unmatch "$relative" >/dev/null || return 1
  done
  manifest_tmp="$(mktemp)"
  if [[ -f "$MANIFEST_FILE" ]]; then
    awk -F '\t' '$2 !~ /^home\// && $2 != "events/portal-entry.php" && $2 != "index.html"' "$MANIFEST_FILE" > "$manifest_tmp"
  fi
  for relative in "${paths[@]}"; do
    put_file "$ROOT_DIR/$relative" "$relative"
    printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/$relative")" "$relative" >> "$manifest_tmp"
  done
  mv "$manifest_tmp" "$MANIFEST_FILE"
  echo "Directory: committed source published through Panthur FTP."
}

# Happiness uses the existing transport with a committed, narrowly scoped source.
deploy_happiness() {
  local relative manifest_tmp
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain --untracked-files=all -- happiness events/happiness-entry.php)" ]]; then
    echo "Refusing to deploy uncommitted Happiness source." >&2
    return 1
  fi
  git -C "$ROOT_DIR" ls-files --error-unmatch happiness/index.php events/happiness-entry.php >/dev/null || return 1
  manifest_tmp="$(mktemp)"
  if [[ -f "$MANIFEST_FILE" ]]; then
    awk -F '\t' '$2 !~ /^happiness\// && $2 != "events/happiness-entry.php"' "$MANIFEST_FILE" > "$manifest_tmp"
  fi
  while IFS= read -r relative; do
    [[ "$relative" == "happiness/index.php" ]] && continue
    put_file "$ROOT_DIR/$relative" "$relative"
    printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/$relative")" "$relative" >> "$manifest_tmp"
  done < <(git -C "$ROOT_DIR" ls-files happiness)
  for relative in happiness/index.php events/happiness-entry.php; do
    put_file "$ROOT_DIR/$relative" "$relative"
    printf '%s\t%s\n' "$(file_hash "$ROOT_DIR/$relative")" "$relative" >> "$manifest_tmp"
  done
  mv "$manifest_tmp" "$MANIFEST_FILE"
  echo "Happiness: committed source published through Panthur FTP."
}

DEPLOY_MODE="${1:-iam}"

if deployment_requires_owner_state_guard "$DEPLOY_MODE"; then
  capture_owner_state_before_deploy
fi

case "$DEPLOY_MODE" in
  ai-wiki)
    deploy_ai_wiki
    ;;
  happiness)
    deploy_happiness
    ;;
  directory)
    deploy_directory
    ;;
  events)
    deploy_events
    ;;
  patent)
    deploy_patent
    ;;
  patent-content)
    configure_patent_content
    ;;
  patent-ai-configure)
    configure_patent_ai
    ;;
  patent-configure)
    configure_patent_private
    ;;
  informatics)
    deploy_informatics
    ;;
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
  sovereignty-seed)
    provision_sovereignty_runtime seed
    ;;
  sovereignty-configure)
    provision_sovereignty_runtime configure
    ;;
  *)
    echo "Usage: $0 [ai-wiki|happiness|directory|events|iam|iam-fast|fast|changed|iam-changed|mark|media|redirects|all|all-fast|all-changed|seed-owner-state|owner-password-reset|sovereignty-seed|sovereignty-configure]" >&2
    exit 2
    ;;
esac

if deployment_requires_owner_state_guard "$DEPLOY_MODE"; then
  verify_owner_runtime_state_preserved
fi

echo "Deploy complete: $DEPLOY_MODE"
