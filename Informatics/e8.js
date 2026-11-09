'use strict';
(() => {
 const root=document.getElementById('e8-view'),svg=root.querySelector('svg.e8-drawing');
 const view=root.querySelector('#e8-projection'),guide=root.querySelector('#e8-guide'),step=root.querySelector('#e8-step');
 const label=root.querySelector('#e8-step-label'),residue=root.querySelector('#e8-residue'),detail=root.querySelector('#e8-detail');
 const legend=root.querySelector('#e8-reference-legend'),ns='http://www.w3.org/2000/svg';
 let data=null,current=[],animation=0,lastWidth=0;
 const add=(tag,attrs,parent=svg)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;};
 const point=(cx,cy,r,t)=>[cx+r*Math.sin(t),cy-r*Math.cos(t)];
 const colors={root:'#62d998',reference:'#5ca8ff',guide:'#e2e8ec',grid:'#566a79'};
 const descriptions={
  symbolic:['Symbolic composition','Ten sets of 24 positions surround the M9/P24 reference circle. Their radii and phases are chosen for this composition. This is a schematic view.', '10 × 24 positions · symbolic radii'],
  p24:['24-step E8 projection','An order-24 symmetry divides the 240 roots into ten cycles. This orthogonal projection preserves the 15° cyclic rotation. Two cycles share one radius.', '10 cycles of 24 · 9 distinct radii'],
  p30:['30-step E8 projection','The Coxeter projection places the 240 roots on eight circles, each containing a cycle of 30 points. One step is a 12° rotation.', '8 cycles of 30 · 8 distinct radii']
 };
 function draw(animate=false){
  if(!data||root.hidden)return;
  cancelAnimationFrame(animation);
  const width=svg.parentElement.getBoundingClientRect().width;
  if(width<1)return;
  const top=svg.getBoundingClientRect().top;
  const height=Math.max(220,Math.min(width,560,window.innerHeight-Math.max(0,top)-120));
  const cx=width/2,cy=height/2,R=Math.min(width,height)/2-25,mode=view.value,period=mode==='p30'?30:24;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('height',height);
  step.max=period-1;if(+step.value>=period)step.value=0;const k=+step.value;
  guide.disabled=mode==='p30';legend.hidden=mode==='p30';
  label.textContent=`Cycle step ${k+1} of ${period}`;
  residue.textContent=mode==='p30'?'Coxeter cycle':`M9 value ${data.fibonacci.display_values[k]}`;
  detail.textContent=descriptions[mode][2];
  root.querySelector('#e8-view-title').textContent=descriptions[mode][0];root.querySelector('#e8-view-copy').textContent=descriptions[mode][1];
  root.querySelector('#e8-guide-note').hidden=mode==='p30'||!guide.checked;
  svg.querySelectorAll(':scope > g').forEach(n=>n.remove());
  const under=add('g',{'pointer-events':'none'}),dots=add('g',{'data-e8-roots':''}),over=add('g',{'pointer-events':'none'});
  const targets=[],active=new Set();
  if(mode==='symbolic'){
   data.projections.p24.orbits.forEach((orbit,j)=>{
    const radius=R*data.symbolic.orbit_radii[j];
    add('circle',{cx,cy,r:radius,fill:'none',stroke:colors.grid,'stroke-width':.6,opacity:.3},under);
    orbit.forEach((id,n)=>{targets[id]=point(cx,cy,radius,2*Math.PI*n/24+data.symbolic.orbit_phase_degrees[j]*Math.PI/180);if(n===k)active.add(id);});
   });
  }else{
   const p=data.projections[mode],scale=R*(mode==='p24'?.82:.98);
   const phase=Math.atan2(p.xy[p.orbits[0][0]][1],p.xy[p.orbits[0][0]][0])+Math.PI/2;
   p.xy.forEach(([x,y],id)=>{targets[id]=[cx+scale*(x*Math.cos(phase)+y*Math.sin(phase)),cy+scale*(-x*Math.sin(phase)+y*Math.cos(phase))];});
   const radii=new Set();p.orbits.forEach(o=>{
    const radius=Math.hypot(...p.xy[o[0]])*scale,key=radius.toFixed(6);
    if(!radii.has(key))add('circle',{cx,cy,r:radius,fill:'none',stroke:colors.grid,'stroke-width':.6,opacity:.4},under);
    radii.add(key);active.add(o[k]);
   });
  }
  if(mode!=='p30'){
   const rr=R*(mode==='symbolic'?data.symbolic.reference_radius:.99);
   add('circle',{cx,cy,r:rr,fill:'none',stroke:colors.reference,'stroke-width':.8,opacity:.7},over);
   for(let n=0;n<24;n++){
    const t=2*Math.PI*n/24,[x,y]=point(cx,cy,rr,t),size=n===k?6:3.6;
    add('rect',{x:x-size/2,y:y-size/2,width:size,height:size,fill:colors.reference,'data-e8-reference':n},over);
    if(width>=450||n%3===0){const [tx,ty]=point(cx,cy,rr+13,t),text=add('text',{x:tx,y:ty,'text-anchor':'middle','dominant-baseline':'central','font-family':'Arial, sans-serif','font-size':12,fill:'#d9e4eb'},over);text.textContent=data.fibonacci.display_values[n];}
   }
   if(guide.checked){
    const base=R*(mode==='symbolic'?.46:.44);
    const polygon=(n,r,start=0,opacity=.75)=>add('polygon',{points:Array.from({length:n},(_,i)=>point(cx,cy,r,start+2*Math.PI*i/n).join(',')).join(' '),fill:'none',stroke:colors.guide,'stroke-width':1.15,opacity,'data-e8-guide':n},over);
    polygon(8,base,0,.5);polygon(6,base*.78,0,.6);polygon(3,base*.78);polygon(3,base*.78,Math.PI);polygon(3,base*.39,Math.PI,.4);
   }
  }
  const start=current.length===240?current:targets;
  const nodes=targets.map((pos,id)=>{
   const n=add('circle',{cx:start[id][0],cy:start[id][1],r:active.has(id)?3.6:width<450?1.7:2.2,fill:colors.root,opacity:active.has(id)?1:.62,'data-root-id':id,'data-cycle-active':active.has(id)},dots);
   const title=add('title',{},n);title.textContent=mode==='symbolic'?`Symbolic position for root ${id}`:`Root ${id}: (${data.roots_scaled2[id].map(n=>n/2).join(', ')})`;return n;
  });
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const started=performance.now();const frame=t=>{const a=Math.min(1,(t-started)/420),e=a*a*(3-2*a);current=targets.map((p,i)=>p.map((v,j)=>start[i][j]+(v-start[i][j])*e));nodes.forEach((n,i)=>{n.setAttribute('cx',current[i][0]);n.setAttribute('cy',current[i][1]);});if(a<1)animation=requestAnimationFrame(frame);};animation=requestAnimationFrame(frame);
  }else{current=targets;nodes.forEach((n,i)=>{n.setAttribute('cx',targets[i][0]);n.setAttribute('cy',targets[i][1]);});}
  svg.dataset.projection=mode;svg.dataset.step=k;
 }
 view.addEventListener('change',()=>draw(true));guide.addEventListener('change',()=>draw());step.addEventListener('input',()=>draw());
 new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;draw();}}).observe(svg.parentElement);
 window.addEventListener('resize',()=>draw());
 window.AtlasE8={show(record){data=record.e8_geometry;requestAnimationFrame(()=>draw());},hide(){cancelAnimationFrame(animation);},resize(){draw();}};
})();
