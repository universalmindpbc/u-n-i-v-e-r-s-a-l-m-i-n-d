from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit
from concurrent.futures import ThreadPoolExecutor
import subprocess,json,hashlib,urllib.request
root=Path.cwd();out=root/'research/qa/approved-production-20261102';source='7ebdb92ac8886af9c81e8616b336a2fecc86989c'
def blob(p):return subprocess.check_output(['git','show',source+':'+p])
class Assets(HTMLParser):
 def __init__(self,base):super().__init__();self.base=base;self.links=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='base'and a.get('href'):self.base=urljoin(self.base,a['href'])
  if t=='script'and a.get('src'):self.links.append(urljoin(self.base,a['src']))
  if t=='link'and a.get('rel')=='stylesheet':self.links.append(urljoin(self.base,a.get('href','')))
config=json.loads(blob('site-navigation/portals.json'));pages={'index.html':'https://universalmind.tv/','home/index.html':'https://universalmind.tv/home/'}
for portal in config['portals']:
 if portal['id']not in ['iam','informatics']:continue
 for e in [i for parent in portal['entries']for i in [parent,*parent.get('children',[])]]:
  if not e.get('source'):continue
  p=e['url'].lstrip('/')+'index.html'if portal['id']=='iam'else'Informatics/chapters/'+e['id']+'.html'
  pages[p]='https://universalmind.tv'+e['url']
for p in ['library.html','connect.html','research.html','genomics.html','molecular/index.html','quantum/index.html']:pages['Informatics/'+p]='https://universalmind.tv/informatics/'+p
queue={}
for p,url in pages.items():
 parser=Assets(url);parser.feed(blob(p).decode())
 for link in parser.links:
  u=urlsplit(link)
  if u.netloc!='universalmind.tv':continue
  path=u.path.lstrip('/')
  if path.startswith('vogue/iam/'):path='i  a m/'+path[10:]
  elif path.startswith('informatics/'):path='Informatics/'+path[12:]
  try:b=blob(path)
  except subprocess.CalledProcessError:continue
  queue[link]=(path,hashlib.sha256(b).hexdigest())
def check(item):
 url,(path,expected)=item
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 UniversalMind-Production-Verification'}),timeout=30)as r:
  actual=hashlib.sha256(r.read()).hexdigest();return {'url':url,'path':path,'expected':expected,'actual':actual,'matched':expected==actual,'cache':r.headers.get('CF-Cache-Status')}
with ThreadPoolExecutor(max_workers=4)as pool:results=list(pool.map(check,queue.items()))
failed=[r for r in results if not r['matched']];report={'source':source,'checked':len(results),'passed':not failed,'failed':failed,'results':results};(out/'versioned-assets.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'checked':len(results),'failed':failed},indent=2))
