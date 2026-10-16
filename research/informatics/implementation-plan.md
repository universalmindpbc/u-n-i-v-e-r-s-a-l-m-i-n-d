# Universal Informatics — delivery sequence

## 1. Complete M1–M24 pilot — ready for Ben’s staging proof
- Verify native Pisano periods and nested sequences with Python and Wolfram.
- Finish versioned JSON, separate diagrams, Notion records and assessment placeholders.
- Verify all 24 records on permanent staging, including navigation and media continuity.
- Ben proofs the pilot before production or expansion.

## 2. Universal One in the Atlas — approved next, gated on pilot proof
Reuse I AM's Universal One voice AI, with an unobtrusive Ask Universal One control and optional text/voice. Keep the current Atlas record as context.

Ground answers in versioned JSON and reviewed literature; cite records and sources. No model retraining is required to add dataset records. Separate computed findings, hypotheses and biological evidence. Expose verification scope and unassessed status accurately.

Initial evaluation: exact period/sequence questions, M9 versus M18 comparisons, cross-record counts, phase-preserving Beta answers, Epsilon qualification, and questions unsupported by evidence. Verify the full GPT workflow on permanent staging: request, server, model response and rendered answer. Audio QA uses a dedicated process with --mute-audio; any audible test requires immediate approval.

Deployment: staging → Ben proofs → explicit production approval. No deadline or recurring automation is set; this is the next project milestone after M1–M24 proof.

## 3. Research API — after Universal One
Expose read-only access to the same versioned JSON and supported research queries used by the Atlas and Universal One. Return record identifiers, rule definitions, dataset version, verification scope and evidence provenance. External access does not permit changes to the research database. Define authentication, limits and API documentation before release.

## 4. MCP connector — after the API
Allow scientists to query the research through their own compatible AI assistants. Wrap the research API rather than maintain a separate dataset. Support record retrieval, sequence and geometry comparisons, and counts of individual and jointly occurring patterns. Preserve the distinction between computed findings, hypotheses and biological evidence.

## 5. Scale toward M1–M1001
Use the proofed rules and pipeline. Count individual patterns and joint occurrence, distinguish exact M9 value matches from geometric matches, and catalogue additional patterns. Scientific significance remains unassessed until appropriate analysis and evidence review.

## 6. Agent-to-agent collaboration — later phase
Explore exchange of research tasks and proposed findings between Universal One and external agents after the API and MCP are established. Agree a concrete workflow and review process before implementation; external proposals must not silently modify verified records.

These are ordered project milestones, not calendar bookings or recurring automations. Sequence approved by Ben on 16 October 2026: finish and proof M1–M24 → Universal One → API → MCP. No dates have been assigned.

### Scientist connection experience — planned with MCP
Use one unobtrusive **Connect your AI** entry point. Candidate destinations: **ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Muse (Meta)**, plus **Other AI / MCP**. Keep Universal One as the no-setup option within the Atlas.

Each destination gets an accurate compatibility label and a short guided flow: choose client → setup or supported installation link → authorise only if required → run a sample research question. A login button alone does not install an MCP connection. Do not imply endorsement, universal availability, or one-click installation before the exact account/client journey is tested. Use read-only public access where appropriate; account-specific features can use scoped authorisation.

Official documentation checked 16 October 2026:
- ChatGPT: custom MCP setup and reviewed plugin publishing: https://developers.openai.com/plugins/deploy/connect-chatgpt and https://developers.openai.com/plugins/deploy/submission
- Claude: remote custom connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Grok: custom connectors: https://docs.x.ai/grok/connectors
- Perplexity: custom remote connectors: https://www.perplexity.ai/en-GB/changelog/what-we-shipped---march-13-2026
- Gemini: remote MCP in developer API; consumer-chat setup not verified: https://ai.google.dev/gemini-api/docs/function-calling
- DeepSeek: tool calling and third-party client integrations; consumer-chat setup not verified: https://api-docs.deepseek.com/guides/tool_calls/
- Muse (Meta): include in compatibility investigation; exact external connector installation remains unverified: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent

