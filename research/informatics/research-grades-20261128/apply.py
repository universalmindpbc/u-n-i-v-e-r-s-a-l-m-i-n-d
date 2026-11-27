from pathlib import Path
import json,sys,collections
ROOT=Path(__file__).resolve().parents[3];D=ROOT/'Informatics/library-data';sys.path.insert(0,str(ROOT/'tools'))
from research_topic_trust import assess_topic
names=['library','mindfulness-expansion','vision-expansion','nature-expansion','fibonacci-expansion','hyperspectral-expansion','domestic-violence-expansion','youth-expansion','masked-language-expansion']
byid={}
for name in names:
 for r in json.loads((D/(name+'.json')).read_text()).get('records',[]):byid[r['id']]={**byid.get(r['id'],{}),**r}
report={'date':'2026-11-28','rules':'Existing three-distinct-study thresholds; paper-specific assessments retained; linked trial reports count once.','chapters':[],'changes':[]}
for name in ['sound','vision','language','general']:
 path=D/(name+'-edition.json');book=json.loads(path.read_text())
 for c in book['chapters']:
  chapter_records=[]
  for t in c['topics']:
   rows=[{**p,**byid.get(p['recordId'],{}),'id':p['recordId']} for p in t['papers']]
   chapter_records+=rows
   old=t.get('trustScore');assessment=assess_topic(rows);assessment['assessedAt']='2026-11-28'
   if t.get('trustAssessment',{}).get('status')=='clinical-guidance':assessment['status']='clinical-guidance'
   t['trustAssessment']=assessment;t['trustScore']=assessment['score']
   if old!=t['trustScore']:report['changes'].append({'collection':name,'chapter':c['number'],'topic':t['id'],'previous':old,'score':t['trustScore'],'counts':assessment['counts']})
  c['trustAssessment']=assess_topic(chapter_records);c['trustAssessment'].update(scope='Chapter',assessedAt='2026-11-28');c['trustScore']=c['trustAssessment']['score']
  if name=='vision' and c['number']==2:c['trustAssessment']['status']='clinical-guidance'
  report['chapters'].append({'collection':name,'number':c['number'],'title':c['title'],'score':c['trustScore'],'counts':c['trustAssessment']['counts'],'topics':len(c['topics'])})
 if name=='general':
  mental=next(c for c in book['chapters'] if c.get('id')=='il6-mental-health')
  mental['overview'][0]='IL6 is the gene that encodes interleukin-6 (IL-6), a cytokine involved in immune signalling. This chapter examines IL6 gene regulation and the IL-6 pathway in mental health, with a separate section for each condition and related clinical outcome.'
  if not any(p.startswith('Gene expression and protein concentration') for p in mental['overview']):mental['overview'].insert(1,'Gene expression and protein concentration are different measurements. IL6 expression is assessed through RNA, while blood IL-6 tests measure the encoded protein. Much of the mental-health literature measures circulating IL-6 protein; those findings do not by themselves establish altered IL6 expression in the brain. DNA methylation, genetic variation, RNA expression, protein concentration and receptor signalling are identified separately throughout the research.')
  mental['geneReference']={'title':'IL6 gene reference · NCBI Gene','url':'https://www.ncbi.nlm.nih.gov/gene/3569','symbol':'IL6','encodedProtein':'Interleukin-6 (IL-6)'}
 path.write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
(ROOT/'research/informatics/research-grades-20261128/grade-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'chapters':len(report['chapters']),'topics':sum(c['topics'] for c in report['chapters']),'changes':len(report['changes']),'chapterScores':collections.Counter(str(c['score']) for c in report['chapters'])}))
for c in report['chapters']:
 if c['score'] is None or (c['collection']=='general' and c['number']>=10):print(c)
