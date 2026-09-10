// This adapter uses the existing M8 viewer, Stream player, Quantum Tree and sound engine.
const send = (type,extra={}) => parent.postMessage({type,...extra},location.origin);
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
let video, timer, running=false, stopped=false, configuring=false;
let previousChoice, previousAdaptation;
const control=document.createElement('button');
control.className='study-play-control'; control.textContent='Preparing your experience…'; control.disabled=true;
document.body.append(control);
function pause() {
  video?.pause(); window.IAMQuantumTree?.setEnabled(false,{persist:false}); window.IAMSubaudibleMantra?.setEnabled(false,{persist:false});
  running=false; control.hidden=false; control.textContent='Resume experience';
}
function stop() {
  if(stopped)return; stopped=true; clearInterval(timer); video?.pause();
  window.__iamStopAdaptiveMedia?.(); window.IAMSubaudibleMantra?.setEnabled(false,{persist:false});
  if(previousChoice) window.IAMAdaptiveSoundSession?.setSessionChoice(previousChoice,'study_restore');
  else window.IAMAdaptiveSoundSession?.clearSessionChoice('study_restore');
  // No programme is resumed while leaving this isolated iframe.
  if(previousAdaptation===null) sessionStorage.removeItem('iamLatestEmdrAdaptation');
  else if(previousAdaptation!==undefined) sessionStorage.setItem('iamLatestEmdrAdaptation',previousAdaptation);
}
async function configure(uid) {
  if(configuring||stopped)return; configuring=true;
  try {
    const response=await fetch('api/study.php',{credentials:'same-origin',cache:'no-store'});
    const state=await response.json();
    if(!response.ok||!state.participant?.consent||state.participant.withdrawn||state.preview||state.config.stream_uid!==uid
      ||!state.participant.sessions.some(s=>s.state==='experience')) throw new Error('Please open the video from your active study session.');
    for(let i=0;i<200&&!window.IAMAdaptiveSound?.prepareStudy;i++)await wait(100);
    if(!window.IAMTelevisionRoom?.prepareStudyExperience||!window.IAMAdaptiveSoundSession)throw new Error('The experience could not load. Please return to your study.');
    await window.IAMAdaptiveSoundSession.ready;
    previousChoice=window.IAMAdaptiveSoundSession.currentChoice();
    previousAdaptation=sessionStorage.getItem('iamLatestEmdrAdaptation');
    window.IAMQuantumTree.setEnabled(false,{persist:false});
    window.IAMAdaptiveSoundSession.setSessionChoice({profile_id:'inspiration_gamma_80_v1',carrier_hz:444,high_concern_session_opt_in:true},'consented_study');
    video=await window.IAMTelevisionRoom.prepareStudyExperience(uid);
    for(const other of document.querySelectorAll('video,audio'))if(other!==video)other.pause();
    for(const element of document.querySelectorAll('button,a,input,select,textarea,[tabindex]'))if(element!==control)element.inert=true;
    video.addEventListener('ended',()=>{tick(true); control.hidden=false;control.disabled=true;control.textContent='Saving your ten minutes…';});
    video.addEventListener('error',()=>{pause();send('study-error',{message:'The study video is unavailable. You can stop and return to your study.'});});
    control.disabled=false;control.textContent='Start experience';
  } catch(error) {control.textContent='Unable to prepare';send('study-error',{message:error.message});}
}
async function tick(ended=false) {
  if(!video||stopped)return;
  const sound=window.IAMAdaptiveSound.diagnostics(), quantum=window.IAMQuantumTree.diagnostics(), mantra=window.IAMSubaudibleMantra.diagnostics();
  send('study-tick',{values:{media_time:video.currentTime,playing:!document.hidden&&(ended||!video.paused),
    preset:window.IAMEMDRGif?.getState?.()?.preset||document.querySelector('[data-emdr-gif-world]')?.dataset.emdrGifPreset,
    carrier_hz:sound.carrier_hz,profile_id:sound.profile_id,
    quantum_tree_enabled:quantum.enabled&&quantum.playing,
    mantra_enabled:mantra.enabled&&mantra.outputVerified,
    sound_running:sound.context_state==='running'&&sound.engine_state==='running'}});
}
control.addEventListener('click',async()=>{
  if(!video||stopped||running)return;
  control.disabled=true;
  try {
    window.IAMQuantumTree.setEnabled(true,{persist:false}); window.IAMSubaudibleMantra.setEnabled(true,{persist:false});
    await window.IAMAdaptiveSound.prepareStudy();
    await tick(); await (window.IAMStreamController.play(video)||video.play());
    running=true;control.hidden=true;clearInterval(timer);timer=setInterval(()=>tick(),1000);
  }catch(error){control.hidden=false;control.textContent='Tap to resume';send('study-error',{message:'Your browser paused playback. Tap to resume, or stop the session.'});}
  finally{control.disabled=false;}
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  if(event.data?.type==='study-config')void configure(event.data.uid);
  if(event.data?.type==='study-stop')stop();
  if(event.data?.type==='study-pause')pause();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();pause();}},true);
window.addEventListener('pagehide',stop);
send('study-ready');
