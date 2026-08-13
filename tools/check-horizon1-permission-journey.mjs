#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const playwright = await import(playwrightModule);
const { chromium } = playwright.default || playwright;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM = path.join(ROOT, "i  a m");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const voiceSourcePath = path.join(IAM, "realtime-voice-assistant.js");
const careSourcePath = path.join(IAM, "care-worlds.js");
const circleSourcePath = path.join(IAM, "circle-audio-rooms.js");
const sensitiveKeys = [
  "iamLatestCheckinValue",
  "iamLatestCheckinUpdated",
  "citizenNeedsLatestCheckinValue",
  "citizenNeedsLatestCheckinUpdated",
  "iamLatestInference",
  "citizenNeedsLatestInference",
  "iamPendingCheckInPipeline",
];

const induction = read("i  a m/induction.html");
const consent = read("i  a m/citizen-data-consent.js");
const globe = read("i  a m/globe.js");
const homepageCheckin = read("i  a m/homepage-checkin.js");
const voice = read("i  a m/realtime-voice-assistant.js");
const voiceCss = read("i  a m/realtime-voice-assistant.css");
const circles = read("i  a m/circle-audio-rooms.js");
const circleCss = read("i  a m/circle-audio-rooms.css");
const care = read("i  a m/care-worlds.js");
const careCss = read("i  a m/care-worlds.css");

