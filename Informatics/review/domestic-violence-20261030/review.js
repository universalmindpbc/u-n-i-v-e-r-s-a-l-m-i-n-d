'use strict';
(() => {
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=v=>v===null||v===undefined||v===''?'Not established from accessed source':Array.isArray(v)?v.map(text).join('; '):typeof v==='object'?Object.entries(v).map(([k,x])=>`${k}: ${text(x)}`).join(' · '):String(v);
  const url=v=>/^https:\/\//.test(String(v))?v:'#';
  const isReview=r=>/review|meta.analysis|synthesis/i.test(r.publicationType+' '+r.design.type);
  const crosses=r=>r.design.crosses?`<span class="crosses" role="img" aria-label="${r.design.crosses===2?'Verified double-blinded randomized trial':'Verified randomized trial'}">${'<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#1468a8"/><path d="M7 3.5h4V7h3.5v4H11v3.5H7V11H3.5V7H7z" fill="white"/></svg>'.repeat(r.design.crosses)}</span>`:'';
  const section=(title,value,wide=false)=>`<section class="${wide?'span-all':''}"><h3>${esc(title)}</h3><p>${esc(text(value))}</p></section>`;
  let bundle,visible=[];
  function card(r){
    const source=r.sources.find(s=>s.url)?.url||(r.doi?'https://doi.org/'+r.doi:r.pmid?'https://pubmed.ncbi.nlm.nih.gov/'+r.pmid+'/':'#');
    const citations=r.sources.map(s=>`<li><a href="${esc(url(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.type||new URL(s.url).hostname)}</a> · ${esc(s.retrievedAt||r.access.retrievedAt)}${s.notes?' — '+esc(s.notes):''}</li>`).join('');
    const resultRows=r.outcomes.map(o=>`<div class="outcome"><p><strong>${esc(o.name)}</strong> · ${esc(text(o.followUp))}</p><p>${esc(text(o.result))}</p><p>Estimate: ${esc(text(o.effectEstimate))}. Uncertainty: ${esc(text(o.uncertainty))}.</p><p>Primary outcome status: ${esc(text(o.primaryStatus))}</p></div>`).join('');
    return `<article class="paper" id="${esc(r.id)}" data-record="${esc(r.id)}"><div class="badges"><span class="badge pending">${r.reviewReady?'Awaiting review':'Source clarification needed'}</span><span class="badge">${esc(r.collection[0].toUpperCase()+r.collection.slice(1))}</span><span class="badge ${esc(r.relevance.relation)}">${esc(r.relevance.relation)} evidence</span><span class="badge">${esc(r.access.level.replaceAll('-',' '))} assessed</span><span class="badge">${r.existingRepositoryMatches.length?'Already in library':'New to library'}</span></div>
      <h2><a href="${esc(url(source))}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>${crosses(r)}</h2>
      <p class="publication">${esc(r.year)} · ${esc(r.journal)} · ${esc(r.design.type)}</p>
      <p class="finding">${esc(r.finding)}</p><p class="limits"><strong>Limits.</strong> ${esc(r.limitation)}</p>
      <details><summary>Evidence, methods &amp; sources</summary><div class="detail-grid">
      ${section('Population & exposure',[r.relevance.population,r.relevance.exposureEvidence])}
      ${section('Age & setting',[r.age.reportedRange,r.age.youthScope,r.country,r.setting])}
      ${section('Participants',r.sampleSize)}${section('Intervention',[r.intervention.description,r.intervention.dose,r.intervention.provider])}
      ${section('Comparator',r.comparator)}${section('Randomization',r.design.randomizationEvidence)}
      ${section('Masking roles',r.design.masking)}${section('Design assessment',r.design.crossRationale)}
      <section class="span-all"><h3>Measured outcomes</h3>${resultRows||'<p>Outcome details not established from accessed source.</p>'}</section>
      ${section('Risk of bias & attrition',[r.quality.riskOfBias,r.quality.attrition,r.quality.confounding])}
      ${section('Adverse or negative findings',r.quality.adverseFindings)}
      ${section('Why consider this publication',r.recommendationRationale)}${section('Relevance & transfer limits',[r.relevance.rationale,r.relevance.transferLimit,r.quality.transferLimits])}
      ${section('Publication status',[r.publicationStatus.status,r.publicationStatus.correctionRetractionCheck,r.publicationStatus.uncertainty])}
      ${section('Study family & registration',[r.studyFamilyId,r.familyLinkageUncertain?'Family linkage remains provisional':'Linked study family',r.trialRegistration])}
      ${section('Authors',r.authors)}${section('Identifiers',[r.pmid?'PMID '+r.pmid:null,r.doi?'DOI '+r.doi:null].filter(Boolean))}
      ${section('Jadad assessment',r.quality.jadad)}${section('Assessment notes',r.assessmentNotes)}
      <section class="span-all"><h3>Sources & access</h3><p>${esc(r.access.level)} assessed. ${esc(r.access.accessLimit||'The level of access limits which methods and findings can be verified.')}</p><ul class="source-list">${citations}</ul></section>
      <section class="span-all"><h3>Review revision</h3><p class="revision">${esc(r.id)} · ${esc(r.revision)}<br>SHA-256 ${esc(r.contentHash)}<br>Discovered by AI. Pending Universal Mind review; no human approval recorded.</p></section>
      </div></details></article>`;
  }
  function render(){
    const q=$('#query').value.trim().toLowerCase(),collection=$('#collection').value,relation=$('#relation').value,design=$('#design').value,access=$('#access').value,novelty=$('#novelty').value;
    visible=bundle.records.filter(r=>(!q||JSON.stringify(r).toLowerCase().includes(q))&&(!collection||r.collection===collection)&&(!relation||r.relevance.relation===relation)&&(!access||r.access.level===access)&&(!novelty||(novelty==='existing')===!!r.existingRepositoryMatches.length)&&(!design||design==='rct'&&r.design.crosses>0||design==='double'&&r.design.crosses===2||design==='review'&&isReview(r)||design==='other'&&!isReview(r)&&r.design.crosses===0));
    $('#result-count').textContent=`${visible.length} of ${bundle.records.length} assessed publications · all awaiting review`;
    $('#results').innerHTML=visible.length?visible.map(card).join(''):'<div class="empty"><h2>No publications match these filters.</h2><p>Try clearing a filter or broadening your search.</p></div>';
  }
  function download(content,type,name){const blob=new Blob([content],{type}),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
  $('#filters').addEventListener('submit',e=>e.preventDefault());$('#filters').addEventListener('input',()=>bundle&&render());
  $('#clear').addEventListener('click',()=>{$('#filters').reset();render();});
  $('#download').addEventListener('click',()=>download(JSON.stringify({schema:bundle.schema,batchRevision:bundle.batchRevision,status:'pending-human-review',count:visible.length,records:visible},null,2),'application/json','domestic-violence-candidate-review.json'));
  $('#csv').addEventListener('click',()=>{
    const fields=['id','revision','contentHash','title','year','journal','doi','pmid','collection','relationship','design','crosses','access','finding','limitation','reviewStatus','humanDecision','humanNotes'];
    const rows=visible.map(r=>({...r,relationship:r.relevance.relation,design:r.design.type,crosses:r.design.crosses,access:r.access.level,reviewStatus:'pending',humanDecision:'',humanNotes:''}));
    const cell=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
    download([fields.join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\n'),'text/csv;charset=utf-8','domestic-violence-review-decisions.csv');
  });
  fetch('index.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Review index unavailable');return r.json();}).then(async index=>{
    const response=await fetch(index.batch,{cache:'no-store'});if(!response.ok)throw new Error('Review evidence unavailable');bundle=await response.json();
    const m=bundle.metrics;
    $('#metrics').innerHTML=[['screenedReportGroups','Provisional screened report groups'],['deduplicatedNew','New assessed publications'],['assessed','Assessed publications'],['reviewReady','Ready for human review']].map(([k,label])=>`<div class="metric"><strong>${esc(m[k])}</strong><span>${label}</span></div>`).join('');
    $('#coverage').textContent=`${m.existingAssessed} assessed publications already appear in the library. The primary reports form ${m.primaryStudyProgramGroups} provisional study/program groups, including ${m.randomizedReportGroups} randomized-report groups. An exact independent-study count is not yet established. ${m.reviewPublications} reviews are counted separately.`;
    $('#revision-info').textContent=`Batch ${bundle.batchRevision} · Prepared ${bundle.createdAt} · Baseline ${bundle.baselineCommit.slice(0,12)}`;
    $('#audit').innerHTML=`<p>${esc(bundle.scopeNote)}</p><p>${m.screenedRaw} screening decisions across lanes; ${m.screenedPublicationVersions} distinct publication-version identifiers, linked into ${m.screenedReportGroups} provisional report groups. ${m.preprintVersionGroups} groups link matching preprint/final or preprint-version titles; author and cohort reconciliation is not exhaustive. ${m.sourceInspectedUnique} identifier records received source inspection; ${m.automatedTitleScreenedUnique} identifier records appear in the automated title-screen ledger. These groups can overlap. ${m.excludedUnique} publication-version records were excluded; ${m.deferredUnique} deferred. ${m.duplicateCandidateReports} duplicate candidate assessments merged. Retrieved but unscreened hits remain outside these counts.</p><p>${esc(bundle.limitations.join(' '))}</p><p><a href="screening.json" download>Screening decisions</a> · <a href="search-log.json" download>Search history</a> · <a href="${esc(index.batch)}" download>Complete candidate evidence</a></p><details><summary>Excluded and deferred records</summary><div>${bundle.screeningSummary.map(r=>`<p><strong>${esc(r.title||r.pmid||r.doi)}</strong> — ${esc(r.decision)}: ${esc(r.reason)}</p>`).join('')}</div></details>`;
    render();
  }).catch(error=>{$('#result-count').textContent=error.message+'. Please reload or use the evidence package supplied with this review.';$('#download').disabled=true;$('#csv').disabled=true;});
})();
