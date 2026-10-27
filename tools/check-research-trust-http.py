"""Verify exact deployed library assets and keep the production boundary explicit."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib, json, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'Informatics'
OUT=ROOT/'research/informatics/trust-factor-20261027'
BASE='https://staging.universalmind.tv/informatics/'
def sha(b): return hashlib.sha256(b).hexdigest()
def fetch(url, extra=()):
    body=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','60',*extra,'--write-out','\n%{http_code}',url])
    data, status=body.rsplit(b'\n',1)
    return data,int(status)
def check(pair):
    local, url=pair
    data,status=fetch(url)
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
    with tempfile.NamedTemporaryFile() as headers:
        data,status=fetch(BASE+'exports/'+part['file'],['--range','0-127','--dump-header',headers.name])
        body=data[:128]
        text=Path(headers.name).read_text()
        range_header=next((line.split(':',1)[1].strip() for line in text.splitlines() if line.lower().startswith('content-range:')),None)
    with (SITE/'exports'/part['file']).open('rb') as f:expected=f.read(128)
    assert status in (200,206) and body==expected
    if status==206:assert range_header.endswith('/'+str(part['bytes']))
    return {'file':part['file'],'status':status,'first128BytesMatch':True,'contentRange':range_header}
with ThreadPoolExecutor(max_workers=3) as pool:part_checks=list(pool.map(check_part,parts))
production,status=fetch('https://universalmind.tv/informatics/library.html')
assert status==200
assert production==Path('/private/tmp/trust-production-before.html').read_bytes(),'Production page changed during this task'
result={'passed':True,'verifiedAt':datetime.now(timezone.utc).isoformat(),'sourceCommitAtVerification':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'assets':assets,'exportPartsAvailable':part_checks,'productionLibraryUnchanged':True,'productionLibrarySHA256':sha(production)}
(OUT/'http-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'exactAssets':len(assets),'exportPartsAvailable':len(parts),'productionLibraryUnchanged':True}))
