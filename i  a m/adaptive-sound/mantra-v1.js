import { MANTRA_POLICY, mantraTarget } from "./mantra-policy-v1.js?v=3c2b6cb558bb";

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
let cachedSource = "";
let assetPending = null;
let assetBytes = 0;
let assetReady = false;
let unlockSource = "";
let context = null;
let gain = null;
let output = null;
let outputSamples = null;
let mediaSource = null;
let activeMedia = null;
let mediaTime = -1;
let advancedAt = 0;
let lastTick = performance.now();
let targetGain = 0;
let status = "settings_loading";
let fault = "";
let pendingPlay = false;
let exposureSeconds = 0;
let stopped = false;
let interval = 0;
let lastMaster = false;
let programmePlaying = false;
let quantumGain = 0;
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
    if (platformEnabled) loadAudioAsset();
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

// Retain the compressed AAC file locally before using it for playback. The
// media decoder reads a complete Blob, so subsequent loops need no network.
function loadAudioAsset() {
  if (cachedSource || assetPending || stopped) return;
  assetPending = fetch(source, { cache: "force-cache", signal: AbortSignal.timeout(30000) })
    .then(response => { if (!response.ok) throw new Error("Mantra request failed"); return response.blob(); })
    .then(blob => {
      if (!blob.size) throw new Error("Empty mantra file");
      assetBytes = blob.size;
      cachedSource = URL.createObjectURL(blob);
      if (fault === "asset_error") fault = "";
      if (audio) attachCachedAsset();
    }).catch(() => { fault = "asset_error"; silence(fault); })
    .finally(() => { assetPending = null; });
}
function attachCachedAsset() {
  if (!audio || !cachedSource || assetReady) return;
  silence("mantra_loading", false);
  audio.src = cachedSource;
  assetReady = true;
  audio.load();
  if (unlockSource) { URL.revokeObjectURL(unlockSource); unlockSource = ""; }
}
function gestureUnlockSource() {
  // A short local silence unlocks this same media element if the real file is
  // still downloading at the first gesture. Gain stays zero until AAC is ready.
  const bytes = new ArrayBuffer(44 + 9600), view = new DataView(bytes);
  const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, bytes.byteLength - 8, true); text(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 48000, true); view.setUint32(28, 96000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, "data"); view.setUint32(40, 9600, true);
  unlockSource = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
  return unlockSource;
}
function startAudio() {
  if (!audio?.paused || pendingPlay) return;
  pendingPlay = true;
  audio.play().catch(error => {
    // A source change or explicit stop can abort an in-flight play request.
    if (error?.name === "AbortError") return;
    fault = error?.name === "NotAllowedError" ? "playback_blocked" : "asset_error";
    silence(fault);
  }).finally(() => { pendingPlay = false; });
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
    audio.src = cachedSource || gestureUnlockSource();
    assetReady = Boolean(cachedSource);
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
  window.IAMEMDR?.resumeProgrammeAnalysis?.(true);
  if (fault === "playback_blocked") { fault = ""; }
  startAudio();
  context?.resume().then(() => { if (fault === "browser_blocked") fault = ""; })
    .catch(() => { fault = "browser_blocked"; silence(fault); });
}

