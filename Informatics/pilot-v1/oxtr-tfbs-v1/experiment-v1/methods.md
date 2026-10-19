# OXTR binding-site geometry: first interactive experiment

Version: oxtr-coordinate-experiment-2026-10-20-v1. Exploratory coordinate comparison.

## Question and sources

Inspect the positions of OXTR-associated DNA observations alongside the fixed Alpha, Beta, Gamma and Epsilon patterns of Fibonacci M9 P24. Three independent selections are available: recovered published elements, ENCODE occupancy regions, and JASPAR motif predictions with UCSC score at least 400. The complete underlying catalogue retains all lower-score predictions. Source observations and overlapping predictions are not deduplicated into a count of confirmed binding sites.

The two published elements are US-1 and US-2. The 2006 study's 15 reported sites have no recovered individual coordinates in this release and do not appear as plotted sites. ENCODE regions include multiple experimental and cell-type contexts. JASPAR matches are predictions, not experimentally established binding events.

## Fixed mapping

Human GRCh38 chr3:[8740380,8779628), length 39248 bp. All raw intervals use 0-based starts and exclusive ends. OXTR runs on the minus strand. The line runs left to right from high to low genomic coordinates; the circles run clockwise from north. Origin is genomic base 8779627, the first base at the high-coordinate edge of the saved window. This is a plotting origin, not a transcription start site.

For a raw interval [s,e), first intersect it with the saved window: a=max(s,8740380), b=min(e,8779628). Original intervals remain unchanged in the exports. Clipped intervals are labelled. Local interval boundaries are d0=8779628-b and d1=8779628-a. The representative base is d=floor((d0+d1-1)/2). For an even width this picks the first of the two central bases in the OXTR direction. The genomic representative is 8779627-d. This representative is a plotting convention; an ENCODE region centre is not a resolved binding nucleotide.

The DNA line and full circle retain interval extents. A full-circle turn is d/39248; the M9 residue is d mod 9, with zero labelled 9. Both circles use x=sin(theta), y=-cos(theta), with theta=2*pi*turns or 2*pi*residue/9. M9 collisions are shown as counts and remain traceable to every source observation. Modulo reduction discards absolute distance and maps many unrelated coordinates to the same node.

Dense selections use explicitly labelled anchor-count bins; sparse selections show interval marks. Bins are for display and selection only, and do not change the stored coordinates. Zoom changes the visible line range, never the mapping origin or the circle scale. Individual observations are available in the inspector and JSON/CSV downloads.

## Atlas comparison

Use the versioned m9.json reference with its original phase and clockwise orientation. Alpha displays the 24 residues by period index. Gamma uses its six primary indices and two triangle paths. Epsilon uses its canonical seven-visit traversal through those period positions. Beta follows 4,8,7,5,1,2 on the nine-position residue circle. The panels retain their distinct grids and labels. No fitted rotation, arbitrary DNA path connections, or inferred physical circular DNA structure is introduced.

## Verification and reproduction

Python computes all projections and independently reconstructs the Fibonacci cycle, primary Gamma nodes and Beta interval sums. Biopython parses the reference FASTA and JASPAR templates, rechecks both published sequence placements, and checks the reference sequence and strand of every eligible displayed JASPAR prediction. Exact checks are local to the saved window. The archived motif predictions are not rescanned or experimentally validated here.

Wolfram independently checks the projection rules across every possible base offset in this window, raw-interval test cases, the M9 cycle and canonical paths. Its saved code and actual returned results accompany the Python validation. The browser displays precomputed data and performs filtering and rendering locally; it does not call a Python or Wolfram server for each interaction.

Create a Python environment, install requirements.txt, then run build_experiment.py with --source pointing to the extracted original catalogue folder and --atlas pointing to the original m9.json. The manifest records source and output SHA-256 hashes. Run verify.wl in Wolfram Language for the independent checks. Exported selections retain parameters, source records and the Atlas reference. SVG exports retain vector geometry.

## Interpretation

This first experiment is visual exploration with checked arithmetic. It reports no association score or biological conclusion. A subsequent test requires a defined comparison statistic, appropriate matched controls, sensitivity to the coordinate origin and interval representative, and correction for the comparisons explored. The earlier Fibonacci shuffle probability is a different model and is not applied to DNA coordinates.
