'use strict';
(() => {
 if(location.hostname!=='staging.universalmind.tv'||!window.UniversalOneIdentity)return;
 const host=window.parent!==window&&window.parent.location.origin===location.origin?window.parent:window;
 if(host!==window&&host.UniversalOneResearch){window.UniversalOneResearch=host.UniversalOneResearch;return;}
 const endpoint='https://informatics-universal-one-staging.universalmind.workers.dev';
 const root=document.createElement('section');root.className='uo iam-realtime-voice';root.dataset.pose='tea-tablet';root.dataset.mode='text';root.dataset.state='idle';
 root.setAttribute('aria-label','Universal One research assistant');
 root.style.setProperty('--iam-mini-planet-texture',`url("${UniversalOneIdentity.texture(0)}")`);
 root.innerHTML=`<button class="iam-realtime-voice__summon" type="button" aria-label="Ask Universal One a research question" aria-expanded="false" aria-controls="uo-panel"><span class="iam-realtime-planet" aria-hidden="true"><span class="iam-realtime-planet__surface"></span><span class="iam-realtime-planet__atmosphere"></span></span><span class="iam-realtime-voice__invitation" aria-hidden="true"><strong>Universal One</strong><span>Ask a research question</span></span></button>
 <button class="uo-character-toggle" type="button" aria-label="Open Universal One conversation" aria-expanded="false" aria-controls="uo-panel" hidden>${UniversalOneIdentity.character}</button>
 <section id="uo-panel" class="uo-panel" aria-label="Universal One conversation" hidden>
 <header class="uo-header"><h2>Universal One</h2><p>Research with GPT-6 Astra</p><button class="uo-minimize" type="button" aria-label="Minimize conversation">−</button><button class="uo-close" type="button" aria-label="Close Universal One">×</button><div class="uo-modes" role="group" aria-label="Conversation mode"><button type="button" data-mode="text" aria-pressed="true">Text</button><button type="button" data-mode="voice" aria-pressed="false">Voice</button></div></header>
 <div class="uo-log" role="log" aria-label="Research conversation" aria-live="polite"><p class="uo-welcome">Ask about a paper, a molecular target or an Atlas record.</p></div>
 <form class="uo-compose"><div class="uo-input-status"><canvas class="iam-realtime-voice__waveform" data-waveform width="64" height="64" aria-hidden="true" hidden></canvas><p class="uo-status" role="status">Ready when you are.</p></div><label for="uo-question" class="sr-only">Research question</label><textarea id="uo-question" maxlength="4000" placeholder="Ask a research question…" rows="2"></textarea><div class="uo-actions"><button type="button" data-clear>New chat</button><button type="button" data-record aria-pressed="false">Dictate</button><button type="button" data-stop hidden>Stop</button><button type="submit" data-send>Send ↑</button></div><p class="uo-privacy">AI answers and voice · Check the linked evidence. This chat stays in this page; messages and recordings are sent to OpenAI when used.</p></form>
 </section>
 <section class="uo-dock" aria-label="Universal One controls" hidden><div class="uo-input-status"><canvas class="iam-realtime-voice__waveform" data-waveform width="64" height="64" aria-hidden="true"></canvas><p class="uo-dock-status" role="status">Ready when you are.</p></div><div class="uo-dock-actions"><button data-transcript type="button" aria-expanded="false" aria-controls="uo-panel">Transcript</button><button data-mute type="button" aria-pressed="false">Mute mic</button><button data-interrupt type="button" hidden>Interrupt</button><button data-reconnect type="button" hidden>Reconnect</button><button data-text type="button">Text</button><button data-live type="button">Voice</button><button data-end type="button">End</button></div><small class="uo-voice-disclosure">AI voice</small></section>`;
 document.body.append(root);
 const $=s=>root.querySelector(s),panel=$('.uo-panel'),summon=$('.iam-realtime-voice__summon'),character=$('.uo-character-toggle'),dock=$('.uo-dock'),log=$('.uo-log'),composer=$('textarea'),status=$('.uo-status'),recordButton=$('[data-record]'),stopButton=$('[data-stop]'),sendButton=$('[data-send]');
 let mode='text',opened=false,busy=false,controller=null,stream=null,recorder=null,recordTimer=0,generation=0,audio=null,audioURL=null,poseTimer=0,inputGateUntil=0;
 const audioOwner=Symbol('Universal One'),duck=active=>window.UniversalOneAudio?.set(audioOwner,active);
 host.UniversalOneConversation ||= [];const history=host.UniversalOneConversation;let atlasContext=null,libraryContext=null,messageNumber=0;
 document.addEventListener('atlas:record',e=>{atlasContext={record:e.detail?.id,view:e.detail?.view};});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='informatics:research-context')libraryContext=e.data.context;});
 const context=()=>{const frame=document.querySelector('.library-overlay[open] iframe');return {page:location.pathname,atlas:atlasContext||Object.fromEntries(new URLSearchParams(location.search)),library:frame?.contentWindow?.UniversalResearchContext?.()||window.UniversalResearchContext?.()||libraryContext};};
 const say=text=>{status.textContent=text;$('.uo-dock-status').textContent=text;};
 const waveform=UniversalOneWaveform(root,[...root.querySelectorAll('[data-waveform]')],()=>mode==='voice'?live.getState().inputEnabled:!!stream?.getAudioTracks().some(t=>t.enabled));
 function state(name,label){root.dataset.state=name;say(label);root.dataset.pose=name==='listening'?'listen':name==='speaking'?'wave':'tea-tablet';$('[data-mute]').setAttribute('aria-pressed',String(live.getState().muted));$('[data-mute]').textContent=live.getState().muted?'Unmute mic':'Mute mic';$('[data-reconnect]').hidden=name!=='error';$('[data-mute]').hidden=name==='error';$('[data-interrupt]').hidden=!['thinking','speaking'].includes(name);if(name==='error')duck(false);}
 const live=UniversalOneLive({request,history:()=>history,context,onState:state,onMicrophone:mic=>{if(mic)waveform.start(mic);else waveform.stop();},onUser:text=>{history.push({role:'user',content:text});message('user',text);},onAssistant:(text,sources)=>{history.push({role:'assistant',content:text,sources});message('assistant',text,sources);}});
 function placeInExperience(){const dialogs=[...document.querySelectorAll('dialog[open]')];const container=dialogs.at(-1)||document.fullscreenElement||document.webkitFullscreenElement||document.body;if(root.parentElement!==container)container.append(root);}
 document.addEventListener('fullscreenchange',placeInExperience);document.addEventListener('webkitfullscreenchange',placeInExperience);new MutationObserver(placeInExperience).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});placeInExperience();
 function sync(){root.dataset.mode=mode;root.classList.toggle('is-active',opened);character.hidden=!opened;summon.setAttribute('aria-expanded',String(opened));character.setAttribute('aria-expanded',String(!panel.hidden));dock.hidden=!opened||(mode==='text'&&!panel.hidden);$('.uo-compose').hidden=mode==='voice';$('[data-transcript]').textContent=mode==='voice'?(panel.hidden?'Transcript':'Hide transcript'):'Open chat';$('[data-transcript]').setAttribute('aria-expanded',String(!panel.hidden));$('[data-live]').hidden=mode==='voice';$('[data-text]').hidden=mode!=='voice';$('[data-mute]').hidden=mode!=='voice'||root.dataset.state==='error';$('[data-interrupt]').hidden=mode!=='voice'||!['thinking','speaking'].includes(root.dataset.state);$('.uo-voice-disclosure').hidden=mode!=='voice';dock.querySelector('canvas').hidden=mode!=='voice'&&!stream;for(const b of root.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));}
 function stopAudio(){if(audio){audio.pause();audio.src='';audio=null;inputGateUntil=performance.now()+900;}if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null;}if(!stream)duck(false);}
 function releaseMic(){clearTimeout(recordTimer);stream?.getTracks().forEach(t=>t.stop());stream=null;waveform.stop();$('.uo-compose canvas').hidden=true;recordButton.setAttribute('aria-pressed','false');recordButton.textContent='Dictate';}
 function cancel(){generation++;controller?.abort();controller=null;busy=false;sendButton.disabled=false;stopAudio();if(recorder&&recorder.state!=='inactive'){recorder.onstop=null;recorder.stop();}recorder=null;releaseMic();live.end();duck(false);stopButton.hidden=true;root.dataset.state='idle';$('[data-reconnect]').hidden=true;say('Stopped.');}
 function open(){if(!opened&&history.length){log.replaceChildren();for(const m of history)message(m.role,m.content,m.sources||[]);}opened=true;panel.hidden=false;sync();if(mode==='text')composer.focus({preventScroll:true});root.dataset.pose='meditate';clearInterval(poseTimer);poseTimer=setInterval(()=>{if(!stream&&!live.getState().active)root.dataset.pose=root.dataset.pose==='meditate'?'tea-tablet':'meditate';},16000);}
 function close(){cancel();opened=false;panel.hidden=true;clearInterval(poseTimer);sync();summon.focus({preventScroll:true});}
 function minimize(){panel.hidden=true;sync();character.focus({preventScroll:true});}
 async function voice(){cancel();mode='voice';opened=true;panel.hidden=true;sync();duck(true);await live.start();sync();}
 function textMode(){cancel();mode='text';opened=true;panel.hidden=false;say('Dictate to draft, or type your question.');sync();composer.focus({preventScroll:true});}
 summon.onclick=open;character.onclick=()=>panel.hidden?open():minimize();$('.uo-close').onclick=close;$('.uo-minimize').onclick=minimize;
 for(const b of root.querySelectorAll('[data-mode]'))b.onclick=()=>b.dataset.mode==='voice'?voice():textMode();
 $('[data-transcript]').onclick=()=>panel.hidden?open():minimize();$('[data-text]').onclick=textMode;$('[data-live]').onclick=voice;$('[data-end]').onclick=close;$('[data-mute]').onclick=()=>live.toggleMute();$('[data-interrupt]').onclick=()=>live.interrupt();$('[data-reconnect]').onclick=voice;
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();e.stopPropagation();if(!panel.hidden)minimize();else close();}});
 composer.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('.uo-compose').requestSubmit();}});
 async function request(path,body,signal){const response=await fetch(endpoint+path,{method:'POST',headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body:body instanceof FormData?body:JSON.stringify(body),signal});if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.error||'Connection interrupted. Please retry.');}return response;}
 function message(role,text,sources=[]){
  $('.uo-welcome')?.remove();const messageId=++messageNumber;const article=document.createElement('article');article.className='uo-message';article.dataset.role=role;
  const title=document.createElement('h3');title.textContent=role==='user'?'You':'Universal One';article.append(title);
  const content=document.createElement('div');content.className='uo-answer';
  const fragments=text.replace(/^#{1,4}\s+(.+)$/gm,'**$1**').split(/(\[S\d+\]|\*\*[^*]+\*\*)/g);
  for(const fragment of fragments){const source=sources.find(s=>'['+s.label+']'===fragment);if(source){const link=document.createElement('a');link.href='#uo-'+source.label+'-'+messageId;link.textContent='['+source.label.slice(1)+']';link.onclick=e=>{e.preventDefault();article.querySelector('details').open=true;article.querySelector('#'+CSS.escape(link.hash.slice(1)))?.scrollIntoView({block:'nearest'});};content.append(link);}else if(fragment.startsWith('**')&&fragment.endsWith('**')){const strong=document.createElement('strong');strong.textContent=fragment.slice(2,-2);content.append(strong);}else content.append(document.createTextNode(fragment));}
  article.append(content);
  if(sources.length){const details=document.createElement('details');details.className='uo-sources';const summary=document.createElement('summary');summary.textContent=`${sources.length} ${sources.length===1?'source':'sources'}`;details.append(summary);
   for(const source of sources){const row=document.createElement('div');row.className='uo-source';row.id='uo-'+source.label+'-'+messageId;const link=document.createElement('a');try{const u=new URL(source.url);if(['https:','http:'].includes(u.protocol))link.href=u.href;}catch{}link.target='_blank';link.rel='noopener noreferrer';link.textContent=`[${source.label.slice(1)}] ${source.title}`;row.append(link);const meta=document.createElement('small');meta.textContent=[source.journal,source.year,source.kind==='full-text'?'Full text':source.kind==='atlas'?'Atlas record':'Library record',source.section].filter(Boolean).join(' · ');row.append(meta);if(source.authors){const authors=document.createElement('small');authors.textContent=source.authors;row.append(authors);}if(source.rights?.license){const rights=document.createElement('small');const license=source.rights.license;try{const u=new URL(license);if(['https:','http:'].includes(u.protocol)){const link=document.createElement('a');link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Article licence';rights.append(link);}}catch{rights.textContent=license;}row.append(rights);}if(source.text){const quote=document.createElement('blockquote');quote.textContent=source.text;row.append(quote);}details.append(row);}article.append(details);
  }
  if(role==='assistant'&&mode==='text'){const read=document.createElement('button');read.type='button';read.textContent='Read aloud';read.onclick=()=>{cancel();controller=new AbortController();const token=++generation;speak(text,token).catch(e=>{if(token===generation){duck(false);stopButton.hidden=true;if(e.name!=='AbortError')say(e.message);}});};article.append(read);}
  log.append(article);log.scrollTop=log.scrollHeight;return article;
 }

 async function speak(text,token){
  stopAudio();releaseMic();duck(true);stopButton.hidden=false;root.dataset.state='speaking';say('Preparing voice…');
  const response=await request('/speech',{text:text.replace(/\[S\d+\]/g,'').replace(/[*#]/g,'').slice(0,4000)},controller?.signal);
  const blob=await response.blob();if(token!==generation)return;
  audioURL=URL.createObjectURL(blob);audio=new Audio(audioURL);audio.onended=()=>{stopAudio();stopButton.hidden=true;root.dataset.state='idle';say('Ready when you are.');};
  try{await audio.play();say('Speaking · Sources are available above.');}catch{stopAudio();stopButton.hidden=true;say('Tap Read aloud to hear the answer.');}
 }
 async function submit(){
  const question=composer.value.trim();if(!question||busy||mode!=='text')return;
  const token=++generation;busy=true;sendButton.disabled=true;stopButton.hidden=false;controller=new AbortController();stopAudio();releaseMic();
  message('user',question);composer.value='';say('Searching the research…');
  try{const result=await(await request('/research',{question,history,context:context()},controller.signal)).json();if(token!==generation)return;history.push({role:'user',content:question},{role:'assistant',content:result.answer,sources:result.sources});message('assistant',result.answer,result.sources);say('Answer ready · Check the linked evidence.');}
  catch(error){if(token===generation&&error.name!=='AbortError'){composer.value=question;say(error.message);}}
  finally{if(token===generation){busy=false;sendButton.disabled=false;stopButton.hidden=true;duck(false);}}
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
    try{const result=await(await request('/transcribe',form,controller.signal)).json();if(token!==generation)return;composer.value=result.text||'';say('Review your words, then select Send.');if(!panel.hidden)composer.focus();}
    catch(e){if(token===generation&&e.name!=='AbortError')say(e.message);}finally{if(token===generation){busy=false;sendButton.disabled=false;stopButton.hidden=true;root.dataset.state='idle';duck(false);}}
   };
   recording.start();busy=false;recordButton.setAttribute('aria-pressed','true');recordButton.textContent='Finish dictation';stopButton.hidden=false;say('Listening…');recordTimer=setTimeout(()=>{if(recording.state==='recording')recording.stop();},60000);sync();
  }catch(e){if(token!==generation)return;busy=false;releaseMic();duck(false);say(e.name==='NotAllowedError'?'Microphone access was denied. You can type here, or enable it in your browser settings.':e.message);}
 };
 $('[data-clear]').onclick=()=>{cancel();history.length=0;log.replaceChildren();composer.value='';say('New conversation.');composer.focus();};
 window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();if(mode==='voice')state('error','Voice paused while this tab was hidden. Select Reconnect to continue.');}});
 waveform.idle();sync();
 window.UniversalOneResearch={open,close,getState:()=>({mode,busy,open:opened,panelOpen:!panel.hidden,microphone:!!stream||live.getState().microphone,turns:history.length/2,playing:!!audio||live.getState().playing,inputGated:mode==='voice'?live.getState().gated:performance.now()<inputGateUntil,live:live.getState(),waveform:waveform.getState(),ducking:window.UniversalOneAudio?.getState()})};
})();
