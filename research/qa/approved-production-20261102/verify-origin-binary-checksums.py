from pathlib import Path
import hashlib,json,urllib.request,time
from concurrent.futures import ThreadPoolExecutor
out=Path('research/qa/approved-production-20261102')
items=[x for x in json.loads((out/'source-integrity.json').read_text())['files']if x['path'].startswith('Informatics/exports/')and x['path'].endswith('.bin')]
def check(item):
 url='https://universalmind.tv/'+item['path'].replace('Informatics/','informatics/')+'?release-source-check=7ebdb92-final'
 request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 UniversalMind-Production-Verification'})
 with urllib.request.urlopen(request,timeout=120)as response:
  assert response.status==200,url
  digest=hashlib.sha256();size=0
  while True:
   chunk=response.read(1024*1024)
   if not chunk:break
   size+=len(chunk);digest.update(chunk)
  result={'path':item['path'],'bytes':size,'sha256':digest.hexdigest(),'expected':item['sha256'],'cache':response.headers.get('CF-Cache-Status')}
  assert result['sha256']==item['sha256'],result
  return result
results=[]
with ThreadPoolExecutor(max_workers=3)as pool:
 for i,result in enumerate(pool.map(check,items),1):
  results.append(result)
  if i%10==0 or i==len(items):print(json.dumps({'checked':i,'total':len(items)}),flush=True)
report={'passed':True,'downloadedAndHashed':len(results),'totalBytes':sum(x['bytes']for x in results),'results':results}
(out/'binary-origin-checksums.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k!='results'}))
