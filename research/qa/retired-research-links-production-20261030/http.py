from pathlib import Path
from urllib.parse import unquote
import concurrent.futures,hashlib,json,re,subprocess,time
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
paths={'/':'index.html','/home/':'home/index.html','/home/directory.css?v=9':'home/directory.css','/home/ai-wiki-link.css?v=1':'home/ai-wiki-link.css','/read/':'read/index.html','/read/wiki.css?v=1':'read/wiki.css','/read/resources.json':'read/resources.json','/llms.txt':'llms.txt','/sitemap.xml':'sitemap.xml','/robots.txt':'robots.txt'}
def fetch(url):
 return subprocess.check_output(['curl','-L','--fail','--max-time','30','-sS','-A',UA,url])
def check(item):
 route,name=item;raw=fetch('https://universalmind.tv'+route)
 assert raw==(ROOT/name).read_bytes(),('production source mismatch',route)
 if name in ['read/index.html','read/resources.json','llms.txt','sitemap.xml']:
  text=unquote(raw.decode());assert not re.search(r'(EMDR|Sound|Mantra) Medical Research\.pdf',text,re.I),route
  for collection in ['vision','sound','language']:assert '?collection='+collection in text,route
 staging=fetch('https://staging.universalmind.tv'+route)
 expected=(ROOT/('robots-staging.txt' if route=='/robots.txt' else name)).read_bytes()
 assert staging==expected,('staging source mismatch',route)
 return {'route':route,'source':name,'productionMatchesApprovedSource':True,'stagingMatchesApprovedSource':True,'sha256':hashlib.sha256(raw).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(check,paths.items()))
report={'passed':True,'approvedCandidate':'63e5e25d0a7b9300feebc6809fff07ad4f743123','checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'checks':checks,'retiredLinksAbsentFromAllFourDiscoveryFiles':True,'stagingCrawlingExcluded':True}
(OUT/'http.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'productionSourceMatches':len(checks),'stagingSourceMatches':len(checks),'retiredLinksAbsent':True}))
