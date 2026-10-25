# Astra: private Quantum Atlas execution

Implemented 25 October 2026. This is a bounded research service on the existing staging website. LangGraph owns execution and checkpoints. GPT-6 Astra interprets the calculated evidence. Gemini review, public computation, API/MCP/A2A task dispatch and an always-on hosted worker remain roadmap work.

## What a question starts

A visitor asks the OXTR/Fibonacci question in Quantum Atlas. The existing GPT router selects the supported recipe. The session-isolated broker creates one durable task, returns immediately and records progress independently of the browser.

The Python worker automatically:

1. Audits the saved 16 CUDA-Q GPU and 16 Aquila measurement records, and checks the saved Wolfram template receipt.
2. Retrieves reference DNA for chromosome 1 and chromosome 2 from UCSC, using downloaded GRCh38 OXTR DNA, ENCODE peaks and the JASPAR CTCF motif.
3. Builds 64 development, 64 validation and 152 OXTR test windows. CTCF is one DNA-binding protein. A non-peak window means the assay reports no peak there; it is not proof of absent binding.
4. Learns on chromosome 1, selects between fixed logistic and random-forest candidates on chromosome 2, and evaluates chromosome 3/OXTR once. It compares ordinary motif/spacing features with the same features plus Fibonacci-gap and Phi Ratio features. It calculates average precision and a descriptive interval by resampling 4,096-base blocks.
5. Selects a reported CTCF peak window and a comparison window, prepares all eight existing numerical representations, compiles CUDA-Q/QASM and Aquila AHS programs, and checks 16 local CPU simulations against direct numerical evolution.
6. Uses Astra to explain the result and the remaining dependency, saves JSON and CSV, and delivers an insight report in a closeable website lightbox.

The new classical test does not evaluate M9 P24 prediction. The local CUDA-Q pair checks programs; it is too small to evaluate biological prediction. Its execution is explicitly labelled CPU, not qBraid GPU or Aquila. Old provider measurements retain their original identity. The saved Wolfram receipt covers the original ordinary-input program; a generic MCP connection is not presented as a new service execution.

## Today's enforced boundary

New Aquila spend: **US$0**. New paid GPU spend: **US$0**. The worker has no hardware submission tool or QPU credential. Research questions are limited to six per day and forty per month, with at most two active tasks. Each task has a separate model ledger capped at two requests and 24,000 reserved tokens. Model reports use GPT-6 Astra. These are shared prototype limits, not a public funding policy.

qBraid's account check showed zero purchased credits with auto-recharge disabled. The remaining free-circuit quota was not verified for a new batch; no new qBraid submission is made. Local CUDA-Q is used without cloud charges. No service, VM or SageMaker instance is provisioned.

## Runtime and recovery

Cloudflare's existing Durable Object binding stores the private queue, each task and report separately. Leases expire after three minutes and the worker renews every 45 seconds. Stable request keys prevent duplicate task creation. The local SQLite checkpoint resumes completed analysis nodes and retains uncertain model reservations. Cancellation rejects later worker updates. A research session can requeue a paused task without increasing its allowance.

The research worker runs on this Mac while its process is active and the Mac is awake. Browser closure does not cancel a task. This is not an always-on hosted research service. The operator starts it with:

```text
ASTRA_SERVICE_HOME=/private/tmp/astra-owner-service /private/tmp/informatics-agent-env/bin/python research/informatics/astra-service/runner.py --serve --idle-seconds 7200
```

The two-hour idle exit bounds this development session. No scheduled research or future paid experiment is activated.

Private credentials are held outside Git with mode 0600. The browser receives a 12-hour research capability automatically from Panthur, without a login form. A signed browser identity permits renewal and keeps separate visitors’ tasks apart. It receives no provider credentials. The PHP endpoint is staging-only. Requests and reports are private to the browser research session; public readers retain the existing recorded study.

## Reproducibility and limits

The recipe, source hashes, reference coordinates, fixed model candidates, random seed, chromosome separation, scores and all predictions are retained. Model prose is separate from computed evidence. The original 16-program qualification is unchanged. The small sample, five OXTR peak regions, assay quality flags, local-background selection and lack of accessibility matching/blacklist filtering limit interpretation. A stronger validation score on the balanced chromosome-2 sample does not establish generalisation to the low-prevalence OXTR region.

The first continuation report is archived as its own immutable experiment revision and included in the complete Informatics JSON/CSV exports. Private task drafts remain downloadable JSON/CSV; publication into the public registry remains a reviewed release operation.

Verification:

```text
node research/informatics/astra-service/test_broker.mjs
python research/informatics/astra-service/test_science.py
python research/informatics/astra-service/test_runner.py
```

Primary references: [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence), [OpenAI Responses](https://developers.openai.com/api/docs/guides/function-calling), [ENCODE source assay](https://www.encodeproject.org/experiments/ENCSR932ZMX/), [UCSC genome API](https://genome.ucsc.edu/goldenPath/help/api.html), [JASPAR CTCF](https://jaspar.elixir.no/matrix/MA0139.2/).
