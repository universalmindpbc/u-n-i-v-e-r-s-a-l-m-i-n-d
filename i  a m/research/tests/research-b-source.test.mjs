import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const researchDirectory = resolve(testDirectory, "..");
const iamDirectory = resolve(researchDirectory, "..");

const read = (path) => readFile(path, "utf8");
const execFileAsync = promisify(execFile);
const sha256 = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");

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
  const cssToken = (await sha256(resolve(researchDirectory, "shen-heart-rate.css"))).slice(0, 12);
  const controllerToken = (await sha256(resolve(researchDirectory, "shen-heart-rate.js"))).slice(0, 12);

  assert.match(page, /href="styles\.css/);
  assert.match(page, /Homepage - Hero Background Video - Chanel 2020 Runway Show\.mp4/);
  assert.match(page, /class="scene-veil"/);
  assert.match(page, /induction-permission__panel/);
  assert.match(page, /What colour is your heart\?/);
  assert.match(page, /Look into your camera for a brief moment\. We will translate your live pulse into a personalized music television ecosystem\./);
  assert.match(page, /<em>Your video stream is processed entirely on-device and is never recorded or stored\.<\/em>/);
  assert.match(page, />Scan my pulse<\/button>/);
  assert.match(page, />Skip for now<\/button>/);
  assert.doesNotMatch(page, /General wellness and research information only|medical or mental-health diagnosis|Medical Disclaimer/);
  assert.doesNotMatch(page, /Powered by Shen AI/);
  assert.match(page, /data-heart-rate-loader/);
  assert.match(page, /data-heart-rate-live/);
  assert.match(page, /data-heart-rate-result/);
  assert.match(page, /data-heart-rate-deepar/);
  assert.match(page, /data-heart-rate-deepar-preview/);
  assert.match(page, /data-heart-rate-deepar-source/);
  assert.match(page, /Your heart rate/);
  assert.match(page, /Universal Mind \[ I o H \] Logo 512\.png/);
  assert.match(page, />Loading</);
  assert.match(page, new RegExp(`shen-heart-rate\\.css\\?v=shen-heart-rate-css-${cssToken}`));
  assert.match(page, new RegExp(`shen-heart-rate\\.js\\?v=shen-heart-rate-js-${controllerToken}`));
  assert.equal((page.match(/role="dialog"/g) || []).length, 1);
  assert.equal((page.match(/never recorded or stored/g) || []).length, 1);
  assert.doesNotMatch(page, /type="checkbox"|Heart Light|paired result|shen-heart-rate-wellness/i);
  assert.match(css, /--scene-veil:\s*0\.44/);
  assert.match(css, /--shen-canvas-size/);
  assert.match(css, /width:\s*calc\(var\(--shen-canvas-size\) \* 0\.52\)/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /\.shen-heart-rate-live\s*\{/);
  assert.match(css, /\.shen-heart-rate-result\s*\{/);
  assert.match(css, /\.shen-heart-rate-deepar\s*\{/);
  assert.match(css, /\.shen-heart-rate-deepar__preview canvas/);
  assert.match(css, /data-deepar-ready="true"[^}]*#mxcanvas\s*\{[^}]*opacity:\s*1[^}]*mix-blend-mode:\s*normal[^}]*pointer-events:\s*auto/s);
  assert.doesNotMatch(css, /opacity:\s*0\.32|mix-blend-mode:\s*screen/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /-webkit-mask:[\s\S]*radial-gradient/);
  assert.match(css, /mask-composite:\s*add/);
  assert.match(css, /width:\s*min\(638px, calc\(100vw - 38px\)\)/);
  assert.match(css, /\.shen-heart-rate-offer h2\s*\{[^}]*font-size:\s*20px/s);
  assert.match(css, /\.shen-heart-rate-offer p\s*\{[^}]*font-size:\s*12\.5px/s);
  assert.match(css, /\.shen-heart-rate-offer \.induction-permission__actions button\s*\{[^}]*min-height:\s*38px[^}]*font-size:\s*11\.25px/s);
  assert.match(css, /\.shen-heart-rate-offer \.induction-permission__actions \.shen-heart-rate-offer__primary\s*\{[^}]*min-height:\s*46px[^}]*font-size:\s*14\.5px[^}]*font-weight:\s*700/s);
  assert.match(css, /\.shen-heart-rate-offer \.induction-permission__actions \.shen-heart-rate-offer__secondary\s*\{[^}]*font-size:\s*10\.5px[^}]*font-weight:\s*400/s);
  assert.doesNotMatch(css, /shen-heart-rate-attribution/);
  assert.doesNotMatch(page, /<svg|heart-check-glasses-lens|heart-check-glasses-frame|licenseKey/i);
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
  assert.equal((source.match(/\.getUserMedia\(/g) || []).length, 1);
  assert.match(source, /audio:\s*false/);
  assert.match(source, /videoTracks\.length !== 1 \|\| audioTracks\.length !== 0/);
  assert.match(source, /shenaiSDK\.setMediaStream\(sharedCameraStream, true\)/);
  assert.match(source, /shenaiSDK\.setMediaStream\(sharedCameraStream, true\);\s*shenOwnsSharedCameraStream = true/);
  assert.match(source, /createDeepARBrightGlasses/);
  assert.match(
    source,
    /async function releaseShen\(\)[\s\S]*?active\?\.deinitialize\?\.\(\);[\s\S]*?stopSharedVideoStream\(\);[\s\S]*?await activeDeepAR\?\.cleanup\?\.\(\)/,
  );
  assert.equal(
    source.indexOf("active?.deinitialize?.();", source.indexOf("async function releaseShen()"))
      < source.indexOf("stopSharedVideoStream();", source.indexOf("async function releaseShen()")),
    true,
  );
  assert.match(source, /if \(shenReleaseStarted\) sharedCameraStream = null;\s*else stopSharedVideoStream\(\)/);
  assert.equal(
    source.indexOf("stopSharedVideoStream();", source.indexOf("async function releaseShen()"))
      < source.indexOf("await activeDeepAR?.cleanup?.()", source.indexOf("async function releaseShen()")),
    true,
  );
  assert.match(source, /window\.addEventListener\("beforeunload", releaseShen\)/);
  assert.match(source, /window\.addEventListener\("pagehide", releaseShen\)/);
  assert.doesNotMatch(source, /MediaRecorder|ImageCapture|takeScreenshot|startVideoRecording|\bHRV\b|Stress Index/i);
  assert.doesNotMatch(source, /(?:api|license|secret)[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{16,}/i);
});