assert.doesNotMatch(induction, /data-arrival-consent|arrival-consent-title|data-consent-accept/);
assert.match(induction, /href="privacy-first\.html"[^>]*>Privacy First<\/a>/);
assert.doesNotMatch(consent, /consentStatus|acceptConsent|permission=required/);
assert.match(consent, /durableAccountStorage: false/);
assert.match(globe, /function sensitiveStorageTargets\(\) \{\s*return \[window\.sessionStorage\];/);
assert.match(globe, /function clearLegacyCrossSessionCheckIn\(\)/);
assert.doesNotMatch(globe, /readStoredValue\(window\.localStorage, "(?:iamLatestCheckinValue|citizenNeedsLatestCheckinValue)"\)/);
assert.doesNotMatch(homepageCheckin, /IAMCitizenData|recordCheckin/);
assert.doesNotMatch(voice, /Voice features are available|allow microphone|navigator\.permissions.*query[^\n]*entry/i);
assert.match(voice, /function shouldPreflightEntry\(\) \{\s*return false;/);
assert.match(voice, /installPermissionRecoveryCoordinator/);
assert.match(voice, /permissionBefore\[device\] === "prompt" && activation\.permissionAfter\[device\] === "granted"/);
assert.match(voice, /permission_fullscreen_recovery_microphone_v1/);
assert.match(voice, /permission_fullscreen_recovery_camera_v1/);
assert.match(voice, /permission_fullscreen_recovery_camera_microphone_v1/);
assert.match(voice, /idempotency_key: activation\.rewardMilestone/);
assert.match(voice, /HAPPINESS unavailable — no reward recorded\./);
assert.doesNotMatch(voiceCss, /iam-voice-entry-preflight/);
assert.match(circles, /muted: true/);
assert.match(circles, /if \(state\.muted\)[\s\S]{0,180}createMicrophoneAudioTrack/);
assert.match(circles, /beginMicrophoneRecovery\(\)/);
assert.match(circles, /circle-permission-recovery/);
assert.doesNotMatch(circles, /recordMilestone|permission_fullscreen_recovery_(?:microphone|camera)/);
assert.match(circleCss, /\.circle-permission-recovery[\s\S]*bottom: calc\(100% \+ 14px\)/);
assert.match(care, /beginDeviceRecovery\(scope, "camera"\)/);
assert.match(care, /beginDeviceRecovery\(scope, "microphone"\)/);
assert.match(care, /care-permission-recovery/);
assert.doesNotMatch(care, /recordMilestone|permission_fullscreen_recovery_(?:microphone|camera)/);
assert.match(careCss, /\.care-permission-recovery[\s\S]*margin: 14px auto 0/);

const telemetry = {
  inference: [],
  selection: [],
  durableCitizenWrites: 0,
  blockedMedia: 0,
  blockedExternal: 0,
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const body = await readBody(request);
  if (request.method === "POST" && /citizen-needs-inference/.test(url.pathname)) {
    telemetry.inference.push(JSON.parse(body || "{}"));
    return sendJson(response, {
      prompt_version: "horizon1-permission-journey-fixture",
      model: "local-fixture",
      selected_music_room: "inner-planes",
      top_needs_used: ["Calm"],
    });
  }
  if (request.method === "POST" && /adaptive-music-video-selection/.test(url.pathname)) {
    telemetry.selection.push(JSON.parse(body || "{}"));
    return sendJson(response, {
      schema_version: "adaptive_music_video_selection_v1.11",
      selected_track_id: "bjork-hyperballad",
      selected_music_room: "inner-planes",
      selection_reason: "Local permission journey fixture",
    });
  }
  if (/citizen-data\/v1\/(?:sessions|checkins)/.test(url.pathname)) {
    telemetry.durableCitizenWrites += 1;
    return sendJson(response, { ok: false, error: "durable_guest_write_forbidden" }, 409);
  }

  const relative = decodeURIComponent(url.pathname.replace(/^\/vogue\/iam\/?/, "")) || "induction.html";
  const filePath = path.resolve(IAM, relative);
  if (!filePath.startsWith(`${IAM}${path.sep}`) && filePath !== IAM) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = fs.readFileSync(filePath);
    response.writeHead(200, {
      "Content-Type": mimeType(filePath),
      "Cache-Control": "no-store",
    });
    response.end(file);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/vogue/iam`;
const chromiumServer = await chromium.launchServer({
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess?.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");
const browser = await chromium.connect(chromiumServer.wsEndpoint());
const report = {
  passed: false,
  process_muted: true,
  first_visit: null,
  guest_checkin: null,
  cross_session: null,
  direct_room_entry: null,
  voice_denial: null,
  voice_recovery: null,
  reward_unavailable: null,
  care_connect: null,
  care_talk: null,
  circle: null,
  combined_recovery: null,
  recovery_guardrails: null,
  cleanup: false,
};

try {
  const guest = await runGuestJourney();
  report.first_visit = guest.firstVisit;
  report.guest_checkin = guest.checkin;
  report.cross_session = guest.crossSession;
  report.direct_room_entry = await runDirectRoomEntryCheck();
  report.voice_denial = await runVoiceDenialCheck();
  report.voice_recovery = await runVoiceRecoveryCheck({ rewardAvailable: true });
  report.reward_unavailable = await runVoiceRecoveryCheck({ rewardAvailable: false });
  const surfaces = await runCareAndCircleChecks();
  report.care_connect = surfaces.careConnect;
  report.care_talk = surfaces.careTalk;
  report.circle = surfaces.circle;
  report.combined_recovery = await runCombinedRecoveryCheck();
  report.recovery_guardrails = await runRecoveryGuardrailChecks();
  report.passed = true;
} finally {
  await browser.close().catch(() => null);
  await chromiumServer.close().catch(() => null);
  await new Promise((resolve) => server.close(resolve));
  report.cleanup = browserProcess.exitCode !== null || browserProcess.killed;
}

assert.equal(report.cleanup, true, "Owned process-muted Chromium must close");
console.log(JSON.stringify(report, null, 2));

async function runGuestJourney() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: [], serviceWorkers: "block" });
  await installSafeRouting(context);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/induction.html?induction=show`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("[role='dialog'], [aria-modal='true']").count(), 0, "First visit must have no blocking app dialog");
  assert.equal(await page.locator("a[href='privacy-first.html']").count(), 1, "Privacy First must remain accessible");
  await page.evaluate((keys) => keys.forEach((key) => localStorage.setItem(key, key.includes("Inference") ? '{"checkin":"I am stale"}' : "I am stale")), sensitiveKeys);
  await page.locator("[data-induction-enter]").click();
  await page.waitForURL(/vogue-self-report\.html/);
  await page.waitForFunction(() => {
    const form = document.querySelector("[data-iam-form]");
    const input = document.querySelector("[data-iam-input]");
    return form && input && !form.inert && !input.disabled;
  });
  const clearedBeforeCheckin = await page.evaluate((keys) => keys.every((key) => localStorage.getItem(key) === null), sensitiveKeys);
  assert.equal(clearedBeforeCheckin, true, "Legacy cross-session raw check-in values must clear before a new check-in");

  const initialInferenceCount = telemetry.inference.length;
  await page.locator("[data-iam-start]").click();
  await page.locator("[data-iam-input]").fill("calm and ready for music");
  await page.locator("[data-iam-input]").press("Enter");
  await page.waitForURL(/index\.html/, { timeout: 20000 });
  await page.waitForFunction(() => document.body.dataset.adaptiveSelectionState === "ready", null, { timeout: 30000 });
  assert.equal(telemetry.inference.length, initialInferenceCount + 1, "Check-in must be transiently processed once for inference");
  assert.equal(telemetry.selection.length >= 1, true, "Check-in must produce a music recommendation request");
  assert.equal(telemetry.durableCitizenWrites, 0, "Guest check-in must not create a durable citizen record");
  assert.equal(
    telemetry.inference.at(-1)?.checkin,
    "I am calm and ready for music",
    `Unexpected inference payload: ${JSON.stringify(telemetry.inference.at(-1))}`,
  );
  assert.equal(
    telemetry.selection.at(-1)?.v444_payload?.citizen_checkin,
    "I am calm and ready for music",
    `Unexpected selection payload: ${JSON.stringify(telemetry.selection.at(-1))}`,
  );
  const storage = await page.evaluate((keys) => ({
    sessionRaw: sessionStorage.getItem("iamLatestCheckinValue"),
    localSensitive: keys.filter((key) => localStorage.getItem(key) !== null),
  }), sensitiveKeys);
  assert.equal(storage.sessionRaw, "I am calm and ready for music");
  assert.deepEqual(storage.localSensitive, []);

  await page.evaluate((keys) => {
    keys.forEach((key) => localStorage.setItem(key, key.includes("Inference") ? '{"checkin":"I am stale again"}' : "I am stale again"));
    sessionStorage.clear();
  }, sensitiveKeys);
  const storageState = await context.storageState();
  await context.close();

  const secondContext = await browser.newContext({ storageState, viewport: { width: 1440, height: 900 }, permissions: [], serviceWorkers: "block" });
  await installSafeRouting(secondContext);
  const secondPage = await secondContext.newPage();
  const beforeSecondVisitInference = telemetry.inference.length;
  await secondPage.goto(`${baseUrl}/vogue-self-report.html`, { waitUntil: "domcontentloaded" });
  await secondPage.waitForFunction(() => !document.querySelector("[data-iam-form]")?.inert);
  await secondPage.waitForTimeout(500);
  const secondStorage = await secondPage.evaluate((keys) => ({
    localSensitive: keys.filter((key) => localStorage.getItem(key) !== null),
    sessionSensitive: keys.filter((key) => sessionStorage.getItem(key) !== null),
  }), sensitiveKeys);
  assert.deepEqual(secondStorage.localSensitive, [], "Stale local raw check-in must be deleted on a new browser session");
  assert.deepEqual(secondStorage.sessionSensitive, [], "A new browser session must not inherit raw check-in state");
  assert.equal(telemetry.inference.length, beforeSecondVisitInference, "Stale cross-session data must not trigger inference");
  await secondContext.close();

  return {
    firstVisit: { blocking_dialogs: 0, privacy_first_link: true, guest_form_enabled: true },
    checkin: { inference_calls: 1, recommendation_calls: 1, durable_guest_writes: 0, raw_browser_scope: "session_only" },
    crossSession: { stale_local_raw_removed: true, inherited_session_raw: false, inference_calls: 0 },
  };
}

async function runDirectRoomEntryCheck() {
  const page = await makeVoiceFixture({ microphoneMode: "success", rewardAvailable: false });
  const state = await page.evaluate(() => ({
    preflight: window.IAMRealtimeVoiceAssistant.shouldPreflightEntry(),
    micCalls: window.__voiceQa.micCalls,
    permissionQueries: window.__voiceQa.permissionQueries,
  }));
  assert.deepEqual(state, { preflight: false, micCalls: 0, permissionQueries: 0 });
  await page.context().close();
  return { app_preflight: false, microphone_calls: 0, permission_queries: 0 };
}

async function runVoiceDenialCheck() {
  const page = await makeVoiceFixture({ microphoneMode: "deny", rewardAvailable: true });
  await page.evaluate(() => window.__voiceQa.setFullscreen(true));
  await page.evaluate(() => document.querySelector(".iam-realtime-voice__summon")?.click());
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => ({ ...window.IAMRealtimeVoiceAssistant.getState(), qa: { ...window.__voiceQa } }));
  assert.equal(state.state, "error", `Voice denial did not fail cleanly: ${JSON.stringify(state)}`);
  assert.equal(state.qa.micCalls, 1);
  assert.equal(state.qa.rewardCalls, 0);
  assert.equal(state.awaitingFullscreenReturn, false);
  assert.equal(state.happinessRecoveryRecorded, false);
  await page.context().close();
  return { microphone_calls: 1, clean_error: true, reward_calls: 0, recovery_offer: false };
}

