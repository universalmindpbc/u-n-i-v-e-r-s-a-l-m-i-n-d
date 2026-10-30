from pathlib import Path
from html.parser import HTMLParser
import concurrent.futures
import hashlib
import json
import subprocess
import time

ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
ORIGIN='https://staging.universalmind.tv'
def fetch(url,head=False):
    args=['curl','-L','--fail','--max-time','30','-sS','-A',UA]
    if head: args+=['--head']
    return subprocess.check_output(args+[url])
paths={'/':'index.html','/home/':'home/index.html','/home/directory.css?v=9':'home/directory.css','/read/':'read/index.html','/read/wiki.css?v=1':'read/wiki.css','/home/ai-wiki-link.css?v=1':'home/ai-wiki-link.css','/read/resources.json':'read/resources.json','/llms.txt':'llms.txt','/sitemap.xml':'sitemap.xml','/robots.txt':'robots-staging.txt'}
def verify(item):
    route,path=item; received=fetch(ORIGIN+route); expected=(ROOT/path).read_bytes()
    normalized=received
    managed=False
    if route=='/robots.txt' and b'# END Cloudflare Managed Content' in received:
        normalized=received.split(b'# END Cloudflare Managed Content',1)[1].lstrip(b'\r\n')
        managed=True
    assert normalized==expected,(route,'source mismatch')
    return {'url':ORIGIN+route,'source':path,'sha256':hashlib.sha256(received).hexdigest(),'match':True,'hostingManagedRobotsPrefix':managed}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: checks=list(pool.map(verify,paths.items()))
data=json.loads((ROOT/'read/resources.json').read_text())
def resource(item):
    url=item['url'].replace('https://universalmind.tv',ORIGIN)
    headers=fetch(url,True).decode()
    return {'url':url,'headStatus':headers.split('HTTP/')[-1].splitlines()[0]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: resources=list(pool.map(resource,data['resources']))
baseline=json.loads((OUT/'baseline.json').read_text())
production=[]
for row in baseline['checks']:
    if row['url'].startswith('https://universalmind.tv'):
        digest=hashlib.sha256(fetch(row['url'])).hexdigest()
        assert digest==row['sha256'],('production changed',row['url'])
        production.append({'url':row['url'],'unchanged':True,'sha256':digest})
report={'passed':True,'candidate':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'sourceChecks':checks,'resourceHeaders':resources,'productionUnchanged':production,'stagingCrawlingExcluded':True,'productionCrawlerPolicyPendingPublication':True}
(OUT/'http.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'sourceMatches':len(checks),'resourceLinks':len(resources),'productionUnchanged':len(production)}))
