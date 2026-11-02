import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const config=JSON.parse(read('site-navigation/portals.json'));
const origin='https://staging.universalmind.tv';
const events={},history=[];
const context={URL,URLSearchParams,Map,location:new URL(origin+'/informatics/'),document:{baseURI:origin+'/informatics/',querySelector:()=>null},parent:{},history:{state:null,pushState:(_,__,url)=>history.push(['push',String(url)]),replaceState:(_,__,url)=>history.push(['replace',String(url)])}};
context.window=context;context.parent=context;context.addEventListener=(name,cb)=>events[name]=cb;
vm.runInNewContext(read('site-navigation/routes.js'),context);
const routes=context.PortalRoutes;
const cases=[
 ['/informatics/?entry=research&area=sound','/informatics/sound/'],
 ['/informatics/?about','/informatics/about/'],
 ['/informatics/library.html?collection=vision&record=NPL-222','/informatics/research/?collection=vision&record=NPL-222'],
 ['/informatics/?area=research&section='+encodeURIComponent(JSON.stringify({search:'?collection=sound&chapter=3',hash:'#source'})),'/informatics/research/?collection=sound&chapter=3#source'],
 ['/informatics/research.html?record=fibonacci-m9-p24#beta','/informatics/geometry/?record=fibonacci-m9-p24#beta'],
 ['/informatics/genomics.html','/informatics/transcription/'],
 ['/informatics/molecular/index.html?structure=7QVM','/informatics/molecular/?structure=7QVM'],
 ['/informatics/quantum/index.html?experiment=example','/informatics/quantum/?experiment=example'],
 ['/informatics/read/music/index.html','/informatics/read/music/index.html'],
 ['/informatics/sitemap/','/informatics/sitemap/'],
 ['/vogue/iam/about.html?aboutTopLevel=1','/iam/about/'],
 ['/vogue/iam/technology-inference-engine.html','/iam/technology/recommendations/'],
 ['/vogue/iam/index.html?full=1','/iam/tv/?full=1'],
 ['/vogue/iam/light.html','/iam/research/computer-vision/']
];
for(const [old,next] of cases)assert.equal(routes.resolve(old)?.path,next,old);
assert.equal(routes.resolve('https://example.com/iam/about/'),null);
assert.equal(routes.source('/iam/about/').pathname,'/vogue/iam/about.html');
assert.equal(routes.source('/informatics/research/?collection=vision').search,'?collection=vision');
routes.commit('/informatics/sound/');assert.deepEqual(history.pop(),['push','/informatics/sound/']);
context.parent={UniversalMindEntry:{adoptRoute:(url,mode)=>history.push(['parent-'+mode,url])}};
routes.commit('/informatics/language/');assert.deepEqual(history.splice(0),[['replace','/informatics/language/'],['parent-push','/informatics/language/']]);
assert.deepEqual(config.portals.map(p=>p.id),['iam','events','festivals','informatics']);
const inf=config.portals.find(p=>p.id==='informatics'),iam=config.portals.find(p=>p.id==='iam');
assert.deepEqual(inf.entries.map(e=>e.id),['about','geometry','transcription','molecular','quantum','sound','vision','language','research','connect','partners']);
let chapters=0;
for(const portal of [inf,iam]) {
 const map=read((portal.id==='informatics'?'Informatics':'iam')+'/sitemap/index.html');
 let position=-1;
 for(const entry of portal.entries){const next=map.indexOf('href="'+entry.url+'"',position+1);assert.ok(next>position,entry.id);position=next;}
 for(const entry of portal.entries.flatMap(e=>[e,...(e.children||[])])) {
  if(!entry.source)continue;
  const file=portal.id==='informatics'?'Informatics/chapters/'+entry.id+'.html':entry.url.slice(1)+'index.html';
  const html=read(file);
  assert.ok(html.includes('<link rel="canonical" href="https://universalmind.tv'+entry.url+'">'),file);
  assert.ok(html.includes('<base href="'+(portal.id==='informatics'?'/informatics/':'/vogue/iam/')+'">'),file);
  assert.ok(html.includes('/site-navigation/routes.js?v='),file);
  if(portal.id==='informatics'){assert.ok(html.includes('<noscript>'),file);if(!['about','research','connect','partners'].includes(entry.id))assert.ok(html.includes('id="chapter-guide-data"'),file);}
  chapters++;
 }
}
const xml=read('sitemap.xml');assert.ok(xml.includes('<sitemapindex'));
for(const name of ['portals','informatics','iam','informatics-records','informatics-publications','other-public-pages'])assert.ok(xml.includes('/sitemaps/'+name+'.xml'));
for(const entry of inf.entries)assert.ok(read('sitemaps/informatics.xml').includes(entry.url+'</loc>'));
console.log(JSON.stringify({passed:true,legacyRoutes:cases.length,chapterChecks:chapters,orderedMaps:3,retainedParentHistory:true}));
