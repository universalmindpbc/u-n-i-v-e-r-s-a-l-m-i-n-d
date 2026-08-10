import {
  DIAMOND_FREQUENCY_POWER_TOTAL,
  adaptiveSoundLaneIds,
  validateCondition,
} from "./profiles-v1.js?v=3f39020ebeab";

export const COLOUR_OVERSAMPLE_FACTOR = 4;
export const AUTHORED_LOWPASS_HZ = 14444;
export const TECHNICAL_CARRIER_OPERATING_LEVEL = 0.35;
export const NOISE_REFERENCE_RMS = TECHNICAL_CARRIER_OPERATING_LEVEL / Math.SQRT2;
export const NOISE_MAX_ABSOLUTE = 4;

const TWO_PI = Math.PI * 2;
const EPSILON = 1e-12;

export class PhaseAccumulator {
  constructor(frequencyHz, sampleRate, initialPhaseCycles = 0) {
    assertSampleRate(sampleRate);
    this.sampleRate = sampleRate;
    this.frequencyHz = finitePositive(frequencyHz, "frequency");
    this.phaseCycles = normalizedPhase(initialPhaseCycles);
  }

  setFrequency(frequencyHz) {
    this.frequencyHz = finitePositive(frequencyHz, "frequency");
  }

  nextSine() {
    const output = Math.sin(TWO_PI * this.phaseCycles);
    this.advance();
    return output;
  }

  advance() {
    this.phaseCycles += this.frequencyHz / this.sampleRate;
    this.phaseCycles -= Math.floor(this.phaseCycles);
    return this.phaseCycles;
  }
}

class XorShift32 {
  constructor(seedUint32) {
    const seed = Number(seedUint32) >>> 0;
    if (!seed) throw new Error("Deterministic noise seed must be a non-zero uint32");
    this.state = seed;
  }

  nextUint32() {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state;
  }

  nextBinary() {
    return (this.nextUint32() & 1) === 0 ? -1 : 1;
  }
}

export class DeterministicNoiseSource {
  constructor(sampleRate, candidate) {
    assertSampleRate(sampleRate);
    if (!candidate || candidate.status !== "phase1_candidate") {
      throw new Error("An explicit Phase 1 noise candidate is required");
    }
    if (!["white", "pink", "brown"].includes(candidate.colour)) throw new Error("Unsupported noise colour");
    this.sampleRate = sampleRate;
    this.candidate = candidate;
    this.random = new XorShift32(candidate.seed_uint32);
    this.pinkRows = null;
    this.pinkCounter = 0;
    this.brownState = 0;
    this.brownCoefficient = 0;
    this.brownInnovation = 0;
    if (candidate.colour === "pink") {
      this.pinkRows = new Float64Array(16);
      for (let index = 0; index < this.pinkRows.length; index += 1) {
        this.pinkRows[index] = this.random.nextBinary();
      }
    } else if (candidate.colour === "brown") {
      this.brownState = this.random.nextBinary();
      this.brownCoefficient = Math.exp(-TWO_PI * 20 / sampleRate);
      this.brownInnovation = Math.sqrt(1 - this.brownCoefficient * this.brownCoefficient);
    }
  }

  next() {
    if (this.candidate.colour === "white") return this.random.nextBinary();
    if (this.candidate.colour === "pink") return this.nextPink();
    return this.nextBrown();
  }

  nextPink() {
    this.pinkCounter = (this.pinkCounter + 1) & 0xffff;
    let changedRow = 0;
    let value = this.pinkCounter;
    while ((value & 1) === 0 && changedRow < this.pinkRows.length - 1) {
      changedRow += 1;
      value >>>= 1;
    }
    this.pinkRows[changedRow] = this.random.nextBinary();
    let sum = 0;
    for (const row of this.pinkRows) sum += row;
    return finiteSample(sum / Math.sqrt(this.pinkRows.length));
  }

  nextBrown() {
    this.brownState = this.brownCoefficient * this.brownState
      + this.brownInnovation * this.random.nextBinary();
    this.brownState = clamp(this.brownState, -NOISE_MAX_ABSOLUTE, NOISE_MAX_ABSOLUTE);
    return finiteSample(this.brownState);
  }
}

