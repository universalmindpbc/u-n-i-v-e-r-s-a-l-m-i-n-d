import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const html = fs.readFileSync(path.join(iam, "index.html"), "utf8");
const altHtml = fs.readFileSync(path.join(iam, "index-alt.html"), "utf8");
const controller = fs.readFileSync(path.join(iam, "adaptive-environment-television.js"), "utf8");
const styles = fs.readFileSync(path.join(iam, "adaptive-environment-television.css"), "utf8");
const gifRuntime = fs.readFileSync(path.join(iam, "emdr-gif-world.js"), "utf8");
const library = fs.readFileSync(path.join(iam, "emdr-modul8-gif-library.html"), "utf8");
const schedule = JSON.parse(fs.readFileSync(path.join(iam, "broadcast-schedule-v1.json"), "utf8"));
const sourceDirectory = path.join(iam, "a s s e t s", "a n i m a t e d [ g i f s ]", "modul8 infinity [ i o h  e m d r ]");
const manualLeadDirectory = path.join(iam, "a s s e t s", "a n i m a t e d [ g i f s ]", "m 8 - e m d r  g i f  - s l i d e  1");
const manualLeadRelativeDirectory = "a s s e t s/a n i m a t e d [ g i f s ]/m 8 - e m d r  g i f  - s l i d e  1";
const originalRelativeDirectory = "a s s e t s/a n i m a t e d [ g i f s ]/modul8 infinity [ i o h  e m d r ]";
const manualLeadFiles = ["1.gif", "2.gif", "3.gif", "4.gif", "5.gif", "6.gif"];
const originalM8Files = [
  "ioh-emdr-giphy-22.gif", "ioh-emdr-giphy-03.gif", "ioh-emdr-giphy-12.gif",
  "ioh-emdr-giphy-01.gif", "ioh-emdr-giphy-02.gif", "ioh-emdr-giphy-04.gif",
  "ioh-emdr-giphy-05.gif", "ioh-emdr-giphy-06.gif", "ioh-emdr-giphy-07.gif",
  "ioh-emdr-giphy-08.gif", "ioh-emdr-giphy-09.gif", "ioh-emdr-giphy-10.gif",
  "ioh-emdr-giphy-11.gif", "ioh-emdr-giphy-13.gif", "ioh-emdr-giphy-14.gif",
  "ioh-emdr-giphy-15.gif", "ioh-emdr-giphy-16.gif", "ioh-emdr-giphy-17.gif",
  "ioh-emdr-giphy-18.gif", "ioh-emdr-giphy-19.gif", "ioh-emdr-giphy-20.gif",
  "ioh-emdr-giphy-21.gif", "ioh-emdr-giphy-23.gif", "ioh-emdr-giphy-24.gif",
  "ioh-emdr-giphy-25.gif", "ioh-emdr-giphy-26.gif", "ioh-emdr-giphy-27.gif",
  "ioh-emdr-giphy-28.gif", "ioh-emdr-giphy-29.gif", "ioh-emdr-giphy-30.gif",
  "ioh-emdr-giphy-32.gif", "ioh-emdr-giphy-33.gif", "ioh-emdr-hexeosis.gif",
];
const expectedManualMasters = new Map([
  ["1.gif", { bytes: 944854, width: 500, height: 500, frames: 24, frameDelayCentiseconds: 4, durationCentiseconds: 96, sha256: "5a78676f3e825788edb52fda6742adb997843c8d63946433b5abbf8bb052e805" }],
  ["2.gif", { bytes: 802135, width: 500, height: 500, frames: 36, frameDelayCentiseconds: 4, durationCentiseconds: 144, sha256: "911515e8a61c4465abb340ffba3276b166e02a7fd584a2c75b5da82d03b2794c" }],
  ["3.gif", { bytes: 14739692, width: 540, height: 540, frames: 180, frameDelayCentiseconds: 2, durationCentiseconds: 360, sha256: "775ecd323a35c570aa584bf7d84b28760324dadade54ddcadb44e5a08fe39fab" }],
  ["4.gif", { bytes: 1340624, width: 540, height: 540, frames: 18, frameDelayCentiseconds: 4, durationCentiseconds: 72, sha256: "7a18abf8550fefd3d83b31e0c4d1f4a72aa9876f416c18ce926e9dcb3c1e0544" }],
  ["5.gif", { bytes: 1382285, width: 540, height: 540, frames: 72, frameDelayCentiseconds: 4, durationCentiseconds: 288, sha256: "bea6e89235a1b6282120e1902cf67e7f200f23f1968f6ff5b5de0411e53afefa" }],
  ["6.gif", { bytes: 970076, width: 540, height: 540, frames: 24, frameDelayCentiseconds: 4, durationCentiseconds: 96, sha256: "878ae5ebde15e1201bf42832949613af779bf899d862f27d1dff56dbf45b6471" }],
]);

