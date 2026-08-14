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
  assert.match(page, /shen-heart-rate\.css\?v=shen-heart-rate-css-bc71eff45110/);
  assert.match(page, /shen-heart-rate\.js\?v=shen-heart-rate-js-dba3b221c7ba/);
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

test("browser controller delegates a 10-second heart-rate-only face-map measurement to Shen", async () => {
  const source = await read(resolve(researchDirectory, "shen-heart-rate.js"));
  const runtime = await read(resolve(researchDirectory, "vendor", "shenai-sdk", "shenai_sdk.mjs"));

  assert.match(source, /\.\/vendor\/shenai-sdk\/index\.mjs/);
  assert.match(source, /shen-heart-recommendation\.js\?v=b3de95f8a562/);
  assert.match(source, /MeasurementPreset\.CUSTOM/);
  assert.match(source, /setCustomMeasurementConfig\(customMeasurementConfig\)/);
  assert.match(source, /typeof shenaiSDK\.setCustomMeasurementConfig !== "function"/);
  assert.match(source, /durationSeconds:\s*10/);
  assert.match(source, /instantMetrics:\s*\[Metric\.HEART_RATE\]/);
  assert.match(source, /summaryMetrics:\s*\[Metric\.HEART_RATE\]/);
  assert.match(source, /realtimeHrPeriodSeconds:\s*4/);
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
  assert.doesNotMatch(source, /getUserMedia|MediaRecorder|ImageCapture|DeepAR|HRV|Stress Index/i);
  const arController = source.match(/function boundedUnit[\s\S]*?function normalizedHeartRate/)?.[0] || "";
  assert.ok(arController);
  assert.doesNotMatch(arController, /getHeartRate|BPM|heart.?rate.?band|threshold|inferred|weather|location|confidence/i);
  assert.doesNotMatch(source, /(?:api|license|secret)[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{16,}/i);
});

test("heart rate is momentary and only a privacy-safe current inference continues", async () => {
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
  assert.match(source, /reconcileHeartCheckInference/);
  assert.doesNotMatch(source, /ADAPTIVE_SOUND_SESSION_CHOICE_KEY/);
  assert.match(source, /sessionStorage\.removeItem/);
  assert.doesNotMatch(source, /average_signal_quality|measuredAt|provider|storeHeartRateResult|pseudonymousUserId/);
  assert.doesNotMatch(source, /selection_needs/);
  assert.doesNotMatch(source, /heartbeats|hrv_|stress_index|photo|video|waveform|rrIntervals/i);
  assert.match(recommendationSource, /heart_rate_bpm:\s*bpm/);
  assert.match(recommendationSource, /measurement_duration_seconds:\s*10/);
  assert.match(recommendationSource, /raw_heart_rate_sent_to_openai:\s*false/);
  assert.match(recommendationSource, /direct_heart_rate_to_song_room_band_carrier_or_dsp:\s*false/);
  assert.doesNotMatch(recommendationSource, /band_intent|carrier_intent|ADAPTIVE_SOUND_SESSION_CHOICE_KEY/);
  assert.match(recommendationSource, /scope:\s*"current_session_only"/);
  assert.match(recommendationSource, /first-party Worker strips BPM before calling OpenAI/);
});

test("heart-rate completion reconciles only through the first-party current inference", async () => {
  const {
    heartCheckInferencePrivacy,
    reconcileHeartCheckInference,
  } = await import("../shen-heart-recommendation.js");

  assert.deepEqual(heartCheckInferencePrivacy, {
    measurement_duration_seconds: 10,
    scope: "current_session_only",
    raw_heart_rate_sent_to_openai: false,
    raw_heart_rate_returned: false,
    raw_heart_rate_persisted: false,
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
  const writes = [];
  const storage = {
    getItem: (key) => stored.get(key) || null,
    setItem: (key, value) => {
      stored.set(key, value);
      writes.push({ key, value });
    },
  };
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        prompt_version: "adaptive-inference-engine-system-prompt-v5.55",
        current_inference: {
          inference_id: "active_energised",
          heart_rate_role: "supporting",
          heart_rate_zone: "mid_observed",
          horizons_considered: ["horizon_1", "horizon_2", "horizon_3"],
          baseline_comparison_used: false,
        },
      }),
    };
  };

  const result = await reconcileHeartCheckInference(72, { storage, fetchImpl });
  assert.equal(result.status, "complete");
  assert.equal(result.persisted, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "api/citizen-needs-inference.php");
  const requestBody = JSON.parse(requests[0].options.body);
  assert.equal(requestBody.momentary_physiology.heart_rate_bpm, 72);
  assert.equal(requestBody.momentary_physiology.measurement_duration_seconds, 10);
  assert.equal(requestBody.checkin, "I am energised after surfing");
  assert.equal(requestBody.environment_context.location_label, "coastal");
  assert.deepEqual(writes.map(({ key }) => key), ["iamLatestInference", "citizenNeedsLatestInference"]);
  for (const { value } of writes) {
    assert.doesNotMatch(value, /"heart_rate_bpm"|"bpm"/i);
    assert.match(value, /"heart_rate_role":"supporting"/);
    assert.match(value, /"horizons_considered":\["horizon_1","horizon_2","horizon_3"\]/);
  }

  const writeCount = writes.length;
  assert.equal((await reconcileHeartCheckInference(29, { storage, fetchImpl })).status, "unavailable");
  assert.equal((await reconcileHeartCheckInference("not-a-reading", { storage, fetchImpl })).status, "unavailable");
  assert.equal(requests.length, 1);
  assert.equal(writes.length, writeCount);

  const unsafeResult = await reconcileHeartCheckInference(72, {
    storage,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        current_inference: { inference_id: "active_energised" },
        heart_rate_bpm: 72,
      }),
    }),
  });
  assert.equal(unsafeResult.status, "failed");
  assert.equal(unsafeResult.inference, null);
  assert.equal(writes.length, writeCount);
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
