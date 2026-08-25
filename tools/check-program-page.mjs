import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const sha12 = (relativePath) => crypto.createHash("sha256").update(read(relativePath)).digest("hex").slice(0, 12);
const html = read("i  a m/program.html");
const page = read("i  a m/program-page.js");
const pageCss = read("i  a m/program-page.css");
const guide = read("i  a m/programme-guide.js");
const globalNav = read("i  a m/global-navigation.js");
const globalNavCss = read("i  a m/global-navigation.css");
const mobile = read("i  a m/mobile-editorial-surface.js");
const htaccess = read(".htaccess");
const deployment = read("deploy-panthurlive.sh");
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));

assert.match(html, /<section class="public-program" id="program-guide" data-program-guide/);
assert.doesNotMatch(html, /<video|<audio|program-panel|program-scrim/i);
assert.doesNotMatch(html, /programme-guide\.css\?v=|programme-guide\.js\?v=/);
assert.match(html, /broadcast-clock-v1\.js\?v=/);
assert.ok(html.includes(`program-page.css?v=program-page-css-${sha12("i  a m/program-page.css")}`));
assert.ok(html.includes(`program-page.js?v=program-page-js-${sha12("i  a m/program-page.js")}`));
assert.ok(html.includes(`global-navigation.js?v=global-navigation-canonical-14-${sha12("i  a m/global-navigation.js")}`));
assert.ok(html.includes(`mobile-editorial-surface.js?v=mobile-editorial-${sha12("i  a m/mobile-editorial-surface.js")}`));
assert.ok(html.includes(`broadcast-clock-v1.js?v=broadcast-clock-${sha12("i  a m/broadcast-clock-v1.js")}`));

assert.match(html, /I AM is live electronic music television for mental health, together as one\./);
assert.match(html, /Watch one of 13 livestream electronic music and fashion channels across our curated worlds/);
assert.match(html, /<dt>13<\/dt><dd>LIVESTREAM CHANNELS<\/dd>/);
assert.match(html, /<dt>5<\/dt><dd>CURATED WORLDS<\/dd>/);
assert.match(html, /<dt>3<\/dt><dd>VIDEOS \/ PARTIES \/ RADIO<\/dd>/);
assert.match(html, /data-program-worlds/);
assert.match(html, /data-program-range="short"/);
assert.match(html, /data-program-range="day"/);
assert.match(html, /data-enter-live>ENTER LIVE</);

for (const descriptor of [
  "ambient | sleep | sunrise",
  "sunset | chill | eternity",
  "enlightenment thru rave",
  "sex x mindfulness",
]) {
  assert.ok(!html.includes(descriptor), `Program HTML must not duplicate canonical descriptor: ${descriptor}`);
  assert.ok(!page.includes(descriptor), `Program page script must not duplicate canonical descriptor: ${descriptor}`);
}

assert.match(page, /fetch\("broadcast-schedule-v1\.json/);
assert.match(page, /fetch\("adaptive-music-video-catalogue-v1\.11\.json/);
assert.match(page, /fetch\("radio-station-tensor-notion-export-v1\.0\.json/);
assert.match(page, /fetch\("programme-tensor-approved-notion-export-v1\.0\.json/);
assert.match(page, /worldList\.replaceChildren/);
assert.match(page, /scheduleList\.replaceChildren/);
assert.match(page, /activeRange === "day" \? 24 : 6/);
assert.match(page, /window\.location\.assign\("induction\.html"\)/);
assert.match(page, /window\.IAMPublicProgram/);
assert.doesNotMatch(page, /\.play\(|new Audio|createElement\("video"\)/);
assert.match(pageCss, /body\.program-page/);
assert.match(pageCss, /overflow-x: hidden/);
assert.doesNotMatch(pageCss, /body\.program-page[\s\S]{0,220}overflow: hidden/);
assert.match(pageCss, /\.program-worlds[\s\S]{0,160}grid-template-columns/);
assert.match(pageCss, /\.program-schedule__list[\s\S]{0,160}grid-template-columns: repeat\(2/);
assert.match(pageCss, /@media \(max-width: 620px\)/);

assert.match(guide, /const standalone = programPanel\?\.hasAttribute\("data-program-standalone"\)/);
assert.match(globalNav, /href="about\.html\?aboutTopLevel=1"[\s\S]{0,180}href="program\.html"/);
assert.equal((globalNav.match(/data-nav-item="program"/g) || []).length, 1);
assert.match(globalNav, /"program\.html": "program"/);
assert.match(globalNavCss, /font-size: clamp\(21px, min\(1\.76vw, 3\.05vh\), 38px\)/);
assert.match(mobile, /"program\.html"/);
assert.match(mobile, /"program"/);
assert.match(htaccess, /\(induction\|about\|program\|science/);
assert.match(deployment, /\(induction\|about\|program\|science/);

const publicChannels = schedule.channels.filter((channel) => ["videos", "parties", "radio"].includes(channel.format));
assert.equal(publicChannels.length, 13);
assert.deepEqual(
  publicChannels.reduce((counts, channel) => ({ ...counts, [channel.format]: (counts[channel.format] || 0) + 1 }), {}),
  { videos: 5, parties: 4, radio: 4 },
);
assert.equal(new Set(publicChannels.map((channel) => channel.name.toLowerCase())).size, 5);
assert.ok(publicChannels.every((channel) => channel.name && channel.descriptor && channel.description && channel.schedule.length));

new vm.Script(page, { filename: "program-page.js" });
new vm.Script(guide, { filename: "programme-guide.js" });
new vm.Script(globalNav, { filename: "global-navigation.js" });

console.log("Public Program guide checks passed: approved orientation copy, 13 live channels, five worlds, database-driven schedule, no media playback, and responsive document flow.");