test("official DeepAR Bright Glasses uses the same raw video stream and never owns a camera", async () => {
  const source = await read(resolve(researchDirectory, "deepar-bright-glasses.js"));
  const css = await read(resolve(researchDirectory, "shen-heart-rate.css"));
  assert.match(source, /vendor\/deepar-5\.6\.22\/js\/deepar\.esm\.js/);
  assert.match(source, /effects\/bright-glasses\/bright-glasses\.deepar/);
  assert.match(source, /disableDefaultCamera:\s*true/);
  assert.match(source, /deepAR\.setVideoElement\(videoElement, true\)/);
  assert.match(source, /deepAR\.muteSound\?\.\(true\)/);
  assert.match(source, /deepAR\.setFps\?\.\(24\)/);
  assert.match(source, /deepAR\.callbacks\.onFaceTracked/);
  assert.match(source, /normalizeDeepARFaceRegion/);
  assert.match(source, /onFaceRegion/);
  assert.match(source, /deepAR\?\.stopVideo\?\.\(\)/);
  assert.match(source, /deepAR\?\.shutdown\?\.\(\)/);
  assert.match(source, /free_plan_watermark_visible:\s*true/);
  assert.doesNotMatch(source, /getUserMedia|startCamera|takeScreenshot|startVideoRecording|MediaRecorder|localStorage|sessionStorage/);
  assert.doesNotMatch(source, /heart.?rate|BPM|threshold|band_intent|carrier_intent|weather|location/i);
  assert.match(css, /inset:\s*0 0 auto/);
  assert.match(css, /width:\s*100%/);
  assert.match(css, /height:\s*76%/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /z-index:\s*3/);
  assert.match(css, /--deepar-eye-x/);
  assert.match(css, /radial-gradient/);
  assert.doesNotMatch(css, /display:\s*none[^}]*deepar|clip-path/i);

  assert.equal(
    await sha256(resolve(researchDirectory, "effects", "bright-glasses", "bright-glasses.deepar")),
    "c24e7216d54cb9ecdb5557d808bd6b331a72d5932b3b25dbeadf098cb72728dd",
  );
  assert.equal(
    await sha256(resolve(researchDirectory, "vendor", "deepar-5.6.22", "js", "deepar.esm.js")),
    "bcd66c611d8c73f71ce3d7e0c93fb535972c24d72eb9ec4905b48820278eeb32",
  );
  assert.equal(
    await sha256(resolve(researchDirectory, "vendor", "deepar-5.6.22", "wasm", "deepar.wasm")),
    "f1312992c2d37f2428e6760ab21b77f7cc032d2b63133ca55de8e1aa88afe261",
  );
});

