import { MANTRA_POLICY, mantraTarget } from "./mantra-policy-v1.js?v=cad75843f590";

// Enabled by default; the optional control lives in the Mantra viewer only.
const preferenceKey = "iamSubaudibleMantraV2";
let enabled = true;
try { enabled = localStorage.getItem(preferenceKey) !== "off"; } catch { /* session-only */ }
const buttons = Array.from(document.querySelectorAll("[data-subaudible-mantra-toggle]"));
const source = new URL("../a s s e t s/quantum-tree-mantra-v1.m4a", import.meta.url).href;
let platformEnabled = false;
let settingsAt = 0;
let settingsPending = false;
let settingsError = false;
let audio = null;
let context = null;
let gain = null;
let output = null;
let outputSamples = null;
let mediaSource = null;
let activeMedia = null;
let mediaTime = -1;
let advancedAt = 0;
let measuredContextTime = -1;
let measuredAt = 0;
let programmeSince = 0;
let lastTick = performance.now();
let targetGain = 0;
let status = "settings_loading";
let fault = "";
let retryAt = 0;
let pendingPlay = false;
let exposureSeconds = 0;
let stopped = false;
let interval = 0;
let lastMaster = false;
let programmePlaying = false;
let speechRms = 0;
let programmeSource = "none";
let audioTime = -1;
let audioAdvancedAt = 0;
let outputRms = 0;

function silence(reason, pause = true) {
  targetGain = 0;
  status = reason;
  if (gain && context) {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);
  }
  if (pause) {
    programmeSince = 0;
    if (audio && !audio.paused) audio.pause();
  }
}

