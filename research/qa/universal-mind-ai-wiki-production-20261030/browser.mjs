import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const { chromium } = require('playwright');
const output = new URL('./', import.meta.url);
const origin = 'https://universalmind.tv';
const browser = await chromium.launch({headless:true,args:['--mute-audio','--enable-automation']});
const report={origin,checks:[],screenshots:[],pageErrors:[]};
try {
  const session=await browser.newBrowserCDPSession();
  const command=await session.send('Browser.getBrowserCommandLine');
  assert(command.arguments.includes('--mute-audio'));
  report.processAudioDisabled=true;
  await session.detach();
  for(const width of [1440,390,320]) {
    const height=width===1440?900:844;
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    try {
      const page=await context.newPage();
      page.on('pageerror',error=>report.pageErrors.push({width,message:error.message}));
      for(const route of ['/','/home/']) {
        await page.goto(origin+route,{waitUntil:'domcontentloaded'});
        const link=page.getByRole('link',{name:'Wiki For AI / LLMs',exact:true});
        await link.waitFor({state:'visible'});
        await page.evaluate(()=>document.fonts.ready);
        const geometry=await link.evaluate(el=>{
          const r=el.getBoundingClientRect(),s=getComputedStyle(el);
          return {left:r.left,bottom:innerHeight-r.bottom,width:r.width,height:r.height,font:s.font,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,opacity:s.opacity,letterSpacing:s.letterSpacing,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};
        });
        assert.equal(geometry.fontSize,'10px');
        assert.equal(geometry.opacity,'0.55');
        assert.equal(geometry.color,'rgb(170, 170, 170)');
        assert.equal(geometry.left,14);
        assert.equal(geometry.bottom,10);
        assert(geometry.bodyWidth<=width);
        if(route==='/home/') {
          assert(await page.evaluate(()=>{
            const link=document.querySelector('.ai-wiki-link').getBoundingClientRect();
            return [...document.querySelectorAll('.directory-control')].every(control=>{
              const r=control.getBoundingClientRect();
              return r.right<=link.left || r.left>=link.right || r.bottom<=link.top || r.top>=link.bottom;
            });
          }), 'Home controls must clear the wiki link.');
        }
        const filename=(route==='/'?'landing':'home')+'-'+width+'.png';
        await page.screenshot({path:new URL(filename,output).pathname,fullPage:true});
        report.screenshots.push(filename);
        await link.click();
        await page.waitForURL(origin+'/read/');
        await page.getByRole('heading',{name:'Universal Mind',exact:true}).waitFor();
        assert(await page.locator('#organisation').textContent().then(x=>x.includes('Ben Korbel')));
        assert.equal(await page.locator('form,input[type=password],iframe,video,audio').count(),0);
        for(const id of ['iam','events','happiness','informatics','resources','access']) assert.equal(await page.locator('#'+id).count(),1);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.equal(await page.evaluate(()=>Boolean(document.fullscreenElement)),false);
        report.checks.push({width,route,wikiReachedWithoutLogin:true,geometry});
      }
      const wikiShot='wiki-'+width+'.png';
      await page.screenshot({path:new URL(wikiShot,output).pathname,fullPage:true});
      report.screenshots.push(wikiShot);
      await page.getByRole('link',{name:'AI access',exact:true}).click();
      assert.equal(new URL(page.url()).hash,'#access');
      assert(await page.locator('#access').isVisible());
      await page.getByRole('link',{name:'Plain-text guide',exact:true}).click();
      await page.waitForURL(origin+'/llms.txt');
      assert((await page.locator('body').textContent()).includes('Universal Mind is a project of Ben Korbel'));
      await page.goto(origin+'/read/',{waitUntil:'domcontentloaded'});
      await page.getByRole('link',{name:'JSON guide',exact:true}).click();
      await page.waitForURL(origin+'/read/resources.json');
      const json=JSON.parse(await page.locator('body').innerText());
      assert.equal(json.projects.length,4); assert.equal(json.resources.length,34);
      report.checks.push({width,anchorAndPlainTextAndJSON:true});
      await page.close();
    } finally {
      for(const page of context.pages()) await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(m=>m.pause())).catch(()=>{});
      await context.close();
    }
  }
  const noScript=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try {
    const page=await noScript.newPage();
    for(const route of ['/','/home/']) {
      await page.goto(origin+route,{waitUntil:'domcontentloaded'});
      await page.getByRole('link',{name:'Wiki For AI / LLMs',exact:true}).click();
      await page.waitForURL(origin+'/read/');
      assert.equal(await page.locator('#organisation').count(),1);
    }
    report.withoutJavaScript=true;
  } finally {await noScript.close();}
  assert.deepEqual(report.pageErrors,[]);
  report.passed=true;
} finally {
  await browser.close();
  report.browserClosed=true;
  await fs.writeFile(new URL('browser.json',output),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,widths:[1440,390,320],withoutJavaScript:report.withoutJavaScript,processAudioDisabled:true,browserClosed:true}));
