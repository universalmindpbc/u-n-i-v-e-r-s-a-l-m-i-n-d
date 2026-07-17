# Universal Mind First-Party Analytics v0.1

This replaces third-party analytics for the adaptive music prototype. Events are
stored in the browser under `localStorage.iamFirstPartyAnalyticsEvents` and are
summarised into `engagement_signals` for the DCN re-ranker.

## Principles

- No Google Analytics or third-party analytics script.
- No raw self-report, check-in text, names, email, phone or message content.
- GA-style event names where useful, but first-party storage and first-party
  future dashboarding.
- The event log is for adaptive environment quality, not engagement maximisation.

## Core Events

- `page_view`: page opened.
- `engagement_tick`: page hidden or backgrounded, with dwell seconds.
- `scroll`: first reach of 25, 50, 75 or 90 percent page depth.
- `click`: button/link interaction without visible text content.
- `music_recommendation`: adaptive music recommendation generated.
- `video_start`: hero video begins.
- `video_progress`: hero video crosses 10, 25, 50 or 75 percent.
- `video_complete`: hero video reaches the end.
- `video_skip`: citizen moves to radio before completion.
- `video_error`: local, YouTube or fallback player error.
- `radio_start`: streaming radio handoff begins.
- `radio_progress`: streaming radio listening heartbeat.
- `emoji_reaction`: future emoji layer can call this directly.

## Re-ranker Summary

`window.IAMFirstPartyAnalytics.summarizeForReranker(trackId)` returns:

```json
{
  "video_completion_ratio": 0.75,
  "radio_listen_seconds": 90,
  "dwell_seconds": 180,
  "click_count": 2,
  "skip_count": 0,
  "return_visits": 1,
  "emoji_engagement": {
    "heart": 2,
    "peace_dove": 1
  }
}
```

The adaptive music page also writes the latest summary into
`iamLatestMusicVideoRecommendation.engagement_signals`.

## Future Dashboard

The dashboard can start as a local/private HTML page that reads
`iamFirstPartyAnalyticsEvents`, then later move to a first-party endpoint once
we want cross-device, longitudinal, consented analytics.
