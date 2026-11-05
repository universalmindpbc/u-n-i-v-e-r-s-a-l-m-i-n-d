import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const live=process.argv.includes('--live');
const origin='https://staging.universalmind.tv';
const dir=live?'documents/universal-mind-lab/qa/mobile-impact-20261105':'/private/tmp/um-mobile-impact-20261105';
fs.mkdirSync(dir,{recursive:true});
const binary='/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const server=await chromium.launchServer({headless:true,executablePath:binary,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const checks=[],hashes={};
const labels=['Dissolving Stigma','Transforming Access','Free to Participate','Transforming Referral Pathways'];
async function checkFooter(page,mobile,landing){
  const {status,credit,items,bounds,delays,visibleLink,linkText,parent,overflow}=await page.locator('.footline').evaluate(footer=>{
    const item=s=>footer.querySelector(s),rect=s=>item(s).getBoundingClientRect().toJSON(),link=item('.research-link'),box=rect('.research-link');
    return {credit:item('.initiative-credit').textContent,status:item('.proposal-status').innerText,items:[...item('.impact-ticker').children].map(x=>x.textContent),
      bounds:{credit:rect('.initiative-credit'),status:rect('.proposal-status'),impact:rect('.impact-ticker'),link:box},
      delays:[...item('.impact-ticker').children].map(x=>getComputedStyle(x).animationDelay),
      visibleLink:link.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)),linkText:link.textContent.trim(),parent:footer.parentElement.className,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(credit,'a mental health initiative by New South Wales Education, Headspace & Universal Mind');
  assert.deepEqual(items,labels);assert.equal(linkText,'A direct response to this body of research');
  assert.equal(status,mobile?'Proposal':'Artists, festival partners and mental health partners are proposed and not confirmed.');
  assert.equal(parent,landing?'landing-footer':'explore-bar');assert.equal(overflow,false);
  if(!visibleLink){
    const hit=await page.evaluate(({x,y,width,height})=>document.elementFromPoint(x+width/2,y+height/2)?.outerHTML.slice(0,160),bounds.link);
    assert.fail(JSON.stringify({reason:'research link hit test',viewport:page.viewportSize(),landing,hit,bounds}));
  }
  assert(bounds.status.top>=bounds.credit.bottom-1);
  const {width,height}=page.viewportSize();assert(bounds.link.left>=0&&bounds.link.right<=width+.5&&bounds.link.bottom<=height);
  if(mobile&&width<height){assert(bounds.link.top>=bounds.status.bottom);assert(bounds.impact.right<=bounds.link.left);assert(bounds.link.height>=44);}
  assert.deepEqual(delays,['0s','7s','14s','21s']);
  checks.push({width,height,screen:landing?'landing':'landscape',mobile,status,linkBounds:bounds.link});
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
          const res=await context.request.get(origin+'/lab/'+file+'?verify=mobileimpact1');
          assert.equal(res.status(),200);const raw=await res.body();
          const data=file.endsWith('.html')?Buffer.from(raw.toString().replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/[^>]*><\/script>\n?/g,'')):raw;
          assert(data.equals(fs.readFileSync('lab/'+file)),file);hashes[file]=createHash('sha256').update(data).digest('hex');
        }
      }
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/lab/',{waitUntil:'domcontentloaded'});
      await page.waitForSelector('body[data-ready="true"]',{state:'attached',timeout:120000});
      if(mobile){
        await checkFooter(page,true,true);
        const popup=context.waitForEvent('page');await page.locator('.footline .research-link').click();
        const research=await popup;await research.waitForLoadState('domcontentloaded');assert.equal(research.url(),origin+'/lab/research.html');assert(await research.locator('h1').isVisible());await research.close();
        await page.screenshot({path:dir+'/portrait-home.jpg',type:'jpeg',quality:84});
        await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.impact-ticker span').first().evaluate(x=>getComputedStyle(x).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
      }
      await page.locator('.landing-name').click();const about=page.locator('#vision');assert(await about.isVisible());
      const impact=about.locator('.impact-section');
      assert.equal(await impact.locator('h3').textContent(),'Free access. Dissolving stigma. Clear pathways to support.');
      assert.deepEqual(await impact.locator('dt').allTextContents(),labels);
      const text=await impact.locator('dd').nth(1).innerText();
      for(const phrase of ['digital platform','live TV','road train','regional communities'])assert(text.includes(phrase));
      assert(await impact.evaluate(s=>s.nextElementSibling.matches('.day-programme')));
      assert.equal(await impact.locator('dl').evaluate(x=>getComputedStyle(x).gridTemplateColumns.split(' ').length),mobile?1:2);
      await impact.evaluate(el=>el.scrollIntoView({block:'start'}));
      if(mobile)await page.screenshot({path:dir+'/portrait-impact.jpg',type:'jpeg',quality:84});
      await page.locator('#about-close').click();await page.locator('#explore-enter').click();
      await page.waitForSelector('body[data-entered="true"]',{state:'attached'});
      for(const size of mobile?[viewport,{width:320,height:658},{width:844,height:390}]:[viewport]){
        await page.setViewportSize(size);
        await page.waitForTimeout(150);
        await checkFooter(page,mobile,false);
      }
      await page.locator('#about-open').click();assert(await about.isVisible());await page.locator('#about-close').click();
      assert.deepEqual(errors,[]);
    }finally{
      for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});
      await context.close();
    }
  }
  fs.writeFileSync(dir+'/verification.json',JSON.stringify({live,mutedChromium:true,mediaPlaybackStubbed:true,hashes,checks},null,2)+'\n');
  console.log(JSON.stringify({live,checks:checks.map(x=>[x.screen,x.width,x.height]),hashes:Object.keys(hashes)}));
}finally{await browser.close();await server.close();}
