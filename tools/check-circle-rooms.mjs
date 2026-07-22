import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iamDirectory = path.join(root, "i  a m");
const paths = {
  page: path.join(iamDirectory, "index.html"),
  controller: path.join(iamDirectory, "circle-audio-rooms.js"),
  styles: path.join(iamDirectory, "circle-audio-rooms.css"),
  television: path.join(iamDirectory, "adaptive-environment-television.js"),
  worker: path.join(root, "cloudflare", "agora-audio-room-worker.js"),
  workerConfig: path.join(root, "cloudflare", "wrangler.agora-audio.toml"),
};

const source = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, filePath]) => (
  [key, await fs.readFile(filePath, "utf8")]
))));

function requireCondition(condition, message) {
  if (!condition) throw new Error(`Circle rooms preflight failed: ${message}`);
}

const circles = [
  ["img", "[ models 💃 ]"],
  ["wme", "[ talent 🌐 ]"],
  ["north-bondi-rsl", "[ veterans 🎖️ ]"],
  ["nagnata", "[ customers 🩱 ]"],
  ["aime", "[ first nations imagination 🧘🏾‍♀️ ]"],
  ["black-rainbow", "[ first nations mental health 🌈 ]"],
  ["headspace", "[ youth mental health 🧩 ]"],
  ["phoenix", "[ veterans mental health 🐦‍🔥 ]"],
];

requireCondition(source.page.includes(">Select A Circle</h2>"), "the approved selector heading is missing");
requireCondition(
  source.page.includes("[ live audio rooms · 9 person capacity each ]"),
  "the approved capacity line is missing"
);
requireCondition((source.page.match(/data-circle-id=/g) || []).length === circles.length, "the selector must expose exactly eight Circles");
for (const [circleId, description] of circles) {
  requireCondition(source.page.includes(`data-circle-id="${circleId}"`), `${circleId} is missing from the selector`);
  requireCondition(source.page.includes(description), `${circleId} does not retain its approved description`);
  requireCondition(source.controller.includes(`id: "${circleId}"`), `${circleId} is missing from the browser controller`);
  requireCondition(source.worker.includes(`id: "${circleId}"`), `${circleId} is missing from the Worker catalogue`);
}

requireCondition(source.controller.includes("createMicrophoneAudioTrack"), "the browser controller cannot publish microphone audio");
requireCondition(source.controller.includes('muted: true'), "new Circle members do not enter muted");
requireCondition(source.television.includes('window.IAMCircleRooms?.open?.'), "the wallet does not open the Circle selector");
requireCondition(source.television.includes('iam:circle-room-state'), "the compact wallet does not receive live Circle state");
requireCondition(source.worker.includes("const ROOM_CAPACITY = 9;"), "the Worker room capacity is not nine");
requireCondition(source.worker.includes("this.allocationTail = Promise.resolve();"), "seat allocation is not serialised");
requireCondition(source.worker.includes("RtcTokenBuilder.buildTokenWithUid"), "the Worker does not mint per-session Agora tokens");
requireCondition(source.workerConfig.includes('name = "CIRCLE_ROOMS"'), "the Durable Object binding is missing");
requireCondition(source.workerConfig.includes('new_sqlite_classes = ["CircleRoom"]'), "the Durable Object migration is missing");
requireCondition(!source.workerConfig.includes("AGORA_CHILLOUT_POD_RTC_TOKEN"), "the retired temporary RTC token is still configured");

const scriptToken = `circle-rooms-${createHash("sha256").update(source.controller).digest("hex").slice(0, 12)}`;
const styleToken = `circle-rooms-css-${createHash("sha256").update(source.styles).digest("hex").slice(0, 12)}`;
requireCondition(source.page.includes(`circle-audio-rooms.js?v=${scriptToken}`), `the Circle controller cache token must be ${scriptToken}`);
requireCondition(source.page.includes(`circle-audio-rooms.css?v=${styleToken}`), `the Circle stylesheet cache token must be ${styleToken}`);

console.log(`Circle rooms preflight passed (${scriptToken}, ${styleToken}).`);
