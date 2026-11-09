'use strict';
// One conversation and one study: use the same session, conversation and receipts.
(() => {
 let running=null;
 const frame=()=>document.getElementById('quantum-frame');
 function client(){
  if(document.getElementById('experience')?.dataset.area!=='quantum')return null;
  try{return frame()?.contentWindow?.QuantumStudyConversation||null;}catch{return null;}
 }
 const source=()=>[{label:'S1',title:'Your Quantum Atlas study',url:location.origin+'/informatics/quantum/',kind:'atlas'}];
 function answer(value){return {answer:value,sources:source(),version:'quantum-conversation-v1'};}
 async function perform(command){
  const study=client();if(!study)throw Error('Open Quantum Atlas to use its study commands.');
  if(command.action==='portal_access'){await study.openPortal();return answer('Enter your I AM portal password in the access window. Your password stays outside our conversation.');}
  if(command.action==='portal_experiment'){
   if(!command.question.trim())return answer('What research question do you want to investigate? We can refine it together, then prepare an experiment within your study credit.');
   const result=await study.prepareExperiment(command.question);return answer(result.message+'\n\nYour question: '+result.question+'\n\nYour proposed investigation will appear here for review before it starts.');
  }
  if(command.action==='hardware_capabilities')return answer('Universal Informatics connects to quantum computing through Amazon Braket. With I AM portal access, we can develop a funded experiment around your research question. Describe what you want to investigate. Astra and Gemini help prepare the approach, Wolfram checks the mathematical model, and the service checks the computing requirements against your included credit. You review a plain-language proposal before launch.\n\nThe question is yours. OXTR is one worked example, and its program count and shot count do not constrain your study. Available execution depends on the connected device and validated operation support.');
  if(command.action==='capabilities')return answer('Yes. I am connected to the Quantum Agents swarm: GPT-6 Astra with Max reasoning and Gemini 4 Argon with High Thinking. We can refine your question, prepare a supported experiment, follow its progress and explain the findings. Wolfram Quantum Framework is part of the project’s mathematical workflow; each study records the tools actually used.\n\nI AM portal access unlocks a funded study within the shared demo pool. Text, dictation and Voice share this conversation.');
  if(command.action==='draft'){
   if(!command.question.trim())return answer('What scientific question do you want the Quantum Agents to investigate?');
   study.draft(command.question);return answer('Your study question is ready: '+command.question+' Say “Run this study” when you are ready.');
  }
  if(command.action==='start'){
   if(!command.question.trim())return answer('What scientific question do you want the Quantum Agents to investigate?');
   const access=await study.portalAccess().catch(()=>null);
   const result=access?.authenticated?await study.prepareExperiment(command.question):await study.start(command.question);
   return answer(result.message+'\n\nQuestion: '+result.question+'\n\nProgress and results appear automatically in our conversation. You can keep talking while the study runs.');
  }
  const result=await study.inspect();
  if(!result)return answer('There is no saved study in this browser session. Tell me the question you want to investigate, or ask me to run the question in this conversation.');
  if(command.action==='status')return answer(result.message+'\n\nQuestion: '+result.question);
  if(!result.report)return answer(result.message+' The final report is not available yet.');
  const report=result.report,n=report.narrative||{};
  return answer([n.answer,n.meaning,n.next_dependency,'The full report and JSON/CSV downloads are available through Open insights on the Quantum page.'].filter(Boolean).join('\n\n'));
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
  async answer(question,history,request,signal){
   const study=client();if(!study)return null;
   if(running)throw Error('A study command is already being processed. Ask for progress after it returns.');
   running=(async()=>{
    const context=study.context();
    const command=await(await request('/quantum/command',{question,history,currentQuestion:context.question,savedQuestion:context.savedQuestion,studyStatus:context.status},signal)).json();
    if(signal?.aborted)throw new DOMException('Command cancelled.','AbortError');
    return command.action==='research'?null:await perform(command);
   })();
   try{return await running;}finally{running=null;}
  }
 };
})();
