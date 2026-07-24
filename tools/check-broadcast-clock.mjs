import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM_DIR = path.join(ROOT, "i  a m");
const schedule = JSON.parse(await fs.readFile(path.join(IAM_DIR, "broadcast-schedule-v1.json"), "utf8"));
const controller = await fs.readFile(path.join(IAM_DIR, "adaptive-environment-television.js"), "utf8");
const clockController = await fs.readFile(path.join(IAM_DIR, "broadcast-clock-v1.js"), "utf8");
const index = await fs.readFile(path.join(IAM_DIR, "index.html"), "utf8");
const endpoint = await fs.readFile(path.join(IAM_DIR, "api", "broadcast-clock.php"), "utf8");

const expectedChannels = new Map([
  ["restore", ["sasha-ibiza-boat-at-sunset-freqways", "ben-bohmer-cappadocia-cercle"]],
  ["social-uplift", ["peggy-gou-palais-des-beaux-arts-cercle", "miss-monique-biosphere-montreal-cercle"]],
  ["underground-intensity", ["nina-kraviz-eiffel-tower-cercle", "nastia-drum-bass-sunset-the-lab-ibiza", "carl-cox-chateau-de-chambord-cercle"]],
]);
const encodedDurations = new Map([
  ["sasha-ibiza-boat-at-sunset-freqways", 5273.194],
  ["ben-bohmer-cappadocia-cercle", 5068.1],
  ["peggy-gou-palais-des-beaux-arts-cercle", 6500],
  ["miss-monique-biosphere-montreal-cercle", 7985.5],
  ["nina-kraviz-eiffel-tower-cercle", 6762.9],
  ["nastia-drum-bass-sunset-the-lab-ibiza", 5135.2],
  ["carl-cox-chateau-de-chambord-cercle", 7986.09],
]);

assert.equal(schedule.stage, "24_hour_shared_broadcast_prototype");
assert.ok(Number.isFinite(Date.parse(schedule.epoch_utc)), "The shared UTC epoch must be valid.");
assert.deepEqual(schedule.planning_markets, ["Sydney", "Los Angeles", "Ibiza"]);
assert.equal(schedule.channels.length, 3, "Stage one must expose exactly three channels.");

const scheduledTracks = [];
for (const channel of schedule.channels) {
  const expected = expectedChannels.get(channel.id);
  assert.ok(expected, `Unexpected broadcast channel: ${channel.id}`);
  assert.deepEqual(channel.schedule.map((entry) => entry.track_id), expected);
  const cycleSeconds = channel.schedule.reduce((sum, entry) => sum + Number(entry.duration_seconds), 0);
  assert.ok(cycleSeconds > 0, `${channel.name} must have a continuous cycle.`);
  for (const entry of channel.schedule) {
    assert.equal(Number(entry.duration_seconds), encodedDurations.get(entry.track_id), `${entry.track_id} must use its encoded HLS duration.`);
    assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
    scheduledTracks.push(entry.track_id);
  }

  let cursor = 0;
  const daySeconds = 24 * 60 * 60;
  let slots = 0;
  while (cursor < daySeconds) {
    const entry = channel.schedule[slots % channel.schedule.length];
    cursor += Number(entry.duration_seconds);
    slots += 1;
    assert.ok(slots < 100, `${channel.name} schedule did not advance.`);
  }
  assert.ok(cursor >= daySeconds, `${channel.name} must cover the full 24-hour prototype without dead air.`);
}

assert.deepEqual(new Set(scheduledTracks), new Set(encodedDurations.keys()), "Each of the seven DJ sets must belong to one shared channel.");
assert.match(clockController, /serverNowMs - \(\(startedAt \+ endedAt\) \/ 2\)/, "Clock sync must compensate for request round-trip latency.");
assert.match(clockController, /positiveModulo\(elapsedSeconds, channel\.cycleSeconds\)/, "Channel state must repeat continuously from the shared epoch.");
assert.match(controller, /absoluteDrift > 1\.25/, "Shared playback must hard-correct material drift.");
assert.match(controller, /localVideo\.playbackRate = driftSeconds > 0 \? \.98 : 1\.02/, "Shared playback must gently correct smaller drift.");
assert.match(controller, /broadcastChannelId: channelId/, "Joining must retain the selected shared channel.");
assert.match(index, /data-broadcast-join>join the broadcast</);
assert.match(index, /data-broadcast-vod>watch from the beginning</);
assert.match(index, /data-broadcast-choose>choose another channel</);
assert.match(index, /broadcast-clock-v1\.js/);
assert.match(endpoint, /microtime\(true\) \* 1000/);
assert.match(endpoint, /Cache-Control: no-store/);

console.log("Broadcast clock preflight passed: 3 continuous channels, 7 exact-duration sets, shared UTC clock, drift correction, and shared/personal entry choices.");
