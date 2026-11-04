/** One photo viewer; the existing festival video remains mounted and playing. */
export function initPortalPreview({beforeOpen=()=>{}}={}){
 const $=id=>document.getElementById(id),panel=$('portal-preview'),stage=$('portal-preview-stage'),img=$('portal-preview-image'),readout=$('portal-preview-zoom');
 let zoom=1,x=0,y=0,fit=1,focusReturn=null,aboutOpen=false,restore=[],points=new Map(),gesture=null;
 const limit=(v,min,max)=>Math.max(min,Math.min(max,v));
 function render(){
  const w=img.naturalWidth*fit*zoom,h=img.naturalHeight*fit*zoom;
  x=limit(x,-Math.max(0,(w-stage.clientWidth)/2),Math.max(0,(w-stage.clientWidth)/2));y=limit(y,-Math.max(0,(h-stage.clientHeight)/2),Math.max(0,(h-stage.clientHeight)/2));
  img.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(${fit*zoom})`;
  readout.textContent=Math.round(zoom*100)+'%';panel.dataset.zoom=zoom.toFixed(3);panel.dataset.pan=`${x.toFixed(1)},${y.toFixed(1)}`;
  $('portal-preview-out').disabled=zoom<=1;$('portal-preview-in').disabled=zoom>=6;
 }
 function resize(){if(panel.hidden||!img.naturalWidth)return;fit=Math.max(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight);render();}
 function reset(){zoom=1;x=y=0;resize();}
 function at(next,cx=stage.clientWidth/2,cy=stage.clientHeight/2){next=limit(next,1,6);const ratio=next/zoom,ax=cx-stage.clientWidth/2,ay=cy-stage.clientHeight/2;x=ax-(ax-x)*ratio;y=ay-(ay-y)*ratio;zoom=next;render();}
 function open(){
  beforeOpen();focusReturn=document.activeElement;aboutOpen=$('vision').open;if(aboutOpen)$('vision').close();
  restore=[...$('world').children].filter(e=>e!==panel&&e.id!=='music-video').map(e=>[e,e.inert]);restore.forEach(([e])=>e.inert=true);
  panel.hidden=false;document.body.dataset.portalPreview='true';reset();$('portal-preview-close').focus();
 }
 function close(){panel.hidden=true;delete document.body.dataset.portalPreview;points.clear();gesture=null;restore.forEach(([e,inert])=>e.inert=inert);restore=[];if(aboutOpen)$('vision').showModal();focusReturn?.focus();}
 for(const id of ['portal-preview-open','portal-preview-about'])$(id).addEventListener('click',open);
 $('portal-preview-close').addEventListener('click',close);$('portal-preview-in').addEventListener('click',()=>at(zoom*1.4));$('portal-preview-out').addEventListener('click',()=>at(zoom/1.4));$('portal-preview-reset').addEventListener('click',reset);
 img.addEventListener('load',resize);new ResizeObserver(resize).observe(stage);
 stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect();at(zoom*Math.exp(-e.deltaY*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
 const measurement=()=>{const p=[...points.values()];return p.length>1?{cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:{cx:p[0].x,cy:p[0].y,d:0};};
 const begin=()=>{gesture=points.size?{...measurement(),x,y,zoom}:null;};
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();stage.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});begin();stage.dataset.dragging='true';});
 stage.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const m=measurement(),r=stage.getBoundingClientRect();if(m.d&&gesture.d){zoom=limit(gesture.zoom*m.d/gesture.d,1,6);const ratio=zoom/gesture.zoom;x=m.cx-r.left-stage.clientWidth/2-(gesture.cx-r.left-stage.clientWidth/2-gesture.x)*ratio;y=m.cy-r.top-stage.clientHeight/2-(gesture.cy-r.top-stage.clientHeight/2-gesture.y)*ratio;}else{x=gesture.x+m.cx-gesture.cx;y=gesture.y+m.cy-gesture.cy;}render();});
 const end=e=>{points.delete(e.pointerId);begin();if(!points.size)delete stage.dataset.dragging;};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
 panel.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();close();return;}
  if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}return;}
  if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='0')reset();else if(e.key==='+'||e.key==='=')at(zoom*1.2);else if(e.key==='-')at(zoom/1.2);else{x+=e.key==='ArrowLeft'?60:e.key==='ArrowRight'?-60:0;y+=e.key==='ArrowUp'?60:e.key==='ArrowDown'?-60:0;render();}}
 });
 return {open,close};
}