function diagnostics() {
  const currentGain = context?.state === "running" ? (gain?.gain.value || 0) : 0;
  const clockAdvancing = Boolean(audio && !audio.paused && audioAdvancedAt > 0
    && performance.now() - audioAdvancedAt < 180 && context?.state === "running");
  return { policy: MANTRA_POLICY.version, enabled, platformEnabled,
    masterEnabled: lastMaster, status: enabled && lastMaster && platformEnabled ? fault || status : status, targetGain, currentGain,
    programmePlaying, programmeSource, programmeTime: Math.max(0, mediaTime), quantumGain,
    outputRms, outputVerified: currentGain > 0 && outputRms > 1e-9 && clockAdvancing,
    clockAdvancing, quantumGainRatio: MANTRA_POLICY.quantumGainRatio,
    readyState: audio?.readyState || 0, currentTime: audio?.currentTime || 0,
    duration: Number.isFinite(audio?.duration) ? audio.duration : 0,
    playing: Boolean(audio && !audio.paused), contextState: context?.state || "unavailable",
    assetReady, assetBytes, delivery: assetReady ? "complete_blob" : "preparing",
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
    advancedAt = 0;
  }
  if (media && media.currentTime !== mediaTime) {
    if (mediaTime >= 0) advancedAt = now;
    mediaTime = media.currentTime;
  }
  quantumGain = Number.isFinite(programme?.quantumGain) ? programme.quantumGain : 0;
  const advancing = advancedAt > 0 && now - advancedAt < 180;
  programmePlaying = Boolean(media && !media.paused && !media.ended && advancing);
  const unavailable = document.hidden ? "page_hidden"
    : settingsError ? "settings_error" : !settingsAt ? "settings_loading"
    : now - settingsAt >= 30000 ? "settings_stale" : !platformEnabled ? "platform_off"
    : !enabled ? "user_off" : !lastMaster ? "sound_off" : !media ? "no_programme"
    : media.error ? "programme_error" : media.ended ? "programme_ended"
    : media.paused ? "programme_paused" : media.muted || media.volume <= 0 ? "programme_muted"
    : media.seeking ? "programme_seeking" : media.readyState < 2 ? "programme_buffering"
    : !advancing ? "programme_not_advancing"
    : document.body.classList.contains("jbh-ethics-open") ? "consent_open" : "";
  if (unavailable) {
    const temporary = ["programme_buffering", "programme_seeking", "programme_not_advancing"].includes(unavailable);
    silence(unavailable, !temporary); return;
  }
  const target = mantraTarget({ enabled, platformEnabled, masterEnabled: lastMaster,
    available: true, advancing, quantumGain });
  if (!target) { silence("quantum_gain_zero", false); return; }
  if (!audio) prepareAudio();
  if (fault) { silence(fault); return; }
  if (!audio || !gain || context?.state !== "running") { silence("browser_blocked"); return; }
  if (!assetReady) { silence("mantra_loading", false); return; }
  if (audio.paused) {
    status = "mantra_starting";
    startAudio();
    return;
  }
  if (audio.readyState < 3) { silence("mantra_loading", false); return; }
  const time = context.currentTime;
  const current = Math.min(target, Math.max(0, gain.gain.value));
  // Quantum Tree has already applied its attack/release curve. Do not apply a second one.
  targetGain = target;
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
  document.addEventListener(name, event => {
    if (event.target !== activeMedia) return;
    if (name === "volumechange" && !activeMedia.muted && activeMedia.volume > 0) return;
    // Download/freeze flags can fire with buffered audio still advancing.
    // The clock/readiness check in tick decides whether output must duck.
    if (name === "stalled" || name === "waiting") return;
    silence(`programme_${name}`, name !== "seeking");
  }, true);
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
let faultSince = 0;
function signalText(state, now) {
  if (!state.enabled || !state.platformEnabled || !state.masterEnabled) return "Off";
  const failed = /error|unavailable|stale|blocked|unsupported/.test(state.status);
  if (failed) { if (!faultSince) faultSince = now; } else faultSince = 0;
  if (failed && now - faultSince > 1500) return /blocked/.test(state.status) ? "Tap to resume" : "Unable to load";
  return state.assetReady ? "Following music" : "Preparing";
}
function drawSignal() {
  requestAnimationFrame(drawSignal);
  if (!signal || !pen || !document.body.classList.contains("mantra-sampler-open")) return;
  const state = diagnostics();
  const active = state.outputVerified;
  const failed = /error|unavailable|stale|blocked|unsupported/.test(state.status);
  signal.dataset.state = active ? "active" : failed ? "fault" : "closed";
  signalLabel.textContent = signalText(state, performance.now());
  const detail = `Sub-audible mantra: ${signalLabel.textContent}. Music ${state.programmePlaying ? "playing" : "stopped"}. Mantra ${state.currentTime.toFixed(1)} seconds; output ${active ? (20 * Math.log10(state.outputRms)).toFixed(1) + " dBFS RMS" : "quiet"}.`;
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
