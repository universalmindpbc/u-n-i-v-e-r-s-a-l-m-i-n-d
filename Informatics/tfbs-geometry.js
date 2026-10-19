// A browser view of versioned Python/Biopython results, with independent Wolfram checks.
// Coordinate choices are fixed in experiment-v1/manifest.json and included in every export.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = n => n.toLocaleString('en-AU');
const colors = {alpha:'#76baff', beta:'#e9d86b', gamma:'#e99ac6', epsilon:'#e3e9f0'};
const names = {studies:'Published studies',encode:'ENCODE',jaspar:'JASPAR'};
const views = {line:'Original DNA line',circle:'Full-position circle',m9:'Modulus 9 circle'};
const point = (turn,r=125,cx=210,cy=190) => [cx+r*Math.sin(turn*2*Math.PI),cy-r*Math.cos(turn*2*Math.PI)];
const xy = a => a.map(x=>x.toFixed(3)).join(',');
const text = (x,y,s,attrs='') => `<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
const circle = (x,y,r,attrs='') => `<circle cx="${x}" cy="${y}" r="${r}" ${attrs}/>`;
const arc = (a,b,r,cx=210,cy=190) => {
  const p=point(a,r,cx,cy),q=point(b,r,cx,cy);
  if(b-a>=.999999)return `M${xy(p)} A${r},${r} 0 1 1 ${xy(point(a+.5,r,cx,cy))} A${r},${r} 0 1 1 ${xy(p)}`;
  return `M${xy(p)} A${r},${r} 0 ${b-a>.5?1:0} 1 ${xy(q)}`;
};
const svg = (body,label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 380" role="img" aria-label="${esc(label)}" class="geometry-svg"><style>text{font-family:Arial,sans-serif;font-size:11px;fill:#a8bfcd;stroke:none;text-anchor:middle} .axis{stroke:#3c515f;fill:none} .observation{fill:#78cabb;stroke:#78cabb;cursor:pointer} .observation:hover{stroke:#fff;fill:#fff} .selected{stroke:#fff;fill:#fff} .ref{fill:none;stroke-width:1.7} .grid-label{fill:#e5edf3;font-size:15px} .small{font-size:9px} .large{font-size:23px;fill:#e5edf3} .faint{opacity:.3}</style>${body}</svg>`;

// Exported for the independent Node/Python parity test; display uses precomputed mappings.
export function projectInterval(start,end,lo=8740380,hi=8779628) {
  const a=Math.max(start,lo),b=Math.min(end,hi);
  if(!Number.isInteger(start)||!Number.isInteger(end)||start>=end||a>=b)throw Error('Invalid interval');
  const d0=hi-b,d1=hi-a,d=Math.floor((d0+d1-1)/2),r=d%9;
  return {offset_start:d0,offset_end_exclusive:d1,anchor_offset_bp:d,anchor_genomic_0based:hi-1-d,m9_residue:r,m9_display:r||9,full_circle_turns:d/(hi-lo)};
}

