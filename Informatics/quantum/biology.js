const $=s=>document.querySelector(s),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const embedded=new URLSearchParams(location.search).get('embedded')==='1';document.body.classList.toggle('embedded',embedded);
const endpoint=location.hostname==='staging.universalmind.tv'?'https://informatics-universal-one-staging.universalmind.workers.dev':'https://informatics-universal-one.universalmind.workers.dev';
const prompts={binding:'I’m studying how transcription factors recognise DNA. How can I compare quantum and classical methods for predicting binding, using published evidence?',assembly:'Please assemble these three synthetic DNA fragments in a known common orientation: ATGCCTA, CCTAGGA, AGGATTC. Show me the reconstruction and prepare a quantum-compatible model.',haplotypes:'I want to understand which genetic variants belong to the same chromosome copy. What data are needed, and what has quantum computing demonstrated for haplotype reconstruction?',contacts:'Can neutral-atom quantum methods help select compatible protein–ligand contacts? Explain what has been tested and how to compare the result with a classical method.'};
let history=[],turns=[],busy=false;
// An illustrative sequence motif, never a scientific result.
const svg=$('#helix'),ns='http://www.w3.org/2000/svg';
function sn(tag,attrs){const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
const points=[[],[]];
for(let i=0;i<24;i++){const t=i/23,x=45+t*340,y=145+Math.sin(t*Math.PI*3.5)*52,z=145-Math.sin(t*Math.PI*3.5)*52;points[0].push(`${x},${y}`);points[1].push(`${x},${z}`);svg.append(sn('line',{x1:x,y1:y,x2:x,y2:z,stroke:i%3?'#31515f':'#536b76','stroke-width':1}));for(const [cy,color]of[[y,'#a3ead1'],[z,'#a7c8e9']])svg.append(sn('circle',{cx:x,cy,r:i%3?2:3,fill:color}));}
points.forEach((p,i)=>svg.prepend(sn('polyline',{points:p.join(' '),fill:'none',stroke:i?'#6c8eaa':'#6da58e','stroke-width':1})));
for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=()=>{if(busy)return;$('#question').value=prompts[b.dataset.prompt];$('#question').focus();$('#ask').scrollIntoView({block:'start',behavior:'smooth'});};
function download(value,name,type='application/json'){const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function updateCapacity(data){
 $('#capacity').replaceChildren();
 for(const [key,title]of[['day','Today'],['week','This week'],['month','This month']]){const p=data.periods[key],row=node('div',undefined,'capacity-period'),bar=node('progress');bar.max=p.limit;bar.value=p.remaining;bar.setAttribute('aria-label',`${title}: ${p.remaining} of ${p.limit} AI questions available`);row.append(node('span',title),bar,node('small',`${p.remaining} / ${p.limit}`));$('#capacity').append(row);}
 $('#availability').textContent=Object.values(data.periods).every(p=>p.remaining>0)?'AI planning available':'Shared planning allowance full';
}
async function capacity(){try{const r=await fetch(endpoint+'/quantum/capacity',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();updateCapacity(await r.json());}catch{$('#availability').textContent='Capacity not verified';$('#capacity').replaceChildren(node('p','Capacity is temporarily unavailable. Refresh to retry.'));}}
$('#refresh-capacity').onclick=capacity;capacity();
function details(title,items){const d=node('details');d.append(node('summary',title));const list=node('ul');for(const text of items)list.append(node('li',text));d.append(list);return d;}
function modelSource(c){
 const wl=x=>JSON.stringify(x).replace(/\[/g,'{').replace(/\]/g,'}');
 return `(* Universal Informatics read-ordering model. Classical baseline only; no Wolfram or QPU run is implied. *)\n(* x=(1-z)/2. h and J define an Ising problem Hamiltonian with Pauli-Z terms. Indices below use Wolfram's one-based convention. *)\nh = ${wl(c.ising.h)};\npairs = ${wl(c.ising.J.map(t=>[t.i+1,t.j+1,t.value]))};\noffset = ${c.ising.offset};\nenergy[z_List] := offset + h.z + Total[(#[[3]] z[[#[[1]]]] z[[#[[2]]]]) & /@ pairs];\n(* Symbolic Hamiltonian; Z[i] denotes Pauli Z acting on site i. *)\nH = offset + Sum[h[[i]] Z[i], {i, Length[h]}] + Total[(#[[3]] Z[#[[1]]] Z[#[[2]]]) & /@ pairs];\n(* Evaluate a basis state's energy without constructing a dense 2^n matrix. *)\nreads = ${wl(c.reads)};\n`;
}
function calculation(c,id){
 const box=node('div',undefined,'calculation');box.append(node('p','CALCULATED / CLASSICAL BASELINE','eyebrow'),node('h4','A reconstruction from your fragments'));
 const seq=node('div',undefined,'sequence');seq.setAttribute('aria-label','Reconstructed DNA sequence: '+c.sequence);let offset=0;const map=node('div',undefined,'read-map');
 c.pieces.forEach((p,i)=>{seq.append(node('span',p.sequence.slice(p.overlap)));if(i)offset-=p.overlap;const row=node('div');row.append(node('small','Read '+(p.read+1)),node('code',' '.repeat(offset)+p.sequence));map.append(row);offset+=p.sequence.length;});box.append(seq,map);
 const metrics=node('div',undefined,'metric-row');for(const [value,label]of[[c.tested,'orders compared'],[c.overlapScore,'overlapping bases'],[c.optimalOrders,'equally best orders']]){const m=node('span');m.append(node('strong',String(value)),document.createTextNode(label));metrics.append(m);}box.append(metrics);
 box.append(node('p',c.optimalOrders===1?'This is the unique best ordering under the maximum-overlap objective. The result depends on the stated assumptions.':`The data admit ${c.optimalOrders} equally best orderings. This view shows one; the sequence is not uniquely resolved.`,'note'));
 if(c.disconnected)box.append(node('p','At least one adjacent pair has no overlap. The joined sequence is not a supported contiguous assembly.','note warning'));
 box.append(details('Assumptions and model', [...c.assumptions,`${c.qubo.variables} binary variables encode the fragment ordering. QUBO and Ising coefficients are prepared; this run has not used a GPU, QPU or Wolfram service.`]));
 const actions=node('div',undefined,'model-tools'),save=node('button','Download reproducible model ↓','text-button'),wl=node('button','Wolfram Language source ↓','text-button');save.onclick=()=>download(c,'dna-model-'+id.slice(0,8)+'.json');wl.onclick=()=>download(modelSource(c),'dna-model-'+id.slice(0,8)+'.wl','text/plain');actions.append(save,wl);box.append(actions);return box;
}
function renderTurn(question,data){
 const p=data.plan,article=node('article',undefined,'turn');article.dataset.runId=data.id;article.append(node('p','YOU / '+question,'your-question'),node('span',data.execution.toUpperCase(),'execution'),node('h3',p.title),node('p',p.answer,'answer'));
 if(data.calculation)article.append(calculation(data.calculation,data.id));
 if(data.calculationNote)article.append(node('p',data.calculationNote,'next-question'));
 article.append(node('p',p.method,'plan-method'));
 if(p.needed_data.length&&!data.calculation)article.append(details('Information for the next step',p.needed_data));
 if(p.limitations.length)article.append(details('What this can establish',p.limitations));
 if(data.references.length){const d=node('details');d.append(node('summary','Published evidence · '+data.references.length));for(const r of data.references){const para=node('p'),a=node('a',r.title+' ↗');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';para.append(a,node('br'),document.createTextNode(r.evidence+'. '+r.limit));d.append(para);}article.append(d);}
 if(p.next_question&&!data.calculation)article.append(node('p',p.next_question,'next-question'));
 const rerun=node('button','Explore this question again ↻','text-button');rerun.onclick=()=>{if(busy)return;$('#question').value=question;$('#question').focus();$('#ask').scrollIntoView({block:'start'});};article.append(rerun);$('#conversation').append(article);$('#conversation-actions').hidden=false;
}
$('#question-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;const question=$('#question').value.trim();if(question.length<5)return;
 busy=true;$('#ask-button').disabled=true;$('#question').readOnly=true;$('#new-question').disabled=true;$('#conversation').setAttribute('aria-busy','true');$('#question-status').className='';$('#question-status').textContent='Exploring your biological question and checking the research context…';
 try{
  const response=await fetch(endpoint+'/quantum/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history:history.slice(-8)}),signal:AbortSignal.timeout(110000)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'The research service is unavailable. Please retry.');
  if(!data.plan||!data.id)throw Error('The response was incomplete. Your question is preserved.');
  renderTurn(question,data);turns.push({question,...data});history.push({role:'user',content:question},{role:'assistant',content:[data.plan.answer,data.plan.method,data.plan.next_question].join('\n').slice(0,4000)});
  $('#question').value='';$('#question').placeholder='Ask a follow-up or describe another biological question…';$('#question-status').textContent='Your exploration is ready. Continue in your own words.';updateCapacity(data.allowance);
  $('#conversation').lastElementChild.scrollIntoView({block:'start',behavior:'smooth'});
 }catch(e){$('#question-status').className='error';$('#question-status').textContent=e.name==='TimeoutError'?'The request timed out. Your question is preserved. Check shared capacity before trying again.':e.message;}
 finally{busy=false;$('#ask-button').disabled=false;$('#question').readOnly=false;$('#new-question').disabled=false;$('#conversation').setAttribute('aria-busy','false');}
});
$('#save-session').onclick=()=>download({version:'quantum-biology-v1',savedAt:new Date().toISOString(),turns},'quantum-lab-exploration.json');
$('#new-question').onclick=()=>{if(busy)return;history=[];turns=[];$('#conversation').replaceChildren();$('#conversation-actions').hidden=true;$('#question').value='';$('#question-status').textContent='';$('#question').focus();$('#ask').scrollIntoView({block:'start'});};
async function papers(){try{const r=await fetch('data/papers.json');if(!r.ok)throw Error();const data=await r.json();$('#papers').replaceChildren();for(const p of data.papers){const d=node('details',undefined,'paper'),body=node('div',undefined,'paper-body'),a=node('a','Read original research ↗');a.href=p.url;a.target='_blank';a.rel='noopener noreferrer';d.append(node('summary',p.title));body.append(node('span',p.evidence,'paper-tag'),node('p',p.finding),node('p',p.limit),a);d.append(body);$('#papers').append(d);}}catch{$('#papers').replaceChildren(node('p','Research references are unavailable. Reload to retry.'));}}papers();
const dialog=$('#verification-dialog');$('#open-verification').onclick=()=>{if(!$('#verification-frame').src)$('#verification-frame').src='verification.html?embedded=1';dialog.showModal();$('#close-verification').focus();};$('#close-verification').onclick=()=>dialog.close();dialog.addEventListener('close',()=>$('#open-verification').focus());
