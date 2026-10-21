#!/usr/bin/env python3
"""Build the approved Sound edition without changing the source archive or scores."""
import difflib
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'Informatics/library-data'
PLAN = ROOT / 'research/informatics/library/sound-editorial-decisions-20261022.json'
CACHE = Path('/private/tmp/informatics-library-audit/sound-pages.json')
plan = json.loads(PLAN.read_text())
library = json.loads((DATA / 'library.json').read_text())
source = json.loads((DATA / 'sound-source.json').read_text())
pages = {p['page']: p for p in source['pages']}
if not CACHE.exists():
 raise SystemExit('Positioned Sound text is required to preserve emphasis. Run tools/extract-informatics-library.py first.')
raw = {p['page']: p for p in json.loads(CACHE.read_text())}
starts = {'i':6,'ii':15,'iii':17,'vii':51,'viii':61,'ix':62,'x':70,'xi':72,'xii':75,'xiv':77,'xviii':84,'xix':89,'xx':90,'xxi':92,'xxii':106,'xxiii':107,'xxiv':109,'xxv':110,'xxvi':111,'xxvii':112,'xxviii':113,'xxix':116,'xxx':120,'xxxi':126,'xxxii':130,'xxxiii':138,'xxxiv':142}
notes = {
 'ii':'Salivary hormones, gene expression in rat brain tissue and outcomes in cultured cells are different measures. Each study retains its own experimental context.',
 'xi':'The receptor studies in this section include animal experiments and specific NMDA receptor subunits.',
 'xii':'The selected passage reports IL6 changes in both the resting control group and the music-making group.',
 'xiv':'Stimulation frequencies are included as a research reference for brain entrainment. TMS and sound use different mechanisms; transfer between them remains a research question.',
 'xxix':'These studies examine oxytocin pathways and their relationships with dopamine and serotonin. SLC6A4 encodes the serotonin transporter.',
 'xxx':'These studies examine associations between OXTR variation and psychological resources or social behaviour.',
 'xxxi':'The effects reported here depend on the study population, setting and social context.'
}
def flat(text):
 return ' '.join(str(text or '').split())

def quotation(text, page_numbers):
 """Preserve the selected wording and only bold spans present in the source PDF."""
 words = [w for n in page_numbers for w in raw.get(n,{}).get('words',[]) if 100 < w['top'] < 770]
 tokens = list(re.finditer(r'\S+',text))
 matcher = difflib.SequenceMatcher(None,[w['text'] for w in words],[t.group() for t in tokens],autojunk=False)
 bold = set()
 for a,b,size in matcher.get_matching_blocks():
  if size < 2: continue
  for j in range(size):
   if 'Bold' in words[a+j]['fontname']: bold.add(b+j)
 spans=[];position=0
 for i,t in enumerate(tokens):
  end=t.end()
  value=text[position:end]
  emphasis=i in bold
  if spans and spans[-1]['emphasis']==emphasis:spans[-1]['text']+=value
  else:spans.append({'text':value,'emphasis':emphasis})
  position=end
 if position<len(text):spans.append({'text':text[position:],'emphasis':False})
 assert ''.join(s['text'] for s in spans)==text
 return spans

def journal_name(r,a):
 text=flat(a['sourceText']);title=flat(a['title'])
 after=text.split(title,1)[-1] if title in text else ''
 journal=after.split('http',1)[0].strip()
 if not journal or len(journal)>160 or re.search('National Cent|NCBI|PubMed',journal,re.I):journal=r.get('journal') or ''
 journal=re.sub(r'\s*:\s*international medical journal.*','',journal,flags=re.I)
 return journal[:1].upper()+journal[1:]

