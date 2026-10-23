#!/usr/bin/env python3
"""Check publisher-deposited CC BY locations; retain identifiable article bodies."""
import concurrent.futures as cf,datetime as dt,hashlib,io,json,re,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
from bs4 import BeautifulSoup
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'research/informatics/fulltext-expansion-20261023'
STORE=Path('/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/open-fulltext-20261023')
CACHE=Path('/private/tmp/informatics-publisher-texts');CACHE.mkdir(exist_ok=True)
def fetch(url):
 p=CACHE/hashlib.sha256(url.encode()).hexdigest()
 if p.exists():return p.read_bytes()
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'UniversalInformatics-ResearchAccessAudit/1.0'}),timeout=25) as res:data=res.read(30000000)
 p.write_bytes(data);return data
def check(r):
 out={'id':r['id'],'doi':r['doi'],'title':r['title'],'attempts':[]}
 links=r.get('fullTextLinks',[])
 links=sorted(links,key=lambda x:'xml' not in x.get('content-type',''))
 urls=list(dict.fromkeys([x['URL'].replace('http://','https://',1) for x in links]+[r['landingPage'].replace('http://','https://',1)]))
 for url in urls:
  try:
   data=fetch(url);fmt='html';paras=[];rights=''
   if data.startswith(b'%PDF'):
    fmt='pdf';reader=PdfReader(io.BytesIO(data));paras=[p.extract_text() or '' for p in reader.pages];rights='\n'.join(paras)
   elif data.lstrip().startswith(b'<?xml') or b'<article ' in data[:1000]:
    fmt='xml';root=ET.fromstring(data)
    for e in root.iter():e.tag=e.tag.split('}')[-1]
    body=root.find('.//body');paras=[' '.join(e.itertext()) for e in body.iter('p')] if body is not None else []
    rights=' '.join(' '.join(e.itertext())+' '+str(e.attrib) for p in root.findall('.//permissions') for e in p.iter())
   else:
    soup=BeautifulSoup(data,'html.parser');rights=soup.get_text(' ',strip=True)
    # Only articles containing full-text sections qualify; landing-page abstracts do not.
    full=soup.select_one('article') or soup.select_one('main')
    if full and re.search(r'\b(?:methods|methodology|materials and methods)\b',full.get_text(' ',strip=True),re.I) and re.search(r'\b(?:results|discussion|conclusions)\b',full.get_text(' ',strip=True),re.I):
     paras=[p.get_text(' ',strip=True) for p in full.select('p')]
    rights+=' '+' '.join(a.get('href','') for a in soup.select('a[href*="creativecommons.org"]'))
   combined=' '.join(paras)
   identity=r['doi'].lower() in (data.decode('utf-8',errors='ignore')+' '+combined).lower()
   permission=bool(re.search(r'creativecommons\.org/licenses/by/(?:[1-4]\.0|2\.5)|Creative Commons Attribution License|Creative Commons Attribution 4\.0',rights,re.I))
   conflict=bool(re.search(r'creativecommons\.org/licenses/by-nc|does not permit commercial',rights,re.I))
   if identity and permission and not conflict and len(combined)>6000:
    folder=STORE/('doi-'+hashlib.sha256(r['doi'].encode()).hexdigest()[:16]);folder.mkdir(exist_ok=True)
    (folder/('article.'+fmt)).write_bytes(data)
    rights_excerpt=' '.join(re.findall(r'.{0,90}(?:Creative Commons Attribution|creativecommons\.org/licenses/by/).{0,200}',rights,re.I))
    (folder/'passages.json').write_text(json.dumps({'recordId':r['id'],'doi':r['doi'],'title':r['title'],'source':url,'license':'CC BY','copyrightAndLicense':rights_excerpt,'paragraphs':paras,'providerUpload':False,'publicFulltextRedistribution':False},ensure_ascii=False,indent=2)+'\n')
    return {**out,'status':'publisher-fulltext-cached','source':url,'format':fmt,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'license':'CC BY','rightsExcerpt':rights_excerpt,'localDirectory':str(folder)}
   out['attempts'].append({'url':url,'status':'content-or-licence-review','bodyCharacters':len(combined),'identity':identity,'permission':permission,'conflict':conflict})
  except Exception as e:out['attempts'].append({'url':url,'error':str(e)})
 return {**out,'status':'not-retained'}
records=[r for r in json.loads((ROOT/'research/informatics/fulltext-access-20261023/crossref-access.json').read_text())['records'] if r['status']=='open-license-reported' and any('/by/' in x.get('URL','') for x in r['licenses'])]
with cf.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(check,records))
report={'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'method':'Crossref publisher-deposited links screened for matching DOI, explicit CC BY permission and substantial full article body. Only official publisher locations followed. No abstract-only page counted as full text.','records':results}
(OUT/'publisher-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for r in results:print(r['doi'],r['status'],flush=True)
