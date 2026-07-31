import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const kernelPaths = [
  path.join(root, "i  a m/shop-product-kernel-v1.json"),
  path.join(root, "i  a m/shop-champagne-bohemia-products-v1.json"),
];

export const SHOP_TAXONOMY_VERSION = "jb-shop-taxonomy-v1";
export const SHOP_TAXONOMY_OPTIONS = [
  { value: "lingerie-all", label: "lingerie (all)" },
  { value: "swimwear-all", label: "swimwear (all)" },
  { value: "athleisure-all", label: "athleisure (all)" },
  { value: "ready-to-wear-all", label: "ready to wear (all)" },
  { value: "haute-couture-all", label: "haute couture (all)" },
  { value: "bra", label: "bra" },
  { value: "brief", label: "brief" },
  { value: "bodysuit", label: "bodysuit" },
  { value: "hosiery", label: "hosiery" },
  { value: "robe", label: "robe" },
  { value: "after-dark", label: "after dark" },
  { value: "swimsuit", label: "swimsuit" },
  { value: "bikini", label: "bikini" },
  { value: "rash-vest", label: "rash vest" },
  { value: "coverup", label: "coverup" },
  { value: "jumpsuit", label: "jumpsuit" },
  { value: "dress", label: "dress" },
  { value: "shorts", label: "shorts" },
  { value: "pants", label: "pants" },
  { value: "leggings", label: "leggings" },
  { value: "crop", label: "crop" },
  { value: "accessories", label: "accessories" },
];

const taxonomyOrder = new Map(SHOP_TAXONOMY_OPTIONS.map((option, index) => [option.value, index]));

