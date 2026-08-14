#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
import {
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  SYSTEM_PROMPT_SHA256,
  SYSTEM_PROMPT_SOURCE,
  SYSTEM_PROMPT_VERSION,
} from "../cloudflare/adaptive-inference-system-prompt-v5-55.js";
import {
  ADAPTIVE_MUSIC_ROOM_SELECTION_GUIDE,
  MUSIC_ROOM_SELECTION_GUIDE_VERSION,
} from "../cloudflare/adaptive-music-room-selection-guide-v1.js";

const root = resolve(import.meta.dirname, "..");
const workerPath = resolve(root, "cloudflare/iam-citizen-needs-worker.js");
const portalGuidePath = resolve(root, "i  a m/universal-one-portal-guide-v1.txt");
const wellbeingGuidePath = resolve(root, "i  a m/universal-one-wellbeing-support-guide-v1.txt");
const programmeGuidePath = resolve(root, "i  a m/universal-one-programme-guide-v1.txt");

const importPatterns = [
  /import \{[\s\S]*?\} from "\.\/adaptive-inference-system-prompt-v5-55\.js";\n/,
  /import \{[\s\S]*?\} from "\.\/adaptive-music-room-selection-guide-v1\.js";\n/,
  /import UNIVERSAL_ONE_PORTAL_GUIDE from "\.\.\/i  a m\/universal-one-portal-guide-v1\.txt";\n/,
  /import UNIVERSAL_ONE_WELLBEING_SUPPORT_GUIDE from "\.\.\/i  a m\/universal-one-wellbeing-support-guide-v1\.txt";\n/,
  /import UNIVERSAL_ONE_PROGRAMME_GUIDE from "\.\.\/i  a m\/universal-one-programme-guide-v1\.txt";\n/,
];

