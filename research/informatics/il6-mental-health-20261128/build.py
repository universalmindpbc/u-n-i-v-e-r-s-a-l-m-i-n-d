import csv,hashlib,html,json,re,sys
from pathlib import Path
from collections import Counter
from synthesis import TOPICS
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];D=ROOT/'Informatics/library-data';DATE='2026-11-28'
notes=list(csv.DictReader((HERE/'appraisals.tsv').open(),delimiter='\t'));meta=json.loads((HERE/'source-metadata.json').read_text());access=json.loads((HERE/'fulltext-access.json').read_text())
assert len(notes)==len({n['pmid'] for n in notes})==120
excluded=re.compile(r'\b(?:sh'+'ould|co'+'uld|wo'+'uld)(?:n[’\']t)?\b',re.I)
for n in notes:
 for f in ['finding','limitation','design','sample']:assert not excluded.search(n[f]),(n['pmid'],f)
for t in TOPICS:
 for s in [t['title'],t['description'],*t['paragraphs']]:assert not excluded.search(s),s
load=lambda f:json.loads((D/f).read_text())
lib=load('library.json');ed=load('general-edition.json');reg=load('oxtr-il6-research-register.json');conditions=load('clinical-conditions.json')
chapter=next(c for c in ed['chapters'] if c.get('id')=='oxtr-il6-inflammation')
original=[r for r in reg['records'] if not r.get('mentalHealthExpansion')];assert len(original)==42
originalTopics=[t for t in chapter['topics'] if not t.get('mentalHealthExpansion')]
context={'37484196','32554630','25274579'}
condmap={'depression':['depression'],'psychosis':['psychosis','schizophrenia'],'bipolar':['bipolar'],'ptsd':['ptsd','trauma'],'anxiety':['anxiety'],'suicidality':['suicidality'],'adhd':['adhd'],'addiction':['substance-use'],'transdiagnostic':[]}
if not any(t['id']=='suicidality' for t in conditions['taxonomy']):conditions['taxonomy'].append({'id':'suicidality','label':'Suicidal ideation / behaviour'})
records=[]
for n in notes:
 m=meta[n['pmid']];doi=m.get('doi') or '';pmid=n['pmid'];title=html.unescape(re.sub(r'</?[A-Za-z][^>]*>','',m['title']))
 existing=next((r for r in lib['records'] if str(r.get('pmid'))==pmid or doi and str(r.get('doi','')).lower()==doi.lower()),None)
 rid=existing['id'] if existing else 'pmid-'+pmid
 urls=['https://pubmed.ncbi.nlm.nih.gov/'+pmid+'/']+(['https://doi.org/'+doi] if doi else [])
 if m.get('pmcid'):urls.append('https://pmc.ncbi.nlm.nih.gov/articles/'+m['pmcid']+'/')
 randomized='randomized' in n['design'].lower() and not any(x in n['design'].lower() for x in ['within-arm','counterbalanced','challenge'])
 double=n['masking']=='double-blind';blinding='double' if double else 'open-label' if n['masking'].startswith(('open','not masked')) else 'not-established'
 group='review' if 'review' in n['design'].lower() or 'meta-analysis' in n['design'].lower() else 'genetic' if 'Mendelian' in n['design'] or 'Genetic' in n['design'] else 'human-trial' if randomized else 'human-observational'
 sourceAccess='Abstract and selected full-text passages reviewed' if isinstance(access.get(pmid),dict) else 'Indexed abstract reviewed; full-text methods not comprehensively assessed'
 notices=[x for x in (m.get('commentCorrectionList') or {}).get('commentCorrection',[]) if x['type'] in ['Erratum in','Retraction in','Expression of concern in']]
 notices=[{'type':x['type'],'pmid':x.get('id'),'url':'https://pubmed.ncbi.nlm.nih.gov/'+x['id']+'/','status':'Notice identified; correction content not fully resolved in this pass'} for x in notices]
 limitation=n['limitation']+(' Linked correction notice identified; its full content remains unresolved in this appraisal.' if notices else '')
 family=n['trialFamily'] or 'publication-'+pmid
 conds=condmap[n['domain']].copy()
 if pmid in ['25451609','27476619','19251324','17845274']:conds+=['mania']
 if pmid in ['25133871']:conds+=['depression','psychosis']
 r=dict(key='mental-'+pmid,recordId=rid,title=title,doi=doi,pmid=pmid,pmcid=m.get('pmcid'),year=int(m['pubYear']),authors=m.get('authorString') or '',journal=m['journalInfo']['journal']['title'],urls=urls,group=group,domain=n['domain'],design=n['design'],maskingDetail=n['masking'],sample=n['sample'],summary=n['finding'],limitation=limitation,sourceAccess=sourceAccess,supplied=False,targets=['IL6','IL6R'] if ('receptor' in (title+' '+n['finding']).lower() or pmid in ['42160062','29090685']) else ['IL6'],peerReviewed=True,randomizedControlledTrial=randomized,blinding=blinding,studyFamilyId=family,mentalHealthExpansion=True,countedMentalHealthPublication=pmid not in context,evidenceRole='Contextual substance-exposure evidence' if pmid in context else 'Mental-health IL-6 evidence; association and treatment effects appraised separately',linkedNotices=notices,conditions=conds,bibliographicVerification={'provider':'PubMed-indexed Europe PMC core metadata','checkedAt':DATE,'recordSHA256':m['retrievedRecordSHA256']})
 r['paperTrustAssessment']={'scope':'Paper','status':'assessed','score':3 if randomized and double else 2 if randomized else 1,'peerReviewed':True,'randomizedControlledTrial':randomized,'blinding':blinding,'basis':'Study-design shorthand, not a risk-of-bias, certainty or efficacy grade. '+n['design']+'. Masking: '+n['masking']+'.','sources':urls,'assessedAt':DATE}
 r['evidence']={'evidenceType':n['design'],'relationshipNote':r['evidenceRole'],'sourceURLs':urls,'checkedAt':DATE,'reviewScope':sourceAccess,'clinicalValidation':'No validated Universal Mind intervention–OXTR–IL-6–mental-health-benefit causal chain','studyFamilyId':family,'sample':n['sample'],'maskingDetail':n['masking'],'linkedNotices':notices}
 entry={'id':rid,'title':title,'collections':['general'],'origin':'curated','urls':urls,'doi':doi,'pmid':pmid,'journal':r['journal'],'year':r['year'],'authors':r['authors'],'kind':group,'archiveEntries':[],'provenance':[],'priority':1,'targets':r['targets'],'categories':['Mental health','Molecular biomarkers'],'design':r['design'],'finding':r['summary'],'limitation':limitation,'verification':r['bibliographicVerification'],'verifiedAt':DATE,'studyFamilyId':family,'evidence':r['evidence'],'paperTrustAssessment':r['paperTrustAssessment'],'conditions':conds,'il6MentalHealthResearch':{'domain':n['domain'],'access':sourceAccess,'checkedAt':DATE,'countedMentalHealthPublication':r['countedMentalHealthPublication']}}
 if existing:
  for f in ['collections','targets','categories','conditions']:existing[f]=list(dict.fromkeys(existing.get(f,[])+entry[f]))
  existing['il6MentalHealthResearch']=entry['il6MentalHealthResearch']
 else:lib['records'].append(entry)
 conditions['records'][rid]=list({x['id']:x for x in conditions['records'].get(rid,[])+[{'id':c,'evidence':[{'field':'reviewed-study-population','text':title,'matchedText':c,'reviewedAt':DATE}]} for c in conds]}.values())
 records.append(r)
