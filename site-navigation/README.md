# Portal navigation

`portals.json` is the shared navigation record for the existing menu order, canonical chapter addresses, original source documents and readable maps.

Build with `python3 tools/build-portal-navigation.py`. This creates the browser lookup, static chapter documents, three readable maps and the XML sitemap index. The native page sources remain the editable interface. The Informatics chapter documents include each chapter's guide and JSON in their initial HTML.

The browser controller updates history inside the active player. Child page loads replace their own history entry; the outer fullscreen shell owns the single visitor-facing history entry. Navigation does not recreate the media element. A submitted check-in and research participation retain their existing explicit handoff behaviour.

Direct legacy requests receive a permanent redirect selected from the registry. Existing query selections remain attached. Embedded source requests retain their existing documents and avoid redirect loops. The current phone entry policy remains in place.

Run the source check with `node tools/check-portal-navigation.mjs`. Browser checks use `tools/check-portal-navigation-browser.mjs`; set `PORTAL_LIVE=1` for the deployed staging source. The browser must launch in a separate process with `--mute-audio`. The test instruments fullscreen ownership and never invokes native fullscreen. Use `tools/check-portal-navigation-http.mjs` for actual staging redirect and document checks.

Deployment uses the existing Panthur staging commands. The `ai-wiki` target includes the new public maps, shared router and I AM chapter documents. Informatics publishes its chapters with the existing `informatics` target. `IAM_RELEASE_FILES` optionally limits `iam-changed` to an explicit committed source file list while preserving unrelated manifest rows. `directory` publishes the retained outer shell, and `redirects` publishes the compatibility rules. Production requires Ben's explicit approval after staging proof.
