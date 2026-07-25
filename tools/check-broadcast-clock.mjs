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

const editorialIds = ["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage"];
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
  ["max-richter-cercle-odyssey-paris", 3729.19],
  ["olafur-arnalds-hafursey-iceland-cercle", 5242.2],
  ["zip-perlon-air-festival-2007", 11255.780136],
  ["zip-sammy-d-perlon-betalounge-2000", 13194.739229],
]);
const fashionRunwayIds = new Set([
  "chanel-paris-rooftops",
  "jacquemus-le-coup-de-soleil",
  "annies-ibiza-runway",
  "dolce-gabbana-valley-of-the-temples",
  "mugler-fall-winter-2021",
  "wolford-sergio-rossi-capsule",
]);
const privateRadioVisualIds = new Set(["inner-planes-radio-blue-pearl"]);
const approvedStationIds = new Set(
  stationTensor.records
    .filter((station) => !station.status || station.status === "Approved")
    .map((station) => station.id)
);

assert.equal(schedule.stage, "four_editorial_music_channels");
assert.ok(Number.isFinite(Date.parse(schedule.epoch_utc)), "The shared UTC epoch must be valid.");
assert.deepEqual(
  schedule.planning_markets.map((market) => market.name),
  ["Sydney", "Los Angeles", "Ibiza"]
);
assert.deepEqual(
  schedule.planning_markets.map((market) => market.time_zone),
  ["Australia/Sydney", "America/Los_Angeles", "Europe/Madrid"]
);
assert.equal(schedule.channels.length, 16, "The schedule must expose twelve public Music channels, three public Fashion channels and one private Radio visual channel.");

for (const format of ["videos", "parties", "radio"]) {
  const channels = schedule.channels.filter((channel) => channel.format === format);
  assert.equal(channels.length, 4, `${format} must expose the four named editorial channels.`);
  assert.deepEqual(channels.map((channel) => channel.editorial_id), editorialIds);
  assert.deepEqual(
    channels.map((channel) => channel.name),
    ["Inner Planes", "Champagne Bohemia", "modul8 infinity", "james bondage"]
  );
}
assert.deepEqual(
  schedule.channels.filter((channel) => channel.format === "fashion").map((channel) => channel.energy_id),
  ["restore", "social-uplift", "underground-intensity"],
  "The public Fashion shelf remains an exact three-way visual pairing system."
);
assert.deepEqual(
  schedule.channels.filter((channel) => channel.format === "radio-visual").map((channel) => channel.id),
  ["radio-visual-inner-planes"],
  "Inner Planes Radio must use one dedicated private visual channel."
);

const scheduledVideos = [];
const scheduledDjSets = [];
const scheduledStations = new Set();
const scheduledRunways = [];
for (const channel of schedule.channels) {
  const cycleSeconds = channel.schedule.reduce((sum, entry) => sum + Number(entry.duration_seconds), 0);
  assert.notEqual(channel.available, false, `${channel.name} must now expose its approved programming.`);
  assert.ok(cycleSeconds > 0, `${channel.name} must have a continuous cycle.`);

  if (channel.format === "videos") {
    assert.equal(channel.media_type, "video");
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), videoDurations.get(entry.track_id), `${entry.track_id} must use its measured HLS duration.`);
      assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
      scheduledVideos.push(entry.track_id);
    }
  } else if (channel.format === "parties") {
    assert.ok(["video", "audio"].includes(channel.media_type));
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), djDurations.get(entry.track_id), `${entry.track_id} must use its encoded HLS duration.`);
      assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
      scheduledDjSets.push(entry.track_id);
    }
    if (channel.id === "party-james-bondage") {
      assert.equal(channel.media_type, "audio");
      assert.equal(channel.visual_channel_id, "fashion-underground-intensity");
    }
  } else if (channel.format === "radio") {
    assert.equal(channel.media_type, "radio");
    assert.equal(cycleSeconds, 86400, `${channel.name} Radio must define one exact 24-hour timetable.`);
    const approvedRadioVisualChannels = {
      "radio-inner-planes": "radio-visual-inner-planes",
      "radio-champagne-bohemia": "fashion-restore",
      "radio-modul8-infinity": "fashion-social-uplift",
      "radio-james-bondage": "fashion-underground-intensity",
    };
    assert.equal(
      channel.visual_channel_id,
      approvedRadioVisualChannels[channel.id],
      `${channel.name} Radio must retain its approved Fashion pairing.`
    );
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 7200, "Stage-one Radio blocks must be two hours.");
      assert.ok(approvedStationIds.has(entry.station_id), `${entry.station_id} must be an approved radio station.`);
      scheduledStations.add(entry.station_id);
    }
  } else if (channel.format === "fashion") {
    assert.equal(channel.media_type, "fashion");
    assert.equal(cycleSeconds, 1800, `${channel.name} Fashion must define one repeating 30-minute cycle.`);
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 900, "Each Fashion film must occupy one 15-minute shared block.");
      assert.ok(fashionRunwayIds.has(entry.runway_id), `${entry.runway_id} must be a verified Fashion runway.`);
      assert.match(controller, new RegExp(`assetKey: "${entry.runway_id}"`), `${entry.runway_id} must exist in the Fashion catalogue.`);
      scheduledRunways.push(entry.runway_id);
    }
  } else {
    assert.equal(channel.format, "radio-visual");
    assert.equal(channel.internal, true, "The Inner Planes Radio visual channel must remain private.");
    assert.equal(channel.media_type, "fashion");
    assert.equal(cycleSeconds, 10045.51, "Pearl must use its exact encoded HLS duration.");
    assert.equal(channel.schedule.length, 1);
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 10045.51);
      assert.ok(privateRadioVisualIds.has(entry.runway_id), `${entry.runway_id} must be the private Inner Planes Radio visual.`);
      assert.match(controller, new RegExp(`assetKey: "${entry.runway_id}"`), `${entry.runway_id} must exist in the visual catalogue.`);
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
assert.deepEqual(new Set(scheduledDjSets), new Set(djDurations.keys()), "All ten approved DJ sets and mixes must belong to exactly one shared channel.");
assert.equal(scheduledDjSets.length, djDurations.size, "A DJ set cannot belong to more than one shared channel.");
assert.deepEqual(scheduledStations, approvedStationIds, "The four Radio timetables must programme the full approved station catalogue.");
assert.deepEqual(new Set(scheduledRunways), fashionRunwayIds, "All six Fashion films must belong to exactly one shared channel.");
assert.equal(scheduledRunways.length, fashionRunwayIds.size, "A Fashion film cannot belong to more than one shared channel.");
assert.ok(!scheduledRunways.some((runwayId) => privateRadioVisualIds.has(runwayId)), "Pearl must never enter the public Fashion shelf.");

