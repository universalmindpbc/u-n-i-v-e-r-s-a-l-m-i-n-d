import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const uploadManifestPath = "/private/tmp/cloudflare-stream-new-videos-20260827-manifest.json";
const releaseManifestPath = path.join(root, "cloudflare-stream-new-videos-20260827-manifest.json");
const brandingLedgerPath = path.join(root, "youtube-branding-ledger-20260827.json");
const customerHost = "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
const sha12 = (value) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);

const definitions = [
  { id: "sasha-renaissance-engage-2020", artist: "Sasha", title: "Renaissance Engage (10 May 2020)", room: "champagne-bohemia", presentation: "live_dj_set", relativePath: "c h a m p a g n e  b o h e m i a  -  p a r t i e s/Sasha - Live @ Renaissance Engage [10.05.2020].mp4" },
  { id: "caroline-chang-ambient-techno-soft-rave-energy", artist: "Caroline Chang (Techno Llama)", title: "Ambient Techno And Soft Rave Energy", room: "inner-planes", presentation: "live_dj_set", relativePath: "i n n e r  p l a n e s  -  p a r t i e s/Ambient Techno And Soft Rave Energy.mp4" },
  { id: "caroline-chang-ambient-techno-zen-out", artist: "Caroline Chang (Techno Llama)", title: "Ambient Techno To Zen Out To", room: "inner-planes", presentation: "live_dj_set", relativePath: "i n n e r  p l a n e s  -  p a r t i e s/Ambient Techno To Zen Out To.mp4" },
  { id: "caroline-chang-cosy-ambient-techno-fireplace", artist: "Caroline Chang (Techno Llama)", title: "Cosy Ambient Techno By My Fireplace", room: "inner-planes", presentation: "live_dj_set", relativePath: "i n n e r  p l a n e s  -  p a r t i e s/Cosy Ambient Techno By My Fireplace.mp4" },
  { id: "caroline-chang-dreamy-ambient-techno-garden", artist: "Caroline Chang (Techno Llama)", title: "Dreamy Ambient Techno In My Garden", room: "inner-planes", presentation: "live_dj_set", relativePath: "i n n e r  p l a n e s  -  p a r t i e s/Dreamy Ambient Techno In My Garden.mp4" },
  { id: "caroline-chang-warm-cosmic-dub-techno", artist: "Caroline Chang (Techno Llama)", title: "Warm Cosmic Dub Techno & Electronica To Remind You Everything Is Going To Be OK", room: "inner-planes", presentation: "live_dj_set", relativePath: "i n n e r  p l a n e s  -  p a r t i e s/Warm Cosmic Dub Techno & Electronica To Remind You Everything Is Going To Be OK.mp4" },
  { id: "caroline-chang-zen-mode-electronica-clarity", artist: "Caroline Chang (Techno Llama)", title: "Zen Mode Electronica Mix For Clarity", room: "inner-planes", presentation: "live_dj_set", relativePath: "i n n e r  p l a n e s  -  p a r t i e s/Zen Mode Electronica Mix For Clarity.mp4" },
  { id: "the-cranberries-zombie", artist: "The Cranberries", title: "Zombie (Official Music Video)", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/The Cranberries - Zombie.mp4" },
  { id: "soundgarden-black-hole-sun", artist: "Soundgarden", title: "Black Hole Sun", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Soundgarden - Black Hole Sun.mp4" },
  { id: "rage-against-the-machine-killing-in-the-name-live-1993", artist: "Rage Against The Machine", title: "Killing In The Name - 1993", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Rage Against The Machine - Killing In The Name (Live, 1993).mp4" },
  { id: "nirvana-smells-like-teen-spirit", artist: "Nirvana", title: "Smells Like Teen Spirit (Official Music Video)", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Nirvana - Smells Like Teen Spirit.mp4" },
  { id: "linkin-park-in-the-end", artist: "Linkin Park", title: "In The End [Official HD Music Video]", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Linkin Park - In The End.mp4" },
  { id: "justice-generator-accor-arena-2024", artist: "Justice", title: "Generator (Live at Accor Arena 2024)", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Justice - Generator (Live at Accor Arena 2024).mp4" },
  { id: "evanescence-bring-me-to-life", artist: "Evanescence", title: "Bring Me To Life (Official HD Music Video) ft. Paul McCoy", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Evanescence - Bring Me To Life.mp4" },
  { id: "eminem-lose-yourself", artist: "Eminem", title: "Lose Yourself", room: "james-bondage", relativePath: "j a m e s  b o n d a g e  -  v i d e o s/Eminem - Lose Yourself.mp4" },
  { id: "flume-coachella-2022-live", artist: "Flume", title: "Live at Coachella 2022", room: "modul8-infinity", presentation: "live_dj_set", relativePath: "m o d u l 8 i n f i n i t y - p a r t i e s/Flume - Live at Coachella 2022.mp4" },
  { id: "fred-again-thomas-bangalter-usb002-alexandra-palace-2026", artist: "Fred again.. & Thomas Bangalter", title: "(USB002, Alexandra Palace, London 27 February 2026)", room: "modul8-infinity", presentation: "live_dj_set", relativePath: "m o d u l 8 i n f i n i t y - p a r t i e s/Fred again.. & Thomas Bangalter (USB002, Alexandra Palace, London 27 February 2026)_1.mp4" },
  { id: "ricardo-villalobos-circoloco-dc10-ibiza-2026", artist: "Ricardo Villalobos", title: "Live from Circoloco DC-10 Ibiza (20.07.26 Garden)", room: "modul8-infinity", presentation: "live_dj_set", relativePath: "m o d u l 8 i n f i n i t y - p a r t i e s/Ricardo Villalobos - Live from Circoloco DC-10 Ibiza (20.07.26 Garden).mp4" },
  { id: "rihanna-global-citizens-festival-2016", artist: "Rihanna", title: "Global Citizens Festival 2016", room: "modul8-infinity", presentation: "live_dj_set", relativePath: "m o d u l 8 i n f i n i t y - p a r t i e s/Rihanna - Global Citizens Festival 2016_720p.mp4" },
  { id: "skrillex-fred-again-four-tet-coachella", artist: "Four Tet x Fred again x Skrillex", title: "Coachella 2023", room: "modul8-infinity", presentation: "live_dj_set", relativePath: "m o d u l 8 i n f i n i t y - p a r t i e s/Skrillex, Fred Again, Fourtet - Coachella.mp4" },
  { id: "lisa-rockstar-live", artist: "Lisa", title: "Rockstar Live", room: "modul8-infinity", relativePath: "m o d u l 8 i n f i n i t y - v i d e o s/LISA performing Rockstar live from the Victoria’s Secret Fashion Show 2024_1.mp4" },
].map((definition) => ({ ...definition, fileName: path.basename(definition.relativePath) }));

const uploadManifest = JSON.parse(await fs.readFile(uploadManifestPath, "utf8"));
const brandingLedger = JSON.parse(await fs.readFile(brandingLedgerPath, "utf8"));
const records = new Map();
for (const definition of definitions) {
  const record = uploadManifest.files?.[definition.id]
    || Object.values(uploadManifest.files || {}).find((candidate) => candidate.fileName === definition.fileName);
  if (!record?.uid?.match(/^[a-f0-9]{32}$/)) throw new Error(`${definition.id} has no valid Stream UID`);
  if (record.readyToStream !== true || record.status !== "ready") throw new Error(`${definition.id} is not readyToStream`);
  if (!(Number(record.duration) > 0)) throw new Error(`${definition.id} has no verified encoded duration`);
  records.set(definition.id, record);
}

const hls = (uid) => `https://${customerHost}/${uid}/manifest/video.m3u8`;
const jsString = (value) => JSON.stringify(value);
const read = (name) => fs.readFile(path.join(iam, name), "utf8");
const write = (name, value) => fs.writeFile(path.join(iam, name), value);

let trackCatalogue = await read("music-track-catalogue-v1.js");
if (definitions.some(({ id }) => trackCatalogue.includes(`id: ${jsString(id)}`))) {
  throw new Error("The new-video track catalogue entries already exist; refusing a duplicate application");
}
const trackLines = definitions.map((definition) => {
  const record = records.get(definition.id);
  const fields = [
    `id: ${jsString(definition.id)}`,
    `artist: ${jsString(definition.artist)}`,
    `title: ${jsString(definition.title)}`,
    `displayTitle: ${jsString(definition.title)}`,
    `localVideoSrc: ${jsString(`a s s e t s/n e w   i m p o r t   v i d e o e s/${definition.relativePath}`)}`,
    `musicRoom: ${jsString(definition.room)}`,
    ...(definition.presentation ? [`presentation: ${jsString(definition.presentation)}`] : []),
    `streamUid: ${jsString(record.uid)}`,
    `hlsVideoSrc: ${jsString(hls(record.uid))}`,
  ];
  return `  { ${fields.join(", ")} },`;
}).join("\n");
trackCatalogue = trackCatalogue
  .replace(/version: "music_track_catalogue_v1\.\d+"/, 'version: "music_track_catalogue_v1.2"')
  .replace("\n];\n\n  window.IAMTrackCatalogue", `\n${trackLines}\n];\n\n  window.IAMTrackCatalogue`);
await write("music-track-catalogue-v1.js", trackCatalogue);

let streamCatalogue = await read("cloudflare-stream-catalogue.js");
if (definitions.some(({ fileName }) => streamCatalogue.includes(`${jsString(fileName)}:`))) {
  throw new Error("The new-video Stream catalogue entries already exist; refusing a duplicate application");
}
const streamLines = definitions
  .map((definition) => `    ${jsString(definition.fileName)}: ${jsString(records.get(definition.id).uid)},`)
  .join("\n");
streamCatalogue = streamCatalogue.replace("\n  };\n\n  function fileNameFromPath", `\n${streamLines}\n  };\n\n  function fileNameFromPath`);
await write("cloudflare-stream-catalogue.js", streamCatalogue);

let programmeGuide = await read("programme-guide.js");
if (definitions.some(({ id }) => programmeGuide.includes(`${jsString(id)}:`))) {
  throw new Error("The new-video Program fallback entries already exist; refusing a duplicate application");
}
const programmeLines = definitions
  .map((definition) => `    ${jsString(definition.id)}: { artist: ${jsString(definition.artist)}, title: ${jsString(definition.title)} },`)
  .join("\n");
programmeGuide = programmeGuide.replace("\n  };\n\n  const programPanel", `\n${programmeLines}\n  };\n\n  const programPanel`);
await write("programme-guide.js", programmeGuide);

const schedulePath = path.join(iam, "broadcast-schedule-v1.json");
const schedule = JSON.parse(await fs.readFile(schedulePath, "utf8"));
schedule.version = "broadcast_schedule_v1.13";
const channel = (id) => {
  const result = schedule.channels.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Missing schedule channel: ${id}`);
  return result;
};
const oldDuration = new Map(schedule.channels.flatMap((candidate) => candidate.schedule || []).map((entry) => [entry.track_id, Number(entry.duration_seconds)]));
const duration = (id) => Number(records.get(id)?.duration || oldDuration.get(id));
const entry = (trackId) => ({ track_id: trackId, duration_seconds: duration(trackId) });

channel("party-inner-planes").schedule = [
  entry("caroline-chang-ambient-techno-soft-rave-energy"),
  entry("max-richter-cercle-odyssey-paris"),
  entry("caroline-chang-ambient-techno-zen-out"),
  entry("olafur-arnalds-hafursey-iceland-cercle"),
  entry("caroline-chang-cosy-ambient-techno-fireplace"),
  entry("max-richter-cercle-odyssey-paris"),
  entry("caroline-chang-dreamy-ambient-techno-garden"),
  entry("olafur-arnalds-hafursey-iceland-cercle"),
  entry("caroline-chang-warm-cosmic-dub-techno"),
  entry("max-richter-cercle-odyssey-paris"),
  entry("caroline-chang-zen-mode-electronica-clarity"),
  entry("olafur-arnalds-hafursey-iceland-cercle"),
];
channel("party-champagne-bohemia").schedule = [
  entry("sasha-ibiza-boat-at-sunset-freqways"),
  entry("sasha-renaissance-engage-2020"),
  entry("ben-bohmer-cappadocia-cercle"),
];
channel("video-james-bondage").schedule = [
  entry("u2-numb"),
  entry("the-cranberries-zombie"),
  entry("soundgarden-black-hole-sun"),
  entry("nirvana-smells-like-teen-spirit"),
  entry("rage-against-the-machine-killing-in-the-name-live-1993"),
  entry("linkin-park-in-the-end"),
  entry("linkin-park-numb-official"),
  entry("linkin-park-numb-live-2024"),
  entry("evanescence-bring-me-to-life"),
  entry("charli-xcx-house-john-cale"),
  entry("justice-generator-accor-arena-2024"),
  entry("nine-inch-noize-closer-coachella-2026-live"),
  entry("eminem-lose-yourself"),
];
const modul8Videos = channel("video-modul8-infinity").schedule;
const lisaInsertionIndex = modul8Videos.findIndex(({ track_id: trackId }) => trackId === "pinkpantheress-illegal-glastonbury-2025");
if (lisaInsertionIndex < 0) throw new Error("Could not find the Lisa insertion point");
modul8Videos.splice(lisaInsertionIndex, 0, entry("lisa-rockstar-live"));

const strategicReplacements = new Map([
  ["1:13", "rihanna-global-citizens-festival-2016"],
  ["1:21", "ricardo-villalobos-circoloco-dc10-ibiza-2026"],
  ["2:2", "flume-coachella-2022-live"],
  ["3:4", "fred-again-thomas-bangalter-usb002-alexandra-palace-2026"],
  ["3:22", "skrillex-fred-again-four-tet-coachella"],
]);
const modul8Parties = channel("party-modul8-infinity");
modul8Parties.schedule = modul8Parties.schedule.map((current) => {
  const replacementId = strategicReplacements.get(`${current.global_week_pass}:${current.global_week_position}`);
  return replacementId ? { ...current, track_id: replacementId, duration_seconds: duration(replacementId) } : current;
});
const cycleSeconds = modul8Parties.schedule.reduce((sum, current) => sum + Number(current.duration_seconds), 0);
modul8Parties.global_week_programming = {
  strategy: "four_reordered_passes_with_strategic_premieres_global_daypart_arc",
  anchor_utc: "2026-08-02T14:00:00.000Z",
  distinct_programmes: new Set(modul8Parties.schedule.map(({ track_id: trackId }) => trackId)).size,
  baseline_plays_per_programme: 4,
  strategic_premiere_plays: 1,
  rotated_existing_programmes: 5,
  occurrence_count: modul8Parties.schedule.length,
  cycle_seconds: cycleSeconds,
  approximate_week_variance_seconds: cycleSeconds - (7 * 24 * 60 * 60),
  priority_market: "Australia/Sydney",
  complementary_markets: ["Europe/Madrid", "America/Los_Angeles"],
};
await fs.writeFile(schedulePath, `${JSON.stringify(schedule, null, 2)}\n`);

const durationCheckPath = path.join(root, "tools", "check-broadcast-clock.mjs");
let durationCheck = await fs.readFile(durationCheckPath, "utf8");
for (const definition of definitions) {
  const assertionPattern = new RegExp(`(\\[${JSON.stringify(definition.id)},\\s*)[\\d.]+(\\],)`);
  if (!assertionPattern.test(durationCheck)) {
    throw new Error(`Missing encoded-duration assertion for ${definition.id}`);
  }
  durationCheck = durationCheck.replace(assertionPattern, `$1${records.get(definition.id).duration}$2`);
}
await fs.writeFile(durationCheckPath, durationCheck);

const releaseManifest = {
  accountId: uploadManifest.accountId,
  batchId: "new-videos-2026-08-27",
  sourceBoundary: "Nineteen exact YouTube title/channel records are verified in youtube-branding-ledger-20260827.json. Sasha and Flume are non-YouTube, source-neutral masters: Ben found them through Google Search and recalls VK as the likely host, but no host, URL, uploader, channel, account, or video ID is verified or claimed.",
  brandingLedger: "youtube-branding-ledger-20260827.json",
  brandingVerifiedAt: brandingLedger.checkedAt,
  assetCount: definitions.length,
  totalBytes: definitions.reduce((sum, definition) => sum + Number(records.get(definition.id).size || 0), 0),
  totalDurationSeconds: definitions.reduce((sum, definition) => sum + Number(records.get(definition.id).duration || 0), 0),
  readyToStreamCount: definitions.filter((definition) => records.get(definition.id).readyToStream === true).length,
  verifiedAt: new Date().toISOString(),
  files: Object.fromEntries(definitions.map((definition) => {
    const record = records.get(definition.id);
    return [definition.id, {
      fileName: definition.fileName,
      publicArtist: definition.artist,
      publicTitle: definition.title,
      musicRoom: definition.room,
      format: definition.presentation ? "parties" : "videos",
      size: Number(record.size || 0),
      duration: Number(record.duration),
      uid: record.uid,
      hls: hls(record.uid),
      readyToStream: true,
    }];
  })),
};
await fs.writeFile(releaseManifestPath, `${JSON.stringify(releaseManifest, null, 2)}\n`);

const scheduleSource = await read("broadcast-schedule-v1.json");
const scheduleToken = `broadcast-schedule-${sha12(scheduleSource)}`;
let clock = await read("broadcast-clock-v1.js");
clock = clock.replace(/broadcast-schedule-[a-f0-9]{12}/g, scheduleToken);
await write("broadcast-clock-v1.js", clock);
programmeGuide = await read("programme-guide.js");
programmeGuide = programmeGuide.replace(/broadcast-schedule-[a-f0-9]{12}/g, scheduleToken);
await write("programme-guide.js", programmeGuide);

const trackToken = `music-track-catalogue-${sha12(await read("music-track-catalogue-v1.js"))}`;
const guideToken = `programme-guide-${sha12(await read("programme-guide.js"))}`;
const clockToken = `broadcast-clock-${sha12(await read("broadcast-clock-v1.js"))}`;
for (const name of ["index.html", "index-alt.html", "adaptive-environment-television.html", "program.html"]) {
  let source = await read(name);
  source = source
    .replace(/music-track-catalogue-[a-f0-9]{12}/g, trackToken)
    .replace(/broadcast-clock-[a-f0-9]{12}/g, clockToken);
  if (name !== "adaptive-environment-television.html") {
    source = source.replace(/programme-guide-[a-f0-9]{12}/g, guideToken);
  }
  await write(name, source);
}

const streamToken = `stream-catalogue-${sha12(await read("cloudflare-stream-catalogue.js"))}`;
let shell = await read("script.js");
shell = shell.replace(/stream-catalogue-[a-f0-9]{12}/g, streamToken);
await write("script.js", shell);
let program = await read("program.html");
program = program.replace(/stream-catalogue-[a-f0-9]{12}/g, streamToken);
await write("program.html", program);

const shellToken = `adaptive-env-stream-${sha12(await read("script.js"))}`;
const htmlFiles = (await fs.readdir(iam)).filter((name) => name.endsWith(".html"));
for (const name of htmlFiles) {
  let source = await read(name);
  if (!source.includes("script.js?v=adaptive-env-stream-")) continue;
  source = source.replace(/adaptive-env-stream-[a-f0-9]{12}/g, shellToken);
  await write(name, source);
}

console.log(JSON.stringify({
  assets: definitions.length,
  ready: releaseManifest.readyToStreamCount,
  cycleSeconds,
  scheduleToken,
  trackToken,
  guideToken,
  clockToken,
  streamToken,
  shellToken,
}, null, 2));
