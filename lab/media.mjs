const $=id=>document.getElementById(id);
export const VIDEO_BLEND=.07;
const stream='https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/9f1ed3b5a38f52bfd008d2152d3884de/manifest/video.m3u8';
export function initMedia(onMotion) {
  const video=$('music-video'),geometryVideo=$('stage-geometry-video'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const truckVideos=[$('truck-fashion-video'),$('truck-anime-video')];truckVideos.forEach(v=>{v.muted=true;v.crossOrigin='anonymous';});
  let attached=false,hls=null,videoOn=false,motionOn=!reduced.matches,playing=false,pending=false,attempt=0;
  video.crossOrigin='anonymous';geometryVideo.crossOrigin='anonymous';video.volume=.65;geometryVideo.muted=true;let geometryAttached=false;
  const isAnimating=()=>playing&&motionOn&&!document.hidden;
  const motion=()=>{truckVideos.forEach(v=>{if(v.currentSrc||v.getAttribute('src')){if(isAnimating())v.play().catch(()=>{});else v.pause();}});onMotion(isAnimating());if(geometryAttached){if(isAnimating())geometryVideo.play().catch(()=>{});else geometryVideo.pause();}};
  function notice(text=''){ $('media-status').textContent=text;$('media-status').hidden=!text; }
  function sync(){
    video.style.opacity=videoOn?VIDEO_BLEND:0;
    document.body.dataset.musicPlaying=String(playing);document.body.dataset.videoOverlay=String(videoOn);motion();
  }
  function attach(){
    if(attached)return;
    for(const [i,v] of truckVideos.entries()){if(!v.getAttribute('src')){v.src=new URL('./assets/truck-'+(i===0?'fashion':'anime')+'.mp4',import.meta.url).href;v.load();}}
    if(!geometryAttached){geometryAttached=true;geometryVideo.src=new URL('./assets/hexeosis-hx_4a480.mp4',import.meta.url).href;geometryVideo.load();}
    // Native HLS keeps Safari playback in the initiating tap.
    if(video.canPlayType('application/vnd.apple.mpegurl')) video.src=stream;
    else if(window.Hls?.isSupported()){
      hls=new window.Hls({capLevelToPlayerSize:true,maxBufferLength:30});
      hls.on(window.Hls.Events.ERROR,(_event,data)=>{if(data.fatal){pending=false;playing=false;video.pause();hls.destroy();hls=null;attached=false;notice('Music is unavailable. Press Replay to retry.');sync();}});
      hls.loadSource(stream);hls.attachMedia(video);
    }
    else throw new Error('Streaming unavailable');
    attached=true;
  }
  function play(){
    if(playing||pending)return;
    const currentAttempt=++attempt;notice();pending=true;sync();
    try{attach();const promise=video.play();promise?.catch(()=>{if(currentAttempt!==attempt)return;pending=false;playing=false;sync();notice('Music did not start. Press Replay to retry.');});}
    catch{pending=false;sync();notice('Music is unavailable in this browser.');}
  }
  video.addEventListener('playing',()=>{playing=true;pending=false;notice();sync();});
  video.addEventListener('pause',()=>{playing=false;pending=false;sync();});
  video.addEventListener('waiting',()=>{if(!video.paused){pending=true;playing=false;sync();}});
  video.addEventListener('error',()=>{pending=false;playing=false;sync();notice('Music is unavailable. Press Replay to retry.');});
  reduced.addEventListener('change',()=>{motionOn=!reduced.matches;sync();});
  geometryVideo.addEventListener('loadeddata',motion);truckVideos.forEach(v=>v.addEventListener('loadeddata',motion));
  document.addEventListener('visibilitychange',motion);
  addEventListener('pagehide',()=>{video.pause();geometryVideo.pause();truckVideos.forEach(v=>v.pause());hls?.destroy();});
  sync();return {isAnimating,motionEnabled:()=>motionOn,setResponse(value){video.volume=.25+.4*value;document.body.dataset.soundResponse=video.volume.toFixed(2);},start(){videoOn=true;sync();play();}};
}
