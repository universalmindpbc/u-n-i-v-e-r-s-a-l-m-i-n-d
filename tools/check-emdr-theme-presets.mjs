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

const expectedButtons = [
  { index: 0, key: "cb", label: "CB" },
  { index: 1, key: "m8", label: "M8" },
  { index: 2, key: "jbh", label: "JBH" },
  { index: 3, key: "stella", label: "Stella" },
];

for (const page of [html, altHtml]) {
  expectedButtons.forEach(({ index, key, label }) => {
    assert.match(page, new RegExp(`data-emdr-style-index="${index}" data-emdr-preset="${key}"[^>]*>${label}<\\/button>`));
  });
  assert.equal((page.match(/data-emdr-gif-preset-label=/g) || []).length, 3);
}

const rootStart = html.indexOf('data-emdr-gif-world');
const rootEnd = html.indexOf('adaptive-television-emdr-gif-casing', rootStart);
const gifWorldMarkup = html.slice(rootStart, rootEnd);
const presetMarkup = (key) => gifWorldMarkup.match(new RegExp(`data-emdr-gif-preset="${key}"[\\s\\S]*?(?=<div class="adaptive-television-emdr-gif-grid"|$)`))?.[0] || "";
const cbMarkup = presetMarkup("cb");
const m8Markup = presetMarkup("m8");
const jbhMarkup = presetMarkup("jbh");
assert.equal((cbMarkup.match(/data-emdr-gif-tile/g) || []).length, 6);
assert.equal((m8Markup.match(/data-emdr-gif-tile/g) || []).length, 6);
assert.equal((jbhMarkup.match(/data-emdr-gif-tile/g) || []).length, 6);
assert.equal((jbhMarkup.match(/<video /g) || []).length, 4);
assert.equal((jbhMarkup.match(/<img /g) || []).length, 2);

const m8LeadOrder = [...m8Markup.matchAll(/ioh-emdr-giphy-(\d{2})\.gif/g)].map((match) => match[1]);
assert.deepEqual(m8LeadOrder, ["22", "03", "12", "01", "02", "04"]);

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
assert.match(styles, /\.adaptive-television-emdr-gif-grid\.is-active/);
assert.match(styles, /\.adaptive-television-emdr-gif-grid img,[\s\S]*?\.adaptive-television-emdr-gif-grid video/);

const gifFiles = fs.readdirSync(sourceDirectory).filter((name) => name.endsWith(".gif")).sort();
assert.equal(gifFiles.length, 33);
assert.equal((library.match(/<figure/g) || []).length, 33);
assert.equal((library.match(/<figure data-current-m8="true"/g) || []).length, 6);

function skipSubBlocks(bytes, start) {
  let cursor = start;
  while (cursor < bytes.length) {
    const length = bytes[cursor++];
    if (length === 0) return cursor;
    cursor += length;
  }
  throw new Error("Truncated GIF sub-blocks");
}

function countGifFrames(bytes) {
  assert.equal(bytes.subarray(0, 6).toString("ascii"), "GIF89a");
  let cursor = 6;
  const packed = bytes[cursor + 4];
  cursor += 7;
  if (packed & 0x80) cursor += 3 * (1 << ((packed & 0x07) + 1));
  let frames = 0;
  while (cursor < bytes.length) {
    const marker = bytes[cursor++];
    if (marker === 0x3b) return frames;
    if (marker === 0x2c) {
      frames += 1;
      const imagePacked = bytes[cursor + 8];
      cursor += 9;
      if (imagePacked & 0x80) cursor += 3 * (1 << ((imagePacked & 0x07) + 1));
      cursor += 1;
      cursor = skipSubBlocks(bytes, cursor);
      continue;
    }
    if (marker === 0x21) {
      cursor += 1;
      cursor = skipSubBlocks(bytes, cursor);
      continue;
    }
    throw new Error(`Unexpected GIF marker 0x${marker.toString(16)}`);
  }
  return frames;
}

gifFiles.forEach((name) => {
  const frames = countGifFrames(fs.readFileSync(path.join(sourceDirectory, name)));
  assert.ok(frames > 1, `${name} is not animated`);
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
