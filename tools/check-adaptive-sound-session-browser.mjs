#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SYSTEM_PROMPT_SHA256,
  SYSTEM_PROMPT_VERSION,
} from "../cloudflare/adaptive-inference-system-prompt-v5-55.js";

const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(playwrightModule);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM = path.join(ROOT, "i  a m");
const BASE_URL = "https://staging.universalmind.tv/vogue/iam";
const PROMPT_VERSION = SYSTEM_PROMPT_VERSION;
const PROMPT_SHA256 = SYSTEM_PROMPT_SHA256;
const BANDS = new Set(["delta", "theta", "alpha", "gamma"]);
const CARRIERS = new Set([111, 222, 444, 555, 999]);
const forbiddenTargets = ["SLC6A4", "CD38", "DOCK2", "OXTR", "DRD2"];
const localAssets = new Map([
  ["/vogue/iam/index.html", path.join(IAM, "index.html")],
  ["/vogue/iam/index-alt.html", path.join(IAM, "index-alt.html")],
  ["/vogue/iam/homepage-alternate.js", path.join(IAM, "homepage-alternate.js")],
  ["/vogue/iam/adaptive-sound/controller-v1.js", path.join(IAM, "adaptive-sound", "controller-v1.js")],
  ["/vogue/iam/adaptive-sound/session-v1.js", path.join(IAM, "adaptive-sound", "session-v1.js")],
  ["/vogue/iam/adaptive-sound-intent-policy-v1.json", path.join(IAM, "adaptive-sound-intent-policy-v1.json")],
]);

