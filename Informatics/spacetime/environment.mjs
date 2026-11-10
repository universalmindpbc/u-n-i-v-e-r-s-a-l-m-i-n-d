// Silent native MP4: no HLS dependency or audio stream.
const $=s=>document.querySelector(s);
const video=$('#earth-film');
video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.autoplay=true;video.loop=true;
function resume(){if(document.hidden)return;video.play().then(()=>{video.dataset.playback='playing';}).catch(()=>{video.dataset.playback='awaiting-browser-permission';});}
video.addEventListener('canplay',resume);
video.addEventListener('volumechange',()=>{if(!video.muted||video.volume!==0){video.muted=true;video.volume=0;}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else resume();});
window.addEventListener('pageshow',resume);
window.addEventListener('pagehide',()=>video.pause());
// A normal page interaction retries playback if the browser deferred autoplay.
for(const event of ['touchend','pointerup','keydown'])document.addEventListener(event,()=>{if(video.paused)resume();},{passive:true});
resume();

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
