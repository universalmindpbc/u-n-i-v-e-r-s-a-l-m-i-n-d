import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const guide = read("i  a m/universal-one-adaptive-recommendation-guide-v1.txt");
const portalGuide = read("i  a m/universal-one-portal-guide-v1.txt");
const programmeGuide = read("i  a m/universal-one-programme-guide-v1.txt");
const worker = read("cloudflare/iam-citizen-needs-worker.js");
const phpFallback = read("i  a m/api/realtime-client-secret.php");
const realtimeClient = read("i  a m/realtime-voice-assistant.js");
const index = read("i  a m/index.html");
const indexAlt = read("i  a m/index-alt.html");
const alternateEntry = read("i  a m/adaptive-environment-television.html");
const promptV555 = read("i  a m/i n f e r e n c e  e n g i n e  -  s y s t e m  p r o m p t  v  5 . 5 5.md");
const fusion = read("i  a m/current-inference-fusion-v1.js");
const handoff = read("i  a m/api/heart-check-handoff-lib.php");
const blueprint = read("research/I_AM_EMDR_ADAPTIVE_SOUND_SYNTH_CANONICAL_BLUEPRINT.md");
const science = read("i  a m/science-research-data-v1.js");
const research = read("i  a m/research.html");
const impact = read("i  a m/impact.html");
const recommendationPage = read("i  a m/technology-inference-engine.html");
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));
const stagingDeploy = read("deploy-panthur-staging.sh");

assert.match(guide, /UNIVERSAL ONE ADAPTIVE RECOMMENDATION GUIDE \/ V1\.1/);
assert.ok(guide.length < 15000, "adaptive guide should remain concise enough for Realtime briefing");

for (const fact of [
  /self-report as the primary meaning/,
  /supporting, conflicting, not_available or invalid/,
  /final music room, the exact deterministic Song Tensor music\/video trajectory, the adaptive-sound band and the adaptive-sound carrier/,
  /Heart Rate never acts alone/,
  /Without an accepted self-report, Heart Rate cannot create a personalised recommendation/,
  /does not receive the citizen's self-report, raw Heart Rate, Heart Rate zone or role/,
]) {
  assert.match(guide, fact);
}

assert.match(promptV555, /deterministic current-session fusion layer that can influence the final music room, exact Song Tensor selection trajectory, adaptive-sound band and carrier/);
assert.match(promptV555, /Heart Rate cannot select any output alone/);
assert.match(fusion, /outputsChanged\.push\("music_room"\)/);
assert.match(fusion, /outputsChanged\.push\("exact_music_selection"\)/);
assert.match(fusion, /outputsChanged\.push\("adaptive_sound_band"\)/);
assert.match(fusion, /outputsChanged\.push\("adaptive_sound_carrier"\)/);
assert.match(fusion, /heart_rate_can_select_alone: false/);
assert.match(fusion, /raw_heart_rate_retained: false/);

for (const privacyFact of [
  /camera video stream is processed on the device and is not recorded or stored/,
  /Do not claim that the entire Heart Rate flow stays on-device/,
  /AES-256-GCM-encrypted/,
  /expires after 60 seconds, is consumed once and is deleted/,
  /Raw Heart Rate and Heart Rate-derived health data are stripped from the OpenAI request/,
]) {
  assert.match(guide, privacyFact);
}
assert.match(handoff, /IAM_HEART_CHECK_HANDOFF_TTL_SECONDS = 60/);
assert.match(handoff, /openssl_encrypt[\s\S]{0,240}'aes-256-gcm'/);
assert.match(handoff, /'httponly' => true/);
assert.match(handoff, /'samesite' => 'Strict'/);
assert.match(handoff, /iam_heart_check_handoff_take_record/);

for (const soundFact of [
  /Delta 3\.33 Hz/,
  /Theta 7\.38 Hz/,
  /Alpha 10\.11 Hz/,
  /Gamma exactly 111 Hz/,
  /111 Hz for cognition\/joy/,
  /222 Hz for self-connection/,
  /444 Hz for presence/,
  /555 Hz for social connection/,
  /999 Hz for earth\/focus\/reward/,
  /14,444 Hz low-pass/,
  /7\.38088 Hz isochronic modulation carried on 111\.011 Hz/,
  /constant 528\.088 Hz sine wave/,
]) {
  assert.match(guide, soundFact);
}
assert.match(blueprint, /Gamma = exactly 111 Hz/);
assert.match(blueprint, /low-pass cutoff of exactly \*\*14,444 Hz\*\*/);
assert.match(blueprint, /optional current 10-second Heart Rate observation/);
assert.match(science, /grade: "B"/);
assert.match(science, /Only nine healthy adults participated/);
assert.match(science, /Uncontrolled, unpublished single-participant observation/);

