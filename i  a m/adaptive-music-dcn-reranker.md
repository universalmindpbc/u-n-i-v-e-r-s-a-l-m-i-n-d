# Adaptive Music DCN Re-ranker v0.1

This is the passive-feedback layer for the Universal Mind adaptive music selector.
It is deliberately soft touch: the v4.44 human-needs radar and approved song
tensor remain primary, while engagement, survey and emoji signals gently re-rank
close candidates.

## Role

The selector first scores each approved track by citizen-needs fit, trajectory,
safety, context, presentation and semantic fit. The DCN re-ranker then blends in
crossed engagement features with a maximum influence of 18 percent when strong
signals are present.

This keeps the system mental-health-first:

- passive behaviour can improve recommendations, but cannot override hard safety
  vetoes;
- survey input is voluntary and small;
- low-click dwell can be positive because a calm, watched, non-frantic session is
  often better than high-click churn;
- emoji use is treated as warmth, identity, belonging or regulation signal, not
  diagnosis.

## Accepted Input

Pass an `engagement_signals` object beside the `v444_payload`, or include any of
these objects inside the payload: `engagement_signals`, `passive_signals`,
`analytics`, `web_analytics`, `ga4`, `survey_feedback`, `emoji_engagement`.

Example:

```json
{
  "v444_payload": {
    "top_needs_used": ["Recovery", "Calm", "Psychological Safety"],
    "environment_context": {
      "time_of_day": "evening"
    }
  },
  "engagement_signals": {
    "video_completion_ratio": 0.92,
    "extended_session_listen_minutes": 12,
    "dwell_seconds": 210,
    "click_count": 0,
    "emoji_engagement": {
      "heart": 3,
      "peace_dove": 2,
      "aboriginal_flag": 1
    },
    "survey_feedback": {
      "felt_seen": 0.8,
      "settled": 0.7,
      "too_intense": 0
    }
  }
}
```

## Crossed Features

- `video_completion`: watched most or all of the music video.
- `extended_session_listening`: listened to an eligible Parties, Radio or Videos continuation. Legacy radio signal names remain accepted as input aliases.
- `soft_dwell`: time on page crossed with low click count.
- `returning_interest`: repeated sessions or return visits.
- `emoji_need_fit`: emoji interactions crossed with the candidate song tensor.
- `survey_fit`: voluntary light feedback such as felt seen, settled, helped or
  too intense.
- `video_x_soft_dwell`: video completion crossed with calm dwell.
- `extended_session_x_room_continuity`: extended-session listening crossed with a valid music-room continuation.
- `emoji_x_track_needs`: emoji warmth crossed with candidate needs.
- `music_room_return_fit`: repeat/video interest crossed with an assigned music room, reduced by friction. Music-room identity never acts as an activation ladder.

## Emoji Affinities

- `heart`: Love, Connection, Trust, Belonging.
- `trans_flag`: Belonging, Psychological Safety, Self-Actualisation, Trust.
- `aboriginal_flag`: Belonging, Connection, Self-Transcendence, Purpose.
- `peace_dove`: Calm, Hope, Recovery, Psychological Safety.
- `white_dove`: Calm, Hope, Recovery, Gratitude.
- `army_medallion`: Purpose, Trust, Motivation, Self-Actualisation.

## CLI

```bash
python3 "i  a m/selector_core.py" --stdin < payload.json
python3 "i  a m/selector_core.py" --engagement engagement.json '{"top_needs_used":["Calm","Recovery"]}'
```

The response audit includes `reranker.version`, `reranker.signal_strength`,
`reranker.blend` and `selector_score_parts`.