assert.match(clockController, /serverNowMs - \(\(startedAt \+ endedAt\) \/ 2\)/, "Clock sync must compensate for request round-trip latency.");
assert.match(clockController, /positiveModulo\(elapsedSeconds, channel\.cycleSeconds\)/, "Channel state must repeat continuously from the shared epoch.");
assert.match(clockController, /channels\(format = ""\)/, "The clock must expose channels by media format.");
assert.match(clockController, /previousRunwayId/, "The shared clock must expose the previous Fashion programme.");
assert.match(controller, /channels\?\.\(mode\)/, "Videos, DJ Sets, Radio and Fashion must all resolve through the shared clock.");
assert.match(controller, /absoluteDrift > 1\.25/, "Shared video playback must hard-correct material drift.");
assert.match(controller, /localVideo\.playbackRate = driftSeconds > 0 \? \.98 : 1\.02/, "Shared video playback must gently correct smaller drift.");
assert.match(controller, /broadcastCorrection = "live_station_locked"/, "Shared Radio must retain the station selected by the timetable.");
assert.match(controller, /musicContinuationDecision = "parties"/, "The personal opening video must converge into a recommended shared DJ Set channel.");
assert.match(controller, /musicContinuationReason = "personal_opening_complete"/, "The shared DJ Set invitation must follow the personal opening video.");
assert.match(controller, /radio_energy_match/, "Shared Radio must automatically pair with the matching Fashion energy channel.");
assert.match(controller, /revealMinimumSeconds:\s*RADIO_FASHION_REVEAL_BUFFER_SECONDS/, "Shared Radio must begin its Fashion picture before the station safety buffer.");
assert.match(controller, /audio_party_visual_pair/, "James Bondage audio-led parties must pair with the Fashion broadcast clock.");
assert.match(controller, /startAudioLedParty/, "The Zip and Sammy D mixes must use the audio-led party player.");
assert.match(controller, /fashionBroadcastBlockRemainingSeconds/, "Fashion playback must remain locked to its 15-minute shared block.");
assert.match(controller, /musicShelfRecommendationIds/, "The recommended channel must be stored independently from fixed shelf order.");
assert.match(index, /data-broadcast-join>join the broadcast</);
assert.match(index, /data-broadcast-choose>choose another channel</);
assert.match(index, /data-broadcast-entry-vibe/);
assert.match(index, /data-broadcast-entry-format/);
assert.doesNotMatch(index, /data-broadcast-programme-(?:previous|now|next)/, "The noisy previous/now/next guide must stay out of the shared-channel view.");
assert.doesNotMatch(index, /data-music-mode="fashion"/, "Fashion must stay outside the Videos, Parties and Radio selector.");
assert.match(index, /data-video-mode="fashion"/, "Fashion must remain available through Mix.");
assert.match(index, /Fashion · shared channels/, "Mix > Fashion must open the three synchronized Fashion channels.");
assert.match(controller, /MUSIC_BROADCAST_FORMATS = \["videos", "parties", "radio"\]/, "The Music selector must expose exactly Videos, Parties and Radio.");
assert.match(controller, /is-current-broadcast/, "The exact joined channel must have a dedicated current state.");
assert.match(controller, /activeBroadcastChannelIdForMode/, "Current state must resolve from the joined broadcast channel ID.");
assert.doesNotMatch(controller, /VIBE · \$\{item\.broadcastChannelName\}/, "Generic VIBE hierarchy must not be overlaid on channel cards.");
assert.match(controller, /BROADCAST_EDITORIAL_ORDER = \["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage"\]/);
assert.match(index, /data-music-mode="parties"[^>]*>Parties</);
assert.match(index, /CHANNEL · <strong data-broadcast-entry-vibe>INNER PLANES/);
assert.doesNotMatch(index, /data-broadcast-vod|watch from the beginning/i);
assert.doesNotMatch(controller, /watchBroadcastFromBeginning|watchFromBeginning|broadcast_watch_from_beginning/);
assert.match(index, /broadcast-clock-v1\.js/);
assert.match(endpoint, /microtime\(true\) \* 1000/);
assert.match(endpoint, /Cache-Control: no-store/);

console.log("Broadcast clock preflight passed: four live editorial channels across Videos, Parties and Radio; Max Richter and Ólafur Arnalds in Inner Planes Parties; Pearl privately clocked to Inner Planes Radio; public Fashion remains Chanel/Jacquemus, Annie’s/D&G and Mugler/Wolford; no solo replay path.");
