import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const output=process.env.UO_QA_OUTPUT||'/private/tmp/uo-qa';fs.mkdirSync(output,{recursive:true});
const args=['--mute-audio','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',`--use-file-for-fake-audio-capture=${output}/question.wav`];
assert(args.includes('--mute-audio'));
const browser=await chromium.launch({headless:true,args});
const report={origin:'https://staging.universalmind.tv',processAudioDisabled:true,checks:[],errors:[]};
const context=await browser.newContext({viewport:{width:1470,height:1000},acceptDownloads:true});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push(e.message));
const url='https://staging.universalmind.tv/informatics/library.html?collection=all&view=search';
async function ask(question){
 const before=await page.locator('.uo-message[data-role=assistant]').count();
 await page.locator('#uo-question').fill(question);await page.locator('[data-send]').click();
 await page.waitForFunction(n=>document.querySelectorAll('.uo-message[data-role=assistant]').length>n,before,{timeout:180000});
 return page.locator('.uo-message[data-role=assistant]').last().innerText();
}
try{
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#export-json:not([disabled])').waitFor({timeout:60000});
 assert.equal(await page.evaluate(()=>UniversalOneResearch.getState().microphone),false);
 const downloads={};
 for(const kind of ['json','csv']){const event=page.waitForEvent('download');await page.locator('#export-'+kind).click();const d=await event;await d.saveAs(`${output}/research.${kind}`);downloads[kind]=fs.readFileSync(`${output}/research.${kind}`,'utf8');}
 const data=JSON.parse(downloads.json);assert.equal(data.records.length,781);assert.equal(data.records.filter(r=>r.fullText.retrievalAvailable).length,130);assert(downloads.csv.includes('retrievalAvailable'));
 report.checks.push({exports:true,records:data.records.length,fullTexts:130});
 await page.locator('.uo .iam-realtime-voice__summon').click();
 for(const width of [1470,1024,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const theme of ['video','black','white']){
   await page.evaluate(theme=>document.documentElement.dataset.readingBackground=theme,theme);
   const bounds=await page.locator('.uo-panel').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);assert(bounds.y>=0);
   assert.equal(await page.evaluate(()=>UniversalOneResearch.getState().microphone),false);
  }
  await page.screenshot({path:`${output}/uo-${width}.png`});report.checks.push({width,threeThemes:true,panelFits:true});
 }
 await page.setViewportSize({width:1470,height:1000});await page.evaluate(()=>document.documentElement.dataset.readingBackground='video');
 const countAnswer=await ask('How many unique publications and indexed full texts are in this library?');assert(countAnswer.includes('781')&&countAnswer.includes('130'));
 const evidenceAnswer=await ask('What does the nine-person 2018 study of 528 Hz music report about oxytocin? Did it measure OXTR gene transcription? Cite the study.');
 assert(await page.locator('.uo-message[data-role=assistant]').last().locator('.uo-source').count()>0);
 await page.locator('.uo-message[data-role=assistant]').last().scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/uo-cited-answer.png`});report.checks.push({realAstraRendered:true,countAnswer,evidenceAnswer});
 // Dictation: a synthetic microphone recording, review before sending.
 await page.locator('.uo [data-record]').click();await page.waitForFunction(()=>UniversalOneResearch.getState().microphone);await page.waitForTimeout(5500);await page.locator('.uo [data-record]').click();
 await page.waitForFunction(()=>document.querySelector('.uo-status').textContent.includes('Review your words'),{},{timeout:60000});
 const dictated=await page.locator('#uo-question').inputValue();assert(dictated.toLowerCase().includes('publication'));assert.equal(await page.evaluate(()=>UniversalOneResearch.getState().microphone),false);
 report.checks.push({dictationReview:true,dictated});
 // Voice: the same real transcription -> Astra -> Marin -> decoded playback chain.
 await page.locator('[data-mode=voice]').click();await page.evaluate(()=>{const film=document.querySelector('video');film.volume=.8;film.muted=true;});
 const turns=await page.evaluate(()=>UniversalOneResearch.getState().turns);
 await page.locator('.uo [data-record]').click();await page.waitForFunction(()=>UniversalOneResearch.getState().microphone);await page.waitForTimeout(5500);await page.locator('.uo [data-record]').click();
 await page.waitForFunction(()=>UniversalOneResearch.getState().playing,{},{timeout:180000});
 assert.equal(await page.evaluate(()=>UniversalOneResearch.getState().microphone),false);
 await page.waitForTimeout(850);const mix=await page.evaluate(()=>document.querySelector('video').volume);assert(Math.abs(mix-.12)<.02);
 await page.locator('[data-mode=text]').click();await page.waitForTimeout(1100);const restored=await page.evaluate(()=>document.querySelector('video').volume);assert(Math.abs(restored-.8)<.01);
 const state=await page.evaluate(()=>UniversalOneResearch.getState());assert(!state.microphone&&!state.playing&&state.turns>turns);
 report.checks.push({voiceChain:true,microphoneClosedDuringSpeech:true,duckedVolume:mix,restoredVolume:restored,sharedHistory:true});
 // Recoverable microphone denial does not stop text chat.
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Permission denied','NotAllowedError');};});
 await page.locator('.uo [data-record]').click();await page.waitForFunction(()=>document.querySelector('.uo-status').textContent.includes('denied'));
 report.checks.push({microphoneDenial:true});
 await page.locator('.uo-close').click();assert.equal(await page.evaluate(()=>UniversalOneResearch.getState().open),false);
 assert.equal(report.errors.length,0);
}catch(error){report.failure=error.stack;await page.screenshot({path:`output/failure.png`.replace('output',output)}).catch(()=>{});throw error;}
finally{fs.writeFileSync(`${output}/verification.json`,JSON.stringify(report,null,2));await page.evaluate(()=>{UniversalOneResearch?.close();document.querySelectorAll('audio,video').forEach(m=>m.pause());}).catch(()=>{});await browser.close();}
console.log(JSON.stringify(report,null,2));
