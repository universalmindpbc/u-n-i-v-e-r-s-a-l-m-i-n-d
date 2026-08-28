import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const schedule = JSON.parse(await fs.readFile(path.join(iam, "broadcast-schedule-v1.json"), "utf8"));
const tensorRelations = JSON.parse(await fs.readFile(path.join(root, "tools", "programme-tensor-relations-v1.json"), "utf8"));

const trackSandbox = { window: {} };
vm.runInNewContext(await fs.readFile(path.join(iam, "music-track-catalogue-v1.js"), "utf8"), trackSandbox);
const tracks = new Map(trackSandbox.window.IAMTrackCatalogue.tracks.map((track) => [track.id, track]));
const radioTensor = JSON.parse(await fs.readFile(path.join(iam, "radio-station-tensor-notion-export-v1.0.json"), "utf8"));
const stations = new Map(radioTensor.records.map((station) => [station.id, station]));

const timeZones = {
  sydney: "Australia/Sydney",
  ibiza: "Europe/Madrid",
  los_angeles: "America/Los_Angeles",
};
const roomLabels = {
  "inner-planes": "Inner Planes",
  "champagne-bohemia": "Champagne Bohemia",
  "modul8-infinity": "modul8 infinity",
  "james-bondage": "james bondage",
  "safety-cushion": "safety cushion",
};
const formatLabels = { videos: "Videos", parties: "Parties", radio: "Radio" };
const notionRichText = (value) => String(value).replace(/[\\*~`$\[\]<>{}|^]/g, "\\$&");
const cleanProperties = (properties) => Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== null && value !== undefined && value !== ""));

function localParts(timestampMs, timeZone) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestampMs)).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
}

function localRange(startMs, endMs, timeZone) {
  const start = localParts(startMs, timeZone);
  const end = localParts(endMs, timeZone);
  return `${start.weekday} ${start.hour}:${start.minute}–${end.weekday} ${end.hour}:${end.minute}`;
}

function daypart(timestampMs, timeZone = timeZones.sydney) {
  const hour = Number(localParts(timestampMs, timeZone).hour);
  if (hour < 6) return "Overnight";
  if (hour < 10) return "Morning";
  if (hour < 18) return "Daytime";
  if (hour < 22) return "Evening";
  return "Late night";
}

function directionFor(profile) {
  if (!profile) return null;
  if (profile.direction) return profile.direction;
  if (profile.closing > profile.opening + .25) return "Rise";
  if (profile.closing < profile.opening - .25) return "Release";
  return profile.middle <= 3 ? "Reset" : "Hold";
}

function transitionFor(part) {
  if (part === "Overnight") return "Protect overnight and waking listeners with space, detail and a soft landing.";
  if (part === "Morning") return "Support waking, preparation and focused forward movement without forcing a peak.";
  if (part === "Daytime") return "Keep movement intelligent and usable for work, walking and daytime flow.";
  if (part === "Evening") return "Build collective energy into the local evening while keeping Ibiza and Los Angeles complementary.";
  return "Release the peak into a coherent late-night descent and reset.";
}

function identityFor(entry) {
  if (entry.station_id) {
    const station = stations.get(entry.station_id) || {};
    return {
      id: entry.station_id,
      artist: station.provider || "Live radio",
      title: station.display_title || station.title || entry.station_id,
    };
  }
  const track = tracks.get(entry.track_id) || {};
  return {
    id: entry.track_id,
    artist: track.artist || "Universal Mind",
    title: track.displayTitle || track.title || entry.track_id,
  };
}

const rows = [];
for (const channel of schedule.channels.filter(({ format, internal }) => ["videos", "parties", "radio"].includes(format) && internal !== true)) {
  const roomId = channel.editorial_id || channel.id.replace(/^(video|party|radio)-/, "");
  if (!roomLabels[roomId]) continue;
  const epochMs = Date.parse(channel.epoch_utc || schedule.epoch_utc);
  let cursorSeconds = 0;
  channel.schedule.forEach((entry, index) => {
    const durationSeconds = Number(entry.duration_seconds);
    const startMs = epochMs + (cursorSeconds * 1000);
    const endMs = startMs + (durationSeconds * 1000);
    const identity = identityFor(entry);
    const context = entry.anchor_context || null;
    const profile = entry.content_energy_profile || null;
    const sydneyPart = context?.sydney?.daypart || daypart(startMs);
    const syncKey = `${schedule.version}:${channel.id}:${index + 1}:${identity.id}`;
    const relation = tensorRelations[identity.id] || null;
    rows.push({ properties: cleanProperties({
      Programme: notionRichText(`${identity.artist} — ${identity.title}`),
      Artist: notionRichText(identity.artist),
      Set: notionRichText(identity.title),
      "Track ID": notionRichText(identity.id),
      "Media ID": notionRichText(identity.id),
      "Channel ID": notionRichText(channel.id),
      "Music Room": roomLabels[roomId],
      Format: formatLabels[channel.format],
      Sequence: index + 1,
      "Cycle Sequence": index + 1,
      Rotation: entry.rotation || null,
      "Rotation Position": entry.rotation_position || null,
      Pass: entry.rotation ? `Pass ${entry.rotation}` : null,
      "Duration Seconds": durationSeconds,
      "Duration Minutes": Number((durationSeconds / 60).toFixed(3)),
      "Start Offset Hours": Number((cursorSeconds / 3600).toFixed(6)),
      "date:UTC Slot:start": new Date(startMs).toISOString(),
      "date:UTC Slot:end": new Date(endMs).toISOString(),
      "date:UTC Slot:is_datetime": 1,
      Sydney: notionRichText(context ? `${context.sydney.start}–${context.sydney.end.split(", ").at(-1)}` : localRange(startMs, endMs, timeZones.sydney)),
      Ibiza: notionRichText(context ? `${context.ibiza.start}–${context.ibiza.end.split(", ").at(-1)}` : localRange(startMs, endMs, timeZones.ibiza)),
      "Los Angeles": notionRichText(context ? `${context.los_angeles.start}–${context.los_angeles.end.split(", ").at(-1)}` : localRange(startMs, endMs, timeZones.los_angeles)),
      "Sydney Day": localParts(startMs, timeZones.sydney).weekday,
      "Sydney Daypart": sydneyPart,
      "Sydney Solar Phase": context?.sydney?.solar_phase || null,
      "Ibiza Solar Phase": context?.ibiza?.solar_phase || null,
      "Los Angeles Solar Phase": context?.los_angeles?.solar_phase || null,
      "Energy Phase": profile?.phase || null,
      "Opening Energy": profile?.opening || null,
      "Middle Energy": profile?.middle || null,
      "Closing Energy": profile?.closing || null,
      "Arousal Reference": profile?.arousal || null,
      "Calm Reference": profile?.calm || null,
      "Editorial Direction": directionFor(profile),
      "Global Moment": notionRichText(context
        ? `Sydney ${context.sydney.daypart.toLowerCase()} / ${context.sydney.solar_phase} · Ibiza ${context.ibiza.daypart.toLowerCase()} / ${context.ibiza.solar_phase} · Los Angeles ${context.los_angeles.daypart.toLowerCase()} / ${context.los_angeles.solar_phase}`
        : `Exact ${channel.name} ${formatLabels[channel.format].toLowerCase()} cycle`),
      "Transition Notes": notionRichText(transitionFor(sydneyPart)),
      "Tensor Source": relation ? [relation] : null,
      "Review Status": "Ben reviewing",
      "Scheduler Ready": "__YES__",
      "Schedule Version": notionRichText(schedule.version),
      Deployment: "Staging Candidate",
      Canonical: "__YES__",
      "Coverage Note": notionRichText(channel.id === "party-modul8-infinity"
        ? "32 complete programmes × four reordered rotations. Sydney is the editorial anchor; Ibiza and Los Angeles daypart plus sunrise/sunset context is recorded for every occurrence. No programme is truncated, omitted or overlapped."
        : `Exact one-cycle runtime mirror for ${channel.name} ${formatLabels[channel.format]}.`),
      "Sync Key": notionRichText(syncKey),
    }) });
    cursorSeconds += durationSeconds;
  });
}

for (const format of ["Parties", "Radio"]) {
  const channelId = `${format === "Parties" ? "party" : "radio"}-safety-cushion`;
  rows.push({ properties: {
    Programme: `PROGRAMMING GAP — safety cushion ${format}`,
    Artist: "Universal Mind programming",
    Set: "No live source is currently scheduled",
    "Channel ID": channelId,
    "Music Room": "safety cushion",
    Format: format,
    "Review Status": "Revise",
    "Scheduler Ready": "__NO__",
    "Schedule Version": schedule.version,
    Deployment: "Programming Gap",
    Canonical: "__YES__",
    "Coverage Note": "Visible gap row: no source is currently scheduled for this room and format. Do not infer or duplicate a source.",
    "Sync Key": `${schedule.version}:${channelId}:gap`,
  } });
}

const requestedBatch = Number(process.argv[2] || 0);
const requestedBatchSize = Number(process.argv[3] || 25);
const start = requestedBatch * requestedBatchSize;
const pages = rows.slice(start, start + requestedBatchSize);
console.log(JSON.stringify({
  parent: { data_source_id: "450a7515-e2eb-4644-ad4d-d5b4af910f53" },
  pages,
  _meta: { total: rows.length, batch: requestedBatch, batch_size: requestedBatchSize, start, returned: pages.length },
}));
