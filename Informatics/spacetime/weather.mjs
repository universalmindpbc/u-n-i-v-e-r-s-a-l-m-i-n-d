import {installNavigation} from './navigation.mjs?v=5';
export const KP_SOURCE='https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
const HOUR=3600000,MINUTE=60000,STEP=3*HOUR;
export const WEATHER=[
 {id:'kp',label:'Geomagnetic activity · Kp',measure:'Estimated planetary Kp',units:'Kp · 0–9',cadence:'3 hours',source:KP_SOURCE,source_page:'https://www.spaceweather.gov/products/planetary-k-index',kind:'estimated_observation',note:'Eight complete three-hour UTC intervals. Kp estimates geomagnetic disturbance at Earth.'},
 {id:'wind-speed',label:'Solar-wind speed',measure:'Solar-wind proton speed',units:'km/s',cadence:'1 minute',field:'proton_speed',source:'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json',source_page:'https://www.spaceweather.gov/products/solar-wind',kind:'observation',note:'Active spacecraft at L1. Source timestamps are retained; no travel-time correction to Earth is applied. Provisional values and source quality flags are retained.'},
 {id:'wind-density',label:'Solar-wind density',measure:'Solar-wind proton density',units:'protons/cm³',cadence:'1 minute',field:'proton_density',source:'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json',source_page:'https://www.spaceweather.gov/products/solar-wind',kind:'observation',note:'Active spacecraft at L1. Native one-minute data; no travel-time correction to Earth. Source quality flags are retained.'},
 {id:'bz',label:'Magnetic field · Bz',measure:'Interplanetary magnetic field Bz (GSM)',units:'nT',cadence:'1 minute',field:'bz_gsm',source:'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json',source_page:'https://www.spaceweather.gov/products/solar-wind',kind:'observation',note:'Active L1 spacecraft. Bz uses GSM coordinates; negative values indicate a southward component. Source timestamps and quality flags are retained.'},
 {id:'xray',label:'Solar flares · X-ray flux',measure:'GOES solar X-ray flux · 0.1–0.8 nm',units:'W/m²',cadence:'1 minute',field:'flux',source:'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json',source_page:'https://www.spaceweather.gov/products/goes-x-ray-flux',kind:'observation',logarithmic:true,note:'GOES primary satellite, 0.1–0.8 nm band, one-minute averages on a logarithmic scale. This measures solar X-ray activity; it is not a count of separate flares. Electron-contaminated samples are masked.'}
];
const timestamp=text=>typeof text==='string'?Date.parse(text.replace(' ','T')+(/[zZ]|[+-]\d\d:\d\d$/.test(text)?'':'Z')):NaN;
export function parseKp(raw,now=Date.now()){
 if(!Array.isArray(raw))throw new Error('Unexpected Kp response');
 const input=Array.isArray(raw[0])?raw.slice(1).map(row=>Object.fromEntries(raw[0].map((key,i)=>[key,row[i]]))):raw;
 const map=new Map();
 for(const r of input){
  const text=r.time_tag;if(typeof text!=='string')throw new Error('Missing Kp time');
  const start=Date.parse(text.replace(' ','T')+(/[zZ]|[+-]\d\d:\d\d$/.test(text)?'':'Z'));
  if(!Number.isFinite(start)||start%STEP!==0)throw new Error('Invalid Kp interval');
  const value=r.Kp===null||r.Kp===''?null:Number(r.Kp??r.kp);
  if(value!==null&&(!Number.isFinite(value)||value<0||value>9))throw new Error('Invalid Kp value');
  if(map.has(start))throw new Error('Duplicate Kp interval');
  if(start+STEP<=now)map.set(start,{interval_start:new Date(start).toISOString(),interval_end_exclusive:new Date(start+STEP).toISOString(),value,valid:value!==null,station_count:r.station_count??null,a_running:r.a_running??null});
 }
 if(!map.size)throw new Error('No complete Kp intervals');
 const end=Math.max(...map.keys())+STEP,start=end-24*HOUR;
 return {start,end,rows:Array.from({length:8},(_,i)=>map.get(start+i*STEP)||{interval_start:new Date(start+i*STEP).toISOString(),interval_end_exclusive:new Date(start+(i+1)*STEP).toISOString(),value:null,valid:false,station_count:null,a_running:null}),stale:now-end>6*HOUR};
}
export function parseMinute(raw,id,now=Date.now()){
 const config=WEATHER.find(c=>c.id===id);if(!config?.field||!Array.isArray(raw))throw new Error('Unexpected space-weather response');
 const map=new Map();
 for(const r of raw){
  if(id==='xray'?r.energy!=='0.1-0.8nm':r.active!==true)continue;
  const time=timestamp(r.time_tag);if(!Number.isFinite(time))throw new Error('Invalid source timestamp');if(time>now)continue;
  if(map.has(time))throw new Error('Duplicate active observation');
  const original=r[config.field],number=original===null||original===undefined||original===''?null:Number(original);
  const contaminated=id==='xray'&&(r.electron_contaminaton===true||r.electron_contamination===true);
  const valid=Number.isFinite(number)&&(id==='bz'||number>=0)&&(!config.logarithmic||number>0)&&!contaminated;
  map.set(time,{timestamp:new Date(time).toISOString(),value:valid?number:null,valid,missing_reason:valid?null:contaminated?'Electron-contamination flag':'Missing or invalid source value',source_record:r});
 }
 if(!map.size)throw new Error('No active observations');
 const end=Math.max(...map.keys()),start=end-24*HOUR;
 return {start,end,rows:[...map.entries()].filter(([t])=>t>=start).sort((a,b)=>a[0]-b[0]).map(([,r])=>r),stale:now-end>30*MINUTE};
}
export function initWeather(){
 const $=s=>document.querySelector(s),svg=$('#weather-chart'),status=$('#weather-status'),selector=$('#space-indicator');
 let snapshot=null,request=null,active=false,windowRange=null,zoomed=false,generation=0,aborter=null;
 const cache=new Map(),config=()=>WEATHER.find(c=>c.id===selector.value);
 for(const c of WEATHER){const option=document.createElement('option');option.value=c.id;option.textContent=c.label;selector.append(option);}
 const fmt=t=>new Date(t).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'});
 const number=(v,c)=>v===null?'unavailable':c.logarithmic?v.toExponential(2):v.toLocaleString('en-AU',{maximumFractionDigits:2});
 function add(tag,attrs,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;svg.append(e);return e;}
 const rowTime=r=>Date.parse(r.timestamp||r.interval_start);
 function inspect(time){if(!snapshot)return;const c=config(),rows=snapshot.rows;const row=rows.reduce((best,r)=>Math.abs(rowTime(r)-time)<Math.abs(rowTime(best)-time)?r:best,rows[0]);if(row)$('#weather-readout').textContent=fmt(rowTime(row))+' UTC · '+number(row.value,c)+' '+c.units;}
 function draw(){
  if(!snapshot||!active||snapshot.id!==selector.value)return;
  const c=config(),kp=c.id==='kp',w=Math.max(250,svg.getBoundingClientRect().width),h=270,left=kp?35:55,right=15,top=35,bottom=45,plot=w-left-right,[from,to]=windowRange||[snapshot.start,snapshot.end];
  const rows=snapshot.rows.filter(r=>kp?Date.parse(r.interval_end_exclusive)>from&&rowTime(r)<to:rowTime(r)>=from&&rowTime(r)<=to),values=rows.filter(r=>r.valid).map(r=>r.value);
  let low=0,high=9,ticks=[0,3,6,9];
  if(!kp){if(c.logarithmic){low=-9;high=Math.max(-3,Math.ceil(Math.log10(Math.max(1e-3,...values))));ticks=Array.from({length:high-low+1},(_,i)=>low+i);}else{low=c.id==='bz'?Math.min(-1,...values):0;high=Math.max(c.id==='wind-speed'?500:c.id==='wind-density'?10:1,...values);const pad=(high-low)*.08;high+=pad;if(c.id==='bz')low-=pad;ticks=[low,low+(high-low)/2,high];}}
  const x=t=>left+(t-from)/(to-from)*plot,y=v=>h-bottom-((c.logarithmic?Math.log10(v):v)-low)/(high-low)*(h-top-bottom);
  svg.replaceChildren();svg.dataset.series=c.id;svg.dataset.windowFrom=from;svg.dataset.windowThrough=to;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.height=h+'px';
  add('title',{},c.measure+' · '+c.cadence+' observations');add('text',{x:left,y:16,class:'weather-unit'},c.units+(c.logarithmic?' · logarithmic':''));
  for(const tick of ticks){const yy=c.logarithmic?y(10**tick):y(tick);add('line',{x1:left,x2:w-right,y1:yy,y2:yy,class:'grid'});add('text',{x:left-10,y:yy+4,'text-anchor':'end'},c.logarithmic?'1e'+tick:tick.toLocaleString('en-AU',{maximumFractionDigits:1}));}
  if(c.id==='bz')add('line',{x1:left,x2:w-right,y1:y(0),y2:y(0),class:'zero-line'});
  if(kp){
   rows.forEach(r=>{const start=rowTime(r),end=Date.parse(r.interval_end_exclusive),xx=x(Math.max(from,start)),rightX=x(Math.min(to,end)),v=r.value;
    const bar=add('rect',{x:xx+4,y:v===null?y(0)-3:y(Math.max(v,.05)),width:Math.max(2,rightX-xx-8),height:v===null?3:y(0)-y(Math.max(v,.05)),rx:3,fill:v===null?'#65706f':v>=5?'#eabd72':'#68dfc1',class:'kp-bin',tabindex:0,role:'button','aria-label':fmt(start)+' UTC, Kp '+(v??'unavailable'),'data-value':v??'missing'});
    const show=()=>inspect(start);bar.addEventListener('click',show);bar.addEventListener('focus',show);bar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});
   });
  }else{let path='',pen=false,lastTime=null;for(const r of rows){const time=rowTime(r);if(!r.valid){pen=false;continue;}if(lastTime!==null&&time-lastTime>90*1000)pen=false;path+=(pen?'L':'M')+x(time).toFixed(2)+','+y(r.value).toFixed(2);pen=true;lastTime=time;}add('path',{d:path,class:'weather-trace',stroke:c.id==='xray'?'#eabd72':'#68dfc1',fill:'none','stroke-width':1.5});}
  const hours=(to-from)/HOUR,step=hours>12?6:hours>4?2:hours>1?1:1/6;
  for(let t=Math.ceil(from/(step*HOUR))*step*HOUR;t<=to;t+=step*HOUR)add('text',{x:x(t),y:h-24,'text-anchor':'middle'},new Date(t).toISOString().slice(11,16));
  add('text',{x:w-right,y:h-5,'text-anchor':'end'},'UTC');
  if(!values.length)add('text',{x:left+8,y:h/2},'No valid observations in this window.');
 }
 async function refresh(force=false){
  aborter?.abort();const token=++generation,c=config();aborter=new AbortController();const controller=aborter,timer=setTimeout(()=>controller.abort(),15000);
  $('#weather-source').href=c.source_page;$('#weather-source').textContent='NOAA SWPC · '+c.measure;$('#weather-source-note').textContent=c.note;
  snapshot=null;svg.replaceChildren();$('#weather-readout').textContent='';$('#weather-export').disabled=true;status.textContent='Loading '+c.label.toLowerCase()+' from NOAA…';
  request=(async()=>{try{
   let stored=cache.get(c.source);
   if(force||!stored||Date.now()-stored.fetched>120000){const response=await fetch(c.source,{signal:controller.signal});if(!response.ok)throw new Error('NOAA response '+response.status);stored={raw:await response.json(),fetched:Date.now()};cache.set(c.source,stored);}
   const parsed=c.id==='kp'?parseKp(stored.raw):parseMinute(stored.raw,c.id);
   if(token!==generation)return;
   snapshot={...parsed,id:c.id,retrieved:new Date(stored.fetched).toISOString()};windowRange=[snapshot.start,snapshot.end];zoomed=false;
   status.textContent=(snapshot.stale?'Delayed source data · ':'Latest 24 hours · ')+fmt(snapshot.start)+' – '+fmt(snapshot.end)+' UTC';
   $('#weather-source').href=c.source_page;$('#weather-source').textContent='NOAA SWPC · '+c.measure;$('#weather-source-note').textContent=c.note;
   $('#weather-export').disabled=false;draw();inspect(rowTime(snapshot.rows.at(-1)));document.dispatchEvent(new Event('spacetime-weather-window'));
  }catch{if(token!==generation)return;snapshot=null;svg.replaceChildren();status.textContent=c.label+' is temporarily unavailable. Open Sources & data to retry.';}
  finally{clearTimeout(timer);if(token===generation)request=null;}})();return request;
 }
 selector.addEventListener('change',()=>{refresh();document.dispatchEvent(new Event('spacetime-weather-selection'));});
 $('#weather-refresh').addEventListener('click',()=>refresh(true));
 $('#social-indicator').addEventListener('change',()=>{$('#social-title').textContent=$('#social-indicator').selectedOptions[0].textContent;document.dispatchEvent(new Event('spacetime-social-change'));});
 svg.addEventListener('click',e=>{if(!snapshot||config().id==='kp')return;const rect=svg.getBoundingClientRect(),[from,to]=windowRange;inspect(from+Math.max(0,Math.min(1,(e.clientX-rect.left-55)/(rect.width-70)))*(to-from));});
 $('#weather-export').addEventListener('click',()=>{
  if(!snapshot)return;const c=config(),data={schema:'spacetime-24h/v2',retrieved:snapshot.retrieved,series:c.id,measure:c.measure,source:c.source,source_page:c.source_page,publisher:'NOAA SWPC',kind:c.kind,units:c.units,cadence:c.cadence,timezone:'UTC',time_semantics:c.id==='kp'?'Complete three-hour intervals [start, end)':'Native source time_tag; no propagation shift; no resampling',quality_policy:c.note,window:{from:new Date(snapshot.start).toISOString(),through:new Date(snapshot.end).toISOString(),end_inclusive:c.id!=='kp'},observations:snapshot.rows,stale:snapshot.stale,social:{measure:$('#social-indicator').value,status:'provider_not_connected',observations:null},analysis_results:[],kernel:new URL('kernel.json',location.href).href};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='spacetime-24h-'+c.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 const navigation=installNavigation({element:svg,getWindow:()=>windowRange||[0,24*HOUR],getLimits:()=>snapshot?[snapshot.start,snapshot.end]:[0,24*HOUR],minimum:()=>config().id==='kp'?STEP:10*MINUTE,getPlot:()=>({left:config().id==='kp'?35:55,width:Math.max(180,svg.getBoundingClientRect().width-(config().id==='kp'?50:70))}),setWindow:range=>{if(!snapshot)return;windowRange=range;zoomed=true;draw();document.dispatchEvent(new Event('spacetime-weather-window'));},reset:()=>{if(!snapshot)return;windowRange=[snapshot.start,snapshot.end];zoomed=false;draw();document.dispatchEvent(new Event('spacetime-weather-window'));}});
 new ResizeObserver(draw).observe(svg);$('#weather-export').disabled=true;
 return {zoom:navigation.zoom,reset:navigation.reset,get canReset(){return zoomed;},show:()=>{active=true;if(snapshot&&snapshot.id===selector.value){draw();if(Date.now()-Date.parse(snapshot.retrieved)>300000)refresh();}else if(!request)refresh();},hide:()=>{active=false;},refresh};
}
