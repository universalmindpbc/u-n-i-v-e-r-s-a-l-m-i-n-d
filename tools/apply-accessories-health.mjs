import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const intakePath = path.join(root, "tools/accessories-health-product-intake.json");
const kernelPath = path.join(root, "i  a m/shop-product-kernel-v1.json");
const editsPath = path.join(root, "i  a m/shop-radio-edits-v1.json");
const assetDirectory = "a s s e t s/shop-mockup/product-catalogue/accessories-health";
const generatedAt = "2026-08-04";
const editBrand = "Accessories | Health";
const editSlug = "accessories";
const editRoute = "#catalogue/accessories";

const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));
const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));
const radioEdits = JSON.parse(fs.readFileSync(editsPath, "utf8"));

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-");
}

function formatAud(value) {
  return `AU$ ${new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

assert.equal(intake.length, 36, "Accessories | Health must contain exactly 36 Shop products");
assert.equal(new Set(intake.map(({ id }) => id)).size, 36, "Accessories | Health product IDs must be unique");
assert.equal(new Set(intake.map(({ canonicalUrl }) => canonicalUrl)).size, 36, "Accessories | Health canonical URLs must be unique");
assert.ok(!intake.some(({ id, name }) => id === "JB-0459" || /bi[- ]?color/i.test(name)), "Bicolor Tourmaline must remain excluded");
assert.ok(intake.some(({ id, name, priceValue }) => id === "JB-0445" && /LEIF|Buddha Wood/i.test(name) && priceValue === 99), "LEIF must remain in the normal A$99 catalogue");
assert.ok(intake.some(({ id, name, priceValue }) => id === "JB-0431" && /Blue Lotus Extract/i.test(name) && priceValue === 67), "Blue Lotus must remain a normal A$67 catalogue product");
assert.ok(intake.some(({ id, name }) => id === "JB-0430" && /PRE-ORDER/.test(name)), "Clair must visibly retain PRE-ORDER");

const products = intake.map((record, index) => {
  const mineral = record.brand === "The Arkenstone";
  return {
    id: record.id,
    brand: record.brand,
    catalogueBrand: editBrand,
    sourceBrandHeading: editBrand,
    sourceTitle: record.name,
    name: record.name,
    productType: record.productType,
    forms: mineral ? ["mineral"] : ["ritual", "wellbeing"],
    retailer: record.retailer,
    retailerUrl: record.retailerUrl,
    canonicalUrl: record.canonicalUrl,
    shopRoute: editRoute,
    slug: slugify(`${record.id}-${record.name}`),
    color: "",
    description: record.description,
    material: record.material || "",
    image: `${assetDirectory}/${record.asset}`,
    imageAlt: record.sourceVideoUrl
      ? `${record.brand} ${record.name} video poster`
      : `${record.brand} ${record.name} product shot`,
    imageSource: record.imageSource || "retailer_first_hero",
    sourceImageUrl: record.sourceImageUrl,
    sourceImageIndex: 0,
    ...(record.sourceVideoUrl ? { sourceVideoUrl: record.sourceVideoUrl } : {}),
    ...(record.videoEmbed ? { videoEmbed: record.videoEmbed } : {}),
    price: formatAud(record.priceValue),
    priceValue: record.priceValue,
    colourFamilies: [],
    colourEvidenceText: "",
    shopTypes: ["accessories"],
    notionPageId: record.notionPageId,
    sourcePageUrl: record.retailerUrl,
    sourceOccurrences: 1,
    metadataStatus: record.metadataStatus,
    requiresReview: record.metadataStatus !== "Metadata ready",
    listedOnShop: true,
    retrievedAt: generatedAt,
    currency: "AUD",
    shopEdits: [editBrand],
    editRanks: { [editBrand]: index + 1, [editSlug]: index + 1 },
    ...(mineral ? { mediaUsage: "Locked MVP image permission confirmed by Ben on 2026-08-04" } : {}),
  };
});

const productIds = products.map(({ id }) => id);
const productIdSet = new Set(productIds);
const existingAccessoriesCount = kernel.products.filter(({ id }) => productIdSet.has(id)).length;
kernel.products = [...kernel.products.filter(({ id }) => !productIdSet.has(id)), ...products];
kernel.generatedAt = generatedAt;
kernel.counts.sourceReferences = Number(kernel.counts.sourceReferences || 0) - existingAccessoriesCount + products.length;
kernel.counts.canonicalRecords = Number(kernel.counts.canonicalRecords || 0) - existingAccessoriesCount + products.length;
kernel.counts.products = kernel.products.length;
kernel.counts.metadataReady = kernel.products.filter(({ metadataStatus }) => metadataStatus === "Metadata ready").length;
kernel.counts.imageReady = kernel.products.filter(({ image }) => Boolean(image)).length;
kernel.counts.listedOnShop = kernel.products.filter(({ listedOnShop }) => listedOnShop === true).length;

const accessoriesEdit = {
  brand: editBrand,
  slug: editSlug,
  route: editRoute,
  placementAfter: "Inner Planes",
  formLabel: "ritual / wellbeing / objects / minerals",
  suppliedCount: 36,
  uniqueCount: 36,
  duplicateProductIds: [],
  productIds,
};
radioEdits.catalogues = [
  ...radioEdits.catalogues.filter(({ slug }) => slug !== editSlug),
  accessoriesEdit,
];
radioEdits.generatedAt = generatedAt;
const accessoriesSourceReference = "a c c e s s o r i e s      h e a l t h.md supplied 2026-08-04";
if (!radioEdits.sourceReference.includes(accessoriesSourceReference)) {
  radioEdits.sourceReference = `${radioEdits.sourceReference}; ${accessoriesSourceReference}`;
}

assert.equal(kernel.products.length, 430, "The canonical Shop tensor must contain 430 products after this intake");
assert.equal(new Set(kernel.products.map(({ id }) => id)).size, kernel.products.length, "Canonical product IDs must remain unique");
assert.equal(new Set(kernel.products.map(({ canonicalUrl }) => canonicalUrl)).size, kernel.products.length, "Canonical product URLs must remain unique");
assert.equal(radioEdits.catalogues.length, 3, "The edit manifest must contain three editorial catalogues");
assert.equal(radioEdits.catalogues.at(-1).brand, editBrand, "Accessories | Health must follow Inner Planes");
assert.deepEqual(radioEdits.catalogues.at(-1).productIds, productIds, "Edit order must preserve the exact Notion intake order");

fs.writeFileSync(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);
fs.writeFileSync(editsPath, `${JSON.stringify(radioEdits, null, 2)}\n`);

console.log(`Added ${products.length} Accessories | Health products; Shop tensor now contains ${kernel.products.length} products.`);