let workerSource = await readFile(workerPath, "utf8");
for (const pattern of importPatterns) {
  const matches = workerSource.match(new RegExp(pattern.source, "g")) || [];
  assert.equal(matches.length, 1, `Worker import transform drifted for ${pattern}`);
  workerSource = workerSource.replace(pattern, "");
}
assert.equal((workerSource.match(/export default \{/g) || []).length, 1, "Worker default export transform drifted");
workerSource = workerSource.replace("export default {", "globalThis.__IAM_WORKER__ = {");

let capturedOpenAIRequest = null;
const openAIFetch = async (url, options = {}) => {
  assert.equal(String(url), "https://api.openai.com/v1/responses");
  assert.equal(options.method, "POST");
  capturedOpenAIRequest = JSON.parse(options.body);

  const schema = capturedOpenAIRequest.text?.format?.schema;
  assert.ok(schema, "The live request did not include its strict output schema");
  const scorecard = Object.fromEntries(
    Object.entries(schema.properties.needs_scorecard.properties).map(([domain, domainSchema]) => [
      domain,
      Object.fromEntries(Object.keys(domainSchema.properties).map((label) => [label, 0])),
    ]),
  );

  const output = {
    highlights: ["Curiosity", "Joy", "Clarity", "Purpose"],
    confidence: 0.87,
    selected_music_room: "inner-planes",
    selected_format: null,
    source_id: null,
    catalogue_ready: false,
    music_room_confidence: 0.82,
    music_room_reason: "A curious and inspired present-state fit.",
    needs_scorecard: scorecard,
    dominant_domains: ["Emotion", "Cognitive"],
    top_needs_used: ["Curiosity", "Joy", "Clarity", "Purpose"],
    context_modifiers_used: [],
    uncertainty_notes: ["A short check-in provides limited context."],
    human_review_relevance: "not_indicated",
    current_inference: {
      inference_id: "active_energised",
      human_label: "Active / energised",
      summary: "The self-report suggests positive activation and readiness.",
      confidence: 0.81,
      heart_rate_role: "not_available",
      heart_rate_zone: "not_available",
      evidence_used: ["self-report:curious joyful ready for inspiration"],
      context_dimensions_considered: {
        time: true,
        weather: false,
        location: true,
      },
      horizons_considered: ["horizon_1", "horizon_2", "horizon_3"],
      baseline_comparison_used: false,
      clinical_status: "not_a_diagnosis",
    },
    adaptive_sound_intent: {
      relevant: true,
      selection_basis: "current_checkin",
      band_intent: "gamma",
      carrier_intent: "cognition_joy",
      top_needs_used: ["Curiosity", "Joy"],
      explicit_cues_used: ["inspiration", "cognition", "joy"],
      context_modifiers_used: ["time:10:30", "weather:unavailable", "location:Sydney"],
      horizons_considered: ["horizon_1", "horizon_2", "horizon_3"],
      confidence: 0.84,
      safety_state: "standard",
      session_scope: "current_session_only",
      research_boundary: "biological_targets_not_used_in_product_decisions",
    },
    interpretation_type: "language_theme_mapping",
    clinical_status: "not_a_diagnosis",
  };

  return Response.json({ output_text: JSON.stringify(output) });
};

const context = vm.createContext({
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  SYSTEM_PROMPT_SHA256,
  SYSTEM_PROMPT_SOURCE,
  SYSTEM_PROMPT_VERSION,
  ADAPTIVE_MUSIC_ROOM_SELECTION_GUIDE,
  MUSIC_ROOM_SELECTION_GUIDE_VERSION,
  UNIVERSAL_ONE_PORTAL_GUIDE: await readFile(portalGuidePath, "utf8"),
  UNIVERSAL_ONE_WELLBEING_SUPPORT_GUIDE: await readFile(wellbeingGuidePath, "utf8"),
  UNIVERSAL_ONE_PROGRAMME_GUIDE: await readFile(programmeGuidePath, "utf8"),
  Request,
  Response,
  URL,
  TextEncoder,
  crypto,
  fetch: openAIFetch,
  console: {
    info() {},
    error: console.error,
  },
});

new vm.Script(workerSource, { filename: workerPath }).runInContext(context);
const worker = context.__IAM_WORKER__;
assert.equal(typeof worker?.fetch, "function", "Worker fetch handler was not constructed");

const request = new Request(
  "https://realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/citizen-needs-inference",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://staging.universalmind.tv",
    },
    body: JSON.stringify({
      checkin: "I am curious, joyful and ready for inspiration.",
      environment_context: {
        local_time: "10:30",
        location_label: "Sydney",
        location_precision: "approximate",
        context_available: true,
      },
      momentary_physiology: {
        heart_rate_bpm: 118,
        measurement_duration_seconds: 30,
        source: "shen_quick_hr",
      },
    }),
  },
);
const response = await worker.fetch(request, {
  OPENAI_API_KEY: "test-only-key",
  OPENAI_INFERENCE_MODEL: "gpt-5.5-test",
});
const result = await response.json();

assert.equal(response.status, 200, JSON.stringify(result));
assert.ok(capturedOpenAIRequest, "The Worker did not reach the OpenAI request path");
assert.equal(capturedOpenAIRequest.model, "gpt-5.5-test");
assert.equal(capturedOpenAIRequest.store, false);
assert.equal(capturedOpenAIRequest.text.format.type, "json_schema");
assert.equal(capturedOpenAIRequest.text.format.strict, true);
assert.deepEqual(capturedOpenAIRequest.text.format.schema.properties.selected_format, { type: "null" });
assert.deepEqual(capturedOpenAIRequest.text.format.schema.properties.source_id, { type: "null" });
assert.deepEqual(capturedOpenAIRequest.text.format.schema.properties.catalogue_ready.enum, [false]);
assert.ok(capturedOpenAIRequest.text.format.schema.required.includes("adaptive_sound_intent"));

const systemMessage = capturedOpenAIRequest.input[0].content;
const userMessage = capturedOpenAIRequest.input[1].content;
assert.ok(systemMessage.includes(ADAPTIVE_INFERENCE_SYSTEM_PROMPT));
assert.ok(userMessage.includes("Choose an eligible music room from: inner-planes, champagne-bohemia, modul8-infinity, james-bondage, safety-cushion; otherwise return null."));
assert.ok(userMessage.includes("The application owns extended-session format and exact source resolution."));
assert.ok(!userMessage.includes("Choose an eligible format"));
assert.ok(!userMessage.includes("118"), "Raw Heart Rate escaped into the external model request");
assert.ok(!userMessage.includes("heart_rate_bpm"), "Heart Rate field escaped into the external model request");
assert.ok(!workerSource.includes("allowedMusicFormats"));

