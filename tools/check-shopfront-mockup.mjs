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
const architecture = read("i  a m/shopfront-architecture.md");
const television = read("i  a m/adaptive-environment-television.js");
const index = read("i  a m/index.html");
const htaccess = read(".htaccess");
const redirects = read("_redirects");

for (const required of [
  "James Bondage",
  "23 brands",
  "312",
  "affiliate relationships are proposed",
  "Bordelle / Signature Waspie",
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
assert.equal((shop.match(/<li(?:\s+class="[^"]*")?><span>/g) || []).length, 23, "Brand ledger must contain all 23 retailers");
assert.equal((shop.match(/data-product(?:\s|>)/g) || []).length, 12, "Opening edit must contain the restrained 12 photographed hero pieces");

assert.equal(catalogue.products.length, 15, "ERES catalogue proof must contain exactly 15 products");
assert.equal(new Set(catalogue.products.map((product) => product.id)).size, 15, "Catalogue product IDs must be unique");
assert.equal(new Set(catalogue.products.map((product) => product.slug)).size, 15, "Catalogue product slugs must be unique");
assert.ok(catalogue.products.every((product) => product.brand === "ERES"), "First catalogue proof must remain a singular ERES edit");
assert.ok(catalogue.products.every((product) => product.imageSource === "retailer_first_hero"), "Every bulk-ingested catalogue image must use the first retailer hero");
assert.equal(catalogue.priceCurrency, "AUD", "ERES proof must display the requested Australian pricing");
assert.equal(catalogue.pricesCheckedAt, "2026-07-26", "ERES prices must carry their verification date");
for (const product of catalogue.products) {
  assert.ok(fs.existsSync(path.join(iam, product.image)), `Missing ERES catalogue image: ${product.image}`);
  assert.match(product.retailerUrl, /^https:\/\/www\.eresparis\.com\//, `ERES catalogue product must keep an official retailer URL: ${product.id}`);
  assert.match(product.price, /^AU\$ (?:\d{3}|\d\.\d{3})$/, `ERES catalogue product must keep its verified AUD price: ${product.id}`);
}

const assetMatches = [...shop.matchAll(/src="(a s s e t s\/shop-mockup\/[^"]+)"/g)].map((match) => match[1]);
assert.ok(assetMatches.length >= 12, "Shop must use the locally preserved presentation imagery");
for (const relativeAsset of new Set(assetMatches)) {
  assert.ok(fs.existsSync(path.join(iam, relativeAsset)), `Missing shop image: ${relativeAsset}`);
}

for (const suppliedReference of [
  "https://eu.bordelle.co.uk/products/signature-waspie-cream?variant=43656648884396",
  "https://wardrobe.nyc/collections/bodysuits/products/lace-bodysuit-w5051f25lcblk",
  "https://karlaspetic.com/product/no-v-neon-tiger-bikini/",
  "https://www.eresparis.com/eu/en/lingerie/60653-01062.html",
  "https://www.theupside.com.au/kefi-25in-midi-pant-oyster-usw226087/",
  "https://www.nike.com/au/t/jordan-brooklyn-womens-bodysuit-nZh4yxyG/IM6875-100",
  "https://triangl.com/en-au/products/celeste-jett-black-short?variant=42685752049760",
  "https://www.pucci.com/en-au/products/vivara-print-triangle-bikini-top-6hmx096h895p20",
]) {
  assert.match(shop, new RegExp(suppliedReference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing supplied product reference: ${suppliedReference}`);
}

assert.match(shop, /data-shop-live-band[\s\S]*data-stream-role="fashion"[\s\S]*autoplay[\s\S]*muted/, "Every Shop route must open with the silent live fashion band");
assert.match(shop, /cloudflare-stream-controller\.js[\s\S]*broadcast-clock-v1\.js[\s\S]*shop\.js/, "The live band must reuse the established stream controller and broadcast clock");
assert.match(shopScript, /stateAt\("fashion-underground-intensity"\)/, "The live band must follow the James Bondage fashion channel");
assert.match(shopScript, /wolford-sergio-rossi-capsule[\s\S]*mugler-fall-winter-2021/, "The first live channel proof must rotate between Wolford and Mugler");
assert.match(shopScript, /shopLiveDriftSeconds[\s\S]*entry_seek[\s\S]*hard_seek[\s\S]*soft_catchup/, "The live band must remain locked to the shared broadcast clock");
assert.match(shopStyle, /height:\s*clamp\(430px, 66svh, 760px\)/, "The live masthead must remain a full-width two-thirds-height band");
assert.match(shop, /shop-film-editorial[\s\S]*player\.vimeo\.com\/video\/987002812[^\"]*muted=1/, "The supplied muted Bordelle Vimeo must live lower on the homepage as editorial film");
assert.match(shop, /shopBrandVariant === "b" \? "handdrawn" : "a"/, "The hand-drawn brand test must remain a switchable B variant");
assert.match(shopStyle, /Avenir Next Condensed[\s\S]*Bodoni 72 Smallcaps/, "The A masthead must retain its stylised serif and condensed-sans construction");
assert.ok((shop.match(/james-bondage-handdrawn-faces-b\.png/g) || []).length >= 4, "The interlocking face mark must recur as B-version branding");
assert.match(shop, /james-bondage-handdrawn-wordmark-b\.png/, "The B-version hero must use the isolated yellow hand-drawn wordmark");
assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup/james-bondage-handdrawn-wordmark-b.png")), "Missing isolated B-version wordmark");
assert.ok(fs.existsSync(path.join(iam, "a s s e t s/shop-mockup/james-bondage-handdrawn-faces-b.png")), "Missing isolated B-version face mark");
assert.match(shop, /data-shop-return-music[\s\S]*Universal Mind \[ I o H \] Logo 512\.png/, "Standalone Shop proof must reserve the Universal Mind flower position");
assert.match(shopScript, /iam:return-to-television/, "The Shop flower must return framed visitors to their continuing Music Television room");
assert.match(shopStyle, /data-music-television-frame="embedded"[\s\S]*shop-universal-nav[\s\S]*display:\s*none/, "The fallback flower must yield to the real outer-shell flower when framed");
assert.match(television, /function bootstrapRequestedShop\(\)[\s\S]*classList\.add\("television-room-open"\);\s*startFlowerSpin\(\);\s*openInVideoPageLayer/, "The direct Shop journey must start the existing spinning outer-shell flower");
assert.match(shop, /data-shop-theme-toggle/, "Shop must expose the day/night control");
assert.match(shop, /savedTheme \|\| "night"/, "A first Shop visit must default to the night presentation");
assert.doesNotMatch(shop, /prefersNight/, "System colour preference must not replace the night-first Shop default");
assert.match(shopScript, /iamShopThemeV1/, "Shop must remember the viewer's day/night choice");
assert.match(shopScript, /dataset\.shopTheme \|\| "night"/, "Shop script fallback must remain night-first");
assert.equal((shop.match(/data-filter-category=/g) || []).length, 6, "James Bondage edit must expose the six restrained form filters");
assert.match(shop, /href="#shop-about">about<\/a>[\s\S]*data-shop-menu[\s\S]*href="#giving-back">giving back<\/a>/i, "Shop masthead must use the approved About / Shop / Giving Back hierarchy");
assert.equal((shop.match(/data-shop-type=/g) || []).length, 6, "Shop menu must expose the six functional type routes");
assert.match(shop, /James Bondage Health is the editorial video series/i, "Shop About must preserve the James Bondage Health distinction");
assert.match(shop, /All profits go to youth mental health research\./i, "Giving Back must state the approved profit formula");
assert.match(shop, /href="#catalogue\/eres"[^>]*data-shop-catalogue-link/, "ERES must open from the 23-brand ledger");
assert.match(shop, /data-catalogue-editorial-header/, "ERES catalogue must open with the approved editorial header");
assert.match(shop, /data-shop-product-dialog/, "Catalogue must expose the quiet expanded product view");
assert.equal((shop.match(/data-catalogue-filter=/g) || []).length, 4, "ERES catalogue must expose the restrained form filters");
assert.match(shopScript, /#catalogue\\\/eres\\\/product\\\//, "Expanded product state must have a shareable hash route");
assert.match(shopScript, /shop-catalogue-v1\.json/, "Shop catalogue must render from the shared structured product data");
assert.match(shopScript, /productDialog\.showModal\(\)/, "Product cards must open the accessible expanded view");
assert.match(shopScript, /productDialogPrice\.textContent = product\.price/, "Expanded product view must carry the verified price");
assert.match(shopScript, /enteringCatalogue[\s\S]*window\.scrollTo\(0, 0\)/, "Entering ERES from the brand ledger must reset to the editorial header");

assert.match(shopScript, /iam:shop-music-request/, "Shop must request music through the persistent Music Television shell");
assert.match(television, /iam:shop-music-request/, "Music Television must respond to Shop music requests");
assert.match(television, /continuation\.defaultStation/, "A quiet Shop session must use the established Café del Mar Chill default");
assert.match(index, /data-nav-item="shop"/, "Music Television navigation must expose Shop");
assert.match(index, /data-nav-item="contact"[^>]*>contact<\/a>\s*<a[^>]*data-nav-item="shop"[^>]*>shop<\/a>/, "Shop must be the final global navigation item after Contact");
assert.match(htaccess, /RewriteRule \^shop\/\?\$/, "Root /shop route is missing from Apache redirects");
assert.match(redirects, /^\/shop /m, "Root /shop route is missing from static redirects");

assert.match(architecture, /do not activate without Ben's go-ahead/i, "Fashion Tensor roadmap must remain approval-gated");
assert.match(architecture, /No diagnosis, treatment claim/i, "Fashion Tensor roadmap is missing the clinical boundary");
assert.match(architecture, /Commercial value must not override citizen fit/i, "Fashion Tensor roadmap is missing the commercial-conflict boundary");
assert.match(architecture, /default catalogue thumbnail is always the retailer's first official product hero/i, "Catalogue is missing the deterministic first-hero thumbnail rule");

console.log("Shopfront mock-up checks passed.");
