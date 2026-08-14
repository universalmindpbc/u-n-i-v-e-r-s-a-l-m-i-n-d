# Research B journey

This B route reuses the canonical check-in at render time. It does not duplicate or modify the canonical check-in, inference or visitor files.

## Route

1. `check-in-research.php` renders `vogue-self-report.html` exactly as it currently exists and changes only its `data-iam-next-page` destination.
2. The completed check-in reaches `research.php?offer=heart-rate`, preserving the selected song handoff.
3. `research.php` reuses the homepage `styles.css`, Chanel background asset, cover fallback, `background-video`, `scene-veil` and brand components.
4. The existing compact `induction-permission` component contains the journey's single consent and wellness disclosure immediately before the deliberate camera action.
5. Accepting the prompt shows a Universal Mind flower and Loading presentation, then invokes Shen’s embedded Web SDK UI on `#mxcanvas`. No replacement measurement engine is rendered.
6. Skipping continues to the selected song without requesting a Shen token or camera permission.
7. Completing the measurement reads the final BPM once, releases the camera, holds the Universal Mind flower/result for 2.2 seconds, submits one bounded first-party handoff, discards the value and navigates immediately to the canonical `index.html`. No Shen summary, duplicate loading phase or result-options screen is shown.

## Shen configuration

- Official Web SDK package: `@shenai/sdk` 3.1.9.
- SDK UI: visible and unmodified inside a portrait-cropped Universal Mind wrapper.
- SDK theme: unchanged because brand colour customization is locked on Starter.
- Measurement: `MeasurementPreset.QUICK_HR_MODE` — Shen's supported 10-second heart-rate-only preset. The active SDK preset is verified after initialization; an unexpected preset fails closed instead of beginning a longer scan.
- Precision: strict.
- Onboarding: hidden.
- Shen disclaimer, information and summary/result controls: disabled through supported SDK settings so the journey has one Universal Mind disclosure and no duplicate result screen.
- Shen signal-quality and deliberate start/stop controls: enabled.
- Visualization: Shen's native 3D face map and blood-flow overlay are both enabled at SDK initialization. The face map remains the visible alignment and signal-quality layer even when Starter / Quick HR does not expose a coloured blood-flow rendering.
- Both preload and embedded Shen logo controls are requested through supported SDK settings, including one runtime retry after initialization. If Starter remote configuration still renders SDK-owned branding, the wrapper does not cover or alter it.
- The proprietary canvas and runtime bytes are unchanged.
- The blood-flow overlay is Shen's rPPG visualization, not hyperspectral imaging.
- A fixed-colour Universal Mind glasses layer sits above the Shen canvas without intercepting camera controls. Its coordinate plane is the upper 76% Shen V3 camera preview rather than the full square canvas/results area. It uses Shen's transient normalized face box at the upper-face eye line when available and a centred eye-line fallback otherwise; its geometry exists only in the live DOM and is cleared with the camera. It does not open a second camera stream, store facial geometry, import a DeepAR runtime/effect or contain any BPM/HR-band colour mapping. The DeepAR Bright Glasses project is the approved visual reference; a domain-bound DeepAR licence is still required before its proprietary effect can replace this task-owned vector rendition.

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

## Ephemeral result and homepage handoff

The Shen camera stream is processed live and is never recorded or stored by this journey. During the supported Quick HR measurement, a 4-second heart-rate value may be rendered ephemerally in the Universal Mind wrapper. On completion, the controller reads the final heart-rate value once in memory, releases Shen, shows the final BPM for exactly 2.2 seconds, then posts it with the current check-in to `api/heart-check-handoff.php`. The client waits at most 1.5 seconds for exact HTTP 202 JSON `{ "accepted": true }`, clears the value and navigates immediately. Timeout, network, malformed or unsafe responses degrade to the normal homepage pipeline without Heart Rate.

The first-party endpoint sets a single-use, short-lived opaque `Secure; HttpOnly; SameSite=Strict` cookie and never returns an id or raw BPM to JavaScript. The existing homepage pending-check-in pipeline remains canonical and is the journey's only `Tuning your experience` phase. Its first-party Worker consumes the opaque handoff, strips raw BPM before constructing its OpenAI request, and returns no raw BPM. No BPM, signal quality, timestamp, provider, photo, video, raw waveform, heartbeat array, HRV, Stress Index, pseudonymous biometric identifier or research record is stored in the browser, logged, placed in a URL or sent to ordinary analytics. Earlier prototype keys are removed if present.

Heart Rate never directly selects or writes a song, room, `band_intent`, `carrier_intent` or DSP value. Self-report and time, weather and approximate location remain the inference authority across Horizons 1, 2 and 3. Missing, declined, invalid or failed Heart Rate reconciliation remains safe and non-blocking.