byid={r['pmid']:r for r in original+records if r.get('pmid')};assigned=set();topics=[]
for spec in TOPICS:
 ids=spec['ids']
 if len(ids)==1 and ids[0] in condmap:ids=[r['pmid'] for r in records if r['domain']==ids[0]]
 if ids==['bipolar-rest']:ids=[r['pmid'] for r in records if r['domain']=='bipolar' and r['pmid'] not in {'19251324','17845274','25451609','27476619'}]
 # References across topics are citations, not duplicated publication entries.
 ids=[i for i in ids if i not in assigned];assigned.update(ids)
 rr=[byid[i] for i in ids];paper=[]
 for r in rr:
  paper.append({'id':'general-il6-mental-'+r['pmid'],**{k:r[k] for k in ['recordId','title','journal','year','authors','design','urls','doi','pmid','targets','summary','paperTrustAssessment','evidence','studyFamilyId']},'categories':['Mental health','Molecular biomarkers'],'quotes':[],'citationCount':None,'sourcePages':[],'limitation':r['limitation']+' Access: '+r['sourceAccess']+'.'})
 families={r['studyFamilyId'] for r in rr if r['randomizedControlledTrial']};doublefamilies={r['studyFamilyId'] for r in rr if r['randomizedControlledTrial'] and r['blinding']=='double'}
 # Evidence volume never promotes the unproven mechanistic hypothesis.
 score=3 if len(doublefamilies)>=3 else 2 if len(families)>=3 else 1
 topics.append({'id':'oxtr-il6-'+spec['key'],'number':'13.'+str(11+len(topics)),'title':spec['title'],'description':spec['description'],'paragraphs':spec['paragraphs'],'paragraphSources':[[{'recordId':byid[i]['recordId'],'label':byid[i]['authors'].split(',')[0]+' '+str(byid[i]['year'])} for i in refs] for refs in spec['citations']],'papers':paper,'trustScore':score,'trustAssessment':{'status':'assessed','basis':'Publication design and distinct trial-family count; not a certainty grade or proof of IL-6-mediated benefit.','distinctRandomizedFamilies':len(families),'distinctDoubleBlindFamilies':len(doublefamilies)},'mentalHealthExpansion':True})
