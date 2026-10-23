#!/usr/bin/env python3
"""Resolve existing Nature identifiers and a source-led addition shortlist."""
import concurrent.futures as cf,datetime as dt,difflib,hashlib,html,json,re,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'research/informatics/nature-expansion-20261023';OUT.mkdir(parents=True,exist_ok=True)
CACHE=Path('/private/tmp/informatics-nature-metadata');CACHE.mkdir(exist_ok=True)
SHORTLIST=[
('10.1038/nature05526','nature05526'),('10.1038/nature12518','nature12518'),
('10.1038/mp.2012.103','mp2012103'),('10.1038/s41583-018-0072-6','s41583-018-0072-6'),
('10.1038/s41467-020-15659-1','s41467-020-15659-1'),('10.1038/nn.3634','nn.3634'),
('10.1038/s41586-019-1075-9','s41586-019-1075-9'),('10.1038/nn.2270','nn.2270'),
('10.1038/s41593-017-0010-3','s41593-017-0010-3'),('10.1038/nrn2153','nrn2153'),
('10.1038/s41380-023-02309-3','s41380-023-02309-3'),('10.1038/s41386-024-01996-y','s41386-024-01996-y'),
('10.1038/s41598-026-38976-9','s41598-026-38976-9'),('10.1038/s41586-023-06540-4','s41586-023-06540-4'),
('10.1038/srep09506','srep09506'),('10.1038/nn.2726','nn.2726'),
('10.1038/s41398-023-02671-4','s41398-023-02671-4'),('10.1038/nrn3666','nrn3666'),
('10.1038/s41562-024-01907-7','s41562-024-01907-7'),('10.1038/tp.2016.164','tp2016164'),
('10.1038/tp.2016.234','tp2016234'),('10.1038/s41586-019-0931-y','s41586-019-0931-y'),
('10.1038/srep34610','srep34610')]
def fetch(url):
 p=CACHE/hashlib.sha256(url.encode()).hexdigest()
 if p.exists():return json.loads(p.read_text())
 req=urllib.request.Request(url,headers={'User-Agent':'UniversalInformatics-ResearchAudit/1.0'})
 for attempt in range(3):
  try:
   with urllib.request.urlopen(req,timeout=40) as res:d=json.load(res)
   break
  except Exception:
   if attempt==2:raise
   time.sleep(6*(attempt+1))
 p.write_text(json.dumps(d));return d
def resolve(args):
 doi,url,old=args;out={'doi':doi,'publisherURL':url,'existingRecordId':old.get('id') if old else None}
 try:
  c=fetch('https://api.crossref.org/works/'+urllib.parse.quote(doi,safe=''))['message']
  e=fetch('https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urllib.parse.urlencode({'query':'DOI:"'+doi+'"','format':'json','resultType':'core'}))
  hits=[h for h in e.get('resultList',{}).get('result',[]) if (h.get('doi') or '').lower()==doi.lower()]
  h=hits[0] if hits else {}
  title=html.unescape(re.sub('<[^>]+>','',' '.join(c.get('title',[]))))
  out.update(title=title,journal=' '.join(c.get('container-title',[])),publisher=c.get('publisher'),year=(c.get('published',{}).get('date-parts') or [[None]])[0][0],authors='; '.join(' '.join([a.get('given',''),a.get('family','')]).strip() for a in c.get('author',[])),citations=c.get('is-referenced-by-count'),licenses=c.get('license',[]),pmid=h.get('pmid'),pmcid=h.get('pmcid'),abstractReviewedSHA256=hashlib.sha256((h.get('abstractText') or c.get('abstract') or '').encode()).hexdigest(),pubTypes=h.get('pubTypeList'),fullTextLocations=h.get('fullTextUrlList'),updates=c.get('update-to'),journalInfo=h.get('journalInfo'))
  if old:
   norm=lambda s:re.sub('[^a-z0-9]','',html.unescape(s).lower())
   out.update(originalTitle=old['title'],originalJournal=old.get('journal'),similarity=round(difflib.SequenceMatcher(None,norm(old['title']),norm(title)).ratio(),4))
 except Exception as exc:out['error']=str(exc)
 return out
if __name__=='__main__':
 records=json.loads(Path('/private/tmp/universal-research-access-input.json').read_text())['records']
 current=[r for r in records if (r.get('doi') or '').startswith('10.1038') or any('nature.com/' in u for u in r.get('urls',[]))]
 queries=[(r.get('doi'),None,r) for r in current if r.get('doi')]+[(d,'https://www.nature.com/articles/'+p,None) for d,p in SHORTLIST]
 with cf.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(resolve,queries))
 (OUT/'metadata-review.json').write_text(json.dumps({'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'records':rows},ensure_ascii=False,indent=2)+'\n')
 for r in rows: print(r.get('existingRecordId') or 'NEW',r['doi'],r.get('journal'),r.get('similarity'),r.get('pmcid'),r.get('title'),r.get('error',''),flush=True)
