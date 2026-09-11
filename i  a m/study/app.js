const app=document.querySelector('#study-app');
const status=document.querySelector('#study-status');
let state, dataset, busy=false, exposure=null, statusTimer, clockTimer;
let view=new URLSearchParams(location.search).has('dashboard')?'dashboard':'journey';
let tab='overview', selectedSession=null, selectedPerson='all', resultGroup='feelings';
const metricNames={happiness:['Happiness','%'],stress:['Stress','%'],connection:['Connection','%'],heart_rate_bpm:['Heart rate','bpm'],hrv_sdnn_ms:['HRV · SDNN','ms'],hrv_rmssd_ms:['HRV · RMSSD','ms'],systolic_blood_pressure_mmhg:['Blood pressure · systolic','mmHg'],diastolic_blood_pressure_mmhg:['Blood pressure · diastolic','mmHg'],hrv_power_0_1_ms2:['HRV power','ms²']};
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,signed=false)=>n===null||n===undefined||!Number.isFinite(n)?'—':`${signed&&n>0?'+':''}${Number(n.toFixed(1))}`;
const money=n=>`$${fmt(n||0)}`;
const date=v=>v?new Date(v).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'}):'Date to be announced';
const button=(label,action,secondary=false,extra='')=>`<button type="button" class="study-button${secondary?' secondary':''}" data-action="${action}" ${extra}>${html(label)}</button>`;
const currentSession=()=>state?.participant?.sessions.find(s=>!['complete','stopped'].includes(s.state));
const nextQuestion=s=>['happiness','stress','connection','text'].find(k=>!Object.hasOwn(s[s.state]||{},k));
const percent=(before,after)=>before==null||after==null||before===0?null:100*(after-before)/Math.abs(before);
const centres=[110.5,205.5,299.5,393.5,487.5,568.5,651,732.5,813.5,895.5];
const face=n=>`<span class="study-emoji" aria-hidden="true" style="background-position:${30-centres[n-1]}px -215px"></span>`;
export async function request(action,body={}) {
 const response=await fetch('api/study.php',{method:action?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:action?{'Content-Type':'application/json','X-Study-CSRF':state.csrf}:{},body:action?JSON.stringify({action,request_id:crypto.randomUUID(),...body}):undefined});
 const payload=await response.json().catch(()=>({error:'Please try again.'}));
 if(!response.ok)throw new Error(payload.error||'Please try again.');return payload;
}
function notice(text){clearTimeout(statusTimer);status.textContent=text;statusTimer=setTimeout(()=>status.textContent='',9000);}
function setPage(mode){
 clearInterval(clockTimer);document.body.dataset.studyState=mode;
 document.querySelector('.study-header').hidden=mode==='login'||mode==='experience';
 document.querySelector('[data-preview-badge]').hidden=!state.preview;
 const active=currentSession();document.querySelector('[data-action="stop"]').hidden=!active;
 document.querySelector('[data-action="logout"]').hidden=!!active;
 document.querySelector('[data-explore]').hidden=!(state.participant?.sessions.some(s=>s.after_vitals||s.state==='after_vitals'||s.state==='after_report'||s.state==='complete'));
 app.setAttribute('aria-busy','false');
}
async function refresh(){state=await request();await render();}
async function render(){
 if(view==='dashboard'){await renderDashboard();return;}
 if(!state.participant){renderLogin();return;}
 if(state.participant.withdrawn){renderStopped();return;}
 if(!state.participant.consent){renderBriefing();return;}
 const s=currentSession();
 if(s){renderStep(s);return;}
 if(state.participant.sessions.length){if(view==='event')renderEvent();else renderReward();return;}
 await enterEvent();
}
function renderLogin(){setPage('login');app.innerHTML=`<section class="access-shell"><img class="access-flower" src="a s s e t s/Universal Mind [ I o H ] Logo.PNG" alt=""><h1 class="access-title">u n i v e r s a l&nbsp;&nbsp;m i n d</h1><form class="access-form" data-form="login"><label class="access-label" for="study-code">study access code</label><input class="access-input" id="study-code" name="code" type="password" autocomplete="current-password" required maxlength="100"><button class="access-submit" type="submit">enter</button></form><div class="study-login-links">${state.preview_available?'<button type="button" data-action="preview">Preview the study</button>':''}<a href="study.php?dashboard=1">Research access</a></div></section>`;}
function renderBriefing(){setPage('briefing');app.innerHTML=`<section class="study-stage study-briefing"><p class="study-eyebrow">Universal Mind · Research</p><h1>Welcome.</h1><p class="study-copy" data-briefing>${html(state.protocol.briefing)}</p><p class="study-copy" data-requirements>${html(state.protocol.requirements)}</p><p class="study-muted">Three livestreams: sunrise · sunset · midnight. $100 on completion of all three.</p><form data-form="consent"><label class="study-check"><input name="participation" type="checkbox" required><span>I am a woman aged 18 or over and agree to take part.</span></label><label class="study-check"><input name="equipment" type="checkbox" required><span>I have the equipment and availability above.</span></label><label class="study-check"><input name="research_data" type="checkbox" required><span>I agree to research use of my coded measurements and responses, including AI analysis.</span></label><div class="study-actions"><button class="study-button" type="submit">Continue <span aria-hidden="true">→</span></button><button type="button" class="study-text-button" data-action="privacy">Research data</button></div></form></section>`;}
function eventDetails(){return state.config.events[state.participant.sessions.length];}
async function enterEvent(){
 const event=eventDetails();if(!event){renderReward();return;}
 const now=state.server_now*1000, start=Date.parse(event.starts_at);
 if(state.preview||(start&&now>=start-300000&&now<start+600000)){
  await request('session.start',{timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});state=await request();renderStep(currentSession());
 }else renderEvent();
}
function renderEvent(){setPage('event');const e=eventDetails();if(!e){renderReward();return;}
 app.innerHTML=`<section class="study-stage"><p class="study-eyebrow">Livestream ${state.participant.sessions.length+1} of 3</p><h1>${html(e.label)}</h1><p class="study-copy">${html(date(e.starts_at))}</p><div class="study-actions">${button('Join livestream','join')}<a class="study-button secondary" href="index.html">Explore Universal Mind</a></div></section>`;
}
const steps=['before_vitals','before_happiness','before_stress','before_connection','before_text','experience','after_vitals','after_happiness','after_stress','after_connection','after_text'];
function progress(s){const step=s.state.endsWith('report')?`${s.state.startsWith('after')?'after':'before'}_${nextQuestion(s)}`:s.state;const index=steps.indexOf(step);return `<p class="study-eyebrow">${html(s.window)} · ${s.state.startsWith('after')?'After':'Before'}</p><div class="study-progress" aria-label="Step ${index+1} of ${steps.length}">${steps.map((_,i)=>`<span class="${i<=index?'done':''}"></span>`).join('')}</div>`;}
function renderStep(s){
 setPage('session');
 if(s.state.endsWith('vitals')){app.innerHTML=`<section class="study-stage">${progress(s)}<div class="scan-flower"><img src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt=""></div><h1>Your Heart Check</h1><p class="study-copy">${state.config.measurement_seconds} seconds. Sit still and look into the camera.</p><div class="study-actions"><a class="study-button" href="research.php?study=1">Start Heart Check <span aria-hidden="true">→</span></a>${button('Skip','missingVitals',true)}</div></section>`;return;}
 if(s.state.endsWith('report')){const q=nextQuestion(s);const titles={happiness:'How happy do you feel?',stress:'How stressed do you feel?',connection:'How connected do you feel?',text:'How are you feeling?'};
  app.innerHTML=`<section class="study-stage question-stage" data-question="${q}">${progress(s)}<h1>${titles[q]}</h1><form data-form="answer" data-question="${q}">${q==='text'?'<textarea id="self-report" name="text" maxlength="2000" aria-label="How are you feeling?" placeholder="In your own words…"></textarea>':rating(q)}<div class="study-actions"><button class="study-button" type="submit" ${q==='text'?'':'disabled'}>${s.state==='after_report'&&q==='text'?'Finish':'Continue'} <span aria-hidden="true">→</span></button></div></form></section>`;return;
 }
 app.innerHTML=`<section class="study-stage experience-intro"><p class="study-eyebrow">${html(s.window)} · 10 minutes</p><div class="infinity-mark" aria-hidden="true">∞</div><h1>modul8 infinity</h1><p class="study-copy">${html(state.config.video_title)}</p><div class="study-actions">${button('Enter experience','exposure')}</div></section>`;
}
function rating(name){const happiness=name==='happiness';return `<div class="rating-response" aria-live="polite"><output data-rating-output>—<small>%</small></output></div><fieldset class="study-rating ${happiness?'has-emojis':''}" aria-label="${html(metricNames[name][0])}">${Array.from({length:10},(_,i)=>`<label><input type="radio" name="value" value="${i+1}" aria-label="${(i+1)*10}%" required>${happiness?face(i+1):`<span class="rating-dot" style="--i:${i}" aria-hidden="true"></span>`}<span class="study-rating-number">${(i+1)*10}%</span></label>`).join('')}</fieldset><div class="study-scale-ends"><span>${{happiness:'Least happy',stress:'Least stressed',connection:'Least connected'}[name]}</span><span>${{happiness:'Most happy',stress:'Most stressed',connection:'Most connected'}[name]}</span></div>`;}
function renderReward(){setPage('reward');const count=state.participant.sessions.filter(s=>s.state==='complete').length;app.innerHTML=`<section class="study-stage"><p class="study-eyebrow">${count} of 3 livestreams complete</p><img class="reward-card" src="a s s e t s/wallet-rewards-card.png" alt="Universal Mind rewards"><h1>${count===3?'$100. Thank you.':'Thank you.'}</h1><p class="study-copy">${count===3?'Your reward is ready.':'$100 when you complete all three livestreams.'}</p><div class="study-actions">${button('See your results','results')}${count<3?button('Next livestream','nextEvent',true):'<a class="study-button secondary" href="index.html">Explore Universal Mind</a>'}</div></section>`;}
function renderStopped(){setPage('reward');app.innerHTML=`<section class="study-stage"><h1>Session stopped.</h1><div class="study-actions">${button('Your results','results')}<a class="study-button secondary" href="index.html">Explore Universal Mind</a></div></section>`;}
function displayValue(key,value){return value==null?'—':`${fmt(['happiness','stress','connection'].includes(key)?value*10:value)}${metricNames[key][1]==='%'?'%':` <small>${metricNames[key][1]}</small>`}`;}
function comparisonCard(key,before,after){const change=percent(before,after),rating=['happiness','stress','connection'].includes(key);const direction=change===null?'':change===0?'Unchanged':key==='stress'?(change<0?'Less stress':'More stress'):key==='happiness'?(change>0?'More happiness':'Less happiness'):key==='connection'?(change>0?'More connection':'Less connection'):(change>0?'Increased':'Decreased');const tone=change===null||change===0?'neutral':rating?((key==='stress'?change<0:change>0)?'positive':'negative'):'neutral';return `<article class="result-card ${tone}" data-result-metric="${key}"><h2>${metricNames[key][0]}</h2><div class="result-change">${fmt(change,true)}<small>${change==null?'':'%'}</small></div><p class="result-direction">${direction||'Awaiting both readings'}</p><div class="result-pair"><div><span>Before</span><strong>${displayValue(key,before)}</strong></div><span aria-hidden="true">→</span><div><span>After</span><strong>${displayValue(key,after)}</strong></div></div></article>`;}
async function renderDashboard(){
 setPage('dashboard');const personal=tab==='personal';
 if(!state.owner&&!state.stakeholder&&!state.preview&&!personal){app.innerHTML=`<section class="study-stage"><p class="study-eyebrow">Research access</p><h1>Sign in</h1><form data-form="adminLogin"><label class="study-field">Owner password<input name="password" type="password" autocomplete="current-password" required></label><button class="study-button" type="submit">Continue</button></form></section>`;return;}
 dataset=await request(state.owner&&!state.preview&&!personal?'admin.dataset':state.stakeholder?'stakeholder.dataset':'summary');
 app.innerHTML=`<section class="results-stage"><div class="results-heading"><div><p class="study-eyebrow">${personal?'Universal Mind':`${dataset.summary.participants} / 10 participants · ${dataset.summary.completed_sessions} / 30 sessions`}</p><h1>${personal?'Your results':'Pilot results'}</h1></div>${!personal&&!state.stakeholder?`<nav class="study-tabs">${['overview','participants','preparation','analysis'].map(t=>`<button data-action="tab" data-tab="${t}" aria-pressed="${tab===t}">${{overview:'Results',participants:'Participants',preparation:'Setup',analysis:'Research analysis'}[t]}</button>`).join('')}</nav>`:''}</div><div id="dashboard-content"></div></section>`;
 const target=document.querySelector('#dashboard-content');
 if(tab==='participants'){renderParticipants(target);return;}if(tab==='preparation'){renderPreparation(target);return;}if(tab==='analysis'){renderAnalysis(target);return;}
 const rows=dataset.summary.rows||[];const people=[...new Set(rows.map(r=>r.participant_id))];
 if(personal&&rows.length&&selectedSession===null)selectedSession=rows.at(-1).session;
 let filtered=rows.filter(r=>(selectedPerson==='all'||r.participant_id===selectedPerson)&&(selectedSession===null||r.session===selectedSession));
 let comparisons=dataset.summary.comparisons||{};
 if(rows.length){comparisons={};for(const key of Object.keys(metricNames)){
  const byPerson=new Map();for(const row of filtered){if(row.before[key]==null||row.after[key]==null)continue;const pair=byPerson.get(row.participant_id)||[];pair.push(row);byPerson.set(row.participant_id,pair);}
  const pairs=[...byPerson.values()];const mean=phase=>pairs.length?pairs.reduce((sum,pair)=>sum+pair.reduce((n,r)=>n+r[phase][key],0)/pair.length,0)/pairs.length:null;
  const one=filtered.length===1?filtered[0]:null;comparisons[key]={before:one?one.before[key]:mean('before'),after:one?one.after[key]:mean('after')};
 }}
 const available=Object.keys(metricNames).filter(k=>comparisons[k]?.before!=null||comparisons[k]?.after!=null);
 const keys=resultGroup==='feelings'?['happiness','stress','connection']:resultGroup==='heart'?available.filter(k=>!['happiness','stress','connection'].includes(k)):[];
 target.innerHTML=`${!personal&&people.length>1?`<div class="study-tabs participant-picker">${button('Everyone','person',true,'data-person="all"')}${people.map(p=>button(p,'person',true,`data-person="${html(p)}"`)).join('')}</div>`:''}<div class="results-controls"><div class="study-tabs" aria-label="Session">${button('All sessions','sessionResult',true,`data-session="all" aria-pressed="${selectedSession===null}"`)}${[1,2,3].filter(n=>rows.some(r=>r.session===n)).map(n=>button(`Session ${n}`,'sessionResult',true,`data-session="${n}" aria-pressed="${selectedSession===n}"`)).join('')}</div><div class="study-tabs" aria-label="Measures">${['feelings',...(available.some(k=>!['happiness','stress','connection'].includes(k))?['heart']:[]),...(filtered.some(r=>r.before_text||r.after_text)?['words']:[])].map(g=>`<button data-action="resultGroup" data-group="${g}" aria-pressed="${resultGroup===g}">${{feelings:'Feelings',heart:'Heart',words:'Your words'}[g]}</button>`).join('')}</div></div>${resultGroup==='words'?`<div class="words-carousel">${filtered.filter(r=>r.before_text||r.after_text).map(r=>`<article class="words-pair"><p class="study-eyebrow">${personal?'':html(r.participant_id)+' · '}Session ${r.session}</p><div><blockquote><span>Before</span><p>${html(r.before_text||'—')}</p></blockquote><blockquote><span>After</span><p>${html(r.after_text||'—')}</p></blockquote></div></article>`).join('')}</div>`:`<div class="result-cards" tabindex="0" aria-label="Before, after and percentage change">${keys.map(k=>comparisonCard(k,comparisons[k]?.before??null,comparisons[k]?.after??null)).join('')}</div>`}<div class="results-footer"><span class="study-muted">Before → After → +/− % change${filtered.length>1?' · Average across selected sessions':''}</span><div class="study-actions">${personal?button('Next livestream','nextEvent',true):button('Download results','downloadSummary',true)}<a class="study-button" href="index.html">Explore Universal Mind <span aria-hidden="true">→</span></a></div></div>`;
}
function renderAnalysis(target) {
  const a=dataset.analysis;
  target.innerHTML=`<h2>Astra analysis</h2><p class="study-copy">Numbers are calculated by code. Astra drafts the narrative and codes the written responses for researcher review.</p><p class="study-muted">GPT-6 Astra · max reasoning · ${state.preview?'Illustrative staging responses':'Coded pilot data'} · No automatic publication</p>
    ${!state.analysis_configured?'<p class="study-notice">The analysis connection is awaiting its server API key.</p>':!state.owner?'<p class="study-notice">Sign in through Research access to run Astra on these preview responses.</p><a href="study.php?dashboard=1&owner=1">Research access</a>':''}
    <form data-form="analysis"><details open><summary>Review and de-identify the excerpts</summary>${dataset.summary.rows.map((r,i)=>`<div class="study-reading" data-excerpt data-participant="${html(r.participant_id)}" data-session="${r.session}"><h3>${html(r.participant_id)} · Session ${r.session}</h3><label class="study-field">Before<textarea name="before-${i}" maxlength="2000">${html(r.before_text)}</textarea></label><label class="study-field">After<textarea name="after-${i}" maxlength="2000">${html(r.after_text)}</textarea></label></div>`).join('')||'<p>No responses yet.</p>'}</details>
    <label class="study-check"><input name="redaction_confirmed" type="checkbox" required><span>I have reviewed these excerpts and removed names or identifying details before sending them to OpenAI.</span></label>
    <button class="study-button" type="submit" ${!dataset.summary.rows.length||!state.owner||!state.analysis_configured?'disabled':''}>Generate research draft</button><p class="study-muted">This can take a few minutes. The source responses remain unchanged.</p></form>
    <section id="analysis-result">${a?analysisMarkup(a):''}</section>`;
}

