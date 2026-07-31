import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const require = createRequire(import.meta.url);
const filter = require(path.join(iam, "shop-catalogue-filter-v1.js"));
const checkedAt = "2026-07-31";
const taxonomyVersion = "jb-colour-taxonomy-v1";

// Exact retailer-authored colour evidence for legacy records whose raw Colour
// field was blank. IDs without explicit textual evidence intentionally remain unknown.
const retailerEvidence = new Map(Object.entries({
  "JB-0038": ["Black", ["black"]],
  "JB-0040": ["Black", ["black"]],
  "JB-0042": ["Orange", ["orange"]],
  "JB-0043": ["Off-white", ["white"]],
  "JB-0045": ["Red", ["red"]],
  "JB-0046": ["White", ["white"]],
  "JB-0047": ["Black", ["black"]],
  "JB-0048": ["White", ["white"]],
  "JB-0049": ["Red", ["red"]],
  "JB-0050": ["White", ["white"]],
  "JB-0051": ["Red", ["red"]],
  "JB-0052": ["White", ["white"]],
  "JB-0053": ["Beige", ["nude-neutral"]],
  "JB-0054": ["Beige", ["nude-neutral"]],
  "JB-0055": ["Beige", ["nude-neutral"]],
  "JB-0056": ["Beige", ["nude-neutral"]],
  "JB-0057": ["Yellow", ["yellow"]],
  "JB-0059": ["Black", ["black"]],
  "JB-0060": ["Black", ["black"]],
  "JB-0061": ["Black", ["black"]],
  "JB-0062": ["Powder blue", ["blue"]],
  "JB-0063": ["Black", ["black"]],
  "JB-0064": ["White", ["white"]],
  "JB-0066": ["Black", ["black"]],
  "JB-0080": ["Ivory Lace", ["nude-neutral"]],
  "JB-0084": ["Aurous Gold", ["gold"]],
  "JB-0111": ["White", ["white"]],
  "JB-0112": ["Antique White", ["white"]],
  "JB-0113": ["Black", ["black"]],
  "JB-0114": ["Tidal Animal / Botanical Brown", ["brown", "multi-print"]],
  "JB-0115": ["Blue Tulip", ["blue"]],
  "JB-0116": ["Botanical Brown", ["brown"]],
  "JB-0117": ["Antique White", ["white"]],
  "JB-0118": ["Cradle Pink", ["pink"]],
  "JB-0119": ["Black", ["black"]],
  "JB-0120": ["Onyx", ["black"]],
  "JB-0121": ["Obsidian", ["black"]],
  "JB-0122": ["Onyx", ["black"]],
  "JB-0123": ["Onyx", ["black"]],
  "JB-0124": ["Onyx", ["black"]],
  "JB-0125": ["Cobalt", ["cobalt"]],
  "JB-0130": ["Black", ["black"]],
  "JB-0131": ["Multi", ["multi-print"]],
  "JB-0132": ["Black / Multi", ["black", "multi-print"]],
  "JB-0134": ["NSKM Obsidian", ["black"]],
  "JB-0135": ["NSKM Active Ivory", ["nude-neutral"]],
  "JB-0136": ["Black / White", ["black", "white"]],
  "JB-0138": ["White", ["white"]],
  "JB-0139": ["NSKM Obsidian", ["black"]],
  "JB-0140": ["Black / Black / Black", ["black"]],
  "JB-0141": ["NSKM Deep Royal", ["blue"]],
  "JB-0162": ["Light pink / multi color", ["pink", "multi-print"]],
  "JB-0163": ["Lavender / multi-color", ["purple", "multi-print"]],
  "JB-0164": ["Light pink / multi color", ["pink", "multi-print"]],
  "JB-0165": ["Light pink / multi color", ["pink", "multi-print"]],
  "JB-0199": ["Deep Blue", ["blue"]],
  "JB-0200": ["Deep Blue", ["blue"]],
  "JB-0201": ["Deep Blue", ["blue"]],
  "JB-0202": ["Coffee / Whisper White", ["brown", "white"]],
  "JB-0203": ["Dark Navy", ["blue"]],
  "JB-0204": ["Mahogany Shine", ["brown"]],
  "JB-0205": ["Dark Navy", ["blue"]],
  "JB-0206": ["Silver Shine", ["silver"]],
  "JB-0207": ["Marine Blue", ["blue"]],
  "JB-0208": ["Coffee", ["brown"]],
  "JB-0209": ["Cosmo Pink / Whisper White", ["pink", "white"]],
  "JB-0210": ["Iron Shine", ["grey"]],
  "JB-0211": ["Dark Navy", ["blue"]],
  "JB-0212": ["Black", ["black"]],
  "JB-0213": ["Black", ["black"]],
  "JB-0214": ["College Green", ["green"]],
  "JB-0215": ["Sapphire", ["blue"]],
  "JB-0217": ["Racing Green", ["green"]],
  "JB-0218": ["Cream", ["nude-neutral"]],
  "JB-0219": ["Cream", ["nude-neutral"]],
  "JB-0220": ["Leopard", ["multi-print"]],
  "JB-0221": ["Navy", ["blue"]],
  "JB-0222": ["Tie Dye", ["multi-print"]],
  "JB-0223": ["Navy", ["blue"]],
  "JB-0224": ["Oyster", ["nude-neutral"]],
  "JB-0225": ["Racing Green", ["green"]],
  "JB-0226": ["Olive", ["green"]],
  "JB-0227": ["Tie Dye", ["multi-print"]],
  "JB-0228": ["Leopard", ["multi-print"]],
  "JB-0229": ["Navy", ["blue"]],
  "JB-0230": ["Cocoa", ["brown"]],
  "JB-0231": ["Navy", ["blue"]],
  "JB-0232": ["Botanical print", ["multi-print"]],
  "JB-0233": ["Racquet print", ["multi-print"]],
  "JB-0234": ["Black", ["black"]],
  "JB-0235": ["Racing Green", ["green"]],
  "JB-0236": ["Stripe", ["multi-print"]],
  "JB-0237": ["Grey Marle", ["grey"]],
  "JB-0238": ["Leopard", ["multi-print"]],
  "JB-0239": ["White", ["white"]],
  "JB-0240": ["Multi", ["multi-print"]],
  "JB-0244": ["Black / neon yellow / orange / tiger print / neon pink", ["black", "yellow", "orange", "pink", "multi-print"]],
  "JB-0245": ["Tiger print / black / neon yellow", ["black", "yellow", "multi-print"]],
  "JB-0246": ["Royal blue / neon pink / black / neon green", ["blue", "pink", "black", "green", "multi-print"]],
  "JB-0247": ["Black", ["black"]],
  "JB-0248": ["Bronze metallic / black", ["brown", "gold", "black"]],
  "JB-0249": ["Bronze metallic / black", ["brown", "gold", "black"]],
  "JB-0250": ["Floral print", ["multi-print"]],
  "JB-0251": ["Matte Black / Shiny Black", ["black"]],
  "JB-0252": ["Fluorite crystal print", ["multi-print"]],
  "JB-0281": ["Red / white terry stripe", ["red", "white", "multi-print"]],
  "JB-0282": ["Multicoloured stripe", ["multi-print"]],
  "JB-0283": ["Pink", ["pink"]],
  "JB-0284": ["White / black piping", ["white", "black"]],
  "JB-0285": ["Blue / red binding", ["blue", "red"]],
  "JB-0286": ["Silver sparkle", ["silver"]],
  "JB-0287": ["Light blue / yellow polka dot", ["blue", "yellow", "multi-print"]],
  "JB-0311": ["Onyx", ["black"]],
  "JB-0314": ["Black / white piping", ["black", "white"]],
}));

