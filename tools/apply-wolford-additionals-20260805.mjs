import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kernelPath = path.join(root, "i  a m/shop-product-kernel-v1.json");
const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));

const retrievedAt = "2026-08-05";
const imageRoot = "a s s e t s/shop-mockup/product-catalogue/wolford";

const familyMetadata = {
  backSeam: {
    name: "INDIVIDUAL 10 BACK SEAM TIGHTS",
    productType: "Hosiery",
    description: "Trendy design, Soft knitted waistband\nThese sheer, matte tights captivate with a superbly even look and classic back seam that make legs look sensational.\n\n10 den / Almost invisible toe reinforcement / Soft knitted waistband with logo / Back seam",
    material: "82% polyamide, 18% elastane",
    priceValue: 100,
    forms: ["second skin", "movement"],
    shopTypes: ["ready-to-wear-all", "hosiery"],
  },
  fatal: {
    name: "FATAL 15 TIGHTS",
    productType: "Hosiery",
    description: "Sheer & mat\nSoft and superbly elasticated, these sheer multitasking tights are seamless under slim-fitting styles and durable without compromising on comfort.\n\n15 den / Seamless panty-part / Perfect as maternity wear / Reinforced toe for extra durability / Wide sewn-on waistband",
    material: "89% polyamide, 11% elastane",
    priceValue: 80,
    forms: ["second skin", "movement"],
    shopTypes: ["ready-to-wear-all", "hosiery"],
  },
  individual: {
    name: "INDIVIDUAL 10 TIGHTS",
    productType: "Hosiery",
    description: "Ultra-sheer, mat look\nComfortably soft with double entwined elastane for great fit and long-lasting flexibility.\n\n10 den / Almost invisible reinforced toe / Knitted waistband",
    material: "81% polyamide, 19% elastane",
    priceValue: 85,
    forms: ["second skin", "movement"],
    shopTypes: ["ready-to-wear-all", "hosiery"],
  },
  jamaika: {
    name: "JAMAIKA STRING BODY",
    productType: "Bodysuit",
    description: "Shiny Scoop Neck Bodysuit\nWolford's iconic, circular-knit Jamaika bodysuit features a shiny finish and a soft, cotton blend on the inside. The edges of the scoop neck and armholes are reinforced with hidden elastic tape.\n\nOpaque Natural style / Shiny finish with soft, cotton blend interior / Slim fit / Seamless / Sleeveless / Sophisticated neckline and armholes reinforced with hidden elastic tape / Sustainably dyed / Snap closure / Cotton gusset",
    material: "48% cotton, 46% polyamide, 6% elastane",
    priceValue: 415,
    forms: ["second skin"],
    shopTypes: ["ready-to-wear-all", "bodysuit"],
  },
};