function analysisMarkup(a) {
  const r=a.report;
  return `<h2>${a.reviewed_at?'Reviewed report':'Draft · awaiting human review'}</h2><p class="study-muted">${html(a.model)} · ${date(a.generated_at)}</p><p class="study-copy">${html(r.executive_summary)}</p><ul>${r.findings.map(s=>`<li>${html(s)}</li>`).join('')}</ul>
    <h3>Written-response themes</h3>${r.themes.map(t=>`<p><strong>${html(t.participant_id)} · Session ${t.session} · ${html(t.direction)}</strong><br>${html(t.theme)}<br><em>${html(t.evidence)}</em></p>`).join('')}
    <h3>Interpretation</h3><ul>${r.limitations.map(s=>`<li>${html(s)}</li>`).join('')}</ul>${state.owner&&!state.preview&&!a.reviewed_at?button('Mark this report reviewed','approveAnalysis',true,`data-id="${html(a.id)}"`):''}`;
}


function renderParticipants(target){target.innerHTML=`<div class="study-actions">${state.preview?'':button('Create participant invitation','invite')}</div><div id="new-invitation"></div><div class="participant-cards">${dataset.participants.map(p=>`<article><h2>${html(p.id)}</h2><p>${p.sessions.filter(s=>s.state==='complete').length} / 3 complete</p><strong>${money(p.earned_aud)}</strong>${state.preview||p.earned_aud!==100?'':p.payments.length?'<p>Paid</p>':button('Record $100 paid','payment',true,`data-id="${html(p.id)}"`)}</article>`).join('')}</div>${!state.preview?button('Create stakeholder access','stakeholderInvite',true):''}<div id="stakeholder-invitation"></div>`;}
function renderPreparation(target){const c=dataset.config;target.innerHTML=`<form data-form="config" class="study-setup"><h2>Livestream dates</h2>${c.events.map((e,i)=>`<label class="study-field">${e.label}<input name="event-${i}" type="datetime-local" value="${e.starts_at?localDate(e.starts_at):''}"></label>`).join('')}<p class="study-muted">${html(Intl.DateTimeFormat().resolvedOptions().timeZone)}</p><label class="study-field">Study video · Stream ID<input name="stream_uid" value="${html(c.stream_uid)}" maxlength="32"></label><label class="study-field">Video title<input name="video_title" value="${html(c.video_title)}" maxlength="120"></label><label class="study-field">Study contact<input type="email" name="contact_email" value="${html(c.contact_email)}"></label><label class="study-field">Data retention · days<input type="number" name="retention_days" min="1" max="3650" value="${c.retention_days||''}"></label>${[['bp_active','BP access activated · one-minute scans'],['shen_verified','Heart Check verified'],['experience_verified','Combined ten-minute experience verified'],['materials_approved','Participant materials approved'],['open','Open the study']].map(([k,t])=>`<label class="study-check"><input type="checkbox" name="${k}" ${c[k]?'checked':''}><span>${t}</span></label>`).join('')}<button class="study-button" type="submit" ${state.preview?'disabled':''}>Save</button></form>`;}
function localDate(value){const d=new Date(value);return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function startExposure(){setPage('experience');app.innerHTML=`<div class="study-exposure"><iframe title="modul8 infinity study experience" src="study-experience.php?study_experience=1" allow="autoplay" sandbox="allow-scripts allow-same-origin"></iframe><div class="study-exposure-bar"><span data-study-clock>10:00</span>${state.preview?button('After check','previewExperience',true):''}${button('Stop','stop',true)}</div></div>`;exposure={sessionId:currentSession().id,frame:app.querySelector('iframe'),pending:false};}
document.addEventListener('click',async event=>{
 const control=event.target.closest('[data-action]');if(!control||busy)return;const action=control.dataset.action;
 try{busy=true;control.disabled=true;
 if(action==='preview'){await request('preview');view='journey';await refresh();}
 else if(action==='logout'){await request('logout');view='journey';await refresh();}
 else if(action==='join'){await enterEvent();}
 else if(action==='nextEvent'){view='event';await render();}
 else if(action==='results'){view='dashboard';tab='personal';selectedSession=null;await render();}
 else if(action==='missingVitals'){await request('vitals',{session_id:currentSession().id,values:{unavailable_reason:state.preview?'preview':'declined'}});await refresh();}
 else if(action==='exposure'){await startExposure();}
 else if(action==='previewExperience'){exposure?.frame.contentWindow.postMessage({type:'study-stop'},location.origin);await request('preview.experience',{session_id:currentSession().id});exposure=null;await refresh();}
 else if(action==='stop'){exposure?.frame.contentWindow.postMessage({type:'study-stop'},location.origin);await request('session.stop',{session_id:currentSession().id});exposure=null;state=await request();renderStopped();}
 else if(action==='privacy'){document.querySelector('#study-privacy').showModal();}
 else if(action==='closePrivacy'){document.querySelector('#study-privacy').close();}
 else if(action==='tab'){tab=control.dataset.tab;await renderDashboard();}
 else if(action==='person'){selectedPerson=control.dataset.person;await renderDashboard();}
 else if(action==='sessionResult'){selectedSession=control.dataset.session==='all'?null:Number(control.dataset.session);await renderDashboard();}
 else if(action==='resultGroup'){resultGroup=control.dataset.group;await renderDashboard();}
 else if(action==='downloadSummary'){download(dataset.summary,'universal-mind-study-results.json');}
 else if(action==='invite'||action==='stakeholderInvite'){const result=await request(action==='invite'?'admin.invite':'admin.stakeholder');document.querySelector(action==='invite'?'#new-invitation':'#stakeholder-invitation').innerHTML=`<p>${html(result.id||'Stakeholder')}</p><code class="study-code">${html(result.code)}</code>`;}
 else if(action==='payment'){await request('admin.payment',{participant_id:control.dataset.id,amount_aud:100});await renderDashboard();}
 else if(action==='approveAnalysis'){await request('admin.approve_analysis',{analysis_id:control.dataset.id});await renderDashboard();}
 }catch(error){notice(error.message);}finally{busy=false;control.disabled=false;}
});
document.addEventListener('change',event=>{if(event.target.matches('.study-rating input')){const form=event.target.form;form.querySelector('[data-rating-output]').innerHTML=`${Number(event.target.value)*10}<small>%</small>`;form.querySelector('[type="submit"]').disabled=false;form.dataset.rating=event.target.value;}});
document.addEventListener('submit',async event=>{
 const form=event.target.closest('[data-form]');if(!form)return;event.preventDefault();if(busy)return;const fields=new FormData(form),submit=form.querySelector('[type="submit"]');
 try{busy=true;submit.disabled=true;
 if(form.dataset.form==='login'){await request('login',{code:fields.get('code')});view='journey';state=await request();if(state.stakeholder)view='dashboard';await render();}
 else if(form.dataset.form==='consent'){await request('consent',{version:state.protocol.version,adult_woman:fields.has('participation'),participation:fields.has('participation'),equipment:fields.has('equipment'),research_data:fields.has('research_data')});await refresh();}
 else if(form.dataset.form==='answer'){const q=form.dataset.question;await request('answer',{session_id:currentSession().id,question:q,value:q==='text'?fields.get('text'):Number(fields.get('value'))});await refresh();}
 else if(form.dataset.form==='adminLogin'){const response=await fetch('api/quantum-tree-settings.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password:fields.get('password')})});const r=await response.json();if(!response.ok)throw new Error(r.error||'Sign-in failed.');await refresh();}
 else if(form.dataset.form==='config'){await request('admin.config',{stream_uid:fields.get('stream_uid'),video_title:fields.get('video_title'),contact_email:fields.get('contact_email'),retention_days:fields.get('retention_days')?Number(fields.get('retention_days')):null,events:[0,1,2].map(i=>({starts_at:fields.get(`event-${i}`)?new Date(fields.get(`event-${i}`)).toISOString():null})),...Object.fromEntries(['open','bp_active','shen_verified','experience_verified','materials_approved'].map(k=>[k,fields.has(k)]))});await refresh();notice('Saved.');}
 else if(form.dataset.form==='analysis'){notice('Preparing research analysis…');clearTimeout(statusTimer);const excerpts=[...form.querySelectorAll('[data-excerpt]')].map(el=>({participant_id:el.dataset.participant,session:Number(el.dataset.session),before:el.querySelectorAll('textarea')[0].value,after:el.querySelectorAll('textarea')[1].value}));const r=await request(state.preview?'preview.analysis':'admin.analysis',{excerpts,redaction_confirmed:fields.has('redaction_confirmed')});document.querySelector('#analysis-result').innerHTML=analysisMarkup(r.analysis);notice('Ready for review.');}
 }catch(error){notice(error.message);}finally{busy=false;submit.disabled=false;}
});
window.addEventListener('message',async event=>{
 if(!exposure||event.origin!==location.origin||event.source!==exposure.frame.contentWindow)return;
 if(event.data?.type==='study-ready'){exposure.frame.contentWindow.postMessage({type:'study-config',uid:state.config.stream_uid},location.origin);return;}
 if(event.data?.type==='study-error'){notice(event.data.message);return;}
 if(event.data?.type!=='study-tick'||exposure.pending)return;const active=exposure;active.pending=true;
 try{const r=await request('exposure.tick',{...event.data.values,session_id:active.sessionId});if(exposure!==active)return;const remaining=Math.max(0,Math.ceil(600-(event.data.values.event_elapsed??r.exposure_seconds)));const clock=document.querySelector('[data-study-clock]');if(clock)clock.textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;if(r.state==='after_vitals'){active.frame.contentWindow.postMessage({type:'study-stop'},location.origin);exposure=null;await refresh();}}
 catch(error){if(exposure===active){active.frame.contentWindow.postMessage({type:'study-pause'},location.origin);notice(error.message);}}finally{active.pending=false;}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)exposure?.frame.contentWindow.postMessage({type:'study-pause'},location.origin);});
window.addEventListener('pagehide',()=>exposure?.frame.contentWindow.postMessage({type:'study-stop'},location.origin));
refresh().catch(error=>{app.innerHTML='<p>Please refresh to reopen your study.</p>';notice(error.message);});
