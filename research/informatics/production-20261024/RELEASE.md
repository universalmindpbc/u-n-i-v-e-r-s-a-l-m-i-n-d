# Informatics production release — 24 October 2026

Ben explicitly approved publication of the entire completed Informatics staging website, including the Molecular Atlas animations. The approved staging reference is `6411df6646853c7da118ca8edb74ac3ee4b049b0`. Prior production is `d82c7ae080a5236cd1029bd9605d7b4e3988feb4`.

## Production configuration

Source `a3e4ab3c` enables the existing Universal One interface on the production hostname, adds the dedicated production Worker configuration, and makes Atlas citation links use the active site origin. Approved research wording, grades, data and visual behavior are unchanged. Staging and production retain separate origins, rate-limit namespaces and usage counters. Both read the same research release. Secrets remain outside Git.

## Staging verification

The existing Panthur workflow uploaded the three changed frontend files after all preflights passed. Staging Worker version: `8d9cd994-0cf0-42bd-95d4-54c5a1de48e9`. The live research test passed 17 layouts across four widths, including black/white/video backgrounds, Research entry from the Atlas and network, paper overlays and standalone Research. A real request reached the research service and Astra, and a cited answer appeared in the interface. Live voice connected, greeted with Hi, decoded remote audio and retained its session when Research opened and closed. Synthetic microphone only; separate muted Chromium; media paused and browser closed. Visitor allowance was unchanged by QA. Details: `staging-ai.json`.

## Final release checks and pending credential approval

All 33 checked staged assets match committed source bytes, including the changed Molecular Atlas assets, calculated fields, Universal One, edition data and Atlas index. The complete live Quantum Teaching browser suite passes at 1470, 1024, 390 and 320 pixels. It verifies actual animation pixels, pause, modes, state export, camera interaction, controls and overflow. The desktop screenshot was visually inspected. Reports: `staging-assets.json` and `staging-molecular.json`.

The dedicated production Worker has been provisioned from the verified bundle: `informatics-universal-one`, version `2dc4a548-3200-4eb4-be1e-31a0a89738ba`. Automatic approval review rejected transferring DATABASE_URL, OPENAI_API_KEY and QA_TOKEN into this Worker, stating that explicit authorization for the credential destination is required. Ben has been asked to authorize that specific transfer. No transfer occurred. The existing production website and `main` remain unchanged; the Panthur production publish has not run.

After credential approval, configure the production Worker, deploy the already verified frontend through `./deploy-panthurlive.sh informatics`, repeat the real AI and Molecular Atlas checks on production, verify served hashes, record the production manifest, and create/push the annotated production tag with `main` and `staging`. QA commands accept `UO_ORIGIN`, `UO_ENDPOINT`, `UO_QA_OUT`, `ATLAS_ORIGIN`, `ATLAS_LIVE` and `ATLAS_QA_OUT` for the production run.
