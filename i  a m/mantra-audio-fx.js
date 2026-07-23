(() => {
  "use strict";

  const LIMITS = {
    reverbMix: [0, 0.5],
    reverbDecay: [0.2, 6],
    reverbPredelay: [0, 0.15],
    spectralMix: [0, 0.5],
    spectralTime: [0.02, 0.6],
    spectralSpread: [0, 1],
    spectralFeedback: [0, 0.65],
  };

  function clamp(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
  }

  function defaultSlot() {
    return {
      reverb: { mix: 0, decay: 2.4, predelay: 0.025 },
      spectral_delay: { mix: 0, time: 0.18, spread: 0.45, feedback: 0.18 },
    };
  }

  function normaliseSlot(raw = {}) {
    const reverb = raw.reverb || {};
    const spectral = raw.spectral_delay || {};
    return {
      reverb: {
        mix: clamp(reverb.mix, ...LIMITS.reverbMix, 0),
        decay: clamp(reverb.decay, ...LIMITS.reverbDecay, 2.4),
        predelay: clamp(reverb.predelay, ...LIMITS.reverbPredelay, 0.025),
      },
      spectral_delay: {
        mix: clamp(spectral.mix, ...LIMITS.spectralMix, 0),
        time: clamp(spectral.time, ...LIMITS.spectralTime, 0.18),
        spread: clamp(spectral.spread, ...LIMITS.spectralSpread, 0.45),
        feedback: clamp(spectral.feedback, ...LIMITS.spectralFeedback, 0.18),
      },
    };
  }

  function defaultState() {
    return {
      active: "a",
      bypass: false,
      a: defaultSlot(),
      b: defaultSlot(),
    };
  }

  function normaliseState(raw = {}) {
    return {
      active: raw.active === "b" ? "b" : "a",
      bypass: raw.bypass === true,
      a: normaliseSlot(raw.a),
      b: normaliseSlot(raw.b),
    };
  }

  function activeSettings(state) {
    const normalised = normaliseState(state);
    return normalised[normalised.active];
  }

  function impulseFor(ctx, decay) {
    const seconds = clamp(decay, ...LIMITS.reverbDecay, 2.4);
    const length = Math.max(1, Math.round(ctx.sampleRate * seconds));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    let seed = Math.max(1, Math.round(seconds * 1000));
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) * 2 - 1;
    };
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const progress = index / length;
        data[index] = random() * ((1 - progress) ** 2.35) * 0.72;
      }
    }
    return impulse;
  }

  function connect({ ctx, input, destination, state }) {
    if (!ctx || !input || !destination) throw new Error("A complete Mantra audio graph is required.");
    const normalised = normaliseState(state);
    const settings = activeSettings(normalised);
    const nodes = [];
    const link = (from, to) => {
      from.connect(to);
      nodes.push(from, to);
      return to;
    };

    if (normalised.bypass) {
      input.connect(destination);
      return { state: normalised, nodes: [input, destination] };
    }

    const dry = ctx.createGain();
    dry.gain.value = 1;
    link(input, dry);
    link(dry, destination);

    if (settings.reverb.mix > 0.0001) {
      const predelay = ctx.createDelay(0.2);
      const convolver = ctx.createConvolver();
      const wet = ctx.createGain();
      predelay.delayTime.value = settings.reverb.predelay;
      convolver.buffer = impulseFor(ctx, settings.reverb.decay);
      wet.gain.value = settings.reverb.mix * 0.72;
      link(input, predelay);
      link(predelay, convolver);
      link(convolver, wet);
      link(wet, destination);
    }

    if (settings.spectral_delay.mix > 0.0001) {
      const bands = [
        { type: "lowpass", frequency: 350, q: 0.71, offset: -0.5 },
        { type: "bandpass", frequency: 900, q: 0.82, offset: -0.16 },
        { type: "bandpass", frequency: 2600, q: 0.82, offset: 0.18 },
        { type: "highpass", frequency: 5000, q: 0.71, offset: 0.5 },
      ];
      const perBandWet = settings.spectral_delay.mix * 0.38;
      bands.forEach((band) => {
        const filter = ctx.createBiquadFilter();
        const delay = ctx.createDelay(1.2);
        const feedback = ctx.createGain();
        const wet = ctx.createGain();
        filter.type = band.type;
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        delay.delayTime.value = clamp(
          settings.spectral_delay.time * (1 + band.offset * settings.spectral_delay.spread),
          0.01,
          1,
          settings.spectral_delay.time
        );
        feedback.gain.value = settings.spectral_delay.feedback;
        wet.gain.value = perBandWet;
        link(input, filter);
        link(filter, delay);
        link(delay, wet);
        link(wet, destination);
        link(delay, feedback);
        link(feedback, delay);
      });
    }

    return { state: normalised, nodes: Array.from(new Set(nodes)) };
  }

  window.IAMMantraAudioFX = {
    version: "mantra_audio_fx_v1.0",
    limits: LIMITS,
    defaultState,
    normaliseState,
    activeSettings,
    connect,
  };
})();
