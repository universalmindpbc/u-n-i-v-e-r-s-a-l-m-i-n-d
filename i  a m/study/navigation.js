// Keep the native animated controls on screen, without allowing a research detour.
const lockedRoots='[data-nav-open], [data-global-nav-host], [data-reaction-wallet], .iam-realtime-voice, [data-television-live-pill], [data-community-globe-overlay]';
const chromeRoots='.brand, .global-nav-trigger, [data-global-nav-host], [data-reaction-wallet], .iam-realtime-voice, [data-television-live-pill], [data-community-globe-overlay], [data-study-completion-background]';
let locked=true,checkout=false,lastOpen=false;
const priorInert=new Map(),concealed=new Set();
const send=(open)=>parent.postMessage({type:'study-navigation',open},location.origin);
function syncLock(){
 for(const root of document.querySelectorAll(lockedRoots)){
  if(!priorInert.has(root))priorInert.set(root,root.inert);
  root.inert=locked||priorInert.get(root);
 }
}
function restoreScene(){for(const element of concealed)element.removeAttribute('data-study-concealed');concealed.clear();}
function showChrome(){
 if(!document.querySelector('[data-study-completion-background]')){
  const backdrop=document.createElement('div'),image=document.createElement('img');
  backdrop.setAttribute('data-study-completion-background','');backdrop.setAttribute('aria-hidden','true');
  image.crossOrigin='anonymous';image.alt='';image.src=parent.document.querySelector('.study-backdrop img').src;
  backdrop.append(image);document.body.prepend(backdrop);
 }
 const roots=[...document.querySelectorAll(chromeRoots)];
 function visit(element){
  if(roots.includes(element))return;
  if(roots.some(root=>element.contains(root))){for(const child of element.children)visit(child);return;}
  if(!['SCRIPT','STYLE','LINK'].includes(element.tagName)){element.setAttribute('data-study-concealed','');concealed.add(element);}
 }
 for(const child of document.body.children)visit(child);
}
function syncCheckout(){
 if(!checkout)return;
 const open=document.body.classList.contains('nav-open')||document.body.classList.contains('community-globe-open')
  ||document.querySelector('[data-reaction-wallet-trigger]')?.getAttribute('aria-expanded')==='true'
  ||document.querySelector('.iam-realtime-voice__summon')?.getAttribute('aria-expanded')==='true';
 if(open===lastOpen)return;lastOpen=open;
 document.documentElement.toggleAttribute('data-study-checkout-chrome',!open);
 if(open)restoreScene();else showChrome();
 send(open);
}
export function lockNavigation(){
 document.documentElement.setAttribute('data-study-navigation-locked','');syncLock();
 new MutationObserver(()=>{if(locked)syncLock();else syncCheckout();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-expanded','data-wallet-view']});
 for(const name of ['click','pointerdown','pointerover','pointerenter','mouseover','mouseenter','keydown','focusin'])document.addEventListener(name,event=>{
  if(locked&&event.target.closest?.(lockedRoots)){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 document.addEventListener('click',event=>{
  if(checkout&&event.target.closest?.('a[href]'))event.target.closest('a[href]').target='_top';
 },true);
}
export function unlockNavigation(){
 locked=false;checkout=true;syncLock();
 document.documentElement.removeAttribute('data-study-navigation-locked');
 document.documentElement.setAttribute('data-study-checkout-chrome','');
 showChrome();send(false);
}
