'use strict';
// One conversation and one study: use the same session, conversation and receipts.
(() => {
 let running=null;
 const frame=()=>document.getElementById('quantum-frame');
 function client(){
  if(document.getElementById('experience')?.dataset.area!=='quantum')return null;
  try{return frame()?.contentWindow?.QuantumStudyConversation||null;}catch{return null;}
 }
 async function perform(command){
  const study=client();if(!study)throw Error('Open Quantum Atlas to use its study commands.');
  const receipt={action:command.action,question:command.question||''};
  if(command.action==='portal_access'){await study.openPortal();return {...receipt,effect:'portal_window_opened'};}
  if(['portal_experiment','draft','start'].includes(command.action)&&!receipt.question.trim())return {...receipt,effect:'research_question_missing'};
  if(command.action==='portal_experiment'){const result=await study.prepareExperiment(receipt.question);return {...receipt,studyId:result.id||'',effect:result.id?'study_requested':'portal_window_opened'};}
  if(command.action==='draft'){study.draft(receipt.question);return {...receipt,effect:'draft_updated'};}
  if(command.action==='start'){
   const access=await study.portalAccess().catch(()=>null);
   const result=access?.authenticated?await study.prepareExperiment(receipt.question):await study.start(receipt.question);
   return {...receipt,studyId:result.id||'',effect:result.id?'study_requested':'question_prepared'};
  }
  const result=await study.inspect();return {...receipt,studyId:result?.id||'',effect:result?'study_inspected':'no_saved_study'};
 }
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame()?.contentWindow)return;
  if(e.data?.type==='quantum:conversation-ready')window.dispatchEvent(new CustomEvent('universal-one:quantum-ready'));
  if(e.data?.type==='quantum:study-progress')window.dispatchEvent(new CustomEvent('universal-one:study',{detail:e.data.task}));
 });
 window.UniversalOneQuantum={
  openResults:()=>client()?.openResults(),
  openProgress:()=>client()?.openProgress(),
  available:()=>!!client(),
  async researchHeaders(){const study=client();if(!study)return {};try{await study.ensureSession();return study.headers();}catch{return {};}} ,
  async answer(question,history,request,signal){
   const study=client();if(!study)return null;
   if(running)throw Error('A study command is already being processed. Ask for progress after it returns.');
   running=(async()=>{
    const context=study.context();
    const command=await(await request('/quantum/command',{question,history,currentQuestion:context.question,savedQuestion:context.savedQuestion,studyStatus:context.status},signal)).json();
    if(signal?.aborted)throw new DOMException('Command cancelled.','AbortError');
    return ['research','capabilities','hardware_capabilities'].includes(command.action)?null:await perform(command);
   })();
   try{return await running;}finally{running=null;}
  }
 };
})();
