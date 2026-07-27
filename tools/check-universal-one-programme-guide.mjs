import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const guide = read("i  a m/universal-one-programme-guide-v1.txt");
const sources = JSON.parse(read("i  a m/universal-one-programme-sources-v1.json"));
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));
const index = read("i  a m/index.html");
const alternateEntry = read("i  a m/adaptive-environment-television.html");
const realtimeClient = read("i  a m/realtime-voice-assistant.js");
const worker = read("cloudflare/iam-citizen-needs-worker.js");
const phpFallback = read("i  a m/api/realtime-client-secret.php");
const stagingDeploy = read("deploy-panthur-staging.sh");

assert.match(guide, /preferred collective name is “Seeding Sessions”/);
for (const name of ["Inner Planes", "Champagne Bohemia", "modul8 infinity", "james bondage", "safety cushion"]) {
  assert.match(guide, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const expectedEditorial = new Map([
  ["inner-planes", ["ambient / sleep / sunrise", "Ambient · sleep · sunrise"]],
  ["champagne-bohemia", ["Balearic / sunset / chillout", "Balearic · sunset · chillout"]],
  ["modul8-infinity", ["rave / house / techno / future bass / future psychedelic beats / hiphop", "Rave · house · techno · future bass · future psychedelic beats · hiphop"]],
  ["james-bondage", ["minimal / electro / EBM", "Minimal · electro · EBM"]],
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
assert.match(guide, /one ready 21-track 80s nu wave music-video feed/);
assert.deepEqual(schedule.extended_session_format_policy.weights, { parties: 0.8, radio: 0.1, videos: 0.1 });
assert.match(guide, /Parties 80% of the time, Radio 10% and Videos 10%/);

assert.match(index, /James Bondage Health · sex-ed/);
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 6);
assert.match(index, /data-sex-ed-episode="06"[\s\S]{0,900}Healing Through Solo Rope &amp; Self Pleasure/);
for (const episode of sources.episode_sources) {
  assert.equal(episode.transcript_verified, true);
  assert.match(guide, new RegExp(`EPISODE ${episode.episode}`));
}

assert.deepEqual(
  sources.episode_sources.map((episode) => episode.url),
  [
    "https://www.youtube.com/watch?v=5V03WROKX9o",
    "https://www.youtube.com/watch?v=Miwe9YD-tSQ",
    "https://www.chattingwithcandice.com/75-vylana-marcus-femininity-sex-and-intimacy/",
    "https://www.youtube.com/watch?v=o3Mo1bt3qmU",
  ],
);
assert.match(sources.use_policy.storage, /full third-party transcripts are not stored/);
assert.ok(guide.length < 30000, "programme guide should remain a curated briefing rather than a transcript copy");

assert.match(worker, /import UNIVERSAL_ONE_PROGRAMME_GUIDE/);
assert.match(worker, /# Programme and episode guide\n\$\{UNIVERSAL_ONE_PROGRAMME_GUIDE\}/);
assert.match(worker, /programme_guide_version: "v1"/);
assert.match(phpFallback, /universal-one-programme-guide-v1\.txt/);
assert.match(phpFallback, /# Programme and episode guide\n\{\$programmeGuide\}/);
assert.match(phpFallback, /'programme_guide_version' => 'v1'/);

for (const scenario of ["seeding-sessions", "sex-ed", "episode-detail", "sex-ed-safety"]) {
  assert.match(realtimeClient, new RegExp(`qaScenario === "${scenario}"`));
}
assert.match(realtimeClient, /universal_one_realtime_v4/);
assert.match(index, /realtime-voice-assistant\.js\?v=realtime-voice-f8316640aa0a/);
assert.match(alternateEntry, /realtime-voice-assistant\.js\?v=realtime-voice-f8316640aa0a/);
assert.match(stagingDeploy, /check-universal-one-programme-guide\.mjs/);

new vm.Script(realtimeClient, { filename: "realtime-voice-assistant.js" });
console.log("Universal One programme guide checks passed.");
