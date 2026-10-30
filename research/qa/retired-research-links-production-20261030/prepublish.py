from pathlib import Path
import concurrent.futures,hashlib,json,re,subprocess
from urllib.parse import unquote
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
paths={'/read/':'read/index.html','/llms.txt':'llms.txt','/read/resources.json':'read/resources.json','/sitemap.xml':'sitemap.xml'}
baseline=json.loads((OUT/'baseline.json').read_text())
def fetch(url):
 return subprocess.check_output(['curl','-L','--fail','--max-time','30','-sS','-A',UA,url])
def check(item):
 route,name=item
 raw=fetch('https://staging.universalmind.tv'+route)
 assert raw==(ROOT/name).read_bytes(),('staging source mismatch',route)
 text=unquote(raw.decode())
 assert not re.search(r'(EMDR|Sound|Mantra) Medical Research\.pdf',text,re.I),route
 for collection in ['vision','sound','language']: assert '?collection='+collection in text,route
 prod=fetch('https://universalmind.tv'+route)
 assert hashlib.sha256(prod).hexdigest()==baseline[route],('production changed',route)
 return {'route':route,'stagingMatchesCommittedSource':True,'retiredDossiersAbsent':True,'threeCollectionsPresent':True,'productionUnchanged':True,'stagingSHA256':hashlib.sha256(raw).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(check,paths.items()))
report={'passed':True,'candidate':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'checks':checks}
(OUT/'prepublish.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'guideAndSitemapChecks':len(checks),'productionUnchanged':True}))