chapters=[];audit=[];omitted=[]
for chapter in plan['chapters']:
 out={'number':chapter['number'],'title':chapter['title'],'topics':[]}
 for idx,sub in enumerate(chapter['subchapters'],1):
  start=starts[sub['sourceSubchapter']]
  topic={'id':sub['sourceSubchapter'],'number':f"{chapter['number']}.{idx}",'title':sub['title'],'trustScore':pages[start]['sectionGrade'],'sourcePage':start,'context':notes.get(sub['sourceSubchapter'],''),'papers':[]}
  for r in library['records']:
   for a in r.get('archiveEntries',[]):
    if a['collection']!='sound' or a['sectionPage'] not in [start,*sub.get('additionalSectionPages',[])]:continue
    quotes=a.get('originalNote','').split('\n\n') if a.get('originalNote') else []
    paper={'id':f"{topic['id']}-{r['id']}",'recordId':r['id'],'title':a['title'],'journal':journal_name(r,a),'year':r.get('year'),'authors':r.get('authors',''),'design':a.get('sourceDesign') or '', 'urls':a.get('urls',[]),'quotes':[quotation(q,a['pages']) for q in quotes], 'citationCount':None,'sourcePages':a['pages'],'targets':r.get('targets',[]),'categories':r.get('categories',[]),'doi':r.get('doi'),'pmid':r.get('pmid')}
    if topic['id'] in ['iii','xviii','xix'] and (r.get('pmid') or str(r.get('verification','')).startswith('Crossref')):
     # Use the existing checked bibliographic record to repair line-break truncation.
     paper.update(title=r['title'],journal=r.get('journal') or paper['journal'])
     if r.get('doi'):paper['urls']=list(dict.fromkeys(['https://doi.org/'+r['doi'],*paper['urls']]))
    if r['id']=='src-944ec8023c08':
     paper.update(title='New Perspectives of Bioelectromagnetics in Biology and in Medicine: DNA Spectra for Diagnostic Purposes',journal='Journal of Physics: Conference Series',doi='10.1088/1742-6596/329/1/012011',year=2011,urls=['https://doi.org/10.1088/1742-6596/329/1/012011',*paper['urls']])
    if r['id']=='src-5aaad2520e3b':
     paper.update(journal='Journal of Physics: Conference Series',year=2011,doi='10.1088/1742-6596/306/1/012007',urls=['https://doi.org/10.1088/1742-6596/306/1/012007',*paper['urls']])
    count=re.search(r'citations:\s*(\d[\d,]*)',a.get('historicalCitationCount') or '',re.I)
    if count:paper['citationCount']=int(count[1].replace(',',''))
    if r['id']=='src-8ad1130190f0':
     paper.update(title='Theta-Burst Transcranial Magnetic Stimulation for Posttraumatic Stress Disorder',journal='American Journal of Psychiatry',year=2019,authors='',design='Randomized controlled trial',urls=['https://pubmed.ncbi.nlm.nih.gov/31230462/'],doi='10.1176/appi.ajp.2019.18101160',pmid='31230462')
     paper['quotationReview']={'index':2,'text':'The frequency sentence in the source PDF contains a unit error: 5 Hz is five cycles per second. It is retained below for review, separately from the article excerpts.','url':'https://www.nature.com/articles/s41386-019-0584-4'}
     audit.append({'record':r['id'],'change':'Reconciled the title and publication link with PMID 31230462. Isolated the source frequency sentence for review; quotation text retained.'})
    if r.get('pmid')=='16314076':
     paper['quotationReview']={'index':0,'text':'The source PDF adds “at 10hz” to the selected sentence. The publisher’s abstract does not include that phrase in its finding. The source wording is retained below for review.','url':'https://www.sciencedirect.com/science/article/abs/pii/S0920996405004767'}
     audit.append({'record':r['id'],'change':'Flagged the frequency insertion in the selected source wording without rewriting the quotation.'})
    # Source-page order is the reading order, independent of metadata sorting.
    source_text=flat(pages[a['pages'][0]]['text'])
    needle=flat(quotes[0] if quotes else a['title'])
    position=source_text.find(needle)
    if position<0:position=source_text.find(flat(a['title']))
    paper['_order']=(a['pages'][0],position if position>=0 else 999999)
    topic['papers'].append(paper)
  topic['papers'].sort(key=lambda p:p['_order'])
  seen_ids=set()
  for p in topic['papers']:
   del p['_order']
   if p['id'] in seen_ids:p['id']+='-p'+str(p['sourcePages'][0])
   seen_ids.add(p['id'])
  assert topic['papers'],topic['id']
  out['topics'].append(topic)
 chapters.append(out)

