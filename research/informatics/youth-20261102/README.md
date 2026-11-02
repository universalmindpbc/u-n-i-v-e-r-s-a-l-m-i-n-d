# Universal Mind youth research mission — 2 November 2026

Candidate package for Ben's content sign-off, separate from the completed domestic-violence mission. No production or main-library integration is authorised by this package.

- `candidate-assessments.json`: original structured summaries, methods/access limits, identity, proposed design markers, institution provenance, publication-status checks and review state.
- `baseline-corpus.json`: seven-source library identity inventory and hashes at the research baseline.
- `search-log.json`: API queries, pages, dates and hashes. Discovery is not full screening.
- `discovery-inventory.json`: discovery identities and preliminary corpus matches.
- `brief.md`: synthesis and lab implications, including separate Black Dog/Orygen sections and the exact Orygen/Phoenix report.
- `methods.md`: counting, qualification, source access and review boundaries.
- `counts.json`: generated metrics; cross-listed institutions and topics are not additive.
- `supplemental-sources.json`: official institutional sources, report provenance and excluded retracted paper.
- `qa/`: silent headless browser evidence at desktop and phone widths.

Build: `python3 tools/build-youth-review.py`.

Data checks: `python3 tools/check-youth-review.py` and `python3 tools/export-informatics.py --check`.

Browser checks: `node tools/check-youth-review-browser.mjs`; the script uses a private loopback server for candidate QA and a separate headless Chromium process with audio disabled. It never operates Ben's browser. `STAGING=1` checks the permanent proofing site and every published package file against committed bytes.

The approved export and retrieval sources exclude `Informatics/review/`. All 187 record-level approval states are pending and approved crosses are null. The frozen public batch/CSV use content-derived filenames; each record has a canonical JSON SHA-256. Raw publisher full texts and abstracts remain in the private task cache, outside Git.

Research baseline: `05da69656bbe9fae4498e306d1e1b9171b51e372`. A separately recorded release baseline preserves any intervening staging work. The shared checkout and other tasks' changes are not part of this mission.
