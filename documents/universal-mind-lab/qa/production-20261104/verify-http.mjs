import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {request} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const origin='https://universalmind.tv',out='documents/universal-mind-lab/qa/production-20261104';
const candidate=JSON.parse(fs.readFileSync(out+'/candidate.json'));
const paths=execFileSync('git',['ls-files','lab','events']).toString().trim().split('\n').filter(p=>!p.endsWith('.php')&&!p.includes('/private/')&&!p.endsWith('.htaccess'));
for(const p of Object.keys(candidate.sourceHashes))if(p.startsWith('Informatics/'))paths.push(p);
paths.push('index.html','home/index.html','home/entry-shell.js','home/entry-shell.css','home/directory.js','home/directory.css');
const ctx=await request.newContext({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'}),results=[];
try{
 const queue=[...new Set(paths)];
 await Promise.all(Array.from({length:5},async()=>{while(queue.length){const file=queue.shift(),remote=file.replace(/^Informatics\//,'informatics/');const res=await ctx.get(origin+'/'+remote+'?embedded=1&release=20261104');assert.equal(res.status(),200,file);const data=await res.body(),local=fs.readFileSync(file);assert(data.equals(local),'Exact production source: '+file);results.push({file,status:200,sha256:createHash('sha256').update(data).digest('hex')});}}));
 const protection=await ctx.get(origin+'/events/choice.php');assert.equal(protection.status(),401);
 const privateAsset=await ctx.get(origin+'/events/private/poster.jpg');assert.equal(privateAsset.status(),403);
 const lab=await ctx.get(origin+'/lab/');assert.equal(lab.status(),200);assert((await lab.body()).equals(fs.readFileSync('lab/index.html')));
 fs.writeFileSync(out+'/http.json',JSON.stringify({checkedAt:new Date().toISOString(),origin,assetCheckQuery:'embedded=1&release=20261104',cacheNote:'Unversioned library.js retained an older CDN entry; the visitor-loaded v=youth-mobile-20261103 asset matched the approved source. Actual research navigation is verified separately.',exactSourceMatches:results.sort((a,b)=>a.file.localeCompare(b.file)),eventsChoiceProtected:true,privateAssetsProtected:true,labRoute:true},null,2)+'\n');
 console.log(JSON.stringify({exactSourceMatches:results.length,eventsProtection:true,labRoute:true}));
}finally{await ctx.dispose()}
