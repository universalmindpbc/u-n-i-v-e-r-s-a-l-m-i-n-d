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
const globalNavigation = read("i  a m/global-navigation.js");
const globalNavigationStyle = read("i  a m/global-navigation.css");
const catalogue = JSON.parse(read("i  a m/shop-catalogue-v1.json"));
const productKernel = JSON.parse(read("i  a m/shop-product-kernel-v1.json"));
const champagneCatalogue = JSON.parse(read("i  a m/shop-champagne-bohemia-products-v1.json"));
const approvedProducts = JSON.parse(read("i  a m/shop-approved-products-v1.json"));
const architecture = read("i  a m/shopfront-architecture.md");
const television = read("i  a m/adaptive-environment-television.js");
const index = read("i  a m/index.html");
const htaccess = read(".htaccess");
const redirects = read("_redirects");

const bouganvillea = productKernel.products.find((product) => product.id === "JB-0313");
assert.equal(bouganvillea?.imageSource, "user_supplied_reference", "Bouganvillea Tights must use Ben's sharper supplied product shot");
assert.equal(bouganvillea?.sourceWidth, 1222, "Bouganvillea Tights must retain the supplied high-resolution width");
assert.equal(bouganvillea?.sourceHeight, 1570, "Bouganvillea Tights must retain the supplied high-resolution height");
assert.ok(
  fs.statSync(path.join(iam, bouganvillea.image)).size > 50_000,
  "Bouganvillea Tights must not regress to the former 200px thumbnail",
);

