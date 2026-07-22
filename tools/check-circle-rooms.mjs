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
  ["img", "IMG", "Models"],
  ["wme", "WME", "Talent"],
  ["north-bondi-rsl", "North Bondi RSL", "Veterans"],
  ["nagnata", "NAGNATA", "Customers"],
  ["aime", "AIME", "First Nations imagination"],
  ["black-rainbow", "Black Rainbow", "First Nations mental health"],
  ["headspace", "Headspace", "Youth mental health"],
  ["phoenix", "Phoenix", "Veterans mental health"],
];

const selectorStart = source.page.indexOf('<section class="circle-room-selector"');
const selectorEnd = source.page.indexOf("</section>", selectorStart);
const selectorMarkup = source.page.slice(selectorStart, selectorEnd);

requireCondition(selectorStart >= 0 && selectorEnd > selectorStart, "the Circle selector markup is missing");
requireCondition(source.page.includes(">Join A Tribe</h2>"), "the approved selector heading is missing");
requireCondition(
  source.page.includes("9 people per room · you join muted"),
  "the approved capacity line is missing"
);
requireCondition(source.page.includes("live audio <span>circles</span>"), "the approved Live Audio Circles label is missing");
requireCondition((source.page.match(/data-circle-id=/g) || []).length === circles.length, "the selector must expose exactly eight Circles");
requireCondition((source.page.match(/data-circle-action=/g) || []).length === circles.length, "every Circle needs a direct-join action state");
requireCondition((source.page.match(/circle-room-selector__node-flower/g) || []).length === circles.length, "every Circle needs a Universal Mind flower");
for (const [circleId, name, description] of circles) {
  requireCondition(source.page.includes(`data-circle-id="${circleId}"`), `${circleId} is missing from the selector`);
  requireCondition(source.page.includes(`<span class="circle-room-selector__name">${name}</span>`), `${circleId} does not retain its approved name`);
  requireCondition(source.page.includes(`<span class="circle-room-selector__description">${description}</span>`), `${circleId} does not retain its approved description`);
  requireCondition(source.controller.includes(`id: "${circleId}"`), `${circleId} is missing from the browser controller`);
  requireCondition(source.controller.includes(`description: "${description}"`), `${circleId} does not retain its clean controller description`);
  requireCondition(source.worker.includes(`id: "${circleId}"`), `${circleId} is missing from the Worker catalogue`);
}
requireCondition(!selectorMarkup.includes("data-circle-availability"), "legacy room availability labels remain in the selector");
requireCondition(!selectorMarkup.includes("data-circle-selector-join"), "the redundant centre confirmation remains in the selector");
requireCondition(!selectorMarkup.includes("["), "decorative brackets remain in the selector copy");
requireCondition(!/[💃🌐🎖🩱🧘🌈🧩🐦🔥]/u.test(selectorMarkup), "legacy emojis remain in the selector copy");
requireCondition(!/>\s*open\s*</iu.test(selectorMarkup), "legacy Open labels remain in the selector copy");

requireCondition(source.controller.includes("createMicrophoneAudioTrack"), "the browser controller cannot publish microphone audio");
requireCondition(source.controller.includes('muted: true'), "new Circle members do not enter muted");
requireCondition(source.television.includes('window.IAMCircleRooms?.open?.'), "the wallet does not open the Circle selector");
requireCondition(source.page.includes('data-circle-radar-stage'), "the Community Radar stage is missing");
requireCondition((source.page.match(/data-circle-energy=/g) || []).length === circles.length, "the Community Radar must connect all eight Circles");
requireCondition(source.styles.includes("calc(150ms + (var(--circle-index) * 72ms))"), "the clockwise room entrance choreography is missing");
requireCondition(source.page.includes(">Join Circle</button>"), "the compact wallet must retain the staggered Join Circle action");
requireCondition(!source.television.includes('if (!audioWalletJoined) window.IAMCircleRooms?.open?.(audioModeTrigger);'), "opening the audio wallet must not launch the radar immediately");
requireCondition(source.controller.includes('button.addEventListener("click", () => void joinCircle(circleId));'), "selecting a tribe must begin its muted join directly");
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
