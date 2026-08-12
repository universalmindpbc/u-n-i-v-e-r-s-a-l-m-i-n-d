# Research B journey

This B route reuses the canonical check-in at render time. It does not duplicate or modify the canonical check-in, inference or visitor files.

## Route

1. `check-in-research.php` renders `vogue-self-report.html` exactly as it currently exists and changes only its `data-iam-next-page` destination.
2. The completed check-in reaches `research.php?offer=heart-rate`, preserving the existing adaptive track-selection parameters.
3. `research.php` reuses the homepage `styles.css`, Chanel background asset, cover fallback, `background-video`, `scene-veil` and brand components.
4. The existing compact `induction-permission` component asks only: “Do you want to measure your heart rate?”
5. Accepting the prompt invokes Shen’s embedded Web SDK UI on `#mxcanvas`. No Universal Mind replacement scanner is rendered.
6. Skipping or completing Shen continues to the canonical `index.html` with the adaptive track-selection parameters intact.

## Shen configuration

- Official Web SDK package: `@shenai/sdk` 3.1.9.
- SDK UI: visible and unmodified.
- SDK theme: unchanged because brand colour customization is locked on Starter.
- Measurement: `MeasurementPreset.QUICK_HR_MODE` — 10-second heart rate only.
- Precision: strict.
- Onboarding: hidden.
- Shen disclaimer, information, signal-quality, start/stop and result UI: enabled.
- No AR layer in this version.

## Credential boundary

`api/shen-token.php` reads `SHENAI_ADMIN_KEY` from the server environment and requests a single-device, one-measurement token with a 15-minute lifetime from Shen’s Admin API. The permanent credential is never returned to or committed in the browser source.

The environment owner must add `SHENAI_ADMIN_KEY` through the existing protected server-secret process. This source lane does not set it.

## Web SDK package boundary

The proprietary Shen runtime is kept at `research/vendor/shenai-sdk/` and retains Shen’s licence notice. It comes directly from the official `@shenai/sdk@3.1.9` npm package available to the active Universal Mind Starter workspace.

## Browser headers

`research.php` sends the Web SDK’s required isolation headers itself:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Permissions-Policy: camera=(self), microphone=()`

The route must remain a PHP response or receive equivalent server headers if it is later mapped to `/research`.

## Stored result

On a completed measurement, the page stores only the final heart rate, Shen average signal-quality value, timestamp, provider and metric name in session storage under `iam.shenResearch.preHeartRate.v1`. No photo, video, raw waveform, heartbeat array, HRV or stress value is stored.
