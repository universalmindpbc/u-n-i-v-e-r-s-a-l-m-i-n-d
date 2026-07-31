import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const require = createRequire(import.meta.url);
const filter = require(path.join(root, "i  a m/shop-catalogue-filter-v1.js"));
const kernel = JSON.parse(fs.readFileSync(path.join(root, "i  a m/shop-product-kernel-v1.json"), "utf8"));
const champagne = JSON.parse(fs.readFileSync(path.join(root, "i  a m/shop-champagne-bohemia-products-v1.json"), "utf8"));

assert.deepEqual(
  filter.COLOUR_OPTIONS.map(({ value }) => value),
  [
    "black", "white", "nude-neutral", "brown", "grey", "red", "orange", "yellow",
    "green", "blue", "cobalt", "purple", "pink", "silver", "gold", "multi-print",
  ],
  "The public colour vocabulary must stay short and controlled",
);
assert.ok(!filter.COLOUR_OPTIONS.some(({ value }) => value === "unknown"), "Unknown must remain internal");

const colourCases = [
  ["Noir", ["black"]],
  ["Ecru & Black", ["black", "nude-neutral"]],
  ["Dark Silver", ["silver"]],
  ["Metallic Gold", ["gold"]],
  ["Multi", ["multi-print"]],
  ["Seafoam Silkie", ["green"]],
  ["Citron vert ensoleillé", ["green"]],
  ["Lilac Bloom", ["purple"]],
  ["Pink Panther", ["pink"]],
  ["White & Black", ["black", "white"]],
  ["Cobalt", ["cobalt"]],
  ["Royal Blue", ["blue"]],
  ["Cream White / Multicolor", ["white", "nude-neutral", "multi-print"]],
  ["Make Up", []],
];
colourCases.forEach(([color, expected]) => {
  assert.deepEqual(
    [...filter.colourFamilies({ color })].sort(),
    [...expected].sort(),
    `${color} must map only from explicit colour evidence`,
  );
});
assert.ok(!filter.colourFamilies({ color: "Cobalt" }).includes("blue"), "Cobalt must remain distinct from blue");

const fixture = filter.prepareProduct({
  brand: "ÉRES",
  name: "Providence Triangle Bra",
  description: "Soft-touch swim piece from the Studio collection.",
  color: "Cobalt",
  material: "recycled polyamide",
  collection: "Studio",
});
["eres", "providence", "soft touch", "cobalt", "polyamide", "studio"].forEach((query) => {
  assert.ok(filter.matchesSearch(fixture, query), `Search must match ${query}`);
});
assert.ok(filter.matchesSearch(fixture, "eres cobalt studio"), "Search tokens must use deterministic AND semantics");
assert.ok(!filter.matchesSearch(fixture, "eres silver"), "Every query token must match");
assert.equal(filter.matchesColour(fixture, "cobalt"), true);
assert.equal(filter.matchesColour(fixture, "blue"), false);

const runtimeProducts = kernel.products.map(filter.prepareProduct);
assert.equal(runtimeProducts.length, kernel.counts.products, "Every runtime product must remain searchable");
assert.ok(runtimeProducts.every((product) => typeof product._catalogueSearchText === "string"), "Search text must be prepared once per product");
const champagneProducts = champagne.products.map(filter.prepareProduct);
assert.equal(champagneProducts.length, 21, "The concurrent Champagne extension must retain all 21 products");
assert.ok(champagneProducts.every((product) => filter.colourFamilies(product).length > 0), "Every supplied Champagne raw colour must map without image inference");
assert.ok(filter.matchesSearch(champagneProducts[0], champagneProducts[0].brand), "Champagne products must search by their maker brand");
assert.ok(
  !filter.searchText({ brand: "SAME", catalogueBrand: "Champagne Bohemia", name: "Swimsuit" }).includes("champagne bohemia"),
  "Umbrella route metadata must not replace maker-brand search evidence",
);
const combinedProducts = [...runtimeProducts, ...champagneProducts];
assert.equal(combinedProducts.length, 384, "Search and colour QA must cover the complete reconciled catalogue");
assert.equal(combinedProducts.slice(0, 24).length, 24, "Initial catalogue rhythm must remain 24 products");
assert.deepEqual(
  kernel.colourTaxonomy.visibleOptions,
  filter.COLOUR_OPTIONS,
  "Kernel and browser colour vocabularies must agree",
);

console.log(`Shop catalogue search/colour QA passed for ${combinedProducts.length} products.`);
