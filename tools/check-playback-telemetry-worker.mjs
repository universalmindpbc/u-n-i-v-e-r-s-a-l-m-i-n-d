import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await fs.readFile(path.join(ROOT, "cloudflare", "playback-telemetry-worker.js"), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const worker = (await import(moduleUrl)).default;

const writes = [];
const env = {
  PLAYBACK_TELEMETRY: {
    writeDataPoint(point) {
      writes.push(point);
    },
  },
};

const event = {
  schema_version: "iam_playback_telemetry_v2",
  event_name: "controller_seek",
  event_time_ms: Date.now(),
  session_id: "livestream_stability_test",
  page_path: "/vogue/iam/index.html",
  role: "music",
  playback_rate: 1,
  drift_seconds: -3.05,
  correction: "controlled_rejoin",
  buffer_before_correction: 14.2,
  seeking: true,
  seek_reason: "controlled_rejoin",
  seek_duration_ms: 180,
  seek_count: 2,
  controller_seek_count: 1,
  broadcast_mode: "shared",
  broadcast_channel_id: "video-modul8-infinity",
  programme_instance_id: "video-modul8-infinity.1.123",
  stream_priority: "primary",
  clock_source: "server_midpoint_monotonic",
  document_media_count: 4,
  active_media_count: 1,
  hidden_active_media_count: 0,
  hidden_loading_media_count: 0,
  attached_stream_count: 1,
};

const response = await worker.fetch(new Request("https://iam-playback-telemetry.example/events", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain;charset=UTF-8",
    Origin: "https://staging.universalmind.tv",
  },
  body: JSON.stringify({ schema_version: event.schema_version, events: [event] }),
}), env);

assert.equal(response.status, 202);
assert.deepEqual(await response.json(), { ok: true, accepted: 1 });
assert.equal(writes.length, 1);
assert.equal(writes[0].blobs.length, 20, "Analytics Engine must stay within the twenty-blob schema.");
assert.equal(writes[0].doubles.length, 20, "Analytics Engine must stay within the twenty-double schema.");
assert.equal(writes[0].doubles[16], 1, "Playback rate must be persisted as the first v2 double.");
assert.equal(writes[0].blobs[13], "controlled_rejoin", "Correction state must be persisted in the v2 blob schema.");

const health = await worker.fetch(new Request("https://iam-playback-telemetry.example/health"), env);
assert.equal(health.status, 200);
assert.equal((await health.json()).schema, "iam_playback_telemetry_v2");

console.log("Playback telemetry Worker preflight passed: v2 sync fields are accepted and persisted within Analytics Engine limits.");