portal_topics={'portal-e25cb1d2bb79':'i','pmid-39004412':'i','pmid-40547443':'vii','pmid-40655918':'vii','portal-75ae9eff6740':'ii'}
portal_integrations=[]
for r in library['records']:
 if r['id'] not in portal_topics:continue
 topic=next(t for c in chapters for t in c['topics'] if t['id']==portal_topics[r['id']])
 note=r['portalNotes'][0]
 if r['id']=='portal-75ae9eff6740':
  paper=next(p for p in topic['papers'] if p['title']=='Effect of 528 Hz Music on the Endocrine System and Autonomic Nervous System')
  paper['aliases']=[r['id']]
  if note['url'] not in paper['urls']:paper['urls'].append(note['url'])
  paper['design']=r.get('sourceDesign') or paper['design']
  paper['year']=paper['year'] or r['year']
  action='Merged with the existing PDF paper; no duplicate entry.'
 else:
  paper={'id':f"{topic['id']}-{r['id']}",'recordId':r['id'],'title':r['title'],'journal':r.get('journal') or '', 'year':r.get('year'),'authors':r.get('authors') or '', 'design':r.get('sourceDesign') or '', 'urls':r['urls'],'quotes':[],'citationCount':None,'sourcePages':[],'targets':r.get('targets',[]),'categories':r.get('categories',[]),'doi':r.get('doi'),'pmid':r.get('pmid')}
  topic['papers'].append(paper)
  action='Integrated after the original papers in the relevant topic.'
 paper['summary']=note['finding']
 paper['limitation']=note['limitation']
 paper['summarySource']={'name':'I AM portal','url':note['url'],'reviewedAt':note['sourceReviewedAt']}
 portal_integrations.append({'record':r['id'],'topic':topic['id'],'action':action})

edition={'title':'Sound research','chapters':chapters,'source':'Sound Medical Research','sourceSHA256':hashlib.sha256((DATA/'sound-source.json').read_bytes()).hexdigest()}
edition['paperCount']=sum(len(t['papers']) for c in chapters for t in c['topics'])
edition['topicCount']=sum(len(c['topics']) for c in chapters)
edition['uniquePaperCount']=len({p['recordId'] for c in chapters for t in c['topics'] for p in t['papers']})
assert len(chapters)==len(plan['chapters'])
assert edition['topicCount']==sum(len(c['subchapters']) for c in plan['chapters'])
assert not re.search(r'ascension|111\s*hz|internet of happiness|epigenetics of happiness',json.dumps(edition),re.I)
(DATA/'sound-edition.json').write_text(json.dumps(edition,ensure_ascii=False,indent=2)+'\n')
(ROOT/'research/informatics/library/sound-narrative-audit-20261022.json').write_text(json.dumps({'counts':{k:edition[k] for k in ['paperCount','topicCount','uniquePaperCount']},'omittedFromRetainedTopics':omitted,'citationCorrections':audit,'portalIntegrations':portal_integrations,'trustScores':'Original subsection scores preserved. No article scores added. The IL6 subsection has no score in the PDF. Scores describe the original topic appraisal, not an assessment of later additions.','quotations':'Selected wording preserved; source bold emphasis recovered from positioned PDF text. Known frequency discrepancies are isolated for review.','sourceFilesModified':False,'frequencyPassageReview':'Two disputed frequency passages are retained in structured data for editorial review and omitted from displayed quotations.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:edition[k] for k in ['paperCount','topicCount','uniquePaperCount']}))