test("DeepAR face rectangles become bounded eye-region masks without changing Shen UI", async () => {
  const { normalizeDeepARFaceRegion } = await import("../deepar-bright-glasses.js");
  const pixelRegion = normalizeDeepARFaceRegion([160, 90, 320, 360], 640, 720);
  assert.ok(Math.abs(pixelRegion.centerX - 0.5) < 0.0001);
  assert.ok(Math.abs(pixelRegion.centerY - 0.29) < 0.0001);
  assert.ok(Math.abs(pixelRegion.radiusX - 0.39) < 0.0001);
  assert.ok(Math.abs(pixelRegion.radiusY - 0.15) < 0.0001);

  const normalizedRegion = normalizeDeepARFaceRegion([0.2, 0.1, 0.4, 0.5], 640, 720);
  assert.ok(Math.abs(normalizedRegion.centerX - 0.4) < 0.0001);
  assert.ok(Math.abs(normalizedRegion.centerY - 0.265) < 0.0001);
  assert.equal(normalizeDeepARFaceRegion(null, 640, 720), null);
  assert.equal(normalizeDeepARFaceRegion([0, 0, 0, 1], 640, 720), null);
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
  assert.doesNotMatch(source, /heartbeats|hrv_|stress_index|photo|waveform|rrIntervals/i);
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

test("DeepAR browser licence is domain-bound and loaded only through the protected server adapter", async () => {
  const endpoint = await read(resolve(iamDirectory, "api", "deepar-license.php"));
  const controller = await read(resolve(researchDirectory, "deepar-bright-glasses.js"));
  assert.match(endpoint, /getenv\('DEEPAR_WEB_KEY'\)/);
  assert.match(endpoint, /require_once __DIR__ \. '\/happiness-secret-store\.php'/);
  assert.match(endpoint, /happiness_secret\('DEEPAR_WEB_KEY'\)/);
  assert.match(endpoint, /deepar_require_web_key\(\)/);
  assert.match(endpoint, /respond\(503|deepar_respond\(503/);
  assert.match(endpoint, /Cache-Control: no-store/);
  assert.match(endpoint, /Cross-Origin-Resource-Policy: same-origin/);
  assert.match(endpoint, /Cross-origin requests are not allowed/);
  assert.match(endpoint, /Cross-site requests are not allowed/);
  assert.match(endpoint, /deepar_respond\(200, \['license_key' => \$webKey\]\)/);
  assert.doesNotMatch(endpoint, /DEEPAR_WEB_KEY["']?\s*[:=]\s*["'][A-Za-z0-9_-]{16,}/i);
  assert.match(controller, /api\/deepar-license\.php/);
  assert.match(controller, /credentials:\s*"same-origin"/);
  assert.match(controller, /cache:\s*"no-store"/);
  assert.doesNotMatch(controller, /licenseKey:\s*["'][A-Za-z0-9_-]{16,}/i);
});

test("protected DeepAR secret resolution works and missing configuration fails closed", async (context) => {
  const runtimeTest = resolve(testDirectory, "deepar-license-secret-runtime.php");
  try {
    const { stdout, stderr } = await execFileAsync("php", [runtimeTest]);
    assert.equal(stderr, "");
    assert.match(stdout, /DeepAR protected secret runtime regression passed/);
  } catch (error) {
    if (error?.code === "ENOENT") {
      context.skip("PHP is unavailable in this environment.");
      return;
    }
    throw error;
  }
});

test("research response supplies both Web SDK isolation and camera boundaries", async () => {
  const page = await read(resolve(iamDirectory, "research.php"));
  const sdkHeaders = await read(resolve(researchDirectory, "vendor", "shenai-sdk", ".htaccess"));
  const deepARHeaders = await read(resolve(researchDirectory, "vendor", "deepar-5.6.22", ".htaccess"));
  const effectHeaders = await read(resolve(researchDirectory, "effects", "bright-glasses", ".htaccess"));
  assert.match(page, /Cross-Origin-Opener-Policy: same-origin/);
  assert.match(page, /Cross-Origin-Embedder-Policy: require-corp/);
  assert.match(page, /Permissions-Policy: camera=\(self\), microphone=\(\)/);
  assert.match(sdkHeaders, /<Files "shenai_sdk\.mjs">/);
  assert.match(sdkHeaders, /Cross-Origin-Embedder-Policy "require-corp"/);
  assert.match(sdkHeaders, /Cross-Origin-Resource-Policy "same-origin"/);
  assert.match(deepARHeaders, /AddType application\/wasm \.wasm/);
  assert.match(deepARHeaders, /Cross-Origin-Embedder-Policy "require-corp"/);
  assert.match(deepARHeaders, /Cross-Origin-Resource-Policy "same-origin"/);
  assert.match(effectHeaders, /AddType application\/octet-stream \.deepar/);
  assert.match(effectHeaders, /Cross-Origin-Resource-Policy "same-origin"/);
});