assert assigned=={r['pmid'] for r in records},set(r['pmid'] for r in records)-assigned
chapter['title']='IL-6, mental health and inflammation: oxytocin and OXTR pathways'
chapter['overview']=[
 'IL-6 is associated with several mental-health conditions, especially depression, psychosis, bipolar disorder, PTSD and substance use disorders. The evidence varies by diagnosis, mood state, specimen and study design. It does not establish IL-6 as a universal cause of mental illness or prove that lowering it improves every condition.',
 'This chapter retains the original 42-source OXTR analysis and adds 120 peer-reviewed publications: 117 directly relevant mental-health papers plus three contextual substance-exposure papers. Randomized trials lead the appraisal; positive, null and opposite-direction findings remain visible. Publication counts are not counts of independent experiments.',
 'Oxytocin–OXTR anti-inflammatory mechanisms have strong support in selected cell models and substantial animal evidence. Human OXTR–IL-6 evidence is emerging, promising and mixed. Direct IL-6 receptor trials in depression and schizophrenia remain small, inconclusive or negative; a sustained clinical benefit through the proposed Universal Mind pathway is unestablished.',
 'The systems-biology opportunity is a testable human hypothesis: does a defined intervention alter OXTR-related biology, IL-6 signalling and meaningful outcomes, and which links are actually demonstrated? Each link needs evidence. Universal One retrieves this same appraised literature, with source-specific access and limitations.'
]
chapter['evidenceOverview']=[x for x in chapter['evidenceOverview'] if x['label'] in ['In a dish','In animals','In humans']]+[
 {'label':'Mental-health associations','strength':'Repeated, diagnosis-dependent','finding':'120 peer-reviewed publications, including 117 directly relevant mental-health papers.','boundary':'Association, temporal sequence and genetic proxies are not interchangeable with treatment effects.'},
 {'label':'Clinical intervention','strength':'Mixed; direct blockade unproven','finding':'Small direct IL-6R trials and many indirect biomarker trials include null and discordant results.','boundary':'Neither routine IL-6 treatment nor the proposed OXTR–IL-6 causal chain is established.'}]