function auditProduct(product) {
  const override = retailerEvidence.get(product.id);
  if (override) product.color = override[0];
  const families = override ? override[1] : filter.colourFamilies(product);
  if (!families.length) return false;
  Object.assign(product, {
    colourFamilies: families,
    colourEvidenceStatus: "Verified",
    colourEvidenceText: product.color,
    colourSourceUrl: product.retailerUrl,
    colourSourceType: override ? "Retailer page" : "Notion registry",
    colourCheckedAt: checkedAt,
    colourTaxonomyVersion: taxonomyVersion,
  });
  return true;
}

function writeJson(filename, value) {
  fs.writeFileSync(path.join(iam, filename), `${JSON.stringify(value, null, 2)}\n`);
}

const kernel = JSON.parse(fs.readFileSync(path.join(iam, "shop-product-kernel-v1.json"), "utf8"));
const champagne = JSON.parse(fs.readFileSync(path.join(iam, "shop-champagne-bohemia-products-v1.json"), "utf8"));
const eres = JSON.parse(fs.readFileSync(path.join(iam, "shop-catalogue-v1.json"), "utf8"));

const verifiedKernel = kernel.products.filter(auditProduct).length;
const verifiedChampagne = champagne.products.filter(auditProduct).length;
const verifiedEres = eres.products.filter(auditProduct).length;
kernel.colourTaxonomy.projectionUpdatedAt = checkedAt;
kernel.colourTaxonomy.projectionScope = "shop-product-kernel-v1.json + shop-champagne-bohemia-products-v1.json";
kernel.colourTaxonomy.verifiedCatalogueProductCount = verifiedKernel + verifiedChampagne;
kernel.colourTaxonomy.unknownCatalogueProductCount = kernel.products.length + champagne.products.length - kernel.colourTaxonomy.verifiedCatalogueProductCount;

writeJson("shop-product-kernel-v1.json", kernel);
writeJson("shop-champagne-bohemia-products-v1.json", champagne);
writeJson("shop-catalogue-v1.json", eres);

console.log(JSON.stringify({
  verifiedKernel,
  verifiedChampagne,
  verifiedCombined: verifiedKernel + verifiedChampagne,
  unknownCombined: kernel.colourTaxonomy.unknownCatalogueProductCount,
  verifiedEres,
}, null, 2));
