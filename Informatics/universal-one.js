'use strict';
(() => {
 const endpoints={'staging.universalmind.tv':'https://informatics-universal-one-staging.universalmind.workers.dev','universalmind.tv':'https://informatics-universal-one.universalmind.workers.dev'};
 const endpoint=endpoints[location.hostname];
 const helperRoot=new URL('.',document.currentScript.src);let helperPromise=null,helperAttempt=0;
 function ensureHelpers(){
  if(window.UniversalOneContext&&window.UniversalOneNeedsResearch)return Promise.resolve();
  if(!helperPromise){const attempt=helperAttempt++,url=(name,version)=>{const value=new URL(name,helperRoot);value.searchParams.set('v',version);if(attempt)value.searchParams.set('retry',String(attempt));return value.href;};
   helperPromise=Promise.all([import(url('universal-one-routing.js','3')),import(url('universal-one-context.js','3'))]).then(([routing,context])=>{window.UniversalOneNeedsResearch=routing.needsResearch;window.UniversalOneContext=context;}).catch(()=>{helperPromise=null;throw Error('Chat tools did not load. Please select Send to retry.');});
  }return helperPromise;
 }
 if(!endpoint||!window.UniversalOneIdentity)return;
 ensureHelpers().catch(()=>{});
 const host=window.parent!==window&&window.parent.location.origin===location.origin?window.parent:window;
 if(host!==window&&host.UniversalOneResearch){window.UniversalOneResearch=host.UniversalOneResearch;return;}
 const root=document.createElement('section');root.className='uo iam-realtime-voice';root.dataset.mode='text';root.dataset.state='idle';
 root.setAttribute('aria-label','Universal One research assistant');
 root.style.setProperty('--iam-mini-planet-texture',`url("${UniversalOneIdentity.texture(0)}")`);
 const icons={mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/><path class="uo-mic-slash" d="m3 3 18 18"/>',end:'<path d="M3 15c5-5 13-5 18 0l-2 4-4-2v-3M9 14v3l-4 2-2-4Z"/>',transcript:'<path d="M4 4h16v13H9l-5 4V4Z"/><path d="M8 8h8M8 12h5"/>',text:'<path d="m4 16-1 5 5-1L21 7l-4-4L4 16Zm10-10 4 4"/>',reconnect:'<path d="M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5"/>',interrupt:'<rect x="6" y="6" width="12" height="12" rx="1"/>'};
 const iconButton=(action,label,extra='')=>`<button class="uo-icon" data-${action} type="button" aria-label="${label}" data-label="${label}" ${extra}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[action==='mute'?'mic':action]}</svg></button>`;
 root.innerHTML=`<button class="iam-realtime-voice__summon" type="button" aria-label="Ask a research question" aria-expanded="false" aria-controls="uo-panel uo-voice-menu"><span class="iam-realtime-planet" aria-hidden="true"><span class="iam-realtime-planet__surface"></span><span class="iam-realtime-planet__atmosphere"></span></span><span class="iam-realtime-voice__invitation" aria-hidden="true"><span>Ask a research question</span></span></button>
 <section id="uo-panel" class="uo-panel" aria-label="Universal One conversation" hidden>
 <header class="uo-header"><h2>Universal One</h2><p>Research with GPT-6 Astra</p><button class="uo-minimize" type="button" aria-label="Minimize conversation">−</button><button class="uo-close" type="button" aria-label="Close Universal One">×</button><div class="uo-modes" role="group" aria-label="Conversation mode"><button type="button" data-mode="text" aria-pressed="true">Text</button><button type="button" data-mode="voice" aria-pressed="false">Voice</button></div></header>
 <div class="uo-log" role="log" aria-label="Research conversation" aria-live="polite"><p class="uo-welcome">Ask about a paper, a molecular target or an Atlas record.</p></div>
 <form class="uo-compose"><div class="uo-input-status"><canvas class="iam-realtime-voice__waveform" data-waveform width="64" height="64" aria-hidden="true" hidden></canvas><p class="uo-status" role="status">Ready when you are.</p></div><label for="uo-question" class="sr-only">Research question</label><textarea id="uo-question" maxlength="4000" placeholder="Ask a research question…" rows="2"></textarea><div class="uo-actions"><button type="button" data-clear>New chat</button><button type="button" data-record aria-pressed="false">Dictate</button><button type="button" data-stop hidden>Stop</button><button type="submit" data-send>Send ↑</button></div></form>
 </section>
 <section class="uo-dock" aria-label="Voice controls" hidden><div class="uo-input-status"><canvas class="iam-realtime-voice__waveform" data-waveform width="64" height="64" aria-hidden="true"></canvas><p class="uo-dock-status" role="status">Ready when you are.</p></div><div class="uo-dock-actions">${iconButton('mute','Mute microphone','aria-pressed="false"')}${iconButton('interrupt','Interrupt response','hidden')}${iconButton('reconnect','Reconnect voice','hidden')}${iconButton('end','End voice conversation')}</div><small class="uo-voice-disclosure">AI voice</small><div id="uo-voice-menu" class="uo-voice-menu" role="group" aria-label="Conversation options" hidden>${iconButton('transcript','Show transcript','aria-expanded="false" aria-controls="uo-panel"')}${iconButton('text','Switch to text')}</div></section>`;
 document.body.append(root);
 const $=s=>root.querySelector(s),panel=$('.uo-panel'),summon=$('.iam-realtime-voice__summon'),menu=$('.uo-voice-menu'),dock=$('.uo-dock'),log=$('.uo-log'),composer=$('textarea'),status=$('.uo-status'),recordButton=$('[data-record]'),stopButton=$('[data-stop]'),sendButton=$('[data-send]');
 let mode='text',inlineVoice=false,opened=false,busy=false,controller=null,stream=null,recorder=null,recordTimer=0,generation=0,audio=null,audioURL=null,inputGateUntil=0;
 const audioOwner=Symbol('Universal One'),duck=active=>window.UniversalOneAudio?.set(audioOwner,active);
 host.UniversalOneConversation ||= [];const history=host.UniversalOneConversation;let atlasContext=null,libraryContext=null,messageNumber=0,pendingTurn=null;
 const listeners=new Set();let latestStudy=null;const completedStudies=new Set();
 const snapshot=()=>({messages:[...log.querySelectorAll('.uo-message')].map(n=>n.conversationMessage),status:status.textContent,state:root.dataset.state,busy,mode,inlineVoice,recording:recorder?.state==='recording',draft:composer.value,study:latestStudy,live:live.getState()});
 function publish(){queueMicrotask(()=>{const value=snapshot();for(const listener of listeners)listener(value);});}
 function remember(){if(window.UniversalOneQuantum?.available())try{localStorage.setItem('universal-one-quantum-conversation-v1',JSON.stringify(history));}catch{}}
 document.addEventListener('atlas:record',e=>{atlasContext={record:e.detail?.id,view:e.detail?.view};});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='informatics:research-context')libraryContext=e.data.context;});
 const context=()=>{const frame=document.querySelector('.library-overlay[open] iframe');return {page:location.pathname,area:document.querySelector('#experience')?.dataset.area,atlas:atlasContext||Object.fromEntries(new URLSearchParams(location.search)),library:frame?.contentWindow?.UniversalResearchContext?.()||window.UniversalResearchContext?.()||libraryContext};};
 const say=text=>{status.textContent=text;$('.uo-dock-status').textContent=text;publish();};
 const waveform=UniversalOneWaveform(root,[...root.querySelectorAll('[data-waveform]')],()=>mode==='voice'?live.getState().inputEnabled:!!stream?.getAudioTracks().some(t=>t.enabled));
 function labelButton(button,label){button.setAttribute('aria-label',label);button.dataset.label=label;}
 function state(name,label){root.dataset.state=name;say(label);const muted=live.getState().muted;$('[data-mute]').setAttribute('aria-pressed',String(muted));labelButton($('[data-mute]'),muted?'Unmute microphone':'Mute microphone');$('[data-mute]').disabled=!live.getState().active;$('[data-reconnect]').hidden=name!=='error';$('[data-mute]').hidden=name==='error';$('[data-interrupt]').hidden=!live.getState().active||!['thinking','speaking'].includes(name);if(name==='error')duck(false);}
 const live=UniversalOneLive({request,history:()=>history,context,answer:answerQuestion,onState:state,onMicrophone:mic=>{if(mic)waveform.start(mic);else waveform.stop();},onUser:text=>{history.push({role:'user',content:text});message('user',text);},onAssistant:(text,sources)=>{history.push({role:'assistant',content:text,sources});message('assistant',text,sources);}});
 // Keep one conversation in the most recently opened dialog. DOM order differs
 // from modal order when Research opens from the gene-network lightbox.
 let dialogStack=[...document.querySelectorAll('dialog[open]')],placementHost=null;
 function sizeResearchHost(){
  const library=placementHost?.matches('.library-overlay');
  if(library){root.style.setProperty('--uo-space-width',`${placementHost.clientWidth}px`);root.style.setProperty('--uo-space-height',`${placementHost.clientHeight-(placementHost.querySelector('.library-overlay-bar')?.offsetHeight||0)}px`);}
  else{root.style.removeProperty('--uo-space-width');root.style.removeProperty('--uo-space-height');}
 }
 const hostResize=new ResizeObserver(sizeResearchHost);
 function placeInExperience(){
  dialogStack=dialogStack.filter(d=>d.isConnected&&d.open);
  const container=dialogStack.at(-1)||document.fullscreenElement||document.webkitFullscreenElement||document.body;
  if(placementHost!==container){hostResize.disconnect();placementHost=container;if(container.matches('.library-overlay'))hostResize.observe(container);}
  if(root.parentElement!==container)container.append(root);sizeResearchHost();
 }
 document.addEventListener('fullscreenchange',placeInExperience);document.addEventListener('webkitfullscreenchange',placeInExperience);
 new MutationObserver(records=>{for(const {target} of records){if(target.tagName!=='DIALOG')continue;dialogStack=dialogStack.filter(d=>d!==target);if(target.open)dialogStack.push(target);}placeInExperience();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});placeInExperience();
 function sync(){root.dataset.mode=mode;root.classList.toggle('is-active',opened);summon.setAttribute('aria-expanded',String(!panel.hidden||!menu.hidden));dock.hidden=!opened||mode!=='voice'||inlineVoice;$('.uo-compose').hidden=mode==='voice';labelButton($('[data-transcript]'),panel.hidden?'Show transcript':'Hide transcript');$('[data-transcript]').setAttribute('aria-expanded',String(!panel.hidden));$('[data-mute]').hidden=root.dataset.state==='error';$('[data-interrupt]').hidden=!live.getState().active||!['thinking','speaking'].includes(root.dataset.state);for(const b of root.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));}
 function stopAudio(){if(audio){audio.pause();audio.src='';audio=null;inputGateUntil=performance.now()+900;}if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null;}if(!stream)duck(false);}
 function releaseMic(){clearTimeout(recordTimer);stream?.getTracks().forEach(t=>t.stop());stream=null;waveform.stop();$('.uo-compose canvas').hidden=true;recordButton.setAttribute('aria-pressed','false');recordButton.textContent='Dictate';}
 function cancel(){inlineVoice=false;generation++;controller?.abort();controller=null;busy=false;sendButton.disabled=false;stopAudio();if(recorder&&recorder.state!=='inactive'){recorder.onstop=null;recorder.stop();}recorder=null;releaseMic();live.end();duck(false);stopButton.hidden=true;root.dataset.state='idle';$('[data-reconnect]').hidden=true;say('Stopped.');}
 function open(){inlineVoice=false;const quantum=!!window.UniversalOneQuantum?.available();if($('.uo-welcome'))$('.uo-welcome').textContent=quantum?'Discuss your question, then ask me to run the investigation. Progress and results appear automatically in this conversation.':'Ask about a paper, a molecular target or an Atlas record.';composer.placeholder=quantum?'Ask a question or give a Quantum study command…':'Ask a research question…';opened=true;panel.hidden=false;menu.hidden=true;sync();requestAnimationFrame(()=>{log.scrollTop=log.scrollHeight;});if(mode==='text')composer.focus({preventScroll:true});}
 function close(){cancel();mode='text';opened=false;panel.hidden=true;menu.hidden=true;sync();summon.focus({preventScroll:true});}
 function minimize(){panel.hidden=true;menu.hidden=true;sync();summon.focus({preventScroll:true});}
 async function voice(options={}){cancel();inlineVoice=options.inline===true;mode='voice';opened=true;panel.hidden=true;menu.hidden=true;sync();duck(true);await live.start();sync();}
 function textMode(){cancel();mode='text';opened=true;panel.hidden=false;menu.hidden=true;say('Dictate to draft, or type your question.');sync();composer.focus({preventScroll:true});}
 summon.onclick=()=>{if(mode==='voice'&&opened&&panel.hidden){inlineVoice=false;menu.hidden=!menu.hidden;sync();publish();}else if(!panel.hidden)minimize();else open();};$('.uo-close').onclick=close;$('.uo-minimize').onclick=minimize;
 for(const b of root.querySelectorAll('[data-mode]'))b.onclick=()=>b.dataset.mode==='voice'?voice():textMode();
 $('[data-transcript]').onclick=()=>panel.hidden?open():minimize();$('[data-text]').onclick=textMode;$('[data-end]').onclick=close;$('[data-mute]').onclick=()=>live.toggleMute();$('[data-interrupt]').onclick=()=>live.interrupt();$('[data-reconnect]').onclick=voice;
 document.addEventListener('pointerdown',e=>{if(!root.contains(e.target)){menu.hidden=true;sync();}});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened&&(!panel.hidden||!menu.hidden)){e.preventDefault();e.stopPropagation();minimize();}});
 composer.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('.uo-compose').requestSubmit();}});
 async function request(path,body,signal){let response=await window.UniversalOneTransport?.(path,body,signal);if(!response){if(path==='/research'){await ensureHelpers();body=window.UniversalOneContext.compactResearchRequest(body);}else if(path==='/voice-session'){await ensureHelpers();body={manualTurns:true,quantumCommands:!!window.UniversalOneQuantum?.available()};}response=await fetch(endpoint+path,{method:'POST',headers:body instanceof FormData?{}:{'Content-Type':'application/json',...(path==='/research'?await window.UniversalOneQuantum?.researchHeaders():{})},body:body instanceof FormData?body:JSON.stringify(body),signal});}if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.error||'Connection interrupted. Please retry.');}return response;}
 function message(role,text,sources=[]){
  $('.uo-welcome')?.remove();const messageId=++messageNumber;const article=document.createElement('article');article.className='uo-message';article.dataset.role=role;article.conversationMessage={role,text,sources};
  const title=document.createElement('h3');title.textContent=role==='user'?'You':'Universal One';article.append(title);
  const content=document.createElement('div');content.className='uo-answer';
  const fragments=text.replace(/^#{1,4}\s+(.+)$/gm,'**$1**').split(/(\[S\d+\]|\*\*[^*]+\*\*)/g);
  for(const fragment of fragments){const source=sources.find(s=>'['+s.label+']'===fragment);if(source){const link=document.createElement('a');link.href='#uo-'+source.label+'-'+messageId;link.textContent='['+source.label.slice(1)+']';link.onclick=e=>{e.preventDefault();article.querySelector('details').open=true;article.querySelector('#'+CSS.escape(link.hash.slice(1)))?.scrollIntoView({block:'nearest'});};content.append(link);}else if(fragment.startsWith('**')&&fragment.endsWith('**')){const strong=document.createElement('strong');strong.textContent=fragment.slice(2,-2);content.append(strong);}else content.append(document.createTextNode(fragment));}
  article.append(content);
  if(sources.length){const details=document.createElement('details');details.className='uo-sources';const summary=document.createElement('summary');summary.textContent=`${sources.length} ${sources.length===1?'source':'sources'}`;details.append(summary);
   for(const source of sources){const row=document.createElement('div');row.className='uo-source';row.id='uo-'+source.label+'-'+messageId;const link=document.createElement('a');try{const u=new URL(source.url);if(['https:','http:'].includes(u.protocol))link.href=u.href;}catch{}link.target='_blank';link.rel='noopener noreferrer';link.textContent=`[${source.label.slice(1)}] ${source.title}`;row.append(link);const meta=document.createElement('small');meta.textContent=[source.journal,source.year,source.kind==='full-text'?'Full text':source.kind==='atlas'?'Atlas record':source.kind==='patent'?'Filed specification':'Library record',source.section].filter(Boolean).join(' · ');row.append(meta);if(source.authors){const authors=document.createElement('small');authors.textContent=source.authors;row.append(authors);}if(source.rights?.license){const rights=document.createElement('small');const license=source.rights.license;try{const u=new URL(license);if(['https:','http:'].includes(u.protocol)){const link=document.createElement('a');link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Article licence';rights.append(link);}}catch{rights.textContent=license;}row.append(rights);}if(source.text){const quote=document.createElement('blockquote');quote.textContent=source.text;row.append(quote);}if(source.dataRecord){const download=document.createElement('button');download.type='button';download.textContent='Download source record';download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(source.dataRecord,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='public-gene-source.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};row.append(download);}details.append(row);}article.append(details);
  }
  if(role==='assistant'&&mode==='text'){const read=document.createElement('button');read.type='button';read.textContent='Read aloud';read.onclick=()=>{cancel();controller=new AbortController();const token=++generation;speak(text,token).catch(e=>{if(token===generation){duck(false);stopButton.hidden=true;if(e.name!=='AbortError')say(e.message);}});};article.append(read);}
  log.append(article);log.scrollTop=log.scrollHeight;remember();publish();return article;
 }

 async function speak(text,token){
  stopAudio();releaseMic();duck(true);stopButton.hidden=false;root.dataset.state='speaking';say('Preparing voice…');
  const response=await request('/speech',{text:text.replace(/\[S\d+\]/g,'').replace(/[*#]/g,'').slice(0,4000)},controller?.signal);
  const blob=await response.blob();if(token!==generation)return;
  audioURL=URL.createObjectURL(blob);audio=new Audio(audioURL);audio.onended=()=>{stopAudio();stopButton.hidden=true;root.dataset.state='idle';say('Ready when you are.');};
  try{await audio.play();say('Speaking · Sources are available above.');}catch{stopAudio();stopButton.hidden=true;say('Tap Read aloud to hear the answer.');}
 }
 async function answerQuestion(question,signal,visitorQuestion=question){
  await ensureHelpers();
  const command=await window.UniversalOneQuantum?.answer(visitorQuestion,history,request,signal);
  return await(await request('/research',{question,history,context:{...context(),...(command?{quantumAction:command}:{})}},signal)).json();
 }
 async function submit(){
  const question=composer.value.trim();if(!question||busy||mode!=='text')return;
  const token=++generation;busy=true;root.dataset.state='thinking';sendButton.disabled=true;stopButton.hidden=false;controller=new AbortController();stopAudio();releaseMic();
  if(!pendingTurn||pendingTurn.question!==question||!pendingTurn.node.isConnected)pendingTurn={question,node:message('user',question)};composer.value='';say('Thinking…');
  try{const result=await answerQuestion(question,controller.signal);if(token!==generation)return;pendingTurn=null;history.push({role:'user',content:question},{role:'assistant',content:result.answer,sources:result.sources});message('assistant',result.answer,result.sources);say(result.sources?.length?'Answer ready · Sources below.':'Answer ready.');}
  catch(error){if(token===generation&&error.name!=='AbortError'){composer.value=question;say(error.message);}}
  finally{if(token===generation){busy=false;sendButton.disabled=false;stopButton.hidden=true;duck(false);publish();}}
 }
 $('.uo-compose').onsubmit=e=>{e.preventDefault();submit();};stopButton.onclick=cancel;
 recordButton.onclick=async()=>{
  if(recorder?.state==='recording'){recorder.stop();return;}if(busy)return;busy=true;say('Requesting microphone…');const token=++generation;stopAudio();duck(true);
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Recording is unavailable in this browser. You can type your question.');
   const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});captured.getAudioTracks().forEach(t=>{t.enabled=false;});await new Promise(r=>setTimeout(r,Math.max(0,inputGateUntil-performance.now())));
   if(token!==generation||!opened){captured.getTracks().forEach(t=>t.stop());return;}stream=captured;stream.getAudioTracks().forEach(t=>{t.enabled=true;});waveform.start(stream);$('.uo-compose canvas').hidden=false;root.dataset.state='listening';
   const type=['audio/webm;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t)),recording=new MediaRecorder(stream,type?{mimeType:type}:{}),chunks=[];recorder=recording;
   recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recording.onstop=async()=>{
    const mime=recording.mimeType;if(token!==generation)return;recorder=null;releaseMic();root.dataset.state='thinking';
    const form=new FormData();form.append('file',new Blob(chunks,{type:mime}),mime.includes('mp4')?'question.mp4':'question.webm');busy=true;sendButton.disabled=true;controller=new AbortController();say('Transcribing…');
    try{const result=await(await request('/transcribe',form,controller.signal)).json();if(token!==generation)return;composer.value=result.text||'';say('Review your words, then select Send.');publish();if(!panel.hidden)composer.focus();}
    catch(e){if(token===generation&&e.name!=='AbortError')say(e.message);}finally{if(token===generation){busy=false;sendButton.disabled=false;stopButton.hidden=true;root.dataset.state='idle';duck(false);publish();}}
   };
   recording.start();busy=false;recordButton.setAttribute('aria-pressed','true');recordButton.textContent='Finish dictation';stopButton.hidden=false;say('Listening…');recordTimer=setTimeout(()=>{if(recording.state==='recording')recording.stop();},60000);sync();
  }catch(e){if(token!==generation)return;busy=false;releaseMic();duck(false);say(e.name==='NotAllowedError'?'Microphone access was denied. You can type here, or enable it in your browser settings.':e.message);}
 };
 $('[data-clear]').onclick=()=>{cancel();history.length=0;pendingTurn=null;log.replaceChildren();composer.value='';say('New conversation.');composer.focus();};
 window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{live.setVisible(!document.hidden);if(document.hidden&&mode==='text')cancel();});live.setVisible(!document.hidden);
 waveform.idle();sync();
 window.UniversalOneResearch={open,close,
  attachWaveform(canvas){return waveform.attach(canvas);},
  releaseInlineVoice(){if(inlineVoice){inlineVoice=false;sync();publish();}},
  subscribe(listener){listeners.add(listener);listener(snapshot());return()=>listeners.delete(listener);},
  send(question){if(busy||mode==='voice')return;opened=true;composer.value=question;sync();return submit();},
  dictate(){if(mode==='voice')return;opened=true;sync();return recordButton.onclick();},
  voice,stop:cancel,mute:()=>live.toggleMute(),interrupt:()=>live.interrupt(),
  text(){cancel();mode='text';sync();say('Type or dictate your next message.');},
  getState:()=>({mode,inlineVoice,busy,open:opened,panelOpen:!panel.hidden,microphone:!!stream||live.getState().microphone,turns:history.length/2,playing:!!audio||live.getState().playing,inputGated:mode==='voice'?live.getState().gated:performance.now()<inputGateUntil,live:live.getState(),waveform:waveform.getState(),ducking:window.UniversalOneAudio?.getState()})};
 function studyUpdate(task){
  latestStudy=task;
  if(task?.status==='complete'&&task.report&&!completedStudies.has(task.id)){
   completedStudies.add(task.id);const text=['Your study is ready.',task.report.narrative?.answer?.replace(/^Draft for Gemini scientific review:\s*/i,''),task.report.narrative?.meaning].filter(Boolean).join('\n\n');
   history.push({role:'assistant',content:text,sources:[],studyId:task.id});const row=message('assistant',text);row.conversationMessage.studyId=task.id;
   const button=document.createElement('button');button.type='button';button.textContent='Read the full findings';button.onclick=()=>window.UniversalOneQuantum?.openResults();row.append(button);
  }
  publish();
 }
 window.addEventListener('universal-one:study',e=>studyUpdate(e.detail));
 window.addEventListener('universal-one:quantum-ready',()=>{
  if(!history.length)try{const saved=JSON.parse(localStorage.getItem('universal-one-quantum-conversation-v1'));if(Array.isArray(saved))history.push(...saved.filter(m=>['user','assistant'].includes(m.role)&&typeof m.content==='string'));for(const m of history)if(m.studyId)completedStudies.add(m.studyId);}catch{}
  if(!log.querySelector('.uo-message'))for(const m of history){const row=message(m.role,m.content,m.sources||[]);if(m.studyId)row.conversationMessage.studyId=m.studyId;}
  publish();
 });
})();