export class IsochronicEnvelope {
  constructor({ frequencyHz, sampleRate, candidate, initialPhaseCycles = 0 }) {
    assertSampleRate(sampleRate);
    if (!candidate || candidate.status !== "phase1_candidate") throw new Error("A Phase 1 envelope candidate is required");
    this.phase = new PhaseAccumulator(frequencyHz, sampleRate, initialPhaseCycles);
    this.candidate = candidate;
  }

  setFrequency(frequencyHz) {
    this.phase.setFrequency(frequencyHz);
  }

  next() {
    const phaseCycles = this.phase.phaseCycles;
    const pulse = envelopePulse(phaseCycles, this.candidate);
    const value = this.candidate.minimum_gain
      + (this.candidate.maximum_gain - this.candidate.minimum_gain) * pulse;
    this.phase.advance();
    return value;
  }
}

export class Biquad {
  constructor(coefficients = identityCoefficients()) {
    this.setCoefficients(coefficients);
    this.reset();
  }

  setCoefficients(coefficients) {
    for (const key of ["b0", "b1", "b2", "a1", "a2"]) {
      if (!Number.isFinite(coefficients?.[key])) throw new Error(`Invalid biquad coefficient ${key}`);
    }
    this.coefficients = { ...coefficients };
  }

  process(input) {
    const { b0, b1, b2, a1, a2 } = this.coefficients;
    const output = b0 * input + this.z1;
    this.z1 = b1 * input - a1 * output + this.z2;
    this.z2 = b2 * input - a2 * output;
    return finiteSample(output);
  }

  reset() {
    this.z1 = 0;
    this.z2 = 0;
  }
}

export class AuthoredLowPass {
  constructor(sampleRate, candidate) {
    assertSampleRate(sampleRate);
    if (sampleRate <= AUTHORED_LOWPASS_HZ * 2) {
      throw new Error(`Sample rate ${sampleRate} cannot represent the locked 14,444 Hz low-pass`);
    }
    if (!candidate || candidate.target_cutoff_hz !== AUTHORED_LOWPASS_HZ || candidate.topology !== "biquad_lowpass") {
      throw new Error("Invalid authored low-pass candidate");
    }
    this.sampleRate = sampleRate;
    this.candidate = candidate;
    const designFrequencyHz = solveMinus3DbDesignFrequency(sampleRate, AUTHORED_LOWPASS_HZ, candidate.q);
    this.designFrequencyHz = designFrequencyHz;
    this.filter = new Biquad(lowPassCoefficients(sampleRate, designFrequencyHz, candidate.q));
  }

  process(input) {
    return this.filter.process(input);
  }

  responseAt(frequencyHz) {
    return biquadMagnitude(this.filter.coefficients, frequencyHz, this.sampleRate);
  }

  reset() {
    this.filter.reset();
  }
}

class DCBlocker {
  constructor(sampleRate, cutoffHz = 8) {
    this.r = Math.exp(-TWO_PI * cutoffHz / sampleRate);
    this.reset();
  }

  process(input) {
    const output = input - this.previousInput + this.r * this.previousOutput;
    this.previousInput = input;
    this.previousOutput = output;
    return finiteSample(output);
  }

  reset() {
    this.previousInput = 0;
    this.previousOutput = 0;
  }
}

class OnePoleLowPass {
  constructor(sampleRate, cutoffHz) {
    this.coefficient = 1 - Math.exp(-TWO_PI * cutoffHz / sampleRate);
    this.state = 0;
  }

  process(input) {
    this.state += (input - this.state) * this.coefficient;
    return finiteSample(this.state);
  }

  reset() {
    this.state = 0;
  }
}

