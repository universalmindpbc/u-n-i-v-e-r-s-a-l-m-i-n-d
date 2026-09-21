// A media-ended observation must survive a busy request, a late server clock,
// and a lost response. Replaying it never creates additional watched time.
export function createExposureSync({send,complete,failed,setTimer=setTimeout,clearTimer=clearTimeout}) {
 let pending=false,closed=false,latest=null,ended=null,retry=null;
 function close(){closed=true;clearTimer(retry);retry=null;latest=null;ended=null;}
 function later(){
  if(closed||retry!==null)return;
  retry=setTimer(()=>{retry=null;void flush();},1000);
 }
 async function flush(){
  if(closed||pending)return;
  const values=ended||latest;if(!values)return;
  latest=null;pending=true;
  try {
   const result=await send(values);if(closed)return;
   if(result.state==='after_vitals'){await complete();close();return;}
  } catch(error) {
   if(!closed)failed(error,{ended:!!ended});
  } finally {
   pending=false;
   if(!closed){if(ended)later();else if(latest)void flush();}
  }
 }
 return {
  push(values){
   if(closed)return;
   if(values.ended)ended={...values};else if(!ended)latest={...values};
   void flush();
  },
  close,
 };
}