Recheck current platform documentation during implementation. These are roadmap options, not live integrations.

### Scientific computing ecosystem — planned workflows
Connection page: group **Connect your AI** separately from **Research platforms**. Show Available, Planned, or Explore documentation according to tested capability. These are prospective integrations; do not present unconfirmed organisations as established partners.

- NVIDIA Nemotron / NIM: tool-enabled agents querying our read-only API/MCP, with endpoint/model compatibility verified.
- NVIDIA BioNeMo: model-specific biomolecular workflows using actual molecular/omics inputs; no assumption that Atlas numeric CSV is a valid model input.
- NVIDIA PhysicsNeMo: reproducible Python notebooks with defined physics equations, inputs, boundary conditions and validation.
- NVIDIA CUDA: GPU acceleration for sufficiently large simulation/statistical workloads. Native M1–M1001 arithmetic itself does not require GPU compute.
- NVIDIA CUDA-Q: hybrid quantum-classical algorithms and GPU-accelerated quantum simulation for explicitly defined Hamiltonians. Keep physical claims separate from model results.
- D-Wave Leap: retain the approved quantum annealing investigation as a separate workflow.
- AlphaFold: prepare model-specific molecular JSON only after a real molecular target/sequence is selected; compare resulting structures with Atlas features using controls. Not a direct Fibonacci CSV upload.
- Insilico Medicine PandaOmics: gene/protein measurement matrices plus sample metadata in CSV/TSV; Atlas data is a comparison source, not an omics matrix.
- Insilico Medicine Chemistry42: future molecular design/optimisation workflows with defined biological targets.
- Amazon SageMaker: reproducible notebooks and managed machine-learning jobs using versioned Atlas exports, with required biological data and explicit evaluation criteria.
- Amazon Braket: quantum simulation and supported quantum-hardware experiments using explicit algorithms; prepare research notebooks rather than imply a universal CSV upload or one-click account connection.

No paid cloud jobs, GPU/QPU reservations, account authentication, or partner outreach is authorised by this roadmap. Implement and proof the interface after the agreed M1–M24 → Universal One → API/MCP sequence. CSV and JSON access remain independent of AI-account connections.

## Collaborative research submissions — planned after UO and API/MCP

Add a researcher-controlled Submit a finding workflow: draft → reproducibility checks → review → publish a versioned result → optional integrity proof. Include author/ORCID, Atlas record IDs, dataset and rule versions, native versus reduced sequence context, hypothesis, methods/code/environment, results (including negative results), limitations, peer-reviewed references, review status, licensing/access choice, and links to subsequent corrections or replications. Every publication gets a stable ID and content hash; corrections create linked versions rather than silently overwriting history.

- Sage Bionetworks Synapse is the preferred collaboration destination: data/code sharing, teams, provenance, wiki discussion and DOI support. Build an export first, then authenticated publishing after API/access validation. Researchers review the package and its permissions before publishing. https://www.synapse.org (platform; confirmed by Ben). Documentation: https://sagebionetworks.org/platform/synapse
- Triall Blockchain Proof is a proposed optional integrity adapter. Its product describes hashing and timestamping documents, and a Verifiable Data Integrity API. Confirm current access, cost and integration terms before implementation. Store the returned receipt with the result version. Keep research files in the governed repository; anchor a hash rather than participant data. Timestamp integrity does not establish correctness, novelty or biological significance. https://triall-platform.webflow.io/products/blockchain-proof
- Bridge is a later participant/sensor study integration, not the primary findings repository. Current Bridge documentation says it was developed by Sage and is now operated by GRIP. https://developer.sagebridge.org/

Status: planned, no accounts connected, no external findings published, no partnership claimed. Review code and data licensing before presenting the project as open source. Preserve M1–M24 proof → UO → API/MCP ordering; this collaboration layer follows those foundations.
