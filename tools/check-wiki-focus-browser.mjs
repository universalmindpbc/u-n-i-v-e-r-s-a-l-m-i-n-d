import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'research/informatics/wiki-focus-20261101');
const base='https://staging.universalmind.tv',candidate=process.env.CANDIDATE==='1',mode=candidate?'candidate':'staging';
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint()),results=[];
const routes=[['overview','/informatics/read/index.html','Universal Informatics'],['music','/informatics/read/music/index.html','Music Atlas'],['vision','/informatics/read/vision/index.html','Vision Atlas'],['computer-vision','/informatics/read/computer-vision/index.html','Computer vision'],['quantum','/informatics/read/quantum/index.html','Quantum Atlas'],['geometry','/informatics/read/atlas/index.html','Geometry Atlas'],['transcription','/informatics/read/transcription/index.html','Transcription Atlas'],['molecular','/informatics/read/molecular/index.html','Molecular Atlas'],['language','/informatics/read/language/index.html','Language Atlas'],['organisation','/read/index.html#informatics','Universal Mind']];
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950},javaScriptEnabled:false,reducedMotion:'reduce'});
  if(candidate)await context.route(base+'/**',async route=>{
   let rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/informatics\//,'Informatics/').replace(/^\//,'');if(rel.endsWith('/'))rel+='index.html';
   if(!rel.startsWith('Informatics/read/')&&!rel.startsWith('read/'))return route.continue();
   const contentType=rel.endsWith('.css')?'text/css':rel.endsWith('.json')?'application/json':'text/html';
   await route.fulfill({status:200,contentType,body:await fs.readFile(path.join(root,rel))});
  });
  for(const [name,route,heading]of routes){
   const page=await context.newPage();await page.goto(base+route,{waitUntil:'load'});
   assert((await page.locator('h1').first().innerText()).includes(heading),name);
   const text=await page.locator('body').innerText();assert(!text.includes('separate research directions')&&!text.includes('The Vision Atlas studies human visual stimulation'),name);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name);
   if(name==='overview'){
    const mainText=await page.locator('main').innerText();
    assert(mainText.indexOf('Does modular compression')<mainText.indexOf('Atlas pages'));
    assert(mainText.indexOf('Wolfram is our planned')<mainText.indexOf('Atlas pages'));
    assert.equal(await page.locator('#atlas-topic-directory tbody tr').count(),8);
    const destinations=await page.locator('#atlas-topic-directory a').evaluateAll(links=>links.map(a=>a.href));assert.equal(destinations.length,8);assert(destinations.every(url=>url.startsWith(base+'/informatics/read/')),'Topic navigation left staging');
   }
   if(name==='music'){assert(text.indexOf('Does electronic music modulate gene expression')<text.indexOf('Non-invasive measurement before mRNA sequencing'));assert(text.indexOf('Non-invasive measurement before mRNA sequencing')<text.indexOf('SEQUENCE STRUCTURE'));}
   if(name==='transcription')assert(text.indexOf('Our priority is transcription factor binding sites')<text.indexOf('Understanding Binding Sites'));
   if(['music','computer-vision','quantum'].includes(name))assert(!text.includes('EMDR'),name);
   if(width===390||name==='overview')await page.screenshot({path:path.join(out,`${mode}-wiki-${name}-${width}.png`)});
   await page.close();results.push({name,width,topicFocus:true,noHorizontalOverflow:true});
  }
  await context.close();
 }
 const report={passed:true,mode,processAudioMuted:true,javascriptRequired:false,results};await fs.writeFile(path.join(out,`${mode}-focus-browser.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
