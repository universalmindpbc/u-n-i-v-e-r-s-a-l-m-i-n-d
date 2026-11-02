# Lab landing and five-stage release — 2 November 2026

Staging page: https://staging.universalmind.tv/lab/

Website source: `edc992047a27ee24c33b7f1580ea76df760dabf6` (includes the main implementation at `3fdc610ec`). Published with the existing `./deploy-panthur-staging.sh lab` Panthur workflow. The completed deployment metadata and verification are recorded in the following staging commit. Production was not modified.

## Delivered

- Fibonacci matrix-rain landing, approved identity and tagline, Explore gesture for music, a 7% video overlay and fullscreen request.
- Five selectable construction stages and replay: Site, Arrival, Assembly, Fit-out, Open.
- A first 100-position layout test: 96 seats and four mobility spaces under the 22.6 × 18.4 m vault; service-edge Linfox road train and illustrative unloading/scaffold.
- Tiled four-contact vault, matching fluid satellite shells and a distinct rainbow metallic play bridge with its own camera view. The adjacent sculpture is clear of the bridge approach.
- Reference-based Tropicália chairs, day beds, cushions and independently supported hanging seats. Moroso’s official model download returned HTTP403; manufacturer CAD was not imported.
- Four tubular glass listening pylons, curved Apple Music interface studies and AKG K812 representations.
- A stage video wall using the same media timeline, four line-array positions, workshop devices, cooking counter, sculpture, projected colour patterns, laser-like light fans, rain shelter and guided site tour.
- Brief v0.8 and revised five-step progress. The complete SIX / Apple Watch MVP direction remains intact.

## Verification

- Local source checks, JavaScript syntax, unique DOM IDs, interface controls and all 27 archived reference hashes passed.
- The reattached playground image is byte-identical to archived R21.
- Live staging WebGL, six camera presets, orbit/zoom, keyboard navigation, proposal dialog, plan view, reduced-motion behavior and no-JavaScript/blocked-WebGL fallbacks passed.
- All five construction stages, timed sequence progression/cancellation, rain shelter, layout display and guided-tour cancellation passed.
- Layouts checked at 1440 × 1000, 1920 × 1080, 390 × 844 and 844 × 390. Dedicated hidden Chromium only, with process-level `--mute-audio` confirmed before navigation.
- Fullscreen standard/prefixed API states, external exit, denial and unsupported behavior were tested with substitutes. Native browser/macOS fullscreen was never invoked. No physical iPhone test was performed.
- All 18 versioned staging assets matched the local source SHA-256 hashes. An older unversioned CSS cache entry appeared during the first hash check; verification was corrected to request the versioned asset URLs used by the page. The entry and module URLs carry the release version.
- Real Cloudflare HLS playback passed on staging: no pre-entry media request, Explore starts decoding, default 7% overlay, 33% adjustment, independent TV visibility, volume, motion, pause and end-to-start looping. The first adaptive rendition observed was 426 × 240; the preserved source is 1920 × 1080. This check confirms playback, not sustained 1080p delivery or subjective audio quality.
- The reviewed desktop overview reports 204 rendering calls and 423,322 triangles. This is a scene count, not a hardware performance benchmark.
- No unexpected browser errors or failed page assets in the completed UI run. Automated playback was paused and all QA browser processes closed.

Reports: [browser](qa/landing-five-stages/lab-browser.json), [HTTP hashes](qa/landing-five-stages/lab-http.json), [media](qa/landing-five-stages/media/media-browser.json). A compact selection of reviewed screenshots is retained in that folder.

## Remaining visual and operating work

This iteration is a detailed architectural concept model. Photorealistic vegetation, people, close-range materials, artist-led activity detail, synchronised wristbands and the live SIX integration remain work. Occupancy, acoustics, play/access engineering, weather limits, construction and partner delivery need their own design process. The selectable assembly frames are illustrative; no masonry folding mechanism is claimed.
