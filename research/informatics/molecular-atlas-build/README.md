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

The opening Gene view shows a 48-base window of reference DNA as a clearly labelled, constructed B-DNA atomic model. Helix, Atoms and Surface render the same coordinates. The Protein view retains the deposited experimental models. The viewer never describes the DNA model as a measured gene or cellular fold. Molecular models remain separate from the exploratory geometry layer.

`fetch-genes.py` retrieves human GRCh38 gene and canonical transcript annotations from Ensembl, genomic DNA from UCSC, and an independent genomic sequence from Ensembl. The build requires exact sequence agreement. It stores nine genes for the eight targets: NMDA has separate GRIN1 and GRIN2B choices. Source snapshots and sequence checksums are retained. The complete gene includes introns; exon markers and transcription starts refer to the named canonical transcript. All displayed genomic coordinates are 1-based and inclusive. Minus-strand DNA is reverse-complemented into the gene's 5-prime to 3-prime orientation.

`dna.js` assembles each 48-base model from the selected reference sequence and its antiparallel Watson-Crick complement. `build-dna-templates.py` extracts and checks eight heavy-atom templates from the pinned BioExcel NAB Langridge B-DNA fixture in `dna-model-source/`. Rise is 3.38 Å and twist is 36° per base pair. Both 5-prime termini omit the terminal phosphate; hydrogens are implicit. Helix uses a nucleic-acid cartoon, Atoms uses ball-and-stick with element colours, and Surface computes a molecular surface from the same atoms. No sequence-dependent relaxation or chromatin fold is inferred. The interface supports exon/TSS jumps, sequence windows, full FASTA and annotation downloads, modelled-segment PDB downloads, and view exports containing the construction method and source checksum.

Collection conceals the structure workspace and its controls while retaining the background film. Its stronger panel and card backgrounds keep labels readable. Returning to Structure preserves the selected geometric construction.

Run `node tools/check-molecular-genes.mjs` for DNA source, strand, exon and boundary checks. Run `node tools/check-molecular-dna-model.mjs` for template-source round trips, antiparallel pairing, phosphodiester continuity, glycosidic distances and terminal chemistry. The protein browser suite uses `?level=protein`; the entry suite exercises the default Gene view and shared media continuity.

## Geometry

Five Platonic solids use analytic unit-radius vertices, with edges selected by their common minimum distance. The stellated octahedron is the compound of two opposite tetrahedra. Odom's original planar midpoint/circumcircle construction is repeated on four faces of a tetrahedron. This tetrahedral arrangement is an explicitly labelled exploratory extension. Its midpoint-segment/adjacent-extension ratio equals `(1 + sqrt(5)) / 2`. The Phi sphere contains 89 points with angular increment `2π(1 − 1/φ)`.

Geometry is centred on the target bounding sphere, with independently controlled scale, Y-axis rotation, X-axis offset and opacity. No spatial fit or biological mechanism is inferred. View exports contain the structure checksum, camera and all geometric parameters.

## References

- RCSB entry and publication links are preserved per target in `data/catalogue.json`.
- Mol*: https://molstar.org/ (MIT license preserved with the bundled engine).
- Hung & van Lamoen, *Odom's Triangle*, IJCDM 6 (2021), 68–77: https://www.journal-1.eu/2021/Tran%20Quang%20Hung%2C%20Floor%20van%20Lamoen.%20Odom%27s%20Triangle%2C%20pp%2068-77.pdf

## Release

Use the existing `./deploy-panthur-staging.sh informatics` workflow. Commit the source before uploading; verify the live staging journey; record the deployment manifest and browser results; push the staging branch. Production requires Ben's explicit publication approval.
