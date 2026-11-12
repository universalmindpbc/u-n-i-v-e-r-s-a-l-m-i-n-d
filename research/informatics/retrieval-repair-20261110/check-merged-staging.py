from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,re,subprocess,urllib.request

root=Path(__file__).resolve().parents[3]
out=Path(__file__).parent
candidate='310693fff'
base='fb87147dd'
manifest=json.loads((root/'Informatics/exports/manifest.json').read_text())
current={'Informatics/exports/manifest.json',f"Informatics/exports/manifest-{manifest['dataset_version']}.json"}
current.update('Informatics/exports/'+p['file'] for d in manifest['downloads'].values() for p in d['parts'])
changed=subprocess.check_output(['git','diff','--name-only',base,candidate,'--','Informatics'],cwd=root,text=True).splitlines()
files=sorted(set(f for f in changed if '/exports/' not in f)|current)

def check(name):
    path=root/name
    url='https://staging.universalmind.tv/informatics/'+name.removeprefix('Informatics/')+'?embedded=1&verify='+candidate
    h=hashlib.sha256();size=0;chunks=[]
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Universal-Informatics-Staging-Verification'}),timeout=90) as response:
        assert response.status==200
        while chunk:=response.read(1024*1024):
            h.update(chunk);size+=len(chunk)
            if path.suffix=='.html':chunks.append(chunk)
    served=h.hexdigest();actual=served;excluded=False
    if chunks:
        raw=b''.join(chunks).decode()
        normalized=re.sub(r'<script type="module" src="https://static\.cloudflareinsights\.com/[^>]+></script>\n','',raw)
        excluded=normalized!=raw
        actual=hashlib.sha256(normalized.encode()).hexdigest()
    expected=hashlib.sha256(path.read_bytes()).hexdigest()
    assert actual==expected,(name,actual,expected)
    return {'file':name,'bytes':size,'sha256':actual,'servedSHA256':served,'cloudflareBeaconExcluded':excluded,'matched':True}

with ThreadPoolExecutor(max_workers=4) as pool:
    checks=list(pool.map(check,files))
with urllib.request.urlopen(urllib.request.Request('https://informatics-universal-one-staging.universalmind.workers.dev/health',headers={'Origin':'https://staging.universalmind.tv','User-Agent':'Universal-Informatics-Staging-Verification'}),timeout=30) as response:
    health=json.load(response)
assert health['knowledgeVersions']['literature']=='literature-20261110-v2'
result={'passed':True,'sourceCommit':candidate,'integratedBaseline':base,'datasetVersion':manifest['dataset_version'],'files':checks,'health':health,'scope':'All changed mutable Informatics files and every part of the current full dataset. Earlier immutable export revisions retain their prior verification records.'}
(out/'merged-staging-files.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'matchedFiles':len(checks),'bytes':sum(c['bytes'] for c in checks),'datasetVersion':manifest['dataset_version']}))
