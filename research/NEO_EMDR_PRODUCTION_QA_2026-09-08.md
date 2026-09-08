# Neo production QA — 8 September 2026

## Release scope

Ben explicitly approved production publication of the Neo experience, with the tooltip changed to `Enter the matrix.` and no further proofing round. The source deployed was `0e0f6cd3c3bb623fe41a0dd36ce60fa2ec6a7649`, containing the exact HTML correction `9b524a6`. No other website source was changed after approval.

Production URL: https://universalmind.tv/vogue/iam/index.html

The existing Panthur workflow uploaded seven changed non-video files. The protected owner runtime state remained unchanged, and the deployment guard confirmed that production Mantra state matched the staging reference before and after deployment.

## Results

The following checks passed at 1440 × 900, 1024 × 768 and 390 × 844 in separate headless Chromium contexts. The actual Chromium command line included `--mute-audio` before navigation. All automated media was paused and browser contexts closed afterward.

- Ordinary no-check-in random selection; no fixed track parameters.
- Neutral EMDR entry; Neo only starts after manual selection.
- Full-screen transparent rain with visible glyphs and advancing frames.
- The exact tooltip `Enter the matrix.` appears on hover.
- Current programme source remains unchanged on Neo selection and playback advances.
- All visible controls fit the viewport; Neo has no GIF/Fashion mix controls.
- Manual intensity changes falling speed.
- React receives rhythmic pulses and measurably modulates rain brightness.
- Escape, wallet reopening and the direct power control preserve the selected preset.
- Power off stops Neo rendering while the programme continues; power on restores it.
- Switching through Stella and CB stops Neo; returning from CB restores its full-screen overlay.
- Reduced-motion preference produces stationary rain.
- Zero page errors, native fullscreen requests or capture requests.

## QA finding: Automate does not modulate Neo movement

The Automate button changes its pressed state, but Neo keeps the same intensity and speed. Across each viewport, 16 samples over approximately four seconds with Automate enabled retained intensity `0.5` and speed `0.7`. Source inspection confirms that the Neo render path receives time, intensity, rhythm and React state, but no Automate state. This is a functional omission in the already approved Neo implementation. Manual intensity and React work.

No movement fix was added to this tooltip-only production release. This finding is disclosed in the release handoff and must not be represented as a passing automation-behaviour check.

| Viewport | Tooltip | Transparent pixels | React opacity range | Page errors |
| --- | --- | --- | --- | --- |
| 1440 × 900 | Enter the matrix. | 92.6% | 0.9888–1.0000 | 0 |
| 1024 × 768 | Enter the matrix. | 92.0% | 0.9799–1.0000 | 0 |
| 390 × 844 | Enter the matrix. | 93.4% | 0.9705–1.0000 | 0 |

## Production served-byte identity

All seven changed website files returned HTTP 200 and matched the approved local source bytes.

| File | SHA-256 |
| --- | --- |
| `emdr-neo.js` | `f9d8b9847fa2f6403da6793a88deea1854d0a3c1172375eb410bc874623a32db` |
| `emdr-shader.js` | `c773756ec8a03a79baf5bae152cbb8a0fb767e1c7cce38f19414772d9e419704` |
| `adaptive-environment-television.js` | `387cc6c8bd6d43b184ea0063eed3151764c2d31c22f169fd5915d57c58a9cf61` |
| `adaptive-environment-television.css` | `7c5bc791fc7209a2411f58ccc7d0cb9a97244b2e27cef86dcccafeeda1f307cb` |
| `index.html` | `81d8cc196e5e94897f3b9956e1664579b319cbe8a12e350e2f64e2d37c9cf7ad` |
| `index-alt.html` | `30e72b4bb36d58445f69bdba48e74b0ad654a0d8895354008cceed7df049f243` |
| `adaptive-environment-television.html` | `30c947095d6e42f59ead8438becb88a5d889ab32cf9487089cd883856d88339f` |
