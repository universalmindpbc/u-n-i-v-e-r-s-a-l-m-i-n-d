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
const mediaManifest = JSON.parse(read("cloudflare-stream-new-videos-20260827-manifest.json"));
const jbhMediaManifest = JSON.parse(read("cloudflare-stream-new-videos-20260830-manifest.json"));
const provenanceLedger = JSON.parse(read("youtube-branding-ledger-20260827.json"));
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));
const programmeCatalogueSource = read("i  a m/programme-catalogue-v1.js");
const televisionController = read("i  a m/adaptive-environment-television.js");
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
assert.match(guide, /Version: universal_one_programme_guide_v1\.6/);
assert.match(guide, /Rave · Episode 1” programme with 18 cue points/);
assert.match(guide, /original 27 are restored/);
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
assert.equal(additionBatch?.stream_uids_pending, false);
assert.equal(additionBatch?.ready_count, 21);
assert.equal(additionBatch?.hls_and_dash_verified_count, 21);
assert.equal(additionBatch?.verified_youtube_count, 19);
assert.equal(additionBatch?.source_neutral_non_youtube_count, 2);
assert.equal(additionBatch?.unresolved_count, 0);
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
    "Caroline Chang (Techno Llama) — Ambient Techno And Soft Rave Energy",
    "Caroline Chang (Techno Llama) — Ambient Techno To Zen Out To",
    "Caroline Chang (Techno Llama) — Cosy Ambient Techno By My Fireplace",
    "Caroline Chang (Techno Llama) — Dreamy Ambient Techno In My Garden",
    "Caroline Chang (Techno Llama) — Warm Cosmic Dub Techno & Electronica To Remind You Everything Is Going To Be OK",
    "Caroline Chang (Techno Llama) — Zen Mode Electronica Mix For Clarity",
    "The Cranberries — Zombie (Official Music Video)",
    "Soundgarden — Black Hole Sun",
    "Rage Against The Machine — Killing In The Name - 1993",
    "Nirvana — Smells Like Teen Spirit (Official Music Video)",
    "Linkin Park — In The End [Official HD Music Video]",
    "Justice — Generator (Live at Accor Arena 2024)",
    "Evanescence — Bring Me To Life (Official HD Music Video) ft. Paul McCoy",
    "Eminem — Lose Yourself",
    "Flume — Live at Coachella 2022",
    "Fred again.. & Thomas Bangalter — (USB002, Alexandra Palace, London 27 February 2026)",
    "Ricardo Villalobos — Live from Circoloco DC-10 Ibiza (20.07.26 Garden)",
    "Rihanna — Global Citizens Festival 2016",
    "Four Tet x Fred again x Skrillex — Coachella 2023",
    "Lisa — Rockstar Live",
  ],
);
assert.match(additionBatch.knowledge_boundary, /Do not infer tracklists, unnamed performers/);
assert.match(guide, /FROZEN 27 AUGUST 2026 PROGRAMME ADDITIONS/);
assert.match(guide, /all 32 complete programmes in four different 32-programme rotations/);
assert.match(guide, /128-occurrence shared cycle/);
assert.match(guide, /700,317\.8 seconds \(194 hours 31 minutes 58 seconds\)/);
assert.match(guide, /no programme is truncated, omitted or overlapped/);
assert.match(guide, /All five are additions, not replacements/);
assert.equal(mediaManifest.assetCount, 21);
assert.equal(mediaManifest.readyToStreamCount, 21);
assert.equal(provenanceLedger.verifiedYouTubeCount, 19);
assert.equal(provenanceLedger.sourceNeutralCount, 2);
assert.equal(provenanceLedger.unresolvedCount, 0);
const manifestEntries = Object.values(mediaManifest.files);
assert.deepEqual(additionBatch.inventory.map((item) => item.cloudflare_uid), manifestEntries.map((item) => item.uid));
assert.deepEqual(additionBatch.inventory.map((item) => item.duration_seconds), manifestEntries.map((item) => item.duration));
assert.ok(additionBatch.inventory.every((item) => item.stream_ready === true));
assert.equal(additionBatch.inventory[0].provenance_status, "source_neutral_non_youtube");
assert.equal(additionBatch.inventory[15].provenance_status, "source_neutral_non_youtube");
assert.match(additionBatch.knowledge_boundary, /Google Search/);
assert.match(additionBatch.knowledge_boundary, /VK is only Ben's unverified recollection/);

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
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 16);
assert.match(index, /data-sex-ed-episode="06"[\s\S]{0,900}Healing Through Solo Rope &amp; Self Pleasure/);
assert.match(index, /aria-label="Open episode 06:[^"]+Jacqueline Michelle"/);
assert.match(index, /<span>Jacqueline Michelle<\/span>/);
assert.match(index, /data-sex-ed-background-file="Karl Lagerfeld - The Making of the 2011 Pirelli Calendar\.mp4"/);
assert.match(index, /data-sex-ed-episode="07"[\s\S]{0,500}data-sex-ed-presentation="fullscreen"[\s\S]{0,220}data-sex-ed-radio-station="cafe-del-mar-chill"/);
assert.match(index, /data-sex-ed-episode="08"[\s\S]{0,500}data-sex-ed-presentation="fullscreen"[\s\S]{0,220}data-sex-ed-radio-station="cafe-del-mar-chill"/);
assert.match(index, /data-sex-ed-episode="15"[^>]*data-sex-ed-file="Pirelli 2010 Calendar\.mp4"[^>]*data-sex-ed-background-file="Shashi Solluna - How I Healed my Sexual Pain using Nature\.mp4"/);
assert.match(index, /data-sex-ed-episode="16"[^>]*data-sex-ed-file="Karl Lagerfeld &amp; Shashi Solluna - Nice Guy vs\. Toxic Masculinity\.mp4"[^>]*data-sex-ed-background-file="Karl Lagerfeld &amp; Shashi Solluna - Nice Guy vs\. Toxic Masculinity\.mp4"/);
for (const episode of sources.episode_sources) {
  assert.equal(episode.transcript_verified === true || episode.source_verified === true, true);
  assert.match(guide, new RegExp(`EPISODE ${episode.episode}`));
}

