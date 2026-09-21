import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://staging.universalmind.tv/vogue/iam/';
const out = process.env.MIX_QA_DIR || '/private/tmp/um-mix-monitor-qa';
await fs.mkdir(out, { recursive: true });
const server = await chromium.launchServer({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--mute-audio'] });
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser = await chromium.connect(server.wsEndpoint());
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
const report = { mutedProcess: true, localAssets: process.env.MIX_QA_LOCAL === '1', checks: [] };
page.on('pageerror', error => errors.push(error.message));
await context.addInitScript(() => {
  window.__mixContexts = [];
  const NativeContext = window.AudioContext;
  window.AudioContext = class extends NativeContext { constructor(...args) { super(...args); window.__mixContexts.push(this); } };
  window.__blockedFullscreen = 0;
  Element.prototype.requestFullscreen = () => { window.__blockedFullscreen++; return Promise.reject(new Error('QA prevents native fullscreen')); };
  Element.prototype.webkitRequestFullscreen = Element.prototype.requestFullscreen;
  HTMLVideoElement.prototype.webkitEnterFullscreen = Element.prototype.requestFullscreen;
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('QA prevents microphone access'));
});
if (report.localAssets) {
  const files = ['index.html', 'adaptive-environment-television.js', 'adaptive-sound/controller-v1.js', 'adaptive-sound/worklet-v1.js', 'adaptive-sound/session-v1.js', 'adaptive-sound-intent-policy-v1.json'];
  await context.route(base + '**', async route => {
    const file = decodeURIComponent(new URL(route.request().url()).pathname).replace('/vogue/iam/', '');
    if (!files.includes(file)) return route.continue();
    await route.fulfill({ body: await fs.readFile(path.join(root, 'i  a m', file)), contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.json') ? 'application/json' : 'application/javascript' });
  });
}
const diag = () => page.evaluate(() => ({ quantum: window.IAMQuantumTree.diagnostics(), synth: window.IAMAdaptiveSound.diagnostics(), mantra: window.IAMSubaudibleMantra.diagnostics() }));
const text = name => page.locator(`[data-mix-${name}]`).textContent();
try {
  await page.goto(base + 'index.html?quantumTreeMonitor=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.IAMSubaudibleMantra && window.IAMAdaptiveSound && document.body.dataset.adaptiveSelectionSource === 'no_checkin_random');
  await page.waitForFunction(() => window.IAMAdaptiveSoundSnapshot?.selection_basis === 'default_session_profile');
  assert.equal((await diag()).synth.carrier_hz, 222);
  assert.equal(await text('synth-volume'), '0.00%');
  assert.equal(await text('synth-time'), '0:00');
  report.checks.push('Skipped check-in and Heart Rate select the explicit default synth profile; audio waits for playback');
  await page.locator('[data-television-play]').click();
  await page.waitForFunction(() => window.IAMAdaptiveSound.diagnostics().running && window.IAMAdaptiveSound.diagnostics().output_rms > 0);
  assert.equal((await diag()).synth.panel_open, false);
  report.checks.push('One programme Play click starts the synth with both checks skipped and Sound panel closed');
  await page.waitForFunction(() => document.querySelector('.adaptive-television-local-video')?.currentTime > 1, null, {timeout: 45000});
  await page.waitForFunction(() => window.IAMSubaudibleMantra.diagnostics().outputVerified, null, {timeout: 60000});
  const before = await diag();
  await page.waitForTimeout(1600);
  const after = await diag();
  assert.ok(after.synth.run_seconds > before.synth.run_seconds);
  assert.equal(after.synth.rendered_carrier_hz, 222);
  assert.equal(after.synth.route_profile_id, 'calm_alpha_80_v1');
  assert.equal(await text('synth-primary'), 'Alpha 10.11 Hz · 80.00%');
  for (const [id,rate,weight] of [['delta',3.33,6.66],['theta',7.38,6.66],['alpha',10.11,80],['gamma',111,6.66]]) {
    assert.equal(await text('synth-'+id), `${rate} Hz · ${weight.toFixed(2)}%`);
    assert.ok(Math.abs(after.synth.lanes[id].power_weight*100-weight)<1e-8);
  }
  assert.match(await text('synth-allocation'), /Noise 0.01% · silence reserve 0.01%/);
  report.defaultSynth = after.synth;
  report.checks.push('Default renderer is Alpha 10.11 Hz at 80% with a 222 Hz carrier; all four displayed lane percentages match audio-thread power weights');
  assert.ok(after.quantum.currentTime > before.quantum.currentTime);
  assert.ok(after.mantra.currentTime > before.mantra.currentTime);
  assert.ok(after.mantra.duration > 334 && after.mantra.duration < 335);
  assert.match(await text('programme-status'), /playing/);
  assert.match(await text('mantra-time'), / \/ 5:34$/);
  report.realProgramme = { quantum: after.quantum, mantra: after.mantra };
  report.checks.push('Real random programme, Quantum Tree and mantra clocks advance; mantra output verified');

  await page.evaluate(() => window.IAMAdaptiveSound.open());
  // These are the existing session-only Sound controls, not a fabricated inference.
  await page.locator('[data-adaptive-profile="inspiration_gamma_80_v1"]').first().evaluate(button => button.click());
  await page.locator('[data-adaptive-carrier-select]').selectOption('444');
  await page.waitForFunction(() => window.IAMAdaptiveSound.diagnostics().running && window.IAMAdaptiveSound.diagnostics().output_rms > 0 && window.IAMAdaptiveSound.diagnostics().rendered_carrier_hz === 444);
  await page.evaluate(() => window.IAMAdaptiveSound.close());
  await page.waitForTimeout(500);
  assert.equal(await text('synth-carrier'), '444 Hz');
  assert.equal(await text('synth-primary'), 'Gamma 111 Hz · 80.00%');
  assert.equal(await text('synth-gamma'), '111 Hz · 80.00%');
  assert.equal(await text('synth-alpha'), '10.11 Hz · 6.66%');
  report.checks.push('Changing the session profile updates the primary pulse and lane percentages from the new renderer; carrier changes independently');
  const synthStart = (await diag()).synth;
  await page.waitForTimeout(1600);
  const synthLater = (await diag()).synth;
  report.synthClock = {before: synthStart, after: synthLater};
  assert.ok(synthLater.run_seconds > synthStart.run_seconds + 1);
  assert.ok(synthLater.current_output_gain > 0);
  assert.match(await text('synth-output'), /dBFS/);
  report.synth = synthLater;
  report.checks.push('Existing session choice runs synth; rendered-frame clock, actual route gain, carrier and all four rates visible');
  await page.evaluate(() => window.IAMAdaptiveSound.open());
  await page.locator('[data-adaptive-profile="calm_alpha_80_v1"]').first().evaluate(button => button.click());
  await page.locator('[data-adaptive-carrier-select]').selectOption('222');
  await page.waitForFunction(() => document.querySelector('[data-mix-synth-primary]').textContent === 'Alpha 10.11 Hz · 80.00%' && window.IAMAdaptiveSound.diagnostics().rendered_carrier_hz === 222);
  await page.evaluate(() => window.IAMAdaptiveSound.close());

  await page.evaluate(() => window.IAMSubaudibleMantra.setEnabled(false));
  await page.waitForFunction(() => document.querySelector('[data-mix-mantra-volume]').textContent === '0.00%');
  assert.equal(await text('mantra-status'), 'off');
  const mantraPaused = (await diag()).mantra.currentTime;
  await page.waitForTimeout(1200);
  assert.equal((await diag()).mantra.currentTime, mantraPaused);
  report.checks.push('Mantra off freezes its file position and reads zero volume');
  await page.evaluate(() => window.IAMSubaudibleMantra.setEnabled(true));

  await page.evaluate(async () => { await Promise.all(window.__mixContexts.map(context => context.suspend())); });
  await page.waitForTimeout(600);
  const suspended = (await diag()).synth;
  assert.equal(await text('synth-status'), 'suspended');
  assert.equal(await text('synth-volume'), '0.00%');
  assert.equal(await text('synth-output'), 'silent');
  await page.waitForTimeout(1200);
  assert.equal((await diag()).synth.run_seconds, suspended.run_seconds);
  report.checks.push('Suspended audio context freezes synth runtime and clears live output');
  await page.evaluate(async () => { await Promise.all(window.__mixContexts.map(context => context.resume())); });
  await page.waitForFunction(() => window.IAMAdaptiveSound.diagnostics().running);

  await page.evaluate(() => { window.IAMAdaptiveSound.open(); });
  await page.locator('[data-adaptive-sound-master]').evaluate(button => button.click());
  await page.waitForTimeout(650);
  assert.equal(await text('synth-volume'), '0.00%');
  assert.equal(await text('mantra-volume'), '0.00%');
  const offTime = (await diag()).synth.run_seconds;
  await page.waitForTimeout(1200);
  assert.equal((await diag()).synth.run_seconds, offTime);
  report.checks.push('Sound master off freezes synth runtime and zeroes synth/mantra volume');
  await page.locator('[data-adaptive-sound-master]').evaluate(button => button.click());
  await page.evaluate(() => window.IAMAdaptiveSound.close());
  await page.waitForFunction(() => window.IAMAdaptiveSound.diagnostics().running);

  await page.locator('.adaptive-television-local-video').evaluate(media => media.pause());
  await page.waitForFunction(() => document.querySelector('[data-mix-programme-status]').textContent === 'paused');
  await page.waitForFunction(() => document.querySelector('[data-mix-mantra-volume]').textContent === '0.00%');
  const programmePosition = await text('programme-time');
  await page.waitForTimeout(1100);
  assert.equal(await text('programme-time'), programmePosition);
  report.checks.push('Programme pause preserves displayed position and closes mantra gain');
  await page.locator('.adaptive-television-local-video').evaluate(media => media.play());
  await page.waitForTimeout(1000);
  for (const [width, height] of [[1440,1000], [390,844], [844,390]]) {
    await page.setViewportSize({width, height});
    const geometry = await page.locator('.quantum-mix-monitor').evaluate(panel => {
      const rect = panel.getBoundingClientRect();
      return { x:rect.x, y:rect.y, right:rect.right, bottom:rect.bottom, width:panel.clientWidth, scrollWidth:panel.scrollWidth };
    });
    assert.ok(geometry.x >= 0 && geometry.y >= 0 && geometry.right <= width && geometry.bottom <= height);
    assert.ok(geometry.scrollWidth <= geometry.width + 1, 'No horizontal panel overflow');
    await page.locator('[data-mix-mantra-time]').scrollIntoViewIfNeeded();
    await page.screenshot({path: `${out}/${width}x${height}-mix.png`});
    await page.locator('.quantum-mix-monitor').evaluate(panel => {panel.scrollTop = 0;});
    await page.screenshot({path: `${out}/${width}x${height}-top.png`});
  }
  report.checks.push('Desktop, mobile and landscape overlay bounded, scrollable and without horizontal overflow');
  assert.deepEqual(errors, []);
  report.passed = true;
} finally {
  report.pageErrors = errors;
  await page.evaluate(() => {
    window.IAMQuantumTree?.setEnabled(false, {persist:false});
    window.IAMSubaudibleMantra?.setEnabled(false);
    document.querySelectorAll('audio,video').forEach(media => media.pause());
    window.__mixContexts?.forEach(context => context.close());
  }).catch(() => {});
  await browser.close();
  await server.close();
  report.cleanup = true;
  await fs.writeFile(out + '/report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
