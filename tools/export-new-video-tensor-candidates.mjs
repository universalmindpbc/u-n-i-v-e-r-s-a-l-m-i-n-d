import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await fs.readFile(path.join(root, "cloudflare-stream-new-videos-20260827-manifest.json"), "utf8"));

const existingPages = new Map([
  ["soundgarden-black-hole-sun", "3947b9c9-9c56-8179-860d-f2e23cdd4e8b"],
  ["evanescence-bring-me-to-life", "3947b9c9-9c56-81dc-a6a0-e6fc21576431"],
]);

const energyProfiles = new Map([
  ["rihanna-global-citizens-festival-2016", { Arousal: .88, Calm: .18 }],
  ["ricardo-villalobos-circoloco-dc10-ibiza-2026", { Arousal: .68, Calm: .52 }],
  ["flume-coachella-2022-live", { Arousal: .88, Calm: .2 }],
  ["fred-again-thomas-bangalter-usb002-alexandra-palace-2026", { Arousal: .96, Calm: .08 }],
  ["skrillex-fred-again-four-tet-coachella", { Arousal: .98, Calm: .06 }],
]);

const channelFor = ({ musicRoom, format }) => `${format === "parties" ? "party" : "video"}-${musicRoom}`;
const notionRichText = (value) => String(value).replace(/[\\*~`$\[\]<>{}|^]/g, "\\$&");
const propertiesFor = (id, record) => ({
  Track: record.publicTitle,
  Artist: record.publicArtist,
  Status: "Candidate",
  Priority: 2,
  "Media Class": record.format === "parties" ? "DJ Set" : "Music Video",
  "Music Room Fit": [record.musicRoom],
  "Permission Scope": "Internal demo only",
  "Gold Standard Set": "None",
  "Training Utility": "Medium",
  "Music Video": "__YES__",
  "Youth Safety": "Review",
  "Memory Zone": "Unknown",
  "Memory Safety Grade": "Unknown",
  "Editorial Notes": "Runtime-integrated 2026-08-27 upload. Candidate Tensor record created to mirror the exact programme and Stream delivery metadata. Human review is required before Tensor approval; no clinical effect is claimed.",
  "JSON Profile": notionRichText(JSON.stringify({
    media_class: record.format === "parties" ? "long_form_dj_set" : "music_video",
    selected_track_id: id,
    cloudflare_stream_uid: record.uid,
    hls: record.hls,
    duration_seconds: record.duration,
    music_room: record.musicRoom,
    broadcast_channel: channelFor(record),
    programme_format: record.format,
    source_manifest: "cloudflare-stream-new-videos-20260827-manifest.json",
    tensor_status: "candidate",
    human_review_required: true,
  })),
  ...(energyProfiles.get(id) || {}),
});

const candidates = Object.entries(manifest.files).map(([id, record]) => ({ id, record, properties: propertiesFor(id, record) }));
const mode = process.argv[2] || "create";
if (mode === "create") {
  console.log(JSON.stringify({
    parent: { data_source_id: "6993ebc6-bb6e-44c3-933a-18c5d6ad44bc" },
    pages: candidates.filter(({ id }) => !existingPages.has(id)).map(({ properties }) => ({ properties })),
  }));
} else if (mode === "update") {
  console.log(JSON.stringify(candidates.filter(({ id }) => existingPages.has(id)).map(({ id, properties }) => ({
    page_id: existingPages.get(id),
    command: "update_properties",
    properties,
  }))));
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
