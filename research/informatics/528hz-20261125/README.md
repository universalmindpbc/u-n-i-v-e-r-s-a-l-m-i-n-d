# 528 Hz research update — 25 November 2026

Scope: expand Sound chapter 1, subsection ii, include the broader tuning family, assess research quality, apply the existing two-cross threshold, and make research visits start on white. Production authorization remains separate.

## Source reconciliation

The supplied one-page PDF contains 11 distinct links. One is Café del Mar radio. The ten research-related links represent eight publications: CABI duplicates the REDVET paper (title confirmed by Ben), and Mental Health Daily reports the Cureus trial. Four original references plus eight additions give 12 distinct publications. Bhoot already existed elsewhere in the library; its canonical identity is reused.

| Publication | Design status used | Relevance |
| --- | --- | --- |
| Bozok et al., 2026, 10.1002/brb3.71452 | Completed RCT; reported block allocation | Explicit 528 Hz arm; exploratory salivary biomarkers |
| Bhoot et al., 2025, 10.1177/09727531251390261 | Completed RCT; reported WINPEPI allocation | 528 Hz OM listening alongside standard care |
| Heti and Yeshaswini, 2024, 10.69980/redvet.v25i1S.787 | Reported randomized controlled experiment; serious reporting weaknesses | Pure-tone anxiety experiment |
| Ravikumar and Sathyanarayanan, 2026, 10.7759/cureus.115693 | Completed RCT; lottery allocation | Recorded 528 Hz within a multicomponent meditation programme |
| Pomazan, 2023, 10.1145/3634848.3634863 | Author-reported RCT; sequence details unavailable | Related sound device; delivered 528 Hz unverified |
| Unhale et al., 2023, 10.53555/jaz.v44iS8.3467 | Reported randomized-block experiment; RCT eligibility unresolved | 379/430/528 Hz; ambiguous allocation/repeated-exposure structure |
| Khalisha et al., 2026, 10.1109/ABC68169.2026.11567273 | Publisher-deposited metadata verified; methods unavailable | Board game/sound research lead; frequencies and randomization unverified |
| Feneberg et al., 2020, 10.3389/fpsyt.2020.518316 | RCT protocol; no outcomes in this publication | Frequency-filtered music methods, no specified 528 Hz arm |

Five completed publications describe randomized controlled designs; four explicitly include 528 Hz. The four meet the existing subchapter threshold of at least three distinct RCTs. The badge reports design and volume, separate from certainty or efficacy. No new paper receives verified double-blind status. Search-result labels are discovery aids; the recorded classifications follow the methods available in each publication.

Primary publisher full texts, the Cureus PDF and the author's conference manuscript were examined. IEEE methods and the CABI page remained inaccessible. The source review distinguishes these access limits and preserves the title confirmation as provenance.

## Research interpretation

The expanded collection supports a small, active research area with preliminary short-term anxiety, blood-pressure and cortisol signals. Results vary by measure. Bhoot's HRV interactions and between-group sleep/wellbeing results include non-significant findings; Bozok's BDNF table conflicts with the abstract; Unhale's ratings favour 430 Hz on several outcomes. The studies examine different interventions and do not collectively isolate tuning as the cause of benefit. The original animal, cell and auditory references remain labelled as background evidence.

## Implementation and validation

- Source appraisals, summaries and topic counts are synchronized with canonical library records. Original source extracts remain archived.
- Interactive research starts on white despite a saved dark preference, resets across navigation and paper opening, and retains manual controls for the current view.
- Static research readers use white CSS. The reading generator refreshes dependent source hashes and current connector documentation. Universal One now retrieves the same 12 appraisals and chapter through the existing Worker, REST and MCP mechanisms; new records enter the shared publication export union.
- Data QA checks 12 distinct publications, five reported RCTs, four qualifying explicit 528 Hz trials, two crosses, and unchanged unrelated Sound topics.
- Browser QA uses separate headless Chromium with `--mute-audio`, blocked media playback/requests, no microphone and no native fullscreen. It covers desktop and mobile, collections, paper dialogs, search and the static reader.
- Complete JSON/CSV reconstruction, discovery checks and deployment verification are recorded alongside this file as they finish.

The one-off `update.py` records the original import operation; its assertion prevents reapplication over the expanded chapter. `source-review.json` retains the final appraisals. Only source and compact verification evidence enter Git; downloaded third-party articles remain outside the repository. Age and community builders retain 62 later published classifications absent from the older audits while adding the new records.

## Completed staging release

Source commit: `7c1f5c6b09c44d76d8ba2b27bd15309b961b0865`. Worker version: `fd8be770-769d-4777-9adc-5afd574dd428`.

All 59 changed Panthur assets match the committed bytes. Complete JSON and CSV reconstruct all 1,203 structured sources. The public retrieval exports reconstruct all 1,136 records identically, including exact matches for all 12 chapter appraisals; REST and MCP agree. Desktop/mobile navigation and two real rendered, cited GPT-6 Astra answers passed. Production service health and inventory fingerprints remain unchanged. The two-answer QA conservative usage bound was US$1.348075.

Proof: https://staging.universalmind.tv/informatics/research/?collection=sound&chapter=1#topic-ii

Production has not been modified.
