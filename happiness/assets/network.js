(() => {
  'use strict';
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  const field = canvas.parentElement;
  const ctx = canvas.getContext('2d', {alpha:true});
  if (!ctx) { field.dataset.animationState = 'unavailable'; return; }
  // A deterministic, illustrative spatial graph. No attendee data is used.
  let seed = 20261028;
  const random = () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const nodes = Array.from({length:137}, (_,i) => {
    const azimuth = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const radius = .56 + random() * .44;
    const span = Math.sqrt(1-z*z) * radius;
    return {x:Math.cos(azimuth)*span, y:z*radius*.9, z:Math.sin(azimuth)*span, phase:random()*Math.PI*2, i};
  });
  const edges = [], seen = new Set();
  nodes.forEach((a,i) => {
    const neighbours = nodes.map((b,j) => ({j,d:(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2})).filter(v=>v.j!==i).sort((a,b)=>a.d-b.d).slice(0,4);
    neighbours.forEach(({j}) => {
      const key=[Math.min(i,j),Math.max(i,j)].join(':');
      if(!seen.has(key)){seen.add(key);edges.push({a:i,b:j,phase:random(),pulse:random()<.1});}
    });
  });
  let width=0,height=0,t=0,last=0,raf=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetX=0,targetY=0,tiltX=0,tiltY=0,frames=0;
  function render(){
    ctx.clearRect(0,0,width,height);
    tiltX += (targetX-tiltX)*.035; tiltY += (targetY-tiltY)*.035;
    const yaw=t*.075+tiltX, pitch=-.16+Math.sin(t*.08)*.06+tiltY;
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);
    const scale=Math.min(width*.45,height*.45);
    const points=nodes.map(n=>{
      const drift=Math.sin(t*.3+n.phase)*.023;
      const x=n.x+drift,y=n.y+Math.cos(t*.22+n.phase)*.016,z=n.z+drift*.7;
      const rx=x*cy+z*sy, rz=z*cy-x*sy, ry=y*cx-rz*sx, depth=y*sx+rz*cx;
      const perspective=3.8/(3.8-depth);
      return {x:width/2+rx*scale*perspective,y:height/2+ry*scale*perspective,z:depth};
    });
    // Rear connections stay restrained, keeping the original flower legible.
    edges.forEach(edge=>{
      const a=points[edge.a],b=points[edge.b],depth=(a.z+b.z)/2;
      const alpha=.085+(depth+1)*.145;
      ctx.strokeStyle=`rgba(171,191,134,${alpha})`;ctx.lineWidth=.55+(depth+1)*.1;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      if(edge.pulse){
        const p=(t*.13+edge.phase)%1;
        ctx.fillStyle=`rgba(213,228,181,${.25+(depth+1)*.19})`;
        ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*p,a.y+(b.y-a.y)*p,1.1,0,Math.PI*2);ctx.fill();
      }
    });
    points.forEach((p,i)=>{
      const alpha=.25+(p.z+1)*.28;
      ctx.fillStyle=`rgba(195,211,160,${alpha})`;
      ctx.beginPath();ctx.arc(p.x,p.y,i%11===0?1.9:1.1,0,Math.PI*2);ctx.fill();
      if(i%23===0){ctx.strokeStyle=`rgba(184,201,145,${alpha*.4})`;ctx.lineWidth=.5;ctx.beginPath();ctx.arc(p.x,p.y,4.3,0,Math.PI*2);ctx.stroke();}
    });
    canvas.dataset.frame=String(++frames);
  }
  function loop(now){
    if(paused||document.hidden){raf=0;return;}
    if(now-last>=32){t+=Math.min((now-last)/1000,.05);last=now;render();}
    raf=requestAnimationFrame(loop);
  }
  function sync(){
    cancelAnimationFrame(raf);raf=0;last=performance.now();
    field.dataset.animationState=paused?'paused':document.hidden?'hidden':'running';
    if(!paused&&!document.hidden)raf=requestAnimationFrame(loop);
  }
  function resize(){
    const box=field.getBoundingClientRect();width=box.width;height=box.height;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);render();
  }
  const observer=new ResizeObserver(resize);observer.observe(field);
  field.addEventListener('pointermove',event=>{
    const box=field.getBoundingClientRect();targetX=((event.clientX-box.left)/box.width-.5)*.2;targetY=((event.clientY-box.top)/box.height-.5)*.1;
  },{passive:true});
  field.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  document.addEventListener('visibilitychange',sync);
  window.HappinessNetwork={setPaused(value){paused=Boolean(value);sync();},destroy(){paused=true;cancelAnimationFrame(raf);observer.disconnect();},nodeCount:nodes.length,edgeCount:edges.length};
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  window.addEventListener('pageshow',()=>{resize();sync();});
  resize();sync();
})();
