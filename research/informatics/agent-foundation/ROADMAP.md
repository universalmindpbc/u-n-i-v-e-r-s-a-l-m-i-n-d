# Universal Informatics — scientific agent roadmap

Owner direction recorded: 25 October 2026.

## Scientific leadership

**Gemini 4 is the intended Chief Scientific Officer. GPT-6 Astra is the head bioinformatician and general scientist.** These are the assigned responsibilities within Universal Informatics. The first Astra prototype is verified against saved public data; Gemini review and the complete research service remain future connections.

Gemini guides Astra at the creation stage: review the scientific question, evidence, strategy, comparison methods, success criteria, budget and proposed computation before execution. At completion, Gemini reviews Astra's work against the agreed strategy, checks the evidence and calculations, and either signs off, requests a revision or escalates to a human. Astra performs the research, analysis and report preparation. Scientific disagreement remains in the record.

Model review checks the work; empirical evidence and reproducible calculations establish scientific findings. A model's sign-off alone is not experimental validation.

## LangGraph owns the workflow

Build Astra first, with explicit strategy-review and completion-review points ready for Gemini. Until Gemini is connected, these points retain an honest `review_pending` state or use a recorded human decision. A test fixture never becomes a scientific approval.

LangGraph is the primary orchestrator and supervisor. Universal Informatics owns the persistent study state, evidence, checkpoints, task routing, tool permissions, budgets, retry rules, review decisions and publication gates. LangChain integrations are optional adapters.

OpenAI managed agents can provide a bounded Astra work unit behind a replaceable interface. They do not own the only copy of the workflow, records or permissions. An OpenAI Responses adapter or a Gemini adapter can use the same tool contracts and study records. Provider session identifiers are references, not the identity of a study.

Use the user-selected model names as intended targets. Verify each provider's available API model identifier and account access when connecting it; never silently substitute another model or imply that a future connection is active.

## First workflow

1. A scientist asks a question in natural language.
2. Astra retrieves the Atlas definitions, prior experiments and relevant public evidence, then proposes a reproducible strategy internally.
3. Gemini reviews the strategy, or the first implementation records the designated human review.
4. Astra performs authorised analysis through scientific tools. LangGraph saves progress and advances the work within the study and shared budgets.
5. Astra compares classical calculations, CUDA-Q simulations and available hardware measurements using the agreed criteria, then prepares an accessible findings report.
6. Gemini reviews the calculations, sources, interpretation and completeness. Requested revisions return to Astra with a bounded revision allowance. Ethical concerns, exhausted budgets and decisions outside delegated authority go to a human.
7. The approved result enters the report and immutable experiment JSON/CSV, then the complete Informatics JSON/CSV exports. A negative or inconclusive finding is a valid outcome.

Public UX stays simple: ask a question, explore while work progresses, receive classical findings, then quantum findings. Internal strategy and review stages do not become a series of technical forms for the scientist.

## Website, API, MCP and A2A access

The research agent is a shared service. Scientists and external agents can use its computation and research capabilities from the website, a versioned API, MCP, and A2A (Agent2Agent, the protocol originally introduced by Google). Each interface addresses the same durable study and uses the same permissions, scientific reviews and budget ledger.

The planned operations are: submit a research question, obtain a study identifier, inspect progress and remaining allowance, retrieve findings and downloadable evidence, resume after supplying requested information, and cancel work. Long quantum queues return a task reference and progress events rather than keeping a synchronous request open. Retried submissions use an idempotency key and return the existing study.

A2A is part of the intended agent architecture, not an optional afterthought. It enables external research agents to discover supported capabilities, delegate bounded work, follow task state and receive result artifacts. The current read-only A2A connector is not evidence that autonomous computation is connected. Add execution capabilities only after the shared job service and authorisation checks exist. Advertise actual connected tools and limitations in the agent's capability description.

An external agent cannot bypass Gemini's scientific review or the human escalation rules. A caller cannot grant itself extra funding. Public access and funded computation are distinct permissions, with capacity enforced by the shared daily, weekly and monthly budgets.

## Future Drug Discovery Network and Open Source Genomic Insights

The agent will eventually coordinate classical and quantum research with external drug-discovery and genomics platforms. Ben's intended ecosystem includes LENS Labs, Recursion, Ginkgo Biopharma, and relevant work from OpenAI, Anthropic and DeepMind, alongside other suitable research providers. These are owner-supplied roadmap references. Verify the exact organisations, products, APIs, data permissions and collaboration terms before implementation; no present partnership or connection is claimed.

The pipeline can prepare evidence packages, propose follow-up work and exchange agreed research tasks through API, MCP or A2A. Human review governs external sharing, scientific publication and consequential drug-discovery decisions. Preserve provenance and distinguish a computational candidate from a laboratory-confirmed finding.

## Delivery phases

- **First:** a resumable LangGraph workflow for Astra to inspect existing public OXTR results, use bounded tools and prepare a cited report. Prove interruption recovery, budget enforcement and review gates before autonomous submissions.
- **Next:** connect Wolfram Language and Quantum Framework, Biopython and statistics, genomic evidence search, CUDA-Q/qBraid and Braket/Aquila through independently testable adapters. Reuse versioned templates and prior study examples.
- **Scientific oversight:** connect Gemini 4 at both review points, with recorded recommendations, decisions and revisions. Preserve a human escalation route and prevent either model from increasing its own authority or budget.
- **Later:** expand to a coordinated group of specialist agents, optional SageMaker workloads, and the Drug Discovery Network and Open Source Genomic Insights. External collaboration and publication retain human oversight.

## Architecture reference

Ben's supplied `ChatGPT Image 25 Oct 2026, 10_12_15.png` depicts the broader Universal Informatics API call stack: natural-language questions, multi-model orchestration, genomic evidence, symbolic and classical computation, quantum backends, validation, publication and drug-discovery collaboration. This roadmap implements a small initial version of that vision. The current Astra/Gemini responsibilities above supersede older model labels in the image. The image does not establish live API access, partnerships or support for every illustrated platform.

## Non-negotiable execution rules

- Shared records and exports remain provider-neutral and readable without a model vendor's service.
- Model output cannot bypass scientific review, alter protected final test data, raise spending limits or publish unreviewed claims.
- Jobs have stable identifiers; retries reconcile existing jobs before submitting again. Unknown paid outcomes retain their budget reservation.
- Record sources, parameters, tool outputs, decisions and report revisions. Do not depend on private model reasoning as an audit trail.
- The agent continues useful authorised work until the goal is answered, a real dependency needs a human, or a recorded limit is reached. It never manufactures a favourable result to satisfy the goal.
