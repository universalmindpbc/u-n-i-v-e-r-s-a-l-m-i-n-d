# Recovery revision — 11 September 2026

This revision supersedes conflicting UX, measurement-duration, scheduling and payment descriptions below.

- One screen each: briefing/consent, pre-scan, happiness, stress, connection, written response, existing M8 experience, post-scan, happiness, stress, connection, written response, rewards, results.
- Original emoji order; stored integers 1–10, displayed as 10–100% of the scale. Change is `(after-before)/abs(before)*100`, not percentage-point change or a population percentile. Missing or zero baselines yield no percentage. Logged RMSSD is exponentiated to raw RMSSD before percentage comparison.
- Existing UM globe artwork and flower identity, compact layouts, legible rounded controls, no participant-facing technical narrative and no results table.
- Ten-second Shen scan by default. Owner activation of BP switches to the existing one-minute preset; no 0.1 Hz power is inferred from a ten-second recording.
- Peter Gabriel’s Sledgehammer is the requested temporary Stream item, shown through the actual M8 viewer and existing sound components, looping to cover the ten-minute slot. Preview plays the same experience in an isolated preview record; its explicit After check control can shorten proofing without claiming full exposure.
- Three organiser-set sunrise/sunset/midnight livestream dates within one week; no participant scheduling. Live entry opens five minutes before the shared video start. The video joins the common event timeline and closes at the shared end. Dates remain unconfigured until supplied.
- $100 earned only after all three sessions complete; no onboarding, per-session or prorated payments. Payment recording requires the full earned amount and is idempotent.
- Results show actual before, after and signed relative percentage change. Participant/session selectors preserve pairing; aggregate paired values weight participants equally. Physiological changes are described by direction, without inventing a clinical improvement judgement.

The original implementation below is historical context, not the current UX specification.

---

# Universal Mind N=10 pilot

This is the separately consented, single-arm feasibility pilot agreed on 11 September 2026. Ten adult women recruited through personal networks receive the combined experience in three sessions over one week. Veteran status is not required. This pilot informs future research with young female veterans; it does not estimate a randomized treatment effect.

The versioned participant wording, user-supplied ten-emoji order and fixed configuration are in `i  a m/study/protocol-v1.json`. Happiness is explicitly coded 1–10. Stress and connection are separate 1–10 questions. Written before/after responses are optional. The source emoji image is preserved intact and displayed through CSS windows.

## Entry and session

`/study` redirects to `/vogue/iam/study.php`. `/study/dashboard` opens researcher access. Each invited participant receives a random access code; the server retains only its SHA-256 hash. The existing owner password authorises researcher administration. Separate stakeholder codes expose aggregate results, with no individual rows or quotations. The staging walkthrough uses a separate random private store and never enters the cohort.

Briefing and consent → one-minute Shen scan → ratings and written response → ten-minute existing M8 experience → one-minute Shen scan → the same ratings and written response → participation record and personal results. Each transition is checked on the server against the signed-in participant and session. Stop is always available; it halts the experience and preserves previous saved responses. Interrupted sessions remain visible. Withdraw optionally removes the response fields and invalidates analysis.

The experience adapter uses the existing M8 presentation, Quantum Tree, existing 111 Hz isochronic lane through the Inspiration / Gamma profile with a 444 Hz carrier, and sub-audible mantra. Existing profile lane weights are unchanged. It does not add a signal generator. The fixed study video is selected by its uploaded Stream UID, independently of the ordinary adaptive programme. Native browser fullscreen is not invoked. The player occupies the study viewport, hides the site's navigation, and is paused when the page is hidden. Playback heartbeats distinguish watched time from seeking, interruptions and reported sound/preset fidelity. A fully watched video can proceed to post-report even when component fidelity was incomplete; fidelity warnings must be retained in interpretation, not represented as full combined-intervention delivery.

## Measurements

The ordinary optional Heart Check keeps its 10-second Quick HR behaviour. Only `research.php?study=1` requests `ONE_MINUTE_ALL_METRICS`, checks consent and the current measurement step, and saves full study results. Raw camera video is not stored by this study. No microphone is requested.

