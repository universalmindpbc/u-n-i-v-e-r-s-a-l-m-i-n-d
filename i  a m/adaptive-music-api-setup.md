# Adaptive Music API Setup

This page tracks the external accounts needed before the adaptive music video engine can stop using local catalogue fallback.

## Current live status

- The configured worker URL is `https://iam-adaptive-music-intelligence.universalmind.workers.dev/adaptive-music-intelligence`.
- External verification on 2026-07-04 returned Cloudflare `404` / `error code: 1042`, so the worker is not currently reachable at that hostname.
- Until the worker is deployed and API credentials are installed as Cloudflare secrets, Gracenote, Cyanite, Musixmatch, and YouTube cannot influence live recommendations.

## Signup and demo links

### Cyanite

- Signup: `https://app.cyanite.ai/register`
- API docs: `https://api-docs.cyanite.ai/docs/create-integration/`
- GraphQL endpoint: `https://api.cyanite.ai/graphql`
- Best first provider to trial because it has self-serve registration and integration tokens.
- Required output: `CYANITE_ACCESS_TOKEN`
- Optional webhook output: `CYANITE_WEBHOOK_SECRET`

### Gracenote

- Audio Data product: `https://gracenote.com/products/audio-data/`
- Contact form is embedded on the Audio Data page.
- This appears to be sales/demo/licensed access rather than instant self-serve developer keys.
- Required output, depending on their contract: `GRACENOTE_API_KEY`, or `GRACENOTE_CLIENT_ID` plus `GRACENOTE_CLIENT_TAG`, and the contract-specific endpoint/API guide.

### Musixmatch

- Developer docs: `https://docs.musixmatch.com/overview`
- Developer portal: `https://developer.musixmatch.com/login`
- API pricing/key page: `https://www.musixmatch.com/pro/api/pricing`
- Required output: `MUSIXMATCH_API_KEY`
- Intended role: lyrics metadata, lyric analysis, emotional/safety review, and licensing-safe context. Do not display full lyrics unless the plan permits it.

### YouTube Data API

- Getting started: `https://developers.google.com/youtube/v3/getting-started`
- Credentials: `https://developers.google.com/youtube/registering_an_application`
- API console: `https://console.cloud.google.com/apis/library/youtube.googleapis.com`
- Required output: `YOUTUBE_API_KEY`
- Intended role: official video discovery and embeddability validation using `search.list` and `videos.list`.

## Cloudflare secrets

Set keys with Wrangler after the accounts exist:

```sh
wrangler secret put YOUTUBE_API_KEY --config cloudflare/wrangler.adaptive-music.toml
wrangler secret put MUSIXMATCH_API_KEY --config cloudflare/wrangler.adaptive-music.toml
wrangler secret put CYANITE_ACCESS_TOKEN --config cloudflare/wrangler.adaptive-music.toml
wrangler secret put GRACENOTE_API_KEY --config cloudflare/wrangler.adaptive-music.toml
wrangler secret put GRACENOTE_CLIENT_ID --config cloudflare/wrangler.adaptive-music.toml
wrangler secret put GRACENOTE_CLIENT_TAG --config cloudflare/wrangler.adaptive-music.toml
```

Use either the Gracenote API key path or the client ID/client tag path, depending on what Gracenote provides.

## Recommended setup order

1. Create Cyanite account, verify email, create integration, store access token.
2. Create Musixmatch Pro API account or trial/payment plan, store API key.
3. Create Google Cloud project, enable YouTube Data API v3, create restricted API key.
4. Submit Gracenote Audio Data sales/demo inquiry and request API documentation for genre, mood, style, tempo, artist, and recommendation metadata.
5. Deploy `iam-adaptive-music-intelligence` worker and run a credential audit request from the adaptive music video page.
