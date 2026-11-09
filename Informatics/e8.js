'use strict';
(() => {
 const root=document.getElementById('e8-view'),svg=root.querySelector('svg.e8-drawing');
 const view=root.querySelector('#e8-projection'),guide=root.querySelector('#e8-guide'),step=root.querySelector('#e8-step');
 const label=root.querySelector('#e8-step-label'),residue=root.querySelector('#e8-residue'),detail=root.querySelector('#e8-detail');
 const layers=Object.fromEntries(['alpha','beta','gamma'].map(name=>[name,root.querySelector('#e8-'+name)])),ns='http://www.w3.org/2000/svg';
 let data=null,current=[],animation=0,lastWidth=0;
 const add=(tag,attrs,parent=svg)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;};
 const point=(cx,cy,r,t)=>[cx+r*Math.sin(t),cy-r*Math.cos(t)];
 const colors={root:'#62d998',reference:'#5ca8ff',beta:'#ffea42',gamma:'#ff84c5',guide:'#e2e8ec',grid:'#566a79'};
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
  for(const name of Object.keys(layers))root.querySelector('#e8-'+name+'-legend').hidden=!layers[name].checked;
  // Keep the original figure and controls together in the available viewport.
  const top=svg.getBoundingClientRect().top+window.scrollY;
  const after=[];for(let n=svg.nextElementSibling;n;n=n.nextElementSibling)after.push(n);
  const footer=after.reduce((sum,n)=>{const style=getComputedStyle(n);return sum+n.getBoundingClientRect().height+parseFloat(style.marginTop||0)+parseFloat(style.marginBottom||0);},0);
  const height=width<450?width:Math.max(160,Math.min(width,560,window.innerHeight-top-footer-14));
  const cx=width/2,cy=height/2,R=Math.min(width,height)/2-12,mode=view.value,period=mode==='p30'?30:24;
  const mx=cx,my=cy,mR=R;
  svg.dataset.layout='overlay';svg.dataset.m9Center=`${mx},${my}`;svg.dataset.m9Scale=mR;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('height',height);
  step.max=period-1;if(+step.value>=period)step.value=0;const k=+step.value;
  for(const name of Object.keys(layers))root.querySelector('#e8-'+name+'-legend').hidden=!layers[name].checked;
  label.textContent=`Cycle step ${k+1} of ${period}`;
  residue.textContent=mode==='p30'?'M9 layers fixed':layers.alpha.checked?`Alpha value ${data.fibonacci.display_values[k]}`:'E8 root cycle';
  detail.textContent=descriptions[mode][2];
  root.querySelector('#e8-view-title').textContent=descriptions[mode][0];root.querySelector('#e8-view-copy').textContent=descriptions[mode][1];
  root.querySelector('#e8-guide-note').hidden=!guide.checked;
  root.querySelector('#e8-cycle-note').hidden=mode!=='p30';
  root.querySelector('#e8-svg-description').textContent=`All 240 E8 roots appear in green. ${Object.keys(layers).filter(name=>layers[name].checked).map(name=>data.sequence_layers[name].label).join(', ')||'No M9 sequence'} layers are shown. Alpha is the blue Fibonacci circle, Beta is the yellow doubling path, and Gamma is the pink six-point star. Gamma is inset inside the blue Alpha circle, preserving its angular positions. The grey guide is controlled separately.${mode==='p30'?' M9 layers remain fixed while the E8 cycle advances through 30 steps.':''}`;
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
   const p=data.projections[mode],scale=R*data.overlay_layout.computed_root_radius;
   const phase=Math.atan2(p.xy[p.orbits[0][0]][1],p.xy[p.orbits[0][0]][0])+Math.PI/2;
   p.xy.forEach(([x,y],id)=>{targets[id]=[cx+scale*(x*Math.cos(phase)+y*Math.sin(phase)),cy+scale*(-x*Math.sin(phase)+y*Math.cos(phase))];});
   const radii=new Set();p.orbits.forEach(o=>{
    const radius=Math.hypot(...p.xy[o[0]])*scale,key=radius.toFixed(6);
    if(!radii.has(key))add('circle',{cx,cy,r:radius,fill:'none',stroke:colors.grid,'stroke-width':.6,opacity:.4},under);
    radii.add(key);active.add(o[k]);
   });
  }
  const rr=mR*data.overlay_layout.reference_radius,gr=mR*data.overlay_layout.gamma_radius,br=mR*data.overlay_layout.beta_radius,lr=mR*(data.overlay_layout.projection_label_radii[mode]||data.overlay_layout.label_radius),gamma=data.sequence_layers.gamma,beta=data.sequence_layers.beta;
  const gammaIndices=new Set(gamma.alpha_indices);
  const textAt=(text,r,t,color,parent)=>{const [x,y]=point(mx,my,r,t),n=add('text',{x,y,'text-anchor':'middle','dominant-baseline':'central','font-family':'Arial, sans-serif','font-size':Math.min(width<450?11:12,Math.max(8,R*(mode==='p30'?.088:.10))),'letter-spacing':0,fill:color,'data-e8-sequence-label':''},parent);n.textContent=text;};
  if(guide.checked){
   const base=mR*data.guide.octagon_radius;
   const polygon=(n,r,start=0,opacity=.5)=>add('polygon',{points:Array.from({length:n},(_,i)=>point(mx,my,r,start+2*Math.PI*i/n).join(',')).join(' '),fill:'none',stroke:colors.guide,'stroke-width':1,opacity,'data-e8-guide':n},under);
   polygon(8,base,0,.65);polygon(6,mR*data.guide.hexagon_radius,0,.55);polygon(3,mR*data.guide.triangle_radius,Math.PI,.45);
  }
  if(layers.alpha.checked){
   const group=add('g',{'data-e8-layer':'alpha'},over);
   add('circle',{cx:mx,cy:my,r:rr,fill:'none',stroke:colors.reference,'stroke-width':.9,opacity:.85},group);
   for(let n=0;n<24;n++){
    const t=2*Math.PI*n/24,[x,y]=point(mx,my,rr,t),selected=mode!=='p30'&&n===k,size=selected?6:3.6;
    const node=add('rect',{x:x-size/2,y:y-size/2,width:size,height:size,fill:colors.reference,'data-e8-reference':n,'data-alpha-active':selected},group);
    add('title',{},node).textContent=`Alpha position ${n===0?24:n}: ${data.sequence_layers.alpha.display_values[n]}`;
    const isGamma=layers.gamma.checked&&gammaIndices.has(n);
    textAt(data.sequence_layers.alpha.display_values[n],lr,t,isGamma?colors.gamma:colors.reference,group);
   }
  }
  if(layers.beta.checked){
   const group=add('g',{'data-e8-layer':'beta'},over);
   for(let n=0;n<9;n++){const [x,y]=point(mx,my,br,2*Math.PI*n/9);add('circle',{cx:x,cy:y,r:1.2,fill:colors.beta,opacity:.45,'data-e8-beta-grid':n||9},group);}
   const points=beta.closed_path.map(n=>point(mx,my,br,2*Math.PI*n/9));
   add('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:colors.beta,'stroke-width':1.5,'stroke-linejoin':'round','data-e8-beta-path':''},group);
   beta.display_cycle.forEach((value,i)=>{
    const t=2*Math.PI*value/9,[x,y]=points[i],node=add('circle',{cx:x,cy:y,r:2.6,fill:colors.beta,'data-e8-beta-value':value},group);
    add('title',{},node).textContent=`Beta ${value}: doubles to ${beta.closed_path[i+1]} modulo 9`;
    textAt(value,mR*(data.guide.octagon_radius+data.overlay_layout.reference_radius)/2,t,colors.beta,group);
    const [nx,ny]=points[i+1],dx=nx-x,dy=ny-y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,ax=x+dx*.58,ay=y+dy*.58;
    add('polyline',{points:[[ax-ux*4-uy*2.5,ay-uy*4+ux*2.5],[ax,ay],[ax-ux*4+uy*2.5,ay-uy*4-ux*2.5]].map(p=>p.join(',')).join(' '),fill:'none',stroke:colors.beta,'stroke-width':1},group);
   });
  }
  if(layers.gamma.checked){
   const group=add('g',{'data-e8-layer':'gamma'},over);
   gamma.triangle_paths.forEach((path,i)=>add('polyline',{points:path.map(n=>point(mx,my,gr,2*Math.PI*n/24).join(',')).join(' '),fill:'none',stroke:colors.gamma,'stroke-width':1.5,'stroke-linejoin':'round','data-e8-gamma-path':i},group));
   gamma.alpha_indices.forEach((n,i)=>{
    const t=2*Math.PI*n/24,[x,y]=point(mx,my,gr,t),node=add('circle',{cx:x,cy:y,r:2.8,fill:colors.gamma,'data-e8-gamma-index':n},group);
    add('title',{},node).textContent=`Gamma at Alpha position ${n===0?24:n}: ${gamma.display_values[i]}`;
    if(!layers.alpha.checked)textAt(gamma.display_values[i],lr,t,colors.gamma,group);
   });
  }
  const start=current.length===240?current:targets;
  const nodes=targets.map((pos,id)=>{
   const n=add('circle',{cx:start[id][0],cy:start[id][1],r:active.has(id)?Math.min(3.4,Math.max(2.3,R*.016)):Math.min(2.2,Math.max(.8,R*.008)),fill:colors.root,opacity:active.has(id)?1:.6,'data-root-id':id,'data-cycle-active':active.has(id)},dots);
   const title=add('title',{},n);title.textContent=mode==='symbolic'?`Symbolic position for root ${id}`:`Root ${id}: (${data.roots_scaled2[id].map(n=>n/2).join(', ')})`;return n;
  });
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const started=performance.now();const frame=t=>{const a=Math.min(1,(t-started)/420),e=a*a*(3-2*a);current=targets.map((p,i)=>p.map((v,j)=>start[i][j]+(v-start[i][j])*e));nodes.forEach((n,i)=>{n.setAttribute('cx',current[i][0]);n.setAttribute('cy',current[i][1]);});if(a<1)animation=requestAnimationFrame(frame);};animation=requestAnimationFrame(frame);
  }else{current=targets;nodes.forEach((n,i)=>{n.setAttribute('cx',targets[i][0]);n.setAttribute('cy',targets[i][1]);});}
  svg.dataset.projection=mode;svg.dataset.step=k;
 }
 view.addEventListener('change',()=>draw(true));guide.addEventListener('change',()=>draw());step.addEventListener('input',()=>draw());
 Object.values(layers).forEach(control=>control.addEventListener('change',()=>draw()));
 new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastWidth){lastWidth=width;draw();}}).observe(svg.parentElement);
 window.addEventListener('resize',()=>draw());
 window.AtlasE8={show(record){data=record.e8_geometry;requestAnimationFrame(()=>draw());},hide(){cancelAnimationFrame(animation);},resize(){draw();}};
})();
