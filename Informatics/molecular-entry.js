'use strict';
(()=>{
 const frame=document.getElementById('molecular-frame');
 const active=()=>document.getElementById('experience').dataset.area==='molecular'&&!document.getElementById('experience').hidden;
 function notify(visible=active()){frame.contentWindow.postMessage({type:'molecular:visibility',active:visible},location.origin);}
 document.addEventListener('atlas:area',event=>{
  if(event.detail==='molecular'&&!frame.getAttribute('src'))frame.src=frame.dataset.src;
  else if(frame.getAttribute('src'))notify(event.detail==='molecular');
 });
 frame.addEventListener('load',()=>{
  if(!frame.getAttribute('src'))return;
  frame.contentDocument?.addEventListener('pointerdown',()=>document.dispatchEvent(new Event('atlas:close-navigation')));
  notify();
 });
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='molecular:close'){
   document.querySelector('#atlas-menu [data-area="geometry"]').click();document.getElementById('atlas-toggle').focus({preventScroll:true});
  }
  if(event.data?.type==='molecular:gene-context'){
   document.querySelector('[data-science-tfbs]')?.click();
   document.querySelector('.science-tfbs')?.addEventListener('close',()=>frame.contentDocument?.querySelector('[data-dna-context]')?.focus({preventScroll:true}),{once:true});
  }
 });
})();
