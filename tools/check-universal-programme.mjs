import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const read = (name) => fs.readFileSync(path.join(iam, name), "utf8");
const scheduleSource = read("broadcast-schedule-v1.json");
const schedule = JSON.parse(scheduleSource);
const sha12 = (source) => crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);
const channel = (id) => schedule.channels.find((candidate) => candidate.id === id);

assert.equal(schedule.version, "broadcast_schedule_v1.14");
const modul8 = channel("party-modul8-infinity");
assert.equal(modul8.schedule.length, 128);
assert.equal(new Set(modul8.schedule.map(({ track_id: trackId }) => trackId)).size, 32);
assert.equal(modul8.global_week_programming.occurrence_count, 128);
assert.equal(modul8.global_week_programming.cycle_duration, "194h 31m 58s");
assert.equal(modul8.global_week_programming.duration_policy, "Complete source programmes; no truncation, omission or overlap");
assert.ok(Math.abs(modul8.global_week_programming.cycle_seconds - 700317.8) < .01);

const programmeIds = new Set(modul8.schedule.map(({ track_id: trackId }) => trackId));
for (const id of programmeIds) assert.equal(modul8.schedule.filter(({ track_id: trackId }) => trackId === id).length, 4, `${id} does not play once per rotation`);
for (let rotation = 1; rotation <= 4; rotation += 1) {
  const entries = modul8.schedule.filter(({ rotation: currentRotation }) => currentRotation === rotation);
  assert.equal(entries.length, 32);
  assert.equal(new Set(entries.map(({ track_id: trackId }) => trackId)).size, 32);
  assert.deepEqual(entries.map(({ rotation_position: position }) => position), Array.from({ length: 32 }, (_, index) => index + 1));
  assert.ok(Math.abs(entries.reduce((sum, entry) => sum + entry.duration_seconds, 0) - 175079.45) < .01);
  assert.ok(entries.every((entry) => entry.anchor_start_utc && entry.anchor_context?.sydney?.solar_phase && entry.anchor_context?.ibiza?.solar_phase && entry.anchor_context?.los_angeles?.solar_phase));
  assert.ok(entries.every((entry) => entry.content_energy_profile?.phase));
}

const primaryChannels = schedule.channels.filter(({ format, internal }) => ["videos", "parties", "radio"].includes(format) && internal !== true);
assert.equal(primaryChannels.length, 13);
assert.equal(primaryChannels.reduce((sum, current) => sum + current.schedule.length, 0), 245);
assert.equal(channel("video-safety-cushion").schedule.length, 21);
assert.equal(channel("party-safety-cushion"), undefined);
assert.equal(channel("radio-safety-cushion"), undefined);

const exportResult = spawnSync(process.execPath, [path.join(root, "tools", "export-universal-programme-notion-pages.mjs"), "0", "1000"], { encoding: "utf8" });
assert.equal(exportResult.status, 0, exportResult.stderr);
const notionExport = JSON.parse(exportResult.stdout);
assert.equal(notionExport._meta.total, 247);
assert.equal(notionExport.pages.length, 247);
const syncKeys = notionExport.pages.map(({ properties }) => properties["Sync Key"]);
assert.equal(new Set(syncKeys).size, 247);
assert.equal(notionExport.pages.filter(({ properties }) => properties.Deployment === "Programming Gap").length, 2);
assert.equal(notionExport.pages.filter(({ properties }) => properties["Tensor Source"]?.length).length, 144);

const tensorRelations = JSON.parse(fs.readFileSync(path.join(root, "tools", "programme-tensor-relations-v1.json"), "utf8"));
const newManifest = JSON.parse(fs.readFileSync(path.join(root, "cloudflare-stream-new-videos-20260827-manifest.json"), "utf8"));
for (const id of Object.keys(newManifest.files)) assert.match(tensorRelations[id] || "", /^https:\/\/app\.notion\.com\/[a-f0-9]{32}$/);

const scheduleToken = `broadcast-schedule-${sha12(scheduleSource)}`;
assert.ok(read("broadcast-clock-v1.js").includes(scheduleToken));
assert.ok(read("programme-guide.js").includes(scheduleToken));

console.log("Universal programme checks passed: 32 programmes × four complete contextual rotations, 245 runtime rows, 247 Notion control rows, 21/21 new Tensor relations, and two explicit safety cushion coverage gaps.");
