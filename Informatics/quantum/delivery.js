import {agentHeaders,ensureAgentSession,rememberResultToken} from './agent.js?v=portal-demo-20261109';
const endpoint=location.hostname==='staging.universalmind.tv'?'https://informatics-universal-one-staging.universalmind.workers.dev':'https://informatics-universal-one.universalmind.workers.dev';
let active=null,checking=0;
const $=s=>document.querySelector(s),pendingKey='quantum-atlas-email-pending-v1';
const labels={waiting:'Email notification registered. We will send your private results link when the study is complete.',retrying:'The email service is reconnecting. Your results remain available in this conversation.',sent:'Your results email has been sent. Check your inbox and spam folder.',failed:'Email delivery failed. Your results are available here; select Save email notification to retry.'};
export function deliveryStudy(data){active=data;const state=data?.agent?.delivery?.state;if(state)$('#delivery-status').textContent=labels[state]||'';let pending;try{pending=JSON.parse(localStorage.getItem(pendingKey));}catch{}if(pending?.email&&data?.agent&&!data.readOnly){$('#delivery-email').value=pending.email;$('[name=delivery][value=email]').checked=true;showEmail();register().catch(()=>{});}}
function showEmail(){const email=$('[name=delivery][value=email]').checked;$('#email-address-row').hidden=!email;$('#delivery-email').required=email;$('#delivery-save').textContent=email?'Save email notification':'Save return preference';}
async function register(){
 const form=$('#delivery-form');if(!form.reportValidity())return;
 const enabled=$('[name=delivery][value=email]').checked,email=$('#delivery-email').value.trim();
 if(!active?.agent){if(enabled){try{localStorage.setItem(pendingKey,JSON.stringify({email}));$('#delivery-status').textContent='This address is ready for your next study. Ask Universal One to run your investigation; its results link will be emailed here.';}catch{$('#delivery-status').textContent='Device storage is unavailable. Start a study, then register your email.';}}else{try{localStorage.removeItem(pendingKey);}catch{}$('#delivery-status').textContent='Progress and results appear automatically in your conversation.';}return;}
 if(active.readOnly){$('#delivery-status').textContent='This link provides read-only access. Email preferences remain with the original research session.';return;}
 $('#delivery-save').disabled=true;
 try{await ensureAgentSession();const r=await fetch(endpoint+'/agent/studies/'+active.agent.id+'/delivery',{method:'POST',headers:{'Content-Type':'application/json',...agentHeaders()},body:JSON.stringify({enabled,email}),signal:AbortSignal.timeout(20000)});const value=await r.json();if(!r.ok)throw Error(value.error||'The email notification was not saved. Retry.');try{localStorage.removeItem(pendingKey);}catch{}active.agent.delivery=value.delivery;$('#delivery-status').textContent=labels[value.delivery?.state]||'Email notification removed. Results still appear in this conversation.';if(enabled&&active.agent.status==='complete'){clearTimeout(checking);checkDelivery(active.agent.id,0);}}
 catch(e){$('#delivery-status').textContent=e.message;}
 finally{$('#delivery-save').disabled=false;}
}
function checkDelivery(id,count){if(count>=12)return;checking=setTimeout(async()=>{try{const r=await fetch(endpoint+'/agent/studies/'+id,{headers:agentHeaders(),signal:AbortSignal.timeout(12000)});if(!r.ok)return;const task=await r.json();const state=task.delivery?.state;if(state)$('#delivery-status').textContent=labels[state];if(['waiting','retrying'].includes(state))checkDelivery(id,count+1);}catch{}},3000);}
export function setupDelivery(){for(const radio of document.querySelectorAll('[name=delivery]'))radio.onchange=showEmail;$('#delivery-form').onsubmit=e=>{e.preventDefault();register();};showEmail();window.addEventListener('pagehide',()=>clearTimeout(checking));}
export async function openEmailResult(activate){
 let hash=location.hash;try{if(!hash&&parent.location.hash)hash=parent.location.hash;}catch{}
 const params=new URLSearchParams(hash.replace(/^#/,'')),id=params.get('study'),token=params.get('result');if(!id||!token)return;
 $('#delivery-status').textContent='Opening your emailed findings…';
 try{const response=await fetch(endpoint+'/agent/studies/'+encodeURIComponent(id)+'/result',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)}),task=await response.json();if(!response.ok)throw Error(task.error||'The results link is unavailable.');rememberResultToken(task.id,token);activate({version:'quantum-question-v3',id:task.id,question:task.question,status:'agent_complete',message:task.message,reports:{},agent:task,readOnly:true});window.QuantumStudyConversation.openResults();$('#delivery-status').textContent='Your emailed findings are open. This link gives read-only access.';history.replaceState(null,'',location.pathname+location.search);try{parent.history.replaceState(null,'',parent.location.pathname+parent.location.search);}catch{}}
 catch(e){$('#delivery-status').textContent=e.message;}
}
