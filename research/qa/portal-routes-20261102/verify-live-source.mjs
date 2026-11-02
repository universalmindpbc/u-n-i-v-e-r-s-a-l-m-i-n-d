import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),origin='https://staging.universalmind.tv',sum=b=>crypto.createHash('sha256').update(b).digest('hex');
const config=JSON.parse(await fs.readFile('site-navigation/portals.json'));
const files=new Map();
for(const portal of config.portals.filter(p=>['iam','informatics'].includes(p.id)))for(const e of portal.entries.flatMap(x=>[x,...(x.children||[])]))if(e.source)files.set(portal.id==='iam'?e.url.slice(1)+'index.html':'Informatics/chapters/'+e.id+'.html',e.url);
for(const name of ['site-navigation/routes.js','site-navigation/portals.json','sitemap/index.html','sitemap.xml','sitemaps/informatics.xml','sitemaps/iam.xml','sitemaps/informatics-records.xml','sitemaps/informatics-publications.xml','home/entry-shell.js','home/index.html','index.html','read/index.html','read/resources.json','llms.txt'])files.set(name,'/'+name);
for(const name of ['app.js','atlas.css','global-navigation.js','shared-experience.js','library.js','molecular-entry.js','quantum-entry.js','llms.txt','read/index.html','music-atlas/music-atlas.json','music-atlas/music-atlas.md','music-atlas/music-atlas.csv','quantum/reading/quantum-atlas.json','exports/manifest.json','sitemap/index.html'])files.set('Informatics/'+name,'/informatics/'+name);
for(const name of ['global-navigation.js','adaptive-environment-television.js','adaptive-environment.js','globe.js','script.js','mobile-editorial-surface.js','shop.js','science.js','science-research-data-v1.js'])files.set('i  a m/'+name,'/vogue/iam/'+name);
files.set('i  a m/index.html','/vogue/iam/index.html?navigationShell=1');
const results=[];const queue=[...files];
function undoEmailProtection(html){
 const decode=hex=>{const bytes=Buffer.from(hex,'hex'),key=bytes[0];return Buffer.from([...bytes.subarray(1)].map(b=>b^key)).toString('utf8');};
 return html.replace(/<span class="__cf_email__" data-cfemail="([a-f0-9]+)">[^<]*<\/span>/g,(_,hex)=>decode(hex)).replace(/href="\/cdn-cgi\/l\/email-protection#([a-f0-9]+)"/g,(_,hex)=>'href="mailto:'+decode(hex)+'"').replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[a-f0-9]+\/cloudflare-static\/email-decode.min.js"><\/script>/g,'');
}
async function worker(){while(queue.length){const [local,url]=queue.shift();const response=await fetch(origin+url,{headers:{'User-Agent':'Mozilla/5.0 UniversalMind-Staging-Verification'}});assert.equal(response.status,200,url);const raw=Buffer.from(await response.arrayBuffer()),expected=sum(await fs.readFile(path.join(root,local)));let actual=sum(raw),emailProtection=false;if(actual!==expected&&local.endsWith('.html')){actual=sum(undoEmailProtection(raw.toString('utf8')));emailProtection=true;}assert.equal(actual,expected,url);results.push({url,sha256:actual,emailProtectionReversed:emailProtection});}}
await Promise.all(Array.from({length:4},worker));
const manifest=JSON.parse(await fs.readFile('Informatics/exports/manifest.json'));
for(const item of Object.values(manifest.downloads))for(const part of item.parts){const response=await fetch(origin+'/informatics/exports/'+part.file,{method:'HEAD',headers:{'User-Agent':'Mozilla/5.0 UniversalMind-Staging-Verification'}});assert.equal(response.status,200);assert.equal(Number(response.headers.get('content-length')),part.bytes);results.push({url:'/informatics/exports/'+part.file,bytes:part.bytes,check:'HTTP size; local full checksum verified by export preflight'});}
const out='/private/tmp/portal-route-qa-live-final';await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'hashes.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify({passed:true,liveHashes:files.size,exportParts:5}));
