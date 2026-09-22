# Four-task production release and detailed QA — 22 September 2026

## Release result

The exact approved staging source `5350ea33b3f9363df3f0e65146f380cfc1069ac8` was published to production with the existing Panthur workflow. The source includes all four named tasks. Three feature groups are operational in production. **Universal Sovereignty's private production archive is not active.** Its current implementation deliberately restricts vault delivery and provisioning to staging. This report does not claim all four features are operational.

Production entry points:

- [Research login](https://universalmind.tv/study)
- [Music Television and live audio overlay](https://universalmind.tv/vogue/iam/index.html?quantumTreeMonitor=1)
- [Audio calibration dashboard](https://universalmind.tv/vogue/iam/quantum-tree-control.html)

## Version and deployment integrity

- Previous production: `bde134bada6cb8432247e494be38a4bf68cacee8`.
- Approved staging source: `5350ea33b3f9363df3f0e65146f380cfc1069ac8`.
- Clean isolated checkout; no website source changes during this release.
- Existing command: `./deploy-panthurlive.sh all-changed`.
- 37 changed files uploaded; 1,038 unchanged files skipped.
- Deployment completed successfully and confirmed protected owner runtime state unchanged.
- 24 changed public assets matched staging and production byte for byte.
- 14 changed PHP/server-policy files independently matched production over certificate-verified FTPS.
- Production test pages return 404. Private documents and runtime paths return 403.
- The Git commit containing this report adds only deployment metadata and QA evidence; its annotated production tag records the release.

## Task-by-task results

| Task | Published behavior | Verification and result |
|---|---|---|
| Add pre-song chatbot section | Approved four-message reflection after baseline, before music; expanded opening welcome removed | Desktop and mobile; progressive text; Continue/Skip; reduced motion; saved choice/version; reload persistence; hidden paused player before start; actual Empire Of The Sun playback after the final action — passed |
| Add IAM research pilot login | Clean password gate, Research → Participate, fixed natural-ending handoff and retries | Live production gate/API and native player; staging natural ending → after-check → Heart Check UI → surveys → results → navigation unlock; delayed, dropped and repeated completion responses — passed within the test boundaries below |
| Expand quantum tree audio overlay | Programme, Quantum Tree, synth and mantra statuses, volumes and clocks; primary pulse and lane percentages; corrected dashboard click regions | Production mix diagnostics, real decoder progression, renderer output, pause/resume and stop; desktop/mobile/landscape geometry; 80/80 click locations in Chromium and WebKit — passed |
| Plan Universal Sovereignty MVP | Private archive source and HTTP privacy rules included | Encryption/signature/idempotency tests passed; live staging four-vault status confirmed. **Production archive inactive; activation is pending a separately verified production setup** |

## Pre-song reflection

The full read, skip and reduced-motion journeys passed on staging. The reflection appears only after saved baseline responses. Exposure is zero and the embedded player is paused before starting. The four approved messages and lyric match the protocol, no response field is required, and the read/skip choice is stored with the script version. Reload does not repeat a completed reflection.

The same three journeys also passed with the production-served HTML/CSS/JavaScript and an isolated staging preview backend. This proves the published interface and media path without adding synthetic records to the production cohort. The production API independently reports protocol `2026-09-22.1`, reflection `abandonment-reflection-2026-09-22.1`, and no expanded onboarding welcome.

The chatbot is a fixed animated script. It makes no GPT/OpenAI request.

## Study completion and access

Nineteen isolated PHP API test groups passed, covering origin/CSRF checks, authentication scopes, consent ordering, the ten-person cap, returning participant isolation, survey bounds/order, reflection idempotency, missing measurements, withdrawal, rewards and completion recovery.

On staging, the actual final 30 seconds played to a real HTML media `ended` event. The after-check appeared, the stopped player remained hidden despite late callbacks, the real Heart Check interface opened, synthetic scan values were saved only to isolated test storage, all after-surveys completed, results appeared and navigation unlocked. Reload created a fresh ending test. A second run deliberately delayed a request, simulated a lost completion response and verified retry recovery without invented exposure time.

On production:

- Clean one-field password login and the configured website-password mode are present.
- Invalid password, preview and researcher-dataset requests were rejected with 401/403.
- No participant record was created during these checks.
- Research → Participate opens the top-level login from ordinary playback and simulated standard/WebKit fullscreen state. Playback pauses and navigation waits for exit completion. No native fullscreen was invoked.
- The published research player loads Empire Of The Sun x Pryda — We Are The People, shows the 8:08 timer, advances playback and keeps navigation controls inert during the session.
- Both isolated ending-test routes return 404 in production.

The production player test used a browser-only session fixture, not a real participant. Full state-changing study QA used staging. No claim is made that a real participant completed a live production session during this release.

## Audio overlay and dashboard

Live production tests verified the random no-check-in Music Television route without a fixed track parameter. The latest integrated source intentionally leaves an unselected public session without an inferred frequency; the dedicated mix test explicitly selects its session settings. The owner calibration synth defaults to Alpha 10.11 Hz, 80% mix power and a 222 Hz carrier.

The overlay's Delta 3.33 Hz, Theta 7.38 Hz, Alpha 10.11 Hz and Gamma 111 Hz percentages match the renderer's power weights. Secondary lanes show 6.66%, with 0.01% each for noise and silence reserve. These percentages are separate from overall output volume. Changing the session profile and carrier updates the live primary label, weights and measured output.

Programme, Quantum Tree and mantra positions advance with real playback; synth runtime advances with rendered frames. Mantra disable, AudioContext suspension, Sound master disable and programme pause correctly freeze or zero the associated clocks/output. Dashboard cold-start Play together starts all three layers with one click. Isolated play, pause/resume, sliders and Stop all also passed.

All 80 button positions passed across desktop/mobile Chromium and WebKit. Playback tests used only process-muted Chromium. Overlay and dashboard layouts passed desktop, mobile and landscape checks. DSP clock tests passed at 44.1 and 48 kHz; the adaptive session suite passed 538 assertions across 20 band/carrier combinations, and Python policy checks passed all 20 combinations.

## Sovereignty status and outstanding activation

The exact approved source rejects production vault delivery under the free staging plan, and its private runtime is excluded from ordinary deployment. No production vault credentials, signing/identity keys, queue or cron were provisioned. Production status currently returns 503. That is an inactive archive, not a successful four-copy production integration.

The live staging status shows four configured private Backblaze vaults and four secured copies for its one recorded entry. Its background scheduler is installed and has completed a recent run. Bitcoin confirmation remains pending. The approved arrangement uses one provider/account, 30-day retention and staging keys expiring 22 October 2026.

A decision was requested during this release on preparing that same capped $0/30-day arrangement for production versus leaving it inactive. Production activation requires a source/configuration change, staging verification and the corresponding approval boundary. The initial request to publish the exact staging version was completed without silently converting the staging-only archive into a production service.

## Existing study readiness state

The production gate remains open as previously approved. Its API still reports `readiness.ready=false` and these outstanding fields:

- Heart Check verification.
- Combined video/experience verification.
- Participant materials and research review.
- Study contact.
- Data retention period.

These flags were preserved. Passing this technical release QA does not fill those fields or establish research readiness, camera accuracy or clinical efficacy.

## Test limits and safety

- No production participant, biometric, survey or reward data was created or changed by QA.
- No real participant password was entered; valid-password behavior was exercised with synthetic credentials in isolated PHP.
- No camera or microphone was enabled. No native macOS/browser fullscreen was entered.
- All media QA used separate Chromium processes launched with `--mute-audio`; all automated media sessions were stopped and closed.
- Subjective sound quality and an uninterrupted eight-minute study run were not assessed.
- Existing researcher AI analysis was not changed or re-exercised.
- Full machine-readable evidence is in [four-thread-production-2026-09-22.json](four-thread-production-2026-09-22.json).
