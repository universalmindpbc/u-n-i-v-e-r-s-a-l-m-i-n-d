"""Verify native About fidelity, topic scope and consistent reading formats."""
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
import json,re,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'Informatics';OUT=ROOT/'research/informatics/wiki-focus-20261101';OUT.mkdir(parents=True,exist_ok=True)
BASE='c51547542a70e8b7d1ca9baeefe59099ad9e8220'
class Prose(HTMLParser):
 def __init__(self):super().__init__();self.active=None;self.items=[];self.parts=[]
 def handle_starttag(self,t,a):
  if t in ['p','h3']and not self.active:self.active=t;self.parts=[]
 def handle_data(self,s):
  if self.active:self.parts.append(s)
 def handle_endtag(self,t):
  if t==self.active:
   value=re.sub(r'\s+',' ',''.join(self.parts)).strip()
   if value:self.items.append(value)
   self.active=None
source=(SITE/'index.html').read_text();start=source.index('<section id="about"');end=source.index('</dialog>',source.index('<dialog id="initial-focus"',start))+9
p=Prose();p.feed(source[start:end]);approved=[x for x in p.items if x not in ['About']]
overview=(SITE/'read/index.html').read_text();main=(ROOT/'read/index.html').read_text();md=(SITE/'llms.txt').read_text();rootmd=(ROOT/'llms.txt').read_text();data=json.loads((ROOT/'read/resources.json').read_text());project=next(x for x in data['projects']if x['id']=='informatics')
for value in approved:
 assert value in unescape(overview),value
 assert value in unescape(main),value
 assert value in md and value in rootmd,value
 assert value in json.dumps(project,ensure_ascii=False),value
assert overview.index('Does modular compression')<overview.index('id="atlas-topic-directory"')
assert overview.index('Wolfram is our planned')<overview.index('id="atlas-topic-directory"')
catalog=overview.split('id="atlas-topic-directory"',1)[1].split('</section>',1)[0]
topics=json.loads((ROOT/'tools/atlas-topic-directory.json').read_text())
assert len(topics)==7
for topic in topics:assert catalog.count('href="'+topic['wiki']+'"')==1,topic['id']
assert '<h2>Music Atlas</h2>'not in overview and '<h2>Geometry Atlas</h2>'not in overview
forbidden=['The Vision Atlas studies human visual stimulation','These are separate research directions','The word “vision” does not make them','separate from EMDR','Use the topic directory to identify the subject','Its hexagonal atom arrangement and quantum-stability hypothesis are separate']
paths=list((SITE/'read').rglob('*.html'))+list((SITE/'music-atlas').glob('music-atlas.*'))+list((SITE/'quantum/reading').glob('quantum-atlas.*'))+[SITE/'llms.txt',SITE/'index.html',SITE/'quantum/index.html',ROOT/'llms.txt',ROOT/'read/index.html',ROOT/'read/resources.json']
for path in paths:
 if path.suffix not in ['.html','.json','.csv','.md','.txt']:continue
 value=path.read_text()
 assert not any(x in value for x in forbidden),str(path)
q=json.loads((SITE/'quantum/reading/quantum-atlas.json').read_text())
assert 'topics'not in q
assert not re.search(r'EMDR|computer vision|hyperspectral',json.dumps(q,ensure_ascii=False),re.I)
assert len(q['agent_architecture']['features'])==10 and len(q['agent_architecture']['swarm']['roles'])==10
for name in ['music','vision','computer-vision','quantum']:
 text=(SITE/f'read/{name}/index.html').read_text()
 assert 'atlas-topic-directory'not in text
 if name in ['music','computer-vision','quantum']:assert 'EMDR'not in text,name
# Previously approved source and numerical records stay intact.
for path in ['Informatics/music-atlas/music-atlas.json','Informatics/music-atlas/music-atlas.csv','Informatics/music-atlas/music-atlas.md','Informatics/atlas-visuals.js','Informatics/vision-science.js','Informatics/quantum/study.js','Informatics/quantum/agent.js']:
 assert (ROOT/path).read_bytes()==subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT),path
for rel in ['Informatics/index.html','Informatics/quantum/index.html']:
 def clean(s):return re.sub(r'<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) START -->[\s\S]*?<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) END -->\n?','',s)
 assert clean((ROOT/rel).read_text())==clean(subprocess.check_output(['git','show',BASE+':'+rel],cwd=ROOT,text=True)),rel
report={'passed':True,'approved_about_texts_matched':len(approved),'main_wiki_about_first':True,'equally_presented_atlas_entries':len(topics),'reading_files_audited':len(paths),'cross_topic_boilerplate_absent':True,'quantum_exports_have_only_quantum_context':True,'music_formats_preserved_and_focused':True,'native_experience_and_runtime_preserved':True}
(OUT/'source-focus.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
