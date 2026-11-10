export function clampWindow(from,to,[low,high],minimum){
 const span=Math.max(minimum,Math.min(high-low,to-from));
 const start=Math.max(low,Math.min(high-span,from));return [start,start+span];
}
export function zoomWindow([from,to],factor,fraction,limits,minimum){
 const anchor=from+(to-from)*fraction,span=(to-from)/factor;
 return clampWindow(anchor-span*fraction,anchor+span*(1-fraction),limits,minimum);
}
export function installNavigation({element,getWindow,setWindow,getLimits,minimum,getPlot,reset}){
 let gesture=null,mouse=null,suppressClick=false;
 const coordinate=clientX=>{const r=element.getBoundingClientRect(),p=getPlot();return Math.max(0,Math.min(1,(clientX-r.left-p.left)/p.width));};
 const apply=window=>setWindow(clampWindow(...window,getLimits(),minimum()));
 const pair=touches=>({mid:(touches[0].clientX+touches[1].clientX)/2,distance:Math.max(12,Math.hypot(touches[1].clientX-touches[0].clientX,touches[1].clientY-touches[0].clientY))});
 element.addEventListener('touchstart',e=>{
  if(e.touches.length===2){e.preventDefault();const p=pair(e.touches);gesture={...p,window:getWindow(),anchor:coordinate(p.mid),kind:'pinch'};}
  else if(e.touches.length===1)gesture={x:e.touches[0].clientX,y:e.touches[0].clientY,window:getWindow(),kind:'pan'};
 },{passive:false});
 element.addEventListener('touchmove',e=>{
  if(!gesture)return;
  if(e.touches.length===2&&gesture.kind==='pinch'){
   e.preventDefault();suppressClick=true;const p=pair(e.touches),span=(gesture.window[1]-gesture.window[0])*gesture.distance/p.distance;
   const anchor=gesture.window[0]+(gesture.window[1]-gesture.window[0])*gesture.anchor;
   apply([anchor-span*coordinate(p.mid),anchor+span*(1-coordinate(p.mid))]);
  }else if(e.touches.length===1&&gesture.kind==='pan'){
   const dx=e.touches[0].clientX-gesture.x,dy=e.touches[0].clientY-gesture.y;
   if(!gesture.horizontal&&Math.abs(dy)>Math.max(8,Math.abs(dx))){gesture=null;return;}
   if(Math.abs(dx)>8||gesture.horizontal){e.preventDefault();gesture.horizontal=true;suppressClick=true;const shift=-dx/getPlot().width*(gesture.window[1]-gesture.window[0]);apply(gesture.window.map(t=>t+shift));}
  }
 },{passive:false});
 const finish=e=>{if(e.touches.length<2)gesture=null;setTimeout(()=>{suppressClick=false;},400);};
 element.addEventListener('touchend',finish);element.addEventListener('touchcancel',finish);
 // Prevent Safari's page-scale gesture only inside the interactive timeline.
 element.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
 element.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});
 element.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&!e.target.closest('a,button')){mouse={x:e.clientX,window:getWindow()};element.setPointerCapture(e.pointerId);}});
 element.addEventListener('pointermove',e=>{if(!mouse)return;const dx=e.clientX-mouse.x;if(Math.abs(dx)>3){suppressClick=true;const shift=-dx/getPlot().width*(mouse.window[1]-mouse.window[0]);apply(mouse.window.map(t=>t+shift));}});
 element.addEventListener('pointerup',()=>{mouse=null;setTimeout(()=>{suppressClick=false;},0);});
 element.addEventListener('pointercancel',()=>{mouse=null;});
 element.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
 element.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();apply(zoomWindow(getWindow(),Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.008),coordinate(e.clientX),getLimits(),minimum()));},{passive:false});
 return {zoom:factor=>apply(zoomWindow(getWindow(),factor,.5,getLimits(),minimum())),reset};
}