async function runVoiceRecoveryCheck({ rewardAvailable }) {
  const page = await makeVoiceFixture({ microphoneMode: "success", rewardAvailable });
  await page.evaluate(() => window.__voiceQa.setFullscreen(true));
  await page.evaluate(() => document.querySelector(".iam-realtime-voice__summon")?.click());
  await page.waitForFunction(() => {
    const card = document.querySelector("[data-voice-fullscreen-recovery]");
    return card && !card.hidden && card.dataset.activationId && card.querySelector("[data-voice-recovery-title]")?.textContent === "VOICE READY";
  });
  assert.equal(await page.locator("[data-voice-recovery-reward]").isHidden(), true, "No award may appear before confirmed fullscreen return");
  await page.evaluate(() => {
    const activationId = window.IAMPermissionRecovery.getState().active[0]?.activationId || "";
    const cardActivationId = document.querySelector("[data-voice-fullscreen-recovery]")?.dataset.activationId || "";
    if (activationId !== cardActivationId) throw new Error(`voice_recovery_card_mismatch:${cardActivationId}:${activationId}`);
    return window.IAMPermissionRecovery.returnToFullscreen(activationId);
  });
  await page.waitForTimeout(700);
  const recoverySnapshot = await page.evaluate(() => ({
    title: document.querySelector("[data-voice-recovery-title]")?.textContent || "",
    reward: document.querySelector("[data-voice-recovery-reward]")?.textContent || "",
    fullscreen: window.__voiceQa.fullscreen,
    shared: window.IAMPermissionRecovery.getState(),
    voice: window.IAMRealtimeVoiceAssistant.getState(),
    qa: { ...window.__voiceQa },
  }));
  assert.equal(
    rewardAvailable ? recoverySnapshot.reward : /no reward recorded/.test(recoverySnapshot.reward),
    rewardAvailable ? "+100 HAPPINESS" : true,
    `Unexpected recovery result: ${JSON.stringify(recoverySnapshot)}`,
  );
  const first = await page.evaluate(() => ({ ...window.IAMRealtimeVoiceAssistant.getState(), qa: { ...window.__voiceQa } }));
  assert.equal(first.microphoneFullscreenRecoveryRestored, true);
  assert.equal(first.qa.rewardCalls, rewardAvailable ? 1 : 0);
  assert.equal(first.happinessRecoveryRecorded, rewardAvailable);

  await page.evaluate(() => {
    window.__voiceQa.setFullscreen(false);
    document.dispatchEvent(new Event("fullscreenchange"));
    window.__voiceQa.setFullscreen(true);
    document.dispatchEvent(new Event("fullscreenchange"));
  });
  assert.equal(await page.evaluate(() => window.__voiceQa.rewardCalls), rewardAvailable ? 1 : 0, "Ordinary fullscreen toggles must not award");

  if (rewardAvailable) {
    await page.evaluate(() => window.IAMRealtimeVoiceAssistant.end("done"));
    await page.waitForTimeout(1300);
    await page.evaluate(() => {
      window.__voiceQa.permissionState = "prompt";
      window.__voiceQa.setFullscreen(true);
    });
    await page.evaluate(() => document.querySelector(".iam-realtime-voice__summon")?.click());
    await page.waitForFunction(() => {
      const card = document.querySelector("[data-voice-fullscreen-recovery]");
      return card && !card.hidden && card.dataset.activationId && card.querySelector("[data-voice-recovery-title]")?.textContent === "VOICE READY";
    });
    await page.evaluate(() => {
      const activationId = window.IAMPermissionRecovery.getState().active[0]?.activationId || "";
      const cardActivationId = document.querySelector("[data-voice-fullscreen-recovery]")?.dataset.activationId || "";
      if (activationId !== cardActivationId) throw new Error(`voice_recovery_card_mismatch:${cardActivationId}:${activationId}`);
      return window.IAMPermissionRecovery.returnToFullscreen(activationId);
    });
    await page.waitForFunction(() => document.querySelector("[data-voice-recovery-title]")?.textContent === "WELCOME BACK");
    assert.equal(await page.evaluate(() => window.__voiceQa.rewardCalls), 1, "Recovery milestone replay must not call rewards twice");
  }

  const result = rewardAvailable
    ? { permission_interruption: true, fullscreen_confirmed: true, reward_recorded: true, award: 100, replay_calls: 0 }
    : { permission_interruption: true, fullscreen_confirmed: true, reward_recorded: false, truthful_failure: true };
  await page.context().close();
  return result;
}