export class OversampledColourCore {
  constructor(sampleRate, oversampleFactor = COLOUR_OVERSAMPLE_FACTOR) {
    assertSampleRate(sampleRate);
    if (oversampleFactor !== 4) throw new Error("The Phase 1 colour core is locked to custom 4x oversampling");
    this.sampleRate = sampleRate;
    this.oversampleFactor = oversampleFactor;
    this.oversampledRate = sampleRate * oversampleFactor;
    this.inputDC = new DCBlocker(this.oversampledRate, 8);
    this.transformerMemory = new OnePoleLowPass(this.oversampledRate, 145);
    this.classAMemory = new OnePoleLowPass(this.oversampledRate, 720);
    this.lowShelf = new Biquad(shelfCoefficients("low", this.oversampledRate, 110, 0.65));
    this.midCharacter = new Biquad(peakingCoefficients(this.oversampledRate, 1650, 0.72, -0.35));
    this.highShelf = new Biquad(shelfCoefficients("high", this.oversampledRate, 12000, -0.65));
    this.outputBandwidth = new Biquad(lowPassCoefficients(this.oversampledRate, 36000, Math.SQRT1_2));
    const antiAliasCutoff = sampleRate * 0.455;
    this.antiAlias = [
      new Biquad(lowPassCoefficients(this.oversampledRate, antiAliasCutoff, 0.541196100146197)),
      new Biquad(lowPassCoefficients(this.oversampledRate, antiAliasCutoff, 1.306562964876377)),
    ];
    this.previousInput = 0;
    this.initialized = false;
  }

  process(input) {
    if (!this.initialized) {
      this.previousInput = input;
      this.initialized = true;
    }
    let output = 0;
    for (let subSample = 1; subSample <= this.oversampleFactor; subSample += 1) {
      const fraction = subSample / this.oversampleFactor;
      const interpolated = this.previousInput + (input - this.previousInput) * fraction;
      output = this.processOversampled(interpolated);
    }
    this.previousInput = input;
    return finiteSample(output * 0.94);
  }

  processOversampled(input) {
    const dcSafe = this.inputDC.process(input * 0.78);
    const transformerMemory = this.transformerMemory.process(dcSafe);
    const transformerInput = dcSafe + transformerMemory * 0.045;
    const inputTransformer = transformerSaturation(transformerInput, 1.08, 0.018);

    const classAMemory = this.classAMemory.process(inputTransformer);
    const stageA = classAStageA(inputTransformer + classAMemory * 0.015, 1.08);
    const stageB = classAStageB(stageA - classAMemory * 0.009, 1.05);

    let coloured = this.lowShelf.process(stageB);
    coloured = this.midCharacter.process(coloured);
    coloured = this.highShelf.process(coloured);
    coloured = outputTransformerSaturation(coloured, 1.04);
    coloured = this.outputBandwidth.process(coloured);
    for (const filter of this.antiAlias) coloured = filter.process(coloured);
    return coloured;
  }

  reset() {
    this.inputDC.reset();
    this.transformerMemory.reset();
    this.classAMemory.reset();
    this.lowShelf.reset();
    this.midCharacter.reset();
    this.highShelf.reset();
    this.outputBandwidth.reset();
    this.antiAlias.forEach((filter) => filter.reset());
    this.previousInput = 0;
    this.initialized = false;
  }
}

class EnvelopeCompressor {
  constructor(sampleRate, settings) {
    this.sampleRate = sampleRate;
    this.settings = settings;
    this.attackCoefficient = 1 - Math.exp(-1 / (Math.max(settings.attack_seconds, 1 / sampleRate) * sampleRate));
    this.releaseCoefficient = 1 - Math.exp(-1 / (Math.max(settings.release_seconds, 1 / sampleRate) * sampleRate));
    this.envelopeSquared = 0;
    this.lastGainReductionDb = 0;
  }

  process(input) {
    const squared = input * input;
    const coefficient = squared > this.envelopeSquared ? this.attackCoefficient : this.releaseCoefficient;
    this.envelopeSquared += (squared - this.envelopeSquared) * coefficient;
    const inputDb = 10 * Math.log10(Math.max(this.envelopeSquared, EPSILON));
    const reductionDb = compressorReductionDb(
      inputDb,
      this.settings.threshold_db,
      this.settings.ratio,
      this.settings.knee_db
    );
    this.lastGainReductionDb = reductionDb;
    return finiteSample(input * dbToGain(this.settings.makeup_db - reductionDb));
  }

  reset() {
    this.envelopeSquared = 0;
    this.lastGainReductionDb = 0;
  }
}

export class ParallelMasteringCompressor {
  constructor(sampleRate, candidate) {
    if (!candidate || candidate.differential_latency_samples !== 0) {
      throw new Error("Phase 1 requires explicitly aligned zero-differential-latency compressor branches");
    }
    this.main = new EnvelopeCompressor(sampleRate, candidate.main);
    this.parallel = new EnvelopeCompressor(sampleRate, candidate.parallel);
    this.parallelBlend = candidate.parallel_blend;
    this.parallelDrive = candidate.parallel.additional_colour_drive;
    this.differentialLatencySamples = 0;
  }

