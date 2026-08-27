import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const controller = fs.readFileSync(path.join(iam, "adaptive-environment-television.js"), "utf8");
const styles = fs.readFileSync(path.join(iam, "adaptive-environment-television.css"), "utf8");
const tokenPages = ["index.html", "index-alt.html", "adaptive-environment-television.html"]
  .map((name) => [name, fs.readFileSync(path.join(iam, name), "utf8")]);

assert.match(controller, /function detectEdgeMatteScale\(video\)/, "the large-player edge-matte detector is missing");
assert.match(controller, /playerMount\.dataset\.edgeCropScale = resolvedScale\.toFixed\(3\)/, "the shared detected crop scale is not published");
assert.match(controller, /function drawMediaCover\(context, video, targetWidth, targetHeight, alpha = 1, edgeScale = 1\)/);
assert.match(controller, /const scaledWidth = cropWidth \/ resolvedEdgeScale;[\s\S]*?const scaledHeight = cropHeight \/ resolvedEdgeScale;/);
assert.match(controller, /const musicEdgeScale = clamp\([\s\S]*?playerMount\?\.dataset\.edgeCropScale \|\| baseEdgeScale\(\)[\s\S]*?MAX_DETECTED_EDGE_SCALE/);
assert.match(controller, /drawMediaCover\([\s\S]*?localVideo,[\s\S]*?musicEdgeScale[\s\S]*?\);/);
assert.match(controller, /drawMediaCover\([\s\S]*?fashionVideo,[\s\S]*?1 - \(requestedVideoBlend \/ 100\)[\s\S]*?\);/);
assert.match(controller, /fashionHeroLastMusicScale = musicEdgeScale/);
assert.match(controller, /fashionHeroFrame\.dataset\.emdrGifMusicEdgeScale = musicEdgeScale\.toFixed\(3\)/);
assert.match(controller, /if \(document\.body\.classList\.contains\("television-emdr-gif-active"\)\) drawFashionHeroFrame\(\)/);
assert.match(styles, /\.adaptive-television-local-video[\s\S]*?transform:\s*scale\(var\(--adaptive-video-edge-scale\)\)/);
assert.match(styles, /\.adaptive-television-fashion-hero-frame[\s\S]*?overflow:\s*hidden/);
assert.match(styles, /\.adaptive-television-fashion-hero-canvas[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/);

const scriptHash = createHash("sha256").update(controller).digest("hex").slice(0, 12);
const styleHash = createHash("sha256").update(styles).digest("hex").slice(0, 12);
tokenPages.forEach(([name, page]) => {
  assert.ok(page.includes(`adaptive-environment-television.js?v=music-tv-${scriptHash}`), `${name} has a stale controller token`);
  assert.ok(page.includes(`adaptive-environment-television.css?v=music-tv-css-${styleHash}`), `${name} has a stale stylesheet token`);
});

console.log("EMDR small-video edge-cover checks passed.");
