(() => {
  "use strict";

  const endpoint = "api/mantra-library.php";
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
  const vuMeter = document.querySelector("[data-vu-meter]");
  const vocoderText = document.querySelector("[data-vocoder-text]");
  const vocoderRate = document.querySelector("[data-vocoder-rate]");
  const vocoderPitch = document.querySelector("[data-vocoder-pitch]");
  const vocoderRobot = document.querySelector("[data-vocoder-robot]");

  let library = null;
  let csrfToken = "";
  let currentBank = "tibet";
  let currentSlot = 1;
  let selected = null;
  let audioContext = null;
  let decodedBuffer = null;
  let previewSource = null;
  let previewAnimation = 0;
  let pitchCurve = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  let drawingPitch = false;
  let renderedVocoder = null;
  let renderedVocoderDuration = 0;
  let vocoderVoice = "machine";

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
    document.querySelector("[data-vocoder-pitch-output]").textContent = `${Math.round(Number(vocoderPitch.value))} Hz`;
    document.querySelector("[data-vocoder-robot-output]").textContent = `${Math.round(Number(vocoderRobot.value) * 100)}%`;
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
    announce(`loading ${selected.label || "pad"}…`);
    await decodeAsset(selected);
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

  function drawAll() {
    drawWaveform(waveformCanvas, { trim: true });
    drawPitch();
    drawAmp();
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
    window.cancelAnimationFrame(previewAnimation);
    previewAnimation = 0;
    if (vuMeter) vuMeter.style.height = "0%";
  }

  async function previewBuffer(buffer = decodedBuffer) {
    if (!buffer) {
      announce("Upload or render audio for this pad first.");
      return;
    }
    stopPreview();
    const ctx = context();
    await ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Number(fields.speed.value) || 1;
    const basePitch = Number(fields.pitch.value) || 0;
    const motion = Number(fields.pitchMotion.value) || 0;
    const start = Math.max(0, Number(fields.trimStart.value) || 0);
    const end = Math.min(buffer.duration, Number(fields.trimEnd.value) || buffer.duration);
    const duration = Math.max(0.01, end - start);
    source.detune.setValueAtTime(basePitch * 100, ctx.currentTime);
    pitchCurve.forEach((point) => {
      const curvePitch = (Number(point.y) || 0) + Math.sin(Number(point.x) * Math.PI * 2) * motion;
      source.detune.linearRampToValueAtTime((basePitch + curvePitch) * 100, ctx.currentTime + Number(point.x) * duration);
    });

    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const attack = Math.min(duration * 0.9, Math.max(0.005, Number(fields.attack.value) * duration));
    const release = Math.min(duration * 0.9, Math.max(0.005, Number(fields.release.value) * duration));
    const peak = Math.max(0.0001, Number(fields.gain.value) * Number(fields.level.value));
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
    gain.gain.setValueAtTime(peak, ctx.currentTime + Math.max(attack, duration - release));
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);
    if (pan) {
      pan.pan.value = Number(fields.pan.value) || 0;
      source.connect(gain).connect(pan).connect(analyser).connect(ctx.destination);
    } else {
      source.connect(gain).connect(analyser).connect(ctx.destination);
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
    announce("previewing · retrigger anytime");
  }

  async function savePad() {
    if (!selected) return;
    try {
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
      });
      library = payload.library;
      csrfToken = payload.csrf_token || csrfToken;
      renderLibrary();
      announce("pad saved");
    } catch (error) {
      announce(error.message);
    }
  }

  async function uploadAudio(file, sourceType = "owner_upload", duration = 0) {
    if (!file || !selected) throw new Error("Choose a pad and audio file first.");
    const data = new FormData();
    data.set("action", "upload");
    data.set("csrf_token", csrfToken);
    data.set("bank", currentBank);
    data.set("slot", String(currentSlot));
    data.set("label", fields.label.value || selected.label || "Mantra");
    data.set("phrase", fields.phrase.value || selected.phrase || "");
    data.set("source_type", sourceType);
    data.set("duration", String(duration || decodedBuffer?.duration || 1));
    data.set("audio", file, file.name);
    const payload = await api(data, { form: true });
    library = payload.library;
    csrfToken = payload.csrf_token || csrfToken;
    await renderLibrary();
  }

  const phonemeMap = {
    AA: [730, 1090, 2440], AH: [640, 1190, 2390], AE: [660, 1720, 2410],
    EH: [530, 1840, 2480], ER: [490, 1350, 1690], IH: [400, 1990, 2550],
    IY: [270, 2290, 3010], OW: [570, 840, 2410], UW: [300, 870, 2240],
    AY: [660, 1720, 2410], OY: [570, 840, 2410],
  };

  const wordPhonemes = {
    PEACE: ["P", "IY", "S"], LOVE: ["L", "AH", "V"], UNITY: ["Y", "UW", "N", "IH", "T", "IY"],
    RESPECT: ["R", "IH", "S", "P", "EH", "K", "T"], PLUR: ["P", "L", "ER"],
    IBIZA: ["IH", "B", "IY", "Z", "AH"], ITS: ["IH", "T", "S"], THE: ["D", "AH"],
    LIFESTYLE: ["L", "AY", "F", "S", "T", "AY", "L"], WERE: ["W", "IY", "ER"],
    WE: ["W", "IY"], LIVING: ["L", "IH", "V", "IH", "N"], OM: ["OW", "M"],
    NAMO: ["N", "AA", "M", "OW"], NARAYANA: ["N", "AA", "R", "AA", "Y", "AA", "N", "AA"],
  };

  function textPhonemes(text) {
    const words = String(text).toUpperCase().match(/[A-Z']+|[.,!?]/g) || [];
    const result = [];
    const vowels = { A: "AA", E: "EH", I: "IH", O: "OW", U: "UW" };
    words.forEach((word) => {
      if (/^[.,!?]$/.test(word)) {
        result.push("_", "_");
      } else if (wordPhonemes[word]) {
        result.push(...wordPhonemes[word], "_");
      } else {
        Array.from(word.replace(/'/g, "")).forEach((letter) => result.push(vowels[letter] || letter));
        result.push("_");
      }
    });
    return result;
  }

  function voiceSettings(name) {
    return {
      machine: { formant: 1, breath: 0.16, wobble: 0.02, ring: 74 },
      oracle: { formant: 0.83, breath: 0.1, wobble: 0.08, ring: 39 },
      neon: { formant: 1.24, breath: 0.08, wobble: 0.14, ring: 93 },
      temple: { formant: 0.72, breath: 0.19, wobble: 0.04, ring: 31 },
      astral: { formant: 1.1, breath: 0.2, wobble: 0.22, ring: 58 },
      human: { formant: 1, breath: 0.06, wobble: 0.035, ring: 0 },
    }[name] || { formant: 1, breath: 0.1, wobble: 0.04, ring: 60 };
  }

  function seededNoise(index) {
    const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  function synthesizeVocoder(text, options = {}) {
    const sampleRate = 44100;
    const rate = Math.max(0.55, Number(options.rate) || 0.95);
    const basePitch = Math.max(55, Number(options.pitch) || 105);
    const robot = Math.max(0, Math.min(1, Number(options.robot) || 0));
    const voice = voiceSettings(options.voice);
    const phonemes = textPhonemes(text).slice(0, 240);
    const segments = phonemes.map((phoneme) => {
      if (phoneme === "_") return { phoneme, duration: 0.07 / rate };
      if (phonemeMap[phoneme]) return { phoneme, duration: 0.13 / rate };
      return { phoneme, duration: 0.055 / rate };
    });
    const duration = segments.reduce((sum, segment) => sum + segment.duration, 0) + 0.16;
    const pcm = new Float32Array(Math.ceil(duration * sampleRate));
    let cursor = Math.floor(0.04 * sampleRate);
    let phase = 0;
    segments.forEach((segment, segmentIndex) => {
      const count = Math.max(1, Math.floor(segment.duration * sampleRate));
      const formants = phonemeMap[segment.phoneme];
      for (let index = 0; index < count && cursor + index < pcm.length; index += 1) {
        const t = index / sampleRate;
        const position = index / count;
        const envelope = Math.min(1, position * 12) * Math.min(1, (1 - position) * 14);
        const absolute = (cursor + index) / sampleRate;
        const pitch = basePitch * (1 + Math.sin(absolute * Math.PI * 2 * 4.1) * voice.wobble);
        phase += Math.PI * 2 * pitch / sampleRate;
        let sample = 0;
        if (formants) {
          const glottal = Math.sin(phase) + 0.34 * Math.sin(phase * 2) + 0.16 * Math.sin(phase * 3);
          const vowel = formants.reduce((sum, frequency, formantIndex) => (
            sum + Math.sin(Math.PI * 2 * frequency * voice.formant * t + phase * 0.08) * [0.44, 0.23, 0.1][formantIndex]
          ), 0);
          sample = glottal * 0.32 + vowel;
        } else if (segment.phoneme !== "_") {
          const voiced = /[LMNRVWYBDGZ]/.test(segment.phoneme);
          const noise = seededNoise(index + segmentIndex * 1777);
          sample = noise * (voiced ? 0.22 : 0.48) + (voiced ? Math.sin(phase) * 0.42 : 0);
        }
        const ring = voice.ring ? Math.sin(Math.PI * 2 * voice.ring * absolute) : 1;
        const breath = seededNoise(index + segmentIndex * 913) * voice.breath;
        pcm[cursor + index] += (sample * (1 - robot * 0.22) + sample * ring * robot * 0.34 + breath) * envelope * 0.54;
      }
      cursor += count;
    });
    let peak = 0;
    pcm.forEach((sample) => { peak = Math.max(peak, Math.abs(sample)); });
    const normalization = peak > 0 ? 0.88 / peak : 1;
    for (let index = 0; index < pcm.length; index += 1) pcm[index] *= normalization;
    return { pcm, sampleRate, duration: pcm.length / sampleRate };
  }

  function wavBlob(pcm, sampleRate) {
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const write = (offset, value) => Array.from(value).forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
    write(0, "RIFF");
    view.setUint32(4, 36 + pcm.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, pcm.length * 2, true);
    pcm.forEach((sample, index) => view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true));
    return new Blob([buffer], { type: "audio/wav" });
  }

  async function renderVocoder({ preview = true } = {}) {
    const text = vocoderText.value.trim();
    if (!text) throw new Error("Write a line for the voice first.");
    announce("rendering voice…", vocoderStatus);
    const rendered = synthesizeVocoder(text, {
      rate: vocoderRate.value,
      pitch: vocoderPitch.value,
      robot: vocoderRobot.value,
      voice: vocoderVoice,
    });
    renderedVocoder = wavBlob(rendered.pcm, rendered.sampleRate);
    renderedVocoderDuration = rendered.duration;
    const decoded = await context().decodeAudioData(await renderedVocoder.arrayBuffer());
    announce(`${vocoderVoice} voice ready · ${rendered.duration.toFixed(2)}s`, vocoderStatus);
    if (preview) {
      const previous = decodedBuffer;
      const oldStart = fields.trimStart.value;
      const oldEnd = fields.trimEnd.value;
      decodedBuffer = decoded;
      fields.trimStart.value = "0";
      fields.trimEnd.value = String(decoded.duration);
      await previewBuffer(decoded);
      decodedBuffer = previous;
      fields.trimStart.value = oldStart;
      fields.trimEnd.value = oldEnd;
    }
    return renderedVocoder;
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
  }));
  document.querySelectorAll("[data-vocoder-voice]").forEach((button) => button.addEventListener("click", () => {
    vocoderVoice = button.dataset.vocoderVoice;
    document.querySelectorAll("[data-vocoder-voice]").forEach((candidate) => candidate.setAttribute("aria-checked", String(candidate === button)));
  }));
  [vocoderRate, vocoderPitch, vocoderRobot].forEach((field) => field?.addEventListener("input", updateOutputs));
  document.querySelector("[data-vocoder-preview]")?.addEventListener("click", async () => {
    try { await renderVocoder(); } catch (error) { announce(error.message, vocoderStatus); }
  });
  document.querySelector("[data-vocoder-save]")?.addEventListener("click", async () => {
    try {
      if (currentBank !== "ibiza") throw new Error("Choose one of the six Ibiza pads first.");
      if (!renderedVocoder) await renderVocoder({ preview: false });
      fields.label.value = fields.label.value || "Vocoder";
      fields.phrase.value = vocoderText.value.trim();
      const file = new File([renderedVocoder], `ibiza-${currentSlot}-vocoder.wav`, { type: "audio/wav" });
      announce("saving synth to selected pad…", vocoderStatus);
      await uploadAudio(file, "vocoder", renderedVocoderDuration);
      announce("vocoder sample saved to the selected Ibiza pad", vocoderStatus);
    } catch (error) {
      announce(error.message, vocoderStatus);
    }
  });

  window.addEventListener("resize", drawAll);
  window.addEventListener("pagehide", stopPreview);
  updateOutputs();
  loadSession();
})();
