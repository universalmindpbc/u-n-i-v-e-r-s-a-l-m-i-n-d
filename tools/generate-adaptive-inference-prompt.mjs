#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";


const [version = "5.55"] = process.argv.slice(2);
if (!/^\d+\.\d+$/.test(version)) {
  throw new Error("Usage: generate-adaptive-inference-prompt.mjs <major.minor>");
}

const [major, minor] = version.split(".");
const root = resolve(import.meta.dirname, "..");
const sourceRelative = `i  a m/i n f e r e n c e  e n g i n e  -  s y s t e m  p r o m p t  v  ${major} . ${minor.split("").join(" ")}.md`;
const sourcePath = resolve(root, sourceRelative);
const prompt = await readFile(sourcePath, "utf8");
const sha256 = createHash("sha256").update(prompt).digest("hex");
const dashedVersion = `${major}-${minor}`;
const underscoredVersion = `${major}_${minor}`;

const workerModule = [
  `export const SYSTEM_PROMPT_VERSION = "adaptive-inference-engine-system-prompt-v${version}";`,
  `export const SYSTEM_PROMPT_SOURCE = ${JSON.stringify(sourceRelative)};`,
  `export const SYSTEM_PROMPT_SHA256 = "${sha256}";`,
  `export const ADAPTIVE_INFERENCE_SYSTEM_PROMPT = ${JSON.stringify(prompt)};`,
  "",
].join("\n");

const browserContent = `window.__IAM_SYSTEM_PROMPT_V${underscoredVersion} = ${JSON.stringify(prompt)};\n`;

await Promise.all([
  writeFile(resolve(root, `cloudflare/adaptive-inference-system-prompt-v${dashedVersion}.js`), workerModule),
  writeFile(resolve(root, `i  a m/adaptive-inference-engine-system-prompt-v${version}-content.js`), browserContent),
]);

process.stdout.write(`${JSON.stringify({ version, source: sourceRelative, sha256 })}\n`);
