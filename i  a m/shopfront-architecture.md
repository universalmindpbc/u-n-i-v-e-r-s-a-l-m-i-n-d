# I AM Shop — operating architecture

Status: **approved catalogue kernel and staging architecture; adaptive scoring remains review-gated**

## Current shopfront layer

The James Bondage shopfront is deliberately human-curated. It establishes the editorial and experience architecture while adaptive recommendation science and affiliate tracking remain separately governed layers.

- This presentation is exclusively **James Bondage**. Other mastheads will be authored separately after their own editorial direction is commissioned; they are not represented here.
- Functional forms within James Bondage: lingerie, second skin, swim, movement and after dark.
- Products may belong to more than one form.
- Imagery is selected human-first: prefer a woman present in the frame, a visible or forward-facing gaze where available, and an in-situ or lived context over an isolated product on white. The test is whether the image carries emotion and human experience while still revealing the piece.
- The current Notion authority contains 428 numbered registry records: 423 runtime products plus five retained brand/collection references. The runtime catalogue comprises 394 products in the primary kernel and 29 earlier Champagne Bohemia stock records in the preserved extension. The 2026-08-02 intake adds 20 retailer-grounded products and two non-duplicating radio-station edit memberships: 97 exact Champagne Bohemia products and 17 unique Inner Planes products from 18 supplied links. The 2026-08-04 intake adds 11 more Inner Planes garments, taking that edit to 28 unique products from 29 supplied links across both batches. Edit membership is additive: Calvin Klein and SKIMS retain their maker routes, while the supplied Studio K products remain exclusive to Inner Planes, without cloning a product record.
- The all-black entry screen is the direct `/shop/` arrival. It prevents the Universal Mind home experience flashing or loading behind Shop, then uses the viewer's single **enter** gesture to request full screen and authorise the James Bondage Parties audio transport before revealing the shopfront.
- Music Television remains the outer experience. A current Universal Mind music/video programme continues into Shop. After an explicit play gesture, a quiet session starts the current **James Bondage Parties** Zip/Perlon programme through its own stable transport. The Shop transport does not hard-seek, change playback rate or chase the shared broadcast clock; uninterrupted sound takes priority over programme synchronisation while browsing.
- The moving masthead remains the James Bondage live channel but is capped at 240p for this narrow presentation band. Editorial loops are locally compressed, silent, fast-start MP4s so the image-led page remains calm and responsive.
- The Shop includes the full shared Universal Mind navigation: the rotating flower, the established dropdown destinations and Shop as the final item after Contact.
- James Bondage Health **Sex Ed** is available in the main shop navigation and as an eight-programme horizontal shelf above the lower masthead. Each card opens the established programme experience in a separate tab, keeping the shop and its music session intact.
- A discreet day/night control lets the viewer choose a white or black presentation and remembers that choice locally. A first visit always opens in night mode; an explicit day choice or a future approved adaptive theme decision may override that default.

## Next presentation layer — catalogue and expanded product view

The next design step is a classic, minimal catalogue beneath the editorial shopfront. It should feel like the same James Bondage world, but optimise for calmly seeing the full breadth of the collection.

