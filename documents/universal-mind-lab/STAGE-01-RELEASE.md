# Stage 01 — landscape and pavilion placeholders

Date: 2 November 2026.
Proof: https://staging.universalmind.tv/lab/
Website source commit: `e42e2e9eadaf7f3fc09ceca28bf675b27a73b315`. The following metadata commit records this release without changing deployed website bytes.

## Delivered

- Self-hosted Three.js landscape, warm continuous shell studies, open lawn, forest boundaries and waterway.
- Orbit, scroll/pinch zoom, keyboard camera controls and four guided viewpoints.
- Place descriptions, labels, vision dialog and a 2D site plan with no-JavaScript fallback.
- Updated living brief and all 26 supplied originals, including the membership marketing doodle.

## Verification

- Existing Panthur staging script: `./deploy-panthur-staging.sh lab`. Added a narrowly scoped Lab mode using the existing FTP transport and staging credentials; no hosting change. Only `lab/` website files uploaded.
- Source syntax checks and project preflight passed. All 26 reference SHA-256 hashes passed.
- Desktop 1440×1000 and emulated mobile 390×844 verified in a separate hidden Chromium process with `--mute-audio` set before navigation.
- Camera presets, mouse orbit/zoom, keyboard orbit, labels, dialog open/close, touch controls and horizontal layout checked.
- Reduced-motion rendering, blocked-runtime fallback and no-JavaScript plan verified.
- All six deployed Lab files matched local SHA-256 hashes. No unexpected browser errors or HTTP failures in the final checks.
- Test browser contexts closed after verification. No media playback, application intake or health data collection.
- [Browser report](qa/stage-01-browser.json), [asset integrity](qa/stage-01-http.json), [desktop](qa/stage-01-desktop.png), [mobile](qa/stage-01-mobile.png).

## Scope and next review

This is an early spatial model. Tree forms, site dimensions, terrain and shell proportions are illustrative. The scene is not an engineered construction, acoustic or weather assessment. Physical iPhone testing remains unperformed.

The detailed road train, assembly sequence, interiors, Moroso assets, soft furnishings and transparent tubular listening pylons remain later stages. Artist, architecture, technology, education and clinical partnerships remain proposed.

Production has not been modified. The production GitHub branch remained `a2d6cb9b83340e841c9362cefd5d193aff63ee56` during this staging release.
