import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");

const root = path.resolve(import.meta.dirname, "..");
const exportPath = path.join(root, "tools/shop-future-intake-notion-export.json");
const kernelPath = path.join(root, "i  a m/shop-product-kernel-v1.json");
const assetRoot = path.join(root, "i  a m/a s s e t s/shop-mockup/product-catalogue");

const source = JSON.parse(fs.readFileSync(exportPath, "utf8"));
const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));
const supportedBrands = new Map([
  ["FREE PEOPLE", "Free People"],
  ["LISA MARIE FERNANDEZ", "Lisa Marie Fernandez"],
]);

function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function productSlug(product) {
  for (const value of [product["Canonical URL"], product["Retailer URL"]]) {
    try {
      const pathname = new URL(value).pathname.replace(/\/$/, "");
      const candidate = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) || "");
      if (candidate) return slugify(candidate);
    } catch {}
  }
  return slugify(product.Product);
}

function parseForms(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed) && parsed.length) return parsed.map(slugify).filter(Boolean);
  } catch {}
  return ["swim"];
}

function parseShopTypes(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      const labelToValue = new Map((kernel.shopTaxonomy?.visibleOptions || []).map((option) => [option.label, option.value]));
      return parsed.map((label) => labelToValue.get(label)).filter(Boolean);
    }
  } catch {}
  return [];
}

function priceLabel(product) {
  const amount = Number(product["Price AUD"]);
  if (!Number.isFinite(amount)) return "";
  return `AU$ ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 }).format(amount)}`;
}

const existingIds = new Set(kernel.products.map((product) => product.id));
const existingUrls = new Set(kernel.products.map((product) => product.canonicalUrl));
let nextId = Math.max(...kernel.products.map((product) => Number(String(product.id).replace(/\D/g, "")) || 0)) + 1;
const additions = [];

for (const notionProduct of source.products) {
  const brand = supportedBrands.get(notionProduct.Brand);
  if (!brand) throw new Error(`Unsupported Notion brand: ${notionProduct.Brand}`);
  const canonicalUrl = notionProduct["Canonical URL"] || notionProduct["Retailer URL"];
  if (!canonicalUrl?.startsWith("https://")) throw new Error(`Missing canonical URL: ${notionProduct.Product}`);
  if (existingUrls.has(canonicalUrl)) continue;
  if (!notionProduct["Official Description"]?.trim()) throw new Error(`Missing official description: ${canonicalUrl}`);
  if (!notionProduct["First Hero URL"]?.startsWith("https://")) throw new Error(`Missing first hero: ${canonicalUrl}`);
  if (!Number.isFinite(Number(notionProduct["Price AUD"]))) throw new Error(`Missing AUD price: ${canonicalUrl}`);

  const id = `JB-${String(nextId++).padStart(4, "0")}`;
  if (existingIds.has(id)) throw new Error(`Duplicate generated ID: ${id}`);
  const slug = productSlug(notionProduct);
  const brandSlug = slugify(brand);
  const imageFile = `${id.toLowerCase()}-${slug}.webp`;
  additions.push({
    id,
    brand,
    sourceTitle: notionProduct.Product,
    name: notionProduct.Product,
    productType: notionProduct["Product Type"] || "",
    forms: parseForms(notionProduct.Forms),
    shopTypes: parseShopTypes(notionProduct["Shop Taxonomy"]),
    retailerUrl: notionProduct["Retailer URL"],
    canonicalUrl,
    sourceOccurrences: 1,
    metadataStatus: "Metadata ready",
    listedOnShop: true,
    shopRoute: `#catalogue/${brandSlug}`,
    slug,
    image: `a s s e t s/shop-mockup/product-catalogue/${brandSlug}/${imageFile}`,
    imageAlt: `${notionProduct.Product} by ${brand}, official first hero image${notionProduct["Subject Present"] === "Yes" ? " featuring a model" : ""}`,
    imageSource: "notion_first_hero",
    sourcePageUrl: notionProduct["Retailer URL"],
    sourceImageIndex: 0,
    retrievedAt: "2026-07-29",
    color: notionProduct.Colour || "",
    description: notionProduct["Official Description"].trim(),
    price: priceLabel(notionProduct),
    priceValue: Number(notionProduct["Price AUD"]),
    currency: notionProduct.Currency || "AUD",
    sourceImageUrl: notionProduct["First Hero URL"],
    subjectPresent: notionProduct["Subject Present"] === "Yes",
    forwardFacing: notionProduct["Forward-facing"] === "Yes",
    notionPageId: notionProduct.id,
  });
  if (!additions.at(-1).shopTypes.length) throw new Error(`Missing Shop Taxonomy: ${canonicalUrl}`);
  existingIds.add(id);
  existingUrls.add(canonicalUrl);
}

for (const product of additions) {
  const destination = path.join(root, "i  a m", product.image);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination) && fs.statSync(destination).size > 2048) continue;
  const response = await fetch(product.sourceImageUrl, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.5 Safari/605.1.15",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Image ${response.status}: ${product.sourceImageUrl}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 2048) throw new Error(`Image response too small: ${product.sourceImageUrl}`);
  await sharp(bytes)
    .rotate()
    .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(destination);
}

if (additions.length) kernel.products.push(...additions);
const brandOrder = [...new Set(kernel.products.map((product) => product.brand))]
  .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));
kernel.brandOrder = brandOrder;
kernel.brandCounts = brandOrder.map((brand) => {
  const products = kernel.products.filter((product) => product.brand === brand);
  return {
    brand,
    count: products.length,
    ready: products.filter((product) => product.metadataStatus === "Metadata ready").length,
    route: products[0]?.shopRoute || `#catalogue/${slugify(brand)}`,
  };
});
kernel.generatedAt = "2026-07-29";
kernel.counts.sourceReferences += additions.length;
kernel.counts.canonicalRecords += additions.length;
kernel.counts.products = kernel.products.length;
kernel.counts.brands = brandOrder.length;
kernel.counts.metadataReady += additions.length;
kernel.counts.imageReady = kernel.products.filter((product) => product.image).length;
kernel.counts.listedOnShop = kernel.products.filter((product) => product.listedOnShop).length;

fs.writeFileSync(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);
console.log(JSON.stringify({ additions: additions.length, products: kernel.counts.products, brands: kernel.counts.brands }));
