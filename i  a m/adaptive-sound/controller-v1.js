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
const DEFAULT_PROFILE_ID = "calm_alpha_80_v1";
const DEFAULT_INTENSITY = 35;
const TECHNICAL_OUTPUT_GAIN = 0.08;
const WAVEFORM_POINTS = Object.freeze([
  [2, 44], [24, 44], [31, 34], [39, 56], [48, 11], [58, 71],
  [68, 33], [77, 62], [86, 44], [94, 55], [102, 44], [118, 44],
]);

const panel = document.querySelector("[data-adaptive-sound-panel]");
const consoleElement = panel?.querySelector("[data-adaptive-sound-console]");
const soundButton = document.querySelector("[data-emdr-sound-research]");

if (panel && consoleElement && soundButton) initializeAdaptiveSoundPanel();

function initializeAdaptiveSoundPanel() {
  const closeButtons = Array.from(panel.querySelectorAll("[data-adaptive-sound-close]"));
  const navigationButton = panel.querySelector("[data-adaptive-sound-nav]");
  const researchButton = panel.querySelector("[data-adaptive-sound-research-open]");
  const researchMoreButton = document.querySelector(".adaptive-television-research-tooltip-host--sound .adaptive-television-research-tooltip__more");
  const masterButton = panel.querySelector("[data-adaptive-sound-master]");
  const masterLabel = panel.querySelector("[data-adaptive-sound-master-label]");
  const engineLed = panel.querySelector("[data-adaptive-sound-engine-led]");
  const status = panel.querySelector("[data-adaptive-sound-status]");
  const conditionReadout = panel.querySelector("[data-adaptive-sound-condition]");
  const profileLabel = panel.querySelector("[data-adaptive-sound-profile-label]");
  const profileButtons = Array.from(panel.querySelectorAll("[data-adaptive-profile]"));
  const laneButtons = Array.from(panel.querySelectorAll("[data-adaptive-lane-toggle]"));
  const laneWeightReadouts = Object.fromEntries(LANE_IDS.map((laneId) => [
    laneId,
    panel.querySelector(`[data-adaptive-lane-weight="${laneId}"]`),
  ]));
  const laneMeters = Object.fromEntries(LANE_IDS.map((laneId) => [
    laneId,
    panel.querySelector(`[data-adaptive-lane-meter="${laneId}"]`),
  ]));
  const channelMeters = Object.fromEntries(LANE_IDS.map((laneId) => [
    laneId,
    panel.querySelector(`[data-adaptive-channel-meter="${laneId}"]`),
  ]));
  const channelWeightReadouts = Object.fromEntries(LANE_IDS.map((laneId) => [
    laneId,
    panel.querySelector(`[data-adaptive-channel-weight="${laneId}"]`),
  ]));
  const carrierButtons = Array.from(panel.querySelectorAll("[data-adaptive-carrier]"));
  const carrierSelect = panel.querySelector("[data-adaptive-carrier-select]");
  const carrierReadout = panel.querySelector("[data-adaptive-carrier-readout]");
  const intensity = panel.querySelector("[data-adaptive-intensity]");
  const intensityReadout = panel.querySelector("[data-adaptive-intensity-readout]");
  const adaptiveMeter = panel.querySelector("[data-adaptive-output-meter]");
  const quantumMeter = panel.querySelector("[data-quantum-tree-panel-meter]");
  const quantumState = panel.querySelector("[data-quantum-tree-panel-state]");
  const quantumChannelMeters = Object.freeze([
    { element: panel.querySelector('[data-quantum-channel-meter="isochronic"]'), level: 0.77, rate: 0.17, phase: 0.4 },
    { element: panel.querySelector('[data-quantum-channel-meter="carrier"]'), level: 0.77, rate: 0.13, phase: 2.1 },
    { element: panel.querySelector('[data-quantum-channel-meter="constant"]'), level: 0.86, rate: 0.11, phase: 4.2 },
  ]);
  const noiseLabel = panel.querySelector("[data-adaptive-noise-label]");
  const noiseDetail = panel.querySelector("[data-adaptive-noise-detail]");
  const auditionPanel = panel.querySelector("[data-adaptive-sound-audition]");
  const masteringButtons = Array.from(panel.querySelectorAll("[data-adaptive-mastering]"));
  const envelopeButtons = Array.from(panel.querySelectorAll("[data-adaptive-envelope]"));
  const lowpassButtons = Array.from(panel.querySelectorAll("[data-adaptive-lowpass]"));
  const scienceLink = panel.querySelector('a[href="science.html#research-sound"]');
  const waveform = panel.querySelector(".iam-sound-channel-wave");
  const waveformPaths = Array.from(panel.querySelectorAll("[data-adaptive-wave-path]"));
  const storedProfile = localStorage.getItem("iamAdaptiveSoundProfile") || "";
  const storedCarrier = Number(localStorage.getItem("iamAdaptiveSoundCarrier"));
  const storedIntensityValue = localStorage.getItem("iamAdaptiveSoundIntensity");
  const storedIntensity = storedIntensityValue === null ? Number.NaN : Number(storedIntensityValue);

  const initialProfile = resolveInitialProfile(storedProfile);
  const state = {
    open: false,
    previousFocus: null,
    masterEnabled: localStorage.getItem("iamSoundResearchLayer") !== "off",
    synthEnabled: true,
    profileId: initialProfile.profileId,
    profileAuthority: initialProfile.authority,
    carrierHz: CARRIER_SET.includes(storedCarrier) ? storedCarrier : 444,
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

  const query = new URLSearchParams(window.location.search);
  const soundLabEnabled = window.location.hostname === "staging.universalmind.tv"
    && query.get("soundLab") === "1";
  const directSoundPage = query.get("sound") === "1";
  if (auditionPanel) auditionPanel.hidden = !soundLabEnabled;

  soundButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openPanel();
  }, true);
  window.addEventListener("iam:adaptive-sound-open", openPanel);

  closeButtons.forEach((button) => button.addEventListener("click", () => closePanel(true)));
  navigationButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.requestAnimationFrame(() => document.querySelector(".global-nav-trigger")?.click());
  });
  researchButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    researchMoreButton?.click();
  });
  masterButton?.addEventListener("click", () => setMasterEnabled(!state.masterEnabled));
  profileButtons.forEach((button) => button.addEventListener("click", async () => {
    await selectProfile(button.dataset.adaptiveProfile || "", "listener_selection");
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

  carrierSelect?.addEventListener("change", async () => {
    const carrierHz = Number(carrierSelect.value);
    if (!CARRIER_SET.includes(carrierHz) || carrierHz === state.carrierHz) return;
    state.carrierHz = carrierHz;
    localStorage.setItem("iamAdaptiveSoundCarrier", String(carrierHz));
    syncInterface();
    if (state.synthEnabled && state.masterEnabled) await rebuildEngine("carrier_change");
  });

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
    if (directSoundPage) window.IAMQuantumTree?.setAuditionMode?.(state.masterEnabled);
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
    localStorage.setItem("iamSoundResearchLayer", state.masterEnabled ? "on" : "off");
    window.IAMQuantumTree?.setEnabled?.(state.masterEnabled);
    if (directSoundPage) window.IAMQuantumTree?.setAuditionMode?.(state.masterEnabled);
    if (!state.masterEnabled) {
      state.route?.node?.port.postMessage({ type: "set_master_enabled", enabled: false });
      setRouteGain(0, 0.08);
      resetWaveform();
    } else if (state.synthEnabled && state.profileId) {
      await rebuildEngine("master_on");
    }
    syncInterface();
  }

  async function selectProfile(profileId, authority) {
    if (!PROFILE_META[profileId]) return;
    const changed = state.profileId !== profileId;
    state.profileId = profileId;
    state.profileAuthority = authority;
    localStorage.setItem("iamAdaptiveSoundProfile", profileId);
    if (changed) {
      state.enabledLanes = Object.fromEntries(LANE_IDS.map((laneId) => [laneId, true]));
      state.lastDiagnostics = null;
    }
    syncInterface();
    if (state.masterEnabled && (changed || state.context?.state !== "running" || !state.route)) {
      await rebuildEngine(changed ? "profile_change" : "profile_resume");
    }
  }

  async function ensureAudioContext() {
    if (!state.context) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("This browser does not support the adaptive sound engine");
      state.context = new AudioContextConstructor({ latencyHint: "interactive" });
      document.body.dataset.adaptiveSoundSampleRate = String(state.context.sampleRate);
      state.context.addEventListener("statechange", syncInterface);
    }
    if (state.context.state !== "running") await state.context.resume();
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
      const running = state.context?.state === "running" && state.masterEnabled;
      document.body.dataset.adaptiveSoundEngine = running ? "running" : "armed";
      setStatus(running ? "LIVE SIGNAL" : "ARMED", running);
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
      const mixAllocation = state.enabledLanes[laneId] ? Number(lane?.power_weight || 0) : 0;
      channelMeters[laneId]?.style.setProperty("--channel-meter", String(clamp(mixAllocation, 0, 1)));
    }
    updateWaveform(diagnostics);
  }

  function updateWaveform(diagnostics) {
    if (!waveform || !waveformPaths.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const laneEnergy = LANE_IDS.map((laneId) => {
      const lane = diagnostics?.lanes?.[laneId];
      return state.enabledLanes[laneId]
        ? clamp(Number(lane?.envelope_gain || 0) * Math.sqrt(Number(lane?.power_weight || 0)) / Math.sqrt(0.8), 0, 1)
        : 0;
    });
    const energy = laneEnergy.reduce((sum, value) => sum + value, 0) / laneEnergy.length;
    const time = (window.performance?.now?.() || Date.now()) / 1000;
    const points = WAVEFORM_POINTS.map(([x, baseY], index) => {
      if (index < 2 || index === WAVEFORM_POINTS.length - 1) return [x, baseY];
      const localEnergy = laneEnergy[(index - 2) % laneEnergy.length];
      const scale = 0.84 + energy * 0.2 + localEnergy * 0.08;
      const movement = Math.sin((time * 2.1) + (index * 0.92)) * (0.8 + localEnergy * 2.4);
      return [x, clamp(44 + ((baseY - 44) * scale) + movement, 5, 75)];
    });
    const path = points.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y.toFixed(2)}`).join(" ");
    waveformPaths.forEach((element) => element.setAttribute("d", path));
    waveform.style.setProperty("--wave-energy", String(energy));
  }

  function resetWaveform() {
    const path = WAVEFORM_POINTS.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
    waveformPaths.forEach((element) => element.setAttribute("d", path));
    waveform?.style.setProperty("--wave-energy", "0");
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
      updateQuantumChannelMeters(true);
      return;
    }
    state.masterEnabled = Boolean(diagnostics.enabled);
    const relativeLevel = diagnostics.peakVolume > 0
      ? Number(diagnostics.currentVolume || 0) / Number(diagnostics.peakVolume)
      : 0;
    setMeter(quantumMeter, clamp(relativeLevel, 0, 1));
    updateQuantumChannelMeters(Boolean(diagnostics.enabled));
    if (quantumState) {
      quantumState.textContent = diagnostics.playing
        ? (diagnostics.continuityActive ? "CONTINUITY ACTIVE" : "SIGNAL ACTIVE")
        : (diagnostics.enabled ? "READY" : "MASTER OFF");
    }
    syncMasterInterface();
  }

  function updateQuantumChannelMeters(enabled) {
    const now = (window.performance?.now?.() || Date.now()) / 1000;
    quantumChannelMeters.forEach(({ element, level, rate, phase }) => {
      if (!element) return;
      const slowLfo = Math.sin((now * Math.PI * 2 * rate) + phase) * 0.022;
      const character = Math.sin((now * Math.PI * 2 * rate * 2.37) + (phase * 0.61)) * 0.009;
      const displayedLevel = enabled ? clamp(level * (1 + slowLfo + character), 0, 1) : 0;
      element.style.setProperty("--quantum-channel-meter", String(displayedLevel));
    });
  }

  function syncInterface() {
    const profile = state.profileId ? PROFILE_CANDIDATES[state.profileId] : null;
    const meta = state.profileId ? PROFILE_META[state.profileId] : null;
    panel.dataset.profile = state.profileId;
    panel.dataset.soundActive = String(state.masterEnabled && state.synthEnabled);
    profileButtons.forEach((button) => {
      button.disabled = false;
      button.setAttribute("aria-disabled", "false");
      button.setAttribute("aria-pressed", String(button.dataset.adaptiveProfile === state.profileId));
    });
    for (const laneId of LANE_IDS) {
      const weight = profile?.diamond_power_weights?.[laneId];
      if (laneWeightReadouts[laneId]) laneWeightReadouts[laneId].textContent = Number.isFinite(weight) ? formatPercent(weight) : "—";
      if (channelWeightReadouts[laneId]) channelWeightReadouts[laneId].textContent = Number.isFinite(weight) ? formatPercent(weight) : "—";
      const laneButton = laneButtons.find((button) => button.dataset.adaptiveLaneToggle === laneId);
      laneButton?.toggleAttribute("disabled", !profile);
      laneButton?.setAttribute("aria-pressed", String(Boolean(profile) && state.enabledLanes[laneId]));
      profileButtons.find((button) => button.dataset.adaptiveProfile?.includes(`_${laneId}_`))
        ?.classList.toggle("is-lane-off", Boolean(profile) && !state.enabledLanes[laneId]);
      if (!profile) {
        laneMeters[laneId]?.style.setProperty("--lane-meter", "0");
        channelMeters[laneId]?.style.setProperty("--channel-meter", "0");
      } else if (!state.lastDiagnostics || state.context?.state !== "running" || !state.masterEnabled) {
        const restingLevel = state.enabledLanes[laneId]
          ? Math.sqrt(Number(weight || 0)) / Math.sqrt(0.8)
          : 0;
        laneMeters[laneId]?.style.setProperty("--lane-meter", String(clamp(restingLevel, 0, 1)));
        channelMeters[laneId]?.style.setProperty("--channel-meter", String(clamp(Number(weight || 0), 0, 1)));
      }
    }
    if (profileLabel) profileLabel.textContent = meta?.label || "CHOOSE A PROFILE";
    if (noiseLabel) noiseLabel.textContent = meta?.noiseLabel || "PROFILE DEPENDENT";
    if (noiseDetail) noiseDetail.textContent = meta?.noiseDetail || "Delta brown · Theta white · Alpha pink · Gamma equal three-way split";
    carrierButtons.forEach((button) => button.setAttribute("aria-checked", String(Number(button.dataset.adaptiveCarrier) === state.carrierHz)));
    if (carrierSelect) carrierSelect.value = String(state.carrierHz);
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
    if (masterLabel) masterLabel.textContent = "ON";
    soundButton.setAttribute("aria-pressed", String(state.masterEnabled));
  }

  function syncConditionReadout() {
    if (!state.profileId) {
      if (conditionReadout) conditionReadout.textContent = "NO CONDITION LOADED";
      if (!state.lastError) setStatus("SELECT A FREQUENCY", false);
      return;
    }
    const path = state.masteringCondition === "engineering_on" ? "MASTERED" : "CLEAN REF";
    if (conditionReadout) conditionReadout.textContent = `${state.profileId.toUpperCase()} / ${state.carrierHz} HZ / ${path} / ${state.profileAuthority.toUpperCase()}`;
    if (!state.synthEnabled && !state.lastError) setStatus("READY", false);
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
        profile_authority: state.profileAuthority,
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
        waveform_source: "audio_thread_lane_diagnostics",
        quantum_tree: window.IAMQuantumTree?.diagnostics?.() || null,
      };
    },
  };

  panel.inert = true;
  document.body.dataset.adaptiveSoundPanel = "ready";
  document.body.dataset.adaptiveSoundPanelOpen = "false";
  resetWaveform();
  syncInterface();
  if (directSoundPage) {
    window.requestAnimationFrame(() => {
      document.body.append(panel);
      document.body.classList.add("iam-sound-direct-page");
      document.body.dataset.adaptiveSoundDirect = "true";
      openPanel();
    });
  }
}

function resolveInitialProfile(storedProfile) {
  if (PROFILE_META[storedProfile]) {
    return { profileId: storedProfile, authority: "listener_selection" };
  }

  const inference = readStoredInference();
  const needs = flattenCitizenNeeds(inference);
  if (!Object.keys(needs).length) {
    return { profileId: DEFAULT_PROFILE_ID, authority: "neutral_alpha_default" };
  }

  const mean = (labels) => {
    const values = labels.map((label) => needs[normalizedKey(label)]).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };
  const scores = [
    ["sleep_delta_80_v1", mean(["Sleep Pressure", "Fatigue", "Sleep Disturbance", "Emotional Numbing"])],
    ["mindfulness_theta_80_v1", mean(["Recovery", "Self-Transcendence", "Reflection", "Calm"])],
    ["calm_alpha_80_v1", mean(["Calm", "Attention", "Clarity", "Psychological Safety"])],
    ["inspiration_gamma_80_v1", mean(["Joy", "Curiosity", "Motivation", "Awe", "Self-Actualisation"])],
  ].sort((left, right) => right[1] - left[1]);

  return scores[0][1] > 0
    ? { profileId: scores[0][0], authority: "citizen_needs_context" }
    : { profileId: DEFAULT_PROFILE_ID, authority: "neutral_alpha_default" };
}

function readStoredInference() {
  for (const key of ["iamLatestInference", "citizenNeedsLatestInference"]) {
    for (const store of [window.localStorage, window.sessionStorage]) {
      try {
        const value = JSON.parse(store.getItem(key) || "null");
        if (value && typeof value === "object") return value;
      } catch {
        // A malformed or unavailable store cannot override the neutral profile.
      }
    }
  }
  return null;
}

function flattenCitizenNeeds(inference) {
  const flattened = {};
  const groups = inference?.citizen_needs || inference?.citizenNeeds || {};
  Object.values(groups).forEach((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) return;
    Object.entries(group).forEach(([label, value]) => {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) flattened[normalizedKey(label)] = clamp(numeric, 0, 1);
    });
  });
  return flattened;
}

function normalizedKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
