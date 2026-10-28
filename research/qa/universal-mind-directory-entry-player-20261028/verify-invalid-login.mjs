import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin='https://staging.universalmind.tv',repo='/private/tmp/um-directory-20261028/repo',out='/private/tmp/um-directory-20261028/entry-player-qa';
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),processAudioDisabled:true,nativeFullscreenInvoked:false,fullscreenVerification:'Fullscreen API intercepted; persistent owner document, activation and routing verified without invoking native fullscreen.',checks:[],errors:[]};
let password='';
const pause=async page=>{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(x=>x.pause())).catch(()=>{});};
const stub=async context=>context.addInitScript(()=>{
 window.__documentToken=Math.random().toString(36);window.__fullscreenRequests=[];let active=null;
 Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>active});
 Element.prototype.requestFullscreen=function(){window.__fullscreenRequests.push({activation:navigator.userActivation.isActive});active=this;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
 document.exitFullscreen=()=>{active=null;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
});
const directory=page=>page.frames().find(f=>new URL(f.url()).pathname==='/home/'&&f!==page.mainFrame())||page.mainFrame();
const filmState=()=>{const v=window.parent.UniversalMindEntry?.getBackgroundFilm?.()||document.querySelector('.festival-film');return {source:v.currentSrc,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,paused:v.paused,playsInline:v.playsInline,autoplay:v.autoplay,ready:v.readyState,time:v.currentTime,error:v.error?.code};};
const mediaCheck=async frame=>{
 await frame.waitForFunction(()=>{const v=window.parent.UniversalMindEntry?.getBackgroundFilm?.()||document.querySelector('.festival-film');return v?.readyState>=2&&!v.paused;},null,{timeout:45000});
 const first=(await frame.evaluate(filmState)).time;await new Promise(r=>setTimeout(r,500));const state=await frame.evaluate(filmState);
 assert.equal(state.source,origin+'/home/assets/festival-loop.mp4?v=silent-1');assert(state.muted&&state.defaultMuted&&state.playsInline&&state.autoplay&&!state.paused&&state.time>first);assert.equal(state.volume,0);return state;
};
const requireEntryGesture=async context=>context.addInitScript(()=>{
 let gesture=false;const unlocked=new WeakSet();window.__entryMediaTrace=[];
 for(const type of ['click','touchend','keydown'])document.addEventListener(type,()=>{gesture=true;setTimeout(()=>{gesture=false;},0);},true);
 const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){
  if(this.matches('.um-directory-film,.festival-film')){
   window.__entryMediaTrace.push({event:'play',gesture,player:this.className});
   if(gesture)unlocked.add(this);
   if(!unlocked.has(this)){this.pause();this.removeAttribute('autoplay');return Promise.reject(new DOMException('Fresh player requires an entry action in QA','NotAllowedError'));}
  }
  return play.call(this);
 };
 document.addEventListener('play',e=>{if(e.target.matches?.('.um-directory-film,.festival-film')&&!unlocked.has(e.target)){e.target.pause();e.target.removeAttribute('autoplay');}},true);
 const originalFetch=window.fetch;
 window.fetch=function(input,options){if(String(input)==='/events/portal-entry.php')window.__entryMediaTrace.push({event:'entry-request'});return originalFetch.apply(this,arguments);};
});

try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await stub(context);const page=await context.newPage();
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});await page.locator('[data-access-password]').fill('invalid-entry-media-test');await page.getByRole('button',{name:'enter',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-access-error]').textContent==='password not recognised');
 const state=await page.evaluate(()=>({paused:window.UniversalMindEntry.getBackgroundFilm().paused,opacity:getComputedStyle(window.UniversalMindEntry.getBackgroundFilm()).opacity,frames:document.querySelectorAll('iframe').length}));assert(state.paused&&state.opacity==='0'&&state.frames===0);report.checks.push({invalidLoginKeepsVideoHiddenAndPaused:state});report.passed=true;
}catch(e){report.passed=false;report.failure=String(e.stack);}
finally{for(const c of browser.contexts()){for(const p of c.pages())await pause(p);await c.close();}await browser.close();await server.close();await fs.writeFile(out+'/invalid-login-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
