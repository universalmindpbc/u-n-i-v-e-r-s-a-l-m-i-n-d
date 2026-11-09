from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,urllib.request,json,hashlib,re
root=Path(__file__).resolve().parents[3];out=Path(__file__).parent
files=subprocess.check_output(['git','diff','--name-only','a6d81bb689f08afea794e9738e89e16c9c6ecd3c','660bdc39b','--','Informatics'],cwd=root,text=True).splitlines()
def check(name):
 p=root/name; url='https://staging.universalmind.tv/informatics/'+name.removeprefix('Informatics/')+'?embedded=1&verify=660bdc39b'
 h=hashlib.sha256(); size=0; html=[]
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Universal-Informatics-Staging-Verification'}),timeout=90) as r:
  assert r.status==200
  while chunk:=r.read(1024*1024):
   h.update(chunk);size+=len(chunk)
   if p.suffix==".html":html.append(chunk)
 actual=h.hexdigest();served=actual
 if html:
  raw=b"".join(html).decode();raw=re.sub(r'<script type="module" src="https://static\.cloudflareinsights\.com/[^>]+></script>\n','',raw);actual=hashlib.sha256(raw.encode()).hexdigest()
 expected=hashlib.sha256(p.read_bytes()).hexdigest();assert actual==expected,(name,actual,expected)
 return {'file':name,'bytes':size,'sha256':actual,'served_sha256':served,'cloudflareBeaconExcluded':bool(html),'matched':True}
with ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(check,files))
with urllib.request.urlopen(urllib.request.Request('https://informatics-universal-one-staging.universalmind.workers.dev/health',headers={'Origin':'https://staging.universalmind.tv','User-Agent':'Universal-Informatics-Staging-Verification'}),timeout=30) as r:health=json.load(r)
assert health['knowledgeVersions']['literature']=='literature-20261109-v1'
(out/'staging-files.json').write_text(json.dumps({'passed':True,'commit':'660bdc39b','files':results,'health':health},indent=2)+'\n')
print(json.dumps({'passed':True,'matchedFiles':len(results),'health':health}))
