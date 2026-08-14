import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const researchDirectory = resolve(testDirectory, "..");
const iamDirectory = resolve(researchDirectory, "..");

const read = (path) => readFile(path, "utf8");
const execFileAsync = promisify(execFile);

test("research check-in renders the canonical page instead of duplicating it", async () => {
  const source = await read(resolve(iamDirectory, "check-in-research.php"));
  assert.match(source, /file_get_contents\(\$canonicalPath\)/);
  assert.match(source, /vogue-self-report\.html/);
  assert.match(source, /data-iam-next-page/);
  assert.match(source, /research\.php\?offer=heart-rate/);
  assert.doesNotMatch(source, /data-iam-form|vogue-report-lockup|How are you arriving/);
});

test("research page is the existing I AM scene with one compact native prompt", async () => {
  const page = await read(resolve(iamDirectory, "research.php"));
  const css = await read(resolve(researchDirectory, "shen-heart-rate.css"));

  assert.match(page, /href="styles\.css/);
  assert.match(page, /Homepage - Hero Background Video - Chanel 2020 Runway Show\.mp4/);
  assert.match(page, /class="scene-veil"/);
  assert.match(page, /induction-permission__panel/);
  assert.match(page, /What Colour Is Your Heart\?/);
  assert.match(page, /video is processed live on this device and is never recorded or stored/);
  assert.match(page, /heart-rate reading is used momentarily for the recommendation, then discarded/);
  assert.match(page, /not a medical or mental-health diagnosis and should not replace professional care/);
  assert.doesNotMatch(page, /Powered by Shen AI/);
  assert.match(page, /data-heart-rate-loader/);
  assert.match(page, /Universal Mind \[ I o H \] Logo 512\.png/);
  assert.match(page, />Loading</);
  assert.match(page, /shen-heart-rate\.js\?v=shen-heart-rate-js-aad9a36edb27/);
  assert.equal((page.match(/role="dialog"/g) || []).length, 1);
  assert.equal((page.match(/not a medical or mental-health diagnosis/g) || []).length, 1);
  assert.doesNotMatch(page, /type="checkbox"|Heart Light|paired result|shen-heart-rate-wellness/i);
  assert.match(css, /--scene-veil:\s*0\.44/);
  assert.match(css, /--shen-canvas-size/);
  assert.match(css, /width:\s*calc\(var\(--shen-canvas-size\) \* 0\.52\)/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /width:\s*min\(638px, calc\(100vw - 38px\)\)/);
  assert.match(css, /\.shen-heart-rate-offer h2\s*\{[^}]*font-size:\s*20px/s);
  assert.match(css, /\.shen-heart-rate-offer p\s*\{[^}]*font-size:\s*12\.5px/s);
  assert.match(css, /\.shen-heart-rate-offer \.induction-permission__actions button\s*\{[^}]*min-height:\s*38px[^}]*font-size:\s*11\.25px/s);
  assert.doesNotMatch(css, /shen-heart-rate-attribution/);
  assert.doesNotMatch(css, /glasses|bubble|spectral|prism/i);
});

