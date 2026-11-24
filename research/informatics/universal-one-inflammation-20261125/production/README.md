# Universal One production release

Ben explicitly approved production publication on 25 November 2026. This release promotes approved staging commit `c348d1105ec7aceb2b97e080ffde6f520a6d1ff3` without changing its application source.

Universal One now retrieves both General research chapters: DOCK2, trauma and PTSD (33 source records), and oxytocin, OXTR and inflammation with a focus on IL-6 (42 source records). The response retains evidence tiers, null and opposite-direction results, study-family links, source-access limits and exploratory intervention-response status.

## Deployment

- Existing production Worker deployment via `cloudflare/wrangler.informatics-production.toml`.
- Production Worker: `a5c905dd-3150-493a-a7e4-88af394a1117`.
- Previous production Worker: `2b65b164-2b7b-418a-89e0-76d960fd7cfe`.
- Knowledge version: `general-inflammation-20261125-v3`.
- Knowledge SHA-256: `7b58c89f93dadb5891b79f2ba113bfa0529dca253c5fb75c9842c77a8f3d67f5`.
- No static website uploads, shared database writes, model fine-tuning, hardware jobs or funded studies.
- Existing production model, reasoning, budgets, origins and bindings retained.
- Exact release time and production tag are recorded in `release.json`.

## Verification

- Approved source and input hashes match the staging release; the scoped local checks pass.
- Production exposes all 75 source records with every approved appraisal field and existing library classification intact.
- REST and MCP chapter responses agree. All 12 paginated JSON/CSV exports reconstruct the same 1,128 records without duplicate IDs.
- The four published JSON files—General edition, main library, DOCK2 register and OXTR/IL-6 register—match committed bytes exactly. The host rejected Python requests with HTTP 406; the existing curl method verified the same published files successfully.
- Production health matches the approved knowledge version; staging health and inventory hashes remain unchanged.
- A real production conversation returned cited findings for both topics. Three OpenAI provider responses completed at maximum reasoning effort; the answer rendered in Universal One and its citation interaction worked.
- Desktop and mobile screenshots were inspected. The dedicated Chromium process had `--mute-audio` before navigation. Playback, microphone, native fullscreen and study actions were blocked; no browser errors occurred, and the browser closed after verification.
- Production QA used the remaining allowance from the original US$6 task ceiling. The combined conservative usage bound is recorded in `release.json`; it is not a billing receipt.

## Live pages

- OXTR/IL-6: https://universalmind.tv/informatics/research/?collection=general&chapter=13
- DOCK2/PTSD: https://universalmind.tv/informatics/research/?collection=general&chapter=12
- Permanent staging proof: https://staging.universalmind.tv/informatics/research/?collection=general&chapter=13

The production audit commit and annotated release tag accompany this record on GitHub. The temporary checkout is removed after the remote refs and durable evidence copies are verified.
