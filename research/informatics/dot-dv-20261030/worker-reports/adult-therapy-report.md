# Adult survivor psychological therapies — frozen research batch

All records remain pending human approval. No production changes, third-party contact, purchases, credentials or deployment occurred in this lane.

## Counts

- 1,161 raw bibliographic records retrieved across five search queries and three identifier lookups; 968 unique source identities after retrieval deduplication.
- 130 unique records actually screened: 32 advanced to extraction, 98 excluded or routed by inspected titles. 838 retrieved identities remain in `retrieval-queue.json`; they are not counted as screened.
- 30 assessed publications plus two deferred publications. 27 candidates are marked review-ready with explicit access limits; three assessed records require further source checks.
- No candidate DOI/PMID matches among the 1,108 baseline library records.
- 25 study-family labels among assessed publications; 27 including the two deferred papers. These are conservative family clusters, not proof of 25 independently replicated trials. The two CFT reports are provisionally grouped because independence is unresolved.
- Three full-paper appraisals, five selected-methods appraisals and 24 abstract-level extractions. 24 publications carry one design cross; eight carry none. No verified double-blinded trial or human approval is claimed.

## Strong evidence and qualifications

The core bundle covers three distinct HOPE trials (70, 60 and 172 participants), PATH, WEAVE, NET, internet CBT, CTT-BW and other survivor interventions. Symptom benefits coexist with null comparative violence outcomes. The 24-month WEAVE report does not preserve the earlier secondary depression benefit.

Three WEAVE reports share ACTRN12608000032358. Three trauma-focused CBT/positive-memory reports share ISRCTN73702156. The 2024 CBT paper randomized active therapy groups, while its waitlist was assigned by scheduling availability; this distinction is prominent in the record. Secondary dropout, mediation and IPV-moderation analyses do not inherit a trial cross.

Full-paper review upgraded shelter-only HOPE, PATH and internet CBT, including retention, adherence, null findings and safety/deterioration reporting. Selected methods were also checked for extended HOPE, positive-memory CBT and three Iranian studies.

## Outstanding source checks

1. **NET, PMID30079583:** publication N=45 conflicts with registry actual enrollment N=34. The registry labels triple masking, but publication-level execution is unverified. One cross only; `reviewReady:false`. The publisher full-text request redirected to its abstract, and the Konstanz repository returned HTTP403. No access restriction was bypassed. A primary full-paper methods copy is needed to resolve this.
2. **PATH, PMID30481183:** main outcomes are established, but results and conclusion disagree about which arm contained four possibly related serious events. Safety attribution requires reconciliation; `reviewReady:false`.
3. **Tehran problem-solving, PMID30344863:** body calls the design quasi-experimental, selects two networks for arms and also mentions random assignment of women. Unit of allocation and cluster adjustment are unclear; zero crosses and `reviewReady:false`.
4. **CPT, PMID39488744:** full text explains 62 randomized/60 analyzed, but its anxiety and later violence results contradict the abstract. Deferred, `reviewReady:false`, `reviewReadiness:needs-source-check`.
5. **Gestalt, PMID34703783:** body reports 80 enrolled/70 analyzed versus abstract N=60, self-esteem means exceed the stated scale range, and F/p-value reporting is questionable. Deferred with no design cross.

These are source limitations, not denied actions or pending approval requests. Some PMC browser pages returned a challenge; official Europe PMC XML successfully supplied selected papers. Full-text access remains limited for other abstract-only records. Crossref metadata checked identity/update relations for 29 of 32 papers; two returned HTTP429 and one DOI lookup returned404. No comprehensive publisher/Crossmark retraction audit is claimed.

## Deliverables

- `candidates.json`: final 32 records, including explicit readiness and pending-human-review fields.
- `screening.json`: 130 title/abstract screening decisions and reasons.
- `search-log.json`: actual API queries, retrieval counts, overlapping per-query screened counts and timestamps.
- `source-ledger.json`: per-publication evidence URLs, access level, identities and unresolved checks.
- `counts.json`, `study-families.json`: auditable counts and family membership.
- `retrieval-queue.json`: unassessed retrieved identities for future work, with no implied screening.
- `private/`: locally retained API/XML evidence. Exclude this directory from Git, deployment and public retrieval inputs.

Schema presence, cross bounds, pending-review states and source/outcome presence were checked for all 32 records. Public outputs contain factual paraphrases and links, without copied abstracts or full articles. No automatic approval review rejected a worker action.
