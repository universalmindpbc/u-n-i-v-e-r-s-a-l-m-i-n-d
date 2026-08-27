import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const programmeCatalogueSource = read("i  a m/programme-catalogue-v1.js");
const index = read("i  a m/index.html");
const shop = read("i  a m/shop.html");
const alternateEntry = read("i  a m/adaptive-environment-television.html");
const realtimeClient = read("i  a m/realtime-voice-assistant.js");
const expectedRealtimeClientToken = `realtime-voice-${createHash("sha256").update(realtimeClient).digest("hex").slice(0, 12)}`;
const worker = read("cloudflare/iam-citizen-needs-worker.js");
const phpFallback = read("i  a m/api/realtime-client-secret.php");
const stagingDeploy = read("deploy-panthur-staging.sh");

assert.match(guide, /preferred collective name for Inner Planes, Champagne Bohemia, modul8 infinity, and james bondage is “Seeding Sessions”/);
assert.match(guide, /safety cushion is an additional music room, not a fifth Seeding Session/);
for (const name of ["Inner Planes", "Champagne Bohemia", "modul8 infinity", "james bondage", "safety cushion"]) {
  assert.match(guide, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(guide, /Version: universal_one_programme_guide_v1\.4/);
assert.match(guide, /Rave · Episode 1” programme with 18 cue points/);
assert.match(guide, /22 verified programme additions/);
assert.match(guide, /Nine Inch Noize performing “Closer” live at Coachella 2026/);
assert.match(guide, /full Nine Inch Noize live set from Coachella 2026/);
assert.match(guide, /Grimes “Genesis” belongs to modul8 infinity Videos, not james bondage/);
assert.match(guide, /Worldwide FM/);
const programmeBatchSource = sources.programme_sources.find((source) => source.id === "programme-2026-07-30");
assert.equal(programmeBatchSource?.ready_count, 25);
assert.equal(programmeBatchSource?.hls_playback_verified_count, 25);
assert.equal(programmeBatchSource?.duration_verified_count, 25);
assert.equal(programmeBatchSource?.routing_verified, true);

const additionBatch = sources.programme_addition_batch;
assert.equal(additionBatch?.editorial_inventory_frozen, true);
assert.equal(additionBatch?.stream_uids_pending, true);
assert.equal(additionBatch?.inventory?.length, 21);
assert.deepEqual(additionBatch.inventory.map((item) => item.number), Array.from({ length: 21 }, (_, index) => index + 1));
assert.deepEqual(
  Object.fromEntries(
    Object.entries(Object.groupBy(additionBatch.inventory, (item) => item.route)).map(([route, items]) => [route, items.length]),
  ),
  {
    "party-champagne-bohemia": 1,
    "party-inner-planes": 6,
    "video-james-bondage": 8,
    "party-modul8-infinity": 5,
    "video-modul8-infinity": 1,
  },
);
assert.deepEqual(
  additionBatch.inventory.map((item) => `${item.credit} — ${item.title}`),
  [
    "Sasha — Renaissance Engage (10 May 2020)",
    "Caroline Chase (The Techno Llama) — Ambient Techno and Soft Rave Energy",
    "Caroline Chase (The Techno Llama) — Ambient Techno to Zen Out To",
    "Caroline Chase (The Techno Llama) — Cosy Ambient Techno by My Fireplace",
    "Caroline Chase (The Techno Llama) — Dreamy Ambient Techno in My Garden",
    "Caroline Chase (The Techno Llama) — Warm Cosmic Dub Techno & Electronica to Remind You Everything Is Going to Be OK",
    "Caroline Chase (The Techno Llama) — Zen Mode Electronica Mix for Clarity",
    "The Cranberries — Zombie",
    "Soundgarden — Black Hole Sun",
    "Rage Against the Machine — Killing in the Name (Live, 1993)",
    "Nirvana — Smells Like Teen Spirit",
    "Linkin Park — In the End",
    "Justice — Generator (Live at Accor Arena 2024)",
    "Evanescence — Bring Me to Life",
    "Eminem — Lose Yourself",
    "Flume — Live at Coachella 2022",
    "Fred again.. & Thomas Bangalter — USB002, Alexandra Palace, London (27 February 2026)",
    "Ricardo Villalobos — Circoloco DC-10 Ibiza (20 July 2026)",
    "Rihanna — Global Citizens Festival 2016",
    "Skrillex, Fred again.. & Four Tet — Coachella",
    "Lisa — Lisa Rockstar Live",
  ],
);
assert.match(additionBatch.knowledge_boundary, /Do not infer tracklists, unnamed performers/);
assert.match(guide, /FROZEN 27 AUGUST 2026 PROGRAMME ADDITIONS/);
assert.match(guide, /shared cycle remains 108 occurrences and 601,325\.68 seconds/);

const catalogueWindow = {};
new vm.Script(programmeCatalogueSource, { filename: "programme-catalogue-v1.js" }).runInNewContext({ window: catalogueWindow });
const comedyProgrammes = catalogueWindow.IAMProgrammeCatalogue.comedyProgrammes;
assert.deepEqual(
  Array.from(comedyProgrammes, (programme) => programme.title),
  [
    "The Big Lez Show · Seasons 1–4",
    "The Mike Nolan Show · Episodes 1–5",
    "Mike Nolan’s Long Weekend",
    "On Location with Clarence Claymore",
    "Sassy the Sasquatch",
    "The Donny & Clarence Show · Episodes 1–6",
    "Sassy Behind the Scenes",
  ],
);
assert.ok(comedyProgrammes.every((programme) => programme.artist === "Jarrad Wright"));
assert.deepEqual(Array.from(comedyProgrammes[0].segments, (segment) => segment.title), ["Season 1", "Season 2", "Season 3", "Season 4"]);
assert.deepEqual(Array.from(comedyProgrammes[1].segments, (segment) => segment.title), ["Yeah Nah Yeah", "FTC", "Anotha Day Anotha Dolla", "Ding Dong Delli", "Lantana Bush"]);
assert.deepEqual(Array.from(comedyProgrammes[5].segments, (segment) => segment.title), ["Prankz", "Thunda", "Put Em Up", "Fore", "Grit Mailman", "Sugar Glider"]);
assert.doesNotMatch(programmeCatalogueSource, /midnight-gospel/i);
assert.match(guide, /The Midnight Gospel trailer” is a separately uploaded/);
assert.match(guide, /series was created by Pendleton Ward and Duncan Trussell and animated by Titmouse/);
assert.match(guide, /deliberately not in the current Comedy live wheel/);
assert.match(guide, /Netflix is the distributor\/platform named by the official trailer source, not the creator/);

const expectedEditorial = new Map([
  ["inner-planes", ["ambient | sleep | sunrise", "Ambient · sleep · sunrise"]],
  ["champagne-bohemia", ["sunset | chill | eternity", "Balearic · sunset · chillout"]],
  ["modul8-infinity", ["enlightenment thru rave", "Rave · house · techno · future bass"]],
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
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 14);
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
    "https://www.youtube.com/watch?v=FH8083atfus",
    "https://www.youtube.com/watch?v=MELP1mW2f3A",
    "https://www.youtube.com/watch?v=wswcf-gdL70",
    "https://www.youtube.com/watch?v=EFYI_ELVYDo",
    "https://www.youtube.com/watch?v=yjQc9GDh8l0",
    "https://www.youtube.com/watch?v=VWCOYfe_RqM",
  ],
);
assert.equal(sources.version, "universal_one_programme_sources_v1.4");
assert.deepEqual(sources.episode_sources.map((episode) => episode.episode), ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14"]);
assert.match(guide, /It currently contains fourteen conversations and instructional programmes/);
assert.match(sources.use_policy.storage, /full third-party transcripts are not stored/);
assert.ok(guide.length < 50000, "programme guide should remain a curated briefing rather than a transcript copy");

assert.match(portalGuide, /Adaptive Inference Engine system prompt is version 5\.55/);
assert.match(portalGuide, /TV opens five current controls: MUSIC, FASHION, EMDR, SOUND and MANTRA/);
assert.match(portalGuide, /LIVE INPUTS IN DEVELOPMENT · CURRENT FIGURES ARE ILLUSTRATIVE/);
assert.match(portalGuide, /Research opens The modul8 infinity Study stakeholder page/);
assert.match(portalGuide, /Mantra Sampler is inspired by Sven Vath’s Sven Panel/);
assert.match(portalGuide, /Blooms transmit to other visitors in the same programme/);
assert.match(portalGuide, /24-brand world is James Bondage plus an edit from 23 retailers/);
assert.match(portalGuide, /All profits from affiliate revenue are invested in mental health/);
assert.match(portalGuide, /Retail and affiliate relationships are currently proposed, not active/);
assert.match(shop, /All profits from affiliate revenue are invested in mental health/);

assert.match(worker, /import UNIVERSAL_ONE_PROGRAMME_GUIDE/);
assert.match(worker, /# Programme and episode guide\n\$\{UNIVERSAL_ONE_PROGRAMME_GUIDE\}/);
assert.match(worker, /portal_guide_version: "v1\.2"/);
assert.match(worker, /adaptive_recommendation_guide_version: "v1"/);
assert.match(worker, /programme_guide_version: "v1\.4"/);
assert.match(worker, /voice_briefing_version: "v3"/);
assert.match(phpFallback, /universal-one-programme-guide-v1\.txt/);
assert.match(phpFallback, /# Programme and episode guide\n\{\$programmeGuide\}/);
assert.match(phpFallback, /'portal_guide_version' => 'v1\.2'/);
assert.match(phpFallback, /'adaptive_recommendation_guide_version' => 'v1'/);
assert.match(phpFallback, /'programme_guide_version' => 'v1\.4'/);
assert.match(phpFallback, /'voice_briefing_version' => 'v3'/);

for (const scenario of [
  "seeding-sessions",
  "programme-catalogue",
  "programme-additions",
  "comedy-programming",
  "sex-ed",
  "episode-detail",
  "sex-ed-safety",
  "new-episodes",
  "new-episode-safety",
  "yoga-episodes",
  "recent-sex-ed",
  "subspace-safety",
  "shared-interactions",
  "shop",
  "system-alignment",
  "adaptive-recommendations",
  "heart-rate-privacy",
  "sound-research",
  "research-impact",
  "programme-current",
]) {
  assert.match(realtimeClient, new RegExp(`qaScenario === "${scenario}"`));
}
assert.match(realtimeClient, /universal_one_realtime_v5/);
assert.match(index, new RegExp(`realtime-voice-assistant\\.js\\?v=${expectedRealtimeClientToken}`));
assert.match(alternateEntry, new RegExp(`realtime-voice-assistant\\.js\\?v=${expectedRealtimeClientToken}`));
assert.match(stagingDeploy, /check-universal-one-programme-guide\.mjs/);

new vm.Script(realtimeClient, { filename: "realtime-voice-assistant.js" });
console.log("Universal One programme guide checks passed.");
