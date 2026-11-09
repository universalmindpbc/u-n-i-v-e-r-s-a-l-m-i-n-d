# E8 original layout restored — 9 November 2026

Ben rejected the expanded page layout and requested the original arrangement with small gaps inside the drawing.

## Change

- Restored the original E8 CSS exactly from `c40ea1283`, including the sidebar, controls, legend and slider positions.
- Restored the original HTML structure. Removed the full-width canvas, explanatory columns below it, and separate M9 panels.
- Every view is again a single composite drawing with one centre.
- Retained small radial gaps around the inset Gamma star, grey guide, Alpha circle and symbolic root halo. All 24 Alpha labels remain visible.
- Exact projections keep their original coordinates. Label radii occupy gaps between the root rings: 0.674 for the 24-step view and 0.728 for the 30-step view.
- Root marker sizes respond to the drawing radius. Text sizes adapt to the shorter desktop viewport.
- The desktop drawing height accounts for its legend and slider so the drawing and controls fit together. The original mobile full-width drawing and single-column flow remain in place.
- JSON, CSV, bundles, reading pages and complete exports document the corrected layout.

## Verification

- Original CSS byte comparison passed.
- Mathematical root, projection and sequence data match the preceding revision exactly.
- Browser checks cover all 8 layer combinations in all 3 views at 1440 × 950, 1280 × 800, 390 × 844 and 320 × 844.
- Desktop checks require the full figure, toggles and slider to fit inside the iframe viewport, with the sidebar beside the drawing.
- All sizes check 240 roots, 24 labels, label clearance, native Gamma angles, the Beta doubling path, independent guide controls, cycle selection, navigation and horizontal bounds.
- Phone checks retain the original vertical page flow; they do not assert whole-page viewport fit.
- Browser QA uses a dedicated headless Chromium process with audio muted and playback blocked. Headless screenshots intermittently omit unchanged painted regions even while DOM text, opacity and visibility remain correct. A focused three-view check confirms visible labels in every mode. The complete staging-proof-symbolic.png capture verifies the restored page arrangement; some other captures contain partial raster output and are retained as diagnostic evidence. Viewport and interaction assertions pass independently of that screenshot limitation. No native fullscreen or user browser interaction.

## Release status

Source commit: `a0cb1484436b2d7390f8d32da318b9ee5a8eaaff`.

Staging URL: https://staging.universalmind.tv/informatics/geometry/?record=fibonacci-m9-p24&record-mode=research#e8

All 56 changed assets uploaded through the existing Panthur staging workflow. The live browser repeated all 96 layer/view combinations. Desktop figure, toggles and slider fit in the 1440 × 950 and 1280 × 800 viewports; the original sidebar remains beside the figure. All 24 labels have clear bounds in every view. Original phone page flow and full-width drawing remain unchanged in structure.

All 25 checked live source and download files match the committed candidate. Both complete formats reconstruct all 1,196 source records. Dataset version: `01c28808841efdd7e0d69441c85a3d5e7c96389b7faaa7a53da97b006bd3d4c5`.

Production has not been modified. Its recorded main reference remains `02b6f47345e428021dcae8fd4a798ecdfb03969b`.
