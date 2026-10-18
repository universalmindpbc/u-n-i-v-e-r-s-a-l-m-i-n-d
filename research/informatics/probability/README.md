# M9 P24 probability publication

The approved comparison preserves each record's original Gamma values, Gamma
positions and Beta alignment. M9 P24 is the first calculated record. Its result
is `263/51305410956800`, approximately **1 in 195.1 billion**.

The Atlas shows **Probability** in Geometry Summary, immediately before Reduction
to M9. Its calculation opens in a lightbox in the existing Atlas experience.

## Regeneration

After geometry and literature generation, run:

```sh
python3 research/informatics/pilot/sync_probability.py --data-dir Informatics/pilot-v1
INFORMATICS_DATA_DIR=Informatics/pilot-v1 python3 research/informatics/pilot/export_csv.py
python3 tools/check-informatics-probability.py
python3 tools/check-informatics-register.py
```

The calculator checks the exact native inputs and counts the original alignment
using three exact procedures. `sync_probability.py` produces the optional,
versioned `probability` object in M9's record, the aggregate dataset and the
standalone `m9-probability.json`. Arrangement counts are strings to preserve
integer precision in JavaScript. Other records have no assigned probability.
The CSV exposes the display, exact fraction, value, reciprocal and method.
The ZIP includes M9's JSON and executable calculator for reproduction.

The local Informatics workspace mirrors the calculator under
`research/probability`, the sync under `src`, and exports under `data/m1-m48-v1`.

## Notion

Existing Atlas data source: `e63b575d-a9ae-4c56-8ecc-c7b3b2ec558a`.
Existing M9 P24 page: `3fb7b9c9-9c56-8137-a2c5-c99b7bc2a1ee`.

Properties: `Probability` (text), `Probability exact` (text), `Probability one in`
(number) and `Probability method` (text). The page contains the identical summary
and a collapsed calculation. Current JSON and bundle links point to the versioned
M1–M48 exports. Earlier attached snapshots remain labelled as historical.

The original probability discussion in Appendix D is retained as source history.
The current record uses the joint Gamma–Beta calculation agreed on 18 October 2026.
This update does not assign statistical significance, biological significance
or WSS scores. No probability values have been applied to other M9-family records.
