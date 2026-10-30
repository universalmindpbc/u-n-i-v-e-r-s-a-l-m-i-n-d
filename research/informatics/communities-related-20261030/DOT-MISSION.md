# Universal Research domestic violence mission for Dot

Prepared for Ben and Universal Mind on 30 October 2026. Ready to send to Dot; delivery and the account's computer, repository and deployment access are not yet verified. No recurring run or paid service has been activated.

## Responsibility

Build a carefully verified body of research relevant to people affected by domestic, family and intimate partner violence, including affected children and young people. Prepare proposed additions to Universal Research for Universal Mind to review on staging. Preserve the existing human-curated research and its table of contents.

The long-term responsibility is continuous research and follow-through. The first pilot is deliberately bounded: propose a maximum of 24 hours or 10 fully assessed new candidate publications, whichever arrives first, with up to 30 records screened. Stop earlier if source quality, access, review capacity or usage limits prevent useful progress. These are ceilings, not publication quotas. Use existing account allowances and free accessible sources; the proposed additional paid-spend ceiling is A$0. Do not purchase papers, credits or services, or launch paid API jobs. A monthly paid budget and renewal policy remain to be set before expanding the programme.

First confirm the tools and access available, identify the latest verified staging revision, and return a short execution plan. Public-source discovery and a structured candidate bundle can proceed with available access. State any missing capability precisely; retain completed work for the repository handoff.

## Initial research scope

Search domestic violence, family violence, intimate partner violence, domestic abuse, coercive control and relevant survivor terminology. Expand abbreviations such as DV and IPV using context. Separate survivor research, research on affected children, perpetrator interventions, prevention and service-system research.

Cover the existing intervention families:

- **Sound:** music therapy, music interventions, singing, rhythm, drumming and relevant sound interventions. Distinguish active participation, listening and therapist-delivered treatment.
- **Vision:** clinical EMDR, including individual, group and remote delivery. Keep clinical EMDR evidence separate from visual stimulation, entertainment or self-guided product claims.
- **Language:** mantra and mantram repetition, transcendental meditation, meditation, mindfulness, MBSR, talking therapies, yoga, body work and relevant yogic practices. Preserve the repository's current placement of these practices under Language while naming the actual intervention clearly.

Use explicit population and exposure evidence. PTSD, anxiety, depression or residence in a shelter alone does not establish that a study concerns domestic violence. Track outcomes beyond diagnosis, including functioning, sleep, quality of life, acceptability, retention, adverse effects and access to care when measured. Do not assume a particular outcome is primary without checking the study.

Record whether a publication directly studies the target population, discusses the context, or supplies related evidence through an editorial inference. Every inferred relationship needs a specific rationale and transfer limit. Record age groups and reported age ranges separately from community identity. Identify youth-focused studies separately from broader samples that include young people.

## Discovery and evidence assessment

Start with the existing repository to learn its classifications, evidence records and editorial style, then search primary publication databases, journal sources and trial registries. Use systematic reviews and guidelines to locate studies and assess the wider evidence, while retaining the individual-study identities behind pooled results. Prioritise relevance and reliable methods; journal reputation is one signal, not a substitute for appraisal.

For each candidate:

1. Resolve title, authors, year, journal, DOI, PMID and trial registration where available. Match the identity across sources before extraction. Check corrections, retractions and publication status.
2. Deduplicate against the full repository using identifiers and title/author matching. Link protocols, secondary analyses, follow-up reports, preprints and final publications to the same study family. Do not count repeated reports as independent trials.
3. Extract population and exposure, country and setting, age range, sample size, intervention dose and provider, comparator, outcomes, follow-up, effect estimates and uncertainty. Separate reported findings from the agent's interpretation.
4. Verify design, randomisation and the actual masking roles. Record the scope of access: abstract, selected methods or full text. Use “not established” when the available source cannot support a field.
5. Retain null, mixed, negative and adverse findings. Record attrition, comparator limitations, confounding, risk of bias, cultural and service-setting limits, and overlap with other included studies.
6. Write a concise finding and limitation with source links. Add a recommendation rationale explaining the publication's relevance to this repository and the target community. Never turn a within-group change into a comparative treatment effect or an observational association into causation.

Use the repository's existing study-design, paper Trust Factor and Jadad rules. Confirm double blinding before assigning the corresponding paper score; meta-analyses do not inherit trial crosses. Chapter Trust Factor and paper study design are separate concepts. Do not invent a Jadad score, claim full-text review from an abstract, or convert automated assessment into human approval. Keep source access limits visible in the internal audit.

Use the original 50 human-approved community classifications as calibration examples, checking their recorded approval state. Classification approval is not a claim of completed full-text quality appraisal. Two useful distinctions already present in the repository are `pmid-15913391` (music therapy for abused women in shelters: direct domestic-violence relevance, with no automatic homelessness inference) and `pmid-20193089` (yoga following a flood: related trauma evidence, with no domestic-violence cohort claim). Apply the reasoning to new cases and retain the source-specific basis.

## Repository delivery