for (const required of [
  "James Bondage",
  "28 brands",
  "392",
  "JAMES BONDAGE / UNIVERSAL MIND",
  "Bordelle",
  "Angela Dress",
  "WARDROBE.NYC",
  "KARLA ŠPETIĆ",
  "The Upside",
  "Iris van Herpen",
  "Champagne Bohemia",
]) {
  assert.match(shop, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Missing shop presentation text: ${required}`);
}

assert.match(shop, /<h1 id="shop-title"><span>James<\/span><span>Bondage<\/span><\/h1>/, "Fashion masthead must remain James Bondage, not James Bondage Health");
for (const absent of [
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
assert.equal((shop.match(/<li(?:\s+class="[^"]*")?><span>/g) || []).length, 28, "Brand ledger must contain all 28 shopfront edits");
assert.equal((shop.match(/data-product(?:\s|>)/g) || []).length, 12, "Opening edit must contain the restrained 12 authorized hero pieces");
assert.match(shop, /<title>James Bondage \| Shop<\/title>/, "Standalone Shop title must use the approved pipe separator");
assert.match(index, /document\.title = "James Bondage \| Shop"/, "Shop splash title must use the approved pipe separator");
assert.match(
  television,
  /const SHOP_SHELL_VERSION = "shop-champagne-bohemia-3-emilio-safari-3-search-colour-4-taxonomy-3-look-1";[\s\S]*function frameHref\(link\)[\s\S]*url\.searchParams\.set\("v", SHOP_SHELL_VERSION\)/,
  "The real Shop entry must cache-bust its embedded Shop shell to the current Champagne Bohemia version",
);
assert.match(index, /adaptive-environment-television\.js\?v=music-tv-373e05642399/, "The homepage must load the Shop cache-bust controller");

assert.equal(catalogue.products.length, 36, "Finished ERES catalogue must contain all 36 approved product URLs");
assert.equal(new Set(catalogue.products.map((product) => product.id)).size, 36, "Catalogue product IDs must be unique");
assert.equal(new Set(catalogue.products.map((product) => product.slug)).size, 36, "Catalogue product slugs must be unique");
assert.ok(catalogue.products.every((product) => product.brand === "ERES"), "Finished ERES catalogue must remain a singular ERES edit");
assert.ok(catalogue.products.every((product) => product.imageSource === "retailer_gallery_index_0"), "Every bulk-ingested catalogue image must use the first retailer hero");
const transparentEresNames = new Set(["Eden", "Providence", "Indiscrète", "Idole", "Singulière", "Diva", "Promesse", "Bambin"]);
const transparentEresCatalogue = catalogue.products.filter((product) => product.lookProperties?.includes("transparent"));
assert.equal(transparentEresCatalogue.length, 20, "The ERES audit projection must contain all 20 approved transparent model variants");
assert.ok(transparentEresCatalogue.every((product) => transparentEresNames.has(product.name.split(" ")[0])), "Only the eight approved ERES model families may carry the transparent look tag");
assert.ok(transparentEresCatalogue.every((product) => product.lookEvidenceStatus === "Verified" && product.lookSourceType === "Ben supplied"), "Every transparent ERES audit record must retain its human evidence source");
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

assert.equal(productKernel.counts.brands, 27, "Fashion kernel must retain all 27 approved retailers");
assert.equal(productKernel.products.length, 363, "Fashion kernel must contain exactly 363 approved canonical product URLs from Notion");
assert.equal(new Set(productKernel.products.map((product) => product.canonicalUrl)).size, 363, "Fashion kernel product URLs must be canonical and unique");
assert.equal(new Set(productKernel.products.map((product) => `${product.brand}:${product.slug}`)).size, 363, "Fashion kernel product slugs must be unique within each brand");
assert.equal(productKernel.products.filter((product) => product.metadataStatus === "Metadata ready").length, 360, "All retailer-verifiable records must be metadata-ready");
assert.equal(productKernel.products.filter((product) => product.description?.trim()).length, 362, "Retailer-authored descriptions must be retained wherever published");
assert.equal(productKernel.products.filter((product) => product.price?.trim()).length, 360, "Verified display prices must be retained wherever published");
assert.equal(productKernel.products.filter((product) => product.requiresReview).length, 3, "Only the three retailer-unpublished metadata gaps may remain review items");
assert.ok(
  productKernel.products.filter((product) => product.subjectPresent === true || product.brand === "ERES").length / productKernel.products.length >= 0.9,
  "At least 90% of the approved catalogue must use an official retailer image featuring a person"
);
assert.equal(productKernel.products.filter((product) => product.listedOnShop).length, 363, "Every approved product record must be listed");
assert.equal(productKernel.products.filter((product) => product.image).length, 363, "Every approved product record must carry an approved hero image");
assert.ok(productKernel.products.every((product) => product.retailerUrl?.startsWith("https://")), "Every tensor product must retain its exact retailer URL");
assert.equal(productKernel.authority.policy, "exact_notion_product_urls_only", "Notion must remain the sole product authority");
const expectedShopTaxonomy = [
  ["lingerie-all", "lingerie (all)"],
  ["swimwear-all", "swimwear (all)"],
  ["athleisure-all", "athleisure (all)"],
  ["ready-to-wear-all", "ready to wear (all)"],
  ["haute-couture-all", "haute couture (all)"],
  ["bra", "bra"],
  ["brief", "brief"],
  ["bodysuit", "bodysuit"],
  ["hosiery", "hosiery"],
  ["robe", "robe"],
  ["after-dark", "after dark"],
  ["swimsuit", "swimsuit"],
  ["bikini", "bikini"],
  ["rash-vest", "rash vest"],
  ["coverup", "coverup"],
  ["jumpsuit", "jumpsuit"],
  ["dress", "dress"],
  ["shorts", "shorts"],
  ["pants", "pants"],
  ["leggings", "leggings"],
  ["crop", "crop"],
  ["accessories", "accessories"],
].map(([value, label]) => ({ value, label }));
assert.equal(productKernel.shopTaxonomy.version, "jb-shop-taxonomy-v1", "Shop taxonomy version must stay explicit");
assert.deepEqual(productKernel.shopTaxonomy.visibleOptions, expectedShopTaxonomy, "Shop taxonomy order and labels must match the approved dropdown exactly");
assert.deepEqual(champagneCatalogue.shopTaxonomy.visibleOptions, expectedShopTaxonomy, "Champagne Bohemia must use the same Shop taxonomy contract");
assert.ok([...productKernel.products, ...champagneCatalogue.products].every((product) => product.shopTypes?.length), "Every Shop product must carry the Notion-backed taxonomy projection");
const wolfordTights = productKernel.products.find((product) => product.id === "JB-0069");
assert.ok(wolfordTights?.shopTypes.includes("hosiery"), "Wolford tights must appear under hosiery");
assert.ok(!wolfordTights?.shopTypes.includes("leggings"), "Wolford tights must not also appear under leggings");
const irisCouture = productKernel.products.find((product) => product.brand === "Iris van Herpen");
assert.equal(irisCouture?.gallery?.length, 6, "The canonical Iris couture record must retain all six approved tiles");
assert.ok(irisCouture?.shopTypes.includes("haute-couture-all"), "All six Iris tiles must inherit Haute Couture");
assert.ok(!irisCouture?.shopTypes.includes("ready-to-wear-all"), "Iris must not appear under Ready to Wear");
assert.equal(productKernel.products.filter((product) => product.brand === "Annie’s Ibiza" && product.shopTypes.includes("haute-couture-all")).length, 10, "Only the ten retailer-evidenced made-to-order Annie’s records belong to Haute Couture");
assert.equal(productKernel.products.filter((product) => product.shopTypes.includes("rash-vest")).length, 18, "Rash Vest must contain the eighteen reviewed thin rash/surf constructions");
assert.ok(productKernel.products.filter((product) => product.shopTypes.includes("rash-vest")).every((product) => product.shopTypes.includes("swimwear-all")), "Every Rash Vest record must also belong to Swimwear");
const emilioProduct = productKernel.products.find((product) => product.brand === "Emilio Cavallini");
assert.equal(emilioProduct?.retailerUrl, "https://www.emiliocavallini.com/en/engeneered-body.html", "Emilio Cavallini must retain Ben's exact approved product URL");
assert.equal(emilioProduct?.metadataStatus, "Metadata ready", "The Emilio catalogue card must use the retailer-verified metadata");
assert.deepEqual(
  productKernel.products
    .filter((product) => product.brand === "Emilio Cavallini")
    .map((product) => product.retailerUrl),
  [
    "https://www.emiliocavallini.com/en/engeneered-body.html",
    "https://www.emiliocavallini.com/en/bouganvillea-tights.html",
  ],
  "Both Emilio products must retain their exact approved retailer URLs",
);
assert.match(
  shopScript,
  /const emilioCurrencyRecoveryHost = "www\.emiliocavallini\.com";[\s\S]*const emilioCurrencyRecoveryDelay = 1800;[\s\S]*let emilioCurrencyRecoveryReady = false;[\s\S]*function needsEmilioCurrencyRecovery\(retailerUrl\)[\s\S]*return !emilioCurrencyRecoveryReady;/,
  "The Emilio recovery must be limited to the retailer host and to the first Shop-page click",
);
assert.match(
  shopScript,
  /function prepareRetailerLinkForCurrencyRecovery\(retailerUrl\)[\s\S]*productDialogRetailer\.target = emilioRetailerTabName;[\s\S]*productDialogRetailer\.removeAttribute\("rel"\);/,
  "The first Emilio click must use an ordinary named retailer link that Safari will not block as a popup",
);
assert.match(
  shopScript,
  /function restoreModifiedRetailerClick\(event\)[\s\S]*event\.button !== 0[\s\S]*restoreRetailerLinkSafety\(\);/,
  "Modified and middle retailer clicks must retain the normal safe blank-tab behavior",
);
const emilioRecoveryHandler = shopScript.slice(
  shopScript.indexOf("function openRetailerWithCurrencyRecovery"),
  shopScript.indexOf("function closeProduct"),
);
assert.doesNotMatch(
  emilioRecoveryHandler,
  /event\.preventDefault\(\)/,
  "The Safari-safe recovery must allow the ordinary retailer anchor to create its tab",
);
assert.match(
  emilioRecoveryHandler,
  /window\.setTimeout\(\(\) => \{[\s\S]*window\.open\(retailerUrl, emilioRetailerTabName\)[\s\S]*window\.setTimeout\(\(\) => \{[\s\S]*retailerWindow\.location\.href = retailerUrl;[\s\S]*retailerWindow\.opener = null;[\s\S]*markEmilioCurrencyRecoveryReady\(\);[\s\S]*emilioCurrencyRecoveryDelay\);[\s\S]*\}, 0\);/,
  "The ordinary named retailer tab must be captured and restarted before Safari clears its cross-site name, then receive the exact product URL again and release its opener",
);
assert.match(
  shopScript,
  /productDialogRetailer\?\.addEventListener\("pointerdown", restoreModifiedRetailerClick\);[\s\S]*productDialogRetailer\?\.addEventListener\("click", openRetailerWithCurrencyRecovery\)/,
  "The retailer CTA must install both the modified-click safety guard and Emilio-only recovery handler",
);
for (const product of productKernel.products) {
  assert.ok(product.slug, `Missing stable product slug: ${product.id}`);
  assert.ok(fs.existsSync(path.join(iam, product.image)), `Missing approved catalogue image: ${product.image}`);
  if (product.video) assert.ok(fs.existsSync(path.join(iam, product.video)), `Missing approved catalogue video: ${product.video}`);
  for (const galleryImage of product.gallery || []) {
    assert.ok(fs.existsSync(path.join(iam, galleryImage)), `Missing approved gallery image: ${galleryImage}`);
  }
}

assert.equal(champagneCatalogue.catalogue.brand, "Champagne Bohemia", "Champagne Bohemia must remain one umbrella shopfront");
assert.equal(champagneCatalogue.catalogue.placementAfter, "WARDROBE.NYC", "Champagne Bohemia must remain immediately after WARDROBE.NYC");
assert.equal(champagneCatalogue.catalogue.route, "#catalogue/champagne-bohemia", "Champagne Bohemia must retain its dedicated route");
assert.equal(champagneCatalogue.products.length, 29, "Champagne Bohemia must contain the 29 approved Notion products");
assert.deepEqual(
  champagneCatalogue.products.map((product) => product.id),
  Array.from({ length: 29 }, (_, index) => `JB-${String(index + 369).padStart(4, "0")}`),
  "Champagne Bohemia product IDs must remain the contiguous JB-0369 through JB-0397 intake",
);
assert.equal(new Set(champagneCatalogue.products.map((product) => product.slug)).size, 29, "Champagne Bohemia product slugs must be unique");
assert.equal(new Set(champagneCatalogue.products.map((product) => product.canonicalUrl)).size, 29, "Champagne Bohemia canonical product URLs must be unique");
assert.equal(new Set([...productKernel.products, ...champagneCatalogue.products].map((product) => product.canonicalUrl)).size, 392, "The combined shop tensor must contain 392 unique canonical product URLs");
assert.ok(champagneCatalogue.products.every((product) => product.catalogueBrand === "Champagne Bohemia"), "Every Champagne product must retain the umbrella catalogue brand");
assert.ok(champagneCatalogue.products.every((product) => product.shopRoute === "#catalogue/champagne-bohemia"), "Every Champagne product must retain the umbrella route");
assert.ok(champagneCatalogue.products.every((product) => product.forms?.includes("swim")), "Every Champagne product must remain in the swim and cover-up edit");
assert.ok(champagneCatalogue.products.every((product) => product.currency === "AUD" && Number.isFinite(product.priceValue)), "Every Champagne product must retain its verified AUD price");
assert.ok(champagneCatalogue.products.every((product) => product.description?.trim()), "Every Champagne product must retain its exact retailer-authored description");
assert.ok(champagneCatalogue.products.every((product) => product.subjectPresent === true && product.forwardFacing === true), "Every Champagne lead image must contain a forward-facing person");
assert.ok(champagneCatalogue.products.every((product) => product.notionPageId), "Every Champagne product must retain its exact Notion tensor record");
const verifiedChampagneRetailers = new Map([
  ["fwrd.com", "FWRD"],
  ["net-a-porter.com", "NET-A-PORTER"],
  ["monteandlou.com", "Monte & Lou"],
]);
for (const product of champagneCatalogue.products) {
  assert.ok(fs.existsSync(path.join(iam, product.image)), `Missing Champagne Bohemia lead image: ${product.image}`);
  assert.match(product.retailerUrl, /^https:\/\//, `Champagne Bohemia product must retain its exact retailer URL: ${product.id}`);
  const retailerHost = new URL(product.retailerUrl).hostname.replace(/^www\./, "");
  assert.equal(product.retailer, verifiedChampagneRetailers.get(retailerHost), `Champagne Bohemia CTA retailer must match its destination hostname: ${product.id}`);
}
assert.deepEqual(
  Object.fromEntries(
    [...verifiedChampagneRetailers.entries()].map(([host, retailer]) => [
      retailer,
      champagneCatalogue.products.filter((product) => new URL(product.retailerUrl).hostname.replace(/^www\./, "") === host).length,
    ]),
  ),
  { FWRD: 19, "NET-A-PORTER": 1, "Monte & Lou": 9 },
  "Champagne Bohemia must retain the audited 19 FWRD / 1 NET-A-PORTER / 9 Monte & Lou destination split",
);
const monteAndLouPlunge = champagneCatalogue.products.find((product) => product.id === "JB-0389");
assert.equal(monteAndLouPlunge?.image, "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0389-monte-lou-plunge-in-situ.webp", "Monte & Lou plunge must retain Ben's supplied in-situ image");
assert.equal(monteAndLouPlunge?.imageSource, "user_supplied_editorial_override", "Monte & Lou plunge must identify Ben's supplied image as an editorial override");
assert.equal(monteAndLouPlunge?.inSitu, true, "Monte & Lou plunge image must remain in situ");
const monteAndLouMaya = champagneCatalogue.products.filter((product) => /^JB-039[0-7]$/.test(product.id));
assert.equal(monteAndLouMaya.length, 8, "The complete eight-item Monte & Lou Maya batch must be present");
assert.deepEqual(monteAndLouMaya.map((product) => product.priceValue), [290, 160, 115, 125, 115, 160, 120, 230], "The Maya batch must retain its verified AUD prices");
assert.ok(monteAndLouMaya.every((product) => product.color === "Maya"), "Every Maya record must retain the exact retailer colourway");
assert.ok(monteAndLouMaya.every((product) => product.notionPageId), "Every Maya product must retain its exact Notion tensor record");
const mayaShirt = monteAndLouMaya.find((product) => product.id === "JB-0390");
assert.equal(mayaShirt?.imageSource, "user_supplied_editorial_override", "The Maya Linen Shirt must use Ben's supplied portrait");
assert.equal(mayaShirt?.inSitu, true, "The Maya Linen Shirt portrait must be recorded as in situ");

const anniesAdditions = productKernel.products.filter((product) => ["JB-0365", "JB-0366", "JB-0367"].includes(product.id));
assert.equal(anniesAdditions.length, 3, "Annie’s new products must form the approved three-card row");
assert.deepEqual(anniesAdditions.map((product) => product.editorialRank), [1, 2, 3], "Annie’s new products must retain their balanced first-row ordering");
assert.deepEqual(anniesAdditions.map((product) => product.price), ["AU$ 1,911", "AU$ 16,654", "AU$ 7,642"], "Annie’s additions must retain their live verified AUD prices");
assert.ok(anniesAdditions.every((product) => product.description?.length > 300), "Annie’s additions must retain the retailer-authored descriptions");
assert.ok(anniesAdditions.every((product) => product.notionPageId), "Annie’s additions must retain their exact Notion tensor records");
const irisProduct = productKernel.products.find((product) => product.id === "JB-0368");
assert.equal(irisProduct?.brand, "Iris van Herpen", "Iris van Herpen must be the 27th approved brand");
assert.equal(irisProduct?.gallery?.length, 6, "Iris bespoke must contain the six supplied images");
assert.equal(irisProduct?.price, "", "Iris bespoke must remain enquiry-only without an invented price");
assert.ok(irisProduct?.notionPageId, "Iris bespoke must retain its exact Notion tensor record");
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

assert.match(shop, /data-shop-hero-playlist[\s\S]*wolford-sergio-rossi-hero-360-v1\.mp4[\s\S]*mugler-fall-winter-2021-hero-360-v1\.mp4/, "Every Shop route must open with the local Wolford then Mugler playlist");
assert.match(shop, /data-shop-hero-film="wolford-sergio-rossi"[\s\S]*autoplay[\s\S]*muted[\s\S]*playsinline[\s\S]*poster="a s s e t s\/shop-mockup\/wolford-sergio-rossi-hero-poster-v1\.jpg"/, "The local hero must begin silently with an immediate Wolford poster");
assert.match(shopScript, /function startHeroPlaylist\(\)[\s\S]*primeNextVideo[\s\S]*addEventListener\("ended"[\s\S]*showVideo\(index \+ 1\)/, "The local hero must preload and advance through its films sequentially");
assert.doesNotMatch(shop, /data-shop-live-band|data-stream-role="fashion"|cloudflare-stream-controller\.js|broadcast-clock-v1\.js/, "The Shop hero must not retain synchronized streaming infrastructure");
assert.doesNotMatch(shopScript, /IAMBroadcastClock|IAMStreamController|shopLiveDriftSeconds|entry_seek|controlled_rejoin|playbackRate = drift/, "The Shop hero must not synchronize, seek, or alter playback rate");
assert.match(shopStyle, /height:\s*clamp\(430px, 66svh, 760px\)/, "The live masthead must remain a full-width two-thirds-height band");
assert.match(shopStyle, /\.shop-hero__film video\.is-active\s*\{\s*opacity:\s*1/, "Only the active local hero film may be visible");
for (const localHeroAsset of [
  "wolford-sergio-rossi-hero-360-v1.mp4",
  "mugler-fall-winter-2021-hero-360-v1.mp4",
  "wolford-sergio-rossi-hero-poster-v1.jpg",
]) {
  assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup", localHeroAsset)), `Missing local hero asset: ${localHeroAsset}`);
}
assert.ok(fs.statSync(path.join(iam, "a s s e t s/shop-mockup/wolford-sergio-rossi-hero-360-v1.mp4")).size < 3_000_000, "Wolford hero derivative must remain below 3 MB");
assert.ok(fs.statSync(path.join(iam, "a s s e t s/shop-mockup/mugler-fall-winter-2021-hero-360-v1.mp4")).size < 12_000_000, "Mugler hero derivative must remain below 12 MB");
assert.match(shop, /upside-kefi-hero-optimized-v1\.jpg/, "The Upside homepage image must use its optimized derivative");
assert.ok(fs.statSync(path.join(iam, "a s s e t s/shop-mockup/upside-kefi-hero-optimized-v1.jpg")).size < 600_000, "The Upside homepage image must remain below 600 KB");
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
assert.match(shop, /class="shop-universal-nav global-nav-trigger"[\s\S]*Universal Mind \[ I o H \] Logo 512\.png/, "Standalone Shop proof must reserve the Universal Mind flower position");
assert.match(shopScript, /iam:return-to-television/, "The Shop flower must return framed visitors to their continuing Music Television room");
assert.match(shop, /data-global-nav-host[\s\S]*global-navigation\.js\?v=global-navigation-canonical-1/, "Shop must load the canonical global navigation");
assert.match(globalNavigation, /class="global-nav"[\s\S]*data-nav-item="contact"[^>]*>contact<\/a>\s*<a[^>]*data-nav-item="shop"/, "Shop must use the full shared global navigation with Shop last after Contact");
assert.match(shopStyle, /\.shop-universal-nav img[\s\S]*animation:\s*shop-universal-flower-spin/, "The standalone Shop flower must keep rotating");
assert.match(globalNavigationStyle, /\.global-nav-mark\s*\{[^}]*animation:\s*none/s, "The shared navigation mark must retain the canonical static treatment");
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
for (const [value, label] of expectedShopTaxonomy.slice(0, 5).map(({ value, label }) => [value, label])) {
  assert.ok(shop.includes(`href="#catalogue/all/type/${value}" data-shop-catalogue-type="${value}">${label}</a>`), `Shop menu must expose the broad ${label} route`);
}
for (const priorityBrand of ["eres", "bordelle", "wardrobenyc", "annies-ibiza", "iris-van-herpen", "champagne-bohemia"]) {
  assert.match(shop, new RegExp(`href="#catalogue/${priorityBrand}"`, "i"), `Shop menu must expose priority brand ${priorityBrand}`);
}
assert.match(shop, /James Bondage is 24\/7 electronic music television broadcasting sex x mindfulness/i, "Shop About must use the approved 24/7 electronic music television copy");
assert.match(shop, /Our James Bondage Health series \[ sex-ed \] shares female lead conversations/i, "Shop About must preserve the approved James Bondage Health distinction");
assert.match(shop, /All profits from affiliate revenue are invested in mental health\./i, "Giving Back must state the approved affiliate profit formula");
assert.match(shop, /href="https:\/\/headspace\.org\.au"[\s\S]*href="https:\/\/www\.orygen\.org\.au"[\s\S]*href="https:\/\/www\.herspace\.org\.au"[\s\S]*href="https:\/\/www\.phoenixaustralia\.org"/i, "Giving Back must link the four approved mental-health partners");
assert.match(shop, /href="#catalogue\/eres"[^>]*data-shop-catalogue-link/, "ERES must open from the 28-brand ledger");
assert.match(shop, /shop-brands[\s\S]*shop-iris-film[\s\S]*shop-context shop-context--about/, "Iris film must sit between 03 / brands and 04 / about");
assert.match(shop, /sonic-starquakes-hero-1280x576-v2\.mp4[\s\S]*Sonic Starquakes \/ AW26/, "Homepage must use the local 720-class Iris Sonic Starquakes film");
assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup/iris-van-herpen/sonic-starquakes-hero-1280x576-v2.mp4")), "Missing the 00:20–05:30 Iris hero master");
assert.doesNotMatch(shop, /browse edit/i, "The brand ledger must not single out ERES with redundant Browse Edit copy");
assert.match(shop, /data-catalogue-editorial-header/, "ERES catalogue must open with the approved editorial header");
assert.match(shop, /data-shop-product-dialog/, "Catalogue must expose the quiet expanded product view");
assert.match(shop, /data-shop-product-dialog-description/, "Expanded product view must prioritize retailer-sourced product context");
assert.match(shop, /data-catalogue-search[\s\S]*data-catalogue-brand[\s\S]*data-catalogue-type[\s\S]*data-catalogue-colour[\s\S]*data-catalogue-sort/, "Combined catalogue must expose quiet search, brand, product type, colour and sort controls");
assert.match(shop, /<span>category \/ type<\/span><select data-catalogue-type aria-label="Shop by category or product type">/, "Shop taxonomy control must use the approved category / type label");
assert.match(shopScript, /catalogueKernel\.shopTaxonomy\?\.visibleOptions[\s\S]*all categories \/ types[\s\S]*type\.value, type\.label/, "Shop must render the exact ordered taxonomy contract from the Tensor projection");
assert.match(shopScript, /product\.shopTypes\.includes\(activeCatalogueType\)/, "Shop category filtering must use the synced taxonomy values");
assert.match(shopScript, /validType[\s\S]*shopTaxonomy\?\.visibleOptions\?\.some[\s\S]*activeCatalogueType = validType \? route\.type : "all"/, "Unknown and legacy taxonomy routes must fail closed to the full edit");
assert.match(shop, /type="search"[^>]*aria-label="Search the catalogue"[^>]*autocomplete="off"/, "Catalogue search must be accessible without noisy search chrome");
assert.match(shop, /shop-catalogue-filter-v1\.js\?v=shop-search-colour-4/, "Shop must load the current deterministic search, colour and look module before the catalogue");
assert.match(shop, /price \/ low to high[\s\S]*price \/ high to low/, "Combined catalogue must expose both price sort directions");
assert.match(shopScript, /catalogueProductHash\(slug\)/, "Expanded product state must have a shareable retailer-agnostic hash route");
assert.match(shopScript, /shop-product-kernel-v1\.json/, "Shop catalogue must render from the Notion-backed product kernel");
assert.match(shopScript, /shop-champagne-bohemia-products-v1\.json/, "Shop catalogue must load the approved Champagne Bohemia tensor extension");
assert.equal((shopScript.match(/shop-colour-audit-3-taxonomy-3-look-1-monte-lou-1/g) || []).length, 2, "Both catalogue projections must use the current colour, taxonomy and look cache token");
assert.match(shopScript, /product\.retailer \|\| product\.brand/, "Product CTAs must prefer the destination retailer rather than the maker brand");
assert.match(shopScript, /function catalogueBrandName\(product\)[\s\S]*product\.catalogueBrand \|\| product\.brand/, "Umbrella routing must preserve each product's maker brand");
assert.match(shopScript, /function productHasFullDetail\(product\)[\s\S]*return Boolean\(product\.image \|\| product\.video \|\| product\.gallery\?\.length\)/, "Every approved media card must receive the internal expanded view");
assert.match(shopScript, /function galleryDisplayProducts[\s\S]*--image-\$\{index \+ 1\}[\s\S]*galleryViewCount/, "Iris must render its six supplied images as six separately addressable catalogue tiles");
assert.match(shopScript, /activeCatalogueBrand === "iris-van-herpen"[\s\S]*activeCatalogueBrand === "all" && activeCatalogueType === "haute-couture-all"[\s\S]*visibleProducts\.flatMap\(galleryDisplayProducts\)/, "The Iris brand route and universal Haute Couture edit must expand the canonical gallery into six individual tiles");
assert.match(shopScript, /function productFromRoute[\s\S]*galleryDisplayProducts\(exactProduct\)\[0\][\s\S]*--image-/, "Every Iris tile route must open one image rather than the combined gallery");
assert.match(shopScript, /function renderProductDialogMedia[\s\S]*product\.video/, "Expanded product view must preserve silent Annie’s product films");
assert.match(shopScript, /activeCatalogueLead[\s\S]*visibleProducts\.findIndex[\s\S]*visibleProducts\.unshift/, "Homepage campaigns must deterministically move their approved product into slot one");
assert.match(shopScript, /function productHasImage[\s\S]*Boolean\(product\.image\)/, "Inventory-only cards must still show their approved exact-source image");
assert.match(shopScript, /catalogueChunkSize = 24/, "Catalogue must use the approved 24-product loading rhythm");
assert.match(shopScript, /search\.set\("q", activeCatalogueQuery\)[\s\S]*search\.set\("colour", activeCatalogueColour\)/, "Search and colour state must remain shareable in catalogue URLs");
assert.match(shopScript, /activeCatalogueLimit = catalogueChunkSize[\s\S]*renderCatalogue\(\)/, "A changed edit must reset the progressive catalogue rhythm");
assert.match(shopScript, /No pieces match this edit\.[\s\S]*clear search & filters/, "No-result edits must offer a restrained recovery action");
assert.match(shopScript, /brand\.hidden = activeCatalogueBrand !== "all" && brandSlug\(product\.brand\) === activeCatalogueBrand/, "Single-brand routes must not repeat the brand on every product card");
assert.match(shopStyle, /\.shop-catalogue__search\s*\{\s*grid-column:\s*1\s*\/\s*-1/, "Mobile search must sit above the compact filter grid");
assert.match(shopScript, /load \$\{remaining\} more/, "Catalogue must expose progressive load-more control rather than endless scroll");
assert.match(shopScript, /roundRobinByBrand/, "Universal editorial ordering must surface brand diversity rather than one full brand at a time");
assert.doesNotMatch(shopScript, /price at retailer/i, "Unpublished prices must remain blank rather than becoming customer-facing filler");
assert.doesNotMatch(shopScript, /form\.textContent\s*=\s*product\.(?:type|form|category)/, "Customer-facing cards must not repeat internal type metadata");
assert.match(shopScript, /catalogueLoadMore\?\.addEventListener\("click"/, "Catalogue must advance only through the explicit load-more control");
assert.match(shopScript, /IntersectionObserver[\s\S]*data-shop-silent-video|silentEditorialVideos[\s\S]*IntersectionObserver/, "Homepage films must only play while they are near the viewport");
assert.match(shopScript, /productDialog\.showModal\(\)/, "Product cards must open the accessible expanded view");
assert.match(shopScript, /productDialogPrice\.textContent = product\.price/, "Expanded product view must carry the verified price");
assert.match(shopScript, /description\.split\(\/\\n\\s\*\\n\/\)[\s\S]*productDialogDescription\.replaceChildren/, "Expanded product view must preserve retailer-authored paragraph breaks");
assert.match(shopScript, /\? "order haute couture"/, "Iris expanded views must expose the approved retailer call to action");
assert.match(shopStyle, /data-catalogue-brand="iris-van-herpen"[\s\S]*bottom:\s*clamp\(20px, 2\.2vw, 34px\)/, "Iris View the Collection link must sit below the oversized wordmark");
assert.match(shopStyle, /\.shop-product-dialog__copy\s*\{[\s\S]*overflow-y:\s*auto/, "Long product descriptions must scroll without hiding the retailer call to action");
assert.match(shopScript, /catalogueReturnScrollY = window\.scrollY/, "Opening an expanded product must remember the viewer's catalogue position");
assert.match(shopScript, /restoreCatalogueScroll[\s\S]*window\.setTimeout\(restoreCatalogueScroll, 50\)/, "Closing an expanded product must restore the viewer's precise catalogue position after native dialog focus returns");
assert.match(shopScript, /enteringCatalogue[\s\S]*scrollBehavior = "auto"[\s\S]*window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/, "Entering ERES from the brand ledger must reset immediately to the editorial header");

assert.equal((shop.match(/href="index\.html\?sexEdEpisode=0[1-8]"/g) || []).length, 8, "Shop must surface exactly eight canonical Sex Ed episode links");
assert.match(shop, /data-shop-sex-ed-viewport[\s\S]*data-shop-sex-ed-previous[\s\S]*data-shop-sex-ed-next|data-shop-sex-ed-previous[\s\S]*data-shop-sex-ed-next[\s\S]*data-shop-sex-ed-viewport/, "Sex Ed section must provide an accessible horizontal browsing control");
assert.match(shopScript, /function moveSexEdShelf[\s\S]*sexEdViewport\.scrollBy/, "Sex Ed shelf controls must scroll the episode track");
assert.match(television, /requestedSexEdEpisode[\s\S]*bootstrapRequestedSexEd[\s\S]*openSexEdEpisode\(requestedSexEdEpisode\)/, "Sex Ed links must deep-link each episode into its established player");

assert.match(index, /data-shop-entry-screen[\s\S]*james bondage[\s\S]*data-shop-entry-button[\s\S]*data-shop-entry-label>explore<\/span>[\s\S]*opens full screen · starts music/, "Direct Shop entry must use the approved spacious black splash hierarchy");
assert.doesNotMatch(index, /class="adaptive-environment__play shop-entry__play"/, "The Shop splash play control must not inherit the television-room blur state");
assert.match(shopScript, /function preloadOpeningAssets[\s\S]*openingAssetReady\(openingHeroVideo, "loadeddata", 2500\)[\s\S]*iam:shop-opening-media-ready/, "The Shop must prioritize its opening local hero behind the splash");
assert.match(television, /shopEntryMediaReady[\s\S]*iam:shop-opening-media-ready[\s\S]*completeShopEntry/, "The splash must wait for opening Shop media readiness before revealing the page");
assert.match(television, /shopEntryMediaFallbackTimer = window\.setTimeout\([\s\S]*?4000\)/, "Shop entry must retain a bounded four-second fallback");
assert.match(index, /dataset\.shopEntry = "requested"/, "Direct Shop entry must activate before the Universal Mind homepage can paint");
assert.match(television, /function activateShopEntry[\s\S]*requestShopFullscreen[\s\S]*requestShopMusic\([^\n]*ensurePlaying: true[\s\S]*completeShopEntry/, "The Shop splash gesture must request full screen and start audio before revealing the shop");
assert.match(television, /DOMContentLoaded", bootstrapRequestedShop/, "The direct Shop journey must preload before the full homepage load event");

assert.match(shop, /shop-footer[\s\S]*james-bondage-lower-masthead\.mp4/, "Homepage and catalogue routes must end with the supplied silent James Bondage masthead");
assert.match(shop, /shop-footer__legal[\s\S]*JAMES BONDAGE \/ UNIVERSAL MIND/, "Shop footer must use the final Universal Mind ownership line");
assert.match(
  shop,
  /shop-masthead__nav[\s\S]*?<a href="#top" data-shop-home[^>]*>home<\/a>[\s\S]*?<a href="#shop-about">about<\/a>[\s\S]*?<summary>shop<\/summary>[\s\S]*?<a href="#giving-back">giving back<\/a>[\s\S]*?<a href="#sex-ed">sex ed<\/a>/,
  "The sticky Shop navigation must begin with Home and preserve the approved Home / About / Shop / Giving Back / Sex Ed order",
);
assert.match(
  shop,
  /shop-footer__legal[\s\S]*?<p>JAMES BONDAGE \/ UNIVERSAL MIND<\/p>[\s\S]*?<a href="#top" data-shop-home[^>]*>home<\/a>/,
  "The Shop footer must provide a direct Home route",
);
assert.equal((shop.match(/data-shop-home/g) || []).length, 2, "Shop Home must appear exactly once in the sticky navigation and once in the footer");
assert.match(shop, /shop\.css\?v=shop-champagne-home-1-home-nav-2/, "The Shop Home navigation release must refresh the responsive Shop stylesheet");
assert.match(
  shopStyle,
  /@media \(max-width: 700px\)[\s\S]*?\.shop-masthead__nav \{ gap: 6px; \}[\s\S]*?\.shop-masthead__actions \{ gap: 0; \}[\s\S]*?\.shop-theme,[\s\S]*?\.shop-music \{[\s\S]*?width: 28px;[\s\S]*?height: 44px;[\s\S]*?\.shop-theme \[data-shop-theme-label\],[\s\S]*?\.shop-music \[data-shop-music-label\] \{ font-size: 0; \}/,
  "Phone Shop navigation must keep all five destinations clear of the accessible icon-only theme and music controls",
);
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
assert.match(globalNavigation, /data-nav-item="shop"/, "Music Television navigation must expose Shop");
assert.match(globalNavigation, /data-nav-item="contact"[^>]*>contact<\/a>\s*<a[^>]*data-nav-item="shop"[^>]*>shop<\/a>/, "Shop must be the final global navigation item after Contact");
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
