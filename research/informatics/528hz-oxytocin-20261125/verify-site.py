import concurrent.futures,hashlib,json,pathlib,time,urllib.parse,subprocess
out=pathlib.Path(__file__).parent
scope=json.loads((out/'staging-scope.json').read_text())
def verify(row):
 url='https://staging.universalmind.tv/'+urllib.parse.quote(row['remote'],safe='/')+'?embedded=1&verify=528hz-oxytocin-20261125'
 digest=hashlib.sha256();size=0
 with subprocess.Popen(['curl','--fail','--silent','--show-error','--max-time','180',url],stdout=subprocess.PIPE) as response:
  while True:
   chunk=response.stdout.read(1024*1024)
   if not chunk:break
   digest.update(chunk);size+=len(chunk)
  assert response.wait()==0,row['remote']
 assert size==row['bytes'],(row['remote'],size,row['bytes'])
 assert digest.hexdigest()==row['sha256'],row['remote']
 return {'path':row['remote'],'bytes':size,'sha256':digest.hexdigest()}
start=time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(verify,scope['files']))
report={'passed':True,'exactFilesMatched':len(results),'bytesVerified':sum(r['bytes'] for r in results),'elapsedSeconds':round(time.time()-start,1),'files':results}
(out/'site-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
