# Quantum chat staging QA — 10 November 2026

The approved CPU-only study completed through the staging chat. Astra Max produced its report; Gemini High approved both the design and final findings. Progress updated automatically, and fresh desktop and mobile sessions restored the completed study and opened its findings. No new quantum hardware or paid GPU job ran.

## Deployment

- Website source: `310693fff`, integrating the completed E8 staging baseline `fb87147dd` with the Quantum chat repairs. Existing wording, controls and diagram layout remain intact.
- Panthur: 31 changed files uploaded through the existing staging deployment script. The current complete dataset is `bf4b854abc36cb40ac3a5aead64feb9804b3679045d2c79f2b833ab51e3bf450`; both JSON and CSV reconstruct all 1,196 source records.
- Final live hash audit: 17 files, including every changed mutable Informatics file and every current dataset part, match committed source. Raw served hashes are retained; only the established Cloudflare analytics injection is excluded for HTML comparison. Earlier immutable export revisions retain their earlier verification records.
- Cloudflare staging Worker: `4a0a0b17-7a38-432c-9739-5c8332762398`. Opus has a US$3 total staging allowance and the existing US$0.75 investigation cap.
- Approved shared AWS Worker image: `sha256:c2ef2a3900b17c5ee2c913bea37fd7dedf2ee62296262e5aadae9f212d26c642`. CloudFormation completed; Lambda is active. The template, other parameters, environment and role match their prior values. The build passed 22 tests.
- Production website files and settings were not deployed. The shared runtime image changed under Ben's explicit approval.

## Live checks

| Journey | Result and evidence |
| --- | --- |
| Text question to Astra and cited response in chat | Passed; `staging-live-text.json` |
| Ordinary scientific conversation | Passed without provider-status diagnostics; `staging-live-normal.json` |
| Dictation to text submission | Synthetic speech transcribed and submitted; `staging-live-dictation.json` |
| Inline live voice | Real WebRTC response and transcript, inline waveform and hidden floating dock; `staging-live-voice.json` |
| Astra to Perplexity Agent to Astra | Real `anthropic/claude-opus-5-5` quantum-literature handoff with citations; `staging-live-agent.json` |
| PubMed, Europe PMC and original-paper retrieval | Live retrieval and redirect regression passed; `runtime-live.json`, `runtime-regression.json` |
| Browser and responsive layout | Chromium and WebKit at desktop and narrow widths; background modes, candidate genes and unchanged prompt checked; `staging-ui.json` |
| Rich response formatting | Emphasis and citation links render; user text remains literal and HTML is not injected; `staging-chat-format.json` |
| Existing emailed results link | Fresh sessions open findings automatically at 1440, 390 and 320 pixels; invalid access rejected; no new email sent; `saved-results.json` |
| New completed study | Live automatic progress, report and downloads; `new-study-verification.json` |
| Return to new study | Fresh 1440 and 390 pixel sessions restore the answer and open/close findings; no paid calls; `new-study-delivery.json` |
| Download integrity | JSON and CSV agree across 5,061 fields; both review inputs and receipts retained; `new-study-download-integrity.json` |

All browser media checks used a separate Chromium process with `--mute-audio`. Synthetic speech was used; no real microphone or audible playback was activated. WebKit layout testing does not establish native Safari microphone quality. Automated browser processes closed after testing.

## Study recovery and spending

Study `7c15c156-c1cb-4332-8f08-822156fb366b` initially paused after an incomplete report. The corrected worker retains usage from incomplete outputs, obtains the exact input-token count before reserving a report call, and fails closed when a reservation exceeds the remaining allowance. Its 64,000-token path requests a concise reviewed summary; the legacy 24,000-token request remains unchanged. Full numerical and literature evidence remains in the report input.

The incomplete request was reconstructed and its fingerprint matched before reconciliation. Its retained conservative charge is 21,685 tokens: 4,277 exact input tokens, the full 16,384 output ceiling and 1,024 padding. Actual usage for that interrupted call remains unknown. The prior ledger archive was preserved and the updated archive used a conditional write. The same study resumed once; no second study was launched.

Total Astra usage including the retained interrupted allowance is **48,986 tokens**, with a conservative **US$2.4493** upper estimate under the approved US$3.20 ceiling. Gemini design and final review together recorded **US$0.280212**. These are usage records and a conservative estimate, not a provider invoice. The separate chat, dictation and voice QA ledger retains a US$1.553801 used-or-reserved upper total within its US$2 allowance.

## Scientific and verification limits

- The test reused the existing OXTR study recipe and recorded quantum measurements, with new local CPU checks. This test is not a restriction on future researcher questions or experiment design.
- The numerical result is inconclusive. It establishes neither improved binding-site prediction nor a clinical benefit.
- Initial PubMed and Europe PMC retrieval succeeded. A second pattern-specific search encountered PubMed rate limiting and a Europe PMC timeout. Literature coverage is partial and includes abstract-level evidence, not a comprehensive review. Both Gemini review inputs retain live literature.
- ENCODE's public binding-site API returned HTTP 403. Live measured-binding-site retrieval remains unavailable. Reference sequence, annotation, JASPAR motif models and literature access passed; motif models are distinct from measured binding sites.
- A separate GRIN2B Opus request returned a provider refusal. It was not rephrased to bypass that refusal. The successful Opus test establishes quantum-literature handoff; biological Opus research remains unverified.
- Both review packet hashes were recomputed successfully from the original S3 report in CloudShell. Browser JSON serialization changes number formatting such as `1.0` to `1`; browser-download bytes do not reproduce the original Python packet hashes. JSON/CSV value equivalence passed. CloudShell's original-file download failed, so no direct original-to-browser semantic comparison is claimed.
- The QA-specific report contains a sentence saying reasoning/review retention was not verifiable from the narrative writer's input. The separately retained settings, usage and review receipts verify Astra Max and both Gemini High approvals. The reviewed narrative was preserved rather than edited after review.

The current result supports staging proof of the chat, literature, Opus handoff and CPU study workflows. It does not establish unrestricted public-database access, arbitrary hardware selection, new hardware execution, or successful Opus biology coverage.

Proof: https://staging.universalmind.tv/informatics/quantum/