const expectedButtons = [
  { index: 0, key: "cb", label: "CB" },
  { index: 1, key: "m8", label: "M8" },
  { index: 2, key: "jbh-i", label: "JBH i" },
  { index: 3, key: "jbh-ii", label: "JBH ii" },
  { index: 4, key: "jbh-iii", label: "JBH iii" },
  { index: 5, key: "stella", label: "Stella" },
];

for (const page of [html, altHtml]) {
  expectedButtons.forEach(({ index, key, label }) => {
    assert.match(page, new RegExp(`data-emdr-style-index="${index}" data-emdr-preset="${key}"[^>]*>${label}<\\/button>`));
  });
  assert.match(page, /data-emdr-preset="cb" data-emdr-tooltip="Champagne Bohemia — Xaviera Lopez’s animated GIF experience\."/);
  assert.match(page, /data-emdr-preset="m8" data-emdr-tooltip="modul8 infinity — Hexeosis animated GIF experience\."/);
  assert.match(page, /data-emdr-preset="jbh-i" data-emdr-tooltip="James Bondage Health — Bordelle animated GIF experience\."/);
  assert.match(page, /data-emdr-preset="jbh-ii" data-emdr-tooltip="James Bondage Health — Pirelli 2010 and Shashi Solana — healing sexual trauma in nature\."/);
  assert.match(page, /data-emdr-preset="jbh-iii" data-emdr-tooltip="James Bondage Health — Karl Lagerfeld and Shashi Solana — dissolving toxic masculinity\."/);
  assert.match(page, /data-emdr-preset="stella" data-emdr-tooltip="Stella geometric experience\."/);
  assert.doesNotMatch(page, /data-emdr-tooltip="[^"]*Rave animated GIF experience\.?"/i);
  assert.doesNotMatch(page, /data-emdr-tooltip="Bordelle video experience\."/);
  assert.doesNotMatch(page, /data-emdr-tooltip="[^"]*video experience\.?"/);
  assert.equal((page.match(/data-emdr-gif-preset-label=/g) || []).length, 5);
  assert.match(page, /data-jbh-content-gate/);
  assert.match(page, /I am 18 or older — continue/);
}

const rootStart = html.indexOf('data-emdr-gif-world');
const rootEnd = html.indexOf('adaptive-television-emdr-gif-casing', rootStart);
const gifWorldMarkup = html.slice(rootStart, rootEnd);
const presetMarkup = (key) => gifWorldMarkup.match(new RegExp(`data-emdr-gif-preset="${key}"[\\s\\S]*?(?=<div class="adaptive-television-emdr-gif-grid"|$)`))?.[0] || "";
const cbMarkup = presetMarkup("cb");
const m8Markup = presetMarkup("m8");
const jbhMarkups = ["jbh-i", "jbh-ii", "jbh-iii"].map(presetMarkup);
const altRootStart = altHtml.indexOf('data-emdr-gif-world');
const altRootEnd = altHtml.indexOf('adaptive-television-emdr-gif-casing', altRootStart);
const altGifWorldMarkup = altHtml.slice(altRootStart, altRootEnd);
const altM8Markup = altGifWorldMarkup.match(/data-emdr-gif-preset="m8"[\s\S]*?(?=<div class="adaptive-television-emdr-gif-grid"|$)/)?.[0] || "";
const m8Pages = [...m8Markup.matchAll(/<div class="adaptive-television-emdr-gif-page" data-emdr-gif-page>([\s\S]*?)<\/div>/g)].map((match) => match[1]);
const altM8Pages = [...altM8Markup.matchAll(/<div class="adaptive-television-emdr-gif-page" data-emdr-gif-page>([\s\S]*?)<\/div>/g)].map((match) => match[1]);
assert.equal((cbMarkup.match(/data-emdr-gif-tile/g) || []).length, 6);
assert.equal((m8Markup.match(/data-emdr-gif-tile/g) || []).length, 39);
assert.equal((altM8Markup.match(/data-emdr-gif-tile/g) || []).length, 39);
assert.deepEqual(m8Pages.map((page) => (page.match(/data-emdr-gif-tile/g) || []).length), [6, 6, 6, 6, 6, 6, 3]);
assert.deepEqual(altM8Pages.map((page) => (page.match(/data-emdr-gif-tile/g) || []).length), [6, 6, 6, 6, 6, 6, 3]);
assert.match(m8Pages.at(-1), /data-emdr-gif-boxed[^>]*ioh-emdr-hexeosis\.gif/);
assert.match(altM8Pages.at(-1), /data-emdr-gif-boxed[^>]*ioh-emdr-hexeosis\.gif/);
jbhMarkups.forEach((jbhMarkup) => {
  assert.equal((jbhMarkup.match(/data-emdr-gif-tile/g) || []).length, 6);
  assert.equal((jbhMarkup.match(/<video /g) || []).length, 4);
  assert.equal((jbhMarkup.match(/<img /g) || []).length, 2);
});
assert.match(html, /data-emdr-jbh-background/);
assert.match(html, /data-emdr-jbh-foreground/);
assert.match(m8Markup, /data-emdr-gif-scroll/);
assert.match(m8Markup, /data-emdr-gif-progressive/);
assert.equal((m8Markup.match(/loading="eager"/g) || []).length, 6);
assert.equal((m8Markup.match(/loading="lazy"/g) || []).length, 33);