assert.match(recommendationPage, /How We Recommend Content/);
assert.match(recommendationPage, /The highest-ranked combination becomes the next television choice/);
assert.match(research, /The modul8 infinity Study/);
assert.match(research, /Rapid Stress Reduction, Social Connection, and Empathy/);
assert.match(research, /Cognitive, Affective &amp; Connection Endpoints/);
assert.match(research, /State Connection &amp; Empathy Scale \(IOS \/ SSCS\)/);
assert.match(research, /candidate transcriptomic markers \(<em>OXTR<\/em> and <em>CD38<\/em>\)/);
assert.match(research, /currently being presented to partner institutions for formal re-engagement, HREC ethics approval, and operational onboarding/);
assert.match(research, /2D equilateral triangular meshes and 3D tetrahedral volumetric spatial modeling/);
assert.match(impact, /LIVE INPUTS IN DEVELOPMENT · CURRENT FIGURES ARE ILLUSTRATIVE/);
assert.match(guide, /proposed four-arm, double-blind, stage-gated RCT/);
assert.match(guide, /trial title now includes rapid stress reduction, social connection and empathy/);
assert.match(guide, /CANTAB Spatial Working Memory for connection to self\/internal regulation/);
assert.match(guide, /CANTAB Emotion Recognition Task facial-empathy and social-emotional-acuity scores/);
assert.match(guide, /3-item State Connection & Empathy Scale \(IOS \/ SSCS\)/);
assert.match(guide, /candidate transcriptomic markers OXTR and CD38/);
assert.match(guide, /not current Universal One measurements, recommendation inputs, completed findings, validated mechanisms or clinical outcomes/);
assert.match(guide, /Do not say that Universal One currently measures, scores, infers or improves a visitor's connection or empathy/);
assert.match(guide, /2D equilateral triangular meshes and 3D tetrahedral volumetric models/);
assert.match(guide, /proposed research architecture, not a deployed or validated feature/);
assert.match(guide, /every displayed current figure is illustrative, not an achieved metric/);

const champagneRadio = schedule.channels.find(
  (channel) => channel.editorial_id === "champagne-bohemia" && channel.format === "radio",
);
assert.ok(champagneRadio?.schedule.some((item) => item.station_id === "worldwide-fm"));
const modul8Videos = schedule.channels.find(
  (channel) => channel.editorial_id === "modul8-infinity" && channel.format === "videos",
);
assert.ok(modul8Videos?.schedule.some((item) => item.track_id === "grimes-genesis"));
assert.match(programmeGuide, /Grimes “Genesis” belongs to modul8 infinity Videos, not james bondage/);

assert.match(worker, /import UNIVERSAL_ONE_ADAPTIVE_RECOMMENDATION_GUIDE/);
assert.match(worker, /# Adaptive recommendation, Heart Rate and research guide\n\$\{UNIVERSAL_ONE_ADAPTIVE_RECOMMENDATION_GUIDE\}/);
assert.match(worker, /adaptive_recommendation_guide_version: "v1\.1"/);
assert.match(worker, /voice_briefing_version: "v3"/);
assert.match(phpFallback, /universal-one-adaptive-recommendation-guide-v1\.txt/);
assert.match(phpFallback, /# Adaptive recommendation, Heart Rate and research guide\n\{\$adaptiveRecommendationGuide\}/);
assert.match(phpFallback, /'adaptive_recommendation_guide_version' => 'v1\.1'/);
assert.match(phpFallback, /'voice_briefing_version' => 'v3'/);

for (const scenario of [
  "adaptive-recommendations",
  "heart-rate-privacy",
  "sound-research",
  "research-impact",
  "research-connection-empathy",
  "programme-current",
]) {
  assert.match(realtimeClient, new RegExp(`qaScenario === "${scenario}"`));
}
assert.match(realtimeClient, /microphone: false/);
assert.match(realtimeClient, /M8 39-GIF twelve-screen layout/);
assert.match(realtimeClient, /24% ducking of the current music or party programme/);
assert.match(realtimeClient, /State Connection & Empathy Scale \(IOS \/ SSCS\)/);
const realtimeToken = `realtime-voice-${createHash("sha256").update(realtimeClient).digest("hex").slice(0, 12)}`;
assert.match(index, new RegExp(`realtime-voice-assistant\\.js\\?v=${realtimeToken}`));
assert.match(indexAlt, new RegExp(`realtime-voice-assistant\\.js\\?v=${realtimeToken}`));
assert.match(alternateEntry, new RegExp(`realtime-voice-assistant\\.js\\?v=${realtimeToken}`));

assert.match(portalGuide, /PORTAL GUIDE \/ V1\.2/);
assert.match(programmeGuide, /programme_guide_v1\.6/);
assert.match(stagingDeploy, /check-universal-one-adaptive-guide\.mjs/);

console.log("Universal One adaptive recommendation guide checks passed.");
