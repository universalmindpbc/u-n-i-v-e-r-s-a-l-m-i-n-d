(() => {
  "use strict";

  const endpoint = "api/mantra-library.php";
  const voiceEndpoint = "api/mantra-voice.php";
  const login = document.querySelector("[data-mantra-login]");
  const loginForm = document.querySelector("[data-mantra-login-form]");
  const loginStatus = document.querySelector("[data-mantra-login-status]");
  const workspace = document.querySelector("[data-mantra-workspace]");
  const logoutButton = document.querySelector("[data-mantra-logout]");
  const slots = document.querySelector("[data-mantra-library-slots]");
  const bankButtons = Array.from(document.querySelectorAll("[data-studio-bank]"));
  const tabButtons = Array.from(document.querySelectorAll("[data-editor-tab]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-editor-panel]"));
  const studioStatus = document.querySelector("[data-studio-status]");
  const vocoderStatus = document.querySelector("[data-vocoder-status]");
  const vocoderButtons = Array.from(document.querySelectorAll("[data-vocoder-voice]"));
  const fxEngine = window.IAMMantraAudioFX;

  const fields = {
    label: document.querySelector("[data-sample-label]"),
    phrase: document.querySelector("[data-sample-phrase]"),
    speed: document.querySelector("[data-sample-speed]"),
    pan: document.querySelector("[data-sample-pan]"),
    gain: document.querySelector("[data-sample-gain]"),
    pitch: document.querySelector("[data-sample-pitch]"),
    pitchMotion: document.querySelector("[data-pitch-motion]"),
    attack: document.querySelector("[data-amp-attack]"),
    level: document.querySelector("[data-amp-level]"),
    release: document.querySelector("[data-amp-release]"),
    trimStart: document.querySelector("[data-trim-start]"),
    trimEnd: document.querySelector("[data-trim-end]"),
    upload: document.querySelector("[data-sample-upload]"),
  };

  const waveformCanvas = document.querySelector("[data-waveform-canvas]");
  const pitchCanvas = document.querySelector("[data-pitch-canvas]");
  const ampCanvas = document.querySelector("[data-amp-canvas]");
  const fxCanvas = document.querySelector("[data-fx-canvas]");
  const fxPanel = document.querySelector("[data-editor-panel=\"fx\"]");
  const fxSlotButtons = Array.from(document.querySelectorAll("[data-fx-slot]"));
  const fxBypassButton = document.querySelector("[data-fx-bypass]");
  const fxFields = {
    reverbMix: document.querySelector("[data-fx-reverb-mix]"),
    reverbDecay: document.querySelector("[data-fx-reverb-decay]"),
    reverbPredelay: document.querySelector("[data-fx-reverb-predelay]"),
    spectralMix: document.querySelector("[data-fx-spectral-mix]"),
    spectralTime: document.querySelector("[data-fx-spectral-time]"),
    spectralSpread: document.querySelector("[data-fx-spectral-spread]"),
    spectralFeedback: document.querySelector("[data-fx-spectral-feedback]"),
  };
  const vuMeter = document.querySelector("[data-vu-meter]");
  const vocoderText = document.querySelector("[data-vocoder-text]");
  const vocoderRate = document.querySelector("[data-vocoder-rate]");
  const vocoderTone = document.querySelector("[data-vocoder-tone]");
  const vocoderEffect = document.querySelector("[data-vocoder-effect]");
  const vocoderPreviewButton = document.querySelector("[data-vocoder-preview]");
  const vocoderSaveButton = document.querySelector("[data-vocoder-save]");
  const normaliseButton = document.querySelector("[data-sample-normalise]");
  const MAX_GAIN_DB = 24;
  const MAX_GAIN = 10 ** (MAX_GAIN_DB / 20);
  const NORMALISE_TARGET_DB = -12;
  const NORMALISE_TARGET_RMS = 10 ** (NORMALISE_TARGET_DB / 20);

  let library = null;
  let csrfToken = "";
  let currentBank = "tibet";
  let currentSlot = 1;
  let selected = null;
  let audioContext = null;
  let decodedBuffer = null;
  let previewSource = null;
  let previewNodes = [];
  let previewAnimation = 0;
  let pitchCurve = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  let drawingPitch = false;
  let renderedVocoder = null;
  let renderedVocoderBuffer = null;
  let renderedVocoderDuration = 0;
  let renderedVocoderKey = "";
  let vocoderVoice = "human-clear";
  let voiceRequestActive = false;
  let fxState = fxEngine?.defaultState?.() || {
    active: "a",
    bypass: false,
    a: { reverb: { mix: 0, decay: 2.4, predelay: 0.025 }, spectral_delay: { mix: 0, time: 0.18, spread: 0.45, feedback: 0.18 } },
    b: { reverb: { mix: 0, decay: 2.4, predelay: 0.025 }, spectral_delay: { mix: 0, time: 0.18, spread: 0.45, feedback: 0.18 } },
  };

  function announce(message, target = studioStatus) {
    if (target) target.textContent = message;
  }

  function context() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  }

  async function api(body, { form = false } = {}) {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: form ? undefined : { "Content-Type": "application/json" },
      body: form ? body : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "The studio request failed.");
    return payload;
  }

  function setAuthenticated(authenticated) {
    login.hidden = authenticated;
    workspace.hidden = !authenticated;
    logoutButton.hidden = !authenticated;
  }

  async function loadSession() {
    try {
      const response = await fetch(`${endpoint}?v=${Date.now()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json();
      library = payload.library;
      csrfToken = payload.csrf_token || "";
      setAuthenticated(Boolean(payload.authenticated));
      if (payload.authenticated) renderLibrary();
    } catch {
      setAuthenticated(false);
      announce("The studio is unavailable.", loginStatus);
    }
  }

  function currentItems() {
    return library?.banks?.[currentBank] || [];
  }

  function currentItem() {
    return currentItems().find((item) => Number(item.slot) === Number(currentSlot)) || currentItems()[0] || null;
  }

  function makeSlot(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mantra-library__slot";
    button.style.setProperty("--slot-rgb", item.color || "164, 230, 234");
    button.dataset.slot = item.slot;
    button.setAttribute("aria-current", String(Number(item.slot) === Number(currentSlot)));

    const number = document.createElement("span");
    number.className = "mantra-library__slot-number";
    number.textContent = item.slot;
    const name = document.createElement("span");
    name.className = "mantra-library__slot-name";
    name.textContent = item.label || "Future Mantra";
    const type = document.createElement("span");
    type.className = "mantra-library__slot-type";
    type.textContent = item.reserved ? "reserved" : item.source_type === "vocoder" ? "vocoder" : "sample";
    button.append(number, name, type);
    button.addEventListener("click", () => {
      currentSlot = Number(item.slot);
      renderLibrary();
    });
    return button;
  }

  async function renderLibrary() {
    bankButtons.forEach((button) => {
      const active = button.dataset.studioBank === currentBank;
      button.setAttribute("aria-selected", String(active));
    });
    slots.replaceChildren(...currentItems().map(makeSlot));
    selected = currentItem();
    await loadSelected();
  }

  function activeFxSettings() {
    return fxState[fxState.active === "b" ? "b" : "a"];
  }

  function captureFxControls() {
    const settings = activeFxSettings();
    if (!settings) return;
    settings.reverb = {
      mix: Number(fxFields.reverbMix.value),
      decay: Number(fxFields.reverbDecay.value),
      predelay: Number(fxFields.reverbPredelay.value),
    };
    settings.spectral_delay = {
      mix: Number(fxFields.spectralMix.value),
      time: Number(fxFields.spectralTime.value),
      spread: Number(fxFields.spectralSpread.value),
      feedback: Number(fxFields.spectralFeedback.value),
    };
    fxState = fxEngine?.normaliseState?.(fxState) || fxState;
  }

  function loadFxControls() {
    const settings = activeFxSettings();
    if (!settings) return;
    fxFields.reverbMix.value = String(settings.reverb.mix);
    fxFields.reverbDecay.value = String(settings.reverb.decay);
    fxFields.reverbPredelay.value = String(settings.reverb.predelay);
    fxFields.spectralMix.value = String(settings.spectral_delay.mix);
    fxFields.spectralTime.value = String(settings.spectral_delay.time);
    fxFields.spectralSpread.value = String(settings.spectral_delay.spread);
    fxFields.spectralFeedback.value = String(settings.spectral_delay.feedback);
    fxSlotButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.fxSlot === fxState.active));
    });
    fxBypassButton?.setAttribute("aria-pressed", String(fxState.bypass));
    fxPanel?.classList.toggle("is-bypassed", fxState.bypass);
  }

  function updateFxOutputs() {
    document.querySelector("[data-fx-reverb-mix-output]").textContent = `${Math.round(Number(fxFields.reverbMix.value) * 100)}%`;
    document.querySelector("[data-fx-reverb-decay-output]").textContent = `${Number(fxFields.reverbDecay.value).toFixed(1)}s`;
    document.querySelector("[data-fx-reverb-predelay-output]").textContent = `${Math.round(Number(fxFields.reverbPredelay.value) * 1000)}ms`;
    document.querySelector("[data-fx-spectral-mix-output]").textContent = `${Math.round(Number(fxFields.spectralMix.value) * 100)}%`;
    document.querySelector("[data-fx-spectral-time-output]").textContent = `${Math.round(Number(fxFields.spectralTime.value) * 1000)}ms`;
    document.querySelector("[data-fx-spectral-spread-output]").textContent = `${Math.round(Number(fxFields.spectralSpread.value) * 100)}%`;
    document.querySelector("[data-fx-spectral-feedback-output]").textContent = `${Math.round(Number(fxFields.spectralFeedback.value) * 100)}%`;
  }

  function updateOutputs() {
    document.querySelector("[data-sample-speed-output]").textContent = `${Number(fields.speed.value).toFixed(2)}×`;
    document.querySelector("[data-sample-pan-output]").textContent = `${Math.round(Number(fields.pan.value) * 100)}%`;
    const gain = Number(fields.gain.value);
    document.querySelector("[data-sample-gain-output]").textContent = gain > 0 ? `${(20 * Math.log10(gain)).toFixed(1)} dB` : "−∞ dB";
    document.querySelector("[data-sample-pitch-output]").textContent = `${Number(fields.pitch.value).toFixed(1)} st`;
    document.querySelector("[data-pitch-motion-output]").textContent = `${Number(fields.pitchMotion.value).toFixed(1)} st`;
    document.querySelector("[data-trim-start-output]").textContent = `${Number(fields.trimStart.value).toFixed(3)}s`;
    document.querySelector("[data-trim-end-output]").textContent = `${Number(fields.trimEnd.value).toFixed(3)}s`;
    document.querySelector("[data-vocoder-rate-output]").textContent = `${Number(vocoderRate.value).toFixed(2)}×`;
    const tone = Math.round(Number(vocoderTone.value));
    document.querySelector("[data-vocoder-tone-output]").textContent = `${tone > 0 ? "+" : ""}${tone} st`;
    document.querySelector("[data-vocoder-effect-output]").textContent = `${Math.round(Number(vocoderEffect.value) * 100)}%`;
    updateFxOutputs();
  }

  function trimmedRms(buffer) {
    const startTime = Math.max(0, Number(fields.trimStart.value) || 0);
    const endTime = Math.min(buffer.duration, Number(fields.trimEnd.value) || buffer.duration);
    const start = Math.max(0, Math.floor(startTime * buffer.sampleRate));
    const end = Math.min(buffer.length, Math.ceil(endTime * buffer.sampleRate));
    if (end <= start) return 0;
    let energy = 0;
    let count = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = start; index < end; index += 1) {
        energy += data[index] * data[index];
        count += 1;
      }
    }
    return count ? Math.sqrt(energy / count) : 0;
  }

  function normaliseSelectedSample() {
    if (!decodedBuffer) {
      announce("Choose a pad with audio before normalising.");
      return;
    }
    const average = trimmedRms(decodedBuffer);
    if (!Number.isFinite(average) || average < 0.00001) {
      announce("The selected audio is too quiet to normalise.");
      return;
    }
    const normalisedGain = Math.min(MAX_GAIN, NORMALISE_TARGET_RMS / average);
    fields.gain.value = String(Number(normalisedGain.toFixed(3)));
    updateOutputs();
    const appliedDb = 20 * Math.log10(normalisedGain);
    const limitCopy = normalisedGain >= MAX_GAIN - 0.001 ? " · maximum +24.0 dB applied" : "";
    announce(`average normalised to ${NORMALISE_TARGET_DB} dBFS · ${appliedDb >= 0 ? "+" : ""}${appliedDb.toFixed(1)} dB gain${limitCopy}`);
  }

  function createPeakLimiter(ctx) {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.08;
    return limiter;
  }

  async function decodeAsset(item) {
    decodedBuffer = null;
    if (!item?.asset) return;
    try {
      const response = await fetch(item.asset, { cache: "no-store" });
      if (!response.ok) throw new Error();
      decodedBuffer = await context().decodeAudioData(await response.arrayBuffer());
    } catch {
      announce("This pad has no decodable audio yet.");
    }
  }

  async function loadSelected() {
    stopPreview();
    if (!selected) return;
    fields.label.value = selected.label || "";
    fields.phrase.value = selected.phrase || "";
    fields.speed.value = String(Number(selected.speed) || 1);
    fields.pan.value = String(Number(selected.pan) || 0);
    fields.gain.value = String(Number.isFinite(Number(selected.gain)) ? Number(selected.gain) : 1);
    fields.pitch.value = String(Number(selected.pitch) || 0);
    fields.pitchMotion.value = String(Number(selected.pitch_motion) || 0);
    fields.attack.value = String(Number(selected.amp_envelope?.attack) || 0.02);
    fields.level.value = String(Number.isFinite(Number(selected.amp_envelope?.level)) ? Number(selected.amp_envelope.level) : 1);
    fields.release.value = String(Number(selected.amp_envelope?.release) || 0.08);
    pitchCurve = Array.isArray(selected.pitch_curve) && selected.pitch_curve.length > 1
      ? selected.pitch_curve.map((point) => ({ x: Number(point.x), y: Number(point.y) }))
      : [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    fxState = fxEngine?.normaliseState?.(selected.fx) || fxState;
    loadFxControls();
    announce(`loading ${selected.label || "pad"}…`);
    await decodeAsset(selected);
    normaliseButton.disabled = !decodedBuffer;
    const duration = decodedBuffer?.duration || Math.max(1, Number(selected.trim_end) || 1);
    fields.trimStart.max = String(duration);
    fields.trimEnd.max = String(duration);
    fields.trimStart.value = String(Math.min(duration, Number(selected.trim_start) || 0));
    fields.trimEnd.value = String(Math.min(duration, Number(selected.trim_end) || duration));
    updateOutputs();
    drawAll();
    announce(selected.reserved ? "reserved pad · upload or synthesize audio" : `${selected.label} ready`);
  }

  function canvasContext(canvas) {
    const scale = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function drawGrid(ctx, width, height, vertical = 6, horizontal = 4) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,.13)";
    ctx.lineWidth = 1;
    for (let index = 0; index <= vertical; index += 1) {
      const x = width * index / vertical;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let index = 0; index <= horizontal; index += 1) {
      const y = height * index / horizontal;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawWaveform(canvas, { trim = false, pitch = false } = {}) {
    const { ctx, width, height } = canvasContext(canvas);
    drawGrid(ctx, width, height);
    const data = decodedBuffer?.getChannelData(0);
    if (data?.length) {
      const stride = Math.max(1, Math.floor(data.length / width));
      ctx.fillStyle = pitch ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.82)";
      for (let x = 0; x < width; x += 1) {
        let peak = 0;
        const start = Math.floor(x * stride);
        const end = Math.min(data.length, start + stride);
        for (let index = start; index < end; index += 1) peak = Math.max(peak, Math.abs(data[index]));
        const bar = Math.max(1, peak * height * 0.76);
        ctx.fillRect(x, (height - bar) / 2, 1, bar);
      }
    }
    if (trim && decodedBuffer) {
      const startX = Number(fields.trimStart.value) / decodedBuffer.duration * width;
      const endX = Number(fields.trimEnd.value) / decodedBuffer.duration * width;
      ctx.fillStyle = "rgba(2,10,18,.7)";
      ctx.fillRect(0, 0, startX, height);
      ctx.fillRect(endX, 0, width - endX, height);
      ctx.strokeStyle = "#67e8c6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
      ctx.strokeStyle = "#ff7a85";
      ctx.beginPath();
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }
    return { ctx, width, height };
  }

  function drawPitch() {
    const { ctx, width, height } = drawWaveform(pitchCanvas, { pitch: true });
    ctx.fillStyle = "rgba(216,255,66,.07)";
    ctx.fillRect(0, height / 2, width, height / 2);
    ctx.strokeStyle = "#d8ff42";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pitchCurve.forEach((point, index) => {
      const x = Math.max(0, Math.min(1, Number(point.x))) * width;
      const y = (0.5 - Math.max(-12, Math.min(12, Number(point.y))) / 24) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "10px Helvetica Neue";
    ctx.fillText("+12", 8, 14);
    ctx.fillText("0", 8, height / 2 - 7);
    ctx.fillText("−12", 8, height - 9);
  }

  function drawAmp() {
    const { ctx, width, height } = drawWaveform(ampCanvas, { pitch: true });
    const attack = Number(fields.attack.value);
    const level = Number(fields.level.value);
    const release = Number(fields.release.value);
    const points = [
      [0, height],
      [attack * width, (1 - level) * height],
      [(1 - release) * width, (1 - level) * height],
      [width, height],
    ];
    ctx.fillStyle = "rgba(216,255,66,.08)";
    ctx.beginPath();
    ctx.moveTo(0, height);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(width, height);
    ctx.fill();
    ctx.strokeStyle = "#67e8c6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }

  function drawFx() {
    if (!fxCanvas) return;
    const { ctx, width, height } = drawWaveform(fxCanvas, { pitch: true });
    const settings = activeFxSettings();
    if (!settings) return;
    if (settings.reverb.mix > 0) {
      const tailWidth = width * Math.min(0.85, settings.reverb.decay / 7);
      const gradient = ctx.createLinearGradient(width - tailWidth, 0, width, 0);
      gradient.addColorStop(0, "rgba(103,232,198,0)");
      gradient.addColorStop(1, `rgba(103,232,198,${(settings.reverb.mix * 0.34).toFixed(3)})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(width - tailWidth, 0, tailWidth, height);
    }
    if (settings.spectral_delay.mix > 0) {
      const colors = ["103,232,198", "216,255,66", "157,134,255", "255,122,133"];
      colors.forEach((color, index) => {
        const delayShift = settings.spectral_delay.time * (0.42 + index * settings.spectral_delay.spread * 0.18);
        const xShift = width * Math.min(0.22, delayShift / 2.6);
        const y = height * (0.25 + index * 0.17);
        ctx.strokeStyle = `rgba(${color},${(settings.spectral_delay.mix * 0.82).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xShift, y);
        ctx.bezierCurveTo(width * 0.34, y - 10, width * 0.68, y + 10, width, y);
        ctx.stroke();
      });
    }
    ctx.fillStyle = "rgba(255,255,255,.58)";
    ctx.font = "10px Helvetica Neue";
    ctx.fillText(`${fxState.active.toUpperCase()} · ${fxState.bypass ? "BYPASS" : "ACTIVE"}`, 10, 16);
  }

  function drawAll() {
    drawWaveform(waveformCanvas, { trim: true });
    drawPitch();
    drawAmp();
    drawFx();
  }

  function simplifyCurve(points, count = 48) {
    if (points.length < 2) return [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    const sorted = points.slice().sort((a, b) => a.x - b.x);
    const result = [];
    for (let index = 0; index < count; index += 1) {
      const x = index / (count - 1);
      let nearest = sorted[0];
      for (const point of sorted) {
        if (Math.abs(point.x - x) < Math.abs(nearest.x - x)) nearest = point;
      }
      result.push({ x: Number(x.toFixed(4)), y: Number(nearest.y.toFixed(2)) });
    }
    return result;
  }

  function pitchPoint(event) {
    const rect = pitchCanvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(-12, Math.min(12, (0.5 - (event.clientY - rect.top) / rect.height) * 24)),
    };
  }

  function stopPreview() {
    if (previewSource) {
      try { previewSource.stop(); } catch {}
      previewSource = null;
    }
    previewNodes.forEach((node) => {
      try { node.disconnect(); } catch {}
    });
    previewNodes = [];
    window.cancelAnimationFrame(previewAnimation);
    previewAnimation = 0;
    if (vuMeter) vuMeter.style.height = "0%";
  }

  async function previewBuffer(buffer = decodedBuffer, { raw = false, statusTarget = studioStatus } = {}) {
    if (!buffer) {
      announce("Upload or generate audio for this pad first.", statusTarget);
      return;
    }
    stopPreview();
    const ctx = context();
    await ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = raw ? 1 : Number(fields.speed.value) || 1;
    const basePitch = raw ? 0 : Number(fields.pitch.value) || 0;
    const motion = raw ? 0 : Number(fields.pitchMotion.value) || 0;
    const start = raw ? 0 : Math.max(0, Number(fields.trimStart.value) || 0);
    const end = raw ? buffer.duration : Math.min(buffer.duration, Number(fields.trimEnd.value) || buffer.duration);
    const duration = Math.max(0.01, end - start);
    source.detune.setValueAtTime(basePitch * 100, ctx.currentTime);
    (raw ? [{ x: 0, y: 0 }, { x: 1, y: 0 }] : pitchCurve).forEach((point) => {
      const curvePitch = (Number(point.y) || 0) + Math.sin(Number(point.x) * Math.PI * 2) * motion;
      source.detune.linearRampToValueAtTime((basePitch + curvePitch) * 100, ctx.currentTime + Number(point.x) * duration);
    });

    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const limiter = createPeakLimiter(ctx);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const attack = raw ? Math.min(0.01, duration * 0.25) : Math.min(duration * 0.9, Math.max(0.005, Number(fields.attack.value) * duration));
    const release = raw ? Math.min(0.05, duration * 0.25) : Math.min(duration * 0.9, Math.max(0.005, Number(fields.release.value) * duration));
    const peak = raw ? 0.92 : Math.max(0.0001, Number(fields.gain.value) * Number(fields.level.value));
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
    gain.gain.setValueAtTime(peak, ctx.currentTime + Math.max(attack, duration - release));
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);
    limiter.connect(analyser).connect(ctx.destination);
    source.connect(gain);
    previewNodes = [source, gain, limiter, analyser];
    let effectInput = gain;
    if (pan) {
      pan.pan.value = raw ? 0 : Number(fields.pan.value) || 0;
      gain.connect(pan);
      effectInput = pan;
      previewNodes.push(pan);
    }
    if (!raw && fxEngine?.connect) {
      captureFxControls();
      const effectGraph = fxEngine.connect({
        ctx,
        input: effectInput,
        destination: limiter,
        state: fxState,
      });
      previewNodes.push(...(effectGraph.nodes || []));
    } else {
      effectInput.connect(limiter);
    }
    const samples = new Uint8Array(analyser.frequencyBinCount);
    const meter = () => {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      samples.forEach((sample) => { energy += ((sample - 128) / 128) ** 2; });
      const level = Math.min(1, Math.sqrt(energy / samples.length) * 2.3);
      if (vuMeter) vuMeter.style.height = `${Math.round(level * 100)}%`;
      previewAnimation = window.requestAnimationFrame(meter);
    };
    source.addEventListener("ended", stopPreview, { once: true });
    previewSource = source;
    source.start(0, start, duration);
    meter();
    announce("previewing · retrigger anytime", statusTarget);
  }

  async function savePad() {
    if (!selected) return;
    try {
      captureFxControls();
      const payload = await api({
        action: "save",
        csrf_token: csrfToken,
        bank: currentBank,
        slot: currentSlot,
        label: fields.label.value,
        phrase: fields.phrase.value,
        trim_start: Number(fields.trimStart.value),
        trim_end: Number(fields.trimEnd.value),
        gain: Number(fields.gain.value),
        pan: Number(fields.pan.value),
        speed: Number(fields.speed.value),
        pitch: Number(fields.pitch.value),
        pitch_motion: Number(fields.pitchMotion.value),
        pitch_curve: pitchCurve,
        amp_envelope: {
          attack: Number(fields.attack.value),
          level: Number(fields.level.value),
          release: Number(fields.release.value),
        },
        fx: fxState,
      });
      library = payload.library;
      csrfToken = payload.csrf_token || csrfToken;
      renderLibrary();
      announce("pad saved");
    } catch (error) {
      announce(error.message);
    }
  }

  async function uploadAudio(file, sourceType = "owner_upload", duration = 0, target = null) {
    const targetBank = target?.bank || currentBank;
    const targetSlot = Number(target?.slot ?? currentSlot);
    const targetItem = target?.item || selected;
    if (!file || !targetItem) throw new Error("Choose a pad and audio file first.");
    const data = new FormData();
    data.set("action", "upload");
    data.set("csrf_token", csrfToken);
    data.set("bank", targetBank);
    data.set("slot", String(targetSlot));
    data.set("label", target?.label || fields.label.value || targetItem.label || "Mantra");
    data.set("phrase", target?.phrase || fields.phrase.value || targetItem.phrase || "");
    data.set("source_type", sourceType);
    data.set("duration", String(duration || decodedBuffer?.duration || 1));
    data.set("audio", file, file.name);
    const payload = await api(data, { form: true });
    library = payload.library;
    csrfToken = payload.csrf_token || csrfToken;
    await renderLibrary();
  }

  function voiceRequest() {
    return {
      csrf_token: csrfToken,
      text: vocoderText.value.trim(),
      preset: vocoderVoice,
      speed: Number(vocoderRate.value),
      tone: Number(vocoderTone.value),
      effect_amount: Number(vocoderEffect.value),
    };
  }

  function voiceRequestKey(request = voiceRequest()) {
    return JSON.stringify({
      text: request.text,
      preset: request.preset,
      speed: request.speed,
      tone: request.tone,
      effect_amount: request.effect_amount,
    });
  }

  function invalidateVoiceRender() {
    renderedVocoder = null;
    renderedVocoderBuffer = null;
    renderedVocoderDuration = 0;
    renderedVocoderKey = "";
  }

  function setVoiceBusy(active) {
    voiceRequestActive = active;
    vocoderPreviewButton.disabled = active;
    vocoderSaveButton.disabled = active;
    vocoderButtons.forEach((button) => { button.disabled = active; });
  }

  async function fetchVoice(request) {
    const response = await fetch(voiceEndpoint, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "The voice could not be generated.");
    }
    const blob = await response.blob();
    if (!blob.size || !String(blob.type).includes("audio")) {
      throw new Error("The voice service returned an invalid audio file.");
    }
    return blob;
  }

  function bufferFromProcessedVoice(processed) {
    const buffer = context().createBuffer(1, processed.samples.length, processed.sampleRate);
    buffer.copyToChannel(processed.samples, 0);
    return buffer;
  }

  function voiceFamily(preset = vocoderVoice) {
    if (preset.startsWith("robot-")) return "robot";
    if (preset.startsWith("vocoder-")) return "vocoder";
    return "human";
  }

  async function renderVocoder({ preview = true } = {}) {
    if (voiceRequestActive) throw new Error("A voice is already being generated.");
    const request = voiceRequest();
    if (!request.text) throw new Error("Write a line for the voice first.");
    if (!csrfToken) throw new Error("Refresh the studio and sign in again.");
    const requestKey = voiceRequestKey(request);
    setVoiceBusy(true);
    try {
      const family = voiceFamily(request.preset);
      announce(family === "human" ? "generating clear speech…" : `generating speech + ${family} carrier…`, vocoderStatus);
      if (!renderedVocoder || renderedVocoderKey !== requestKey) {
        const speech = await fetchVoice(request);
        const speechBuffer = await context().decodeAudioData(await speech.arrayBuffer());
        if (family === "human") {
          renderedVocoder = speech;
          renderedVocoderBuffer = speechBuffer;
          renderedVocoderDuration = speechBuffer.duration;
        } else {
          const processor = globalThis.IAMMantraVoiceDSP;
          if (!processor?.processVoice) throw new Error("The robot voice processor did not load. Refresh and try again.");
          const processed = processor.processVoice({
            audioBuffer: speechBuffer,
            preset: request.preset,
            tone: request.tone,
            effectAmount: request.effect_amount,
          });
          renderedVocoder = processed.blob;
          renderedVocoderBuffer = bufferFromProcessedVoice(processed);
          renderedVocoderDuration = processed.duration;
        }
        renderedVocoderKey = requestKey;
      }
      const decoded = renderedVocoderBuffer || await context().decodeAudioData(await renderedVocoder.arrayBuffer());
      renderedVocoderBuffer = decoded;
      renderedVocoderDuration = decoded.duration;
      const voiceLabel = vocoderButtons.find((button) => button.dataset.vocoderVoice === vocoderVoice)?.textContent?.trim() || "Voice";
      announce(`${voiceLabel} ${family} ready · ${decoded.duration.toFixed(2)}s`, vocoderStatus);
      if (preview) await previewBuffer(decoded, { raw: true, statusTarget: vocoderStatus });
      return renderedVocoder;
    } finally {
      setVoiceBusy(false);
    }
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ownerKey = new FormData(loginForm).get("owner_key");
    try {
      const payload = await api({ action: "login", owner_key: ownerKey });
      library = payload.library;
      csrfToken = payload.csrf_token;
      loginForm.reset();
      setAuthenticated(true);
      renderLibrary();
    } catch (error) {
      announce(error.message, loginStatus);
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try { await api({ action: "logout" }); } catch {}
    setAuthenticated(false);
  });

  bankButtons.forEach((button) => button.addEventListener("click", () => {
    currentBank = button.dataset.studioBank;
    currentSlot = 1;
    renderLibrary();
  }));

  tabButtons.forEach((button) => button.addEventListener("click", () => {
    const tab = button.dataset.editorTab;
    tabButtons.forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === button)));
    tabPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.editorPanel === tab));
    window.requestAnimationFrame(drawAll);
  }));

  Object.values(fields).filter(Boolean).forEach((field) => field.addEventListener("input", () => {
    if (field === fields.trimStart && Number(fields.trimStart.value) >= Number(fields.trimEnd.value)) {
      fields.trimStart.value = String(Math.max(0, Number(fields.trimEnd.value) - 0.01));
    }
    if (field === fields.trimEnd && Number(fields.trimEnd.value) <= Number(fields.trimStart.value)) {
      fields.trimEnd.value = String(Math.min(Number(fields.trimEnd.max), Number(fields.trimStart.value) + 0.01));
    }
    updateOutputs();
    drawAll();
  }));

  Object.values(fxFields).filter(Boolean).forEach((field) => field.addEventListener("input", () => {
    captureFxControls();
    updateFxOutputs();
    drawFx();
    announce(`FX ${fxState.active.toUpperCase()} ready · preview or save`);
  }));

  fxSlotButtons.forEach((button) => button.addEventListener("click", () => {
    captureFxControls();
    fxState.active = button.dataset.fxSlot === "b" ? "b" : "a";
    loadFxControls();
    updateFxOutputs();
    drawFx();
    announce(`FX ${fxState.active.toUpperCase()} selected · preview to compare`);
  }));

  fxBypassButton?.addEventListener("click", () => {
    captureFxControls();
    fxState.bypass = !fxState.bypass;
    loadFxControls();
    drawFx();
    announce(fxState.bypass ? "FX bypassed · original pad preview" : `FX ${fxState.active.toUpperCase()} active`);
  });

  pitchCanvas?.addEventListener("pointerdown", (event) => {
    drawingPitch = true;
    pitchCurve = [pitchPoint(event)];
    pitchCanvas.setPointerCapture(event.pointerId);
    drawPitch();
  });
  pitchCanvas?.addEventListener("pointermove", (event) => {
    if (!drawingPitch) return;
    pitchCurve.push(pitchPoint(event));
    drawPitch();
  });
  pitchCanvas?.addEventListener("pointerup", (event) => {
    if (!drawingPitch) return;
    pitchCurve.push(pitchPoint(event));
    pitchCurve = simplifyCurve(pitchCurve);
    drawingPitch = false;
    drawPitch();
    announce("pitch line ready · preview or save");
  });
  document.querySelector("[data-pitch-reset]")?.addEventListener("click", () => {
    pitchCurve = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    drawPitch();
  });

  document.querySelector("[data-sample-preview]")?.addEventListener("click", () => previewBuffer());
  normaliseButton?.addEventListener("click", normaliseSelectedSample);
  document.querySelector("[data-sample-save]")?.addEventListener("click", savePad);
  document.querySelector("[data-sample-upload-button]")?.addEventListener("click", async () => {
    try {
      const file = fields.upload.files?.[0];
      if (!file) throw new Error("Choose an audio file first.");
      announce("uploading audio…");
      await uploadAudio(file);
      fields.upload.value = "";
      announce("audio uploaded · trim it in Sample");
    } catch (error) {
      announce(error.message);
    }
  });

  document.querySelectorAll("[data-vocoder-script]").forEach((button) => button.addEventListener("click", () => {
    vocoderText.value = button.dataset.vocoderScript;
    invalidateVoiceRender();
    announce("script ready · choose a voice or generate", vocoderStatus);
  }));
  vocoderButtons.forEach((button) => button.addEventListener("click", () => {
    vocoderVoice = button.dataset.vocoderVoice;
    vocoderButtons.forEach((candidate) => candidate.setAttribute("aria-checked", String(candidate === button)));
    invalidateVoiceRender();
    announce(`${button.textContent.trim()} selected · generate to hear it`, vocoderStatus);
  }));
  vocoderText?.addEventListener("input", invalidateVoiceRender);
  [vocoderRate, vocoderTone, vocoderEffect].forEach((field) => field?.addEventListener("input", () => {
    invalidateVoiceRender();
    updateOutputs();
  }));
  vocoderPreviewButton?.addEventListener("click", async () => {
    try { await renderVocoder(); } catch (error) { announce(error.message, vocoderStatus); }
  });
  vocoderSaveButton?.addEventListener("click", async () => {
    try {
      if (!selected) throw new Error("Choose one of the twelve pads first.");
      const target = {
        bank: currentBank,
        slot: currentSlot,
        item: selected,
        label: fields.label.value || selected.label || "Voice",
        phrase: vocoderText.value.trim(),
      };
      if (!renderedVocoder || renderedVocoderKey !== voiceRequestKey()) await renderVocoder({ preview: false });
      const file = new File([renderedVocoder], `${target.bank}-${target.slot}-voice.wav`, { type: "audio/wav" });
      announce("saving voice to selected pad…", vocoderStatus);
      await uploadAudio(file, "vocoder", renderedVocoderDuration, target);
      const bankLabel = target.bank === "tibet" ? "Tibet" : "Ibiza";
      announce(`voice saved to ${bankLabel} pad ${target.slot}`, vocoderStatus);
    } catch (error) {
      announce(error.message, vocoderStatus);
    }
  });

  window.addEventListener("resize", drawAll);
  window.addEventListener("pagehide", stopPreview);
  updateOutputs();
  loadSession();
})();