function normalise(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasAny(value, expressions) {
  return expressions.some((expression) => expression.test(value));
}

export function classifyShopProduct(product) {
  const types = new Set();
  const productType = normalise(product.productType);
  const forms = new Set((product.forms || []).map(normalise));
  const brand = normalise(product.brand);
  const nameText = normalise(product.name);
  const identityText = normalise([
    product.name,
    product.sourceTitle,
    product.canonicalUrl,
  ].filter(Boolean).join(" "));
  const descriptionText = normalise(product.description);
  const isSwim = forms.has("swim")
    || ["swimsuit", "bikini top", "bikini bottom", "swim set"].includes(productType)
    || hasAny(identityText, [/\bswim(?:suit|wear|mer)?\b/, /\bbikini\b/, /\bmaillot\b/, /\brash[ -]?(?:vest|guard)\b/]);
  const isReadyToWear = forms.has("second skin")
    || ["bodysuit", "dress", "jumpsuit", "legging", "shorts", "skirt", "top"].includes(productType)
    || hasAny(identityText, [/\bpants?\b/, /\bcrop(?:ped)?\b/, /\bcoat\b/, /\bjacket\b/, /\bonesie\b/]);

  const athleisureBrands = new Set([
    "lucas hugh",
    "nike",
    "adidas",
    "rashi world",
    "nagnata",
    "p.e nation",
    "the upside",
    "skims",
  ]);

  if (forms.has("lingerie")) types.add("lingerie-all");
  if (isSwim) types.add("swimwear-all");
  if (forms.has("movement") && athleisureBrands.has(brand)) types.add("athleisure-all");
  if (isReadyToWear) types.add("ready-to-wear-all");
  if (brand === "iris van herpen" || /\bhaute couture\b/.test(identityText)) types.add("haute-couture-all");

  if ((productType === "bra" && !/\b(?:hosiery|tights?|stockings?)\b/.test(identityText)) || /\b(?:bra|bralet|bralette|brassiere|bustier|corset)\b/.test(identityText)) types.add("bra");
  if (productType === "briefs" || /\b(?:briefs?|thong|tanga|knicker|panty|panties|shorties)\b/.test(identityText) || (productType === "other" && /\bshorties\b/.test(descriptionText))) types.add("brief");
  if (productType === "bodysuit" || /\b(?:bodysuit|bodyshort)\b/.test(identityText) || /\b(?:string|jacquard|sleeveless|engineered) body\b/.test(identityText)) types.add("bodysuit");
  if (productType === "hosiery" || /\b(?:hosiery|tights?|stockings?|socks?)\b/.test(identityText)) types.add("hosiery");
  if (productType === "robe" || /\brobe\b/.test(identityText)) types.add("robe");
  if (forms.has("after dark")) types.add("after-dark");
  if (productType === "swimsuit" || (isSwim && hasAny(identityText, [/\bone[ -]piece\b/, /\bswimmer suit\b/, /\bmaillot\b/]))) types.add("swimsuit");
  if (["bikini top", "bikini bottom", "swim set"].includes(productType) || /\bbikini\b/.test(identityText)) types.add("bikini");
  if (/\brash[ -]?(?:vest|guard)\b/.test(identityText)) types.add("rash-vest");
  if (isSwim && (productType === "dress" || hasAny(identityText, [/\bcover[ -]?up\b/, /\bkaftan\b/, /\bcaftan\b/, /\bsarong\b/]))) types.add("coverup");
  if (productType === "jumpsuit" || /\b(?:jumpsuit|onesie)\b/.test(identityText)) types.add("jumpsuit");
  if (productType === "dress" || /\b(?:dress|gown)\b/.test(identityText)) types.add("dress");
  const shortIsModifier = hasAny(nameText, [/\bshort robe\b/, /\bshort sleeve\b/, /\bshort dress\b/, /\bbodyshort\b/]);
  if ((productType === "shorts" && !shortIsModifier) || /\bshorts\b/.test(nameText) || /\bshort\b(?:\s*[-\[]|$)/.test(nameText)) types.add("shorts");
  if (/\bpants?\b/.test(identityText)) types.add("pants");
  if ((productType === "legging" && !/\bpants?\b/.test(identityText)) || /\bleggings?\b/.test(identityText)) types.add("leggings");
  if (/\bcrop(?:ped)?\b/.test(identityText)) types.add("crop");
  if (productType === "accessory" || hasAny(identityText, [/\b(?:accessor(?:y|ies)|veil|cape|harness|nipplets?|cap)\b/])) types.add("accessories");

  if (types.has("hosiery")) types.delete("leggings");

  if (!types.size) types.add("ready-to-wear-all");
  return [...types].sort((left, right) => taxonomyOrder.get(left) - taxonomyOrder.get(right));
}

const taxonomy = {
  version: SHOP_TAXONOMY_VERSION,
  authority: "Shop Taxonomy in James Bondage Fashion Tensor Kernel [ shop ] in Notion",
  orderPolicy: "editorial_fixed",
  matchingPolicy: "products_match_any_assigned_taxonomy_value",
  visibleOptions: SHOP_TAXONOMY_OPTIONS,
};

const checkOnly = process.argv.includes("--check");
const allProducts = [];

for (const kernelPath of kernelPaths) {
  const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));
  kernel.shopTaxonomy = taxonomy;
  for (const product of kernel.products || []) {
    const expected = classifyShopProduct(product);
    if (checkOnly) assert.deepEqual(product.shopTypes, expected, `${product.id} taxonomy is stale`);
    else product.shopTypes = expected;
    allProducts.push(product);
  }
  if (!checkOnly) {
    let serialized = JSON.stringify(kernel, null, 2);
    serialized = serialized.replace(/"shopTypes": \[\n((?:\s{8}"[^"]+"(?:,)?\n)+)\s{6}\]/g, (_match, lines) => {
      const values = [...lines.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      return `"shopTypes": ${JSON.stringify(values)}`;
    });
    if (path.basename(kernelPath) === "shop-champagne-bohemia-products-v1.json") {
      serialized = serialized.replace(/"(forms|categories)": \[\n((?:\s{8}"[^"]+"(?:,)?\n)+)\s{6}\]/g, (_match, property, lines) => {
        const values = [...lines.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
        return `"${property}": ${JSON.stringify(values)}`;
      });
    }
    fs.writeFileSync(kernelPath, `${serialized}\n`);
  }
}

assert.equal(allProducts.length, 384, "The combined Shop taxonomy must cover all 384 canonical products");
assert.equal(new Set(allProducts.map((product) => product.id)).size, 384, "Shop taxonomy product IDs must remain unique");
assert.ok(allProducts.every((product) => product.shopTypes?.length), "Every Shop product must have at least one taxonomy value");
assert.ok(allProducts.every((product) => product.shopTypes.every((value) => taxonomyOrder.has(value))), "Every Shop taxonomy value must be controlled");

const counts = Object.fromEntries(SHOP_TAXONOMY_OPTIONS.map(({ value }) => [
  value,
  allProducts.filter((product) => product.shopTypes.includes(value)).length,
]));
console.log(JSON.stringify({ version: SHOP_TAXONOMY_VERSION, products: allProducts.length, counts }, null, 2));
