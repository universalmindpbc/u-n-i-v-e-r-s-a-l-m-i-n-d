# Lab interface and media staging release

Date: 2 November 2026.
Proof: https://staging.universalmind.tv/lab/
Exact deployed website source: `a0eb84f5315b3ff8fc3df40c64703f7180cf23da`. This record and the deployment manifest are metadata only.

## Changes

- Clear identity hierarchy: brand and topics at the top, large tagline, membership above navigation and initiative credit beneath it.
- Whole-page fullscreen control, including unsupported-browser and denied-request handling.
- Physical triangular area flags with the visible Universal Mind flower behind monochrome partner marks; illustrative support booth, staff figure and MSF vehicle.
- Five camera presets and non-overlapping scene labels.
- Justice — Neverender archived at 1920×1080 and uploaded to Cloudflare Stream, UID `9f1ed3b5a38f52bfd008d2152d3884de`.
- Visitor-initiated music, looping, adjustable volume, optional TV overlay initially at 22%, a 0–70% blend control and separate scene motion.
- Initial Day/Night pavilion lighting preview.
- Brief v0.7, 27 preserved user references, production sources, and the full attributed SIX inference explanation.

## Verified

The existing `./deploy-panthur-staging.sh lab` workflow published committed files through Panthur. All 14 deployed Lab files matched the candidate SHA-256 hashes. Static preflight, module syntax and all 27 original-reference hashes passed.

Hidden, process-muted Chromium checks covered desktop 1440×1000, wide 1920×1080, mobile 390×844 and landscape 844×390; camera controls, labels, dialog, plan, keyboard navigation and runtime/no-JavaScript fallback. Fullscreen API state was tested with standard, prefixed, denied, external-exit and unsupported doubles; no native fullscreen was invoked.

A separate Chromium process with `--mute-audio` confirmed no initial autoplay or stream request; real Cloudflare HLS decoding and time advancement after Music; video blending at 22% and 33%; independent volume and motion; music continuity while TV is hidden; pause; and actual looping across the end boundary. All automated media was paused and the browser processes closed afterward.

The source file was probed as H.264 1920×1080 with AAC stereo audio, approximately 200 seconds. The Cloudflare master playlist contains a 1920×1080 rendition. Browser playback is adaptive and initially selected a smaller rendition during QA.

[Interface report](qa/fullscreen-copy/fullscreen-copy-browser.json) · [Asset hashes](qa/fullscreen-copy/fullscreen-copy-http.json) · [Media report](qa/media/media-browser.json)

## Limits and next step

The architecture and vegetation remain the spatial prototype. The scene animation uses gentle procedural cycles, not audio beat detection. Night mode is a lighting direction preview; the full concert stage, line arrays, projection mapping, lasers and wristbands are not modelled yet. Physical phone testing, native fullscreen and subjective sound quality were not tested. No participant biometric data is collected and the Watch integration is not connected. The responsive SIX loop remains an MVP requirement.

[Five-step progress](PROGRESS.md) records the precise state. The next reviewable spatial deliverable is the refined layout/scale pass followed by the road train and arrival/assembly sequence.

Production has not been modified.
