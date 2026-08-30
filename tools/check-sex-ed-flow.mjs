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
assert.match(index, /data-now-playing-secondary-label(?:\s+hidden)?>VISUAL</);
assert.match(index, /class="adaptive-television-fashion-shelf adaptive-television-music-shelf adaptive-television-sex-ed-shelf"/);
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 16);
assert.match(index, /data-sex-ed-episode="01"[\s\S]{0,300}data-sex-ed-start-time="139"/);
assert.match(index, /data-sex-ed-episode="02"/);
assert.match(index, /data-sex-ed-episode="03"/);
assert.match(index, /data-sex-ed-episode="04"/);
assert.match(index, /data-sex-ed-episode="05"/);
assert.match(index, /data-sex-ed-episode="06"[\s\S]{0,360}data-sex-ed-background-file="Karl Lagerfeld - The Making of the 2011 Pirelli Calendar\.mp4"/);
assert.match(index, /data-sex-ed-episode="07"[\s\S]{0,520}data-sex-ed-presentation="fullscreen"[\s\S]{0,220}data-sex-ed-radio-station="cafe-del-mar-chill"/);
assert.match(index, /data-sex-ed-episode="08"[\s\S]{0,520}data-sex-ed-presentation="fullscreen"[\s\S]{0,220}data-sex-ed-radio-station="cafe-del-mar-chill"/);
for (const episode of ["09", "10", "11", "12", "13", "14", "15", "16"]) {
  assert.match(index, new RegExp(`data-sex-ed-episode="${episode}"`));
}
assert.match(index, /<strong>Reclaiming the Forbidden Feminine<\/strong>/);
assert.match(index, /<strong>The Truth About Tantra &amp; Embodied Wealth<\/strong>/);
assert.match(index, /<strong>Power, Sex &amp; Intimacy<\/strong>/);
assert.match(index, /<strong>Expanding the Window of Pleasure<\/strong>/);
assert.match(index, /<strong>Healthy Sexuality vs\. Healing Sexuality<\/strong>/);
assert.match(index, /<strong>Healing Through Solo Rope &amp; Self Pleasure<\/strong>/);
assert.match(index, /<strong>Yoga to Increase Your Sexual Energy<\/strong>/);
assert.match(index, /<strong>Vinyasa Yoga Flow<\/strong>/);
assert.match(index, /<strong>Five Stages of Subspace<\/strong>[\s\S]{0,90}<span>Alesandra Madison<\/span>/);
assert.match(index, /<strong>Subspace &amp; Topspace<\/strong>[\s\S]{0,90}<span>Luna Agneya<\/span>/);
assert.match(index, /<strong>Pleasuring a Woman<\/strong>[\s\S]{0,90}<span>Hitomi Mochizuki<\/span>/);
assert.match(index, /<strong>BDSM: The New Religion\?<\/strong>[\s\S]{0,90}<span>Gemma Li &amp; Seraphyna<\/span>/);
assert.match(index, /<strong>Submission &amp; the Male Brain<\/strong>[\s\S]{0,90}<span>Alla Mephistopheles<\/span>/);
assert.equal((index.match(/<span>Ashton August<\/span>/g) || []).length, 2);
assert.match(index, /aca91449b729422592f1a50b0be16f17\/thumbnails\/thumbnail\.jpg\?time=750s&height=360/);
assert.match(index, /72faef830b2a04cf6d896d7d46183f49\/thumbnails\/thumbnail\.jpg\?time=1070s&height=360/);
assert.match(index, /<span>Jacqueline Michelle<\/span>/);
assert.match(index, /aria-label="Open episode 06:[^"]+Jacqueline Michelle"/);
assert.match(index, /b35b5890ca38c7b99bfc7adaae5bc16c\/thumbnails\/thumbnail\.jpg\?time=60s&height=360/);
assert.match(index, /7f60e29d9e432bf4198df7dc223b66ef\/thumbnails\/thumbnail\.jpg\?time=60s&height=360/);
assert.match(index, /1–4 \/ 16/);
assert.match(index, /James Bondage Health · sex-ed/);
assert.match(index, /<p>16 lessons<\/p>/);
assert.match(index, /data-sex-ed-shell-start[^>]*hidden/);
assert.match(index, /data-television-live-pill/);
assert.match(index, /data-reaction-wallet/);
assert.match(index, /data-community-globe-frame/);
assert.doesNotMatch(index, /See how we understand your needs/);
assert.match(televisionCss, /min-height: 106px/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-link \{/);
assert.match(televisionCss, /border: 1px solid rgba\(255, 255, 255, 0\.3\)/);
assert.match(televisionCss, /color: rgba\(255, 255, 255, 0\.65\)/);
assert.doesNotMatch(televisionCss, /\.adaptive-television-sex-ed-link[\s\S]{0,500}animation:/);
assert.match(televisionCss, /\.adaptive-television-sex-ed-world \{[\s\S]{0,420}background: #08080a;/, "Sex-Ed loading must own an opaque black broadcast canvas.");
assert.match(televisionCss, /body\.television-sex-ed-active \.adaptive-television-player > :not\(\.adaptive-television-channel-loading\):not\(\.adaptive-television-timecode\)[\s\S]{0,180}visibility: hidden !important;/, "Sex-Ed loading must suppress the outgoing programme without hiding its loader or timecode.");
assert.doesNotMatch(televisionCss, /body\[data-sex-ed-loading-state="loading"\] \.adaptive-television-sex-ed-grid/, "Sex-Ed loading must not hide or deprioritise the animated tile field.");
assert.match(televisionJs, /sexEdLink\?\.addEventListener\("click"/);
assert.match(televisionJs, /openSexEdShelf\(\)/);
assert.doesNotMatch(televisionJs, /openInVideoPageLayer\(sexEdLink\)/);
assert.match(televisionJs, /setProgrammeMixLevel\(level\)/);
assert.match(televisionJs, /const SEX_ED_PROGRAMME_MIX_LEVEL = \.15/);
assert.match(televisionJs, /const SEX_ED_DEFAULT_BACKGROUND_FILE = "a s s e t s\/f a s h i o n \[ r u n w a y \]\/Mugler - Fall Winter 2021\.mp4"/);
assert.match(televisionJs, /setProgrammeMixLevel\(SEX_ED_PROGRAMME_MIX_LEVEL\)/);
assert.match(televisionJs, /setVoiceAssistantProgramVolume\(sexEdEpisodeVideo, 1,/);
assert.doesNotMatch(televisionJs, /SEX_ED_EPISODE_GAIN/);
assert.doesNotMatch(televisionJs, /createMediaElementSource\(sexEdEpisodeVideo\)/);
assert.doesNotMatch(televisionJs, /sexEdForegroundGain/);
assert.match(televisionJs, /stopSexEdEpisode\(\{ restoreProgramme: false \}\)/);
assert.match(televisionJs, /level === null \|\| level === undefined \|\| level === ""/);
assert.match(televisionJs, /dataset\.programmeFixedMixLevel = String\(programmeFixedMixLevel\)/);
assert.match(televisionJs, /const SEX_ED_BROADCAST_CHANNEL_ID = "sex-ed"/);
assert.match(televisionJs, /const SEX_ED_AUDIO_PARTY_START_TIMEOUT_MS = 30000/);
assert.match(televisionJs, /const SEX_ED_RECORDED_PROGRAMME_READY_BUFFER_SECONDS = 4/);
assert.match(televisionJs, /async function resolveScheduledAudioPartySource\(nextTrack\)[\s\S]{0,260}if \(!nextTrack\.hlsVideoSrc && !window\.IAMCloudflareStream && window\.IAMStreamReady\) \{[\s\S]{0,120}await window\.IAMStreamReady;/);
assert.match(televisionJs, /async function startAudioLedPartyAttempt\(nextTrack, options, attemptContext\)[\s\S]{0,1200}const source = await resolveScheduledAudioPartySource\(nextTrack\);[\s\S]{0,80}assertCurrentStart\(\);/);
assert.match(televisionJs, /function openSexEdShelf\(\)[\s\S]{0,900}prewarmSexEdAudioProgramme\(\);/);
assert.match(televisionJs, /function prewarmSexEdAudioProgramme\(\)[\s\S]{0,900}loadRadioHlsLibrary\(\)[\s\S]{0,180}loadRecordedProgrammeAudioRendition\(source\)/);
assert.match(televisionJs, /const recordedProgrammeAudioRenditions = new Map\(\)/);
assert.match(televisionJs, /playbackSource = await loadRecordedProgrammeAudioRendition\(source\)/);
assert.match(televisionJs, /joinBroadcastChannel\(SEX_ED_BROADCAST_CHANNEL_ID, \{[\s\S]{0,220}source: "sex_ed_episode",[\s\S]{0,220}deferChannelLoadingFinish: true/);
assert.match(televisionJs, /startRadioStation\(radioStation, \{ source: "sex_ed_instruction" \}\)/);
assert.match(televisionJs, /function shouldShowChannelLoading\(source = "", force = false\)[\s\S]*?if \(force\) return true;[\s\S]*?classList\.contains\("television-sex-ed-active"\)/);
assert.match(televisionJs, /cancelChannelLoading\("sex_ed_transition"\);[\s\S]{0,220}document\.body\.classList\.add\("television-sex-ed-active", "flower-cue-visible"\);[\s\S]{0,420}source: "sex_ed_episode",[\s\S]{0,120}force: true/);
assert.match(televisionJs, /const sexEdOwnsVisuals = channelId === SEX_ED_BROADCAST_CHANNEL_ID \|\| options\.source === "sex_ed_episode";[\s\S]{0,120}const visualStartupPromise = sexEdOwnsVisuals[\s\S]{0,80}\? Promise\.resolve\(true\)[\s\S]{0,120}: joinFashionBroadcastChannel/);
assert.match(televisionJs, /visualAlreadyManaged: sexEdOwnsVisuals/);
assert.match(televisionJs, /readyBufferSeconds: sexEdOwnsVisuals \? SEX_ED_RECORDED_PROGRAMME_READY_BUFFER_SECONDS : undefined/);
assert.match(televisionJs, /startTimeoutMs: sexEdOwnsVisuals \? SEX_ED_AUDIO_PARTY_START_TIMEOUT_MS : undefined/);
assert.match(televisionJs, /const audioReady = recordReadiness\("Audio"[\s\S]*?readiness\.push\(audioReady\);[\s\S]*?audioReady\.then\(\(ready\) => ready \? playSexEdBackgroundVideo\(\) : false\)[\s\S]*?audioReady\.then\(\(ready\) => ready \? activateSexEdLoopVideos\(\) : false\)/);
assert.match(televisionJs, /readiness\.push\(audioReady\);[\s\S]{0,180}recordReadiness\("Foreground", audioReady\.then\(\(ready\) => ready \? playSexEdEpisode\(\) : false\)\)/);
assert.match(televisionJs, /const ready = \(await Promise\.all\(readiness\)\)\.every\(Boolean\);[\s\S]{0,1400}if \(ready\) finishChannelLoading\(loadingGeneration\);[\s\S]{0,80}else failChannelLoading\(loadingGeneration\);/);
assert.match(televisionJs, /fadeContinuationAudio\(programmeFixedMixLevel \?\? \.68, 1200\)/);
assert.match(televisionJs, /if \(radioStation\) \{[\s\S]*release\?\.\(sexEdBackground, "sex_ed_radio_presentation"\)[\s\S]*releaseSexEdLoopVideos\(\)/);
assert.match(televisionJs, /setVoiceAssistantProgramVolume\(sexEdEpisodeVideo, 1,/);
assert.match(televisionJs, /card\.dataset\.sexEdBackgroundFile \|\| SEX_ED_DEFAULT_BACKGROUND_FILE/);
assert.match(televisionJs, /card\.dataset\.sexEdPresentation \|\| "editorial"/);
assert.match(televisionJs, /card\.dataset\.sexEdRadioStation \|\| ""/);
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
assert.match(televisionJs, /const primaryLabel = comedyProgramme\?\.label \|\| sexEdProgramme\?\.label \|\| media\.label/);
assert.match(televisionJs, /const secondaryLabel = sexEdProgramme \? "MUSIC" : "FASHION"/);
assert.match(televisionJs, /nowPlaying\.dataset\.nowPlayingMode = comedyProgramme \? "comedy" : \(sexEdProgramme \? "sex-ed" : media\.mode\)/);
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
assert.match(televisionCss, /body\[data-sex-ed-presentation="fullscreen"\] \.adaptive-television-sex-ed-grid/);
assert.match(televisionCss, /body\[data-sex-ed-presentation="fullscreen"\] \.adaptive-television-sex-ed-episode[\s\S]*object-fit: cover[\s\S]*object-position: center center/);
assert.match(televisionCss, /body\.television-sex-ed-active \.adaptive-television-timecode \{\s*opacity: 1 !important;/);
assert.match(televisionJs, /const source = document\.body\.classList\.contains\("television-comedy-active"\)[\s\S]*\? comedyVideo[\s\S]*classList\.contains\("television-sex-ed-active"\)[\s\S]*\? sexEdEpisodeVideo[\s\S]*: localVideo;/);
assert.match(televisionJs, /sexEdEpisodeVideo\?\.addEventListener\("loadedmetadata", updateTimecode\)/);
assert.match(televisionJs, /sexEdEpisodeVideo\?\.addEventListener\("timeupdate", updateTimecode\)/);
assert.match(televisionJs, /sexEdEpisodeVideo\?\.addEventListener\("pause", \(\) => \{[\s\S]{0,120}sexEdEpisodeStart\.hidden = true/);

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
assert.match(sexEdJs, /const SEX_ED_BROADCAST_CHANNEL_ID = "sex-ed"/);
assert.match(sexEdJs, /joinBroadcast\?\.\(SEX_ED_BROADCAST_CHANNEL_ID\)/);
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

console.log("Sex-ed sixteen-episode shelf, editorial backgrounds, and full-screen instruction preflight passed.");
