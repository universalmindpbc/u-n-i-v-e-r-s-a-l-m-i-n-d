import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd();
const out=root+'/research/informatics/wiki-order-20261102';
const topics=JSON.parse(fs.readFileSync(root+'/tools/atlas-topic-directory.json','utf8'));
const expected=topics.map(t=>t.title);
const instruction=fs.readFileSync(root+'/tools/atlas-reading-instruction.txt','utf8').trim();
const browser=await chromium.launch({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
const report={sourceCommit:'b0be53245',muted:true,checks:[],http:[]};
try {
 for(const width of [1470,1024,390,320]) {
  const context=await browser.newContext({viewport:{width,height:1000},javaScriptEnabled:false,userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
  const page=await context.newPage();
  const response=await page.goto('https://staging.universalmind.tv/informatics/read/index.html?verify=20261102-b0be53245',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  const section=page.locator('#atlas-topic-directory');
  assert.deepEqual(await section.locator('tbody tr td:first-child').allTextContents(),expected);
  assert.deepEqual(await section.locator('ul a').allTextContents(),expected);
  assert.equal(await section.locator(':scope > p').textContent(),instruction);
  const targets=await section.locator('ul a').evaluateAll(a=>a.map(x=>x.href));
  assert.ok(targets.every(h=>h.startsWith('https://staging.universalmind.tv/')));
  const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(geometry.scrollWidth<=width+1,JSON.stringify(geometry));
  await section.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-24));
  if(width===1470||width===390) await page.screenshot({path:out+'/staging-'+width+'.png',fullPage:false});
  report.checks.push({width,status:response.status(),table:expected,links:expected,instruction:true,noHorizontalPageOverflow:true,javaScriptEnabled:false});
  if(width===1470){
   for(const url of targets){const r=await context.request.get(url);assert.equal(r.status(),200,url);}
   const pairs=[['Informatics/read/index.html','informatics/read/index.html'],['Informatics/llms.txt','informatics/llms.txt'],['read/index.html','read/index.html'],['read/resources.json','read/resources.json'],['llms.txt','llms.txt'],['sitemap.xml','sitemap.xml'],['Informatics/read/atlas/index.html','informatics/read/atlas/index.html'],['Informatics/atlas-guides/geometry-atlas.json','informatics/atlas-guides/geometry-atlas.json'],['Informatics/pilot-v1/m9.json','informatics/pilot-v1/m9.json'],['Informatics/index.html','informatics/']];
   for(const [local,remote]of pairs){const r=await context.request.get('https://staging.universalmind.tv/'+remote+'?verify=20261102-b0be53245');assert.equal(r.status(),200,remote);const actual=await r.body(),wanted=fs.readFileSync(root+'/'+local);assert.deepEqual(actual,wanted,remote);report.http.push({path:remote,status:200,bytes:actual.length,sha256:crypto.createHash('sha256').update(actual).digest('hex')});}
  }
  await context.close();
 }
 report.passed=true;fs.writeFileSync(out+'/staging-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,viewportCases:report.checks.length,byteMatchedFiles:report.http.length,linkedWikiPages:topics.length,instructionMatches:true}));
}finally{await browser.close();}