- One catalogue view serves both brand and category routes: all ERES, all WARDROBE.NYC, all swim, bras, bodysuits, dresses, or another approved form.
- Desktop uses three equal product columns for as many rows as the result set requires; tablet resolves to two columns and mobile to one.
- Each route loads 24 products at first—eight complete desktop rows—then offers a calm **load 24 more** control. This avoids the loss of orientation caused by endless scrolling while keeping the experience lighter than traditional numbered pagination.
- The loaded count, brand, type and sort order are retained in the hash URL. Opening and closing an expanded product returns to the same grid state and scroll position.
- Catalogue imagery is restricted to the exact approved retailer page and its official gallery. Prefer the first official frame with a person, then a visible face or forward-facing model, then the retailer's first official hero as the deterministic fallback. A separately approved editorial-image override may be used when Ben or Vogue supplies one. Never source an image from another product or an inferred URL.
- Each card contains one human-first image, brand and product name. Selecting it opens a quiet expanded view rather than requiring a separate internal product page.
- A canonical couture or bespoke record may present an explicitly supplied editorial gallery as individual visual tiles on its brand route. Each tile remains part of the one canonical product record and opens only its selected image with the same verified description and retailer route.
- The expanded view enlarges the hero image and holds the brand, product title, optional retailer colour or range, verified price, the retailer's own signed-off product description and one clearly disclosed route to the retailer. Product types and internal categories remain useful filter metadata but are not repeated in the customer-facing copy. It closes back into the same catalogue position without interrupting the music experience.
- Each expanded state should have a shareable query or hash URL and correct browser Back behaviour. This provides product-level navigation without maintaining hundreds of hand-authored pages.
- A structured catalogue record should drive every view so a product, URL or image is updated once and reflected across brand results, category results, expanded views and later adaptive sequencing.
- The Notion page **`j a m e s  b o n d a g e  [ s h o p ]`** and its Fashion Tensor database are the canonical master registry. Future ingestion should reconcile products from that authority rather than re-extracting Safari bookmarks or discovering products on the web. Retailer pages may supply current metadata only for a canonical URL supplied and approved by Ben. Neither GPT nor an ingestion process may discover, infer, replace or add a product without that exact source URL before it is added to both Notion and the runtime kernel.
- `shop-product-kernel-v1.json` is the Notion-backed, fail-closed catalogue inventory and primary runtime kernel. Every canonical product URL has an exact source-listed card and approved hero image or product film on its brand, editorial-edit or universal route. `shop-radio-edits-v1.json` records ordered additive memberships for Champagne Bohemia and Inner Planes; one canonical product may appear on its maker route and in a radio edit without duplicated product data. Every card opens the same internal ERES-style detail view before the viewer may continue to the retailer. Verified fields are shown; an unavailable price, colour/range or retailer description remains blank and is marked for review in Notion rather than being replaced by filler copy. `shop-approved-products-v1.json` remains the narrower ERES audit manifest. A non-product homepage remains a brand link rather than becoming a catalogue card.
- Every ingested card retains its approved `sourcePageUrl`, its selected official `sourceImageUrl`, gallery index, retrieval date and any separate official price-source URL. Retailer-authored copy is preserved rather than AI-rewritten. If an approved page, official image, description or price cannot be verified, the field remains blank and the record requests review instead of inventing, inferring or substituting content.
- Parties, cities, seasons or cultural moments can become temporary editorial pages that select product IDs from the same catalogue—for example an after-dark party edit or a city-specific summer wardrobe—without duplicating product content.
- If editorial storytelling, SEO or a retailer partnership later justifies true product pages, generate those routes from the same catalogue records rather than authoring a second product system.

## Fashion Tensor kernel — active inventory; adaptive scoring held for review

The existing Notion page **`j a m e s  b o n d a g e  [ s h o p ]`** is now the human-readable source for the child database **`James Bondage Fashion Tensor Kernel [ shop ]`**, parallel in spirit to the music tensor. The kernel contains one canonical record per approved source URL, preserves duplicate occurrence counts, and remains the editorially inspectable source before any adaptive ordering is attempted.

The database includes catalogue reconciliation fields so every product can be audited through ingestion: `approved`, `listed on shop`, `staging checked`, `retailer URL checked`, `first hero checked`, `description checked`, `price checked`, `last checked`, `shop product ID` and `review notes`. Its Inventory, ERES, Ready to list, Listed on Shop, Needs review and Tensor review views separate source authority from public readiness. The public catalogue exposes only verified customer-facing fields, but every approved card opens the same internal expanded Shop view; unresolved fields remain absent and visible to editors as review work rather than becoming customer-facing placeholder language.

Possible record layers:

1. Product identity: brand, retailer, canonical URL, imagery, image type, subject presence, gaze, setting, availability state and rights/provenance.
2. Editorial identity: approved masthead and category membership, form, silhouette, colour, texture, coverage, movement, season and occasion.
3. Citizen Needs hypotheses: carefully reviewed relationships to chosen contexts such as calm, confidence, play, connection, self-expression, restoration or activation.
4. Emotional tone: human-authored descriptors and confidence, with space for ambiguity and multiple readings.
5. Mental-health boundary: non-diagnostic language, contraindication/sensitivity notes where relevant, evidence status and required human review.
6. Commercial layer: retailer, geography, affiliate eligibility, commission, price/availability freshness and disclosure state. Commercial value must not override citizen fit.
7. Governance: author, reviewer, source, review date, consent basis, version and audit notes.

The online tensor would be a versioned, machine-readable projection of approved Notion records—not a second uncontrolled source of truth. Product placement logic could then rank or sequence approved candidates while preserving editorial diversity and providing an understandable reason for the ordering.

## Controlled Shop category / type taxonomy

The customer-facing category / type control is the ordered `jb-shop-taxonomy-v1` projection of the Notion Fashion Tensor's `Shop Taxonomy` field. Its exact public vocabulary is: lingerie (all), swimwear (all), athleisure (all), ready to wear (all), haute couture (all), bra, brief, bodysuit, hosiery, robe, after dark, swimsuit, bikini, rash vest, coverup, jumpsuit, dress, shorts, pants, leggings, crop and accessories. Products can hold more than one controlled value so a bikini can appear in both swimwear (all) and bikini without duplicating its canonical record.