async function runCareAndCircleChecks() {
  const page = await makeSurfaceFixture();
  await page.evaluate(() => window.__permissionQa.setFullscreen(true));
  await page.locator('[data-care-open="connect"]').click();
  await page.locator('[data-care-device="microphone"]').click();
  await page.waitForFunction(() => {
    const card = document.querySelector('.care-permission-recovery--connect');
    return card && !card.hidden && card.dataset.activationId && card.querySelector('[data-care-recovery-title]')?.textContent === "VOICE READY";
  });
  assert.equal(await page.locator('.care-permission-recovery--connect').evaluate((card) => card.nextElementSibling?.classList.contains("care-call__toolbar")), true);
  await page.locator('.care-permission-recovery--connect [data-care-recovery-return]').click();
  await page.waitForFunction(() => document.querySelector('.care-permission-recovery--connect [data-care-recovery-reward]')?.textContent === "+100 HAPPINESS");

  await page.evaluate(() => {
    window.__permissionQa.permission.camera = "prompt";
    window.__permissionQa.setFullscreen(true);
  });
  await page.locator('[data-care-device="camera"]').click();
  await page.waitForFunction(() => document.querySelector('.care-permission-recovery--connect [data-care-recovery-title]')?.textContent === "CAMERA READY");
  await page.locator('.care-permission-recovery--connect [data-care-recovery-return]').click();
  await page.waitForFunction(() => document.querySelector('.care-permission-recovery--connect [data-care-recovery-reward]')?.textContent === "+100 HAPPINESS");
  const connect = await page.evaluate(() => ({
    microphoneCalls: window.__permissionQa.microphoneCalls,
    cameraCalls: window.__permissionQa.cameraCalls,
    rewardCalls: window.__permissionQa.rewardCalls,
    consumed: window.IAMPermissionRecovery.getState().consumedDeviceMilestones,
  }));
  assert.equal(connect.microphoneCalls, 1);
  assert.equal(connect.cameraCalls, 1);
  assert.equal(connect.rewardCalls, 2);
  assert.ok(connect.consumed.microphone && connect.consumed.camera);

  await page.locator('[data-care-open="talk"]').click();
  await page.evaluate(() => {
    window.__permissionQa.permission.microphone = "prompt";
    window.__permissionQa.setFullscreen(true);
  });
  await page.locator('[data-care-talk-device="microphone"]').click();
  await page.waitForFunction(() => {
    const card = document.querySelector('.care-permission-recovery--talk');
    return card && !card.hidden && card.dataset.activationId && card.querySelector('[data-care-recovery-title]')?.textContent === "VOICE READY";
  });
  assert.equal(await page.locator('.care-permission-recovery--talk').evaluate((card) => card.nextElementSibling?.classList.contains("care-clinical-room__toolbar")), true);
  assert.doesNotMatch(await page.locator('.care-permission-recovery--talk [data-care-recovery-return]').innerText(), /\+100 HAPPINESS/);
  await page.locator('.care-permission-recovery--talk [data-care-recovery-return]').click();
  await page.waitForFunction(() => document.querySelector('.care-permission-recovery--talk [data-care-recovery-title]')?.textContent === "WELCOME BACK");
  assert.equal(await page.evaluate(() => window.__permissionQa.rewardCalls), 2, "Care Talk must not replay the global microphone reward");

  await page.evaluate(() => window.IAMCircleRooms.open());
  const micCallsBeforeJoin = await page.evaluate(() => window.__permissionQa.microphoneCalls);
  await page.locator('[data-circle-id="img"]').click();
  await page.waitForFunction(() => window.IAMCircleRooms.getState().joined === true);
  const joined = await page.evaluate(() => ({
    state: window.IAMCircleRooms.getState(),
    microphoneCalls: window.__permissionQa.microphoneCalls,
  }));
  assert.equal(joined.state.muted, true);
  assert.equal(joined.microphoneCalls, micCallsBeforeJoin, "Circle join must not request a microphone");
  await page.evaluate(() => {
    window.__permissionQa.permission.microphone = "prompt";
    window.__permissionQa.setFullscreen(true);
    return window.IAMCircleRooms.toggleMute();
  });
  await page.waitForFunction(() => {
    const card = document.querySelector('.circle-permission-recovery');
    return card && !card.hidden && card.dataset.activationId && card.querySelector('[data-circle-recovery-title]')?.textContent === "VOICE READY";
  });
  assert.equal(await page.locator('.circle-permission-recovery').evaluate((card) => card.parentElement?.matches('[data-audio-wallet-controls]')), true);
  assert.doesNotMatch(await page.locator('.circle-permission-recovery [data-circle-recovery-return]').innerText(), /\+100 HAPPINESS/);
  await page.locator('.circle-permission-recovery [data-circle-recovery-return]').evaluate((button) => button.click());
  await page.waitForFunction(() => document.querySelector('.circle-permission-recovery [data-circle-recovery-title]')?.textContent === "WELCOME BACK");
  assert.equal(await page.evaluate(() => window.__permissionQa.rewardCalls), 2, "Circle must not replay the global microphone reward");

  const result = {
    careConnect: {
      microphone_prompt_recovery: true,
      camera_prompt_recovery: true,
      in_flow_above_toolbar: true,
      reward_calls: 2,
    },
    careTalk: {
      microphone_prompt_recovery: true,
      in_flow_above_toolbar: true,
      cross_surface_reward_replay: false,
    },
    circle: {
      joins_muted: true,
      join_microphone_calls: 0,
      first_unmute_microphone_calls: 1,
      card_above_wallet_strip: true,
      cross_surface_reward_replay: false,
    },
  };
  await page.context().close();
  return result;
}

