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
- Browser QA uses a dedicated headless Chromium process with audio muted and playback blocked. Software rendering avoids a headless GPU screenshot artifact. No native fullscreen or user browser interaction.

## Release status

Staging deployment and live verification pending. Production remains untouched.