  process(input) {
    const main = this.main.process(input);
    const parallelCompressed = this.parallel.process(input);
    const parallelColoured = classAStageB(parallelCompressed, this.parallelDrive);
    return finiteSample(main * (1 - this.parallelBlend) + parallelColoured * this.parallelBlend);
  }

  diagnostics() {
    return {
      main_gain_reduction_db: this.main.lastGainReductionDb,
      parallel_gain_reduction_db: this.parallel.lastGainReductionDb,
      parallel_blend: this.parallelBlend,
      differential_latency_samples: this.differentialLatencySamples,
    };
  }

  reset() {
    this.main.reset();
    this.parallel.reset();
  }
}

export class MasteringPath {
  constructor(sampleRate, condition) {
    this.sampleRate = sampleRate;
    this.enabled = condition.mastering_condition === "engineering_on";
    this.colour = new OversampledColourCore(sampleRate);
    this.compressor = new ParallelMasteringCompressor(
      sampleRate,
      condition.resolved_dsp_candidates.compression
    );
    this.lowPass = new AuthoredLowPass(sampleRate, condition.resolved_dsp_candidates.lowpass);
    this.latencySamples = 0;
  }

  process(input) {
    if (!this.enabled) return input;
    const coloured = this.colour.process(input);
    const compressed = this.compressor.process(coloured);
    return this.lowPass.process(compressed);
  }

  diagnostics() {
    return {
      enabled: this.enabled,
      latency_samples: this.latencySamples,
      lowpass_target_hz: AUTHORED_LOWPASS_HZ,
      lowpass_design_frequency_hz: this.lowPass.designFrequencyHz,
      lowpass_applied: this.enabled,
      lowpass_response_at_target_db: this.enabled
        ? gainToDb(this.lowPass.responseAt(AUTHORED_LOWPASS_HZ))
        : null,
      lowpass_candidate_response_at_target_db: gainToDb(this.lowPass.responseAt(AUTHORED_LOWPASS_HZ)),
      compression: this.compressor.diagnostics(),
    };
  }

  reset() {
    this.colour.reset();
    this.compressor.reset();
    this.lowPass.reset();
  }
}

class LaneState {
  constructor({ laneId, frequencyHz, sampleRate, envelopeCandidate, initialPhaseCycles, powerWeight, enabled }) {
    this.laneId = laneId;
    this.envelope = new IsochronicEnvelope({
      frequencyHz,
      sampleRate,
      candidate: envelopeCandidate,
      initialPhaseCycles,
    });
    this.currentPower = powerWeight;
    this.startPower = powerWeight;
    this.targetPower = powerWeight;
    this.transitionSamples = 0;
    this.transitionCursor = 0;
    this.enabled = enabled;
    this.lastEnvelopeGain = 0;
  }

  setPower(powerWeight, transitionSamples) {
    this.startPower = this.currentPower;
    this.targetPower = powerWeight;
    this.transitionSamples = Math.max(0, Math.floor(transitionSamples));
    this.transitionCursor = 0;
    if (this.transitionSamples === 0) this.currentPower = powerWeight;
  }

  nextPower() {
    if (this.transitionCursor < this.transitionSamples) {
      this.transitionCursor += 1;
      const progress = this.transitionCursor / this.transitionSamples;
      this.currentPower = this.startPower + (this.targetPower - this.startPower) * smoothStep(progress);
    } else {
      this.currentPower = this.targetPower;
    }
    return this.currentPower;
  }
}

export class LookaheadSafetyLimiter {
  constructor(sampleRate, { ceiling = 0.85, lookaheadSeconds = 0.003, releaseSeconds = 0.08 } = {}) {
    assertSampleRate(sampleRate);
    this.sampleRate = sampleRate;
    this.ceiling = clamp(ceiling, 0.01, 0.98);
    this.lookaheadSamples = Math.max(1, Math.round(lookaheadSeconds * sampleRate));
    this.buffer = new Float64Array(this.lookaheadSamples + 1);
    this.writeIndex = 0;
    this.gain = 1;
    this.releaseCoefficient = 1 - Math.exp(-1 / (Math.max(releaseSeconds, 1 / sampleRate) * sampleRate));
    this.activationSamples = 0;
    this.minimumGain = 1;
  }

