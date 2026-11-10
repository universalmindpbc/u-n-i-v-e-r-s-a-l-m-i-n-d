"""Verify committed Spacetime bytes and discovery boundaries on permanent staging."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,hashlib,subprocess,re
root=Path(__file__).resolve().parents[1]
origin='https://staging.universalmind.tv'
def fetch(url):
 return urlopen(Request(url,headers={'User-Agent':'curl/8.7.1','Cache-Control':'no-cache'}),timeout=30)
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=subprocess.check_output(['git','ls-files','Informatics/spacetime'],cwd=root,text=True).splitlines()
report={'commit':commit,'origin':origin,'files':[],'discovery':[]}
for relative in files:
 p=root/relative
 if p.name=='.htaccess':continue
 route='/informatics/spacetime/'+str(p.relative_to(root/'Informatics/spacetime'))
 with fetch(origin+route+'?verify='+commit) as response:
  body=response.read();headers=dict(response.headers)
  assert response.status==200
  assert 'noindex' in response.headers.get('X-Robots-Tag','')
  served_sha=hashlib.sha256(body).hexdigest();normalized=body;normalization=None
  if p.suffix=='.html' and body!=p.read_bytes():
   normalized,count=re.subn(rb'<script type="module" src="https://static\.cloudflareinsights\.com/beacon\.min\.js/[^"<>]+" integrity="sha512-[^"<>]+" data-cf-beacon=\x27[^\x27<>]+\x27 crossorigin="anonymous"></script>\n',b'',body)
   assert count==1,(route,'unexpected HTML transformation')
   normalization='Removed one existing edge-injected Cloudflare analytics beacon for source comparison'
  assert hashlib.sha256(normalized).hexdigest()==hashlib.sha256(p.read_bytes()).hexdigest(),route
  if p.suffix=='.mjs':assert 'javascript' in response.headers.get('Content-Type',''),route
  report['files'].append({'path':route,'status':200,'served_sha256':served_sha,'source_sha256':hashlib.sha256(normalized).hexdigest(),'normalization':normalization,'noindex':True,'content_type':response.headers.get('Content-Type')})
for route in ['/informatics/','/sitemap.xml','/llms.txt','/informatics/sitemap.xml','/informatics/llms.txt']:
 try:
  with fetch(origin+route) as response:
   body=response.read().decode('utf8','replace');assert '/spacetime/' not in body,route
   report['discovery'].append({'path':route,'status':response.status,'spacetime_listed':False})
 except HTTPError as error:
  assert error.code==404,(route,error.code)
  report['discovery'].append({'path':route,'status':404})
out=root/'research/informatics/spacetime-20261110/staging';out.mkdir(exist_ok=True)
(out/'http-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'passed','commit':commit,'files':len(report['files']),'discovery':report['discovery']}))
