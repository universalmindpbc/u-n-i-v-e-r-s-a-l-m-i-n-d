import concurrent.futures,hashlib,json,pathlib,time,urllib.parse,subprocess,threading
out=pathlib.Path(__file__).parent
scope=json.loads((out/'production-scope.json').read_text())
rows=sorted(scope['files'],key=lambda r:(2 if r['source']=='Informatics/exports/manifest.json' else 1 if r['source'].endswith(('index.json','.html','.js')) else 0,r['source']))
start=time.time();lock=threading.Lock();finished=[]
def verify(row):
 base_url='https://universalmind.tv/'+urllib.parse.quote(row['remote'],safe='/')+'?embedded=1&verify=528hz-production-20261125'
 attempts=0
 while time.time()-start<2400:
  attempts+=1
  url=base_url+'&run='+str(int(start*1000))+'&attempt='+str(attempts)
  head=subprocess.run(['curl','--head','--silent','--show-error','--max-time','30',url],capture_output=True,text=True)
  headers=head.stdout.lower().splitlines()
  size_headers=[line.split(':',1)[1].strip() for line in headers if line.startswith('content-length:')]
  if head.returncode or not any(line.startswith(('http/2 200','http/1.1 200')) for line in headers) or size_headers and int(size_headers[-1])!=row['bytes']:
   time.sleep(2);continue
  digest=hashlib.sha256();size=0
  with subprocess.Popen(['curl','--fail','--silent','--show-error','--max-time','180',url],stdout=subprocess.PIPE) as response:
   while True:
    chunk=response.stdout.read(1024*1024)
    if not chunk:break
    digest.update(chunk);size+=len(chunk)
   success=response.wait()==0
  if success and size==row['bytes'] and digest.hexdigest()==row['sha256']:
   result={'path':row['remote'],'bytes':size,'sha256':digest.hexdigest(),'availabilityChecks':attempts}
   with lock:
    finished.append(result)
    (out/'site-progress.json').write_text(json.dumps({'matchedFiles':len(finished),'totalFiles':len(rows),'matchedBytes':sum(r['bytes'] for r in finished),'elapsedSeconds':round(time.time()-start,1),'files':finished},indent=2)+'\n')
    if len(finished)%20==0:print(json.dumps({'matchedFiles':len(finished),'totalFiles':len(rows)}),flush=True)
   return result
  time.sleep(2)
 raise AssertionError('Production asset failed to match within verification window: '+row['remote'])
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(verify,rows))
report={'passed':True,'exactFilesMatched':len(results),'bytesVerified':sum(r['bytes'] for r in results),'elapsedSeconds':round(time.time()-start,1),'files':results}
(out/'site-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
