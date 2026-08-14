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
  assert.match(page, /data-heart-rate-live/);
  assert.match(page, /data-heart-rate-result/);
  assert.match(page, /data-heart-rate-ar-glasses/);
  assert.match(page, /heart-check-glasses-lens/);
  assert.match(page, /heart-check-glasses-frame/);
  assert.match(page, /Your heart rate/);
  assert.match(page, /Universal Mind \[ I o H \] Logo 512\.png/);
  assert.match(page, />Loading</);
  assert.match(page, /shen-heart-rate\.css\?v=shen-heart-rate-css-42c074185d53/);
  assert.match(page, /shen-heart-rate\.js\?v=shen-heart-rate-js-2e680bcc10ec/);
  assert.equal((page.match(/role="dialog"/g) || []).length, 1);
  assert.equal((page.match(/not a medical or mental-health diagnosis/g) || []).length, 1);
  assert.doesNotMatch(page, /type="checkbox"|Heart Light|paired result|shen-heart-rate-wellness/i);
  assert.match(css, /--scene-veil:\s*0\.44/);
  assert.match(css, /--shen-canvas-size/);
  assert.match(css, /width:\s*calc\(var\(--shen-canvas-size\) \* 0\.52\)/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /\.shen-heart-rate-live\s*\{/);
  assert.match(css, /\.shen-heart-rate-result\s*\{/);
  assert.match(css, /\.shen-heart-rate-ar-glasses\s*\{/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /width:\s*min\(638px, calc\(100vw - 38px\)\)/);
  assert.match(css, /\.shen-heart-rate-offer h2\s*\{[^}]*font-size:\s*20px/s);
  assert.match(css, /\.shen-heart-rate-offer p\s*\{[^}]*font-size:\s*12\.5px/s);
  assert.match(css, /\.shen-heart-rate-offer \.induction-permission__actions button\s*\{[^}]*min-height:\s*38px[^}]*font-size:\s*11\.25px/s);
  assert.doesNotMatch(css, /shen-heart-rate-attribution/);
  assert.doesNotMatch(page, /deepar\.js|licenseKey|bright-glasses\.deepar/i);
});

