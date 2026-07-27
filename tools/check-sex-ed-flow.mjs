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
const episode = read("i  a m/sex-ed-episode-01.html");
const sexEdJs = read("i  a m/sex-ed.js");

assert.match(index, /class="adaptive-television-wallet-status-row"/);
assert.match(index, /class="adaptive-television-sex-ed-link" href="#sex-ed-shelf"/);
assert.match(index, /data-now-playing[\s\S]*data-sex-ed-link/);
assert.match(index, /data-now-playing-secondary-label>VISUAL</);
assert.match(index, /class="adaptive-television-fashion-shelf adaptive-television-music-shelf adaptive-television-sex-ed-shelf"/);
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 6);
assert.match(index, /data-sex-ed-episode="01"[\s\S]{0,300}data-sex-ed-start-time="139"/);
assert.match(index, /data-sex-ed-episode="02"/);
assert.match(index, /data-sex-ed-episode="03"/);
assert.match(index, /data-sex-ed-episode="04"/);
assert.match(index, /data-sex-ed-episode="05"/);
assert.match(index, /data-sex-ed-episode="06"[\s\S]{0,360}data-sex-ed-background-file="Karl Lagerfeld - The Making of the 2011 Pirelli Calendar\.mp4"/);
assert.match(index, /<strong>Reclaiming the Forbidden Feminine<\/strong>/);
assert.match(index, /<strong>The Truth About Tantra &amp; Embodied Wealth<\/strong>/);
assert.match(index, /<strong>Power, Sex &amp; Intimacy<\/strong>/);
assert.match(index, /<strong>Expanding the Window of Pleasure<\/strong>/);
assert.match(index, /<strong>Healthy Sexuality vs\. Healing Sexuality<\/strong>/);
assert.match(index, /<strong>Healing Through Solo Rope &amp; Self Pleasure<\/strong>/);
assert.match(index, /<span>Jacqueline Michelle<\/span>/);
assert.match(index, /aria-label="Open episode 06:[^"]+Jacqueline Michelle"/);
assert.match(index, /b35b5890ca38c7b99bfc7adaae5bc16c\/thumbnails\/thumbnail\.jpg\?time=60s&height=360/);
assert.match(index, /7f60e29d9e432bf4198df7dc223b66ef\/thumbnails\/thumbnail\.jpg\?time=60s&height=360/);
assert.match(index, /1–4 \/ 6/);
assert.match(index, /James Bondage Health · sex-ed/);
assert.match(index, /data-television-live-pill/);
assert.match(index, /data-reaction-wallet/);
assert.match(index, /data-community-globe-frame/);
assert.match(index, /See how we understand your needs/);
assert.match(televisionCss, /min-height: 106px/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-link \{/);
assert.match(televisionCss, /border: 1px solid rgba\(255, 255, 255, 0\.3\)/);
assert.match(televisionCss, /color: rgba\(255, 255, 255, 0\.65\)/);
assert.doesNotMatch(televisionCss, /\.adaptive-television-sex-ed-link[\s\S]{0,500}animation:/);
assert.match(televisionJs, /sexEdLink\?\.addEventListener\("click"/);
assert.match(televisionJs, /openSexEdShelf\(\)/);
assert.doesNotMatch(televisionJs, /openInVideoPageLayer\(sexEdLink\)/);
assert.match(televisionJs, /setProgrammeMixLevel\(level\)/);
assert.match(televisionJs, /const SEX_ED_PROGRAMME_MIX_LEVEL = \.15/);
assert.match(televisionJs, /const SEX_ED_DEFAULT_BACKGROUND_FILE = "a s s e t s\/f a s h i o n \[ r u n w a y \]\/Mugler - Fall Winter 2021\.mp4"/);
assert.match(televisionJs, /setProgrammeMixLevel\(SEX_ED_PROGRAMME_MIX_LEVEL\)/);
assert.match(televisionJs, /sexEdEpisodeVideo\.volume = 1/);
assert.doesNotMatch(televisionJs, /SEX_ED_EPISODE_GAIN/);
assert.doesNotMatch(televisionJs, /createMediaElementSource\(sexEdEpisodeVideo\)/);
assert.doesNotMatch(televisionJs, /sexEdForegroundGain/);
assert.match(televisionJs, /stopSexEdEpisode\(\{ restoreProgramme: false \}\)/);
assert.match(televisionJs, /level === null \|\| level === undefined \|\| level === ""/);
assert.match(televisionJs, /dataset\.programmeFixedMixLevel = String\(programmeFixedMixLevel\)/);
assert.match(televisionJs, /joinBroadcastChannel\("party-james-bondage", \{ source: "sex_ed_episode" \}\)/);
assert.match(televisionJs, /card\.dataset\.sexEdBackgroundFile \|\| SEX_ED_DEFAULT_BACKGROUND_FILE/);
assert.match(televisionJs, /sexEdBackground\.dataset\.streamFile = backgroundFileName/);
const openShelfSource = televisionJs.match(/function openSexEdShelf\(\)[\s\S]*?\n  }\n\n  function closeSexEdShelf/)?.[0] || "";
assert.doesNotMatch(openShelfSource, /setProgrammeMixLevel/);
assert.doesNotMatch(openShelfSource, /joinBroadcast/);
const setMusicModeSource = televisionJs.match(/function setMusicMode\(mode, options = \{\}\)[\s\S]*?\n  }\n\n  function musicThumbnailUrl/)?.[0] || "";
assert.doesNotMatch(setMusicModeSource, /stopSexEdEpisode/);
const broadcastJoinSource = televisionJs.match(/broadcastJoinButton\?\.addEventListener\("click"[\s\S]*?\n  \}\);/)?.[0] || "";
assert.match(broadcastJoinSource, /stopSexEdEpisode\(\{ restoreProgramme: false \}\)/);
assert.match(televisionJs, /switchMusicTrack\(returnTrack, \{[\s\S]*?source: "sex_ed_return",[\s\S]*?startAt: returnProgramme\.currentTime/);
assert.match(televisionJs, /joinBroadcastChannel\(returnProgramme\.channelId, \{ source: "sex_ed_return" \}\)/);
assert.match(televisionJs, /openSexEdEpisode\(card\.dataset\.sexEdEpisode/);
assert.match(televisionJs, /function currentSexEdNowPlaying\(\)/);
assert.match(televisionJs, /dataset\.sexEdEpisodeTitle = title/);
assert.match(televisionJs, /dataset\.sexEdEpisodeGuest = guest/);
assert.match(televisionJs, /const primaryLabel = sexEdProgramme\?\.label \|\| media\.label/);
assert.match(televisionJs, /const secondaryLabel = sexEdProgramme \? "MUSIC" : "VISUAL"/);
assert.match(televisionJs, /nowPlaying\.dataset\.nowPlayingMode = sexEdProgramme \? "sex-ed" : media\.mode/);
assert.match(televisionJs, /Open sex-ed episodes\. Now playing:/);
assert.match(televisionJs, /if \(currentSexEdNowPlaying\(\)\) \{[\s\S]*?openSexEdShelf\(\)/);
assert.match(televisionJs, /if \(wasActive\) \{[\s\S]*?setProgrammeMixLevel\(null\);[\s\S]*?updateNowPlaying\(\)/);
assert.match(televisionJs, /sexEdEpisodeVideo\.currentTime = sexEdStartTime/);
assert.match(televisionJs, /data\.episode \|\| "01"/);

assert.match(index, /data-sex-ed-world/);
assert.match(index, /Mugler - Fall Winter 2021\.mp4/);
assert.match(index, /data-sex-ed-shell-video/);
assert.match(index, /From Doula to Stripper - Reclaiming the Forbidden Feminine with Caitlin Erica\.mp4/);
assert.match(index, /9162e29e524b6db596d72d8c9720729d\/thumbnails\/thumbnail\.jpg\?time=900s&height=360/);
assert.doesNotMatch(index.match(/<video[\s\S]*?data-sex-ed-shell-video[\s\S]*?<\/video>/)?.[0] || "", /\scontrols(?:\s|>)/);
assert.equal((index.match(/class="adaptive-television-sex-ed-grid"[\s\S]*?<\/div>/)?.[0].match(/<video /g) || []).length, 4);
assert.equal((index.match(/class="adaptive-television-sex-ed-grid"[\s\S]*?<\/div>/)?.[0].match(/<img /g) || []).length, 2);
assert.match(index, /gif position 2\.gif/);
assert.match(index, /gif position 5\.gif/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-grid video,[\s\S]*opacity: \.77/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-grid[\s\S]*grid-template-columns: repeat\(3, var\(--emdr-gif-tile-size\)\)/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-casing[\s\S]*background: rgba\(0, 0, 0, \.65\)/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-casing[\s\S]*padding: var\(--emdr-gif-casing-gap\)/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-episode[\s\S]*width: var\(--emdr-gif-front-width\)/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-episode[\s\S]*height: var\(--emdr-gif-front-height\)/);
assert.match(televisionCss, /body\.television-sex-ed-active \.adaptive-television-timecode \{\s*opacity: 1 !important;/);
assert.match(televisionJs, /const source = document\.body\.classList\.contains\("television-sex-ed-active"\)[\s\S]*\? sexEdEpisodeVideo[\s\S]*: localVideo;/);
assert.match(televisionJs, /sexEdEpisodeVideo\?\.addEventListener\("loadedmetadata", updateTimecode\)/);
assert.match(televisionJs, /sexEdEpisodeVideo\?\.addEventListener\("timeupdate", updateTimecode\)/);

assert.match(episode, /Mugler - Fall Winter 2021\.mp4/);
assert.match(episode, /data-sex-ed-episode-video/);
assert.match(episode, /data-sex-ed-start-time="139"/);
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
assert.match(sexEdJs, /const SEX_ED_PROGRAMME_MIX_LEVEL = \.15/);
assert.match(sexEdJs, /setProgrammeMixLevel\?\.\(SEX_ED_PROGRAMME_MIX_LEVEL\)/);
assert.match(sexEdJs, /joinBroadcast\?\.\("party-james-bondage"\)/);
assert.match(sexEdJs, /requestEpisodePlayback/);
assert.match(sexEdJs, /episodeVideo\.currentTime = startTime/);
new Script(sexEdJs, { filename: "sex-ed.js" });

for (const [fileName, uid] of [
  ["From Doula to Stripper - Reclaiming the Forbidden Feminine with Caitlin Erica.mp4", "9162e29e524b6db596d72d8c9720729d"],
  ["The Truth About Tantra, Sacred Union & Embodied Wealth - Sofia Sundari.mp4", "a821a9447efb3dd9381008eafac0ff78"],
  ["Femininity Explored - Power, Sex, & Intimacy, with Vylana.mp4", "ef8bbcd95a067bbc294d0d493b93fabc"],
  ["The Psychology of boring sex with Shashi Solluna - Tantra - Expanding The Window of Pleasure.mp4", "af6f972e12eb0e9317a0d4e0d694b382"],
  ["Healthy Sexuality Vs. Healing Sexuality - Teal Swan.mp4", "b35b5890ca38c7b99bfc7adaae5bc16c"],
  ["Jacqueline Michell - Healing Through Solo Rope & Self Pleasure.mp4", "7f60e29d9e432bf4198df7dc223b66ef"],
  ["Karl Lagerfeld - The Making of the 2011 Pirelli Calendar.mp4", "f9eb03d0f256739628addbb7ab66b7ed"],
]) {
  assert.ok(catalogue.includes(`"${fileName}": "${uid}"`), `${fileName} must map to its ready Cloudflare Stream upload.`);
}

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

console.log("Sex-ed six-episode shelf and episode-specific silent background preflight passed.");
