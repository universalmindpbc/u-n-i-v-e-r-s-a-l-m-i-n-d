import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const modules=process.env.PHP_WASM_MODULE_DIR;
if(!modules)throw new Error('Set PHP_WASM_MODULE_DIR to a temporary @php-wasm installation.');
const {PHP}=await import(path.join(modules,'@php-wasm/universal/index.js'));
const {loadNodeRuntime}=await import(path.join(modules,'@php-wasm/node/index.js'));
const php=new PHP(await loadNodeRuntime('8.3',{emscriptenOptions:{processId:1}}));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
php.mkdir('/app/api');php.mkdir('/app/study');
for(const name of ['study.php','study-lib.php','study-spectrum.php','study-analysis.php','happiness-secret-store.php','quantum-tree-owner-password.php'])
  php.writeFile('/app/api/'+name,await fs.readFile(path.join(root,'i  a m/api',name),'utf8'));
php.writeFile('/app/study/protocol-v1.json',await fs.readFile(path.join(root,'i  a m/study/protocol-v1.json'),'utf8'));
let cookies={},csrf='';
const checks=[];
async function request(action,body={},options={}) {
  const response=await php.run({scriptPath:'/app/api/study.php',relativeUri:'/vogue/iam/api/study.php',protocol:'https',method:action?'POST':'GET',
    headers:{Host:options.host||'staging.universalmind.tv',Origin:options.origin||'https://staging.universalmind.tv','X-Study-CSRF':options.csrf??csrf,
      Cookie:Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; '),'Content-Type':'application/json'},$_SERVER:{HTTPS:'on'},
    ...(action?{body:new TextEncoder().encode(JSON.stringify({action,request_id:crypto.randomUUID(),...body}))}:{})});
  assert.equal(response.errors,'',response.errors);
  for(const value of response.headers['set-cookie']||[]){const pair=value.split(';')[0];const at=pair.indexOf('=');cookies[pair.slice(0,at)]=pair.slice(at+1);}
  const payload=JSON.parse(response.text);if(payload.csrf)csrf=payload.csrf;
  if(process.env.STUDY_TEST_DEBUG)console.log(action||'GET',response.httpStatusCode,Object.keys(cookies),payload.error||'',csrf.slice(0,5),Object.values(cookies).map(v=>v.slice(0,5)));
  return {status:response.httpStatusCode,...payload};
}
async function ok(action,body={}) {const result=await request(action,body);assert.equal(result.status,200,JSON.stringify(result));return result;}
try {
  const first=await ok();assert.equal(first.owner,false);assert.equal(first.participant,null);assert.equal(first.readiness.open,false);
  assert.equal((await ok()).csrf,first.csrf,'Session did not persist across requests');
  assert.equal((await request('preview',{}, {csrf:'wrong'})).status,403);
  assert.equal((await request('preview',{}, {origin:'https://different.test'})).status,403);
  assert.equal((await request('admin.dataset')).status,403);
  assert.equal((await request('preview',{}, {host:'universalmind.tv',origin:'https://universalmind.tv'})).status,403);
  checks.push('Origin, CSRF, researcher authentication and staging-only preview enforced');
  await ok('preview');let preview=await ok();const previewCookies={...cookies};assert.equal(preview.participant.id,'PREVIEW');
  await ok('consent',{version:preview.protocol.version,adult_woman:true,equipment:true,participation:true,research_data:true});
  const session=await ok('session.start',{window:'morning',timezone:'Australia/Sydney'});
  assert.equal((await request('report',{session_id:session.session_id,happiness:5,stress:5,connection:5,text:''})).status,422);
  await ok('vitals',{session_id:session.session_id,values:{unavailable_reason:'preview'}});
  assert.equal((await request('report',{session_id:session.session_id,happiness:11,stress:5,connection:5,text:''})).status,422);
  const report={session_id:session.session_id,happiness:3,stress:7,connection:2,text:'Illustrative before',request_id:'idempotent-report'};
  await ok('report',report);await ok('report',report);
  await ok('preview.experience',{session_id:session.session_id});
  await ok('vitals',{session_id:session.session_id,values:{unavailable_reason:'preview'}});
  await ok('report',{session_id:session.session_id,happiness:8,stress:3,connection:7,text:'Illustrative after'});
  const summary=await ok('summary');assert.equal(summary.summary.completed_sessions,1);assert.equal(summary.summary.statistics.happiness.mean,5);
  assert.equal(summary.summary.rows[0].exposure_seconds,0);assert.equal(summary.summary.statistics.hrv_sdnn_ms.n,0);
  assert.equal((await request('preview.analysis',{redaction_confirmed:true})).status,403);
  checks.push('Before/after state machine, 1–10 bounds, idempotency, missing vitals and isolated preview completion');
  // Create an owner session only inside this temporary PHP test filesystem.
  const owner=await php.run({code:"<?php session_name('iam_quantum_tree_owner'); session_start(); $_SESSION['quantum_tree_owner']=true; $_SESSION['quantum_tree_password_revision']='legacy'; echo 'ok';"});
  const pair=owner.headers['set-cookie'].at(-1).split(';')[0].split('=');cookies[pair[0]]=pair[1];
  assert.equal((await ok()).owner,true);
  const invite1=await ok('admin.invite'),invite2=await ok('admin.invite'),stakeholder=await ok('admin.stakeholder');
  assert.equal((await ok('admin.dataset')).summary.participants,2);
  assert.equal((await request('admin.config',{open:true})).status,422);
  checks.push('Researcher operations require owner session; preview records never enter cohort; enrolment readiness enforced');
  const ownerCookies={...cookies};
  cookies={};await ok();await ok('login',{code:invite1.code});let person=await ok();assert.equal(person.participant.id,'P01');assert.equal(person.owner,false);
  assert.equal((await request('session.start',{window:'morning'})).status,422);
  assert.equal((await request('admin.invite')).status,403);
  assert.equal((await request('report',{session_id:session.session_id,happiness:5,stress:5,connection:5})).status,422);
  assert.equal((await ok('summary')).participants.length,1);
  cookies={};await ok();await ok('login',{code:stakeholder.code});assert.equal((await ok()).stakeholder,true);
  const aggregate=await ok('stakeholder.dataset');assert.equal(aggregate.summary.participants,2);assert.equal(aggregate.summary.rows,undefined);
  assert.equal((await request('export')).status,401);assert.equal((await request('admin.dataset')).status,403);
  checks.push('Participant and stakeholder codes have separate scopes; no cross-participant or raw stakeholder access');
  cookies=ownerCookies;await ok();const pay={participant_id:'P01',amount_aud:25,request_id:'payment-once'};
  await ok('admin.payment',pay);await ok('admin.payment',pay);
  assert.equal((await ok('admin.dataset')).participants[0].payments.length,1);
  checks.push('Payment retries do not duplicate payment records');
  // Advance only the isolated fixture's server timing to test ten-minute completion without a ten-minute wall-clock test.
  const cohort=JSON.parse(php.readFileAsText('/app/api/.runtime-private/study/cohort.json'));
  const timed=structuredClone(summary.participants[0].sessions[0]);
  timed.state='experience';timed.exposure_seconds=598;timed.last_media_time=598;timed.last_heartbeat=Date.now()/1000-1.1;
  timed.exposure_started_epoch=Date.now()/1000-600;timed.last_fidelity_valid=true;timed.last_mutation=null;
  cohort.participants.P01.consent={version:first.protocol.version,at:new Date().toISOString()};cohort.participants.P01.sessions=[timed];
  php.writeFile('/app/api/.runtime-private/study/cohort.json',JSON.stringify(cohort));
  cookies={};await ok();await ok('login',{code:invite1.code});await ok();
  const completion=await ok('exposure.tick',{session_id:timed.id,media_time:599,playing:true,preset:'m8',carrier_hz:444,profile_id:'inspiration_gamma_80_v1',quantum_tree_enabled:true,mantra_enabled:true,sound_running:true});
  assert.equal(completion.state,'after_vitals');assert.equal(completion.exposure_seconds,599);
  checks.push('Server-timed video completion advances to the after measurement; timing fixture is local only');
  cookies=previewCookies;await ok();await ok('withdraw',{erase_responses:true});
  const removed=await ok('export');assert.equal(removed.participant.withdrawn,true);assert.equal(removed.participant.sessions[0].before_report,null);
  assert.equal((await ok('summary')).summary.statistics.happiness.n,0);
  checks.push('Withdrawal removes requested response fields and invalidates derived results');
  console.log(JSON.stringify({runtime:'PHP 8.3 WASM',checks},null,2));
}finally{php.exit();}
