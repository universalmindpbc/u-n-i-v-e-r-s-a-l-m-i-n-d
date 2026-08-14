#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ADAPTIVE_SOUND_SESSION_CHOICE_KEY,
  ADAPTIVE_SOUND_SESSION_EVENT,
  ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION,
  ADAPTIVE_SOUND_SESSION_STORAGE_KEY,
  resolveAdaptiveSoundSession,
  startAdaptiveSoundSession,
} from "../i  a m/adaptive-sound/session-v1.js";
import { SYSTEM_PROMPT_SHA256 } from "../cloudflare/adaptive-inference-system-prompt-v5-55.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const policyPath = fileURLToPath(new URL("../i  a m/adaptive-sound-intent-policy-v1.json", import.meta.url));
const pythonResolverPath = fileURLToPath(new URL("../i  a m/adaptive_sound_policy.py", import.meta.url));
const policy = JSON.parse(readFileSync(policyPath, "utf8"));
const bands = Object.keys(policy.bands);
const carriers = Object.keys(policy.carriers);
const forbiddenTargets = ["SLC6A4", "CD38", "DOCK2", "OXTR", "DRD2"];
let assertions = 0;

for (const bandIntent of bands) {
  for (const carrierIntent of carriers) {
    const fixture = intentFixture(bandIntent, carrierIntent);
    const browser = resolveAdaptiveSoundSession(fixture, policy, { sourceEvent: "matrix_fixture" });
    const python = resolveWithPython(fixture);
    const expectedBand = policy.bands[bandIntent];
    const expectedCarrier = policy.carriers[carrierIntent];

    assert.equal(browser.schema_version, ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION);
    assert.equal(browser.selected, true);
    assert.equal(browser.band_intent, bandIntent);
    assert.equal(browser.dominant_lane, bandIntent);
    assert.equal(browser.dominant_isochronic_hz, policy.isochronic_hz[bandIntent]);
    assert.equal(browser.profile_id, expectedBand.profile_id);
    assert.equal(browser.carrier_intent, carrierIntent);
    assert.equal(browser.carrier_hz, expectedCarrier.carrier_hz);
    assert.equal(browser.selection_basis, "inference_semantic_intent");
    assert.equal(browser.session_scope, "current_session_only");
    assert.equal(browser.safety.adaptive_frequencies_enabled, true);
    assert.equal(browser.authority.prompt_version, "adaptive-inference-engine-system-prompt-v5.55");
    assert.equal(browser.authority.prompt_sha256, SYSTEM_PROMPT_SHA256);
    assert.equal(browser.audit.source_event, "matrix_fixture");
    assert.equal(browser.audit.raw_checkin_text_used, false);
    assert.equal(browser.audit.research_hypotheses_registry_loaded, false);
    assert.deepEqual(browser.audit.context_dimensions_considered, ["time", "weather", "location"]);
    assert.deepEqual(browser.audit.horizons_considered, ["horizon_1", "horizon_2", "horizon_3"]);
    assert.equal(browser.audit.raw_heart_rate_retained, false);
    assert.equal(browser.audit.baseline_comparison_used, false);
    assert.deepEqual(comparable(browser), comparable(python));
    assertNoTargetLeakage(browser);
    assertions += 23;
  }
}

const noCheckin = resolveAdaptiveSoundSession({}, policy, { sourceEvent: "no_checkin" });
assert.equal(noCheckin.selected, false);
assert.equal(noCheckin.band_intent, null);
assert.equal(noCheckin.carrier_hz, null);
assert.equal(noCheckin.selection_basis, "insufficient_context");
assert.equal(noCheckin.safety.adaptive_frequencies_enabled, false);
assert.notEqual(noCheckin.carrier_hz, 444);
assertNoTargetLeakage(noCheckin);
assertions += 7;

const insufficient = resolveAdaptiveSoundSession({
  adaptive_sound_intent: {
    relevant: false,
    selection_basis: "insufficient_context",
    band_intent: null,
    carrier_intent: null,
    safety_state: "standard",
  },
  citizen_needs: { Emotion: { Calm: 1 } },
}, policy, { sourceEvent: "insufficient_context" });
assert.equal(insufficient.selected, false);
assert.equal(insufficient.profile_id, null);
assert.equal(insufficient.carrier_hz, null);
assert.equal(insufficient.safety.adaptive_frequencies_enabled, false);
assertions += 4;

