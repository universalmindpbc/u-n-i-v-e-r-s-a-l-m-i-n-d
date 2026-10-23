"""Build the Vision reading edition; retain original quotations and topic identities."""
import argparse,copy,difflib,hashlib,json,re
from pathlib import Path
from research_topic_trust import assess_topic
R=Path(__file__).resolve().parents[1];D=R/'Informatics/library-data';O=R/'research/informatics/library/emdr-review-20261023'
parser=argparse.ArgumentParser();parser.add_argument('--page-cache',type=Path,default=Path('/private/tmp/informatics-library-audit'));args=parser.parse_args()
raw={p['page']:p for p in json.loads((args.page_cache/'vision-pages.json').read_text())}
lib=json.loads((D/'library.json').read_text())['records'];exp=json.loads((D/'vision-expansion.json').read_text());byid={r['id']:r for r in exp['records']};originals=[]
for r in lib:
 for a in r.get('archiveEntries',[]):
  if a['collection']=='vision':originals.append((r,a))

def quote(text,pages):
 words=[w for n in pages for w in raw.get(n,{}).get('words',[]) if 100<w['top']<770];tokens=list(re.finditer(r'\S+',text));bold=set()
 for a,b,n in difflib.SequenceMatcher(None,[w['text'] for w in words],[t.group() for t in tokens],autojunk=False).get_matching_blocks():
  if n>=2:
   for j in range(n):
    if 'Bold' in words[a+j]['fontname']:bold.add(b+j)
 spans=[];pos=0
 for i,t in enumerate(tokens):
  value=text[pos:t.end()];em=i in bold
  if spans and spans[-1]['emphasis']==em:spans[-1]['text']+=value
  else:spans.append({'text':value,'emphasis':em})
  pos=t.end()
 if pos<len(text):spans.append({'text':text[pos:],'emphasis':False})
 assert ''.join(s['text'] for s in spans)==text
 return spans

def paper(r,a=None):
 p={k:copy.deepcopy(r[k]) for k in ['title','journal','year','authors','design','urls','doi','pmid','targets','categories','citationCount','citationSnapshot','studyDesignAssessment','evidence'] if k in r}
 p.update(recordId=r['id'],quotes=[],sourcePages=[])
 if r.get('finding'):p['summary']=r['finding']
 if r.get('limitation'):p['limitation']=r['limitation']
 if a:
  p['sourcePages']=a['pages'];p['quotes']=[quote(q,a['pages']) for q in a.get('originalNote','').split('\n\n') if q]
  count=re.search(r'citations:\s*([\d,]+)',a.get('historicalCitationCount') or '',re.I)
  if count:p['citationCount']=int(count[1].replace(',',''));p.pop('citationSnapshot',None)
 return p

