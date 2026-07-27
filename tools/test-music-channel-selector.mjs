import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

globalThis.window = globalThis;
await import("../i  a m/music-channel-selector-v1.js");

const selector = globalThis.IAMMusicChannelSelector;
assert.equal(selector.version, "music_channel_selector_v1.0");
assert.equal(selector.chooseContinuationMode({ atWork: true, seed: "work" }).mode, "radio");
assert.equal(selector.chooseContinuationMode({ inGroup: true, seed: "group" }).mode, "parties");
assert.equal(selector.chooseContinuationMode({ citizenNeeds: { Stress: 1, Anxiety: .9 }, seed: "load" }).mode, "radio");
assert.equal(selector.feedbackWeight("explicit_select"), 1);
assert.equal(selector.feedbackWeight("quick_switch"), -.2);

const sample = [
  { id: "inner-planes", mode: "radio", need_scores: { Calm: .96 }, context: { work_fit: .9, group_fit: .3, high_load_fit: .9 }, editorial_priority: 1 },
  { id: "party", mode: "radio", need_scores: { Calm: .12 }, context: { work_fit: .2, group_fit: .9, high_load_fit: .1 }, editorial_priority: 1 },
];
const ranked = selector.rank(sample, { mode: "radio", atWork: true, citizenNeeds: { Calm: 1 }, seed: "rank", limit: 2 });
assert.equal(ranked.ranked[0].id, "inner-planes");
const safetyCushionPending = { id: "safety", editorial_id: "safety-cushion", catalogue_status: "pending_ready_assets" };
assert.equal(selector.rank([safetyCushionPending], { mode: "videos" }).recommendations.length, 0);
const safetyCushionReady = { ...safetyCushionPending, catalogue_status: "ready" };
assert.equal(selector.rank([safetyCushionReady], { mode: "videos" }).recommendations.length, 1);
assert.equal(selector.rank([safetyCushionReady], { mode: "radio" }).recommendations.length, 0);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const radioTensor = JSON.parse(fs.readFileSync(path.join(root, "i  a m", "radio-station-tensor-notion-export-v1.0.json"), "utf8"));
const ntsStations = radioTensor.records.filter((record) => record.provider === "NTS");
const leadingNtsStation = (citizenNeeds, options = {}) => selector.rank(ntsStations, {
  mode: "radio",
  citizenNeeds,
  seed: options.seed,
  atWork: options.atWork,
  inGroup: options.inGroup,
  tasteAffinities: options.tasteAffinities,
  limit: 4,
}).recommendations[0].id;

assert.equal(leadingNtsStation({ Calm: 1, Recovery: 1, Stress: 1, Anxiety: .95, "Mental Load": .9 }, { atWork: true, seed: "slow" }), "nts-slow-focus");
assert.equal(leadingNtsStation({ Joy: 1, Gratitude: .95, Connection: .95, Belonging: .9 }, { inGroup: true, seed: "pool" }), "nts-poolside");
assert.equal(leadingNtsStation({ Curiosity: 1, Awe: .95, "Self-Actualisation": .9, Joy: .8 }, { seed: "otaku" }), "nts-otaku");
assert.equal(leadingNtsStation({ Attention: 1, Belonging: .95, Connection: .9, Calm: .85 }, {
  atWork: true,
  seed: "low",
  tasteAffinities: { "nts-low-key": 1, "nts-slow-focus": .3, "nts-poolside": .3, "nts-otaku": .3 },
}), "nts-low-key");

let parties = 0;
const iterations = 1000;
for (let index = 0; index < iterations; index += 1) {
  if (selector.chooseContinuationMode({ seed: `distribution-${index}` }).mode === "parties") parties += 1;
}
const partyShare = parties / iterations;
assert.ok(partyShare >= .65 && partyShare <= .75, `expected a 70/30 prior; observed ${partyShare}`);

console.log(`Music channel selector passed; deterministic party share ${partyShare.toFixed(3)}.`);
