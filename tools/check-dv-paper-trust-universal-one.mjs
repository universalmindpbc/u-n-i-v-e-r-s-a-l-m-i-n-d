import fs from 'node:fs/promises';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site='https://staging.universalmind.tv',api='https://informatics-universal-one-staging.universalmind.workers.dev',out=path.join(root,'research/informatics/dv-paper-trust-20261101');
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());const ctx=await browser.newContext({viewport:{width:1440,height:1000}});const page=await ctx.newPage();
const report={processAudioMuted:true,answers:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
try{
 await ctx.route(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/,r=>r.abort());
 await page.goto(site+'/informatics/library.html?collection=all&view=search&community=domestic-violence',{waitUntil:'domcontentloaded'});
 await page.frameLocator('#research-frame').locator('#result-count').filter({hasText:'115 papers'}).waitFor({timeout:45000});
 await page.locator('.uo .iam-realtime-voice__summon').click();
 const questions=['In the approved Domestic & Family Violence library, explain the current individual-paper Trust Factor scale using digits 1, 2 and 3. Read PMID 42326745 and PMID 41024298 and state each paper’s numeric score and displayed cross count. What does a single-blind RCT receive? Is any double-blind trial verified among the 117 approved papers? Explain why a chapter can have 2 crosses.'];
 for(const [i,question] of questions.entries()){
  await page.locator('#uo-question').fill(question);
  const pending=page.waitForResponse(r=>r.url()===api+'/research'&&r.request().method()==='POST',{timeout:180000});
  await page.locator('.uo [data-send]').click();const response=await pending;const data=await response.json();
  assert.equal(response.status(),200,JSON.stringify(data));assert.equal(data.model,'gpt-6-astra');assert.ok(data.usage.totalTokens>0);
  assert.ok(data.sources.some(s=>s.kind==='approved-record'||s.kind==='approved-research-guide'));
  assert.ok(!new RegExp('\\b(sh'+'ould|co'+'uld|wo'+'uld)\\b','i').test(data.answer));
  assert.ok(data.sources.some(s=>s.id==='dv-adult-therapy-42326745'));
  assert.ok(data.sources.some(s=>s.id==='dv-mindbody-41024298'));
  for(const n of [1,2,3])assert.match(data.answer,new RegExp('\\b'+n+'\\b'));
  assert.match(data.answer,/single.blind/i);assert.match(data.answer,/double.blind/i);

  await page.locator('.uo-answer').nth(i).waitFor();const visible=await page.locator('.uo-answer').nth(i).innerText();assert.ok(visible.length>80);
  report.answers.push({question,http:response.status(),...data,visible});await page.screenshot({path:path.join(out,'universal-one-'+i+'.png')});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;report.knowledgeMethod='Versioned retrieval of 117 approved summaries; no model fine-tuning or shared database mutation';
}catch(error){report.error=error.stack;throw error;}finally{
 for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});
 await ctx.close();await browser.close();await server.close();await fs.writeFile(path.join(out,'universal-one.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,actualOpenAIResponses:report.answers.length,visibleChat:true}));