async function runCombinedRecoveryCheck() {
  const page = await makeCoordinatorFixture({ rewardMode: "recorded" });
  const result = await page.evaluate(async () => {
    const qa = window.__permissionQa;
    qa.permission.camera = "prompt";
    qa.permission.microphone = "prompt";
    qa.setFullscreen(true);
    const activation = await window.IAMPermissionRecovery.beginActivation({
      surface: "care-connect-combined-fixture",
      devices: ["camera", "microphone"],
      presenter: qa.presenter,
      fullscreenTarget: document.querySelector(".site-shell"),
    });
    qa.permission.camera = "granted";
    qa.permission.microphone = "granted";
    qa.setFullscreen(false);
    const completion = await window.IAMPermissionRecovery.completeActivation(activation);
    await window.IAMPermissionRecovery.returnToFullscreen(activation.activationId);
    await completion.restored;
    await new Promise((resolve) => setTimeout(resolve, 30));
    return {
      eligible: completion.eligible,
      states: [...qa.presenterStates],
      rewardCalls: qa.rewardCalls,
      rewardPayloads: qa.rewardPayloads,
      consumed: window.IAMPermissionRecovery.getState().consumedDeviceMilestones,
    };
  });
  assert.equal(result.eligible, true);
  assert.equal(result.states.some((entry) => entry.title === "CAMERA + VOICE READY"), true);
  assert.equal(result.rewardCalls, 1);
  assert.deepEqual(result.rewardPayloads[0].device_classes, ["camera", "microphone"]);
  assert.ok(result.consumed.camera && result.consumed.microphone);
  await page.context().close();
  return { title: "CAMERA + VOICE READY", reward_calls: 1, camera_consumed: true, microphone_consumed: true };
}

