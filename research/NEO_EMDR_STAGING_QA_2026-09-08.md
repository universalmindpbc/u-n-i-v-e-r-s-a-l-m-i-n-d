# Neo EMDR staging verification — 8 September 2026

- Source candidate: `ebf285e` (includes `3a5f6bd`).
- Proof route: https://staging.universalmind.tv/vogue/iam/index.html
- Tooltip: `enter the matrix`.
- Deployment: existing `./deploy-panthur-staging.sh all-changed`; all mandatory preflights passed; protected owner runtime state verified unchanged.
- Scope: transparent landing-page glyph rain over the current full-screen programme; Neo preset, intensity, React and Automate integration; mobile and tablet control layout.
- Production was not modified.

## Browser evidence

A separate headless Playwright Chromium process was launched with `--mute-audio`. Its actual launch arguments were verified through CDP before navigation. Native fullscreen and media capture were blocked; all automated media was paused and all contexts closed after verification.

Each fresh visit used the ordinary no-check-in random selection, without a fixed track parameter. Room presentation entry bypassed native fullscreen for QA; the selected programme was played in the muted process. The existing wallet controls were exercised to reach EMDR and select Neo.

| Viewport | Tooltip visible | Transparent canvas area | Page errors | Fullscreen calls | Capture calls |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | enter the matrix | 94.0% | 0 | 0 | 0 |
| 1024 × 768 | enter the matrix | 92.8% | 0 | 0 | 0 |
| 390 × 844 | enter the matrix | 93.9% | 0 | 0 | 0 |

Verified at each viewport:

- Neutral EMDR entry remains inactive until a preset is chosen.
- Neo canvas fills the viewport, contains visible glyphs and retains transparent pixels.
- Current programme source is unchanged on Neo selection; playback time advances and the video remains full screen.
- Neo has no unrelated GIF/Fashion mix controls; every visible control fits in the viewport.
- Manual intensity changes the falling speed; React and Automate controls activate.
- Escape and wallet reopening preserve Neo.
- Off stops rendering while programme playback continues; On restores Neo.
- Stella and CB switching deactivates Neo; returning from CB restores full-screen presentation.
- Reduced-motion preference produces stationary rain.

## Served source identity

All seven changed website files returned HTTP 200 and matched the local committed bytes through the browser request context.

| File | SHA-256 |
| --- | --- |
| `emdr-neo.js` | `f9d8b9847fa2f6403da6793a88deea1854d0a3c1172375eb410bc874623a32db` |
| `emdr-shader.js` | `c773756ec8a03a79baf5bae152cbb8a0fb767e1c7cce38f19414772d9e419704` |
| `adaptive-environment-television.js` | `387cc6c8bd6d43b184ea0063eed3151764c2d31c22f169fd5915d57c58a9cf61` |
| `adaptive-environment-television.css` | `7c5bc791fc7209a2411f58ccc7d0cb9a97244b2e27cef86dcccafeeda1f307cb` |
| `index.html` | `a7c19bce1947458f504a0910bf8d81d9e296e6d7ff859b86f510cb92507bbeb1` |
| `index-alt.html` | `cd38da129b419b32a8e995923c06bcfb769c881d53f4542a1c213d8ac7817f5d` |
| `adaptive-environment-television.html` | `30c947095d6e42f59ead8438becb88a5d889ab32cf9487089cd883856d88339f` |
