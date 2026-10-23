# Universal One — Informatics staging implementation

24 October 2026. Production remains at d82c7ae0. Ben proofs the new research assistant on permanent staging before a production release.

## Planet and voice refinement — 24 October 2026

Ben approved the planet-only Informatics design, subtle voice icons and selective research retrieval. The rollover reads exactly “Ask a research question”; the expanded panel retains “Universal One”. The I Am character is no longer inserted into the Informatics DOM. The original planet texture remains in use.

Clicking the planet opens the text panel. Voice minimises to a waveform, status, microphone and end-call icons; an interruption control appears during a response, and recovery appears only after an error. Clicking the planet during compact voice toggles a small transcript/text menu. Escape collapses the menu or panel without ending the conversation. Icon controls retain accessible labels, keyboard focus and hover descriptions.

Visibility changes disable microphone transmission and mute remote playback while the page is hidden, preserving the connection. A pending permission response waits for the visible page before establishing voice. Returning to the visible page resumes the existing state and preserves an explicit mute. End and page navigation still cancel startup and close the microphone. No native fullscreen exit or entry is invoked by Universal One. Safari's native permission UI remains browser-controlled; a simulated visibility handoff is separate from a native Safari fullscreen test.

Realtime answers general scientific concepts directly. Astra remains available for deeper reasoning, library-specific questions and Atlas evidence. General conceptual questions sent to Astra also permit a direct explanation without a mandatory literature search. Exact library claims, specific study findings, Atlas values and recorded project hypotheses retain retrieval requirements. Generic concepts receive no invented citations or citations inherited from an earlier answer. Spoken updates are brief and optional; the UI uses “Thinking…” instead of announcing a database search on every request.

Verification passed on permanent staging: real text, editable dictation, automatic speech turn detection, a cited M9 answer, and a general molecular-docking answer with no research round trip. Permission/visibility lifecycle checks, four viewport widths, three theme variables, icon-menu keyboard navigation and shared research-lightbox sessions passed. The final spoken count check correctly reports 811 publications with 149 permitted full texts as a subset. Automated browsers used --mute-audio and were closed after checks. Native Safari fullscreen was not invoked.

The sections below record the earlier implementation and verification. The refinement has its own source commit and verification-planet-20261024.json audit.

## Delivered

The existing I Am rotating planet and headphones / meditation / tablet character are reused on the lower right of Informatics and Universal Research. Text is the default. Dictation produces an editable draft with the I Am microphone waveform. Voice opens a live Marin conversation in a compact dock, with an optional transcript and no question composer or Send button. Text and voice share in-page history, including across the research lightbox. Opening the page never requests a microphone.

The live voice path reuses the I Am WebRTC connection and gpt-realtime-2.1 profile, with an ask_research tool that calls the existing Astra retrieval service for scientific questions. Spoken replies have their actual transcript and the retrieved citation details. Text dictation still uses transcription, and Read aloud retains the existing text-to-speech path. The dedicated Informatics service leaves the I Am application and private citizen systems untouched. The shared identity is generated from the existing I Am character by sync-universal-one-character.py. Selecting the planet replaces it with that character; minimizing the panel preserves the active conversation.

Music fades to 15% of its original volume over 800 ms and restores over 1,000 ms. Original mute and paused states are preserved. Overlapping requests and interrupted restoration retain the original baseline. The microphone closes before assistant speech and observes a 900 ms release gate, with echo cancellation, noise suppression and automatic gain control requested from the browser. Server voice activity detection handles turn-taking (threshold 0.72, 300 ms prefix, 800 ms silence). The compact controls offer microphone mute, interruption, transcript visibility, text mode and End. Ending, navigation or a hidden tab closes the live connection and microphone; reconnect is explicit. Sessions close after ten minutes. No native fullscreen operation is initiated by Universal One.

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

The staging origin allowlist is not user authentication. Numeric quotas limit usage: 12 requests per minute per IP; daily model-call allowance 120, embedding 180, transcription 60, speech 60, live voice session creation 20. Ephemeral voice credentials expire after 120 seconds; the client limits each conversation to ten minutes. The browser session timer is a UX limit, not a server-enforced per-session spending ceiling. One question can use several model calls. Only quota counters persist in the Worker; chat history remains in-page. This is a bounded public staging assistant, not a paid authenticated collaboration service.

## Rebuild and deployment

prepare.py accepts the reader JSON, local rights catalogue, repository root and a private output directory. It preserves approved text, matches licensed articles by stable identity, chunks text and records hashes. ingest.mjs adds cached embeddings, upserts metadata/passages/changed Atlas records and archives licensed source files. Secrets are supplied from private local files and are excluded from Git.

The supplementary Nature source bundle and all original licensed files remain under the planning project's research directory. The Git audit retains source URLs, rights metadata, link checks and validation, not the private bulk text.

Commit the source candidate, deploy the Worker using wrangler.informatics-staging.toml, and deploy the frontend using the existing deploy-panthur-staging.sh informatics workflow. Record the staging manifest and verification on origin/staging. Production requires Ben's separate explicit approval.

## Verification

The original release evidence is in verification-20261024.json and its supporting reports. Live voice revision evidence is recorded separately in verification-live-20261024.json. The following paragraph describes the original release checks: Real staged UI requests exercised text, editable dictation, transcription → Astra → Marin, citations, microphone denial, mode changes and shared history. A separate Chromium process used --mute-audio and synthetic microphone input; all automated media pages were paused and closed. Silent tests verify functionality, not subjective voice quality.

The live voice revision passes real staged text, editable dictation with an input waveform, automatic speech turn detection, Astra retrieval through the voice tool, decoded Marin audio, a cited M9 response, optional transcript with the latest reply visible, and return to text. The compact session also persists across the research lightbox without a second widget. Lifecycle checks cover microphone gating during response generation, mute, interrupted retrieval and late microphone permission. All media tests use a separate process with --mute-audio; no native fullscreen is invoked.

The tested music mix moved from 0.80 to 0.12 and restored to 0.80. Separate timing checks cover overlapping owners and interrupted fades. Four viewport widths and three reading themes were checked; the General chapter was checked at desktop and mobile sizes. M9 context was queried through the actual Atlas page. The final header and character placement passed at all four widths. Fullscreen subtree containment was simulated without invoking native fullscreen.

Every database publication was compared with the reader export. All 1,001 Atlas record hashes matched local JSON. No passage lacked an embedding. JSON/CSV IDs and permitted-text availability matched. Asset hashes matched staging; sampled production assets still matched d82c7ae0.

The standard Panthur preflights and research model/count checks passed. Two older optional test files have pre-existing assertions for superseded Language trust thresholds and Vision paper counts; those same assertions fail on unchanged prior-release edition data. These are recorded as stale test baselines, not as new content regressions. Approved edition data was not altered to satisfy them.

## Next

Ben proofs the character, interaction and answer presentation. The connector page follows: API, MCP, Google Agent2Agent (A2A), personal agents, provider connection flows where supported, JSON and CSV. Sage Bionetworks/Synapse and Triall study workflows remain future integrations. The CORAL-only mediated research-agent MVP is recorded in ROADMAP.md. No continuous agent network, autonomous publishing or partner integration was activated.
