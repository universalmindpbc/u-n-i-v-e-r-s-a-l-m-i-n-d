const $=id=>document.getElementById(id);
const stream='https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/9f1ed3b5a38f52bfd008d2152d3884de/manifest/video.m3u8';
export function initMedia(onMotion) {
  const video=$('music-video'),geometryVideo=$('stage-geometry-video'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let attached=false,hls=null,videoOn=false,motionOn=!reduced.matches,playing=false,pending=false,attempt=0;
  video.crossOrigin='anonymous';geometryVideo.crossOrigin='anonymous';video.volume=.65;geometryVideo.muted=true;let geometryAttached=false;
  const isAnimating=()=>playing&&motionOn&&!document.hidden;
  const motion=()=>{onMotion(isAnimating());if(geometryAttached){if(isAnimating())geometryVideo.play().catch(()=>{});else geometryVideo.pause();}};
  function notice(text=''){ $('media-status').textContent=text;$('media-status').hidden=!text; }
  function sync(){
    $('music-toggle').setAttribute('aria-pressed',String(playing));
    $('music-toggle').setAttribute('aria-label',playing?'Pause music':'Play music');
    $('music-symbol').textContent=playing?'Ⅱ':'▶';$('music-label').textContent=pending?'Loading…':'Music';
    $('motion-toggle').setAttribute('aria-pressed',String(motionOn));
    $('video-toggle').setAttribute('aria-pressed',String(videoOn));
    $('video-toggle').setAttribute('aria-label',videoOn?'Hide music video overlay':'Show music video overlay');
    video.style.opacity=videoOn?Number($('video-opacity').value)/100:0;
    document.body.dataset.musicPlaying=String(playing);document.body.dataset.videoOverlay=String(videoOn);motion();
  }
  function attach(){
    if(attached)return;
    if(!geometryAttached){geometryAttached=true;geometryVideo.src=new URL('./assets/hexeosis-hx_4a480.mp4',import.meta.url).href;geometryVideo.load();}
    if(window.Hls?.isSupported()){
      hls=new window.Hls({capLevelToPlayerSize:true,maxBufferLength:30});
      hls.on(window.Hls.Events.ERROR,(_event,data)=>{if(data.fatal){pending=false;playing=false;video.pause();hls.destroy();hls=null;attached=false;notice('Music is unavailable. Press Music to retry.');sync();}});
      hls.loadSource(stream);hls.attachMedia(video);
    } else if(video.canPlayType('application/vnd.apple.mpegurl')) video.src=stream;
    else throw new Error('Streaming unavailable');
    attached=true;
  }
  function play(){
    if(playing||pending)return;
    const currentAttempt=++attempt;notice();pending=true;sync();
    try{attach();const promise=video.play();promise?.catch(()=>{if(currentAttempt!==attempt)return;pending=false;playing=false;sync();notice('Music did not start. Press Music to retry.');});}
    catch{pending=false;sync();notice('Music is unavailable in this browser.');}
  }
  $('music-toggle').addEventListener('click',()=>{if(playing||pending){attempt++;pending=false;video.pause();sync();}else play();});
  video.addEventListener('playing',()=>{playing=true;pending=false;notice();sync();});
  video.addEventListener('pause',()=>{playing=false;pending=false;sync();});
  video.addEventListener('waiting',()=>{if(!video.paused){pending=true;playing=false;sync();}});
  video.addEventListener('error',()=>{pending=false;playing=false;sync();notice('Music is unavailable. Press Music to retry.');});
  $('video-toggle').addEventListener('click',()=>{videoOn=!videoOn;sync();if(videoOn&&!playing&&!pending)notice('Press Music to start the video.');else notice();});
  $('motion-toggle').addEventListener('click',()=>{motionOn=!motionOn;sync();});
  $('video-opacity').addEventListener('input',()=>{$('opacity-value').textContent=$('video-opacity').value+'%';sync();});
  $('music-volume').addEventListener('input',()=>{video.volume=Number($('music-volume').value)/100;$('volume-value').textContent=$('music-volume').value+'%';});
  function panel(open){$('mix-panel').hidden=!open;$('mix-toggle').setAttribute('aria-expanded',String(open));}
  $('mix-toggle').addEventListener('click',()=>panel($('mix-panel').hidden));
  $('mix-close').addEventListener('click',()=>{panel(false);$('mix-toggle').focus();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('mix-panel').hidden){panel(false);$('mix-toggle').focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.media-tools'))panel(false);});
  reduced.addEventListener('change',()=>{motionOn=!reduced.matches;sync();});
  geometryVideo.addEventListener('loadeddata',motion);
  document.addEventListener('visibilitychange',motion);
  addEventListener('pagehide',()=>{video.pause();geometryVideo.pause();hls?.destroy();});
  sync();return {isAnimating,start(){videoOn=true;$('video-opacity').value='7';$('opacity-value').textContent='7%';sync();play();}};
}
