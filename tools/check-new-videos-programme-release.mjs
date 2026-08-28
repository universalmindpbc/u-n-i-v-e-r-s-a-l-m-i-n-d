import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const read = (name) => fs.readFileSync(path.join(iam, name), "utf8");
const sha12 = (source) => crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);

const scheduleSource = read("broadcast-schedule-v1.json");
const schedule = JSON.parse(scheduleSource);
const trackSource = read("music-track-catalogue-v1.js");
const streamSource = read("cloudflare-stream-catalogue.js");
const guideSource = read("programme-guide.js");
const clockSource = read("broadcast-clock-v1.js");
const shellSource = read("script.js");
const televisionSource = read("adaptive-environment-television.js");
const televisionCssSource = read("adaptive-environment-television.css");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "cloudflare-stream-new-videos-20260827-manifest.json"), "utf8"));
const brandingLedger = JSON.parse(fs.readFileSync(path.join(root, "youtube-branding-ledger-20260827.json"), "utf8"));

const trackSandbox = { window: {} };
vm.runInNewContext(trackSource, trackSandbox, { filename: "music-track-catalogue-v1.js" });
const tracks = trackSandbox.window.IAMTrackCatalogue.tracks;
const streamSandbox = { window: {} };
vm.runInNewContext(streamSource, streamSandbox, { filename: "cloudflare-stream-catalogue.js" });
const uploads = streamSandbox.window.IAMCloudflareStream.uploads;
const channel = (id) => schedule.channels.find((candidate) => candidate.id === id);

const newIds = [
  "sasha-renaissance-engage-2020",
  "caroline-chang-ambient-techno-soft-rave-energy",
  "caroline-chang-ambient-techno-zen-out",
  "caroline-chang-cosy-ambient-techno-fireplace",
  "caroline-chang-dreamy-ambient-techno-garden",
  "caroline-chang-warm-cosmic-dub-techno",
  "caroline-chang-zen-mode-electronica-clarity",
  "the-cranberries-zombie",
  "soundgarden-black-hole-sun",
  "rage-against-the-machine-killing-in-the-name-live-1993",
  "nirvana-smells-like-teen-spirit",
  "linkin-park-in-the-end",
  "justice-generator-accor-arena-2024",
  "evanescence-bring-me-to-life",
  "eminem-lose-yourself",
  "flume-coachella-2022-live",
  "fred-again-thomas-bangalter-usb002-alexandra-palace-2026",
  "ricardo-villalobos-circoloco-dc10-ibiza-2026",
  "rihanna-global-citizens-festival-2016",
  "skrillex-fred-again-four-tet-coachella",
  "lisa-rockstar-live",
];

