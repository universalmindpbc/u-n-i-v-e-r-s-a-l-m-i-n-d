import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM_DIR = path.join(ROOT, "i  a m");
const read = (relativePath) => fs.readFile(path.join(ROOT, relativePath), "utf8");

const [television, streamController, clock, index, shop, telemetryWorker] = await Promise.all([
  read("i  a m/adaptive-environment-television.js"),
  read("i  a m/cloudflare-stream-controller.js"),
  read("i  a m/broadcast-clock-v1.js"),
  read("i  a m/index.html"),
  read("i  a m/shop.js"),
  read("cloudflare/playback-telemetry-worker.js"),
]);

for (const [label, source] of [
  ["television", television],
  ["Stream controller", streamController],
  ["broadcast clock", clock],
  ["Shop live band", shop],
]) {
  if (label !== "broadcast clock" || source.includes("(function")) new Script(source, { filename: label });
}

const playbackAssignments = [...`${television}\n${streamController}\n${shop}`.matchAll(/playbackRate\s*=\s*([^;\n]+)/g)]
  .map((match) => match[1].trim());
assert.ok(playbackAssignments.length >= 8, "Expected explicit rate locks on every playback surface.");
assert.ok(playbackAssignments.every((assignment) => assignment === "1"), `Non-unit playback rate remains: ${playbackAssignments.join(", ")}`);
assert.doesNotMatch(`${television}\n${shop}`, /fastSeek|soft_slow|soft_catchup|hard_seek/);

assert.match(television, /BROADCAST_REJOIN_BUFFER_SECONDS = 12/);
assert.match(television, /BROADCAST_REJOIN_REQUIRED_SAMPLES = 3/);
assert.match(television, /BROADCAST_REJOIN_COOLDOWN_MS = 30000/);
assert.match(television, /entry_seek_cooldown/);
assert.match(television, /media\.paused \|\|[\s\S]{0,180}media\.seeking[\s\S]{0,220}bufferSeconds < BROADCAST_REJOIN_BUFFER_SECONDS/);
assert.match(television, /performControlledBroadcastSeek\(media, targetSeconds, options, "controlled_rejoin"\)/);
assert.match(television, /BROADCAST_REJOIN_FADE_OUT_MS = 120/);
assert.match(television, /BROADCAST_REJOIN_FADE_IN_MS = 180/);

assert.match(clock, /clockAnchorServerMs \+ \(performanceNow - clockAnchorPerformanceMs\)/);
assert.match(clock, /CLOCK_RESYNC_INTERVAL_MS = 60000/);
assert.match(clock, /CLOCK_MAX_SMOOTHING_STEP_MS = 120/);
assert.doesNotMatch(clock, /return Date\.now\(\) \+ clockOffsetMs \+ \(qaOffsetSeconds/);

assert.match(streamController, /hls\.js@1\.6\.16/);
assert.match(streamController, /startLevel: 0/);
assert.match(streamController, /maxLiveSyncPlaybackRate: 1/);
assert.match(streamController, /initialAdaptiveCap\(role\)/);
assert.match(streamController, /estimatedKbps > 0 && estimatedKbps <= 1500\) return 360/);
assert.match(streamController, /estimatedKbps > 0 && estimatedKbps <= 3000\) return 480/);
assert.match(streamController, /fragLoadPolicy = \{/);
assert.match(streamController, /maxLoadTimeMs: 600000/);
assert.match(streamController, /constrained_primary_music_startup/);
assert.match(streamController, /autoStartLoad: \(state\.wantsPlayback \|\| state\.preloadRequested\) && !state\.auxiliarySuspended/);
assert.match(streamController, /MUSIC_HIGH_QUALITY_BUFFER_SECONDS = 24/);
assert.match(streamController, /averageBitrate: finiteNumber\(level\.averageBitrate, 0\)/);
assert.match(streamController, /const sustainedBitrate = finiteNumber\(targetLevel\?\.averageBitrate, 0\) \|\| finiteNumber\(targetLevel\?\.bitrate, 0\)/);
assert.match(streamController, /abrBandWidthUpFactor: \.72/);
assert.match(streamController, /streamRecoveryRequiredBandwidth/);
assert.match(streamController, /setAuxiliaryLoadingSuspended\(state, true/);
assert.match(streamController, /simulateNetworkOutage/);
assert.match(streamController, /data-stream-qa-outage/);
assert.match(streamController, /qa_buffer_exhaustion/);

const sexEdWorld = index.match(/<div class="adaptive-television-sex-ed-world"[\s\S]*?<button class="adaptive-television-sex-ed-start"/)?.[0] || "";
assert.match(sexEdWorld, /data-stream-deferred/);
assert.doesNotMatch(sexEdWorld, /data-stream-keep-alive|\sautoplay(?:\s|>)/);
assert.equal((sexEdWorld.match(/<video data-src=/g) || []).length, 4);
assert.equal((sexEdWorld.match(/preload="none"/g) || []).length, 6);
assert.match(television, /releaseSexEdLoopVideos/);
assert.match(television, /releaseUnusedRadioFashionRunways/);
assert.doesNotMatch(television, /channels\?\.\("radio"\)[\s\S]{0,300}forEach/);

for (const field of [
  "playback_rate",
  "drift_seconds",
  "correction",
  "seek_duration_ms",
  "controller_seek_count",
  "programme_instance_id",
  "broadcast_mode",
  "hidden_active_media_count",
  "hidden_loading_media_count",
  "buffer_before_correction",
]) {
  assert.ok(`${streamController}\n${television}`.includes(field), `Client telemetry is missing ${field}.`);
  assert.ok(telemetryWorker.includes(field), `Worker telemetry is missing ${field}.`);
}
assert.match(streamController, /iam_playback_telemetry_v2/);
assert.match(telemetryWorker, /iam_playback_telemetry_v2/);

console.log("Livestream stability preflight passed: rate 1.000, controlled recovery, deferred hidden media, buffer-led ABR, monotonic clock, and sync telemetry are enforced.");
