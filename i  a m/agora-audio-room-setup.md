# Circle Audio Rooms Backend

The I Am television wallet offers eight live audio communities through one Cloudflare Worker and Agora RTC.

## Public API

- Worker: `cloudflare/agora-audio-room-worker.js`
- Configuration: `cloudflare/wrangler.agora-audio.toml`
- Endpoint: `https://iam-agora-audio-room.universalmind.workers.dev`
- Catalogue: `GET /audio-rooms`
- Reserve a seat and mint an RTC token: `POST /audio-rooms/join`
- Confirm live presence: `GET /audio-rooms/presence` with a WebSocket upgrade
- Leave or release a pending seat: `POST /audio-rooms/leave`

The Circle catalogue is IMG, WME, North Bondi RSL, NAGNATA, AIME, Black Rainbow, Headspace, and Phoenix. Each physical room has a strict capacity of nine. A tenth simultaneous reservation is assigned to room two, then further rooms are created as needed.

## Credentials

The Agora App ID is a non-secret Worker variable. Store the matching App Certificate as a Cloudflare secret; never put it in this repository:

```sh
wrangler secret put AGORA_APP_CERTIFICATE --config cloudflare/wrangler.agora-audio.toml
```

The Worker mints short-lived publisher tokens for the allocated channel and random numeric UID. The previous temporary-console-token flow is retired.

## Deploy and verify

```sh
cd cloudflare
pnpm install --frozen-lockfile
wrangler deploy --config wrangler.agora-audio.toml
cd ..
node tools/check-circle-room-worker.mjs https://iam-agora-audio-room.universalmind.workers.dev
```

The verification script proves the exact eight-community catalogue, live WebSocket presence, dynamic secure token issuance, nine-seat capacity, and automatic creation of room two for person ten.
