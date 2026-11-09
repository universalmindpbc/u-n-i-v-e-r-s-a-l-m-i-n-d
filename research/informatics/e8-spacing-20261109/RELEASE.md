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

Source commit: `34ceae9303228ff8ad2cc103a7c11eb707d9c8c9`.

Staging URL: https://staging.universalmind.tv/informatics/geometry/?record=fibonacci-m9-p24&record-mode=research#e8

The existing Panthur staging transport uploaded all 56 changed assets. Live browser checks repeated the 72 layer/view combinations at desktop and both phone widths, with no label collisions or horizontal overflow. All 25 checked live source and download files matched the candidate bytes, including both complete formats and the E8 JSON/CSV files. Hosting-inserted analytics markup was removed solely for HTML checksum comparison, as recorded by the existing checker.

Both complete formats reconstruct all 1,196 sources. Dataset version: `5569ba5f70d3ea8ffcf400695531fada70146fb73cc3ae52709b5145d2a6e588`.

Production has not been modified. Its recorded main reference remains `02b6f47345e428021dcae8fd4a798ecdfb03969b`.