const expectedYouTube = new Map([
  ["sasha-renaissance-engage-2020", ["not_youtube_source", null, null, null, null]],
  ["caroline-chang-ambient-techno-soft-rave-energy", ["verified_title_channel_duration", "S6eVfsCfKT0", "Ambient Techno And Soft Rave Energy", "Techno Llama", "UCU0kmMUZHvFEoYD_puAHQKQ"]],
  ["caroline-chang-ambient-techno-zen-out", ["verified_title_channel_duration", "dO4_w4jq06o", "Ambient Techno To Zen Out To", "Techno Llama", "UCU0kmMUZHvFEoYD_puAHQKQ"]],
  ["caroline-chang-cosy-ambient-techno-fireplace", ["verified_title_channel_duration", "l2HWW72nOu0", "Cosy Ambient Techno By My Fireplace", "Techno Llama", "UCU0kmMUZHvFEoYD_puAHQKQ"]],
  ["caroline-chang-dreamy-ambient-techno-garden", ["verified_title_channel_duration", "XfrJTAW-lAs", "Dreamy Ambient Techno In My Garden", "Techno Llama", "UCU0kmMUZHvFEoYD_puAHQKQ"]],
  ["caroline-chang-warm-cosmic-dub-techno", ["verified_title_channel_duration", "TlKL0kWqg0Q", "Warm Cosmic Dub Techno & Electronica To Remind You Everything Is Going To Be OK", "Techno Llama", "UCU0kmMUZHvFEoYD_puAHQKQ"]],
  ["caroline-chang-zen-mode-electronica-clarity", ["verified_title_channel_duration", "rUBsfWIrSw4", "Zen Mode Electronica Mix For Clarity", "Techno Llama", "UCU0kmMUZHvFEoYD_puAHQKQ"]],
  ["the-cranberries-zombie", ["verified_title_channel_duration", "6Ejga4kJUts", "The Cranberries - Zombie (Official Music Video)", "TheCranberriesTV", "UCF9i903aeMcvcapmP1bS1oA"]],
  ["soundgarden-black-hole-sun", ["verified_title_channel_duration", "3mbBbFH9fAg", "Soundgarden - Black Hole Sun", "Soundgarden", "UCTSuGVPcfBRSZSdP3xQASqg"]],
  ["rage-against-the-machine-killing-in-the-name-live-1993", ["verified_title_channel_duration", "8de2W3rtZsA", "Rage Against The Machine  -  Killing In The Name  -  1993", "Raymond JE", "UCSiVjF5l4MBaQBaKMkUW0-Q"]],
  ["nirvana-smells-like-teen-spirit", ["verified_title_channel_duration", "hTWKbfoikeg", "Nirvana - Smells Like Teen Spirit (Official Music Video)", "Nirvana", "UCzGrGrvf9g8CVVzh_LvGf-g"]],
  ["linkin-park-in-the-end", ["verified_title_channel_duration", "eVTXPUF4Oz4", "In The End [Official HD Music Video] - Linkin Park", "Linkin Park", "UCZU9T1ceaOgwfLRq7OKFU4Q"]],
  ["justice-generator-accor-arena-2024", ["verified_title_channel_duration", "zL8fMWUfRz8", "Justice - Generator (Live at Accor Arena 2024)", "Justice", "UCQ5Ssrs48yJBfOesfDqXUeA"]],
  ["evanescence-bring-me-to-life", ["verified_title_channel_duration", "3YxaaGgTQYM", "Evanescence - Bring Me To Life (Official HD Music Video) ft. Paul McCoy", "Evanescence", "UCDDmukrq0bwckrp09bNt-Rw"]],
  ["eminem-lose-yourself", ["verified_title_channel_duration", "xFYQQPAOz7Y", "Eminem - Lose Yourself", "EminemMusic", "UCfM3zsQsOnfWNUppiycmBuw"]],
  ["flume-coachella-2022-live", ["not_youtube_source", null, null, null, null]],
  ["fred-again-thomas-bangalter-usb002-alexandra-palace-2026", ["verified_title_channel_duration", "gfF8jzBVWvM", "Fred again.. & Thomas Bangalter (USB002, Alexandra Palace, London 27 February 2026)", "Fred again . .", "UCXF6DMVLIVRr2OQAqyfEGeg"]],
  ["ricardo-villalobos-circoloco-dc10-ibiza-2026", ["verified_title_channel_duration", "Lat6ygwFyNE", "Ricardo Villalobos - Live from Circoloco DC-10 Ibiza (20.07.26 Garden)", "CIRCOLOCO", "UCanV1p6ynx_FzdsraKLousQ"]],
  ["rihanna-global-citizens-festival-2016", ["verified_title_channel_duration", "h1qDNYn46ys", "Rihanna - Global Citizens Festival 2016", "GNIGHT", "UC2IIiyNcvgHtLyrSD6CR04g"]],
  ["skrillex-fred-again-four-tet-coachella", ["verified_title_channel_duration", "mOWfB1_yM-c", "Four Tet x Fred again  x Skrillex  Coachella 2023", "Brassado", "UCikU6EsMT1LsBMH4hlgtWHg"]],
  ["lisa-rockstar-live", ["verified_title_channel_duration", "mOLAtBo3mHk", "LISA performing Rockstar live from the Victoria’s Secret Fashion Show 2024", "LLOUD Official", "UC6-BgjsBa5R3PZQ_kZ8hKPg"]],
]);

