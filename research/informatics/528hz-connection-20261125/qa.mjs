import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const audit=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(audit,'../../..');
const candidate=process.argv.includes('--candidate');
const origin='https://staging.universalmind.tv';
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const report={mode:candidate?'local candidate via staging URL interception':'deployed staging',audio:'Chromium launched with --mute-audio; media requests and playback blocked',checks:[]};
try {
  for(const [label,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const context=await browser.newContext({viewport,reducedMotion:'reduce',permissions:[]});
    await context.addInitScript(()=>{
      localStorage.setItem('informatics-library-background','black');
      localStorage.setItem('informatics-library-video-paused','true');
      HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Playback disabled for layout QA','NotAllowedError'));};
      Element.prototype.requestFullscreen=function(){return Promise.reject(new Error('Fullscreen disabled for layout QA'));};
      if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(new Error('Capture disabled for layout QA'));
    });
    await context.route('**/*',async route=>{
      const request=route.request(),u=new URL(request.url());
      if(request.resourceType()==='media'||/\.(mp4|m3u8|mp3|aac|webm|m4a)(\?|$)/i.test(u.href))return route.abort();
      if(candidate&&u.origin===origin){
        let rel=decodeURIComponent(u.pathname);
        if(rel.startsWith('/informatics/')){
          rel='Informatics/'+rel.slice('/informatics/'.length);
          if(/\/$/.test(rel))rel+='index.html';
        }else rel=rel.replace(/^\//,'');
        const p=path.join(root,rel);
        try{if((await fs.stat(p)).isFile())return route.fulfill({path:p});}catch{}
      }
      return route.continue();
    });
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/informatics/research/?collection=sound&chapter=1#topic-ii',{waitUntil:'domcontentloaded'});
    const reader=page.frameLocator('#research-frame');
    try { await reader.locator('#topic-ii').waitFor({state:'visible',timeout:45000}); }
    catch(error){
      console.log(JSON.stringify({url:page.url(),body:(await page.locator('body').innerText()).slice(0,2500),frames:page.frames().map(f=>f.url()),errors}));
      await page.screenshot({path:path.join(audit,'qa-failure.png')});
      throw error;
    }
    const white=async()=>assert.equal(await reader.locator('html').getAttribute('data-reading-background'),'white');
    await white();
    assert.equal(await reader.locator('#topic-ii article.paper').count(),12);
    assert.equal(await reader.locator('#topic-ii > .topic-heading .trust-score svg').count(),2);
    const frame=await page.locator('#research-frame').contentFrame();
    const text=await reader.locator('#topic-ii').innerText();
    assert.match(text,/Oxytocin almost doubled within five minutes of listening to 528 Hz music/);
    assert.match(text,/48–162 participants/);
    assert.match(text,/potential increased felt connection through oxytocin pathways/);
    assert.match(text,/connection benefit remains a hypothesis/);
    assert.match(text,/including one reporting blinded outcome assessment/);
    assert(!text.includes('samples are generally small'));
    assert(!text.includes('A useful next study'));
    assert(!text.includes('The radio link'));
    assert(!text.includes('Those duplicate links'));
    assert((await reader.locator('#topic-ii > .topic-description').allTextContents()).join(' ').split(/\s+/).length<140);
    assert.match(text,/430 Hz than at 528 Hz/);
    assert.match(text,/MINTREP/);
    const ravikumar=reader.locator('#topic-ii article.paper').filter({hasText:'Effects of a Sound-Based Meditative Intervention on Anxiety'});
    assert.equal(await ravikumar.count(),1);
    await ravikumar.locator('details.design-assessment').evaluate(el=>{el.open=true;});
    assert.match(await ravikumar.innerText(),/blood-pressure assessors: Blinded to group allocation/);
    assert.match(await ravikumar.innerText(),/participants: Reported blinded; implementation unclear/);
    await ravikumar.locator('details.design-assessment').evaluate(el=>{el.open=false;});
    const horizontal=await reader.locator('body').evaluate(el=>({scroll:el.scrollWidth,viewport:innerWidth}));
    assert(horizontal.scroll<=horizontal.viewport+2,JSON.stringify(horizontal));
    await reader.locator('#topic-ii').evaluate(el=>el.scrollIntoView());
    await page.screenshot({path:path.join(audit,`${candidate?'candidate':'staging'}-${label}.png`)});
    await reader.locator('button[data-reading-background="black"]').first().click();
    assert.equal(await reader.locator('html').getAttribute('data-reading-background'),'black');
    await reader.locator('#topic-ii [data-paper-detail]').first().click();
    await white();
    await reader.locator('#article').waitFor({state:'visible'});
    await reader.locator('[data-close="article"]').click();
    for(const collection of ['vision','language','general','all','sound']){
      await reader.locator('button[data-reading-background="black"]').first().click();
      await reader.locator(`button[data-collection="${collection}"]`).click();
      await white();
    }
    await reader.locator('#query').fill('528');
    await reader.locator('#search-form').evaluate(form=>form.requestSubmit());
    await reader.locator('#results article.search-paper').first().waitFor();
    assert.match(await reader.locator('#results').innerText(),/Bozok|Acute Music-Frequency/);
    await page.goto(origin+'/informatics/read/528hz/',{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('main article').count(),12);
    assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
    assert.equal(await page.locator('a[href*="undefined"]').count(),0);
    report.checks.push({viewport:label,sourceCount:12,blueCrosses:2,whiteDefaultWithSavedBlack:true,collections:['sound','vision','language','general','all'],paperDialogWhite:true,search:true,staticReaderWhite:true,horizontalOverflow:false,pageErrors:errors});
    assert.equal(errors.length,0,errors.join('\n'));
    await context.close();
  }
  report.passed=true;
} finally {
  await browser.close();
  await fs.writeFile(path.join(audit,`${candidate?'candidate':'staging'}-qa.json`),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report));
