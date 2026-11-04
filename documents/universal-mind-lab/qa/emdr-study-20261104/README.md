# EMDR character experiment and footer — staging verification

Verified 4 November 2026 at https://staging.universalmind.tv/lab/.

Source commit: `128d619bb`.
Base: `f13c21a5d00f14b4f249986ea78b633809526a75`.
Release transport: existing `./deploy-panthur-staging.sh lab` only.
Production was not modified.

## Scope

- EMDR alone now uses ten textured, skinned figures with authored breathing, head and gesture movement: nine youth and one facilitator, mixed relaxed poses, sportswear, no held phones and no long dresses. Other festival characters remain unchanged.
- The latest clarified 1672 × 941 PNG fills the photo viewer edge to edge, preserving image proportions with cropping. Pan, wheel, pinch, zoom, reset and both entry points remain available. The existing video continues above it at 7%.
- Initiative credit, proposed-partner notice and research call to action are each 20% larger at their corresponding breakpoints.
- The impact ticker dissolves between Dissolving Stigma, Transforming Access, Free to Participate and Transforming Referral Pathways. Reduced-motion mode displays a static line.
- The atelier sign and navigation spelling are corrected.

## Checks

- `tools/check-lab-stage.mjs`: passed, including regular-polyhedron topology, edge lengths, circumradii, placed dimensions, 49 original reference hashes and story continuity.
- Module syntax and `git diff --check`: passed.
- `verify.mjs --live`: passed at 1440 × 900 and 393 × 780. Exact HTTP source comparisons cover HTML, styles, scene modules, ten GLBs, the new PNG, Three loaders, geometry, story and orbit. Cloudflare analytics insertion is excluded from the HTML comparison.
- All ten models loaded, reporting 114 skinned meshes and zero loader errors. Head-bone quaternions changed during animation. All seven room populations and existing equipment assertions passed.
- Portal navigation, close-view label and lineup suppression, mobile toolbar suppression, no horizontal overflow, and the continuous camera-circuit entry passed.
- Both preview entry points, image coverage of all four viewport edges, same video element, 7% blend, pan, wheel zoom, reset, Escape/focus restoration and synthetic touch pinch passed.
- Desktop footer sizes: initiative 12 px, proposed notice 9.6 px, research CTA 10.8 px. Portrait sizes: initiative 10.8 px, proposed notice 10.2 px, research CTA 12 px. Ticker text and reduced-motion behavior passed.
- `media-check.mjs`: actual HLS playback advanced from 1.74 s / 45 decoded frames before opening, to 6.56 s / 157 frames in the preview, to 11.09 s / 269 frames after closing. The same player and source remained active at 7%; one unmuted HTML media element, no duplicate audio source and no page errors.
- Desktop EMDR, portrait EMDR/footer, day/night views and full-viewport preview screenshots were visually inspected. Selected captures are retained.

All browser checks ran in separate headless Chromium processes with `--mute-audio` verified before navigation. Native fullscreen APIs were disabled. Media was paused and every test context closed after verification. Physical iPhone Safari, device GPU performance and subjective sound quality were not tested.

## Limits of this experiment

This is a reviewable fidelity experiment, not a finished photorealistic scene. Seated poses, clothing, headset fit and facial detail still need art direction against the photo. The ten models add approximately 35 MB of lazily requested assets. Textured figures are intentionally confined to EMDR until visual and device-performance review. Generator, source pin and asset-license provenance are in `../../character-study/`.

`live/verification.json` contains source hashes and assertions. `live/media-verification.json` records actual-media continuity. These checks establish browser behavior, not therapeutic outcomes.
