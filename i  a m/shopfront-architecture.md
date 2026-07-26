# I AM Shop — presentation architecture

Status: **future-facing working note; do not activate without Ben's go-ahead**

## Current presentation layer

The first shopfront is deliberately human-curated. It proves the editorial and experience architecture without claiming that product recommendation science, retailer relationships or affiliate tracking are live.

- This presentation is exclusively **James Bondage**. Other mastheads will be authored separately after their own editorial direction is commissioned; they are not represented here.
- Functional forms within James Bondage: lingerie, second skin, swim, movement and after dark.
- Products may belong to more than one form.
- Imagery is selected human-first: prefer a woman present in the frame, a visible or forward-facing gaze where available, and an in-situ or lived context over an isolated product on white. The test is whether the image carries emotion and human experience while still revealing the piece.
- The current working edit contains 312 Safari references across 23 retailers. The mock-up exposes the breadth of that edit while limiting the photographed opening selection to avoid retail overload.
- Music Television remains the outer experience. A current Universal Mind music/video programme continues into Shop. A quiet session offers Café del Mar Chill after an explicit play gesture.
- A discreet day/night control lets the viewer choose a white or black presentation and remembers that choice locally. A first visit always opens in night mode; an explicit day choice or a future approved adaptive theme decision may override that default.

## Next presentation layer — catalogue and expanded product view

The next design step is a classic, minimal catalogue beneath the editorial shopfront. It should feel like the same James Bondage world, but optimise for calmly seeing the full breadth of the collection.

- One catalogue view serves both brand and category routes: all ERES, all WARDROBE.NYC, all swim, bras, bodysuits, dresses, or another approved form.
- Desktop uses three equal product columns for as many rows as the result set requires; tablet resolves to two columns and mobile to one.
- The first presentation can hold roughly 15–30 products at once—five to ten desktop rows—without promotional tiles, pop-ups or competing calls to action.
- The default catalogue thumbnail is always the retailer's first official product hero. Do not manually search alternate gallery frames during bulk ingestion; use a separate, explicitly approved editorial-image override only when Ben or Vogue supplies a stronger in-situ image.
- Each card contains one human-first image, brand and product name. Selecting it opens a quiet expanded view rather than requiring a separate internal product page.
- The expanded view enlarges the hero image and holds the brand, product title, forms/categories, concise editorial context and one clearly disclosed route to the retailer. It closes back into the same catalogue position without interrupting the music experience.
- Each expanded state should have a shareable query or hash URL and correct browser Back behaviour. This provides product-level navigation without maintaining hundreds of hand-authored pages.
- A structured catalogue record should drive every view so a product, URL or image is updated once and reflected across brand results, category results, expanded views and later adaptive sequencing.
- The Notion page **`j a m e s  b o n d a g e  [ s h o p ]`** is the canonical master registry for the 300+ products selected across the 23 brands. Future ingestion should reconcile products from that page rather than re-extracting Safari bookmarks or discovering products on the web. Retailer pages may supply current metadata only for a canonical URL already present in the Notion registry; neither GPT nor an ingestion process may discover, infer, replace or add a product.
- `shop-approved-products-v1.json` is the fail-closed staging projection for the current signed-off mock-up. It contains only the URLs Ben explicitly supplied for this round and must be reconciled back to the Notion master before the wider catalogue is populated. A non-product homepage remains a brand link rather than becoming a catalogue card.
- Every ingested card retains its approved `sourcePageUrl`, the retailer's exact gallery-zero `sourceImageUrl`, `sourceImageIndex: 0`, retrieval date and any separate official price-source URL. If an approved page, first image, description or price cannot be verified, ingestion stops for that record and requests review instead of choosing an alternative.
- Parties, cities, seasons or cultural moments can become temporary editorial pages that select product IDs from the same catalogue—for example an after-dark party edit or a city-specific summer wardrobe—without duplicating product content.
- If editorial storytelling, SEO or a retailer partnership later justifies true product pages, generate those routes from the same catalogue records rather than authoring a second product system.

## Future Fashion Tensor — hold for approval

The existing Notion page **`j a m e s  b o n d a g e  [ s h o p ]`** becomes the beginning of a human-readable Fashion Tensor kernel, parallel in spirit to the music tensor. It should remain the editorially inspectable product source before any adaptive ordering is attempted.

Add catalogue reconciliation fields so every product can be audited through ingestion: `approved`, `listed on shop`, `staging checked`, `retailer URL checked`, `first hero checked`, `description checked`, `price checked`, `last checked`, `shop product ID` and `review notes`. The public catalogue should only include records that are approved and marked ready; publishing a product should update its Notion listing status rather than creating a disconnected second list.

Possible record layers:

1. Product identity: brand, retailer, canonical URL, imagery, image type, subject presence, gaze, setting, availability state and rights/provenance.
2. Editorial identity: approved masthead and category membership, form, silhouette, colour, texture, coverage, movement, season and occasion.
3. Citizen Needs hypotheses: carefully reviewed relationships to chosen contexts such as calm, confidence, play, connection, self-expression, restoration or activation.
4. Emotional tone: human-authored descriptors and confidence, with space for ambiguity and multiple readings.
5. Mental-health boundary: non-diagnostic language, contraindication/sensitivity notes where relevant, evidence status and required human review.
6. Commercial layer: retailer, geography, affiliate eligibility, commission, price/availability freshness and disclosure state. Commercial value must not override citizen fit.
7. Governance: author, reviewer, source, review date, consent basis, version and audit notes.

The online tensor would be a versioned, machine-readable projection of approved Notion records—not a second uncontrolled source of truth. Product placement logic could then rank or sequence approved candidates while preserving editorial diversity and providing an understandable reason for the ordering.

## Adaptive experience principles

- Browsing should become more relevant, not more coercive.
- No diagnosis, treatment claim or inference of a mental-health condition from shopping behaviour.
- Citizen Needs or emotional context must be voluntary, minimal and revocable.
- Do not use distress, compulsion, body insecurity or urgency to increase conversion.
- Keep a clear route back to an unpersonalised chronological/editorial edit.
- Measure wellbeing and trust signals alongside relevance; do not optimise only for clicks, basket value or commission.
- Maintain novelty and brand diversity so adaptation does not become a narrowing loop.
- Explain why an edit or piece is being surfaced in plain language.
- Require editorial and scientific review before a Citizen Needs mapping can influence placement.

## Proposed implementation sequence — only after approval

1. Agree the scientific and editorial question the Fashion Tensor is allowed to answer.
2. Extend `j a m e s  b o n d a g e  [ s h o p ]` with the controlled vocabularies, evidence/status fields and review workflow, preserving its existing 300+ product records.
3. Hand-tag a small, diverse pilot set and test inter-rater consistency.
4. Export a versioned public-safe tensor and validate it against the source records.
5. Prototype deterministic, explainable sequencing before involving GPT.
6. If GPT is later used, constrain it to retrieval and explanation over approved records; it must not invent product-to-need mappings.
7. Run privacy, mental-health safety, bias, body-image and commercial-conflict review.
8. Test quietly on staging with explicit consent and a visible unpersonalised alternative.

## Presentation disclaimer

Retail and affiliate relationships are proposed and not yet active. Product imagery in the mock-up is used for private presentation and remains the property of the respective retailers and brands.
