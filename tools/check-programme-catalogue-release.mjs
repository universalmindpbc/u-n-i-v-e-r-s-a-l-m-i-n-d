import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const read = (name) => fs.readFileSync(path.join(iam, name), "utf8");
const readJson = (name) => JSON.parse(read(name));
const sha12 = (name) => crypto.createHash("sha256").update(read(name)).digest("hex").slice(0, 12);

const modul8Parties = [
  "boys-noize-coachella-2026-live",
  "pete-cannon-manchester",
  "lilly-palmer-stone-quarry-germany",
  "david-guetta-tomorrowland-2026",
  "charlotte-de-witte-tomorrowland-winter-2026",
  "maayan-nidam-boiler-room-bucharest",
  "anfisa-letyago-dj-mag-hq",
  "lilly-palmer-dj-mag-hq",
  "lilly-palmer-edc-las-vegas-2026",
  "sonja-moonear-tomorrowland-belgium-2016",
  "margaret-dygas-submarine",
  "cassy-sunday-school-miami",
  "ellen-allien-le-jardin-suspendu-paris",
  "ellen-allien-boiler-room-sydney",
  "sven-vath-boiler-room-marseille",
  "sven-vath-awakenings-festival-2017",
  "ricardo-villalobos-arpiar-circo-loco-ibiza",
  "ricardo-villalobos-sunwaves-romania",
  "ricardo-villalobos-franco-cinelli-house-music-special",
  "ricardo-villalobos-ruta-5-sacre-paris",
  "sven-vath-tomorrowland-belgium-2016",
  "sonja-moonear-trotamundo-lost-beach-club",
];
const legacyModul8Parties = [
  "peggy-gou-palais-des-beaux-arts-cercle",
  "miss-monique-biosphere-montreal-cercle",
  "nina-kraviz-eiffel-tower-cercle",
  "nastia-drum-bass-sunset-the-lab-ibiza",
  "carl-cox-chateau-de-chambord-cercle",
];
const completeModul8Programme = new Set([...legacyModul8Parties, ...modul8Parties]);
const raveId = "rave-episode-1-solyra";
const fullNineInchNoizeId = "nine-inch-noize-coachella-2026-live-set";
const closerId = "nine-inch-noize-closer-coachella-2026-live";
const expectedIds = new Set([...modul8Parties, fullNineInchNoizeId, raveId, closerId]);

const tensor = readJson("programme-tensor-approved-notion-export-v1.0.json");
const catalogue = readJson("adaptive-music-video-catalogue-v1.11.json");
const policy = readJson("adaptive-music-trajectory-policy-v2.json");
const schedule = readJson("broadcast-schedule-v1.json");
const sources = readJson("universal-one-programme-sources-v1.json");
const television = read("adaptive-environment-television.js");
const streamCatalogue = read("cloudflare-stream-catalogue.js");
const guide = read("universal-one-programme-guide-v1.txt");
const clock = read("broadcast-clock-v1.js");
const index = read("index.html");
const alternateEntry = read("adaptive-environment-television.html");
const cafeDelMarEntry = read("cafe-del-mar-home.html");

assert.equal(tensor.batch_id, "programme-2026-07-30");
assert.equal(tensor.records.length, 25);
assert.equal(catalogue.programme_batch?.item_count, 25);
assert.equal(catalogue.programme_batch?.ready_count, 25);

const tensorById = new Map();
for (const record of tensor.records) {
  const profile = JSON.parse(record["JSON Profile"]);
  assert.ok(expectedIds.has(profile.selected_track_id), `${profile.selected_track_id} is outside the authorised batch.`);
  assert.equal(record.url?.startsWith("https://app.notion.com/"), true, `${profile.selected_track_id} has no Notion URL.`);
  assert.ok(record.id, `${profile.selected_track_id} has no Notion page ID.`);
  assert.match(profile.cloudflare_stream_uid || "", /^[a-f0-9]{32}$/);
  assert.match(profile.hls || "", /\/manifest\/video\.m3u8$/);
  assert.equal(profile.shop_eligible, false);
  tensorById.set(profile.selected_track_id, { record, profile });
}
assert.equal(tensorById.size, 25);

const programmeTracks = catalogue.tracks.filter((track) => expectedIds.has(track.id));
assert.equal(programmeTracks.length, 25);
for (const track of programmeTracks) {
  const { profile } = tensorById.get(track.id);
  assert.equal(track.music_room, profile.music_room);
  assert.equal(track.broadcast_channel, profile.broadcast_channel);
  assert.equal(track.stream_uid, profile.cloudflare_stream_uid);
  assert.equal(track.hls_video_src, profile.hls);
  assert.equal(track.source_record_url.startsWith("https://app.notion.com/"), true);
  assert.equal(track.shop_eligible, false);
  assert.ok(policy.tracks?.[track.id]);
  assert.match(television, new RegExp(`id: ${JSON.stringify(track.id)}`));
  assert.ok(streamCatalogue.includes(track.stream_uid));
}

