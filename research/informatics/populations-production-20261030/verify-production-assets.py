from pathlib import Path
import subprocess,json,hashlib,concurrent.futures,datetime
root=Path(__file__).resolve().parents[3]
base='https://universalmind.tv/informatics/'
agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
changed=subprocess.check_output(['git','diff','2e34aa822120ea38fbb28541f9dd738044ec1385','36fe9a2d3869f90083907ff7c9001aa9c5d8a21f','--name-only','--','Informatics'],cwd=root,text=True).splitlines()
files=[name for name in changed if not name.endswith('.bin') and (root/name).is_file()]
manifest=json.loads((root/'Informatics/exports/manifest.json').read_text())
parts={p['file']:p for download in manifest['downloads'].values() for p in download['parts']}
files.extend('Informatics/exports/'+name for name in parts)
def verify(name):
    url=base+name.removeprefix('Informatics/')+'?verification=populations-production-20261030'
    local=hashlib.sha256()
    with (root/name).open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):local.update(chunk)
    remote=hashlib.sha256();size=0
    process=subprocess.Popen(['curl','--fail','--silent','--show-error','--location','--max-time','120','-A',agent,url],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    for chunk in iter(lambda:process.stdout.read(1024*1024),b''):remote.update(chunk);size+=len(chunk)
    error=process.stderr.read().decode();assert process.wait()==0,error
    assert remote.hexdigest()==local.hexdigest(),name
    return {'path':name,'url':url,'bytes':size,'sha256':remote.hexdigest(),'matched':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:checks=list(pool.map(verify,files))
report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'approvedSourceCommit':'36fe9a2d3869f90083907ff7c9001aa9c5d8a21f','assets':checks,'completeDownloadPartsVerified':len(parts),'datasetVersion':manifest['dataset_version'],'passed':True}
Path(__file__).with_name('production-assets.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'matchedAssets':len(checks),'completeDownloadPartsVerified':len(parts)}))
