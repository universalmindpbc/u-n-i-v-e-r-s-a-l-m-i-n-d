#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="${NODE_BIN:-}"

if [[ -z "$NODE_BIN" ]]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  elif [[ -x "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
    NODE_BIN="/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
  else
    echo "Node.js is required for the staging preflight checks." >&2
    exit 1
  fi
fi

"$NODE_BIN" --check "$ROOT_DIR/i  a m/adaptive-environment-television.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/mantra-sampler.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/broadcast-interactions-v1.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/mantra-studio.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/circle-audio-rooms.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/care-worlds.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/program-navigation.js"
"$NODE_BIN" --check "$ROOT_DIR/cloudflare/agora-audio-room-worker.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/realtime-voice-assistant.js"
"$NODE_BIN" --check "$ROOT_DIR/cloudflare/iam-citizen-needs-worker.js"
"$NODE_BIN" --check "$ROOT_DIR/cloudflare/privacy-research-foundations.js"
"$NODE_BIN" --check "$ROOT_DIR/cloudflare/citizen-data-vault.js"
"$NODE_BIN" --check "$ROOT_DIR/cloudflare/citizen-data-core.js"
"$NODE_BIN" --check "$ROOT_DIR/cloudflare/citizen-data-worker.js"
"$NODE_BIN" --check "$ROOT_DIR/research/privacy-lab/healthomics-adapter.mjs"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/globe.js"
"$NODE_BIN" --check "$ROOT_DIR/i  a m/happiness-control.js"
"$NODE_BIN" "$ROOT_DIR/tools/check-adaptive-music-handoff.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-owner-state-persistence.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-broadcast-clock.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-programme-catalogue-release.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-new-videos-programme-release.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-broadcast-interactions.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-circle-rooms.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-care-worlds.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-public-crawler-surface.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-shopfront-mockup.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-happiness-rewards.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-privacy-research-foundations.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-citizen-data-foundation.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-universal-one-programme-guide.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-program-page.mjs"
"$NODE_BIN" "$ROOT_DIR/tools/check-universal-one-adaptive-guide.mjs"

if command -v php >/dev/null 2>&1; then
  php -l "$ROOT_DIR/i  a m/api/mantra-library.php"
  php -l "$ROOT_DIR/i  a m/api/mantra-voice.php"
  php -l "$ROOT_DIR/i  a m/api/broadcast-clock.php"
  php -l "$ROOT_DIR/i  a m/api/broadcast-interactions.php"
  php -l "$ROOT_DIR/i  a m/api/realtime-client-secret.php"
  php -l "$ROOT_DIR/i  a m/api/happiness-automation.php"
  php -l "$ROOT_DIR/i  a m/apple-wallet/happiness-apple-lib.php"
  php -l "$ROOT_DIR/i  a m/apple-wallet/pass.php"
  php -l "$ROOT_DIR/i  a m/apple-wallet/service.php"
fi

export FTP_HOST="${FTP_HOST:-sh00023.pa.smartservers.com.au}"
export FTP_USER="${FTP_USER:-stagingdeploy@universalmind.tv}"
export FTP_PASS_FILE="${FTP_PASS_FILE:-/private/tmp/um-staging-ftp-pass.txt}"
export FTP_KEYCHAIN_SERVICE="${FTP_KEYCHAIN_SERVICE:-universalmind-staging-ftp}"
export REMOTE_ROOT=""
export MANIFEST_FILE="${MANIFEST_FILE:-$ROOT_DIR/.panthur-staging-deploy-manifest.tsv}"
export ROBOTS_FILE="${ROBOTS_FILE:-$ROOT_DIR/robots-staging.txt}"

exec "$ROOT_DIR/deploy-panthurlive.sh" "${1:-all-changed}"