  process(input) {
    this.buffer[this.writeIndex] = finiteSample(input);
    const readIndex = (this.writeIndex + 1) % this.buffer.length;
    let windowPeak = 0;
    for (let index = 0; index < this.buffer.length; index += 1) {
      windowPeak = Math.max(windowPeak, Math.abs(this.buffer[index]));
    }
    const targetGain = windowPeak > this.ceiling ? this.ceiling / windowPeak : 1;
    if (targetGain < this.gain) this.gain = targetGain;
    else this.gain += (targetGain - this.gain) * this.releaseCoefficient;
    this.minimumGain = Math.min(this.minimumGain, this.gain);
    if (this.gain < 0.999999) this.activationSamples += 1;
    const output = this.buffer[readIndex] * this.gain;
    this.writeIndex = readIndex;
    return finiteSample(output);
  }

  diagnostics() {
    return {
      ceiling: this.ceiling,
      latency_samples: this.lookaheadSamples,
      activation_samples: this.activationSamples,
      minimum_gain: this.minimumGain,
    };
  }

  reset() {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.gain = 1;
    this.activationSamples = 0;
    this.minimumGain = 1;
  }
}

export class AdaptiveSoundRendererV1 {
  constructor(condition, sampleRate) {
    validateCondition(condition);
    assertSampleRate(sampleRate);
    if (sampleRate <= AUTHORED_LOWPASS_HZ * 2) {
      throw new Error(`Unsupported sample rate ${sampleRate}: locked low-pass cannot be represented`);
    }
    this.condition = condition;
    this.sampleRate = sampleRate;
    this.carrier = new PhaseAccumulator(condition.carrier_hz, sampleRate, condition.carrier_phase_cycles);
    this.mastering = new MasteringPath(sampleRate, condition);
    this.noiseSources = Object.entries(condition.noise_power_weights)
      .filter(([, powerWeight]) => powerWeight > 0)
      .map(([candidateId, powerWeight]) => ({
        candidateId,
        powerWeight,
        source: new DeterministicNoiseSource(sampleRate, condition.resolved_dsp_candidates.noise[candidateId]),
        sumSquares: 0,
        absolutePeak: 0,
      }));
    this.lanes = adaptiveSoundLaneIds().map((laneId) => new LaneState({
      laneId,
      frequencyHz: condition.isochronic_hz[laneId],
      sampleRate,
      envelopeCandidate: condition.resolved_dsp_candidates.envelope,
      initialPhaseCycles: condition.lane_phase_cycles[laneId],
      powerWeight: condition.diamond_power_weights[laneId],
      enabled: condition.enabled_lanes[laneId],
    }));
    this.technicalOutputGain = condition.technical_output_gain;
    this.limiter = new LookaheadSafetyLimiter(sampleRate, { ceiling: condition.limiter_ceiling });
    this.lifecycleGain = 0;
    this.lifecycleRampSamples = Math.max(1, Math.round(sampleRate * 0.012));
    this.renderedSamples = 0;
    this.sumSquares = 0;
    this.absolutePeak = 0;
  }

  processSample() {
    const carrier = this.carrier.nextSine() * TECHNICAL_CARRIER_OPERATING_LEVEL;
    const continuousMasteredCarrier = this.mastering.process(carrier);
    let weightedEnvelopeSum = 0;
    let worstCaseAmplitudeSum = 0;
    for (const lane of this.lanes) {
      const power = lane.nextPower();
      const amplitude = Math.sqrt(Math.max(0, power));
      worstCaseAmplitudeSum += amplitude;
      const envelope = lane.envelope.next();
      lane.lastEnvelopeGain = envelope;
      if (lane.enabled) weightedEnvelopeSum += amplitude * envelope;
    }
    let noiseContribution = 0;
    let noiseWorstCaseRelativeToCarrierPeak = 0;
    for (const noiseComponent of this.noiseSources) {
      const noiseSample = noiseComponent.source.next();
      const noiseAmplitude = Math.sqrt(noiseComponent.powerWeight);
      noiseContribution += noiseSample * NOISE_REFERENCE_RMS * noiseAmplitude;
      noiseWorstCaseRelativeToCarrierPeak += noiseAmplitude * NOISE_MAX_ABSOLUTE / Math.SQRT2;
      noiseComponent.sumSquares += noiseSample * noiseSample;
      noiseComponent.absolutePeak = Math.max(noiseComponent.absolutePeak, Math.abs(noiseSample));
    }
    const headroomFactor = 1 / Math.max(1, worstCaseAmplitudeSum + noiseWorstCaseRelativeToCarrierPeak);
    this.lifecycleGain = Math.min(1, this.lifecycleGain + 1 / this.lifecycleRampSamples);
    const mixed = (continuousMasteredCarrier * weightedEnvelopeSum + noiseContribution)
      * headroomFactor
      * this.technicalOutputGain
      * this.lifecycleGain;
    const output = this.limiter.process(mixed);
    this.renderedSamples += 1;
    this.sumSquares += output * output;
    this.absolutePeak = Math.max(this.absolutePeak, Math.abs(output));
    return finiteSample(output);
  }

