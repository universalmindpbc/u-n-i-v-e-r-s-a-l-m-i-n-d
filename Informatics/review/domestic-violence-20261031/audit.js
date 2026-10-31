'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = v => v == null || v === '' ? 'Not established from accessed source' : Array.isArray(v) ? v.map(text).join('; ') : typeof v === 'object' ? Object.entries(v).map(([k,x]) => `${k}: ${text(x)}`).join(' · ') : String(v);
  const isReview = r => /review|meta.analysis|synthesis/i.test(r.publicationType + ' ' + r.design.type);
  const safeURL = u => /^https:\/\//.test(u) ? u : '#';
  const section = (label,value,wide=false) => `<section class="${wide?'span-all':''}"><h3>${esc(label)}</h3><p>${esc(text(value))}</p></section>`;
  let bundle, visible = [];
  function card(r) {
    const recommended = r.publicationRecommendation.status === 'recommended-summary';
    const crosses = r.design.crosses ? `<span class="crosses" role="img" aria-label="${r.design.crosses===2?'Double-blind randomized trial':'Randomized trial design supported by accessed source'}">${'<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#1468a8"/><path d="M7 3.5h4V7h3.5v4H11v3.5H7V11H3.5V7H7z" fill="white"/></svg>'.repeat(r.design.crosses)}</span>` : '';
    return `<article class="paper" id="${esc(r.id)}" data-record="${esc(r.id)}" data-decision="${esc(r.publicationRecommendation.status)}">
      <div class="badges"><span class="badge ${recommended?'pending':'hold'}">${recommended?'AI recommends this summary':'Withheld from release'}</span><span class="badge">${esc(r.collection)}</span><span class="badge">${esc(r.relevance.relation)} evidence</span><span class="badge">${esc(r.access.level)} appraisal</span><span class="badge">${r.existingRepositoryMatches.length?'Existing library entry':'New to library'}</span></div>
      <h2><a href="${esc(safeURL(r.sources[0]?.url || 'https://doi.org/'+r.doi))}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>${crosses}</h2>
      <p class="publication">${esc(r.year)} · ${esc(r.journal)} · ${esc(r.design.type)}</p>
      ${recommended?'':`<p class="record-advisory"><strong>Reason withheld.</strong> ${esc(r.publicationRecommendation.reason)}</p>`}
      <p class="finding">${esc(r.finding)}</p><p class="limits"><strong>Limits.</strong> ${esc(r.limitation)}</p>
      <details><summary>Evidence, methods &amp; audit trail</summary><div class="detail-grid">
      ${section('Population and transfer limits',[r.relevance.population,r.relevance.exposureEvidence,r.relevance.transferLimit])}
      ${section('Age and setting',[r.age,r.country,r.setting])}${section('Sample',r.sampleSize)}
      ${section('Intervention',r.intervention)}${section('Comparator',r.comparator)}
      ${section('Randomization and masking',[r.design.randomizationEvidence,r.design.masking,r.design.crossRationale])}
      ${section('Measured outcomes',r.outcomes,true)}${section('Risk of bias and attrition',[r.quality.riskOfBias,r.quality.attrition,r.quality.confounding])}
      ${section('Adverse findings and safety limits',r.quality.adverseFindings)}
      ${section('Publication status',r.publicationStatus)}${section('Study family and registration',[r.studyFamilyId,r.familyLinkageUncertain?'Linkage provisional':'Linked family',r.trialRegistration])}
      ${section('Authors and identifiers',[r.authors,r.doi,r.pmid])}${section('Assessment notes',r.assessmentNotes)}
      ${r.relatedFamilyEvidence?section('Separately attributed family evidence',r.relatedFamilyEvidence,true):''}
      <section class="span-all"><h3>Sources</h3><p>${esc(r.access.level)} appraisal. ${esc(r.access.accessLimit || 'Only the accessed evidence supports this summary; unavailable methods remain uncertain.')}</p><ul class="source-list">${r.sources.map(s=>`<li><a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.type || 'Primary source')}</a> · ${esc(s.notes || '')}</li>`).join('')}</ul></section>
      ${section('Editorial decision',r.publicationRecommendation.reason,true)}
      <section class="span-all"><h3>Immutable revision</h3><p class="revision">${esc(r.id)} · ${esc(r.revision)}<br>SHA-256 ${esc(r.contentHash)}<br>AI editorial assessment; no human paper-level approval recorded.</p></section>
      </div></details></article>`;
  }
  function render() {
    const q=$('#query').value.trim().toLowerCase(), decision=$('#decision').value, collection=$('#collection').value, design=$('#design').value, access=$('#access').value;
    visible=bundle.records.filter(r=>(!q||JSON.stringify(r).toLowerCase().includes(q))&&(!decision||decision==='withheld'&&r.publicationRecommendation.status!=='recommended-summary'||r.publicationRecommendation.status===decision)&&(!collection||r.collection===collection)&&(!access||r.access.level===access)&&(!design||design==='rct'&&r.design.crosses>0||design==='review'&&isReview(r)||design==='other'&&!isReview(r)&&!r.design.crosses));
    $('#result-count').textContent=`${visible.length} shown · ${bundle.counts.assessed} assessed · ${bundle.counts.recommendedSummaries} recommended · ${bundle.counts.withheld} withheld`;
    $('#results').innerHTML=visible.length?visible.map(card).join(''):'<p class="empty">No records match these filters.</p>';
  }
  function download(body,type,name) {
    const href=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  }
  $('#filters').addEventListener('submit',e=>e.preventDefault());
  $('#filters').addEventListener('input',()=>bundle&&render());
  $('#clear').addEventListener('click',()=>{if(!bundle)return;$('#filters').reset();render();});
  $('#download').addEventListener('click',()=>download(JSON.stringify({schema:bundle.schema,batchRevision:bundle.batchRevision,productionEligible:false,status:bundle.reviewStatus,method:bundle.method,limitations:bundle.limitations,count:visible.length,records:visible},null,2),'application/json','dv-audited-summaries.json'));
  $('#csv').addEventListener('click',()=>{
    const fields=['id','revision','contentHash','decision','title','year','doi','pmid','collection','design','crosses','access','finding','limitation','decisionReason','humanReleaseApproval'];
    const cell=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
    const rows=visible.map(r=>({...r,decision:r.publicationRecommendation.status,design:r.design.type,crosses:r.design.crosses,access:r.access.level,decisionReason:r.publicationRecommendation.reason,humanReleaseApproval:false}));
    download([fields.join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\n'),'text/csv;charset=utf-8','dv-audited-summaries.csv');
  });
  fetch('index.json',{cache:'no-store'}).then(async response=>{
    if(!response.ok)throw new Error('Audit index unavailable');
    const index=await response.json();
    if(!/^audit-[a-f0-9]{16}\.json$/.test(index.batch))throw new Error('Invalid audit revision');
    const result=await fetch(index.batch,{cache:'no-store'});if(!result.ok)throw new Error('Audit evidence unavailable');
    bundle=await result.json();
    if(bundle.records.length!==130||bundle.counts.recommendedSummaries!==117||bundle.productionEligible!==false)throw new Error('Audit integrity check failed');
    $('#metrics').innerHTML=[['assessed','Assessed records'],['recommendedSummaries','Recommended summaries'],['withheld','Withheld from release'],['newRecommended','New library publications']].map(([k,label])=>`<div class="metric"><strong>${bundle.counts[k]}</strong><span>${label}</span></div>`).join('');
    $('#method').textContent=bundle.method;$('#audit-limits').textContent=bundle.limitations.join(' ');
    $('#revision-info').textContent=`${bundle.batchRevision} · ${bundle.createdAt} · Based on staging ${bundle.baselineCommit.slice(0,12)}`;
    $('#complete-bundle').href=index.batch;$('#download').disabled=false;$('#csv').disabled=false;
    if(location.hash){const key=decodeURIComponent(location.hash.slice(1)),r=bundle.records.find(r=>r.id===key);if(r&&r.publicationRecommendation.status!=='recommended-summary')$('#decision').value='withheld';}
    render();if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }).catch(error=>{$('#result-count').textContent=error.message+'. No publication decision should be inferred from an incomplete load.';$('#download').disabled=true;$('#csv').disabled=true;});
})();
