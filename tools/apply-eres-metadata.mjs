import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const metadataPath = process.argv[2];

if (!metadataPath) throw new Error("Usage: node tools/apply-eres-metadata.mjs /path/to/eres-metadata.json");

const kernelPath = path.join(iam, "shop-product-kernel-v1.json");
const cataloguePath = path.join(iam, "shop-catalogue-v1.json");
const assetDirectory = path.join(iam, "a s s e t s", "shop-mockup", "eres-catalogue");
const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
const metadataByUrl = new Map(metadata.map((item) => [item.url, item]));
const retrievedAt = new Date().toISOString();

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function typeFromRetailerLabel(label, fallback) {
  const value = String(label || "").toLowerCase();
  if (value.includes("brief") || value.includes("tanga") || value.includes("thong")) return value.includes("bikini") ? "Bikini Bottom" : "Briefs";
  if (value.includes("bandeau") || value.includes("bikini top")) return "Bikini Top";
  if (value.includes("one-piece") || value.includes("swimsuit") || value.includes("trikini")) return "Swimsuit";
  if (value.includes("bra")) return "Bra";
  return fallback && fallback !== "Pending" ? fallback : "Other";
}

function categoriesFor(productType, forms) {
  const categories = [];
  const type = String(productType || "").toLowerCase();
  if (type === "bra") categories.push("bras");
  if (type === "briefs") categories.push("briefs");
  if (type === "bodysuit") categories.push("bodysuits");
  if (type === "swimsuit") categories.push("swimsuits");
  if (type === "bikini top") categories.push("bikini-tops");
  if (type === "bikini bottom") categories.push("bikini-bottoms");
  for (const form of forms || []) if (!categories.includes(slugify(form))) categories.push(slugify(form));
  return categories;
}

async function download(url, destination) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Image request failed ${response.status}: ${url}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error(`Unexpected image content type ${contentType}: ${url}`);
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

const changed = [];
for (const product of kernel.products) {
  if (product.brand !== "ERES" || product.metadataStatus === "Metadata ready") continue;
  const item = metadataByUrl.get(product.retailerUrl);
  if (!item) throw new Error(`Missing verified ERES metadata for ${product.retailerUrl}`);
  for (const field of ["name", "color", "price", "priceValue", "currency", "description", "imageUrl", "imageAlt"]) {
    if (item[field] === null || item[field] === undefined || item[field] === "") throw new Error(`Missing ${field} for ${product.retailerUrl}`);
  }

  const code = product.retailerUrl.match(/\/(\d+)-(\d+)\.html/)?.slice(1).join("-") || product.id;
  const slug = `${slugify(item.name)}-${code}`;
  const filename = `${slug}.jpg`;
  const relativeImage = `a s s e t s/shop-mockup/eres-catalogue/${filename}`;
  const productType = typeFromRetailerLabel(item.retailerType, product.productType);

  await download(item.imageUrl, path.join(assetDirectory, filename));
  Object.assign(product, {
    name: item.name,
    productType,
    metadataStatus: "Metadata ready",
    listedOnShop: true,
    slug,
    color: item.color,
    categories: categoriesFor(productType, product.forms),
    description: item.description,
    image: relativeImage,
    imageAlt: item.imageAlt,
    imageSource: "retailer_gallery_index_0",
    sourceImageUrl: item.imageUrl,
    sourceImageIndex: 0,
    price: item.price,
    priceValue: item.priceValue,
    currency: item.currency,
  });
  changed.push(product.id);
}

if (changed.length !== 21) throw new Error(`Expected 21 new ERES products, updated ${changed.length}`);

kernel.counts.metadataReady = kernel.products.filter((product) => product.metadataStatus === "Metadata ready").length;
for (const brand of kernel.brandCounts) {
  brand.ready = kernel.products.filter((product) => product.brand === brand.brand && product.metadataStatus === "Metadata ready").length;
}

const eresProducts = kernel.products.filter((product) => product.brand === "ERES");
catalogue.version = 3;
catalogue.retrievedAt = retrievedAt;
catalogue.products = eresProducts.map((product) => ({
  id: `eres-${product.retailerUrl.match(/\/(\d+-\d+)\.html/)?.[1] || product.id}`,
  slug: product.slug,
  brand: product.brand,
  name: product.name,
  color: product.color,
  categories: product.categories,
  description: product.description,
  image: product.image,
  imageAlt: product.imageAlt,
  imageSource: product.imageSource,
  price: product.price,
  retailerUrl: product.retailerUrl,
  sourcePageUrl: product.retailerUrl,
  sourceImageUrl: product.sourceImageUrl,
  sourceImageIndex: 0,
  retrievedAt,
}));

fs.writeFileSync(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);
fs.writeFileSync(cataloguePath, `${JSON.stringify(catalogue, null, 2)}\n`);
console.log(JSON.stringify({ updated: changed.length, eresReady: eresProducts.length, metadataReady: kernel.counts.metadataReady }));
