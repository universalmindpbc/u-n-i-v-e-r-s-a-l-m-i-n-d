from pathlib import Path
import os,subprocess,json,hashlib,re,urllib.request
from concurrent.futures import ThreadPoolExecutor
root=Path.cwd();out=root/'research/informatics/production-20261112';phase=os.environ.get('QA_PHASE','production');origin='https://universalmind.tv' if phase=='production' else 'https://staging.universalmind.tv';sha=lambda b:hashlib.sha256(b).hexdigest()
changed=subprocess.check_output(['git','diff','--name-only','origin/main','HEAD','--','Informatics'],text=True).splitlines()
files=[p for p in changed if not p.startswith('Informatics/exports/') and not p.endswith(('.php','.htaccess')) and Path(p).is_file()]
m=json.loads(Path('Informatics/exports/manifest.json').read_text());files+=['Informatics/exports/manifest.json','Informatics/exports/manifest-'+m['dataset_version']+'.json']+['Informatics/exports/'+p['file'] for d in m['downloads'].values() for p in d['parts']]
def normal(s):
 def decode(h):
  b=bytes.fromhex(h);return bytes(x^b[0] for x in b[1:]).decode()
 s=re.sub(r'<span class="__cf_email__" data-cfemail="([a-f0-9]+)">[^<]*</span>',lambda x:decode(x[1]),s)
 s=re.sub(r'href="/cdn-cgi/l/email-protection#([a-f0-9]+)"',lambda x:'href="mailto:'+decode(x[1])+'"',s)
 s=re.sub(r'<script data-cfasync="false" src="/cdn-cgi/scripts/[a-f0-9]+/cloudflare-static/email-decode.min.js"></script>','',s)
 s=re.sub(r'<script defer src="https://static.cloudflareinsights.com/beacon.min.js[^\"]*"[^>]*></script>','',s)
 return s

def check(p):
 local=Path(p).read_bytes();url=origin+'/'+p.replace('Informatics/','informatics/')+'?embedded=1&release=20261112';req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 UniversalMind-Production-Verification'})
 try:
  with urllib.request.urlopen(req,timeout=150) as r:
   b=r.read();raw=sha(b);actual=raw;transformed=False
   if actual!=sha(local) and p.endswith('.html'):actual=sha(normal(b.decode()).encode());transformed=True
   return {'file':p,'bytes':len(b),'status':r.status,'sha256':sha(local),'servedSHA256':raw,'normalizedKnownCloudflareInjection':transformed,'matched':actual==sha(local),'cache':r.headers.get('CF-Cache-Status')}
 except Exception as e:return {'file':p,'matched':False,'error':str(e)}
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,files))
report={'passed':all(r['matched'] for r in results),'phase':phase,'datasetVersion':m['dataset_version'],'files':results,'totalBytes':sum(r.get('bytes',0) for r in results)};(out/(phase+'-http.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':report['passed'],'files':len(results),'totalBytes':report['totalBytes'],'failures':[x for x in results if not x['matched']]}));raise SystemExit(0 if report['passed'] else 1)
