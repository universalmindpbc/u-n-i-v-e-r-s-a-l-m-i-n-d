import { AdaptiveSoundRendererV1 } from "./dsp-v1.js?v=a8c3c98fe241";

const PROCESSOR_NAME = "iam-adaptive-sound-v1";

class IAMAdaptiveSoundProcessorV1 extends AudioWorkletProcessor {
  constructor(options = {}) {
    super();
    this.renderer = null;
    this.fatalError = "";
    this.masterGain = 0;
    this.targetMasterGain = 1;
    this.masterRampStep = 1 / Math.max(1, Math.round(sampleRate * 0.012));
    this.framesSinceDiagnostic = 0;
    this.diagnosticIntervalFrames = Math.max(1, Math.round(sampleRate / 4));
    this.meterSumSquares = 0;
    this.meterPeak = 0;
    this.meterFrames = 0;
    this.activeFrames = 0;
    try {
      this.renderer = new AdaptiveSoundRendererV1(options.processorOptions?.condition, sampleRate);
      this.port.postMessage({
        type: "ready",
        processor_name: PROCESSOR_NAME,
        sample_rate: sampleRate,
        output_layout: "identical_dual_mono",
        diagnostics: this.renderer.diagnostics(),
      });
    } catch (error) {
      this.fail(error);
    }
    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  handleMessage(message) {
    if (!message || typeof message !== "object" || !this.renderer || this.fatalError) return;
    try {
      if (message.type === "set_power_weights") {
        this.renderer.setPowerWeights(message.power_weights, message.transition_seconds);
      } else if (message.type === "set_lane_enabled") {
        this.renderer.setLaneEnabled(message.lane_id, message.enabled);
      } else if (message.type === "set_master_enabled") {
        this.targetMasterGain = message.enabled ? 1 : 0;
      } else if (message.type === "diagnostics") {
        this.publishDiagnostics();
      }
    } catch (error) {
      this.port.postMessage({
        type: "command_error",
        command: String(message.type || "unknown"),
        message: String(error?.message || error).slice(0, 240),
      });
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output?.length) return true;
    const frameCount = output[0]?.length || 0;
    if (!this.renderer || this.fatalError) {
      for (const channel of output) channel.fill(0);
      return true;
    }

    try {
      for (let frame = 0; frame < frameCount; frame += 1) {
        if (this.masterGain < this.targetMasterGain) {
          this.masterGain = Math.min(this.targetMasterGain, this.masterGain + this.masterRampStep);
        } else if (this.masterGain > this.targetMasterGain) {
          this.masterGain = Math.max(this.targetMasterGain, this.masterGain - this.masterRampStep);
        }
        const mono = this.renderer.processSample() * this.masterGain;
        if (this.masterGain > 0) this.activeFrames += 1;
        this.meterSumSquares += mono * mono;
        this.meterPeak = Math.max(this.meterPeak, Math.abs(mono));
        this.meterFrames += 1;
        for (const channel of output) channel[frame] = mono;
      }
      this.framesSinceDiagnostic += frameCount;
      if (this.framesSinceDiagnostic >= this.diagnosticIntervalFrames) {
        this.framesSinceDiagnostic = 0;
        this.publishDiagnostics();
      }
    } catch (error) {
      this.fail(error);
      for (const channel of output) channel.fill(0);
    }
    return true;
  }

  publishDiagnostics() {
    this.port.postMessage({
      type: "diagnostics",
      processor_name: PROCESSOR_NAME,
      sample_rate: sampleRate,
      master_state: this.masterGain === 0 ? "off" : (this.masterGain === 1 ? "on" : "transitioning"),
      run_seconds: this.activeFrames / sampleRate,
      meter: {
        output_rms: Math.sqrt(this.meterSumSquares / Math.max(1, this.meterFrames)),
        output_peak: this.meterPeak,
        frame_count: this.meterFrames,
      },
      diagnostics: this.renderer?.diagnostics() || null,
    });
    this.meterSumSquares = 0;
    this.meterPeak = 0;
    this.meterFrames = 0;
  }

  fail(error) {
    this.fatalError = String(error?.message || error || "Adaptive sound processor failed").slice(0, 240);
    this.port.postMessage({
      type: "fatal_error",
      processor_name: PROCESSOR_NAME,
      message: this.fatalError,
      fail_safe: "adaptive_synth_off_quantum_tree_and_programme_unchanged",
    });
  }
}

registerProcessor(PROCESSOR_NAME, IAMAdaptiveSoundProcessorV1);
