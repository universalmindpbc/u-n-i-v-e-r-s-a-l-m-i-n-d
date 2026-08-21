import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const html = fs.readFileSync(path.join(iam, "index.html"), "utf8");
const controller = fs.readFileSync(path.join(iam, "adaptive-environment-television.js"), "utf8");
const styles = fs.readFileSync(path.join(iam, "adaptive-environment-television.css"), "utf8");
const schedule = JSON.parse(fs.readFileSync(path.join(iam, "broadcast-schedule-v1.json"), "utf8"));
const tokenPages = ["index.html", "index-alt.html", "adaptive-environment-television.html"]
  .map((name) => [name, fs.readFileSync(path.join(iam, name), "utf8")]);

const fashionChannels = schedule.channels.filter((channel) => channel.format === "fashion");
assert.deepEqual(
  fashionChannels.map(({ id, name, energy_id }) => ({ id, name, energy_id })),
  [
    { id: "fashion-restore", name: "Champagne Bohemia", energy_id: "restore" },
    { id: "fashion-social-uplift", name: "Modulate Infinity", energy_id: "social-uplift" },
    { id: "fashion-underground-intensity", name: "James Bondage", energy_id: "underground-intensity" },
  ],
  "Fashion public identities or stable internal energy ids drifted",
);

assert.equal((html.match(/data-fashion-runway-selector/g) || []).length, 2, "EMDR GIF is missing the synchronized Fashion selector");
assert.equal((html.match(/data-fashion-shelf-toggle/g) || []).length, 2, "the two Fashion selectors do not share the shelf");
assert.match(html, /data-emdr-gif-crossfader/);
assert.match(html, />fashion<\/span>[\s\S]*?data-emdr-gif-crossfader[\s\S]*?>music \/ party<\/span>/);

assert.match(controller, /querySelectorAll\("\[data-fashion-runway-selector\]"\)/);
assert.match(controller, /fashionRunwayLabels\.forEach\(\(element\) => renderFashionIdentityLabel/);
assert.match(controller, /fashionShelfToggles\.forEach\(\(button\) => button\.setAttribute/);
assert.match(controller, /fashion_emdr_gif_arrow/);
assert.match(controller, /emdrGifCrossfader\?\.addEventListener\("input"/);
assert.match(controller, /if \(emdrGifCrossfader\) emdrGifCrossfader\.value = String\(musicAmount\)/);

assert.match(styles, /\.adaptive-television-fashion-runway-identity[\s\S]*?text-overflow:\s*clip/);
assert.match(styles, /@keyframes adaptive-fashion-identity-channel/);
assert.match(styles, /@keyframes adaptive-fashion-identity-brand/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.adaptive-television-fashion-runway-identity[\s\S]*?position:\s*static[\s\S]*?animation:\s*none/);
assert.match(styles, /data-emdr-controls-view="gif"[\s\S]*?\.adaptive-television-emdr-gif-mix-controls[\s\S]*?display:\s*flex/);

assert.match(controller, /const musicDrawn = requestedVideoBlend > 0 && drawMediaCover\(fashionHeroContext, localVideo/);
assert.match(controller, /const fashionDrawn = requestedVideoBlend < 100 && drawMediaCover\([\s\S]*?1 - \(requestedVideoBlend \/ 100\)/);
assert.match(controller, /if \(emdrGifActive && fashionVideo\)[\s\S]*?setPriority\?\.\(fashionVideo, "optional"\)[\s\S]*?playWhenStreamAttached\(fashionVideo, "fashion"\)/);
assert.match(controller, /if \(active\)[\s\S]*?setVideoBlend\(emdrGifVideoBlend\)[\s\S]*?startFashionHeroMirror\(\)/);
assert.match(controller, /if \(emdrGifPreviousVideoBlend !== null\)[\s\S]*?setVideoBlend\(previousBlend\)/);

const scriptHash = createHash("sha256").update(controller).digest("hex").slice(0, 12);
const styleHash = createHash("sha256").update(styles).digest("hex").slice(0, 12);
tokenPages.forEach(([name, page]) => {
  assert.ok(page.includes(`adaptive-environment-television.js?v=music-tv-${scriptHash}`), `${name} has a stale controller token`);
  assert.ok(page.includes(`adaptive-environment-television.css?v=music-tv-css-${styleHash}`), `${name} has a stale stylesheet token`);
});

console.log("Fashion and EMDR GIF mix checks passed.");
