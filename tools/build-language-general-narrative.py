import json,re,difflib,copy,hashlib,argparse
from pathlib import Path
R=Path(__file__).resolve().parents[1]; D=R/'Informatics/library-data'; DOC=R/'research/informatics/library'
lib=json.loads((D/'library.json').read_text())['records']; byid={r['id']:r for r in lib}
source={c:{p['page']:p for p in json.loads((D/(c+'-source.json')).read_text())['pages']} for c in ['sound','language']}
parser=argparse.ArgumentParser(description='Build narrative editions from retained source text and positioned PDF extraction.');parser.add_argument('--page-cache',type=Path,default=Path('/private/tmp/informatics-library-audit'));args=parser.parse_args()
raw={c:{p['page']:p for p in json.loads((args.page_cache/(c+'-pages.json')).read_text())} for c in source}
access=json.loads((D/'publication-access.json').read_text())['records']
portal=json.loads((DOC/'language-approved-portal-20261023.json').read_text())
(DOC/'language-approved-portal-20261023.json').write_text(json.dumps(portal,ensure_ascii=False,indent=2)+'\n')
starts=dict(zip('i ii iii iv v vi vii viii ix x xi xii xiii xiv xv xvi xvii xviii'.split(),[4,11,17,18,22,24,29,34,36,42,47,49,50,54,55,65,69,71]))
titles=[
'Mantra meditation: cognition, creativity, mental health and cardiovascular outcomes',
'Meditation, mindfulness and related practices: gene expression and epigenetics',
'Oxytocin, OXTR variation and responses to meditation',
'Mindfulness and related practices: IL-6, inflammation and mental health',
'Meditation, telomeres, telomerase and epigenetic ageing',
'Molecular hydrogen: inflammation, cognition and gene expression',
'Mindfulness and meditation: brain function and clinical outcomes',
'Meditation, social connection and physiological synchrony',
'Meditation, yoga and biofeedback: heart-rate variability and autonomic regulation',
'Digital communication, conversational therapies and mental health',
'Mantra, mindfulness and psychological therapies with refugees',
'Mantra meditation: veterans, survivors of abuse and people living with HIV',
'Mindfulness and psychological support for people facing adversity',
'Meditation, mindfulness and yoga: the DVA evidence review',
'Digital access, social support and humanitarian technology',
'Homelessness, displacement and mental health',
'Aboriginal and Torres Strait Islander mental health and wellbeing',
'Military service, veterans and mental health']

def flat(v): return ' '.join(str(v or '').split())
def quote(text,c,ns):
 words=[w for n in ns for w in raw[c].get(n,{}).get('words',[]) if 100<w['top']<770]
 toks=list(re.finditer(r'\S+',text)); bold=set()
 for a,b,size in difflib.SequenceMatcher(None,[w['text'] for w in words],[t.group() for t in toks],autojunk=False).get_matching_blocks():
  if size<2: continue
  for j in range(size):
   if 'Bold' in words[a+j]['fontname']:bold.add(b+j)
 spans=[];pos=0
 for i,t in enumerate(toks):
  value=text[pos:t.end()];em=i in bold
  if spans and spans[-1]['emphasis']==em:spans[-1]['text']+=value
  else:spans.append(dict(text=value,emphasis=em))
  pos=t.end()
 if pos<len(text):spans.append(dict(text=text[pos:],emphasis=False))
 assert ''.join(s['text'] for s in spans)==text
 return spans

def bibliography(text):
 # Preserve every bibliography line, grouping numbered references and wrapped lines.
 lines=text.splitlines()[2:]; blocks=[];current=None
 for line in lines:
  if re.match(r'^(?:\d+\.|\*)\s',line):
   if current:blocks.append(current)
   current={'kind':'reference','text':line}
  elif current and (line[:1].islower() or re.search(r'\d{3,4}|^Journal|^University|^Activity|^Alcoholism',line) or line.startswith(('of ','and ','Hypertension','Outcomes','Psychology'))):current['text']+=' '+line
  else:
   if current:blocks.append(current);current=None
   blocks.append({'kind':'heading','text':line})
 if current:blocks.append(current)
 # This is an attributed bibliography; original wording stays intact for editorial proof.
 for block in blocks:
  if block['kind']=='heading':
   original=block['text'];block['originalHeading']=original
   block['text']=re.sub(r'^(Benefits (?:to|in)|Increased|Improved|Decreased|Reduced|Greater|Accelerated|Healthier|Lower|Faster)\s+','',original)
   block['text']=block['text'][:1].upper()+block['text'][1:]
 return blocks

