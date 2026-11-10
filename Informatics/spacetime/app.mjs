import {installNavigation} from './navigation.mjs?v=5';
import {initWeather} from './weather.mjs?v=5';
import {KERNEL} from './kernel-manifest.mjs?v=5';
import {DAY,ZERO,ANCHOR,ALPHA,KING,KING_BITS,KING_INTS,HAMMING,coordinate,fromCoordinate,transform,timewaveAt,extent} from './model.mjs?v=2';
import {META,YEARLY,MONTHLY,KELLEY,EVENTS} from './data.mjs?v=2';
import {HUMAN} from './human.mjs?v=2';
const humanSeries=HUMAN.map(s=>({...s,rows:s.rows.map(r=>({...r,t:Date.parse(r.date+'T00:00:00Z')}))}));
const human=()=>humanSeries.find(h=>h.id===S.indicator);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const researchState={from:Date.UTC(2001,0,1),to:Date.UTC(2026,0,1)-1,anchor:ANCHOR,clock:'month',method:'values',indicator:'growth',depth:3,layout:'stacked',sequence:false,layers:{fibonacci:true,solar:true,king:true,timewave:false,events:true},cursor:.65};
const zenState={...researchState,clock:'year',layers:{fibonacci:false,solar:true,king:false,timewave:false,events:false}};
let mode='zen',S=zenState,weatherMode=false,navigationBase=null;
const weather=initWeather();
const colours={fibonacci:'#68dfc1',solar:'#eabd72',king:'#c8b5ed',timewave:'#87bdf0',human:'#efeee4'};
const names={fibonacci:'Fibonacci sequence',solar:'Solar activity',king:'King Wen sequence',timewave:'Timewave Zero'};
const ns='http://www.w3.org/2000/svg'; let geometry=null, lastModel=[], scheduled=0;
const solarYearly=YEARLY.map(r=>({...r,t:Date.parse(r.date+'T00:00:00Z')})),solarMonthly=MONTHLY.map(r=>({...r,t:Date.parse(r.date+'T00:00:00Z')}));
const SOLAR_MAX=Math.ceil(Math.max(...YEARLY.map(r=>r.value||0),...MONTHLY.map(r=>r.value||0))/50)*50;
const events=EVENTS.map(e=>({...e,t:Date.parse(e.date+'T00:00:00Z')}));
function svg(tag,attrs={},text){const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
function add(tag,attrs,text,parent=$('#chart')){const e=svg(tag,attrs,text);parent.append(e);return e;}
const iso=t=>new Date(t).toISOString().slice(0,10);
const fmt=(n,p=2)=>Number.isFinite(n)?n.toLocaleString('en-AU',{maximumFractionDigits:p}):'No observation';
function domain(){return S.sequence?(S.sequenceWindow||[0,192]):[S.from,S.to];}
function pointCoordinate(t){return S.sequence?t:coordinate(t,S.clock,S.anchor);}
function pointTime(x){return S.sequence?x:fromCoordinate(x,S.clock,S.anchor);}
function methodMax(){return S.method==='entropy'?Math.log2(9):8;}
function solarData(){return S.to-S.from<=30*365.25*DAY?solarMonthly:solarYearly;}
function solarCadence(){return solarData()===solarMonthly?'Monthly':'Annual';}
function valueFor(id,t){if(id==='solar')return null;if(id==='timewave')return timewaveAt(t,KELLEY);const seq=id==='fibonacci'?ALPHA:KING;if(mode==='zen')return seq[((Math.floor(pointCoordinate(t))%seq.length)+seq.length)%seq.length];return transform(seq,pointCoordinate(t),S.method,S.depth);}
function selected(){return (mode==='zen'?['solar','human','fibonacci','king','timewave']:['fibonacci','solar','human','king','timewave']).filter(id=>(id==='human'?S.indicator!=='none':S.layers[id])&&(!S.sequence||id==='fibonacci'||id==='king'));}
function metadata(id){if(id==='human')return (human().geography==='World'?'World':'US')+' · '+human().cadence.toLowerCase()+' · '+human().units;if(id==='solar')return solarCadence()+' mean · observed · sunspot number';if(id==='timewave')return 'Historical model · lower = greater novelty';if(mode==='zen')return 'One value / '+S.clock+' · '+(id==='fibonacci'?'24':'64')+' steps per cycle';return (id==='fibonacci'?'α · M9 / P24':'Binary values · mod 9')+' · '+({values:'residues',change:'absolute change',multiscale:'finite multiscale',entropy:'12-step entropy · bits'}[S.method]);}
function curve(id,w){const [a,b]=domain();
 if((id==='human'||id==='solar')&&b-a<(id==='human'&&human().cadence==='Annual'?730:62)*DAY){
  const rows=id==='human'?human().rows:solarData(),points=[];
  for(const r of rows){const start=Date.UTC(r.year,r.month?r.month-1:0,1),end=r.month?Date.UTC(r.year,r.month,1):Date.UTC(r.year+1,0,1);
   if(start<=b&&end>a)points.push([Math.max(a,start),r.value],[Math.min(b,end),r.value],[Math.min(b,end),null]);}
  return {points,dense:false,intervals:true};
 }
 if(mode==='zen'&&(id==='fibonacci'||id==='king')){
  const ca=pointCoordinate(a),cb=pointCoordinate(b),count=Math.ceil(cb)-Math.floor(ca);
  if(count>w/3)return {points:[],dense:false,zoomRequired:true,count};
  const points=[[a,valueFor(id,a)]];
  for(let n=Math.floor(ca)+1;n<=cb;n++){const t=pointTime(n);points.push([t,valueFor(id,t-1)],[t,valueFor(id,t)]);}
  points.push([b,valueFor(id,b)]);return {points,dense:false,nativeSteps:true};
 }
if(id==='human')return {points:human().rows.filter(r=>r.t>=a&&r.t<=b).map(r=>[r.t,r.value]),dense:false};if(id==='solar')return {points:solarData().filter(r=>r.t>=a&&r.t<=b).map(r=>[r.t,r.value]),dense:false};
 if(id==='timewave'){const end=Math.min(b,ZERO);if(end<a)return{points:[],dense:false};const n=Math.max(300,Math.round(w*2));return{points:Array.from({length:n+1},(_,i)=>{const t=a+(end-a)*i/n;return[t,timewaveAt(t,KELLEY)];}),dense:false};}
 const seq=id==='fibonacci'?ALPHA:KING,ca=pointCoordinate(a),cb=pointCoordinate(b),f=S.method==='multiscale'?2**(S.depth-1):1,step=1/f;
 if((cb-ca)*f<=w*3){const points=[[a,valueFor(id,a)]];for(let x=Math.ceil(ca*f)/f;x<cb;x+=step){if(S.method==='entropy'||S.method==='change')points.push([pointTime(x-1e-8),transform(seq,x-1e-8,S.method,S.depth)]);points.push([pointTime(x),transform(seq,x,S.method,S.depth)]);}points.push([b,valueFor(id,b)]);return{points,dense:false};}
 const all=Array.from({length:seq.length*f},(_,i)=>transform(seq,i/f,S.method,S.depth)),full=extent(all),bars=[];
 for(let px=0;px<Math.ceil(w);px++){const ta=a+(b-a)*px/w,tb=Math.min(b,a+(b-a)*(px+1)/w),xa=pointCoordinate(ta),xb=pointCoordinate(tb);let lo,hi;if(xb-xa>=seq.length){[lo,hi]=full;}else{const vals=[transform(seq,xa,S.method,S.depth),transform(seq,xb,S.method,S.depth)];for(let x=Math.ceil(xa*f)/f;x<=xb;x+=step){vals.push(transform(seq,x,S.method,S.depth));if(S.method==='entropy'||S.method==='change')vals.push(transform(seq,x-1e-8,S.method,S.depth));}[lo,hi]=extent(vals);}bars.push([(ta+tb)/2,lo,hi]);}
 return{points:[],bars,dense:true};
}
function draw(){scheduled=0;const zen=mode==='zen',chart=$('#chart'),width=Math.max(250,Math.round(chart.getBoundingClientRect().width)),mobile=width<600,left=mobile?40:55,right=mobile?16:26,plotW=width-left-right,ids=selected(),hasEvents=S.layers.events&&!S.sequence,top=5,row=zen?(mobile?153:177):(mobile?121:112),plotHeight=zen?ids.length*row:S.layout==='overlay'?300:Math.max(1,ids.length)*row,bottom=hasEvents?100:40,height=top+plotHeight+bottom;
 chart.replaceChildren(svg('title',{id:'chart-title'},'Spacetime research timeline'),svg('desc',{id:'chart-description'},'Mathematical models and observed solar activity. Exact values are available through the inspection slider.'));
 chart.setAttribute('viewBox',`0 0 ${width} ${height}`);chart.style.height=height+'px';$('#loading').hidden=true;
 const[a,b]=domain();chart.dataset.windowFrom=a;chart.dataset.windowThrough=b;chart.dataset.clock=S.clock;const x=t=>left+(t-a)/(b-a)*plotW;geometry={left,plotW,a,b,x,top,plotHeight,height};
 let ticks=[];
 if(S.sequence){const stride=[1,2,4,8,16,24,48].find(n=>(b-a)/n<(mobile?5:9))||48;for(let n=Math.ceil(a/stride)*stride;n<=b;n+=stride)ticks.push([n,String(n)]);}
 else{const span=(b-a)/DAY,ya=new Date(a).getUTCFullYear(),yb=new Date(b).getUTCFullYear(),n=mobile?4:7;
 if(span>730){const interval=[1,2,5,10,20,25,50,100].find(v=>(yb-ya)/v<n)||100;for(let y=Math.ceil(ya/interval)*interval;y<=yb;y+=interval)ticks.push([Date.UTC(y,0,1),String(y)]);}
 else if(span>80){const stride=span>400?3:span>200?2:1;let d=new Date(a);d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));while(d.getTime()<b){ticks.push([d.getTime(),d.toLocaleDateString('en-AU',{month:'short',year:mobile?undefined:'2-digit',timeZone:'UTC'})]);d.setUTCMonth(d.getUTCMonth()+stride);}}
 else{const stride=Math.max(1,Math.ceil(span/n));for(let t=Math.ceil(a/DAY)*DAY;t<=b;t+=stride*DAY)ticks.push([t,new Date(t).toLocaleDateString('en-AU',{day:'numeric',month:'short',timeZone:'UTC'})]);}}
 for(const[t,label]of ticks){add('line',{x1:x(t),x2:x(t),y1:top,y2:top+plotHeight,class:'grid'});add('text',{x:x(t),y:top+plotHeight+24,'text-anchor':'middle'},label);}
 lastModel=ids.map((id,i)=>({id,...curve(id,plotW),row:i}));
 if(!ids.length)add('text',{x:width/2,y:top+55,'text-anchor':'middle',class:'series-title'},'Select a layer to explore.');
 for(const c of lastModel){const{id,points,bars,dense,row:i}=c,yTop=S.layout==='overlay'?top+Math.ceil(ids.length/2)*17+5:top+i*row,innerTop=yTop+(S.layout==='overlay'?25:40),innerH=S.layout==='overlay'?plotHeight-Math.ceil(ids.length/2)*17-45:row-53;
 const vals=points.map(p=>p[1]).filter(Number.isFinite);const min=id==='human'?human().min:0;const max=id==='human'?human().max:id==='solar'?SOLAR_MAX:id==='timewave'?Math.max(.000001,...vals):methodMax();c.min=min;c.max=max;c.y=v=>innerTop+innerH*(1-(v-min)/(max-min));
 if(S.layout==='stacked'){add('line',{x1:left,x2:width-right,y1:yTop+row,y2:yTop+row,class:'grid'});add('text',{x:left,y:yTop+15,class:'series-title'},names[id]);add('text',{x:left,y:yTop+30,class:'series-sub'},metadata(id));add('text',{x:left-10,y:innerTop+7,'text-anchor':'end'},max>=10000?Intl.NumberFormat('en',{notation:'compact'}).format(max):fmt(max,id==='timewave'?3:1));add('text',{x:left-10,y:innerTop+innerH+3,'text-anchor':'end'},String(min));}
 else if(S.layout==='overlay'){const legendX=left+(i%2)*(plotW/2),legendY=top+12+Math.floor(i/2)*17;add('line',{x1:legendX,x2:legendX+13,y1:legendY-3,y2:legendY-3,stroke:colours[id],'stroke-width':2});add('text',{x:legendX+19,y:legendY},names[id]);}
 if(c.zoomRequired){add('text',{x:left+8,y:innerTop+innerH/2,class:'zoom-guidance'},'Pinch to inspect '+c.count+' sequence steps.');}
 else if(dense){const d=bars.map(([t,lo,hi])=>`M${x(t).toFixed(2)},${c.y(lo).toFixed(2)}V${c.y(hi).toFixed(2)}`).join('');add('path',{d,stroke:colours[id],'stroke-width':1,opacity:.45,class:'envelope'});}
 else{let d='',pen=false;for(const[t,v]of points){if(v===null||!Number.isFinite(v)){pen=false;continue;}d+=(pen?'L':'M')+x(t).toFixed(2)+','+c.y(v).toFixed(2);pen=true;}add('path',{d,stroke:colours[id],class:'trace','data-series':id});if(c.nativeSteps&&points.length<plotW/4){for(const[t,v]of points.filter((_,j)=>j%2===0)){add('circle',{cx:x(t),cy:c.y(v),r:2.2,fill:colours[id],class:'sequence-node'});}}}
 if(id==='human'){
  if(min<0&&S.layout==='stacked'){add('line',{x1:left,x2:width-right,y1:c.y(0),y2:c.y(0),class:'grid'});add('text',{x:left-10,y:c.y(0)+3,'text-anchor':'end'},'0');}
  for(const r of human().rows.filter(r=>r.t>=a&&r.t<=b&&r.value!==null)){
   if(Number.isFinite(r.low)&&Number.isFinite(r.high))add('line',{x1:x(r.t),x2:x(r.t),y1:c.y(r.low),y2:c.y(r.high),class:'uncertainty'});
   add('circle',{cx:x(r.t),cy:c.y(r.value),r:human().cadence==='Monthly'?1.2:2.3,class:'observation'});
  }
  if(!points.length)add('text',{x:left+8,y:innerTop+innerH/2},'No observations · '+human().coverage.join('–'));
 }
 if(id==='timewave'&&b>ZERO){const xx=Math.max(left,x(ZERO));add('rect',{x:xx,y:innerTop,width:Math.max(0,width-right-xx),height:innerH,fill:'#b4c4d009'});if(width-right-xx>110)add('text',{x:xx+8,y:innerTop+innerH/2},'Beyond historical zero');}
 }
 if(S.layout==='overlay'){add('text',{x:left-9,y:top+Math.ceil(ids.length/2)*17+35,'text-anchor':'end'},'1');add('text',{x:left-9,y:top+plotHeight-15,'text-anchor':'end'},'0');}
 if(hasEvents){const y=top+plotHeight+48;add('text',{x:left,y,class:'series-title'},'Human evolution');const eligible=events.filter(e=>e.t>=a&&e.t<=b),shown=mobile&&eligible.length>3?eligible.filter((_,i)=>i%2===0):eligible;
 for(const[e,i]of shown.map((e,i)=>[e,i])){const px=x(e.t),anchor=px>width-95?'end':px<110?'start':'middle',yy=y+18;const link=add('a',{href:e.source,target:'_blank',rel:'noopener noreferrer','aria-label':`${e.label}, ${e.date}. ${e.note}`});add('circle',{cx:px,cy:yy,r:4,class:'event-dot'},undefined,link);add('text',{x:px,y:yy+16+(i%2)*12,'text-anchor':anchor,class:'event-label'},e.label,link);}}
 add('line',{id:'inspection-line',x1:0,x2:0,y1:top+35,y2:top+plotHeight,class:'cursor'});
 const dense=lastModel.some(c=>c.dense);$('#chart-note').textContent=S.sequence?'Sequence positions only · observations and historical events have no date mapping in this view.':(S.layout==='overlay'?'Shape comparison: residues ÷ '+fmt(methodMax(),3)+', sunspots ÷ 300, Timewave ÷ visible maximum. ':'Separate scales retain each layer’s units. ')+(dense?'Dense sequence envelopes preserve visible minima and maxima; zoom for detail. ':'')+(S.layers.timewave?'Timewave is sampled for display; inspection evaluates the exact point.':'');
 // A common solar denominator retains monthly peaks across viewing windows.
 if(S.layout==='overlay')$('#chart-note').textContent=$('#chart-note').textContent.replace('sunspots ÷ 300','sunspots ÷ '+fmt(lastModel.find(c=>c.id==='solar')?.max||SOLAR_MAX,1));
 if(!S.sequence&&S.indicator!=='none')$('#chart-note').textContent+=' '+human().cadence+' observations; lines are visual guides.'+(S.layout==='overlay'?' Human scale: (value − '+human().min+') / '+(human().max-human().min)+'.':'');
 if(zen)$('#chart-note').textContent='Each chart keeps its own units. '+solarCadence()+' solar observations · '+human().cadence.toLowerCase()+' human observations. '+(lastModel.some(c=>c.intervals)?'Zooming retains the original reporting intervals. ':'')+(S.layers.fibonacci||S.layers.king?'Sequence values are held for one '+S.clock+'; zoom leaves the clock fixed.':'');
 readout();
}
function requestDraw(){if(!scheduled)scheduled=requestAnimationFrame(draw);}
function readout(){if(!geometry)return;const{a,b,x}=geometry,t=a+(b-a)*S.cursor,line=$('#inspection-line');line.setAttribute('x1',x(t));line.setAttribute('x2',x(t));$('#inspect-date').textContent=S.sequence?'Step '+fmt(t,2):iso(t);const out=$('#readout');out.replaceChildren();
 function item(label,value){const d=document.createElement('div'),s=document.createElement('span'),v=document.createElement('strong');s.textContent=label;v.textContent=value;d.append(s,v);out.append(d);}
 for(const id of selected()){if(id==='human'){const row=human().rows.find(r=>r.year===new Date(t).getUTCFullYear()&&(human().cadence==='Annual'||r.month===new Date(t).getUTCMonth()+1));item(human().label,row&&row.value!==null?fmt(row.value,human().id==='development'?3:2)+' '+human().units+(Number.isFinite(row.low)?' · range '+fmt(row.low,0)+'–'+fmt(row.high,0):''):'No observation for this period');}else if(id==='solar'){const data=solarData(),target=new Date(t);const row=data.find(r=>r.year===target.getUTCFullYear()&&(solarCadence()==='Annual'||r.month===target.getUTCMonth()+1));item('Solar activity',row?`${fmt(row.value,1)} · ${solarCadence().toLowerCase()} mean${row.provisional?' · provisional':''}`:'No observation for this interval');}
 else{const v=valueFor(id,t);item(names[id],v===null?'Beyond historical zero':fmt(v,id==='timewave'?6:3)+(S.method==='entropy'&&id!=='timewave'?' bits':''));}}
 if(!S.sequence&&S.layers.events){const nearby=events.filter(e=>Math.abs(e.t-t)<Math.max(366*DAY,(b-a)/40));if(nearby.length)item('Nearby annotation',nearby.map(e=>e.label).join(' · '));}
}
function sync(){const h=human();names.human=h?.label||'Human indicator';$('#human-indicator').value=S.indicator;$('#human-indicator').disabled=S.sequence;$('#human-range').disabled=S.sequence||!h;$('#human-coverage').textContent=h?h.geography+' · '+h.coverage.join('–')+' · '+h.cadence.toLowerCase()+' · '+h.publisher:'Choose one human indicator to compare.';$('#human-definition').textContent=h?h.measure+' · '+h.units+(h.historical_note?' · Predecessor series before 1957.':''):'';$('#human-source').hidden=!h;$('#human-source').href=h?.source||'#';const unit=S.clock;const durations={day:['24 days','64 days','192 days'],month:['2 years','5 years 4 months','16 years'],year:['24 years','64 years','192 years'],decade:['240 years','640 years','1,920 years']}[unit];$('#cycle-summary').textContent=`Fibonacci: ${durations[0]}. King Wen: ${durations[1]}. Shared position repeat: ${durations[2]}.`;
 $('#method-note').textContent={values:'Linear interpolation between sequence positions. Native residues 0–8.',change:'Absolute change between adjacent residues. Held over each step.',multiscale:`Finite, ${S.depth}-level sum at ×2 scales. Experimental sequence model.`,entropy:'Trailing 12 positions · Shannon entropy in bits · sequence information only.'}[S.method];$('#depth-field').hidden=S.method!=='multiscale';
 $$('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.layout===S.layout));$$('[data-layer]').forEach(e=>{e.checked=S.layers[e.dataset.layer];e.disabled=S.sequence&&['solar','events','timewave'].includes(e.dataset.layer);});$('#clock').value=S.clock;$('#method').value=S.method;$('#depth').value=S.depth;$('#clock').disabled=S.sequence;$('#anchor').disabled=S.sequence;$('#from').value=iso(S.from);$('#through').value=iso(S.to);$('#anchor').value=iso(S.anchor);syncZen();requestDraw();}
function syncZen(){
 const h=human(),isZen=mode==='zen',short=isZen&&weatherMode;document.body.dataset.view=mode;document.body.dataset.horizon=short?'weather':'long';
 $$('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===mode));
 $('#instrument-title').textContent=!isZen?'Explore the timeline':short?'Space weather & '+$('#social-indicator').selectedOptions[0].textContent.toLowerCase():'Solar activity & '+$('#zen-indicator option[value="'+S.indicator+'"]').textContent.toLowerCase();
 $('#view-caption').textContent=isZen?(short?'One day on Earth':'One relationship at a time'):'Temporal observatory / 01';
 $('#inspect-label').textContent=isZen?'Move through time':'Inspect';
 $('#zen-indicator').value=S.indicator;
 $('#long-indicator-field').hidden=short;$('#social-indicator-field').hidden=!short;$('#space-indicator-field').hidden=!short;$('#weather-panel').hidden=!short;
 if(short)weather.show();else weather.hide();
 const pattern=['fibonacci','king','timewave'].find(id=>zenState.layers[id])||'none';$('#zen-pattern').value=pattern;$('#zen-clock').value=zenState.clock;
 $('#zen-clock-field').hidden=short||pattern==='none'||pattern==='timewave';
 const end=Date.UTC(2026,0,1)-1;
 $('#zen-range').value=short?'24h':S.to===end&&S.from===Date.UTC(2001,0,1)?'25':S.to===end&&S.from===Date.UTC(1926,0,1)?'100':h&&S.from===Date.UTC(h.coverage[0],0,1)&&S.to===Date.UTC(h.coverage[1]+1,0,1)-1?'available':'custom';
 $('#inspect').value=Math.round(S.cursor*1000);
 if(h){const p=$('#zen-source-note');p.replaceChildren(document.createTextNode(h.measure+' · '+h.units+'. '+h.geography+', '+h.coverage.join('–')+'. '));const a=document.createElement('a');a.href=h.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=h.publisher;p.append(a);if(h.historical_note)p.append(document.createTextNode(' Predecessor US equity series before 1957.'));}
 const note=pattern==='timewave'?'Historical Timewave ends on 21 December 2012. Lower values represent greater novelty.':pattern==='none'?'':(pattern==='fibonacci'?'Fibonacci':'King Wen')+': '+(pattern==='fibonacci'?24:64)+' '+S.clock+' steps per cycle · origin '+iso(S.anchor)+'. Native residues 0–8, held for each step. This is a declared research clock.';
 $('#zen-pattern-note').hidden=pattern==='none';$('#zen-pattern-note').textContent=note;
 $('#pattern-guidance').hidden=!isZen||short||pattern==='none';$('#pattern-guidance').textContent=pattern==='timewave'?'Historical Timewave · through 21 December 2012':pattern==='none'?'':(pattern==='fibonacci'?24:64)+' '+S.clock+' steps per cycle · pinch for detail.';
 $('#zoom-reset').disabled=short?!weather.canReset:!navigationBase;
}
function setMode(next){
 if(next===mode)return;
 navigationBase=null;const previous=S;mode=next;S=mode==='zen'?zenState:researchState;
 if(!previous.sequence){S.from=previous.from;S.to=previous.to;S.cursor=previous.cursor;if(previous.indicator!=='none')S.indicator=previous.indicator;}
 S.anchor=previous.anchor;
 sync();
}
for(const option of $('#human-indicator').children){if(option.value==='none')continue;$('#zen-indicator').append(option.cloneNode(true));}
$$('button[data-view]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.view)));
$('#zen-indicator').addEventListener('change',e=>{S.indicator=e.target.value;sync();});
$('#zen-range').addEventListener('change',e=>{navigationBase=null;weatherMode=e.target.value==='24h';if(!weatherMode){const h=human();S.from=Date.UTC(e.target.value==='available'?h.coverage[0]:2026-Number(e.target.value),0,1);S.to=Date.UTC(e.target.value==='available'?h.coverage[1]+1:2026,0,1)-1;}sync();});
$('#zen-pattern').addEventListener('change',e=>{for(const id of ['fibonacci','king','timewave'])zenState.layers[id]=e.target.value===id;if(e.target.value==='timewave'){navigationBase=null;S.from=Date.UTC(1945,7,6);S.to=ZERO;}sync();});
$('#zen-clock').addEventListener('change',e=>{zenState.clock=e.target.value;sync();});
document.addEventListener('spacetime-social-change',syncZen);document.addEventListener('spacetime-weather-selection',syncZen);document.addEventListener('spacetime-weather-window',()=>{$('#zoom-reset').disabled=!weather.canReset;});
function clearPreset(){navigationBase=null; $$('[data-range]').forEach(b=>b.setAttribute('aria-pressed','false')); }
$$('[data-layer]').forEach(e=>e.addEventListener('change',()=>{S.layers[e.dataset.layer]=e.checked;requestDraw();}));
$$('[data-layout]').forEach(e=>e.addEventListener('click',()=>{S.layout=e.dataset.layout;sync();}));
$('#human-indicator').addEventListener('change',e=>{S.indicator=e.target.value;sync();});
$('#human-range').addEventListener('click',()=>{const h=human();if(!h)return;S.sequence=false;S.from=Date.UTC(h.coverage[0],0,1);S.to=Date.UTC(h.coverage[1]+1,0,1)-1;clearPreset();sync();});
$('#clock').addEventListener('change',e=>{S.clock=e.target.value;sync();});$('#method').addEventListener('change',e=>{S.method=e.target.value;sync();});$('#depth').addEventListener('change',e=>{S.depth=Number(e.target.value);sync();});
$$('[data-range]').forEach(e=>e.addEventListener('click',()=>{clearPreset();e.setAttribute('aria-pressed','true');S.sequence=e.dataset.range==='sequence';S.sequenceWindow=null;if(!S.sequence){S.to=Date.UTC(2026,0,1)-1;S.from=Date.UTC(e.dataset.range==='all'?1700:2026-Number(e.dataset.range),0,1);}sync();}));
$('#timewave-preset').addEventListener('click',()=>{clearPreset();S.sequence=false;S.from=Date.UTC(1945,7,6);S.to=ZERO;S.layers.timewave=true;sync();});
$('#apply-dates').addEventListener('click',()=>{const from=Date.parse($('#from').value+'T00:00:00Z'),to=Date.parse($('#through').value+'T00:00:00Z')+DAY-1,anchor=Date.parse($('#anchor').value+'T00:00:00Z');if(![from,to,anchor].every(Number.isFinite)||from>=to||from<Date.UTC(1700,0,1)||to>=Date.UTC(2026,0,1)||anchor<Date.UTC(1700,0,1)||anchor>=Date.UTC(2026,0,1)){$('#date-error').textContent='Choose valid dates from 1700 through 2025, with the end after the start.';return;}$('#date-error').textContent='';Object.assign(S,{from,to,anchor,sequence:false});clearPreset();sync();});
$('#inspect').addEventListener('input',e=>{S.cursor=Number(e.target.value)/1000;readout();});$('#chart').addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!geometry)return;const r=e.currentTarget.getBoundingClientRect();S.cursor=Math.max(0,Math.min(1,(e.clientX-r.left-geometry.left)/geometry.plotW));$('#inspect').value=Math.round(S.cursor*1000);readout();});$('#chart').addEventListener('click',e=>{if(!geometry||e.target.closest('a'))return;const r=e.currentTarget.getBoundingClientRect();S.cursor=Math.max(0,Math.min(1,(e.clientX-r.left-geometry.left)/geometry.plotW));$('#inspect').value=Math.round(S.cursor*1000);readout();});
$('#reset').addEventListener('click',()=>{Object.assign(S,{from:Date.UTC(2001,0,1),to:Date.UTC(2026,0,1)-1,anchor:ANCHOR,clock:'month',method:'values',indicator:'growth',depth:3,layout:'stacked',sequence:false,cursor:.65,layers:{fibonacci:true,solar:true,king:true,timewave:false,events:true}});clearPreset();$('[data-range="25"]').setAttribute('aria-pressed','true');$('#inspect').value=650;$('#date-error').textContent='';sync();});
$('#export').addEventListener('click',()=>{const[a,b]=domain(),data={schema:'spacetime-view/v5',kernel:{...KERNEL,url:new URL(KERNEL.url,location.href).href},metadata:META,settings:{...S,view:mode,sequence_rendering:mode==='zen'?'native values held per step':'selected research transform',from:iso(S.from),through:iso(S.to),fromUTC:new Date(S.from).toISOString(),throughUTC:new Date(S.to).toISOString(),origin:iso(S.anchor),zero:'2012-12-21T11:00:00Z',timewave_factor:64,timewave_normalization:64**3},sequences:{fibonacci:ALPHA,king_wen:KING_BITS.map((binary,i)=>({position:i+1,bottom_to_top:binary,integer:KING_INTS[i],residue:KING[i],next_line_changes:HAMMING[i]}))},human_indicator:!S.sequence&&human()?{...human(),rows:human().rows.filter(r=>r.t>=a&&r.t<=b)}:null,solar_cadence:solarCadence(),solar:!S.sequence&&S.layers.solar?solarData().filter(r=>r.t>=a&&r.t<=b):[],events:!S.sequence&&S.layers.events?events.filter(e=>e.t>=a&&e.t<=b):[],evaluation_grid:{count:769,rule:'Uniform in the visible time coordinate; evaluation samples, not new observations'},evaluation:Array.from({length:769},(_,i)=>{const t=a+(b-a)*i/768;return{position:S.sequence?t:undefined,utc:S.sequence?undefined:new Date(t).toISOString(),...Object.fromEntries(selected().filter(id=>id!=='solar'&&id!=='human').map(id=>[id,valueFor(id,t)]))};})};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='spacetime-research-view.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
for(const e of events){const d=document.createElement('div');d.className='source-event';const t=document.createElement('time');t.textContent=e.date;const a=document.createElement('a');a.href=e.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=e.label+' — '+e.note;d.append(t,a);$('#event-sources').append(d);}
KING_BITS.forEach((bits,i)=>{const tr=document.createElement('tr');const image=svg('svg',{viewBox:'0 0 28 31',class:'hexagram',role:'img','aria-label':`Hexagram ${i+1}`});[...bits].forEach((bit,j)=>{const y=28-j*5;if(bit==='1')image.append(svg('line',{x1:1,x2:27,y1:y,y2:y}));else image.append(svg('line',{x1:1,x2:11,y1:y,y2:y}),svg('line',{x1:17,x2:27,y1:y,y2:y}));});[i+1,image,bits,KING_INTS[i],KING[i],HAMMING[i]].forEach(v=>{const td=document.createElement('td');if(v instanceof Node)td.append(v);else td.textContent=v;tr.append(td);});$('#sequence-table').append(tr);});
const navigation=installNavigation({element:$('#chart'),getWindow:domain,getLimits:()=>S.sequence?[0,192]:[Date.UTC(1700,0,1),Date.UTC(2026,0,1)-1],minimum:()=>S.sequence?1:DAY,getPlot:()=>({left:geometry?.left||40,width:geometry?.plotW||250}),setWindow:([from,to])=>{if(!navigationBase)navigationBase=domain();if(S.sequence)S.sequenceWindow=[from,to];else{S.from=from;S.to=to;}sync();},reset:()=>{if(!navigationBase)return;const [from,to]=navigationBase;if(S.sequence)S.sequenceWindow=[from,to];else{S.from=from;S.to=to;}navigationBase=null;sync();}});
$('#zoom-in').addEventListener('click',()=>weatherMode&&mode==='zen'?weather.zoom(2):navigation.zoom(2));$('#zoom-out').addEventListener('click',()=>weatherMode&&mode==='zen'?weather.zoom(.5):navigation.zoom(.5));$('#zoom-reset').addEventListener('click',()=>weatherMode&&mode==='zen'?weather.reset():navigation.reset());
new ResizeObserver(requestDraw).observe($('.chart-wrap'));sync();