const channel = (id) => schedule.channels.find((candidate) => candidate.id === id);
const modul8GlobalWeek = channel("party-modul8-infinity");
assert.equal(schedule.version, "broadcast_schedule_v1.6");
assert.equal(schedule.epoch_utc, "2026-07-24T00:00:00.000Z");
assert.equal(modul8GlobalWeek.epoch_utc, "2026-08-02T14:00:00.000Z");
assert.equal(modul8GlobalWeek.schedule.length, 108);
assert.deepEqual(new Set(modul8GlobalWeek.schedule.map((entry) => entry.track_id)), completeModul8Programme);
for (const trackId of completeModul8Programme) {
  assert.equal(modul8GlobalWeek.schedule.filter((entry) => entry.track_id === trackId).length, 4, `${trackId} must play once in every pass.`);
}
for (let pass = 1; pass <= 4; pass += 1) {
  const entries = modul8GlobalWeek.schedule.filter((entry) => entry.global_week_pass === pass);
  assert.equal(entries.length, 27);
  assert.deepEqual(new Set(entries.map((entry) => entry.track_id)), completeModul8Programme);
  assert.deepEqual(entries.map((entry) => entry.global_week_position), Array.from({ length: 27 }, (_, index) => index + 1));
}
assert.equal(modul8GlobalWeek.global_week_programming?.strategy, "four_reordered_passes_global_daypart_arc");
assert.equal(modul8GlobalWeek.global_week_programming?.priority_market, "Australia/Sydney");
assert.equal(modul8GlobalWeek.global_week_programming?.cycle_seconds, 601325.8);
assert.ok(Math.abs(modul8GlobalWeek.schedule.reduce((sum, entry) => sum + entry.duration_seconds, 0) - 601325.8) < .001);
assert.equal(modul8GlobalWeek.descriptor, "rave / electronic / experimental");
assert.equal(channel("video-modul8-infinity").schedule.at(-1).track_id, raveId);
assert.equal(channel("video-james-bondage").schedule.at(-1).track_id, closerId);
assert.deepEqual(channel("party-james-bondage").schedule.map((entry) => [entry.track_id, entry.media_type]), [
  ["zip-perlon-air-festival-2007", "audio"],
  ["zip-sammy-d-perlon-betalounge-2000", "audio"],
  [fullNineInchNoizeId, "video"],
]);
assert.equal(channel("party-modul8-infinity").name, "modul8 infinity");
assert.equal(channel("party-modul8-infinity").editorial_id, "modul8-infinity");
assert.deepEqual(schedule.planning_markets, [
  { name: "Sydney", time_zone: "Australia/Sydney" },
  { name: "Los Angeles", time_zone: "America/Los_Angeles" },
  { name: "Ibiza", time_zone: "Europe/Madrid" },
]);

const raveProfile = tensorById.get(raveId).profile;
assert.equal(raveProfile.cue_points.length, 18);
assert.equal(raveProfile.music_room, "modul8-infinity");
assert.equal(raveProfile.broadcast_channel, "video-modul8-infinity");
assert.equal(tensorById.get(fullNineInchNoizeId).profile.broadcast_channel, "party-james-bondage");
assert.equal(tensorById.get(closerId).profile.broadcast_channel, "video-james-bondage");
assert.equal(programmeTracks.some((track) => track.shop_eligible === true), false, "No programme-batch asset may enter Shop.");
assert.match(television, /function trackDisplayMetadataAt\(candidate, playbackSeconds = 0\)/);
assert.match(television, /syncCurrentCuePresentation\(\)/);
assert.match(television, /window\.IAMCueSheet = Object\.freeze\(\{/);
assert.match(television, /video\.addEventListener\("seeked", \(\) => \{/);
assert.match(television, /const display = musicItemDisplayMetadata\(item\)/);
const bloomClickHandler = television.match(
  /reactionButtons\.forEach\(\(button\) => \{\s*button\.addEventListener\("click", \(event\) => \{[\s\S]*?\n    \}\);\n  \}\);/,
)?.[0];
assert.ok(bloomClickHandler, "The Bloom click handler must remain identifiable for wallet-state regression coverage.");
assert.match(
  bloomClickHandler,
  /releaseReactionFlood\(reactionType\);\s*window\.IAMBroadcastInteractions\?\.sendBloom\?\.\(reactionType\);\s*window\.clearTimeout\(reactionWalletCollapseTimer\);/,
  "A Bloom tap must animate, send, and cancel any stale collapse without changing the open panel.",
);
assert.doesNotMatch(
  bloomClickHandler,
  /setWalletView|button\.blur\(/,
  "Sending a Bloom must leave the Bloom wallet and focused control exactly where they are.",
);
for (const entry of [index, alternateEntry, cafeDelMarEntry]) {
  assert.doesNotMatch(entry, /data-flower-cue|data-homepage-radar-trigger|how we understand your needs|learn how it works/i);
}

assert.match(guide, /Version: universal_one_programme_guide_v1\.2/);
assert.match(guide, /22 verified programme additions/);
assert.match(guide, /Rave · Episode 1” programme with 18 cue points/);
assert.match(guide, /full Nine Inch Noize live set from Coachella 2026/);
const batchSource = sources.programme_sources.find((source) => source.id === "programme-2026-07-30");
assert.deepEqual(
  [batchSource?.ready_count, batchSource?.hls_playback_verified_count, batchSource?.duration_verified_count, batchSource?.routing_verified],
  [25, 25, 25, true],
);

const scheduleToken = `broadcast-schedule-${sha12("broadcast-schedule-v1.json")}`;
assert.ok(clock.includes(scheduleToken));
const clockToken = `broadcast-clock-${sha12("broadcast-clock-v1.js")}`;
assert.ok(index.includes(clockToken) && alternateEntry.includes(clockToken));
const televisionToken = `music-tv-${sha12("adaptive-environment-television.js")}`;
assert.ok(index.includes(televisionToken) && alternateEntry.includes(televisionToken));

console.log("Programme catalogue release checks passed: Notion/Tensor 25/25, exact routes, 18 live Rave cues, Bloom wallet recovery, and 108-occurrence modul8 infinity global week.");