export async function mountTfbsGeometry(host, catalogue, dataRoot) {
  const root=new URL('experiment-v1/',dataRoot),cache=new Map();
  let manifest,checks,rows=[],filtered=[],inspected=[],active=null,source='studies',view='line',pattern='beta',group=null,page=0,request=0,ready=false;
  const pageSize=12;
  const get=s=>host.querySelector(s);
  host.innerHTML=`<p class="science-label">OXTR · INTERACTIVE EXPERIMENT 01</p><h3>Binding-site geometry</h3><p class="geometry-intro">Follow the same DNA observations from a line to a circle, then into modulus nine. Compare their positions with the four M9 P24 sequences.</p><div class="geometry-controls"><label>Data source<select id="geometry-source"><option value="studies">Published studies · 2 mapped elements</option><option value="encode">ENCODE · 255 experimental regions</option><option value="jaspar">JASPAR · 9,164 predicted matches</option></select></label><label>Find a factor, cell type or observation<input id="geometry-search" type="search" placeholder="e.g. US-1, CTCF or an ID" autocomplete="off"></label><label class="geometry-score" hidden>JASPAR score<select id="geometry-score"><option value="400">400 and above</option><option value="500">500 and above</option><option value="600">600 and above</option><option value="800">800 and above</option></select></label></div><p class="geometry-source-note"></p><div class="geometry-switches"><div><span class="geometry-control-label">View the DNA</span><div class="geometry-buttons" role="group" aria-label="DNA coordinate view">${Object.entries(views).map(([id,name],i)=>`<button type="button" data-geometry-view="${id}" aria-pressed="${id===view}"><span>${i+1}</span> ${name}</button>`).join('')}</div></div><div><span class="geometry-control-label">Compare with M9 P24</span><div class="geometry-buttons" role="group" aria-label="Atlas reference sequence">${Object.keys(colors).map(id=>`<button type="button" data-geometry-pattern="${id}" style="--pattern:${colors[id]}" aria-pressed="${id===pattern}">${id[0].toUpperCase()+id.slice(1)}</button>`).join('')}</div></div></div><p class="geometry-status" role="status" aria-live="polite">Loading the verified coordinate data…</p><div class="geometry-panels"><figure><figcaption class="geometry-data-title"></figcaption><div class="geometry-data-plot"></div><div class="geometry-zoom"><label><input id="geometry-zoom" type="checkbox"> Zoom the line to the selected observation</label></div><p class="geometry-data-caption"></p></figure><figure><figcaption class="geometry-reference-title"></figcaption><div class="geometry-reference-plot"></div><p class="geometry-reference-caption"></p></figure></div><div class="geometry-node-counts" role="group" aria-label="Observations at each M9 node" hidden></div><p class="geometry-group"></p><section class="geometry-inspector" aria-label="Selected DNA observation"><div class="geometry-inspector-body"></div><div class="geometry-buttons"><button type="button" data-geometry-step="-1">← Previous observation</button><button type="button" data-geometry-step="1">Next observation →</button></div></section><details class="geometry-records"><summary>Inspect the observations</summary><div class="geometry-table-wrap" tabindex="0" role="region" aria-label="Mapped observation selection"><table><thead><tr><th>Observation</th><th>Original interval · GRCh38</th><th>Offset / M9</th></tr></thead><tbody></tbody></table></div><div class="geometry-pagination"><button type="button" data-geometry-page="-1">← Previous page</button><span></span><button type="button" data-geometry-page="1">Next page →</button></div></details><nav class="geometry-downloads" aria-label="Experiment downloads"><button type="button" data-geometry-export="json">Selection · JSON ↓</button><button type="button" data-geometry-export="csv">Selection · CSV ↓</button><button type="button" data-geometry-export="svg">Figure · SVG ↓</button><button type="button" data-geometry-export="png">Figure · PNG ↓</button><a href="${new URL('methods.md',root)}" download>Methods ↓</a></nav><details class="geometry-methods"><summary>Mapping &amp; verification</summary><p>Fixed human OXTR window: GRCh38 chr3:8,740,380–8,779,628 (0-based, end-exclusive). The direction follows OXTR’s minus strand, from high to low genomic coordinates. The origin is the window edge, not the transcription start site.</p><p>The line and full circle retain interval widths. For M9, one central base represents each interval within this window. An even-width interval uses the first central base in the OXTR direction. Regions extending beyond the window are clipped for display; their original coordinates remain in every export.</p><p><code>d = floor((offset_start + offset_end − 1) / 2)</code><br><code>Full circle = d / 39,248 turns · M9 = d mod 9</code><br>Zero is displayed as 9. All circles start at north and run clockwise. Compression merges positions; node counts expose those overlaps.</p><p>The Atlas reference keeps its original grid and phase: Alpha, Gamma and Epsilon use 24 period positions; Beta uses nine residue positions. The circles represent coordinates. No biological shape or association is inferred from their appearance.</p><div class="geometry-checks"></div><p>The browser filters and draws precomputed results. Python/Biopython and Wolfram are used in the reproducible preparation and verification, rather than called as live services for each selection.</p><nav class="geometry-downloads">${[['manifest.json','Experiment manifest'],['python-validation.json','Python / Biopython checks'],['wolfram-validation.json','Wolfram checks'],['build_experiment.py','Python script'],['verify.wl','Wolfram code'],['requirements.txt','Python environment']].map(([f,l])=>`<a href="${new URL(f,root)}" download>${l} ↓</a>`).join('')}</nav></details><p class="geometry-boundary">Initial visual experiment · statistical association has not yet been tested.</p>`;

  async function read(file) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
    try {
      const response=await fetch(new URL(file,root),{signal:controller.signal});
      if(!response.ok)throw Error('Experiment data unavailable');
      let bytes=new Uint8Array(await response.arrayBuffer());
      if(bytes[0]===31&&bytes[1]===139)bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
      return JSON.parse(new TextDecoder().decode(bytes));
    } finally {clearTimeout(timer);}
  }
  function controls() {
    get('.geometry-score').hidden=source!=='jaspar';
    host.querySelectorAll('[data-geometry-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.geometryView===view)));
    host.querySelectorAll('[data-geometry-pattern]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.geometryPattern===pattern)));
    get('.geometry-zoom').hidden=view!=='line';
  }
  async function load(id) {
    const token=++request;source=id;ready=false;rows=[];filtered=[];inspected=[];active=null;group=null;page=0;
    controls();get('.geometry-status').textContent=`Loading ${names[id]}…`;
    for(const cls of ['geometry-data-plot','geometry-reference-plot','geometry-inspector-body','geometry-group'])get('.'+cls).innerHTML='';
    get('tbody').innerHTML='';get('.geometry-node-counts').hidden=true;
    host.querySelectorAll('[data-geometry-export],[data-geometry-step],[data-geometry-page]').forEach(b=>b.disabled=true);
    get('.geometry-source-note').textContent={studies:'Two published human elements with recovered positions: US-1 and US-2. The 2006 study’s 15 sites remain in the literature collection while their individual positions await recovery.',encode:'Experimental regions of protein occupancy, with source experiments and cell types retained. A region’s central base is a plotting representative.',jaspar:'Predicted motif matches at UCSC score 400 and above. The full archive, including lower scores, remains in the source-data browser below.'}[id];
    try {
      if(!manifest){
        const [m,p,w]=await Promise.all([read('manifest.json'),read('python-validation.json'),read('wolfram-validation.json')]);
        if(m.version!==p.version||p.status!=='passed'||w.status!=='passed'||p.wolfram_coordinate_table_sha256!==w.coordinate_table_sha256)throw Error('Verification mismatch');
        manifest=m;checks={python:p,wolfram:w};
        get('.geometry-checks').innerHTML=`<p><strong>Calculations checked</strong> · Python ${esc(p.python)} · Biopython ${esc(p.biopython)} · Wolfram Language</p><p>${num(p.records_projected)} observations mapped. Python and Wolfram agree across all ${num(w.offsets_checked)} possible base offsets, including circle coordinates to nine decimal places. Biopython rechecked the two published sequence placements and ${num(p.sequence_checks.jaspar)} JASPAR sequences; one match extends beyond the reference window.</p>`;
      }
      if(!cache.has(id)){
        const data=await read(manifest.files[id].file);
        if(!Array.isArray(data)||data.length!==manifest.summaries[id].count||data.some(r=>!r.id||!Number.isFinite(r.mapping?.anchor_offset_bp)))throw Error('Coordinate format unavailable');
        cache.set(id,data);
      }
      if(token!==request)return;
      rows=cache.get(id);ready=true;draw();
    }catch{
      if(token!==request)return;
      get('.geometry-status').innerHTML='The experiment data have not loaded. <button type="button" data-geometry-retry>Retry experiment</button>';
    }
  }

  function referenceSVG() {
    const a=manifest.atlas,n=pattern==='beta'?9:24,color=colors[pattern];
    const nodes=pattern==='alpha'?Array.from({length:24},(_,i)=>i):pattern==='beta'?a.beta.interval_residues:a.gamma.alpha_indices;
    const paths=pattern==='gamma'?a.gamma.triangle_paths:pattern==='epsilon'?[a.epsilon.alpha_indices]:pattern==='beta'?[[...a.beta.interval_residues,a.beta.interval_residues[0]]]:[];
    let s=circle(210,190,125,'class="axis"');
    for(let i=0;i<n;i++){const p=point(i/n);s+=circle(...p,2.5,'fill="#344b5a"');}
    s+=paths.map(p=>`<polyline points="${p.map(i=>xy(point(i/n))).join(' ')}" class="ref" stroke="${color}"/>`).join('');
    for(const i of nodes){
      const p=point(i/n),label=pattern==='beta'?(i||9):a.alpha.display_values[i],q=point(i/n,149);
      s+=circle(...p,4,`fill="${color}"`)+text(q[0],q[1]+5,label,'class="grid-label"');
      if(pattern!=='beta'){const t=point(i/n,170);s+=text(t[0],t[1]+3,i||24,'class="small"');}
    }
    if(pattern==='beta'||pattern==='epsilon'){
      const path=paths[0];
      for(let i=0;i<path.length-1;i++){const p=point(path[i]/n),q=point(path[i+1]/n),x=p[0]+.64*(q[0]-p[0]),y=p[1]+.64*(q[1]-p[1]),angle=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI;s+=`<path d="M-5,-3 L0,0 L-5,3" fill="none" stroke="${color}" transform="translate(${x},${y}) rotate(${angle})"/>`;}
    }
    s+=text(210,18,pattern==='beta'?'9 / 0 at north':'Period position 24 / 0 at north','class="small"');
    s+=text(210,366,pattern==='beta'?'Start 4 · 4 → 8 → 7 → 5 → 1 → 2':pattern==='epsilon'?'9 → 3 → 6 → 9 → 3 → 6 → 9':pattern==='gamma'?'Six primary nodes · two triangle paths':'24 Fibonacci residues · original phase');
    return svg(s,`${pattern} reference, Fibonacci M9 P24, ${n} positions`);
  }

  function dataSVG() {
    const n=manifest.reference.length_bp,sel=active?.mapping;
    let s='';
    if(view==='m9'){
      const counts=Array.from({length:9},(_,i)=>filtered.filter(r=>r.mapping.m9_residue===i).length),max=Math.max(1,...counts);
      s=circle(210,190,125,'class="axis"');
      for(let i=0;i<9;i++){
        const p=point(i/9),q=point(i/9,164),c=point(i/9,91),radius=counts[i]?5+14*Math.sqrt(counts[i]/max):3;
        s+=`<g data-geometry-residue="${i}" class="observation"><title>Node ${i||9}: ${counts[i]} ${manifest.summaries[source].unit}. Select to inspect.</title>${circle(...p,radius,`fill="${counts[i]?'#78cabb':'#344b5a'}" stroke="${sel?.m9_residue===i?'#fff':'#78cabb'}" stroke-width="${sel?.m9_residue===i?3:1}"`)}${text(q[0],q[1]+4,i||9,'class="grid-label"')}${text(c[0],c[1]+4,num(counts[i]),'class="small"')}</g>`;
      }
      s+=text(210,182,num(filtered.length),'class="large"')+text(210,206,manifest.summaries[source].unit)+text(210,362,'Node size shows count · select a node to inspect');
    }else if(view==='circle'){
      s=circle(210,190,125,'class="axis"');
      for(let i=0;i<4;i++){const p=point(i/4,161);s+=text(p[0],p[1]+4,num(i*n/4)+' bp');}
      if(filtered.length>500){
        const bins=Array.from({length:72},()=>0);filtered.forEach(r=>bins[Math.min(71,Math.floor(r.mapping.full_circle_turns*72))]++);const max=Math.max(1,...bins);
        bins.forEach((count,i)=>{if(count){s+=`<path class="observation" data-geometry-bin="${i}" data-bin-count="72" d="${arc(i/72,(i+.88)/72,125+25*count/max)}" fill="none" stroke-width="7"><title>${count} interval centres · select to inspect</title></path>`;}});
        s+=text(210,181,num(filtered.length),'class="large"')+text(210,205,'72 bins · interval-centre counts');
      }else{
        filtered.forEach((r,i)=>{const m=r.mapping,p=point(m.full_circle_turns,125-(i%5)*5);s+=`<g class="observation" data-geometry-record="${esc(r.id)}"><title>${esc(r.id+' · '+r.factor+' · '+num(m.anchor_offset_bp)+' bp from origin')}</title><path d="${arc(m.offset_start/n,m.offset_end_exclusive/n,125-(i%5)*5)}" fill="none" stroke-width="3"/>${circle(...p,3)}</g>`;});
        s+=text(210,182,num(filtered.length),'class="large"')+text(210,206,'intervals · proportional spacing');
      }
      if(sel){const p=point(sel.full_circle_turns);s+=`<path d="${arc(sel.offset_start/n,sel.offset_end_exclusive/n,125)}" stroke="#fff" stroke-width="5" fill="none"/>`+circle(...p,6,'fill="none" stroke="#fff" stroke-width="2"');}
      s+=text(210,362,'0 bp at north · clockwise in OXTR direction');
    }else{
      const zoom=get('#geometry-zoom').checked&&sel;
      const lo=zoom?Math.max(0,sel.offset_start-500):0,hi=zoom?Math.min(n,sel.offset_end_exclusive+500):n,span=hi-lo;
      const x=d=>32+356*(d-lo)/span;
      s+=`<line x1="32" y1="190" x2="388" y2="190" class="axis" stroke-width="2"/>`;
      for(let i=0;i<=4;i++){const d=lo+span*i/4;s+=`<line x1="${x(d)}" y1="190" x2="${x(d)}" y2="200" class="axis"/>`+text(x(d),220,num(Math.round(d)),`class="small" text-anchor="${i===0?'start':i===4?'end':'middle'}"`);}
      const visible=filtered.filter(r=>r.mapping.offset_start<hi&&r.mapping.offset_end_exclusive>lo);
      if(visible.length>500){
        const bins=Array.from({length:72},()=>0);visible.forEach(r=>{const d=r.mapping.anchor_offset_bp;if(d>=lo&&d<hi)bins[Math.min(71,Math.floor((d-lo)/span*72))]++;});const max=Math.max(1,...bins);
        bins.forEach((count,i)=>{if(count)s+=`<rect class="observation" data-geometry-line-bin="${i}" data-bin-lo="${lo}" data-bin-hi="${hi}" x="${32+356*i/72}" y="${185-85*count/max}" width="${356/72*.85}" height="${85*count/max}"><title>${count} interval centres · select to inspect</title></rect>`;});
        s+=text(210,85,'72 bins · interval-centre counts');
      }else{
        visible.forEach((r,i)=>{const m=r.mapping,y=170-(i%5)*15;const a=x(Math.max(lo,m.offset_start)),b=x(Math.min(hi,m.offset_end_exclusive));const p=x(m.anchor_offset_bp);s+=`<g class="observation" data-geometry-record="${esc(r.id)}"><title>${esc(r.id+' · '+r.factor+' · strand '+(r.strand||'unassigned'))}</title><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke-width="4"/>${p>=32&&p<=388?circle(p,y,3):''}</g>`;});
        s+=text(210,85,'Interval widths and spacing retained');
      }
      if(sel){const p=x(sel.anchor_offset_bp);s+=`<line x1="${p}" y1="95" x2="${p}" y2="198" stroke="#fff" stroke-dasharray="3 4"/>`+circle(p,190,5,'fill="#fff"')+text(210,252,`${active.id} · ${num(sel.anchor_offset_bp)} bp from origin`);}
      s+=text(210,292,'OXTR direction →')+text(210,315,'High → low genomic coordinates · minus strand')+text(210,362,zoom?'Zoomed line · circle origin stays fixed':'39,248 bp · origin at the high-coordinate window edge');
    }
    return svg(s,`${views[view]}: ${filtered.length} ${manifest.summaries[source].unit} from ${names[source]}`);
  }

  function draw() {
    if(!ready)return;
    controls();
    const terms=get('#geometry-search').value.toLowerCase().trim().split(/\s+/).filter(Boolean),score=Number(get('#geometry-score').value);
    filtered=rows.filter(r=>(source!=='jaspar'||r.score>=score)&&terms.every(t=>[r.id,r.factor,r.label,r.matrix_id,r.sequence_oriented,...(r.cell_types||[])].join(' ').toLowerCase().includes(t)));
    inspected=group?filtered.filter(r=>group.kind==='residue'?r.mapping.m9_residue===group.value:r.mapping.anchor_offset_bp>=group.lo&&r.mapping.anchor_offset_bp<group.hi):filtered;
    if(!inspected.some(r=>r.id===active?.id))active=inspected[0]||null;
    const unit=manifest.summaries[source].unit;
    get('.geometry-status').textContent=`${num(filtered.length)} ${unit} · ${names[source]} · fixed origin and original Atlas alignment`;
    get('.geometry-data-title').textContent=views[view];
    get('.geometry-reference-title').textContent=`${pattern[0].toUpperCase()+pattern.slice(1)} · Fibonacci M9 P24`;
    get('.geometry-data-plot').innerHTML=dataSVG();get('.geometry-reference-plot').innerHTML=referenceSVG();
    get('.geometry-data-plot svg').setAttribute('role','group');
    get('.geometry-data-plot').querySelectorAll('.observation').forEach(mark=>{
      mark.setAttribute('tabindex','0');mark.setAttribute('role','button');
      mark.setAttribute('aria-label',mark.querySelector('title')?.textContent||'Inspect observation');
    });
    get('.geometry-data-caption').textContent=view==='m9'?'DNA offsets reduced to nine residues. Several observations can share one node.':view==='circle'?'One turn represents the complete DNA window. Select a mark or count bin to inspect its observations.':'Position is measured from the fixed window edge. Select a mark to follow it across all three views.';
    get('.geometry-reference-caption').textContent=(pattern==='beta'?'Nine residue positions · sequence starts at 4.':'24 period positions · large labels show residues; small labels show period positions.')+' Atlas reference; DNA observations remain in the left panel.';
    const nodeBox=get('.geometry-node-counts');nodeBox.hidden=view!=='m9';
    if(view==='m9')nodeBox.innerHTML=Array.from({length:9},(_,i)=>`<button type="button" data-geometry-residue="${i}" aria-pressed="${group?.kind==='residue'&&group.value===i}"><span>Node ${i||9}</span><strong>${num(filtered.filter(r=>r.mapping.m9_residue===i).length)}</strong></button>`).join('');
    get('.geometry-group').innerHTML=group?`${num(inspected.length)} ${unit} in ${group.kind==='residue'?'node '+(group.value||9):'the selected position bin'} · <button type="button" data-geometry-clear-group>Show all observations</button>`:'';
    const body=get('.geometry-inspector-body');
    if(active){
      const r=active,m=r.mapping,index=inspected.indexOf(r),sourceLink=`<a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">Original source ↗</a>`;
      body.innerHTML=`<p class="science-label">SELECTED OBSERVATION · ${num(index+1)} OF ${num(inspected.length)}</p><h4>${esc(r.label||r.factor)} <span>${esc(r.id)}</span></h4><p>chr3:${num(r.start_0based)}–${num(r.end_exclusive)} · ${num(r.end_exclusive-r.start_0based)} bp · strand ${esc(r.strand||'not assigned')}</p><p><strong>${num(m.anchor_offset_bp)} bp</strong> from origin → <strong>${m.full_circle_degrees.toFixed(3)}°</strong> on the full circle → <strong>M9 node ${m.m9_display}</strong></p>${m.clipped_to_window?'<p class="geometry-note">This region extends beyond the saved window. The plotted centre uses its visible intersection.</p>':''}${r.sequence_oriented?`<p class="geometry-sequence"><code>${esc(r.sequence_oriented)}</code></p><p class="geometry-note">${esc(r.sequence_validation)}</p>`:''}${r.cell_types?.length?`<p class="geometry-note">${esc(r.cell_types.join(' · '))}</p>`:''}<p>${sourceLink}${r.experiments?.length?` · ${num(r.experiments.length)} source experiments in the download`:''}</p>`;
    }else body.innerHTML='<p>No observations match this selection. Clear the search or choose another node or data source.</p>';
    host.querySelectorAll('[data-geometry-step]').forEach(b=>b.disabled=!active||inspected.length<2);
    page=Math.min(page,Math.max(0,Math.ceil(inspected.length/pageSize)-1));
    get('tbody').innerHTML=inspected.slice(page*pageSize,(page+1)*pageSize).map(r=>`<tr><td><button type="button" data-geometry-record="${esc(r.id)}" aria-pressed="${r.id===active?.id}">${esc(r.label||r.factor)} · ${esc(r.id)}</button></td><td>${num(r.start_0based)}–${num(r.end_exclusive)}<br>strand ${esc(r.strand||'unassigned')}</td><td>${num(r.mapping.anchor_offset_bp)} bp / ${r.mapping.m9_display}</td></tr>`).join('')||'<tr><td colspan="3">No matching observations.</td></tr>';
    get('.geometry-pagination span').textContent=inspected.length?`Page ${page+1} of ${Math.ceil(inspected.length/pageSize)}`:'No results';
    get('[data-geometry-page="-1"]').disabled=page===0;
    get('[data-geometry-page="1"]').disabled=(page+1)*pageSize>=inspected.length;
    host.querySelectorAll('[data-geometry-export]').forEach(b=>b.disabled=!inspected.length);
  }

  function saveBlob(body,type,name) {
    const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function combinedFigure() {
    const plots=[get('.geometry-data-plot svg'),get('.geometry-reference-plot svg')];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="590" viewBox="0 0 1000 590"><rect width="1000" height="590" fill="#0b141b"/><style>text{font-family:Arial,sans-serif;fill:#d9e7ef}</style>${text(500,32,'OXTR binding-site geometry · '+names[source],'font-size="20"')}${text(500,58,`${num(filtered.length)} observations · ${views[view]} · ${pattern} reference`,'font-size="13"')}${plots.map((p,i)=>`<svg x="${30+i*490}" y="80" width="450" height="407" viewBox="0 0 420 380">${p.innerHTML}</svg>`).join('')}${text(500,512,'GRCh38 chr3:8740380–8779628 · 0-based / end-exclusive · OXTR minus strand','font-size="12"')}${text(500,534,'Fixed window-edge origin · interval centres · computational checks: Python, Biopython, Wolfram','font-size="12"')}${text(500,556,'Exploratory coordinate comparison · biological association untested','font-size="12"')}<metadata>${esc(JSON.stringify({version:manifest.version,source,view,pattern,search:get('#geometry-search').value,minimum_score:source==='jaspar'?Number(get('#geometry-score').value):null,group,selected_observation:active?.id,mapping:manifest.mapping,reference:manifest.reference}))}</metadata></svg>`;
  }
  async function save(format) {
    if(!ready)return;draw();if(!inspected.length)return;
    const parameters={source,view,atlas_sequence:pattern,search:get('#geometry-search').value,minimum_score:source==='jaspar'?Number(get('#geometry-score').value):null,inspection_group:group,selected_observation:active?.id,line_zoom:get('#geometry-zoom').checked};
    const name=`oxtr-${source}-${view}-${pattern}`;
    if(format==='json')saveBlob(JSON.stringify({version:manifest.version,count:inspected.length,parameters,reference:manifest.reference,mapping:manifest.mapping,atlas:manifest.atlas,verification:checks,sources:manifest.source_sha256,records:inspected},null,2),'application/json',name+'.json');
    if(format==='csv'){
      const flat=inspected.map(r=>({...r,...r.mapping,experiment_version:manifest.version,view,atlas_sequence:pattern,window_start_0based:manifest.reference.start_0based,window_end_exclusive:manifest.reference.end_exclusive,origin_genomic_base_0based:manifest.reference.origin_genomic_base_0based,coordinate_convention:manifest.reference.coordinate_convention,mapping_rules:manifest.mapping,selection_parameters:parameters,atlas_reference:manifest.atlas,source_sha256:manifest.source_sha256}));
      const fields=[...new Set(flat.flatMap(Object.keys))],cell=v=>{const s=v==null?'':typeof v==='object'?JSON.stringify(v):String(v);return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
      saveBlob('\uFEFF'+[fields,...flat.map(r=>fields.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n','text/csv;charset=utf-8',name+'.csv');
    }
    if(format==='svg')saveBlob(combinedFigure(),'image/svg+xml',name+'.svg');
    if(format==='png'){
      const image=new Image(),url=URL.createObjectURL(new Blob([combinedFigure()],{type:'image/svg+xml'}));
      try{image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1180;canvas.getContext('2d').drawImage(image,0,0,2000,1180);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG unavailable');saveBlob(blob,'image/png',name+'.png');}
      catch{get('.geometry-status').textContent='The PNG export did not complete. The SVG export retains the full vector figure.';}
      finally{URL.revokeObjectURL(url);}
    }
  }
  host.addEventListener('click',event=>{
    const target=event.target.closest('[data-geometry-view],[data-geometry-pattern],[data-geometry-record],[data-geometry-residue],[data-geometry-bin],[data-geometry-line-bin],button[data-geometry-step],button[data-geometry-page],button[data-geometry-export],button[data-geometry-clear-group],button[data-geometry-retry]');
    if(!target||!host.contains(target))return;
    if(target.hasAttribute('data-geometry-retry')){load(source);return;}if(!ready)return;
    const d=target.dataset;
    if(d.geometryView){view=d.geometryView;group=null;page=0;}
    if(d.geometryPattern)pattern=d.geometryPattern;
    if(d.geometryRecord){active=filtered.find(r=>r.id===d.geometryRecord);if(!inspected.includes(active))group=null;}
    if(d.geometryResidue!==undefined){group={kind:'residue',value:Number(d.geometryResidue)};page=0;}
    if(d.geometryBin!==undefined){const i=Number(d.geometryBin),size=manifest.reference.length_bp/72;group={kind:'position',lo:i*size,hi:(i+1)*size};page=0;}
    if(d.geometryLineBin!==undefined){const i=Number(d.geometryLineBin),lo=Number(d.binLo),size=(Number(d.binHi)-lo)/72;group={kind:'position',lo:lo+i*size,hi:lo+(i+1)*size};page=0;}
    if(target.hasAttribute('data-geometry-clear-group')){group=null;page=0;}
    if(d.geometryStep){const i=inspected.indexOf(active);active=inspected[(i+Number(d.geometryStep)+inspected.length)%inspected.length];}
    if(d.geometryPage)page+=Number(d.geometryPage);
    if(d.geometryExport){save(d.geometryExport);return;}
    const restore=target===document.activeElement;
    draw();
    if(restore&&!target.isConnected){
      const key=Object.keys(d).find(k=>k.startsWith('geometry'));
      const attr=key?.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
      if(attr)host.querySelector(`[data-${attr}="${CSS.escape(d[key])}"]`)?.focus({preventScroll:true});
    }
  });
  host.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('svg [role="button"]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  get('#geometry-source').addEventListener('change',()=>{get('#geometry-search').value='';get('#geometry-zoom').checked=false;load(get('#geometry-source').value);});
  let timer;get('#geometry-search').addEventListener('input',()=>{group=null;page=0;clearTimeout(timer);timer=setTimeout(draw,120);});
  get('#geometry-score').addEventListener('change',()=>{group=null;page=0;draw();});
  get('#geometry-zoom').addEventListener('change',draw);
  await load(source);
}
