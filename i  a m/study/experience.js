// Reuse the canonical M8 viewer, foreground mirror, native GIF pages and sound engines.
const send=(type,extra={})=>parent.postMessage({type,...extra},location.origin);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
let video,timer,running=false,stopped=false,configuring=false,starting=false;
let previousChoice,previousAdaptation,played=0,lastVideoTime=0,eventStart=null,serverOffset=0;
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
 if(!running)return;
 running=false;clearInterval(timer);video?.pause();
 window.IAMQuantumTree?.setEnabled(false,{persist:false});window.IAMSubaudibleMantra?.setEnabled(false,{persist:false});
 send('study-paused');
}
function stop(){
 if(stopped)return;stopped=true;running=false;clearInterval(timer);video?.pause();
 window.__iamStopAdaptiveMedia?.();window.IAMSubaudibleMantra?.setEnabled(false,{persist:false});
 if(previousChoice)window.IAMAdaptiveSoundSession?.setSessionChoice(previousChoice,'study_restore');
 else window.IAMAdaptiveSoundSession?.clearSessionChoice('study_restore');
 if(previousAdaptation===null)sessionStorage.removeItem('iamLatestEmdrAdaptation');
 else if(previousAdaptation!==undefined)sessionStorage.setItem('iamLatestEmdrAdaptation',previousAdaptation);
}
async function configure(uid){
 if(configuring||stopped)return;configuring=true;
 try{
  const response=await fetch('api/study.php',{credentials:'same-origin',cache:'no-store'}),state=await response.json();
  if(!response.ok||!state.participant?.consent||state.participant.withdrawn||state.config.stream_uid!==uid
   ||!state.participant.sessions.some(s=>s.state==='experience'))throw new Error('Please reopen your study session.');
  for(let i=0;i<200&&!window.IAMAdaptiveSound?.prepareStudy;i++)await wait(100);
  if(!window.IAMTelevisionRoom?.prepareStudyExperience||!window.IAMAdaptiveSoundSession)throw new Error('Please refresh to load the experience.');
  await window.IAMAdaptiveSoundSession.ready;
  previousChoice=window.IAMAdaptiveSoundSession.currentChoice();previousAdaptation=sessionStorage.getItem('iamLatestEmdrAdaptation');
  window.IAMQuantumTree.setEnabled(false,{persist:false});
  window.IAMAdaptiveSoundSession.setSessionChoice({profile_id:'inspiration_gamma_80_v1',carrier_hz:444,high_concern_session_opt_in:true},'consented_study');
  video=await window.IAMTelevisionRoom.prepareStudyExperience(uid,state.config.video_title);
  const session=state.participant.sessions.find(s=>s.state==='experience');
  played=session.exposure_seconds||0;eventStart=session.event_starts_at?Date.parse(session.event_starts_at)/1000:null;serverOffset=state.server_now-Date.now()/1000;
  video.loop=false;video.controls=false;
  for(const other of document.querySelectorAll('video,audio'))if(other!==video)other.pause();
  document.addEventListener('play',event=>{
   if(event.target instanceof HTMLVideoElement&&event.target!==video&&!event.target.hasAttribute('data-emdr-gif-tile'))event.target.pause();
  },true);
  // Preserve the existing scrollable M8 region and its keyboard/swipe behaviour.
  for(const element of document.querySelectorAll('button,a,input,select,textarea'))element.inert=true;
  video.addEventListener('ended',()=>{tick(true);running=false;clearInterval(timer);});
  video.addEventListener('error',()=>{pause();send('study-error',{message:'The video could not load. Please refresh to try again.'});});
  await window.IAMStreamController.preloadMedia(video,{targetSeconds:4});
  for(let i=0;i<100&&(!Number.isFinite(video.duration)||video.duration<=0);i++)await wait(100);
  if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('The video could not load. Please refresh to try again.');
  positionOpeningPage();
  const remaining=eventStart?eventStart-(Date.now()/1000+serverOffset):0;
  if(remaining>0)await wait(remaining*1000);
  if(!stopped)send('study-prepared',{duration:video.duration});
 }catch(error){send('study-error',{message:error.message});}
}
function tick(ended=false){
 if(!video||stopped)return;
 const current=video.currentTime,advance=current-lastVideoTime;
 if(advance>0&&advance<8)played+=advance;
 lastVideoTime=current;
 const sound=window.IAMAdaptiveSound.diagnostics(),quantum=window.IAMQuantumTree.diagnostics(),mantra=window.IAMSubaudibleMantra.diagnostics();
 send('study-tick',{values:{media_time:played,position:current,duration:video.duration,ended,playing:!document.hidden&&(ended||!video.paused),
  preset:document.querySelector('[data-emdr-gif-world]')?.dataset.emdrGifPreset,carrier_hz:sound.carrier_hz,profile_id:sound.profile_id,
  quantum_tree_enabled:quantum.enabled&&quantum.playing,mantra_enabled:mantra.enabled&&mantra.outputVerified,
  sound_running:sound.context_state==='running'&&sound.engine_state==='running'}});
}
async function start(){
 if(!video||stopped||running||starting)return;starting=true;
 try{
  window.IAMQuantumTree.setEnabled(true,{persist:false});window.IAMSubaudibleMantra.setEnabled(true,{persist:false});
  const soundReady=window.IAMAdaptiveSound.prepareStudy();
  // Start the existing player from the parent's entry click, preserving browser user activation.
  const playback=window.IAMStreamController.play(video)||video.play();
  await Promise.all([soundReady,playback]);
  const target=eventStart?Math.max(0,Date.now()/1000+serverOffset-eventStart):Math.max(video.currentTime,played);
  if(Number.isFinite(video.duration)&&video.duration>0)video.currentTime=Math.min(target,video.duration);
  lastVideoTime=video.currentTime;running=true;tick();clearInterval(timer);timer=setInterval(()=>tick(),1000);
  positionOpeningPage();
 }catch(error){pause();send('study-error',{message:'Playback paused. Please enter the experience again.'});}
 finally{starting=false;}
}
window.IAMStudyExperience={start};
window.addEventListener('resize',()=>{if(!running)pagePositioned=false;requestAnimationFrame(positionOpeningPage);});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent)return;
 if(event.data?.type==='study-config')void configure(event.data.uid);
 if(event.data?.type==='study-stop')stop();
 if(event.data?.type==='study-pause')pause();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',stop);
send('study-ready');