test("browser controller delegates the supported 10-second Quick HR face-map measurement to Shen", async () => {
  const source = await read(resolve(researchDirectory, "shen-heart-rate.js"));
  const runtime = await read(resolve(researchDirectory, "vendor", "shenai-sdk", "shenai_sdk.mjs"));

  assert.match(source, /\.\/vendor\/shenai-sdk\/index\.mjs/);
  assert.match(source, /shen-heart-recommendation\.js\?v=e61dcdb0f0e0/);
  assert.match(source, /MeasurementPreset\.QUICK_HR_MODE/);
  assert.match(source, /setMeasurementPreset\(MeasurementPreset\.QUICK_HR_MODE\)/);
  assert.match(source, /measurementPresetValue\(shenaiSDK\.getMeasurementPreset\(\)\)/);
  assert.match(source, /attempt < 10/);
  assert.match(source, /shenMeasurementPreset\s*=\s*quickHrConfirmed\s*\?\s*"quick-hr-mode"\s*:\s*"unexpected"/);
  assert.match(source, /The 10-second Heart Check could not be confirmed/);
  assert.doesNotMatch(source, /MeasurementPreset\.CUSTOM|setCustomMeasurementConfig|durationSeconds:\s*10|Metric\.HEART_RATE/);
  assert.match(source, /UiVersion\.V3/);
  assert.match(source, /showUserInterface:\s*true/);
  assert.match(source, /showDisclaimer:\s*false/);
  assert.match(source, /showInfoButton:\s*false/);
  assert.match(source, /showFaceMask:\s*true/);
  assert.match(source, /showBloodFlow:\s*true/);
  assert.match(source, /shenVisualizationConfig\s*=\s*"face-map-and-blood-flow"/);
  assert.match(source, /setShowFaceMask\?\.\(true\)/);
  assert.match(source, /setShowBloodFlow\?\.\(true\)/);
  assert.match(source, /getNormalizedFaceBbox/);
  assert.match(source, /FACE_EYE_LINE_RATIO\s*=\s*0\.3/);
  assert.match(source, /requestAnimationFrame\(positionArGlasses\)/);
  assert.match(source, /stage\.addEventListener\("click", startArGlasses\)/);
  assert.doesNotMatch(source, /OperatingMode|setShenVisualization|visualizationMonitor/);
  assert.match(runtime, /SetShowFaceMask/);
  assert.match(runtime, /SetShowBloodFlow/);
  assert.match(source, /enableSummaryScreen:\s*false/);
  assert.match(source, /showResultsFinishButton:\s*false/);
  assert.match(source, /hideShenaiLogo:\s*true/);
  assert.match(source, /setHideShenaiLogo\?\.\(true\)/);
  assert.match(source, /getHideShenaiLogo\?\.\(\)/);
  assert.match(source, /enablePreloadDisplay:\s*false/);
  assert.match(source, /hidePreloadDisplayLogo:\s*true/);
  assert.match(source, /onWasmLoadingProgress:\s*setLoadingProgress/);
  assert.doesNotMatch(source, /getUserMedia|MediaRecorder|ImageCapture|DeepAR|\bHRV\b|Stress Index/i);
  const arController = source.match(/function boundedUnit[\s\S]*?function normalizedHeartRate/)?.[0] || "";
  assert.ok(arController);
  assert.doesNotMatch(arController, /getHeartRate|BPM|heart.?rate.?band|threshold|inferred|weather|location|confidence/i);
  assert.doesNotMatch(source, /(?:api|license|secret)[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{16,}/i);
});

test("glasses map the face box into the cropped Shen V3 camera viewport at eye level", async () => {
  const source = await read(resolve(researchDirectory, "shen-heart-rate.js"));
  const css = await read(resolve(researchDirectory, "shen-heart-rate.css"));
  assert.match(source, /faceBox\.top \+ \(faceBox\.height \* FACE_EYE_LINE_RATIO\)/);
  assert.match(css, /--ar-glasses-y:\s*39%/);
  assert.match(css, /inset:\s*0 auto auto 50%/);
  assert.match(css, /height:\s*calc\(var\(--shen-canvas-size\) \* 0\.76\)/);
  assert.match(css, /transform:\s*translateX\(-50%\)/);
});

test("heart rate is momentary and only a bounded privacy-safe homepage handoff continues", async () => {
  const source = await read(resolve(researchDirectory, "shen-heart-rate.js"));
  const recommendationSource = await read(resolve(researchDirectory, "shen-heart-recommendation.js"));
  assert.match(source, /heart_rate_bpm/);
  assert.match(source, /getHeartRate4s/);
  assert.match(source, /FINAL_READING_HOLD_MS\s*=\s*2200/);
  assert.match(source, /showFinalHeartRate\(displayHeartRate\)/);
  assert.match(source, /clearFinalHeartRate\(\)/);
  assert.match(source, /liveHeartRateValue\.textContent\s*=\s*""/);
  assert.match(source, /finalHeartRateValue\.textContent\s*=\s*""/);
  assert.match(source, /momentaryHeartRate\s*=\s*null/);
  assert.match(source, /measurementResult\s*=\s*null/);
  assert.match(source, /handoffHeartCheckToHomepage/);
  assert.doesNotMatch(source, /citizen-needs-inference|Finding your experience|Tuning your experience/);
  assert.doesNotMatch(source, /ADAPTIVE_SOUND_SESSION_CHOICE_KEY/);
  assert.match(source, /sessionStorage\.removeItem/);
  assert.doesNotMatch(source, /average_signal_quality|measuredAt|provider|storeHeartRateResult|pseudonymousUserId/);
  assert.doesNotMatch(source, /selection_needs/);
  assert.doesNotMatch(source, /heartbeats|hrv_|stress_index|photo|video|waveform|rrIntervals/i);
  assert.match(recommendationSource, /heart_rate_bpm:\s*bpm/);
  assert.match(recommendationSource, /measurement_duration_seconds:\s*10/);
  assert.match(recommendationSource, /measurement_timing:\s*"immediately_after_current_self_report"/);
  assert.match(recommendationSource, /source:\s*"shen_quick_hr"/);
  assert.match(recommendationSource, /HEART_CHECK_HANDOFF_TIMEOUT_MS\s*=\s*1500/);
  assert.match(recommendationSource, /response\.status !== 202/);
  assert.match(recommendationSource, /payload\.accepted !== true/);
  assert.match(recommendationSource, /credentials:\s*"same-origin"/);
  assert.match(recommendationSource, /raw_heart_rate_sent_to_openai:\s*false/);
  assert.match(recommendationSource, /direct_heart_rate_to_song_room_band_carrier_or_dsp:\s*false/);
  assert.doesNotMatch(recommendationSource, /band_intent|carrier_intent|ADAPTIVE_SOUND_SESSION_CHOICE_KEY/);
  assert.match(recommendationSource, /scope:\s*"current_session_single_use"/);
  assert.match(recommendationSource, /opaque_cookie_http_only:\s*true/);
  assert.doesNotMatch(recommendationSource, /localStorage|sessionStorage|document\.cookie|citizen-needs-inference/);
});

test("heart-rate completion hands off once without storing or returning raw BPM", async () => {
  const {
    heartCheckHandoffPrivacy,
    handoffHeartCheckToHomepage,
  } = await import("../shen-heart-recommendation.js");

  assert.deepEqual(heartCheckHandoffPrivacy, {
    endpoint: "api/heart-check-handoff.php",
    measurement_duration_seconds: 10,
    max_acceptance_wait_ms: 1500,
    scope: "current_session_single_use",
    opaque_cookie_http_only: true,
    raw_heart_rate_sent_to_openai: false,
    raw_heart_rate_returned: false,
    raw_heart_rate_persisted_in_browser: false,
    direct_heart_rate_to_song_room_band_carrier_or_dsp: false,
  });

  const stored = new Map([
    ["iamLatestInference", JSON.stringify({
      checkin: "I am energised after surfing",
      environment_context: {
        local_time: "08:12",
        weather_condition: "clear",
        location_label: "coastal",
      },
    })],
    ["iamLatestCheckinValue", "I am energised after surfing"],
  ]);
  const storage = {
    getItem: (key) => stored.get(key) || null,
    setItem: () => assert.fail("Heart Check handoff must not write browser storage"),
  };
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return {
      status: 202,
      json: async () => ({ accepted: true }),
    };
  };

  const result = await handoffHeartCheckToHomepage(72, { storage, fetchImpl });
  assert.deepEqual(result, { status: "accepted", accepted: true });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "api/heart-check-handoff.php");
  assert.equal(requests[0].options.credentials, "same-origin");
  assert.ok(requests[0].options.signal);
  const requestBody = JSON.parse(requests[0].options.body);
  assert.equal(requestBody.momentary_physiology.heart_rate_bpm, 72);
  assert.equal(requestBody.momentary_physiology.measurement_duration_seconds, 10);
  assert.equal(requestBody.momentary_physiology.measurement_timing, "immediately_after_current_self_report");
  assert.equal(requestBody.momentary_physiology.source, "shen_quick_hr");
  assert.equal(requestBody.checkin, "I am energised after surfing");

  assert.equal((await handoffHeartCheckToHomepage(29, { storage, fetchImpl })).status, "unavailable");
  assert.equal((await handoffHeartCheckToHomepage("not-a-reading", { storage, fetchImpl })).status, "unavailable");
  assert.equal(requests.length, 1);

  const unsafeResult = await handoffHeartCheckToHomepage(72, {
    storage,
    fetchImpl: async () => ({
      status: 202,
      json: async () => ({ accepted: true, heart_rate_bpm: 72 }),
    }),
  });
  assert.deepEqual(unsafeResult, { status: "unavailable", accepted: false });

  const malformedResult = await handoffHeartCheckToHomepage(72, {
    storage,
    fetchImpl: async () => ({ status: 204, json: async () => ({}) }),
  });
  assert.deepEqual(malformedResult, { status: "unavailable", accepted: false });

  const timeoutStarted = Date.now();
  const timeoutResult = await handoffHeartCheckToHomepage(72, {
    storage,
    timeoutMs: 5,
    fetchImpl: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }),
  });
  assert.deepEqual(timeoutResult, { status: "unavailable", accepted: false });
  assert.ok(Date.now() - timeoutStarted < 100);
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
