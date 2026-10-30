import fs from 'node:fs/promises';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const site='https://universalmind.tv',api='https://informatics-universal-one.universalmind.workers.dev',out=path.join(root,'research/informatics/populations-production-20261030');
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());const ctx=await browser.newContext({viewport:{width:1440,height:1000}});const page=await ctx.newPage();
const report={processAudioMuted:true,answers:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
try{
 await ctx.route(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/,r=>r.abort());
 await page.goto(site+'/informatics/library.html?collection=all&view=search&community=refugees&age=youth',{waitUntil:'domcontentloaded'});
 await page.frameLocator('#research-frame').locator('#result-count').filter({hasText:'12 papers'}).waitFor({timeout:45000});
 await page.locator('.uo .iam-realtime-voice__summon').click();
 const questions=[
  'Explain how I combine Communities and Contexts with Age group to find refugee youth research. Give the exact current all-collection count with Include related research off and on. Explain whether every result directly studies refugee young people.',
  'For domestic and family violence across all ages and all collections, give the direct/contextual count and the total with related research. Are AI-guided recommendations and continuous research already active? Did this feature update fine-tune your model weights?'
 ];
 for(const [i,question] of questions.entries()){
  await page.locator('#uo-question').fill(question);
  const pending=page.waitForResponse(r=>r.url()===api+'/research'&&r.request().method()==='POST',{timeout:180000});
  await page.locator('.uo [data-send]').click();const response=await pending;const data=await response.json();
  assert.equal(response.status(),200,JSON.stringify(data));assert.equal(data.model,'gpt-6-astra');assert.ok(data.usage.totalTokens>0);
  assert.ok(data.sources.some(s=>s.kind==='library-navigation'));
  assert.ok(data.sources.filter(s=>s.kind==='library-navigation').every(s=>s.url.startsWith('https://universalmind.tv/')));
  assert.ok(!new RegExp('\\b(sh'+'ould|co'+'uld|wo'+'uld)\\b','i').test(data.answer));
  if(i===0){assert.match(data.answer,/\b12\b|\btwelve\b/i);assert.match(data.answer,/\b25\b|\btwenty.five\b/i);assert.match(data.answer,/inferred|indirect|not every|not all|does not mean/i);}
  else{assert.match(data.answer,/\b5\b|\bfive\b/i);assert.match(data.answer,/\b62\b|\bsixty.two\b/i);assert.match(data.answer,/planned|not active|not currently|not yet/i);assert.match(data.answer,/not.*fine.tun|no.*fine.tun|not.*retrain|no.*retrain|didn.t.*fine.tun/i);}
  await page.locator('.uo-answer').nth(i).waitFor();const visible=await page.locator('.uo-answer').nth(i).innerText();assert.ok(visible.length>80);
  report.answers.push({question,http:response.status(),...data,visible});await page.screenshot({path:path.join(out,'universal-one-'+i+'.png')});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.error=error.stack;throw error;}finally{
 for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});
 await ctx.close();await browser.close();await server.close();await fs.writeFile(path.join(out,'universal-one.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,actualOpenAIResponses:report.answers.length,visibleChat:true}));
