import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const index = read("i  a m/index.html");
const televisionCss = read("i  a m/adaptive-environment-television.css");
const televisionJs = read("i  a m/adaptive-environment-television.js");
const catalogue = read("i  a m/cloudflare-stream-catalogue.js");
const collection = read("i  a m/sex-ed.html");
const episode = read("i  a m/sex-ed-episode-01.html");
const sexEdCss = read("i  a m/sex-ed.css");
const sexEdJs = read("i  a m/sex-ed.js");

assert.match(index, /class="adaptive-television-wallet-status-row"/);
assert.match(index, /class="adaptive-television-sex-ed-link" href="sex-ed\.html"/);
assert.match(index, /data-now-playing[\s\S]*data-sex-ed-link/);
assert.match(televisionCss, /min-height: 106px/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-link \{/);
assert.match(televisionCss, /border: 1px solid rgba\(255, 255, 255, 0\.3\)/);
assert.match(televisionCss, /color: rgba\(255, 255, 255, 0\.65\)/);
assert.doesNotMatch(televisionCss, /\.adaptive-television-sex-ed-link[\s\S]{0,500}animation:/);
assert.match(televisionJs, /sexEdLink\?\.addEventListener\("click"/);
assert.match(televisionJs, /openInVideoPageLayer\(sexEdLink\)/);
assert.match(televisionJs, /setProgrammeMixLevel\(level\)/);
assert.match(televisionJs, /setProgrammeMixLevel\(\.15\)/);
assert.match(televisionJs, /joinBroadcast\?\.\("party-james-bondage"\)/);

assert.match(collection, /Mugler - Fall Winter 2021\.mp4/);
assert.match(collection, /href="sex-ed-episode-01\.html"/);
assert.match(collection, /Episode 01/);
assert.match(collection, /From Doula to Stripper/);
assert.match(collection, /Caitlin Erica/);
assert.doesNotMatch(collection, /sex-ed-tile-grid/);
assert.doesNotMatch(collection, /data-sex-ed-episode-video/);

assert.match(episode, /Mugler - Fall Winter 2021\.mp4/);
assert.match(episode, /data-sex-ed-episode-video/);
assert.match(episode, /From Doula to Stripper - Reclaiming the Forbidden Feminine with Caitlin Erica\.mp4/);
assert.doesNotMatch(episode, /\scontrols(?:\s|>)/);
assert.doesNotMatch(episode, /sex-ed-player-caption/);
assert.doesNotMatch(episode, /sex-ed-header--episode/);
assert.doesNotMatch(episode, /class="sex-ed-back"/);
assert.doesNotMatch(episode, />×</);
assert.match(episode, /data-sex-ed-episode-start/);
assert.equal((episode.match(/class="sex-ed-tile /g) || []).length, 6);
assert.equal((episode.match(/<video class="sex-ed-tile /g) || []).length, 4);
assert.equal((episode.match(/<img class="sex-ed-tile /g) || []).length, 2);
assert.match(episode, /gif position 2\.gif/);
assert.match(episode, /gif position 5\.gif/);
assert.match(sexEdCss, /\.sex-ed-tile[\s\S]*opacity: 0\.77/);
assert.match(sexEdCss, /--emdr-gif-grid-gap: min\(3\.4vw, 5\.6vh, 100px\)/);
assert.match(sexEdCss, /--emdr-gif-tile-size: min\(24vw, 42vh, 720px\)/);
assert.match(sexEdCss, /--emdr-gif-front-width: min\(45vw, 80vh\)/);
assert.match(sexEdCss, /--emdr-gif-front-height: min\(25\.3125vw, 45vh\)/);
assert.match(sexEdCss, /\.sex-ed-player-casing[\s\S]*background: rgba\(0, 0, 0, \.65\)/);
assert.match(sexEdCss, /\.sex-ed-player-casing[\s\S]*padding: var\(--emdr-gif-casing-gap\)/);
assert.match(sexEdJs, /setProgrammeMixLevel\?\.\(\.15\)/);
assert.match(sexEdJs, /joinBroadcast\?\.\("party-james-bondage"\)/);
assert.match(sexEdJs, /requestEpisodePlayback/);
new Script(sexEdJs, { filename: "sex-ed.js" });

assert.match(
  catalogue,
  /"From Doula to Stripper - Reclaiming the Forbidden Feminine with Caitlin Erica\.mp4": "55930437b1aeff8960fb73aee334fd71"/
);

const mediaRoot = "i  a m/a s s e t s/j a m e s b o n d a g e/s q u a r e  v i d e o s";
for (const position of [1, 3, 4, 6]) {
  const path = resolve(root, mediaRoot, "mp4 480x480", `sexed-tile-position-${position}.mp4`);
  const bytes = readFileSync(path);
  assert.ok(bytes.includes(Buffer.from("avc1")), `Position ${position} must be H.264 MP4.`);
  assert.ok(statSync(path).size < 2_000_000, `Position ${position} must stay lightweight.`);
}
for (const position of [2, 5]) {
  const path = resolve(root, mediaRoot, `gif position ${position}.gif`);
  assert.equal(readFileSync(path, { encoding: null }).subarray(0, 3).toString(), "GIF");
}

console.log("Sex-ed collection and episode flow preflight passed.");
