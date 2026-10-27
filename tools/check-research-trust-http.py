"""Verify exact deployed library assets and keep the production boundary explicit."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib, json, subprocess, urllib.request
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'Informatics'
OUT=ROOT/'research/informatics/trust-factor-20261027'
BASE='https://staging.universalmind.tv/informatics/'
def sha(b): return hashlib.sha256(b).hexdigest()
def check(pair):
    local, url=pair
    with urllib.request.urlopen(url,timeout=60) as r:
        data=r.read();status=r.status
    expected=(SITE/local).read_bytes()
    assert status==200 and data==expected, 'Deployed asset mismatch: '+local
    return {'path':local,'url':url,'status':status,'sha256':sha(data),'bytes':len(data)}
files=[('library.html','library.html'),('library.js','library.js?v=20'),('library-model.js','library-model.js?v=7'),('exports/manifest.json','exports/manifest.json')]
for n in ['sound-edition','vision-edition','language-edition','general-edition','library','publication-access','mindfulness-expansion','vision-expansion','nature-expansion','fibonacci-expansion']:
    files.append(('library-data/'+n+'.json','library-data/'+n+'.json?v=trust-20261027'))
for p in (SITE/'read/publications').glob('*'):
    if p.name.startswith(('src-6d277422d0a0-','src-9329423f6826-')):files.append((str(p.relative_to(SITE)),str(p.relative_to(SITE))))
with ThreadPoolExecutor(max_workers=5) as pool:assets=list(pool.map(check,[(p,BASE+u) for p,u in files]))
manifest=json.loads((SITE/'exports/manifest.json').read_text())
parts=[part for download in manifest['downloads'].values() for part in download['parts']]
def check_part(part):
    request=urllib.request.Request(BASE+'exports/'+part['file'],headers={'Range':'bytes=0-127'})
    with urllib.request.urlopen(request,timeout=60) as r:
        status=r.status;body=r.read(128);range_header=r.headers.get('Content-Range')
    with (SITE/'exports'/part['file']).open('rb') as f:expected=f.read(128)
    assert status in (200,206) and body==expected
    if status==206:assert range_header.endswith('/'+str(part['bytes']))
    return {'file':part['file'],'status':status,'first128BytesMatch':True,'contentRange':range_header}
with ThreadPoolExecutor(max_workers=3) as pool:part_checks=list(pool.map(check_part,parts))
with urllib.request.urlopen('https://universalmind.tv/informatics/library.html',timeout=60) as r:production=r.read()
assert production==Path('/private/tmp/trust-production-before.html').read_bytes(),'Production page changed during this task'
result={'passed':True,'verifiedAt':datetime.now(timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'assets':assets,'exportPartsAvailable':part_checks,'productionLibraryUnchanged':True,'productionLibrarySHA256':sha(production)}
(OUT/'http-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'exactAssets':len(assets),'exportPartsAvailable':len(parts),'productionLibraryUnchanged':True}))
