import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {perplexityResearch,reserveLiteratureAgent,settleLiteratureAgent,literatureAgentModel} from '../../../cloudflare/informatics-literature-agent.js';
import {reserveLiteratureSearch} from '../../../cloudflare/informatics-literature-fallback.js';
const stores=new Map();
const storage=name=>({transaction:async f=>f({get:async k=>stores.get(name+k),put:async(k,v)=>stores.set(name+k,structuredClone(v))})});
const env={PERPLEXITY_AGENT_ENABLED:'true',PERPLEXITY_AGENT_TOTAL_LIMIT_USD:'1',PERPLEXITY_ENABLED:'true',PERPLEXITY_TOTAL_LIMIT_USD:'.01',PERPLEXITY_API_KEY:'fixture'};
const guard=storage('guard');assert.equal((await reserveLiteratureAgent(guard,env)).allowed,true);assert.equal((await reserveLiteratureAgent(guard,env)).allowed,false);
assert.equal((await perplexityResearch({},{})).status,'not_configured');
env.BUDGET={idFromName:n=>n,get:n=>({fetch:async(_url,options)=>{const body=JSON.parse(options.body);return Response.json(body.literatureAgentSettle?await settleLiteratureAgent(storage(n),body.literatureAgentSettle):await(n.includes('agent')?reserveLiteratureAgent:reserveLiteratureSearch)(storage(n),env));}})};
const nativeFetch=globalThis.fetch;let modelCalls=0;
globalThis.fetch=async(url,options)=>{
 assert.equal(url,'https://api.perplexity.ai/v1/agent');const b=JSON.parse(options.body);assert.equal(b.model,literatureAgentModel);assert.equal(b.max_steps,1);assert.equal(b.reasoning.effort,'high');assert(b.tools.every(t=>t.type==='function'));modelCalls++;
 return Response.json({id:'fixture',model:literatureAgentModel,status:'completed',usage:{input_tokens:100,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:'The retrieved evidence is limited.'}]}]});
};
const context={papers:[{pmid:'12345',url:'https://pubmed.ncbi.nlm.nih.gov/12345/',title:'Fixture'}]};
const result=await perplexityResearch(env,{query:'GRIN2B regulation',reason:'The reviewed paper leaves an unresolved methodological gap.'},context);
assert.equal(result.status,'completed');assert.equal(modelCalls,1);assert.equal(result.papers[0].pmid,'12345');assert(result.receipt.requestUpperUSD<=.75);
assert(result.receipt.settlement.settled);assert(result.receipt.chargedUpperUSD<.75);assert.equal((await settleLiteratureAgent(storage('literature-agent-v1'),{reservation:result.receipt.reservation,chargedUSD:0})).settled,false);await reserveLiteratureAgent(storage('literature-agent-v1'),env);assert.equal((await perplexityResearch(env,{query:'GRIN2B regulation',reason:'Unresolved methodological question.'},context)).status,'allowance_unavailable');assert.equal(modelCalls,1);
stores.clear();modelCalls=0;
globalThis.fetch=async()=>{modelCalls++;return Response.json({id:'refused-fixture',model:literatureAgentModel,status:'failed',error:{type:'refusal'},output:[]});};
const refusal=await perplexityResearch(env,{query:'Fixture research question',reason:'A specific evidence gap remains unresolved.'});
assert.equal(refusal.status,'refused');assert.equal(modelCalls,1);assert.equal(refusal.receipt.chargedUpperUSD,refusal.receipt.requestUpperUSD);
stores.clear();modelCalls=0;
globalThis.fetch=async(_url,options)=>{
 const body=JSON.parse(options.body);modelCalls++;
 if(modelCalls===1)return Response.json({id:'tools-fixture',model:literatureAgentModel,status:'completed',usage:{input_tokens:100,output_tokens:100},output:Array.from({length:6},(_,i)=>({type:'function_call',name:'unavailable_fixture_tool',arguments:'{}',call_id:String(i)}))});
 assert.equal(body.tools.length,0);assert.equal(body.tool_choice,'none');assert.equal(body.input.filter(x=>x.type==='function_call_output').length,6);
 return Response.json({id:'final-fixture',model:literatureAgentModel,status:'completed',usage:{input_tokens:100,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:'The evidence gap remains unresolved.'}]}]});
};
const limited=await perplexityResearch(env,{query:'Fixture research question',reason:'A specific evidence gap remains unresolved.'});
assert.equal(limited.status,'completed');assert.equal(limited.receipt.toolExecutions,4);assert.equal(modelCalls,2);assert(limited.receipt.requestUpperUSD<=.75);
globalThis.fetch=nativeFetch;
await fs.writeFile(import.meta.dirname+'/agent-unit-checks.json',JSON.stringify({passed:true,pinnedModel:literatureAgentModel,maximumModelCalls:3,maximumToolExecutions:4,runReservationUSD:.75,concurrentAllowanceGate:true,paidRequests:0},null,2)+'\n');
if(process.env.LIVE==='1'){
 const file=import.meta.dirname+'/agent-connection.json';try{await fs.access(file);throw Error('A paid verification receipt already exists.');}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.writeFile(file,JSON.stringify({status:'reserved',agentUSD:.47,searchUSD:.01})+'\n');stores.clear();env.PERPLEXITY_AGENT_RUN_LIMIT_USD='.47';env.PERPLEXITY_API_KEY=(await fs.readFile('/private/tmp/um-perplexity-staging-key','utf8')).trim();
 const response=await perplexityResearch(env,{query:'Find the original Nature 2022 paper titled Dynamical topological phase realized in a trapped-ion quantum simulator. Report its DOI, publication date and one limitation. One original source is sufficient.',reason:'Verify source retrieval and citation on a public quantum-physics paper, separately from the declined biological query.'});
 await fs.writeFile(file,JSON.stringify(response,null,2)+'\n');console.log(JSON.stringify({status:response.status,model:response.model,calls:response.receipt.calls.map(c=>({status:c.httpStatus,error:c.error,usage:c.usage})),toolExecutions:response.receipt.toolExecutions,sources:response.papers.length}));assert.equal(response.status,'completed');assert(response.papers.length>0);
}else console.log('Literature agent guard and model selection checks passed.');
