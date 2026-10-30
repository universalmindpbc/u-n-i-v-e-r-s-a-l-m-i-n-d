import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const origin='https://universalmind.tv';
const artifacts=process.env.PATENT_RECEIPT_ARTIFACTS;
assert.ok(artifacts&&process.env.PATENT_TEST_PASSWORD_FILE);
const password=(await fs.readFile(process.env.PATENT_TEST_PASSWORD_FILE,'utf8')).trim();
const expected=JSON.parse(await fs.readFile(path.join(artifacts,'artifact-verification.json'),'utf8'));
const report={origin,anonymous:{},assets:[],viewports:[],errors:[]};
const sha=b=>createHash('sha256').update(b).digest('hex');
const server=await chromium.launchServer({headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
try{
 const context=await browser.newContext();
 for(const [route,status] of [['receipt.php',401],['receipt.php?format=pdf',401],['.private/filing-notice.pdf',403],['.private/filing-notice-page-1.jpg',403]]){
  const r=await context.request.get(origin+'/patent/'+route);assert.equal(r.status(),status);report.anonymous[route]=status;
 }
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/patent/#filing-receipt',{waitUntil:'domcontentloaded'});
 await page.locator('#access-password').fill(password);
 await page.locator('#login-form button').click();
 await page.locator('#filing-receipt').waitFor({state:'visible'});
 const section=page.locator('#filing-receipt');
 await section.locator('summary').click();
 const img=section.locator('img');
 await img.scrollIntoViewIfNeeded();
 await img.evaluate(el=>el.decode());
 assert.equal(await img.evaluate(el=>el.naturalWidth),expected.preview_width);
 assert.equal(await img.evaluate(el=>el.naturalHeight),expected.preview_height);
 assert.match(await img.getAttribute('alt'),/Universal Mind TV, PBC/);
 assert.ok(!(await section.innerText()).includes('Card details are omitted'));
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  await section.scrollIntoViewIfNeeded();
  const size=await img.boundingBox();assert.ok(size.width>0&&size.width<=width);assert.ok(size.x>=0&&size.x+size.width<=width);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
  report.viewports.push({width,image_fits:true,horizontal_overflow:false});
  await section.screenshot({path:path.join(artifacts,'production-'+width+'.png')});
 }
 for(const [route,type,hash] of [['receipt.php','image/jpeg',expected.preview_sha256],['receipt.php?format=pdf','application/pdf',expected.website_pdf_sha256]]){
  const r=await context.request.get(origin+'/patent/'+route);assert.equal(r.status(),200);assert.match(r.headers()['content-type'],new RegExp(type));
  assert.match(r.headers()['cache-control'],/no-store/);assert.match(r.headers()['x-robots-tag'],/noindex/);
  const digest=sha(await r.body());assert.equal(digest,hash);report.assets.push({route,status:200,content_type:type,sha256:digest,private_no_store:true});
 }
 report.invalid_format_statuses=[];
 for(const suffix of ['?format=invalid','?format[]=pdf','?format=../../etc/passwd']){
  const r=await context.request.get(origin+'/patent/receipt.php'+suffix);assert.ok([400,403,406].includes(r.status()));report.invalid_format_statuses.push(r.status());
 }
 const pdfLink=section.getByRole('link',{name:'View full filing notice (PDF)'});
 const requestPromise=context.waitForEvent('request',{predicate:r=>r.url()===origin+'/patent/receipt.php?format=pdf'});
 await pdfLink.click();
 const request=await requestPromise;const response=await request.response();assert.equal(response.status(),200);
 report.full_pdf_link_clicked=true;report.full_pdf_link_status=response.status();
 for(const p of context.pages())if(p!==page)await p.close();
 await page.locator('#toggle-nav').click();
 await page.locator('.nav-lock').click();
 await page.locator('#access-password').waitFor({state:'visible'});
 for(const route of ['receipt.php','receipt.php?format=pdf'])assert.equal((await context.request.get(origin+'/patent/'+route)).status(),401);
 report.logout_denies_receipt=true;report.invalid_formats_denied=true;report.audio_disabled=true;report.passed=true;
 assert.deepEqual(report.errors,[]);
 await fs.writeFile(path.join(artifacts,'production-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
