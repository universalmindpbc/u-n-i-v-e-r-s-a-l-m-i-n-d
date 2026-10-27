import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const out = `${root}/research/qa/iam-research-links-20261027`;
fs.mkdirSync(out, {recursive: true});
const base = 'https://staging.universalmind.tv/vogue/iam/';
const sourceUrl = `${base}science.html#research-tracker`;
const report = {sourceCommit:'fbabb97e57b208b06069d62b6718b93fd776db6a', sourceUrl, processMuted:false, assets:[], viewports:[], errors:[], failedSiteRequests:[], pdfRequests:[]};
const server = await chromium.launchServer({headless:true, args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
report.processMuted = true;
const browser = await chromium.connect(server.wsEndpoint());
try {
  const context = await browser.newContext({viewport:{width:1470,height:1000}, reducedMotion:'reduce', permissions:[], serviceWorkers:'block'});
  await context.route('**/*', async route => {
    if (route.request().resourceType()==='media') return route.abort();
    await route.continue();
  });
  context.on('page', page => {
    page.on('pageerror', e => report.errors.push({url:page.url(),message:e.message}));
    page.on('request', req => {if (/Medical%20Research\.pdf|Medical Research\.pdf/i.test(req.url())) report.pdfRequests.push(req.url());});
    page.on('response', response => {if(response.status()>=400 && /https:\/\/(staging\.)?universalmind\.tv\//.test(response.url()))report.failedSiteRequests.push({url:response.url(),status:response.status()});});
  });
  const page = await context.newPage();
  const response = await page.goto(sourceUrl, {waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.locator('[data-research-layer]').first().waitFor();
  const assets = await page.locator('script[src]').evaluateAll(scripts => scripts.map(s=>s.src).filter(s=>/\/science(?:-research-data-v1)?\.js/.test(s)));
  for (const url of [base+'science.html',...assets]) {
    const response = await context.request.get(url);
    assert.equal(response.status(),200);
    const local = fs.readFileSync(`${root}/i  a m/${new URL(url).pathname.split('/').pop()}`);
    const remote = await response.body();
    assert.ok(local.equals(remote),url);
    report.assets.push({url,sha256:crypto.createHash('sha256').update(remote).digest('hex'),matchesCommittedSource:true});
  }
  for (const viewport of [{width:1470,height:1000},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    const checks=[];
    for (const [layer,collection] of [['sound','sound'],['emdr','vision'],['mantra','language']]) {
      const button=page.locator(`[data-layer-toggle="${layer}"]`);
      if(await button.getAttribute('aria-expanded')!=='true') await button.click();
      const card=page.locator(`[data-research-layer="${layer}"]`);
      const link=card.locator('.research-link');
      assert.equal(await link.count(),1);
      assert.equal(await link.getAttribute('target'),'_blank');
      assert.match(await link.getAttribute('rel'),/noopener/);
      assert.equal(await link.getAttribute('download'),null);
      assert.equal(await link.getAttribute('href'),`https://universalmind.tv/informatics/library.html?collection=${collection}`);
      await link.scrollIntoViewIfNeeded();
      await page.screenshot({path:`${out}/${layer}-${viewport.width}.png`});
      const popupReady=page.waitForEvent('popup');
      if(viewport.width===1470){await link.focus();await link.press('Enter');}else{await link.click();}
      const popup=await popupReady;
      await popup.waitForURL(/\/informatics\/\?entry=research&area=research/, {timeout:30000});
      await popup.locator('body[data-entered="true"]').waitFor({timeout:30000});
      let library;
      for(let i=0;i<60;i++){
        library=popup.frames().find(frame=>frame.url().includes('/library.html'));
        if(library && await library.locator('.contents-grid').count()) break;
        await new Promise(resolve=>setTimeout(resolve,500));
      }
      assert.ok(library,'Research collection iframe loaded');
      await library.locator('.contents-grid').waitFor({timeout:30000});
      assert.equal(await library.locator(`[data-collection="${collection}"]`).getAttribute('aria-pressed'),'true');
      assert.match(await library.locator('.edition-intro .eyebrow').innerText(),new RegExp(`${collection} research`,'i'));
      assert.equal(await popup.evaluate(()=>window.opener===null),true);
      assert.equal(page.url(),sourceUrl);
      assert.equal(await button.getAttribute('aria-expanded'),'true');
      checks.push({layer,collection,newTab:true,keyboard:viewport.width===1470,destination:popup.url(),collectionContents:await library.locator('.contents-chapter').count(),portalPreserved:true});
      for(const frame of popup.frames()) await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});
      await popup.close();
    }
    const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert.equal(horizontalOverflow,false);
    report.viewports.push({viewport,checks,horizontalOverflow});
  }
  assert.equal(await page.locator('.research-links a[download], .research-links a[href*=".pdf"]').count(),0);
  assert.deepEqual(report.pdfRequests,[]);
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.failedSiteRequests,[]);
  report.passed=true;
  await context.close();
} catch (error) {
  report.passed=false;
  report.failure=String(error.stack||error);
  throw error;
} finally {
  for(const page of browser.contexts().flatMap(c=>c.pages())) for(const frame of page.frames()) await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});
  await browser.close();
  await server.close();
  report.checkedAt=new Date().toISOString();
  fs.writeFileSync(`${out}/verification.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
