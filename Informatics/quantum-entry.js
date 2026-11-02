'use strict';
(()=>{
 const frame=document.getElementById('quantum-frame');
 document.addEventListener('atlas:area',event=>{
  if(event.detail==='quantum'&&!frame.getAttribute('src')){const url=new URL(frame.dataset.src,document.baseURI);for(const[k,v]of new URLSearchParams(location.search))url.searchParams.set(k,v);url.searchParams.set('embedded','1');url.hash=location.hash;frame.src=url.href;}
 });
 frame.addEventListener('load',()=>{
  if(!frame.getAttribute('src'))return;
  frame.contentDocument?.addEventListener('pointerdown',()=>document.dispatchEvent(new Event('atlas:close-navigation')));
 });
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='quantum:navigate'&&window.InformaticsNavigation.entries.some(x=>x.id===event.data.area))document.dispatchEvent(new CustomEvent('atlas:navigate',{detail:event.data.area}));
 });
})();
