import {
  PROFILE_CANDIDATES,
  createCandidateCondition,
} from "./profiles-v1.js?v=3f39020ebeab";

const PROCESSOR_NAME = "iam-adaptive-sound-v1";
const PROFILE_META = Object.freeze({
  sleep_delta_80_v1: {
    label: "DELTA / SLEEP",
    shortLabel: "SLEEP",
    noiseLabel: "BROWN NOISE",
    noiseDetail: "0.01% brown noise · 0.01% silence reserve",
  },
  mindfulness_theta_80_v1: {
    label: "THETA / MINDFULNESS",
    shortLabel: "MINDFULNESS",
    noiseLabel: "WHITE NOISE",
    noiseDetail: "0.01% white noise · 0.01% silence reserve",
  },
  calm_alpha_80_v1: {
    label: "ALPHA / CALM",
    shortLabel: "CALM",
    noiseLabel: "PINK NOISE",
    noiseDetail: "0.01% pink noise · 0.01% silence reserve",
  },
  inspiration_gamma_80_v1: {
    label: "GAMMA / INSPIRATION",
    shortLabel: "INSPIRATION",
    noiseLabel: "WHITE · PINK · BROWN",
    noiseDetail: "0.01% total noise, equal power split · 0.01% silence reserve",
  },
});
const CARRIER_SET = Object.freeze([111, 222, 444, 555, 999]);
const LANE_IDS = Object.freeze(["delta", "theta", "alpha", "gamma"]);
const DEFAULT_INTENSITY = 35;
const TECHNICAL_OUTPUT_GAIN = 0.08;

const panel = document.querySelector("[data-adaptive-sound-panel]");
const consoleElement = panel?.querySelector("[data-adaptive-sound-console]");
const soundButton = document.querySelector("[data-emdr-sound-research]");

if (panel && consoleElement && soundButton) initializeAdaptiveSoundPanel();

