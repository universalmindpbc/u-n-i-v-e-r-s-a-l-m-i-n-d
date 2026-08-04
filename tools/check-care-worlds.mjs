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

const count = (source, pattern) => [...source.matchAll(pattern)].length;
const hash = (source) => createHash("sha256").update(source).digest("hex").slice(0, 12);

assert.equal(count(html, /data-care-open="(?:connect|comfort|talk)"/g), 3, "Care must expose three wallet entries");
assert.equal(count(html, /data-care-tab="(?:connect|comfort|talk)"/g), 3, "Care must expose three tabs");
assert.equal(count(html, /data-care-panel="(?:connect|comfort|talk)"/g), 3, "Care must expose three worlds");
assert.match(html, /role="dialog"[^>]*aria-modal="true"/, "Care must open as an accessible in-app dialog");

for (const [file, description] of [
  ["pukka-three-ginger-tea.webp", "Pukka Three Ginger tea"],
  ["organic-goodness-white-sage-incense.jpg", "Organic Goodness White Sage incense"],
  ["acne-studios-pink-hoodie.webp", "Acne Studios pink hoodie"],
  ["ugg-boots.jpg", "Ugg boots"],
]) {
  const relativePath = `a s s e t s/care/${file}`;
  assert.match(html, new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${description} image must be wired into Comfort`);
  assert.ok(statSync(join(iamDir, relativePath)).size > 10_000, `${description} image must be a real supplied asset`);
}

assert.match(html, /Pukka[\s\S]*Three Ginger tea/i);
assert.match(html, /Organic Goodness[\s\S]*White Sage incense/i);
assert.match(html, /Acne Studios[\s\S]*Pink hoodie/i);
assert.match(html, /data-care-product-count>5</, "The proposed package must begin with five pieces");
assert.match(html, /Flume · Fred again\.\. · Skrillex · Brian Eno · Radiohead/, "The supplied music direction must remain visible");

assert.match(html, /does not yet have an active partnership with Harris Farm Markets or Uber Direct/i, "Prospective delivery relationships must be explicit");
assert.match(html, /Not yet available to order/i, "Comfort must not imply live ordering");
assert.match(html, /No people or availability are simulated/i, "Connect must not fake staffed people");
assert.match(html, /Mentor and peer availability is not yet live/i, "Connect must disclose the pilot state");

assert.match(html, /Connect with eheadspace/);
assert.match(html, /12&ndash;25/);
assert.match(html, /tel:1800650890/);
assert.match(html, /headspace\.org\.au\/online-and-phone-support\/connect-with-us\//);
assert.match(html, /clinician service integration is not yet active/i, "Talk must disclose the integration state");
assert.match(html, /No information from your I AM check-in is shared with headspace/i, "Talk must preserve the data boundary");
assert.match(html, /tel:000/);
assert.match(html, /tel:131114/);

assert.match(js, /AgoraRTC\.createCameraVideoTrack/, "One-to-one camera preview must use Agora video");
assert.doesNotMatch(js, /createMicrophoneAudioTrack|createBufferSourceAudioTrack|AudioContext|webkitAudioContext|new Audio\s*\(/, "Care must not start or construct audio");
assert.doesNotMatch(js, /requestFullscreen|webkitRequestFullscreen|mozRequestFullScreen|msRequestFullscreen/, "Care must remain in-app and never invoke native fullscreen");
assert.match(js, /not being recorded or transmitted to another person/i, "Local camera preview boundary must be visible");
assert.match(js, /querySelector\("\[data-audio-mode-open\]"\)\?\.click\(\)/, "Community must hand back to the existing audio-room entry");

assert.match(css, /@media \(max-width: 620px\)/, "Care must include a mobile layout");
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, "Care must honour reduced motion");
assert.match(css, /\.care-product__object--photo img/, "Comfort must style supplied product photography");

const cssToken = hash(css);
const jsToken = hash(js);
assert.match(html, new RegExp(`care-worlds\\.css\\?v=${cssToken}`), "Care CSS cache token must match its content hash");
assert.match(html, new RegExp(`care-worlds\\.js\\?v=${jsToken}`), "Care JS cache token must match its content hash");
assert.doesNotMatch(html, /care-worlds-(?:css|js)-pending/, "Pending Care cache tokens must be resolved");

console.log(`Care worlds preflight passed (CSS ${cssToken}, JS ${jsToken}).`);
