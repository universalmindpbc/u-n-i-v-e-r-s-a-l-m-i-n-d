import { MANTRA_POLICY, mantraTarget } from "./mantra-policy-v1.js?v=1";

const buttons = Array.from(document.querySelectorAll("[data-subaudible-mantra-toggle]"));
const labels = Array.from(document.querySelectorAll("[data-subaudible-mantra-state]"));
const preferenceKey = "iamSubaudibleMantra";
const source = new URL("../a s s e t s/quantum-tree-mantra-v1.m4a", import.meta.url).href;
let enabled = true;
try { enabled = localStorage.getItem(preferenceKey) !== "off"; } catch { /* session-only */ }
let platformEnabled = false;
let settingsAt = 0;
let settingsPending = false;
let audio = null;
let context = null;
let gain = null;
let mediaSource = null;
let activeMedia = null;
let mediaTime = -1;
let advancedAt = 0;
let measuredContextTime = -1;
let measuredAt = 0;
let maskingSince = 0;
let lastTick = performance.now();
let targetGain = 0;
let status = "waiting";
let retryAt = 0;
let pendingPlay = false;
let exposureSeconds = 0;
let stopped = false;
let interval = 0;
let lastMaster = null;

function sync() {
  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", `Turn sub-audible mantra ${enabled ? "off" : "on"}`);
    button.querySelector("b").textContent = enabled ? "ON" : "OFF";
  });
  const text = !enabled ? "Off" : !platformEnabled ? "Unavailable"
    : !lastMaster ? "Sound is off" : status === "masked" ? "On · beneath programme" : "On · waiting for music";
  labels.forEach((label) => { if (label.textContent !== text) label.textContent = text; });
}

function silence(reason) {
  targetGain = 0;
  maskingSince = 0;
  status = reason;
  if (gain && context) {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);
  }
  if (audio && !audio.paused) audio.pause();
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
  } catch {
    platformEnabled = false;
  } finally {
    settingsPending = false;
    if (!platformEnabled) silence("platform_off");
    sync();
  }
}

function prepareAudio() {
  if (audio || stopped || !enabled || !platformEnabled || document.hidden) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    context = new AudioContextClass();
    gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    audio = new Audio();
    audio.muted = true;
    audio.loop = true;
    audio.preload = "auto";
    audio.playsInline = true;
    mediaSource = context.createMediaElementSource(audio);
    mediaSource.connect(gain);
    audio.src = source;
    audio.muted = false; // Only after the zero-gain route exists (also on iOS).
    audio.addEventListener("error", () => silence("asset_error"));
  } catch {
    silence("unsupported");
    if (audio) audio.muted = true;
  }
}

function arm() {
  if (stopped || !enabled || !platformEnabled) return;
  prepareAudio();
  context?.resume().catch(() => silence("suspended"));
}

function setEnabled(value) {
  enabled = Boolean(value);
  try { localStorage.setItem(preferenceKey, enabled ? "on" : "off"); } catch { /* session-only */ }
  if (!enabled) silence("user_off");
  else arm();
  sync();
}