async function runRecoveryGuardrailChecks() {
  const page = await makeCoordinatorFixture({ rewardMode: "recorded" });
  const result = await page.evaluate(async () => {
    const qa = window.__permissionQa;
    async function exercise({ before, after, fullscreenAfter }) {
      qa.permission.microphone = before;
      qa.setFullscreen(true);
      const activation = await window.IAMPermissionRecovery.beginActivation({
        surface: `guardrail-${before}-${after}-${fullscreenAfter}`,
        devices: ["microphone"],
        presenter: qa.presenter,
        fullscreenTarget: document.querySelector(".site-shell"),
      });
      qa.permission.microphone = after;
      qa.setFullscreen(fullscreenAfter);
      return window.IAMPermissionRecovery.completeActivation(activation);
    }
    const preGranted = await exercise({ before: "granted", after: "granted", fullscreenAfter: false });
    const denied = await exercise({ before: "prompt", after: "denied", fullscreenAfter: false });
    const noLoss = await exercise({ before: "prompt", after: "granted", fullscreenAfter: true });
    return {
      preGranted: preGranted.eligible,
      denied: denied.eligible,
      noLoss: noLoss.eligible,
      readyStates: qa.presenterStates.filter((entry) => entry.state === "ready").length,
      rewardCalls: qa.rewardCalls,
    };
  });
  assert.deepEqual(result, { preGranted: false, denied: false, noLoss: false, readyStates: 0, rewardCalls: 0 });
  await page.context().close();
  return { pre_granted: false, denied: false, no_fullscreen_loss: false, recovery_cards: 0, reward_calls: 0 };
}

async function makeCoordinatorFixture({ rewardMode }) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, permissions: [], serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/privacy-first.html`, { waitUntil: "domcontentloaded" });
  await page.setContent('<main class="site-shell"><section data-television-room></section></main>');
  await installPermissionHarness(page, { rewardMode });
  await page.addScriptTag({ path: voiceSourcePath });
  await page.waitForFunction(() => Boolean(window.IAMPermissionRecovery));
  return page;
}

async function makeSurfaceFixture() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions: [], serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/privacy-first.html`, { waitUntil: "domcontentloaded" });
  await page.setContent(`
    <main class="site-shell">
      <section data-television-room></section>
      <button type="button" data-care-open="connect">Open Connect</button>
      <button type="button" data-care-open="talk">Open Talk</button>
      <div data-audio-wallet-controls aria-hidden="false">
        <button type="button" data-audio-wallet-mic>Mic</button>
        <canvas data-audio-wallet-waveform width="64" height="64"></canvas>
      </div>
      <section data-circle-room-selector aria-hidden="true">
        <button type="button" data-circle-id="img"><span data-circle-action></span>IMG</button>
        <button type="button" data-circle-selector-close>Close</button>
        <span data-circle-selected-name></span>
        <span data-circle-selected-description></span>
        <span data-circle-selected-status></span>
        <span data-circle-selector-status></span>
      </section>
      <section data-care-experience aria-hidden="true" hidden>
        <button type="button" data-care-close>Close Care</button>
        <div class="care-experience__backdrop"></div>
        <div class="care-experience__worlds">
          <section class="care-call">
            <div data-care-camera-preview="connect"></div>
            <div class="care-call__toolbar">
              <button type="button" data-care-device="microphone" aria-pressed="false">Mic</button>
              <button type="button" data-care-connect-action aria-pressed="false">Connect</button>
              <button type="button" data-care-device="camera" aria-pressed="false">Camera</button>
            </div>
            <p data-care-status="connect">Ready</p>
            <span data-care-call-time>00:00</span>
          </section>
          <section class="care-clinical-room">
            <div data-care-camera-preview="talk"></div>
            <div class="care-clinical-room__toolbar">
              <button type="button" data-care-talk-device="microphone" aria-pressed="false">Mic</button>
              <button type="button" data-care-talk-action aria-pressed="false">Talk</button>
              <button type="button" data-care-talk-device="camera" aria-pressed="false">Camera</button>
            </div>
            <p data-care-status="talk">Ready</p>
          </section>
        </div>
      </section>
    </main>
  `);
  await installPermissionHarness(page, { rewardMode: "recorded", withAgora: true });
  await page.addStyleTag({ content: `${voiceCss}\n${careCss}\n${circleCss}` });
  await page.addScriptTag({ path: voiceSourcePath });
  await page.addScriptTag({ path: careSourcePath });
  await page.addScriptTag({ path: circleSourcePath });
  await page.waitForFunction(() => Boolean(window.IAMPermissionRecovery && window.IAMCircleRooms));
  return page;
}