assert.deepEqual(
  sources.episode_sources.slice(0, 14).map((episode) => episode.url),
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
assert.equal(sources.version, "universal_one_programme_sources_v1.5");
assert.deepEqual(sources.episode_sources.map((episode) => episode.episode), ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"]);
assert.match(guide, /It currently contains sixteen conversations and instructional programmes/);
assert.match(sources.use_policy.storage, /full third-party transcripts are not stored/);
assert.ok(guide.length < 60000, "programme guide should remain a curated briefing rather than a transcript copy");

const emdrSource = sources.programme_sources.find((source) => source.id === "emdr-live-presets");
const canonicalEmdrTooltips = [
  "Champagne Bohemia — Xaviera Lopez’s animated GIF experience.",
  "modul8 infinity — Hexeosis animated GIF experience.",
  "James Bondage Health — Bordelle animated GIF experience.",
  "James Bondage Health — Pirelli 2010 and Shashi Solana — healing sexual trauma in nature.",
  "James Bondage Health — Karl Lagerfeld and Shashi Solana — dissolving toxic masculinity.",
  "Stella geometric experience.",
];
assert.equal(emdrSource?.implemented, true);
assert.equal(emdrSource?.live_on_staging, true);
assert.equal(emdrSource?.m8_gif_count, 39);
assert.deepEqual(emdrSource?.m8_page_sizes, [6, 6, 6, 6, 6, 6, 3]);
assert.deepEqual(emdrSource?.tooltips, canonicalEmdrTooltips);
for (const tooltip of canonicalEmdrTooltips) {
  const escaped = tooltip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(guide, new RegExp(escaped));
  assert.match(index, new RegExp(`data-emdr-tooltip="${escaped}"`));
}
assert.match(guide, /M8: exact tooltip[\s\S]{0,300}39 Hexeosis GIFs/);
assert.match(guide, /six pages of six GIFs in a centred 3 × 2 grid, then one final centred page of three/);
assert.match(guide, /four Bordelle square video tiles and two GIF tiles/);
assert.equal(emdrSource?.jbh_presets?.jbh_i?.existing_truth_preserved, true);
assert.equal(emdrSource?.jbh_presets?.jbh_i?.tile_video_count, 4);
assert.equal(emdrSource?.jbh_presets?.jbh_i?.tile_gif_count, 2);
assert.equal(emdrSource?.jbh_presets?.jbh_ii?.background_role, "full_page_audible_infinite_loop");
assert.equal(emdrSource?.jbh_presets?.jbh_ii?.foreground_role, "central_muted_infinite_loop");
assert.equal(emdrSource?.jbh_presets?.jbh_ii?.sync_layers, false);
assert.equal(emdrSource?.jbh_presets?.jbh_iii?.background_role, "full_page_muted_infinite_loop");
assert.equal(emdrSource?.jbh_presets?.jbh_iii?.foreground_role, "central_audible_infinite_loop");
assert.equal(emdrSource?.jbh_presets?.jbh_iii?.sync_layers, true);
assert.equal(emdrSource?.jbh_presets?.jbh_iii?.sync_drift_threshold_seconds, 0.18);
assert.equal(emdrSource?.jbh_presets?.jbh_iii?.sync_poll_milliseconds, 800);
assert.equal(emdrSource?.jbh_presets?.jbh_ii?.programme_mix_level, 0.15);
assert.equal(emdrSource?.jbh_presets?.jbh_iii?.programme_mix_level, 0.15);

const jbhEditorialSource = sources.programme_sources.find((source) => source.id === "jbh-editorial-experiences-2026-08-30");
assert.equal(jbhEditorialSource?.staging_source_commit, "bb2b2f7ac73cd1e0b0478768be44823277ee662d");
assert.equal(jbhEditorialSource?.staging_record_commit, "84305d7d0c4a42ee50303fd18fb01131bea75c58");
assert.equal(jbhEditorialSource?.sex_ed_contract?.audio_contract, "existing audio-only sex-ed Zip DJ broadcast");
assert.equal(jbhEditorialSource?.sex_ed_contract?.programme_mix_level, 0.15);
assert.equal(jbhEditorialSource?.content_gate?.identity_or_age_verification, false);
assert.equal(jbhEditorialSource?.content_gate?.episode_15_editor_note_verbatim_in_guide_and_interface, true);
assert.equal(jbhEditorialSource?.content_gate?.episode_16_uses_editor_note, false);
assert.match(jbhEditorialSource?.knowledge_boundary || "", /do not establish a transcript, third-party provenance, biography, therapeutic method, clinical effect, rights status or endorsement/i);
assert.deepEqual(
  jbhEditorialSource?.media?.map((item) => [item.file_name, item.cloudflare_uid, item.duration_seconds, item.status]),
  jbhMediaManifest.files.map((item) => [item.fileName, item.uid, item.durationSeconds, item.status]),
);
assert.equal(jbhMediaManifest.files.length, 3);
assert.ok(jbhMediaManifest.files.every((item) => item.status === "ready"));
assert.match(televisionController, /JBH_EDITORIAL_PROGRAMME_MIX_LEVEL = \.15/);
assert.match(televisionController, /Math\.abs\(drift\) > \.18[\s\S]{0,180}, 800\)/);
assert.match(televisionController, /requestJbhContentConsent\(selectedPreset\.sensitiveContent\)/);

const editorNoteVerbatim = "Editor's Note: This video utilizes archival footage from the 2010 Pirelli campaign to celebrate the timeless beauty and soft expression of female sensuality in nature. While we hold a deep respect for the models and the artistic expression captured in these frames, we want to be fully transparent that the photographer, Terry Richardson, has since faced numerous, serious allegations of sexual misconduct and abuse. It is important to reclaim art and culture, even when tainted by the abusive actions of predatory men in positions of power. Our inclusion of this footage is strictly an appreciation of the imagery itself and does not constitute an endorsement of the creator's conduct.";
const editorNoteMarkup = index.match(/<div class="jbh-content-gate__editor-note"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1] || "";
const editorNoteFromInterface = editorNoteMarkup
  .replace(/<br\s*\/?>/g, " ")
  .replace(/<[^>]+>/g, "")
  .replaceAll("&amp;", "&")
  .replace(/\s+/g, " ")
  .trim();
assert.equal(editorNoteFromInterface, editorNoteVerbatim);
assert.ok(guide.includes(editorNoteVerbatim));
assert.match(guide, /1800RESPECT: Call 1800 737 732/);
assert.match(guide, /Lifeline: Call 13 11 14 or text 0477 13 11 14/);
assert.match(guide, /There is no transcript or independent provenance briefing for this episode/);
assert.match(guide, /central music-video renderer uses aspect-fill inside the exact 16:9 frame/);
assert.match(guide, /cannot see a visitor’s private self-report, raw Heart Rate, recommendation rationale, hidden inference state or unavailable session data/);
for (const briefing of [guide, JSON.stringify(sources), realtimeClient, worker, phpFallback]) {
  assert.doesNotMatch(briefing, /story[ _-]?tree/i);
  assert.doesNotMatch(briefing, /Caroline Chase|The Techno Llama|caroline-chase/i);
}

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
assert.match(worker, /programme_guide_version: "v1\.6"/);
assert.match(worker, /voice_briefing_version: "v3"/);
assert.match(phpFallback, /universal-one-programme-guide-v1\.txt/);
assert.match(phpFallback, /# Programme and episode guide\n\{\$programmeGuide\}/);
assert.match(phpFallback, /'portal_guide_version' => 'v1\.2'/);
assert.match(phpFallback, /'adaptive_recommendation_guide_version' => 'v1'/);
assert.match(phpFallback, /'programme_guide_version' => 'v1\.6'/);
assert.match(phpFallback, /'voice_briefing_version' => 'v3'/);

for (const scenario of [
  "seeding-sessions",
  "programme-catalogue",
  "programme-additions",
  "media-provenance",
  "emdr-live",
  "comedy-programming",
  "sex-ed",
  "jbh-sex-ed-editorial",
  "jbh-emdr-editorial",
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
  "privacy-boundary",
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
