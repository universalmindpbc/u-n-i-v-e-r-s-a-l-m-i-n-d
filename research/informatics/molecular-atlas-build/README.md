# Molecular Atlas

An experimental-structure viewer for the eight research subjects agreed on 21 October 2026. The source catalogue names DOCK2 and uses a human GluN1/GluN2B assembly for the NMDA learning-and-memory context. All public φ terminology is Phi Ratio.

## Build

Use Node.js 22 or newer. Run `npm ci` and `npm run build` in this directory. This compiles the pinned Mol* 5.13.1 engine into `Informatics/molecular/vendor/engine.js`. The HTML, CSS and application controller are buildless. Production uses the committed bundle; there is no runtime dependency on a package CDN.

`viewer.js` owns scientific rendering, selection and camera state. `geometry.js` defines unit-circumradius constructions independently of molecule data. `tools/check-molecular-atlas-browser.mjs` checks the candidate by intercepting requests to the permanent staging hostname. Set `ATLAS_LIVE=1` for unmodified live HTTP verification. Browser tests use a separate headless Chromium process with `--mute-audio`; they never invoke native fullscreen.

## Shared navigation and video

Research Atlas contains Geometry Atlas and Molecular Atlas, followed by the existing About, Sound, Vision, Language, Universal Research and Partners entries. Molecular Atlas loads in a transparent iframe beneath the shared header. The existing background video, playback position, fullscreen state and audio controls stay in the parent experience. The selected molecule survives area changes.

The standalone route uses the same background video with muted playback and explicit pause and sound controls. Reduced-motion preference leaves that video paused until Play. The canvas uses an alpha background; the black shade and translucent panels match the Geometry Atlas treatment. The brand uses the existing flower logo with bold UNIVERSAL and light INFORMATICS.

## Scientific scope

The catalogue is a research collection, not a single gene family or a measured interaction network. Coordinates are downloaded from the public RCSB Model Server as BinaryCIF and stored locally, with SHA-256 checksums and source accession links. A thumbnail is rendered from the same coordinates as its viewer. Protein-load failures stay explicit; no fabricated structure replaces a failed download.

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

Each source entry is a specific deposited model. Complex partners expose additional deposited chains; they do not generate missing subunits or symmetry mates. Protein sequence positions use the deposited construct, while picked residue labels preserve author numbering. Missing coordinates stay unavailable. DNA regulatory coordinates remain separate from protein residue coordinates.

## Gene / Protein switch

The opening Gene view shows a 48-base window of reference DNA as a clearly labelled idealised double helix. The Protein view retains the deposited experimental models. The viewer never describes the DNA helix as a measured cellular fold or atomic structure. Molecular models remain separate from the exploratory geometry layer.

`fetch-genes.py` retrieves human GRCh38 gene and canonical transcript annotations from Ensembl, genomic DNA from UCSC, and an independent genomic sequence from Ensembl. The build requires exact sequence agreement. It stores nine genes for the eight targets: NMDA has separate GRIN1 and GRIN2B choices. Source snapshots and sequence checksums are retained. The complete gene includes introns; exon markers and transcription starts refer to the named canonical transcript. All displayed genomic coordinates are 1-based and inclusive. Minus-strand DNA is reverse-complemented into the gene's 5-prime to 3-prime orientation.

`dna.js` specifies the illustrative 48-base geometry. Base-pair rungs carry the actual reference sequence; the complementary strand uses A/T and C/G pairing. These display coordinates are independent of measured protein coordinates. The interface supports exon/TSS jumps, sequence windows, full FASTA and annotation downloads, and view exports that identify the biological level and the DNA interpretation.

Collection conceals the structure workspace and its controls while retaining the background film. Its stronger panel and card backgrounds keep labels readable. Returning to Structure preserves the selected geometric construction.

Run `node tools/check-molecular-genes.mjs` for DNA source, strand, exon and boundary checks. The protein browser suite uses `?level=protein`; the entry suite exercises the default Gene view and shared media continuity.

## Geometry

Five Platonic solids use analytic unit-radius vertices, with edges selected by their common minimum distance. The stellated octahedron is the compound of two opposite tetrahedra. Odom's original planar midpoint/circumcircle construction is repeated on four faces of a tetrahedron. This tetrahedral arrangement is an explicitly labelled exploratory extension. Its midpoint-segment/adjacent-extension ratio equals `(1 + sqrt(5)) / 2`. The Phi sphere contains 89 points with angular increment `2π(1 − 1/φ)`.

Geometry is centred on the target bounding sphere, with independently controlled scale, Y-axis rotation, X-axis offset and opacity. No spatial fit or biological mechanism is inferred. View exports contain the structure checksum, camera and all geometric parameters.

## References

- RCSB entry and publication links are preserved per target in `data/catalogue.json`.
- Mol*: https://molstar.org/ (MIT license preserved with the bundled engine).
- Hung & van Lamoen, *Odom's Triangle*, IJCDM 6 (2021), 68–77: https://www.journal-1.eu/2021/Tran%20Quang%20Hung%2C%20Floor%20van%20Lamoen.%20Odom%27s%20Triangle%2C%20pp%2068-77.pdf

## Release

Use the existing `./deploy-panthur-staging.sh informatics` workflow. Commit the source before uploading; verify the live staging journey; record the deployment manifest and browser results; push the staging branch. Production requires Ben's explicit publication approval.
