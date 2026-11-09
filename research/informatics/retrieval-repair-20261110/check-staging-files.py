from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,urllib.request,json,hashlib,re,os
root=Path(__file__).resolve().parents[3];out=Path(__file__).parent
base='c0fd45bba6679d40daebed008f7ed0c919c7d9b0'; candidate='91de0986052303c717d2a3c30b8da5a67634b4a9'
files=subprocess.check_output(['git','diff','--name-only',base,candidate,'--','Informatics'],cwd=root,text=True).splitlines()
def check(name):
 p=root/name; url='https://staging.universalmind.tv/informatics/'+name.removeprefix('Informatics/')+'?embedded=1&verify='+candidate
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
assert health['knowledgeVersions']['literature']=='literature-20261110-v2'
(out/'staging-files.json').write_text(json.dumps({'passed':True,'commit':candidate,'files':results,'health':health},indent=2)+'\n')
print(json.dumps({'passed':True,'matchedFiles':len(results),'health':health}))
