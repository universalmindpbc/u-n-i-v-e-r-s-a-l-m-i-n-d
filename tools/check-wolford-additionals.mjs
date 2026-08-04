import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const kernelText = read("i  a m/shop-product-kernel-v1.json");
const kernel = JSON.parse(kernelText);
const champagne = JSON.parse(read("i  a m/shop-champagne-bohemia-products-v1.json"));
const shop = read("i  a m/shop.html");
const shopScript = read("i  a m/shop.js");

const expectedVariants = [
  ["JB-0466", "INDIVIDUAL 10 BACK SEAM TIGHTS", "ecrue", 100, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185631180.html"],
  ["JB-0467", "INDIVIDUAL 10 BACK SEAM TIGHTS", "cranberry", 100, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185633234.html"],
  ["JB-0468", "INDIVIDUAL 10 BACK SEAM TIGHTS", "wild plum", 100, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185633249.html"],
  ["JB-0469", "INDIVIDUAL 10 BACK SEAM TIGHTS", "black", 100, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185637005.html"],
  ["JB-0470", "INDIVIDUAL 10 BACK SEAM TIGHTS", "dark wood", 100, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-back-seam-tights-185634870.html"],
  ["JB-0471", "FATAL 15 TIGHTS", "black", 80, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/fatal-15-tights-180767005.html"],
  ["JB-0472", "FATAL 15 TIGHTS", "gobi", 80, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/fatal-15-tights-180764365.html"],
  ["JB-0473", "INDIVIDUAL 10 TIGHTS", "caramel", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824004.html"],
  ["JB-0474", "INDIVIDUAL 10 TIGHTS", "honey", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824060.html"],
  ["JB-0475", "INDIVIDUAL 10 TIGHTS", "cosmetic", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824273.html"],
  ["JB-0476", "INDIVIDUAL 10 TIGHTS", "gobi", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824365.html"],
  ["JB-0477", "INDIVIDUAL 10 TIGHTS", "fairly light", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183824738.html"],
  ["JB-0478", "INDIVIDUAL 10 TIGHTS", "admiral", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183825280.html"],
  ["JB-0479", "INDIVIDUAL 10 TIGHTS", "black", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183827005.html"],
  ["JB-0480", "INDIVIDUAL 10 TIGHTS", "nearly black", 85, "https://www.wolford.com/en-au/tights-and-hosiery/shop-by-category/tights/individual-10-tights-183827212.html"],
  ["JB-0072", "JAMAIKA STRING BODY", "dark wood", 415, "https://www.wolford.com/en-au/bodywear/jamaika-string-body-750864870.html"],
  ["JB-0481", "JAMAIKA STRING BODY", "white", 415, "https://www.wolford.com/en-au/bodywear/jamaika-string-body-750861001.html"],
  ["JB-0482", "JAMAIKA STRING BODY", "cafè au lait", 415, "https://www.wolford.com/en-au/bodywear/jamaika-string-body-750864816.html"],
];

const requestedIds = expectedVariants.map(([id]) => id);
const requestedProducts = requestedIds.map((id) => kernel.products.find((product) => product.id === id));
assert.ok(requestedProducts.every(Boolean), "All eighteen requested Wolford variants must exist in the tensor");
assert.deepEqual(new Set(requestedProducts.map((product) => product.canonicalUrl)), new Set(expectedVariants.map(([, , , , url]) => url)), "Tensor URLs must match Ben's eighteen supplied Wolford URLs exactly");
assert.equal(kernel.products.filter((product) => product.brand === "Wolford").length, 22, "Wolford must contain twenty-two total products");
assert.equal(kernel.brandCounts.find((entry) => entry.brand === "Wolford")?.count, 22, "Wolford brand ledger count must be current");
assert.equal(kernel.products.length, 447, "The primary product tensor must contain 447 products");
assert.equal(new Set([...kernel.products, ...champagne.products].map((product) => product.canonicalUrl)).size, 476, "The complete Shop tensor must contain 476 unique products");

const expectedPrices = new Map([
  ["INDIVIDUAL 10 BACK SEAM TIGHTS", 100],
  ["FATAL 15 TIGHTS", 80],
  ["INDIVIDUAL 10 TIGHTS", 85],
  ["JAMAIKA STRING BODY", 415],
]);
const expectedDescriptions = new Map([
  ["INDIVIDUAL 10 BACK SEAM TIGHTS", "Trendy design, Soft knitted waistband\nThese sheer, matte tights captivate with a superbly even look and classic back seam that make legs look sensational.\n\n10 den / Almost invisible toe reinforcement / Soft knitted waistband with logo / Back seam"],
  ["FATAL 15 TIGHTS", "Sheer & mat\nSoft and superbly elasticated, these sheer multitasking tights are seamless under slim-fitting styles and durable without compromising on comfort.\n\n15 den / Seamless panty-part / Perfect as maternity wear / Reinforced toe for extra durability / Wide sewn-on waistband"],
  ["INDIVIDUAL 10 TIGHTS", "Ultra-sheer, mat look\nComfortably soft with double entwined elastane for great fit and long-lasting flexibility.\n\n10 den / Almost invisible reinforced toe / Knitted waistband"],
  ["JAMAIKA STRING BODY", "Shiny Scoop Neck Bodysuit\nWolford's iconic, circular-knit Jamaika bodysuit features a shiny finish and a soft, cotton blend on the inside. The edges of the scoop neck and armholes are reinforced with hidden elastic tape.\n\nOpaque Natural style / Shiny finish with soft, cotton blend interior / Slim fit / Seamless / Sleeveless / Sophisticated neckline and armholes reinforced with hidden elastic tape / Sustainably dyed / Snap closure / Cotton gusset"],
]);
const expectedById = new Map(expectedVariants.map((variant) => [variant[0], variant]));
for (const product of requestedProducts) {
  const [, expectedName, expectedColor, expectedPrice, expectedUrl] = expectedById.get(product.id);
  assert.equal(product.name, expectedName, `${product.id} must retain its exact product name`);
  assert.equal(product.color, expectedColor, `${product.id} must retain its exact colour name`);
  assert.equal(product.canonicalUrl, expectedUrl, `${product.id} must retain its supplied retailer URL`);
  assert.equal(product.currency, "AUD", `${product.id} must retain AUD currency`);
  assert.equal(product.priceValue, expectedPrice, `${product.id} must retain its exact Australian price`);
  assert.equal(product.priceValue, expectedPrices.get(product.name), `${product.id} family price must remain internally consistent`);
  assert.equal(product.price, `AU$ ${product.priceValue}`, `${product.id} must retain its exact display price`);
  assert.equal(product.description, expectedDescriptions.get(product.name), `${product.id} must retain the exact official description`);
  assert.ok(product.material?.trim(), `${product.id} must retain the official material composition`);
  assert.equal(product.subjectPresent, true, `${product.id} must use a human product shot`);
  assert.equal(product.forwardFacing, true, `${product.id} must use a forward-facing product shot`);
  assert.match(product.imageAlt, /face-visible human model/, `${product.id} image alt must record the visible-face selection`);
  assert.match(product.imageSource, /face_visible_selected$/, `${product.id} must record face-visible image provenance`);
  assert.ok(product.notionPageId, `${product.id} must retain its Notion record ID`);
  assert.match(product.sourceImageUrl, product.id === "JB-0469" ? /^https:\/\/m\.media-amazon\.com\// : /^https:\/\/www\.wolford\.com\//, `${product.id} must retain its verified retailer image provenance`);
  assert.equal(product.sourceWidth, product.id === "JB-0469" ? 846 : 1440, `${product.id} must retain source width`);
  assert.equal(product.sourceHeight, product.id === "JB-0469" ? 1500 : 1920, `${product.id} must retain source height`);
  const imagePath = path.join(iam, product.image);
  assert.ok(fs.existsSync(imagePath), `${product.id} local image must exist`);
  assert.ok(fs.statSync(imagePath).size > 30_000, `${product.id} local image must not be a thumbnail`);
  const signature = fs.readFileSync(imagePath).subarray(0, 12);
  const isJpeg = signature[0] === 0xff && signature[1] === 0xd8;
  const isWebp = signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP";
  assert.ok((imagePath.endsWith(".jpg") && isJpeg) || (imagePath.endsWith(".webp") && isWebp), `${product.id} local image extension must match its bytes`);
}
assert.equal(new Set(requestedProducts.map((product) => product.image)).size, 18, "Every requested variant must have its own lead image path");
assert.equal(new Set(requestedProducts.map((product) => product.sourceImageUrl)).size, 18, "Every requested variant must have its own source image provenance");

assert.match(shop, /<b>476<\/b>/, "Shop must display the current total product count");
assert.match(shop, /href="#catalogue\/wolford">Wolford<\/a><\/span><b>22<\/b>/, "Shop must display the current Wolford count");
const kernelToken = createHash("sha256").update(kernelText).digest("hex").slice(0, 12);
assert.ok(shopScript.includes(`shop-product-kernel-v1.json?v=${kernelToken}`), "Shop runtime must fetch the tensor with its content-derived cache token");
const shopScriptToken = createHash("sha256").update(shopScript).digest("hex").slice(0, 12);
assert.ok(shop.includes(`shop.js?v=shop-${shopScriptToken}`), "Shop HTML must load the runtime with its content-derived cache token");

console.log("Wolford additional QA passed: 18 requested variants, 17 new assets, 22 Wolford products, 476 Shop products.");
