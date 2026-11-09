// Notification addresses and bearer links stay private to the study owner.
export const deliveryView=t=>t.notification?{state:t.notification.state,sentAt:t.notification.sentAt||null}:null;
export function publicStudy(t){const {lease,notification,clientId,requestKey,...value}=t;return {...value,delivery:deliveryView(t)};}
export async function notifyStudy(storage,env){
 const index=await storage.get('astra');if(!index)return;
 for(const {id} of index.tasks){
  const task=await storage.get('study:'+id),n=task?.notification;
  if(!n||task.status!=='complete'||!['waiting','retrying'].includes(n.state)||n.nextAttempt>Date.now())continue;
  const body=JSON.stringify({purpose:'quantum-study-ready-v1',eventId:n.eventId,studyId:id,email:n.email,token:n.token,expires:n.expires,timestamp:Math.floor(Date.now()/1000)});
  let accepted=false;
  try{
   const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ASTRA_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
   const signature=[...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const response=await fetch(env.ALLOWED_ORIGIN+'/informatics/api/study-email.php',{method:'POST',headers:{'Content-Type':'application/json','X-Study-Signature':signature},body,signal:AbortSignal.timeout(20000)});
   accepted=response.ok&&(await response.json()).accepted===true;
  }catch{}
  await storage.transaction(async tx=>{
   const current=await tx.get('study:'+id);if(current?.notification?.eventId!==n.eventId)return;
   const item=current.notification;item.attempts=(item.attempts||0)+1;item.state=accepted?'sent':item.attempts>=5?'failed':'retrying';item.nextAttempt=Date.now()+Math.min(3600000,60000*2**item.attempts);if(accepted)item.sentAt=new Date().toISOString();await tx.put('study:'+id,current);
  });
 }
 await scheduleNotifications(storage);
}
export async function scheduleNotifications(storage){
 const index=await storage.get('astra');if(!index)return;
 const tasks=await Promise.all(index.tasks.map(t=>storage.get('study:'+t.id)));
 const pending=tasks.filter(t=>t?.status==='complete'&&['waiting','retrying'].includes(t.notification?.state));
 if(pending.length){const when=Math.max(Date.now()+1000,Math.min(...pending.map(t=>t.notification.nextAttempt||0)));const previous=await storage.getAlarm();if(!previous||previous>when)await storage.setAlarm(when);}
}
