# Universal One — Informatics staging implementation

24 October 2026. Production remains at d82c7ae0. Ben proofs the new research assistant on permanent staging before a production release.

## Delivered

The existing I Am rotating planet and headphones / meditation / tablet character are reused on the lower right of Informatics and Universal Research. Text is the default. Dictation produces an editable draft; Voice sends an explicitly finished recording and speaks the cited Astra answer using Marin. Text and voice share in-page history, including across the research lightbox. Opening the page never requests a microphone.

The voice path is transcription → Astra retrieval → speech. This retains exact agreement between the written answer and its speech input. It uses a dedicated Informatics service and leaves the I Am Realtime application and private citizen systems untouched. The shared identity is generated from the existing I Am character by sync-universal-one-character.py.

Music fades to 15% of its original volume over 800 ms and restores over 1,000 ms. Original mute and paused states are preserved. Overlapping requests and interrupted restoration retain the original baseline. The microphone closes before assistant speech and observes a 900 ms release gate, with echo cancellation, noise suppression and automatic gain control requested from the browser. Voice is explicit push-to-talk in this first release.

## Research data

- 811 unique publication records, including 30 new Nature Portfolio papers in General chapter 9, Fibonacci mathematics in computation and biology.
- 149 permitted full-text articles; 4,188 indexed passages including the approved publication text.
- 1,001 complete Atlas records, M1 through M1001, with their original JSON hashes.
- 111 M9-family members. Retrieval exposes native and reduced-to-M9 sequences, nested Alpha/Beta/Gamma/Epsilon fields, research hypotheses, the background literature register, and conditional shuffle probability methods and interpretations.
- 44 retained text-mining manuscripts remain outside full-text AI retrieval pending reuse permission review. They are not counted in the 149.
- JSON and CSV contain the same 811 publication records, topic trust scores, citation snapshots and full-text availability/rights. These publication exports contain metadata and approved passages; they are not bulk article-text downloads. Atlas JSON/CSV remain the separate existing Atlas exports.
- Sound, Language, Vision and the first eight General chapters retain their approved content. The 30 additions have dated Crossref citation counts and 84 verified publisher/DOI/PubMed links. Five new topics meet the one-cross threshold; the single-paper structural-model topic remains ungraded.

This is retrieval at question time, not fine-tuning. Atlas data are read directly rather than compressed into a model's permanent memory. A fixed-configuration shuffle probability is not a biological validation result.

## Infrastructure

Neon project universal-informatics, branch br-shy-forest-az3pccdr, database informatics, AWS Singapore region, with pgvector. The private S3-compatible research-evidence bucket is in the same Neon project. Re-Model has no configured S3 archive to reuse; its existing database and Cloudflare D1 were not changed. No Pinecone or OpenAI File Search service was added. No paid plan upgrade was made.

Dataset research-20261024-v2 reconciles the website export, database and 300 versioned private objects: 149 originals, 149 extraction files, publication metadata and manifest. Object size and SHA-256 metadata were checked after upload. Database size after import was 121,176,064 bytes. Initial and extension embedding calls used 1,512,376 tokens combined with text-embedding-3-small at 512 dimensions.

The existing Cloudflare account hosts a dedicated staging Worker, informatics-universal-one-staging. Panthur remains the website host and its existing deployment scripts remain the publishing workflow. The service uses GPT-6 Astra through the Responses API, store:false; gpt-4o-mini-transcribe; and gpt-4o-mini-tts with Marin. Provider calls incur normal account usage.

Only the Informatics reader credential reaches the Worker. It has SELECT privileges, a 10-second statement timeout and read-only transactions by default. Tools use parameterized SQL. The model has no arbitrary SQL, network, filesystem, write tools, object-storage credentials or private citizen access. Source texts and page context are evidence, never instructions. Answers return validated citation IDs, source passages, author attribution and article licences where available.

The staging origin allowlist is not user authentication. Numeric quotas limit usage: 12 requests per minute per IP; daily model-call allowance 120, embedding 180, transcription 60, speech 60. One question can use several model calls. Only quota counters persist in the Worker; chat history remains in-page. This is a bounded public staging assistant, not a paid authenticated collaboration service.

## Rebuild and deployment

prepare.py accepts the reader JSON, local rights catalogue, repository root and a private output directory. It preserves approved text, matches licensed articles by stable identity, chunks text and records hashes. ingest.mjs adds cached embeddings, upserts metadata/passages/changed Atlas records and archives licensed source files. Secrets are supplied from private local files and are excluded from Git.

The supplementary Nature source bundle and all original licensed files remain under the planning project's research directory. The Git audit retains source URLs, rights metadata, link checks and validation, not the private bulk text.

Commit the source candidate, deploy the Worker using wrangler.informatics-staging.toml, and deploy the frontend using the existing deploy-panthur-staging.sh informatics workflow. Record the staging manifest and verification on origin/staging. Production requires Ben's separate explicit approval.

## Verification

See verification-20261024.json and its supporting reports. Real staged UI requests exercised text, editable dictation, transcription → Astra → Marin, citations, microphone denial, mode changes and shared history. A separate Chromium process used --mute-audio and synthetic microphone input; all automated media pages were paused and closed. Silent tests verify functionality, not subjective voice quality.

The tested music mix moved from 0.80 to 0.12 and restored to 0.80. Separate timing checks cover overlapping owners and interrupted fades. Four viewport widths and three reading themes were checked; the General chapter was checked at desktop and mobile sizes. M9 context was queried through the actual Atlas page. The final header and character placement passed at all four widths. Fullscreen subtree containment was simulated without invoking native fullscreen.

Every database publication was compared with the reader export. All 1,001 Atlas record hashes matched local JSON. No passage lacked an embedding. JSON/CSV IDs and permitted-text availability matched. Asset hashes matched staging; sampled production assets still matched d82c7ae0.

The standard Panthur preflights and research model/count checks passed. Two older optional test files have pre-existing assertions for superseded Language trust thresholds and Vision paper counts; those same assertions fail on unchanged prior-release edition data. These are recorded as stale test baselines, not as new content regressions. Approved edition data was not altered to satisfy them.

## Next

Ben proofs the character, interaction and answer presentation. The connector page follows: API, MCP, Google Agent2Agent (A2A), personal agents, provider connection flows where supported, JSON and CSV. Sage Bionetworks/Synapse and Triall study workflows remain future integrations. The CORAL-only mediated research-agent MVP is recorded in ROADMAP.md. No continuous agent network, autonomous publishing or partner integration was activated.
