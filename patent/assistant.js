'use strict';
window.UniversalOneHelpersReady=import('/informatics/universal-one-context.js?v=1').then(context=>{window.UniversalOneContext=context;});
window.UniversalOneNeedsResearch=question=>!/^\s*(?:hi|hello|thanks|thank you|namaste|stop|goodbye)[.!\s]*$/i.test(question);
window.UniversalOneTransport=async(path,body,signal)=>{
 if(!['/research','/voice-session'].includes(path))return;
 const payload={action:path==='/research'?'research':'voice-session',csrf:document.querySelector('meta[name="csrf-token"]').content};
 if(path==='/research'){
  payload.question=body.question;
  payload.history=(body.history||[]).slice(-8).map(m=>({role:m.role,content:String(m.content||'').slice(0,3000)}));
 }
 return fetch('research.php',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
};
document.addEventListener('DOMContentLoaded',()=>{
 const assistant=document.querySelector('.uo');if(!assistant)return;
 assistant.querySelector('.uo-header p').textContent='Your guide to the filed patent';
 const welcome=assistant.querySelector('.uo-welcome');
 if(welcome)welcome.textContent='Ask about any chapter, appendix, software listing or drawing. Answers link to the filed specification.';
 assistant.querySelector('textarea').placeholder='Ask about the patent…';
 const open=document.querySelector('#open-assistant');if(open){open.addEventListener('click',()=>window.UniversalOneResearch?.open());open.disabled=false;}
});