function tick() {
  const now = performance.now();
  const elapsed = Math.max(0, Math.min(0.08, (now - lastTick) / 1000));
  lastTick = now;
  if (targetGain > 0 && audio && !audio.paused && context?.state === "running") exposureSeconds += elapsed;
  const programme = window.IAMQuantumTree?.getMantraProgrammeState?.();
  lastMaster = Boolean(programme?.enabled);
  const media = programme?.media;
  if (media !== activeMedia) {
    silence("programme_change");
    activeMedia = media;
    mediaTime = -1;
    advancedAt = 0;
    measuredAt = 0;
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
  const available = Boolean(media && !media.paused && !media.muted && !media.ended
    && !media.seeking && !media.error && media.readyState >= 3 && media.volume > 0
    && !media.dataset?.streamFreezeState && !document.hidden
    && now - settingsAt < 30000 && measurement && now - measuredAt < 80
    && !document.body.classList.contains("jbh-ethics-open"));
  const target = mantraTarget({
    enabled, platformEnabled, masterEnabled: lastMaster, available,
    advancing: advancedAt > 0 && now - advancedAt < 180,
    speechRms: measurement?.speechRms * (media?.volume || 0),
    quantumGain: programme?.quantumGain,
    outputMultiplier: programme?.outputMultiplier,
  });
  if (!target) {
    silence("unmasked");
    sync();
    return;
  }
  if (!maskingSince) maskingSince = now;
  if (now - maskingSince < MANTRA_POLICY.openAfterMs) return;
  if (!audio) prepareAudio();
  if (!audio || !gain || context?.state !== "running") { sync(); return; }
  if (audio.paused) {
    if (now > retryAt && !pendingPlay) {
      retryAt = now + 1500;
      pendingPlay = true;
      // No gain is opened until decoding/play succeeds and masking is rechecked.
      audio.play().catch(() => silence("playback_blocked")).finally(() => { pendingPlay = false; });
    }
    return;
  }
  if (audio.readyState < 3 || audio.error) { silence("loading"); return; }
  const time = context.currentTime;
  const current = Math.min(target, Math.max(0, gain.gain.value));
  targetGain = target > current ? current + (target - current) * 0.05 : target;
  gain.gain.cancelScheduledValues(time);
  gain.gain.setValueAtTime(Math.min(current, targetGain), time);
  gain.gain.linearRampToValueAtTime(targetGain, time + 0.005);
  // A short audio-clock lease closes even if the UI/main thread stops running.
  gain.gain.setValueAtTime(targetGain, time + 0.05);
  gain.gain.linearRampToValueAtTime(0, time + MANTRA_POLICY.measurementLeaseMs / 1000);
  status = "masked";
  sync();
}

buttons.forEach((button) => button.addEventListener("click", () => setEnabled(!enabled)));
document.addEventListener("pointerdown", (event) => { if (event.isTrusted) arm(); }, { passive: true });
document.addEventListener("keydown", (event) => { if (event.isTrusted) arm(); });
document.addEventListener("play", (event) => {
  if (event.target !== audio) arm();
}, true);
for (const name of ["pause", "waiting", "stalled", "seeking", "ended", "emptied", "volumechange"]) {
  document.addEventListener(name, (event) => {
    if (event.target === activeMedia) silence(`programme_${name}`);
  }, true);
}
window.addEventListener("iam:sound-master-change", () => {
  lastMaster = Boolean(window.IAMQuantumTree?.diagnostics?.().enabled);
  if (!lastMaster) silence("master_off");
  sync();
});
window.addEventListener("storage", (event) => {
  if (event.key === preferenceKey) {
    enabled = event.newValue !== "off";
    if (!enabled) silence("user_off");
    sync();
  }
});
document.addEventListener("visibilitychange", () => {
  silence("visibility_change");
  if (!document.hidden) loadSettings();
});
window.addEventListener("pagehide", () => {
  silence("page_hidden");
  stopped = true;
  clearInterval(interval);
  context?.suspend().catch(() => {});
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) { stopped = false; loadSettings(); interval = setInterval(tick, 20); }
});
window.IAMSubaudibleMantra = Object.freeze({
  setEnabled,
  reloadSettings: loadSettings,
  diagnostics: () => ({ policy: MANTRA_POLICY.version, enabled, platformEnabled,
    masterEnabled: lastMaster, status, targetGain,
    currentGain: context?.state === "running" ? (gain?.gain.value || 0) : 0,
    quantumGainRatio: MANTRA_POLICY.quantumGainRatio,
    readyState: audio?.readyState || 0, currentTime: audio?.currentTime || 0,
    duration: audio?.duration || 0, playing: Boolean(audio && !audio.paused),
    contextState: context?.state || "unavailable", exposureSeconds,
    studyAssignment: "not_integrated" }),
});
loadSettings();
interval = setInterval(tick, 20);
setInterval(() => { if (!document.hidden && !stopped) loadSettings(); }, 10000);
sync();
