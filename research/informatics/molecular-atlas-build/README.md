# Molecular Atlas

An experimental-structure viewer for the eight research subjects agreed on 21 October 2026. The source catalogue names DOCK2 and uses a human GluN1/GluN2B assembly for the NMDA learning-and-memory context. All public φ terminology is Phi Ratio.

## Build

Use Node.js 22 or newer. Run `npm ci` and `npm run build` in this directory. This compiles the pinned Mol* 5.13.1 engine into `Informatics/molecular/vendor/engine.js`. The HTML, CSS and application controller are buildless. Production uses the committed bundle; there is no runtime dependency on a package CDN.

`viewer.js` owns scientific rendering, selection and camera state. `geometry.js` defines unit-circumradius constructions independently of molecule data. `tools/check-molecular-atlas-browser.mjs` checks the candidate by intercepting requests to the permanent staging hostname. Set `ATLAS_LIVE=1` for unmodified live HTTP verification. Browser tests use a separate headless Chromium process with `--mute-audio`; they never invoke native fullscreen.

## Scientific scope

The catalogue is a research collection, not a single gene family or a measured interaction network. Coordinates are downloaded from the public RCSB Model Server as BinaryCIF and stored locally, with SHA-256 checksums and source accession links. A thumbnail is rendered from the same coordinates as its viewer. No illustrative molecular fallback is used.

| Target | PDB | Displayed label chains | Scope |
| --- | --- | --- | --- |
| OXTR | 7QVM | E; ligand D | Engineered receptor complex; G-protein/antibody context optional |
| SLC6A4 | 5I6X | A | Thermostabilised paroxetine-bound transporter |
| DRD2 | 6CM4 | A | Risperidone-bound receptor–endolysin fusion |
| NMDA | 9IYQ | A, B, C, D | Human GRIN1/GRIN2B; Mg-free state; glycine and antagonist 7RC |
| IL6 | 1ALU | A | Human cytokine |
| NR3C1 | 1M2Z | A, C | Engineered ligand-binding domains; dexamethasone |
| DOCK2 | 6TGB | A, C | DOCK2 from the DOCK2–ELMO1 deposited model |
| CD38 | 1YH3 | A | Engineered extracellular domain |

Each source entry is a specific deposited model. Complex partners expose additional deposited chains; they do not generate missing subunits or symmetry mates. Protein sequence positions use the deposited construct, while picked residue labels preserve author numbering. Missing coordinates stay unavailable. DNA regulatory coordinates are a separate view.

## Geometry

Five Platonic solids use analytic unit-radius vertices, with edges selected by their common minimum distance. The stellated octahedron is the compound of two opposite tetrahedra. Odom's original planar midpoint/circumcircle construction is repeated on four faces of a tetrahedron. This tetrahedral arrangement is an explicitly labelled exploratory extension. Its midpoint-segment/adjacent-extension ratio equals `(1 + sqrt(5)) / 2`. The Phi sphere contains 89 points with angular increment `2π(1 − 1/φ)`.

Geometry is centred on the target bounding sphere, with independently controlled scale, Y-axis rotation, X-axis offset and opacity. No spatial fit or biological mechanism is inferred. View exports contain the structure checksum, camera and all geometric parameters.

## References

- RCSB entry and publication links are preserved per target in `data/catalogue.json`.
- Mol*: https://molstar.org/ (MIT license preserved with the bundled engine).
- Hung & van Lamoen, *Odom's Triangle*, IJCDM 6 (2021), 68–77: https://www.journal-1.eu/2021/Tran%20Quang%20Hung%2C%20Floor%20van%20Lamoen.%20Odom%27s%20Triangle%2C%20pp%2068-77.pdf

## Release

Use the existing `./deploy-panthur-staging.sh informatics` workflow. Commit the source before uploading; verify the live staging journey; record the deployment manifest and browser results; push the staging branch. Production requires Ben's explicit publication approval.
