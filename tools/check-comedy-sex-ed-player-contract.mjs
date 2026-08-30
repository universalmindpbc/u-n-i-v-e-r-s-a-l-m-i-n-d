import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const index = read("i  a m/index.html");
const program = read("i  a m/program.html");
const guide = read("i  a m/programme-guide.js");
const guideCss = read("i  a m/programme-guide.css");
const comedy = read("i  a m/comedy-channel-v1.js");
const comedyCss = read("i  a m/comedy-channel-v1.css");
const television = read("i  a m/adaptive-environment-television.js");
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));

for (const html of [index, program]) {
  assert.equal((html.match(/role="tab" data-program-mode="(?:videos|parties|radio)"/g) || []).length, 3);
  assert.match(html, /class="program-destination-switcher"[\s\S]{0,260}data-program-mode="comedy"[\s\S]{0,180}data-program-sex-ed[^>]*>SEX-ED/);
  assert.doesNotMatch(html, /data-program-mode="sex-ed"|>SEX ED</);
}
assert.match(guideCss, /\.program-panel__header[\s\S]{0,160}grid-template-columns: minmax\(360px, 1fr\) auto auto 34px/);
assert.match(guideCss, /\.program-destination-switcher[\s\S]{0,180}justify-self: end/);
assert.match(guide, /const MODES = \["videos", "parties", "radio", "comedy"\]/);
assert.match(guide, /function openSexEdCatalogue\(event\)[\s\S]{0,500}window\.IAMSexEdProgramme\?\.openShelf\?\.\(\)/);
assert.match(guide, /window\.location\.assign\("index\.html\?sexEd=1"\)/);
assert.doesNotMatch(guide, /activeMode === "sex-ed"|sexEdEpisode=/);

assert.match(index, /data-comedy-world/);
assert.doesNotMatch(index, /data-comedy-close|data-comedy-now/);
assert.match(index, /data-television-live-pill/);
assert.match(index, /data-reaction-wallet/);
assert.match(television, /timecode\.className = "adaptive-television-timecode"/);
assert.match(comedyCss, /\.adaptive-television-comedy-world[\s\S]{0,100}z-index: 6/);
assert.match(comedyCss, /transform: scale\(var\(--comedy-crop-scale, 1\)\)/);
assert.match(comedyCss, /body\.television-comedy-active \.adaptive-television-timecode[\s\S]{0,80}opacity: 1 !important/);
assert.match(comedy, /function analyseEncodedBars\(\)/);
assert.match(comedy, /dataset\.comedyCropScale/);
assert.match(comedy, /dataset\.comedyNowPlayingLabel/);
assert.match(comedy, /leaveForNavigation\(\)/);
assert.match(television, /function currentComedyNowPlaying\(\)/);
assert.match(television, /nowPlaying\.dataset\.nowPlayingMode = comedyProgramme \? "comedy"/);
assert.match(television, /refreshViewingState\(\)[\s\S]{0,160}updateTimecode\(\);[\s\S]{0,80}updateNowPlaying\(\)/);
assert.match(television, /await window\.IAMComedyChannel\?\.leaveForNavigation\?\.\(\)/);

assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 16);
assert.match(index, /<p>16 lessons<\/p>/);
assert.match(index, /data-sex-ed-shell-start[^>]*hidden/);
assert.match(television, /const requestedSexEdShelf = entryParams\.get\("sexEd"\) === "1"/);
assert.match(television, /function bootstrapRequestedSexEdShelf\(\)[\s\S]{0,420}openSexEdShelf\(\)/);
assert.equal(schedule.channels.some((channel) => channel.id === "sex-ed-james-bondage"), false);
const privateSexEdAudio = schedule.channels.find((channel) => channel.id === "sex-ed");
assert.equal(privateSexEdAudio?.internal, true);
assert.deepEqual(privateSexEdAudio.schedule.map((entry) => entry.track_id), [
  "zip-perlon-air-festival-2007",
  "zip-sammy-d-perlon-betalounge-2000",
]);
assert.match(television, /const SEX_ED_PROGRAMME_MIX_LEVEL = \.15/);
assert.match(television, /document\.body\.dataset\.sexEdBackgroundAudible === "true"/);
assert.match(television, /document\.body\.dataset\.sexEdSyncLayers === "true"/);

console.log("Comedy canonical player and on-demand Sex-Ed contracts passed.");