test("browser controller delegates the visible experience to Shen Quick HR", async () => {
  const source = await read(resolve(researchDirectory, "shen-heart-rate.js"));
  const runtime = await read(resolve(researchDirectory, "vendor", "shenai-sdk", "shenai_sdk.mjs"));

  assert.match(source, /\.\/vendor\/shenai-sdk\/index\.mjs/);
  assert.match(source, /MeasurementPreset\.QUICK_HR_MODE/);
  assert.match(source, /UiVersion\.V3/);
  assert.match(source, /showUserInterface:\s*true/);
  assert.match(source, /showDisclaimer:\s*false/);
  assert.match(source, /showInfoButton:\s*false/);
  assert.match(source, /showFaceMask:\s*true/);
  assert.match(source, /showBloodFlow:\s*false/);
  assert.match(source, /OperatingMode\.MEASURE[\s\S]*setShenVisualization\("blood-flow"\)/);
  assert.match(source, /OperatingMode\.POSITIONING[\s\S]*setShenVisualization\("face-mask"\)/);
  assert.match(source, /setShowFaceMask\?\.\(!showBloodFlow\)/);
  assert.match(source, /setShowBloodFlow\?\.\(showBloodFlow\)/);
  assert.match(source, /setInterval\(syncShenVisualization, 100\)/);
  assert.match(source, /clearInterval\(visualizationMonitor\)/);
  assert.match(runtime, /SetShowFaceMask/);
  assert.match(runtime, /SetShowBloodFlow/);
  assert.match(runtime, /GetOperatingMode/);
  assert.match(source, /enableSummaryScreen:\s*false/);
  assert.match(source, /showResultsFinishButton:\s*false/);
  assert.match(source, /hideShenaiLogo:\s*true/);
  assert.match(source, /enablePreloadDisplay:\s*false/);
  assert.match(source, /onWasmLoadingProgress:\s*setLoadingProgress/);
  assert.doesNotMatch(source, /getUserMedia|MediaRecorder|ImageCapture|DeepAR|AR glasses|HRV|Stress Index/i);
  assert.doesNotMatch(source, /(?:api|license|secret)[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{16,}/i);
});

test("heart rate is momentary and only a non-biometric recommendation continues", async () => {
  const source = await read(resolve(researchDirectory, "shen-heart-rate.js"));
  const recommendationSource = await read(resolve(researchDirectory, "shen-heart-recommendation.js"));
  assert.match(source, /heart_rate_bpm/);
  assert.match(source, /momentaryHeartRate\s*=\s*null/);
  assert.match(source, /measurementResult\s*=\s*null/);
  assert.match(source, /ADAPTIVE_SOUND_SESSION_CHOICE_KEY/);
  assert.match(source, /sessionStorage\.removeItem/);
  assert.doesNotMatch(source, /average_signal_quality|measuredAt|provider|storeHeartRateResult|pseudonymousUserId/);
  assert.doesNotMatch(source, /selection_needs/);
  assert.doesNotMatch(source, /heartbeats|hrv_|stress_index|photo|video|waveform|rrIntervals/i);
  assert.doesNotMatch(recommendationSource, /bpm\s*:/i);
  assert.match(recommendationSource, /scope:\s*"current_session_only"/);
  assert.match(recommendationSource, /not a physiological or mental-health classification/);
});

test("heart-rate completion deterministically creates only the bounded sound handoff", async () => {
  const {
    deriveHeartCheckRecommendation,
    writeEphemeralHeartCheckRecommendation,
  } = await import("../shen-heart-recommendation.js");

  assert.deepEqual(deriveHeartCheckRecommendation(55), {
    band_intent: "gamma",
    carrier_intent: "cognition_joy",
    high_concern_session_opt_in: false,
    scope: "current_session_only",
  });
  assert.deepEqual(deriveHeartCheckRecommendation(72), {
    band_intent: "alpha",
    carrier_intent: "presence",
    high_concern_session_opt_in: false,
    scope: "current_session_only",
  });
  assert.deepEqual(deriveHeartCheckRecommendation(95), {
    band_intent: "theta",
    carrier_intent: "self_connection",
    high_concern_session_opt_in: false,
    scope: "current_session_only",
  });
  assert.equal(deriveHeartCheckRecommendation(29), null);
  assert.equal(deriveHeartCheckRecommendation("not-a-reading"), null);

  const writes = [];
  const storage = { setItem: (key, value) => writes.push({ key, value }) };
  assert.equal(writeEphemeralHeartCheckRecommendation(72, storage, "adaptive-choice"), true);
  assert.deepEqual(writes.map(({ key }) => key), ["adaptive-choice"]);
  assert.deepEqual(JSON.parse(writes[0].value), {
    band_intent: "alpha",
    carrier_intent: "presence",
    high_concern_session_opt_in: false,
    scope: "current_session_only",
  });
  assert.doesNotMatch(writes[0].value, /heart|rate|bpm|72/i);
  assert.equal(writeEphemeralHeartCheckRecommendation(null, storage, "adaptive-choice"), false);
  assert.equal(writes.length, 1);
});

test("short-term Shen token endpoint keeps the permanent credential server-side", async () => {
  const endpoint = await read(resolve(iamDirectory, "api", "shen-token.php"));
  assert.match(endpoint, /getenv\('SHENAI_ADMIN_KEY'\)/);
  assert.match(endpoint, /require_once __DIR__ \. '\/happiness-secret-store\.php'/);
  assert.match(endpoint, /happiness_secret\('SHENAI_ADMIN_KEY'\)/);
  assert.match(endpoint, /shen_require_admin_key\(\)/);
  assert.match(endpoint, /respond\(503, \['error' => 'The heart-rate check is not configured on this environment yet\.'\]\)/);
  assert.match(endpoint, /https:\/\/api\.shen\.ai\/v1\/token/);
  assert.match(endpoint, /'max_measurements'\s*=>\s*1/);
  assert.match(endpoint, /'single_device'\s*=>\s*true/);
  assert.match(endpoint, /'expires_in'\s*=>\s*900/);
  assert.doesNotMatch(endpoint, /SHENAI_ADMIN_KEY["']?\s*[:=]\s*["']sh_/i);
});

test("protected Shen secret resolution works and missing configuration fails closed", async (context) => {
  const runtimeTest = resolve(testDirectory, "shen-token-secret-runtime.php");
  try {
    const { stdout, stderr } = await execFileAsync("php", [runtimeTest]);
    assert.equal(stderr, "");
    assert.match(stdout, /protected secret runtime regression passed/);
  } catch (error) {
    if (error?.code === "ENOENT") {
      context.skip("PHP is unavailable in this environment.");
      return;
    }
    throw error;
  }
});

test("research response supplies the Web SDK isolation and camera boundaries", async () => {
  const page = await read(resolve(iamDirectory, "research.php"));
  const sdkHeaders = await read(resolve(researchDirectory, "vendor", "shenai-sdk", ".htaccess"));
  assert.match(page, /Cross-Origin-Opener-Policy: same-origin/);
  assert.match(page, /Cross-Origin-Embedder-Policy: require-corp/);
  assert.match(page, /Permissions-Policy: camera=\(self\), microphone=\(\)/);
  assert.match(sdkHeaders, /<Files "shenai_sdk\.mjs">/);
  assert.match(sdkHeaders, /Cross-Origin-Embedder-Policy "require-corp"/);
  assert.match(sdkHeaders, /Cross-Origin-Resource-Policy "same-origin"/);
});
