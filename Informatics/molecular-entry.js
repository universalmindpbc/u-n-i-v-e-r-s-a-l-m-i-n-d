'use strict';
(()=>{
 let dialog,opener;
 function close(){if(!dialog?.open)return;dialog.close();dialog.querySelector('iframe').src='about:blank';opener?.focus({preventScroll:true});}
 function open(button){
  opener=button.closest('#atlas-menu')?document.querySelector('#atlas-toggle'):button;document.querySelector('#atlas-menu').hidden=true;for(const id of ['atlas-menu-toggle','atlas-toggle'])document.getElementById(id).setAttribute('aria-expanded','false');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='molecular-dialog';dialog.setAttribute('aria-label','Molecular Atlas');dialog.innerHTML='<iframe title="Universal Informatics Molecular Atlas" allow="" referrerpolicy="same-origin"></iframe>';document.querySelector('#experience').append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});}
  dialog.querySelector('iframe').src='molecular/?embedded=1';dialog.showModal();dialog.querySelector('iframe').focus();
 }
 document.querySelectorAll('[data-molecular]').forEach(button=>button.addEventListener('click',()=>open(button)));
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==dialog?.querySelector('iframe').contentWindow)return;if(e.data?.type==='molecular:close')close();if(e.data?.type==='molecular:gene-context'){const returnTo=opener;close();document.querySelector('[data-science-tfbs]')?.click();document.querySelector('.science-tfbs')?.addEventListener('close',()=>returnTo?.focus({preventScroll:true}),{once:true});}});
})();
