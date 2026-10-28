'use strict';
(()=>{
 const gallery=document.querySelector('#drawings');if(!gallery)return;
 const cards=document.querySelector('#drawing-cards'),status=document.querySelector('#drawing-status'),query=document.querySelector('#drawing-query'),group=document.querySelector('#drawing-group'),retry=document.querySelector('#drawing-retry'),zoom=document.querySelector('#drawing-zoom');
 let drawings=null,pending=null;
 const normal=s=>s.normalize('NFKD').toLowerCase();
 function render(){
  if(!drawings)return;
  const words=normal(query.value).split(/\s+/).filter(Boolean);
  const selected=drawings.filter(d=>(group.value==='all'||d.group===group.value)&&words.every(w=>normal(d.title+' '+d.description+' '+(d.brief_description||'')+' '+d.section+' source image '+d.number).includes(w)));
  cards.replaceChildren();status.textContent=`${selected.length} of ${drawings.length} drawings`;
  for(const d of selected){
   const card=document.createElement('figure');card.className='drawing-card';card.id='drawing-'+d.number;
   const image=document.createElement('img');image.src='drawing.php?image='+d.number;image.alt=d.title;image.width=d.width;image.height=d.height;image.loading='lazy';image.decoding='async';
   const enlarge=document.createElement('button');enlarge.className='drawing-image';enlarge.type='button';enlarge.setAttribute('aria-label','Enlarge '+d.title);enlarge.append(image);
   enlarge.onclick=()=>{zoom.querySelector('img').src=image.src;zoom.querySelector('img').alt=d.title;zoom.querySelector('p').textContent=d.title;zoom.showModal();};
   const caption=document.createElement('figcaption'),label=document.createElement('p'),heading=document.createElement('h3'),description=document.createElement('p'),links=document.createElement('p');
   label.className='eyebrow';label.textContent='Source image '+d.number+' · PDF page '+d.page;heading.textContent=d.title;
   description.className='drawing-description';const paragraphs=d.description.split('\n\n');if(paragraphs[0]===d.title)paragraphs.shift();description.textContent=paragraphs.join('\n\n');description.hidden=!description.textContent;
   const source=document.createElement('a');source.href='document.php#page='+d.page;source.target='_blank';source.rel='noopener';source.textContent='View PDF page ↗';links.append(source);
   const descriptionPages=d.brief_description_pages?.length?d.brief_description_pages:d.description_pages;
   if(descriptionPages.length){const context=document.createElement('a');context.href='document.php#page='+descriptionPages[0];context.target='_blank';context.rel='noopener';context.textContent=d.context_kind==='description'?'Description in the filed text ↗':'Source context in the filed text ↗';links.append(context);}
   if(d.context_kind==='context'){const note=document.createElement('p');note.className='small';note.textContent='Source context · '+d.section;caption.append(note);}
   caption.append(label,heading,description);
   if(d.brief_description){const brief=document.createElement('p');brief.className='drawing-description';brief.textContent=d.brief_description;caption.append(brief);}
   caption.append(links);card.append(enlarge,caption);cards.append(card);
  }
 }
 async function load(){
  if(drawings)return;if(pending)return pending;
  status.textContent='Loading drawings…';retry.hidden=true;
  pending=(async()=>{try{const r=await fetch('drawings.php',{credentials:'same-origin',cache:'no-store'});if(r.status===401){location.reload();return;}if(!r.ok)throw Error('Drawings are temporarily unavailable.');drawings=(await r.json()).drawings;render();}catch(e){status.textContent=e.message;retry.hidden=false;}finally{pending=null;}})();return pending;
 }
 async function openHash(){if(!/^#drawing(?:s|-\d+)$/.test(location.hash))return;await load();if(location.hash!=='#drawings'){query.value='';group.value='all';render();document.querySelector(location.hash)?.scrollIntoView({block:'start'});}}
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){void load();observer.disconnect();}},{rootMargin:'600px'});observer.observe(gallery);
 query.oninput=render;group.onchange=render;retry.onclick=load;
 document.querySelector('#drawing-zoom-close').onclick=()=>zoom.close();
 window.addEventListener('hashchange',openHash);void openHash();
 window.addEventListener('patent:view',e=>{if(e.detail==='drawings')void openHash();});
})();
