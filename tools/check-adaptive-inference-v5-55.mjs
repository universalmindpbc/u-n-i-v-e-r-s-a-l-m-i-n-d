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
} from "../cloudflare/adaptive-inference-system-prompt-v5-55.js";


const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, SYSTEM_PROMPT_SOURCE), "utf8");
const contentModule = await readFile(resolve(root, "i  a m/adaptive-inference-engine-system-prompt-v5.55-content.js"), "utf8");
const server = await readFile(resolve(root, "i  a m/technology-citizen-needs-server.mjs"), "utf8");
const worker = await readFile(resolve(root, "cloudflare/iam-citizen-needs-worker.js"), "utf8");
const subprompt = await readFile(resolve(root, "i  a m/adaptive-music-video-selector-subprompt-v1.12.md"), "utf8");
const technology = await readFile(resolve(root, "i  a m/technology-citizen-needs.html"), "utf8");
const codePage = await readFile(resolve(root, "i  a m/adaptive-inference-engine-system-prompt-v5.55.html"), "utf8");
const globalNavigation = await readFile(resolve(root, "i  a m/global-navigation.js"), "utf8");
const pythonCgi = await readFile(resolve(root, "i  a m/api/adaptive-music-video-selection.py"), "utf8");
const phpCgi = await readFile(resolve(root, "i  a m/api/adaptive-music-video-selection.php"), "utf8");
const soundtrackGuideJson = JSON.parse(await readFile(resolve(root, "i  a m/adaptive-soundtrack-selection-guide-v2.22.json"), "utf8"));

const notionAuthorityUrl = "https://um-iam.notion.site/f31dbd2e2a0b4c15b4161108ae0a8e63";
const codePageFilename = "adaptive-inference-engine-system-prompt-v5.55.html";
const rawPromptFilename = "i%20n%20f%20e%20r%20e%20n%20c%20e%20%20e%20n%20g%20i%20n%20e%20%20-%20%20s%20y%20s%20t%20e%20m%20%20p%20r%20o%20m%20p%20t%20%20v%20%205%20.%205%205.md";
const supersededPublicVersion = /(?:v4\.45|v4-45|V4_45|v4_45)/;

assert.equal(SYSTEM_PROMPT_VERSION, "adaptive-inference-engine-system-prompt-v5.55");
assert.equal(ADAPTIVE_INFERENCE_SYSTEM_PROMPT, source);
assert.equal(SYSTEM_PROMPT_SHA256, createHash("sha256").update(source).digest("hex"));
assert.ok(contentModule.includes(`window.__IAM_SYSTEM_PROMPT_V5_55 = ${JSON.stringify(source)};`));
assert.ok(source.includes('"adaptive_sound_intent"'));
assert.ok(source.includes('"selected_format": null'));
assert.ok(source.includes('"source_id": null'));
assert.ok(!source.includes("DOC2"));
assert.ok(server.includes('adaptive-inference-system-prompt-v5-55.js'));
assert.ok(worker.includes('adaptive-inference-system-prompt-v5-55.js'));
assert.ok(server.includes('type: "null"'));
assert.ok(worker.includes('type: "null"'));
assert.ok(!server.includes("allowedMusicFormats"));
assert.ok(!worker.includes("allowedMusicFormats"));
assert.ok(server.includes("The application owns extended-session format and exact source resolution."));
assert.ok(worker.includes("The application owns extended-session format and exact source resolution."));
assert.ok(subprompt.includes("Adaptive Music Television Selector Subprompt v1.12"));
assert.ok(subprompt.includes("Resolve `source_id` from `broadcast-schedule-v1.json`"));
assert.ok(globalNavigation.includes("learn how we understand your needs"));
assert.ok(globalNavigation.includes('href="technology-citizen-needs.html"'));
assert.ok(technology.includes(`href="${codePageFilename}"`));
assert.ok(technology.includes(`data-public-href="/vogue/iam/${codePageFilename}"`));
assert.ok(codePage.includes("System Prompt v5.55"));
assert.ok(codePage.includes(`href="${notionAuthorityUrl}"`));
assert.ok(codePage.includes("Human Readable (via Notion)"));
assert.ok(codePage.includes(`href="${rawPromptFilename}"`));
assert.ok(codePage.includes(`fetch("${rawPromptFilename}"`));
assert.ok(codePage.includes(`adaptive-inference-engine-system-prompt-v5.55-content.js?v=prompt-content-${SYSTEM_PROMPT_SHA256.slice(0, 12)}`));
assert.match(pythonCgi, /v555_payload[\s\S]*v445_payload[\s\S]*v444_payload[\s\S]*inference/);
assert.match(phpCgi, /v555_payload[^\n]*v445_payload[^\n]*v444_payload[^\n]*inference/);
assert.equal(soundtrackGuideJson.source_prompt_version, SYSTEM_PROMPT_VERSION);
assert.equal(soundtrackGuideJson.source_prompt, SYSTEM_PROMPT_SOURCE);
for (const publicAsset of [source, contentModule, server, worker, subprompt, technology, codePage]) {
  assert.doesNotMatch(publicAsset, supersededPublicVersion);
}

process.stdout.write(`${JSON.stringify({
  schema_version: "adaptive_inference_v5_55_alignment_qa_v1",
  prompt_version: SYSTEM_PROMPT_VERSION,
  prompt_sha256: SYSTEM_PROMPT_SHA256,
  generated_worker_prompt_exact: true,
  generated_browser_prompt_exact: true,
  semantic_adaptive_sound_intent: true,
  application_owned_format_and_source: true,
  corrected_target_nomenclature: true,
  technology_code_notion_markdown_chain: true,
  notion_authority_url: notionAuthorityUrl,
  request_alias_order: ["v555_payload", "v445_payload", "v444_payload", "inference"],
})}\n`);