The runtime kernels preserve these values in `shopTypes`; the Shop renders the dropdown from the kernel's ordered taxonomy contract rather than reconstructing options from legacy Forms or Product Type values. Notion remains authoritative, the two product kernels are its fail-closed online projection, and every listed product must have at least one controlled value. New intake is incomplete until Notion, the relevant product kernel and staging filtering agree.

Specific product evidence takes precedence when neighbouring categories could overlap: tights, stockings, socks and explicit hosiery belong to hosiery rather than leggings. Other catalogue edge cases can be corrected in the same Notion-backed field without changing the public vocabulary.

Haute Couture is exclusive of Ready to Wear in the public taxonomy. The canonical Iris van Herpen bespoke record and all six of its approved gallery views are Haute Couture only; those six views expand on both the Iris brand route and the universal Haute Couture edit. Annie’s Ibiza records enter Haute Couture only when their authorised retailer description explicitly says Made To Order or combines pre-order availability with being lovingly handmade; neighbouring Annie’s pieces without that evidence remain in their ordinary types. Rash vest includes the exact thin, water-ready rashguard, surf-top and surf-suit records reviewed across Rashi World, Free People and Lisa Marie Fernandez. Wetsuit-weight 1.5–2 mm neoprene records remain excluded.

## Search and controlled colour layer

Search and colour are quiet catalogue-navigation tools, not discovery engines. The desktop catalogue holds one compact sticky rail in this order: search, brand, type, colour, sort and result count. On mobile, search spans the rail above the two-column controls. There is no search drawer, predictive overlay, fuzzy recommendation or decorative icon chrome.

- The public colour vocabulary is deliberately short: black, white, nude / neutral, brown, grey, red, orange, yellow, green, blue, cobalt, purple, pink, silver, gold and multi-colour / print.
- `Unknown` is an internal evidence state only. It is never offered as a customer filter and never printed on a product card.
- A colour family may be assigned only from exact retailer or Notion evidence. Explicit compound colours may belong to more than one family. Cobalt remains distinct from blue. Creative colour names that do not contain reliable colour evidence remain unknown; product imagery is never used to infer colour.
- The Notion Fashion Tensor remains authoritative. Its audit projection uses `Colour Family`, `Colour Evidence Status`, `Colour Evidence Text`, `Colour Source URL`, `Colour Source Type`, `Colour Checked At` and `Colour Taxonomy Version`; optional material and collection evidence remain separate fields.
- The online kernel publishes the same `jb-colour-v1` vocabulary and the source/audit field contract. Legacy records retain exact `color` evidence and the authorized `retailerUrl`; the browser maps only explicit colour words and fails closed on uncertain names.
- Transparency is a look property rather than a colour. It stays out of the colour dropdown and enters search only through retailer, approved Notion or Ben-supplied evidence. The Notion fields are `Look Properties`, `Look Evidence Status`, `Look Evidence Text`, `Look Source Type`, `Look Checked At` and `Look Taxonomy Version`; the online projection is `lookProperties` with its matching audit fields. Product imagery is never used to infer transparency.
- Search is deterministic, case-insensitive and diacritic-insensitive. Every entered token must occur across approved brand, product name, retailer-authored description, raw colour, controlled colour family, material, collection or controlled look metadata. `transparent`, `translucent`, `sheer` and `see through` are equivalent only when one of those evidence-backed terms is present. Internal product categories are excluded from the search surface.
- Search and colour state are retained in the catalogue hash query alongside brand, type, sort and loaded count. Any changed search or filter returns the grid to 24 pieces; **load 24 more** remains the only progressive expansion.
- A zero-result edit says only **No pieces match this edit.** and offers one quiet control to clear search and filters. Brand-specific routes do not repeat the same brand name on every card.

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

## Adaptive implementation sequence — only after separate scientific/editorial approval

1. Agree the scientific and editorial question the Fashion Tensor is allowed to answer.
2. Review and refine the existing controlled vocabularies, evidence/status fields and workflow in the Fashion Tensor Kernel without changing Ben's approved exact-product source authority.
3. Hand-tag a small, diverse pilot set and test inter-rater consistency.
4. Export a versioned public-safe tensor and validate it against the source records.
5. Prototype deterministic, explainable sequencing before involving GPT.
6. If GPT is later used, constrain it to retrieval and explanation over approved records; it must not invent product-to-need mappings.
7. Run privacy, mental-health safety, bias, body-image and commercial-conflict review.
8. Test quietly on staging with explicit consent and a visible unpersonalised alternative.

## Rights and attribution

The catalogue preserves the exact approved retailer source URL and image provenance for each record. Product imagery and retailer-authored product language remain attributable to their respective brands and retailers.
