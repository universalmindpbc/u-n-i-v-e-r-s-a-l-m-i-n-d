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
const stationTensor = JSON.parse(await fs.readFile(path.join(IAM_DIR, "radio-station-tensor-notion-export-v1.0.json"), "utf8"));

const energyIds = ["restore", "social-uplift", "underground-intensity"];
const videoDurations = new Map([
  ["madonna-frozen", 329],
  ["madonna-ray-of-light", 306.994],
  ["rihanna-diamonds", 282.79],
  ["bjork-hyperballad", 239.29],
  ["tame-impala-the-less-i-know-the-better", 342.79],
  ["flume-tiny-cities", 236.59],
  ["flume-never-be-like-you-laneway", 336.79],
  ["grimes-genesis", 332.298],
  ["solange-cranes-in-the-sky", 272.198],
  ["little-simz-gorilla", 244.494],
  ["the-prodigy-everybody-in-the-place", 231],
  ["nightmares-on-wax-shape-the-future", 247.5],
  ["mia-borders", 282.7],
  ["sampa-the-great-energy", 307.9],
  ["sampa-the-great-final-form", 215],
  ["dua-lipa-be-the-one-glastonbury-2017", 209.298],
  ["charli-xcx-house-john-cale", 196],
  ["pinkpantheress-illegal-glastonbury-2025", 141.1],
  ["caroline-polachek-welcome-to-my-island", 236.092],
  ["u2-numb", 260.39],
  ["linkin-park-numb-official", 187.094],
  ["linkin-park-numb-live-2024", 192.098],
]);
const djDurations = new Map([
  ["sasha-ibiza-boat-at-sunset-freqways", 5273.194],
  ["ben-bohmer-cappadocia-cercle", 5068.1],
  ["peggy-gou-palais-des-beaux-arts-cercle", 6500],
  ["miss-monique-biosphere-montreal-cercle", 7985.5],
  ["nina-kraviz-eiffel-tower-cercle", 6762.9],
  ["nastia-drum-bass-sunset-the-lab-ibiza", 5135.2],
  ["carl-cox-chateau-de-chambord-cercle", 7986.09],
]);
const approvedStationIds = new Set(
  stationTensor.records
    .filter((station) => !station.status || station.status === "Approved")
    .map((station) => station.id)
);

assert.equal(schedule.stage, "nine_shared_channels_24_hour_prototype");
assert.ok(Number.isFinite(Date.parse(schedule.epoch_utc)), "The shared UTC epoch must be valid.");
assert.deepEqual(
  schedule.planning_markets.map((market) => market.name),
  ["Sydney", "Los Angeles", "Ibiza"]
);
assert.deepEqual(
  schedule.planning_markets.map((market) => market.time_zone),
  ["Australia/Sydney", "America/Los_Angeles", "Europe/Madrid"]
);
assert.equal(schedule.channels.length, 9, "The prototype must expose exactly nine shared channels.");

for (const format of ["videos", "parties", "radio"]) {
  const channels = schedule.channels.filter((channel) => channel.format === format);
  assert.equal(channels.length, 3, `${format} must expose exactly three shared channels.`);
  assert.deepEqual(channels.map((channel) => channel.energy_id), energyIds);
}

const scheduledVideos = [];
const scheduledDjSets = [];
const scheduledStations = new Set();
for (const channel of schedule.channels) {
  const cycleSeconds = channel.schedule.reduce((sum, entry) => sum + Number(entry.duration_seconds), 0);
  assert.ok(cycleSeconds > 0, `${channel.name} must have a continuous cycle.`);

  if (channel.format === "videos") {
    assert.equal(channel.media_type, "video");
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), videoDurations.get(entry.track_id), `${entry.track_id} must use its measured HLS duration.`);
      assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
      scheduledVideos.push(entry.track_id);
    }
  } else if (channel.format === "parties") {
    assert.equal(channel.media_type, "video");
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), djDurations.get(entry.track_id), `${entry.track_id} must use its encoded HLS duration.`);
      assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
      scheduledDjSets.push(entry.track_id);
    }
  } else {
    assert.equal(channel.media_type, "radio");
    assert.equal(cycleSeconds, 86400, `${channel.name} Radio must define one exact 24-hour timetable.`);
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 7200, "Stage-one Radio blocks must be two hours.");
      assert.ok(approvedStationIds.has(entry.station_id), `${entry.station_id} must be an approved radio station.`);
      scheduledStations.add(entry.station_id);
    }
  }

  let cursor = 0;
  let slots = 0;
  while (cursor < 86400) {
    cursor += Number(channel.schedule[slots % channel.schedule.length].duration_seconds);
    slots += 1;
    assert.ok(slots < 1000, `${channel.name} schedule did not advance.`);
  }
}

assert.deepEqual(new Set(scheduledVideos), new Set(videoDurations.keys()), "All 22 verified music videos must belong to exactly one shared channel.");
assert.equal(scheduledVideos.length, videoDurations.size, "A music video cannot belong to more than one shared channel.");
assert.ok(!scheduledVideos.includes("nine-inch-nails-closer-glastonbury-2026"), "The unverified Nine Inch Nails item must stay outside the shared broadcast.");
assert.deepEqual(new Set(scheduledDjSets), new Set(djDurations.keys()), "All seven DJ sets must belong to exactly one shared channel.");
assert.equal(scheduledDjSets.length, djDurations.size, "A DJ set cannot belong to more than one shared channel.");
assert.deepEqual(scheduledStations, approvedStationIds, "The three Radio timetables must programme the full approved station catalogue.");

assert.match(clockController, /serverNowMs - \(\(startedAt \+ endedAt\) \/ 2\)/, "Clock sync must compensate for request round-trip latency.");
assert.match(clockController, /positiveModulo\(elapsedSeconds, channel\.cycleSeconds\)/, "Channel state must repeat continuously from the shared epoch.");
assert.match(clockController, /channels\(format = ""\)/, "The clock must expose channels by media format.");
assert.match(controller, /channels\?\.\(mode\)/, "Videos, DJ Sets and Radio must all resolve through the shared clock.");
assert.match(controller, /absoluteDrift > 1\.25/, "Shared video playback must hard-correct material drift.");
assert.match(controller, /localVideo\.playbackRate = driftSeconds > 0 \? \.98 : 1\.02/, "Shared video playback must gently correct smaller drift.");
assert.match(controller, /broadcastCorrection = "live_station_locked"/, "Shared Radio must retain the station selected by the timetable.");
assert.match(controller, /musicContinuationReason = "personal_opening_complete"/, "The personal opening video must converge into a shared Music Video channel.");
assert.match(index, /data-broadcast-join>join the broadcast</);
assert.match(index, /data-broadcast-choose>choose another channel</);
assert.doesNotMatch(index, /data-broadcast-vod|watch from the beginning/i);
assert.doesNotMatch(controller, /watchBroadcastFromBeginning|watchFromBeginning|broadcast_watch_from_beginning/);
assert.match(index, /broadcast-clock-v1\.js/);
assert.match(endpoint, /microtime\(true\) \* 1000/);
assert.match(endpoint, /Cache-Control: no-store/);

console.log("Broadcast clock preflight passed: 3 Music Video, 3 DJ Set and 3 Radio channels; one personal opening; 29 timed videos; 11 approved stations; no solo replay path.");
