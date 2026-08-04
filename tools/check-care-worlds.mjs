import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const toolsDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(toolsDir);
const iamDir = join(root, "i  a m");
const html = readFileSync(join(iamDir, "index.html"), "utf8");
const css = readFileSync(join(iamDir, "care-worlds.css"), "utf8");
const js = readFileSync(join(iamDir, "care-worlds.js"), "utf8");
const careStart = html.indexOf('<section class="care-experience"');
const careEnd = html.indexOf('<div class="adaptive-television-heart-field"', careStart);
const careHtml = html.slice(careStart, careEnd);

const count = (source, pattern) => [...source.matchAll(pattern)].length;
const hash = (source) => createHash("sha256").update(source).digest("hex").slice(0, 12);

assert.ok(careStart > 0 && careEnd > careStart, "Care dialog must be present in the television room");
assert.equal(count(html, /data-care-open="(?:connect|comfort|talk)"/g), 3, "Care must expose three wallet entries");
assert.equal(count(careHtml, /data-care-tab="(?:connect|comfort|talk)"/g), 3, "Care must expose three tabs");
assert.equal(count(careHtml, /data-care-panel="(?:connect|comfort|talk)"/g), 3, "Care must expose three worlds");
assert.match(careHtml, /role="dialog"[^>]*aria-modal="true"/, "Care must remain an accessible in-app dialog");

assert.equal(count(careHtml, /class="care-call__screen(?:\s|\")/g), 2, "Connect must use two familiar video tiles");
assert.equal(count(careHtml, /data-care-connect-role="(?:mentor|peer|community)"/g), 3, "Connect must keep one compact role selector");
assert.match(careHtml, /data-care-connect-action[^>]*>Connect</, "Connect must have one primary action");
assert.match(careHtml, /data-care-device="microphone"/, "Connect must have a microphone control");
assert.match(careHtml, /data-care-device="camera"/, "Connect must have a camera control");
assert.match(careHtml, /Talk live with mentors, peers and supportive communities\./, "Connect must repeat its single care invitation");
assert.doesNotMatch(careHtml, /See me|Hear me|Don(?:&rsquo;|')t make me perform|Let me see you|Face to face|Voice only|Prepare private room|audio room/i, "Rejected mode and wireframe language must be removed from Care");

for (const [file, description] of [
  ["pukka-three-ginger-tea.webp", "Pukka Three Ginger tea"],
  ["organic-goodness-white-sage-incense.jpg", "Organic Goodness White Sage incense"],
  ["acne-studios-pink-hoodie.webp", "Acne Studios pink hoodie"],
  ["ugg-boots.jpg", "Ugg boots"],
]) {
  const relativePath = `a s s e t s/care/${file}`;
  assert.match(careHtml, new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${description} image must remain in the cart`);
  assert.ok(statSync(join(iamDir, relativePath)).size > 10_000, `${description} must remain the supplied asset`);
}

assert.match(careHtml, /<section class="care-cart"/, "Comfort must render as a shopping cart");
assert.match(careHtml, /A little kindness delivered to your door in the next hour\./, "Comfort must repeat its delivery promise");
assert.match(careHtml, /<strong>\$0<\/strong>/, "Comfort total must be $0");
assert.match(careHtml, /data-care-address[^>]*|[^>]*data-care-address/, "Comfort must accept a delivery address");
assert.match(careHtml, /autocomplete="street-address"/, "The delivery field must support address autofill");
assert.match(careHtml, /Continue <span>&mdash; \$0<\/span>/, "The checkout action must show the zero price");
assert.match(careHtml, /Flume · Fred again\.\. · Skrillex · Brian Eno · Radiohead/, "The supplied music direction must remain visible");
assert.match(careHtml, /Proposed pilot partners\. No order is placed in this preview\./, "The prospective delivery boundary must remain concise and honest");

assert.match(careHtml, /data-care-talk-device="microphone"/, "Talk must use a familiar microphone control");
assert.match(careHtml, /data-care-talk-device="camera"/, "Talk must use a familiar camera control");
assert.match(careHtml, /Connect with eheadspace/);
assert.match(careHtml, /3PM&ndash;10PM EVERY DAY <span>LOCAL TIME<\/span>/, "Talk must show current eheadspace operating hours");
assert.match(careHtml, /12&ndash;25/);
assert.match(careHtml, /tel:1800650890/);
assert.match(careHtml, /headspace\.org\.au\/online-and-phone-support\/connect-with-us\//);
assert.match(careHtml, /No information from your I AM check-in is shared with headspace/i);
assert.match(careHtml, /tel:000/);
assert.match(careHtml, /tel:131114/);
assert.match(careHtml, /<aside class="care-urgent"[\s\S]*?tel:000[\s\S]*?tel:131114[\s\S]*?<\/aside>[\s\S]*?<div class="care-talk-layout">/, "Urgent support must sit above the Talk panels");

assert.match(js, /AgoraRTC\.createCameraVideoTrack/, "Camera controls must use Agora video");
assert.match(js, /AgoraRTC\.createMicrophoneAudioTrack/, "Microphone controls must use Agora capture");
assert.doesNotMatch(js, /createBufferSourceAudioTrack|AudioContext|webkitAudioContext|new Audio\s*\(/, "Care must not construct audio playback");
assert.doesNotMatch(js, /microphoneTrack\.play|createClient\s*\(|\.join\s*\(|\.publish\s*\(/, "The pre-join UI must not output audio or claim a live room");
assert.doesNotMatch(js, /requestFullscreen|webkitRequestFullscreen|mozRequestFullScreen|msRequestFullscreen/, "Care must never invoke native fullscreen");
assert.match(js, /cameraTrack\.play\(room\.preview/, "Camera preview must render into the selected room tile");
assert.match(js, /checkout\?\.addEventListener\("submit"/, "The $0 cart must behave like a form");

assert.match(css, /\.care-experience__backdrop\s*\{[\s\S]*?background:\s*rgba\(0, 0, 0, 0\.34\)/, "The music video must bleed through a 34% black veil");
assert.doesNotMatch(css, /\.care-experience__backdrop\s*\{[\s\S]*?background:\s*rgba\(0, 0, 0, 0\.77\)/, "The rejected 77% veil must not return");
assert.ok(count(css, /Universal Mind \[ I o H \] Logo\.PNG/g) >= 4, "Human, camera, and microphone symbols must sit over the Universal Mind flower");
assert.match(css, /\.care-call__screens\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/, "Connect must look like a two-person streaming room");
assert.match(css, /\.care-call__connect\s*\{[\s\S]*?background:\s*#fff;[\s\S]*?color:\s*#111;/, "Connect must use the site's white CTA treatment");
assert.match(css, /\.care-cart\s*\{[\s\S]*?background:\s*rgba\(248, 248, 246, 0\.96\)/, "Comfort must read as a light shopping cart");
assert.match(css, /\.care-urgent strong\s*\{[\s\S]*?font-size:\s*15px;/, "Urgent support must be readable above the fold");
assert.match(css, /@media \(max-width: 680px\)/, "Care must include a mobile layout");
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, "Care must honour reduced motion");

const cssToken = hash(css);
const jsToken = hash(js);
assert.match(html, new RegExp(`care-worlds\\.css\\?v=${cssToken}`), "Care CSS cache token must match its content hash");
assert.match(html, new RegExp(`care-worlds\\.js\\?v=${jsToken}`), "Care JS cache token must match its content hash");

console.log(`Care worlds preflight passed (CSS ${cssToken}, JS ${jsToken}).`);