def topic(id,title,description=''):return {'id':id,'title':title,'description':description,'papers':[]}
topics={id:topic(id,title,desc) for id,title,desc in [
('i','EMDR for PTSD and related mental-health outcomes','Clinical studies of PTSD symptoms, depression, anxiety and emotional responses following EMDR.'),
('ii','EMDR for PTSD in veterans and military personnel','Military and veteran studies, with individual in-person and telehealth delivery identified separately.'),
('iii','EMDR for PTSD in refugees and asylum seekers','Individual and group protocols involving displaced adults, children and adolescents.'),
('iv','Trauma-focused therapies for Aboriginal and Torres Strait Islander children and young people','The LINKS programme includes EMDR and other culturally adapted therapies in out-of-home care. Its observational comparisons do not isolate the effects of a single therapy.'),
('children','EMDR for children and adolescents','Trials and reviews involving children and adolescents, with the actual age range and clinical setting retained for each study.'),
('young-adults','EMDR and related interventions for young adults','Research including young adults aged 18–24. Several studies span adolescence or extend to age 25; these broader samples are identified explicitly.'),
('v','Australian clinical guidance on EMDR for PTSD','Australian recommendations and supporting evidence, including veteran care.'),
('vi','WHO and UNHCR guidance on EMDR for PTSD','EMDR recommendations for PTSD are distinct from immediate psychosocial support after trauma.'),
('vii','US VA/DoD clinical guidance on EMDR for PTSD','US clinical guidance and patient information, including the 2023 practice guideline.'),
('group','Group EMDR','Therapist-led group protocols, including programmes delivered online.'),
('online','Online EMDR','Remote individual and group treatment, including pandemic-era studies.'),
('self-help','EMDR-derived self-help interventions','Recorded, parent-supported and low-intensity approaches. The level of screening, guidance and clinical support varies across these studies.'),
('rna','EMDR and trauma-focused psychotherapy: gene expression','Direct measurements of messenger RNA and microRNA. The studies combine EMDR with trauma-focused CBT cohorts; they do not establish a molecular effect caused specifically by eye movements.'),
('epigenetics','EMDR and trauma-focused psychotherapy: DNA methylation','Blood and saliva methylation studies, including youth and combined treatment programmes. DNA methylation and RNA expression are different measurements.'),
('biomarkers','EMDR, cortisol and molecular biomarkers','Cortisol and endocannabinoid measurements alongside clinical or physiological outcomes. These are distinct from gene-expression findings.') ]}
selfids={'doi-37bd65a31f48ce93','src-796cb6656464','doi-b4b0af603557eafe','src-4981a8e87964'}
groupids={'pmid-29946275','doi-648f6da34833f786','src-e9a450b442d3','src-1a2a9900c208','doi-67fa7275f4f4ba77'}
placements=[]
for original,a in originals:
 r=byid[original['id']];p=paper(r,a);start=a['sectionPage'];tid={3:'i',6:'ii',8:'iii',10:'iv',12:'v',13:'vi',14:'vii'}.get(start)
 if start==15:tid='self-help' if r['id'] in selfids else 'group' if r['id'] in groupids else 'online'
 if r['id']=='src-796cb6656464':
  second=paper(byid['pmid-33415797']);second.update(quotes=p['quotes'][1:],sourcePages=[16],citationCount=8);second.pop('citationSnapshot',None);topics['group']['papers'].append(second)
  p['quotes']=p['quotes'][:1];p['sourcePages']=[15];p['citationCount']=10;p.pop('citationSnapshot',None)
 if r['id']=='src-3d07e41dbe7a':
  p.update(summary='The presentation reports 159 assessment completers from October 2017 to August 2020: 77 Aboriginal and 82 non-Aboriginal children aged 3–16. Referrals were voluntary through caseworkers for children experiencing placement instability, increased respite needs or repeated placement changes.',limitation='Treatment allocation was not randomized. Different starting scores and participant characteristics limit comparisons across therapies and clinician groups.',figures=[{'src':'library-data/figures/f2aa73aa96f1.jpg','caption':'Trauma symptom changes across treatments in the LINKS programme. Aboriginal children and young people; TSCYC/TSCC outcomes.'},{'src':'library-data/figures/cdec699932b9.jpg','caption':'Trauma symptom changes by clinician cultural background in the LINKS programme. A: Aboriginal clinician; NA: non-Aboriginal clinician.'}])
 if r['id']=='pmid-23702050':p['limitation']='This publication describes the trial protocol. The completed trial is listed separately below; the quoted prospective interpretation is not a completed-trial result.'
 if r['id']=='pmid-30186192':
  for q in p['quotes']:
   for span in q:span['text']=span['text'].replace('Trauma As Usual','Treatment as Usual')
 topics[tid]['papers'].append(p);placements.append({'recordId':r['id'],'sourcePages':a['pages'],'destination':tid})
# General-population papers originally repeated under veterans retain their passages in the clinical topic.
for id in ['pmid-30858808','pmid-30186192','pmid-25101684','pmid-24626074']:
 moved=[p for p in topics['ii']['papers'] if p['recordId']==id];topics['ii']['papers']=[p for p in topics['ii']['papers'] if p['recordId']!=id]
 for p in moved:
  existing=next((q for q in topics['i']['papers'] if q['recordId']==id),None)
  if existing:
   for q in p['quotes']:
    if q not in existing['quotes']:existing['quotes'].append(q)
   existing['sourcePages']=sorted(set(existing['sourcePages']+p['sourcePages']))
  else:topics['i']['papers'].append(p)

def add(id,tid):
 if any(p['recordId']==id for p in topics[tid]['papers']):return
 existing=next((p for t in topics.values() for p in t['papers'] if p['recordId']==id),None)
 topics[tid]['papers'].append(copy.deepcopy(existing) if existing else paper(byid[id]))
