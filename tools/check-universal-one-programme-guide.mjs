import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const guide = read("i  a m/universal-one-programme-guide-v1.txt");
const portalGuide = read("i  a m/universal-one-portal-guide-v1.txt");
const sources = JSON.parse(read("i  a m/universal-one-programme-sources-v1.json"));
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));
const index = read("i  a m/index.html");
const shop = read("i  a m/shop.html");
const alternateEntry = read("i  a m/adaptive-environment-television.html");
const realtimeClient = read("i  a m/realtime-voice-assistant.js");
const worker = read("cloudflare/iam-citizen-needs-worker.js");
const phpFallback = read("i  a m/api/realtime-client-secret.php");
const stagingDeploy = read("deploy-panthur-staging.sh");

assert.match(guide, /preferred collective name for Inner Planes, Champagne Bohemia, modul8 infinity, and james bondage is “Seeding Sessions”/);
assert.match(guide, /safety cushion is an additional music room, not a fifth Seeding Session/);
for (const name of ["Inner Planes", "Champagne Bohemia", "modul8 infinity", "james bondage", "safety cushion"]) {
  assert.match(guide, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(guide, /Version: universal_one_programme_guide_v1\.2/);
assert.match(guide, /Rave · Episode 1” programme with 18 cue points/);
assert.match(guide, /22 verified programme additions/);
assert.match(guide, /Nine Inch Noize performing “Closer” live at Coachella 2026/);
assert.match(guide, /full Nine Inch Noize live set from Coachella 2026/);
const programmeBatchSource = sources.programme_sources.find((source) => source.id === "programme-2026-07-30");
assert.equal(programmeBatchSource?.ready_count, 25);
assert.equal(programmeBatchSource?.hls_playback_verified_count, 25);
assert.equal(programmeBatchSource?.duration_verified_count, 25);
assert.equal(programmeBatchSource?.routing_verified, true);

const expectedEditorial = new Map([
  ["inner-planes", ["ambient | sleep | sunrise", "Ambient · sleep · sunrise"]],
  ["champagne-bohemia", ["sunset | chill | eternity", "Balearic · sunset · chillout"]],
  ["modul8-infinity", ["enlightenment thru rave", "Rave · house · techno · future bass · future psychedelic beats · hiphop"]],
  ["james-bondage", ["sex x mindfulness", "Minimal · electro · EBM"]],
]);

for (const [editorialId, [descriptor, description]] of expectedEditorial) {
  const formats = schedule.channels.filter(
    (channel) => channel.editorial_id === editorialId && ["videos", "parties", "radio"].includes(channel.format),
  );
  assert.deepEqual(new Set(formats.map((channel) => channel.format)), new Set(["videos", "parties", "radio"]));
  assert.ok(formats.every((channel) => channel.descriptor === descriptor));
  assert.ok(formats.some((channel) => channel.description === description));
}
const safetyCushion = schedule.music_rooms.find((room) => room.id === "safety-cushion");
assert.deepEqual(safetyCushion.allowed_formats, ["videos"]);
assert.equal(safetyCushion.catalogue_status, "ready");
const safetyCushionChannels = schedule.channels.filter((channel) => channel.editorial_id === "safety-cushion");
assert.deepEqual(safetyCushionChannels.map((channel) => channel.format), ["videos"]);
assert.equal(safetyCushionChannels[0].schedule.length, 21);
assert.match(guide, /additional 24\/7, ready 21-track 80s nu wave music-video feed/);
assert.deepEqual(schedule.extended_session_format_policy.weights, { parties: 0.8, radio: 0.1, videos: 0.1 });
assert.match(guide, /Parties 80% of the time, Radio 10% and Videos 10%/);

assert.match(index, /James Bondage Health · sex-ed/);
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 8);
assert.match(index, /data-sex-ed-episode="06"[\s\S]{0,900}Healing Through Solo Rope &amp; Self Pleasure/);
assert.match(index, /aria-label="Open episode 06:[^"]+Jacqueline Michelle"/);
assert.match(index, /<span>Jacqueline Michelle<\/span>/);
assert.match(index, /data-sex-ed-background-file="Karl Lagerfeld - The Making of the 2011 Pirelli Calendar\.mp4"/);
assert.match(index, /data-sex-ed-episode="07"[\s\S]{0,500}data-sex-ed-presentation="fullscreen"[\s\S]{0,220}data-sex-ed-radio-station="cafe-del-mar-chill"/);
assert.match(index, /data-sex-ed-episode="08"[\s\S]{0,500}data-sex-ed-presentation="fullscreen"[\s\S]{0,220}data-sex-ed-radio-station="cafe-del-mar-chill"/);
for (const episode of sources.episode_sources) {
  assert.equal(episode.transcript_verified === true || episode.source_verified === true, true);
  assert.match(guide, new RegExp(`EPISODE ${episode.episode}`));
}

assert.deepEqual(
  sources.episode_sources.map((episode) => episode.url),
  [
    "https://www.youtube.com/watch?v=5V03WROKX9o",
    "https://www.youtube.com/watch?v=Miwe9YD-tSQ",
    "https://www.chattingwithcandice.com/75-vylana-marcus-femininity-sex-and-intimacy/",
    "https://www.youtube.com/watch?v=o3Mo1bt3qmU",
    "https://www.youtube.com/watch?v=9Feb6b1kIsw",
    "https://creators.spotify.com/pod/profile/tanja-hirsch",
    "https://youaligned.com/yoga/sex-drive-sexual-energy/",
    "https://youaligned.com/yoga/vinyasa-yoga-free-yoga-video/",
  ],
);
assert.match(sources.use_policy.storage, /full third-party transcripts are not stored/);
assert.ok(guide.length < 30000, "programme guide should remain a curated briefing rather than a transcript copy");

assert.match(portalGuide, /Adaptive Inference Engine system prompt is version 4\.44/);
assert.match(portalGuide, /Mantra Sampler is inspired by Sven Vath’s Sven Panel/);
assert.match(portalGuide, /Blooms transmit to other visitors in the same programme/);
assert.match(portalGuide, /24-brand world is James Bondage plus an edit from 23 retailers/);
assert.match(portalGuide, /All profits from affiliate revenue are invested in mental health/);
assert.match(portalGuide, /Retail and affiliate relationships are currently proposed, not active/);
assert.match(shop, /All profits from affiliate revenue are invested in mental health/);

assert.match(worker, /import UNIVERSAL_ONE_PROGRAMME_GUIDE/);
assert.match(worker, /# Programme and episode guide\n\$\{UNIVERSAL_ONE_PROGRAMME_GUIDE\}/);
assert.match(worker, /portal_guide_version: "v1\.1"/);
assert.match(worker, /programme_guide_version: "v1\.2"/);
assert.match(worker, /voice_briefing_version: "v2"/);
assert.match(phpFallback, /universal-one-programme-guide-v1\.txt/);
assert.match(phpFallback, /# Programme and episode guide\n\{\$programmeGuide\}/);
assert.match(phpFallback, /'portal_guide_version' => 'v1\.1'/);
assert.match(phpFallback, /'programme_guide_version' => 'v1\.2'/);
assert.match(phpFallback, /'voice_briefing_version' => 'v2'/);

for (const scenario of [
  "seeding-sessions",
  "programme-catalogue",
  "sex-ed",
  "episode-detail",
  "sex-ed-safety",
  "new-episodes",
  "new-episode-safety",
  "yoga-episodes",
  "shared-interactions",
  "shop",
  "system-alignment",
]) {
  assert.match(realtimeClient, new RegExp(`qaScenario === "${scenario}"`));
}
assert.match(realtimeClient, /universal_one_realtime_v4/);
assert.match(index, /realtime-voice-assistant\.js\?v=realtime-voice-ca0e4fed9b9b/);
assert.match(alternateEntry, /realtime-voice-assistant\.js\?v=realtime-voice-ca0e4fed9b9b/);
assert.match(stagingDeploy, /check-universal-one-programme-guide\.mjs/);

new vm.Script(realtimeClient, { filename: "realtime-voice-assistant.js" });
console.log("Universal One programme guide checks passed.");
