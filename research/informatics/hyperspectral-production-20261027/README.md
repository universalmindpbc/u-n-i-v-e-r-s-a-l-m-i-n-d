# Approved Informatics production release

Released 27 October 2026 at 13:52 Australia/Sydney. Ben explicitly authorized publication of the approved Informatics staging version in this chat.

Approved source: `e0ea13786febba2624e72452bf9bb4681ecdbcc0`. Prior production record: `45508da032e96b3e366b84cff7ece795b45ea7d1`. Informatics source tree: `eb6743c4d3540a5693fb5918e15d9364abf0fcf9`. The published website source remains identical to the approved staging source. The release tag is `production-2026-10-27-1352`.

Production: https://universalmind.tv/informatics/library.html?collection=general&chapter=11

Staging reference: https://staging.universalmind.tv/informatics/library.html?collection=general&chapter=11

## Deployment and recovery

The existing `./deploy-panthurlive.sh informatics` publisher transferred all 2,147 changed assets. Local disk exhaustion interrupted only the final manifest rename. Recovery compared all 13,494 scoped manifest entries with the committed files, restored the completed manifest, and reran the same publisher. The resumed run reported zero changed uploads and successful completion. Duplicate immutable task files were converted to independent copy-on-write files to recover disk space. No unrelated user files were deleted.

The existing `redirects` mode published the approved sitemap and reading guide. All 1,075 manifest entries outside Informatics remain unchanged. The I AM index, research page and root entry match the prior production source.

## Verification

All 2,139 changed web/data assets match the approved source: 2,137 HTTP responses are byte-identical; two HTML responses contain the host's email-obfuscation wrapper and match exactly after reversing that specific transformation. Raw and reconstructed source hashes remain distinguished in `http-verification.json`. The existing I AM research page has the same host transformation and matches its prior production source after decoding.

All ten added complete-export parts, including retained preceding export revisions, were fetched and verified in full: 440,849,268 bytes. The current JSON/CSV complete dataset uses five parts totalling 220,766,303 bytes. Production crawler settings permit the approved public content; staging retains noindex and crawler exclusion.

A separate headless Chromium process launched with `--mute-audio` verified the Hyperspectral chapter at 1470, 390 and 320 pixels: navigation, the final deep link, all six subchapters, 240 bibliography entries, 13 timeline milestones, reference-ID searches, patent/unresolved filters, source dialogs, version links and byte-identical JSON/CSV browser downloads. Additional tests verified Sound, Vision and Language Trust Factor and study-design filters, article/chapter badge distinctions, keyboard closing and responsive layouts at all three widths. No relevant JavaScript page errors occurred. All automated media and browser contexts were closed.

Metadata and evidence distinctions remain unchanged: 14 citation identities retain review flags; documentary sources and unassessed scientific claims remain labelled. The original Notion pages were not edited.

The release commit contains deployment metadata and verification artifacts only. Its Informatics tree equals the approved staging tree. GitHub branch and annotated-tag references are verified after the atomic push.
