"""Compare the committed staging assets and all complete-export parts byte for byte."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'research/informatics/hyperspectral-20261027'
BASE='https://staging.universalmind.tv/'
def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(url):
 raw=subprocess.check_output(['curl','--silent','--show-error','--location','--retry','2','--max-time','180','--write-out','\n%{http_code}',url]);body,status=raw.rsplit(b'\n',1);return body,int(status)
def check(name):
 local=ROOT/name;remote='informatics/'+name[len('Informatics/'):] if name.startswith('Informatics/') else name
 if name in ['Informatics/library.js','Informatics/library-model.js','Informatics/library.css']:remote+='?v=hsi-20261027'
 elif name.startswith('Informatics/library-data/') and name.endswith('.json'):remote+='?v=hyperspectral-20261027'
 body,status=fetch(BASE+remote);expected=sha(local.read_bytes());actual=sha(body)
 assert status==200 and actual==expected,(name,status,actual,expected)
 return {'path':name,'status':status,'bytes':len(body),'sha256':actual}
source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
changed=subprocess.check_output(['git','diff','--name-only','6b99831b',source,'--','Informatics','sitemap.xml','llms.txt'],cwd=ROOT,text=True).splitlines()
small=[p for p in changed if not p.endswith('.bin')];parts=[p for p in changed if p.endswith('.bin')]
with ThreadPoolExecutor(max_workers=6) as ex:assets=list(ex.map(check,small))
print('Exact website and data assets:',len(assets),flush=True)
with ThreadPoolExecutor(max_workers=3) as ex:downloads=list(ex.map(check,parts))
print('Full export parts:',len(downloads),flush=True)
before=json.loads((OUT/'production-before.json').read_text());production=[]
for r in before['assets']:
 body,status=fetch(r['url']);assert status==r['status'] and sha(body)==r['sha256'],('Production response changed',r['url']);production.append({**r,'unchanged':True})
result={'passed':True,'verifiedAt':datetime.now(timezone.utc).isoformat(),'sourceCommitAtVerification':source,'assets':assets,'fullExportParts':downloads,'productionResponses':production,'productionModifiedByTask':False}
(OUT/'http-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'exactAssets':len(assets),'fullExportParts':len(downloads),'exportBytesVerified':sum(r['bytes'] for r in downloads),'productionResponsesUnchanged':True}))
