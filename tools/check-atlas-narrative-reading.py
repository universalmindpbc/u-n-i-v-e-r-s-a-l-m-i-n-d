"""Audit narrative coverage, reading order, lossless exports and unchanged numerical sources."""
from pathlib import Path
from html import unescape
import csv,json,re,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'Informatics';OUT=ROOT/'research/informatics/wiki-focus-20261101'
def text(s):return ' '.join(unescape(re.sub('<[^>]+>','',s)).split())
def restore(path):
 result=None
 for row in csv.DictReader(path.open()):
  t,v=row['type'],row['value'];v=None if t=='null' else v=='true' if t=='boolean' else float(v) if t=='number' else [] if t=='array' else {} if t=='object' else v
  if not row['path']:result=v;continue
  ks=[k.replace('~1','/').replace('~0','~') for k in row['path'].split('/')[1:]];parent=result
  for k in ks[:-1]:parent=parent[int(k)] if isinstance(parent,list) else parent[k]
  if isinstance(parent,list):assert int(ks[-1])==len(parent);parent.append(v)
  else:parent[ks[-1]]=v
 return result
required={
 'vision':['EMDR | Vision Sciences','Are hexagonal animations more natural','We hypothesise that a hexagonally structured saccadic tracking pattern'],
 'computer-vision':['Initial focus · Computer vision for genomics','Inspired by research into how geometric architectures','A measurable first step','Our proposed approach explores equilateral triangular meshes'],
 'language':['Language & molecular biology','From mantra and meditation','Mantra & meditation','Talking therapies','Human communication'],
 'molecular':['Explore the molecular atlas.','Eight starting points. Explore their genes','The molecular encounter','Explore oxytocin at its receptor'],
 'transcription':['Our priority is transcription factor binding sites','Understanding Binding Sites and our approach','How binding sites help make the OXTR receptor','Binding-site geometry','Where the data comes from'],
 'geometry':['Fibonacci sequence','Alpha','24 native Fibonacci residues','Beta','Interior interval sums','Gamma','Primary nodal geometry','Epsilon','A continuous unicursal hexagram']}
reports=[]
for id,phrases in required.items():
 p=SITE/f'atlas-guides/{id}-atlas.json';d=json.loads(p.read_text());wiki=SITE/('read/atlas/index.html' if id=='geometry' else f'read/{id}/index.html');h=wiki.read_text();plain=text(h);md=p.with_suffix('.md').read_text();narr='\n'.join(b['text'] for b in d['page_narrative'])
 assert restore(p.with_suffix('.csv'))==d,id
 for source in d['sources']:
  raw=(SITE/source['path']).read_text()
  if source['sha256_scope']!='Exact file bytes':raw=re.sub(r'<!-- ATLAS NARRATIVE (?:MACHINE|METADATA|DOWNLOADS) START -->[\s\S]*?<!-- ATLAS NARRATIVE (?:MACHINE|METADATA|DOWNLOADS) END -->\n?','',raw)
  assert hashlib.sha256(raw.encode()).hexdigest()==source['sha256'],(id,source['path'])
 assert list(d).index('page_narrative')<list(d).index('source_data'),id
 last=-1
 for phrase in phrases:
  pos=narr.find(phrase,last+1);assert pos>last,(id,phrase);last=pos
 for b in d['page_narrative']:
  assert b['text'] in plain,(id,b['text'])
  if b['tag']=='figure':assert b['image'] in md
  else:
   # Markdown links retain the words and their original destinations.
   mdtext=re.sub(r'\[([^\]]*)\]\([^)]*\)',r'\1',md)
   assert b['text'] in mdtext,(id,b['text'])
 assert plain.index(d['page_narrative'][0]['text'])<plain.index('Source data'),id
 assert not re.search(r'\$\{|\b(?:should|could|would)\b',narr,re.I),id
 assert '<script' not in h,id
 reports.append({'topic':id,'source_blocks':len(d['page_narrative']),'json_csv_equal':True,'narrative_before_data':True,'all_source_blocks_in_wiki_and_markdown':True})
m=json.loads((SITE/'music-atlas/music-atlas.json').read_text());old=json.loads(subprocess.check_output(['git','show','c51547542a70e8b7d1ca9baeefe59099ad9e8220:Informatics/music-atlas/music-atlas.json'],cwd=ROOT))
for key in ['models','settings','geometry','measurement']:assert m[key]==old[key],key
assert list(m).index('page_narrative')<list(m).index('measurement')<list(m).index('models')
for rel in ['read/music/index.html','music-atlas/music-atlas.md','music-atlas/music-atlas.csv']:
 s=(SITE/rel).read_text();assert s.index('Does electronic music modulate gene expression')<s.index('Non-invasive measurement before mRNA sequencing')<s.index('Doubling the phrase'),rel
assert 'Reading this record' not in (SITE/'read/music/index.html').read_text()
g=json.loads((SITE/'atlas-guides/geometry-atlas.json').read_text())
assert len(g['source_data']['record_explanations'])==1001
for modulus,models in g['source_data']['record_explanations'].items():
 h=(SITE/f'read/atlas/m{modulus}.html').read_text();plain=text(h)
 for model in models:assert model['description'] in plain and model['calculation'] in plain,modulus
 assert h.index('<section>')<h.index('Complete record JSON'),modulus
# Original source datasets, scripts and primary UI retain their exact bytes.
changed=subprocess.check_output(['git','diff','--name-only','ca574ad4ac0cf9ad3f7d89a2aaf54c025ffe331e','--','Informatics'],cwd=ROOT,text=True).splitlines()
allowed=('Informatics/read/','Informatics/music-atlas/','Informatics/atlas-guides/','Informatics/exports/')
assert all(p.startswith(allowed) or p in ['Informatics/index.html','Informatics/llms.txt'] for p in changed),changed
report={'passed':True,'topics':reports,'music_source_and_measurement_preserved':True,'music_narrative_measurement_models_order':True,'geometry_records_with_native_explanations':1001,'primary_ui_runtime_and_scientific_data_unchanged':True}
(OUT/'narrative-source-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