const server = await chromium.launchServer({
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=user-gesture-required"],
});
const browserProcess = server.process();
assert.ok(browserProcess, "Chromium process must be observable");
assert.ok(browserProcess.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");
const browser = await chromium.connect(server.wsEndpoint());
const report = {
  passed: false,
  browser: {
    mute_audio_asserted: true,
    pid: browserProcess.pid,
  },
  standard: null,
  no_checkin: null,
  high_concern: null,
  manual_opt_in: null,
  blocked_media_requests: 0,
  blocked_play_attempts: 0,
  page_errors: [],
  cleanup: false,
};

try {
  report.standard = await checkRealCheckinAndController();
  report.no_checkin = await checkNoCheckin();
  const concern = await checkHighConcernAndManualOptIn();
  report.high_concern = concern.high_concern;
  report.manual_opt_in = concern.manual_opt_in;
  assert.deepEqual(report.page_errors, [], `Unexpected page errors: ${report.page_errors.join(" | ")}`);
  report.passed = true;
} finally {
  await browser.close().catch(() => null);
  await server.close().catch(() => null);
  report.cleanup = browserProcess.exitCode !== null || browserProcess.killed;
}

assert.equal(report.cleanup, true, "Owned muted Chromium process must close");
console.log(JSON.stringify(report, null, 2));

async function checkRealCheckinAndController() {
  const context = await makeContext();
  const page = await context.newPage();
  monitor(page);
  const inferenceResponsePromise = page.waitForResponse((response) => (
    response.request().method() === "POST"
    && response.url().includes("/api/citizen-needs-inference.php")
  ), { timeout: 60000 });

  await page.goto(`${BASE_URL}/vogue-self-report.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const form = document.querySelector("[data-iam-form]");
    const input = document.querySelector("[data-iam-input]");
    return form && input && !form.inert && !input.disabled;
  });
  await page.evaluate(() => {
    document.body.dataset.iamNextPage = "index-alt.html?adaptiveSoundSourceQa=1";
    const main = document.querySelector("[data-iam-next-page]");
    if (main) main.dataset.iamNextPage = "index-alt.html?adaptiveSoundSourceQa=1";
  });
  await page.locator("[data-iam-start]").click({ force: true });
  await page.locator("[data-iam-input]").fill("energised, joyful, curious and ready to create");
  await page.locator("[data-iam-input]").press("Enter");

  const inferenceResponse = await inferenceResponsePromise;
  assert.equal(inferenceResponse.status(), 200, "Real staging check-in inference must return HTTP 200");
  const inferencePayload = await inferenceResponse.json();
  assert.equal(inferencePayload.prompt_version, PROMPT_VERSION);
  assert.equal(inferencePayload.prompt_sha256, PROMPT_SHA256);
  await page.waitForURL(/index-alt\.html/);
  await page.waitForFunction(() => window.IAMAdaptiveSoundSnapshot?.selected === true, null, { timeout: 60000 });

  const snapshot = await page.evaluate(() => window.IAMAdaptiveSoundSnapshot);
  const readout = await readHomepageState(page);
  assert.ok(BANDS.has(snapshot.band_intent), "Real check-in must resolve an allowed band");
  assert.ok(CARRIERS.has(snapshot.carrier_hz), "Real check-in must resolve an allowed carrier");
  assert.equal(snapshot.selection_basis, "inference_semantic_intent");
  assert.equal(snapshot.session_scope, "current_session_only");
  assert.equal(snapshot.authority.prompt_version, PROMPT_VERSION);
  assert.equal(snapshot.authority.prompt_sha256, PROMPT_SHA256);
  assert.equal(snapshot.audit.raw_checkin_text_used, false);
  assertNoTargetLeakage(snapshot);
  assert.equal(readout.selected, "true");
  assert.equal(readout.basis, "inference_semantic_intent");
  assert.match(readout.text, new RegExp(`${snapshot.band_intent}.*${snapshot.dominant_isochronic_hz} Hz.*${snapshot.carrier_hz} Hz`, "i"));
  await assertMediaStillStopped(page);

  await page.goto(`${BASE_URL}/index.html?adaptiveSoundControllerSourceQa=1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.IAMAdaptiveSound?.diagnostics?.().session_snapshot?.selected === true);
  const diagnostics = await page.evaluate(() => window.IAMAdaptiveSound.diagnostics());
  assert.equal(diagnostics.profile_id, snapshot.profile_id);
  assert.equal(diagnostics.carrier_hz, snapshot.carrier_hz);
  assert.equal(diagnostics.selection_basis, snapshot.selection_basis);
  assert.equal(diagnostics.session_scope, "current_session_only");
  assert.equal(diagnostics.context_state, "not_created", "Controller must not start synth playback before the panel opens");
  assertNoTargetLeakage(diagnostics.session_snapshot);
  await assertMediaStillStopped(page);

  const result = {
    inference_http_status: inferenceResponse.status(),
    prompt_version: inferencePayload.prompt_version,
    prompt_sha256: inferencePayload.prompt_sha256,
    band_intent: snapshot.band_intent,
    dominant_isochronic_hz: snapshot.dominant_isochronic_hz,
    carrier_hz: snapshot.carrier_hz,
    selection_basis: snapshot.selection_basis,
    selection_authority: snapshot.authority.selection_authority,
    audit_source_event: snapshot.audit.source_event,
    homepage_text: readout.text,
    controller_context_state: diagnostics.context_state,
  };
  await context.close();
  return result;
}

async function checkNoCheckin() {
  const context = await makeContext();
  const page = await context.newPage();
  monitor(page);
  await page.goto(`${BASE_URL}/index-alt.html?adaptiveSoundNoCheckinSourceQa=1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.IAMAdaptiveSoundSession?.current?.());
  const snapshot = await page.evaluate(() => window.IAMAdaptiveSoundSnapshot);
  const readout = await readHomepageState(page);
  assert.equal(snapshot.selected, false);
  assert.equal(snapshot.band_intent, null);
  assert.equal(snapshot.carrier_hz, null);
  assert.equal(snapshot.selection_basis, "insufficient_context");
  assert.equal(snapshot.safety.adaptive_frequencies_enabled, false);
  assert.equal(readout.selected, "false");
  assert.match(readout.text, /no current-session frequency selected/i);
  assert.doesNotMatch(readout.text, /444/);
  assertNoTargetLeakage(snapshot);
  await assertMediaStillStopped(page);
  const result = {
    selected: snapshot.selected,
    band_intent: snapshot.band_intent,
    carrier_hz: snapshot.carrier_hz,
    selection_basis: snapshot.selection_basis,
    homepage_text: readout.text,
  };
  await context.close();
  return result;
}

async function checkHighConcernAndManualOptIn() {
  const context = await makeContext();
  const page = await context.newPage();
  monitor(page);
  await page.goto(`${BASE_URL}/index-alt.html?adaptiveSoundHighConcernSourceQa=1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.IAMAdaptiveSoundSession?.current?.());
  const fixture = highConcernFixture();
  await page.evaluate((payload) => {
    sessionStorage.setItem("iamLatestInference", JSON.stringify(payload));
    sessionStorage.setItem("citizenNeedsLatestInference", JSON.stringify(payload));
    window.__iamLatestInference = payload;
    window.dispatchEvent(new CustomEvent("iam:inference-updated", { detail: payload }));
  }, fixture);
  await page.waitForFunction(() => window.IAMAdaptiveSoundSnapshot?.safety?.state === "high_concern");
  const highSnapshot = await page.evaluate(() => window.IAMAdaptiveSoundSnapshot);
  const highReadout = await readHomepageState(page);
  assert.equal(highSnapshot.selected, true);
  assert.equal(highSnapshot.safety.quantum_tree_enabled, true);
  assert.equal(highSnapshot.safety.adaptive_frequencies_enabled, false);
  assert.equal(highSnapshot.safety.adaptive_frequencies_default, false);
  assert.equal(highSnapshot.safety.citizen_session_opt_in_required, true);
  assert.equal(highSnapshot.safety.notification.status, "blocked_until_consent_and_verified_contact");
  assert.equal(highSnapshot.safety.notification.model_must_not_contact_any_person, true);
  assert.match(highReadout.text, /added frequencies off/i);
  assertNoContactAction(highSnapshot);
  assertNoTargetLeakage(highSnapshot);

  await page.goto(`${BASE_URL}/index.html?adaptiveSoundHighConcernControllerQa=1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.IAMAdaptiveSound?.diagnostics?.().session_snapshot?.safety?.state === "high_concern");
  const beforeOptIn = await page.evaluate(() => window.IAMAdaptiveSound.diagnostics());
  assert.equal(beforeOptIn.synth_enabled, false);
  assert.equal(beforeOptIn.context_state, "not_created");
  await page.evaluate(() => window.IAMAdaptiveSound.open());
  const thetaChoice = page.locator('[data-adaptive-profile="mindfulness_theta_80_v1"]').first();
  await thetaChoice.focus();
  await thetaChoice.press("Enter");
  await page.waitForFunction(() => (
    window.IAMAdaptiveSoundSnapshot?.selection_basis === "citizen_session_override"
    && window.IAMAdaptiveSoundSnapshot?.safety?.adaptive_frequencies_enabled === true
  ));
  const optedSnapshot = await page.evaluate(() => window.IAMAdaptiveSoundSnapshot);
  const optedDiagnostics = await page.evaluate(() => window.IAMAdaptiveSound.diagnostics());
  assert.equal(optedSnapshot.band_intent, "theta");
  assert.equal(optedSnapshot.carrier_hz, 444);
  assert.equal(optedSnapshot.selection_basis, "citizen_session_override");
  assert.equal(optedSnapshot.session_scope, "current_session_only");
  assert.equal(optedSnapshot.safety.adaptive_frequencies_enabled, true);
  assert.equal(optedSnapshot.authority.selection_authority, "citizen_current_session_choice");
  assert.equal(optedDiagnostics.profile_id, "mindfulness_theta_80_v1");
  assert.equal(optedDiagnostics.carrier_hz, 444);
  assert.equal(JSON.parse(await page.evaluate(() => sessionStorage.getItem("iamAdaptiveSoundSessionChoiceV1"))).scope, "current_session_only");
  assert.equal(await page.evaluate(() => localStorage.getItem("iamAdaptiveSoundSessionChoiceV1")), null);
  assertNoTargetLeakage(optedSnapshot);
  await assertMediaStillStopped(page);
  await page.locator("[data-adaptive-sound-master]").click();

  const result = {
    high_concern: {
      safety_state: highSnapshot.safety.state,
      quantum_tree_enabled: highSnapshot.safety.quantum_tree_enabled,
      adaptive_frequencies_enabled: highSnapshot.safety.adaptive_frequencies_enabled,
      notification_status: highSnapshot.safety.notification.status,
      homepage_text: highReadout.text,
      controller_context_before_opt_in: beforeOptIn.context_state,
    },
    manual_opt_in: {
      band_intent: optedSnapshot.band_intent,
      carrier_hz: optedSnapshot.carrier_hz,
      selection_basis: optedSnapshot.selection_basis,
      selection_authority: optedSnapshot.authority.selection_authority,
      session_scope: optedSnapshot.session_scope,
      adaptive_frequencies_enabled: optedSnapshot.safety.adaptive_frequencies_enabled,
      session_storage_only: true,
    },
  };
  await context.close();
  return result;
}

async function makeContext() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    permissions: [],
    serviceWorkers: "block",
  });
  await context.exposeBinding("__iamQaRecordPlayAttempt", () => {
    report.blocked_play_attempts += 1;
  });
  await context.addInitScript(() => {
    window.__iamQaBlockedPlayAttempts = 0;
    const blockedPlay = function blockedPlay() {
      window.__iamQaBlockedPlayAttempts += 1;
      window.__iamQaRecordPlayAttempt?.();
      this.pause?.();
      try { this.currentTime = 0; } catch {}
      return Promise.reject(new DOMException("Media playback blocked by adaptive-sound source QA", "NotAllowedError"));
    };
    Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: blockedPlay });
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() === "media") {
      report.blocked_media_requests += 1;
      await route.abort("blockedbyclient");
      return;
    }
    if (url.hostname === "staging.universalmind.tv" && url.pathname === "/vogue/iam/api/citizen-data/v1/consent/status") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ granted: true }) });
      return;
    }
    if (url.hostname === "staging.universalmind.tv" && url.pathname === "/vogue/iam/api/citizen-data/v1/sessions") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "adaptive-sound-source-qa-session" }) });
      return;
    }
    if (url.hostname === "staging.universalmind.tv" && url.pathname === "/vogue/iam/api/citizen-data/v1/checkins") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "adaptive-sound-source-qa-checkin" }) });
      return;
    }
    const localFile = url.hostname === "staging.universalmind.tv" ? localAssets.get(url.pathname) : null;
    if (localFile) {
      await route.fulfill({
        status: 200,
        contentType: contentType(localFile),
        body: fs.readFileSync(localFile),
      });
      return;
    }
    if (url.hostname !== "staging.universalmind.tv") {
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  return context;
}

function monitor(page) {
  page.on("pageerror", (error) => report.page_errors.push(error.message));
}

async function readHomepageState(page) {
  return page.locator(".homepage-alternate__frequency").evaluate((node) => ({
    text: node.innerText.replace(/\s+/g, " ").trim(),
    selected: node.dataset.soundSelected,
    basis: node.dataset.soundSelectionBasis,
    authority: node.dataset.soundAuthority,
    audit: node.dataset.soundAuditProvenance,
  }));
}

async function assertMediaStillStopped(page) {
  const mediaState = await page.evaluate(() => Array.from(document.querySelectorAll("audio, video")).map((media) => ({
    paused: media.paused,
    current_time: media.currentTime,
    ready_state: media.readyState,
  })));
  mediaState.forEach((state) => {
    assert.equal(state.paused, true, "Every HTML media element must remain paused");
    assert.equal(state.current_time, 0, "Every HTML media element must remain at 0.0 seconds");
  });
}

function highConcernFixture() {
  return {
    engine_version: "adaptive_inference_engine_v5.55",
    prompt_version: PROMPT_VERSION,
    prompt_sha256: PROMPT_SHA256,
    adaptive_sound_intent: {
      relevant: true,
      selection_basis: "current_checkin",
      band_intent: "alpha",
      carrier_intent: "presence",
      top_needs_used: ["Calm"],
      explicit_cues_used: [],
      confidence: 0.9,
      safety_state: "high_concern",
      session_scope: "current_session_only",
      research_boundary: "biological_targets_not_used_in_product_decisions",
    },
    citizen_needs: { Emotion: { Calm: 0.8 } },
    adaptive_support_relevance: { level: "high" },
    human_review_relevance: { level: "recommended" },
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

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}