async function installPermissionHarness(page, { rewardMode, withAgora = false }) {
  await page.evaluate(({ rewardMode, withAgora }) => {
    const qa = {
      fullscreen: false,
      permission: { microphone: "prompt", camera: "prompt" },
      microphoneCalls: 0,
      cameraCalls: 0,
      rewardCalls: 0,
      rewardPayloads: [],
      presenterStates: [],
      setFullscreen(value) {
        this.fullscreen = Boolean(value);
        document.dispatchEvent(new Event("fullscreenchange"));
      },
    };
    window.__permissionQa = qa;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => qa.fullscreen ? document.querySelector(".site-shell") : null,
    });
    Object.defineProperty(document, "webkitFullscreenElement", { configurable: true, get: () => null });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      writable: true,
      value: async function requestFullscreen() { qa.setFullscreen(true); },
    });
    navigator.permissions.query = async ({ name }) => ({ state: qa.permission[name] || "unknown", addEventListener() {} });
    class FakeDataChannel extends EventTarget {
      constructor() { super(); this.readyState = "open"; }
      send() {}
      close() { this.readyState = "closed"; }
    }
    window.RTCPeerConnection = class FakePeerConnection {
      createDataChannel() { return new FakeDataChannel(); }
      close() {}
    };
    window.IAMTelevisionAudio = { setVoiceConversationActive() {}, getState() { return {}; } };
    qa.presenter = {
      showReady(detail) { qa.presenterStates.push({ state: "ready", title: detail.title, activationId: detail.activationId }); },
      updateRewardEligibility(detail) { qa.presenterStates.push({ state: "reward-eligible", activationId: detail.activationId }); },
      showReturning(detail) { qa.presenterStates.push({ state: "returning", activationId: detail.activationId }); },
      showRetry(detail) { qa.presenterStates.push({ state: "retry", activationId: detail.activationId }); },
      showRestored(detail) { qa.presenterStates.push({ state: "restored", title: detail.title, activationId: detail.activationId }); },
      showReward(detail) { qa.presenterStates.push({ state: detail.state, text: detail.text, activationId: detail.activationId }); },
      focusReturn() {},
      hide() {},
    };
    if (rewardMode !== "unavailable") {
      window.IAMHappinessRewards = {
        async isMilestoneEligible() { return { eligible: true }; },
        async recordMilestone(payload) {
          qa.rewardCalls += 1;
          qa.rewardPayloads.push(structuredClone(payload));
          if (rewardMode === "rejected") return { recorded: false, error: "fixture_rejected" };
          return {
            recorded: true,
            status: "recorded",
            receipt_id: `fixture-${qa.rewardCalls}`,
            milestone_id: payload.milestone_id,
            amount: payload.amount,
            recorded_at: "2026-08-13T00:00:00.000Z",
          };
        },
      };
    }
    if (!withAgora) return;
    const fakeTrack = () => ({
      async setMuted() {},
      stop() {},
      close() {},
      play() {},
      getMediaStreamTrack() { return null; },
    });
    const client = {
      on() {},
      async join() {},
      async leave() {},
      async publish() {},
      async unpublish() {},
      async subscribe() {},
    };
    window.AgoraRTC = {
      createClient() { return client; },
      async createMicrophoneAudioTrack() {
        qa.microphoneCalls += 1;
        if (qa.permission.microphone === "denied") throw new DOMException("denied", "NotAllowedError");
        qa.permission.microphone = "granted";
        qa.setFullscreen(false);
        return fakeTrack();
      },
      async createCameraVideoTrack() {
        qa.cameraCalls += 1;
        if (qa.permission.camera === "denied") throw new DOMException("denied", "NotAllowedError");
        qa.permission.camera = "granted";
        qa.setFullscreen(false);
        return fakeTrack();
      },
    };
    window.IAM_CIRCLE_ROOM_ENDPOINT = "https://circle-fixture.invalid";
    window.fetch = async (url) => {
      const value = String(url);
      if (value.endsWith("/audio-rooms/join")) {
        return new Response(JSON.stringify({
          app_id: "fixture-app",
          channel: "fixture-channel",
          token: "fixture-token",
          uid: 1,
          circle_id: "img",
          reservation_id: "fixture-reservation",
          presence_url: "https://circle-fixture.invalid/presence",
          occupancy: 1,
          room_number: 1,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (value.endsWith("/audio-rooms")) {
        return new Response(JSON.stringify({ circles: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    window.WebSocket = class FakeWebSocket extends EventTarget {
      constructor() {
        super();
        queueMicrotask(() => this.dispatchEvent(new Event("open")));
      }
      close() { this.dispatchEvent(new Event("close")); }
    };
  }, { rewardMode, withAgora });
}

async function makeVoiceFixture({ microphoneMode, rewardAvailable }) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, permissions: [], serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/privacy-first.html`, { waitUntil: "domcontentloaded" });
  await page.setContent('<main class="site-shell"><section data-television-room></section></main>');
  await page.evaluate(({ microphoneMode, rewardAvailable }) => {
    const qa = {
      microphoneMode,
      permissionState: "prompt",
      fullscreen: false,
      micCalls: 0,
      permissionQueries: 0,
      rewardCalls: 0,
      rewardPayloads: [],
      fullscreenRequests: 0,
      setFullscreen(value) { this.fullscreen = Boolean(value); },
    };
    window.__voiceQa = qa;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => qa.fullscreen ? document.querySelector(".site-shell") : null,
    });
    Object.defineProperty(document, "webkitFullscreenElement", {
      configurable: true,
      get: () => null,
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      writable: true,
      value: async function requestFullscreen() {
        qa.fullscreenRequests += 1;
        qa.fullscreen = true;
        document.dispatchEvent(new Event("fullscreenchange"));
      },
    });
    navigator.permissions.query = async ({ name }) => {
      if (name !== "microphone") throw new Error("unsupported_permission");
      qa.permissionQueries += 1;
      return { state: qa.permissionState, addEventListener() {} };
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          qa.micCalls += 1;
          if (qa.microphoneMode === "deny") throw new DOMException("denied", "NotAllowedError");
          qa.permissionState = "granted";
          qa.fullscreen = false;
          document.dispatchEvent(new Event("fullscreenchange"));
          const track = { enabled: true, contentHint: "", stop() {} };
          return {
            getTracks: () => [track],
            getAudioTracks: () => [track],
          };
        },
      },
    });
    class FakeDataChannel extends EventTarget {
      constructor() { super(); this.readyState = "open"; }
      send() {}
      close() { this.readyState = "closed"; }
    }
    window.RTCPeerConnection = class FakePeerConnection {
      constructor() { this.connectionState = "connected"; }
      addTrack() {}
      addTransceiver() {}
      createDataChannel() { return new FakeDataChannel(); }
      async createOffer() { return { sdp: "v=0\r\n" }; }
      async setLocalDescription() {}
      async setRemoteDescription() {}
      close() { this.connectionState = "closed"; }
    };
    window.IAMTelevisionAudio = {
      setVoiceConversationActive() {},
      getState() { return { source: "video", title: "fixture" }; },
    };
    window.fetch = async (url) => {
      const value = String(url);
      if (value.includes("realtime-client-secret")) return new Response(JSON.stringify({ value: "fixture-token" }), { status: 200 });
      if (value.includes("api.openai.com/v1/realtime/calls")) return new Response("v=0\r\n", { status: 200 });
      throw new Error(`unexpected_fetch:${value}`);
    };
    if (rewardAvailable) {
      window.IAMHappinessRewards = {
        async isMilestoneEligible() { return { eligible: true }; },
        async recordMilestone(payload) {
          qa.rewardCalls += 1;
          qa.rewardPayloads.push(structuredClone(payload));
          return {
            recorded: true,
            status: "recorded",
            receipt_id: "fixture-receipt-1",
            milestone_id: payload.milestone_id,
            amount: payload.amount,
            recorded_at: "2026-08-13T00:00:00.000Z",
          };
        },
      };
    }
  }, { microphoneMode, rewardAvailable });
  await page.addStyleTag({ content: voiceCss });
  await page.addScriptTag({ path: voiceSourcePath });
  await page.waitForFunction(() => Boolean(window.IAMRealtimeVoiceAssistant));
  return page;
}

async function installSafeRouting(context) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() === "media") {
      telemetry.blockedMedia += 1;
      await route.abort("blockedbyclient");
      return;
    }
    if (url.hostname !== "127.0.0.1") {
      telemetry.blockedExternal += 1;
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
}

function sendJson(response, value, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve) => {
    let value = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => { value += chunk; });
    request.on("end", () => resolve(value));
  });
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return ({
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  })[extension] || "application/octet-stream";
}
