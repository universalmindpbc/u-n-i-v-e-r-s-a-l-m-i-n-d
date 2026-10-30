from pathlib import Path
import subprocess,hashlib,json,datetime
root=Path(__file__).resolve().parents[3]
checks=[]
for name in ['library.html','library.js']:
    url='https://staging.universalmind.tv/informatics/'+name+'?verification=facet-counts-20261030'
    body=subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','90','-A','Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36',url])
    local=hashlib.sha256((root/'Informatics'/name).read_bytes()).hexdigest()
    assert hashlib.sha256(body).hexdigest()==local,name
    checks.append({'path':'Informatics/'+name,'url':url,'sha256':local,'matched':True})
report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'assets':checks,'passed':True}
Path(__file__).with_name('staging-assets.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'matchedAssets':len(checks)}))