async function loadSettings() {
  if (settingsPending || stopped) return;
  settingsPending = true;
  try {
    const response = await fetch(new URL("../api/quantum-tree-settings.php", import.meta.url), {
      cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("Settings unavailable");
    const settings = await response.json();
    if (typeof settings.mantra_enabled !== "boolean") throw new Error("Invalid mantra settings");
    platformEnabled = settings.mantra_enabled;
    settingsAt = performance.now();
    settingsError = false;
  } catch {
    settingsError = true;
    platformEnabled = false;
  } finally {
    settingsPending = false;
    if (!platformEnabled) silence(settingsError ? "settings_error" : "platform_off");
  }
}

function prepareAudio() {
  if (audio || stopped || !enabled || !platformEnabled || document.hidden || fault === "unsupported") return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) { fault = "unsupported"; return; }
  try {
    context = new AudioContextClass();
    gain = context.createGain();
    gain.gain.value = 0;
    output = context.createAnalyser();
    output.fftSize = 1024;
    outputSamples = new Float32Array(output.fftSize);
    gain.connect(output);
    output.connect(context.destination);
    audio = new Audio();
    audio.muted = true;
    audio.loop = true;
    audio.preload = "auto";
    audio.playsInline = true;
    mediaSource = context.createMediaElementSource(audio);
    mediaSource.connect(gain);
    audio.src = source;
    audio.muted = false; // Only after the zero-gain route exists (also on iOS).
    audio.addEventListener("error", () => { fault = "asset_error"; silence(fault); });
  } catch {
    fault = "unsupported";
    silence(fault);
    if (audio) audio.muted = true;
  }
}

function arm() {
  if (stopped || !enabled || !platformEnabled) return;
  prepareAudio();
  if (fault === "playback_blocked") { fault = ""; retryAt = 0; }
  context?.resume().then(() => { if (fault === "browser_blocked") fault = ""; })
    .catch(() => { fault = "browser_blocked"; silence(fault); });
}

function diagnostics() {
  const currentGain = context?.state === "running" ? (gain?.gain.value || 0) : 0;
  const clockAdvancing = Boolean(audio && !audio.paused && audioAdvancedAt > 0
    && performance.now() - audioAdvancedAt < 180 && context?.state === "running");
  return { policy: MANTRA_POLICY.version, enabled, platformEnabled,
    masterEnabled: lastMaster, status: enabled && lastMaster && platformEnabled ? fault || status : status, targetGain, currentGain,
    programmePlaying, programmeSource, programmeTime: Math.max(0, mediaTime), speechRms,
    outputRms, outputVerified: currentGain > 0 && outputRms > 1e-9 && clockAdvancing,
    clockAdvancing, quantumGainRatio: MANTRA_POLICY.quantumGainRatio,
    readyState: audio?.readyState || 0, currentTime: audio?.currentTime || 0,
    duration: Number.isFinite(audio?.duration) ? audio.duration : 0,
    playing: Boolean(audio && !audio.paused), contextState: context?.state || "unavailable",
    exposureSeconds, studyAssignment: "not_integrated" };
}

function tick() {
  const now = performance.now();
  const elapsed = Math.max(0, Math.min(0.08, (now - lastTick) / 1000));
  lastTick = now;
  outputRms = 0;
  if (output && context?.state === "running") {
    output.getFloatTimeDomainData(outputSamples);
    outputRms = Math.sqrt(outputSamples.reduce((sum, value) => sum + value * value, 0) / outputSamples.length);
  }
  if (audio && audio.currentTime !== audioTime) {
    if (audioTime >= 0) audioAdvancedAt = now;
    audioTime = audio.currentTime;
  }
  if (diagnostics().outputVerified) exposureSeconds += elapsed;
  const programme = window.IAMQuantumTree?.getMantraProgrammeState?.();
  lastMaster = Boolean(programme?.enabled);
  programmeSource = programme?.source || "none";
  const media = programme?.media;
  if (media !== activeMedia) {
    silence("programme_change");
    activeMedia = media;
    mediaTime = -1;
    advancedAt = measuredAt = 0;
    measuredContextTime = -1;
  }
  if (media && media.currentTime !== mediaTime) {
    if (mediaTime >= 0) advancedAt = now;
    mediaTime = media.currentTime;
  }
  const measurement = programme?.measurement;
  if (measurement && measurement.contextTime !== measuredContextTime) {
    measuredContextTime = measurement.contextTime;
    measuredAt = now;
  }
  const advancing = advancedAt > 0 && now - advancedAt < 180;
  programmePlaying = Boolean(media && !media.paused && !media.ended && advancing);
  speechRms = Number.isFinite(measurement?.speechRms) ? measurement.speechRms * (media?.volume || 0) : 0;
  const unavailable = document.hidden ? "page_hidden"
    : settingsError ? "settings_error" : !settingsAt ? "settings_loading"
    : now - settingsAt >= 30000 ? "settings_stale" : !platformEnabled ? "platform_off"
    : !enabled ? "user_off" : !lastMaster ? "sound_off" : !media ? "no_programme"
    : media.error ? "programme_error" : media.ended ? "programme_ended"
    : media.paused ? "programme_paused" : media.muted || media.volume <= 0 ? "programme_muted"
    : media.seeking ? "programme_seeking" : media.readyState < 3 || media.dataset?.streamFreezeState ? "programme_buffering"
    : !advancing ? "programme_not_advancing" : !measurement ? "analysis_unavailable"
    : now - measuredAt >= 80 ? "analysis_stale"
    : document.body.classList.contains("jbh-ethics-open") ? "consent_open" : "";
  if (unavailable) { silence(unavailable); return; }
  // Qualify continuous programme playback once, not 400 ms of unbroken loudness.
  // Brief musical dips close gain immediately without restarting the decoded loop.
  if (!programmeSince) programmeSince = now;
  const target = mantraTarget({ enabled, platformEnabled, masterEnabled: lastMaster,
    available: true, advancing, speechRms, quantumGain: programme?.quantumGain,
    outputMultiplier: programme?.outputMultiplier });
  if (!target) { silence(speechRms <= MANTRA_POLICY.speechFloor ? "quiet_mask" : "quantum_gain_zero", false); return; }
  if (now - programmeSince < MANTRA_POLICY.openAfterMs) { status = "programme_settling"; return; }
  if (!audio) prepareAudio();
  if (fault) { silence(fault); return; }
  if (!audio || !gain || context?.state !== "running") { silence("browser_blocked"); return; }
  if (audio.paused) {
    status = "mantra_starting";
    if (now > retryAt && !pendingPlay) {
      retryAt = now + 1500;
      pendingPlay = true;
      audio.play().catch(() => { fault = "playback_blocked"; silence(fault); })
        .finally(() => { pendingPlay = false; });
    }
    return;
  }
  if (audio.readyState < 3) { silence("mantra_loading", false); return; }
  const time = context.currentTime;
  const current = Math.min(target, Math.max(0, gain.gain.value));
  targetGain = target > current ? current + (target - current) * 0.05 : target;
  gain.gain.cancelScheduledValues(time);
  gain.gain.setValueAtTime(Math.min(current, targetGain), time);
  gain.gain.linearRampToValueAtTime(targetGain, time + 0.005);
  gain.gain.setValueAtTime(targetGain, time + 0.05);
  gain.gain.linearRampToValueAtTime(0, time + MANTRA_POLICY.measurementLeaseMs / 1000);
  status = "mixing";
}

document.addEventListener("pointerdown", (event) => { if (event.isTrusted) arm(); }, { passive: true });
document.addEventListener("keydown", (event) => { if (event.isTrusted) arm(); });
document.addEventListener("play", (event) => { if (event.target !== audio) arm(); }, true);
for (const name of ["pause", "waiting", "stalled", "seeking", "ended", "emptied", "volumechange"]) {
  document.addEventListener(name, (event) => { if (event.target === activeMedia) silence(`programme_${name}`, name !== "volumechange" || activeMedia.muted || activeMedia.volume <= 0); }, true);
}
window.addEventListener("iam:sound-master-change", () => {
  lastMaster = Boolean(window.IAMQuantumTree?.diagnostics?.().enabled);
  if (!lastMaster) silence("sound_off");
});
document.addEventListener("visibilitychange", () => {
  silence("page_hidden");
  if (!document.hidden) { loadSettings(); arm(); }
});
window.addEventListener("pagehide", () => {
  silence("page_hidden"); stopped = true; clearInterval(interval);
  context?.suspend().catch(() => {});
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) { stopped = false; loadSettings(); interval = setInterval(tick, 20); }
});
function syncPreference() {
  buttons.forEach(button => {
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", `Turn sub-audible mantra ${enabled ? "off" : "on"}`);
    button.querySelector("b").textContent = enabled ? "ON" : "OFF";
  });
}
function setEnabled(value) {
  enabled = Boolean(value);
  try { localStorage.setItem(preferenceKey, enabled ? "on" : "off"); } catch { /* session-only */ }
  if (!enabled) silence("user_off"); else arm();
  syncPreference();
}
buttons.forEach(button => button.addEventListener("click", () => setEnabled(!enabled)));
window.addEventListener("storage", event => {
  if (event.key !== preferenceKey) return;
  enabled = event.newValue !== "off";
  if (!enabled) silence("user_off");
  syncPreference();
});
syncPreference();
window.IAMSubaudibleMantra = Object.freeze({ setEnabled, reloadSettings: loadSettings, diagnostics });
// The optional Mantra panel reads the signal after gain, never a decorative animation.
const signal = document.querySelector("[data-mantra-signal]");
const wave = signal?.querySelector("canvas");
const pen = wave?.getContext("2d");
const readout = signal?.querySelector("[data-mantra-signal-readout]");
const signalLabel = signal?.querySelector("[data-mantra-signal-state]");
const signalNames = {
  user_off: "Off", quiet_mask: "Masking low", quantum_gain_zero: "Layer gain zero", sound_off: "Sound off",
  platform_off: "Disabled", programme_paused: "Music paused", programme_ended: "Music ended",
  programme_muted: "Music muted", programme_seeking: "Seeking", programme_buffering: "Buffering",
  programme_not_advancing: "Music stopped", programme_settling: "Starting", programme_change: "Changing music",
  no_programme: "No programme", page_hidden: "Tab hidden", consent_open: "Paused",
  mantra_loading: "Loading", mantra_starting: "Starting", settings_loading: "Loading",
  analysis_unavailable: "Analysis unavailable", analysis_stale: "Analysis stopped",
  browser_blocked: "Audio blocked", playback_blocked: "Audio blocked", asset_error: "File error",
  unsupported: "Audio unavailable", settings_error: "Settings unavailable", settings_stale: "Settings expired",
  programme_error: "Music error",
};
function drawSignal() {
  requestAnimationFrame(drawSignal);
  if (!signal || !pen || !document.body.classList.contains("mantra-sampler-open")) return;
  const state = diagnostics();
  const active = state.outputVerified;
  const failed = /error|unavailable|stale|blocked|unsupported/.test(state.status);
  signal.dataset.state = active ? "active" : failed ? "fault" : "closed";
  signalLabel.textContent = active ? "Active" : state.status === "mixing" ? "No output" : signalNames[state.status] || "Paused";
  const detail = `Sub-audible mantra: ${signalLabel.textContent}. Music ${state.programmePlaying ? "playing" : "stopped"}. Mantra ${state.currentTime.toFixed(1)} seconds; output ${active ? (20 * Math.log10(state.outputRms)).toFixed(1) + " dBFS RMS" : "closed"}.`;
  readout.setAttribute("aria-label", detail);
  readout.title = detail;
  pen.clearRect(0, 0, wave.width, wave.height);
  pen.strokeStyle = active ? "rgba(152,217,174,.8)" : "rgba(255,255,255,.25)";
  pen.lineWidth = 1.5;
  pen.beginPath();
  // Magnify the measured shape for visibility; this is an activity trace, not a loudness scale.
  const peak = active ? outputSamples.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0) : 0;
  for (let x = 0; x < wave.width; x++) {
    const sample = peak > 0 ? outputSamples[Math.floor(x * outputSamples.length / wave.width)] / peak : 0;
    const y = wave.height / 2 - sample * (wave.height / 2 - 3);
    if (x === 0) pen.moveTo(x, y); else pen.lineTo(x, y);
  }
  pen.stroke();
}
requestAnimationFrame(drawSignal);

loadSettings();
interval = setInterval(tick, 20);
setInterval(() => { if (!document.hidden && !stopped) loadSettings(); }, 10000);
