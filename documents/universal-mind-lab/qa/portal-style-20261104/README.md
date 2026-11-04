# Portal styling and realistic preview — staging verification

Verified 4 November 2026 at https://staging.universalmind.tv/lab/.

Source commit: `c7179ba21`.
Base: `eda00ff3107b7d9f72680a24d6fb08d5db9a98d6`.
Release transport: existing `./deploy-panthur-staging.sh lab` only.
Production was not modified.

## Scope

Portal interiors now use irregular mixed seating, floor textiles, beanbags and softer figures with varied hair and dresses. No participant holds a phone. Tables and equipment are specific to each activity; Sound includes a modular synthesizer and Atellier includes dress forms and garments. The coloured grass flower has stronger day/night definition. Portal and About each open the supplied photo in a pan/zoom viewer with the existing video continuing above it at 7%.

Mathematical frames, room placement, capacity, sign wording and the separate festival Mobile music making scene remain unchanged.

## Checks

- `tools/check-lab-stage.mjs`: passed, including regular-polyhedron topology, edge lengths, circumradii, placed dimensions, original reference hashes and story continuity.
- `verify.mjs --live`: passed at 1440 × 900 and 393 × 780. Exact HTTP source comparisons cover the HTML, styles, scene, new modules, photo, geometry, story and orbit. Cloudflare analytics insertion is excluded from the HTML comparison.
- All seven rooms: navigation, nine participants plus one facilitator, varied poses, no held phones, modular synth, dress forms and predominantly female Sex-ed/Atellier groups checked. Screenshots inspected for clothing, furniture, equipment and day/night flower visibility.
- Portal card and About preview entry, same media node/source count, 7% blend, zoom controls, mouse pan, wheel zoom, fit, Escape and focus restoration passed. Synthetic two-pointer pinch reached 200% in the portrait viewport.
- Close-view labels/lineup remain hidden. Mobile has no desktop navigation strip or horizontal overflow. Main pavilion navigation and circuit-entry continuity passed.
- `media-check.mjs`: real HLS playback advanced from 1.24 s / 33 decoded frames before opening, to 5.95 s / 142 frames in the preview, to 9.25 s / 223 frames after closing. The same player remained active at 7%, with one unmuted media element and no page errors. No duplicate audio source was created.

Every browser ran as a separate headless Chromium process with verified `--mute-audio` before navigation. Native fullscreen APIs were disabled for QA. Media was paused and contexts closed after each run. Physical iPhone Safari and subjective sound quality were not tested.

`live/verification.json` contains source hashes and room assertions; `live/media-verification.json` contains the real-media observations. Selected screenshots are retained; redundant generated captures are omitted.

The preview uses the exact 1182 × 665 supplied JPEG. Zoom reveals that source image, without adding detail or changing its content.
