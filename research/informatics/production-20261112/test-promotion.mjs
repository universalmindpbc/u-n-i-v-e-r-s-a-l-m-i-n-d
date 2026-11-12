import assert from 'node:assert/strict';
import {demoRoute,demoStorage,DEMO_VERSION} from '../../../cloudflare/informatics-quantum-demo.js';
import {astraRoute,astraStorage} from '../../../cloudflare/informatics-astra.js';
import {notifyStudy} from '../../../cloudflare/informatics-study-email.js';
class Store {data=new Map();async get(k){return structuredClone(this.data.get(k))}async put(k,v){this.data.set(k,structuredClone(v))}async transaction(fn){return fn(this)}async getAlarm(){return null}async setAlarm(){}}
const local=new Store(),shared=new Store(),calls=[];
const binding=(store,label)=>({idFromName:x=>x,get:()=>({fetch:async(url,options)=>{const b=JSON.parse(options.body);calls.push({label,operation:(b.astra||b.demo).op});const r=b.demo?await demoStorage(store,b.demo):await astraStorage(store,b.astra);return Response.json(r.data,{status:r.status})}})});
const env={ALLOWED_ORIGIN:'https://universalmind.tv',ASTRA_SESSION_SECRET:'synthetic-secret-only'.repeat(4),ASTRA_ENABLED:'true',QUANTUM_DEMO_ENABLED:'true',BUDGET:binding(local,'production'),SHARED_RESEARCH_BUDGET:binding(shared,'shared')};
const code='a'.repeat(64),sid='b'.repeat(32),id=crypto.randomUUID(),localId=crypto.randomUUID();
const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ASTRA_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
async function token(scope,details={}){const b=Buffer.from(JSON.stringify({scope,aud:env.ALLOWED_ORIGIN,exp:Math.floor(Date.now()/1000)+3600,...details})).toString('base64url');return b+'.'+Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(b))).toString('base64url')}
const auth=await token('astra-research',{sid}),portal=await token('quantum-demo',{code}),headers={Authorization:'Bearer '+auth,'X-Quantum-Portal':portal};
const request=(path,body,h=headers)=>new Request('https://worker.test'+path,{headers:h,...(body?{method:'POST',body:JSON.stringify(body)}:{})});
await shared.put('demo-pool-v1',{reservedUSD:25,codes:{[code]:id},openedAt:Date.now(),readyAt:Date.now(),runtime:DEMO_VERSION});
await shared.put('astra',{tasks:[{id}]});await shared.put('study:'+id,{id,version:DEMO_VERSION,clientId:'other-browser',portalId:code,status:'running',events:[],report:null});
await local.put('astra',{tasks:[{id:localId}]});await local.put('study:'+localId,{id:localId,clientId:sid,status:'complete',report:{narrative:{answer:'Existing production findings'}}});
let response=await demoRoute(request('/agent/demo/access'),env);let access=await response.json();assert.equal(access.poolRemainingUSD,75);assert.equal(access.credit,0);assert.equal(access.study.id,id);assert.equal(access.available,true);assert(!local.data.has('demo-pool-v1'));
response=await astraRoute(request('/agent/studies/'+id),env);assert.equal(response.status,200);assert.equal((await response.json()).id,id);
response=await astraRoute(request('/agent/studies/'+localId),env);assert.equal((await response.json()).report.narrative.answer,'Existing production findings');
await assert.rejects(astraRoute(request('/agent/studies/'+id,null,{Authorization:'Bearer '+auth}),env),{status:404});
response=await astraRoute(request('/agent/studies/'+id+'/delivery',{email:'qa@example.test',enabled:true}),env);assert.equal(response.status,200);const delivery=await response.json();assert.equal(delivery.delivery.state,'waiting');assert(delivery.resultToken);assert.equal((await shared.get('study:'+id)).notification.resultOrigin,env.ALLOWED_ORIGIN);
let t=await shared.get('study:'+id);t.status='complete';t.report={narrative:{answer:'Shared funded findings'}};await shared.put('study:'+id,t);
response=await astraRoute(request('/agent/studies/'+id+'/result',null,{Authorization:'Bearer '+delivery.resultToken}),env);assert.equal(response.status,200);assert.equal((await response.json()).report.narrative.answer,'Shared funded findings');
await assert.rejects(astraRoute(request('/agent/studies/'+id+'/result',null,{Authorization:'Bearer '+'f'.repeat(64)}),env),{status:403});
let sent=0;globalThis.fetch=async(url,o)=>{sent++;assert.equal(url,'https://staging.universalmind.tv/informatics/api/study-email.php');assert.equal(JSON.parse(o.body).resultOrigin,env.ALLOWED_ORIGIN);return Response.json({accepted:true})};
await notifyStudy(shared,{...env,ALLOWED_ORIGIN:'https://staging.universalmind.tv'});await notifyStudy(shared,{...env,ALLOWED_ORIGIN:'https://staging.universalmind.tv'});assert.equal(sent,1);
assert.equal((await shared.get('demo-pool-v1')).reservedUSD,25);
console.log(JSON.stringify({passed:true,checks:['single shared demo pool and per-code reservation','existing production studies retained','portal ownership required across stores','production notification destination','private result token access and invalid token rejection','notification idempotency','no new model or hardware work']}));