  processBlock(output, offset = 0, frameCount = output.length - offset) {
    if (!output || typeof output.length !== "number") throw new TypeError("Output buffer is required");
    const end = Math.min(output.length, offset + frameCount);
    for (let index = offset; index < end; index += 1) output[index] = this.processSample();
    return output;
  }

  render(frameCount) {
    const frames = Math.max(0, Math.floor(frameCount));
    return this.processBlock(new Float32Array(frames));
  }

  setPowerWeights(powerWeights, transitionSeconds = this.condition.transition_seconds) {
    const laneIds = adaptiveSoundLaneIds();
    let total = 0;
    for (const laneId of laneIds) {
      const power = Number(powerWeights?.[laneId]);
      if (!Number.isFinite(power) || power < 0 || power > 1) throw new Error(`Invalid ${laneId} power weight`);
      total += power;
    }
    if (Math.abs(total - DIAMOND_FREQUENCY_POWER_TOTAL) > 1e-12) {
      throw new Error("Power-domain transition weights must total exactly 99.98%");
    }
    const transitionSamples = Math.round(Math.max(0, transitionSeconds) * this.sampleRate);
    for (const lane of this.lanes) lane.setPower(powerWeights[lane.laneId], transitionSamples);
  }

  setLaneEnabled(laneId, enabled) {
    const lane = this.lanes.find((candidate) => candidate.laneId === laneId);
    if (!lane) throw new Error(`Unknown adaptive-sound lane: ${laneId}`);
    lane.enabled = Boolean(enabled);
  }

  diagnostics() {
    return {
      sample_rate: this.sampleRate,
      carrier_hz: this.condition.carrier_hz,
      carrier_phase_cycles: this.carrier.phaseCycles,
      rendered_samples: this.renderedSamples,
      output_peak: this.absolutePeak,
      output_rms: Math.sqrt(this.sumSquares / Math.max(1, this.renderedSamples)),
      mastering: this.mastering.diagnostics(),
      limiter: this.limiter.diagnostics(),
      lanes: Object.fromEntries(this.lanes.map((lane) => [lane.laneId, {
        rate_hz: lane.envelope.phase.frequencyHz,
        phase_cycles: lane.envelope.phase.phaseCycles,
        power_weight: lane.currentPower,
        envelope_gain: lane.lastEnvelopeGain,
        enabled: lane.enabled,
      }])),
      allocation: {
        diamond_frequency_power_total: this.lanes.reduce((sum, lane) => sum + lane.currentPower, 0),
        noise_power_weight: this.condition.noise_power_weight,
        silence_power_weight: this.condition.silence_power_weight,
        total: this.lanes.reduce((sum, lane) => sum + lane.currentPower, 0)
          + this.condition.noise_power_weight
          + this.condition.silence_power_weight,
      },
      noise: {
        selection_id: this.condition.noise_selection_id,
        selection_authority: this.condition.noise_selection_authority,
        insertion_point: this.noiseSources[0].source.candidate.insertion_point,
        reference_rms: NOISE_REFERENCE_RMS,
        components: Object.fromEntries(this.noiseSources.map((component) => [component.candidateId, {
          colour: component.source.candidate.colour,
          power_weight: component.powerWeight,
          measured_raw_rms: Math.sqrt(component.sumSquares / Math.max(1, this.renderedSamples)),
          measured_raw_peak: component.absolutePeak,
        }])),
      },
      silence: {
        power_weight: this.condition.silence_power_weight,
        signal_value: 0,
        role: "explicit_zero_signal_allocation_reserve",
      },
      output_layout: "mono_source_for_identical_dual_mono",
      technical_output_gain_authority: this.condition.technical_output_gain_authority,
    };
  }