assert.equal(manifest.batchId, "new-videos-2026-08-27");
assert.equal(manifest.assetCount, 21);
assert.equal(manifest.readyToStreamCount, 21);
assert.equal(Object.keys(manifest.files).length, 21);
assert.equal(manifest.brandingLedger, "youtube-branding-ledger-20260827.json");
assert.equal(brandingLedger.version, "media_provenance_ledger_2026-08-27_v2");
assert.equal(brandingLedger.resolvedCount, 21);
assert.equal(brandingLedger.verifiedYouTubeCount, 19);
assert.equal(brandingLedger.sourceNeutralCount, 2);
assert.equal(brandingLedger.unresolvedCount, 0);
assert.equal(Object.keys(brandingLedger.entries).length, 21);
for (const id of newIds) {
  const record = manifest.files[id];
  assert.ok(record, `${id} is absent from the release manifest`);
  assert.equal(record.readyToStream, true, `${id} is not readyToStream`);
  assert.match(record.uid, /^[a-f0-9]{32}$/, `${id} has an invalid Stream UID`);
  assert.ok(record.duration > 0, `${id} has no verified duration`);
  assert.equal(uploads[record.fileName], record.uid, `${id} is not wired into the Stream filename catalogue`);
  const track = tracks.find((candidate) => candidate.id === id);
  assert.ok(track, `${id} is absent from the television catalogue`);
  assert.equal(track.streamUid, record.uid);
  assert.equal(track.hlsVideoSrc, record.hls);
  assert.equal(track.musicRoom, record.musicRoom);
  assert.match(guideSource, new RegExp(`${JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`));
  assert.deepEqual([track.artist, track.title], [record.publicArtist, record.publicTitle], `${id} public display differs from the verified manifest`);
  const branding = brandingLedger.entries[id];
  assert.ok(branding, `${id} is absent from the YouTube branding ledger`);
  assert.deepEqual([branding.fileName, branding.publicArtist, branding.publicTitle], [record.fileName, record.publicArtist, record.publicTitle]);
  assert.ok(Math.abs(branding.youtube.localDurationSeconds - record.duration) < 0.001, `${id} ledger duration differs from Stream`);
  const [status, videoId, title, sourceChannel, channelId] = expectedYouTube.get(id);
  assert.deepEqual(
    [branding.youtube.status, branding.youtube.videoId, branding.youtube.title, branding.youtube.channel, branding.youtube.channelId],
    [status, videoId, title, sourceChannel, channelId],
    `${id} does not retain the audited YouTube title/channel record`,
  );
  if (status === "verified_title_channel_duration") {
    assert.ok(branding.youtube.durationDeltaSeconds <= 1, `${id} does not duration-match its YouTube source`);
    assert.equal(branding.youtube.url, `https://www.youtube.com/watch?v=${videoId}`);
  }
}

