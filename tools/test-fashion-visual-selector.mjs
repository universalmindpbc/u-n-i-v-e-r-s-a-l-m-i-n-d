import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const cataloguePath = path.join(root, "i  a m", "fashion-visual-tensor-notion-export-v1.0.json");
const selectorPath = path.join(root, "i  a m", "fashion-visual-selector-v1.js");
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const require = createRequire(import.meta.url);
const selector = require(selectorPath);

function expectTop(label, options, assetKey) {
  const result = selector.rank(catalogue.records, options);
  assert.equal(result.recommendations[0]?.asset_key, assetKey, `${label}: expected ${assetKey}, got ${result.recommendations[0]?.asset_key}`);
}

expectTop("restoration", {
  citizenNeeds: { Anxiety: 0.9, Stress: 0.8, Hypervigilance: 0.7, Recovery: 0.9 }
}, "jacquemus-le-coup-de-soleil");

expectTop("ceremonial awe", {
  supportGoals: { Awe: 1, "Self-Transcendence": 0.9, Gratitude: 0.8, Curiosity: 0.7 }
}, "dolce-gabbana-valley-of-the-temples");

expectTop("creative joy", {
  supportGoals: { Joy: 1, Curiosity: 0.9, Motivation: 0.8, "Self-Actualisation": 0.8 }
}, "annies-ibiza-runway");

expectTop("composed clarity", {
  supportGoals: { Clarity: 1, Attention: 0.85, "Executive Function": 0.7, Calm: 0.45 }
}, "chanel-paris-rooftops");

expectTop("kinetic agency", {
  supportGoals: { Arousal: 1, Motivation: 0.95, "Self-Actualisation": 0.95, Attention: 0.9 },
  tasteAffinities: { "mugler-fall-winter-2021": 0.4 }
}, "mugler-fall-winter-2021");

expectTop("anger into agency", {
  citizenNeeds: { Anger: 1 },
  supportGoals: { "Self-Actualisation": 0.9, Motivation: 0.75 }
}, "mugler-fall-winter-2021");

expectTop("explicit sensual fashion visual", {
  explicitAssetRequest: "wolford-sergio-rossi-capsule",
  supportGoals: { "Self-Actualisation": 0.8, Arousal: 0.7 }
}, "wolford-sergio-rossi-capsule");

const eligibility = selector.rank(catalogue.records, { supportGoals: { Arousal: 1 } });
assert.equal(eligibility.ranked.length, 6);
assert.ok(eligibility.ranked.some((record) => record.asset_key === "mugler-fall-winter-2021"));
assert.ok(eligibility.ranked.some((record) => record.asset_key === "wolford-sergio-rossi-capsule"));
assert.equal(selector.feedbackWeight({ type: "hover" }), 0);
assert.equal(selector.feedbackWeight({ type: "explicit_select" }), 1);
assert.equal(selector.feedbackWeight({ type: "quick_switch" }), -0.2);

console.log(`Fashion selector verified: ${catalogue.records.length} records, 7 ranking scenarios, universal eligibility and feedback weights.`);
