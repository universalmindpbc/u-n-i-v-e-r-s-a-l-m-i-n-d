/* Shared route lookup. The generated routes.js supplies the navigation record. */
(() => {
  const data = window.UniversalPortalNavigation;
  if (!data || window.PortalRoutes) return;
  const origin = location.origin;
  const entries = data.portals.flatMap(portal => portal.entries.flatMap(item => [item, ...(item.children || [])]).map(item => ({...item, portal:portal.id})));
  const normalize = path => path.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  const controls = ['entry','area','atlas','about','embedded','adaptiveFrame','musicTelevisionFrame','navigationShell','v','aboutTopLevel'];
  function resolve(value = location.href) {
    let url; try { url = new URL(value, document.baseURI); } catch { return null; }
    if (![origin,'https://universalmind.tv'].includes(url.origin)) return null;
    const path = normalize(url.pathname), query = new URLSearchParams(url.search);
    let item = entries.find(e => e.source && e.url.startsWith('/') && normalize(e.url) === path);
    if (!item && path === '/informatics') {
      const area = query.has('about') ? 'about' : query.get('area') || (query.has('atlas') ? 'geometry' : '');
      item = entries.find(e => e.portal === 'informatics' && e.id === area);
    }
    if (!item && path === '/informatics') item = {id:'home',portal:'informatics',label:'Universal Informatics',url:'/informatics/',source:'index.html'};
    if (!item && /^\/informatics\/(read|sitemap)(\/|$)/.test(url.pathname)) item = {id:'document',portal:'informatics',label:path.includes('/sitemap')?'Informatics sitemap':'AI / LLM guide',url:url.pathname};
    if (!item && /^\/iam\/sitemap\/?$/.test(url.pathname)) item = {id:'document',portal:'iam',label:'I AM sitemap',url:'/iam/sitemap/'};
    if (!item && /^\/informatics\//.test(url.pathname)) item = entries.find(e => e.portal === 'informatics' && e.source !== 'index.html' && normalize('/informatics/'+e.source) === path);
    if (!item && /^\/(vogue\/iam|i%20%20a%20m)\//i.test(url.pathname)) item = entries.find(e => e.portal === 'iam' && e.source && normalize('/vogue/iam/'+e.source) === path.replace('/i%20%20a%20m/','/vogue/iam/'));
    if (!item) return null;
    try { const section=JSON.parse(query.get('section')); if(section && !url.hash && typeof section.hash==='string')url.hash=section.hash; if (section && typeof section.search==='string') for (const [k,v]of new URLSearchParams(section.search)) if(!query.has(k))query.set(k,v); } catch {}
    query.delete('section'); controls.forEach(k=>query.delete(k));
    const canonical=new URL(item.url,origin);canonical.search=query.toString();canonical.hash=url.hash;
    return {...item,href:canonical.href,path:canonical.pathname+canonical.search+canonical.hash,query};
  }
  function source(value) {
    const route=resolve(value); if(!route?.source)return new URL(value,document.baseURI);
    const url=new URL((route.portal==='iam'?'/vogue/iam/':'/informatics/')+route.source,origin);
    url.search=route.query.toString();url.hash=new URL(value,document.baseURI).hash;return url;
  }
  const handlers=new Map(); let restoring=false;
  function commit(value, mode='push') {
    const route=resolve(value);if(!route)return false;
    const current=location.pathname+location.search+location.hash;
    let parentOwner=null;try {if(parent!==window && parent.UniversalMindEntry)parentOwner=parent.UniversalMindEntry;}catch{}
    if(current!==route.path || mode==='replace') history[parentOwner||mode==='replace'||restoring?'replaceState':'pushState']({...history.state,portalRoute:route.path},'',route.path);
    const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href='https://universalmind.tv'+route.path.split('?')[0].split('#')[0];
    parentOwner?.adoptRoute?.(route.path, mode==='replace'||restoring?'replace':'push');
    return true;
  }
  function restore(value) {
    const route=resolve(value), handler=route&&handlers.get(route.portal);if(!handler)return false;
    restoring=true;try {handler(route);commit(route.href,'replace');}finally{restoring=false;}return true;
  }
  window.addEventListener('popstate',()=>restore(location.href));
  function loadFrame(frame, value) {
    const url=new URL(value,document.baseURI).href;
    if(frame.dataset.portalSrc===url)return;
    const loaded=frame.getAttribute('src');frame.dataset.portalSrc=url;
    if(loaded && frame.contentWindow)frame.contentWindow.location.replace(url);
    else frame.src=url;
  }
  window.PortalRoutes={data,entries,resolve,source,commit,restore,loadFrame,register:(portal,handler)=>handlers.set(portal,handler),isRestoring:()=>restoring};
})();
