# Adult therapy methods continuation

Five existing candidate records from `batch-8bd70e21e48d9a70` were reassessed, representing four existing study families. **No new publications, independent studies or participants are added to the mission count.** Four target papers now have full-text appraisal; WEAVE2013 remains abstract-only, with later primary evidence explicitly attributed under `relatedFamilyEvidence`. All five proposals remain pending human review and retain one design cross.

Files:

- `proposed-candidates.json`: complete proposed records, original IDs and exact `priorContentHash`; no new `contentHash` or approved revision is minted.
- `field-deltas.json`: field-by-field before/proposed values and claim-level evidence.
- `source-evidence-ledger.json`: primary URLs, access dates, article sections/tables or BioC passage locations, and supported changes.
- `SAFETY-ADVISORY.md`: concise material safety and durability findings for the active reviewer.
- `checkpoint.json`: counts, file integrity hashes and validation result.
- `access-log.json`, `hope-access.json`, `access-limits.json`: successful retrievals and unresolved access constraints.
- `private/`: source text retained for checking only; do not publish or deploy these source copies.

| Target | Evidence change | Confidence implication |
|---|---|---|
| HOPE172, PMID34305273 | Full manuscript verifies urn randomization, masked assessors, treatment and follow-up denominators; no comparative superiority; 10 higher-care treatment removals. | Stronger methods knowledge, without an efficacy upgrade. Author's double-blind label and common names do not explicitly establish the participant masking role. One cross retained. |
| Nguvu, PMID34143803 | Adjusted effects include/touch zero; no clear IPV benefit; only 58.2% completed ≥6 sessions; exploratory high-IPV subgroup worsened; 3 events judged unlikely related. | Weaker basis for a simple positive efficacy summary. Short follow-up, baseline imbalance and completion-related selection matter. |
| Ethiopia PST, PMID37889918 | 17/52 used the wrong allocation table; 25% missing assessment; one serious husband-assault event; provider fidelity concerns. | Feasibility evidence, not an efficacy conclusion. Assault arm/attribution remains unreported. |
| WEAVE24, PMID33303427 | Full methods and outcomes confirm no comparative benefit at 24 months; 166/272 respondents; prior secondary depression advantage not durable. | Durable comparative benefit unestablished. Null does not mean equivalence. |
| WEAVE2013, PMID23598181 | Own access stays abstract. Shared methods, later null findings and safety qualifications are separately attributed to same-family sources. | Original primary-null/secondary-positive pattern retained, with durability and harm caveats. No independent replication. |

The same-family WEAVE harms abstract reports negative emotional and retraumatization experiences despite generally positive participation feedback. It supplies no usable counts of intervention-caused harms. It qualifies, rather than directly contradicting, the original statement that no adverse events were recorded.

Remaining limits are precise: the 2013 WEAVE paper returned HTTP403 on the attempted ScienceDirect and Lancet full-text/PDF routes; the university-hosted harms record explicitly provides only its abstract. No blocked route was retried unchanged. HOPE's participant masking role remains unresolved because no linked registration/protocol identifier was established in the accessed manuscript; no new identifier was guessed. Ethiopia's assault attribution and Nguvu's reversed cluster-arm counts in narrative versus Table1 are reporting limits, not evidence to fill by inference.

Validation checks matched all five original IDs and prior hashes to the frozen staged batch; all proposal review states are pending; all crosses remain1; no new revision hashes exist; duplicated display fields match extraction fields. SHA256 confirms the staged batch and original adult worker file were unchanged during proposal generation. No Git, deployment, paid service, installation or third-party contact occurred.

Next step for the coordinator: review the safety advisory, then decide whether to create a separate new batch revision from these proposals. Do not silently overwrite the batch already supplied to Ben. No production use or human approval is implied.
