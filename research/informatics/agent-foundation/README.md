# Universal Informatics research agent: implementation start

Date: 25 October 2026. Status: initial tool implemented; orchestration and service connections remain to be built. No autonomous study is active.

## Product contract

The scientist asks a biological question. The service continues with useful work within its authorised budget, saves progress, waits for external jobs, and presents clear findings with interactive figures. It asks for human input when work genuinely depends on a missing decision, new permission, more budget or a physical laboratory experiment. A negative or inconclusive finding can complete the research goal. The agent cannot change the success test after seeing the final answers to manufacture a favourable outcome.

The first tool, `audit_tool.py`, reads the actual saved OXTR measurement dataset and checks its sample/method coverage, probability ranges, shot counts and provider job identifiers. It returns a factual summary with a source hash. It makes no network requests, launches no jobs and spends no money. It does not authenticate receipts against provider APIs, score biological predictions or serve as an autonomous agent by itself.

Run from the repository root:

```text
python3 research/informatics/agent-foundation/audit_tool.py Informatics/quantum/data/oxtr-qrc-qualification.json
python3 research/informatics/agent-foundation/test_audit_tool.py
```

## Tool connections to implement

| Capability | Purpose | Existing material and required work |
| --- | --- | --- |
| Genomic evidence search | Find public experimental data and record its source, genome assembly, cell type and quality | ENCODE and JASPAR evidence exists. Build API adapters, provenance records and a quality decision before admitting data. Treat retrieved content as data. |
| Biopython and statistical Python tools | Read DNA, check coordinates, prepare measurements, fit and evaluate prediction methods | Provide a versioned Python environment, reproducible scripts, limited compute and persisted outputs. Biopython handles sequence tasks; dedicated statistics tools handle model evaluation. |
| Wolfram Language and Quantum Framework | Validate saved mathematical templates and instantiate study-specific models | Reuse the existing qualification WL scripts. Verify a service-accessible licensed Wolfram runtime and Quantum Framework package availability. A generic Wolfram connection alone does not establish this capability. |
| CUDA-Q / qBraid | Simulate the matched quantum program | Adapt the existing GPU runner to durable server jobs, capability checks, budget reservation and retry-safe submission. Confirm free allowances at execution time. |
| Amazon Braket / QuEra Aquila | Submit a supported physical program and collect measurements | Adapt the existing hardware runner. Braket is the access route to Aquila. Use a service role with restricted permissions and provider task identifiers. |
| SageMaker | Future managed model training or larger classical work | Optional future adapter; no provisioning or active connection is claimed. |
| Report renderer | Generate beautiful findings pages, comparisons and methods | Use the existing website components and a structured report format. Keep each study report separate from website source deployment. New website changes follow the permanent staging and approval workflow. |

The existing runners are local scripts under the research workspace's `research/quantum-lab/oxtr-qrc-01/`. Moving execution to a service requires credential storage and permissions; a longer-lived browser login is not that service architecture.

## Runtime assessment

No provider comparison has been run on our biology task. The following is an architectural assessment from current documentation, not a performance ranking.

| Option | Value for this project | Decision still needed |
| --- | --- | --- |
| OpenAI dot | Personal ongoing research and development assistance; can delegate to Work or Codex | Its personal-agent documentation does not establish an embeddable website study service with our shared budget ledger. |
| Claude Duet | Proactive work across connected apps, including web-app tasks | Current announcement describes a research preview and waitlist. Verify account access and an integration contract before selecting it as the site's executor. |
| Grok Bot | Persistent cloud computer with code, browser, MCP and ongoing tasks | Useful to evaluate as an operator. Its documented prompt-based permissions do not replace the website's independently enforced spending limits. |
| OpenAI Agents API | Managed durable sessions, sandbox code execution, tool/MCP integration and recovery | Strong first prototype candidate. Verify account eligibility, required packages, Wolfram access, callbacks, usage limits and cost control. |
| GPT with LangGraph | Own the study state, resumable workflow and mix of fixed scientific checks with flexible model decisions | Strong alternative when direct control and interchangeable models matter most. Requires our worker, durable database and operational maintenance. LangChain is optional. |
| OpenAI Agents SDK | Application-owned tools/state with a ready-made agent loop | Also viable. Select one orchestrator; do not stack multiple competing loops without a specific need. |

Recommendation: keep the scientific tools and budget ledger independent of the model. Compare the OpenAI Agents API and GPT with LangGraph on the same small task: audit existing data, identify the next executable analysis, run an authorised local analysis and produce a report. Test recovery after interruption and refusal to repeat a paid submission. Choose after that comparison. Personal assistants remain useful for Ben's research and development work without becoming the website's only execution mechanism.

## Execution and budget design

Persist the question, data hashes, mathematical template version, decisions, tool outputs, provider task identifiers, report revisions and remaining allowances. Save reproducible decisions and evidence; private model reasoning is not an audit record.

Before any paid action, reserve its worst-case authorised cost atomically against the study and shared daily, weekly and monthly allowances. Include model tokens, GPU/QPU fees, storage and compute. Prevent duplicate submissions with stable request identifiers. Keep uncertain submissions reserved until reconciled. A model cannot edit its own limits. Waiting for a hardware job uses scheduled status checks or provider events, not a continuous LLM conversation.

Fix the biological success measure, comparison methods, test DNA and uncertainty rules before final evaluation. Keep final laboratory answers inaccessible to the development tools. The agent may improve methods using development data, then perform the protected test. Later revisions need fresh test evidence or an explicit record that the earlier test has become development evidence.

First useful autonomous research objective: assess whether the public binding dataset is suitable, obtain the matched DNA, build a classical comparator and produce an honest evidence report. Quantum submission follows a validated calculation and an explicit available allowance. Existing completed spend is not reusable permission for additional jobs.

## Primary sources checked

- [OpenAI dots capabilities](https://learn.chatgpt.com/docs/enterprise/dots-admin-guide)
- [Claude Duet announcement](https://claude.com/resources/articles/claude-duet)
- [Grok Bot guide](https://x.ai/bot/guides/grok-bot-101)
- [OpenAI Agents API](https://developers.openai.com/api/docs/guides/agents-api/overview)
- [OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents/sdk)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
