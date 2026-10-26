const $ = s => document.querySelector(s);
const node = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
const url = 'reviews/oxtr-study-01/r1/review.json';
const dialog = $('#scientific-review-dialog'), content = $('#scientific-review-content');
let record, error, trigger, previousOverflow, scrollPosition, newQuestion = false, activeAgent = false;
const date = value => new Intl.DateTimeFormat('en-AU', {dateStyle:'medium',timeStyle:'short',timeZone:'Australia/Sydney'}).format(new Date(value)) + ' AEDT';
async function sha(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join(''); }
function render() {
  const separate = newQuestion || activeAgent;
  $('#review-context').textContent = separate ? 'Current question · review not recorded' : 'Recorded OXTR study · retrospective review';
  for (const phase of ['design', 'final']) {
    const button = $(`#scientific-review-rail [data-scientific-review="${phase}"]`);
    button.disabled = separate || !record;
    const status = $(`#${phase}-review-status`);
    status.textContent = separate ? 'Not yet reviewed' : error ? 'Review unavailable' : !record ? 'Checking review record…' : record.reviews[phase].decision === 'approve' ? 'Review passed ↗' : 'Review needs attention ↗';
  }
  const stamp = $('#recorded-review-stamp'); stamp.replaceChildren();
  if (!record) { stamp.append(node('span', error || 'Loading the scientific review…')); return; }
  const title = node('strong', 'Reviewed by Gemini 4 Argon');
  const when = node('time', date(record.reviews.final.reviewed_at)); when.dateTime = record.reviews.final.reviewed_at;
  const button = node('button', 'Read the scientific review ↗', 'text-button'); button.dataset.scientificReview = 'final'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'scientific-review-dialog');
  stamp.append(title, when, button);
}
function link(label, href, download = false) { const a = node('a', label); a.href = href; if (download) a.download = ''; return a; }
function open(phase, source) {
  if (!record) return;
  const review = record.reviews[phase]; trigger = source; previousOverflow = document.documentElement.style.overflow; scrollPosition = window.scrollY;
  $('#scientific-review-title').textContent = phase === 'design' ? 'Gemini · study design review' : 'Gemini · findings review';
  content.replaceChildren();
  const verdict = node('section', undefined, 'review-verdict');
  verdict.append(node('p', 'GEMINI 4 ARGON · CHIEF SCIENTIST', 'eyebrow'), node('h3', review.decision === 'approve' ? 'Review passed.' : 'Review needs attention.'), node('p', phase === 'design' ? 'Gemini accepted the saved study design and its proposed next test. This review took place after the original calculations.' : record.plain_language_finding));
  const when = node('time', 'Review recorded ' + date(review.reviewed_at)); when.dateTime = review.reviewed_at; verdict.append(when); content.append(verdict);
  content.append(node('p', 'This is a review of the saved OXTR study. It checks the report against the evidence supplied; it is not a new experiment or a percentage confidence score.', 'review-scope'));
  const nav = node('div', undefined, 'result-reader-nav');
  for (const [id, label] of [['design', 'Study design'], ['final', 'Findings']]) { const b = node('button', label); b.setAttribute('aria-pressed', String(id === phase)); b.onclick = () => { const original = trigger, overflow = previousOverflow, position = scrollPosition; open(id, original); previousOverflow = overflow; scrollPosition = position; }; nav.append(b); }
  content.append(nav);
  const list = node('div', undefined, 'review-checks');
  for (const check of review.checks) { const item = node('article'); item.append(node('span', check.status === 'pass' ? 'CHECK ACCEPTED' : check.status === 'not_tested' ? 'NOT TESTED IN THIS STUDY' : 'CHANGE REQUESTED', 'review-check-state'), node('h4', check.claim), node('p', check.finding)); list.append(item); }
  content.append(list);
  content.append(node('p', review.required_changes.length ? 'Changes requested: ' + review.required_changes.join(' ') : 'No further revisions requested in this review.'));
  const methods = node('details'); methods.append(node('summary', 'Review record and evidence identity'));
  methods.append(node('p', 'Recorded at ' + review.reviewed_at + ' (UTC). This is the application’s completion timestamp, not an independent timestamp certification.'));
  methods.append(node('p', 'Provider: Google · Model: ' + review.model), node('p', 'Response receipt: ' + review.provider_response_id), node('p', 'Reviewed evidence SHA-256: ' + review.evidence_sha256));
  methods.append(node('p', 'The displayed study files were checked against the review’s saved file hashes when this page loaded. Earlier reports retain their original completion time and review status. This later review is an additional record.'));
  content.append(methods);
  const downloads = node('div', undefined, 'review-downloads'); downloads.append(link('Review record · JSON ↓', url, true), link('Review record · CSV ↓', 'reviews/oxtr-study-01/r1/review.csv', true)); content.append(downloads);
  document.documentElement.style.overflow = 'hidden'; if (!dialog.open) dialog.showModal(); content.scrollTop = 0; $('#close-scientific-review').focus({preventScroll:true});
}
document.addEventListener('click', e => { const b = e.target.closest('[data-scientific-review]'); if (b && !b.disabled) open(b.dataset.scientificReview, b); });
$('#close-scientific-review').onclick = () => dialog.close();
dialog.addEventListener('close', () => { document.documentElement.style.overflow = previousOverflow; window.scrollTo({top:scrollPosition,behavior:'instant'}); trigger?.focus({preventScroll:true}); content.replaceChildren(); });
dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); });
window.addEventListener('quantum:question', e => { newQuestion = e.detail.state !== 'ready' && !(e.detail.state === 'complete' && e.detail.studyId === 'oxtr-qrc-01'); render(); });
window.addEventListener('quantum:agent', e => { activeAgent = Boolean(e.detail); render(); });
async function load() {
  try {
    const r = await fetch(url, {cache:'no-store'}); if (!r.ok) throw Error(); const data = await r.json();
    if (data.schema !== 'universal-informatics/scientific-review-display/v1' || data.study_id !== 'oxtr-qrc-01') throw Error();
    for (const phase of ['design', 'final']) { const v = data.reviews[phase]; if (v.model !== 'gemini-4-argon' || !['approve','revise','human'].includes(v.decision) || !v.provider_response_id || !Number.isFinite(Date.parse(v.reviewed_at)) || !Array.isArray(v.checks)) throw Error(); }
    for (const file of data.study_files) { if (!/^experiments\/[a-z0-9-]+\/r\d+\/experiment\.json$/.test(file.path)) throw Error(); const r = await fetch(file.path); if (!r.ok || await sha(await r.arrayBuffer()) !== file.sha256) throw Error(); }
    record = data;
  } catch { error = 'The review record cannot be verified. Reload to retry.'; }
  render();
}
load();
