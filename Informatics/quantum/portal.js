import {ensureAgentSession,agentHeaders} from './agent.js?v=portal-demo-20261109';
const endpoint=location.hostname==='staging.universalmind.tv'?'https://informatics-universal-one-staging.universalmind.workers.dev':'https://informatics-universal-one.universalmind.workers.dev',key='quantum-portal-session-v1';
const $=s=>document.querySelector(s);let accessRevision=0,pendingAccess=Promise.resolve(null);let current=null,activateStudy,pendingQuestion='',requestKey=crypto.randomUUID(),lastQuestion='';
export function portalHeaders(){try{const token=sessionStorage.getItem(key);return token?{'X-Quantum-Portal':token}:{};}catch{return {};}}
async function request(path,body){await ensureAgentSession();const r=await fetch(endpoint+'/agent/demo/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...agentHeaders(),...portalHeaders()},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)}),data=await r.json();if(!r.ok)throw Error(data.error||'Portal access is temporarily unavailable.');return data;}
function useStudy(t){activateStudy({version:'quantum-question-v3',id:t.id,question:t.question,status:t.status,message:t.message,reports:{},agent:t,study:{id:t.id,version:t.version}});}
export function portalAccess(){
 const revision=++accessRevision;
 pendingAccess=request('access').then(value=>revision===accessRevision?(current=value):pendingAccess,error=>{if(revision!==accessRevision)return pendingAccess;throw error;});
 return pendingAccess;
}
function clearPortalAccess(){accessRevision++;current=null;pendingAccess=Promise.resolve(null);}
function render(){
 $('#portal-login').hidden=!!current?.authenticated;$('#portal-experiment').hidden=!current?.authenticated;
 $('#portal-title').textContent=current?.study?.plan?'Your study':current?.authenticated?'I AM portal access':'I AM portal password';$('#portal-dialog').classList.toggle('has-proposal',!!current?.study?.plan);
 $('#portal-status').textContent=current?.authenticated?(current.study?current.study.message:current.credit?'1 funded study available.':'Shared demo pool fully allocated.'):'';
 const plan=current?.study?.plan,preview=$('#portal-proposal');preview.replaceChildren();preview.hidden=!plan;
 if(plan){
  const text=(tag,value,parent=preview)=>{const n=document.createElement(tag);n.textContent=value||'';parent.append(n);return n;};
  text('h3','Your question');text('p',current.study.question);text('h3','What we will investigate');text('p',plan.method);text('h3','What you will receive');text('p',plan.expectedOutcome||'A plain-language explanation of the findings, with the measurements and methods available to inspect.');text('p','Your included study credit covers this investigation.');
  const details=document.createElement('details');preview.append(details);text('summary','Method and technical details',details);
  for(const [title,value]of [['Recommended device',plan.device?.name||plan.device?.arn],['Why this device',plan.deviceRationale],['Measurement settings',(plan.programs||[]).map(p=>p.id+': '+p.shots+' shots').join('; ')],['Estimated hardware charge','US$'+Number(plan.cost?.hardwareUSD||0).toFixed(2)],['Complete study ceiling','US$'+Number(plan.cost?.totalCeilingUSD||0).toFixed(2)],['Research limits',plan.limits]]){text('h4',title,details);text('p',value,details);}
 }
 $('#portal-confirm').hidden=current?.study?.status!=='awaiting_confirmation';$('#portal-confirm').disabled=!current?.available;$('#portal-resume').hidden=!current?.study||current?.study?.status==='awaiting_confirmation';$('#portal-return').hidden=!!current?.study;$('#portal-signout').hidden=!current?.authenticated;
}
export async function openPortal(){const dialog=$('#portal-dialog');render();if(!dialog.open)dialog.showModal();$('#portal-open').setAttribute('aria-expanded','true');try{await portalAccess();render();}catch(e){$('#portal-status').textContent=e.message;}}
export async function prepareExperiment(question){
 question=String(question||'').trim();if(question.length<5)throw Error('What research question do you want to investigate? We can refine it together.');
 await portalAccess();if(!current.authenticated){pendingQuestion=question;await openPortal();return {message:'Enter your I AM portal password in the access window, then continue with your question. No hardware job has started.',question};}
 if(question!==lastQuestion){requestKey=crypto.randomUUID();lastQuestion=question;}
 const revise=current.study&&current.study.question!==question&&['awaiting_confirmation','needs_attention'].includes(current.study.status);
 const task=await request(revise?'revise':'plan',{question,requestKey});useStudy(task);await portalAccess();render();return {id:task.id,question:task.question,message:task.message,status:task.status};
}
export function setupPortal(activate){
 activateStudy=activate;if(!['staging.universalmind.tv','universalmind.tv'].includes(location.hostname))return;
 const control=document.createElement('span');control.className='portal-control';control.innerHTML='<button type="button" id="portal-open" aria-haspopup="dialog" aria-controls="portal-dialog" aria-expanded="false" aria-describedby="portal-tooltip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10V7a4 4 0 0 1 8 0v3M6 10h12v11H6z"/></svg><span>Password</span></button><span id="portal-tooltip" class="portal-tooltip" role="tooltip">Use your portal password to unlock a funded study</span>';$('#chat-voice').after(control);
 const dialog=document.createElement('dialog');dialog.id='portal-dialog';dialog.className='portal-dialog';dialog.setAttribute('aria-labelledby','portal-title');dialog.innerHTML='<div class="portal-heading"><h2 id="portal-title">I AM portal password</h2><button id="portal-close" type="button" aria-label="Close portal access"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><form id="portal-login"><label class="sr-only" for="portal-password">I AM portal password</label><input id="portal-password" type="password" autocomplete="current-password" required maxlength="512" autofocus><button type="submit">Continue</button></form><p id="portal-status" role="status" aria-live="polite"></p><section id="portal-experiment" hidden><div id="portal-proposal" hidden></div><button id="portal-confirm" type="button" hidden>Run my study</button><button id="portal-return" type="button">Continue</button><button id="portal-resume" type="button" hidden>Open my study</button></section><button id="portal-signout" class="text-button" type="button" hidden>Sign out</button>';
 document.body.append(dialog);$('#portal-open').onclick=openPortal;$('#portal-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>$('#portal-open').setAttribute('aria-expanded','false'));control.addEventListener('keydown',e=>{if(e.key==='Escape')control.dataset.dismissed='true';});for(const event of ['pointerenter','focusin'])control.addEventListener(event,()=>delete control.dataset.dismissed);
 $('#portal-login').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;button.textContent='Checking…';$('#portal-status').textContent='';try{const password=$('#portal-password').value;$('#portal-password').value='';const r=await fetch('../api/quantum-portal.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password}),signal:AbortSignal.timeout(20000)}),data=await r.json();if(!r.ok)throw Error(data.error||'Portal verification failed.');sessionStorage.setItem(key,data.token);await portalAccess();render();}catch(error){$('#portal-status').textContent=error.message;}finally{button.disabled=false;button.textContent='Continue';}};
 $('#portal-confirm').onclick=async()=>{const b=$('#portal-confirm');b.disabled=true;$('#portal-status').textContent='Confirming the reviewed experiment…';try{const task=await request('confirm',{planDigest:current.study.plan.digest});useStudy(task);dialog.close();await portalAccess();render();}catch(e){$('#portal-status').textContent=e.message;b.disabled=false;}};
 $('#portal-return').onclick=()=>{dialog.close();if(pendingQuestion){$('#question').value=pendingQuestion;pendingQuestion='';}$('#question').focus({preventScroll:true});};
 $('#portal-resume').onclick=()=>{useStudy(current.study);dialog.close();};$('#portal-signout').onclick=()=>{sessionStorage.removeItem(key);clearPortalAccess();render();};
}
