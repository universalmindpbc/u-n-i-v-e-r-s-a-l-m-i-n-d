import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const base = "https://staging.universalmind.tv/vogue/iam/";
const out = process.env.MANTRA_QA_DIR || "/private/tmp/um-mantra-qa";
await fs.mkdir(out, { recursive: true });
const server = await chromium.launchServer({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true, args: ["--mute-audio"] });
assert.ok(server.process().spawnargs.includes("--mute-audio"));
const browser = await chromium.connect(server.wsEndpoint());
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const report = { mutedProcess: true, checks: [] };
page.on("pageerror", error => errors.push(error.message));
await context.addInitScript(() => {
  localStorage.setItem("iamSubaudibleMantra", "off");
  Element.prototype.requestFullscreen = () => Promise.reject(new Error("QA disables native fullscreen"));
  Element.prototype.webkitRequestFullscreen = Element.prototype.requestFullscreen;
  HTMLVideoElement.prototype.webkitEnterFullscreen = Element.prototype.requestFullscreen;
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error("QA disables microphone"));
});
if (process.env.MANTRA_QA_LOCAL === "1") {
  const files = ["index.html", "adaptive-environment-television.css", "adaptive-sound/mantra-v1.js", "adaptive-sound/mantra-policy-v1.js", "adaptive-sound/panel-v1.css", "mantra-sampler.css", "quantum-tree-control.html", "quantum-tree-control.js", "quantum-tree-control.css"];
  await context.route("https://staging.universalmind.tv/vogue/iam/**", async route => {
    const file = decodeURIComponent(new URL(route.request().url()).pathname).replace("/vogue/iam/", "");
    if (!files.includes(file)) return route.continue();
    await route.fulfill({ status: 200, body: await fs.readFile(path.join(root, "i  a m", file)),
      contentType: file.endsWith(".html") ? "text/html" : file.endsWith(".css") ? "text/css" : "application/javascript" });
  });
}
const diag = () => page.evaluate(() => window.IAMSubaudibleMantra.diagnostics());
async function zero(label) {
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain === 0, null, { timeout: 3000 });
  report.checks.push({ label, ...(await diag()) });
}
try {
  await page.goto(base + "index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.IAMSubaudibleMantra && window.IAMTelevisionRoom && window.IAMAdaptiveSound);
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().platformEnabled);
  assert.equal(await page.locator("body").getAttribute("data-adaptive-selection-source"), "no_checkin_random");
  await page.locator("[data-television-play]").click();
  await page.waitForFunction(() => document.body.classList.contains("television-room-open") && !document.body.classList.contains("television-wallet-settling") && !document.body.classList.contains("television-wallet-pointer-locked"));
  await page.mouse.move(700, 450);
  await page.locator("[data-reaction-wallet]").hover();
  if (await page.locator("[data-reaction-wallet]").getAttribute("data-wallet-view") !== "video") await page.locator('[data-wallet-category="video"]').click();
  await page.locator(".adaptive-television-local-video").evaluate(video => window.IAMStreamController.play(video).catch(() => {}));
  await page.waitForFunction(() => document.querySelector(".adaptive-television-local-video")?.currentTime > 0.2, null, { timeout: 45000 });
  await page.locator("[data-video-sound-open]").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out + "/desktop.png" });
  assert.equal(await page.locator(".iam-sound-mantra").count(), 0);
  assert.equal((await diag()).enabled, true);
  report.checks.push({label: "Public Sound card removed; old standalone off preference ignored"});
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0, null, { timeout: 30000 });
  report.realProgramme = await diag();
  console.log("Real programme output measured");
  assert.ok(report.realProgramme.duration > 334 && report.realProgramme.duration < 335);
  await page.locator("[data-adaptive-sound-master]").click();
  await zero("Sound master stops the mantra");
  await page.locator("[data-adaptive-sound-master]").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out + "/mobile.png" });
  assert.equal(await page.locator(".iam-sound-mantra").count(), 0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: out + "/landscape.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#iam-sound-panel").getAttribute("aria-hidden") === "true");
  await page.mouse.move(700, 450);
  await page.locator("[data-reaction-wallet]").hover();
  if (await page.locator("[data-reaction-wallet]").getAttribute("data-wallet-view") !== "video") await page.locator('[data-wallet-category="video"]').click();
  for (const [selector, label] of [["[data-video-mode=emdr]", "EMDR"], ["[data-video-sound-open]", "Sound"], ["[data-video-mantra-open]", "Mantra"]]) {
    assert.equal(await page.locator(selector).getAttribute("data-video-tooltip"), `Open the ${label} research layer.`);
    assert.notEqual(await page.locator(selector).evaluate(element => getComputedStyle(element, "::after").display), "none");
  }
  await page.locator("[data-video-mantra-open]").click();
  await page.locator("[data-mantra-signal]").waitFor({state: "visible"});
  const button = page.locator("[data-subaudible-mantra-toggle]");
  assert.equal(await page.locator(".mantra-signal p").textContent(), "Our silent mantra is a research feature, delivering a 5min meditation from various traditions, played quietly beneath the music.");
  console.log("Mantra viewer reached through TV wallet");
  // Controlled programme fixtures exercise the actual audio, filter tap and
  // gain route. Only programme selection is replaced; no RMS/gain is invented.
  await page.evaluate(async () => {
    document.querySelectorAll("audio,video").forEach(media => media.pause());
    const audio = document.createElement("audio");
    audio.loop = true;
    document.body.append(audio);
    window.__mantraFixture = audio;
    window.__mantraOriginalProgrammeState = window.IAMQuantumTree.getMantraProgrammeState;
    window.IAMQuantumTree.getMantraProgrammeState = () => ({
      media: audio, source: "qa-fixture", enabled: window.IAMQuantumTree.diagnostics().enabled,
      quantumGain: 0.055, outputMultiplier: 1,
      measurement: window.IAMEMDR.getProgrammeMaskingLevel(audio),
    });
    window.__mantraFixtureSource = async (hz, amplitude) => {
      audio.pause();
      const frames = 48000 * 4;
      const buffer = new ArrayBuffer(44 + frames * 2);
      const view = new DataView(buffer);
      const text = (offset, s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
      text(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); text(8, "WAVEfmt ");
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
      view.setUint32(24, 48000, true); view.setUint32(28, 96000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
      text(36, "data"); view.setUint32(40, frames * 2, true);
      for (let i = 0; i < frames; i++) view.setInt16(44 + i * 2, Math.sin(i * 2 * Math.PI * hz / 48000) * amplitude * 32767, true);
      if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
      audio.src = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
      window.IAMEMDR.setAudioSource(audio);
      await audio.play();
    };
    await window.__mantraFixtureSource(1000, 0.4);
  });
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0, null, { timeout: 10000 });
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().outputVerified);
  await page.waitForFunction(() => document.querySelector("[data-mantra-signal]").dataset.state === "active");
  report.checks.push({ label: "Measured strong speech-band fixture opens with real post-gain output and live indicator", ...(await diag()) });
  console.log("Measured fixture drives live indicator");
  await page.screenshot({path: out + "/mantra-desktop.png"});
  await page.setViewportSize({width: 390, height: 844});
  await page.waitForTimeout(1000);
  await page.locator("[data-mantra-signal]").scrollIntoViewIfNeeded();
  await page.screenshot({path: out + "/mantra-mobile.png"});
  const indicatorBox=await page.locator("[data-mantra-signal]").boundingBox();
  for (const box of await page.locator(".mantra-orbit__node").evaluateAll(nodes => nodes.map(node => ({x:node.getBoundingClientRect().x, right:node.getBoundingClientRect().right})))) assert.ok(box.x >= 0 && box.right <= 390, "Mobile sample pads stay within the viewer");
  assert.ok(indicatorBox.x >= 0 && indicatorBox.x + indicatorBox.width <= 390 && indicatorBox.height <= 180);
  await page.setViewportSize({width: 1440, height: 1000});
  const waveBefore = await page.locator("[data-mantra-signal-wave]").evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(200);
  assert.notEqual(await page.locator("[data-mantra-signal-wave]").evaluate(canvas => canvas.toDataURL()), waveBefore, "Waveform changes with the measured signal");
  await button.click();
  await zero("Mantra viewer off immediately silences");
  assert.equal(await button.getAttribute("aria-pressed"), "false");
  assert.equal(await page.evaluate(() => localStorage.getItem("iamSubaudibleMantraV2")), "off");
  await button.click();
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().outputVerified);
  for (const [label, frequency, amplitude] of [["Quiet programme closes", 1000, 0.001], ["Silence closes", 1000, 0], ["Bass alone does not mask speech", 45, 0.8]]) {
    await page.evaluate(([hz, amp]) => window.__mantraFixtureSource(hz, amp), [frequency, amplitude]);
    await page.waitForTimeout(750);
    await zero(label);
    const state=await diag();
    assert.equal(state.programmePlaying, true, "Music playback stays distinct from masking");
    assert.equal(state.status, "quiet_mask");
    assert.equal(state.outputVerified, false);
    assert.equal(await page.locator("[data-mantra-signal]").getAttribute("data-state"), "closed");
  }
  // A short dip closes gain but must not pause/restart the mantra file.
  await page.evaluate(() => window.__mantraFixtureSource(1000, 0.4));
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().outputVerified);
  const dip=await page.evaluate(async () => {
    const media=window.__mantraFixture;
    const before=window.IAMSubaudibleMantra.diagnostics().currentTime;
    media.volume=0.001;
    await new Promise(resolve => setTimeout(resolve, 140));
    const quiet=window.IAMSubaudibleMantra.diagnostics();
    media.volume=1;
    await new Promise(resolve => setTimeout(resolve, 700));
    return {before, quiet, resumed:window.IAMSubaudibleMantra.diagnostics()};
  });
  assert.equal(dip.quiet.currentGain, 0);
  assert.equal(dip.quiet.playing, true);
  assert.ok(dip.quiet.currentTime > dip.before);
  assert.ok(dip.resumed.outputVerified);
  report.checks.push({label: "Quiet-to-loud transition closes then restores measured output", ...dip});
  await page.evaluate(() => window.__mantraFixtureSource(1000, 0.4));
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0);
  await page.evaluate(() => window.__mantraFixture.pause());
  await zero("Programme pause closes");
  await page.evaluate(() => window.__mantraFixture.play());
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0);
  await page.evaluate(() => { window.__mantraFixture.muted = true; });
  await zero("Programme mute closes");
  await page.evaluate(() => { window.__mantraFixture.muted = false; });
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0);
  await page.evaluate(() => { window.__mantraFixture.dispatchEvent(new Event("waiting")); });
  await zero("Buffering event immediately closes");
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0);
  const leaseGain = await page.evaluate(() => {
    const end = performance.now() + 200;
    while (performance.now() < end) { /* Deliberate main-thread stall: audio lease must expire. */ }
    return window.IAMSubaudibleMantra.diagnostics().currentGain;
  });
  assert.equal(leaseGain, 0, "Gain must expire on the audio clock during a UI stall");
  report.checks.push({ label: "Main-thread stall expires gain", gain: leaseGain });
  console.log("Masking, controls and interruption checks passed");
  const settings = await (await page.request.get(base + "api/quantum-tree-settings.php")).json();
  assert.equal(typeof settings.mantra_enabled, "boolean");
  assert.equal(settings.mantra_gain_ratio, 1 / 3);
  const rejected = await page.request.post(base + "api/quantum-tree-settings.php", {
    headers: { Origin: "https://staging.universalmind.tv" }, data: { action: "save_mantra", mantra_enabled: false },
  });
  assert.equal(rejected.status(), 401);
  assert.deepEqual(await (await page.request.get(base + "api/quantum-tree-settings.php")).json(), settings);
  await page.route("**/api/quantum-tree-settings.php", route => route.fulfill({ status: 200, json: { ...settings, mantra_enabled: false } }));
  await page.evaluate(() => window.IAMSubaudibleMantra.reloadSettings());
  await zero("Platform off closes");
  await page.unroute("**/api/quantum-tree-settings.php");
  await page.evaluate(() => {
    window.IAMQuantumTree.setEnabled(false, {persist:false});
    document.querySelectorAll("audio,video").forEach(media => media.pause());
  });
  await page.goto(base + "quantum-tree-control.html", { waitUntil: "domcontentloaded" });
  await page.locator("[data-owner-access]").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-owner-dashboard]").isVisible(), false);
  const ownerRequests = [];
  // UI request wiring with simulated authentication; the live endpoint's
  // rejection/protected-state checks above are independent of this fixture.
  await page.route("**/api/quantum-tree-settings.php", route => {
    const request = route.request();
    if (request.method() === "POST") ownerRequests.push(request.postDataJSON());
    return route.fulfill({ status: 200, json: { ...settings, authenticated: true,
      csrf_token: "qa-owner-session", mantra_enabled: request.method() !== "POST" } });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("[data-owner-dashboard]").waitFor({ state: "visible" });
  await page.locator("[data-owner-mantra-enabled]").uncheck();
  await page.locator("[data-owner-mantra-save]").click();
  await page.waitForFunction(() => document.querySelector("[data-owner-mantra-status]").textContent.includes("disabled"));
  assert.deepEqual(ownerRequests, [{ action: "save_mantra", csrf_token: "qa-owner-session", mantra_enabled: false }]);
  report.checks.push({ label: "Owner UI requires login; simulated authenticated UI sends isolated mantra save with CSRF" });
  await page.locator("[data-owner-new-password]").fill("  UI-fixture Case  ");
  await page.locator("[data-owner-confirm-password]").fill("  UI-fixture Case  ");
  await page.locator("[data-owner-password-form] button").click();
  await page.waitForFunction(() => document.querySelector("[data-owner-password-status]").textContent.includes("saved"));
  assert.equal(ownerRequests.at(-1).action, "change_password");
  assert.equal(ownerRequests.at(-1).new_password, "  UI-fixture Case  ");
  assert.equal(await page.locator("[data-owner-new-password]").inputValue(), "");
  assert.equal(await page.locator("[data-owner-confirm-password]").inputValue(), "");
  report.checks.push({label: "Password UI preserves exact input and clears password fields after save (simulated authentication)"});
  await page.screenshot({ path: out + "/owner.png" });
  await page.unroute("**/api/quantum-tree-settings.php");
  report.errors = errors;
  assert.deepEqual(errors, []);
  report.passed = true;
} finally {
  report.errors = errors;
  report.lastDiagnostics = await diag().catch(() => null);
  report.programme = await page.evaluate(() => {
    const state = window.IAMQuantumTree?.getMantraProgrammeState();
    return { ...state, media: state?.media ? { paused: state.media.paused, muted: state.media.muted, volume: state.media.volume, time: state.media.currentTime, ready: state.media.readyState, src: state.media.currentSrc, dataset: { ...state.media.dataset } } : null, quantum: window.IAMQuantumTree?.diagnostics(), emdr: window.IAMEMDR?.diagnostics() };
  }).catch(() => null);
  await fs.writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  await page.evaluate(() => {

    window.IAMQuantumTree?.setEnabled(false, { persist: false });
    document.querySelectorAll("audio,video").forEach(media => media.pause());
  }).catch(() => {});
  await browser.close();
  await server.close();
}
console.log(JSON.stringify(report, null, 2));