The canonical website repository is [Universal Mind on GitHub](https://github.com/universalmindpbc/u-n-i-v-e-r-s-a-l-m-i-n-d). Verify its current `staging` branch and repository instructions at the start of each implementation batch. The known local checkout is `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light`; local access is conditional on Dot's separate computer connection. Do not use another active task's temporary checkout.

Inspect the current `Informatics/library-data/` editions and expansion records, `Informatics/library-model.js`, `community-index.json`, `age-index.json` and the corresponding builders and checks. Follow the existing record identifiers and evidence fields rather than creating a competing taxonomy. Keep proposed source records, provenance and review decisions in a separate versioned addition. Extend a schema only after identifying how the library, exports and assistant consume it.

Each candidate package needs the publication identity, source URLs and retrieval dates, extracted evidence, study-family links, community and age assessments, design and quality assessment, finding, limitations, recommendation rationale, review state and immutable revision identifier. Keep raw private data, credentials and unnecessary copyrighted full text out of public files and Git.

Map verified findings into the existing `finding`, `limitation`, `evidence`, `studyDesignAssessment`, `paperTrustAssessment` and `jadad` structures. Citation counts need their source and retrieval date in `citationSnapshot`. Keep community relations and age evidence in their dedicated indexes and audits. Rebuild generated files through the repository's tools so the website, downloads and assistant receive the same approved data.

Add **AI-guided recommendations underneath the existing table of contents** within Sound, Vision and Language. Do not add a separate AI tab or replace the curated chapters. Preserve provenance as “Discovered by AI.” Add “Reviewed by Universal Mind” only after actual human approval of that specific revision. Changed evidence or wording requires a new review revision.

Use an isolated, minimal worktree and coordinate with active website work. Check free disk space before a large checkout or export. Preserve chats, session records and unique source evidence. Remove only this mission's unused reproducible temporary files after the GitHub record is verified.

## Staging and approval

Follow the existing Panthur workflow without replacing its deployment system:

1. Implement and test locally, then commit the exact candidate source.
2. Rebuild the complete Informatics JSON and CSV exports and verify reconstruction of the published sources.
3. Deploy the committed version using `./deploy-panthur-staging.sh informatics` to [permanent staging](https://staging.universalmind.tv/informatics/library.html?collection=all&view=search).
4. Verify changed records, recommendation placement, filters, counts, links, exports and responsive layouts. Keep browser checks hidden and use process-level muted Chromium for any permitted media test. Never invoke native fullscreen or audible playback without Ben's immediate explicit approval.
5. Record deployment evidence and push the completed staging commits to GitHub. Return the staging URL, source commit, accepted and rejected candidate counts, material uncertainties and the records awaiting Universal Mind review.

Do not deploy while another release is in progress. Never deploy uncommitted files or mix another task's changes into this batch. Universal Mind's research review and production publication are separate gates. Positive feedback is not a production instruction. Production changes require Ben's explicit instruction to publish the exact approved version.

## Universal One knowledge after approval

After Universal Mind approves a specific research revision, an automated step can prepare a corresponding Universal One knowledge refresh. This is a retrieval and context update, not model-weight fine-tuning. The approval event and refresh mechanism are proposed work; their existence and operation need implementation and verification before activation.

Design the handoff around an immutable approval record containing publication IDs, approved content hashes, reviewer attribution, approval time and the source commit. The refresh consumes only those approved revisions, rebuilds the relevant knowledge/index material, and records the resulting version. Keep staging candidates and rejected or superseded revisions outside the production assistant's retrieval inputs.

Verify the refreshed assistant on staging against the exact approved revision. Test retrieval and citations, distinctions between direct and inferred evidence, uncertainty and null findings, youth versus mixed-age coverage, and refusal to present pending candidates as approved research. Test repeated approval events for duplicate prevention, approval withdrawal and failed-refresh recovery. Preserve the last verified knowledge snapshot until the replacement passes.

Promote the website and its matching assistant knowledge together only after explicit production publication authorization. A research approval alone does not trigger a production deployment. Record the deployed source and knowledge versions, retain a rollback target, and confirm the live assistant cites the approved sources. Do not claim success merely because a file was written or an indexing job completed.

## Continuing work and later phases

Maintain a durable queue, search history, deduplication register, review backlog, usage record and last completed checkpoint. Prioritise unresolved evidence questions and gaps in the approved coverage. Avoid repeatedly searching unchanged sources or accumulating a review backlog faster than Universal Mind can assess it. Notify Ben when a review batch is ready, a material finding changes, a limit is reached or a decision is needed; keep routine unchanged checks quiet.

After the domestic-violence pilot is reviewed, expand to the other Communities and Contexts and age groups. Later prepare organisation features for **Orygen** and **Black Dog Institute**, using verified institutional affiliations and publication sources. Do not imply partnership, endorsement or ownership of an organisation's repository. Select Headspace work by its actual research provenance if that scope is later requested.

## Capability and access confirmation

Official documentation establishes that Dot can maintain responsibilities between conversations, research and work with files or software in its cloud computer, and delegate tasks to Work or Codex. Cloud research can continue while Ben's computer is off. Local repository and Panthur work requires an available connected computer or an already configured coding environment with the necessary tools and permissions. Dot's local-computer permission is separate from Codex access, and the connected computer needs to remain online with the ChatGPT app open. These capabilities do not establish the current account's connections. [Dot capabilities](https://learn.chatgpt.com/docs/dots), [task delegation](https://learn.chatgpt.com/docs/dots/tasks-and-memory), [computer and app access](https://learn.chatgpt.com/docs/dots/computers-and-apps).

Dot's first reply needs to identify its available research tools, GitHub account and repository access, connected computer or coding environment, ability to run the existing builders and tests, and Panthur staging access. Report each as verified, unavailable or unverified. Keep secrets in the existing protected credential mechanism. A successful first staging batch is the practical evidence that the complete research-to-review workflow works.
