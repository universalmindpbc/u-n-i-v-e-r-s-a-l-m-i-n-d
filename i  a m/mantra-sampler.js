(() => {
  "use strict";

  const sampler = document.querySelector("[data-mantra-sampler]");
  if (!sampler) return;

  const bankButtons = Array.from(sampler.querySelectorAll("[data-mantra-bank]"));
  const closeButtons = Array.from(sampler.querySelectorAll("[data-mantra-close]"));
  const nodes = sampler.querySelector("[data-mantra-nodes]");
  const bankTitle = sampler.querySelector("[data-mantra-bank-title]");
  const status = sampler.querySelector("[data-mantra-status]");
  const volumeControl = sampler.querySelector("[data-mantra-volume-control]");
  const volumeReadout = sampler.querySelector("[data-mantra-volume-readout]");
  const volumeLeds = sampler.querySelector("[data-mantra-volume-leds]");
  const bufferById = new Map();
  const sourceById = new Map();
  const itemById = new Map();
  const programmeLevels = [];
  const PROGRAMME_WINDOW_MS = 3000;
  const PROGRAMME_SAMPLE_MS = 100;
  const PROGRAMME_QUIET_RMS = 0.028;
  const PROGRAMME_LOUD_RMS = 0.09;
  const PROGRAMME_MAX_ATTENUATION_DB = -3;
  const MANTRA_VOLUME_STORAGE_KEY = "iam:mantra-volume:v1";
  const MANTRA_VOLUME_DEFAULT_PERCENT = 77;
  const MANTRA_VOLUME_MAX_PERCENT = 100;
  const MANTRA_VOLUME_MAX_HEADROOM_DB = 3;
  const MANTRA_VOLUME_LED_COUNT = 28;
  const MANTRA_VOLUME_ARC_START_DEG = 225;
  const MANTRA_VOLUME_ARC_DEGREES = 270;
  let library = null;
  let currentBank = "tibet";
  let previousFocus = null;
  let audioContext = null;
  let masterGain = null;
  let masterLimiter = null;
  let outputAnalyser = null;
  let analyserTimeDomain = null;
  let meterFrame = null;
  let mantraSignalRms = 0;
  let mantraSignalLevel = 0;
  let activeVolumePointerId = null;
  let adaptiveGainDb = 0;
  let programmeRms = null;

  const fallbackUrl = "api/mantra-library.json";
  const endpointUrl = "api/mantra-library.php";

  function announce(message) {
    if (status) status.textContent = message;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function storedVolumePercent() {
    try {
      const storedValue = window.localStorage.getItem(MANTRA_VOLUME_STORAGE_KEY);
      if (storedValue === null) return MANTRA_VOLUME_DEFAULT_PERCENT;
      const stored = Number(storedValue);
      if (Number.isFinite(stored)) return clamp(Math.round(stored), 0, MANTRA_VOLUME_MAX_PERCENT);
    } catch {
      // Storage may be unavailable in privacy-restricted browser contexts.
    }
    return MANTRA_VOLUME_DEFAULT_PERCENT;
  }

  let mantraVolumePercent = storedVolumePercent();

  function volumePercentToGain(percent) {
    const normalised = clamp(Number(percent) || 0, 0, MANTRA_VOLUME_MAX_PERCENT);
    if (normalised <= 0) return 0;
    if (normalised <= MANTRA_VOLUME_DEFAULT_PERCENT) {
      return (normalised / MANTRA_VOLUME_DEFAULT_PERCENT) ** 1.6;
    }
    const headroomDb = ((normalised - MANTRA_VOLUME_DEFAULT_PERCENT)
      / (MANTRA_VOLUME_MAX_PERCENT - MANTRA_VOLUME_DEFAULT_PERCENT)) * MANTRA_VOLUME_MAX_HEADROOM_DB;
    return 10 ** (headroomDb / 20);
  }

  function ensureVolumeLeds() {
    if (!volumeLeds || volumeLeds.childElementCount === MANTRA_VOLUME_LED_COUNT) return;
    volumeLeds.replaceChildren();
    for (let index = 0; index < MANTRA_VOLUME_LED_COUNT; index += 1) {
      const led = document.createElement("span");
      const angle = MANTRA_VOLUME_ARC_START_DEG
        + ((MANTRA_VOLUME_ARC_DEGREES * index) / (MANTRA_VOLUME_LED_COUNT - 1));
      led.className = "mantra-orbit__volume-led";
      led.style.setProperty("--mantra-led-angle", `${angle}deg`);
      volumeLeds.append(led);
    }
  }

  function renderVolumeControl() {
    ensureVolumeLeds();
    const gain = volumePercentToGain(mantraVolumePercent);
    const litCount = Math.round((mantraVolumePercent / MANTRA_VOLUME_MAX_PERCENT) * MANTRA_VOLUME_LED_COUNT);
    Array.from(volumeLeds?.children || []).forEach((led, index) => {
      led.classList.toggle("is-active", index < litCount);
      led.classList.toggle("is-current", litCount > 0 && index === litCount - 1);
    });
    if (volumeReadout) volumeReadout.textContent = `${mantraVolumePercent}%`;
    volumeControl?.setAttribute("aria-valuenow", String(mantraVolumePercent));
    volumeControl?.setAttribute("aria-valuetext", `${mantraVolumePercent} percent`);
    sampler.style.setProperty("--mantra-volume-percent", String(mantraVolumePercent / 100));
    document.body.dataset.mantraVolumePercent = String(mantraVolumePercent);
    document.body.dataset.mantraVolumeGain = gain.toFixed(4);
  }

  function persistVolume() {
    try {
      window.localStorage.setItem(MANTRA_VOLUME_STORAGE_KEY, String(mantraVolumePercent));
    } catch {
      // The control remains session-functional when persistence is unavailable.
    }
  }

  function setVolume(percent, { persist = true } = {}) {
    mantraVolumePercent = clamp(Math.round(Number(percent) || 0), 0, MANTRA_VOLUME_MAX_PERCENT);
    const gain = volumePercentToGain(mantraVolumePercent);
    renderVolumeControl();
    if (masterGain && audioContext) {
      const now = audioContext.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(gain, now, 0.025);
    }
    if (persist) persistVolume();
    return mantraVolumePercent;
  }

  function syncPlaybackState() {
    const activeVoiceCount = Array.from(sourceById.values())
      .reduce((total, sources) => total + sources.size, 0);
    const active = activeVoiceCount > 0;
    document.body.classList.toggle("television-mantra-sample-active", active);
    document.body.dataset.mantraSampleCount = String(activeVoiceCount);
    document.body.dataset.mantraActiveVoiceCount = String(activeVoiceCount);
  }

  function nodeForId(id) {
    return nodes?.querySelector(`[data-mantra-sample="${CSS.escape(id)}"]`) || null;
  }

  function syncItemPlaying(id) {
    const playing = (sourceById.get(id)?.size || 0) > 0;
    const node = nodeForId(id);
    node?.classList.toggle("is-playing", playing);
    node?.setAttribute("aria-pressed", String(playing));
    syncPlaybackState();
  }

  function deactivate(id, source) {
    const sources = sourceById.get(id);
    sources?.delete(source);
    if (sources?.size === 0) sourceById.delete(id);
    syncItemPlaying(id);
  }

  function context() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  }

  function outputBus(ctx) {
    if (masterGain) return masterGain;
    masterGain = ctx.createGain();
    masterGain.gain.value = volumePercentToGain(mantraVolumePercent);
    masterLimiter = ctx.createDynamicsCompressor();
    masterLimiter.threshold.value = -1;
    masterLimiter.knee.value = 0;
    masterLimiter.ratio.value = 20;
    masterLimiter.attack.value = 0.003;
    masterLimiter.release.value = 0.08;
    outputAnalyser = ctx.createAnalyser();
    outputAnalyser.fftSize = 256;
    outputAnalyser.smoothingTimeConstant = 0.74;
    analyserTimeDomain = new Float32Array(outputAnalyser.fftSize);
    masterGain.connect(masterLimiter);
    masterLimiter.connect(outputAnalyser);
    outputAnalyser.connect(ctx.destination);
    return masterGain;
  }

  function updateSignalMeter() {
    let rms = 0;
    if (outputAnalyser && analyserTimeDomain) {
      outputAnalyser.getFloatTimeDomainData(analyserTimeDomain);
      let sumSquares = 0;
      for (let index = 0; index < analyserTimeDomain.length; index += 1) {
        sumSquares += analyserTimeDomain[index] ** 2;
      }
      rms = Math.sqrt(sumSquares / analyserTimeDomain.length);
    }
    mantraSignalRms = rms;
    const targetLevel = clamp((rms - 0.0025) / 0.16, 0, 1);
    const smoothing = targetLevel > mantraSignalLevel ? 0.42 : 0.16;
    mantraSignalLevel += (targetLevel - mantraSignalLevel) * smoothing;
    if (mantraSignalLevel < 0.001) mantraSignalLevel = 0;
    volumeControl?.style.setProperty("--mantra-signal-level", mantraSignalLevel.toFixed(4));
    document.body.dataset.mantraSignalRms = mantraSignalRms.toFixed(5);
    meterFrame = window.requestAnimationFrame(updateSignalMeter);
  }

  function startSignalMeter() {
    if (meterFrame !== null) return;
    meterFrame = window.requestAnimationFrame(updateSignalMeter);
  }

  function stopSignalMeter() {
    if (meterFrame !== null) window.cancelAnimationFrame(meterFrame);
    meterFrame = null;
    mantraSignalRms = 0;
    mantraSignalLevel = 0;
    volumeControl?.style.setProperty("--mantra-signal-level", "0");
    document.body.dataset.mantraSignalRms = "0.00000";
  }

  function sampleProgrammeLevel() {
    const measurement = window.IAMTelevisionAudio?.getProgrammeLevel?.();
    const level = Number(measurement?.rms);
    const now = performance.now();
    if (measurement?.source !== "none" && Number.isFinite(level) && level >= 0) {
      programmeLevels.push({ level, at: now });
    }
    while (programmeLevels.length && now - programmeLevels[0].at > PROGRAMME_WINDOW_MS) programmeLevels.shift();
  }

  function adaptiveProgrammeGain() {
    sampleProgrammeLevel();
    if (!programmeLevels.length) {
      programmeRms = null;
      adaptiveGainDb = 0;
      return 1;
    }
    const sorted = programmeLevels.map((sample) => sample.level).sort((a, b) => a - b);
    programmeRms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
    const loudness = Math.max(0, Math.min(1,
      (programmeRms - PROGRAMME_QUIET_RMS) / (PROGRAMME_LOUD_RMS - PROGRAMME_QUIET_RMS)
    ));
    adaptiveGainDb = PROGRAMME_MAX_ATTENUATION_DB * (1 - loudness);
    document.body.dataset.mantraProgrammeRms = programmeRms.toFixed(5);
    document.body.dataset.mantraAdaptiveGainDb = adaptiveGainDb.toFixed(2);
    return 10 ** (adaptiveGainDb / 20);
  }

  async function bufferFor(item) {
    if (bufferById.has(item.id)) return bufferById.get(item.id);
    if (!item.asset) return null;
    const promise = fetch(item.asset, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.arrayBuffer();
      })
      .then((data) => context().decodeAudioData(data))
      .catch(() => {
        bufferById.delete(item.id);
        announce(`${item.label || "sample"} is unavailable`);
        return null;
      });
    bufferById.set(item.id, promise);
    return promise;
  }

  function stopItem(id) {
    const sources = sourceById.get(id);
    sources?.forEach((source) => {
      source.onended = null;
      try { source.stop(); } catch {}
    });
    sourceById.delete(id);
    syncItemPlaying(id);
  }

  function stopAll({ announceStop = false } = {}) {
    Array.from(sourceById.keys()).forEach((id) => stopItem(id));
    if (announceStop) announce("all samples stopped");
    syncPlaybackState();
  }

  function libraryItemForId(id) {
    return Object.values(library?.banks || {})
      .flat()
      .find((item) => item.id === id) || null;
  }

  async function playItem(item, { serverPlayAtMs = null, shared = false } = {}) {
    if (!item || item.reserved || !item.asset) return;
    const ctx = context();
    ctx.resume().catch(() => null);
    const buffer = await bufferFor(item);
    if (!buffer) return;
    const correctedNowMs = Number(window.IAMBroadcastClock?.nowMs?.()) || Date.now();
    const hasServerPlayAt = serverPlayAtMs !== null
      && serverPlayAtMs !== undefined
      && Number.isFinite(Number(serverPlayAtMs));
    if (hasServerPlayAt && Number(serverPlayAtMs) < correctedNowMs - 1200) {
      announce("shared mantra arrived too late");
      return;
    }
    const trimStart = Math.max(0, Number(item.trim_start) || 0);
    const trimEnd = Math.min(buffer.duration, Math.max(trimStart + 0.01, Number(item.trim_end) || buffer.duration));
    const sampleDuration = trimEnd - trimStart;
    const speed = Math.max(0.35, Math.min(2, Number(item.speed) || 1));
    const outputDuration = sampleDuration / speed;
    const scheduledContextTime = hasServerPlayAt
      ? ctx.currentTime + Math.max(0.03, (Number(serverPlayAtMs) - correctedNowMs) / 1000)
      : ctx.currentTime;
    document.body.dataset.mantraPlaybackMode = shared ? "shared" : "local";
    document.body.dataset.mantraPlaybackLeadMs = String(Math.max(0, Math.round((scheduledContextTime - ctx.currentTime) * 1000)));
    document.body.dataset.mantraLastSampleId = item.id;
    document.body.dataset.mantraLastStartedAtMs = String(Date.now());
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    const basePitch = Number(item.pitch) || 0;
    source.detune.setValueAtTime(basePitch * 100, scheduledContextTime);
    const pitchCurve = Array.isArray(item.pitch_curve) && item.pitch_curve.length > 1
      ? item.pitch_curve
      : [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    const motion = Number(item.pitch_motion) || 0;
    pitchCurve.forEach((point) => {
      const x = Math.max(0, Math.min(1, Number(point.x) || 0));
      const drawnPitch = Math.max(-12, Math.min(12, Number(point.y) || 0));
      const movingPitch = Math.sin(x * Math.PI * 2) * motion;
      source.detune.linearRampToValueAtTime((basePitch + drawnPitch + movingPitch) * 100, scheduledContextTime + x * outputDuration);
    });
    const gain = ctx.createGain();
    const envelope = item.amp_envelope || {};
    const itemGain = Number.isFinite(Number(item.gain)) ? Number(item.gain) : 1;
    const envelopeLevel = Number.isFinite(Number(envelope.level)) ? Number(envelope.level) : 1;
    const programmeGain = adaptiveProgrammeGain();
    const peak = Math.max(0.0001, Math.min(15.849, itemGain) * Math.max(0, Math.min(1, envelopeLevel)) * programmeGain);
    const attack = Math.min(outputDuration * 0.9, Math.max(0.005, Number(envelope.attack) * outputDuration || 0.02));
    const release = Math.min(outputDuration * 0.9, Math.max(0.005, Number(envelope.release) * outputDuration || 0.08));
    gain.gain.setValueAtTime(0.0001, scheduledContextTime);
    gain.gain.linearRampToValueAtTime(peak, scheduledContextTime + attack);
    gain.gain.setValueAtTime(peak, scheduledContextTime + Math.max(attack, outputDuration - release));
    gain.gain.linearRampToValueAtTime(0.0001, scheduledContextTime + outputDuration);
    const output = outputBus(ctx);
    let effectInput = gain;
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, Number(item.pan) || 0));
      source.connect(gain).connect(pan);
      effectInput = pan;
    } else {
      source.connect(gain);
    }
    if (window.IAMMantraAudioFX?.connect) {
      window.IAMMantraAudioFX.connect({
        ctx,
        input: effectInput,
        destination: output,
        state: item.fx,
      });
    } else {
      effectInput.connect(output);
    }
    source.onended = () => deactivate(item.id, source);
    const sources = sourceById.get(item.id) || new Set();
    sources.add(source);
    sourceById.set(item.id, sources);
    syncItemPlaying(item.id);
    announce(item.phrase || item.label || "mantra");
    try {
      source.start(scheduledContextTime, trimStart, sampleDuration);
    } catch {
      deactivate(item.id, source);
      announce("tap the sample again to play");
    }
  }

  function armSharedAudio() {
    const ctx = context();
    ctx.resume().catch(() => null);
    return (async () => {
      if (!library) await refresh();
      const playable = Object.values(library?.banks || {})
        .flat()
        .filter((item) => !item.reserved && item.asset);
      await Promise.allSettled(playable.map((item) => bufferFor(item)));
      return playable.length;
    })();
  }

  async function playShared(id, serverPlayAtMs) {
    if (!library) await refresh();
    const item = libraryItemForId(id);
    if (!item || item.reserved || !item.asset) return false;
    await playItem(item, { serverPlayAtMs, shared: true });
    return true;
  }

  async function trigger(item) {
    if (!item || item.reserved || !item.asset) return;
    const ctx = context();
    ctx.resume().catch(() => null);
    void bufferFor(item);
    const localPlayback = playItem(item);
    window.IAMBroadcastInteractions?.sendMantra?.(item.id);
    await localPlayback;
  }

  function createNode(item, index) {
    const button = document.createElement("button");
    const reserved = Boolean(item.reserved || !item.asset);
    button.type = "button";
    button.className = `mantra-orbit__node${reserved ? " is-reserved" : ""}`;
    button.style.setProperty("--mantra-index", String(index));
    button.style.setProperty("--mantra-rgb", item.color || "164, 230, 234");
    button.dataset.mantraSample = item.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", reserved
      ? `${item.label || "Future mantra"} — reserved`
      : `${item.label} — ${item.phrase || "play sample"}`);
    if (reserved) button.disabled = true;

    const flower = document.createElement("span");
    flower.className = "mantra-orbit__node-flower adaptive-television-reaction__glyph adaptive-television-reaction__glyph--ioh-logo adaptive-television-reaction__glyph--flora-trigger";
    flower.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.className = "mantra-orbit__node-name";
    name.textContent = item.label || "Future Mantra";
    const kind = document.createElement("span");
    kind.className = "mantra-orbit__node-kind";
    kind.textContent = reserved ? "reserved" : item.source_type === "vocoder" ? "vocoder" : "sample";
    button.append(flower, name, kind);
    button.addEventListener("click", () => trigger(item));
    return button;
  }

  function renderBank() {
    if (!library?.banks?.[currentBank] || !nodes) return;
    stopAll();
    itemById.clear();
    nodes.replaceChildren();
    const items = library.banks[currentBank].slice(0, 6);
    items.forEach((item, index) => {
      itemById.set(item.id, item);
      nodes.append(createNode(item, index));
    });
    sampler.dataset.mantraActiveBank = currentBank;
    if (bankTitle) bankTitle.textContent = currentBank === "tibet" ? "Tibet" : "Ibiza";
    bankButtons.forEach((button) => {
      const selected = button.dataset.mantraBank === currentBank;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    announce("choose a mantra");
  }

  async function fetchLibrary() {
    for (const url of [endpointUrl, fallbackUrl]) {
      try {
        const response = await fetch(`${url}?v=${Date.now()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) continue;
        const payload = await response.json();
        const candidate = payload.library || payload;
        if (candidate?.banks?.tibet && candidate?.banks?.ibiza) return candidate;
      } catch {
        // Fall through to the read-only library snapshot.
      }
    }
    throw new Error("The mantra library could not be loaded.");
  }

  async function refresh() {
    try {
      library = await fetchLibrary();
      bufferById.clear();
      renderBank();
      return library;
    } catch (error) {
      announce(error.message);
      return null;
    }
  }

  async function open() {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("mantra-sampler-open");
    sampler.removeAttribute("inert");
    sampler.setAttribute("aria-hidden", "false");
    document.querySelector("[data-emdr-mantra-open]")?.setAttribute("aria-expanded", "true");
    if (!library) await refresh();
    renderVolumeControl();
    startSignalMeter();
    window.requestAnimationFrame(() => {
      sampler.querySelector("[data-mantra-close]")?.focus({ preventScroll: true });
    });
  }

  function close({ restoreFocus = true } = {}) {
    stopAll();
    stopSignalMeter();
    document.body.classList.remove("mantra-sampler-open");
    sampler.setAttribute("aria-hidden", "true");
    sampler.setAttribute("inert", "");
    document.querySelector("[data-emdr-mantra-open]")?.setAttribute("aria-expanded", "false");
    window.dispatchEvent(new CustomEvent("iam:mantra-close"));
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }

  bankButtons.forEach((button) => button.addEventListener("click", () => {
    const requestedBank = button.dataset.mantraBank;
    if (!requestedBank || requestedBank === currentBank) return;
    currentBank = requestedBank;
    renderBank();
  }));
  function volumeFromPointer(event) {
    if (!volumeControl) return mantraVolumePercent;
    const bounds = volumeControl.getBoundingClientRect();
    const x = event.clientX - (bounds.left + (bounds.width / 2));
    const y = event.clientY - (bounds.top + (bounds.height / 2));
    const degrees = ((Math.atan2(y, x) * 180 / Math.PI) + 90 + 360) % 360;
    const deadZoneStart = (MANTRA_VOLUME_ARC_START_DEG + MANTRA_VOLUME_ARC_DEGREES) % 360;
    if (degrees >= deadZoneStart && degrees <= MANTRA_VOLUME_ARC_START_DEG) {
      return degrees < 180 ? MANTRA_VOLUME_MAX_PERCENT : 0;
    }
    const adjustedDegrees = degrees < MANTRA_VOLUME_ARC_START_DEG ? degrees + 360 : degrees;
    const progress = clamp(
      (adjustedDegrees - MANTRA_VOLUME_ARC_START_DEG) / MANTRA_VOLUME_ARC_DEGREES,
      0,
      1
    );
    return progress * MANTRA_VOLUME_MAX_PERCENT;
  }

  function finishVolumePointer(event) {
    if (activeVolumePointerId === null || event.pointerId !== activeVolumePointerId) return;
    try { volumeControl?.releasePointerCapture(activeVolumePointerId); } catch {}
    activeVolumePointerId = null;
    volumeControl?.classList.remove("is-adjusting");
    persistVolume();
  }

  volumeControl?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    activeVolumePointerId = event.pointerId;
    volumeControl.setPointerCapture(event.pointerId);
    volumeControl.classList.add("is-adjusting");
    volumeControl.focus({ preventScroll: true });
    setVolume(volumeFromPointer(event), { persist: false });
  });
  volumeControl?.addEventListener("pointermove", (event) => {
    if (activeVolumePointerId === null || event.pointerId !== activeVolumePointerId) return;
    event.preventDefault();
    setVolume(volumeFromPointer(event), { persist: false });
  });
  volumeControl?.addEventListener("pointerup", finishVolumePointer);
  volumeControl?.addEventListener("pointercancel", finishVolumePointer);
  volumeControl?.addEventListener("keydown", (event) => {
    let nextVolume = mantraVolumePercent;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") nextVolume += event.shiftKey ? 5 : 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextVolume -= event.shiftKey ? 5 : 1;
    else if (event.key === "PageUp") nextVolume += 10;
    else if (event.key === "PageDown") nextVolume -= 10;
    else if (event.key === "Home") nextVolume = 0;
    else if (event.key === "End") nextVolume = MANTRA_VOLUME_MAX_PERCENT;
    else return;
    event.preventDefault();
    setVolume(nextVolume);
  });
  closeButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    close();
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.body.classList.contains("mantra-sampler-open")) return;
    event.preventDefault();
    close();
  });
  window.addEventListener("iam:shared-interaction-acknowledged", (event) => {
    if (event.detail?.kind !== "mantra") return;
    if (event.detail.outcome === "broadcast") document.body.dataset.mantraShareMode = "unrestricted_stakeholder_demo";
  });
  window.addEventListener("iam:shared-interaction-rejected", (event) => {
    if (event.detail?.kind !== "mantra") return;
    announce("shared mantra could not be sent");
  });
  const programmeSampler = window.setInterval(sampleProgrammeLevel, PROGRAMME_SAMPLE_MS);
  window.addEventListener("pagehide", () => {
    window.clearInterval(programmeSampler);
    stopSignalMeter();
    stopAll();
  });

  window.IAMMantraSampler = {
    version: "mantra_sampler_v3.0",
    open,
    close,
    refresh,
    stopAll,
    armSharedAudio,
    playShared,
    setVolume,
    getState() {
      return {
        bank: currentBank,
        active: Array.from(sourceById.keys()),
        activeVoices: Array.from(sourceById.values()).reduce((total, sources) => total + sources.size, 0),
        open: document.body.classList.contains("mantra-sampler-open"),
        programmeRms,
        adaptiveGainDb,
        maximumAdaptiveAttenuationDb: PROGRAMME_MAX_ATTENUATION_DB,
        volumePercent: mantraVolumePercent,
        defaultVolumePercent: MANTRA_VOLUME_DEFAULT_PERCENT,
        volumeGain: volumePercentToGain(mantraVolumePercent),
        appliedVolumeGain: masterGain?.gain.value ?? null,
        maximumVolumeHeadroomDb: MANTRA_VOLUME_MAX_HEADROOM_DB,
        signalRms: mantraSignalRms,
        outputMeterReady: Boolean(outputAnalyser),
        sixNodeBanks: Object.fromEntries(Object.entries(library?.banks || {}).map(([name, items]) => [name, items.length])),
      };
    },
  };

  renderVolumeControl();
  refresh();
})();
