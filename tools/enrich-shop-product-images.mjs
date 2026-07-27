import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/lib/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kernelPath = path.join(root, "i  a m", "shop-product-kernel-v1.json");
const assetRoot = path.join(root, "i  a m", "a s s e t s", "shop-mockup", "product-catalogue");
const reportPath = path.join(root, "tools", "shop-product-image-ingest-report.json");
const shouldApply = process.argv.includes("--apply");
const requestedIds = new Set(process.argv.filter((value) => value.startsWith("JB-")));
const retrievedAt = "2026-07-28";
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
const manualOfficialImages = new Map([
  [
    "JB-0142",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/8db33930ddff4a4280f55d70faa6dcf6_9366/adidas_by_Stella_McCartney_Running_Onesie_Black_KF8817_HM13.jpg",
  ],
  [
    "JB-0143",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/725210d41cb545faa1abbc7949862f2e_9366/adidas_Originals_Sport_Superstar_7-8_Leggings_Black_KU3680_HM9.jpg",
  ],
  [
    "JB-0144",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/5514d2517c3c4099992a39bdf945b498_9366/ADIDAS_x_FARM_RIO_OPTIME_LEGGINGS_White_KR0230_21_model.jpg",
  ],
  [
    "JB-0145",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/ad91ebe7e7734bfb8b8d3266d64d4c50_9366/adi365_Climacool_Running_7-8_Leggings_Black_KA0135_21_model.jpg",
  ],
  [
    "JB-0146",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/4b7ad7681e8147e4a5c964c5f8b4f769_9366/Adizero_Short_Leggings_Black_KA0149_21_model.jpg",
  ],
  [
    "JB-0147",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/ddce856536b443be911ccd77f544c074_9366/ADIDAS_x_FARM_RIO_BIKE_SHORTS_Grey_KD4613_HM9.jpg",
  ],
  [
    "JB-0148",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/fce8625017eb4220b954ab17015b32ec_9366/One-Piece_Swimsuit_Multicolor_GL6146_02_laydown_hover.jpg",
  ],
  [
    "JB-0149",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/adf3459957234390a87bf77b374b6fd7_9366/3-Stripes_C-Back_Swimsuit_Blue_JY4719_21_model.jpg",
  ],
  [
    "JB-0150",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/309e9ad8cd5b4b5b9dbf4a7093ec3c09_9366/3-Stripes_Swimsuit_Kids_Blue_JX5644_43_detail.jpg",
  ],
  [
    "JB-0151",
    "https://assets.adidas.com/images/w_500,f_auto,q_auto/62efc626437b440b9b388687f66aed90_9366/V-back_Swimsuit_Black_JM8152_21_model.jpg",
  ],
  [
    "JB-0309",
    "https://www.emiliocavallini.com/media/catalog/product/cache/5/image/1000x1500/9df78eab33525d08d6e5fb8d27136e95/b/o/bodynero.jpg",
  ],
  [
    "JB-0313",
    "https://www.emiliocavallini.com/media/catalog/product/cache/5/image/9df78eab33525d08d6e5fb8d27136e95/5/f/5f29.1.4-white.jpg",
  ],
]);

const kernel = JSON.parse(await fs.readFile(kernelPath, "utf8"));

function slug(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 92);
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x2f;/gi, "/")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
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
      }
    } catch {
      // Retailer pages frequently include non-strict JSON-LD; other sources remain available.
    }
  }
  return found;
}

function firstImageFromJsonLd(items) {
  for (const item of items) {
    if (!String(item["@type"] || "").toLowerCase().includes("product")) continue;
    const image = Array.isArray(item.image) ? item.image[0] : item.image;
    if (typeof image === "string") return image;
    if (image && typeof image.url === "string") return image.url;
  }
  return "";
}

function firstImageFromEmbeddedState(html) {
  const candidates = [
    /"image"\s*:\s*\[\s*"(https?:\\?\/\\?\/[^"\\]+(?:\\.[^"\\]+)?)"/i,
    /"featured_image"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+)"/i,
    /"zoom_image"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+)"/i,
    /"large"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+)"/i,
  ];
  for (const pattern of candidates) {
    const match = html.match(pattern);
    if (!match) continue;
    return decodeHtml(match[1]).replace(/\\u0026/g, "&").replace(/\\\//g, "/");
  }
  return "";
}

function normaliseImageUrl(value, pageUrl) {
  if (!value) return "";
  let source = value.replace(/^\/\//, "https://").replace(/^http:\/\//i, "https://");
  try {
    source = new URL(source, pageUrl).href;
  } catch {
    return "";
  }
  return source;
}

function productSlugFromUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const productIndex = parts.lastIndexOf("products");
    return slug(productIndex >= 0 ? parts[productIndex + 1] : parts.at(-1)?.replace(/\.[a-z0-9]+$/i, ""));
  } catch {
    return "product";
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-AU,en;q=0.9",
      },
    });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function adidasImage(product) {
  const sku = product.retailerUrl.match(/\/([A-Z0-9]{5,})\.html/i)?.[1];
  if (!sku) return "";
  const api = `https://www.adidas.com.au/api/products/${encodeURIComponent(sku)}`;
  const response = await fetch(api, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) return "";
  const data = await response.json();
  const image = data?.view_list?.[0]?.image_url || data?.image?.src || data?.product_description?.image;
  return typeof image === "string" ? image : "";
}