chapter['topics']=originalTopics+topics;chapter['researchRegister']['count']=162;chapter['mentalHealthPublicationCount']=117;chapter['expansionPublicationCount']=120
chapter['mentalHealthRegister']={'json':'library-data/il6-mental-health-research-register.json','csv':'library-data/il6-mental-health-research-register.csv','count':120,'directlyRelevant':117,'contextual':3}
reg.update(schemaVersion='oxtr-il6-research/v2',reviewedAt=DATE,title=chapter['title'],purpose=chapter['overview'],sourceCount=162,additionalSources=143,originalOXTRSourceCount=42,mentalHealthPublicationCount=117,expansionPublicationCount=120,evidenceOverview=chapter['evidenceOverview'],records=original+records)
reg['reviewMethod']=TOPICS[-1]['paragraphs'];reg['originalReviewDate']='2026-11-24';reg['duplicateHandling']='Unique publication identities are counted once. Reviews overlap primary studies; linked reports and cohorts retain family identifiers. Three exposure papers are contextual and excluded from the 117 directly relevant mental-health count.'
mental={k:reg[k] for k in ['reviewedAt','reviewMethod','duplicateHandling']};mental.update(schemaVersion='il6-mental-health/v1',title='IL-6 and mental health: publication register',sourceCount=120,directlyRelevantMentalHealthPublications=117,contextualExposurePublications=3,records=records,domainCounts=dict(Counter(r['domain'] for r in records)),searchMethod='Bounded targeted searches and purposive narrative appraisal; no claim of exhaustive systematic coverage.',fullTextPassagesReviewed=sum('selected full-text' in r['sourceAccess'] for r in records))
ed['paperCount']=sum(len(t['papers']) for c in ed['chapters'] for t in c['topics']);ed['uniquePaperCount']=len({p['recordId'] for c in ed['chapters'] for t in c['topics'] for p in t['papers']});ed['topicCount']=sum(len(c['topics']) for c in ed['chapters']);lib['summary']['records']=len(lib['records']);lib['reviewedAt']=DATE
for name,data in [('general-edition.json',ed),('library.json',lib),('clinical-conditions.json',conditions),('oxtr-il6-research-register.json',reg),('il6-mental-health-research-register.json',mental)]: (D/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
fields=['key','recordId','title','authors','year','journal','doi','pmid','group','domain','design','maskingDetail','sample','summary','limitation','sourceAccess','supplied','studyFamilyId','evidenceRole','countedMentalHealthPublication','urls','linkedNotices']
for name,rows in [('oxtr-il6-research-register.csv',reg['records']),('il6-mental-health-research-register.csv',records)]:
 with (D/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
  for r in rows:w.writerow({k:json.dumps(r.get(k),ensure_ascii=False) if isinstance(r.get(k),(list,dict)) else r.get(k,'') for k in fields})
report={'sources':162,'expansionPublications':120,'directMentalHealthPublications':117,'contextual':3,'topics':len(chapter['topics']),'newDomains':mental['domainCounts'],'randomizedReports':sum(r['randomizedControlledTrial'] for r in records),'doubleBlindReports':sum(r['randomizedControlledTrial'] and r['blinding']=='double' for r in records),'fullTextPassageAppraisals':mental['fullTextPassagesReviewed'],'linkedCorrectionNotices':sum(bool(r['linkedNotices']) for r in records),'wordCountNewNarrative':len(' '.join(p for t in topics for p in t['paragraphs']).split()),'wordCountSourceAppraisals':len(' '.join(r['summary']+' '+r['limitation'] for r in records).split())}
(HERE/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
