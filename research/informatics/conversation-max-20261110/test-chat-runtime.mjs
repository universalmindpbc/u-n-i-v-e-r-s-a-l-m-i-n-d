import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.resolve('../../../cloudflare/node_modules/wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),{build}=require('esbuild');
const code=await build({stdin:{resolveDir:process.cwd(),sourcefile:'max-chat-test.js',contents:`
import worker from './cloudflare/informatics-research-worker.js';
const env={ALLOWED_ORIGIN:'https://staging.universalmind.tv',RESEARCH_MODEL:'gpt-6-astra',RESEARCH_REASONING_EFFORT:'max',QUANTUM_PLANNING_ENABLED:'true',ASTRA_ENABLED:'true',QUANTUM_DEMO_ENABLED:'true',DATABASE_URL:'synthetic',DATASET_VERSION:'fixture',REQUEST_LIMIT:{limit:async()=>({success:true})},BUDGET:{idFromName:x=>x,get:()=>({fetch:async()=>Response.json({allowed:true})})}};
export default {fetch:request=>worker.fetch(request,env)};`},plugins:[{name:'fixture-database',setup(b){b.onResolve({filter:/^@neondatabase\/serverless$/},()=>({path:'db',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const neon=()=>({query:async()=>[{manifest:{version:"fixture"}}]});',loader:'js'}));}}],bundle:true,format:'esm',platform:'browser',write:false});
const outgoing=[];
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:code.outputFiles[0].text,compatibilityDate:'2026-07-03',compatibilityFlags:['nodejs_compat'],cf:false,cache:false,outboundService:async request=>{
 const u=new URL(request.url);assert.equal(u.hostname,'api.openai.com');assert.equal(u.pathname,'/v1/responses');const b=await request.json();outgoing.push(b);assert.equal(b.reasoning.effort,'max');assert.equal(b.max_output_tokens,16384);assert.match(b.instructions,/local CPU simulation/);assert.match(b.instructions,/Login changes funded-study permission/);assert(!b.instructions.includes('You have read-only tools,'));
 return Response.json({id:'fixture-max-'+outgoing.length,status:'completed',reasoning:{effort:'max'},usage:{input_tokens:1000,output_tokens:500,total_tokens:1500},output:[{type:'message',content:[{type:'output_text',text:'This is a generated-response transport fixture.'}]}]});
}}));
try{
 for(const [question,history] of [['Do you have access to CUDA-Q?',[]],['and now?',[{role:'user',content:'Do you have access to CUDA-Q?'},{role:'assistant',content:'An earlier inaccurate read-only answer.'}]]]){
  const response=await mf.dispatchFetch('https://worker.test/research',{method:'POST',headers:{Origin:'https://staging.universalmind.tv','Content-Type':'application/json','X-Research-QA-Max-USD':'2'},body:JSON.stringify({question,history,context:{area:'quantum'}})});const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.reasoning,'max');assert.equal(body.providerResponses[0].providerReasoning,'max');assert.equal(body.answer,'This is a generated-response transport fixture.');
 }
 const result={passed:true,runtime:'Cloudflare workerd',paidCalls:0,checks:['actual chat handler sends Max to Responses API','16384 output ceiling retains reasoning room','fresh operational facts reach model','follow-up history reaches model','provider reasoning receipt returned']};
 await fs.writeFile(import.meta.dirname+'/runtime-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await mf.dispose();}
