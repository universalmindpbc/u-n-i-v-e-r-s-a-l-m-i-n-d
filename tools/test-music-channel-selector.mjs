import assert from "node:assert/strict";

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
  { id: "calm", mode: "radio", need_scores: { Calm: .96 }, context: { work_fit: .9, group_fit: .3, high_load_fit: .9 }, editorial_priority: 1 },
  { id: "party", mode: "radio", need_scores: { Calm: .12 }, context: { work_fit: .2, group_fit: .9, high_load_fit: .1 }, editorial_priority: 1 },
];
const ranked = selector.rank(sample, { mode: "radio", atWork: true, citizenNeeds: { Calm: 1 }, seed: "rank", limit: 2 });
assert.equal(ranked.ranked[0].id, "calm");

let parties = 0;
const iterations = 1000;
for (let index = 0; index < iterations; index += 1) {
  if (selector.chooseContinuationMode({ seed: `distribution-${index}` }).mode === "parties") parties += 1;
}
const partyShare = parties / iterations;
assert.ok(partyShare >= .65 && partyShare <= .75, `expected a 70/30 prior; observed ${partyShare}`);

console.log(`Music channel selector passed; deterministic party share ${partyShare.toFixed(3)}.`);
