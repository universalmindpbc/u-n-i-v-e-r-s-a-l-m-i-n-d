# Agora Audio Room Backend Setup

This backend is prepared for the `Chillout Pod` audio room without adding UI to the home/video page.

## Worker

- Worker file: `cloudflare/agora-audio-room-worker.js`
- Wrangler config: `cloudflare/wrangler.agora-audio.toml`
- Endpoint path: `/agora-audio-token`
- Current room: `Chillout Pod`
- Current Agora App ID: `a211bda773b743579b5f86d5d89e6c3c`

The worker returns the client join payload:

```json
{
  "app_id": "a211bda773b743579b5f86d5d89e6c3c",
  "channel": "Chillout Pod",
  "token": "...",
  "uid": null,
  "role": "publisher"
}
```

## Secret

Store the temporary RTC token in Cloudflare, not in repository files:

```sh
wrangler secret put AGORA_CHILLOUT_POD_RTC_TOKEN --config cloudflare/wrangler.agora-audio.toml
```

Paste the Agora Console temporary RTC token when prompted.

## Deploy

```sh
wrangler deploy --config cloudflare/wrangler.agora-audio.toml
```

## Local Test Shape

Once deployed, the eventual UI can request:

```text
GET https://iam-agora-audio-room.<account>.workers.dev/agora-audio-token?channel=Chillout%20Pod
```

The frontend should use the returned `app_id`, `channel`, `token`, and `uid` with the Agora Web SDK audio client.

## Production Note

This first backend stores a temporary Agora Console RTC token. For production, replace it with server-side token generation using the Agora App Certificate as a Cloudflare secret, so tokens can be minted per user/session and refreshed automatically.
