'use strict';
// One conversation and one study: use the same session, form and receipts.
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
  if(command.action==='draft'){
   if(!command.question.trim())return answer('What scientific question do you want the Quantum Agents to investigate?');
   study.draft(command.question);return answer('I have filled the Quantum form with: '+command.question+' Say “Run this study” or select Explore my question when you are ready.');
  }
  if(command.action==='start'){
   if(!command.question.trim())return answer('What scientific question do you want the Quantum Agents to investigate?');
   const result=await study.start(command.question);
   return answer(result.message+'\n\nQuestion: '+result.question+'\n\nAsk me for progress or the results. You can also follow the study on this page.');
  }
  const result=await study.inspect();
  if(!result)return answer('There is no saved study in this browser session. Tell me the question you want to investigate, or ask me to run the question in the Quantum form.');
  if(command.action==='status')return answer(result.message+'\n\nQuestion: '+result.question);
  if(!result.report)return answer(result.message+' The final report is not available yet.');
  const report=result.report,n=report.narrative||{};
  return answer([n.answer,n.meaning,n.next_dependency,'The full report and JSON/CSV downloads are available through Open insights on the Quantum page.'].filter(Boolean).join('\n\n'));
 }
 window.UniversalOneQuantum={
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
