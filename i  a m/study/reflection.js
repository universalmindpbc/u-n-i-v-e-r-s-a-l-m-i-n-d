// A fixed research script. Animation changes delivery only; no generated replies or personal input.
export function mountReflection(target,{script,onFinish,title='Before the music.',eyebrow='I AM · Your session',logLabel='Session introduction',finishLabel='Let’s begin',skipLabel='Skip reflection',savingLabel='Preparing music…'}){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const lifecycle=new AbortController(),timers=new Set();
 let index=-1,current=null,typing=false,saving=false,destroyed=false;
 target.innerHTML=`<section class="study-reflection" aria-labelledby="reflection-title">
  <header class="reflection-heading"><p class="study-eyebrow">I AM · Your session</p><h1 id="reflection-title" tabindex="-1">Before the music.</h1></header>
  <div class="reflection-transcript" role="log" aria-label="Session introduction" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
  <footer class="reflection-footer"><p class="reflection-progress" aria-live="off"></p><div class="reflection-actions">
   <button type="button" class="study-button" data-reflection-next>Show message</button>
   <button type="button" class="study-text-button" data-reflection-skip>Skip reflection</button>
  </div><p class="reflection-error" role="alert"></p></footer>
 </section>`;
 const section=target.querySelector('.study-reflection'),log=section.querySelector('[role="log"]');
 const next=section.querySelector('[data-reflection-next]'),skip=section.querySelector('[data-reflection-skip]');
 const progress=section.querySelector('.reflection-progress'),error=section.querySelector('.reflection-error');
 section.querySelector('h1').textContent=title;section.querySelector('.study-eyebrow').textContent=eyebrow;
 log.setAttribute('aria-label',logLabel);skip.hidden=skipLabel===null;if(skipLabel!==null)skip.textContent=skipLabel;
 const later=(fn,ms)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!destroyed)fn();},ms);timers.add(timer);};
 const clear=()=>{for(const timer of timers)clearTimeout(timer);timers.clear();};
 const follow=()=>{if(log.scrollHeight-log.scrollTop-log.clientHeight<90)log.scrollTop=log.scrollHeight;};
 function label(){next.textContent=typing?'Show message':index===script.messages.length-1?finishLabel:'Continue';}
 function textElement(tag,text){const el=document.createElement(tag);el.textContent=text;return el;}
 function completeMessage(){
  if(!current||!typing)return;
  clear();typing=false;
  current.querySelectorAll('.reflection-word').forEach(word=>word.classList.add('is-visible'));
  current.querySelector('.reflection-dots')?.remove();current.classList.remove('is-typing');
  // Expose each complete message once to assistive technology, never word by word.
  const accessible=current.querySelector('.reflection-accessible');
  accessible.hidden=false;current.removeAttribute('aria-busy');
  label();follow();
 }
 function showMessage(){
  if(destroyed)return;
  index++;typing=true;
  progress.textContent=`${index+1} / ${script.messages.length}`;
  current=document.createElement('article');current.className='reflection-message is-typing';
  current.setAttribute('aria-busy','true');current.dataset.reflectionMessage=String(index+1);
  const accessible=document.createElement('div');accessible.className='reflection-accessible';accessible.hidden=true;
  const visual=document.createElement('div');visual.className='reflection-visual';visual.setAttribute('aria-hidden','true');
  const message=script.messages[index],words=[];
  for(const [tag,text] of [['p',message.text],['blockquote',message.quote]]){
   if(!text)continue;
   const content=tag==='blockquote'?`‘${text}’`:text;
   accessible.append(textElement(tag,content));
   const line=document.createElement(tag);
   for(const token of content.match(/\S+\s*/gu)||[]){const word=textElement('span',token);word.className='reflection-word';line.append(word);words.push(word);}
   visual.append(line);
  }
  const dots=document.createElement('span');dots.className='reflection-dots';dots.setAttribute('aria-hidden','true');dots.innerHTML='<i></i><i></i><i></i>';
  current.append(accessible,visual,dots);log.append(current);label();
  log.scrollTo({top:log.scrollHeight,behavior:motion.matches?'instant':'smooth'});
  if(motion.matches){completeMessage();return;}
  let cursor=0;
  const reveal=()=>{
   if(document.hidden){later(reveal,200);return;}
   words[cursor].classList.add('is-visible');
   const punctuation=/[.!?’][’”]?\s*$/u.test(words[cursor].textContent);
   cursor++;follow();
   if(cursor===words.length)later(completeMessage,200);
   else later(reveal,punctuation?230:75);
  };
  later(reveal,520);
 }
 async function finish(choice){
  if(saving||destroyed)return;saving=true;clear();
  next.disabled=true;skip.disabled=true;next.textContent=savingLabel;error.textContent='';
  try{await onFinish(choice);}
  catch(e){if(!destroyed){saving=false;completeMessage();next.disabled=false;skip.disabled=false;label();error.textContent=e.message||'Please try again.';}}
 }
 next.addEventListener('click',()=>{
  if(saving)return;
  if(typing)completeMessage();
  else if(index<script.messages.length-1)showMessage();
  else void finish('read');
 },{signal:lifecycle.signal});
 skip.addEventListener('click',()=>void finish('skipped'),{signal:lifecycle.signal});
 motion.addEventListener('change',()=>{if(motion.matches&&!saving)completeMessage();},{signal:lifecycle.signal});
 section.querySelector('h1').focus({preventScroll:true});showMessage();
 return {destroy(){destroyed=true;clear();lifecycle.abort();section.remove();}};
}
