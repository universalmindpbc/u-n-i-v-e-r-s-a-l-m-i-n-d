import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_STORY_TREE_TARGET || "";
const screenshotDir = process.env.IAM_STORY_TREE_SCREENSHOT_DIR || "";
const realtimeMode = process.env.IAM_STORY_TREE_REALTIME === "1";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

let server = null;
let target = requestedTarget;
if (realtimeMode && !target) throw new Error("IAM_STORY_TREE_TARGET is required for the live Realtime proof.");
if (!target) {
  server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
      const relative = pathname.replace(/^\/vogue\/iam\/?/, "") || "index.html";
      const requestedPath = path.resolve(iam, relative);
      if (!requestedPath.startsWith(`${iam}${path.sep}`) && requestedPath !== iam) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const fileBytes = await fs.readFile(requestedPath);
      response.writeHead(200, { "content-type": contentTypes.get(path.extname(requestedPath).toLowerCase()) || "application/octet-stream" });
      response.end(fileBytes);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  target = `http://127.0.0.1:${server.address().port}/vogue/iam/index.html`;
}

const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});

async function runRealtimeSession(kind) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const network = { token: [], sdp: [] };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  page.on("response", (response) => {
    const url = response.url();
    if (/\/realtime-client-secret(?:\?|$)/.test(url)) network.token.push(response.status());
    if (url === "https://api.openai.com/v1/realtime/calls") network.sdp.push(response.status());
  });
  await page.addInitScript(() => {
    window.__IAM_STORY_TREE_TEST__ = true;
    window.__storyTreeMicrophoneRequests = 0;
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => {
        window.__storyTreeMicrophoneRequests += 1;
        throw new Error("The microphone-free Story Tree proof must not request a microphone.");
      };
    }
  });
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMStoryTree && window.IAMRealtimeVoiceAssistant), null, { timeout: 60000 });
  await page.evaluate(() => {
    document.body.classList.add("television-room-open");
    document.querySelector("[data-television-room]")?.setAttribute("aria-hidden", "false");
  });
  {
    if (kind === "ordinary") {
      await page.evaluate(() => window.IAMRealtimeVoiceAssistant.start({ microphone: false }));
      await page.waitForFunction(() => {
        const state = window.IAMRealtimeVoiceAssistant.getState();
        return state.active && state.transcript.length > 0;
      }, null, { timeout: 45000 });
    } else {
      await page.evaluate(() => window.IAMStoryTree.start({ microphone: false }));
      await page.waitForFunction(() => {
        const voice = window.IAMRealtimeVoiceAssistant.getState();
        const story = window.IAMStoryTree.getState();
        return voice.active
          && voice.storyTreeBasePromptCaptured
          && voice.storyTreeBasePromptPreserved
          && voice.storyTreeToolsMerged
          && voice.storyTreeSessionUpdatesSent === 1
          && voice.storyTreeFunctionCallsHandled >= 1
          && story.stage === "CHALLENGE"
          && voice.transcript.length > 0;
      }, null, { timeout: 60000 });
      await page.click("[data-voice-captions]");
      await page.waitForFunction(() => {
        const transcript = document.querySelector(".iam-realtime-voice__transcript");
        return window.IAMRealtimeVoiceAssistant.getState().captionsVisible
          && transcript
          && getComputedStyle(transcript).display !== "none"
          && transcript.textContent.trim().length > 0;
      }, null, { timeout: 10000 });
    }
  }
  const proof = await page.evaluate((sessionKind) => {
    const voice = window.IAMRealtimeVoiceAssistant.getState();
    const story = window.IAMStoryTree.getState();
    const transcript = document.querySelector(".iam-realtime-voice__transcript");
    return {
      kind: sessionKind,
      active: voice.active,
      experience: voice.experience,
      transcriptPresent: voice.transcript.length > 0,
      captionsVisible: voice.captionsVisible,
      captionRendered: Boolean(transcript && getComputedStyle(transcript).display !== "none" && transcript.textContent.trim()),
      basePromptCaptured: voice.storyTreeBasePromptCaptured,
      basePromptPreserved: voice.storyTreeBasePromptPreserved,
      toolsMerged: voice.storyTreeToolsMerged,
      sessionUpdatesSent: voice.storyTreeSessionUpdatesSent,
      functionCallsHandled: voice.storyTreeFunctionCallsHandled,
      storyStage: story.stage,
      storyTreeVisualCount: document.querySelectorAll(".iam-story-tree, .iam-story-tree__geometry, [data-story-tree-ripple]").length,
      microphoneRequests: window.__storyTreeMicrophoneRequests,
      microphoneTrackEnabled: voice.microphoneTrackEnabled,
    };
  }, kind);
  if (kind === "ordinary") {
    assert.equal(proof.experience, "");
    assert.equal(proof.sessionUpdatesSent, 0);
    assert.equal(proof.functionCallsHandled, 0);
    assert.equal(proof.transcriptPresent, true);
  } else {
    assert.equal(proof.experience, "story_tree");
    assert.equal(proof.basePromptCaptured, true);
    assert.equal(proof.basePromptPreserved, true);
    assert.equal(proof.toolsMerged, true);
    assert.equal(proof.sessionUpdatesSent, 1);
    assert.ok(proof.functionCallsHandled >= 1);
    assert.equal(proof.storyStage, "CHALLENGE");
    assert.equal(proof.captionsVisible, true);
    assert.equal(proof.captionRendered, true);
    assert.equal(proof.storyTreeVisualCount, 0);
  }
  assert.equal(proof.microphoneRequests, 0);
  assert.equal(proof.microphoneTrackEnabled, false);
  assert.ok(network.token.some((status) => status >= 200 && status < 300), `${kind} token endpoint did not succeed`);
  assert.ok(network.sdp.some((status) => status >= 200 && status < 300), `${kind} Realtime SDP call did not succeed`);
  if (kind === "story_tree") await page.evaluate(() => window.IAMStoryTree.end());
  else await page.evaluate(() => window.IAMRealtimeVoiceAssistant.end("", { quiet: true }));
  await page.waitForFunction(() => !window.IAMRealtimeVoiceAssistant.getState().active, null, { timeout: 10000 });
  const cleanup = await page.evaluate(() => ({
    active: window.IAMRealtimeVoiceAssistant.getState().active,
    storyActive: window.IAMStoryTree.getState().active,
    remoteAudioPaused: document.querySelector(".iam-realtime-voice audio")?.paused !== false,
  }));
  assert.deepEqual(cleanup, { active: false, storyActive: false, remoteAudioPaused: true });
  assert.deepEqual(errors, []);
  await page.close();
  return { proof, network, cleanup, errors };
}

