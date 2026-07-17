#!/bin/zsh

set -u

ROOT="/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light"
NODE="/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
LOG="/tmp/cloudflare-stream-priority-upload.log"

cd "$ROOT" || exit 1
exec >> "$LOG" 2>&1

echo "$(date -u +%FT%TZ) Priority upload supervisor started."
/usr/bin/caffeinate -i -w $$ &

until "$NODE" tools/cloudflare-stream-fashion-priority-upload.mjs; do
  echo "$(date -u +%FT%TZ) Fashion upload interrupted; retrying in 20 seconds."
  sleep 20
done

echo "$(date -u +%FT%TZ) Fashion uploads complete; resuming DJ queue."

until "$NODE" tools/cloudflare-stream-djset-upload.mjs; do
  echo "$(date -u +%FT%TZ) DJ upload interrupted; retrying in 20 seconds."
  sleep 20
done

echo "$(date -u +%FT%TZ) All Cloudflare uploads complete."