  reset() {
    throw new Error("Create a new renderer to preserve deterministic initial-phase provenance");
  }
}

export function renderDualMono(condition, sampleRate, frameCount) {
  const renderer = new AdaptiveSoundRendererV1(condition, sampleRate);
  const mono = renderer.render(frameCount);
  return {
    mono,
    left: mono.slice(),
    right: mono.slice(),
    diagnostics: renderer.diagnostics(),
  };
}

export function biquadMagnitude(coefficients, frequencyHz, sampleRate) {
  const omega = TWO_PI * frequencyHz / sampleRate;
  const cos1 = Math.cos(omega);
  const sin1 = -Math.sin(omega);
  const cos2 = Math.cos(omega * 2);
  const sin2 = -Math.sin(omega * 2);
  const numeratorReal = coefficients.b0 + coefficients.b1 * cos1 + coefficients.b2 * cos2;
  const numeratorImag = coefficients.b1 * sin1 + coefficients.b2 * sin2;
  const denominatorReal = 1 + coefficients.a1 * cos1 + coefficients.a2 * cos2;
  const denominatorImag = coefficients.a1 * sin1 + coefficients.a2 * sin2;
  return Math.sqrt(
    (numeratorReal * numeratorReal + numeratorImag * numeratorImag)
      / Math.max(EPSILON, denominatorReal * denominatorReal + denominatorImag * denominatorImag)
  );
}

export function dbToGain(decibels) {
  return 10 ** (decibels / 20);
}

export function gainToDb(gain) {
  return 20 * Math.log10(Math.max(EPSILON, gain));
}

function envelopePulse(phaseCycles, candidate) {
  const duty = clamp(candidate.duty_cycle, EPSILON, 1);
  if (phaseCycles >= duty) return 0;
  const position = phaseCycles / duty;
  if (candidate.shape === "raised_cosine") {
    return 0.5 - 0.5 * Math.cos(TWO_PI * position);
  }
  if (candidate.shape === "tukey") {
    const alpha = clamp(candidate.edge_fraction, EPSILON, 1);
    const halfEdge = alpha / 2;
    if (position < halfEdge) return 0.5 * (1 - Math.cos(Math.PI * position / halfEdge));
    if (position > 1 - halfEdge) return 0.5 * (1 - Math.cos(Math.PI * (1 - position) / halfEdge));
    return 1;
  }
  throw new Error(`Unsupported envelope shape: ${candidate.shape}`);
}

function transformerSaturation(input, drive, asymmetry) {
  const driven = input * drive;
  const asymmetric = driven + asymmetry * driven * driven / (1 + Math.abs(driven));
  const shaped = asymmetric / (1 + 0.1 * Math.abs(asymmetric));
  return finiteSample(shaped / (drive / (1 + 0.1 * drive)));
}

function classAStageA(input, drive) {
  const driven = input * drive;
  const primary = Math.atan(driven * 0.65) / Math.atan(0.65 * drive);
  const secondOrder = 0.009 * driven * driven / (1 + driven * driven);
  return finiteSample(primary + secondOrder);
}

function classAStageB(input, drive) {
  const driven = input * drive;
  const cubic = driven - 0.025 * driven * driven * driven;
  const bounded = cubic / (1 + 0.05 * Math.abs(cubic));
  return finiteSample(bounded / (drive / (1 + 0.05 * drive)));
}

function outputTransformerSaturation(input, drive) {
  const driven = input * drive;
  const cubic = driven - 0.018 * driven * driven * driven;
  const shaped = cubic / (1 + 0.035 * Math.abs(cubic));
  return finiteSample(shaped / (drive / (1 + 0.035 * drive)));
}