async function downloadAndOptimise(imageUrl, product) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(imageUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        referer: product.retailerUrl,
      },
    });
    if (!response.ok) throw new Error(`image ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error(`unexpected image content type ${contentType || "unknown"}`);
    const input = Buffer.from(await response.arrayBuffer());
    const brandDirectory = slug(product.brand);
    const filename = `${product.id.toLowerCase()}-${productSlugFromUrl(product.retailerUrl)}.webp`;
    const absoluteDirectory = path.join(assetRoot, brandDirectory);
    const absolutePath = path.join(absoluteDirectory, filename);
    await fs.mkdir(absoluteDirectory, { recursive: true });
    const image = sharp(input, { failOn: "none" }).rotate();
    const metadata = await image.metadata();
    await image
      .resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toFile(absolutePath);
    return {
      relativePath: `a s s e t s/shop-mockup/product-catalogue/${brandDirectory}/${filename}`,
      width: metadata.width || null,
      height: metadata.height || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function ingest(product) {
  const originalSlug = productSlugFromUrl(product.retailerUrl);
  let page;
  let imageUrl = manualOfficialImages.get(product.id) || "";
  if (!imageUrl && new URL(product.retailerUrl).hostname.includes("adidas.com")) {
    imageUrl = await adidasImage(product);
  }
  if (!imageUrl) {
    page = await fetchText(product.retailerUrl);
    if (!page.response.ok) throw new Error(`page ${page.response.status}`);
    const jsonLd = parseJsonLd(page.text);
    imageUrl = firstImageFromJsonLd(jsonLd)
      || metaContent(page.text, "og:image:secure_url")
      || metaContent(page.text, "og:image")
      || metaContent(page.text, "twitter:image")
      || firstImageFromEmbeddedState(page.text);
    imageUrl = normaliseImageUrl(imageUrl, page.response.url);
    if (!imageUrl) throw new Error("official first image was not exposed by the page");

    const finalSlug = productSlugFromUrl(page.response.url);
    const redirectedToDifferentProduct = originalSlug && finalSlug && originalSlug !== finalSlug;
    if (redirectedToDifferentProduct) {
      const sourceTokens = new Set(slug(product.sourceTitle).split("-").filter((token) => token.length > 3));
      const liveTokens = slug(metaContent(page.text, "og:title")).split("-").filter((token) => token.length > 3);
      const overlap = liveTokens.filter((token) => sourceTokens.has(token)).length;
      if (overlap < 1) throw new Error(`exact URL redirected to a different product (${finalSlug})`);
    }
  }

  const local = await downloadAndOptimise(imageUrl, product);
  return {
    image: local.relativePath,
    imageAlt: `${product.name} by ${product.brand}, official first product image`,
    imageSource: "retailer_gallery_index_0",
    sourcePageUrl: product.retailerUrl,
    sourceImageUrl: imageUrl,
    sourceImageIndex: 0,
    retrievedAt,
    listedOnShop: true,
    sourceWidth: local.width,
    sourceHeight: local.height,
  };
}

const candidates = kernel.products.filter((product) => {
  if (requestedIds.size && !requestedIds.has(product.id)) return false;
  return !product.image && product.brand !== "ERES";
});
const report = { generatedAt: new Date().toISOString(), requested: candidates.length, succeeded: [], failed: [] };

let cursor = 0;
const workerCount = Math.min(6, Math.max(1, candidates.length));
async function worker() {
  while (cursor < candidates.length) {
    const index = cursor++;
    const product = candidates[index];
    try {
      const metadata = await ingest(product);
      Object.assign(product, metadata);
      report.succeeded.push({ id: product.id, brand: product.brand, url: product.retailerUrl, image: metadata.image, sourceImageUrl: metadata.sourceImageUrl });
      process.stdout.write(`OK ${product.id} ${product.brand}\n`);
    } catch (error) {
      report.failed.push({ id: product.id, brand: product.brand, url: product.retailerUrl, error: String(error?.message || error) });
      process.stdout.write(`FAIL ${product.id} ${product.brand}: ${String(error?.message || error)}\n`);
    }
  }
}

await Promise.all(Array.from({ length: workerCount }, worker));

const usedSlugs = new Map();
for (const product of kernel.products) {
  let productSlug = product.slug || productSlugFromUrl(product.retailerUrl) || product.id.toLowerCase();
  if (product.id === "JB-0309") productSlug = "engineered-body";
  const scopedSlug = `${slug(product.brand)}:${productSlug}`;
  if (usedSlugs.has(scopedSlug)) productSlug = `${productSlug}-${product.id.toLowerCase()}`;
  usedSlugs.set(`${slug(product.brand)}:${productSlug}`, product.id);
  product.slug = productSlug;
}

kernel.counts.imageReady = kernel.products.filter((product) => Boolean(product.image)).length;
kernel.counts.listedOnShop = kernel.products.filter((product) => Boolean(product.listedOnShop)).length;
kernel.imagePolicy = {
  selection: "retailer_gallery_index_0_only",
  source: "exact_notion_product_url",
  fallback: "fail_closed_for_review",
  retrievedAt,
};
report.kernelSummary = {
  products: kernel.products.length,
  imageReady: kernel.counts.imageReady,
  listedOnShop: kernel.counts.listedOnShop,
  remainingWithoutImage: kernel.products.filter((product) => !product.image).length,
};

await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
if (shouldApply) await fs.writeFile(kernelPath, JSON.stringify(kernel, null, 2) + "\n");

console.log(`Image ingest: ${report.succeeded.length} succeeded, ${report.failed.length} failed.`);
if (!shouldApply) console.log("Dry run only; pass --apply to update the kernel.");
