import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/universal-one-quantum-20261109';
const browser=await chromium.launch({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Non-playback check','NotAllowedError'));};});
 await context.route('**/*',route=>route.request().resourceType()==='media'?route.abort():route.continue());
 const page=await context.newPage();await page.goto('https://staging.universalmind.tv/informatics/quantum/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.UniversalOneQuantum?.available());
 await page.locator('.uo .iam-realtime-voice__summon').click();
 const welcome=await page.locator('.uo-welcome').innerText();assert.match(welcome,/Quantum form/);
 const checks=await page.evaluate(async()=>{const base='https://informatics-universal-one-staging.universalmind.workers.dev';const health=await fetch(base+'/health');const invalid=await fetch(base+'/quantum/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:''})});return {health:{status:health.status,body:await health.json()},invalid:{status:invalid.status,body:await invalid.json()}};});
 assert.equal(checks.health.status,200);assert.equal(checks.invalid.status,400);
 await page.screenshot({path:out+'/staging-command-controls.png'});
 await fs.writeFile(out+'/staging-readiness.json',JSON.stringify({passed:true,welcome,...checks,newModelCalls:0,liveModelVerification:'pending approval'},null,2)+'\n');
 console.log(JSON.stringify({passed:true,helperAvailable:true,health:checks.health.status,invalidCommand:checks.invalid.status,newModelCalls:0}));
 await context.close();
}finally{await browser.close();}
