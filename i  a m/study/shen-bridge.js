// Only the consented study route retains full measurements across sessions.
export const studyMode = new URLSearchParams(location.search).get('study') === '1';
let context;
export let studyMeasurementSeconds = 10;
export async function authoriseStudyScan() {
  const response = await fetch('api/study.php', {credentials:'same-origin',cache:'no-store'});
  if (!response.ok) throw new Error('Please return to your study and sign in again.');
  context = await response.json();
  const session = context.participant?.sessions.find(s => ['before_vitals','after_vitals'].includes(s.state));
  if (!context.participant?.consent || context.participant.withdrawn || !session) throw new Error('Please start your Heart Check from your study session.');
  context.session = session;
  studyMeasurementSeconds = context.config.measurement_seconds === 60 ? 60 : 10;
  return context;
}
export function studyValues(result) {
  const values = {measurement_duration_seconds:studyMeasurementSeconds};
  for (const key of ['heart_rate_bpm','hrv_sdnn_ms','hrv_lnrmssd_ms','systolic_blood_pressure_mmhg','diastolic_blood_pressure_mmhg','average_signal_quality']) {
    values[key] = typeof result?.[key] === 'number' && Number.isFinite(result[key]) ? result[key] : null;
  }
  for (const key of ['ppg_quality_index','bcg_quality_index','blood_pressure_quality_index']) {
    const value = result?.quality_metrics?.[key]; values[key] = typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  values.heartbeats = Array.isArray(result?.heartbeats) ? result.heartbeats.slice(0,250).map(beat => ({
    start_location_sec:beat.start_location_sec,end_location_sec:beat.end_location_sec,duration_ms:beat.duration_ms,
  })) : [];
  if (!result) values.unavailable_reason = 'signal_quality';
  return values;
}
export async function saveStudyScan(values) {
  if (!context) await authoriseStudyScan();
  const response = await fetch('api/study.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Study-CSRF':context.csrf},
    body:JSON.stringify({action:'vitals',session_id:context.session.id,request_id:crypto.randomUUID(),values})});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Your reading could not be saved. Please return to your study.');
  location.assign('study.php?resume=1');
}