assert.equal(result.model, "gpt-5.5-test");
assert.equal(result.prompt_version, SYSTEM_PROMPT_VERSION);
assert.equal(result.prompt_sha256, SYSTEM_PROMPT_SHA256);
assert.equal(result.prompt_source, SYSTEM_PROMPT_SOURCE);
assert.equal(result.selected_format, null);
assert.equal(result.source_id, null);
assert.equal(result.catalogue_ready, false);
assert.equal(result.current_inference.inference_id, "active_energised");
assert.equal(result.current_inference.heart_rate_role, "supporting");
assert.equal(result.current_inference.heart_rate_zone, "elevated_observed");
assert.equal(result.current_inference.baseline_comparison_used, false);
assert.deepEqual(result.current_inference.horizons_considered, ["horizon_1", "horizon_2", "horizon_3"]);
assert.ok(!JSON.stringify(result).includes("heart_rate_bpm"), "Raw Heart Rate escaped into the public response");
assert.deepEqual(result.adaptive_sound_intent, {
  relevant: true,
  selection_basis: "current_checkin",
  band_intent: "gamma",
  carrier_intent: "cognition_joy",
  top_needs_used: ["Curiosity", "Joy"],
  explicit_cues_used: ["inspiration", "cognition", "joy"],
  context_modifiers_used: ["time:10:30", "weather:unavailable", "location:Sydney"],
  horizons_considered: ["horizon_1", "horizon_2", "horizon_3"],
  confidence: 0.84,
  safety_state: "standard",
  session_scope: "current_session_only",
  research_boundary: "biological_targets_not_used_in_product_decisions",
});

const conflictingResponse = await worker.fetch(new Request(
  "https://realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/citizen-needs-inference",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://staging.universalmind.tv",
    },
    body: JSON.stringify({
      checkin: "I am curious, joyful and ready for inspiration.",
      environment_context: {
        local_time: "10:30",
        location_label: "Sydney",
        location_precision: "approximate",
        context_available: true,
      },
      momentary_physiology: {
        heart_rate_bpm: 52,
        measurement_duration_seconds: 30,
        source: "shen_quick_hr",
      },
    }),
  },
), {
  OPENAI_API_KEY: "test-only-key",
  OPENAI_INFERENCE_MODEL: "gpt-5.5-test",
});
const conflictingResult = await conflictingResponse.json();
const conflictingUserMessage = capturedOpenAIRequest.input[1].content;
assert.equal(conflictingResponse.status, 200, JSON.stringify(conflictingResult));
assert.ok(!conflictingUserMessage.includes("52"), "Raw conflicting Heart Rate escaped into the external model request");
assert.ok(!conflictingUserMessage.includes("heart_rate_bpm"), "Conflicting Heart Rate field escaped into the external model request");
assert.equal(conflictingResult.current_inference.heart_rate_role, "conflicting");
assert.equal(conflictingResult.current_inference.heart_rate_zone, "low_observed");
assert.equal(conflictingResult.current_inference.confidence, 0.73);
assert.equal(conflictingResult.confidence, 0.82);
assert.equal(conflictingResult.adaptive_sound_intent.confidence, 0.76);
assert.equal(conflictingResult.adaptive_sound_intent.band_intent, "gamma");
assert.equal(conflictingResult.adaptive_sound_intent.carrier_intent, "cognition_joy");
assert.ok(!JSON.stringify(conflictingResult).includes("heart_rate_bpm"), "Raw conflicting Heart Rate escaped into the public response");

process.stdout.write(`${JSON.stringify({
  schema_version: "citizen_needs_live_request_construction_qa_v1",
  worker_post_handler_executed: true,
  openai_request_captured: true,
  strict_schema_validated: true,
  response_validation_executed: true,
  supporting_and_conflicting_heart_rate_reconciled_locally: true,
  prompt_version: result.prompt_version,
  prompt_sha256: result.prompt_sha256,
  adaptive_sound_intent: result.adaptive_sound_intent,
})}\n`);
