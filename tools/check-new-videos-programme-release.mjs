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

const trackSandbox = { window: {} };
vm.runInNewContext(trackSource, trackSandbox, { filename: "music-track-catalogue-v1.js" });
const tracks = trackSandbox.window.IAMTrackCatalogue.tracks;
const streamSandbox = { window: {} };
vm.runInNewContext(streamSource, streamSandbox, { filename: "cloudflare-stream-catalogue.js" });
const uploads = streamSandbox.window.IAMCloudflareStream.uploads;
const channel = (id) => schedule.channels.find((candidate) => candidate.id === id);

const newIds = [
  "sasha-renaissance-engage-2020",
  "caroline-chase-ambient-techno-soft-rave-energy",
  "caroline-chase-ambient-techno-zen-out",
  "caroline-chase-cosy-ambient-techno-fireplace",
  "caroline-chase-dreamy-ambient-techno-garden",
  "caroline-chase-warm-cosmic-dub-techno",
  "caroline-chase-zen-mode-electronica-clarity",
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

assert.equal(manifest.batchId, "new-videos-2026-08-27");
assert.equal(manifest.assetCount, 21);
assert.equal(manifest.readyToStreamCount, 21);
assert.equal(Object.keys(manifest.files).length, 21);
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
}

assert.equal(schedule.version, "broadcast_schedule_v1.12");
assert.deepEqual(channel("party-champagne-bohemia").schedule.map(({ track_id }) => track_id), [
  "sasha-ibiza-boat-at-sunset-freqways",
  "sasha-renaissance-engage-2020",
  "ben-bohmer-cappadocia-cercle",
]);
assert.deepEqual(channel("party-inner-planes").schedule.map(({ track_id }) => track_id), [
  "caroline-chase-ambient-techno-soft-rave-energy",
  "max-richter-cercle-odyssey-paris",
  "caroline-chase-ambient-techno-zen-out",
  "olafur-arnalds-hafursey-iceland-cercle",
  "caroline-chase-cosy-ambient-techno-fireplace",
  "max-richter-cercle-odyssey-paris",
  "caroline-chase-dreamy-ambient-techno-garden",
  "olafur-arnalds-hafursey-iceland-cercle",
  "caroline-chase-warm-cosmic-dub-techno",
  "max-richter-cercle-odyssey-paris",
  "caroline-chase-zen-mode-electronica-clarity",
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
assert.equal(modul8Parties.schedule.length, 108);
assert.equal(new Set(modul8Parties.schedule.map(({ track_id }) => track_id)).size, 32);
assert.equal(modul8Parties.global_week_programming.strategy, "four_reordered_passes_with_strategic_premieres_global_daypart_arc");
assert.equal(modul8Parties.global_week_programming.priority_market, "Australia/Sydney");
assert.deepEqual(modul8Parties.global_week_programming.complementary_markets, ["Europe/Madrid", "America/Los_Angeles"]);
const expectedReplacements = new Map([
  ["1:13", "rihanna-global-citizens-festival-2016"],
  ["1:21", "ricardo-villalobos-circoloco-dc10-ibiza-2026"],
  ["2:2", "flume-coachella-2022-live"],
  ["3:4", "fred-again-thomas-bangalter-usb002-alexandra-palace-2026"],
  ["3:22", "skrillex-fred-again-four-tet-coachella"],
]);
for (const [position, trackId] of expectedReplacements) {
  const [pass, item] = position.split(":").map(Number);
  assert.equal(modul8Parties.schedule.find(({ global_week_pass, global_week_position }) => global_week_pass === pass && global_week_position === item)?.track_id, trackId);
  assert.equal(modul8Parties.schedule.filter(({ track_id }) => track_id === trackId).length, 1);
}
const rotatedExisting = [
  "anfisa-letyago-dj-mag-hq",
  "cassy-sunday-school-miami",
  "pete-cannon-manchester",
  "lilly-palmer-dj-mag-hq",
  "boys-noize-coachella-2026-live",
];
for (const id of rotatedExisting) assert.equal(modul8Parties.schedule.filter(({ track_id }) => track_id === id).length, 3);
const cycleSeconds = modul8Parties.schedule.reduce((sum, { duration_seconds }) => sum + Number(duration_seconds), 0);
assert.ok(Math.abs(cycleSeconds - modul8Parties.global_week_programming.cycle_seconds) < 0.001);
assert.ok(Math.abs(cycleSeconds - 601325.68) < 2, "The strategic replacement wheel must remain within two seconds of its planned near-week duration");

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

console.log("New videos release checks passed: 21/21 Ready, exact four-room routing, alternating Inner Planes, james bondage flow, Lisa placement, and a strategic 108-slot modul8 global week.");
