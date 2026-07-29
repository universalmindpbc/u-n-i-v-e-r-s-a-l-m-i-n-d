import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const shop = read("i  a m/shop.html");
const shopStyle = read("i  a m/shop.css");
const shopScript = read("i  a m/shop.js");
const catalogue = JSON.parse(read("i  a m/shop-catalogue-v1.json"));
const productKernel = JSON.parse(read("i  a m/shop-product-kernel-v1.json"));
const approvedProducts = JSON.parse(read("i  a m/shop-approved-products-v1.json"));
const architecture = read("i  a m/shopfront-architecture.md");
const television = read("i  a m/adaptive-environment-television.js");
const index = read("i  a m/index.html");
const htaccess = read(".htaccess");
const redirects = read("_redirects");

for (const required of [
  "James Bondage",
  "26 brands",
  "359",
  "JAMES BONDAGE / UNIVERSAL MIND",
  "Bordelle",
  "Angela Dress",
  "WARDROBE.NYC",
  "KARLA ŠPETIĆ",
  "The Upside",
]) {
  assert.match(shop, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Missing shop presentation text: ${required}`);
}

assert.match(shop, /<h1 id="shop-title"><span>James<\/span><span>Bondage<\/span><\/h1>/, "Fashion masthead must remain James Bondage, not James Bondage Health");
for (const absent of [
  /Champagne Bohemia/i,
  /inner planes/i,
  /modul8 infinity/i,
  /Designed as a quieter way to browse/i,
  /No urgency mechanics/i,
  /A shop that pays attention/i,
  /NikeSKIMS/i,
  /Mima Sala/i,
  /Vivara Cross-Strap Swimsuit/i,
]) {
  assert.doesNotMatch(shop, absent, `Current shop must not contain ${absent}`);
}
assert.equal((shop.match(/<li(?:\s+class="[^"]*")?><span>/g) || []).length, 26, "Brand ledger must contain all 26 retailers");
assert.equal((shop.match(/data-product(?:\s|>)/g) || []).length, 12, "Opening edit must contain the restrained 12 authorized hero pieces");

assert.equal(catalogue.products.length, 36, "Finished ERES catalogue must contain all 36 approved product URLs");
assert.equal(new Set(catalogue.products.map((product) => product.id)).size, 36, "Catalogue product IDs must be unique");
assert.equal(new Set(catalogue.products.map((product) => product.slug)).size, 36, "Catalogue product slugs must be unique");
assert.ok(catalogue.products.every((product) => product.brand === "ERES"), "Finished ERES catalogue must remain a singular ERES edit");
assert.ok(catalogue.products.every((product) => product.imageSource === "retailer_gallery_index_0"), "Every bulk-ingested catalogue image must use the first retailer hero");
assert.equal(catalogue.priceCurrency, "AUD", "ERES proof must display the requested Australian pricing");
assert.equal(catalogue.thumbnailPolicy, "retailer_gallery_index_0_only", "ERES proof must use the deterministic first-image policy");
assert.equal(catalogue.pricesCheckedAt, "2026-07-27", "ERES prices must carry their live verification date");
assert.equal(approvedProducts.products.length, 36, "Approved ERES bookmark manifest must contain 36 product URLs");
assert.equal(approvedProducts.brandLinks.length, 1, "Approved ERES bookmark manifest must keep the non-product ERES homepage separate");
assert.equal(new Set(approvedProducts.products.map((product) => product.url)).size, 36, "Approved ERES product URLs must be unique");
const approvedProductUrls = new Set(approvedProducts.products.map((product) => product.url));
assert.deepEqual(
  catalogue.products.map((product) => product.retailerUrl),
  approvedProducts.products.map((product) => product.url),
  "ERES page must use all 36 approved product URLs in exact Notion order",
);
for (const product of catalogue.products) {
  assert.ok(fs.existsSync(path.join(iam, product.image)), `Missing ERES catalogue image: ${product.image}`);
  assert.match(product.retailerUrl, /^https:\/\/www\.eresparis\.com\//, `ERES catalogue product must keep an official retailer URL: ${product.id}`);
  assert.ok(approvedProductUrls.has(product.retailerUrl), `Unapproved ERES product URL: ${product.retailerUrl}`);
  assert.equal(product.sourcePageUrl, product.retailerUrl, `ERES product source page must equal the approved retailer URL: ${product.id}`);
  assert.match(product.sourceImageUrl, /^https:\/\//, `ERES product must retain its official source image URL: ${product.id}`);
  assert.match(product.sourceImageUrl, /_PDP_D_1\.jpg(?:\?|$)/, `ERES product must use the retailer's gallery-zero PDP_D_1 image: ${product.id}`);
  assert.equal(product.sourceImageIndex, 0, `ERES product must use the retailer's first official product image: ${product.id}`);
  assert.match(product.retrievedAt, /^2026-07-2[67]/, `ERES product must carry its retrieval date: ${product.id}`);
  assert.ok(product.description?.trim().length >= 24, `ERES product must retain a concise retailer-sourced description: ${product.id}`);
  assert.match(product.price, /^AU\$ (?:\d{3}|\d\.\d{3})$/, `ERES catalogue product must keep its verified AUD price: ${product.id}`);
}

assert.equal(productKernel.counts.brands, 26, "Fashion kernel must retain all 26 approved retailers");
assert.equal(productKernel.products.length, 359, "Fashion kernel must contain exactly 359 approved canonical product URLs from Notion");
assert.equal(new Set(productKernel.products.map((product) => product.canonicalUrl)).size, 359, "Fashion kernel product URLs must be canonical and unique");
assert.equal(new Set(productKernel.products.map((product) => `${product.brand}:${product.slug}`)).size, 359, "Fashion kernel product slugs must be unique within each brand");
assert.equal(productKernel.products.filter((product) => product.metadataStatus === "Metadata ready").length, 356, "All retailer-verifiable records must be metadata-ready");
assert.equal(productKernel.products.filter((product) => product.description?.trim()).length, 358, "Retailer-authored descriptions must be retained wherever published");
assert.equal(productKernel.products.filter((product) => product.price?.trim()).length, 357, "Verified display prices must be retained wherever published");
assert.equal(productKernel.products.filter((product) => product.requiresReview).length, 3, "Only the three retailer-unpublished metadata gaps may remain review items");
assert.ok(
  productKernel.products.filter((product) => product.subjectPresent === true || product.brand === "ERES").length / productKernel.products.length >= 0.9,
  "At least 90% of the approved catalogue must use an official retailer image featuring a person"
);
assert.equal(productKernel.products.filter((product) => product.listedOnShop).length, 359, "Every approved product record must be listed");
assert.equal(productKernel.products.filter((product) => product.image).length, 359, "Every approved product record must carry an approved hero image");
assert.ok(productKernel.products.every((product) => product.retailerUrl?.startsWith("https://")), "Every tensor product must retain its exact retailer URL");
assert.equal(productKernel.authority.policy, "exact_notion_product_urls_only", "Notion must remain the sole product authority");
const emilioProduct = productKernel.products.find((product) => product.brand === "Emilio Cavallini");
assert.equal(emilioProduct?.retailerUrl, "https://www.emiliocavallini.com/en/engeneered-body.html", "Emilio Cavallini must retain Ben's exact approved product URL");
assert.equal(emilioProduct?.metadataStatus, "Metadata ready", "The Emilio catalogue card must use the retailer-verified metadata");
for (const product of productKernel.products) {
  assert.ok(product.slug, `Missing stable product slug: ${product.id}`);
  assert.ok(fs.existsSync(path.join(iam, product.image)), `Missing approved catalogue image: ${product.image}`);
}
for (const brand of ["Free People", "Lisa Marie Fernandez"]) {
  const products = productKernel.products.filter((product) => product.brand === brand);
  assert.ok(products.length > 0, `${brand} must be populated from the approved Notion intake`);
  assert.ok(products.every((product) => product.notionPageId && product.imageSource === "notion_first_hero"), `${brand} must preserve the exact Notion source record and first hero`);
}

const assetMatches = [...shop.matchAll(/src="(a s s e t s\/shop-mockup\/[^"]+)"/g)].map((match) => match[1]);
assert.ok(assetMatches.length >= 12, "Shop must use the locally preserved presentation imagery");
for (const relativeAsset of new Set(assetMatches)) {
  assert.ok(fs.existsSync(path.join(iam, relativeAsset)), `Missing shop image: ${relativeAsset}`);
}

const editorialFigureImages = [...shop.matchAll(/<figure><img src="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(editorialFigureImages).size, editorialFigureImages.length, "Homepage editorial figure images must not repeat");

for (const unauthorizedAsset of [
  "wardrobe-sheer.jpg",
  "karla-fluorite.jpg",
  "upside-neptune.jpg",
  "eres-providence-portrait.png",
  "bordelle-waspie-detail.jpg",
]) {
  assert.doesNotMatch(shop, new RegExp(unauthorizedAsset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Unauthorized homepage asset must be absent: ${unauthorizedAsset}`);
}

for (const suppliedSilentVideo of [
  "bordelle-look58-home.mp4",
  "annies-home-silent.mp4",
  "skims-home-silent.mp4",
  "emilio-cavallini-home-silent.mp4",
  "mugler-adut-home-1.mp4",
  "mugler-adut-home-2.mp4",
  "bordelle-look83-waspie-home.mp4",
  "nagnata-home-silent-1.mp4",
  "nagnata-home-silent-2.mp4",
]) {
  assert.match(shop, new RegExp(`<video[^>]*data-shop-silent-video[^>]*muted[^>]*playsinline[^>]*loop[^>]*>[\\s\\S]*?${suppliedSilentVideo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `Missing muted supplied homepage film: ${suppliedSilentVideo}`);
}
assert.match(shop, /href="#catalogue\/nagnata"[^>]*>[\s\S]*?nagnata-home-silent-1\.mp4[\s\S]*?nagnata-home-silent-2\.mp4[\s\S]*?<div class="shop-product__copy shop-product__copy--brand-only"><p>NAGNATA<\/p><em>view edit<\/em><\/div>/, "Nagnata films must link to the brand shopfront without a product name");
assert.match(shop, /pucci-vivara-editorial\.jpg/, "The supplied Pucci Vivara editorial still must replace the previous homepage image");
assert.match(shop, /lisa-marie-fernandez-bella-hadid\.jpeg[\s\S]*Bella Hadid wears Lisa Marie Fernandez[\s\S]*Shop The Look/, "Bella Hadid must introduce the Lisa Marie Fernandez edit");
assert.match(shop, /free-people-scuba\.jpeg[\s\S]*<p>Free People<\/p>/, "The supplied Free People scuba portrait must open the brand edit");

for (const suppliedReference of [
  "https://eu.bordelle.co.uk/products/signature-waspie-cream?variant=43656648884396",
  "https://wardrobe.nyc/collections/bodysuits/products/lace-bodysuit-w5051f25lcblk",
  "https://karlaspetic.com/product/no-v-neon-tiger-bikini/",
  "https://www.theupside.com.au/kefi-25in-midi-pant-oyster-usw226087/",
  "https://www.nike.com/au/t/jordan-brooklyn-womens-bodysuit-nZh4yxyG/IM6875-100",
  "https://triangl.com/en-au/products/celeste-jett-black-short?variant=42685752049760",
  "https://www.pucci.com/en-au/products/vivara-print-triangle-bikini-top-6hmx096h895p20",
  "https://www.emiliocavallini.com/en/engeneered-body.html",
  "https://www.eresparis.com/eu/en/lingerie/60973-0022.html",
]) {
  assert.ok(productKernel.products.some((product) => product.retailerUrl === suppliedReference), `Missing supplied product reference: ${suppliedReference}`);
}

for (const featuredReference of [
  "https://anniesibiza.com/collections/annies-favourites-1/products/theodora-gown",
  "https://skims.com/en-au/products/fits-everybody-lace-scoop-bralette-onyx",
  "https://eu.bordelle.co.uk/products/signature-harness-angela-dress-burnt-red?variant=43656631681196",
  "https://www.emiliocavallini.com/en/bouganvillea-tights.html",
  "https://triangl.com/en-au/products/celeste-jett-black-short?variant=42685752049760",
]) {
  assert.ok(productKernel.products.some((product) => product.retailerUrl === featuredReference), `Featured homepage product is missing from the canonical kernel: ${featuredReference}`);
}

assert.match(shop, /data-shop-live-band[\s\S]*data-stream-role="fashion"[\s\S]*autoplay[\s\S]*muted/, "Every Shop route must open with the silent live fashion band");
assert.match(shop, /data-shop-live-band[\s\S]*data-stream-max-height="240"/, "Shop hero must use the reduced 240p stream cap");
assert.match(shop, /cloudflare-stream-controller\.js[\s\S]*broadcast-clock-v1\.js[\s\S]*shop\.js/, "The live band must reuse the established stream controller and broadcast clock");
assert.match(shopScript, /stateAt\("fashion-underground-intensity"\)/, "The live band must follow the James Bondage fashion channel");
assert.match(shopScript, /wolford-sergio-rossi-capsule[\s\S]*mugler-fall-winter-2021/, "The first live channel proof must rotate between Wolford and Mugler");
assert.match(shopScript, /shopLiveDriftSeconds[\s\S]*entry_seek[\s\S]*recovery_buffering[\s\S]*rejoin_confirming[\s\S]*controlled_rejoin/, "The live band must remain rate-locked with one buffered, confirmed rejoin");
assert.doesNotMatch(shopScript, /fastSeek|soft_catchup|soft_slow|playbackRate = drift/, "The live band must never change tempo to chase the clock");
assert.match(shopStyle, /height:\s*clamp\(430px, 66svh, 760px\)/, "The live masthead must remain a full-width two-thirds-height band");
assert.match(shop, /data-shop-silent-video[\s\S]*bordelle-look83-waspie-home\.mp4/, "The supplied Bordelle Look83 film must replace the duplicate product still");
assert.doesNotMatch(shop, /player\.vimeo\.com\/video\/987002812/, "The slow remote Bordelle Vimeo must not remain on the homepage");
assert.match(shop, /shopBrandVariant === "b" \? "handdrawn" : "a"/, "The hand-drawn brand test must remain a switchable B variant");
assert.match(shop, /shopBrandInk === "white" \? "white" : "black"/, "The hand-drawn B hero must expose deterministic black and white ink proofs");
assert.match(shopStyle, /data-shop-brand-variant="handdrawn"\]\[data-shop-brand-ink="white"\][\s\S]*brightness\(0\) invert\(1\)/, "The white B hero proof must invert the hand-drawn artwork cleanly");
assert.match(shopStyle, /data-shop-brand-variant="handdrawn"\] \.shop-context--about,[\s\S]*background:\s*#050505[\s\S]*color:\s*#fff/, "The lower B brand sections must remain black with white artwork");
assert.match(shopStyle, /\.shop-hero h1\s*\{[\s\S]*?font-family:\s*var\(--shop-serif\)/, "The A masthead must use the approved single classic serif treatment");
assert.doesNotMatch(shopStyle, /--shop-brand(?:-serif)?:/, "The rejected split novelty font treatment must not return");
assert.ok((shop.match(/james-bondage-handdrawn-faces-b\.png/g) || []).length >= 3, "The interlocking face mark must recur as B-version branding");
assert.match(shop, /james-bondage-handdrawn-wordmark-b\.png/, "The B-version hero must use the isolated yellow hand-drawn wordmark");
assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup/james-bondage-handdrawn-wordmark-b.png")), "Missing isolated B-version wordmark");
assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup/james-bondage-handdrawn-faces-b.png")), "Missing isolated B-version face mark");
assert.match(shop, /data-shop-return-music[\s\S]*Universal Mind \[ I o H \] Logo 512\.png/, "Standalone Shop proof must reserve the Universal Mind flower position");
assert.match(shopScript, /iam:return-to-television/, "The Shop flower must return framed visitors to their continuing Music Television room");
assert.match(shop, /class="global-nav"[\s\S]*data-nav-item="contact"[^>]*>contact<\/a>\s*<a[^>]*data-nav-item="shop"/, "Shop must include the full shared global navigation with Shop last after Contact");
assert.match(shopStyle, /global-nav-mark[\s\S]*animation:\s*shop-universal-flower-spin/, "The shared navigation flower must keep rotating");
assert.match(shopStyle, /data-music-television-frame="embedded"\] \.shop-universal-nav,[\s\S]*data-music-television-frame="embedded"\] \.global-nav[\s\S]*display:\s*none/, "The embedded Shop must hide its duplicate flower and defer to the outer Music Television navigation");
assert.match(television, /function bootstrapRequestedShop\(\)[\s\S]*classList\.add\("television-room-open"\);\s*startFlowerSpin\(\);\s*openInVideoPageLayer/, "The direct Shop journey must start the existing spinning outer-shell flower");
assert.match(shop, /data-shop-theme-toggle/, "Shop must expose the day/night control");
assert.match(shop, /savedTheme \|\| "night"/, "A first Shop visit must default to the night presentation");
assert.doesNotMatch(shop, /prefersNight/, "System colour preference must not replace the night-first Shop default");
assert.match(shopScript, /iamShopThemeV1/, "Shop must remember the viewer's day/night choice");
assert.match(shopScript, /dataset\.shopTheme \|\| "night"/, "Shop script fallback must remain night-first");
assert.equal((shop.match(/data-filter-category=/g) || []).length, 6, "James Bondage edit must expose the six restrained form filters");
assert.match(shop, /href="#shop-about">about<\/a>[\s\S]*data-shop-menu[\s\S]*href="#giving-back">giving back<\/a>[\s\S]*href="#sex-ed">sex ed<\/a>/i, "Shop masthead must use the approved About / Shop / Giving Back / Sex Ed hierarchy");
assert.equal((shop.match(/data-shop-catalogue-type=/g) || []).length, 6, "Shop menu must expose the six functional type routes");
for (const priorityBrand of ["eres", "bordelle", "wardrobenyc", "annies-ibiza"]) {
  assert.match(shop, new RegExp(`href="#catalogue/${priorityBrand}"`, "i"), `Shop menu must expose priority brand ${priorityBrand}`);
}
assert.match(shop, /James Bondage is 24\/7 electronic music television broadcasting sex x mindfulness/i, "Shop About must use the approved 24/7 electronic music television copy");
assert.match(shop, /Our James Bondage Health series \[ sex-ed \] shares female lead conversations/i, "Shop About must preserve the approved James Bondage Health distinction");
assert.match(shop, /All profits from affiliate revenue are invested in mental health\./i, "Giving Back must state the approved affiliate profit formula");
assert.match(shop, /href="https:\/\/headspace\.org\.au"[\s\S]*href="https:\/\/www\.orygen\.org\.au"[\s\S]*href="https:\/\/www\.herspace\.org\.au"[\s\S]*href="https:\/\/www\.phoenixaustralia\.org"/i, "Giving Back must link the four approved mental-health partners");
assert.match(shop, /href="#catalogue\/eres"[^>]*data-shop-catalogue-link/, "ERES must open from the 26-brand ledger");
assert.match(shop, /data-catalogue-editorial-header/, "ERES catalogue must open with the approved editorial header");
assert.match(shop, /data-shop-product-dialog/, "Catalogue must expose the quiet expanded product view");
assert.match(shop, /data-shop-product-dialog-description/, "Expanded product view must prioritize retailer-sourced product context");
assert.match(shop, /data-catalogue-brand[\s\S]*data-catalogue-type[\s\S]*data-catalogue-sort/, "Combined catalogue must expose brand, product type and sort controls");
assert.match(shop, /price \/ low to high[\s\S]*price \/ high to low/, "Combined catalogue must expose both price sort directions");
assert.match(shopScript, /catalogueProductHash\(slug\)/, "Expanded product state must have a shareable retailer-agnostic hash route");
assert.match(shopScript, /shop-product-kernel-v1\.json/, "Shop catalogue must render from the Notion-backed product kernel");
assert.match(shopScript, /function productHasFullDetail\(product\)[\s\S]*return Boolean\(product\.image\)/, "Every approved image card must receive the internal expanded view");
assert.match(shopScript, /activeCatalogueLead[\s\S]*visibleProducts\.findIndex[\s\S]*visibleProducts\.unshift/, "Homepage campaigns must deterministically move their approved product into slot one");
assert.match(shopScript, /function productHasImage[\s\S]*Boolean\(product\.image\)/, "Inventory-only cards must still show their approved exact-source image");
assert.match(shopScript, /catalogueChunkSize = 24/, "Catalogue must use the approved 24-product loading rhythm");
assert.match(shopScript, /load \$\{remaining\} more/, "Catalogue must expose progressive load-more control rather than endless scroll");
assert.match(shopScript, /roundRobinByBrand/, "Universal editorial ordering must surface brand diversity rather than one full brand at a time");
assert.doesNotMatch(shopScript, /price at retailer/i, "Unpublished prices must remain blank rather than becoming customer-facing filler");
assert.doesNotMatch(shopScript, /form\.textContent\s*=\s*product\.(?:type|form|category)/, "Customer-facing cards must not repeat internal type metadata");
assert.match(shopScript, /catalogueLoadMore\?\.addEventListener\("click"/, "Catalogue must advance only through the explicit load-more control");
assert.match(shopScript, /IntersectionObserver[\s\S]*data-shop-silent-video|silentEditorialVideos[\s\S]*IntersectionObserver/, "Homepage films must only play while they are near the viewport");
assert.match(shopScript, /productDialog\.showModal\(\)/, "Product cards must open the accessible expanded view");
assert.match(shopScript, /productDialogPrice\.textContent = product\.price/, "Expanded product view must carry the verified price");
assert.match(shopScript, /productDialogDescription\.textContent = product\.description/, "Expanded product view must carry the retailer-sourced description");
assert.match(shopScript, /catalogueReturnScrollY = window\.scrollY/, "Opening an expanded product must remember the viewer's catalogue position");
assert.match(shopScript, /restoreCatalogueScroll[\s\S]*window\.setTimeout\(restoreCatalogueScroll, 50\)/, "Closing an expanded product must restore the viewer's precise catalogue position after native dialog focus returns");
assert.match(shopScript, /enteringCatalogue[\s\S]*scrollBehavior = "auto"[\s\S]*window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/, "Entering ERES from the brand ledger must reset immediately to the editorial header");

assert.equal((shop.match(/href="index\.html\?sexEdEpisode=0[1-8]"/g) || []).length, 8, "Shop must surface exactly eight canonical Sex Ed episode links");
assert.match(shop, /data-shop-sex-ed-viewport[\s\S]*data-shop-sex-ed-previous[\s\S]*data-shop-sex-ed-next|data-shop-sex-ed-previous[\s\S]*data-shop-sex-ed-next[\s\S]*data-shop-sex-ed-viewport/, "Sex Ed section must provide an accessible horizontal browsing control");
assert.match(shopScript, /function moveSexEdShelf[\s\S]*sexEdViewport\.scrollBy/, "Sex Ed shelf controls must scroll the episode track");
assert.match(television, /requestedSexEdEpisode[\s\S]*bootstrapRequestedSexEd[\s\S]*openSexEdEpisode\(requestedSexEdEpisode\)/, "Sex Ed links must deep-link each episode into its established player");

assert.match(index, /data-shop-entry-screen[\s\S]*james bondage[\s\S]*data-shop-entry-button[\s\S]*This is a full screen music first, shopping experience[\s\S]*data-shop-entry-label>enter/, "Direct Shop entry must use the approved black music-first splash copy");
assert.match(index, /dataset\.shopEntry = "requested"/, "Direct Shop entry must activate before the Universal Mind homepage can paint");
assert.match(television, /function activateShopEntry[\s\S]*requestShopFullscreen[\s\S]*requestShopMusic\([^\n]*ensurePlaying: true[\s\S]*completeShopEntry/, "The Shop splash gesture must request full screen and start audio before revealing the shop");
assert.match(television, /DOMContentLoaded", bootstrapRequestedShop/, "The direct Shop journey must preload before the full homepage load event");

assert.match(shop, /shop-footer[\s\S]*james-bondage-lower-masthead\.mp4/, "Homepage and catalogue routes must end with the supplied silent James Bondage masthead");
assert.match(shop, /shop-footer__legal[\s\S]*JAMES BONDAGE \/ UNIVERSAL MIND/, "Shop footer must use the final Universal Mind ownership line");
assert.doesNotMatch(shop, /presentation mock-up|affiliate relationships are proposed/i, "Shop footer must no longer describe the live shop as a mock-up or proposal");
assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup/james-bondage-lower-masthead.mp4")), "Missing supplied lower masthead video");
assert.match(shop, /adaptive-television-fullscreen shop-hero__fullscreen[\s\S]*data-shop-hero-fullscreen/, "Shop fullscreen must reuse the Music Television control language");
assert.match(shopScript, /IAMTelevisionRoom\?\.requestShopFullscreen[\s\S]*iam:shop-fullscreen-request/, "Embedded Shop fullscreen must delegate to the Universal Mind shell");
assert.match(shopScript, /shop-shell-is-fullscreen[\s\S]*heroFullscreen\.hidden/, "Fullscreen control must disappear while the shell is fullscreen");
assert.match(television, /function requestShopFullscreen[\s\S]*requestViewingFullscreen\(localVideo\)/, "Shop fullscreen must request the complete Universal Mind shell rather than only its iframe video");

assert.match(shopScript, /iam:shop-music-request/, "Shop must request music through the persistent Music Television shell");
assert.match(television, /iam:shop-music-request/, "Music Television must respond to Shop music requests");
assert.match(television, /function pauseShopMusic[\s\S]*continuationAudio\.pause\(\)[\s\S]*playbackRate = 1/, "Shop music control must provide a real pause action at normal playback speed");
assert.match(television, /async function requestShopMusic[\s\S]*if \(currentStatus\.playing\)[\s\S]*pauseShopMusic[\s\S]*startAudioLedParty\(shopTrack, \{ source: "shop_independent" \}\)/, "A quiet Shop session must toggle the independent James Bondage Parties transport");
assert.doesNotMatch(television, /joinBroadcastChannel\("party-james-bondage", \{ source: "shop_default" \}\)/, "Shop playback must not rejoin the clock-corrected shared transport");
assert.doesNotMatch(shop, /Café del Mar Chill/, "Shop controls must no longer advertise Café del Mar as the quiet default");
assert.match(index, /data-nav-item="shop"/, "Music Television navigation must expose Shop");
assert.match(index, /data-nav-item="contact"[^>]*>contact<\/a>\s*<a[^>]*data-nav-item="shop"[^>]*>shop<\/a>/, "Shop must be the final global navigation item after Contact");
assert.match(htaccess, /RewriteRule \^shop\/\?\$/, "Root /shop route is missing from Apache redirects");
assert.match(redirects, /^\/shop /m, "Root /shop route is missing from static redirects");

assert.match(architecture, /adaptive scoring remains review-gated/i, "Fashion Tensor recommendation logic must remain approval-gated");
assert.match(architecture, /No diagnosis, treatment claim/i, "Fashion Tensor roadmap is missing the clinical boundary");
assert.match(architecture, /Commercial value must not override citizen fit/i, "Fashion Tensor roadmap is missing the commercial-conflict boundary");
assert.match(architecture, /Prefer the first official frame with a person[\s\S]*visible face or forward-facing model[\s\S]*first official hero/i, "Catalogue is missing the approved human-first official-gallery rule");
assert.match(architecture, /Retailer-authored copy is preserved rather than AI-rewritten/i, "Catalogue architecture must preserve signed-off retailer copy");
assert.match(architecture, /Notion page \*\*`j a m e s  b o n d a g e  \[ s h o p \]`\*\*[\s\S]*?canonical master registry/i, "Catalogue architecture must make the approved Notion registry authoritative");
assert.match(architecture, /fail-closed catalogue inventory/i, "Catalogue architecture must retain a fail-closed staging projection");
assert.match(architecture, /neither GPT nor an ingestion process may discover, infer, replace or add a product/i, "Catalogue architecture must prohibit generated or discovered products");

console.log("Shopfront mock-up checks passed.");
