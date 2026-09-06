import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const base = "https://staging.universalmind.tv/vogue/iam/";
const out = process.env.MANTRA_QA_DIR || "/private/tmp/um-mantra-qa";
await fs.mkdir(out, { recursive: true });
const server = await chromium.launchServer({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true, args: ["--mute-audio"] });
assert.ok(server.process().spawnargs.includes("--mute-audio"));
const browser = await chromium.connect(server.wsEndpoint());
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const report = { mutedProcess: true, checks: [] };
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => {
  Element.prototype.requestFullscreen = () => Promise.reject(new Error("QA disables native fullscreen"));
  Element.prototype.webkitRequestFullscreen = Element.prototype.requestFullscreen;
  HTMLVideoElement.prototype.webkitEnterFullscreen = Element.prototype.requestFullscreen;
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error("QA disables microphone"));
});
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
  await page.locator('[data-wallet-category="video"]').click();
  await page.locator(".adaptive-television-local-video").evaluate(video => window.IAMStreamController.play(video).catch(() => {}));
  await page.waitForFunction(() => document.querySelector(".adaptive-television-local-video")?.currentTime > 0.2, null, { timeout: 45000 });
  await page.locator("[data-video-sound-open]").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: out + "/desktop.png" });
  const button = page.locator("[data-subaudible-mantra-toggle]");
  assert.equal(await button.getAttribute("aria-pressed"), "true");
  await button.click();
  await zero("Public off immediately silences");
  assert.equal(await page.evaluate(() => localStorage.getItem("iamSubaudibleMantra")), "off");
  await button.click();
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().currentGain > 0, null, { timeout: 30000 });
  report.realProgramme = await diag();
  assert.ok(report.realProgramme.duration > 334 && report.realProgramme.duration < 335);
  await page.locator("[data-adaptive-sound-master]").click();
  await zero("Sound master stops the mantra");
  await page.locator("[data-adaptive-sound-master]").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await button.scrollIntoViewIfNeeded();
  await page.screenshot({ path: out + "/mobile.png" });
  const matrixBox = await page.locator(".iam-sound-module--control").boundingBox();
  const mantraBox = await page.locator(".iam-sound-mantra").boundingBox();
  assert.ok(matrixBox.y + matrixBox.height <= mantraBox.y, "Mantra row must not cover the frequency matrix");
  const box = await button.boundingBox();
  assert.ok(box && box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= 390);
  await page.setViewportSize({ width: 844, height: 390 });
  await button.scrollIntoViewIfNeeded();
  await page.screenshot({ path: out + "/landscape.png" });
  assert.equal(await button.isVisible(), true);
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  report.checks.push({ label: "Measured strong speech-band fixture opens", ...(await diag()) });
  for (const [label, frequency, amplitude] of [["Quiet programme closes", 1000, 0.001], ["Silence closes", 1000, 0], ["Bass alone does not mask speech", 45, 0.8]]) {
    await page.evaluate(([hz, amp]) => window.__mantraFixtureSource(hz, amp), [frequency, amplitude]);
    await page.waitForTimeout(750);
    await zero(label);
  }
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
  await button.click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.IAMSubaudibleMantra);
  assert.equal((await diag()).enabled, false);
  report.checks.push({ label: "Off preference survives reload" });
  report.errors = errors;
  assert.deepEqual(errors, []);
  report.passed = true;
} finally {
  report.lastDiagnostics = await diag().catch(() => null);
  report.programme = await page.evaluate(() => {
    const state = window.IAMQuantumTree?.getMantraProgrammeState();
    return { ...state, media: state?.media ? { paused: state.media.paused, muted: state.media.muted, volume: state.media.volume, time: state.media.currentTime, ready: state.media.readyState, src: state.media.currentSrc, dataset: { ...state.media.dataset } } : null, quantum: window.IAMQuantumTree?.diagnostics(), emdr: window.IAMEMDR?.diagnostics() };
  }).catch(() => null);
  await fs.writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  await page.evaluate(() => {
    window.IAMSubaudibleMantra?.setEnabled(false);
    window.IAMQuantumTree?.setEnabled(false, { persist: false });
    document.querySelectorAll("audio,video").forEach(media => media.pause());
  }).catch(() => {});
  await browser.close();
  await server.close();
}
console.log(JSON.stringify(report, null, 2));