const highConcernFixture = intentFixture("alpha", "presence", "high_concern");
highConcernFixture.adaptive_support_relevance = { level: "high" };
highConcernFixture.human_review_relevance = { level: "recommended" };
const highConcern = resolveAdaptiveSoundSession(highConcernFixture, policy, { sourceEvent: "high_concern" });
assert.equal(highConcern.selected, true);
assert.equal(highConcern.safety.state, "high_concern");
assert.equal(highConcern.safety.quantum_tree_enabled, true);
assert.equal(highConcern.safety.adaptive_frequencies_enabled, false);
assert.equal(highConcern.safety.adaptive_frequencies_default, false);
assert.equal(highConcern.safety.citizen_session_opt_in_required, true);
assert.equal(highConcern.safety.human_review_required, true);
assert.equal(highConcern.safety.notification.status, "blocked_until_consent_and_verified_contact");
assert.equal(highConcern.safety.notification.model_must_not_contact_any_person, true);
assertNoContactAction(highConcern);
assertNoTargetLeakage(highConcern);
assertions += 11;

const optedIn = resolveAdaptiveSoundSession(highConcernFixture, policy, {
  sourceEvent: "manual_high_concern_opt_in",
  sessionChoice: {
    band_intent: "theta",
    carrier_intent: "earth_focus_reward",
    high_concern_session_opt_in: true,
  },
});
assert.equal(optedIn.selected, true);
assert.equal(optedIn.band_intent, "theta");
assert.equal(optedIn.carrier_hz, 999);
assert.equal(optedIn.selection_basis, "citizen_session_override");
assert.equal(optedIn.safety.adaptive_frequencies_enabled, true);
assert.equal(optedIn.authority.selection_authority, "citizen_current_session_choice");
assert.equal(optedIn.session_scope, "current_session_only");
assertions += 7;

const manualWithoutCheckin = resolveAdaptiveSoundSession({}, policy, {
  sourceEvent: "manual_no_checkin",
  sessionChoice: {
    band_intent: "delta",
    carrier_intent: "cognition_joy",
    high_concern_session_opt_in: false,
  },
});
assert.equal(manualWithoutCheckin.selected, true);
assert.equal(manualWithoutCheckin.band_intent, "delta");
assert.equal(manualWithoutCheckin.carrier_hz, 111);
assert.equal(manualWithoutCheckin.selection_basis, "citizen_session_override");
assert.equal(manualWithoutCheckin.audit.current_session_only, true);
assert.equal(manualWithoutCheckin.audit.raw_checkin_text_used, false);
assertions += 6;

const masterOff = resolveAdaptiveSoundSession(intentFixture("gamma", "social_connection"), policy, {
  sourceEvent: "master_off",
  preferences: { sound_master_enabled: false },
});
assert.equal(masterOff.selected, true);
assert.equal(masterOff.safety.quantum_tree_enabled, false);
assert.equal(masterOff.safety.adaptive_frequencies_enabled, false);
assertions += 3;

const scoredFixture = {
  citizen_needs: {
    Physiological: { "Sleep Pressure": 1, Fatigue: 0.9 },
    Social: { Connection: 1, Belonging: 0.9 },
  },
  adaptive_support_relevance: { level: "none" },
  human_review_relevance: { level: "none" },
};
const scoredBrowser = resolveAdaptiveSoundSession(scoredFixture, policy, { sourceEvent: "structured_needs" });
const scoredPython = resolveWithPython(scoredFixture);
assert.equal(scoredBrowser.selection_basis, "deterministic_needs_scores");
assert.deepEqual(comparable(scoredBrowser), comparable(scoredPython));
assertNoTargetLeakage(scoredBrowser);
assertions += 3;

const moduleSource = readFileSync(fileURLToPath(new URL("../i  a m/adaptive-sound/session-v1.js", import.meta.url)), "utf8");
const controllerSource = readFileSync(fileURLToPath(new URL("../i  a m/adaptive-sound/controller-v1.js", import.meta.url)), "utf8");
const homepageSource = readFileSync(fileURLToPath(new URL("../i  a m/homepage-alternate.js", import.meta.url)), "utf8");
const alternateHtml = readFileSync(fileURLToPath(new URL("../i  a m/index-alt.html", import.meta.url)), "utf8");
assert.doesNotMatch(controllerSource, /neutral_alpha_default|carrierHz:\s*444|iamAdaptiveSoundProfile|iamAdaptiveSoundCarrier/);
assert.match(controllerSource, /ADAPTIVE_SOUND_SESSION_EVENT/);
assert.match(controllerSource, /session_snapshot/);
assert.match(moduleSource, /windowRef\.sessionStorage/);
assert.doesNotMatch(moduleSource, /windowRef\.localStorage[^\n]+iamAdaptiveSoundSession/);
assert.match(homepageSource, /dominant_isochronic_hz/);
assert.match(homepageSource, /soundAuditProvenance/);
assert.match(alternateHtml, /no current-session frequency selected/);
assert.doesNotMatch(alternateHtml, /data-homepage-sound-carrier>444 Hz/);
assertions += 9;