Whitelisted SDK fields are heart rate, SDNN, **lnRMSSD** (not raw RMSSD), systolic and diastolic BP, available signal-quality metadata, and timestamped beat intervals. Unlicensed or missing fields stay null and do not enter that metric's paired denominator. BP is the SDK estimate, not beat-to-beat BP. Real BP/HRV entitlement and camera performance require verification after the trial is activated.

The exploratory 0.1 Hz endpoint is integrated pulse-interval spectral power in **0.085–0.115 Hz**, in ms². This is a fixed exploratory band, not a validated baroreflex-sensitivity endpoint or a HeartMath proprietary score. A 60-second recording contains about six 0.1 Hz cycles; its roughly 0.017 Hz bin spacing limits peak precision. It cannot reliably resolve the full low-frequency band as a longer conventional HRV recording can. Before/after conditions should match: posture, lighting, camera, duration, and natural breathing. Breathing, time of day, camera quality and artefacts can affect changes.

The server requires at least 55 seconds of continuous usable interval midpoint timestamps from a one-minute measurement. It rejects short, inconsistent, discontinuous or very low-variation series. It linearly resamples at 4 Hz, removes a linear trend, applies a Hann window, and calculates a one-sided periodogram with window-energy normalization. Fractional bin overlap integrates the fixed band. The accepted spectrum, method version, usable duration, frequency resolution and source intervals are retained. Quality checks are pragmatic pilot criteria, not a clinical validation of camera-derived HRV. Severe interval outliers are rejected; no missing beats are imputed.

Sources checked: [Shen configuration](https://developer.shen.ai/getting-started/configuration), [Shen result fields](https://developer.shen.ai/video-measurement/results), [HeartMath's 64-second window](https://kb.heartmath.com/en/how-is-coherence-measured-in-heartmath-devices), [HeartMath coherence method](https://www.heartmath.org/research/science-of-the-heart/coherence/). A coherence-style HRV spectrum alone cannot establish baroreflex sensitivity; that requires paired beat-to-beat pressure and interval analysis.

## Results and access

Code calculates paired within-session changes, then each participant's mean across available sessions. Minimum, median, mean and maximum describe those participant means; n is the available participant count, not 30 independent observations. The happiness donut includes increased, unchanged, decreased and unavailable responses. Physiological changes are not automatically classified as beneficial. Missingness, interruptions and negative responses remain in the dataset.

GPT-6 Astra at API `max` reasoning receives computed summary statistics and researcher-reviewed, de-identified excerpts. It drafts an executive summary, findings, limitations and coded themes (improved/unchanged/worsened/mixed/unclear) with supporting excerpts. It cannot change the numerical source data. Input/dataset hashes, model, prompt version, response ID and review status are saved. Changed data invalidate the draft. Stakeholders see only the reviewed executive summary and aggregate statistics. OpenAI request storage is disabled with `store:false`; this setting does not constitute a promise of zero provider retention.

Records are coded/pseudonymised while the organiser keeps identity/payment links separately; this is not a claim that a ten-person free-text dataset is irreversibly anonymous. Private response storage is denied by Apache and uses restrictive filesystem permissions. A configured retention period is enforced before the next read or write, removing expired response fields and derived analysis; minimum participation/payment records remain. The organiser must select the retention period and provide a study contact before enrolment opens.

## Preparation and verification

Enrolment defaults closed. The owner must supply the video, verify the Shen trial and real measurements, confirm participant materials/research review and support arrangements, and set the contact and retention period. Uploaded media must support the agreed full ten-minute duration. Nothing in the walkthrough claims those external prerequisites are complete.

A$100 total is recorded as A$25 onboarding and A$25 per completed session. Stopped-session time is prorated at A$100/hour up to A$25. This is a participation ledger with the existing rewards-card image; it does not automatically transfer cash or create a wallet balance. Actual payments are recorded separately and retry-safe.

Local checks: `tools/test-study.php` verifies spectral normalization, frequency discrimination, duration/continuity rejection, null handling and participant-weighted statistics. `tools/check-study-api.mjs` runs PHP 8.3 in an isolated WASM filesystem and exercises sessions, consent, state order, input bounds, researcher/participant/stakeholder scopes, payment idempotency and withdrawal. Synthetic records are test fixtures only. Staging requires a real browser walkthrough plus a real owner-authorised OpenAI response before the GPT connection can be described as verified.
