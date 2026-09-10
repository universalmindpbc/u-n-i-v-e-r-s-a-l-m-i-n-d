const app = document.querySelector('#study-app');
const status = document.querySelector('#study-status');
let state = null;
let view = new URLSearchParams(location.search).has('dashboard') ? 'dashboard' : 'home';
let tab = 'overview';
let dataset = null;
let busy = false;
let selectedMetric = 'happiness';
let exposure = null;
let statusTimer;
const metricNames = {
  happiness: ['Happiness', 'points'], stress: ['Stress', 'points'], connection: ['Connection', 'points'],
  heart_rate_bpm: ['Heart rate', 'bpm'], hrv_sdnn_ms: ['HRV · SDNN', 'ms'], hrv_lnrmssd_ms: ['HRV · lnRMSSD', 'ln(ms)'],
  systolic_blood_pressure_mmhg: ['Systolic BP', 'mmHg'], diastolic_blood_pressure_mmhg: ['Diastolic BP', 'mmHg'],
  hrv_power_0_1_ms2: ['HRV power around 0.1 Hz', 'ms²'],
};
const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n, signed = false) => n === null || n === undefined || !Number.isFinite(n) ? '—' : `${signed && n > 0 ? '+' : ''}${Number(n.toFixed(2))}`;
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:2}).format(n || 0);
const date = text => text ? new Date(text).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'}) : '—';
const button = (label,action,secondary=false,extra='') => `<button type="button" class="study-button${secondary?' secondary':''}" data-action="${action}" ${extra}>${html(label)}</button>`;
const currentSession = () => state?.participant?.sessions.find(s => !['complete','stopped'].includes(s.state));

