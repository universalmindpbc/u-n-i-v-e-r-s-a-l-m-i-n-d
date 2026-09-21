import {lockNavigation,unlockNavigation} from './navigation.js?v=26c0222b315f';
// Reuse the canonical M8 viewer, foreground mirror, native GIF pages and sound engines.
const send=(type,extra={})=>parent.postMessage({type,...extra},location.origin);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
lockNavigation();
let checkout=false,proofing=false;
let video,timer,running=false,stopped=false,configuring=false,starting=false;
let previousChoice,previousAdaptation,played=0,lastVideoTime=0;
let pagePositioned=false;
function positionOpeningPage(){
 if(pagePositioned)return;
 const panel=document.querySelector('[data-emdr-gif-preset="m8"][data-emdr-gif-scroll]');
 const pages=panel?.querySelectorAll('.adaptive-television-emdr-gif-page');
 if(panel?.clientHeight&&pages?.[1]?.dataset.emdrGifPageSize==='3'){
  panel.scrollTo({top:pages[1].offsetTop-pages[0].offsetTop,behavior:'instant'});pagePositioned=true;
 }
}
function pause(){
 const wasRunning=running;
 running=false;clearInterval(timer);video?.pause();
 window.IAMQuantumTree?.setEnabled(false,{persist:false});window.IAMSubaudibleMantra?.setEnabled(false,{persist:false});
 if(wasRunning)send('study-paused');
}
function stop(){
 if(stopped)return;stopped=true;running=false;clearInterval(timer);video?.pause();
 window.__iamStopAdaptiveMedia?.();window.IAMSubaudibleMantra?.setEnabled(false,{persist:false});
 if(previousChoice)window.IAMAdaptiveSoundSession?.setSessionChoice(previousChoice,'study_restore');
 else window.IAMAdaptiveSoundSession?.clearSessionChoice('study_restore');
 if(previousAdaptation===null)sessionStorage.removeItem('iamLatestEmdrAdaptation');
 else if(previousAdaptation!==undefined)sessionStorage.setItem('iamLatestEmdrAdaptation',previousAdaptation);
}
async function configure(uid,completedSessionId){
 if(configuring||stopped)return;configuring=true;
 try{
  const response=await fetch('api/study.php',{credentials:'same-origin',cache:'no-store'}),state=await response.json();
  if(!response.ok||!state.participant?.consent||state.participant.withdrawn||state.config.stream_uid!==uid
   ||!state.participant.sessions.some(s=>completedSessionId?s.id===completedSessionId&&s.state==='complete':s.state==='experience'))throw new Error('Please reopen your study session.');
  proofing=state.preview===true&&state.preview_available===true;
  for(let i=0;i<200&&!window.IAMAdaptiveSound?.prepareStudy;i++)await wait(100);
  if(!window.IAMTelevisionRoom?.prepareStudyExperience||!window.IAMAdaptiveSoundSession)throw new Error('Please refresh to load the experience.');
  await window.IAMAdaptiveSoundSession.ready;
  previousChoice=window.IAMAdaptiveSoundSession.currentChoice();previousAdaptation=sessionStorage.getItem('iamLatestEmdrAdaptation');
  window.IAMQuantumTree.setEnabled(false,{persist:false});
  if(!completedSessionId)window.IAMAdaptiveSoundSession.setSessionChoice({profile_id:'inspiration_gamma_80_v1',carrier_hz:444,high_concern_session_opt_in:true},'consented_study');
  video=await window.IAMTelevisionRoom.prepareStudyExperience(uid,state.config.video_track_title||state.config.video_title,{enter:false,artist:state.config.video_artist||''});
  const session=state.participant.sessions.find(s=>s.state==='experience');
  played=session?.video_stream_uid===uid?(session.exposure_seconds||0):0;
  video.loop=false;video.controls=false;
  if(completedSessionId){await completeCheckout(completedSessionId);send('study-prepared',{checkout:true});return;}
  for(const other of document.querySelectorAll('video,audio'))if(other!==video&&!other.muted)other.pause();
  document.addEventListener('play',event=>{
   if(running&&event.target instanceof HTMLVideoElement&&event.target!==video&&!event.target.hasAttribute('data-emdr-gif-tile'))event.target.pause();
  },true);
  // Preserve the existing scrollable M8 region and its keyboard/swipe behaviour.
  // Use native overlays; the study owns the entry and the completion transition.
  document.querySelector('[data-television-play]').disabled=true;
  video.addEventListener('ended',()=>{tick(true);running=false;clearInterval(timer);});
  video.addEventListener('error',()=>{if(stopped)return;pause();send('study-error',{message:'The video could not load. Please refresh to try again.'});});
  await window.IAMStreamController.preloadMedia(video,{targetSeconds:4});
  for(let i=0;i<100&&(!Number.isFinite(video.duration)||video.duration<=0);i++)await wait(100);
  if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('The video could not load. Please refresh to try again.');
  positionOpeningPage();
  if(!stopped){document.querySelector('[data-television-play]').disabled=false;send('study-prepared',{duration:video.duration});}
 }catch(error){if(!stopped)send('study-error',{message:error.message});}
}
function tick(ended=false){
 if(!video||stopped)return;
 const current=video.currentTime,advance=current-lastVideoTime;
 if(advance>0&&advance<8)played+=advance;
 lastVideoTime=current;
 // Optional sound diagnostics must never swallow the video's completion event.
 const diagnostics=engine=>{try{return engine?.diagnostics()||{};}catch{return {};}};
 const sound=diagnostics(window.IAMAdaptiveSound),quantum=diagnostics(window.IAMQuantumTree),mantra=diagnostics(window.IAMSubaudibleMantra);
 send('study-tick',{values:{media_time:played,position:current,duration:video.duration,ended,playing:!document.hidden&&(ended||!video.paused),
  preset:document.querySelector('[data-emdr-gif-world]')?.dataset.emdrGifPreset,carrier_hz:sound.carrier_hz,profile_id:sound.profile_id,
  quantum_tree_enabled:quantum.enabled&&quantum.playing,mantra_enabled:mantra.enabled&&mantra.outputVerified,
  sound_running:sound.context_state==='running'&&sound.engine_state==='running'}});
}
async function start(){
 if(!video||stopped||running||starting)return;starting=true;
 try{
  window.IAMTelevisionRoom.preparePresentationEntry();
  window.IAMQuantumTree.setEnabled(true,{persist:false});window.IAMSubaudibleMantra.setEnabled(true,{persist:false});
  const soundReady=window.IAMAdaptiveSound.prepareStudy();
  // Start the existing player from the parent's entry click, preserving browser user activation.
  const playback=window.IAMStreamController.play(video)||video.play();
  // Begin the server clock while audio initialises, not after its async preparation.
  lastVideoTime=video.currentTime;running=true;tick();clearInterval(timer);timer=setInterval(()=>tick(video.ended),1000);
  await Promise.all([soundReady,playback]);
  if(stopped)return;
  const target=Math.max(video.currentTime,played);
  if(Number.isFinite(video.duration)&&video.duration>0)video.currentTime=Math.min(target,video.duration);
  lastVideoTime=video.currentTime;tick();
  positionOpeningPage();
 }catch(error){if(!stopped){pause();send('study-error',{message:'Playback paused. Please enter the experience again.'});}}
 finally{starting=false;}
}
function showHome(){document.body.classList.remove('television-room-open','television-room-opening');document.querySelector('[data-television-room]').setAttribute('aria-hidden','true');}
async function completeCheckout(sessionId){
 const response=await fetch('api/study.php',{credentials:'same-origin',cache:'no-store'}),state=await response.json();
 if(!response.ok||state.participant?.withdrawn||!state.participant?.sessions.some(s=>s.id===sessionId&&s.state==='complete')||state.participant.sessions.some(s=>!['complete','stopped'].includes(s.state)))return false;
 stop();checkout=true;window.IAMTelevisionRoom.preparePresentationEntry();unlockNavigation();return true;
}
function previewFinal30(){
 if(!proofing||!video||stopped||!running||!Number.isFinite(video.duration))return false;
 const position=Math.max(0,video.duration-30);
 video.currentTime=position;lastVideoTime=position;
 return true;
}
window.IAMStudyExperience={start,showHome,completeCheckout,previewFinal30};
document.addEventListener('click',event=>{
 const play=event.target.closest('[data-television-play]');
 if(play&&!checkout){event.preventDefault();event.stopImmediatePropagation();if(!play.disabled)parent.IAMStudyShell.startExperience();return;}
},true);
window.addEventListener('resize',()=>{if(!running)pagePositioned=false;requestAnimationFrame(positionOpeningPage);});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent)return;
 if(event.data?.type==='study-config')void configure(event.data.uid,event.data.completedSessionId);
 if(event.data?.type==='study-stop')stop();
 if(event.data?.type==='study-pause')pause();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',stop);
send('study-ready');
