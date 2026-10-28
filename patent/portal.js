'use strict';
(()=>{
 const $=s=>document.querySelector(s),csrf=$('meta[name="csrf-token"]').content;
 async function auth(payload){const r=await fetch('login.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,csrf})});const d=await r.json();if(!r.ok)throw Error(d.error||'Access unavailable.');return d;}
 if($('#login-form')){$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;$('#login-status').textContent='Opening…';try{await auth({password:$('#access-password').value});location.reload();}catch(err){$('#login-status').textContent=err.message;button.disabled=false;}});return;}
 for(const button of document.querySelectorAll('[data-logout]'))button.onclick=async()=>{await auth({action:'logout'});location.reload();};
 let chapters=[],current=null,observer=null;
 const clean=s=>s.normalize('NFKD').toLowerCase();
 const label=c=>c.title.replace(/^Appendix ([A-Z](?:\.\d+)?)[.]?\s*/, '$1 · ');
 function closeNav(){document.body.classList.remove('nav-open');$('#toggle-nav').setAttribute('aria-expanded','false');}
 $('#toggle-nav').onclick=()=>{const open=document.body.classList.toggle('nav-open');$('#toggle-nav').setAttribute('aria-expanded',String(open));};
 function show(id){for(const el of document.querySelectorAll('.view'))el.hidden=el.id!==id;closeNav();}
 function navigation(){
  const nav=$('#contents');nav.replaceChildren();
  for(const group of ['Main patent','Reading guides','Appendices']){
   const box=document.createElement('details');box.className='nav-group';box.open=group==='Main patent';const heading=document.createElement('summary');heading.textContent=group;box.append(heading);
   for(const c of chapters.filter(c=>c.group===group&&c.page!==278)){
    const a=document.createElement('a');a.href='#'+c.id;a.textContent=label(c);a.dataset.chapter=c.id;box.append(a);
   }nav.append(box);
  }
 }
 function highlightQuery(text){
  if(!text)return;const needle=clean(text);const nodes=[];const walker=document.createTreeWalker($('#chapter-body'),NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('pre,code')&&clean(n.textContent).includes(needle))nodes.push(n);}
  for(const n of nodes.slice(0,100)){const i=clean(n.textContent).indexOf(needle);const fragment=document.createDocumentFragment();fragment.append(n.textContent.slice(0,i));const mark=document.createElement('mark');mark.textContent=n.textContent.slice(i,i+text.length);fragment.append(mark,n.textContent.slice(i+text.length));n.replaceWith(fragment);}
 }
 function renderChapter(c,target='',query=''){
  show('chapter-view');current=c;$('#chapter-title').textContent=c.title;$('#chapter-group').textContent=c.group;
  $('#chapter-pdf').href='document.php#page='+c.page;$('#chapter-pdf').textContent=`Filed PDF · pp. ${c.page}–${c.end_page} ↗`;
  $('#chapter-body').innerHTML=c.html;$('#chapter-parts').replaceChildren();
  for(const part of c.parts||[]){const a=document.createElement('a');a.href='#'+part.id;a.textContent=part.title;$('#chapter-parts').append(a);}
  const toc=$('#on-this-page');toc.replaceChildren();const title=document.createElement('p');title.textContent='ON THIS PAGE';toc.append(title);
  for(const h of c.headings){if(h.level>3)continue;const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.title;a.className='toc-level-'+h.level;toc.append(a);}
  const compact=$('#compact-toc nav');compact.replaceChildren(...Array.from(toc.querySelectorAll('a'),a=>a.cloneNode(true)));$('#compact-toc').hidden=!c.headings.length;$('#compact-toc').open=false;
  compact.querySelectorAll('a').forEach(a=>a.onclick=()=>{$('#compact-toc').open=false;});
  const i=chapters.indexOf(c),previous=chapters[i-1],next=chapters[i+1];
  for(const [id,chapter,prefix] of [['previous-chapter',previous,'← '],['next-chapter',next,'Next: ']]){const a=$('#'+id);a.hidden=!chapter;if(chapter){a.href='#'+chapter.id;a.textContent=prefix+chapter.title;}}
  document.querySelectorAll('[data-chapter]').forEach(a=>{a.classList.toggle('active',a.dataset.chapter===c.id);if(a.dataset.chapter===c.id)a.closest('details').open=true;});
  highlightQuery(query);observer?.disconnect();
  observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){toc.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));}},{rootMargin:'-90px 0px -65% 0px'});
  $('#chapter-body').querySelectorAll('h2,h3').forEach(h=>observer.observe(h));
  requestAnimationFrame(()=>{const node=target?document.getElementById(target):query?$('#chapter-body mark'):null;if(node)node.scrollIntoView({block:'start'});else window.scrollTo({top:0});});
 }
 function search(query){
  show('search-view');$('#results').replaceChildren();const words=clean(query).split(/\s+/).filter(Boolean);
  const matches=words.length?chapters.filter(c=>words.every(w=>clean(c.title+' '+c.text).includes(w))):[];
  $('#result-status').textContent=words.length?`${matches.length} chapters match “${query}”`:'Enter a subject, term or phrase in the search field.';
  for(const c of matches){
   const row=document.createElement('article');row.className='search-result';const a=document.createElement('a');a.href='#'+c.id+'?q='+encodeURIComponent(query);const h=document.createElement('h2');h.textContent=c.title;a.append(h);const p=document.createElement('p');let at=clean(c.text).indexOf(words[0]);at=Math.max(0,at-100);p.textContent=(at?'…':'')+c.text.slice(at,at+340)+'…';const meta=document.createElement('span');meta.className='eyebrow';meta.textContent=c.group;row.append(meta,a,p);$('#results').append(row);
  }window.scrollTo({top:0});
 }
 function route(){
  const hash=decodeURIComponent(location.hash.slice(1)||'overview');
  if(hash==='overview'||hash==='filing-receipt'){show('overview');if(hash==='filing-receipt')$('#filing-receipt').scrollIntoView();else window.scrollTo({top:0});return;}
  if(hash==='drawings'||/^drawing-\d+$/.test(hash)){show('drawings');if(hash==='drawings')window.scrollTo({top:0});return;}
  if(hash.startsWith('search?')){search(new URLSearchParams(hash.slice(7)).get('q')||'');return;}
  const [id,params='']=hash.split('?');const query=new URLSearchParams(params).get('q')||'';
  const page=/^page-(\d+)$/.exec(id);let c;
  if(page)c=chapters.find(c=>c.page<=Number(page[1])&&c.end_page>=Number(page[1]));
  else c=chapters.find(c=>c.id===id||c.headings.some(h=>h.id===id)||(c.parts||[]).some(p=>p.id===id));
  if(c){if(c.page===278){location.hash='drawings';return;}if(current===c&&id!==c.id&&!page&&!query){show('chapter-view');document.getElementById(id)?.scrollIntoView({block:'start'});}else renderChapter(c,id===c.id||page?'':id,query);if(page){$('#chapter-pdf').href='document.php#page='+page[1];$('#chapter-pdf').textContent='Filed PDF · p. '+page[1]+' ↗';}return;}
  show('overview');
 }
 $('#search-form').onsubmit=e=>{e.preventDefault();location.hash='search?q='+encodeURIComponent($('#query').value.trim());};
 window.addEventListener('hashchange',route);
 async function load(){try{$('#load-error').hidden=true;const r=await fetch('chapters.php',{credentials:'same-origin',cache:'no-store'});if(r.status===401){location.reload();return;}if(!r.ok)throw Error();const data=await r.json();chapters=data.chapters;navigation();route();}catch{$('#load-error').hidden=false;}}
 $('#retry-load').onclick=load;void load();
})();
