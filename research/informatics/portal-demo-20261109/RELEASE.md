# Question-led funded studies — staging release, 9 November 2026

The approved Quantum Atlas experience now supports I AM portal access and a funded study designed around the visitor’s research question. No OXTR topic, 16-program batch, 100-shot count or reference geometry is imposed. The existing conversation, workflow diagram and scientific report views remain intact. Device, shot and cost details are available in a collapsed section beneath the plain-language proposal. The approved mental-health vision copy and Wolfram Quantum Framework label remain visible.

## Deployed components

- Panthur website source: `23f23195d`; 34 changed tracked assets uploaded by the existing staging FTP transport.
- Cloudflare staging broker: `cecbe658-1ac3-4c1c-8e8e-8f867bf4647b`, with separate portal authorization, atomic credit reservations, reviewed-plan confirmation and full private result records.
- Scheduler verification: CloudFormation `UPDATE_COMPLETE`, EventBridge `ENABLED`, dispatcher returned `idle`; no study was launched.
- Isolated AWS stack: `informatics-portal-demo-staging`. Worker image `sha256:c9f8df154882d6d45ce54833b14512df7ed9f22a64f698b2cf4ffedea0f3d0b6`, source bundle `8044b5ec95377542ee262a961ccedd5a9fbe8709f6221b77aad99e83d32e26fc`.
- Permission correction `0d78a1f3d` uses the account-qualified Aquila authorization resource. The public device ARN remains the API input. Readiness successfully retrieved device state and current official prices.
- Dataset version `1062e86d2ea6c5c94d5c4b647ddd3b08dd49d7733d1806f790298cfb53787f24`.

## Completed verification

Nine worker tests and the broker tests cover variable programs and shots, cost ceilings, uncertain provider outcomes, explicit confirmation, idempotency, portal signatures, origin isolation, owner isolation, atomic four-study admission, full-record retention and queue separation. A release contract confirms the approved page structure and existing scientific views are preserved.

The deployed website passed desktop/mobile Chromium and WebKit checks with controlled study responses: portal entry, question preservation, optional technical detail, review before launch, automatic findings, full record download and reload without another run. These fixtures do not claim a paid hardware experiment completed.

A real staging chat command reached OpenAI and displayed the response in the interface while opening portal access. The provider returned `portal_access`, 692 input tokens and 21 output tokens; conservative charge US$0.0097. The earlier US$0.20 test ceiling stopped before any paid call. US$0.05 of unused voice-test reserve was reassigned within the existing US$2 overall allowance; the uncertain US$0.88 research reservation remains retained.

Fresh Wolfram Quantum Framework calculations and independent SciPy/CUDA-Q calculations passed inside the deployed Lambda for a two-atom reference and an asymmetric three-atom model with varying phase. The largest observed Wolfram-reference probability difference was 8.32e-7; CUDA-Q difference stayed below 6.02e-5. No model API or hardware task was used for numerical verification.

Deployed JavaScript and export manifest hashes match committed source. The portal PHP executed and rejected a synthetic invalid password. Valid-code authentication is covered by the existing shared verifier and signature tests; no private portal password was entered during this verification. The full JSON/CSV exports each reconstruct all 1,195 source files. Discovery checks passed across 2,403 HTML pages and 29,797 local links. Historical Nov-1 fixed-baseline reading tests remain unchanged; current checks validate this release’s 30 implementation hashes.

## Funding and actual limits

One study per code reserves up to US$25 from the US$100 pool. Astra is capped at 64,000 tokens and US$3.20; Gemini at US$0.50; hosting reserve is US$2. Hardware fits the remaining US$19.30 per study. The account’s Aquila spending ceiling is US$99.30 including US$22.10 historical spend, leaving at most US$77.20 hardware allowance for four studies over the 30-day demo window. No new GPU allocation is enabled.

The funded pool remained US$100 available at verification. No portal credit or new QPU task was used. Actual paid hardware execution remains unverified until an authorized visitor reviews and launches an experiment. Current execution supports Aquila global-drive AHS, with a bounded exact-simulation capacity; other Braket devices require additional executors. Missing scientific inputs or incompatible designs produce a clear dependency instead of invented inputs or a replacement OXTR question. Agreement between models is a check, not proof of scientific validity.

## Preservation

Production website branch `main` remains `02b6f47345e428021dcae8fd4a798ecdfb03969b`. No production web assets or shared CPU worker image were deployed by this release. ECR retention was increased from two to twenty images to preserve the existing production and rollback images while staging builds were added. Two obsolete uncommitted export generations were removed (470,118,303 bytes); original datasets, tracked release files, conversations and logs were preserved. Available disk space remains approximately 42 GiB.

Proof: https://staging.universalmind.tv/informatics/quantum/
