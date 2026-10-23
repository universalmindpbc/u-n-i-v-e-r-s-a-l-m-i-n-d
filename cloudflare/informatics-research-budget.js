// A question is reserved once. Its bounded retrieval/model loop is included.
// Automated verification uses a separately authenticated, equally bounded pool.
const limits={research_question:120,transcription:60,speech:60,voice:20};
export class BudgetError extends Error {
 constructor(kind,resetAt){super(`The daily ${kind==='research_question'?'research':kind} allowance is used. It resets at 00:00 UTC. Please try again after the reset.`);this.status=429;this.code='daily_allowance';this.kind=kind;this.resetAt=resetAt;}
}
export class ResearchBudget {
 constructor(state){this.state=state;}
 async fetch(request){
  const {kind,inspect}=await request.json();
  if(!inspect&&!limits[kind])return new Response('{}',{status:400});
  const date=new Date().toISOString().slice(0,10),resetAt=new Date(Date.parse(date)+86400000).toISOString();
  return this.state.storage.transaction(async txn=>{
   const stored=await txn.get('quota');
   const state=stored?.date===date?stored:{date,counts:{}};
   if(inspect)return Response.json({date,counts:state.counts,limits,resetAt});
   const used=state.counts[kind]||0;
   if(used>=limits[kind])return Response.json({allowed:false,kind,resetAt},{status:429});
   state.counts[kind]=used+1;await txn.put('quota',state);
   return Response.json({allowed:true,remaining:limits[kind]-used-1,resetAt});
  });
 }
}
export async function budget(env,kind){
 const response=await env.BUDGET.get(env.BUDGET.idFromName(env.QUOTA_SCOPE==='qa'?'staging-qa':'staging')).fetch('https://budget/check',{method:'POST',body:JSON.stringify({kind})});
 if(!response.ok){const detail=await response.json();throw new BudgetError(kind,detail.resetAt);}
}
export async function budgetStatus(env){
 const result={};
 for(const [label,id]of [['visitors','staging'],['verification','staging-qa']])result[label]=await(await env.BUDGET.get(env.BUDGET.idFromName(id)).fetch('https://budget/status',{method:'POST',body:JSON.stringify({inspect:true})})).json();
 return result;
}
