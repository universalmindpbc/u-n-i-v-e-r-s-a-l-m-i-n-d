import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const read = (name) => fs.readFileSync(path.join(iam, name), "utf8");
const schedule = JSON.parse(read("broadcast-schedule-v1.json"));
const tensor = JSON.parse(read("radio-station-tensor-notion-export-v1.0.json"));
const catalogue = JSON.parse(read("adaptive-music-video-catalogue-v1.11.json"));
const controller = read("adaptive-environment-television.js");
const logo = read(path.join("a s s e t s", "radio-logos", "worldwide-fm.svg"));

const channel = schedule.channels.find((candidate) => candidate.id === "radio-champagne-bohemia");
assert.ok(channel, "Champagne Bohemia Radio is missing");

const expected = [
  { stationId: "cafe-del-mar-chill", startUtc: "00:00", endUtc: "03:00", seconds: 10800 },
  { stationId: "groove-salad-classic", startUtc: "03:00", endUtc: "05:00", seconds: 7200 },
  { stationId: "nts-poolside", startUtc: "05:00", endUtc: "07:00", seconds: 7200 },
  { stationId: "worldwide-fm", startUtc: "07:00", endUtc: "13:00", seconds: 21600 },
  { stationId: "nts-low-key", startUtc: "13:00", endUtc: "15:00", seconds: 7200 },
  { stationId: "groove-salad", startUtc: "15:00", endUtc: "17:00", seconds: 7200 },
  { stationId: "groove-salad-classic", startUtc: "17:00", endUtc: "19:00", seconds: 7200 },
  { stationId: "nts-slow-focus", startUtc: "19:00", endUtc: "21:00", seconds: 7200 },
  { stationId: "cafe-del-mar-chill", startUtc: "21:00", endUtc: "24:00", seconds: 10800 },
];

const hhmm = (seconds) => {
  if (seconds === 86400) return "24:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

let cursor = 0;
const actual = channel.schedule.map((entry) => {
  const startUtc = hhmm(cursor);
  cursor += Number(entry.duration_seconds);
  return {
    stationId: entry.station_id,
    startUtc,
    endUtc: hhmm(cursor),
    seconds: Number(entry.duration_seconds),
  };
});
assert.deepEqual(actual, expected);
assert.equal(cursor, 86400, "The Champagne Bohemia schedule must total exactly 24 hours");

const allocations = new Map();
for (const entry of channel.schedule) {
  const family = entry.station_id.startsWith("nts-") ? "nts" : entry.station_id;
  allocations.set(family, (allocations.get(family) || 0) + Number(entry.duration_seconds));
}
assert.deepEqual(Object.fromEntries(allocations), {
  "cafe-del-mar-chill": 21600,
  "groove-salad-classic": 14400,
  nts: 21600,
  "worldwide-fm": 21600,
  "groove-salad": 7200,
});

const worldwide = tensor.records.find((record) => record.id === "worldwide-fm");
assert.ok(worldwide, "Worldwide FM is missing from the station tensor");
assert.equal(worldwide.provider, "Worldwide FM");
assert.equal(worldwide.display_title, "Worldwide FM");
assert.equal(worldwide.stream_url, "https://worldwide-fm.radiocult.fm/stream");
assert.equal(worldwide.stream_transport, "Direct MP3");
assert.equal(worldwide.fallback_station_id, "cafe-del-mar-chill");
assert.equal(worldwide.permission_scope, "Closed beta only; public launch partnership pending");
assert.deepEqual(worldwide.music_room_fit, ["champagne-bohemia"]);
assert.equal(tensor.record_count, 12);

const champagnePool = catalogue.music_rooms["champagne-bohemia"].station_pool;
for (const stationId of ["worldwide-fm", "nts-poolside", "nts-low-key", "nts-slow-focus"]) {
  assert.ok(champagnePool.includes(stationId), `${stationId} is missing from the Champagne Bohemia station pool`);
}
assert.equal(catalogue.radio_stations.approved_count, 12);
assert.ok(catalogue.radio_stations.station_ids.includes("worldwide-fm"));

assert.match(controller, /id: "worldwide-fm"[\s\S]*?fallback_station_id: "cafe-del-mar-chill"/);
assert.match(controller, /async function startScheduledRadioFallback/);
assert.match(controller, /await startScheduledRadioFallback\(station, options, loadingGeneration, error\)/);
assert.match(controller, /radioRecoveryCount >= 3 && fallbackStationFor\(continuationDecision\)/);
assert.match(controller, /radioFallbackFrom/);
assert.match(controller, /radioFallbackTo/);
assert.match(controller, /radioScheduledStationId/);
assert.match(logo, /<title id="title">Worldwide FM<\/title>/);

console.log("Champagne Bohemia radio passed: exact 24-hour UTC arc, 6/4/2/6/6 allocation, three NTS programmes, Worldwide FM identity, closed-beta scope and Café del Mar fallback.");
