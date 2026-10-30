# Production release — Communities, age groups and Universal One

Ben explicitly approved publishing Communities and Contexts, the Age group dropdown and Universal One guidance on 30 October 2026. The release is pinned to staging commit `36fe9a2d3869f90083907ff7c9001aa9c5d8a21f`. Additional research from Dot remains outside this production release.

The approved source includes 1,108 existing publications, contextual age and community counts, source-linked classifications, related-research discovery and the assistant navigation tool. It preserves the human-curated contents. This release updates Universal One's supplied knowledge and tools; model weights, the publication retrieval database and the future approval-event pipeline are unchanged.

Deployment uses the existing production Worker configuration and the existing Panthur `informatics` scope. No staging service or website deployment is performed. Production verification covers the actual browser filters, exported filtered records, desktop/mobile layouts, live OpenAI responses and exact HTTP hashes for changed public assets and every part of both current complete downloads.

Previous production Git revision: `2e34aa822120ea38fbb28541f9dd738044ec1385`.
Previous production Worker version: `bd50e720-06b8-4da0-80c1-fd45069a17c3`.
New production Worker version: `b3a48388-afb9-4cc1-9000-4d936482af0e`.

For rollback, use the previous production revision with the same Panthur scope and the recorded previous Worker version. Keep additional staging research out of a production rollback or promotion until Ben approves it.