export async function request(action, body = {}) {
  const response = await fetch('api/study.php',{method:action?'POST':'GET',credentials:'same-origin',cache:'no-store',
    headers: action ? {'Content-Type':'application/json','X-Study-CSRF':state.csrf} : {},
    body:action?JSON.stringify({action,request_id:crypto.randomUUID(),...body}):undefined});
  const payload = await response.json().catch(()=>({error:'The study service did not respond. Please try again.'}));
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

function notice(text) { clearTimeout(statusTimer); status.textContent = text; statusTimer = setTimeout(()=>{status.textContent='';},12000); }
function previewNote() { return state.preview ? '<p class="study-notice">Staging walkthrough · Responses are separate from the pilot. No payment or research exposure is recorded.</p>' : ''; }
function setPage(mode) {
  document.body.dataset.studyState = mode;
  document.querySelector('.study-header').hidden = mode === 'login';
  document.querySelector('[data-preview-badge]').hidden = !state.preview;
  app.setAttribute('aria-busy','false');
}
async function refresh() { state = await request(); await render(); }
async function render() {
  if (view === 'dashboard') { await renderDashboard(); return; }
  if (!state.participant) { renderLogin(); return; }
  if (!state.participant.consent && !state.participant.withdrawn) { renderBriefing(); return; }
  const session = currentSession();
  if (session && view !== 'home') { renderStep(session); return; }
  renderHome();
}

function renderLogin() {
  setPage('login');
  app.innerHTML = `<section class="access-shell"><img class="access-flower" src="a s s e t s/Universal Mind [ I o H ] Logo.PNG" alt="">
    <h1 class="access-title">u n i v e r s a l&nbsp;&nbsp;m i n d</h1>
    <form class="access-form" data-form="login"><label class="access-label" for="study-code">study access code</label>
    <input class="access-input" id="study-code" name="code" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" required maxlength="100">
    <button class="access-submit" type="submit">enter</button></form>
    <div class="study-login-links">${state.preview_available?'<button type="button" data-action="preview">Preview the study</button>':''}
    <a href="study.php?dashboard=1">Research dashboard</a><span class="study-muted">Invitation-only · 10 participants</span></div></section>`;
}

function renderBriefing() {
  setPage('briefing'); const p = state.protocol;
  app.innerHTML = `${previewNote()}<p class="study-eyebrow">Welcome · ${html(state.participant.id)}</p><h1>A moment, together.</h1>
    <p class="study-copy" data-briefing>${html(p.briefing)}</p><p class="study-copy" data-requirements>${html(p.requirements)}</p>
    <p class="study-muted">Three approximately 15-minute sessions, plus approximately 15 minutes of onboarding. A$100 total for your time.</p>
    <details><summary>Participant information and research data</summary>
      <p>${html(p.eligibility)} This is experimental research; benefit is not guaranteed. You do not need to describe traumatic events. You can stop if you feel uncomfortable, tired or distressed.</p>
      <p>We collect your before/after camera-derived pulse measurements, your selected happiness, stress and connection ratings, your written responses, and session timing and interruptions. Camera video is processed on your device and is not recorded by this study. The microphone is not used.</p>
      <p>Your records use a participant code. The organiser keeps any identity/payment link separately. Authorised researchers can review coded records; stakeholders see aggregate findings. Small groups and free text can still be recognisable, so avoid names and identifying details.</p>
      <p>With your agreement, researchers review and remove identifying details from excerpts before sending them to OpenAI for GPT-assisted analysis. Research reports receive human review. This study does not provide diagnosis, treatment or a continuously monitored support service.</p>
      <p>${state.config.retention_days?`Research responses are retained for ${state.config.retention_days} days from the last recorded session.`:'The organiser will confirm the data retention period before enrolment opens.'} You can export your records or withdraw through My sessions. You can request removal of your responses; findings already released in aggregate may not be retractable.</p>
      <p>Onboarding recognises A$25 of your time, plus A$25 for each completed session. If you stop early, time spent in that session is recognised at A$100/hour, up to A$25. Payment is independent of your answers and measurement availability. Payments are arranged by the organiser.</p>
      <p>For the ten-minute experience, site navigation is tucked away. Stop remains available. After the brief post-session check, the site is yours to explore.</p>
      <p>${state.config.contact_email?`Study contact: <a href="mailto:${html(state.config.contact_email)}">${html(state.config.contact_email)}</a>.`:'A study contact will be provided before enrolment opens.'} If you need urgent help, use your local emergency or crisis support service.</p>
    </details>
    <form data-form="consent">
      <label class="study-check"><input name="adult_woman" type="checkbox" required><span>I am a woman aged 18 or over.</span></label>
      <label class="study-check"><input name="equipment" type="checkbox" required><span>I have the equipment and time described above.</span></label>
      <label class="study-check"><input name="participation" type="checkbox" required><span>I have read the participant information and freely agree to take part. I can stop at any time.</span></label>
      <label class="study-check"><input name="research_data" type="checkbox" required><span>I agree to the research use of my coded measurements and responses, including the explained AI-assisted analysis.</span></label>
      ${!state.preview && !state.readiness.open?'<p class="study-notice">The study is being prepared. Enrolment will open when your organiser confirms it is ready.</p>':''}
      <button class="study-button" type="submit" ${!state.preview&&!state.readiness.open?'disabled':''}>${state.preview?'Continue walkthrough':'Agree and continue'}</button>
    </form>`;
}

function renderHome() {
  setPage('home'); const p=state.participant; const active=currentSession();
  const paid=p.payments.reduce((sum,item)=>sum+item.amount_aud,0);
  app.innerHTML = `${previewNote()}<p class="study-eyebrow">${html(p.id)} · ${p.sessions.filter(s=>s.state==='complete').length} of 3 sessions complete</p>
    <h1>${p.withdrawn?'Thank you for your time.':'Your week, together.'}</h1>
    <p class="study-copy">${p.withdrawn?'You have withdrawn. Your saved payment record is available below.':'Choose three moments over one week. Morning, evening, or late night if you are normally awake then. Use the same laptop and speaker where possible.'}</p>
    <div class="study-session-list">${[1,2,3].map(n=>{const s=p.sessions[n-1];return `<div class="study-session"><p class="study-eyebrow">Session ${n}</p><strong>${s?({complete:'Complete',stopped:'Stopped'}[s.state]||'In progress'):'To come'}</strong><p class="study-muted">${s?date(s.created_at):'Approximately 15 minutes'}</p></div>`;}).join('')}</div>
    ${!p.withdrawn&&(active||p.sessions.length<3)?active?button('Continue your session','resume'):`<form data-form="sessionStart"><label class="study-field">This session’s time<select name="window"><option value="morning">Morning / sunrise</option><option value="evening">Evening / sunset</option><option value="late_night">Late night / midnight</option><option value="daytime">Another daytime moment</option></select></label><button class="study-button" type="submit">Start session ${p.sessions.length+1}</button></form>`:''}
    <h2>Your participation</h2><div class="study-reward"><img src="a s s e t s/wallet-rewards-card.png" alt="Universal Mind rewards card"><div><span class="study-muted">${state.preview?'Example participation record':'Time recognised'}</span><strong>${money(p.earned_aud)} <small class="study-muted">of A$100</small></strong><p class="study-muted">${money(paid)} recorded as paid · ${money(Math.max(0,p.earned_aud-paid))} awaiting payment</p></div></div>
    <div class="study-actions">${button('Your results','results',true)}${button('Export your records','export',true)}<a class="study-button secondary" href="index.html">Explore Universal Mind</a></div>
    ${!p.withdrawn?`<details><summary>Stop participating or remove your responses</summary><p>Withdrawal does not depend on how you felt or whether your measurements improved. The organiser retains a minimal participation/payment record.</p><label class="study-check"><input type="checkbox" id="erase-responses"><span>Also remove my measurement and written-response data.</span></label>${button('Withdraw from the study','withdraw',true)}</details>`:''}`;
}

function progress(session) {
  const steps=['before_vitals','before_report','experience','after_vitals','after_report'];
  return `<p class="study-eyebrow">Session ${session.number} · ${steps.indexOf(session.state)+1} of 5</p><div class="study-progress" aria-label="Study progress">${steps.map((s,i)=>`<span class="${i<=steps.indexOf(session.state)?'done':''}"></span>`).join('')}</div>`;
}

function renderStep(session) {
  setPage('session');
  const after=session.state.startsWith('after');
  if (session.state.endsWith('vitals')) {
    app.innerHTML=`${previewNote()}${progress(session)}<h1>${after?'One more Heart Check.':'Before we begin.'}</h1>
      <p class="study-copy">Sit comfortably, with your face evenly lit. Keep still and breathe naturally while the camera takes a one-minute reading.</p>
      <p class="study-muted">Heart rate · HRV · Blood pressure · Exploratory HRV power around 0.1 Hz</p>
      <p class="study-muted">Readings unavailable under the current Shen licence remain empty. They are never replaced with zero or estimated from heart rate.</p>
      <div class="study-actions"><a class="study-button" href="research.php?study=1">Start Heart Check</a>${state.preview?button('Continue preview without a scan','previewVitals',true):button('Continue without a reading','missingVitals',true)}</div>
      <div class="study-actions">${button('Stop session','stop',true)}</div>`;
    return;
  }
  if (session.state.endsWith('report')) {
    app.innerHTML=`${previewNote()}${progress(session)}<h1>${after?'How are you feeling now?':'How are you feeling?'}</h1>
      <form data-form="report">${rating('happiness','How happy do you feel right now?','1 · Lowest happiness','10 · Highest happiness',true)}
        ${rating('stress','How stressed do you feel right now?','1 · Not at all stressed','10 · Extremely stressed')}
        ${rating('connection','How connected to other people do you feel right now?','1 · Not at all connected','10 · Very connected')}
        <label class="study-field" for="self-report">How are you feeling?<textarea id="self-report" name="text" maxlength="2000" placeholder="In your own words. Share as much or as little as you like."></textarea></label>
        <p class="study-muted">Please leave out names or identifying details. There is no right or wrong answer.</p>
        <div class="study-actions"><button class="study-button" type="submit">${after?'Finish session':'Continue'}</button>${button('Stop session','stop',true)}</div>
      </form>`;
    return;
  }
  app.innerHTML=`${previewNote()}${progress(session)}<h1>Ten minutes, together.</h1>
    <p class="study-copy">The M8 experience brings together your study video, Quantum Tree, the existing 111 Hz isochronic tone with a 444 Hz carrier, and the sub-audible mantra.</p>
    <p class="study-muted">Navigation returns after your post-session check. You can stop at any time.</p>
    ${!state.config.stream_uid?'<p class="study-notice">Your Empire of the Sun study video is awaiting upload.</p>':''}
    <div class="study-actions">${state.config.stream_uid&&!state.preview?button('Begin ten-minute experience','exposure'):''}${state.preview?button('Continue walkthrough to the after check','previewExperience'):''}${button('Stop session','stop',true)}</div>`;
}

function rating(name,title,left,right,faces=false) {
  // These windows display Ben's actual reference, preserving all ten supplied faces and their order.
  const centres=[110,204,299,393,487,582,650,735,813,894];
  return `<fieldset><legend>${html(title)}</legend><div class="study-rating">${Array.from({length:10},(_,i)=>`<label><input type="radio" name="${name}" value="${i+1}" required aria-label="${name==='happiness'?'Happiness':html(name)} ${i+1} out of 10">${faces?`<span class="study-emoji" aria-hidden="true" style="background-position:${29-centres[i]}px -222px"></span>`:''}<span class="study-rating-number">${i+1}</span></label>`).join('')}</div><div class="study-scale-ends"><span>${html(left)}</span><span>${html(right)}</span></div></fieldset>`;
}

async function renderDashboard() {
  setPage('dashboard');
  const personal=tab==='personal';
  if (!state.owner&&(new URLSearchParams(location.search).has('owner')||(!state.preview&&!personal&&!state.stakeholder))) {
    app.innerHTML=`<p class="study-eyebrow">Research access</p><h1>The pilot, in view.</h1><p class="study-copy">Sign in with your existing Universal Mind owner password.</p><form data-form="adminLogin"><label class="study-field">Password<input name="password" type="password" autocomplete="current-password" required></label><button class="study-button" type="submit">Sign in</button></form><div class="study-actions"><a href="study.php">Participant entrance</a></div>`;
    return;
  }
  dataset=await request(state.owner&&!state.preview&&!personal?'admin.dataset':state.stakeholder?'stakeholder.dataset':'summary');
  const s=dataset.summary;
  app.innerHTML=`${previewNote()}<p class="study-eyebrow">${personal?'Your results':'Research dashboard'} · ${html(state.protocol.title)}</p><h1>${personal?'Your moments.':'Ten people. Thirty moments.'}</h1>
    <p class="study-muted">Single-arm feasibility pilot · ${s.participants} ${s.participants===1?'participant':'participants'} currently recorded · Three sessions each</p>
    ${!personal&&!state.stakeholder?`<div class="study-tabs" role="group" aria-label="Dashboard view">${['overview','participants','preparation','analysis'].map(t=>`<button type="button" data-action="tab" data-tab="${t}" aria-pressed="${tab===t}">${{overview:'Overview',participants:'Participants',preparation:'Preparation',analysis:'Astra analysis'}[t]}</button>`).join('')}</div>`:''}
    <div id="dashboard-content"></div>`;
  const target=document.querySelector('#dashboard-content');
  if(tab==='participants'&&!personal) { renderParticipants(target); return; }
  if(tab==='preparation'&&!personal) { renderPreparation(target); return; }
  if(tab==='analysis'&&!personal) { renderAnalysis(target); return; }
  target.innerHTML=overview(s,personal);
}

function overview(s,personal) {
  const d=s.happiness_distribution; const total=Object.values(d).reduce((a,b)=>a+b,0);
  const colours=['#bfa8e7','#c7b79d','#dc987b','#5f5b65']; let position=0;
  const stops=Object.values(d).map((n,i)=>{const start=position;position+=total?n/total*100:0;return `${colours[i]} ${start}% ${position}%`;}).join(',');
  const summary=dataset.analysis?.reviewed_at?dataset.analysis.report.executive_summary:
    s.completed_sessions?`${s.completed_sessions} sessions are complete. Paired changes below describe the recorded experience; they do not establish treatment effects. ${s.stopped_sessions} sessions were stopped early.`:'No completed sessions yet. The dashboard will show the pilot’s actual observations as they arrive.';
  const stat=s.statistics[selectedMetric];
  return `<h2>Executive summary</h2><p class="study-copy">${html(summary)}</p>
    <div class="study-metrics">${[['Completed',`${s.completed_sessions} / ${s.planned_sessions}`],['Stopped',s.stopped_sessions],['Participants',s.participants],['Withdrawn',s.withdrawn_participants]].map(([label,value])=>`<div class="study-metric"><span class="study-muted">${label}</span><strong>${value}</strong></div>`).join('')}</div>
    <ul class="study-muted"><li>Before and after values are paired within the same person and session.</li><li>Missing measurements are excluded separately for each metric; the available participant count is shown.</li><li>Positive, unchanged and negative responses all remain visible. Happiness is coded from 1 to 10 in the supplied emoji order.</li></ul>
    <div class="study-chart-row"><div><h2>Happiness across sessions</h2><div class="study-donut" role="img" aria-label="${d.increased} increased, ${d.unchanged} unchanged, ${d.decreased} decreased, ${d.unavailable} unavailable" style="${total?`background:conic-gradient(${stops})`:''}"><span>${total}</span></div><div class="study-legend">${Object.entries(d).map(([key,n],i)=>`<span><i style="background:${colours[i]}"></i>${key} ${n}</span>`).join('')}</div></div>
    <div><label class="study-field">Measure<select data-metric>${Object.entries(metricNames).map(([k,[n,u]])=>`<option value="${k}" ${k===selectedMetric?'selected':''}>${n} (${u})</option>`).join('')}</select></label>${pairedChart(s.rows||[],selectedMetric)}<p class="study-muted">${selectedMetric==='hrv_power_0_1_ms2'?'Exploratory one-minute power in 0.085–0.115 Hz. Pulse intervals must pass the continuity check.':'Each line is one paired session. Unavailable pairs are omitted.'}</p></div></div>
    <h2>Change per participant</h2><p class="study-muted">${html(s.analysis_unit)}</p><div class="study-table-wrap"><table><thead><tr><th>Measure</th><th>Available n</th><th>Minimum</th><th>Median</th><th>Mean</th><th>Maximum</th></tr></thead><tbody>${Object.entries(s.statistics).map(([key,v])=>`<tr><td>${html(metricNames[key]?.[0]||key)} <small>(${html(metricNames[key]?.[1])})</small></td><td>${v.n}</td>${['min','median','mean','max'].map(k=>`<td class="numeric">${fmt(v[k],true)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${s.rows?`<h2>Every session · ${html(metricNames[selectedMetric][0])}</h2><div class="study-table-wrap"><table><thead><tr><th>Participant</th><th>Session</th><th>State</th><th>Before</th><th>After</th><th>Change (${html(metricNames[selectedMetric][1])})</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td>${html(r.participant_id)}</td><td>${r.session}</td><td>${html(r.state.replaceAll('_',' '))}</td><td class="numeric">${fmt(r.before[selectedMetric])}</td><td class="numeric">${fmt(r.after[selectedMetric])}</td><td class="numeric">${fmt(r.changes[selectedMetric],true)}</td></tr>`).join('')||'<tr><td colspan="6">No sessions recorded.</td></tr>'}</tbody></table></div>`:''}
    ${s.rows?`<details><summary>Written responses before and after</summary>${s.rows.map(r=>`<article class="study-reading"><h3>${html(r.participant_id)} · Session ${r.session}</h3><p><strong>Before:</strong> ${html(r.before_text||'No written response')}</p><p><strong>After:</strong> ${html(r.after_text||'No written response')}</p></article>`).join('')}</details>`:''}
    <div class="study-actions">${button('Download results','downloadSummary',true)}${personal?button('Back to my sessions','home',true):''}</div>`;
}

function pairedChart(rows,metric) {
  const pairs=rows.filter(r=>r.before[metric]!==null&&r.after[metric]!==null);
  if(!pairs.length) return '<p class="study-muted">Paired measurements will appear here.</p>';
  const values=pairs.flatMap(r=>[r.before[metric],r.after[metric]]); let lo=Math.min(...values),hi=Math.max(...values);
  const pad=(hi-lo||2)*.15;lo-=pad;hi+=pad; const y=v=>210-(v-lo)/(hi-lo)*160;
  return `<svg class="study-chart" viewBox="0 0 470 270" role="img" aria-label="Paired before and after ${html(metricNames[metric][0])} values"><text x="15" y="20">${html(metricNames[metric][1])}</text><line x1="65" y1="35" x2="65" y2="220" stroke="#ffffff30"/>${[lo,(lo+hi)/2,hi].map(v=>`<text x="55" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text><line x1="65" y1="${y(v)}" x2="450" y2="${y(v)}" stroke="#ffffff16"/>`).join('')}${pairs.map(r=>`<g><title>${html(r.participant_id)} session ${r.session}: ${fmt(r.before[metric])} to ${fmt(r.after[metric])}</title><line x1="130" y1="${y(r.before[metric])}" x2="375" y2="${y(r.after[metric])}" stroke="#ceb2e8" stroke-opacity=".6" stroke-width="1.8"/><circle cx="130" cy="${y(r.before[metric])}" r="4" fill="#c4b7aa"/><circle cx="375" cy="${y(r.after[metric])}" r="4" fill="#e6ccfa"/></g>`).join('')}<text x="130" y="250" text-anchor="middle">Before</text><text x="375" y="250" text-anchor="middle">After</text></svg>`;
}

function renderParticipants(target) {
  target.innerHTML=`<h2>Participant access</h2><p class="study-muted">Each access code belongs to one participant. Keep the identity-to-code list separately; share codes privately. Invitation creation does not send a message.</p>
    ${state.preview?'<p class="study-notice">The walkthrough uses a separate preview account. Owner sign-in is required to create study invitations.</p>':button('Create participant invitation','invite')}
    <div id="new-invitation"></div><div class="study-table-wrap"><table><thead><tr><th>Code</th><th>Consent</th><th>Sessions</th><th>Recognised</th><th>Paid</th><th>Record payment</th></tr></thead><tbody>${dataset.participants.map(p=>`<tr><td>${html(p.id)}</td><td>${p.withdrawn?'Withdrawn':p.consent?'Agreed':'Pending'}</td><td>${p.sessions.filter(s=>s.state==='complete').length} / 3</td><td>${money(p.earned_aud)}</td><td>${money(p.payments.reduce((n,v)=>n+v.amount_aud,0))}</td><td>${state.preview?'Preview only':`<form data-form="payment" data-id="${html(p.id)}"><input type="number" step=".01" min=".01" max="100" name="amount" aria-label="Amount actually paid in AUD" required style="width:70px"><button type="submit">Record paid</button></form>`}</td></tr>`).join('')}</tbody></table></div>
    ${!state.preview?`<h2>Stakeholder access</h2><p class="study-muted">A separate access code opens aggregate findings only. It cannot show individual records, excerpts, invitations or payment details.</p>${button('Create stakeholder access','stakeholderInvite',true)}<div id="stakeholder-invitation"></div>`:''}`;
}

function renderPreparation(target) {
  const c=dataset.config;
  target.innerHTML=`<h2>Prepare the pilot</h2><p class="study-muted">${dataset.readiness.ready?'Preparation complete.':`Still required: ${html(dataset.readiness.missing.join(' · '))}`}</p>
    <form data-form="config"><label class="study-field">Uploaded study video · Cloudflare Stream ID<input name="stream_uid" value="${html(c.stream_uid)}" maxlength="32" placeholder="Available after the Empire of the Sun video is uploaded"></label>
    <label class="study-field">Video title<input name="video_title" value="${html(c.video_title)}" maxlength="120"></label>
    <label class="study-field">Study contact email<input name="contact_email" type="email" value="${html(c.contact_email)}"></label>
    <label class="study-field">Research-response retention period · days<input name="retention_days" type="number" min="1" max="3650" value="${c.retention_days||''}"></label>
    <label class="study-check"><input name="shen_verified" type="checkbox" ${c.shen_verified?'checked':''}><span>The trial licence and real 60-second BP/HRV results have been verified.</span></label>
    <label class="study-check"><input name="materials_approved" type="checkbox" ${c.materials_approved?'checked':''}><span>Participant information, eligibility, research review and the support procedure are ready.</span></label>
    <label class="study-check"><input name="open" type="checkbox" ${c.open?'checked':''}><span>Open enrolment for the invited participants.</span></label>
    <button class="study-button" type="submit" ${state.preview?'disabled':''}>Save preparation</button></form>
    <details><summary>Fixed study configuration</summary><p>M8 · Quantum Tree · existing 111 Hz isochronic tone with a 444 Hz carrier · sub-audible mantra. Three sessions, 600 seconds of video each. One-minute Shen scans before and after.</p><p>${html(state.protocol.analysis.hrv_psd)}</p><p>Sound uses the existing Inspiration / Gamma profile and its existing lane weights. No new generator is introduced. The exact delivered configuration and interruptions are recorded.</p></details>`;
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

function download(value,name) { const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function startExposure() {
  const s=currentSession();
  app.innerHTML=`<div class="study-exposure"><iframe title="M8 study experience" src="index.html?study_experience=1" allow="autoplay" sandbox="allow-scripts allow-same-origin"></iframe><div class="study-exposure-bar"><span data-study-clock>Preparing your experience…</span>${button('Stop session','stop',true)}</div></div>`;
  exposure={sessionId:s.id,frame:app.querySelector('iframe')};
}

document.addEventListener('click',async event=>{
  const control=event.target.closest('[data-action]'); if(!control||busy)return;
  const action=control.dataset.action;
  try {
    busy=true;control.disabled=true;
    if(action==='preview'){await request('preview');view='home';await refresh();}
    else if(action==='logout'){if(state.owner)await fetch('api/quantum-tree-settings.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});await request('logout');view='home';tab='overview';await refresh();}
    else if(action==='home'){if(exposure)return;view='home';await render();}
    else if(action==='resume'){view='session';await render();}
    else if(action==='results'){view='dashboard';tab='personal';await render();}
    else if(action==='tab'){tab=control.dataset.tab;await renderDashboard();}
    else if(action==='previewVitals'||action==='missingVitals'){await request('vitals',{session_id:currentSession().id,values:{unavailable_reason:state.preview?'preview':'declined'}});view='session';await refresh();}
    else if(action==='previewExperience'){await request('preview.experience',{session_id:currentSession().id});view='session';await refresh();}
    else if(action==='stop'){exposure?.frame.contentWindow.postMessage({type:'study-stop'},location.origin);await request('session.stop',{session_id:currentSession().id});exposure=null;view='home';await refresh();}
    else if(action==='withdraw'){await request('withdraw',{erase_responses:document.querySelector('#erase-responses').checked});view='home';await refresh();}
    else if(action==='export'){download(await request('export'),`universal-mind-${state.participant.id}.json`);}
    else if(action==='downloadSummary'){download(dataset.summary,'universal-mind-pilot-results.json');}
    else if(action==='invite'){const r=await request('admin.invite');document.querySelector('#new-invitation').innerHTML=`<p>${html(r.id)} · Save this access code now; it is shown once.</p><code class="study-code">${html(r.code)}</code>`;}
    else if(action==='stakeholderInvite'){const r=await request('admin.stakeholder');document.querySelector('#stakeholder-invitation').innerHTML=`<p>Aggregate-only access · Save this code now.</p><code class="study-code">${html(r.code)}</code>`;}
    else if(action==='approveAnalysis'){await request('admin.approve_analysis',{analysis_id:control.dataset.id});await renderDashboard();}
    else if(action==='exposure'){await startExposure();}
  }catch(error){notice(error.message);}finally{busy=false;control.disabled=false;}
});

document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-form]');if(!form)return;event.preventDefault();if(busy)return;
  const fields=new FormData(form);const submit=form.querySelector('[type="submit"]');
  try{
    busy=true;submit.disabled=true;
    if(form.dataset.form==='login'){await request('login',{code:fields.get('code')});view='home';await refresh();if(state.stakeholder){view='dashboard';await render();}}
    else if(form.dataset.form==='consent'){await request('consent',{version:state.protocol.version,...Object.fromEntries(['adult_woman','equipment','participation','research_data'].map(k=>[k,fields.has(k)]))});view='home';await refresh();}
    else if(form.dataset.form==='sessionStart'){await request('session.start',{window:fields.get('window'),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});view='session';await refresh();}
    else if(form.dataset.form==='report'){await request('report',{session_id:currentSession().id,happiness:Number(fields.get('happiness')),stress:Number(fields.get('stress')),connection:Number(fields.get('connection')),text:fields.get('text')});view='session';await refresh();}
    else if(form.dataset.form==='adminLogin'){
      const response=await fetch('api/quantum-tree-settings.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password:fields.get('password')})});
      const r=await response.json();if(!response.ok)throw new Error(r.error||'Sign-in failed.');await refresh();
    }
    else if(form.dataset.form==='config'){await request('admin.config',{stream_uid:fields.get('stream_uid'),video_title:fields.get('video_title'),contact_email:fields.get('contact_email'),retention_days:fields.get('retention_days')?Number(fields.get('retention_days')):null,...Object.fromEntries(['open','shen_verified','materials_approved'].map(k=>[k,fields.has(k)]))});await refresh();notice('Study preparation saved.');}
    else if(form.dataset.form==='payment'){await request('admin.payment',{participant_id:form.dataset.id,amount_aud:Number(fields.get('amount'))});await renderDashboard();notice('Payment recorded.');}
    else if(form.dataset.form==='analysis'){
      notice('Astra is preparing the research draft…');clearTimeout(statusTimer);
      const excerpts=[...form.querySelectorAll('[data-excerpt]')].map(el=>({participant_id:el.dataset.participant,session:Number(el.dataset.session),before:el.querySelectorAll('textarea')[0].value,after:el.querySelectorAll('textarea')[1].value}));
      const r=await request(state.preview?'preview.analysis':'admin.analysis',{excerpts,redaction_confirmed:fields.has('redaction_confirmed')});
      document.querySelector('#analysis-result').innerHTML=analysisMarkup(r.analysis);notice('Astra draft ready for review.');
    }
  }catch(error){notice(error.message);}finally{busy=false;submit.disabled=false;}
});
document.addEventListener('change',async event=>{if(event.target.matches('[data-metric]')){try{selectedMetric=event.target.value;await renderDashboard();}catch(error){notice(error.message);}}});
window.addEventListener('message',async event=>{
  if(!exposure||event.origin!==location.origin||event.source!==exposure.frame.contentWindow)return;
  if(event.data?.type==='study-ready'){exposure.frame.contentWindow.postMessage({type:'study-config',uid:state.config.stream_uid},location.origin);return;}
  if(event.data?.type==='study-error'){notice(event.data.message);return;}
  if(event.data?.type!=='study-tick')return;
  try{
    const r=await request('exposure.tick',{...event.data.values,session_id:exposure.sessionId});
    const clock=document.querySelector('[data-study-clock]');const remaining=Math.max(0,Math.ceil(600-r.exposure_seconds));
    if(clock)clock.textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} remaining`;
    if(r.state==='after_vitals'){exposure.frame.contentWindow.postMessage({type:'study-stop'},location.origin);exposure=null;view='session';await refresh();}
  }catch(error){exposure?.frame.contentWindow.postMessage({type:'study-pause'},location.origin);notice(error.message);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)exposure?.frame.contentWindow.postMessage({type:'study-pause'},location.origin);});
window.addEventListener('pagehide',()=>exposure?.frame.contentWindow.postMessage({type:'study-stop'},location.origin));
if(new URLSearchParams(location.search).get('resume')==='1')view='session';
refresh().catch(error=>{app.innerHTML='<h1>Your study will be here.</h1><p>Please refresh in a moment.</p>';app.setAttribute('aria-busy','false');notice(error.message);});
