// Funded research access for question-led studies. The durable reservation is never
// reset by sign-in, browser storage, retries, cancellations or worker restarts.
import {researchIdentity} from './informatics-astra.js';
import {publicStudy} from './informatics-study-email.js';
export const DEMO_VERSION='quantum-portal-experiment-v1';
export const DEMO_POLICY=Object.freeze({poolUSD:100,studyUSD:25,maxModelTokens:64000,newPaidGPUUSD:0});
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const terminal=new Set(['complete','failed','cancelled','needs_attention']);
const idle=t=>terminal.has(t.status)||t.status==='awaiting_confirmation';
export async function portalIdentity(request,env){
 try{const [body,sig,extra]=(request.headers.get('X-Quantum-Portal')||'').split('.');if(extra||!body||!sig||!env.ASTRA_SESSION_SECRET)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ASTRA_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('HMAC',key,decode(sig),new TextEncoder().encode(body)))return false;
  const c=JSON.parse(new TextDecoder().decode(decode(body))),now=Date.now()/1000;
  return c.scope==='quantum-demo'&&c.aud===env.ALLOWED_ORIGIN&&Number.isInteger(c.exp)&&c.exp>now&&c.exp<=now+43200&&/^[a-f0-9]{64}$/.test(c.code||'')?c.code:false;
 }catch{return false;}
}
async function broker(env,demo){const namespace=env.SHARED_RESEARCH_BUDGET||env.BUDGET;const r=await namespace.get(namespace.idFromName('astra-owner-v1')).fetch('https://budget/demo',{method:'POST',body:JSON.stringify({demo})});return json(await r.json(),r.status);}
export async function demoRoute(request,env){
 if(!['https://staging.universalmind.tv','https://universalmind.tv'].includes(env.ALLOWED_ORIGIN))return json({error:'Portal access is unavailable on this host.'},404);
 const path=new URL(request.url).pathname;
 if(path==='/agent/demo/control'){
  if(request.method!=='POST'||!env.ASTRA_WORKER_TOKEN||request.headers.get('Authorization')!=='Bearer '+env.ASTRA_WORKER_TOKEN)return json({error:'Worker authentication required.'},401);
  const raw=await request.text();if(raw.length>4000000)return json({error:'Update exceeds the report size limit.'},413);
  const b=JSON.parse(raw);if(!['ready','pending','claim','update'].includes(b.op))return json({error:'Unknown worker operation.'},400);
  return broker(env,b);
 }
 const clientId=await researchIdentity(request,env),portalId=await portalIdentity(request,env);
 if(!clientId)return json({error:'Reconnect your research session.'},401);
 if(path==='/agent/demo/access'&&request.method==='GET')return broker(env,{op:'access',portalId,enabled:env.QUANTUM_DEMO_ENABLED==='true'});
 if(!portalId)return json({error:'Enter your I AM portal password to unlock an experiment credit.'},401);
 if(['/agent/demo/plan','/agent/demo/revise','/agent/demo/confirm'].includes(path)&&request.method==='POST'){
  if(env.QUANTUM_DEMO_ENABLED!=='true')return json({error:'Funded experiments are being prepared. Your credit remains available.'},503);
  const raw=await request.text();if(raw.length>6000)return json({error:'Keep the research question within 3,000 characters.'},413);
  const b=JSON.parse(raw),op=path.split('/').at(-1);
  if(op==='confirm'){
   if(!/^[a-f0-9]{64}$/.test(b.planDigest||''))return json({error:'Open the current experiment proposal before launch.'},400);
   return broker(env,{op,portalId,clientId,planDigest:b.planDigest});
  }
  const question=typeof b.question==='string'?b.question.trim():'';
  if(question.length<5||question.length>3000||!/^[a-f0-9-]{36}$/.test(b.requestKey||''))return json({error:'Describe the research question you want to investigate.'},400);
  return broker(env,{op,portalId,clientId,question,requestKey:b.requestKey});
 }
 return json({error:'Experiment operation not found.'},404);
}
export async function demoStorage(storage,b){return storage.transaction(async tx=>{
 const now=Date.now(),stamp=new Date(now).toISOString(),answer=(data,status=200)=>({data,status});
 const ledger=await tx.get('demo-pool-v1')||{reservedUSD:0,codes:{},readyAt:0};
 if(b.op==='ready'){ledger.openedAt||=now;if(now-ledger.openedAt>30*86400000)return answer({ready:false,closed:true});ledger.readyAt=now;ledger.runtime=b.runtime;await tx.put('demo-pool-v1',ledger);return answer({ready:true});}
 const online=!!ledger.openedAt&&now-ledger.openedAt<=30*86400000&&ledger.readyAt>now-10*60000&&ledger.runtime===DEMO_VERSION;
 if(b.op==='pending'){
  const tasks=await Promise.all(Object.values(ledger.codes).map(id=>tx.get('study:'+id)));
  return answer({closed:!!ledger.openedAt&&now-ledger.openedAt>30*86400000||tasks.length===4&&tasks.every(t=>['complete','failed','cancelled'].includes(t.status)),pending:tasks.some(t=>!idle(t)&&(!t.lease||t.lease.until<now)&&(t.nextPoll||0)<=now)});
 }
 const existingId=b.portalId?ledger.codes[b.portalId]:null;
 if(b.op==='access')return answer({authenticated:!!b.portalId,credit:!!b.portalId&&!existingId&&ledger.reservedUSD+25<=100?1:0,study:existingId?publicStudy(await tx.get('study:'+existingId)):null,available:!!b.enabled&&online,poolRemainingUSD:100-ledger.reservedUSD,policy:DEMO_POLICY});
 if(b.op==='plan'||b.op==='revise'){
  if(!/^[a-f0-9]{64}$/.test(b.portalId||''))return answer({error:'Portal authentication required.'},401);
  if(existingId){
   const t=await tx.get('study:'+existingId);
   if(b.op!=='revise'||t.requestKey===b.requestKey)return answer(publicStudy(t));
   if(!['awaiting_confirmation','needs_attention'].includes(t.status)||t.hardwareStarted)return answer({error:'This experiment is already running or complete. Open its progress and findings.'},409);
   t.question=b.question;t.requestKey=b.requestKey;t.revision=(t.revision||0)+1;t.status='queued';t.stage='planning';t.plan=null;t.message='Astra is revising the experiment for your question within the remaining study allowance.';t.updatedAt=stamp;delete t.lease;t.nextPoll=now;await tx.put('study:'+t.id,t);return answer(publicStudy(t));
  }
  if(!online)return answer({error:'The study service is reconnecting. Your credit remains available.'},503);
  if(ledger.reservedUSD+25>100)return answer({error:'The shared demo pool is fully allocated. Saved findings remain available.'},429);
  const task={id:crypto.randomUUID(),clientId:b.clientId,portalId:b.portalId,requestKey:b.requestKey,version:DEMO_VERSION,question:b.question,revision:0,status:'queued',stage:'planning',message:'Your study credit is reserved. Astra and Gemini are preparing an experiment for your question. Your proposal will appear here for review before the experiment starts.',createdAt:stamp,updatedAt:stamp,events:[],report:null,policy:DEMO_POLICY};
  ledger.reservedUSD+=25;ledger.codes[b.portalId]=task.id;
  const index=await tx.get('astra')||{tasks:[],daily:{},monthly:{}};index.tasks.push({id:task.id,requestKey:task.requestKey,status:task.status,version:task.version});
  await tx.put('study:'+task.id,task);await tx.put('astra',index);await tx.put('demo-pool-v1',ledger);return answer(publicStudy(task));
 }
 if(b.op==='confirm'){
  if(!existingId)return answer({error:'Prepare an experiment first.'},404);
  const t=await tx.get('study:'+existingId);
  if(t.confirmedPlanDigest===b.planDigest)return answer(publicStudy(t));
  if(t.status!=='awaiting_confirmation'||!t.plan||t.plan.digest!==b.planDigest)return answer({error:'The proposal changed. Review the current experiment before launch.'},409);
  if(!(t.plan.cost?.totalCeilingUSD>0&&t.plan.cost.totalCeilingUSD<=25))return answer({error:'This proposal exceeds your study credit.'},422);
  t.confirmedPlanDigest=b.planDigest;t.status='queued';t.stage='hardware';t.message='Experiment approved. The worker will recheck device availability and cost before submission.';t.nextPoll=now;t.updatedAt=stamp;await tx.put('study:'+t.id,t);return answer(publicStudy(t));
 }
 const ids=Object.values(ledger.codes);
 if(b.op==='claim'){
  for(const id of ids){const t=await tx.get('study:'+id);if(idle(t)||(t.lease?.until||0)>now||(t.nextPoll||0)>now)continue;
   t.lease={token:crypto.randomUUID(),until:now+360000};t.status='running';t.updatedAt=stamp;await tx.put('study:'+id,t);return answer({task:publicStudy(t),lease:t.lease.token});}
  return answer({task:null});
 }
 if(b.op==='update'){
  if(!ids.includes(b.id))return answer({error:'Experiment not found.'},404);
  const t=await tx.get('study:'+b.id);
  if(terminal.has(t.status)||t.lease?.token!==b.lease||t.lease.until<now)return answer({error:'Experiment lease ended. Stop and reconcile.'},409);
  if(!['running','awaiting_confirmation','complete','needs_attention'].includes(b.status)||!['planning','model','simulation','design_review','hardware','final_review','result'].includes(b.stage))return answer({error:'Invalid experiment transition.'},400);
  if(b.hardwareStarted===true)t.hardwareStarted=true;
  if(b.plan){if(!/^[a-f0-9]{64}$/.test(b.plan.digest||'')||!(b.plan.cost?.totalCeilingUSD>0&&b.plan.cost.totalCeilingUSD<=25))return answer({error:'Proposal cost exceeds the study credit.'},422);t.plan=b.plan;}
  if(b.status==='awaiting_confirmation'&&!t.plan)return answer({error:'A reviewable proposal is required.'},422);
  if(b.report){const r=b.report;if(r.version!==DEMO_VERSION||!r.narrative||!Array.isArray(r.measurements)||r.measurements.length>80||JSON.stringify(r).length>3900000)return answer({error:'Invalid experiment report.'},422);t.report=r;}
  if(b.status==='complete'&&(!t.report||t.report.measurements.length!==t.plan?.programs?.length||t.report.measurements.some(x=>x.status!=='COMPLETED')||!t.report.experiment?.validation?.wolfram_executed||!t.report.experiment?.validation?.cuda_q_executed||['design','final'].some(phase=>t.report.reviews?.filter(r=>r.phase===phase).at(-1)?.decision!=='approve')))return answer({error:'Completed model checks, measurements and both scientific reviews are required.'},422);
  if(b.report){
   const raw=JSON.stringify(b.report),chunks=Math.ceil(raw.length/40000);
   for(let i=0;i<chunks;i++)await tx.put('study-record:'+t.id+':'+i,raw.slice(i*40000,(i+1)*40000));
   t.record={chunks,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))].map(x=>x.toString(16).padStart(2,'0')).join('')};
   const r=b.report;t.report={version:r.version,id:r.id,question:r.question,completed_at:r.completed_at,narrative:r.narrative,review:r.review,reviews:r.reviews,funding:r.funding,experiment:{...r.experiment,checks:undefined},measurements:r.measurements.map(({raw_shots,counts,...m})=>m),recordAvailable:true};
  }
  t.status=b.status;t.stage=b.stage;t.message=String(b.message||'').slice(0,700);t.updatedAt=stamp;t.nextPoll=now+60000;t.events.push({stage:t.stage,status:t.status,message:t.message,at:stamp});t.events=t.events.slice(-40);delete t.lease;
  await tx.put('study:'+t.id,t);return answer(publicStudy(t));
 }
 return answer({error:'Unknown experiment operation.'},400);
});}
