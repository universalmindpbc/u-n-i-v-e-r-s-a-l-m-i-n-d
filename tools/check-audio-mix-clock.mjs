import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { AdaptiveSoundRendererV1 } from '../i  a m/adaptive-sound/dsp-v1.js';
import { createCandidateCondition } from '../i  a m/adaptive-sound/profiles-v1.js';
const source = (await fs.readFile(new URL('../i  a m/adaptive-sound/worklet-v1.js', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
for (const sampleRate of [44100, 48000]) {
  let Processor;
  let latest;
  vm.runInNewContext(source, {
    AdaptiveSoundRendererV1, sampleRate,
    AudioWorkletProcessor: class { constructor() { this.port = { postMessage: message => { latest = message; } }; } },
    registerProcessor: (_name, processor) => { Processor = processor; },
  });
  const condition = createCandidateCondition({profileId:'calm_alpha_80_v1', carrierHz:222, masteringCondition:'engineering_on', envelopeCandidateId:'raised_cosine_50_depth_80_v1', lowpassCandidateId:'butterworth_12db_minimum_phase_v1', technicalOutputGain:0.08});
  const processor = new Processor({processorOptions:{condition}});
  const render = frames => processor.process([], [[new Float32Array(frames), new Float32Array(frames)]]);
  render(sampleRate);
  assert.equal(latest.type, 'diagnostics');
  assert.equal(latest.run_seconds, 1);
  assert.ok(latest.meter.output_rms > 0);
  processor.handleMessage({type:'set_master_enabled', enabled:false});
  render(sampleRate);
  const stopped = latest.run_seconds;
  assert.ok(stopped > 1 && stopped < 1.013, 'Counter includes the existing 12 ms release tail');
  render(sampleRate);
  assert.equal(latest.run_seconds, stopped);
  assert.equal(latest.meter.output_rms, 0);
  processor.handleMessage({type:'set_master_enabled', enabled:true});
  render(sampleRate);
  assert.ok(Math.abs(latest.run_seconds - stopped - 1) < 1e-12);
}
console.log('Real DSP run clock passes at 44.1 and 48 kHz: rendered frames, master fade/off freeze, and resume.');
