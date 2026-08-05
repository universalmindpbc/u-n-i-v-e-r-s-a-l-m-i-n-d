#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDirectory, "..");
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const digest = (source) => createHash("sha256").update(source).digest("hex").slice(0, 12);

const [html, css, script] = await Promise.all([
  read("i  a m/index.html"),
  read("i  a m/mantra-sampler.css"),
  read("i  a m/mantra-sampler.js"),
]);

assert.match(html, /data-mantra-volume-control role="slider"[^>]+aria-valuenow="77"/);
assert.match(html, /data-mantra-volume-readout>77%<\/span>/);
assert.match(html, /mantra volume<\/span>[\s\S]*drag to adjust<\/span>/i);
assert.match(script, /MANTRA_VOLUME_DEFAULT_PERCENT = 77;/);
assert.match(script, /MANTRA_VOLUME_MAX_HEADROOM_DB = 3;/);
assert.match(script, /masterGain\.connect\(masterLimiter\);[\s\S]*masterLimiter\.connect\(outputAnalyser\);[\s\S]*outputAnalyser\.connect\(ctx\.destination\);/);
assert.match(script, /destination: output,/);
assert.match(script, /window\.localStorage\.setItem\(MANTRA_VOLUME_STORAGE_KEY/);
assert.match(script, /version: "mantra_sampler_v3\.0"/);
assert.match(css, /\.mantra-orbit__volume-led\.is-active::before/);
assert.match(css, /var\(--mantra-signal-level\)/);
assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.mantra-orbit__centre[\s\S]*display: flex;/);

const cssHash = digest(css);
const scriptHash = digest(script);
assert.ok(html.includes(`mantra-sampler.css?v=mantra-sampler-css-${cssHash}`), "Mantra CSS cache token must match its content hash.");
assert.ok(html.includes(`mantra-sampler.js?v=mantra-sampler-${scriptHash}`), "Mantra script cache token must match its content hash.");

console.log(`Mantra volume control preflight passed (default 77%, +3 dB headroom, ${scriptHash}/${cssHash}).`);
