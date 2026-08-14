# Research B journey

This B route reuses the canonical check-in at render time. It does not duplicate or modify the canonical check-in, inference or visitor files.

## Route

1. `check-in-research.php` renders `vogue-self-report.html` exactly as it currently exists and changes only its `data-iam-next-page` destination.
2. The completed check-in reaches `research.php?offer=heart-rate`, preserving the selected song handoff.
3. `research.php` reuses the homepage `styles.css`, Chanel background asset, cover fallback, `background-video`, `scene-veil` and brand components.
4. The existing compact `induction-permission` component contains the journey's single consent and wellness disclosure immediately before the deliberate camera action.
5. Accepting the prompt shows a Universal Mind flower and Loading presentation, then invokes Shen’s embedded Web SDK UI on `#mxcanvas`. No replacement measurement engine is rendered.
6. Skipping continues to the selected song without requesting a Shen token or camera permission.
7. Completing the measurement reads the final BPM once, releases the camera, reconciles that ephemeral value through the first-party current-session inference endpoint, discards it and navigates to the canonical `index.html`. No Shen summary or result-options screen is shown.

## Shen configuration

- Official Web SDK package: `@shenai/sdk` 3.1.9.
- SDK UI: visible and unmodified inside a portrait-cropped Universal Mind wrapper.
- SDK theme: unchanged because brand colour customization is locked on Starter.
- Measurement: `MeasurementPreset.CUSTOM` — 30-second heart rate only, with 4-second live heart-rate feedback and the final heart rate shown momentarily before navigation.
- Precision: strict.
- Onboarding: hidden.
- Shen disclaimer, information and summary/result controls: disabled through supported SDK settings so the journey has one Universal Mind disclosure and no duplicate result screen.
- Shen signal-quality and deliberate start/stop controls: enabled.
- Visualization test: Shen's native 3D face mask is disabled and its blood-flow overlay is enabled at SDK initialization. This isolates whether Quick HR / UI V3 exposes the coloured overlay without the white mesh taking precedence.
- Both preload and embedded Shen logo controls are requested through supported SDK settings, including one runtime retry after initialization. If Starter remote configuration still renders SDK-owned branding, the wrapper does not cover or alter it.
- The proprietary canvas and runtime bytes are unchanged.
- The blood-flow overlay is Shen's rPPG visualization, not hyperspectral imaging. No AR glasses layer is included in this version.

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

## Ephemeral result and inference handoff

The Shen camera stream is processed live and is never recorded or stored by this journey. During the supported 30-second measurement, a 4-second heart-rate value may be rendered ephemerally in the Universal Mind wrapper. On completion, the controller reads the final heart-rate value once in memory, releases Shen, starts one same-origin first-party inference reconciliation, shows the final BPM for 2.2 seconds, then clears the displayed value before navigation.

The first-party Worker strips raw BPM before constructing its OpenAI request, reconciles the model's current inference locally as supporting, conflicting or unavailable, and returns no raw BPM. The browser accepts and stores only that privacy-safe current-session inference. No BPM, signal quality, timestamp, provider, photo, video, raw waveform, heartbeat array, HRV, Stress Index, pseudonymous biometric identifier or research record is stored, logged, placed in a URL or sent to ordinary analytics. Earlier prototype keys are removed if present.

Heart Rate never directly selects or writes a song, room, `band_intent`, `carrier_intent` or DSP value. Self-report and time, weather and approximate location remain the inference authority across Horizons 1, 2 and 3. Missing, declined, invalid or failed Heart Rate reconciliation remains safe and non-blocking.