const expectedM8Sources = [
  ...manualLeadFiles.map((name) => `${manualLeadRelativeDirectory}/${name}`),
  ...originalM8Files.map((name) => `${originalRelativeDirectory}/${name}`),
];
const readM8Sources = (markup) => [...markup.matchAll(/data-emdr-gif-tile[^>]*data-src="([^"]+\.gif)"/g)].map((match) => match[1]);
const m8Sources = readM8Sources(m8Markup);
assert.deepEqual(m8Sources, expectedM8Sources);
assert.deepEqual(readM8Sources(altM8Markup), expectedM8Sources);
assert.equal(m8Sources.length, 39);
assert.equal(new Set(m8Sources).size, 39);
assert.equal(m8Sources.some((source) => source.includes("giphy-31")), false);
assert.equal(m8Sources.at(-1), `${originalRelativeDirectory}/ioh-emdr-hexeosis.gif`);

const fashionPairings = [
  ["fashion-restore", ["jacquemus-le-coup-de-soleil", "chanel-paris-rooftops"]],
  ["fashion-social-uplift", ["annies-ibiza-runway", "dolce-gabbana-valley-of-the-temples"]],
  ["fashion-underground-intensity", ["wolford-sergio-rossi-capsule", "mugler-fall-winter-2021"]],
];
fashionPairings.forEach(([channelId, expectedRunways]) => {
  const channel = schedule.channels.find(({ id }) => id === channelId);
  assert.ok(channel, `${channelId} is missing`);
  assert.deepEqual(channel.schedule.map(({ runway_id }) => runway_id), expectedRunways);
  assert.match(controller, new RegExp(`fashionChannelId: "${channelId}"`));
});

