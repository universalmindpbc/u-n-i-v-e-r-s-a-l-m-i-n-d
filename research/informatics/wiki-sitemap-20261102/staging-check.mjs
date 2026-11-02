import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(), out=root+'/research/informatics/wiki-sitemap-20261102';
const browser=await chromium.launch({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
const report={checks:[],http:[],muted:true};
try{
 for(const width of [1470,1024,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},javaScriptEnabled:false,userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
  const page=await context.newPage();const r=await page.goto('https://staging.universalmind.tv/informatics/read/index.html?proof=sitemap-20261102',{waitUntil:'domcontentloaded'});assert.equal(r.status(),200);
  const a=page.getByRole('link',{name:'Website sitemap',exact:true});assert.equal(await a.count(),1);assert.equal(await a.getAttribute('href'),'/sitemap.xml');await a.scrollIntoViewIfNeeded();assert.ok(await a.isVisible());
  const labels=await page.locator('#atlas-topic-directory ul a').allTextContents();assert.deepEqual(labels,JSON.parse(fs.readFileSync(root+'/tools/atlas-topic-directory.json','utf8')).map(t=>t.title));
  const size=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(size.scrollWidth<=size.width+1);
  if(width===390)await page.screenshot({path:out+'/sitemap-link-390.png'});
  if(width===1470){
   for(const [local,remote]of [['Informatics/read/index.html','informatics/read/index.html'],['Informatics/llms.txt','informatics/llms.txt'],['sitemap.xml','sitemap.xml']]){
    const result=await context.request.get('https://staging.universalmind.tv/'+remote+'?proof=sitemap-20261102');assert.equal(result.status(),200);const body=await result.body();assert.deepEqual(body,fs.readFileSync(root+'/'+local));report.http.push({path:remote,sha256:crypto.createHash('sha256').update(body).digest('hex'),status:200});
   }
   const navigation=await Promise.all([page.waitForResponse(r=>r.url()==='https://staging.universalmind.tv/sitemap.xml'),page.waitForURL('https://staging.universalmind.tv/sitemap.xml'),a.click()]);assert.equal(navigation[0].status(),200);assert.match(await navigation[0].text(),/<urlset/);report.sitemapLinkFollowed=true;
  }
  report.checks.push({width,sitemapLinkVisible:true,navigationOrderPreserved:true,noHorizontalPageOverflow:true});await context.close();
 }
 report.passed=true;fs.writeFileSync(out+'/staging-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,viewportChecks:report.checks.length,liveFilesMatched:report.http.length,sitemapLinkFollowed:report.sitemapLinkFollowed}));
}finally{await browser.close();}
