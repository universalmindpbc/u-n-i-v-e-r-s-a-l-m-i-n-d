const clamp=x=>Math.max(0,Math.min(1,x));
const progress=(t,start,end)=>clamp((t-start)/(end-start));
export function storyFrame(t){
  const phase=t<2?'site':t<6?'arrival':t<16?'assembly':t<31?'fitout':t<51?'open':t<61?'dusk':'night';
  return {seconds:t,phase,truck:progress(t,2,6),main:progress(t,6,16),food:progress(t,16,18.5),park:progress(t,18.5,20.5),support:progress(t,20.5,22.5),apple:progress(t,22.5,24.5),playground:progress(t,24.5,27),furniture:progress(t,27,29),programme:progress(t,29,31),navigation:t>=31,night:progress(t,51,61),construction:progress(t,6,29)};
}
export function createStory(onFrame){
  let started=0,raf=0,hiddenAt=0,pausedDuration=0,running=false,manualNight=null;
  function frame(now){raf=0;if(!running||document.hidden)return;const state=storyFrame(Math.max(0,(now-started-pausedDuration)/1000));if(manualNight!==null)state.night=manualNight;onFrame(state);if(state.seconds<61)raf=requestAnimationFrame(frame);else running=false;}
  function start(){cancelAnimationFrame(raf);started=performance.now();pausedDuration=0;hiddenAt=document.hidden?started:0;manualNight=null;running=true;onFrame(storyFrame(0));raf=requestAnimationFrame(frame);}
  document.addEventListener('visibilitychange',()=>{if(!running)return;if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(raf);raf=0;}else{if(hiddenAt)pausedDuration+=performance.now()-hiddenAt;hiddenAt=0;raf=requestAnimationFrame(frame);}});
  addEventListener('pagehide',()=>{running=false;cancelAnimationFrame(raf);});
  return {start,setNight(value){manualNight=value;},isRunning:()=>running};
}
