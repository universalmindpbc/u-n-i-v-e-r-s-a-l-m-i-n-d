import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),origin='https://staging.universalmind.tv';
const config=JSON.parse(await fs.readFile(path.join(root,'site-navigation/portals.json'))),results=[];
const headers={'User-Agent':'Mozilla/5.0 UniversalMind-Staging-Verification'};
async function get(route,redirect='manual'){const response=await fetch(origin+route,{headers,redirect});const body=await response.text();return {status:response.status,location:response.headers.get('location'),body,url:response.url};}
for(const portal of config.portals.filter(p=>['informatics','iam'].includes(p.id))) {
 const seen=new Set();
 for(const entry of portal.entries.flatMap(e=>[e,...(e.children||[])])) {
  if(!entry.source||seen.has(entry.url))continue;seen.add(entry.url);
  const r=await get(entry.url);assert.equal(r.status,200,entry.url);
  assert.ok(r.body.includes('rel="canonical" href="https://universalmind.tv'+entry.url+'"'),entry.url+' canonical');
  assert.ok(r.body.includes('/site-navigation/routes.js?v='),entry.url+' shared navigation');
  if(portal.id==='informatics'){assert.ok(r.body.includes('<noscript>'),entry.url+' static explanation');if(!['about','research','connect','partners'].includes(entry.id))assert.ok(r.body.includes('id="chapter-guide-data"'),entry.url+' data');}
  results.push({route:entry.url,status:r.status,canonical:true});
 }
}
const aliases=[
 ['/informatics/?entry=research&area=sound','/informatics/sound/'],
 ['/informatics/?entry=research&area=vision','/informatics/vision/'],
 ['/informatics/?entry=research&area=language','/informatics/language/'],
 ['/informatics/?about','/informatics/about/'],
 ['/informatics/library.html?collection=vision','/informatics/research/?collection=vision'],
 ['/informatics/library.html?collection=sound&record=NPL-222','/informatics/research/?collection=sound&record=NPL-222'],
 ['/informatics/library.html?collection=language','/informatics/research/?collection=language'],
 ['/informatics/research.html?record=fibonacci-m9-p24','/informatics/geometry/?record=fibonacci-m9-p24'],
 ['/informatics/genomics.html','/informatics/transcription/'],
 ['/informatics/quantum/index.html','/informatics/quantum/'],
 ['/informatics/molecular/index.html','/informatics/molecular/'],
 ['/vogue/iam/about.html?aboutTopLevel=1','/iam/about/'],
 ['/vogue/iam/science.html','/iam/science/'],
 ['/vogue/iam/research.html','/iam/research/'],
 ['/vogue/iam/technology-inference-engine.html','/iam/technology/recommendations/'],
 ['/vogue/iam/light.html','/iam/research/computer-vision/'],
 ['/vogue/iam/index.html','/iam/tv/']
];
for(const [old,next]of aliases){const r=await get(old);assert.equal(r.status,301,old);assert.equal(new URL(r.location,origin).pathname+new URL(r.location,origin).search,next,old);results.push({route:old,status:r.status,to:next});}
for(const route of ['/informatics/library.html?embedded=1&collection=sound','/informatics/research.html?embedded=1','/informatics/molecular/index.html?embedded=1','/informatics/quantum/index.html?embedded=1','/vogue/iam/about.html?adaptiveFrame=1&musicTelevisionFrame=1']){const r=await get(route);assert.equal(r.status,200,route);results.push({route,status:r.status,embedded:true});}
for(const route of ['/sitemap/','/informatics/sitemap/','/iam/sitemap/','/sitemap.xml',...['portals','informatics','iam','informatics-records','informatics-publications','other-public-pages'].map(n=>'/sitemaps/'+n+'.xml'),'/read/','/llms.txt','/informatics/llms.txt','/site-navigation/portals.json']){const r=await get(route);assert.equal(r.status,200,route);results.push({route,status:r.status});}
const map=await get('/sitemap/');for(const portal of config.portals)assert.ok(map.body.includes(portal.label));
for(const route of ['/events/?experience=1','/events/happiness-entry.php']){const r=await get(route,'follow');assert.equal(r.status,200,route);results.push({route,status:r.status,finalURL:r.url});}
const out=process.env.PORTAL_QA_OUT||'/private/tmp/portal-route-qa-live';await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'http.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({passed:true,httpChecks:results.length,out}));