const fakeWindow = createFakeWindow();
let publishedEvents = 0;
fakeWindow.addEventListener(ADAPTIVE_SOUND_SESSION_EVENT, () => { publishedEvents += 1; });
const browserSession = startAdaptiveSoundSession({
  windowRef: fakeWindow,
  fetchImpl: async () => ({ ok: true, json: async () => policy }),
});
await browserSession.ready;
assert.equal(browserSession.current().selected, false);
assert.equal(JSON.parse(fakeWindow.sessionStorage.getItem(ADAPTIVE_SOUND_SESSION_STORAGE_KEY)).selected, false);
fakeWindow.dispatchEvent(new fakeWindow.CustomEvent("iam:inference-updated", {
  detail: intentFixture("gamma", "earth_focus_reward"),
}));
assert.equal(browserSession.current().band_intent, "gamma");
assert.equal(browserSession.current().carrier_hz, 999);
assert.equal(browserSession.current().audit.source_event, "iam:inference-updated");
browserSession.setSessionChoice({ profile_id: "sleep_delta_80_v1", carrier_hz: 222 }, "test_session_choice");
assert.equal(browserSession.current().band_intent, "delta");
assert.equal(browserSession.current().carrier_hz, 222);
assert.equal(browserSession.current().selection_basis, "citizen_session_override");
assert.equal(JSON.parse(fakeWindow.sessionStorage.getItem(ADAPTIVE_SOUND_SESSION_CHOICE_KEY)).scope, "current_session_only");
assert.equal(fakeWindow.localStorage.getItem(ADAPTIVE_SOUND_SESSION_CHOICE_KEY), null);
assert.ok(publishedEvents >= 3);
assertions += 11;

console.log(`Adaptive sound session integration: PASS (${bands.length * carriers.length}/20 band-carrier combinations, ${assertions} assertions)`);
console.log(`Policy: ${policy.policy_version}`);
console.log(`Workspace: ${root}`);

function intentFixture(bandIntent, carrierIntent, safetyState = "standard") {
  return {
    engine_version: "adaptive_inference_engine_v5.55",
    prompt_version: "adaptive-inference-engine-system-prompt-v5.55",
    prompt_sha256: SYSTEM_PROMPT_SHA256,
    current_inference: {
      inference_id: "settled_resting",
      heart_rate_role: "supporting",
      heart_rate_zone: "mid_observed",
    },
    adaptive_sound_intent: {
      relevant: true,
      selection_basis: "current_checkin",
      band_intent: bandIntent,
      carrier_intent: carrierIntent,
      top_needs_used: ["Calm"],
      explicit_cues_used: [],
      context_modifiers_used: ["time:08:00", "weather:clear", "location:coastal"],
      horizons_considered: ["horizon_1", "horizon_2", "horizon_3"],
      confidence: 0.91,
      safety_state: safetyState,
      session_scope: "current_session_only",
      research_boundary: "biological_targets_not_used_in_product_decisions",
    },
    citizen_needs: { Emotion: { Calm: 0.8 }, Cognitive: { Clarity: 0.6 } },
    adaptive_support_relevance: { level: "none" },
    human_review_relevance: { level: "none" },
  };
}

function resolveWithPython(payload) {
  const result = spawnSync("python3", [pythonResolverPath], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || "Python adaptive-sound resolver failed");
  return JSON.parse(result.stdout);
}

function comparable(value) {
  return {
    schema_version: value.schema_version,
    policy_version: value.policy_version,
    selected: value.selected,
    selection_basis: value.selection_basis,
    session_scope: value.session_scope,
    band_intent: value.band_intent,
    profile_id: value.profile_id,
    carrier_intent: value.carrier_intent,
    carrier_hz: value.carrier_hz,
    carrier_mode: value.carrier_mode,
    diamond_power_weights: value.diamond_power_weights,
    isochronic_hz: value.isochronic_hz,
    safety: value.safety,
    research_boundary: value.research_boundary,
  };
}

function assertNoTargetLeakage(value) {
  const serialized = JSON.stringify(value);
  forbiddenTargets.forEach((target) => assert.doesNotMatch(serialized, new RegExp(target, "i")));
}

function assertNoContactAction(value) {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const token of ["contact_action", "notification_sent", "message_sent", "call_placed"]) {
    assert.equal(serialized.includes(token), false, `Unexpected contact action token: ${token}`);
  }
}

function createFakeWindow() {
  class MemoryStorage {
    constructor() {
      this.values = new Map();
    }

    getItem(key) {
      return this.values.has(key) ? this.values.get(key) : null;
    }

    setItem(key, value) {
      this.values.set(key, String(value));
    }

    removeItem(key) {
      this.values.delete(key);
    }
  }
  class FakeCustomEvent extends Event {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  }
  const target = new EventTarget();
  target.CustomEvent = FakeCustomEvent;
  target.sessionStorage = new MemoryStorage();
  target.localStorage = new MemoryStorage();
  return target;
}