async function runJourney(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  const microphoneRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.__IAM_STORY_TREE_TEST__ = true;
    const originalSetItem = Storage.prototype.setItem;
    window.__storyTreeStorageWrites = [];
    Storage.prototype.setItem = function (key, value) {
      window.__storyTreeStorageWrites.push(String(key));
      return originalSetItem.call(this, key, value);
    };
  });
  await page.route("https://iam-playback-telemetry.universalmind.workers.dev/**", (route) => route.fulfill({ status: 204, body: "" }));
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMStoryTree && window.IAMTelevisionRoom), null, { timeout: 60000 });

  await page.evaluate(() => {
    const state = {
      active: false,
      starting: false,
      options: null,
      microphone: [],
      responses: [],
      audio: [],
      ended: false,
    };
    window.__storyTreeQa = state;
    window.IAMRealtimeVoiceAssistant = {
      getState: () => ({ active: state.active, starting: state.starting }),
      async start(options) {
        state.starting = true;
        state.options = options;
        state.starting = false;
        state.active = true;
        return true;
      },
      setMicrophonePaused(paused, options) {
        state.microphone.push({ paused: Boolean(paused), label: options?.label || "" });
        return true;
      },
      requestResponse(options) {
        state.responses.push(options?.instructions || "");
        return true;
      },
      end() {
        state.active = false;
        state.ended = true;
        state.options?.onEnd?.({ reason: "test" });
      },
    };
    window.IAMTelevisionAudio = {
      setStoryTreeConversationMix(options) {
        state.audio.push({ ...options });
        return true;
      },
      cancelStoryTreeConversationMix() {
        state.audio.push({ cancelled: true });
        return true;
      },
    };
    window.__storyTreeStorageWrites.length = 0;
    document.body.classList.add("television-room-open", "television-wallet-pointer-locked");
    const room = document.querySelector("[data-television-room]");
    room?.setAttribute("aria-hidden", "false");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.classList.add("is-reaction-wallet-open", "is-video-tooltip-armed");
    wallet.dataset.walletView = "categories";
  });

  const click = (selector) => page.$eval(selector, (element) => element.click());
  await click('[data-wallet-category="video"]');
  await click('[data-video-mode="emdr"]');
  await click('[data-emdr-preset="m8"]');
  await page.waitForFunction(() => document.body.classList.contains("television-emdr-gif-active") && window.IAMEMDRGif?.active === true);
  await page.focus("[data-story-tree-start]");
  const tooltip = await page.$eval("[data-story-tree-start]", (button) => ({
    label: button.textContent.trim(),
    tooltip: button.dataset.emdrTooltip,
    pseudo: getComputedStyle(button, "::after").content,
    visible: Boolean(button.getClientRects().length),
  }));
  assert.deepEqual(tooltip.label, "STORYTREE");
  assert.equal(tooltip.tooltip, "Have a conversation with Universal One and reflect on today's challenges.");
  assert.match(tooltip.pseudo, /Have a conversation with Universal One/);
  assert.equal(tooltip.visible, true);

  await click("[data-story-tree-start]");
  await page.waitForFunction(() => window.IAMStoryTree.getState().active === true);
  const started = await page.evaluate(() => ({
    state: window.IAMStoryTree.getState(),
    experience: window.__storyTreeQa.options?.experience,
    microphone: window.__storyTreeQa.options?.microphone,
    toolNames: window.__storyTreeQa.options?.tools?.map((tool) => tool.name),
    strictSchema: window.__storyTreeQa.options?.tools?.[0]?.parameters?.additionalProperties,
    storyTreeVisualCount: document.querySelectorAll(".iam-story-tree, .iam-story-tree__geometry, [data-story-tree-ripple]").length,
    emdrGifActive: document.body.classList.contains("television-emdr-gif-active") && window.IAMEMDRGif?.active === true,
    walletView: document.querySelector("[data-reaction-wallet]")?.dataset.walletView,
    u1LowerRight: (() => {
      const element = document.querySelector(".iam-realtime-voice");
      const style = element ? getComputedStyle(element) : null;
      return Boolean(element && style?.position === "absolute" && style?.right !== "auto" && style?.bottom !== "auto");
    })(),
  }));
  assert.equal(started.experience, "story_tree");
  assert.equal(started.microphone, true);
  assert.deepEqual(started.toolNames, ["story_tree_progress"]);
  assert.equal(started.strictSchema, false);
  assert.equal(started.storyTreeVisualCount, 0);
  assert.equal(started.emdrGifActive, true);
  assert.equal(started.walletView, "closed");
  assert.equal(started.u1LowerRight, true);
  assert.equal(started.state.persistedResponseData, false);

  const stages = [
    "CHALLENGE",
    "CAUSE I",
    "CAUSE II",
    "CAUSE III",
    "NERVOUS SYSTEM RESET",
  ];
  for (const stage of stages) {
    const result = await page.evaluate((nextStage) => window.__storyTreeQa.options.onFunctionCall({
      name: "story_tree_progress",
      arguments: JSON.stringify({ stage: nextStage }),
    }), stage);
    assert.equal(result.accepted, true, `${stage} was rejected`);
  }
  const rejectedRawText = await page.evaluate(() => window.__storyTreeQa.options.onFunctionCall({
    name: "story_tree_progress",
    arguments: JSON.stringify({ stage: "SOLUTION I", challenge: "private words" }),
  }));
  assert.equal(rejectedRawText.accepted, false);

  await page.evaluate(() => window.IAMStoryTree.test.beginReset(0));
  await page.waitForFunction(() => window.__storyTreeQa.responses.length === 1);
  const reset = await page.evaluate(() => ({
    state: window.IAMStoryTree.getState(),
    microphone: window.__storyTreeQa.microphone,
    audio: window.__storyTreeQa.audio,
    responses: window.__storyTreeQa.responses,
  }));
  assert.deepEqual(reset.microphone, [
    { paused: true, label: "Nervous System Reset" },
    { paused: false, label: "I'm listening" },
  ]);
  assert.deepEqual(reset.audio.slice(0, 2), [
    { ducked: false, delayMs: 1500, durationMs: 7000 },
    { ducked: true, delayMs: 0, durationMs: 5500 },
  ]);
  assert.match(reset.responses[0], /SOLUTION I/);

  for (const stage of ["SOLUTION I", "SOLUTION II", "SOLUTION III", "BEAUTIFUL NEW WORLD"]) {
    const result = await page.evaluate((nextStage) => window.__storyTreeQa.options.onFunctionCall({
      name: "story_tree_progress",
      arguments: JSON.stringify({ stage: nextStage }),
    }), stage);
    assert.equal(result.accepted, true, `${stage} was rejected`);
  }

  const completed = await page.evaluate(() => {
    const room = document.querySelector("[data-television-room]")?.getBoundingClientRect();
    return {
      state: window.IAMStoryTree.getState(),
      bodyStage: document.body.dataset.storyTreeStage,
      bodyPhase: document.body.dataset.storyTreePhase,
      storyTreeVisualCount: document.querySelectorAll(".iam-story-tree, .iam-story-tree__geometry, [data-story-tree-ripple]").length,
      emdrGifActive: document.body.classList.contains("television-emdr-gif-active") && window.IAMEMDRGif?.active === true,
      roomWidth: room?.width || 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      storageWrites: [...window.__storyTreeStorageWrites],
    };
  });
  assert.equal(completed.state.stage, "BEAUTIFUL NEW WORLD");
  assert.equal(completed.bodyStage, "BEAUTIFUL NEW WORLD");
  assert.equal(completed.bodyPhase, "complete");
  assert.equal(completed.storyTreeVisualCount, 0);
  assert.equal(completed.emdrGifActive, true);
  assert.equal(completed.horizontalOverflow, false);
  assert.equal(completed.storageWrites.some((key) => /story|challenge|cause|solution/i.test(key)), false);
  let screenshot = "";
  if (screenshotDir) {
    await fs.mkdir(screenshotDir, { recursive: true });
    await page.waitForTimeout(1100);
    screenshot = path.join(screenshotDir, `story-tree-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
  }

  await page.evaluate(() => window.IAMStoryTree.end());
  const teardown = await page.evaluate(() => ({
    active: window.IAMStoryTree.getState().active,
    stage: window.IAMStoryTree.getState().stage,
    bodyActive: document.body.dataset.storyTreeActive,
    cancelled: window.__storyTreeQa.audio.at(-1)?.cancelled === true,
    ended: window.__storyTreeQa.ended,
  }));
  assert.equal(teardown.active, false);
  assert.equal(teardown.stage, "");
  assert.equal(teardown.bodyActive, undefined);
  assert.equal(teardown.cancelled, true);
  assert.equal(teardown.ended, true);
  assert.deepEqual(errors, []);
  await page.close();
  return { viewport, tooltip, started, reset, completed, teardown, errors, microphoneRequests, screenshot };
}

try {
  if (realtimeMode) {
    const ordinary = await runRealtimeSession("ordinary");
    const storyTree = await runRealtimeSession("story_tree");
    console.log(JSON.stringify({ target, mutedProcess: true, microphoneFree: true, ordinary, storyTree }, null, 2));
  } else {
    const desktop = await runJourney({ width: 1440, height: 900 });
    const mobile = await runJourney({ width: 390, height: 844 });
    console.log(JSON.stringify({ target, mutedProcess: true, desktop, mobile }, null, 2));
  }
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
