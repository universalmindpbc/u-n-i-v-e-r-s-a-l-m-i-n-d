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
const index = read("i  a m/index.html");
const pageCss = read("i  a m/program-page.css");
const guide = read("i  a m/programme-guide.js");
const guideCss = read("i  a m/programme-guide.css");
const programmeCatalogue = read("i  a m/programme-catalogue-v1.js");
const comedyChannel = read("i  a m/comedy-channel-v1.js");
const comedyCss = read("i  a m/comedy-channel-v1.css");
const navigation = read("i  a m/program-navigation.js");
const catalogueSource = read("i  a m/music-track-catalogue-v1.js");
const controller = read("i  a m/adaptive-environment-television.js");
const globalNav = read("i  a m/global-navigation.js");
const mobile = read("i  a m/mobile-editorial-surface.js");
const htaccess = read(".htaccess");
const deployment = read("deploy-panthurlive.sh");
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));

assert.match(html, /<video autoplay muted playsinline loop preload="metadata" src="a s s e t s\/business-model\/dua-lipa-glastonbury-2017-silent-loop\.mp4\?v=154285b9dbe2"><\/video>/);
assert.equal((html.match(/<video\b/g) || []).length, 1, "the only standalone autoplay video must be the silent decorative background");
assert.match(pageCss, /\.program-page__background[\s\S]{0,220}position: fixed/);
assert.match(pageCss, /\.program-page__background video[\s\S]{0,180}object-fit: cover/);
assert.match(pageCss, /\.program-introduction[\s\S]{0,420}background: rgba\(0, 0, 0, 0\.84\)/);

assert.match(html, /Universal Mind is live electronic music television for mental health, together as one\./);
assert.match(html, /<strong>Videos:<\/strong> 24\/7 livestream electronic music videos\./);
assert.match(html, /<strong>Parties:<\/strong> 24\/7 livestream DJ sets, live performances and festivals\./);
assert.match(html, /<strong>Radio:<\/strong> a 24\/7 livestream mix of electronic music stations paired with fashion runway shows\./);
assert.match(html, /Your voluntary check-in - <strong>self-report plus Heart Rate<\/strong> - helps I AM select a <strong>music channel and evidence-based brain entrainment profile<\/strong> for that moment\./);
assert.match(html, /Watch one of 13 livestream electronic music and fashion channels across our curated worlds/);
assert.doesNotMatch(html, /<dt>13<\/dt>|<dt>5<\/dt>|<dt>3<\/dt>|CURATED WORLDS|VIDEOS \/ PARTIES \/ RADIO/);

assert.match(html, /<section class="program-panel" id="program-panel" data-program-panel data-program-standalone/);
assert.match(html, /class="program-mode-switcher" role="tablist"/);
assert.equal((html.match(/data-program-mode="(?:videos|parties|radio|sex-ed|comedy)"/g) || []).length, 5);
assert.match(html, /data-program-mode="sex-ed"[^>]*>SEX ED/);
assert.match(html, /data-program-mode="comedy"[^>]*>COMEDY/);
assert.match(html, /data-program-channel-rail/);
assert.match(html, /data-program-history/);
assert.match(html, /data-later-list/);
assert.match(html, /data-program-channels/);
assert.match(html, /data-program-more/);
assert.match(html, /data-enter-live>ENTER LIVE/);
assert.match(navigation, /body\.classList\.add\("nav-open"\)/);
assert.match(navigation, /nav\.classList\.add\("is-open"\)/);
assert.match(navigation, /submenus\.has\(itemName\)/);
assert.ok(html.includes(`program-navigation.js?v=program-navigation-${sha12("i  a m/program-navigation.js")}`));
assert.match(guideCss, /\.program-mode-switcher[\s\S]{0,180}border: 1px solid/);
assert.match(guideCss, /\.program-mode-switcher button\[aria-selected="true"\][\s\S]{0,120}background: rgba\(255, 255, 255, 0\.94\)/);
assert.match(guideCss, /button\.program-mode-switcher__secondary[\s\S]{0,140}min-width: 52px/);
assert.match(pageCss, /\.program-panel\[data-program-standalone\][\s\S]{0,260}width: min\(1240px, calc\(100vw - 64px\)\)/);
assert.match(pageCss, /height: calc\(100dvh - \(var\(--program-top-inset\) \* 2\)\)/);
assert.match(pageCss, /opacity: 1;[\s\S]{0,80}pointer-events: auto;[\s\S]{0,80}transform: none/);

assert.ok(html.includes(`program-page.css?v=program-page-css-${sha12("i  a m/program-page.css")}`));
assert.ok(html.includes(`programme-guide.css?v=programme-guide-css-${sha12("i  a m/programme-guide.css")}`));
assert.ok(html.includes(`music-track-catalogue-v1.js?v=music-track-catalogue-${sha12("i  a m/music-track-catalogue-v1.js")}`));
assert.ok(html.includes(`programme-guide.js?v=programme-guide-${sha12("i  a m/programme-guide.js")}`));
assert.ok(html.includes(`broadcast-clock-v1.js?v=broadcast-clock-${sha12("i  a m/broadcast-clock-v1.js")}`));

