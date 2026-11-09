import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.resolve('../../../cloudflare/node_modules/wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=require('miniflare'),{build}=require('esbuild');
const live=process.env.LIVE==='1',out=import.meta.dirname,checks=[];
const bundle=await build({stdin:{resolveDir:process.cwd(),sourcefile:'runtime-test.js',contents:`
import {searchLiterature,readPaper,literatureTool} from './cloudflare/informatics-literature.js';
import {perplexitySearch} from './cloudflare/informatics-literature-fallback.js';
import {perplexityResearch} from './cloudflare/informatics-literature-agent.js';
const env={PERPLEXITY_ENABLED:'true',PERPLEXITY_AGENT_ENABLED:'true',PERPLEXITY_API_KEY:'runtime-fixture',BUDGET:{idFromName:n=>n,get:()=>({fetch:async()=>Response.json({allowed:true,reservation:1,reservedUSD:.75,settled:true})})}};
export default {async fetch(request){
 const route=new URL(request.url).pathname,redirectProbe=route.startsWith('/redirect/'),p=route.replace('/redirect','');
 if(p==='/original'){try{await fetch('https://www.ebi.ac.uk/probe',{redirect:'error'});return Response.json({failed:false});}catch(e){return Response.json({failed:true,message:e.message});}}
 if(p==='/search')return Response.json(await searchLiterature({query:'CD38 oxytocin'+(redirectProbe?' redirect':'')}));
 if(p==='/read')return Response.json(await literatureTool('read_research_paper',{id:redirectProbe?'PMC4383903':'PMC4383902',query:'methods'}));
 if(p==='/perplexity')return Response.json(await perplexitySearch(env,{query:'CD38 oxytocin',reason:'Identify an original source missing from the current evidence.'}));
 if(p==='/agent')return Response.json(await perplexityResearch(env,{query:'Fixture literature investigation',reason:'Verify the bounded provider transport in the Worker runtime.'}));
 return new Response('Not found',{status:404});
}};`},bundle:true,format:'esm',platform:'browser',write:false});
let redirect=false,calls=[];
const fixture=async req=>{
 const u=new URL(req.url);calls.push({host:u.host,path:u.pathname});
 if(redirect)return new Response(null,{status:302,headers:{Location:'https://untrusted.invalid/credential-trap'}});
 if(u.pathname.includes('esearch'))return Response.json({esearchresult:{count:'1',idlist:['12345']}});
 if(u.pathname.includes('esummary'))return Response.json({result:{'12345':{title:'CD38 fixture',pubdate:'2026',authors:[],articleids:[],pubtype:[]}}});
 if(u.pathname.endsWith('fullTextXML'))return new Response('<article><body><sec><title>Methods</title><p>'+('Measured controls and observations. '.repeat(7))+'</p></sec></body></article>');
 if(u.host==='www.ebi.ac.uk')return Response.json({hitCount:1,resultList:{result:[{id:'12345',pmid:'12345',pmcid:'PMC4383902',title:'CD38 fixture',abstractText:'Fixture abstract',isOpenAccess:'Y'}]}});
 if(u.pathname==='/search')return Response.json({id:'search-fixture',results:[{title:'Fixture paper',url:'https://pubmed.ncbi.nlm.nih.gov/12345/',snippet:'Fixture finding'}]});
 if(u.pathname==='/v1/agent')return Response.json({id:'agent-fixture',model:'anthropic/claude-opus-5-5',status:'completed',usage:{input_tokens:100,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:'The available evidence has limitations.'}]}]});
 throw Error('Unexpected outbound request '+u.host+u.pathname);
};
const options={modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-07-03',cf:false,cache:false,...(live?{}:{outboundService:fixture})};
const mf=new Miniflare(convertV4MiniflareOptions(options));
try{
 const invoke=async p=>(await mf.dispatchFetch('https://runtime.test'+p)).json();
 const original=await invoke('/original');assert(original.failed);assert.match(original.message,/redirect/i);checks.push({originalModeRejected:true,message:original.message});
 const search=await invoke('/search');assert.equal(search.status,'retrieved');assert(search.searches.every(s=>s.status==='retrieved'));assert(search.papers.length);checks.push({search:{status:search.status,sources:search.searches.map(s=>({source:s.source,status:s.status,receipt:s.receipt})),papers:search.papers.map(p=>({id:p.id,title:p.title,url:p.url}))}});
 const read=await invoke('/read');assert.equal(read.fullTextStatus,'retrieved');assert(read.passages.length);checks.push({read:{status:read.status,coverage:read.coverage,fullTextReceipt:read.fullTextReceipt,passages:read.passages.length}});
 if(!live){
  assert.equal((await invoke('/perplexity')).status,'retrieved');assert.equal((await invoke('/agent')).status,'completed');checks.push({perplexityTransport:'Search and Agent API success fixtures dispatched by workerd'});
  redirect=true;calls=[];
  assert.equal((await invoke('/redirect/search')).status,'source_unavailable');assert.equal((await invoke('/redirect/read')).status,'source_unavailable');assert.equal((await invoke('/perplexity')).status,'source_unavailable');assert.equal((await invoke('/agent')).status,'source_unavailable');assert.equal(calls.length,5);assert(calls.every(c=>c.host!=='untrusted.invalid'));checks.push({redirectResponsesRejected:true,redirectTargetsContacted:0});
 }
 const record={passed:true,runtime:'Cloudflare workerd via Miniflare',livePublicSources:live,paidRequests:0,checks};await fs.writeFile(out+(live?'/runtime-live.json':'/runtime-regression.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
}finally{await mf.dispose();}
