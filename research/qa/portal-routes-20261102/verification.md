# Staging verification — 2 November 2026

Published source: `290d6116fd10479e06a36c48352a27dd9dc27071`. Staging only. Production remains at `a2d6cb9b83340e841c9362cefd5d193aff63ee56`.

## Scope

- Canonical addresses for eleven Informatics sections and fifteen unique I AM chapter documents, preserving existing menu labels, order and nested destinations.
- Readable website, Informatics and I AM maps; a root XML index separating portals, chapters, Atlas records, publications and other existing public pages.
- Events and Festivals remain explicit main-map destinations.
- Old About/Atlas, Science collection and I AM page URLs retain supported redirects. Collections, records, repeated filters and forwarded section selections survive migration. Embedded source documents remain available.
- Shared history updates retain the active player and fullscreen owner. Browsing Check In retains playback; submitting a check-in and entering research participation retain their existing handoffs.
- Original page-relative resources, standalone Shop entry and phone entry rules retain their prior behavior.

## Verification

- 51 live browser checks; zero page errors. These cover all Informatics main sections, I AM menus, Back/Forward, collection links, direct entries, both portals within the root shell, the phone editorial flow, and layouts at 1470, 1024, 390 and 320 pixels.
- Media assertions compare the same element, source, advancing current time, volume, mute state and fullscreen owner. A dedicated Chromium process launches with `--mute-audio`; every automated media context is paused and closed. Fullscreen ownership is instrumented. Native fullscreen, physical iPhone Safari and subjective audio quality were not tested.
- 70 HTTP checks cover direct chapter documents, legacy redirects, repeated filters, embedded views, map files, Events/Festivals and phone rules.
- 65 live source comparisons pass. Three HTML responses use existing Cloudflare email protection; reversing only that known encoding restores their exact committed source hashes. Server configuration is verified behaviorally, not retrieved through the public website.
- 1,362 scoped deployment-manifest entries match source. The native I AM index is verified by its direct HTTP hash because the existing manifest uses `index.html` for the root landing page.
- All five new immutable export parts return the expected HTTP sizes. Complete local export integrity passes for 1,194 sources, dataset `6ec89288db0d688635045ab6f3388e49fd5418ef4743493a1cc151f8807af978`. Earlier immutable revisions remain available.
- Existing staging preflights pass for media handoff, owner-state protection, broadcast clocks, catalogues, interactions, circle rooms, care worlds, public crawler access, Informatics discovery, sovereignty, Shop, rewards, privacy, citizen data and programme guides.
- Panthur protected owner runtime state was checked before and after each I AM deployment and remained unchanged.

No GPT model, inference endpoint or submission algorithm changed. The existing check-in inference workflow was not exercised in this navigation-only verification.

## Proof pages

- https://staging.universalmind.tv/sitemap/
- https://staging.universalmind.tv/informatics/sitemap/
- https://staging.universalmind.tv/iam/sitemap/
- https://staging.universalmind.tv/informatics/sound/
- https://staging.universalmind.tv/iam/tv/

The source, deployment manifest and verification evidence are committed together in the staging audit. Production requires Ben's explicit approval after proofing.