const technoLlamaTitles = new Map([
  ["caroline-chang-ambient-techno-soft-rave-energy", "Ambient Techno And Soft Rave Energy"],
  ["caroline-chang-ambient-techno-zen-out", "Ambient Techno To Zen Out To"],
  ["caroline-chang-cosy-ambient-techno-fireplace", "Cosy Ambient Techno By My Fireplace"],
  ["caroline-chang-dreamy-ambient-techno-garden", "Dreamy Ambient Techno In My Garden"],
  ["caroline-chang-warm-cosmic-dub-techno", "Warm Cosmic Dub Techno & Electronica To Remind You Everything Is Going To Be OK"],
  ["caroline-chang-zen-mode-electronica-clarity", "Zen Mode Electronica Mix For Clarity"],
]);
for (const [id, title] of technoLlamaTitles) {
  const record = manifest.files[id];
  const track = tracks.find((candidate) => candidate.id === id);
  assert.deepEqual([record.publicArtist, record.publicTitle], ["Caroline Chang (Techno Llama)", title]);
  assert.deepEqual([track.artist, track.title, track.displayTitle], ["Caroline Chang (Techno Llama)", title, title]);
  assert.ok(guideSource.includes(`${JSON.stringify(id)}: { artist: "Caroline Chang (Techno Llama)", title: ${JSON.stringify(title)} }`));
}
for (const id of ["sasha-renaissance-engage-2020", "flume-coachella-2022-live"]) {
  const entry = brandingLedger.entries[id];
  assert.equal(entry.provenance.status, "source_neutral_non_youtube");
  assert.equal(entry.provenance.discoveryMethod, "Google Search");
  assert.equal(entry.provenance.likelyHost, "VK");
  assert.equal(entry.provenance.likelyHostVerification, "unverified_user_recollection");
  assert.equal(entry.provenance.verifiedUrl, null);
  assert.equal(entry.provenance.verifiedUploader, null);
  assert.equal(entry.youtube.status, "not_youtube_source");
  assert.equal(entry.youtube.videoId, null);
  assert.equal(entry.youtube.channel, null);
  assert.equal(entry.youtube.url, null);
}
assert.doesNotMatch(
  JSON.stringify([brandingLedger.entries["sasha-renaissance-engage-2020"], brandingLedger.entries["flume-coachella-2022-live"]]),
  /WatchTheDJ|OFNz5iaLJvI|youtube\.com|vk\.com/i,
  "source-neutral records retain an invented or superseded provenance claim",
);
assert.equal(manifest.files["sasha-renaissance-engage-2020"].publicTitle, "Renaissance Engage (10 May 2020)");
assert.equal(manifest.files["flume-coachella-2022-live"].publicTitle, "Live at Coachella 2022");
const rejectedBrandingPattern = new RegExp([
  ["Caroline", "Chase"].join(" "),
  ["The", "Techno", "Llama"].join(" "),
  ["caroline", "chase"].join("-"),
].join("|"));
for (const name of [
  "cloudflare-stream-new-videos-20260827-manifest.json",
  "youtube-branding-ledger-20260827.json",
  "i  a m/broadcast-schedule-v1.json",
  "i  a m/music-track-catalogue-v1.js",
  "i  a m/programme-guide.js",
  "tools/apply-new-videos-programme-release.mjs",
  "tools/check-broadcast-clock.mjs",
  "tools/check-new-videos-programme-release.mjs",
]) {
  assert.doesNotMatch(fs.readFileSync(path.join(root, name), "utf8"), rejectedBrandingPattern, `${name} retains rejected branding`);
}

assert.equal(schedule.version, "broadcast_schedule_v1.14");
assert.deepEqual(channel("party-champagne-bohemia").schedule.map(({ track_id }) => track_id), [
  "sasha-ibiza-boat-at-sunset-freqways",
  "sasha-renaissance-engage-2020",
  "ben-bohmer-cappadocia-cercle",
]);
assert.deepEqual(channel("party-inner-planes").schedule.map(({ track_id }) => track_id), [
  "caroline-chang-ambient-techno-soft-rave-energy",
  "max-richter-cercle-odyssey-paris",
  "caroline-chang-ambient-techno-zen-out",
  "olafur-arnalds-hafursey-iceland-cercle",
  "caroline-chang-cosy-ambient-techno-fireplace",
  "max-richter-cercle-odyssey-paris",
  "caroline-chang-dreamy-ambient-techno-garden",
  "olafur-arnalds-hafursey-iceland-cercle",
  "caroline-chang-warm-cosmic-dub-techno",
  "max-richter-cercle-odyssey-paris",
  "caroline-chang-zen-mode-electronica-clarity",
  "olafur-arnalds-hafursey-iceland-cercle",
]);
assert.deepEqual(channel("video-james-bondage").schedule.map(({ track_id }) => track_id), [
  "u2-numb",
  "the-cranberries-zombie",
  "soundgarden-black-hole-sun",
  "nirvana-smells-like-teen-spirit",
  "rage-against-the-machine-killing-in-the-name-live-1993",
  "linkin-park-in-the-end",
  "linkin-park-numb-official",
  "linkin-park-numb-live-2024",
  "evanescence-bring-me-to-life",
  "charli-xcx-house-john-cale",
  "justice-generator-accor-arena-2024",
  "nine-inch-noize-closer-coachella-2026-live",
  "eminem-lose-yourself",
]);
const modul8Videos = channel("video-modul8-infinity").schedule.map(({ track_id }) => track_id);
const lisaIndex = modul8Videos.indexOf("lisa-rockstar-live");
assert.ok(lisaIndex > 0);
assert.equal(modul8Videos[lisaIndex - 1], "sampa-the-great-energy");
assert.equal(modul8Videos[lisaIndex + 1], "pinkpantheress-illegal-glastonbury-2025");
const lisa = tracks.find(({ id }) => id === "lisa-rockstar-live");
assert.deepEqual([lisa.artist, lisa.title], ["Lisa", "Rockstar Live"]);

