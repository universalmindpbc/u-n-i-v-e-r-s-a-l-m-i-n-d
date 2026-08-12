#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  SYSTEM_PROMPT_SHA256,
  SYSTEM_PROMPT_SOURCE,
  SYSTEM_PROMPT_VERSION,
} from "../cloudflare/adaptive-inference-system-prompt-v4-45.js";


const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, SYSTEM_PROMPT_SOURCE), "utf8");
const contentModule = await readFile(resolve(root, "i  a m/adaptive-inference-engine-system-prompt-v4.45-content.js"), "utf8");
const server = await readFile(resolve(root, "i  a m/technology-citizen-needs-server.mjs"), "utf8");
const worker = await readFile(resolve(root, "cloudflare/iam-citizen-needs-worker.js"), "utf8");
const subprompt = await readFile(resolve(root, "i  a m/adaptive-music-video-selector-subprompt-v1.12.md"), "utf8");

assert.equal(SYSTEM_PROMPT_VERSION, "adaptive-inference-engine-system-prompt-v4.45");
assert.equal(ADAPTIVE_INFERENCE_SYSTEM_PROMPT, source);
assert.equal(SYSTEM_PROMPT_SHA256, createHash("sha256").update(source).digest("hex"));
assert.ok(contentModule.includes(`window.__IAM_SYSTEM_PROMPT_V4_45 = ${JSON.stringify(source)};`));
assert.ok(source.includes('"adaptive_sound_intent"'));
assert.ok(source.includes('"selected_format": null'));
assert.ok(source.includes('"source_id": null'));
assert.ok(!source.includes("DOC2"));
assert.ok(server.includes('adaptive-inference-system-prompt-v4-45.js'));
assert.ok(worker.includes('adaptive-inference-system-prompt-v4-45.js'));
assert.ok(server.includes('type: "null"'));
assert.ok(worker.includes('type: "null"'));
assert.ok(!server.includes("allowedMusicFormats"));
assert.ok(!worker.includes("allowedMusicFormats"));
assert.ok(server.includes("The application owns extended-session format and exact source resolution."));
assert.ok(worker.includes("The application owns extended-session format and exact source resolution."));
assert.ok(subprompt.includes("Adaptive Music Television Selector Subprompt v1.12"));
assert.ok(subprompt.includes("Resolve `source_id` from `broadcast-schedule-v1.json`"));

process.stdout.write(`${JSON.stringify({
  schema_version: "adaptive_inference_v4_45_alignment_qa_v1",
  prompt_version: SYSTEM_PROMPT_VERSION,
  prompt_sha256: SYSTEM_PROMPT_SHA256,
  generated_worker_prompt_exact: true,
  generated_browser_prompt_exact: true,
  semantic_adaptive_sound_intent: true,
  application_owned_format_and_source: true,
  corrected_target_nomenclature: true,
})}\n`);