const definitions = [
  ["JB-0466", "backSeam", "ecrue", "nude-neutral", "185631180", "individual-10-back-seam-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185631180.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw1d2a6efb/images/zoom/18563_1180_2.JPG?strip=false", 2, "jb-0466-individual-10-back-seam-tights-ecrue.webp", "3b27b9c9-9c56-8168-98fd-e45fda3e7f03"],
  ["JB-0467", "backSeam", "cranberry", "red", "185633234", "individual-10-back-seam-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185633234.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw02c3259f/images/zoom/18563_3234_5.jpg?strip=false", 5, "jb-0467-individual-10-back-seam-tights-cranberry.webp", "3b27b9c9-9c56-81d7-a6b0-e5a7007b305f"],
  ["JB-0468", "backSeam", "wild plum", "purple", "185633249", "individual-10-back-seam-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185633249.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw41146721/images/zoom/18563_3249_5.jpg?strip=false", 5, "jb-0468-individual-10-back-seam-tights-wild-plum.webp", "3b27b9c9-9c56-818b-8a26-fd0d81d942a2"],
  ["JB-0469", "backSeam", "black", "black", "185637005", "individual-10-back-seam-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185637005.html", "https://m.media-amazon.com/images/G/01/Shopbop/p/prod/products/wolfo/wolfo3000912867/wolfo3000912867_1693508066148_2-0._QL90_UX846_.jpg", 2, "jb-0469-individual-10-back-seam-tights-black.jpg", "3b27b9c9-9c56-81f6-88e8-e4a9e69fdb28"],
  ["JB-0470", "backSeam", "dark wood", "brown", "185634870", "individual-10-back-seam-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185634870.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw6844b003/images/zoom/18563_4870_5.jpg?strip=false", 5, "jb-0470-individual-10-back-seam-tights-dark-wood.webp", "3b27b9c9-9c56-8177-ae95-c1967c2a38e0"],
  ["JB-0471", "fatal", "black", "black", "180767005", "fatal-15-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/fatal-15-tights-180767005.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dwd6b8400c/images/zoom/18076_7005_4.jpg?strip=false", 4, "jb-0471-fatal-15-tights-black.jpg", "3b27b9c9-9c56-8106-bb07-e2aa96fd6cba"],
  ["JB-0472", "fatal", "gobi", "nude-neutral", "180764365", "fatal-15-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/fatal-15-tights-180764365.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw423008c3/images/zoom/18076_4365_4.jpg?strip=false", 4, "jb-0472-fatal-15-tights-gobi.webp", "3b27b9c9-9c56-8133-83e6-feaa3037151c"],
  ["JB-0473", "individual", "caramel", "nude-neutral", "183824004", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824004.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw5c9c5a09/images/zoom/18382_4004_4.jpg?strip=false", 4, "jb-0473-individual-10-tights-caramel.webp", "3b27b9c9-9c56-818b-ba74-f0765d8595f2"],
  ["JB-0474", "individual", "honey", "nude-neutral", "183824060", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824060.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dwcc38e1b6/images/zoom/18382_4060_4.jpg?strip=false", 4, "jb-0474-individual-10-tights-honey.webp", "3b27b9c9-9c56-81ab-a8c3-d8d554d86eaf"],
  ["JB-0475", "individual", "cosmetic", "nude-neutral", "183824273", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824273.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw330a2808/images/zoom/18382_4273_4.jpg?strip=false", 4, "jb-0475-individual-10-tights-cosmetic.webp", "3b27b9c9-9c56-8170-8208-d7e5f58d3c5c"],
  ["JB-0476", "individual", "gobi", "nude-neutral", "183824365", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824365.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw530bc6a6/images/zoom/18382_4365_4.jpg?strip=false", 4, "jb-0476-individual-10-tights-gobi.webp", "3b27b9c9-9c56-8117-810c-d8191811410b"],
  ["JB-0477", "individual", "fairly light", "nude-neutral", "183824738", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824738.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw364c860f/images/zoom/18382_4738_4.jpg?strip=false", 4, "jb-0477-individual-10-tights-fairly-light.webp", "3b27b9c9-9c56-8185-879a-e1485a170d79"],
  ["JB-0478", "individual", "admiral", "blue", "183825280", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183825280.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw4ad627c7/images/zoom/18382_5280_6.jpg?strip=false", 6, "jb-0478-individual-10-tights-admiral.webp", "3b27b9c9-9c56-8199-9cf1-ef7a05039457"],
  ["JB-0479", "individual", "black", "black", "183827005", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183827005.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dwf5fca39b/images/zoom/18382_7005_4.jpg?strip=false", 4, "jb-0479-individual-10-tights-black.webp", "3b27b9c9-9c56-8171-a96a-f4a55d22203a"],
  ["JB-0480", "individual", "nearly black", "black", "183827212", "individual-10-tights", "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183827212.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dwdfc07214/images/zoom/18382_7212_4.jpg?strip=false", 4, "jb-0480-individual-10-tights-nearly-black.webp", "3b27b9c9-9c56-819f-b0b0-f98e685614fa"],
  ["JB-0481", "jamaika", "white", "white", "750861001", "jamaika-string-body", "https://www.wolford.com/en-au/bodywear/jamaika-string-body-750861001.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw5be9745c/images/zoom/75086_1001_0.jpg?strip=false", 0, "jb-0481-jamaika-string-body-white.jpg", "3b27b9c9-9c56-8103-bdc7-e20c234f519d"],
  ["JB-0482", "jamaika", "cafè au lait", "nude-neutral", "750864816", "jamaika-string-body", "https://www.wolford.com/en-au/bodywear/jamaika-string-body-750864816.html", "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw2aeacf10/images/zoom/75086_4816_0.jpg?strip=false", 0, "jb-0482-jamaika-string-body-cafe-au-lait.webp", "3b27b9c9-9c56-8116-8f32-e0043862bb42"],
];

const makeProduct = (definition) => {
  const [id, familyKey, color, colourFamily, sku, slugBase, retailerUrl, sourceImageUrl, sourceImageIndex, imageFile, notionPageId] = definition;
  const family = familyMetadata[familyKey];
  const alternateImagePageUrl = id === "JB-0469"
    ? "https://www.shopbop.com/individual-back-seam-tights-wolford/vp/v=1/1599447435.htm"
    : retailerUrl;
  return {
    id,
    brand: "Wolford",
    sourceTitle: `${family.name} in ${color} | Wolford®`,
    name: family.name,
    productType: family.productType,
    forms: family.forms,
    retailer: "Wolford",
    retailerUrl,
    canonicalUrl: retailerUrl,
    url: retailerUrl,
    sourceOccurrences: 1,
    metadataStatus: "Metadata ready",
    listedOnShop: true,
    shopRoute: "#catalogue/wolford",
    slug: `${slugBase}-${sku}`,
    color,
    description: family.description,
    material: family.material,
    image: `${imageRoot}/${imageFile}`,
    imageAlt: `${family.name} in ${color} by Wolford, exact-colour retailer image featuring a face-visible human model`,
    imageSource: id === "JB-0469" ? "alternate_retailer_face_visible_selected" : "retailer_gallery_face_visible_selected",
    sourcePageUrl: retailerUrl,
    sourceImagePageUrl: alternateImagePageUrl,
    sourceImageUrl,
    sourceImageIndex,
    retrievedAt,
    sourceWidth: id === "JB-0469" ? 846 : 1440,
    sourceHeight: id === "JB-0469" ? 1500 : 1920,
    price: `AU$ ${family.priceValue}`,
    priceValue: family.priceValue,
    currency: "AUD",
    subjectPresent: true,
    forwardFacing: true,
    notionPageId,
    requiresReview: false,
    reviewNotes: "",
    colourFamilies: [colourFamily],
    colourEvidenceStatus: "Verified",
    colourEvidenceText: color,
    colourSourceUrl: retailerUrl,
    colourSourceType: "Retailer page",
    colourCheckedAt: retrievedAt,
    colourTaxonomyVersion: "jb-colour-taxonomy-v1",
    shopTypes: family.shopTypes,
  };
};

const newProducts = definitions.map(makeProduct);
const newIds = new Set(newProducts.map((product) => product.id));
kernel.products = kernel.products.filter((product) => !newIds.has(product.id));

const darkWoodJamaika = kernel.products.find((product) => product.id === "JB-0072");
if (!darkWoodJamaika) throw new Error("Missing existing Wolford record JB-0072");
Object.assign(darkWoodJamaika, {
  productType: "Bodysuit",
  retailer: "Wolford",
  url: darkWoodJamaika.retailerUrl,
  color: "dark wood",
  material: familyMetadata.jamaika.material,
  sourceImageUrl: "https://www.wolford.com/dw/image/v2/BGDG_PRD/on/demandware.static/-/Sites-56/default/dw2b9d8214/images/zoom/75086_4870_0.jpg?strip=false",
  sourceImagePageUrl: darkWoodJamaika.retailerUrl,
  sourceImageIndex: 0,
  imageAlt: "JAMAIKA STRING BODY in dark wood by Wolford, exact-colour retailer image featuring a face-visible human model",
  imageSource: "retailer_gallery_face_visible_selected",
  retrievedAt,
  notionPageId: "3aa7b9c9-9c56-810a-954e-ec216084f150",
  requiresReview: false,
  reviewNotes: "",
  colourFamilies: ["brown"],
  colourEvidenceStatus: "Verified",
  colourEvidenceText: "dark wood",
  colourSourceUrl: darkWoodJamaika.retailerUrl,
  colourSourceType: "Retailer page",
  colourCheckedAt: retrievedAt,
  colourTaxonomyVersion: "jb-colour-taxonomy-v1",
});

kernel.products.push(...newProducts);
kernel.generatedAt = retrievedAt;
kernel.counts = {
  ...kernel.counts,
  sourceReferences: kernel.products.length + kernel.counts.brandOrCollectionLinks + kernel.counts.duplicateProductReferences,
  canonicalRecords: kernel.products.length + kernel.counts.brandOrCollectionLinks,
  products: kernel.products.length,
  metadataReady: kernel.products.filter((product) => product.metadataStatus === "Metadata ready").length,
  imageReady: kernel.products.filter((product) => product.image).length,
  listedOnShop: kernel.products.filter((product) => product.listedOnShop).length,
};

const wolfordCount = kernel.products.filter((product) => product.brand === "Wolford").length;
const wolfordReady = kernel.products.filter((product) => product.brand === "Wolford" && product.metadataStatus === "Metadata ready").length;
const wolfordBrandCount = kernel.brandCounts.find((entry) => entry.brand === "Wolford");
if (!wolfordBrandCount) throw new Error("Missing Wolford brand count");
wolfordBrandCount.count = wolfordCount;
wolfordBrandCount.ready = wolfordReady;

fs.writeFileSync(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);

console.log(`Wolford catalogue synchronized: ${wolfordCount} products (${newProducts.length} new + JB-0072 refreshed)`);
