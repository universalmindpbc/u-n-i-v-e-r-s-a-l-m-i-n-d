import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const iam = path.join(root, "i  a m");
const checkedAt = "2026-07-31";
const taxonomyVersion = "jb-look-taxonomy-v1";
const evidenceText = "Ben supplied: Eden, Providence, Indiscrète, Idole, Singulière, Diva, Promesse and Bambin have a transparent look.";
const targetIds = new Set([
  "JB-0001", "JB-0002", "JB-0003", "JB-0004", "JB-0005", "JB-0006", "JB-0009", "JB-0011", "JB-0012", "JB-0014",
  "JB-0015", "JB-0016", "JB-0017", "JB-0018", "JB-0019", "JB-0020", "JB-0022", "JB-0026", "JB-0027", "JB-0028",
]);

function writeJson(filename, value, compactShopTypes = false) {
  let serialized = JSON.stringify(value, null, 2);
  if (compactShopTypes) {
    serialized = serialized.replace(/"shopTypes": \[\n((?:\s{8}"[^"]+"(?:,)?\n)+)\s{6}\]/g, (_match, lines) => {
      const values = [...lines.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      return `"shopTypes": ${JSON.stringify(values)}`;
    });
  }
  fs.writeFileSync(path.join(iam, filename), `${serialized}\n`);
}

function applyLookEvidence(product) {
  Object.assign(product, {
    lookProperties: ["transparent"],
    lookEvidenceStatus: "Verified",
    lookEvidenceText: evidenceText,
    lookSourceType: "Ben supplied",
    lookCheckedAt: checkedAt,
    lookTaxonomyVersion: taxonomyVersion,
  });
}

const kernel = JSON.parse(fs.readFileSync(path.join(iam, "shop-product-kernel-v1.json"), "utf8"));
const catalogue = JSON.parse(fs.readFileSync(path.join(iam, "shop-catalogue-v1.json"), "utf8"));
const kernelTargets = kernel.products.filter((product) => targetIds.has(product.id));
assert.equal(kernelTargets.length, 20, "The runtime kernel must contain the 20 approved ERES variants");
assert.ok(kernelTargets.every((product) => product.brand === "ERES" && / in Tulle\b/.test(product.sourceTitle)), "Every approved runtime record must retain exact ERES tulle evidence");
const targetUrls = new Set(kernelTargets.map((product) => product.retailerUrl));
const catalogueTargets = catalogue.products.filter((product) => targetUrls.has(product.retailerUrl));
assert.equal(catalogueTargets.length, 20, "The ERES audit catalogue must reconcile the same 20 approved URLs");

for (const product of [...kernelTargets, ...catalogueTargets]) applyLookEvidence(product);

kernel.lookTaxonomy = {
  version: taxonomyVersion,
  authority: "Look Properties in James Bondage Fashion Tensor Kernel [ shop ] in Notion",
  mappingPolicy: "retailer_notion_or_ben_supplied_evidence_only",
  imageInference: false,
  publicColourFilter: false,
  searchTerms: ["transparent", "translucent", "sheer", "see through"],
  projectionFields: {
    lookProperties: "approved controlled values used by keyword search",
    lookEvidenceStatus: "Verified, Unknown or Needs review",
    lookEvidenceText: "exact retailer, Notion or Ben-supplied evidence",
    lookSourceType: "Retailer page, Notion registry, Ben supplied or Legacy kernel",
    lookCheckedAt: "last human or deterministic evidence check",
    lookTaxonomyVersion: "controlled vocabulary version",
  },
  projectionUpdatedAt: checkedAt,
  verifiedCatalogueProductCount: kernelTargets.length,
};
kernel.searchProjection.fields = [...new Set([...kernel.searchProjection.fields, "lookProperties"])];
kernel.searchProjection.transparencyEquivalence = ["transparent", "translucent", "sheer", "see through"];

const unexpectedKernel = kernel.products.filter((product) => product.lookProperties?.includes("transparent") && !targetIds.has(product.id));
const unexpectedCatalogue = catalogue.products.filter((product) => product.lookProperties?.includes("transparent") && !targetUrls.has(product.retailerUrl));
assert.deepEqual(unexpectedKernel, [], "No unapproved runtime record may gain the transparent look tag");
assert.deepEqual(unexpectedCatalogue, [], "No unapproved ERES audit record may gain the transparent look tag");

writeJson("shop-product-kernel-v1.json", kernel, true);
writeJson("shop-catalogue-v1.json", catalogue);

console.log(JSON.stringify({
  version: taxonomyVersion,
  runtimeProducts: kernelTargets.length,
  eresAuditProducts: catalogueTargets.length,
  source: "Ben supplied",
}, null, 2));
