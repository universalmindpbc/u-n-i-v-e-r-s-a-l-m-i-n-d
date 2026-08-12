# Adaptive Hero Music Video Strategy

## Intent

Create a homepage-derived journey where the citizen self-reports before an extended streaming session starts. The system infers current needs with Adaptive Inference Engine system prompt v5.55, selects one contextual hero music video, then continues into an eligible Universal Mind music room and application-assigned format.

## Production Flow

1. Self-report and environment context
   - Collect the short `I am ...` self-report.
   - Add privacy-preserving local context from `local-context.js`: time, weather, broad location label and context role.
   - Send to the existing citizen needs inference worker.
   - The worker imports `adaptive-inference-system-prompt-v5-55.js`, generated from the canonical v5.55 markdown.

2. Needs JSON
   - Return `selected_music_room`, `selected_format`, `source_id`, `catalogue_ready`, `music_room_confidence` and `music_room_reason`.
   - The canonical rooms are inner planes, champagne bohemia, modul8 infinity, james bondage and safety cushion. Safety cushion is music videos only and unavailable until approved ready assets are attached.
   - Keep `clinical_status: not_a_diagnosis`.
   - Store the result under `iamLatestInference` and `citizenNeedsLatestInference` so `adaptive-environment.js` can continue to own the radio station handoff.

3. Music intelligence search
   - Universal Mind seed catalogue: editable artist, label, scene and candidate metadata in `adaptive-music-artist-catalogue.json`.
   - Gracenote: primary metadata source for genre, mood, style, era and artist/recording identity.
   - Cyanite: contingency metadata and audio-similarity source if Gracenote is unavailable or sparse.
   - Musixmatch: lyrics resonance and safety review, especially for explicit violence, hate, graphic self-harm or lyrical tone that conflicts with the inferred needs.
   - YouTube Data API v3: contextual video search with `type=video`, `videoCategoryId=10`, `videoEmbeddable=true`, `videoSyndicated=true`, `safeSearch=strict`, `topicId=/m/02lkt`, and `order=relevance`.
   - `videos.list` validation should confirm `status.embeddable=true` and public status before the browser receives a playable embed.

4. GPT review
   - Review the candidate set against musical identity, stated intent and taste, constructive trajectory, needs, context, continuity, safety, format eligibility and catalogue readiness.
   - Calm remains a Citizen Needs signal; chillout and house remain genres, not recommendation categories.
   - Prefer approved Universal Mind artist roster candidates first, then world-class adjacent artists, then underground discoveries.

5. Final structured JSON
   - Return exactly one hero video plus one eligible extended session, or no extended session when no approved ready source exists.
   - Include candidate audit, source signals, safety filters, uncertainty and YouTube delivery policy.

6. Playback
   - Load the selected video through the official YouTube IFrame Player API only when the video has been API-confirmed as embeddable, or when the sandbox URL explicitly includes `?forceLiveVideo=1`.
   - Use the cinematic prototype frame when a candidate is unverified, known blocked, or the IFrame API returns an embed error.
   - Use `youtube-nocookie.com`, `playsinline=1`, `rel=0` and `iv_load_policy=3` for a cleaner compliant embed.
   - Do not block, hide, remove or modify YouTube-served ads. For guaranteed ad-free playback, use licensed direct video assets, Vimeo/pro first-party hosting, YouTube Premium user context where applicable, or a commercial licensing path.
   - On `YT.PlayerState.ENDED`, dissolve the player and start the selected eligible format.
   - On YouTube player errors `100`, `101`, `150` or related failure states, render the prototype fallback frame and continue only when an eligible ready session exists.

## Prototype Files

- `adaptive-music-video.html`: homepage-derived page.
- `adaptive-music-video.js`: local prototype recommendation engine, YouTube player handoff and JSON output.
- `adaptive-music-artist-catalogue.json`: editable Universal Mind seed catalogue and first hero-candidate metadata.
- `adaptive-inference-engine-system-prompt-v5.55.html`: codebase page that loads the current markdown and provides the raw source link.
- `styles.css`: page-specific layout while preserving the existing homepage/video dimensions.
- `cloudflare/adaptive-music-intelligence-worker.js`: server-side provider adapter skeleton for YouTube search/validation and future Gracenote, Cyanite and Musixmatch calls.

## Future Worker Shape

```json
{
  "checkin": "I am curious and a little tired",
  "environment_context": {
    "local_time": "7:07pm",
    "location_label": "Sydney time",
    "location_precision": "none",
    "weather_condition": "Clear",
    "temperature_celsius": 17,
    "context_role": "adaptive_environment_only"
  },
  "approved_artist_roster": ["artist ids from Universal Mind CMS"],
  "max_candidates": 12
}
```

The worker should own all API keys, cache metadata search results, keep lyrics snippets server-side unless licensed for display, and return only the fields required by the client.

Current sandbox flags:

- `?liveInference=1`: call the deployed Citizen Needs worker from local preview.
- The page calls the Adaptive Music Intelligence worker by default when an endpoint is configured.
- `?mockMusic=1`: bypass the Music Intelligence worker and use local catalogue scoring only.
- `?forceLiveVideo=1`: try live YouTube embeds for unverified candidates during manual debugging.
- `?verify=1`: force the local prototype frame for visual QA.
