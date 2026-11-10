// The existing Inner Planes visual and Universal One planet identity.
const $=s=>document.querySelector(s);
const video=$('#earth-film'),motion=$('#background-motion');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stream='https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/08d6983ef6584f2b8659ceaf0cfa248a/manifest/video.m3u8';
let desired=!reduced.matches,controller,initializing;
video.muted=true;video.defaultMuted=true;video.volume=0;
function updateMotion(){motion.setAttribute('aria-pressed',String(desired));motion.querySelector('span').textContent=desired?'Pause background':'Play background';}
function prepare(){
 if(initializing)return initializing;
 initializing=(async()=>{
  if(video.canPlayType('application/vnd.apple.mpegurl'))video.src=stream;
  else{
   await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='hls.min.js?v=1';script.onload=resolve;script.onerror=reject;document.head.append(script);});
   if(!window.Hls?.isSupported())throw new Error('Streaming unavailable');
   controller=new window.Hls({maxBufferLength:15,maxMaxBufferLength:30,capLevelToPlayerSize:true});
   controller.loadSource(stream);controller.attachMedia(video);
  }
 })().catch(()=>{desired=false;updateMotion();motion.querySelector('span').textContent='Background unavailable';});
 return initializing;
}
async function syncPlayback(){
 updateMotion();
 if(!desired||document.hidden){video.pause();return;}
 await prepare();
 if(!desired||document.hidden)return;
 try{await video.play();}catch{desired=false;updateMotion();}
}
video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.min(8,Math.max(0,video.duration-1));});
video.addEventListener('volumechange',()=>{if(!video.muted||video.volume!==0){video.muted=true;video.volume=0;}});
motion.addEventListener('click',()=>{desired=!desired;syncPlayback();});
reduced.addEventListener('change',()=>{if(reduced.matches){desired=false;syncPlayback();}});
document.addEventListener('visibilitychange',syncPlayback);
window.addEventListener('pagehide',()=>{desired=false;video.pause();controller?.destroy();controller=null;initializing=null;});
syncPlayback();

// Reuse the established Universal One texture algorithm; no assistant backend.
const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
const context=canvas.getContext('2d');
if(context){
 const ocean=context.createLinearGradient(0,0,256,128);ocean.addColorStop(0,'#0d6380');ocean.addColorStop(1,'#071f42');context.fillStyle=ocean;context.fillRect(0,0,256,128);
 context.fillStyle='#3d9a70';[[.08,.32,.2,.19],[.32,.56,.26,.24],[.59,.24,.22,.22],[.76,.62,.28,.2]].forEach(([x,y,w,h],i)=>{context.beginPath();context.ellipse(x*256,y*128,w*256,h*128,i*.42,0,Math.PI*2);context.fill();});
 context.strokeStyle='rgba(228,190,123,.62)';context.lineWidth=2;context.beginPath();context.moveTo(0,128*.48);context.bezierCurveTo(256*.27,128*.32,256*.63,128*.66,256,128*.44);context.stroke();
 $('#universal-one').style.setProperty('--planet-texture',`url("${canvas.toDataURL()}")`);
}
const summon=$('#one-summon'),panel=$('#one-panel'),close=$('#one-close');
function closePanel(){panel.hidden=true;summon.setAttribute('aria-expanded','false');summon.focus();}
summon.addEventListener('click',()=>{if(!panel.hidden){closePanel();return;}panel.hidden=false;summon.setAttribute('aria-expanded','true');close.focus();});
close.addEventListener('click',closePanel);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)closePanel();});