function compressorReductionDb(inputDb, thresholdDb, ratio, kneeDb) {
  const slope = 1 - 1 / ratio;
  const over = inputDb - thresholdDb;
  if (kneeDb <= 0) return Math.max(0, over * slope);
  const halfKnee = kneeDb / 2;
  if (over <= -halfKnee) return 0;
  if (over >= halfKnee) return over * slope;
  const within = over + halfKnee;
  return slope * within * within / (2 * kneeDb);
}

function solveMinus3DbDesignFrequency(sampleRate, targetHz, q) {
  const targetMagnitude = Math.SQRT1_2;
  let low = Math.max(targetHz * 0.5, 1);
  let high = sampleRate * 0.49;
  if (biquadMagnitude(lowPassCoefficients(sampleRate, high, q), targetHz, sampleRate) < targetMagnitude) {
    throw new Error("The requested low-pass damping cannot reach -3 dB at 14,444 Hz for this sample rate");
  }
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (low + high) / 2;
    const magnitude = biquadMagnitude(lowPassCoefficients(sampleRate, midpoint, q), targetHz, sampleRate);
    if (magnitude < targetMagnitude) low = midpoint;
    else high = midpoint;
  }
  return (low + high) / 2;
}

function lowPassCoefficients(sampleRate, frequencyHz, q) {
  const omega = TWO_PI * clamp(frequencyHz, 1, sampleRate * 0.49) / sampleRate;
  const cosine = Math.cos(omega);
  const sine = Math.sin(omega);
  const alpha = sine / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: ((1 - cosine) / 2) / a0,
    b1: (1 - cosine) / a0,
    b2: ((1 - cosine) / 2) / a0,
    a1: (-2 * cosine) / a0,
    a2: (1 - alpha) / a0,
  };
}

function peakingCoefficients(sampleRate, frequencyHz, q, gainDb) {
  const amplitude = 10 ** (gainDb / 40);
  const omega = TWO_PI * frequencyHz / sampleRate;
  const cosine = Math.cos(omega);
  const sine = Math.sin(omega);
  const alpha = sine / (2 * q);
  const a0 = 1 + alpha / amplitude;
  return {
    b0: (1 + alpha * amplitude) / a0,
    b1: (-2 * cosine) / a0,
    b2: (1 - alpha * amplitude) / a0,
    a1: (-2 * cosine) / a0,
    a2: (1 - alpha / amplitude) / a0,
  };
}

function shelfCoefficients(type, sampleRate, frequencyHz, gainDb) {
  const amplitude = 10 ** (gainDb / 40);
  const omega = TWO_PI * frequencyHz / sampleRate;
  const cosine = Math.cos(omega);
  const sine = Math.sin(omega);
  const alpha = sine / Math.sqrt(2);
  const beta = 2 * Math.sqrt(amplitude) * alpha;
  let b0;
  let b1;
  let b2;
  let a0;
  let a1;
  let a2;
  if (type === "low") {
    b0 = amplitude * ((amplitude + 1) - (amplitude - 1) * cosine + beta);
    b1 = 2 * amplitude * ((amplitude - 1) - (amplitude + 1) * cosine);
    b2 = amplitude * ((amplitude + 1) - (amplitude - 1) * cosine - beta);
    a0 = (amplitude + 1) + (amplitude - 1) * cosine + beta;
    a1 = -2 * ((amplitude - 1) + (amplitude + 1) * cosine);
    a2 = (amplitude + 1) + (amplitude - 1) * cosine - beta;
  } else {
    b0 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine + beta);
    b1 = -2 * amplitude * ((amplitude - 1) + (amplitude + 1) * cosine);
    b2 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine - beta);
    a0 = (amplitude + 1) - (amplitude - 1) * cosine + beta;
    a1 = 2 * ((amplitude - 1) - (amplitude + 1) * cosine);
    a2 = (amplitude + 1) - (amplitude - 1) * cosine - beta;
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function identityCoefficients() {
  return { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
}

function normalizedPhase(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error("Phase must be finite");
  return ((numeric % 1) + 1) % 1;
}

function finitePositive(value, label) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error(`${label} must be positive and finite`);
  return numeric;
}

function finiteSample(value) {
  if (!Number.isFinite(value)) throw new Error("DSP emitted a non-finite sample");
  return Math.abs(value) < Number.MIN_VALUE * 1024 ? 0 : value;
}

function assertSampleRate(sampleRate) {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 384000) throw new Error("Invalid audio sample rate");
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothStep(value) {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}