const modul8Parties = channel("party-modul8-infinity");
assert.equal(modul8Parties.schedule.length, 128);
assert.equal(new Set(modul8Parties.schedule.map(({ track_id }) => track_id)).size, 32);
assert.equal(modul8Parties.global_week_programming.strategy, "four_complete_32_programme_rotations_contextual_global_daypart_arc");
assert.equal(modul8Parties.global_week_programming.priority_market, "Australia/Sydney");
assert.deepEqual(modul8Parties.global_week_programming.complementary_markets, ["Europe/Madrid", "America/Los_Angeles"]);
for (const id of newIds.slice(15, 20)) assert.equal(modul8Parties.schedule.filter(({ track_id }) => track_id === id).length, 4);
for (let pass = 1; pass <= 4; pass += 1) {
  const passEntries = modul8Parties.schedule.filter(({ global_week_pass }) => global_week_pass === pass);
  assert.equal(passEntries.length, 32);
  assert.equal(new Set(passEntries.map(({ track_id }) => track_id)).size, 32);
  assert.deepEqual(passEntries.map(({ global_week_position }) => global_week_position), Array.from({ length: 32 }, (_, index) => index + 1));
}
const cycleSeconds = modul8Parties.schedule.reduce((sum, { duration_seconds }) => sum + Number(duration_seconds), 0);
assert.ok(Math.abs(cycleSeconds - modul8Parties.global_week_programming.cycle_seconds) < 0.001);
assert.ok(Math.abs(cycleSeconds - 700317.8) < .01, "The restored 32 by 4 wheel must retain all full encoded durations");

const scheduleToken = `broadcast-schedule-${sha12(scheduleSource)}`;
assert.ok(clockSource.includes(scheduleToken));
assert.ok(guideSource.includes(scheduleToken));
const trackToken = `music-track-catalogue-${sha12(trackSource)}`;
const guideToken = `programme-guide-${sha12(guideSource)}`;
const clockToken = `broadcast-clock-${sha12(clockSource)}`;
const streamToken = `stream-catalogue-${sha12(streamSource)}`;
const shellToken = `adaptive-env-stream-${sha12(shellSource)}`;
const televisionToken = `music-tv-${sha12(televisionSource)}`;
const televisionCssToken = `music-tv-css-${sha12(televisionCssSource)}`;
for (const name of ["index.html", "index-alt.html", "adaptive-environment-television.html", "program.html"]) {
  const source = read(name);
  assert.ok(source.includes(trackToken), `${name} has a stale music catalogue token`);
  assert.ok(source.includes(clockToken), `${name} has a stale broadcast-clock token`);
}
for (const name of ["index.html", "index-alt.html", "adaptive-environment-television.html"]) {
  const source = read(name);
  assert.ok(source.includes(televisionToken), `${name} has a stale television-controller token`);
  assert.ok(source.includes(televisionCssToken), `${name} has a stale television CSS token`);
}
for (const name of ["index.html", "index-alt.html", "program.html"]) assert.ok(read(name).includes(guideToken), `${name} has a stale Program token`);
assert.ok(shellSource.includes(streamToken));
assert.ok(read("program.html").includes(streamToken));
for (const name of fs.readdirSync(iam).filter((candidate) => candidate.endsWith(".html"))) {
  const source = read(name);
  if (source.includes("script.js?v=adaptive-env-stream-")) assert.ok(source.includes(shellToken), `${name} has a stale shell token`);
}

console.log("New videos release checks passed: 21/21 Ready, exact four-room routing, alternating Inner Planes, james bondage flow, Lisa placement, and a complete 128-slot modul8 global cycle.");
