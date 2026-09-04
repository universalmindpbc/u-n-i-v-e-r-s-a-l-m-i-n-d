import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const tensor = JSON.parse(fs.readFileSync(path.join(iam, "radio-station-tensor-notion-export-v1.0.json"), "utf8"));
const catalogue = JSON.parse(fs.readFileSync(path.join(iam, "adaptive-music-video-catalogue-v1.11.json"), "utf8"));

const requiredNts = new Map([
  ["nts-slow-focus", "https://streams.radiomast.io/dfc76352-cda6-4a95-85dd-6f6609f83ba2"],
  ["nts-poolside", "https://streams.radiomast.io/052d2e3c-389c-44cf-a91a-8f5e1854f4c6"],
  ["nts-otaku", "https://streams.radiomast.io/7481798f-063c-42a2-8048-15ff98fe309e"],
  ["nts-low-key", "https://streams.radiomast.io/de114902-ee1b-441f-91bc-5468d1e77605"],
]);
const allowedRooms = new Set(["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"]);
const records = Array.isArray(tensor.records) ? tensor.records : [];

assert.equal(tensor.source_data_source, "collection://6993ebc6-bb6e-44c3-933a-18c5d6ad44bc");
assert.equal(tensor.record_count, 13);
assert.equal(tensor.supplemental_record_count, 1);
assert.equal(records.length, 13);
assert.equal(new Set(records.map((record) => record.id)).size, records.length, "station IDs must be unique");

for (const record of records) {
  assert.equal(record.mode, "radio", `${record.id} must use radio mode`);
  assert.equal(record.status, "Approved", `${record.id} must be Approved in the Notion export`);
  if (record.id === "worldwide-fm") {
    assert.equal(record.permission_scope, "Closed beta only; public launch partnership pending");
    assert.equal(record.approval_source, "Ben confirmed closed-beta permission on 2026-08-12");
    assert.equal(record.source_record_url, "https://www.worldwidefm.net/about");
  } else {
    assert.equal(record.permission_scope, "Internal demo only", `${record.id} permission scope is missing`);
    assert.match(record.notion_page_url, /^https:\/\/app\.notion\.com\/p\/[a-f0-9]{32}$/i, `${record.id} Notion page URL is invalid`);
  }
  assert.ok(record.stream_url, `${record.id} stream URL is missing`);
  assert.ok(record.player_url, `${record.id} player URL is missing`);
  assert.ok(["Direct MP3", "Direct AAC", "HLS", "Buffered HLS scheduler"].includes(record.stream_transport), `${record.id} transport is unsupported`);
  assert.ok(Array.isArray(record.music_room_fit), `${record.id} needs a music-room fit array`);
  assert.ok(record.music_room_fit.every((room) => allowedRooms.has(room)), `${record.id} has an invalid music room`);
  assert.ok(!record.music_room_fit.includes("safety-cushion"), `${record.id} cannot route radio into the music-video-only safety cushion room`);
  if (record.id !== "sanctuary-retro") assert.ok(record.music_room_fit.length, `${record.id} needs at least one active music room`);
  assert.equal(record.top_needs.length, 4, `${record.id} must expose exactly four leading citizen needs`);
}

for (const [id, streamUrl] of requiredNts) {
  const record = records.find((candidate) => candidate.id === id);
  assert.ok(record, `${id} is missing from the Notion tensor export`);
  assert.equal(record.provider, "NTS");
  assert.equal(record.stream_transport, "Buffered HLS scheduler");
  assert.equal(record.stream_url, streamUrl);
  assert.ok(!record.stream_url.endsWith("/hls.m3u8"), `${id} stores the canonical Radio Mast mount and derives HLS at runtime`);
  assert.equal(record.stream_format, "Buffered HLS audio segments");
  assert.match(record.player_url, /^https:\/\/www\.nts\.live\/infinite-mixtapes\//);
}

const worldwide = records.find((record) => record.id === "worldwide-fm");
assert.ok(worldwide, "Worldwide FM is missing from the closed-beta station tensor");
assert.equal(worldwide.provider, "Worldwide FM");
assert.equal(worldwide.stream_url, "https://worldwide-fm.radiocult.fm/stream");
assert.equal(worldwide.stream_transport, "Direct MP3");
assert.equal(worldwide.fallback_station_id, "cafe-del-mar-chill");
assert.deepEqual(worldwide.music_room_fit, ["champagne-bohemia"]);

const openLab = records.find((record) => record.id === "openlab-live");
assert.ok(openLab, "OpenLab is missing from the approved station tensor");
assert.equal(openLab.provider, "OpenLab");
assert.equal(openLab.stream_url, "https://ice09.fluidstream.net/openlab.aac");
assert.equal(openLab.stream_format, "AAC live stream");
assert.equal(openLab.stream_transport, "Direct AAC");
assert.deepEqual(openLab.music_room_fit, ["modul8-infinity"]);

const catalogueRadio = catalogue.radio_stations;
assert.equal(catalogueRadio.approved_count, records.length);
assert.deepEqual(new Set(catalogueRadio.station_ids), new Set(records.map((record) => record.id)));
for (const [room, definition] of Object.entries(catalogue.music_rooms)) {
  for (const stationId of definition.station_pool) {
    const record = records.find((candidate) => candidate.id === stationId);
    assert.ok(record, `${room} references unknown station ${stationId}`);
    assert.ok(record.music_room_fit.includes(room), `${stationId} is not classified for ${room}`);
  }
}
assert.deepEqual(catalogue.music_rooms["safety-cushion"].allowed_formats, ["videos"]);
assert.deepEqual(catalogue.music_rooms["safety-cushion"].station_pool, []);

console.log("Radio station tensor passed: 13 approved demo stations, OpenLab scheduling, Worldwide FM fallback, five-room routing, Safety Cushion isolation, and 4 NTS HLS streams.");
