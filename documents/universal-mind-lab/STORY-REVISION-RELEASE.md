# Lab opening story and fashion runway — staging release

Date: 2 November 2026.
Proof: https://staging.universalmind.tv/lab/
Committed website source: `371176dd2f39d4930a42153c251733308592a7c5`.
Deployment: existing `./deploy-panthur-staging.sh lab` through Panthur. Only the Lab route was uploaded. Production was not modified by this task.

## Changes

- Exact minimal Informatics landing treatment, original flower/favicon and Launch Full Screen.
- Continuous `universalmind[lab]` event wordmark, uniform tracking, bold mind.
- Automatic arrival, ten-second construction with builders, sequential fit-out, open site, twenty-second daylight hold and gradual night transformation. Replay replaces manual construction stages.
- Refined related satellite shells, sculptural support pavilion and consistent tiled textures. The physical Droneport remains visible beneath the rising geodesic light projection.
- Open dance floor, scattered Tropicália lounge furniture, daybeds/hanging seats, seventy articulated visitors and a roof-profile panoramic video screen.
- Patterned roof projections, towers and wristbands. Media/settings/Replay controls sit at the upper right.
- Supplied Hexeosis animation mixed across the stage screen; silent 540 × 540 derivative, original GIF retained.
- Central fashion runway, eight walking fictional models, six video panels, sculptural pieces and Vogue flag over the Universal Mind flower. Indigenous fashion collaboration recorded as programme direction.
- Brief v0.9 and all 31 supplied references archived with hashes.

## Verification

- Static checks and all 31 original-reference SHA-256 checks pass.
- Live staging: all **27 published files** match committed source hashes.
- Desktop, 1920 × 1080, 390 × 844 portrait and 844 × 390 landscape checks pass. The opening timings, staged visibility, delayed navigation, automatic night transition, Replay, camera views, rain/layout, plan fallback and controls were exercised.
- Standard, prefixed, denied and unsupported fullscreen behavior tested with API doubles. Native fullscreen was never invoked.
- Actual Cloudflare HLS playback, end-of-track looping, overlay at 7%/33%, volume, motion and pause/resume pass. The Hexeosis source decodes at 540 × 540, advances silently and pauses with Motion. Stage and runway media were captured.
- Browser processes launched headless with `--mute-audio` verified before navigation. All automated media was paused and browsers closed afterward. No audible or subjective sound-quality test was performed.
- No unexpected JavaScript/shader errors or failed HTTP responses in the interface checks. Night overview: 455 draws, 650,226 triangles.

The media fix selects the existing HLS library where supported, retaining native HLS as fallback. This resolves a Chromium native-HLS parsing failure observed at loop restart. Cross-origin video loading is explicit for video textures.

Evidence: `qa/story-revision/lab-browser.json`, `lab-http.json`, `media/media-browser.json` and selected screenshots. The test stream decoded at 1280 × 720; adaptive resolution varies. The original source archive remains 1080p.

## Limits and next visual milestone

This remains a detailed concept environment. Photorealistic people, vegetation, materials and final lighting remain ahead. Physical iPhone playback/fullscreen was not tested. Architectural, acoustic, production and play engineering remain design work. Named collaborations and live-performance clips remain proposed; the current artist video is Neverender. Apple Watch/SIX integration remains in the MVP brief and is not connected in this browser model.
