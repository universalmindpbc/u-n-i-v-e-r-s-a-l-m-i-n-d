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
const fusionModule = await readFile(resolve(root, "i  a m/current-inference-fusion-v1.js"), "utf8");
const inferenceMatrix = JSON.parse(await readFile(resolve(root, "i  a m/adaptive-inference-matrix-v1.json"), "utf8"));
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
assert.ok(source.includes("Current Inference Matrix — Human + AI Rule"));
assert.ok(source.includes("optional current 10-second Heart Rate"));
assert.ok(source.includes("Every accepted non-empty current self-report is sufficient to produce one adaptive-sound semantic recommendation."));
assert.ok(source.includes("Missing, declined, skipped, expired or invalid Heart Rate must never produce `insufficient_context`, null sound intents, a camera requirement or a withheld recommendation"));
assert.ok(source.includes("`semantic_current_inference`, `semantic_music_room` and `semantic_adaptive_sound_intent`"));
assert.ok(source.includes("The model contract contains no raw Heart Rate, Heart Rate zone, Heart Rate role or final-selection fields."));
assert.ok(source.includes("The current Heart Check handoff is first-party and short-lived, not entirely on-device."));
assert.ok(source.includes("The handoff expires after 60 seconds, is consumed once and is deleted before upstream inference work."));
assert.ok(source.includes("removes raw BPM from the OpenAI request, does not return raw BPM"));
assert.ok(source.includes("GPT does not choose the exact track."));
assert.ok(source.includes("The deterministic Song Tensor selector performs the exact ranking mathematically"));
assert.ok(source.includes("current_inference.fusion"));
assert.ok(!source.includes("must set the Heart Rate role and zone"));
assert.ok(!source.includes("30-second Heart Rate"));
assert.ok(source.includes("Time, weather and location materially influence every adaptive music decision"));
assert.equal(inferenceMatrix.name, "Current Inference Matrix");
assert.equal(inferenceMatrix.input_contract.momentary_physiology.measurement_duration_seconds, 10);
assert.equal(inferenceMatrix.input_contract.momentary_physiology.baseline_available, false);
assert.equal(inferenceMatrix.input_contract.self_report.sufficient_for_adaptive_sound_recommendation, true);
assert.equal(inferenceMatrix.input_contract.momentary_physiology.optional_non_blocking, true);
assert.match(inferenceMatrix.input_contract.momentary_physiology.skip_rule, /must not request camera access again, block homepage entry or suppress a recommendation/);
assert.equal(inferenceMatrix.required_output_audit.heart_rate_required_for_adaptive_sound_intent, false);
assert.equal(inferenceMatrix.required_output_audit.raw_heart_rate_retained, false);
assert.equal(inferenceMatrix.required_output_audit.fusion_policy_version, "iam_current_inference_fusion_v1.0");
assert.equal(inferenceMatrix.required_output_audit.heart_rate_can_select_alone, false);
assert.deepEqual(inferenceMatrix.local_fusion_policy.semantic_model_fields, [
  "semantic_current_inference",
  "semantic_music_room",
  "semantic_adaptive_sound_intent",
]);
assert.deepEqual(inferenceMatrix.local_fusion_policy.public_resolved_fields, [
  "current_inference",
  "selected_music_room",
  "adaptive_sound_intent",
]);
assert.equal(inferenceMatrix.local_fusion_policy.heart_rate_cannot_select_alone, true);
assert.deepEqual(inferenceMatrix.local_fusion_policy.context_roles, [
  "downshift_supporting",
  "activation_supporting",
  "neutral_or_unavailable",
]);
assert.deepEqual(Object.keys(inferenceMatrix.horizon_context_rule), ["horizon_1", "horizon_2", "horizon_3"]);
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
assert.ok(server.includes("raw Heart Rate and Heart Rate-derived health data are not sent to the external model"));
assert.ok(worker.includes("raw Heart Rate and Heart Rate-derived health data are not sent to the external model"));
assert.ok(server.includes("measurement_duration_seconds: 10"));
assert.ok(worker.includes("measurement_duration_seconds: 10"));
assert.ok(worker.includes('relevant: { type: "boolean", enum: [true] }'));
assert.ok(worker.includes('enum: ["current_checkin"]'));
assert.ok(worker.includes("semantic_current_inference"));
assert.ok(worker.includes("semantic_music_room"));
assert.ok(worker.includes("semantic_adaptive_sound_intent"));
assert.ok(!worker.includes("reconcileHeartRateRole"));
assert.ok(!server.includes("reconcileHeartRateRole"));
assert.ok(fusionModule.includes('CURRENT_INFERENCE_FUSION_POLICY_VERSION = "iam_current_inference_fusion_v1.0"'));
assert.ok(fusionModule.includes("heart_rate_can_select_alone: false"));
assert.ok(fusionModule.includes("raw_heart_rate_retained: false"));
assert.ok(worker.includes("Missing, skipped, declined, expired or invalid Heart Rate never permits insufficient_context"));
assert.ok(server.includes('context_role: "all_adaptive_decisions_all_horizons"'));
assert.ok(worker.includes('context_role: "all_adaptive_decisions_all_horizons"'));
assert.ok(subprompt.includes("Adaptive Music Television Selector Subprompt v1.12"));
assert.ok(subprompt.includes("An accepted non-empty self-report completes the required input workflow."));
assert.ok(subprompt.includes("Never require or re-request camera access, Heart Rate or any biometric signal before returning homepage recommendations."));
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
  current_heart_rate_inference_matrix: true,
  context_all_horizons: true,
  raw_heart_rate_exported_to_model: false,
  local_fusion_policy_version: inferenceMatrix.required_output_audit.fusion_policy_version,
  heart_rate_can_select_alone: false,
  canonical_prompt_documents_semantic_only_model_and_deterministic_exact_selection: true,
  application_owned_format_and_source: true,
  corrected_target_nomenclature: true,
  technology_code_notion_markdown_chain: true,
  notion_authority_url: notionAuthorityUrl,
  request_alias_order: ["v555_payload", "v445_payload", "v444_payload", "inference"],
})}\n`);
