# Lab destination and readability staging verification

Date: 3 November 2026

Staging: https://staging.universalmind.tv/lab/

Exact website source: `f67e917d2` (includes the scoped destination changes in `87be6ae81`). Published with the existing `./deploy-panthur-staging.sh lab` workflow.

## Final treatment

- Unboxed dark headline and artist logos above the forest in the daytime overview; light lettering at night.
- Camera framing places the forest beneath the typography and retains the scene geometry. No added landscape mask, text shadow or outline.
- Original lightning bolt position and dimensions restored.
- Opening, replay and final orbit share the same responsive overview framing.
- International Food Fair, Mobile music making and Apple listening pods are the destination names. Food flags, closer food/music views, female clinicians, and the punctuation correction remain included.

## Verification

- JavaScript syntax and the existing Lab stage check passed; 49 original reference hashes and seven destinations verified.
- Live staging layout checked at 1440 × 1000, 393 × 647, 320 × 568 and 844 × 390.
- No horizontal overflow or page errors at any checked size.
- Final overview, orbit endpoint and replay camera positions match on every checked viewport.
- Headline background is transparent; no headline shadow or added vignette pseudo-element is present. Artist ink uses the intended dark daytime treatment. Desktop lightning bolt remains left 300 px, top −5 px, width 82 px and height 150 px.
- Food, mobile music, listening and support navigation opens the correct title and destination. Both clinicians retain the requested long coats, hair, heels and stethoscopes.
- All six changed website assets fetched over HTTPS match local SHA-256 values; see `source-hashes.json`.
- Screenshots visually reviewed for desktop day/night and mobile day. Representative destination screenshots retained alongside the automated readout in `verification.json`.

## Test boundary

Browser checks used a separate headless Chromium process with `--mute-audio` confirmed before navigation. Native fullscreen was disabled. Media playback and HLS were stubbed for deterministic scene/layout checks; this run does not claim playback or subjective sound verification. A test-only scene readout accelerated the sequence. All automated contexts and the browser process closed after verification.

Production was not modified.
