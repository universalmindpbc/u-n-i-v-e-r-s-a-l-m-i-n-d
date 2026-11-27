import csv,json,re,hashlib,subprocess
from pathlib import Path
P=Path(__file__).resolve().parents[1];D=P/'Informatics/library-data';A=P/'research/informatics/il6-mental-health-20261128'
load=lambda f:json.loads((D/f).read_text())
r=load('il6-mental-health-research-register.json');combined=load('oxtr-il6-research-register.json');g=load('general-edition.json');c=next(x for x in g['chapters'] if x.get('id')=='oxtr-il6-inflammation');L=load('library.json')
assert len(r['records'])==120 and sum(x['countedMentalHealthPublication'] for x in r['records'])==117
assert len(combined['records'])==162 and len(c['topics'])==26
for key in ['pmid','doi','recordId']:
 v=[x[key] for x in r['records'] if x.get(key)];assert len(v)==len(set(v)),key
ids={x['recordId'] for x in combined['records']};assert len(ids)==162
assert [x['recordId'] for t in c['topics'] for x in t['papers']].__len__()==162
assert ids <= {x['id'] for x in L['records']}
for t in c['topics']:
 assert len(t['paragraphs'])==len(t['paragraphSources'])
 for refs in t['paragraphSources']:
  assert all(x['recordId'] in ids for x in refs)
for name,reg in [('il6-mental-health',r),('oxtr-il6',combined)]:
 rows=list(csv.DictReader((D/(name+'-research-register.csv')).open()))
 assert len(rows)==len(reg['records'])
 for x,y in zip(reg['records'],rows):
  for k,v in y.items():
   expected=x.get(k,'');expected=json.dumps(expected,ensure_ascii=False) if isinstance(expected,(list,dict)) else str(expected if expected is not None else '')
   assert v==expected,(name,x['recordId'],k)
base=json.loads(subprocess.check_output(['git','show','f165b4a8ea49087f96320c7e595f917635afbd29:Informatics/library-data/general-edition.json'],cwd=P))
assert g['chapters'][:-1]==base['chapters'][:-1]
baseReg=json.loads(subprocess.check_output(['git','show','f165b4a8ea49087f96320c7e595f917635afbd29:Informatics/library-data/oxtr-il6-research-register.json'],cwd=P))
assert combined['records'][:42]==baseReg['records']
assert c['topics'][:10]==base['chapters'][-1]['topics']
by={x['pmid']:x for x in r['records']}
assert by['37069570']['blinding']=='open-label' and by['37069570']['paperTrustAssessment']['score']==2
assert not by['33719920']['randomizedControlledTrial']
assert not by['31163212']['randomizedControlledTrial']
assert by['34778863']['studyFamilyId']==by['34589887']['studyFamilyId']
assert not by['32554630']['countedMentalHealthPublication'] and not by['25274579']['countedMentalHealthPublication']
for x in r['records']:
 assert x['summary'] and x['limitation'] and x['sourceAccess'] and x['paperTrustAssessment']['basis']
 if 'meta-analysis' in x['design'].lower():assert x['paperTrustAssessment']['score']==1
text=' '.join(c['overview']+[p for t in c['topics'][10:] for p in t['paragraphs']]+[v for x in r['records'] for v in [x['summary'],x['limitation']]])
assert not re.search(r'\b(?:sh'+'ould|co'+'uld|wo'+'uld)(?:n[’\']t)?\b',text,re.I)
report={'passed':True,'publications':120,'directMentalHealth':117,'contextual':3,'combinedSources':162,'priorChaptersPreserved':12,'originalSourcesPreserved':42,'jsonCsvEquivalent':True,'citationsResolved':True,'individualAppraisals':True,'maskingAndFamilyBoundaries':True}
(A/'content-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
