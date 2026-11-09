// Inline view of the same Universal One conversation used by the floating assistant.
export function setupConversation(){
 const $=s=>document.querySelector(s),log=$('#quantum-chat-log'),input=$('#question'),form=$('#question-form');
 const status=$('#question-status'),progress=$('#conversation-progress');let assistant,unsubscribe,signature='',lastDraft='',lastRecording=false;
 const element=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 function render(value){
  $('#ask').classList.toggle('has-conversation',value.messages.length>0);const next=JSON.stringify(value.messages);if(next!==signature){
   const nearEnd=log.scrollHeight-log.scrollTop-log.clientHeight<70;signature=next;log.replaceChildren();
   if(!value.messages.length)log.append(element('p','Tell me what you want to investigate. We can refine your question together, then run a study and discuss the findings.','chat-welcome'));
   for(const m of value.messages){const article=element('article','','chat-message');article.dataset.role=m.role;article.append(element('h3',m.role==='user'?'You':'Universal One'),element('div',m.text,'chat-answer'));
    if(m.sources?.length){const details=element('details',''),summary=element('summary',m.sources.length+' sources');details.append(summary);for(const source of m.sources){try{const url=new URL(source.url);if(!['https:','http:'].includes(url.protocol))continue;const a=element('a',source.title);a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}catch{}}article.append(details);}
    if(m.studyId){const button=element('button','Read the full findings');button.type='button';button.onclick=()=>window.QuantumStudyConversation.openResults();article.append(button);}
    log.append(article);
   }
   if(nearEnd)log.scrollTop=log.scrollHeight;
  }
  if(value.draft!==lastDraft&&value.draft){input.value=value.draft;}lastDraft=value.draft;
  status.textContent=value.status;$('#ask-button').disabled=value.busy||value.mode==='voice';$('#chat-dictate').disabled=value.busy||value.mode==='voice';$('#chat-dictate').setAttribute('aria-pressed',String(value.recording));$('#chat-dictate span').textContent=value.recording?'Finish dictation':'Dictate';
  $('#chat-voice').setAttribute('aria-pressed',String(value.mode==='voice'));$('#chat-voice span').textContent=value.mode==='voice'?'End voice':'Voice';$('#chat-stop').hidden=!value.busy&&!value.recording;
  $('#chat-mute').hidden=value.mode!=='voice';$('#chat-mute').setAttribute('aria-pressed',String(value.live.muted));$('#chat-mute').textContent=value.live.muted?'Unmute':'Mute';
  $('#chat-interrupt').hidden=value.mode!=='voice'||!value.live.active;
  input.readOnly=value.mode==='voice';if(lastRecording&&!value.recording)input.focus({preventScroll:true});lastRecording=value.recording;
  const task=value.study;progress.hidden=!task;if(task){progress.dataset.state=task.status;$('#conversation-stage').textContent=task.status==='awaiting_confirmation'?'Experiment ready to review':task.status==='complete'?'Findings ready':task.status==='failed'?'Analysis stopped':task.status==='needs_attention'?'Study paused':task.status==='cancelled'?'Study cancelled':task.status==='queued'?'Study queued':'Study in progress';$('#conversation-detail').textContent=task.message;progress.querySelector('small').textContent=task.status==='complete'?'Findings saved. Ask a follow-up question below.':task.status==='awaiting_confirmation'?'Your investigation is prepared. Review it before starting.':'Updates automatically. Your study continues while you chat.';$('#conversation-open').textContent=task.status==='awaiting_confirmation'?'Review experiment':task.report?'Read findings':'View study progress';$('#conversation-open').onclick=()=>task.report?window.QuantumStudyConversation.openResults():window.QuantumStudyConversation.openProgress();}
 }
 function connect(){
  try{assistant=parent.UniversalOneResearch;}catch{}
  if(!assistant?.subscribe){status.textContent='Connecting to Universal One…';return setTimeout(connect,300);}
  unsubscribe=assistant.subscribe(render);$('#ask-button').disabled=false;
 }
 form.onsubmit=e=>{e.preventDefault();const question=input.value.trim();if(!question||!assistant)return;input.value='';assistant.send(question);};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});
 $('#chat-dictate').onclick=()=>assistant?.dictate();$('#chat-voice').onclick=()=>assistant?.getState().mode==='voice'?assistant.text():assistant?.voice();$('#chat-stop').onclick=()=>assistant?.stop();$('#chat-mute').onclick=()=>assistant?.mute();$('#chat-interrupt').onclick=()=>assistant?.interrupt();
 window.addEventListener('pagehide',()=>unsubscribe?.());connect();
}
