const ns='http://www.w3.org/2000/svg',choices=new Map();
const labels={ordinary:'Ordinary input',fibonacci:'Native Fibonacci',phi:'Phi Ratio',alpha:'Alpha · M9 P24',beta:'Beta · M9 P24',gamma:'Gamma · M9 P24',epsilon:'Epsilon · M9 P24',shuffled:'Shuffled control'};
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const svgNode=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
export async function renderResponse(slot,report){
 if(report.response_data!=='oxtr-qrc-qualification.json')return;
 const box=el('div');box.className='response-view';box.append(el('p','Loading recorded responses…'));slot.append(box);
 try{
  const response=await fetch('data/oxtr-qrc-qualification.json',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();
  if(data.input_sha256!==report.receipt.input_sha256||!Array.isArray(data.records)||data.records.length!==16)throw Error();
  if(!box.isConnected)return;
  const quantum=report.kind==='quantum',field=quantum?'hardware_observables':'gpu_observables';
  const records=data.records.filter(r=>Array.isArray(r[field])&&r[field].length===21&&r[field].every(p=>Number.isFinite(p)&&p>=0&&p<=1));
  if(!records.length)throw Error();
  box.replaceChildren();const controls=el('div');controls.className='response-controls';
  const windowLabel=el('label','DNA window '),windowSelect=el('select'),variantLabel=el('label','Representation '),variantSelect=el('select');
  for(const [i,w]of [...new Set(records.map(r=>r.window))].entries()){const o=el('option','Window '+(i+1)+' · '+w.replace('chr3-','chr3:'));o.value=w;windowSelect.append(o);}
  for(const [id,name]of Object.entries(labels)){const o=el('option',name);o.value=id;variantSelect.append(o);}
  const saved=choices.get(slot.id);if(saved){windowSelect.value=saved.window;variantSelect.value=saved.variant;}
  windowLabel.append(windowSelect);variantLabel.append(variantSelect);controls.append(windowLabel);
  const comparison=el('div');comparison.className='representation-comparison';
  const technical=el('details'),summary=el('summary','Inspect individual atom measurements');technical.className='atom-detail';technical.append(summary,variantLabel);
  const visual=el('div');visual.className='response-visual';const svg=svgNode('svg',{viewBox:'0 0 380 310',role:'img'}),table=el('table');
  visual.append(svg,table);technical.append(visual,el('p','Circles show excitation frequency. The 95% intervals describe sampling uncertainty, not all hardware errors. These are not protein-binding probabilities.'));
  box.append(el('h4','How each representation changes the response'),el('p','Compared with ordinary input for the same DNA window. Positive and negative values describe changes in average atom excitation; neither direction means better prediction.'),controls,comparison,technical);
  const average=r=>r.reduce((a,b)=>a+b,0)/r.length,pp=v=>(v>=0?'+':'')+v.toFixed(1)+' pp';
  function draw(){
   const r=records.find(x=>x.window===windowSelect.value&&x.variant===variantSelect.value);if(!r)return;
   choices.set(slot.id,{window:r.window,variant:r.variant});svg.replaceChildren();table.replaceChildren();
   comparison.replaceChildren();const rows=records.filter(x=>x.window===r.window),base=rows.find(x=>x.variant==='ordinary');
   const legend=el('p',`Mint: ${quantum?'Aquila measurements':'GPU samples'} · Blue: ideal reference · pp = percentage points`);legend.className='comparison-legend';comparison.append(legend);
   for(const item of rows){
    const measured=100*(average(item[field].slice(0,6))-average(base[field].slice(0,6))),reference=100*(average(item.ideal_observables.slice(0,6))-average(base.ideal_observables.slice(0,6)));
    const row=el('div');row.className='representation-row';row.dataset.variant=item.variant;const label=el('div');label.append(el('strong',labels[item.variant]),el('small',`${quantum?'Aquila':'GPU'} ${pp(measured)} · Reference ${pp(reference)}`));
    const bar=svgNode('svg',{viewBox:'0 0 500 38',role:'img','aria-label':`${labels[item.variant]}: ${quantum?'Aquila':'GPU'} change ${pp(measured)}; ideal reference ${pp(reference)}.`});
    const x=v=>250+v*15;
    bar.append(svgNode('line',{x1:25,x2:475,y1:19,y2:19,stroke:'#334c56'}),svgNode('line',{x1:250,x2:250,y1:0,y2:38,stroke:'#7a919a'}),svgNode('line',{x1:250,x2:x(reference),y1:11,y2:11,stroke:'#a7c8e9','stroke-width':4}),svgNode('line',{x1:250,x2:x(measured),y1:27,y2:27,stroke:'#a3ead1','stroke-width':6}),svgNode('circle',{cx:x(reference),cy:11,r:3,fill:'#a7c8e9'}),svgNode('circle',{cx:x(measured),cy:27,r:4,fill:'#a3ead1'}));
    row.append(label,bar);comparison.append(row);
   }
   comparison.append(el('p','Descriptive comparisons from two DNA windows. Small differences may reflect sampling noise; the hardware tasks were run once in a fixed order.'));
   const n=quantum?r.hardware_valid_shots:r.shots;svg.setAttribute('aria-label',`${labels[r.variant]}: six ${quantum?'Aquila measured':'GPU simulated'} excitation probabilities; values in the adjacent table.`);
   svg.append(svgNode('polygon',{points:Array.from({length:6},(_,i)=>{const t=i*Math.PI/3;return`${190+96*Math.sin(t)},${155-96*Math.cos(t)}`;}).join(' '),fill:'none',stroke:'#415b65','stroke-width':1}));
   const caption=el('caption',`${quantum?'Aquila measurements':'GPU samples'} · ${n} valid shots`),head=el('tr');for(const text of ['Atom','Reference',quantum?'Aquila':'GPU','95% interval'])head.append(el('th',text));const thead=el('thead');thead.append(head);const tbody=el('tbody');table.append(caption,thead,tbody);
   for(let i=0;i<6;i++){
    const p=r[field][i],t=i*Math.PI/3,x=190+96*Math.sin(t),y=155-96*Math.cos(t),z=1.96,d=1+z*z/n,c=(p+z*z/(2*n))/d,e=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
    const group=svgNode('g',{});group.append(svgNode('circle',{cx:x,cy:y,r:22,fill:'#a4e4d0','fill-opacity':.15+.85*p,stroke:'#a4e4d0','stroke-width':1.5}),svgNode('text',{x,y:y+4,fill:p>.5?'#07191d':'#eef6f7','text-anchor':'middle','font-size':12},String(i+1)),svgNode('text',{x:190+139*Math.sin(t),y:159-139*Math.cos(t),fill:'#e9d86b','text-anchor':'middle','font-size':12},(p*100).toFixed(0)+'%'));svg.append(group);
    const tr=el('tr');for(const v of [String(i+1),(r.ideal_observables[i]*100).toFixed(1)+'%',(p*100).toFixed(0)+'%',`${(Math.max(0,c-e)*100).toFixed(0)}–${(Math.min(1,c+e)*100).toFixed(0)}%`])tr.append(el('td',v));tbody.append(tr);
   }
  }
  windowSelect.onchange=variantSelect.onchange=draw;draw();
 }catch{box.replaceChildren(el('p','The recorded response data did not load. Refresh to retry.'));}
}
