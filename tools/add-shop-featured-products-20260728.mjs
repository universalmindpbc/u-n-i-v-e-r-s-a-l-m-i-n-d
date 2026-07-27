import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kernelPath = path.join(root, "i  a m", "shop-product-kernel-v1.json");
const kernel = JSON.parse(await fs.readFile(kernelPath, "utf8"));

const additions = [
  {
    id: "JB-0310",
    brand: "Annie’s Ibiza",
    sourceTitle: "Theodora Gown – Annie's Ibiza Online",
    name: "Theodora Gown",
    productType: "Dress",
    forms: ["after dark"],
    retailerUrl: "https://anniesibiza.com/collections/annies-favourites-1/products/theodora-gown",
    canonicalUrl: "https://anniesibiza.com/collections/annies-favourites-1/products/theodora-gown",
    sourceOccurrences: 1,
    metadataStatus: "Inventory only",
    listedOnShop: false,
    shopRoute: "#catalogue/annies-ibiza",
  },
  {
    id: "JB-0311",
    brand: "SKIMS",
    sourceTitle: "Fits Everybody Lace Scoop Bralette | Onyx | SKIMS",
    name: "Fits Everybody Lace Scoop Bralette",
    productType: "Bra",
    forms: ["lingerie"],
    retailerUrl: "https://skims.com/en-au/products/fits-everybody-lace-scoop-bralette-onyx",
    canonicalUrl: "https://skims.com/en-au/products/fits-everybody-lace-scoop-bralette-onyx",
    sourceOccurrences: 1,
    metadataStatus: "Inventory only",
    listedOnShop: false,
    shopRoute: "#catalogue/skims",
  },
  {
    id: "JB-0312",
    brand: "Bordelle",
    sourceTitle: "Signature Harness Angela Dress Burnt Red – Bordelle Europe",
    name: "Signature Harness Angela Dress",
    productType: "Dress",
    forms: ["lingerie", "after dark"],
    retailerUrl: "https://eu.bordelle.co.uk/products/signature-harness-angela-dress-burnt-red?variant=43656631681196",
    canonicalUrl: "https://eu.bordelle.co.uk/products/signature-harness-angela-dress-burnt-red?variant=43656631681196",
    sourceOccurrences: 1,
    metadataStatus: "Inventory only",
    listedOnShop: false,
    shopRoute: "#catalogue/bordelle",
  },
  {
    id: "JB-0313",
    brand: "Emilio Cavallini",
    sourceTitle: "Bouganvillea Tights",
    name: "Bouganvillea Tights",
    productType: "Hosiery",
    forms: ["second skin", "after dark"],
    retailerUrl: "https://www.emiliocavallini.com/en/bouganvillea-tights.html",
    canonicalUrl: "https://www.emiliocavallini.com/en/bouganvillea-tights.html",
    sourceOccurrences: 1,
    metadataStatus: "Inventory only",
    listedOnShop: false,
    shopRoute: "#catalogue/emilio-cavallini",
  },
  {
    id: "JB-0314",
    brand: "Triangl",
    sourceTitle: "CELESTE JETT BLACK SHORT – Triangl",
    name: "Celeste Jett Black Short",
    productType: "Swim set",
    forms: ["swim", "movement"],
    retailerUrl: "https://triangl.com/en-au/products/celeste-jett-black-short?variant=42685752049760",
    canonicalUrl: "https://triangl.com/en-au/products/celeste-jett-black-short?variant=42685752049760",
    sourceOccurrences: 1,
    metadataStatus: "Inventory only",
    listedOnShop: true,
    shopRoute: "#catalogue/triangl",
    slug: "celeste-jett-black-short",
    image: "a s s e t s/shop-mockup/product-catalogue/triangl/jb-0314-celeste-jett-black-short.webp",
    imageAlt: "Model wearing the Triangl Celeste Jett Black Short swim set in sunlight",
    imageSource: "user_approved_product_image",
    sourcePageUrl: "https://triangl.com/en-au/products/celeste-jett-black-short?variant=42685752049760",
    sourceImageIndex: 0,
    retrievedAt: "2026-07-28",
  },
];

for (const addition of additions) {
  const duplicate = kernel.products.find((product) => product.canonicalUrl === addition.canonicalUrl);
  if (duplicate) {
    if (duplicate.id !== addition.id) throw new Error(`Canonical URL already belongs to ${duplicate.id}`);
    continue;
  }
  if (kernel.products.some((product) => product.id === addition.id)) throw new Error(`Product ID already exists: ${addition.id}`);
  kernel.products.push(addition);
}

kernel.brandOrder = [...new Set(kernel.products.map((product) => product.brand))]
  .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
kernel.brandCounts = kernel.brandOrder.map((brand) => {
  const products = kernel.products.filter((product) => product.brand === brand);
  return {
    brand,
    count: products.length,
    ready: products.filter((product) => product.metadataStatus === "Metadata ready").length,
    route: products[0]?.shopRoute || "#catalogue/all",
  };
});

kernel.generatedAt = "2026-07-28";
kernel.counts.sourceReferences = kernel.products.length + kernel.counts.brandOrCollectionLinks + kernel.counts.duplicateProductReferences;
kernel.counts.canonicalRecords = kernel.products.length + kernel.counts.brandOrCollectionLinks;
kernel.counts.products = kernel.products.length;
kernel.counts.brands = kernel.brandOrder.length;
kernel.counts.metadataReady = kernel.products.filter((product) => product.metadataStatus === "Metadata ready").length;
kernel.counts.imageReady = kernel.products.filter((product) => Boolean(product.image)).length;
kernel.counts.listedOnShop = kernel.products.filter((product) => Boolean(product.listedOnShop)).length;

await fs.writeFile(kernelPath, JSON.stringify(kernel, null, 2) + "\n");
console.log(`Fashion kernel now contains ${kernel.products.length} exact product URLs across ${kernel.brandOrder.length} brands.`);
