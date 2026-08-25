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

assert.match(html, /<section class="program-panel" data-program-panel data-program-standalone/);
assert.doesNotMatch(html, /<video|<audio|data-program-close|program-scrim/i);
assert.match(html, /programme-guide\.css\?v=/);
assert.match(html, /programme-guide\.js\?v=/);
assert.match(html, /broadcast-clock-v1\.js\?v=/);
assert.match(html, /cloudflare-stream-catalogue\.js\?v=/);
assert.ok(html.includes(`program-page.css?v=program-page-css-${sha12("i  a m/program-page.css")}`));
assert.ok(html.includes(`program-page.js?v=program-page-js-${sha12("i  a m/program-page.js")}`));
assert.ok(html.includes(`programme-guide.js?v=programme-guide-${sha12("i  a m/programme-guide.js")}`));
assert.ok(html.includes(`global-navigation.js?v=global-navigation-canonical-14-${sha12("i  a m/global-navigation.js")}`));
assert.ok(html.includes(`mobile-editorial-surface.js?v=mobile-editorial-${sha12("i  a m/mobile-editorial-surface.js")}`));
assert.ok(html.includes(`broadcast-clock-v1.js?v=broadcast-clock-${sha12("i  a m/broadcast-clock-v1.js")}`));
assert.match(html, /data-world-name/);
assert.match(html, /data-world-descriptor/);
assert.match(html, /data-world-description/);
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

assert.match(guide, /const standalone = programPanel\?\.hasAttribute\("data-program-standalone"\)/);
assert.match(guide, /if \(standalone \|\| !document\.body\.classList\.contains\("television-program-open"\)/);
assert.match(guide, /if \(!standalone && item\.previewVideoSrc/);
assert.match(guide, /window\.location\.assign\("induction\.html"\)/);
assert.match(guide, /fetch\("broadcast-schedule-v1\.json/);
assert.match(guide, /fetch\("adaptive-music-video-catalogue-v1\.11\.json/);
assert.match(guide, /fetch\("radio-station-tensor-notion-export-v1\.0\.json/);
assert.match(guide, /setText\("\[data-world-description\]", String\(currentChannel\?\.description/);

assert.match(globalNav, /href="about\.html\?aboutTopLevel=1"[\s\S]{0,180}href="program\.html"/);
assert.equal((globalNav.match(/data-nav-item="program"/g) || []).length, 1);
assert.match(globalNav, /"program\.html": "program"/);
assert.match(globalNavCss, /font-size: clamp\(21px, min\(1\.76vw, 3\.05vh\), 38px\)/);
assert.match(globalNavCss, /letter-spacing: 0\.36em/);
assert.match(mobile, /"program\.html"/);
assert.match(mobile, /"program"/);
assert.match(htaccess, /\(induction\|about\|program\|science/);
assert.match(deployment, /\(induction\|about\|program\|science/);
assert.match(pageCss, /\.program-panel\[data-program-standalone\]/);
assert.match(pageCss, /height: 100dvh/);

const publicChannels = schedule.channels.filter((channel) => ["videos", "parties", "radio"].includes(channel.format));
assert.equal(publicChannels.length, 13);
assert.deepEqual(
  publicChannels.reduce((counts, channel) => ({ ...counts, [channel.format]: (counts[channel.format] || 0) + 1 }), {}),
  { videos: 5, parties: 4, radio: 4 },
);
assert.ok(publicChannels.every((channel) => channel.name && channel.descriptor && channel.description && channel.schedule.length));

new vm.Script(page, { filename: "program-page.js" });
new vm.Script(guide, { filename: "programme-guide.js" });
new vm.Script(globalNav, { filename: "global-navigation.js" });

console.log("Standalone Program page checks passed: shared live data, 13 channels, no media playback surface, mobile route, and compact global navigation.");
