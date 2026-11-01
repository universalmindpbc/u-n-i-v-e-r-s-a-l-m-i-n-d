"""Stream the deployed complete export parts and verify their published hashes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'research/informatics/wiki-focus-20261101'
base='https://staging.universalmind.tv/informatics/exports/'
m=json.loads((ROOT/'Informatics/exports/manifest.json').read_text())
parts=[p for d in m['downloads'].values() for p in d['parts']]
def verify(part):
 p=subprocess.Popen(['curl','--fail','--silent','--show-error','--location','--retry','2','--max-time','120','--user-agent','Mozilla/5.0 AtlasExportVerification',base+part['file']],stdout=subprocess.PIPE)
 h=hashlib.sha256();size=0
 while b:=p.stdout.read(1024*1024):h.update(b);size+=len(b)
 assert p.wait()==0,part['file'];assert size==part['bytes'] and h.hexdigest()==part['sha256'],part['file']
 return {'file':part['file'],'bytes':size,'sha256':h.hexdigest()}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(verify,parts))
report={'passed':True,'dataset_version':m['dataset_version'],'parts':results,'total_bytes_verified':sum(x['bytes'] for x in results),'sources':len(m['sources'])}
(OUT/'staging-complete-exports.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':True,'parts':len(results),'bytes':report['total_bytes_verified'],'sources':len(m['sources'])}))
