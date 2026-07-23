(() => {
  "use strict";

  const TAU = Math.PI * 2;

  const ROBOT_PRESETS = Object.freeze({
    "robot-machine": {
      carrier: 36,
      carrierShape: "square",
      drive: 1.9,
      combMs: 3.5,
      feedback: 0.2,
      bits: 11,
      minimumWet: 0.58,
      maximumWet: 0.88,
    },
    "robot-chrome": {
      carrier: 62,
      carrierShape: "trinoid",
      drive: 1.45,
      combMs: 7.5,
      feedback: 0.32,
      bits: 12,
      minimumWet: 0.6,
      maximumWet: 0.9,
    },
    "robot-command": {
      carrier: 28,
      carrierShape: "rectified",
      drive: 2.35,
      combMs: 5.5,
      feedback: 0.38,
      bits: 10,
      minimumWet: 0.65,
      maximumWet: 0.93,
    },
    "robot-android": {
      carrier: 78,
      carrierShape: "triangle",
      drive: 1.55,
      combMs: 4.5,
      feedback: 0.22,
      bits: 12,
      minimumWet: 0.57,
      maximumWet: 0.86,
    },
    "robot-circuit": {
      carrier: 112,
      carrierShape: "stepped",
      drive: 1.8,
      combMs: 2.5,
      feedback: 0.18,
      bits: 9,
      minimumWet: 0.62,
      maximumWet: 0.91,
    },
    "robot-digital": {
      carrier: 146,
      carrierShape: "sample-hold",
      drive: 1.6,
      combMs: 2,
      feedback: 0.14,
      bits: 8,
      minimumWet: 0.6,
      maximumWet: 0.9,
    },
  });

  const VOCODER_PRESETS = Object.freeze({
    "vocoder-neon": {
      carrier: 98,
      bands: 16,
      low: 135,
      high: 6200,
      q: 1.5,
      attackMs: 3.5,
      releaseMs: 48,
      shimmer: 0.42,
      ring: 0.12,
      minimumWet: 0.68,
      maximumWet: 0.94,
    },
    "vocoder-oracle": {
      carrier: 72,
      bands: 14,
      low: 115,
      high: 5300,
      q: 1.35,
      attackMs: 5,
      releaseMs: 72,
      shimmer: 0.16,
      ring: 0.08,
      minimumWet: 0.65,
      maximumWet: 0.91,
    },
    "vocoder-temple": {
      carrier: 55,
      bands: 14,
      low: 105,
      high: 4800,
      q: 1.25,
      attackMs: 5.5,
      releaseMs: 86,
      shimmer: 0.1,
      ring: 0.06,
      minimumWet: 0.66,
      maximumWet: 0.92,
    },
    "vocoder-astral": {
      carrier: 116,
      bands: 16,
      low: 145,
      high: 6500,
      q: 1.6,
      attackMs: 3,
      releaseMs: 62,
      shimmer: 0.5,
      ring: 0.1,
      minimumWet: 0.7,
      maximumWet: 0.95,
    },
    "vocoder-cosmic": {
      carrier: 84,
      bands: 15,
      low: 120,
      high: 5700,
      q: 1.4,
      attackMs: 4.5,
      releaseMs: 78,
      shimmer: 0.28,
      ring: 0.08,
      minimumWet: 0.67,
      maximumWet: 0.93,
    },
    "vocoder-electric": {
      carrier: 138,
      bands: 16,
      low: 155,
      high: 6800,
      q: 1.7,
      attackMs: 2.5,
      releaseMs: 42,
      shimmer: 0.36,
      ring: 0.18,
      minimumWet: 0.72,
      maximumWet: 0.96,
    },
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function rms(samples) {
    let energy = 0;
    for (let index = 0; index < samples.length; index += 1) {
      energy += samples[index] * samples[index];
    }
    return Math.sqrt(energy / Math.max(1, samples.length));
  }

  function copyMono(audioBuffer) {
    const channels = Math.max(1, Number(audioBuffer.numberOfChannels) || 1);
    const length = Number(audioBuffer.length) || audioBuffer.getChannelData(0).length;
    const mono = new Float32Array(length);
    for (let channel = 0; channel < channels; channel += 1) {
      const data = audioBuffer.getChannelData(channel);
      for (let index = 0; index < length; index += 1) mono[index] += data[index] / channels;
    }
    return mono;
  }

  function carrierValue(shape, phase, index, sampleRate) {
    const sine = Math.sin(phase);
    if (shape === "square") return sine >= 0 ? 1 : -1;
    if (shape === "triangle") return 2 / Math.PI * Math.asin(sine);
    if (shape === "rectified") return Math.abs(sine) * 2 - 1;
    if (shape === "stepped") return Math.round(sine * 3) / 3;
    if (shape === "sample-hold") {
      const step = Math.max(1, Math.round(sampleRate / 1800));
      return Math.sin(Math.floor(index / step) * 2.399963229728653);
    }
    if (shape === "trinoid") {
      return Math.sin(phase) * 0.58
        + Math.sin(phase * 1.498307) * 0.27
        + Math.sin(phase * 2.003) * 0.15;
    }
    return sine;
  }

  function normalizeAndFade(samples, targetPeak = 0.94, sampleRate = 24000) {
    let peak = 0;
    for (let index = 0; index < samples.length; index += 1) {
      if (!Number.isFinite(samples[index])) samples[index] = 0;
      peak = Math.max(peak, Math.abs(samples[index]));
    }
    const scale = peak > targetPeak ? targetPeak / peak : 1;
    const fadeSamples = Math.min(Math.floor(sampleRate * 0.006), Math.floor(samples.length / 2));
    for (let index = 0; index < samples.length; index += 1) {
      let fade = 1;
      if (index < fadeSamples) fade = index / Math.max(1, fadeSamples);
      if (index >= samples.length - fadeSamples) fade = (samples.length - 1 - index) / Math.max(1, fadeSamples);
      samples[index] = Math.tanh(samples[index] * scale * 1.12) * Math.max(0, fade);
    }
    return samples;
  }

  function applyRobotDsp(input, sampleRate, preset, tone, effectAmount) {
    const config = ROBOT_PRESETS[preset];
    if (!config) return input.slice();
    const output = new Float32Array(input.length);
    const toneRatio = 2 ** (clamp(tone, -12, 12) / 12);
    const carrierFrequency = config.carrier * toneRatio;
    const wet = config.minimumWet + clamp(effectAmount, 0, 1) * (config.maximumWet - config.minimumWet);
    const dry = 1 - wet * 0.78;
    const phaseStep = TAU * carrierFrequency / sampleRate;
    const combSamples = Math.max(1, Math.round(config.combMs * sampleRate / 1000));
    const comb = new Float32Array(combSamples);
    const levels = 2 ** config.bits;
    let phase = 0;
    let combIndex = 0;

    for (let index = 0; index < input.length; index += 1) {
      const source = input[index];
      const carrier = carrierValue(config.carrierShape, phase, index, sampleRate);
      const ring = source * carrier * 1.75;
      const driven = Math.tanh((source * 0.42 + ring) * config.drive) / Math.tanh(config.drive);
      const delayed = comb[combIndex];
      let robotic = driven + delayed * config.feedback;
      robotic = Math.round(robotic * levels) / levels;
      comb[combIndex] = robotic;
      combIndex = (combIndex + 1) % combSamples;
      output[index] = source * dry + robotic * wet;
      phase += phaseStep;
      if (phase > TAU) phase -= TAU;
    }
    return normalizeAndFade(output, 0.95, sampleRate);
  }

  function bandpassCoefficients(center, q, sampleRate) {
    const omega = TAU * center / sampleRate;
    const alpha = Math.sin(omega) / (2 * q);
    const a0 = 1 + alpha;
    return {
      b0: alpha / a0,
      b1: 0,
      b2: -alpha / a0,
      a1: -2 * Math.cos(omega) / a0,
      a2: (1 - alpha) / a0,
    };
  }

  function applyVocoderDsp(input, sampleRate, preset, tone, effectAmount) {
    const config = VOCODER_PRESETS[preset];
    if (!config) return input.slice();
    const vocoded = new Float32Array(input.length);
    const toneRatio = 2 ** (clamp(tone, -12, 12) / 12);
    const baseCarrier = config.carrier * toneRatio;
    const nyquistSafeHigh = Math.min(config.high, sampleRate * 0.43);
    const low = Math.min(config.low, nyquistSafeHigh * 0.6);
    const attack = Math.exp(-1 / Math.max(1, sampleRate * config.attackMs / 1000));
    const release = Math.exp(-1 / Math.max(1, sampleRate * config.releaseMs / 1000));

    for (let band = 0; band < config.bands; band += 1) {
      const progress = band / Math.max(1, config.bands - 1);
      const center = low * (nyquistSafeHigh / low) ** progress;
      const coefficients = bandpassCoefficients(center, config.q, sampleRate);
      const harmonic = Math.max(1, Math.round(center / baseCarrier));
      const carrierFrequency = Math.min(sampleRate * 0.44, baseCarrier * harmonic);
      const phaseStep = TAU * carrierFrequency / sampleRate;
      const bandWeight = 0.72 + (1 - progress) * 0.28;
      let x1 = 0;
      let x2 = 0;
      let y1 = 0;
      let y2 = 0;
      let envelope = 0;
      let phase = band * 0.731;

      for (let index = 0; index < input.length; index += 1) {
        const source = input[index];
        const filtered = coefficients.b0 * source
          + coefficients.b1 * x1
          + coefficients.b2 * x2
          - coefficients.a1 * y1
          - coefficients.a2 * y2;
        x2 = x1;
        x1 = source;
        y2 = y1;
        y1 = filtered;
        const magnitude = Math.abs(filtered);
        const smoothing = magnitude > envelope ? attack : release;
        envelope = magnitude + smoothing * (envelope - magnitude);
        const carrier = Math.sin(phase)
          + config.shimmer * 0.38 * Math.sin(phase * 2.003)
          + config.shimmer * 0.18 * Math.sin(phase * 3.011);
        vocoded[index] += envelope * carrier * bandWeight;
        phase += phaseStep;
        if (phase > TAU) phase -= TAU;
      }
    }

    const inputLevel = Math.max(0.00001, rms(input));
    const vocoderLevel = Math.max(0.00001, rms(vocoded));
    const carrierScale = clamp(inputLevel / vocoderLevel * 1.35, 0.25, 9);
    const wet = config.minimumWet + clamp(effectAmount, 0, 1) * (config.maximumWet - config.minimumWet);
    const dry = 1 - wet * 0.82;
    const output = new Float32Array(input.length);
    let ringPhase = 0;
    const ringStep = TAU * baseCarrier / sampleRate;

    for (let index = 0; index < input.length; index += 1) {
      const carrierSpeech = vocoded[index] * carrierScale;
      const ring = input[index] * Math.sin(ringPhase) * config.ring;
      output[index] = input[index] * dry + (carrierSpeech + ring) * wet;
      ringPhase += ringStep;
      if (ringPhase > TAU) ringPhase -= TAU;
    }
    return normalizeAndFade(output, 0.95, sampleRate);
  }

  function encodeMonoWav(samples, sampleRate) {
    const bytesPerSample = 2;
    const dataLength = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    const writeText = (offset, text) => {
      for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, dataLength, true);
    for (let index = 0; index < samples.length; index += 1) {
      const value = clamp(samples[index], -1, 1);
      view.setInt16(44 + index * 2, value < 0 ? value * 32768 : value * 32767, true);
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  function processVoice({ audioBuffer, preset, tone = 0, effectAmount = 0.75 }) {
    if (!audioBuffer || typeof audioBuffer.getChannelData !== "function") {
      throw new TypeError("A decoded voice buffer is required.");
    }
    const sampleRate = Math.max(8000, Number(audioBuffer.sampleRate) || 24000);
    const input = copyMono(audioBuffer);
    let samples = input;
    let mode = "human";
    if (ROBOT_PRESETS[preset]) {
      samples = applyRobotDsp(input, sampleRate, preset, tone, effectAmount);
      mode = "robot";
    } else if (VOCODER_PRESETS[preset]) {
      samples = applyVocoderDsp(input, sampleRate, preset, tone, effectAmount);
      mode = "vocoder";
    }
    return {
      blob: encodeMonoWav(samples, sampleRate),
      samples,
      sampleRate,
      duration: samples.length / sampleRate,
      mode,
    };
  }

  globalThis.IAMMantraVoiceDSP = Object.freeze({
    ROBOT_PRESETS,
    VOCODER_PRESETS,
    applyRobotDsp,
    applyVocoderDsp,
    encodeMonoWav,
    processVoice,
  });
})();
