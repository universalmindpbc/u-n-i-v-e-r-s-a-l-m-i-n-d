'use strict';
(async()=>{
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const response=await fetch('/Informatics/geometry.json?v=1');if(!response.ok)throw Error('Geometry unavailable');const data=await response.json();
const make=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));parent.append(el);return el};
const pt=(i,n,r=240)=>[400+r*Math.sin(2*Math.PI*i/n),400-r*Math.cos(2*Math.PI*i/n)];
const path=(points,parent,attrs={})=>make('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(',')}`).join(' '),fill:'none',stroke:'#e4e9e9','stroke-width':1.4,'stroke-linejoin':'round','stroke-linecap':'round',...attrs},parent);
const text=(value,p,parent,attrs={})=>{const el=make('text',{x:p[0],y:p[1],fill:'#a5afb3','font-size':14,...attrs},parent);el.textContent=value;return el};
const circle=make('circle',{cx:400,cy:400,r:240,fill:'none',stroke:'#607078','stroke-width':.7},$('#alpha'));
const labels=[];for(let i=0;i<24;i++){const g=make('g',{},$('#alpha'));const node=data.node_indices.includes(i);path([pt(i,24,246),pt(i,24,node?256:251)],g,{stroke:node?'#c0c9cd':'#465157','stroke-width':.7});text(data.display_alpha[i],pt(i,24,275),g,{fill:node?'#f0f2f2':'#899598','font-size':node?20:14});text(i===0?'24':String(i).padStart(2,'0'),pt(i,24,310),g,{'font-size':8,fill:'#4f6068'});if(node)make('circle',{cx:pt(i,24)[0],cy:pt(i,24)[1],r:2,fill:'#e7eeee'},g);labels.push(g);}
for(const r of [330,350])make('circle',{cx:400,cy:400,r,fill:'none',stroke:'#4b5a62','stroke-width':.4,'stroke-dasharray':r===330?'1 9':'30 170'},$('#guides'));
path([[390,400],[410,400]],$('#guides'),{stroke:'#344249','stroke-width':.6});path([[400,390],[400,410]],$('#guides'),{stroke:'#344249','stroke-width':.6});
const uni=path(data.unicursal_indices.map(i=>pt(i,24)),$('#unicursal'),{'stroke-width':2});
const triangles=data.triangles.map(indices=>path(indices.map(i=>pt(i,24)),$('#stars'),{stroke:'#a5b1b6','stroke-width':1}));
// Intersection hexagon of the two equilateral triangles, not their outer hull.
const hex=path(Array.from({length:7},(_,i)=>pt(i+.5,6,240/Math.sqrt(3))),$('#hexagon'),{stroke:'#6c7c82','stroke-width':1,fill:'#ffffff03'});
const betaCircle=make('circle',{cx:400,cy:400,r:240,fill:'none',stroke:'#56646b','stroke-width':.6},$('#beta'));
for(let i=0;i<9;i++){const p=pt(i,9);make('circle',{cx:p[0],cy:p[1],r:2,fill:'#a5b1b6'},$('#beta'));text(i||9,pt(i,9,278),$('#beta'),{'font-size':18,fill:data.doubling.includes(i)?'#f0f3f3':'#56646b'});}
const doubling=path(data.doubling.map(i=>pt(i,9)),$('#beta'),{'stroke-width':2.2});
const paths=[circle,uni,...triangles,hex,doubling];paths.forEach(p=>{p.dataset.length=p.getTotalLength();p.style.strokeDasharray=p.dataset.length});
const draw=(p,t)=>p.style.strokeDashoffset=Number(p.dataset.length)*(1-Math.max(0,Math.min(1,t)));
const duration=7000,total=duration*5;let elapsed=0,last=null,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease=t=>Math.max(0,Math.min(1,t));
function render(){const stage=Math.min(4,Math.floor(elapsed/duration)),fraction=(elapsed%duration)/duration;document.body.dataset.stage=stage;$('#counter').textContent=`0${stage+1} / 05`;$('#progress').style.width=`${elapsed/total*100}%`;document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.stage)===stage));
$('#alpha').style.opacity=stage===4?.10:1;labels.forEach((g,i)=>g.style.opacity=stage>0?1:ease(fraction*30-i));draw(circle,stage>0?1:fraction*2);
$('#unicursal').style.opacity=stage<1?0:stage===4?.13:1;draw(uni,stage===1?fraction*1.3:stage>1?1:0);
$('#stars').style.opacity=stage<2?0:stage===4?.08:.65;triangles.forEach((p,i)=>draw(p,stage===2?fraction*2-i:stage>2?1:0));
$('#hexagon').style.opacity=stage>=3?1:0;draw(hex,stage===3?fraction*1.5:stage>3?1:0);
$('#beta').style.opacity=stage===4?1:0;draw(doubling,stage===4?fraction*1.3:0);
const sequences=['0 · 1 · 1 · 2 · 3 · 5 · 8','9 → 3 → 6 → 9 → 3 → 6','9 · 3 · 6   /   3 · 9 · 6','α · γ','1 → 2 → 4 → 8 → 7 → 5'];$('#sequence').textContent=sequences[stage];
const active=stage===1?uni:stage===4?doubling:null;const tracer=$('#tracer');tracer.style.opacity=active&&fraction<1/1.3?1:0;if(active){const p=active.getPointAtLength(Number(active.dataset.length)*ease(fraction*1.3));tracer.setAttribute('cx',p.x);tracer.setAttribute('cy',p.y);}
$('#play').textContent=playing?'Ⅱ':'▷';$('#play').setAttribute('aria-label',playing?'Pause animation':'Play animation');}
$('#play').onclick=()=>{playing=!playing;if(playing&&elapsed>=total-1)elapsed=0;last=null;render()};$('#replay').onclick=()=>{elapsed=0;playing=true;last=null;render()};document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{elapsed=Number(b.dataset.stage)*duration+duration-1;playing=false;render()});
if(!playing)elapsed=total-1;
const canvas=$('#rain'),ctx=canvas.getContext('2d');let w,h,columns=[];function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);columns=Array.from({length:Math.ceil(w/38)},(_,i)=>({x:i*38,y:Math.random()*h,s:8+Math.random()*14}));}resize();addEventListener('resize',resize);let rainTime=0;function frame(now){const dt=last===null?0:Math.min(now-last,60);last=now;if(playing&&!document.hidden){elapsed=Math.min(total-1,elapsed+dt);if(elapsed>=total-1)playing=false;render();rainTime+=dt;if(rainTime>80){ctx.clearRect(0,0,w,h);ctx.font='9px monospace';columns.forEach((c,i)=>{c.y=(c.y+c.s*.08)%(h+200);for(let k=0;k<10;k++){const centre=Math.abs(c.x-w/2)<Math.min(w*.3,360);ctx.fillStyle=`rgba(137,161,168,${(1-k/10)*(centre?.10:.32)})`;ctx.fillText(String(data.display_alpha[(i+k)%24]),c.x,c.y-k*22);}});rainTime=0;}}requestAnimationFrame(frame);}render();requestAnimationFrame(frame);
})().catch(error=>{console.error(error);document.querySelector('#sequence').textContent='Unable to load geometry. Please reload.';});