def make_topic(c,tid,start,title):
 topic=dict(id=tid,title=title,trustScore=source[c][start].get('sectionGrade'),sourcePage=start,papers=[])
 for r in lib:
  for a in r.get('archiveEntries',[]):
   if a['collection']!=c or a['sectionPage']!=start:continue
   original=flat(a['sourceText']);t=flat(a['title']);journal=original.split(t,1)[-1].split('http',1)[0].strip() if t in original else ''
   if not journal or len(journal)>160 or re.search('National Cent|NCBI|PubMed',journal,re.I):journal=r.get('journal') or ''
   q=a.get('originalNote','').split('\n\n') if a.get('originalNote') else []
   count=re.search(r'citations:\s*(\d[\d,]*)',a.get('historicalCitationCount') or '',re.I)
   p=dict(id=c+'-'+tid+'-'+r['id'],recordId=r['id'],title=a['title'],journal=journal[:1].upper()+journal[1:],year=r.get('year'),authors=r.get('authors',''),design=a.get('sourceDesign') or '',urls=a.get('urls',[]),quotes=[quote(x,c,a['pages']) for x in q],citationCount=int(count[1].replace(',','')) if count else None,sourcePages=a['pages'],targets=r.get('targets',[]),categories=r.get('categories',[]),doi=r.get('doi'),pmid=r.get('pmid'))
   if r['id'] in ['src-2c770034898e','src-005e909caead']:
    p['bibliography']=bibliography(a['sourceText']);p['bibliographyAttribution']='David Lynch Foundation research bibliography';p['design']='Research bibliography';p['journal']=''
   if r['id']=='src-005e909caead':p['bibliographyNote']='The Military Medicine 176 (2011), 626–630 paper studied veterans. It does not establish findings specific to women and girls.'
   loc=flat(source[c][a['pages'][0]]['text']).find(flat(q[0] if q else a['title']))
   p['_order']=(a['pages'][0],loc if loc>=0 else 999999)
   topic['papers'].append(p)
 topic['papers'].sort(key=lambda p:p['_order'])
 seen=set()
 for p in topic['papers']:
  del p['_order']
  if p['id'] in seen:p['id']+='-p'+str(p['sourcePages'][0])
  seen.add(p['id'])
 assert topic['papers'],(c,tid,start)
 return topic

topics={tid:make_topic('language',tid,start,title) for (tid,start),title in zip(starts.items(),titles)}
# Preserve the original three body chapters and all eighteen subordinate topics.
chapters=[{'number':1,'title':'Mantra, mindfulness and molecular biology','topics':[topics[t] for t in list(starts)[:6]]},{'number':2,'title':'Mindfulness, physiology and mental health','topics':[topics[t] for t in list(starts)[6:10]]},{'number':3,'title':'Mental health, communities and access to care','topics':[topics[t] for t in list(starts)[10:]]}]
for ch in chapters:
 for i,t in enumerate(ch['topics'],1):t['number']=str(ch['number'])+'.'+str(i)
for r in lib:
 if not r.get('portalNotes') or 'language' not in r.get('collections',[]):continue
 hero=next((h for h in portal['layer']['heroStudies'] if h['doi'].lower()==str(r.get('doi','')).lower()),None)
 if not hero:continue
 target=topics['i']
 p=next((p for t in topics.values() for p in t['papers'] if p['recordId']==r['id']),None)
 if not p:
  p=dict(id='language-i-'+r['id'],recordId=r['id'],title=r['title'],journal=r.get('journal') or hero['journal'],year=r.get('year') or hero['year'],authors=r.get('authors',''),design=hero['type'],urls=r['urls'],quotes=[],citationCount=None,sourcePages=[],targets=r.get('targets',[]),categories=r.get('categories',[]),doi=r.get('doi'),pmid=r.get('pmid'))
  target['papers'].append(p)
 p['summary']=hero['finding'];p['limitation']=hero['limitation']
# The research expansion is separate from original topics and their agreed trust scores.
expansion=json.loads((D/'mindfulness-expansion.json').read_text())['records']
newtopics=[]
for group,title in [('rna','Mindfulness interventions and gene expression'),('epigenetics','Mindfulness, DNA methylation and genetic variation'),('clinical','Mindfulness-based interventions: controlled clinical trials')]:
 t={'id':'mindfulness-'+group,'title':title,'trustScore':None,'papers':[]}
 for r in expansion:
  if r['researchGroup']!=group:continue
  t['papers'].append(dict(id='language-'+t['id']+'-'+r['id'],recordId=r['id'],title=r['title'],journal=r['journal'],year=r['year'],authors=r.get('authors',''),design=r['design'],urls=r['urls'],quotes=[],summary=r['finding'],limitation=r['limitation'],citationCount=None,sourcePages=[],targets=r['targets'],categories=r['categories'],doi=r.get('doi'),pmid=r.get('pmid'),evidence=r['evidence']))
 newtopics.append(t)
chapters.append({'number':4,'title':'Mindfulness: molecular studies and clinical trials','topics':newtopics})
language={'title':'Language research','chapters':chapters,'introduction':{'paragraphs':['Language research begins with mindfulness-based stress reduction, initially with a focus on mantra meditation. In the future, this section will include nonviolent communication, emotional intelligence and talking therapies.']},'sourceSHA256':hashlib.sha256((D/'language-source.json').read_bytes()).hexdigest()}

