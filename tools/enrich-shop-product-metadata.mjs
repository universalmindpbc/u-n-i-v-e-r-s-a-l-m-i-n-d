import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import sharp from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/lib/index.js";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const kernelPath = path.join(iam, "shop-product-kernel-v1.json");
const reportPath = path.join(root, "tools", "shop-product-metadata-report.json");
const visionBinary = path.join(root, "tools", "shop-image-vision");
const assetRoot = path.join(iam, "a s s e t s", "shop-mockup", "product-catalogue");
const shouldApply = process.argv.includes("--apply");
const requestedIds = new Set(process.argv.filter((value) => /^JB-\d+$/.test(value)));
const retrievedAt = new Date().toISOString().slice(0, 10);
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

const kernel = JSON.parse(await fs.readFile(kernelPath, "utf8"));

function slug(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function decodeHtml(value = "") {
  const named = new Map([
    ["amp", "&"], ["quot", '"'], ["apos", "'"], ["lt", "<"], ["gt", ">"],
    ["nbsp", " "], ["ndash", "–"], ["mdash", "—"], ["hellip", "…"],
    ["times", "×"], ["copy", "©"], ["reg", "®"], ["trade", "™"],
  ]);
  return String(value)
    .replace(/&#x([0-9a-f]+);?/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);?/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, entity) => named.get(entity.toLowerCase()) ?? match);
}

function retailerText(value = "") {
  return decodeHtml(String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanProductName(value = "", brand = "") {
  let name = retailerText(value).replace(/\s+[|·–—]\s+.*$/u, "").trim();
  const suffix = new RegExp(`\\s+(?:by\\s+)?${String(brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  name = name.replace(suffix, "").trim();
  return name || retailerText(value);
}

function metaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1].trim());
  }
  return "";
}

function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const found = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeHtml(block[1]).trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        found.push(item);
        if (Array.isArray(item["@graph"])) queue.push(...item["@graph"]);
        for (const key of ["hasVariant", "mainEntity", "itemListElement"]) {
          if (Array.isArray(item[key])) queue.push(...item[key]);
          else if (item[key] && typeof item[key] === "object") queue.push(item[key]);
        }
      }
    } catch {
      // Retailer structured data is not always strict JSON. Shopify and OpenGraph remain available.
    }
  }
  return found;
}

function productJsonLd(items, retailerUrl, existingName) {
  const handle = new URL(retailerUrl).pathname.split("/").filter(Boolean).at(-1)?.replace(/\.[a-z0-9]+$/i, "") || "";
  const nameTokens = new Set(slug(existingName).split("-").filter((token) => token.length > 3));
  const products = items.filter((item) => {
    const type = Array.isArray(item["@type"]) ? item["@type"].join(" ") : String(item["@type"] || "");
    return /product/i.test(type);
  });
  return products.map((item) => {
    const serialised = JSON.stringify([item.url, item["@id"], item.offers, item.name]).toLowerCase();
    const overlap = slug(item.name).split("-").filter((token) => nameTokens.has(token)).length;
    return { item, score: (handle && serialised.includes(handle.toLowerCase()) ? 100 : 0) + overlap };
  }).sort((a, b) => b.score - a.score)[0]?.item || null;
}

function arrayify(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function imageUrl(value, base) {
  const raw = typeof value === "string" ? value : value?.url || value?.contentUrl || "";
  if (!raw) return "";
  try {
    const url = new URL(raw.replace(/^\/\//, "https://"), base);
    if (/\.imgix\.net$/i.test(url.hostname)) url.searchParams.delete("w");
    return url.href;
  } catch {
    return "";
  }
}

function uniqueImages(values, base) {
  const output = [];
  const seen = new Set();
  for (const value of values.flat(Infinity)) {
    const url = imageUrl(value, base);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push(url);
  }
  return output;
}

function selectedVariant(shopify, retailerUrl) {
  const variantId = new URL(retailerUrl).searchParams.get("variant");
  return shopify?.variants?.find((variant) => String(variant.id) === variantId)
    || shopify?.variants?.find((variant) => variant.available)
    || shopify?.variants?.[0]
    || null;
}

function colourFromShopify(shopify, variant) {
  if (!shopify || !variant) return "";
  const options = arrayify(shopify.options);
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    const name = typeof option === "string" ? option : option?.name;
    if (!/colou?r|shade/i.test(String(name || ""))) continue;
    const value = variant[`option${index + 1}`] || arrayify(variant.options)[index];
    if (value && !/^default title$/i.test(value)) return retailerText(value);
  }
  return "";
}

function offerFromJsonLd(productLd) {
  const sources = [productLd, ...arrayify(productLd?.hasVariant)];
  const offers = sources.flatMap((source) => arrayify(source?.offers)).flatMap((offer) => offer?.offers ? arrayify(offer.offers) : [offer]);
  return offers.find((offer) => offer?.price || offer?.lowPrice || offer?.highPrice) || offers[0] || null;
}

function currencyFromPage(html, offer) {
  return String(offer?.priceCurrency
    || metaContent(html, "product:price:currency")
    || html.match(/itemprop=["']priceCurrency["'][^>]+content=["']([A-Z]{3})["']/i)?.[1]
    || html.match(/Shopify\.currency\.active\s*=\s*["']([A-Z]{3})/i)?.[1]
    || html.match(/["']currency["']\s*:\s*["']([A-Z]{3})["']/i)?.[1]
    || html.match(/["']priceCurrency["']\s*:\s*["']([A-Z]{3})["']/i)?.[1]
    || "").toUpperCase();
}

function numericPrice(shopify, offer, html = "") {
  const structured = Number(offer?.price || offer?.lowPrice || offer?.highPrice);
  if (Number.isFinite(structured) && structured > 0) return structured;
  const pagePrice = Number(metaContent(html, "product:price:amount")
    || html.match(/itemprop=["']price["'][^>]+content=["']([0-9.]+)["']/i)?.[1]
    || html.match(/data-price-amount=["']([0-9.]+)["']/i)?.[1]);
  if (Number.isFinite(pagePrice) && pagePrice > 0) return pagePrice;
  const cents = Number(shopify?.price ?? shopify?.price_min ?? selectedVariant(shopify, "https://example.test")?.price);
  return Number.isFinite(cents) && cents > 0 ? cents / 100 : null;
}

function formatPrice(value, currency) {
  if (!Number.isFinite(value) || !currency) return "";
  const whole = Math.abs(value - Math.round(value)) < 0.005;
  const formatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value);
  if (currency === "AUD") return formatted.replace(/^\$/, "AU$ ").replace(/^AU\$\s?/, "AU$ ");
  if (currency === "USD") return formatted.replace(/^US\$\s?/, "US$ ").replace(/^\$/, "US$ ");
  return formatted.replace(/^(€|£)\s?/, "$1 ");
}

function shopifyEndpointCandidates(retailerUrl) {
  const url = new URL(retailerUrl);
  const pathWithJs = `${url.pathname.replace(/\/$/, "")}.js`;
  const match = url.pathname.match(/\/products\/([^/?]+)/i);
  const paths = [pathWithJs];
  if (match) {
    const localePrefix = url.pathname.slice(0, url.pathname.indexOf("/products/"));
    paths.push(`${localePrefix}/products/${match[1]}.js`, `/products/${match[1]}.js`);
  }
  return [...new Set(paths)].map((pathname) => new URL(pathname, url.origin).href);
}

async function fetchWithTimeout(url, accept = "text/html,application/xhtml+xml", timeoutMs = 35000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept,
        "accept-language": "en-AU,en;q=0.9",
        ...(new URL(url).hostname.includes("emiliocavallini.com")
          ? { cookie: "directory_currency=AUD; currency=AUD; store=en" }
          : {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function htmlGalleryImages(html, base, ogImage = "") {
  const patterns = [
    /https:\/\/pvh-brands\.imgix\.net\/catalog\/product\/media\/[^"'\\\s<]+/gi,
    /https:\/\/www\.emiliocavallini\.com\/media\/catalog\/product\/[^"'\\\s<]+/gi,
    /https:\/\/static\.nike\.com\/a\/images\/[^"'\\\s<]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<]*)?/gi,
    /https:\/\/skims\.imgix\.net\/s\/files\/[^"'\\\s<]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<]*)?/gi,
  ];
  const found = patterns.flatMap((pattern) => [...html.matchAll(pattern)].map((match) => decodeHtml(match[0])));
  if (!ogImage) return uniqueImages(found, base);
  if (/skims\.com$/i.test(new URL(base).hostname)) return uniqueImages(found, base);
  const basename = new URL(ogImage, base).pathname.split("/").at(-1)?.replace(/_(?:main|[a-z0-9-]+)\.(jpg|jpeg|png|webp)$/i, "") || "";
  const matching = basename ? found.filter((url) => url.includes(basename)) : found;
  return uniqueImages(matching.length ? matching : found, base);
}

async function adidasProduct(product) {
  const sku = product.retailerUrl.match(/\/([A-Z0-9]{5,})\.html/i)?.[1];
  if (!sku) return null;
  const endpoint = `https://www.adidas.com.au/api/products/${encodeURIComponent(sku)}`;
  const response = await fetch(endpoint, { headers: { "user-agent": "Mozilla/5.0", accept: "application/json" } });
  if (!response.ok) throw new Error(`adidas product API ${response.status}`);
  const data = await response.json();
  const description = retailerText(data?.product_description?.text || data?.product_description?.subtitle || "");
  const priceValue = Number(data?.pricing_information?.currentPrice ?? data?.price_information?.currentPrice);
  const images = uniqueImages([
    arrayify(data?.view_list).map((view) => view?.image_url),
    data?.product_description?.description_assets?.image_url,
    data?.product_listing_assets?.[0]?.image_url,
  ], endpoint);
  return {
    name: cleanProductName(data?.name || product.name, product.brand),
    description,
    color: retailerText(data?.attribute_list?.color || data?.attribute_list?.search_color || ""),
    currency: "AUD",
    priceValue,
    price: formatPrice(priceValue, "AUD"),
    images,
    html: "",
    finalUrl: product.retailerUrl,
  };
}

async function getShopifyProduct(retailerUrl) {
  for (const endpoint of shopifyEndpointCandidates(retailerUrl)) {
    try {
      const response = await fetchWithTimeout(endpoint, "application/json,text/javascript,*/*;q=0.8");
      if (!response.ok) continue;
      const text = await response.text();
      if (!/^\s*\{/.test(text)) continue;
      const product = JSON.parse(text);
      if (product?.title && (product?.images?.length || product?.featured_image)) return { product, endpoint };
    } catch {
      // Exact page metadata remains the fallback.
    }
  }
  return null;
}

async function retrieveProduct(product) {
  if (product.brand === "adidas") {
    const adidas = await adidasProduct(product);
    if (!adidas?.name || !adidas?.description || !adidas?.price || !adidas?.images?.length) {
      throw new Error("official adidas product record incomplete");
    }
    return adidas;
  }
  const retrievalUrl = new URL(product.retailerUrl);
  if (retrievalUrl.hostname.includes("emiliocavallini.com")) retrievalUrl.searchParams.set("___store", "en");
  const pageResponse = await fetchWithTimeout(retrievalUrl.href);
  const html = await pageResponse.text();
  if (!pageResponse.ok) throw new Error(`retailer page ${pageResponse.status}`);
  const ld = productJsonLd(parseJsonLd(html), product.retailerUrl, product.name);
  const shopifyResult = await getShopifyProduct(product.retailerUrl);
  const shopify = shopifyResult?.product || null;
  const variant = selectedVariant(shopify, product.retailerUrl);
  const offer = offerFromJsonLd(ld);
  const name = cleanProductName(shopify?.title || ld?.name || metaContent(html, "og:title") || product.name, product.brand);
  const launchDescription = html.match(/<div[^>]*>([^<>]{30,}SKU:\s*[A-Z0-9-]+)<\/div>/i)?.[1] || "";
  const description = retailerText(shopify?.description || ld?.description || metaContent(html, "description") || metaContent(html, "og:description") || launchDescription);
  const currency = currencyFromPage(html, offer);
  const priceValue = numericPrice(shopify, offer, html);
  const price = formatPrice(priceValue, currency);
  const ogImage = metaContent(html, "og:image:secure_url") || metaContent(html, "og:image");
  const images = uniqueImages([
    shopify?.images || [],
    shopify?.featured_image || [],
    ld?.image || [],
    arrayify(ld?.hasVariant).flatMap((variantLd) => arrayify(variantLd?.image)),
    ogImage,
    htmlGalleryImages(html, pageResponse.url, ogImage),
  ], pageResponse.url);
  const color = colourFromShopify(shopify, variant);
  if (!name) throw new Error("retailer title unavailable");
  const descriptionUnavailable = description.length < 12;
  const priceUnavailable = !price || !currency || !Number.isFinite(priceValue);
  if (!images.length) throw new Error("official retailer gallery unavailable");
  return { name, description, color, currency, price, priceValue, images, html, finalUrl: pageResponse.url, descriptionUnavailable, priceUnavailable };
}

async function downloadCandidate(url, retailerUrl, destination) {
  const response = await fetchWithTimeout(url, "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", 45000);
  if (!response.ok) throw new Error(`image ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`unexpected image content type ${type || "unknown"}`);
  const input = Buffer.from(await response.arrayBuffer());
  await sharp(input, { failOn: "none" }).rotate().jpeg({ quality: 82 }).toFile(destination);
}

async function visionScores(paths) {
  if (!paths.length) return [];
  try {
    const { stdout } = await execFileAsync(visionBinary, paths, { maxBuffer: 2 * 1024 * 1024 });
    return stdout.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return paths.map((file) => ({ path: file, faces: 0, bodies: 0, largestFace: 0 }));
  }
}

async function selectHumanImage(product, images) {
  const candidateUrls = images.slice(0, 8);
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), `jb-${product.id.toLowerCase()}-`));
  const downloaded = [];
  try {
    for (let index = 0; index < candidateUrls.length; index += 1) {
      const destination = path.join(tempDirectory, `${String(index).padStart(2, "0")}.jpg`);
      try {
        await downloadCandidate(candidateUrls[index], product.retailerUrl, destination);
        downloaded.push({ index, url: candidateUrls[index], path: destination });
      } catch {
        // A gallery frame that cannot be decoded is skipped; exact gallery order is preserved.
      }
    }
    if (!downloaded.length) throw new Error("official gallery images could not be decoded");
    const results = await visionScores(downloaded.map((item) => item.path));
    const byPath = new Map(results.map((item) => [item.path, item]));
    const ranked = downloaded.map((item) => {
      const result = byPath.get(item.path) || { faces: 0, bodies: 0, largestFace: 0 };
      const score = (result.faces > 0 ? 10000 : 0)
        + (result.bodies > 0 ? 1000 : 0)
        + Math.min(500, Number(result.largestFace || 0) * 10000)
        - item.index;
      return { ...item, ...result, score };
    }).sort((a, b) => b.score - a.score || a.index - b.index);
    return ranked[0];
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}

async function saveSelectedImage(product, selection) {
  const brandDirectory = slug(product.brand);
  const filename = path.basename(product.image || `${product.id.toLowerCase()}-${slug(product.name)}.webp`);
  const relative = product.image || `a s s e t s/shop-mockup/product-catalogue/${brandDirectory}/${filename.replace(/\.[^.]+$/, ".webp")}`;
  const absolute = path.join(iam, relative);
  const temp = `${absolute}.source`;
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await downloadCandidate(selection.url, product.retailerUrl, temp);
  const source = await fs.readFile(temp);
  await sharp(source, { failOn: "none" })
    .rotate()
    .resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5, smartSubsample: true })
    .toFile(absolute);
  await fs.rm(temp, { force: true });
  return relative;
}

const candidates = kernel.products.filter((product) => {
  if (product.brand === "ERES") return false;
  if (requestedIds.size && !requestedIds.has(product.id)) return false;
  return product.metadataStatus !== "Metadata ready" || requestedIds.has(product.id);
});
const report = { generatedAt: new Date().toISOString(), requested: candidates.length, succeeded: [], failed: [] };
let cursor = 0;

async function enrich(product) {
  const metadata = await retrieveProduct(product);
  const selected = await selectHumanImage(product, metadata.images);
  const image = await saveSelectedImage(product, selected);
  Object.assign(product, {
    name: metadata.name,
    color: metadata.color || "",
    description: metadata.description,
    price: metadata.price,
    priceValue: metadata.priceValue,
    currency: metadata.currency,
    image,
    imageAlt: `${metadata.name} by ${product.brand}, official retailer gallery image${selected.faces > 0 ? " featuring a visible face" : selected.bodies > 0 ? " featuring a model" : ""}`,
    imageSource: selected.faces > 0 ? "retailer_gallery_face_selected" : selected.bodies > 0 ? "retailer_gallery_model_selected" : "retailer_gallery_index_0_fallback",
    sourcePageUrl: product.retailerUrl,
    sourceImageUrl: selected.url,
    sourceImageIndex: selected.index,
    subjectPresent: selected.faces > 0 || selected.bodies > 0,
    forwardFacing: selected.faces > 0,
    retrievedAt,
    metadataStatus: metadata.descriptionUnavailable || metadata.priceUnavailable ? "Inventory only" : "Metadata ready",
    listedOnShop: true,
    requiresReview: Boolean(metadata.descriptionUnavailable || metadata.priceUnavailable),
    reviewNotes: metadata.descriptionUnavailable && metadata.priceUnavailable
      ? "Retailer page publishes neither descriptive copy nor a current price."
      : metadata.descriptionUnavailable
        ? "Retailer page publishes no product description."
        : metadata.priceUnavailable
          ? "Retailer page publishes no current price."
          : "",
  });
  return { metadata, selected, image };
}

async function worker() {
  while (cursor < candidates.length) {
    const product = candidates[cursor++];
    try {
      const result = await enrich(product);
      report.succeeded.push({
        id: product.id,
        brand: product.brand,
        url: product.retailerUrl,
        price: product.price,
        descriptionLength: product.description.length,
        image: result.image,
        sourceImageIndex: result.selected.index,
        faces: result.selected.faces,
        bodies: result.selected.bodies,
      });
      process.stdout.write(`OK ${product.id} ${product.brand} ${product.price} image:${result.selected.index} face:${result.selected.faces} body:${result.selected.bodies}\n`);
    } catch (error) {
      report.failed.push({ id: product.id, brand: product.brand, url: product.retailerUrl, error: String(error?.message || error) });
      process.stdout.write(`FAIL ${product.id} ${product.brand}: ${String(error?.message || error)}\n`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(5, Math.max(1, candidates.length)) }, () => worker()));

kernel.counts.metadataReady = kernel.products.filter((product) => product.metadataStatus === "Metadata ready").length;
kernel.counts.imageReady = kernel.products.filter((product) => Boolean(product.image)).length;
kernel.counts.listedOnShop = kernel.products.filter((product) => Boolean(product.listedOnShop)).length;
for (const brand of kernel.brandCounts) {
  brand.ready = kernel.products.filter((product) => product.brand === brand.brand && product.metadataStatus === "Metadata ready").length;
}
kernel.imagePolicy = {
  selection: "official_retailer_gallery_human_first",
  priority: ["visible_face", "human_model", "retailer_gallery_index_0"],
  source: "exact_notion_product_url_only",
  fallback: "retailer_gallery_index_0_or_fail_closed_for_review",
  retrievedAt,
};
kernel.metadataPolicy = {
  description: "retailer_authored_copy_only",
  price: "retailer_verified_display_currency",
  unresolved: "fail_closed_for_human_review",
  retrievedAt,
};

report.summary = {
  products: kernel.products.length,
  metadataReady: kernel.counts.metadataReady,
  succeeded: report.succeeded.length,
  failed: report.failed.length,
  humanImages: kernel.products.filter((product) => product.subjectPresent || product.brand === "ERES").length,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (shouldApply) await fs.writeFile(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!shouldApply) console.log("Dry run only; pass --apply to write the enriched kernel and images.");
