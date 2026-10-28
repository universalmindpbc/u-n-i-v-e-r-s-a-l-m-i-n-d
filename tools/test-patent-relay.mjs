import assert from 'node:assert/strict';
import {patentModelRelay} from '../cloudflare/patent-model-relay.js';
const secret='unit-test-service-secret-not-a-real-credential';
const env={ALLOWED_ORIGIN:'https://staging.universalmind.tv',PATENT_RELAY_SECRET:secret,OPENAI_API_KEY:'test',RESEARCH_MODEL:'gpt-6-astra',REQUEST_LIMIT:{limit:async()=>({success:true})},BUDGET:{idFromName:s=>s,get:()=>({fetch:async()=>Response.json({allowed:true})})}};
const body={operation:'responses',payload:{model:'gpt-6-astra',input:[],tools:[{type:'function',name:'search_patent'}],store:true,max_output_tokens:99999}};
async function req(data=body,age=0,key=secret){const text=JSON.stringify(data),time=String(Math.floor(Date.now()/1000)-age);const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=Buffer.from(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(time+'.'+text))).toString('hex');return new Request('https://example.invalid/patent/model',{method:'POST',headers:{'X-Patent-Time':time,'X-Patent-Signature':sig},body:text});}
assert.equal((await patentModelRelay(new Request('https://example.invalid/patent/model',{method:'POST',body:'{}'}),env)).status,403);
assert.equal((await patentModelRelay(await req(body,120),env)).status,403);
assert.equal((await patentModelRelay(await req(body,0,'invalid'),env)).status,403);
assert.equal((await patentModelRelay(await req(),{...env,ALLOWED_ORIGIN:'https://invalid.example'})).status,404);
assert.equal((await patentModelRelay(await req({operation:'models',payload:{}}),env)).status,400);
assert.equal((await patentModelRelay(await req({...body,payload:{...body.payload,tools:[{type:'web_search'}]}}),env)).status,400);
let sent;globalThis.fetch=async(url,options)=>{sent={url,payload:JSON.parse(options.body)};return Response.json({output:[]});};
assert.equal((await patentModelRelay(await req(),env)).status,200);assert.equal((await patentModelRelay(await req(),{...env,ALLOWED_ORIGIN:'https://universalmind.tv'})).status,200);assert.equal(sent.url,'https://api.openai.com/v1/responses');assert.equal(sent.payload.store,false);assert.equal(sent.payload.max_output_tokens,2600);assert.equal(sent.payload.background,false);
assert.equal((await patentModelRelay(await req(),{...env,REQUEST_LIMIT:{limit:async()=>({success:false})}})).status,429);
console.log('PASS: unsigned, stale, wrong-key, unapproved host, unknown operation, arbitrary tool and over-rate requests denied; valid requests bounded and storage disabled.');