def clone_topic(t,c):
 t=copy.deepcopy(t);t['id']=c+'-'+t['id'];t['sharedFrom']=c
 for p in t['papers']:p['id']='general-'+p['id']
 return t
sound=json.loads((D/'sound-edition.json').read_text());st={t['id']:t for ch in sound['chapters'] for t in ch['topics']}
deferred=json.loads((DOC/'deferred-placement-20261022.json').read_text())['topics']; ds={'xxiv':109,'xxv':110,'xxvi':111,'xxvii':112,'xxviii':113,'xxxii':130,'xxxiii':138,'xxxiv':142}
dt={t['subchapter']:make_topic('sound',t['subchapter'],ds[t['subchapter']],t['heading']) for t in deferred}
groups=[('Oxytocin pathways and social connection',[clone_topic(st[t],'sound') for t in ['xxix','xxx','xxxi']]+[clone_topic(topics['iii'],'language')]),('Schumann resonance and electromagnetic research',[clone_topic(st[t],'sound') for t in ['iii','xviii','xix']]),('Molecular hydrogen',[clone_topic(topics['vi'],'language')]),('Digital health, communication and access',[clone_topic(topics[t],'language') for t in ['x','xv']]+[clone_topic(dt['xxxiv'],'sound')]),('Population health and wellbeing',[clone_topic(topics[t],'language') for t in ['xvi','xvii','xviii']]),('Visual interventions and art therapy',[clone_topic(dt[t],'sound') for t in ['xxiv','xxv','xxvi','xxvii']]),('Computing, trust and economics',[clone_topic(dt[t],'sound') for t in ['xxviii','xxxii','xxxiii']])]
general={'title':'General research','chapters':[dict(number=i,title=title,topics=ts) for i,(title,ts) in enumerate(groups,1)]}
for e,name in [(language,'language'),(general,'general')]:
 for ch in e['chapters']:
  for i,t in enumerate(ch['topics'],1):t['number']=str(ch['number'])+'.'+str(i)
 e['paperCount']=sum(len(t['papers']) for ch in e['chapters'] for t in ch['topics']);e['topicCount']=sum(len(ch['topics']) for ch in e['chapters']);e['uniquePaperCount']=len({p['recordId'] for ch in e['chapters'] for t in ch['topics'] for p in t['papers']})
 (D/(name+'-edition.json')).write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n')
 print(name,{k:e[k] for k in ['paperCount','topicCount','uniquePaperCount']})
plan={'status':'Staging editorial draft for Ben to proof','date':'2026-10-23','bodyTopics':[{'id':tid,'page':start,'originalHeading':next(a['section'] for r in lib for a in r.get('archiveEntries',[]) if a['collection']=='language' and a['sectionPage']==start),'proposedHeading':topics[tid]['title'],'trustScore':topics[tid]['trustScore'],'retained':True} for tid,start in starts.items()],'indexOnlyLinks':[{'id':'xix','destination':'Vision / EMDR','bodyArticles':0},{'id':'xx','destination':'Sound','bodyArticles':0}],'exclusions':[],'scoreReview':[{'topic':'xvi','indexScore':1,'bodyScore':2,'displayedScore':2,'decision':'Original body score retained for joint proof.'},{'topic':'xiv','score':3,'decision':'Original score retained. The paper is a government evidence review; the score is not a new article-level design claim.'}],'quotationPolicy':'Original excerpts and emphasis retained. No AI rewrites. Two foundation bibliography records preserve their full reference content with attribution.','generalCrossListing':'Shared record identities; Sound and Language memberships retained. Previously deferred topics available in General. Explicit prior Sound exclusions remain excluded.','scope':['Mantra-based meditation','Mindfulness','Nonviolent communication','Emotional intelligence','Talking components of psychology','Talking components of psychotherapy'],'terminology':{'mind':'Broader scope','thoughts':'Reader-facing term','language':'The language we think and the language we say','MBSR':'Specific clinical programme; distinguish from mantra-based meditation'},'reviewNotes':['OXTR variation and intranasal oxytocin studies do not establish changes in OXTR transcription.','IL-6 protein and IL6 gene expression are separate measures; no blanket claim of reduced inflammation or symptoms.','Telomere and epigenetic-clock measures do not establish longer life.','Gene-expression engineering study PMID 25386727 uses an EEG-controlled optogenetic implant; native human transcription is not the measured mechanism.','DVA recommendations retain historical context; avoid a blanket current clinical recommendation.','Page 49 foundation bibliography reuses a veteran pilot citation under women and girls; the original attribution is visible, pending review.','Mindfulness population statistics retain their study dates and are not presented as current prevalence.','No current claim that TM has the largest evidence base. AHRQ 2007 supports historical prominence; 2025 bibliometrics show contemporary mindfulness predominance.']}
(DOC/'language-editorial-decisions-20261023.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
