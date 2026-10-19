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
const svg = (body,label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 380" role="img" aria-label="${esc(label)}" class="geometry-svg"><style>text{font-family:Arial,sans-serif;font-size:11px;fill:#a8bfcd;stroke:none;text-anchor:middle} .axis{stroke:#3c515f;fill:none} .observation{fill:#78cabb;stroke:#78cabb;cursor:pointer} .observation:hover{stroke:#fff;fill:#fff} .selected{stroke:#fff;fill:#fff} .ref{fill:none;stroke-width:1.7} .grid-label{fill:#e5edf3;font-size:15px} .small{font-size:9px} .count-label{paint-order:stroke;stroke:#0b141b;stroke-width:3px;stroke-linejoin:round} .large{font-size:23px;fill:#e5edf3} .faint{opacity:.3}</style>${body}</svg>`;

// Exported for the independent Node/Python parity test; display uses precomputed mappings.
export function projectInterval(start,end,lo=8740380,hi=8779628) {
  const a=Math.max(start,lo),b=Math.min(end,hi);
  if(!Number.isInteger(start)||!Number.isInteger(end)||start>=end||a>=b)throw Error('Invalid interval');
  const d0=hi-b,d1=hi-a,d=Math.floor((d0+d1-1)/2),r=d%9;
  return {offset_start:d0,offset_end_exclusive:d1,anchor_offset_bp:d,anchor_genomic_0based:hi-1-d,m9_residue:r,m9_display:r||9,full_circle_turns:d/(hi-lo)};
}

// The Atlas guide keeps its native grid; only its position in the shared view changes.
export function atlasGuide(atlas,pattern) {
  const grid=pattern==='beta'?9:24;
  const indices=pattern==='alpha'?Array.from({length:24},(_,i)=>i):pattern==='beta'?atlas.beta.interval_residues:atlas.gamma.alpha_indices;
  const paths=pattern==='gamma'?atlas.gamma.triangle_paths:pattern==='epsilon'?[atlas.epsilon.alpha_indices]:pattern==='beta'?[[...atlas.beta.interval_residues,atlas.beta.interval_residues[0]]]:[];
  return {grid,indices,turns:indices.map(i=>i/grid),values:indices.map(i=>pattern==='beta'?(i||9):atlas.alpha.display_values[i]),paths};
}
export function countRadius(count,maxCount,maxRadius=19) {
  return count>0&&maxCount>0?maxRadius*Math.sqrt(count/maxCount):0;
}

export async function mountTfbsGeometry(host, catalogue, dataRoot) {
  const root=new URL('experiment-v1/',dataRoot),cache=new Map();
  let manifest,checks,overlay,rows=[],filtered=[],inspected=[],active=null,source='studies',view='line',pattern='beta',group=null,page=0,request=0,ready=false;
  const pageSize=12;
  const get=s=>host.querySelector(s);
  host.innerHTML=`<p class="science-label">OXTR · INTERACTIVE EXPERIMENT 01</p><h3>Binding-site geometry</h3><p class="geometry-intro">Explore whether the four M9 P24 geometries help predict OXTR binding-site locations. View the data and selected geometry together on the DNA line, full-position circle or Modulus 9 circle.</p><div class="geometry-controls"><label>Data source<select id="geometry-source"><option value="studies">Published studies · 2 mapped elements</option><option value="encode">ENCODE · 255 experimental regions</option><option value="jaspar">JASPAR · 9,164 predicted matches</option></select></label><label>Find a factor, cell type or observation<input id="geometry-search" type="search" placeholder="e.g. US-1, CTCF or an ID" autocomplete="off"></label><label class="geometry-score" hidden>JASPAR score<select id="geometry-score"><option value="400">400 and above</option><option value="500">500 and above</option><option value="600">600 and above</option><option value="800">800 and above</option></select></label></div><p class="geometry-source-note"></p><div class="geometry-switches"><div><span class="geometry-control-label">View the DNA</span><div class="geometry-buttons" role="group" aria-label="DNA coordinate view">${Object.entries(views).map(([id,name],i)=>`<button type="button" data-geometry-view="${id}" aria-pressed="${id===view}"><span>${i+1}</span> ${name}</button>`).join('')}</div></div><div><span class="geometry-control-label">Compare with M9 P24</span><div class="geometry-buttons" role="group" aria-label="Atlas reference sequence">${Object.keys(colors).map(id=>`<button type="button" data-geometry-pattern="${id}" style="--pattern:${colors[id]}" aria-pressed="${id===pattern}">${id[0].toUpperCase()+id.slice(1)}</button>`).join('')}</div></div></div><p class="geometry-status" role="status" aria-live="polite">Loading the verified coordinate data…</p><div class="geometry-panels geometry-shared"><figure><figcaption class="geometry-data-title"></figcaption><div class="geometry-legend"><span><i class="geometry-data-key"></i><span class="geometry-data-legend"></span></span><span><i class="geometry-atlas-key"></i><span class="geometry-reference-title"></span></span></div><div class="geometry-data-plot"></div><div class="geometry-zoom"><label><input id="geometry-zoom" type="checkbox"> Zoom the line to the selected observation</label></div><p class="geometry-data-caption"></p><p class="geometry-reference-caption"></p></figure></div><div class="geometry-node-counts" role="group" aria-label="Observations at each M9 node" hidden></div><p class="geometry-group"></p><section class="geometry-inspector" aria-label="Selected DNA observation"><div class="geometry-inspector-body"></div><div class="geometry-buttons"><button type="button" data-geometry-step="-1">← Previous observation</button><button type="button" data-geometry-step="1">Next observation →</button></div></section><details class="geometry-records"><summary>Inspect the observations</summary><div class="geometry-table-wrap" tabindex="0" role="region" aria-label="Mapped observation selection"><table><thead><tr><th>Observation</th><th>Original interval · GRCh38</th><th>Offset / M9</th></tr></thead><tbody></tbody></table></div><div class="geometry-pagination"><button type="button" data-geometry-page="-1">← Previous page</button><span></span><button type="button" data-geometry-page="1">Next page →</button></div></details><nav class="geometry-downloads" aria-label="Experiment downloads"><button type="button" data-geometry-export="json">Selection · JSON ↓</button><button type="button" data-geometry-export="csv">Selection · CSV ↓</button><button type="button" data-geometry-export="svg">Figure · SVG ↓</button><button type="button" data-geometry-export="png">Figure · PNG ↓</button><a href="${new URL('methods.md?v=shared-v1',root)}" download>Methods ↓</a></nav><details class="geometry-methods"><summary>Mapping &amp; verification</summary><p>Fixed human OXTR window: GRCh38 chr3:8,740,380–8,779,628 (0-based, end-exclusive). The direction follows OXTR’s minus strand, from high to low genomic coordinates. The origin is the window edge, not the transcription start site.</p><p>The line and full circle retain interval widths. For M9, one central base represents each interval within this window. An even-width interval uses the first central base in the OXTR direction. Regions extending beyond the window are clipped for display; their original coordinates remain in every export.</p><p><code>d = floor((offset_start + offset_end − 1) / 2)</code><br><code>Full circle = d / 39,248 turns · M9 = d mod 9</code><br>Zero is displayed as 9. All circles start at north and run clockwise. Compression merges positions; node counts expose those overlaps.</p><p>The Atlas reference keeps its original grid and phase: Alpha, Gamma and Epsilon use 24 period positions; Beta uses nine residue positions. The shared circle aligns both layers at north, clockwise, with no fitted rotation. On the full-position circle, one DNA window fills one turn. On the line, Atlas turn × window length gives the guide position; connecting curves show the unwrapped Atlas path. In M9, the DNA has nine residue positions while each Atlas guide retains its native grid. A shared angle does not equate a period index with a residue. The Atlas paths show geometry, not measured movement or binding order.</p><div class="geometry-checks"></div><p>The browser filters and draws precomputed results. Python/Biopython and Wolfram are used in the reproducible preparation and verification, rather than called as live services for each selection.</p><nav class="geometry-downloads">${[['manifest.json','Experiment manifest'],['overlay-v1.json','Shared-graph rules'],['python-validation.json','Python / Biopython checks'],['wolfram-validation.json','Wolfram checks'],['build_experiment.py','Python script'],['verify.wl','Wolfram code'],['requirements.txt','Python environment']].map(([f,l])=>`<a href="${new URL(f+'?v=shared-v1',root)}" download>${l} ↓</a>`).join('')}</nav></details><p class="geometry-boundary">Initial visual experiment · statistical association has not yet been tested.</p>`;

  async function read(file) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
    try {
      const response=await fetch(new URL(file+'?v=shared-v1',root),{signal:controller.signal});
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
    for(const cls of ['geometry-data-plot','geometry-inspector-body','geometry-group'])get('.'+cls).innerHTML='';
    get('tbody').innerHTML='';get('.geometry-node-counts').hidden=true;
    host.querySelectorAll('[data-geometry-export],[data-geometry-step],[data-geometry-page]').forEach(b=>b.disabled=true);
    get('.geometry-source-note').textContent={studies:'Two published human elements with recovered positions: US-1 and US-2. The 2006 study’s 15 sites remain in the literature collection while their individual positions await recovery.',encode:'Experimental regions of protein occupancy, with source experiments and cell types retained. A region’s central base is a plotting representative.',jaspar:'Predicted motif matches at UCSC score 400 and above. The full archive, including lower scores, remains in the source-data browser below.'}[id];
    try {
      if(!manifest){
        const [m,p,w,o]=await Promise.all([read('manifest.json'),read('python-validation.json'),read('wolfram-validation.json'),read('overlay-v1.json')]);
        if(m.version!==p.version||o.coordinate_experiment!==m.version||p.status!=='passed'||w.status!=='passed'||p.wolfram_coordinate_table_sha256!==w.coordinate_table_sha256)throw Error('Verification mismatch');
        manifest=m;checks={python:p,wolfram:w};overlay=o;
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

  function lineRange() {
    const sel=active?.mapping,n=manifest.reference.length_bp,zoom=get('#geometry-zoom').checked&&sel;
    return {lo:zoom?Math.max(0,sel.offset_start-500):0,hi:zoom?Math.min(n,sel.offset_end_exclusive+500):n,zoom:!!zoom};
  }
  function guideSVG(markers=false) {
    const a=atlasGuide(manifest.atlas,pattern),color=colors[pattern],n=manifest.reference.length_bp;
    let body='';
    if(view==='line') {
      const {lo,hi}=lineRange(),x=i=>32+356*((i/a.grid*n)-lo)/(hi-lo);
      if(markers)for(let k=0;k<a.indices.length;k++){
        const i=a.indices[k],px=x(i);if(px<32||px>388)continue;
        body+=`<line x1="${px}" x2="${px}" y1="187" y2="236" stroke="${color}" stroke-dasharray="2 3" opacity=".65"/>`+circle(px,190,3,`fill="${color}"`);
        if(pattern!=='alpha')body+=text(px,249,a.values[k],`style="fill:${color}" class="small"`);
      }
      else {
        body+='<defs><clipPath id="atlas-line-clip"><rect x="32" y="40" width="356" height="155"/></clipPath></defs><g clip-path="url(#atlas-line-clip)">';
        for(const path of a.paths)for(let j=0;j<path.length-1;j++){
          const x1=x(path[j]),x2=x(path[j+1]),height=50+65*Math.abs(path[j+1]-path[j])/a.grid;
          body+=`<path d="M${x1},190 Q${(x1+x2)/2},${190-height*2} ${x2},190" class="ref" stroke="${color}" opacity=".8"/>`;
        }
        body+='</g>';
      }
    }else {
      if(markers)for(let k=0;k<a.indices.length;k++){
        const p=point(a.indices[k]/a.grid),q=point(a.indices[k]/a.grid,109);body+=circle(...p,3.4,`fill="${color}" stroke="#0b141b" stroke-width="1"`);
        if(view!=='m9')body+=text(q[0],q[1]+3,a.values[k],`class="small" style="fill:${color}"`);
      }
      else for(const path of a.paths){
        body+=`<polyline points="${path.map(i=>xy(point(i/a.grid))).join(' ')}" class="ref" stroke="${color}"/>`;
        if(pattern==='beta'||pattern==='epsilon')for(let j=0;j<path.length-1;j++){
          const p=point(path[j]/a.grid),q=point(path[j+1]/a.grid),x=p[0]+.64*(q[0]-p[0]),y=p[1]+.64*(q[1]-p[1]),angle=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI;
          body+=`<path d="M-5,-3 L0,0 L-5,3" fill="none" stroke="${color}" transform="translate(${x},${y}) rotate(${angle})"/>`;
        }
      }
    }
    return `<g class="atlas-overlay ${markers?'atlas-markers':'atlas-paths'}" data-atlas-pattern="${pattern}" data-atlas-grid="${a.grid}" data-atlas-turns="${a.turns.join(',')}" style="pointer-events:none" aria-label="${pattern} geometry, ${a.grid} native positions, fixed alignment">${body}</g>`;
  }
  function dataSVG() {
    const n=manifest.reference.length_bp,sel=active?.mapping;
    let s=guideSVG();
    if(view==='m9'){
      const counts=Array.from({length:9},(_,i)=>filtered.filter(r=>r.mapping.m9_residue===i).length),max=Math.max(1,...counts);
      s=circle(210,190,125,'class="axis"')+s;
      for(let i=0;i<9;i++){
        const p=point(i/9),q=point(i/9,163),c=point(i/9,88),radius=countRadius(counts[i],max),percent=filtered.length?100*counts[i]/filtered.length:0;
        const disc=counts[i]?circle(...p,radius,`class="count-disc" data-count="${counts[i]}" fill="#78cabb" fill-opacity=".72" stroke="none"`):circle(...p,2.5,'fill="#344b5a" stroke="none"');
        s+=`<g data-geometry-residue="${i}" class="observation"><title>Node ${i||9}: ${counts[i]} ${manifest.summaries[source].unit} (${percent.toFixed(1)}%). Select to inspect.</title>${disc}${sel?.m9_residue===i?circle(...p,radius+3,'fill="none" stroke="#fff" stroke-width="1.5"'):''}${text(q[0],q[1]+4,i||9,'class="grid-label"')}${text(c[0],c[1]+2,num(counts[i]),'class="small count-label"')}${text(c[0],c[1]+14,percent.toFixed(1)+'%','class="small count-label"')}</g>`;
      }
      s+=text(210,366,'Dot area = observation count · scale within this selection','class="small"');
    }else if(view==='circle'){
      s=circle(210,190,125,'class="axis"')+s;
      for(let i=0;i<4;i++){const p=point(i/4,170);s+=text(p[0],p[1]+4,num(i*n/4)+' bp','class="small"');}
      if(filtered.length>500){
        const bins=Array.from({length:72},()=>0);filtered.forEach(r=>bins[Math.min(71,Math.floor(r.mapping.full_circle_turns*72))]++);const max=Math.max(1,...bins);
        bins.forEach((count,i)=>{if(count){const a=point((i+.5)/72),b=point((i+.5)/72,125+27*count/max);s+=`<line class="observation density-bar" data-geometry-bin="${i}" data-bin-count="72" data-count="${count}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke-width="3"><title>${count} interval centres in this DNA section · select to inspect</title></line>`;}});
      }else{
        filtered.forEach((r,i)=>{const m=r.mapping,p=point(m.full_circle_turns);s+=`<g class="observation" data-geometry-record="${esc(r.id)}"><title>${esc(r.id+' · '+r.factor+' · '+num(m.anchor_offset_bp)+' bp from origin')}</title><path d="${arc(m.offset_start/n,m.offset_end_exclusive/n,125-(i%5)*4)}" fill="none" stroke-width="2" opacity=".65"/>${circle(...p,2.4)}</g>`;});
      }
      if(sel){const p=point(sel.full_circle_turns);s+=`<path d="${arc(sel.offset_start/n,sel.offset_end_exclusive/n,125)}" stroke="#fff" stroke-width="3" fill="none"/>`+circle(...p,5,'fill="none" stroke="#fff" stroke-width="1.5"');}
    }else{
      const {lo,hi,zoom}=lineRange(),span=hi-lo,x=d=>32+356*(d-lo)/span;
      s=`<line x1="32" y1="190" x2="388" y2="190" class="axis" stroke-width="2"/>`+s;
      for(let i=0;i<=4;i++){const d=lo+span*i/4;s+=`<line x1="${x(d)}" y1="190" x2="${x(d)}" y2="200" class="axis"/>`+text(x(d),218,num(Math.round(d)),`class="small" style="text-anchor:${i===0?'start':i===4?'end':'middle'}"`);}
      const visible=filtered.filter(r=>r.mapping.offset_start<hi&&r.mapping.offset_end_exclusive>lo);
      if(visible.length>500){
        const bins=Array.from({length:72},()=>0);visible.forEach(r=>{const d=r.mapping.anchor_offset_bp;if(d>=lo&&d<hi)bins[Math.min(71,Math.floor((d-lo)/span*72))]++;});const max=Math.max(1,...bins);
        bins.forEach((count,i)=>{if(count)s+=`<rect class="observation" data-geometry-line-bin="${i}" data-bin-lo="${lo}" data-bin-hi="${hi}" data-count="${count}" x="${32+356*i/72}" y="${185-65*count/max}" width="${356/72*.85}" height="${65*count/max}" opacity=".75"><title>${count} interval centres · select to inspect</title></rect>`;});
      }else{
        visible.forEach((r,i)=>{const m=r.mapping,y=176-(i%5)*9,a=x(Math.max(lo,m.offset_start)),b=x(Math.min(hi,m.offset_end_exclusive)),p=x(m.anchor_offset_bp);s+=`<g class="observation" data-geometry-record="${esc(r.id)}"><title>${esc(r.id+' · '+r.factor+' · strand '+(r.strand||'unassigned'))}</title><line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke-width="3"/>${p>=32&&p<=388?circle(p,190,2.5):''}</g>`;});
      }
      if(sel){const p=x(sel.anchor_offset_bp);s+=`<line x1="${p}" y1="95" x2="${p}" y2="198" stroke="#fff" stroke-dasharray="3 4"/>`+circle(p,190,4,'fill="#fff"')+text(210,280,`${active.id} · ${num(sel.anchor_offset_bp)} bp from origin`,'class="small"');}
      s+=text(210,322,'OXTR direction → · distances in DNA bases','class="small"')+text(210,366,zoom?'Zoomed line · the original mapping stays fixed':'Atlas circle unwrapped onto the 39,248-base DNA window','class="small"');
    }
    s+=guideSVG(true);
    return svg(s,`${views[view]} with ${pattern} overlay: ${filtered.length} ${manifest.summaries[source].unit} from ${names[source]}`);
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
    get('.geometry-reference-title').textContent=`${pattern[0].toUpperCase()+pattern.slice(1)} geometry · M9 P24`;
    get('.geometry-data-legend').textContent=`${names[source]} · ${num(filtered.length)} ${unit}`;
    host.style.setProperty('--atlas-color',colors[pattern]);
    get('.geometry-data-plot').innerHTML=dataSVG();
    get('.geometry-data-plot svg').setAttribute('role','group');
    get('.geometry-data-plot').querySelectorAll('.observation').forEach(mark=>{
      mark.setAttribute('tabindex','0');mark.setAttribute('role','button');
      mark.setAttribute('aria-label',mark.querySelector('title')?.textContent||'Inspect observation');
    });
    get('.geometry-data-caption').textContent=view==='m9'?'Teal dot area represents count. Percentages show each node’s share of the selected observations. White outlines mark your selection.':filtered.length>500?'Teal bars summarise 72 equal DNA sections. Bar length shows the number of interval centres; select a bar to inspect its observations.':'Teal marks show individual region centres; short lines or arcs retain their widths. White marks identify the selected observation.';
    const gridNote=pattern==='beta'?'Beta keeps its nine residue positions: 4 → 8 → 7 → 5 → 1 → 2.':`${pattern[0].toUpperCase()+pattern.slice(1)} keeps its 24-position Atlas grid.`;
    const modeNote=view==='m9'?' DNA is reduced to nine residues.':view==='circle'?' DNA positions retain their full proportional spacing: 0 bp at north, clockwise.':' The Atlas guide is unwrapped onto the DNA line.';
    get('.geometry-reference-caption').textContent=gridNote+modeNote+' Fixed orientation; coloured paths belong to the Atlas geometry.';
    const nodeBox=get('.geometry-node-counts');nodeBox.hidden=view!=='m9';
    if(view==='m9')nodeBox.innerHTML=Array.from({length:9},(_,i)=>{const count=filtered.filter(r=>r.mapping.m9_residue===i).length;return `<button type="button" data-geometry-residue="${i}" aria-pressed="${group?.kind==='residue'&&group.value===i}"><span>Node ${i||9}</span><strong>${num(count)}</strong><small>${(filtered.length?100*count/filtered.length:0).toFixed(1)}%</small></button>`;}).join('');
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
    const plot=get('.geometry-data-plot svg');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1000" viewBox="0 0 900 1000"><rect width="900" height="1000" fill="#0b141b"/><style>text{font-family:Arial,sans-serif;fill:#d9e7ef;text-anchor:middle}</style>${text(450,38,'OXTR binding-site geometry · '+names[source],'style="font-size:23px;fill:#d9e7ef"')}${text(450,70,`${num(filtered.length)} observations · ${views[view]} · ${pattern} overlay`,'style="font-size:16px;fill:#d9e7ef"')}${text(450,102,'Teal: DNA observations · Coloured guide: original Atlas geometry','style="font-size:14px;fill:#d9e7ef"')}<svg x="60" y="120" width="780" height="706" viewBox="0 0 420 380">${plot.innerHTML}</svg>${text(450,858,'GRCh38 chr3:8740380–8779628 · OXTR minus strand · fixed origin','style="font-size:14px;fill:#d9e7ef"')}${text(450,886,view==='m9'?'Dot area = count; scale within selection. DNA: 9 residues. Atlas: '+atlasGuide(manifest.atlas,pattern).grid+' positions.':'One DNA window = one turn; guide retains its native grid and phase.','style="font-size:14px;fill:#d9e7ef"')}${text(450,914,'Python / Biopython / Wolfram coordinate checks · no fitted rotation','style="font-size:14px;fill:#d9e7ef"')}${text(450,942,'Exploratory comparison · biological association untested','style="font-size:14px;fill:#d9e7ef"')}<metadata>${esc(JSON.stringify({version:manifest.version,overlay,source,view,pattern,search:get('#geometry-search').value,minimum_score:source==='jaspar'?Number(get('#geometry-score').value):null,group,selected_observation:active?.id,line_zoom:get('#geometry-zoom').checked,mapping:manifest.mapping,reference:manifest.reference}))}</metadata></svg>`;
  }
  async function save(format) {
    if(!ready)return;draw();if(!inspected.length)return;
    const parameters={source,view,overlay_version:overlay.version,atlas_sequence:pattern,search:get('#geometry-search').value,minimum_score:source==='jaspar'?Number(get('#geometry-score').value):null,inspection_group:group,selected_observation:active?.id,line_zoom:get('#geometry-zoom').checked};
    const name=`oxtr-${source}-${view}-${pattern}`;
    if(format==='json')saveBlob(JSON.stringify({version:manifest.version,count:inspected.length,parameters,overlay,reference:manifest.reference,mapping:manifest.mapping,atlas:manifest.atlas,verification:checks,sources:manifest.source_sha256,records:inspected},null,2),'application/json',name+'.json');
    if(format==='csv'){
      const flat=inspected.map(r=>({...r,...r.mapping,experiment_version:manifest.version,view,atlas_sequence:pattern,window_start_0based:manifest.reference.start_0based,window_end_exclusive:manifest.reference.end_exclusive,origin_genomic_base_0based:manifest.reference.origin_genomic_base_0based,coordinate_convention:manifest.reference.coordinate_convention,mapping_rules:manifest.mapping,overlay_rules:overlay,selection_parameters:parameters,atlas_reference:manifest.atlas,source_sha256:manifest.source_sha256}));
      const fields=[...new Set(flat.flatMap(Object.keys))],cell=v=>{const s=v==null?'':typeof v==='object'?JSON.stringify(v):String(v);return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
      saveBlob('\uFEFF'+[fields,...flat.map(r=>fields.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n','text/csv;charset=utf-8',name+'.csv');
    }
    if(format==='svg')saveBlob(combinedFigure(),'image/svg+xml',name+'.svg');
    if(format==='png'){
      const image=new Image(),url=URL.createObjectURL(new Blob([combinedFigure()],{type:'image/svg+xml'}));
      try{image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=2000;canvas.getContext('2d').drawImage(image,0,0,1800,2000);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG unavailable');saveBlob(blob,'image/png',name+'.png');}
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
