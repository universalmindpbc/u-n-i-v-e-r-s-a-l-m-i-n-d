import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");

const [html, css, js, liveIndex] = await Promise.all([
  fs.readFile(path.join(iam, "programme-guide-mockup.html"), "utf8"),
  fs.readFile(path.join(iam, "programme-guide-mockup.css"), "utf8"),
  fs.readFile(path.join(iam, "programme-guide-mockup.js"), "utf8"),
  fs.readFile(path.join(iam, "index.html"), "utf8"),
]);

assert.match(html, /data-program-open[^>]*aria-haspopup="dialog"/);
assert.match(html, />Program<\/button>/);
assert.match(html, /NOW/);
assert.match(html, /UP NEXT/);
assert.match(html, /LATER/);
assert.match(html, /data-zone="local"/);
assert.match(html, /data-zone="Australia\/Sydney"/);
assert.match(html, /data-zone="America\/Los_Angeles"/);
assert.match(html, /data-zone="Europe\/Madrid"/);
assert.match(html, /ISOLATED DESIGN STUDY · CURRENT WALLET UNCHANGED/);
assert.match(css, /--signal: #adff76/);
assert.match(css, /bottom: calc\(var\(--wallet-bottom\) \+ var\(--wallet-height\) \+ var\(--wallet-panel-gap\)\)/);
assert.match(css, /max-height: calc\(100dvh - var\(--program-top-inset\) - var\(--wallet-bottom\) - var\(--wallet-height\) - var\(--wallet-panel-gap\)\)/);
assert.match(css, /\.program-scroll \{[\s\S]*?min-height: 0;/);
assert.match(css, /\.program-panel__footer \{[\s\S]*?flex: 0 0 auto;/);
assert.match(css, /\.program-panel__footer button \{[\s\S]*?align-items: center;/);
assert.match(js, /broadcast-schedule-v1\.json/);
assert.match(js, /horizonHours === 6 \? 24 : 6/);
assert.match(js, /Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/);
assert.doesNotMatch(liveIndex, /programme-guide-mockup/);

console.log("Programme guide mockup preflight passed.");
