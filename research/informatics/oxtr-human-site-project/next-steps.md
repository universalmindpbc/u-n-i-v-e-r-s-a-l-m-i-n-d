# OXTR binding-site illustrations and Atlas computing roadmap

Recorded at Ben’s request on 19 October 2026, Australia/Sydney. Resume together when Ben returns this afternoon. This is the next-session brief and task list; it does not start the comparisons or schedule an automatic run.

## Bring up when Ben returns

1. The three binding-site illustrations and comparison with all four Atlas sequences.
2. The planned Wolfram + Biopython feature for Atlas users.
3. **NVIDIA products, services, APIs and compute: CUDA and CUDA-Q.** Ben explicitly asked to discuss this on resuming; raise it alongside the illustration and Biopython work.

## Agreed direction

Use Python to create clear illustrations from the binding-site research data already collected, comparing the data with **Alpha, Beta, Gamma and Epsilon of Fibonacci M9 P24**. Show the same selected observations in all three agreed views:

1. **Original DNA line.** Preserve genomic positions, interval widths, order, spacing and strand. Display broad experimental regions as intervals and recovered sequence elements at their recorded extents.
2. **Full-position circle.** Wrap the same defined DNA window around a circle, preserving proportional positions and interval widths. Keep the origin and direction visible. This is a representation of the coordinates, not a claim that the DNA takes that physical shape.
3. **Modulus 9 circle.** Show the same observations under an explicitly defined M9 mapping, alongside the relevant Atlas sequence. Retain the original coordinates, show where observations coincide after reduction, and make it possible to trace a reduced mark back to its source.

Make all four Atlas sequences available for comparison. Preserve their existing values, order and alignment; use the verified Atlas records rather than redraw them from memory. Do not silently adjust rotation, origin or scaling to make a pattern fit. Agree which coordinate or interval feature is mapped before producing the comparison.

## Planned website feature: Wolfram and Biopython

Ben’s intention is to include **Biopython as a feature in the Atlas**, alongside **Wolfram-powered calculations**, for people using the website.

- **Biopython:** prepare and inspect DNA sequences, motif models and strand-aware sequence operations. Use it within a reproducible Python analysis pipeline; retain source identifiers, reference assembly, methods and parameters.
- **Wolfram / Wolfram Language:** symbolic calculations, modular arithmetic, sequence and geometry representations, and independent checks where appropriate.
- **Python plotting and the Atlas interface:** generate the scientific illustrations and let people select data, switch among the three views, compare Alpha/Beta/Gamma/Epsilon, inspect sources and download results.

These are complementary tools. A future public “powered by” statement refers to the capability actually implemented and verified. The Biopython website feature and binding-site comparison workflow are planned, not live in this release.

## NVIDIA discussion — CUDA and CUDA-Q

Explore how NVIDIA products and services fit the actual Atlas research workload. Review current official documentation when this discussion resumes and distinguish accessible services from proposed integrations.

- **CUDA:** identify candidate GPU workloads, such as large motif scans, many comparison runs or matched random controls; assess whether their size justifies acceleration beyond the existing Python/Biopython CPU workflow.
- **CUDA-Q:** discuss whether there is a well-defined quantum or hybrid computational problem worth formulating for the OXTR investigation, and what a simulation actually tests. Keep this distinct from drawing the DNA circles or applying modulo nine.
- Compare local hardware, hosted compute, APIs and SDK integration, including access, cost, reproducibility and the data passed between components.
- Choose a small benchmark and explicit accuracy/runtime comparison before proposing a public Atlas compute feature. Identify which calculations remain with Wolfram, Biopython and ordinary plotting tools.

This is a discussion and feasibility item for the next session. No NVIDIA account, paid compute, GPU/QPU job, API integration or quantum result is being created in this release.

## Existing material available for the first illustrations

- **2 published human DNA elements with recovered positions:** US-1 and US-2. Their reference placements were computed from published sequences; this does not constitute a new binding experiment.
- **255 ENCODE experimental occupancy regions**, with target, cell-type and experiment provenance.
- **9,164 JASPAR predicted matches** at the current score-400 display threshold; all **217,857** archived matches remain available.
- **37 ORegAnno annotated regions**.
- The saved **39,248-base human OXTR reference window**, GRCh38 chr3:8740380–8779628, 0-based and end-exclusive; OXTR is on the minus strand.

Keep these collections identifiable as separate layers, with their own count units and filters. The 2006 paper’s 15 reported sites remain in the literature collection; individual coordinates are still unresolved. Their recovery can continue alongside the first illustrations using the data already mapped.

## Next-session task list

- [ ] Raise the requested NVIDIA CUDA / CUDA-Q discussion when Ben returns; review products, services, APIs, compute options and a useful first benchmark.
- [ ] Confirm the first data selection and the labels for the three views with Ben; begin with a legible example before displaying dense collections.
- [ ] Specify the DNA window, reference strand, coordinate origin, interval representation and exact M9 mapping. Record these choices before comparing shapes.
- [ ] Build a reproducible Python/Biopython preparation notebook or script using the archived inputs. Record package versions, source checksums and parameters.
- [ ] Generate the original DNA line, full-position circle and M9 circle from one shared set of observations. Preserve positions and source links across all three.
- [ ] Add comparisons with each verified Alpha, Beta, Gamma and Epsilon sequence from M9 P24. Make any reduced-coordinate collisions visible.
- [ ] Use Wolfram for appropriate independent arithmetic and geometry checks, recording which results it actually verifies.
- [ ] Review the illustrations with Ben for clarity and interpretation before implementing the interactive Atlas feature.
- [ ] Define the user-facing Biopython feature: supported operations, controls, computation location, downloadable methods and truthful loading/error states.
- [ ] Keep the Atlas, JSON, CSV and Notion representations consistent. Export the figures as SVG/PNG and retain the underlying data and calculation steps for human and AI researchers.
- [ ] Define matched comparison data and statistical controls before making any claim of enrichment or biological significance. The existing Fibonacci shuffle probability is a separate model and does not become a probability for these DNA patterns.
- [ ] Stage the approved interactive implementation at https://staging.universalmind.tv, preserve lightboxes/fullscreen/music, and follow the existing proof-then-production workflow.

## Scope of this record

Today’s action is to publish the already approved OXTR data browser and save this plan. The illustration work resumes with Ben. No new motif scan, DNA-to-Atlas mapping, statistical result, paid computing job or scientific relationship is asserted by this note.

Resources already selected for the workflow: [JASPAR](https://jaspar.elixir.no/docs/), [TRANSFAC](https://genexplain.com/transfac-database/), [Biopython motif analysis](https://biopython.org/docs/latest/Tutorial/chapter_motifs.html) and [Wolfram BioSequence](https://reference.wolfram.com/language/ref/BioSequence.html). TRANSFAC data remain subject to available access and reuse terms.
