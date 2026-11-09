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
  if(command.action==='hardware_capabilities')return answer('The project has recorded measurements from QuEra Aquila through Amazon Braket. I can help you retrieve those results and start supported Quantum Agents investigations using recorded measurements and CPU simulations.\n\nNew hardware submissions are disabled in this chat, so I cannot send a new algorithm to Aquila or another quantum computer from here.');
  if(command.action==='capabilities')return answer('Yes. On this Quantum Atlas page, I am connected to the Quantum Agents swarm: GPT-6 Astra with Max reasoning and Gemini 4 Argon with High Thinking. I can draft your question, start a supported investigation, check its progress and explain its saved results.\n\nYou can dictate into this text chat and select Send, type your command, or use Voice. To begin, say “Run this study.” New paid quantum and GPU jobs remain disabled.');
  if(command.action==='draft'){
   if(!command.question.trim())return answer('What scientific question do you want the Quantum Agents to investigate?');
   study.draft(command.question);return answer('Your study question is ready: '+command.question+' Say “Run this study” when you are ready.');
  }
  if(command.action==='start'){
   if(!command.question.trim())return answer('What scientific question do you want the Quantum Agents to investigate?');
   const result=await study.start(command.question);
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