function initializeAdaptiveSoundPanel() {
  const closeButtons = Array.from(panel.querySelectorAll("[data-adaptive-sound-close]"));
  const masterButton = panel.querySelector("[data-adaptive-sound-master]");
  const masterLabel = panel.querySelector("[data-adaptive-sound-master-label]");
  const engineLed = panel.querySelector("[data-adaptive-sound-engine-led]");
  const status = panel.querySelector("[data-adaptive-sound-status]");
  const conditionReadout = panel.querySelector("[data-adaptive-sound-condition]");
  const profileLabel = panel.querySelector("[data-adaptive-sound-profile-label]");
  const profileButtons = Array.from(panel.querySelectorAll("[data-adaptive-profile]"));
  const synthToggle = panel.querySelector("[data-adaptive-sound-toggle]");
  const synthToggleLabel = panel.querySelector("[data-adaptive-sound-toggle-label]");
  const synthToggleSubLabel = synthToggle?.querySelector("small");
  const laneButtons = Array.from(panel.querySelectorAll("[data-adaptive-lane-toggle]"));
  const laneWeightReadouts = Object.fromEntries(LANE_IDS.map((laneId) => [
    laneId,
    panel.querySelector(`[data-adaptive-lane-weight="${laneId}"]`),
  ]));
  const laneMeters = Object.fromEntries(LANE_IDS.map((laneId) => [
    laneId,
    panel.querySelector(`[data-adaptive-lane-meter="${laneId}"]`),
  ]));
  const carrierButtons = Array.from(panel.querySelectorAll("[data-adaptive-carrier]"));
  const carrierReadout = panel.querySelector("[data-adaptive-carrier-readout]");
  const intensity = panel.querySelector("[data-adaptive-intensity]");
  const intensityReadout = panel.querySelector("[data-adaptive-intensity-readout]");
  const adaptiveMeter = panel.querySelector("[data-adaptive-output-meter]");
  const quantumMeter = panel.querySelector("[data-quantum-tree-panel-meter]");
  const quantumState = panel.querySelector("[data-quantum-tree-panel-state]");
  const noiseLabel = panel.querySelector("[data-adaptive-noise-label]");
  const noiseDetail = panel.querySelector("[data-adaptive-noise-detail]");
  const auditionPanel = panel.querySelector("[data-adaptive-sound-audition]");
  const masteringButtons = Array.from(panel.querySelectorAll("[data-adaptive-mastering]"));
  const envelopeButtons = Array.from(panel.querySelectorAll("[data-adaptive-envelope]"));
  const lowpassButtons = Array.from(panel.querySelectorAll("[data-adaptive-lowpass]"));
  const scienceLink = panel.querySelector('a[href="science.html#research-sound"]');
  const storedProfile = localStorage.getItem("iamAdaptiveSoundProfile") || "";
  const storedCarrier = Number(localStorage.getItem("iamAdaptiveSoundCarrier"));
  const storedIntensity = Number(localStorage.getItem("iamAdaptiveSoundIntensity"));

  const state = {
    open: false,
    previousFocus: null,
    masterEnabled: localStorage.getItem("iamSoundResearchLayer") !== "off",
    synthEnabled: localStorage.getItem("iamAdaptiveSoundLayer") === "on",
    profileId: PROFILE_META[storedProfile] ? storedProfile : "",
    carrierHz: CARRIER_SET.includes(storedCarrier) ? storedCarrier : 111,
    intensity: Number.isFinite(storedIntensity) ? clamp(storedIntensity, 0, 100) : DEFAULT_INTENSITY,
    masteringCondition: "engineering_on",
    envelopeCandidateId: "raised_cosine_50_depth_80_v1",
    lowpassCandidateId: "butterworth_12db_minimum_phase_v1",
    enabledLanes: Object.fromEntries(LANE_IDS.map((laneId) => [laneId, true])),
    context: null,
    workletLoaded: false,
    route: null,
    generation: 0,
    quantumTimer: 0,
    lastDiagnostics: null,
    lastError: "",
  };

  if (!state.profileId) state.synthEnabled = false;

  const soundLabEnabled = window.location.hostname === "staging.universalmind.tv"
    && new URLSearchParams(window.location.search).get("soundLab") === "1";
  if (auditionPanel) auditionPanel.hidden = !soundLabEnabled;

  soundButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openPanel();
  }, true);
  window.addEventListener("iam:adaptive-sound-open", openPanel);

  closeButtons.forEach((button) => button.addEventListener("click", () => closePanel(true)));
  masterButton?.addEventListener("click", () => setMasterEnabled(!state.masterEnabled));
  synthToggle?.addEventListener("click", () => setSynthEnabled(!state.synthEnabled));

  profileButtons.forEach((button) => button.addEventListener("click", async () => {
    const profileId = button.dataset.adaptiveProfile || "";
    if (!PROFILE_META[profileId] || !PROFILE_CANDIDATES[profileId]) return;
    state.profileId = profileId;
    state.enabledLanes = Object.fromEntries(LANE_IDS.map((laneId) => [laneId, true]));
    localStorage.setItem("iamAdaptiveSoundProfile", profileId);
    syncInterface();
    if (state.synthEnabled && state.masterEnabled) await rebuildEngine("profile_change");
  }));

  laneButtons.forEach((button) => button.addEventListener("click", () => {
    const laneId = button.dataset.adaptiveLaneToggle || "";
    if (!LANE_IDS.includes(laneId) || !state.profileId) return;
    state.enabledLanes[laneId] = !state.enabledLanes[laneId];
    state.route?.node?.port.postMessage({
      type: "set_lane_enabled",
      lane_id: laneId,
      enabled: state.enabledLanes[laneId],
    });
    syncInterface();
  }));

  carrierButtons.forEach((button) => button.addEventListener("click", async () => {
    const carrierHz = Number(button.dataset.adaptiveCarrier);
    if (!CARRIER_SET.includes(carrierHz) || carrierHz === state.carrierHz) return;
    state.carrierHz = carrierHz;
    localStorage.setItem("iamAdaptiveSoundCarrier", String(carrierHz));
    syncInterface();
    if (state.synthEnabled && state.masterEnabled) await rebuildEngine("carrier_change");
  }));

  intensity?.addEventListener("input", () => {
    state.intensity = clamp(Number(intensity.value), 0, 100);
    localStorage.setItem("iamAdaptiveSoundIntensity", String(state.intensity));
    setRouteGain(state.synthEnabled && state.masterEnabled ? state.intensity / 100 : 0, 0.08);
    syncInterface();
  });

  bindAuditionGroup(masteringButtons, "adaptiveMastering", (value) => {
    state.masteringCondition = value;
  });
  bindAuditionGroup(envelopeButtons, "adaptiveEnvelope", (value) => {
    state.envelopeCandidateId = value;
  });
  bindAuditionGroup(lowpassButtons, "adaptiveLowpass", (value) => {
    state.lowpassCandidateId = value;
  });

  function bindAuditionGroup(buttons, datasetKey, applyValue) {
    buttons.forEach((button) => button.addEventListener("click", async () => {
      const value = button.dataset[datasetKey];
      if (!value || button.getAttribute("aria-checked") === "true") return;
      buttons.forEach((candidate) => candidate.setAttribute("aria-checked", String(candidate === button)));
      applyValue(value);
      syncInterface();
      if (state.synthEnabled && state.masterEnabled) await rebuildEngine("audition_condition_change");
    }));
  }

  scienceLink?.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => null);
  });

  document.addEventListener("keydown", (event) => {
    if (!state.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel(true);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function openPanel() {
    if (state.open) return;
    state.open = true;
    state.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : soundButton;
    state.masterEnabled = window.IAMQuantumTree?.diagnostics?.().enabled
      ?? (localStorage.getItem("iamSoundResearchLayer") !== "off");
    panel.inert = false;
    panel.setAttribute("aria-hidden", "false");
    soundButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("iam-sound-panel-open");
    document.body.dataset.adaptiveSoundPanelOpen = "true";
    startQuantumMonitor();
    syncInterface();
    window.requestAnimationFrame(() => consoleElement.focus({ preventScroll: true }));
    if (state.synthEnabled && state.profileId && state.masterEnabled) rebuildEngine("panel_open");
  }

  function closePanel(restoreFocus = false) {
    if (!state.open) return;
    state.open = false;
    window.clearInterval(state.quantumTimer);
    state.quantumTimer = 0;
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    soundButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("iam-sound-panel-open");
    document.body.dataset.adaptiveSoundPanelOpen = "false";
    if (restoreFocus && state.previousFocus?.isConnected) state.previousFocus.focus({ preventScroll: true });
  }

  async function setMasterEnabled(enabled) {
    state.masterEnabled = Boolean(enabled);
    window.IAMQuantumTree?.setEnabled?.(state.masterEnabled);
    if (!state.masterEnabled) {
      state.route?.node?.port.postMessage({ type: "set_master_enabled", enabled: false });
      setRouteGain(0, 0.08);
    } else if (state.synthEnabled && state.profileId) {
      await rebuildEngine("master_on");
    }
    syncInterface();
  }

  async function setSynthEnabled(enabled) {
    if (enabled && !state.profileId) return;
    state.synthEnabled = Boolean(enabled);
    localStorage.setItem("iamAdaptiveSoundLayer", state.synthEnabled ? "on" : "off");
    if (state.synthEnabled && state.masterEnabled) {
      await rebuildEngine("adaptive_on");
    } else {
      state.route?.node?.port.postMessage({ type: "set_master_enabled", enabled: false });
      setRouteGain(0, 0.08);
      setStatus(state.profileId ? "ADAPTIVE STANDBY" : "SELECT A DIAMOND POINT", false);
    }
    syncInterface();
  }

  async function ensureAudioContext() {
    if (!state.context) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("This browser does not support the adaptive sound engine");
      state.context = new AudioContextConstructor({ latencyHint: "interactive" });
      document.body.dataset.adaptiveSoundSampleRate = String(state.context.sampleRate);
    }
    if (!state.workletLoaded) {
      await state.context.audioWorklet.addModule(new URL("./worklet-v1.js?v=6c2022e83bc0", import.meta.url));
      state.workletLoaded = true;
    }
    if (state.context.state !== "running") await state.context.resume();
    return state.context;
  }

  async function rebuildEngine(reason) {
    if (!state.profileId || !state.synthEnabled || !state.masterEnabled) return;
    const generation = ++state.generation;
    state.lastError = "";
    setStatus("TUNING SIGNAL PATH", false);
    try {
      const context = await ensureAudioContext();
      if (generation !== state.generation || !state.synthEnabled || !state.masterEnabled) return;
      const condition = createCandidateCondition({
        profileId: state.profileId,
        carrierHz: state.carrierHz,
        masteringCondition: state.masteringCondition,
        envelopeCandidateId: state.envelopeCandidateId,
        lowpassCandidateId: state.lowpassCandidateId,
        technicalOutputGain: TECHNICAL_OUTPUT_GAIN,
      });
      const node = new AudioWorkletNode(context, PROCESSOR_NAME, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        channelCount: 2,
        channelCountMode: "explicit",
        channelInterpretation: "speakers",
        processorOptions: { condition },
      });
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, context.currentTime);
      node.connect(gain).connect(context.destination);
      const route = { node, gain, generation, condition, reason };
      node.port.onmessage = (event) => handleProcessorMessage(event.data, route);
      const previousRoute = state.route;
      state.route = route;
      LANE_IDS.forEach((laneId) => {
        if (!state.enabledLanes[laneId]) node.port.postMessage({ type: "set_lane_enabled", lane_id: laneId, enabled: false });
      });
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(state.intensity / 100, now + 0.42);
      if (previousRoute) retireRoute(previousRoute, 0.46);
      document.body.dataset.adaptiveSoundEngine = "starting";
      document.body.dataset.adaptiveSoundProfile = state.profileId;
      document.body.dataset.adaptiveSoundCarrier = String(state.carrierHz);
      syncInterface();
    } catch (error) {
      failAdaptiveEngine(error);
    }
  }

  function retireRoute(route, seconds) {
    const context = state.context;
    if (!context || !route) return;
    const now = context.currentTime;
    route.node.port.postMessage({ type: "set_master_enabled", enabled: false });
    route.gain.gain.cancelScheduledValues(now);
    route.gain.gain.setValueAtTime(route.gain.gain.value, now);
    route.gain.gain.linearRampToValueAtTime(0, now + seconds);
    window.setTimeout(() => {
      try { route.node.disconnect(); } catch {}
      try { route.gain.disconnect(); } catch {}
      route.node.port.onmessage = null;
    }, Math.ceil((seconds + 0.15) * 1000));
  }

  function setRouteGain(value, seconds = 0.08) {
    if (!state.context || !state.route) return;
    const now = state.context.currentTime;
    state.route.gain.gain.cancelScheduledValues(now);
    state.route.gain.gain.setValueAtTime(state.route.gain.gain.value, now);
    state.route.gain.gain.linearRampToValueAtTime(clamp(value, 0, 1), now + seconds);
  }

  function handleProcessorMessage(message, route) {
    if (!message || route !== state.route) return;
    if (message.type === "ready") {
      document.body.dataset.adaptiveSoundEngine = "running";
      setStatus("LIVE SIGNAL", true);
      return;
    }
    if (message.type === "diagnostics") {
      state.lastDiagnostics = message;
      updateAdaptiveMeters(message);
      return;
    }
    if (message.type === "fatal_error") {
      failAdaptiveEngine(new Error(message.message || "Adaptive sound processor failed"));
    }
  }

  function failAdaptiveEngine(error) {
    state.lastError = String(error?.message || error || "Adaptive sound engine failed").slice(0, 180);
    document.body.dataset.adaptiveSoundEngine = "failed_safe";
    document.body.dataset.adaptiveSoundError = state.lastError;
    setRouteGain(0, 0.02);
    setStatus("ADAPTIVE OFF · QUANTUM TREE UNAFFECTED", false);
    syncInterface();
  }

  function updateAdaptiveMeters(message) {
    const diagnostics = message.diagnostics;
    if (!diagnostics) return;
    const meterPeak = Number(message.meter?.output_peak || 0) * (state.intensity / 100);
    setMeter(adaptiveMeter, dbMeter(meterPeak));
    for (const laneId of LANE_IDS) {
      const lane = diagnostics.lanes?.[laneId];
      const weightedLevel = state.enabledLanes[laneId]
        ? Number(lane?.envelope_gain || 0) * Math.sqrt(Number(lane?.power_weight || 0)) / Math.sqrt(0.8)
        : 0;
      laneMeters[laneId]?.style.setProperty("--lane-meter", String(clamp(weightedLevel, 0, 1)));
    }
  }

  function startQuantumMonitor() {
    window.clearInterval(state.quantumTimer);
    updateQuantumMonitor();
    state.quantumTimer = window.setInterval(updateQuantumMonitor, 250);
  }

  function updateQuantumMonitor() {
    const diagnostics = window.IAMQuantumTree?.diagnostics?.();
    if (!diagnostics) {
      if (quantumState) quantumState.textContent = "BASELINE READY";
      setMeter(quantumMeter, 0);
      return;
    }
    state.masterEnabled = Boolean(diagnostics.enabled);
    const relativeLevel = diagnostics.peakVolume > 0
      ? Number(diagnostics.currentVolume || 0) / Number(diagnostics.peakVolume)
      : 0;
    setMeter(quantumMeter, clamp(relativeLevel, 0, 1));
    if (quantumState) {
      quantumState.textContent = diagnostics.playing
        ? (diagnostics.continuityActive ? "CONTINUITY ACTIVE" : "SIGNAL ACTIVE")
        : (diagnostics.enabled ? "READY" : "MASTER OFF");
    }
    syncMasterInterface();
  }

  function syncInterface() {
    const profile = state.profileId ? PROFILE_CANDIDATES[state.profileId] : null;
    const meta = state.profileId ? PROFILE_META[state.profileId] : null;
    panel.dataset.profile = state.profileId;
    profileButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.adaptiveProfile === state.profileId)));
    for (const laneId of LANE_IDS) {
      const weight = profile?.diamond_power_weights?.[laneId];
      if (laneWeightReadouts[laneId]) laneWeightReadouts[laneId].textContent = Number.isFinite(weight) ? formatPercent(weight) : "—";
      const laneButton = laneButtons.find((button) => button.dataset.adaptiveLaneToggle === laneId);
      laneButton?.toggleAttribute("disabled", !profile);
      laneButton?.setAttribute("aria-pressed", String(Boolean(profile) && state.enabledLanes[laneId]));
      profileButtons.find((button) => button.dataset.adaptiveProfile?.includes(`_${laneId}_`))
        ?.classList.toggle("is-lane-off", Boolean(profile) && !state.enabledLanes[laneId]);
      if (!profile) laneMeters[laneId]?.style.setProperty("--lane-meter", "0");
    }
    if (profileLabel) profileLabel.textContent = meta?.label || "CHOOSE A PROFILE";
    if (noiseLabel) noiseLabel.textContent = meta?.noiseLabel || "PROFILE DEPENDENT";
    if (noiseDetail) noiseDetail.textContent = meta?.noiseDetail || "Delta brown · Theta white · Alpha pink · Gamma equal three-way split";
    synthToggle?.toggleAttribute("disabled", !profile);
    synthToggle?.setAttribute("aria-pressed", String(state.synthEnabled));
    if (synthToggleLabel) synthToggleLabel.textContent = !profile ? "SELECT" : (state.synthEnabled ? "LISTENING" : "START");
    if (synthToggleSubLabel) synthToggleSubLabel.textContent = !profile ? "TO BEGIN" : (state.synthEnabled ? "LIVE SIGNAL" : "ADAPTIVE SYNTH");
    carrierButtons.forEach((button) => button.setAttribute("aria-checked", String(Number(button.dataset.adaptiveCarrier) === state.carrierHz)));
    if (carrierReadout) carrierReadout.textContent = `${state.carrierHz} Hz`;
    if (intensity) {
      intensity.value = String(state.intensity);
      intensity.style.setProperty("--intensity", `${state.intensity}%`);
    }
    if (intensityReadout) intensityReadout.textContent = `${Math.round(state.intensity)}%`;
    syncMasterInterface();
    syncConditionReadout();
    if (!state.synthEnabled || !state.masterEnabled) {
      engineLed?.classList.remove("is-live");
      setMeter(adaptiveMeter, 0);
    }
  }

  function syncMasterInterface() {
    masterButton?.setAttribute("aria-pressed", String(state.masterEnabled));
    masterButton?.setAttribute("aria-label", state.masterEnabled
      ? "Turn the full Sound Research Layer off"
      : "Turn the full Sound Research Layer on");
    if (masterLabel) masterLabel.textContent = state.masterEnabled ? "ON" : "OFF";
    soundButton.setAttribute("aria-pressed", String(state.masterEnabled));
  }

  function syncConditionReadout() {
    if (!state.profileId) {
      if (conditionReadout) conditionReadout.textContent = "NO CONDITION LOADED";
      if (!state.lastError) setStatus("SELECT A DIAMOND POINT", false);
      return;
    }
    const path = state.masteringCondition === "engineering_on" ? "MASTERED" : "CLEAN REF";
    if (conditionReadout) conditionReadout.textContent = `${state.profileId.toUpperCase()} / ${state.carrierHz} HZ / ${path}`;
    if (!state.synthEnabled && !state.lastError) setStatus("ADAPTIVE READY", false);
  }

  function setStatus(value, live) {
    if (status) status.textContent = value;
    engineLed?.classList.toggle("is-live", Boolean(live));
  }

  function setMeter(element, value) {
    element?.parentElement?.style.setProperty("--meter", String(clamp(value, 0, 1)));
  }

  window.IAMAdaptiveSound = {
    open: openPanel,
    close: closePanel,
    diagnostics() {
      return {
        panel_open: state.open,
        master_enabled: state.masterEnabled,
        synth_enabled: state.synthEnabled,
        profile_id: state.profileId,
        carrier_hz: state.carrierHz,
        intensity_percent: state.intensity,
        mastering_condition: state.masteringCondition,
        envelope_candidate_id: state.envelopeCandidateId,
        lowpass_candidate_id: state.lowpassCandidateId,
        enabled_lanes: { ...state.enabledLanes },
        context_state: state.context?.state || "not_created",
        sample_rate: state.context?.sampleRate || null,
        engine_state: document.body.dataset.adaptiveSoundEngine || "not_started",
        last_error: state.lastError,
        output_layout: "mono_source_identical_dual_mono",
        quantum_tree: window.IAMQuantumTree?.diagnostics?.() || null,
      };
    },
  };

  panel.inert = true;
  document.body.dataset.adaptiveSoundPanel = "ready";
  document.body.dataset.adaptiveSoundPanelOpen = "false";
  syncInterface();
}

function formatPercent(weight) {
  const percent = weight * 100;
  return percent === 80 ? "80%" : `${percent.toFixed(2)}%`;
}

function dbMeter(amplitude) {
  if (!(amplitude > 0)) return 0;
  const decibels = 20 * Math.log10(amplitude);
  return clamp((decibels + 48) / 48, 0, 1);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}
