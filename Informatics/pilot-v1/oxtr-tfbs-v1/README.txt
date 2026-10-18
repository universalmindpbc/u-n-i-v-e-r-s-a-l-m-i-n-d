OXTR binding-site catalogue — 19 October 2026

This supplement collects published OXTR regulatory evidence and existing database records. It does not perform a new motif scan or compare the data with Atlas geometry.

Read catalogue.json or the lossless typed catalogue-fields.csv for scope, evidence, publications, source URLs, methods, caveats and unresolved work. literature-evidence.csv is the accessible row table; reported_count is an aggregate reported by a paper, not a new unique-site total. Null coordinates remain blank in flat CSV files. Literature positions remain verbatim; never treat a TSS-relative label or CpG coordinate as a precise motif interval.

Database region: GRCh38 chr3:8740380–8779628, 0-based half-open, Ensembl OXTR gene body plus 10 kb on each side. OXTR is on the minus strand. The reference DNA file is the genomic plus strand. Motif sequence_oriented follows the motif strand. Overlap queries retain records extending beyond the window; those sequences use the separately archived 60 kb reference extraction. No liftover or transcript realignment was performed.

JASPAR: 217,857 published predictions in the returned window; 9,164 meet UCSC’s score >=400 default display filter. The track’s underlying prediction method uses a relative PWM threshold of 0.8 and p<0.05; UCSC score is based on -100 log10(p), capped at 1000. The display filter corresponds approximately to p<=1e-4, without a locus-level multiple-testing correction. Prediction is not observed binding or proof of OXTR regulation. The complete returned set is retained, alongside the filtered CSV. 1,019 vertebrate nonredundant PFM templates are included; 1,003 different models occur among the returned matches. A PFM is a model, not an OXTR-specific site. JASPAR 2026 publication: https://doi.org/10.1093/nar/gkaf1209 .

ENCODE: 255 regional clusters for 133 target names, from the UCSC ENCODE 3 November 2018 release. Each cluster links to all its source experiments and cell types in encode-provenance.csv/json. Clusters represent broad occupancy and include coregulators. They are not 255 precisely located, functionally confirmed OXTR motifs.

ORegAnno: 37 overlapping regional annotations from the UCSC 2015 snapshot. Most factor/class metadata were not resolved. OREG1492306 is cross-referenced by the 2023 OXTR methylation paper. It is counted once in this table, not again as a new experiment.

Publication findings are factual summaries with source links. Full article text, figures, and licensed TRANSFAC data are not redistributed. The existing 14-study Atlas research register remains separate; its E03 circadian study is cross-referenced here, not a new independent study. Review depth and evidence type are recorded; numerical trust and WSS scores are unassigned for this supplement.

CSV archive: all tabular evidence, metadata, DNA bases, matrix counts, predictions, clusters and provenance are available without a JSON parser. catalogue-fields.csv uses the Atlas typed path convention (field,type,value,resolved_url); source/csv_records.py restores its nested structure. Flat tables use one row per declared record and retain explicit identifiers. Neither repeated motif names nor repeated database hits establish independent observations.

The search ledger records all returned bibliographic items; items outside the selected extraction have not all been systematically screened. TRANSFAC licensing, the unavailable legacy TFBSdb endpoint, individual old-paper coordinates and additional database exports remain open. No exhaustive completeness claim is made. The three future views preserve original DNA positions, full-circle spacing and a separately labelled M9 reduction.
