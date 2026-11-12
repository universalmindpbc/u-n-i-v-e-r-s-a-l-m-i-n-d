# Funded research access — staging candidate

The portal adds one included study per existing I AM access code, with a US$25 complete-study ceiling and US$100 shared reservation pool. The original OXTR study is a worked example, never a compulsory question, program count, shot count or geometry.

The signed-off conversation, workflow diagram, result summary and report views remain in place. The visitor provides a research question. Astra prepares a numerical model; Wolfram Quantum Framework evaluates its Hamiltonian; CUDA-Q and an independent numerical calculation check it; Gemini reviews the design; the visitor reviews a plain-language proposal. Hardware launches only after confirmation of that exact proposal. Measurements return to Astra and Gemini for interpretation and evidence review, then appear automatically in the existing conversation and reports. Model agreement does not establish scientific truth or clinical benefit.

Current execution supports Aquila global-drive AHS through Braket. Larger or incompatible designs stop with a dependency rather than substituting OXTR. The local exact simulator supports up to 12 atoms; this is a current verified implementation limit, not a platform vision or a requirement to use a particular gene. Other Braket executors remain future integrations.

Passwords use the existing server-side I AM verifier and never enter the models. Each code maps to an opaque signed identifier. A durable transaction reserves each credit once. Repeated clicks, reconnects and browser resets cannot duplicate it. Paid requests are journalled before submission; uncertain outcomes retain reservations and stop for reconciliation. Fresh device parameters and prices are checked again before submission. Neither AI can raise the budget or change permissions.

Model usage is bounded by 64,000 Astra tokens and provider dollar ceilings (US$3.20 Astra, US$0.50 Gemini). US$2 is reserved for the bounded worker, dispatcher and storage; hardware must fit the remaining US$19.30. No paid GPU job is provisioned. CPU numerical verification uses the existing pinned CUDA-Q runtime in a separate staging Lambda. The shared production worker is unchanged.

No hardware verification run is authorised for this corrected candidate. Unit fixtures and a fresh Wolfram/local simulation check verify the wiring without using a portal credit. Live hardware execution remains unverified until a visitor reviews and launches a real study.

## Checks

- `node test_demo.mjs`: signature/audience/owner boundaries, atomic credit pool, confirmation digest, full record retention, queue isolation.
- `python test_worker.py`: variable programs/shots, device constraints, study cost ceiling, uncertainty handling, explicit confirmation and submission idempotency.
- Container build runs `verify.py` against a fresh saved Wolfram reference; Lambda verification repeats the Wolfram calculation and CUDA-Q comparison without models or hardware.
- Browser fixtures cover text commands, login, proposal, automatic progress and findings, record download, reload and no duplicate launch on desktop/mobile Chromium/WebKit. A separate live API check verifies OpenAI command interpretation on staging.

This file describes the candidate design. Release evidence records actual completed checks separately.
