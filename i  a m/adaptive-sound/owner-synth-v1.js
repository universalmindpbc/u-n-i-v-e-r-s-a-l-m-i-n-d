import { createCandidateCondition } from './profiles-v1.js?v=3f39020ebeab';

export function createOwnerSynthTest() {
  let context, node, gain, moduleReady, pending, lastMessage;
  let desired = false, sequence = 0, error = '', messageAt = 0;
  let profileId = 'calm_alpha_80_v1', carrierHz = 222;
  const volume = .35;
  const policy = fetch(new URL('../adaptive-sound-intent-policy-v1.json', import.meta.url), {cache:'no-store'})
    .then(response => { if(!response.ok) throw Error('Sound policy unavailable'); return response.json(); });
  // Retain a handled promise until the first test gesture consumes it.
  policy.catch(() => {});
  async function start() {
    if (pending) return pending;
    desired = true; error = '';
    const revision = ++sequence;
    if (!context) {
      context = new (window.AudioContext || window.webkitAudioContext)();
      gain = context.createGain(); gain.gain.value = 0; gain.connect(context.destination);
    }
    const resumed = context.resume(); // Capture Safari permission before the policy/module awaits.
    if (!moduleReady) moduleReady = context.audioWorklet.addModule(new URL('./worklet-v1.js?v=319a423521a5', import.meta.url))
      .catch(e => { moduleReady = null; throw e; });
    pending = Promise.all([resumed, moduleReady, policy]).then(([, , registry]) => {
      if (!desired || sequence !== revision) return;
      const fallback = registry.session_policy.default_session;
      profileId = registry.bands[fallback.band_intent].profile_id;
      carrierHz = registry.carriers[fallback.carrier_intent].carrier_hz;
      if (!node) {
        node = new AudioWorkletNode(context, 'iam-adaptive-sound-v1', {
          numberOfInputs:0, numberOfOutputs:1, outputChannelCount:[2],
          processorOptions:{ condition:createCandidateCondition({profileId,carrierHz}) },
        });
        node.port.onmessage = event => {
          if(event.data.type === 'diagnostics') { lastMessage = event.data; messageAt = performance.now(); }
          if(event.data.type === 'fatal_error') { error = event.data.message; pause(); }
        };
        node.connect(gain);
      }
      node.port.postMessage({type:'set_master_enabled',enabled:true});
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(gain.gain.value,context.currentTime);
      gain.gain.linearRampToValueAtTime(volume,context.currentTime+.08);
    }).catch(e => { if(sequence === revision) { error = e.message; pause(); } })
      .finally(() => { pending = null; });
    return pending;
  }
  function pause(reset = false) {
    desired = false; sequence++;
    node?.port.postMessage({type:'set_master_enabled',enabled:false});
    if(gain) { gain.gain.cancelScheduledValues(context.currentTime); gain.gain.setTargetAtTime(0,context.currentTime,.005); }
    if(reset) {
      const previous = node; node = null; lastMessage = null; messageAt = 0;
      if(previous) { previous.port.onmessage = null; setTimeout(() => previous.disconnect(),40); }
    }
  }
  return {
    play:start, pause, stop:() => pause(true),
    diagnostics() {
      const running = desired && context?.state === 'running' && performance.now()-messageAt < 1000 && Boolean(lastMessage) && !error;
      const currentGain = running ? gain.gain.value : 0;
      return {running,pending:Boolean(pending),enabled:desired,volume:currentGain,
        outputRms:running ? Number(lastMessage?.meter?.output_rms || 0)*currentGain : 0,
        runSeconds:Number(lastMessage?.run_seconds || 0),profileId,carrierHz:Number(lastMessage?.diagnostics?.carrier_hz || carrierHz),error,
        lanes:lastMessage?.diagnostics?.lanes || null,allocation:lastMessage?.diagnostics?.allocation || null};
    },
  };
}
