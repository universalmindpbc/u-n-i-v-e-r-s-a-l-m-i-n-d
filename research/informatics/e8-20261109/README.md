# E8 in the M9/P24 Geometry Atlas

Ben approved a pure geometry addition immediately before Odom’s construction. The tab presents a symbolic composition, an orthogonal projection for an order-24 E8 symmetry, and the order-30 Coxeter projection. The optional 8 / 6 / 3 guide is explicitly symbolic. No genomic or quantum interpretation has been added.

## Geometry and provenance

`research/informatics/pilot/e8_geometry.py` enumerates all 240 roots and constructs both symmetry operations from root reflections. Exact rational checks establish orthogonality, orders 24 and 30, and the order-24 polynomial identity. Every root belongs to a complete orbit: ten cycles of 24 or eight cycles of 30. Projection checks verify orthonormal bases, angular increments, distinct projected points, and constant orbit radii. The selected 24-step plane has nine distinct radii; the Coxeter plane has eight.

The data records the complete roots, matrices, reflection words, root permutations, ordered orbits, bases, coordinates, Fibonacci states, display conventions and sources. Shared step indices remain an explicit comparison convention. The symbolic layout and polygon guide use separate drawing rules.

## Data publication

- Complete geometry: `Informatics/pilot-v1/e8-m9-p24.json` and `csv-shared/e8-m9-p24.csv`.
- The individual M9 JSON and typed CSV include `e8_geometry`.
- The M1–M1001 manifests, summary CSV and both ZIP bundles include the new geometry or its explicit references.
- Geometry Atlas narrative JSON, CSV, Markdown and AI reading pages retain the addition.
- Both complete public dataset formats include the updated source records.

`geometry-verification.json` records regeneration and individual CSV reconstruction checks. `bundle-verification.json` confirms every replaced ZIP member matches its source, every existing member remains present, and all unrelated members retain their CRC and size. Complete export checks reconstruct all published source records from JSON and typed CSV.

## Interface verification

The browser check uses a separate headless Chromium process with `--mute-audio` verified before navigation. Media requests and playback are blocked. It never enters native fullscreen.

At 1440, 390 and 320 pixels, all three views retain 240 roots, the expected active cycle count, finite coordinates, usable guide and step controls, and no horizontal overflow. It verifies tab placement, the E8 deep link, switching to Odom, switching to M18, returning to M9 and opening the family comparison. Browser reports and screenshots are retained alongside this note.

## Release boundary

This task uses the existing `deploy-panthur-staging.sh informatics` transport and the dedicated staging account. The deployed source is committed before upload; deployment metadata and verification follow in a separate commit on `origin/staging`. Production remains outside this release.
