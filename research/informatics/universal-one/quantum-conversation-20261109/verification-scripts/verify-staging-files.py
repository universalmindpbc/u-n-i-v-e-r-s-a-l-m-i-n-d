import concurrent.futures,hashlib,json,pathlib,subprocess,urllib.request
root=pathlib.Path('/private/tmp/um-universal-one-quantum-20261109')
out=pathlib.Path(__file__).parent
prior=json.loads((out/'staging-file-verification.json').read_text())
previous={x['path']:x for x in prior['files'] if x.get('matched')}
paths=subprocess.check_output(['git','-C',str(root),'diff','--name-only','1e5956432dd49f21b60ac2af59f278486a6def3f','HEAD','--','Informatics'],text=True).splitlines()
def check(path):
 local=root/path
 expected=hashlib.sha256(local.read_bytes()).hexdigest()
 if path in previous and previous[path]['sha256']==expected:return previous[path]
 url='https://staging.universalmind.tv/informatics/'+path.removeprefix('Informatics/')
 if path=='Informatics/quantum/index.html':url+='?embedded=1'
 h=hashlib.sha256();size=0
 with subprocess.Popen(['curl','--fail','--silent','--show-error','--max-time','180',url],stdout=subprocess.PIPE) as proc:
  while chunk:=proc.stdout.read(1024*1024):h.update(chunk);size+=len(chunk)
  assert proc.wait()==0,path
 result=dict(path=path,bytes=size,sha256=h.hexdigest(),matched=h.hexdigest()==expected)
 print(json.dumps(result),flush=True)
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,paths))
report=dict(passed=all(x['matched'] for x in results),files=results,newModelCalls=0)
(out/'staging-file-verification.json').write_text(json.dumps(report,indent=2)+'\n')
assert report['passed']
