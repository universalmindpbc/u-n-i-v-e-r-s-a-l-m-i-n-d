// Standard Search API only. Its fixed $0.005/request price is reserved before
// network dispatch. Uncertain outcomes retain the reservation; no automatic retry.
// https://docs.perplexity.ai/docs/getting-started/pricing (9 November 2026)
export async function reserveLiteratureSearch(storage,env){
 const limit=Number(env.PERPLEXITY_TOTAL_LIMIT_USD||0),enabled=env.PERPLEXITY_ENABLED==='true';
 if(!enabled||!Number.isFinite(limit)||limit<=0)return {allowed:false,reason:'not_enabled'};
 return storage.transaction(async txn=>{const ledger=await txn.get('literature-search')||{reservedUSD:0,requests:0};
  if(ledger.reservedUSD+.005>limit+1e-9)return {allowed:false,reason:'allowance_used'};
  ledger.reservedUSD=Math.round((ledger.reservedUSD+.005)*1000)/1000;ledger.requests++;await txn.put('literature-search',ledger);return {allowed:true,reservation:ledger.requests,reservedUSD:ledger.reservedUSD,limitUSD:limit};});
}
export async function perplexitySearch(env,args){
 if(env.PERPLEXITY_ENABLED!=='true'||!env.PERPLEXITY_API_KEY)return {status:'not_configured',message:'Optional web discovery is not active. PubMed and Europe PMC remain available.'};
 if(typeof args.query!=='string'||args.query.trim().length<3||args.query.length>600||typeof args.reason!=='string'||args.reason.trim().length<10)return {status:'invalid_query',message:'Provide a focused scientific query and the evidence gap left by PubMed and Europe PMC.'};
 const guard=await (env.SHARED_RESEARCH_BUDGET||env.BUDGET).get((env.SHARED_RESEARCH_BUDGET||env.BUDGET).idFromName('literature-search-v1')).fetch('https://budget/literature',{method:'POST',body:JSON.stringify({literatureSearch:true})});
 const reservation=await guard.json();if(!reservation.allowed)return {status:'allowance_unavailable',message:'The optional discovery allowance is unavailable. Continue with public literature tools.'};
 try{
  const response=await fetch('https://api.perplexity.ai/search',{method:'POST',headers:{Authorization:'Bearer '+env.PERPLEXITY_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({query:args.query,search_type:'web',max_results:5,max_tokens:6000,max_tokens_per_page:1200,search_domain_filter:['pubmed.ncbi.nlm.nih.gov','pmc.ncbi.nlm.nih.gov','europepmc.org','nature.com','frontiersin.org','science.org','cell.com','plos.org','elifesciences.org','academic.oup.com','link.springer.com','wiley.com','sciencedirect.com']}),redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(!response.ok)return {status:'source_unavailable',httpStatus:response.status,message:'Optional discovery did not return results. Its spending reservation remains retained.'};
  const data=await response.json(),retrievedAt=new Date().toISOString();
  return {status:'retrieved',query:args.query,reason:args.reason,provider:'Perplexity Search',requestId:data.id,receipt:{retrievedAt,reservation:reservation.reservation,reservedUSD:.005},results:(data.results||[]).slice(0,5).filter(r=>{try{return new URL(r.url).protocol==='https:';}catch{return false;}}).map(r=>({title:String(r.title||'').slice(0,500),url:r.url,text:String(r.snippet||'').slice(0,5000),published:r.date||null,updated:r.last_updated||null,coverage:'search-extracted text'})),interpretation:'Discovery results, not a completed scientific review. Verify the original paper and its metadata before treating a result as evidence. Do not describe extracted snippets as a full paper reading.'};
 }catch{return {status:'source_unavailable',message:'Optional discovery was interrupted. Its reservation remains retained; no automatic retry was sent.'};}
}
