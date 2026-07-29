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
    "api/mantra-library.json"|"api/quantum-tree-settings.json"|"api/happiness-ledger.json"|"apple-wallet/happiness-apple-registrations.json"|"api/.owner-state-history/"*|"api/.happiness-private/"*|"a s s e t s/m a n t r a [ u p l o a d s ]/"*)
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
  curl --globoff --fail --silent --show-error \
    --user "$FTP_USER:$FTP_PASS" \
    "ftp://$FTP_HOST/$encoded_path" \
    --output /dev/null
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
    printf '%s\n' 'RewriteCond %{REQUEST_URI} !^/vogue/iam/(induction|about|science|our-team|shop)\.html$ [NC]'
    printf '%s\n' 'RewriteRule ^vogue/iam/.*\.html$ /vogue/iam/induction.html?mobile=1 [R=302,L,NE]'
    printf '\n'
    printf '%s\n' '# Password-free Universal Mind I AM entrypoints.'
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

case "${1:-iam}" in
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
  *)
    echo "Usage: $0 [iam|iam-fast|fast|changed|iam-changed|mark|media|redirects|all|all-fast|all-changed|seed-owner-state]" >&2
    exit 2
    ;;
esac

echo "Deploy complete: ${1:-iam}"
