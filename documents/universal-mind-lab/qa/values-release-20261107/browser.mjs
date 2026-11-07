import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=process.cwd();
const mode='live';
const releaseTarget=process.argv[2]||'staging';
const site=releaseTarget==='production'?'https://universalmind.tv':'https://staging.universalmind.tv';
const out=path.join(root,'documents/universal-mind-lab/qa/values-release-20261107',releaseTarget);
fs.mkdirSync(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const baseline=execFileSync('git',['show','f12cd6d73:lab/index.html'],{cwd:root,encoding:'utf8'});
const current=fs.readFileSync(path.join(root,'lab/index.html'),'utf8');
const originalDialog=s=>s.match(/<dialog id="learning"[\s\S]*?<\/dialog>/)[0];
assert.equal(originalDialog(current),originalDialog(baseline));
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const checks=[],errors=[],failed=[];
const sizes=[{width:1440,height:1000},{width:390,height:844}];
try{
  for(const viewport of sizes){
    const mobile=viewport.width<1000;
    const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(()=>{
      window.__fullscreenQA=0;
      Element.prototype.requestFullscreen=async()=>{window.__fullscreenQA++;};
      Element.prototype.webkitRequestFullscreen=async()=>{window.__fullscreenQA++;};
    });
    if(mode==='local'||mode==='quick')await context.route('https://staging.universalmind.tv/lab/**',async route=>{
      const pathname=new URL(route.request().url()).pathname;
      const relative=pathname==='/lab/'?'index.html':pathname.slice('/lab/'.length);
      await route.fulfill({path:path.join(root,'lab',relative)});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).hostname===new URL(site).hostname)failed.push(r.status()+' '+r.url());});
    try{
      const navigation=await page.goto(site+'/lab/',{waitUntil:'networkidle'});
      const navigationText=await navigation.text();
      const analyticsPattern=/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js\/[^"]+"[^>]*><\/script>\n?/g;
      assert((navigationText.match(analyticsPattern)||[]).length<=1);
      assert.equal(sha(navigationText.replace(analyticsPattern,'')),sha(current),'Navigation source differs beyond the known analytics injection');
      if(releaseTarget==='staging'){const raw=await context.request.get(site+'/lab/index.html?qa=values-release-20261107');assert.equal(raw.status(),200);assert.equal(sha(await raw.body()),sha(current));}

      await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
      assert.equal(await page.locator('#landing .partner-mark:visible').count(),0);
      if(mode!=='baseline'){
        await page.locator('.landing-name').click();
        const aboutText=await page.locator('#vision').innerText();assert(aboutText.includes('Guided by the Universal Mind values'));assert(!aboutText.includes('Universal Nine'));
        if(releaseTarget==='staging'){await page.locator('.academy-about').scrollIntoViewIfNeeded();await page.locator('.academy-about').screenshot({path:path.join(out,`about-${viewport.width}.png`)});checks.push({viewport,correctedCopy:true,exactHTMLAsset:true,knownAnalyticsInjectionOnly:true});continue;} 
        for(const name of ['steam','continuum']){
          const opener=page.locator('#academy-'+name+'-open');
          await opener.scrollIntoViewIfNeeded();
          const previousScroll=await page.locator('#vision .proposal-scroll').evaluate(e=>e.scrollTop);
          await opener.click();
          const dialog=page.locator('#academy-'+name);
          await dialog.waitFor({state:'visible'});
          assert.equal(await page.locator('dialog[open]').count(),1);
          assert(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
          assert(await dialog.locator('.academy-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
          if(name==='steam'){assert.equal(await dialog.locator('.steam-area').count(),6);assert((await dialog.locator('.steam-centre-title').textContent()).includes('Artificial'));}
          if(name==='continuum'){
            assert.equal(await dialog.locator('.continuum-node').count(),3);
            assert.equal(await dialog.locator('.continuum-motto').textContent(),'everyone learnstogether as one');
          }
          await dialog.screenshot({path:path.join(out,`${name}-${viewport.width}.png`)});
          if(name==='steam'&&mobile){
            await dialog.locator('.academy-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);
            await dialog.screenshot({path:path.join(out,`${name}-science-${viewport.width}.png`)});
          }
          await page.keyboard.press('Tab');
          assert(await dialog.evaluate(e=>e.contains(document.activeElement)));
          if(name==='steam')await page.keyboard.press('Escape');
          else await dialog.locator('[data-academy-close]').click();
          await page.locator('#vision').waitFor({state:'visible'});
          assert.equal(await page.evaluate(()=>document.activeElement.id),'academy-'+name+'-open');
          assert(Math.abs(await page.locator('#vision .proposal-scroll').evaluate(e=>e.scrollTop)-previousScroll)<2);
        }
        await page.locator('#learn-about').click();
        await page.locator('#learning').waitFor({state:'visible'});
        await page.locator('#learn-close').click();
        await page.locator('#vision').waitFor({state:'visible'});
        await page.locator('#about-close').click();
      }
      await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100));
      await page.locator('#explore-enter').click();await page.clock.runFor(80);
      await page.clock.fastForward(82000);await page.clock.runFor(120);
      await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause()));
      await page.screenshot({path:path.join(out,`main-${viewport.width}.png`)});
      const layout=await page.locator('#world .footline').evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},text:e.innerText}));
      assert(layout.scrollWidth<=layout.width+1);
      assert(layout.rect.y>=0&&layout.rect.y+layout.rect.height<=viewport.height+1);
      assert(layout.text.includes('Proposal')||layout.text.includes('proposed'));
      for(const selector of ['.initiative-credit','.proposal-status']){const centre=await page.locator('#world '+selector).evaluate(e=>{const r=e.getBoundingClientRect();return r.x+r.width/2;});assert(Math.abs(centre-viewport.width/2)<.6);}
      const logos=[]; // Invoke the real theme handler directly on mobile, where the existing control is hidden.
      for(const theme of ['day','night']){
        if((await page.locator('body').getAttribute('data-night'))!==(theme==='night'?'true':'false'))await page.locator('#night-toggle').evaluate(e=>e.click());
        await page.clock.runFor(100);
        assert.equal(await page.locator('#world .partner-mark:visible').count(),2);
        assert(await page.locator('#world .partner-csiro').isVisible());
        const expectedColour=theme==='night'?'rgb(255, 255, 255)':await page.locator('#world .footline').evaluate(e=>getComputedStyle(e).color);
        for(const name of ['csiro','live-nation'])assert.equal(await page.locator('#world .partner-'+name).evaluate(e=>getComputedStyle(e).backgroundColor),expectedColour);
        await page.screenshot({path:path.join(out,`main-${theme}-${viewport.width}.png`)});
        logos.push({theme,visible:2});
      }
      checks.push({viewport,logos,dialogJourney:mode!=='baseline',footer:layout,fullscreenCallsIntercepted:await page.evaluate(()=>window.__fullscreenQA)});
      if(mode==='live'&&viewport.width===1440){
        const files=['index.html','lab.mjs','academy.css','partner-marks.css','assets/csiro-white.svg','assets/live-nation.svg','research.html'];
        const http=[];
        for(const file of files){
          if(!fs.existsSync(path.join(root,'lab',file)))continue;
          const response=await context.request.get(site+'/lab/'+file+'?qa=academy-20261107');
          assert.equal(response.status(),200);
          const hash=sha(await response.body());assert.equal(hash,sha(fs.readFileSync(path.join(root,'lab',file))));http.push({file,status:response.status(),sha256:hash});
        }
        fs.writeFileSync(path.join(out,'http.json'),JSON.stringify(http,null,2)+'\n');
      }
    }finally{
      await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});
      await page.close();await context.close();
    }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const result={mode,passed:true,url:site+'/lab/',processMuted:true,nativeFullscreen:false,originalDiagramSha256:sha(originalDialog(current)),checks,errors,failed};
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({passed:true,mode,viewports:checks.length,originalDiagramPreserved:true,out}));
}finally{await browser.close();await server.close();}