const catalogueSandbox = { window: {} };
vm.runInNewContext(catalogueSource, catalogueSandbox, { filename: "music-track-catalogue-v1.js" });
const tracks = Array.from(catalogueSandbox.window.IAMTrackCatalogue?.tracks || []);
const trackById = new Map(tracks.map((track) => [track.id, track]));
const safetyChannel = schedule.channels.find((channel) => channel.id === "video-safety-cushion");
assert.equal(safetyChannel?.schedule.length, 21);
for (const entry of safetyChannel.schedule) {
  const track = trackById.get(entry.track_id);
  assert.ok(track?.artist && track.artist !== "Universal Mind" && track?.title && track?.localVideoSrc, `${entry.track_id} must use canonical shared metadata`);
}
assert.equal(trackById.get("the-church-under-the-milky-way")?.artist, "The Church");
assert.equal(trackById.get("toto-africa")?.artist, "Toto");
assert.equal(trackById.get("peter-gabriel-sledgehammer")?.artist, "Peter Gabriel");
assert.equal(trackById.get("dig-two-way-dreamtime")?.artist, "D.I.G.");
assert.match(controller, /window\.IAMTrackCatalogue\?\.tracks/);
assert.ok(index.indexOf("music-track-catalogue-v1.js") < index.indexOf("adaptive-environment-television.js"));
assert.ok(html.indexOf("music-track-catalogue-v1.js") < html.indexOf("programme-guide.js"));
assert.ok(html.indexOf("programme-catalogue-v1.js") < html.indexOf("programme-guide.js"));
assert.match(guide, /Array\.isArray\(window\.IAMTrackCatalogue\?\.tracks\)/);
assert.match(guide, /local_video_file: track\.localVideoSrc/);
assert.match(guide, /stream_uid: track\.streamUid/);

const publicChannels = schedule.channels.filter((channel) => ["videos", "parties", "radio"].includes(channel.format));
assert.equal(publicChannels.length, 13);
assert.deepEqual(
  publicChannels.reduce((counts, channel) => ({ ...counts, [channel.format]: (counts[channel.format] || 0) + 1 }), {}),
  { videos: 5, parties: 4, radio: 4 },
);
assert.deepEqual(
  schedule.channels.filter((channel) => ["sex-ed", "comedy"].includes(channel.format) && channel.internal !== true).map((channel) => channel.id),
  ["comedy-jarrad-wright", "sex-ed-james-bondage"],
);
assert.ok(schedule.channels.filter((channel) => channel.editorial_id === "modul8-infinity")
  .every((channel) => channel.description === "Rave · house · techno · future bass"));
assert.doesNotMatch(JSON.stringify(schedule), /future psychedelic beats|hiphop/i);

assert.match(guide, /const standalone = programPanel\?\.hasAttribute\("data-program-standalone"\)/);
assert.match(guide, /window\.location\.assign\("index\.html\?comedy=1"\)/);
assert.match(guide, /window\.location\.assign\(`index\.html\?sexEdEpisode=/);
assert.match(guide, /window\.location\.assign\("induction\.html"\)/);
assert.match(guide, /if \(!standalone && item\.previewVideoSrc/);
assert.match(index, /data-comedy-world/);
assert.match(comedyCss, /\.adaptive-television-comedy-video[\s\S]{0,260}width: 100%;[\s\S]{0,120}height: 100%;[\s\S]{0,180}object-fit: cover/);
assert.match(comedyChannel, /totalComedySeconds/);
assert.match(comedyChannel, /suspendProgrammeForPresentation/);
assert.match(controller, /window\.IAMSexEdProgramme/);
assert.match(globalNav, /href="about\.html\?aboutTopLevel=1"[\s\S]{0,180}href="program\.html"/);
assert.equal((globalNav.match(/data-nav-item="program"/g) || []).length, 1);
assert.match(mobile, /"program\.html"/);
assert.match(htaccess, /\(induction\|about\|program\|science/);
assert.match(deployment, /\(induction\|about\|program\|science/);

new vm.Script(guide, { filename: "programme-guide.js" });
new vm.Script(programmeCatalogue, { filename: "programme-catalogue-v1.js" });
new vm.Script(comedyChannel, { filename: "comedy-channel-v1.js" });
new vm.Script(controller, { filename: "adaptive-environment-television.js" });
new vm.Script(globalNav, { filename: "global-navigation.js" });

console.log("Public Program checks passed: approved orientation copy, silent full-screen motion, exact app guide, shared artist metadata, 13 live channels, and responsive full-height casing.");