assert.match(gifRuntime, /setPreset,/);
assert.match(gifRuntime, /tile\.tagName === "VIDEO"/);
assert.match(gifRuntime, /detail: \{ active: state\.active, preset: state\.preset \}/);
assert.match(gifRuntime, /panel\.hasAttribute\("data-emdr-gif-progressive"\)/);
assert.match(gifRuntime, /dataset\.emdrGifReady = "progressive"/);
assert.match(styles, /\.adaptive-television-emdr-gif-grid\.is-active/);
assert.match(styles, /\.adaptive-television-emdr-gif-grid img,[\s\S]*?\.adaptive-television-emdr-gif-grid video/);
assert.match(styles, /\.adaptive-television-emdr-gif-grid\[data-emdr-gif-scroll\][\s\S]*?overflow-y: auto/);
assert.match(styles, /overscroll-behavior-y: contain/);
assert.match(styles, /scroll-snap-type: y mandatory/);
assert.match(styles, /\.adaptive-television-emdr-gif-page \{[\s\S]*?grid-template-columns: repeat\(3, var\(--emdr-gif-tile-size\)\)[\s\S]*?grid-template-rows: repeat\(2, var\(--emdr-gif-tile-size\)\)[\s\S]*?height: 100%[\s\S]*?overflow: hidden[\s\S]*?scroll-snap-align: start/);
assert.match(styles, /\.adaptive-television-emdr-gif-page:last-child \{[\s\S]*?grid-template-rows: var\(--emdr-gif-tile-size\)/);
assert.match(styles, /img\[data-emdr-gif-boxed\] \{[\s\S]*?border: 1px solid rgba\(255, 255, 255, \.14\)[\s\S]*?background: #111114[\s\S]*?opacity: 1/);
assert.match(styles, /touch-action: pan-y/);

const gifFiles = fs.readdirSync(sourceDirectory).filter((name) => name.endsWith(".gif")).sort();
assert.equal(gifFiles.length, 33);
const manualFiles = fs.readdirSync(manualLeadDirectory).filter((name) => name.endsWith(".gif")).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
assert.deepEqual(manualFiles, manualLeadFiles);
assert.equal((library.match(/<figure/g) || []).length, 39);
assert.equal((library.match(/<figure data-current-m8="true"/g) || []).length, 6);
const librarySources = [...library.matchAll(/<figure(?: data-current-m8="true")?><img src="([^"]+\.gif)"/g)].map((match) => match[1]);
assert.deepEqual(librarySources, expectedM8Sources);

function skipSubBlocks(bytes, start) {
  let cursor = start;
  while (cursor < bytes.length) {
    const length = bytes[cursor++];
    if (length === 0) return cursor;
    cursor += length;
  }
  throw new Error("Truncated GIF sub-blocks");
}

function inspectGif(bytes) {
  assert.equal(bytes.subarray(0, 6).toString("ascii"), "GIF89a");
  let cursor = 6;
  const packed = bytes[cursor + 4];
  cursor += 7;
  if (packed & 0x80) cursor += 3 * (1 << ((packed & 0x07) + 1));
  let frames = 0;
  let pendingDelayCentiseconds = 0;
  const frameDelaysCentiseconds = [];
  while (cursor < bytes.length) {
    const marker = bytes[cursor++];
    if (marker === 0x3b) return { frames, frameDelaysCentiseconds };
    if (marker === 0x2c) {
      frames += 1;
      frameDelaysCentiseconds.push(pendingDelayCentiseconds);
      pendingDelayCentiseconds = 0;
      const imagePacked = bytes[cursor + 8];
      cursor += 9;
      if (imagePacked & 0x80) cursor += 3 * (1 << ((imagePacked & 0x07) + 1));
      cursor += 1;
      cursor = skipSubBlocks(bytes, cursor);
      continue;
    }
    if (marker === 0x21) {
      const extensionLabel = bytes[cursor++];
      if (extensionLabel === 0xf9) {
        assert.equal(bytes[cursor], 4, "Invalid GIF graphic-control extension");
        pendingDelayCentiseconds = bytes.readUInt16LE(cursor + 2);
      }
      cursor = skipSubBlocks(bytes, cursor);
      continue;
    }
    throw new Error(`Unexpected GIF marker 0x${marker.toString(16)}`);
  }
  throw new Error("GIF trailer is missing");
}

const countGifFrames = (bytes) => inspectGif(bytes).frames;

function netscapeLoopCount(bytes) {
  const identifierIndex = bytes.indexOf(Buffer.from("NETSCAPE2.0", "ascii"));
  assert.ok(identifierIndex >= 0, "GIF loop extension is missing");
  assert.equal(bytes[identifierIndex + 11], 3, "Invalid GIF loop extension length");
  assert.equal(bytes[identifierIndex + 12], 1, "Invalid GIF loop extension identifier");
  return bytes.readUInt16LE(identifierIndex + 13);
}

gifFiles.forEach((name) => {
  const frames = countGifFrames(fs.readFileSync(path.join(sourceDirectory, name)));
  assert.ok(frames > 1, `${name} is not animated`);
});

manualFiles.forEach((name) => {
  const bytes = fs.readFileSync(path.join(manualLeadDirectory, name));
  const expected = expectedManualMasters.get(name);
  const metadata = inspectGif(bytes);
  assert.equal(bytes.length, expected.bytes, `${name} master byte length changed`);
  assert.equal(bytes.readUInt16LE(6), expected.width, `${name} master width changed`);
  assert.equal(bytes.readUInt16LE(8), expected.height, `${name} master height changed`);
  assert.equal(bytes.readUInt16LE(6), bytes.readUInt16LE(8), `${name} is not square`);
  assert.equal(metadata.frames, expected.frames, `${name} master frame count changed`);
  assert.equal(metadata.frameDelaysCentiseconds.length, expected.frames, `${name} master frame timing count changed`);
  assert.ok(metadata.frameDelaysCentiseconds.every((delay) => delay === expected.frameDelayCentiseconds), `${name} master cadence changed`);
  assert.equal(metadata.frameDelaysCentiseconds.reduce((total, delay) => total + delay, 0), expected.durationCentiseconds, `${name} master duration changed`);
  assert.equal(netscapeLoopCount(bytes), 0, `${name} no longer loops continuously`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.sha256, `${name} master bytes changed`);
});

const scriptHash = createHash("sha256").update(controller).digest("hex").slice(0, 12);
const styleHash = createHash("sha256").update(styles).digest("hex").slice(0, 12);
const gifHash = createHash("sha256").update(gifRuntime).digest("hex").slice(0, 12);
for (const [name, page] of [["index.html", html], ["index-alt.html", altHtml]]) {
  assert.ok(page.includes(`adaptive-environment-television.js?v=music-tv-${scriptHash}`), `${name} controller token is stale`);
  assert.ok(page.includes(`adaptive-environment-television.css?v=music-tv-css-${styleHash}`), `${name} stylesheet token is stale`);
  assert.ok(page.includes(`emdr-gif-world.js?v=emdr-gif-world-${gifHash}`), `${name} GIF runtime token is stale`);
}

console.log("EMDR themed preset checks passed.");
