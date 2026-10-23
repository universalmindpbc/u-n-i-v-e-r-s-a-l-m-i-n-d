'use strict';
(() => {
 if(location.hostname!=='staging.universalmind.tv'||!window.UniversalOneIdentity)return;
 const endpoint='https://informatics-universal-one-staging.universalmind.workers.dev';
 const root=document.createElement('section');root.className='uo iam-realtime-voice';root.dataset.pose='tea-tablet';
 root.setAttribute('aria-label','Universal One research assistant');
 root.style.setProperty('--iam-mini-planet-texture',`url("${UniversalOneIdentity.texture(0)}")`);
 root.innerHTML=`<button class="iam-realtime-voice__summon" type="button" aria-label="Open Universal One" aria-expanded="false" aria-controls="uo-panel"><span class="iam-realtime-planet" aria-hidden="true"><span class="iam-realtime-planet__surface"></span><span class="iam-realtime-planet__atmosphere"></span></span><span class="uo-launch-label" aria-hidden="true">Universal One</span></button>
 <section id="uo-panel" class="uo-panel" aria-label="Universal One conversation" hidden>
 <header class="uo-header"><h2>Universal One</h2><p>Research with GPT-6 Astra</p><div class="uo-character">${UniversalOneIdentity.character}</div><button class="uo-close" type="button" aria-label="Close Universal One">×</button><div class="uo-modes" role="group" aria-label="Conversation mode"><button type="button" data-mode="text" aria-pressed="true">Text</button><button type="button" data-mode="voice" aria-pressed="false">Voice</button></div></header>
 <div class="uo-log" role="log" aria-label="Research conversation" aria-live="polite"><p class="uo-welcome">Ask about a paper, a molecular target or an Atlas record.</p></div>
 <form class="uo-compose"><p class="uo-status" role="status">Ready when you are.</p><label for="uo-question" class="sr-only">Research question</label><textarea id="uo-question" maxlength="4000" placeholder="Ask a research question…" rows="2"></textarea><div class="uo-actions"><button type="button" data-clear>New chat</button><button type="button" data-record aria-pressed="false">Dictate</button><button type="button" data-stop hidden>Stop</button><button type="submit" data-send>Send ↑</button></div><p class="uo-privacy">AI answers and voice · Check the linked evidence. This chat stays in this page; messages and recordings are sent to OpenAI when used.</p></form>
 </section>`;
 document.body.append(root);
 const $=s=>root.querySelector(s),panel=$('.uo-panel'),summon=$('.iam-realtime-voice__summon'),log=$('.uo-log'),composer=$('textarea'),status=$('.uo-status'),recordButton=$('[data-record]'),stopButton=$('[data-stop]'),sendButton=$('[data-send]');
 let mode='text',busy=false,controller=null,stream=null,recorder=null,chunks=[],recordTimer=0,generation=0,audio=null,audioURL=null,poseTimer=0,inputGateUntil=0;
 const audioOwner=Symbol('Universal One');const duck=active=>window.UniversalOneAudio?.set(audioOwner,active);
 const host=window.parent!==window&&window.parent.location.origin===location.origin?window.parent:window;
 host.UniversalOneConversation ||= [];
 const history=host.UniversalOneConversation;let atlasContext=null;let libraryContext=null;let messageNumber=0;
 document.addEventListener('atlas:record',e=>{atlasContext={record:e.detail?.id,view:e.detail?.view};});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='informatics:research-context')libraryContext=e.data.context;});
 const context=()=>({page:location.pathname,atlas:atlasContext||Object.fromEntries(new URLSearchParams(location.search)),library:window.UniversalResearchContext?.()||libraryContext});
 const say=text=>{status.textContent=text;};
 function stopAudio(){if(audio){audio.pause();audio.src='';audio=null;inputGateUntil=performance.now()+900;}if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null;}if(!stream)duck(false);}
 function releaseMic(){clearTimeout(recordTimer);stream?.getTracks().forEach(t=>t.stop());stream=null;recordButton.setAttribute('aria-pressed','false');recordButton.textContent=mode==='voice'?'Speak':'Dictate';}
 function cancel(){generation++;controller?.abort();controller=null;busy=false;sendButton.disabled=false;stopAudio();if(recorder&&recorder.state!=='inactive'){recorder.onstop=null;recorder.stop();}recorder=null;releaseMic();duck(false);stopButton.hidden=true;say('Stopped.');}
 function open(){if(history.length){log.replaceChildren();for(const m of history)message(m.role,m.content,m.sources||[]);}panel.hidden=false;root.classList.add('is-active');summon.setAttribute('aria-expanded','true');composer.focus({preventScroll:true});root.dataset.pose='meditate';clearInterval(poseTimer);poseTimer=setInterval(()=>{root.dataset.pose=root.dataset.pose==='meditate'?'tea-tablet':'meditate';},16000);}
 function close(){cancel();panel.hidden=true;root.classList.remove('is-active');summon.setAttribute('aria-expanded','false');clearInterval(poseTimer);summon.focus({preventScroll:true});}
 summon.onclick=()=>panel.hidden?open():close();$('.uo-close').onclick=close;
 for(const button of root.querySelectorAll('[data-mode]'))button.onclick=()=>{cancel();mode=button.dataset.mode;for(const b of root.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b===button));recordButton.textContent=mode==='voice'?'Speak':'Dictate';say(mode==='voice'?'Tap Speak, then finish recording to send. Replies are spoken.':'Dictate to draft, or type your question.');composer.focus();};
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopPropagation();close();}});
 composer.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('.uo-compose').requestSubmit();}});
 async function request(path,body,signal){
  const response=await fetch(endpoint+path,{method:'POST',headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body:body instanceof FormData?body:JSON.stringify(body),signal});
  if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.error||'Connection interrupted. Please retry.');}
  return response;
 }
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
  if(role==='assistant'){const read=document.createElement('button');read.type='button';read.textContent='Read aloud';read.onclick=()=>{cancel();controller=new AbortController();const token=++generation;speak(text,token).catch(e=>{if(token===generation){duck(false);stopButton.hidden=true;if(e.name!=='AbortError')say(e.message);}});};article.append(read);}
  log.append(article);log.scrollTop=log.scrollHeight;return article;
 }
 async function speak(text,token){
  stopAudio();releaseMic();duck(true);stopButton.hidden=false;say('Preparing voice…');
  const response=await request('/speech',{text:text.replace(/\[S\d+\]/g,'').replace(/[*#]/g,'').slice(0,4000)},controller?.signal);
  const blob=await response.blob();if(token!==generation){duck(false);return;}
  audioURL=URL.createObjectURL(blob);audio=new Audio(audioURL);audio.onended=()=>{stopAudio();stopButton.hidden=true;say(mode==='voice'?'Tap Speak for your next question.':'Ready when you are.');};
  try{await audio.play();say('Speaking · Sources are available above.');}catch{stopAudio();stopButton.hidden=true;say('Tap Read aloud to hear the answer.');}
 }
 async function submit(){
  const question=composer.value.trim();if(!question||busy)return;
  const token=++generation;busy=true;sendButton.disabled=true;stopButton.hidden=false;controller=new AbortController();stopAudio();releaseMic();
  message('user',question);composer.value='';say('Searching the research…');
  try{const result=await (await request('/research',{question,history,context:context()},controller.signal)).json();if(token!==generation)return;
   history.push({role:'user',content:question},{role:'assistant',content:result.answer,sources:result.sources});message('assistant',result.answer,result.sources);say('Answer ready · Check the linked evidence.');
   if(mode==='voice')await speak(result.answer,token);
  }catch(error){if(error.name!=='AbortError'){composer.value=question;say(error.message);}}
  finally{if(token===generation){busy=false;sendButton.disabled=false;if(!audio){stopButton.hidden=true;duck(false);}}}
 }
 $('.uo-compose').onsubmit=e=>{e.preventDefault();submit();};stopButton.onclick=cancel;
 recordButton.onclick=async()=>{
  if(recorder?.state==='recording'){recorder.stop();return;}
  if(busy)return;busy=true;say('Requesting microphone…');const token=++generation;stopAudio();duck(true);
  try{if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Recording is unavailable in this browser. You can type your question.');
   const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   captured.getAudioTracks().forEach(t=>{t.enabled=false;});
   await new Promise(resolve=>setTimeout(resolve,Math.max(0,inputGateUntil-performance.now())));
   if(token!==generation||panel.hidden){captured.getTracks().forEach(t=>t.stop());return;}stream=captured;stream.getAudioTracks().forEach(t=>{t.enabled=true;});
   const type=['audio/webm;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,type?{mimeType:type}:{});chunks=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onstop=async()=>{
    const mime=recorder.mimeType;recorder=null;releaseMic();if(token!==generation)return;
    const form=new FormData();form.append('file',new Blob(chunks,{type:mime}),mime.includes('mp4')?'question.mp4':'question.webm');busy=true;sendButton.disabled=true;controller=new AbortController();say('Transcribing…');
    try{const result=await (await request('/transcribe',form,controller.signal)).json();if(token!==generation)return;composer.value=result.text||'';busy=false;sendButton.disabled=false;
     if(mode==='voice'&&composer.value.trim())await submit();else {say('Review your words, then select Send.');composer.focus();}
    }catch(e){if(e.name!=='AbortError')say(e.message);}finally{if(token===generation){busy=false;sendButton.disabled=false;stopButton.hidden=true;if(!audio)duck(false);}}
   };
   recorder.start();busy=false;recordButton.setAttribute('aria-pressed','true');recordButton.textContent=mode==='voice'?'Finish & send':'Finish dictation';stopButton.hidden=false;say('Listening…');recordTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},60000);
  }catch(e){if(token!==generation)return;busy=false;releaseMic();duck(false);say(e.name==='NotAllowedError'?'Microphone access was denied. You can type here, or enable it in your browser settings.':e.message);}
 };
 $('[data-clear]').onclick=()=>{cancel();history.length=0;log.replaceChildren();composer.value='';say('New conversation.');composer.focus();};
 window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 new MutationObserver(()=>{if(document.querySelector('dialog[open]'))cancel();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 if(window.parent!==window){window.parent.document.querySelector('.library-overlay')?.addEventListener('close',cancel);}
 window.UniversalOneResearch={open,close,getState:()=>({mode,busy,open:!panel.hidden,microphone:!!stream,turns:history.length/2,playing:!!audio,inputGated:performance.now()<inputGateUntil,ducking:window.UniversalOneAudio?.getState()})};
})();