def pmid(n,tid):add(next(r['id'] for r in byid.values() if r.get('pmid')==str(n)),tid)
def doi(d,tid):add(next(r['id'] for r in byid.values() if r.get('doi')==d.lower()),tid)
for n in ['25607833','42773467','42880055','39731040']:pmid(n,'i')
for n in ['28660669','24965797','41340540','39630422','42324567','33709117','40243164','42703195']:pmid(n,'children')
for n in ['34512458','39835632','38032626','42411718','9479674']:pmid(n,'young-adults')
pmid('42324567','iii');doi('10.1016/j.fnhli.2025.100070','iv')
for n in ['42129972','37063579','39023949','40417270','34512458','42703195']:pmid(n,'group')
for n in ['38250261','42254728','37063579','40417270','40424141','34512458','38032626']:pmid(n,'online')
for id in ['doi-2a203fb071ddfe54','src-d5959fcb69bc']:add(id,'group')
pmid('40424141','ii')
for r in byid.values():
 if r.get('researchGroup') in ['rna','epigenetics','biomarkers']:add(r['id'],r['researchGroup'])
for r in byid.values():
 if r['kind']=='Clinical guideline' and r['id'] not in ['src-35cb6bd28036','src-75491f6f55b4','src-4d549c318fe9','src-d173f7852495']:add(r['id'],'vii')
topics['rna']['papers'].sort(key=lambda p:0 if p.get('doi')=='10.1891/emdr-2023-0019' else 1)
chapters=[{'number':1,'title':'EMDR: PTSD and mental health','topics':[topics[t] for t in ['i','ii','iii','iv','children','young-adults']]},{'number':2,'title':'Clinical guidance on EMDR for PTSD','topics':[topics[t] for t in ['v','vi','vii']]},{'number':3,'title':'Group, online and EMDR-derived self-help interventions','topics':[topics[t] for t in ['group','online','self-help']]},{'number':4,'title':'EMDR and molecular research','topics':[topics[t] for t in ['rna','epigenetics','biomarkers']]}]
for ch in chapters:
 for n,t in enumerate(ch['topics'],1):
  t['number']=str(ch['number'])+'.'+str(n)
  t['trustAssessment']=assess_topic([byid[p['recordId']] for p in t['papers']]);t['trustScore']=t['trustAssessment']['score']
  if ch['number']==2:t['trustScore']=None;t['trustAssessment']['status']='clinical-guidance'
  for p in t['papers']:p['id']='vision-'+t['id']+'-'+p['recordId']
book={'title':'Vision research','introduction':{'paragraphs':['Vision research begins with eye movement desensitization and reprocessing (EMDR). This section will expand to other visual interventions over time.']},'chapters':chapters,'sourceSHA256':hashlib.sha256((D/'vision-source.json').read_bytes()).hexdigest()}
pp=[p for ch in chapters for t in ch['topics'] for p in t['papers']];book.update(paperCount=len(pp),uniquePaperCount=len({p['recordId'] for p in pp}),topicCount=len(topics))
(D/'vision-edition.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
audit={'originalPlacements':len(originals),'originalDistinctRecords':len({r['id'] for r,a in originals}),'splitMergedRecord':'src-796cb6656464 -> child self-help + pmid-33415797 group review','originalDistinctReferencesAfterSplit':42,'originalCitationPlacementSumBeforeRepair':2691,'originalUniqueCitationMaximumSumBeforeRepair':2290,'splitRepairRestoresChildCitations':10,'exclusions':[],'placements':placements,'newDistinctRecords':sum(r['id'] not in {x['id'] for x in lib} for r in byid.values()),'narrativeUniqueReferences':book['uniquePaperCount'],'narrativePlacements':len(pp),'coverTotals':{'articles':55,'publications':33,'citations':3210},'countNote':'The body contains 48 reference placements after splitting the merged pair, with repeated citations; 42 distinct references include guidance, presentation and search context. Cover totals are retained here, not substituted for verified website counts. No body reference was removed. Four non-military duplicates retain their excerpts in the general clinical topic. The source does not define the difference between cover articles and publications.','corrections':['Split child self-help and group review identities, quotations and citation counts.','Restored actual title and journal of the self-administered review.','Corrected the depression quotation transcription from Trauma As Usual to Treatment as Usual.','Retained original LINKS charts with the approved captions.','Guidance sections use Clinical guidance rather than an RCT trust score.','Clinical PTSD grade does not transfer to combined entertainment or molecular claims.'],'topicScores':[{k:t[k] for k in ['id','title','trustScore','trustAssessment']} for t in topics.values()]}
(O/'integration-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:book[k] for k in ['paperCount','uniquePaperCount','topicCount']}));print([(t['id'],t['trustScore'],t['trustAssessment']['counts']) for t in topics.values()])
