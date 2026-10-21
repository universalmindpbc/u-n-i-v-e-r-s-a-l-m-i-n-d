import json, subprocess, concurrent.futures, pathlib, hashlib, re, html, time, os
R=pathlib.Path(__file__).resolve().parents[1]; C=pathlib.Path(os.environ.get('RESEARCH_LINK_CACHE','/private/tmp/research-links-20261022'));C.mkdir(exist_ok=True)
rs=json.loads((R/'Informatics/library-data/library.json').read_text())['records'];ed=json.loads((R/'Informatics/library-data/sound-edition.json').read_text())
urls=set(u for r in rs for u in r['urls'])|set(u for c in ed['chapters'] for t in c['topics'] for p in t['papers'] for u in p['urls'])
# Check both stored links and stable identifiers for every record.
urls|={'https://pubmed.ncbi.nlm.nih.gov/'+str(r['pmid'])+'/' for r in rs if r.get('pmid')}
urls|={'https://doi.org/'+r['doi'] for r in rs if r.get('doi')}
catalog=json.loads((R/'research/informatics/library/publication-catalog-20261022.json').read_text())['records']
urls|={u for d in catalog.values() for u in d['candidates']}
overrides=json.loads((R/'research/informatics/library/publication-link-overrides-20261022.json').read_text())
urls|={u for d in overrides.values() for u in d.get('urls',[])}
if (C/'wayback.json').exists(): urls|={d['url'].replace('http://web.archive.org/','https://web.archive.org/') for d in json.loads((C/'wayback.json').read_text()).values()}
def check(u):
 key=hashlib.sha256(u.encode()).hexdigest();f=C/(key+'.json');body=C/(key+'.body')
 if f.exists():return json.loads(f.read_text())
 p=subprocess.run(['curl','-L','--silent','--show-error','--connect-timeout','7','--max-time','18','--max-filesize','2000000','--user-agent','Mozilla/5.0 (compatible; UniversalResearchLinkCheck/1.0)','-o',str(body),'-w','%{json}',u],capture_output=True,text=True)
 try:m=json.loads(p.stdout)
 except:m={}
 raw=body.read_bytes() if body.exists() else b'';s=raw.decode('utf-8','replace');title=re.search(r'<title[^>]*>(.*?)</title>',s,re.S|re.I)
 d={'url':u,'status':m.get('http_code',0),'finalUrl':m.get('url_effective',u),'contentType':m.get('content_type',''),'title':html.unescape(re.sub('<[^>]+>','',title[1])).strip()[:500] if title else '', 'curlExit':p.returncode,'error':p.stderr[:200],'bytes':len(raw)}
 f.write_text(json.dumps(d));return d
out=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for i,d in enumerate(pool.map(check,sorted(urls)),1):
  out.append(d)
  if i%100==0:print('Checked',i,'of',len(urls),flush=True)
(C/'http.json').write_text(json.dumps(out,indent=2));from collections import Counter
print('Complete',len(out),Counter(x['status'] for x in out),flush=True)
