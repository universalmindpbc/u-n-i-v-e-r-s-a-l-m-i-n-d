# E8 spacing — 9 November 2026

Requested change: use the clean white sketch as the layout reference and give the central geometry, Fibonacci labels and E8 roots distinct space.

## Layout

- The figure uses the full content width, up to 1,040 CSS pixels, with a natural aspect ratio independent of the remaining viewport height.
- The symbolic composition separates the inset Gamma star and 8 / 6 / 3 guide, the Alpha circle and its 24 labels, and the outer 240-root halo.
- Beta remains optional. Its labels sit between the octagon and Alpha circle; its native nine-position angular grid and doubling path are retained.
- Exact 24- and 30-step projections retain their original normalized coordinates. The M9 reference occupies a separate panel, beside the projection on wide screens and below it on narrow screens.
- Explanatory content sits below the drawing. The dark drawing surface reduces interference from the surrounding background.
- The exported layout metadata documents independent display scales and the inset Gamma copy. All root data, matrices, projection bases, orbit membership, coordinates and sequence values are unchanged.

## Verification

- Candidate browser: all 8 Alpha/Beta/Gamma toggle combinations across all 3 views at 1440, 390 and 320 pixels; all 240 roots retained; all 24 Alpha labels visible without collisions; separate panel bounds; Gamma angular alignment; native Beta cycle; slider, guide and navigation checks.
- Screenshots inspected at desktop and phone sizes, including all layers enabled at 320 pixels.
- Dedicated headless Chromium launched with process-level audio muted; media playback and media requests blocked; every browser context closed. No native fullscreen.
- Exact geometry and dedicated CSV round trips reproduced by the geometry generator; source comparison confirms unchanged mathematical data.

## Release status

Staging deployment and live verification pending. Production remains untouched.
