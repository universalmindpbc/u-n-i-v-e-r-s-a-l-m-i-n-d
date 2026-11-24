# Universal One: DOCK2 and OXTR/IL-6 retrieval

Date: 25 November 2026, Australia/Sydney.

Ben authorised updating Universal One and publishing to the permanent staging website. Production remains unchanged.

## Change

Universal One now retrieves the published General chapter 12 (DOCK2, trauma and PTSD; 33 source records) and chapter 13 (oxytocin, OXTR and inflammation, with a focus on IL-6; 42 source records). Chapter overviews, detailed topic narratives, biomarker interpretation, source appraisals, evidence limits and study-family identifiers remain available through the same retrieval tools.

This is versioned retrieval, with no model fine-tuning or shared database writes. The existing bundled research mechanism keeps the staging release separate from production. Source IDs, DOI/PMID aliases and chapter paper aliases resolve to the current approved appraisals. The stale database DOCK2 entry is replaced in retrieval and counts. The public API rises from 1,054 to 1,128 records: 74 additions and one updated existing source.

REST, MCP and paginated JSON/CSV exports share the same 75 records and chapter summaries. The existing published website JSON files and complete website snapshot already contain these chapters; this update leaves their bytes intact. No static website assets changed and no complete-snapshot rebuild was needed.

Follow-up detection preserves the subject through related questions and stops at an intervening unrelated subject. DOCK2, DOC2 and CK2 remain distinct. The answer instructions retain mixed human evidence, null and opposite-direction results, context-dependent IL-6 biology, source-access limits and exploratory intervention-response hypotheses.

## Release

- Source commits: `0efff569a`, `e885d1c5f` and `783de8bef`.
- Final staging Worker version: `5a759f91-c075-4620-b28a-afc23fd505e2`.
- Research version: `general-inflammation-20261125-v3`.
- Research content SHA-256: `7b58c89f93dadb5891b79f2ba113bfa0529dca253c5fb75c9842c77a8f3d67f5`.
- Existing Wrangler staging configuration and backend deployment method retained. Models, reasoning effort, study budgets and production configuration remain unchanged.
- Proof: https://staging.universalmind.tv/informatics/research/?collection=general&chapter=13
- DOCK2: https://staging.universalmind.tv/informatics/research/?collection=general&chapter=12

## Verification

- `local-tests.log`: seven focused checks covering all 75 approved records, source identity resolution, preserved library classifications, complete chapter pagination, negative findings, linked reports, biomarker coverage, context changes, filters, duplicate exclusion and connector contracts.
- `api-verification.json`: all 75 source appraisals match every field in the approved registers; REST and MCP chapter results agree; 12 JSON/CSV export pages reconstruct all 1,128 records identically, with unique IDs.
- `live-verification.json`: real staging OpenAI requests, provider completion receipts and rendered answers for both topics and follow-ups. The final revision is checked separately through a new answer and the citation interaction. The first four answers exercised the initial revision with identical scientific content; later checks verify the context correction and classification-preservation revisions.
- Browser QA uses a separate headless Chromium process with `--mute-audio` verified before navigation. Playback, microphone, native fullscreen and study actions are blocked. Desktop and mobile screenshots are included. Every automated browser closes after verification.
- The QA script enforces a total US$6 ceiling and a US$2.25 per-request ceiling. `chargedUpperUSD` records a conservative usage bound, not a billing receipt.
- `source-sha256.json`: exact source, configuration and approved data hashes.
- `before.json` and `api-verification.json`: production health and inventory response hashes remain identical. The production branch remains at `867a2a63c794673f67dc76df258fcd2d292d6b4c`.

No hardware jobs, funded studies, new full-text uploads or production deployment were performed.
