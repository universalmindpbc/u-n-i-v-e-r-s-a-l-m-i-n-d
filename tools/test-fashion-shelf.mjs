import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "i  a m", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "i  a m", "adaptive-environment-television.css"), "utf8");
const controller = fs.readFileSync(path.join(root, "i  a m", "adaptive-environment-television.js"), "utf8");
const tensor = JSON.parse(fs.readFileSync(path.join(root, "i  a m", "fashion-visual-tensor-notion-export-v1.0.json"), "utf8"));

const assetKeys = [
  "chanel-paris-rooftops",
  "jacquemus-le-coup-de-soleil",
  "annies-ibiza-runway",
  "dolce-gabbana-valley-of-the-temples",
  "mugler-fall-winter-2021",
  "wolford-sergio-rossi-capsule",
];

assert.equal(tensor.records.length, 6);
assert.deepEqual(new Set(tensor.records.map((record) => record.asset_key)), new Set(assetKeys));
assetKeys.forEach((assetKey) => assert.match(controller, new RegExp(`assetKey: "${assetKey}"`)));

assert.match(html, /data-fashion-shelf/);
assert.match(html, />Recommended for you</);
assert.match(html, />Based on your current needs</);
assert.match(html, /data-fashion-shelf-toggle/);
assert.match(html, /data-fashion-runway-count[^>]*>1 \/ 6</);
assert.ok(
  html.indexOf("fashion-visual-selector-v1.js") < html.indexOf("adaptive-environment-television.js"),
  "Fashion ranking policy must load before the television controller",
);

assert.match(css, /adaptive-television-fashion-shelf__item[\s\S]*?flex:\s*0 0 calc\(\(100% - 44px\) \/ 3\)/);
assert.match(css, /@media \(max-width: 720px\)[\s\S]*?adaptive-television-fashion-shelf__item[\s\S]*?flex-basis:\s*min\(78vw, 350px\)/);
assert.match(controller, /fashionCardsPerView\(\)[\s\S]*?return window\.matchMedia\("\(max-width: 720px\)"\)\.matches \? 1 : 3/);
assert.equal(tensor.recommendation_policy.hover_is_training_signal, false);
assert.match(controller, /feedbackWeight\?\.\(\{ type: "dwell_30_seconds" \}\)/);
assert.match(controller, /setFashionRunway\(index, \{ source: "manual", feedbackType: "explicit_select" \}\)/);
assert.match(controller, /fashionRunwayIndex \+ 1/);
assert.match(controller, /setFashionRunway\(fashionRunwayIndex - 1, \{ source: "manual", feedbackType: "explicit_select" \}\)/);
assert.match(controller, /setFashionRunway\(fashionRunwayIndex \+ 1, \{ source: "manual", feedbackType: "explicit_select" \}\)/);
assert.match(controller, /function openFashionShelf\(\)[\s\S]*?fashionShelfOffset = 0/);
assert.match(controller, /playerMount\.dataset\.emdrGifFashionRunway = fashionRunways\[fashionRunwayIndex\]\?\.assetKey/);
assert.match(controller, /emdrUsesCurrentFashion: true/);

console.log("Fashion shelf verified: six runways, three-card desktop shelf, one-card mobile shelf, adaptive ranking, explicit feedback and shared EMDR visual state.");
