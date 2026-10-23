'use strict';
window.createInteractionUI=function({enqueue,geometryChanged,showEvidence,download}){
 const $=s=>document.querySelector(s);
 const panel=document.createElement('section');panel.className='interaction-controls';panel.hidden=true;
 $('.inspector').prepend(panel);
 const legend=document.createElement('div');legend.className='interaction-legend';legend.hidden=true;$('.scene').append(legend);
 let mode,model,source,engine,styleTimer,active=false;
 const labels={'homo-minus-1':'HOMO − 1',homo:'HOMO',lumo:'LUMO',density:'Electron density'};
 async function json(file){const response=await fetch('data/interactions/'+file);if(!response.ok)throw Error('The interaction model did not load.');return response.json();}
 function progress(state){if(mode!=='docking'||!active)return;
  $('#dock-progress').value=String(Math.round(state.progress*1000));$('#dock-progress-label').textContent=Math.round(state.progress*100)+'%';
  $('#dock-play').textContent=state.playing?'Pause':'Play docking';$('#dock-play').setAttribute('aria-pressed',String(state.playing));
  $('#dock-state').textContent=state.progress===1?'Bound pose · experimental coordinates':state.progress<.01?'Separated · illustrative start':'Approach · illustrative motion';
  $('#dock-metrics').hidden=state.progress<1;document.body.dataset.dockingProgress=String(state.progress);document.body.dataset.dockingPlaying=String(state.playing);
 }
 function pick(text){$('#selection').hidden=false;$('#selection-label').textContent=text;$('#selection-sequence').hidden=true;}
 async function load(next,currentEngine,record){
  dispose();mode=next;engine=currentEngine;active=true;panel.hidden=false;legend.hidden=false;
  if(mode==='docking'){
   source=await json('contact.json');await engine.load(record);
   panel.innerHTML=`<h2 class="eyebrow">OXT · OXTR</h2><h3>The molecular encounter</h3><p class="interaction-intro">Explore oxytocin at its receptor, from the complete complex to the aromatic contact.</p>
    <div class="interaction-segments" role="group" aria-label="Docking focus"><button data-contact-focus="complex">Complex</button><button data-contact-focus="pocket">Pocket</button><button data-contact-focus="contact" aria-pressed="true">Rings</button></div>
    <h4>DOCKING SEQUENCE</h4><div class="dock-actions"><button id="dock-play" aria-pressed="false">Play docking</button><button id="dock-bound">Bound pose</button></div>
    <div class="field-label"><label for="dock-progress">Approach</label><output id="dock-progress-label">100%</output></div><input id="dock-progress" type="range" min="0" max="1000" value="1000" step="1"><p id="dock-state" class="model-state">Bound pose · experimental coordinates</p>
    <label class="interaction-check"><input type="checkbox" id="dock-planes" checked> Ring planes</label>
    <div class="field-label"><label for="dock-opacity">Receptor opacity</label><output id="dock-opacity-label">6%</output></div><input id="dock-opacity" type="range" min="0" max="70" value="6" step="1">
    <div id="dock-metrics" class="contact-metrics"><div><span>Closest ring carbons</span><strong>${source.measurements.closestRingCarbonAngstrom.toFixed(2)} <small>Å</small></strong></div><div><span>Plane angle</span><strong>${source.measurements.ringPlaneAngleDegrees.toFixed(1)}<small>°</small></strong></div><div><span>Tyr2 OH · L316 O</span><strong>${source.measurements.hydrogenBondHeavyAtomDistanceAngstrom.toFixed(2)} <small>Å</small></strong></div></div>
    <p class="model-caption">Measured, tilted aromatic contact. The dashed gold line joins the closest ring carbons. Approach motion is illustrative.</p>`;
   legend.innerHTML='<span><i class="ligand-dot"></i>OXT · Tyr2</span><span><i class="receptor-dot"></i>OXTR · Phe291</span><span class="legend-sub">AROMATIC CONTACT</span>';
   model=await MolecularEngine.createInteraction(engine,mode,source,progress,pick);
   panel.querySelectorAll('[data-contact-focus]').forEach(b=>b.onclick=()=>{model.setFocus(b.dataset.contactFocus);geometryChanged();panel.querySelectorAll('[data-contact-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
   $('#dock-play').onclick=()=>{if(model.snapshot().playing)model.pause();else{if(model.snapshot().progress>=.999){model.setFocus('complex');geometryChanged();panel.querySelectorAll('[data-contact-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.contactFocus==='complex')));}model.play();}};
   $('#dock-bound').onclick=()=>{model.pause();model.setProgress(1);model.setFocus('contact');geometryChanged();panel.querySelectorAll('[data-contact-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.contactFocus==='contact')));};
   $('#dock-progress').oninput=e=>{const value=Number(e.target.value)/1000;model.pause();if(value<1){model.setFocus('complex');geometryChanged();panel.querySelectorAll('[data-contact-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.contactFocus==='complex')));}model.setProgress(value);};
   $('#dock-planes').onchange=e=>model.setPlanes(e.target.checked);
   $('#dock-opacity').oninput=e=>{const n=Number(e.target.value);$('#dock-opacity-label').textContent=n+'%';clearTimeout(styleTimer);styleTimer=setTimeout(()=>enqueue(()=>active?engine.setTargetOpacity(n/100):null),60);};
  }else{
   source=await json('quantum.json');const response=await fetch('data/interactions/fragment.pdb');if(!response.ok)throw Error('The quantum fragment did not load.');
   await engine.loadFragment(await response.text());
   panel.innerHTML=`<h2 class="eyebrow">ELECTRONIC STRUCTURE</h2><h3>Inside the aromatic system</h3><p class="interaction-intro">Explore calculated orbitals around a Tyr2–Phe291 fragment pair.</p>
    <label class="field-label" for="quantum-field">Electronic field</label><select id="quantum-field"><option value="homo">HOMO · highest occupied</option><option value="homo-minus-1">HOMO − 1 · occupied</option><option value="lumo">LUMO · lowest unoccupied</option><option value="density">Total electron density</option></select>
    <div id="orbital-readout" class="orbital-readout"></div>
    <div class="interaction-segments" role="group" aria-label="Quantum focus"><button data-quantum-focus="pair" aria-pressed="true">Fragment pair</button><button data-quantum-focus="ring">Tyr2 ring</button></div>
    <div class="field-label"><label for="quantum-iso">Surface level</label><output id="quantum-iso-label">0.025</output></div><input id="quantum-iso" type="range" min="0.01" max="0.06" value="0.025" step="0.005"><p id="quantum-units" class="model-state">Orbital amplitude · Bohr⁻³ᐟ²</p>
    <div class="field-label"><label for="quantum-opacity">Orbital opacity</label><output id="quantum-opacity-label">56%</output></div><input id="quantum-opacity" type="range" min="15" max="90" value="56" step="1">
    <p id="quantum-explanation" class="model-caption"></p><button id="quantum-source" class="text-button">Model &amp; assumptions ↗</button><button id="quantum-download" class="text-button">Download field · CUBE ↓</button>`;
   model=await MolecularEngine.createInteraction(engine,mode,source,null,pick);fieldInfo();
   $('#quantum-field').onchange=e=>{const field=e.target.value;enqueue(async()=>{if(!active||mode!=='quantum')return;document.body.dataset.busy='true';$('#structure-status').textContent='Loading calculated field…';await model.loadField(field);fieldInfo();document.body.dataset.busy='false';});};
   panel.querySelectorAll('[data-quantum-focus]').forEach(b=>b.onclick=()=>{model.setFocus(b.dataset.quantumFocus);panel.querySelectorAll('[data-quantum-focus]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
   for(const id of ['quantum-iso','quantum-opacity'])$('#'+id).oninput=()=>{const iso=Number($('#quantum-iso').value),opacity=Number($('#quantum-opacity').value)/100;$('#quantum-iso-label').textContent=iso.toFixed(3);$('#quantum-opacity-label').textContent=Math.round(opacity*100)+'%';clearTimeout(styleTimer);styleTimer=setTimeout(()=>enqueue(()=>active&&mode==='quantum'?model.fieldStyle({level:iso,opacity}):null),100);};
   $('#quantum-source').onclick=showEvidence;
   $('#quantum-download').onclick=()=>enqueue(async()=>{const f=model.snapshot().field,filename=f+'.cube',response=await fetch('data/interactions/'+filename);if(!response.ok)throw Error('Field download failed.');download('OXTR-'+filename,await response.text(),'text/plain');});
  }
  $('#pdb-link').href='https://www.rcsb.org/structure/7QVM';$('#pdb-link').innerHTML='PDB 7QVM <span>↗</span>';
  $('#method-summary').textContent=mode==='docking'?'Cryo-EM · 3.25 Å · engineered complex':'PBE0 / def2-SVP · gas-phase fragment';
  $('#structure-status').textContent=mode==='docking'?'7QVM · OXT–OXTR · experimental bound pose':'PBE0 / def2-SVP · stationary electronic model';
  return {atoms:mode==='docking'?source.ligand.length+source.pocket.length:source.atoms.length};
 }
 function fieldInfo(){
  const f=model.snapshot().field,o=source.orbitals.find(x=>x.id===f),density=f==='density';
  $('#orbital-readout').innerHTML=o?`<strong>${labels[f]}</strong><span>${o.energyEV.toFixed(2)} eV · ${o.occupation===0?'unoccupied':'2 electrons'}</span>`:`<strong>Electron density</strong><span>${source.electrons} electrons · complete fragment pair</span>`;
  legend.innerHTML=density?'<span><i class="density-dot"></i>Calculated electron density</span>':'<span><i class="ligand-dot"></i>Positive orbital sign</span><span><i class="receptor-dot"></i>Negative orbital sign</span>';
  $('#quantum-explanation').textContent=density?'The surface connects points with equal electron density. A lower surface level reveals more of the diffuse distribution.':'The two colours show the wavefunction’s signs. Nodes separate its lobes. These colours are not electrical charges or electron paths.';
  $('#quantum-units').textContent=density?'Electron density · electrons / Bohr³':'Orbital amplitude · Bohr⁻³ᐟ²';
  $('#structure-status').textContent='PBE0 / def2-SVP · '+labels[f]+' · calculated fragment model';document.body.dataset.quantumField=f;
 }
 function detail(view){
  if(!source)return '';
  if(mode==='docking')return `<span class="evidence-badge">${view==='sequence'?'MOLECULAR CONTACTS':'EXPERIMENTAL BOUND POSE'}</span><h3>Oxytocin at OXTR</h3><p>Oxytocin is a cyclic peptide with the sequence CYIQNCPLG–NH₂ and a Cys1–Cys6 disulfide. Tyr2 sits deep in the receptor pocket.</p><h4>AROMATIC CONTACT</h4><p>The Tyr2 phenol ring contacts receptor Phe291. Their deposited ring planes are tilted by ${source.measurements.ringPlaneAngleDegrees.toFixed(1)}°. This view does not classify the contact as a parallel π stack. Other contacts include Gln92 and Gln171, and the Tyr2 hydroxyl hydrogen bond to the backbone oxygen of Leu316.</p><dl><dt>Ring-centre distance</dt><dd>${source.measurements.centroidDistanceAngstrom.toFixed(3)} Å</dd><dt>Closest ring carbons</dt><dd>${source.measurements.closestRingCarbonAngstrom.toFixed(3)} Å</dd><dt>Tyr2 OH · Leu316 O</dt><dd>${source.measurements.hydrogenBondHeavyAtomDistanceAngstrom.toFixed(3)} Å</dd></dl><p>Distances use the deposited heavy atoms. Ring angles use least-squares planes through the six ring carbons. Structural resolution and model uncertainty limit their interpretation.</p><h4>ANIMATION</h4><p class="evidence-note">The final bound pose uses 7QVM coordinates. The approach is a rigid, illustrative translation along an outward vector. It is not a molecular-dynamics trajectory, docking search, free-energy calculation or observed entry pathway. Only the bound pose displays contact measurements.</p><p>7QVM is an engineered human receptor complex determined by cryo-EM at 3.25 Å. G protein and antibody components are omitted from this view.</p><p><a href="https://www.rcsb.org/structure/7QVM" target="_blank" rel="noopener">RCSB · 7QVM ↗</a></p><p><a href="${source.publication}" target="_blank" rel="noopener">Waltenspühl et al., 2022 · structure and contact evidence ↗</a></p><p class="source-hash">Coordinate SHA-256: ${source.sourceSHA256}</p>`;
  return `<span class="evidence-badge">CALCULATED ELECTRONIC STRUCTURE</span><h3>A local quantum model</h3><p>${source.model}</p><h4>CALCULATION</h4><dl><dt>Method</dt><dd>${source.method}</dd><dt>Software</dt><dd>${source.software}</dd><dt>Charge / spin</dt><dd>0 / singlet</dd><dt>Electrons / atoms</dt><dd>${source.electrons} / ${source.atoms.length}</dd><dt>SCF convergence</dt><dd>${source.scfConverged?'Converged':'Not converged'} · 10⁻⁹ Hartree tolerance</dd></dl><h4>ORBITALS</h4><p>HOMO is the highest occupied molecular orbital; HOMO − 1 is the occupied orbital immediately below it. LUMO is the lowest unoccupied orbital. The orbital energies are model quantities, not an optical excitation spectrum.</p>${source.orbitals.map(o=>`<p>${labels[o.id]} · ${o.energyEV.toFixed(3)} eV · occupation ${o.occupation}</p>`).join('')}<h4>PREPARATION &amp; ENVIRONMENT</h4><p>${source.preparation}</p><p>${source.environment}</p><p class="evidence-note">${source.interpretation}</p><p>${source.limitations}</p><p><a href="https://www.rcsb.org/structure/7QVM" target="_blank" rel="noopener">Source heavy-atom geometry · 7QVM ↗</a></p><p><a href="https://pyscf.org/user/dft.html" target="_blank" rel="noopener">PySCF · density functional theory ↗</a></p><p class="source-hash">Fragment SHA-256: ${source.fragmentSHA256}</p>`;
 }
 function dispose(){active=false;clearTimeout(styleTimer);model?.dispose();model=null;panel.hidden=true;legend.hidden=true;$('#selection-sequence').hidden=false;}
 return {load,detail,dispose,pause:()=>model?.pause(),reset:()=>{model?.setFocus(mode==='docking'?'contact':'pair');if(mode==='docking')geometryChanged();},snapshot:()=>({model:{...model?.snapshot(),...(mode==='docking'?{receptorOpacity:Number($('#dock-opacity').value)/100}:{})},provenance:source}),get model(){return model;}};
};
