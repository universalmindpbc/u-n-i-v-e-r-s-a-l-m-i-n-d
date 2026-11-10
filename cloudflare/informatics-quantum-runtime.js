import {researchIdentity,astraRoute} from './informatics-astra.js';
import {demoRoute} from './informatics-quantum-demo.js';

// Operational facts come from configuration and authenticated services, never
// from historical papers, client claims about login, or prepared reply text.
export async function quantumRuntime(env,request,context={}){
 if(context.area!=='quantum')return null;
 const session=Boolean(await researchIdentity(request,env));
 const enabled=env.QUANTUM_PLANNING_ENABLED==='true'&&env.ASTRA_ENABLED==='true';
 const facts={version:'quantum-runtime-20261110-v2',checkedAt:new Date().toISOString(),
  conversation:{model:env.RESEARCH_MODEL,reasoning:env.RESEARCH_REASONING_EFFORT||'low',portalRequired:false},
  studyService:{enabled,sessionVerified:session,agents:{astra:'max',gemini:'HIGH'}},
  cudaq:{connected:enabled,execution:'local CPU in the study worker',paths:['supported classical study with local CUDA-Q program checks','validated portal experiment simulation before hardware review'],portalRequiredForAllCPUUse:false,arbitraryCodeExecution:false,paidGPUEnabled:false},
  wolfram:{connected:enabled,role:'mathematical modelling and checks in the validated portal experiment workflow'},
  hardware:{executor:'QuEra Aquila through Amazon Braket',arbitraryBraketDeviceSelection:false,launchNeedsReviewedPlanAndExplicitConfirmation:true,liveDeviceAvailabilityChecked:false},
  portalInterface:{control:'Password',location:'beside Dictate and Voice in the chat',statusCheckedOnEveryMessage:true,pageRefreshRequired:false},
  portal:{state:session?'checking':'not_verified',authenticated:false,credit:null,serviceAvailable:null},
  action:null};
 if(session){
  try{
   const response=await demoRoute(new Request(new URL('/agent/demo/access',request.url),{headers:request.headers}),env);
   if(response.ok){const access=await response.json();facts.portal={state:'verified',authenticated:access.authenticated===true,credit:access.authenticated===true?access.credit:null,serviceAvailable:access.available===true};}
   else facts.portal.state='unavailable';
  }catch{facts.portal.state='unavailable';}
 }
 const action=context.quantumAction;
 if(action){
  facts.action={type:action.action,clientEffect:action.effect||null,question:action.question||'',verification:'client UI receipt; not a server execution receipt'};
  if(action.studyId&&session){
   const response=await astraRoute(new Request(new URL('/agent/studies/'+action.studyId,request.url),{headers:request.headers}),env);
   if(response.ok){const study=await response.json();facts.action={type:action.action,verification:'server verified study',study:{id:study.id,question:study.question,status:study.status,stage:study.stage,message:study.message,narrative:study.report?.narrative||null,reviews:study.reviews?.map(r=>({phase:r.phase,decision:r.decision})),modelSettings:study.report?.model_settings||null}};}
   else facts.action.verification='study not verified in this session';
  }
 }
 return facts;
}

export const runtimeInstructions=`Answer the visitor's actual question as a natural ongoing conversation. Resolve short follow-ups such as "and now?" from the conversation and the fresh operational facts. Give the direct answer first. Do not substitute a generic platform introduction, repeat an earlier paragraph, or invite a study when the visitor only asked about access. Login changes funded-study permission, never the model's intelligence, honesty or ability to discuss research.
The server-provided operational facts describe the integrated assistant and study service. Retrieval tools alone are read-only, but that does not make the whole Quantum chat read-only. CUDA-Q is connected through local CPU simulation in supported study workflows; distinguish this from a paid GPU service and from physical quantum hardware. Portal login does not turn CUDA-Q itself on. Access does not mean a calculation has already run. Do not claim arbitrary code execution, GPU access, unrestricted device choice, or live device availability. Mention only limits relevant to the question. A historical study saying no new hardware ran describes that study, not a current system-wide prohibition.
Use authenticated portal state only from the server facts, never from a user saying they logged in. When state is unavailable, state that uncertainty briefly. Portal status is checked again on every message and no page refresh is required. If this session is not authenticated, direct the visitor to the Password control beside Dictate and Voice; do not invent a refresh requirement. An unauthenticated session has unverified credit, not proof that the visitor's code has zero credits. Only describe a credit balance when authenticated. Do not repeat access status when it is unrelated to the current question. An operation is complete only when its verified receipt confirms it. A client UI effect can confirm a draft or opened access window, not a submitted calculation. Never ask for a password in the conversation. For scientific claims use the research tools and cite evidence; operational capability answers need no invented publication citation. Keep ordinary replies concise and omit backend diagnostics unless the visitor explicitly requests QA. Correct earlier inaccurate statements directly.`;
