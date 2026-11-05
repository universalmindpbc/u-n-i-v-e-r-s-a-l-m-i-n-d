import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const live=process.argv.includes('--live');
const origin='https://staging.universalmind.tv';
const dir=live?'documents/universal-mind-lab/qa/lineup-about-20261105':'/private/tmp/um-lineup-about-20261105';
fs.mkdirSync(dir,{recursive:true});
const binary='/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const server=await chromium.launchServer({headless:true,executablePath:binary,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const checks=[],hashes={};
const labels=['Dissolving Stigma','Transforming Access','Free to Participate','Transforming Referral Pathways'];
const artists = ['Tame Impala', 'Justice', 'Flume', 'Sampa the Great'];
const label = 'A direct response to this body of research';
async function verifyResearch(link, context) {
  assert.equal((await link.textContent()).trim(), label);
  const opened = context.waitForEvent('page');
  await link.click();
  const research = await opened;
  await research.waitForURL(origin + '/lab/research.html');
  assert(await research.locator('h1').isVisible());
  await research.close();
}
async function verifyArtists(about) {
  const marks = about.locator('.about-lineup-artists .artist-mark');
  assert.deepEqual(await marks.evaluateAll(items => items.map(item => item.getAttribute('aria-label'))), artists);
  for (const mark of await marks.all()) {
    assert(await mark.isVisible());
    assert(await mark.evaluate(item => getComputedStyle(item).maskImage.includes('/assets/lineup/')));
  }
}
try{
  for(const mobile of [true,false]){
    const viewport=mobile?{width:393,height:780}:{width:1440,height:900};
    const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
    try{
      await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=async function(){};});
      await context.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.pathname.endsWith('/hls.min.js'))return route.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}}'});
        if(url.origin!==origin)return route.abort();
        if(live)return route.continue();
        const file=path.resolve('.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
        if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.abort();
        return route.fulfill({path:file,...(file.endsWith('.mjs')?{contentType:'application/javascript'}:{})});
      });
      if(live&&mobile){
        for(const file of ['index.html','lab.css','lab.mjs','research.html']){
          const res=await context.request.get(origin+'/lab/'+file+'?verify=lineupabout2');
          assert.equal(res.status(),200);const raw=await res.body();
          const data=file.endsWith('.html')?Buffer.from(raw.toString().replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/[^>]*><\/script>\n?/g,'')):raw;
          assert(data.equals(fs.readFileSync('lab/'+file)),file);hashes[file]=createHash('sha256').update(data).digest('hex');
        }
      }
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/lab/',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('body[data-ready="true"]',{state:'attached',timeout:120000});
      const landing = page.locator('#landing'), about = page.locator('#vision');
      const disclosure = about.locator('#about-lineup'), summary = disclosure.locator('summary');
      assert.equal(await page.locator('#mobile-lineup-open').count(), 0);
      const ticker = landing.locator('.impact-ticker');
      assert.deepEqual(await ticker.locator('span').allTextContents(), labels);
      for (const size of [mobile ? {width:844,height:390} : {width:760,height:780}, viewport]){
        await page.setViewportSize(size);
        assert.equal(await ticker.isVisible(), mobile);
        assert.equal(await landing.locator('.research-link').isVisible(), mobile);
        assert(await landing.locator('#explore-enter').isVisible());
      }
      if(mobile){
        assert.deepEqual(await ticker.locator('span').evaluateAll(items => items.map(x => getComputedStyle(x).animationDelay)), ['0s','7s','14s','21s']);
        await verifyResearch(landing.locator('.research-link'), context);
      }else{
        await page.screenshot({path:dir+'/desktop-splash.jpg',quality:78});
      }
      await page.locator('.landing-name').click();
      assert(await summary.isVisible());
      if(mobile){
        assert.equal(await disclosure.getAttribute('open'), null);
        await summary.click();
        await verifyArtists(about);
        await summary.click();
        assert.equal(await disclosure.getAttribute('open'), null);
      }
      const aboutResearch = about.locator('.proposal-scroll > :last-child a');
      await verifyResearch(aboutResearch, context);
      assert(await about.isVisible());
      await page.locator('#about-close').click();
      await page.locator('#explore-enter').click();
      await page.waitForSelector('body[data-entered="true"]',{state:'attached'});
      assert(await page.locator('.explore-bar .impact-ticker').isVisible());
      await verifyResearch(page.locator('.explore-bar .research-link'),context);
      for(const size of mobile?[viewport,{width:320,height:658},{width:844,height:390}]:[viewport]){
        await page.setViewportSize(size);
        if(mobile){
          const aboutButton = page.locator('#about-open');
          assert.equal(await page.getByRole('button',{name:'Lineup',exact:true}).count(),0);
          if(size.width===393) await page.screenshot({path:dir+'/mobile-controls.jpg',quality:76});
          await aboutButton.tap();
          assert.equal(await disclosure.evaluate(x=>x.open),false);
          assert.equal(await about.locator('.about-lineup-artists').isVisible(),false);
          await summary.tap();
          assert(await disclosure.evaluate(x=>x.open));
          await verifyArtists(about);
          if(size.width===393) await page.screenshot({path:dir+'/mobile-lineup.jpg',quality:82});
          if(size.width===320) await page.keyboard.press('Escape');
          else await page.locator('#about-close').click();
          assert.equal(await about.isVisible(),false);
          assert(await aboutButton.evaluate(x=>document.activeElement===x));
          await aboutButton.tap();
          assert.equal(await disclosure.evaluate(x=>x.open),false);
          await page.locator('#about-close').click();
        }else{
          await page.locator('#about-open').click();
          assert(await about.isVisible());assert(await summary.isVisible());
          await page.locator('#about-close').click();
        }
        checks.push({mobile,...size,researchAndImpactVisibleOnSplash:mobile,researchInSceneAndAbout:true, mobileLineupOnlyInAbout:mobile, testedCollapsedOnReopen:mobile, artists:mobile?artists:undefined});
      }
      assert.deepEqual(errors,[]);
    }finally{
      for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});
      await context.close();
    }
  }
  fs.writeFileSync(dir+'/verification.json',JSON.stringify({live,mutedChromium:true,mediaPlaybackStubbed:true,hashes,checks},null,2)+'\n');
  console.log(JSON.stringify({live,checks:checks.map(x=>[x.width,x.height]),hashes:Object.keys(hashes)}));
}finally{await browser.close();await server.close();}
