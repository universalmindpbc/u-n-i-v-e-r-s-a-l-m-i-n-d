# Mind–body survivor lane — final first-batch report

Completed a targeted rapid scan of adult-survivor mindfulness, meditation, yoga, breathing and psychomotor intervention evidence. This is not a systematic review. All candidates remain pending human review; no repositories, git branches, deployment targets or third parties were changed.

## Counts

| Stage | Count |
|---|---:|
| API records returned, including overlap | 402 |
| Additional manually discovered publication records | 6 |
| Deduplicated retrieval ledger | 352 |
| Title/abstract scope screens, raw incl query overlap | 108 |
| Unique screened publications | 105 |
| Retrieved but not yet screened | 247 |
| Assessed candidate publications | 15 |
| Contract-complete records available for human review | 15 |
| Existing baseline DOI/PMID/normalized-title matches | 0 |
| Direct survivor evidence / provider context | 14 / 1 |
| Randomized reports with one cross | 6 |
| Verified double-blinded reports | 0 |
| Conservative provisional study/program family IDs | 13 |
| Explicit registry-linked study families | 5 |

The 247 queued records have `screened:false`. Do not add them to screened or assessed totals. Among the 105 screened: 76 excluded from this lane, 14 deferred, 15 included. The 13 family IDs include qualitative and implementation work and are **not 13 verified independent trials**. Dutton/Bermudez and Clark/Nguyen-Feng are conservatively grouped because cohort/program overlap is likely but unconfirmed. BSHAPE should be reconciled with the language/digital lane before combined family totals. The 2008 breathing/depression report remains deferred and is probably a companion to the included 2006 self-efficacy report.

## Findings that need to stay visible

- Khoshbin 2025 (10.1186/s40359-025-03358-9) has an RCT title, but its methods explicitly describe an uncontrolled single-arm study: **zero crosses**. Its later correction repairs author names only. The listed IR.SSU.REC.1398.230 is an ethics code, not a verified clinical-trial registration. Eligibility allowed ages 15–49; do not assume an exclusively adult enrolled sample.
- Mahapatro 2025 (10.3389/fpubh.2025.1541169): full methods report **243 randomized, 211 analyzed**; the abstract describes 211 as randomized. Only analysts are documented as blinded. Do not use its unusually presented abstract effect-size numbers without a table audit. Yoga is one part of a package and has no isolated effect estimate.
- Emirza 2024 (10.1111/inm.13401): methods report **57 randomized, 53 analyzed**; participant and researcher masking were absent. The official registry's structured allocation/model fields conflict with its free text and publication, which both describe randomized groups. The article's explicit stratified-block methods support one cross; they do not establish double blinding.
- Leach/Lorenzon TM: mood and quality-of-life improvements coexist with **no adjusted comparative PTSD effect**. Participant masking was absent; analyst masking was reported. Adverse events occurred in both arms.
- Gallegos 2020: **primary between-group effects were nonsignificant**. Within-MBSR improvement is not proof of superiority.
- coMforT: feasibility, not definitive efficacy. Two anxiety-related adverse events were reported. NHS wait times weakened control receipt.
- Beranbaum/D'Andrea:526 total respondents comprise 361 survivors and 165 staff. The total is not a survivor-only sample.
- Dutton and Bermudez do not inherit trial crosses from a parent RCT: these publications report implementation and qualitative experience, respectively.

## Sources and limits

Four candidates used full text, three selected methods/results, and eight abstracts or indexed primary abstracts. Sources are linked inside every candidate. PubMed/Europe PMC bibliographic data, primary publishers and an official ClinicalTrials.gov API record supplied evidence. The two precision queries returned all 69 and 33 records, respectively; broad queries returned only the first 100 of each large result set and are explicitly incomplete. Exact API queries, timestamps and URLs are in `search-log.json`. Targeted lookup queries added during finalization are logged. Earlier web discovery query strings were not all preserved; this limitation is stated in the log rather than inventing a complete search history.

Publisher access failed for Ghahari 2017 (journal pages unavailable), Ong 2019 and Franzblau 2006 full text (HTTP403); PMC browser challenges or unavailable Europe PMC XML limited Clark 2014 and Kelly 2016. These are source-access limits, not automatic-approval denials. The Franzblau 2006 primary journal's indexed abstract explicitly describes 40 randomized women and the reported self-efficacy result, so its abstract-level assessment is retained. No paywall access, purchases, installation, credentials or contact was attempted.

Broader interpersonal trauma studies (Kelly, Lee, van der Kolk and others) were deferred from direct inclusion when domestic/family exposure or a separate subgroup could not be established. Reviews, child-only/perpetrator studies, protocols and duplicate versions were excluded from this lane and retained in the screening ledger. No generic PTSD evidence was used to inflate direct survivor counts.

## Files and reproducibility

- `candidates.json`: 15 contract-complete records; all review.status=pending.
- `screening.json`: 352 unique retrieved/manual publications and explicit dispositions/queue flags.
- `search-log.json`:API and retained targeted-query provenance; known logging limits.
- `counts.json`:machine-readable stage counts and family cautions.
- `private/`:raw source responses and metadata for local audit only. **Do not publish or commit this directory.**

Baseline comparison used 1108 records from commit `36fe9a2d3869f90083907ff7c9001aa9c5d8a21f`. All 15 candidate identities are unique by DOI and all required schema keys, authors, years, outcome entries, sources and pending-review flags passed a local validation. No candidate has two crosses. Publication correction/retraction checks were limited to accessed records and the identified correction; no comprehensive retraction database audit was performed.

## Next work, if needed

Resolve full methods for Clark and Franzblau, obtain primary Ghahari/Ong content, reconcile BSHAPE and shared program families, and verify reporting discrepancies against trial histories. Continue the 247-record discovery queue only after scope relevance is checked. These steps can improve certainty without adding loosely related evidence.
