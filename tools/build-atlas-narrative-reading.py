"""Publish each Atlas's own prose before its data in HTML, Markdown, JSON and CSV."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
from urllib.parse import urljoin
import csv,io,json,re,subprocess,os,hashlib
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'Informatics';BASE='https://universalmind.tv/informatics/'
VERSION='2026-11-01-page-narrative-3'
NODE=os.environ.get('NODE_BIN','/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node')
E=lambda s:escape(str(s));SHA=lambda s:hashlib.sha256(s.encode()).hexdigest()
def read(p):return (SITE/p).read_text()
def write(p,s):
 f=SITE/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(s)
def clean(s):return re.sub(r'<!-- ATLAS NARRATIVE (?:MACHINE|METADATA|DOWNLOADS) START -->[\s\S]*?<!-- ATLAS NARRATIVE (?:MACHINE|METADATA|DOWNLOADS) END -->\n?','',s)
def marker(kind,s):return f'<!-- ATLAS NARRATIVE {kind} START -->\n{s}\n<!-- ATLAS NARRATIVE {kind} END -->\n'
class Prose(HTMLParser):
 def __init__(self,base=BASE):super().__init__();self.base=base;self.blocks=[];self.active=None;self.parts=[];self.skip=0;self.links=[];self.anchor=None
 def handle_starttag(self,t,a):
  a=dict(a)
  if t in ['script','style','svg','button','select']:
   self.skip+=1;return
  if self.skip:return
  if t in ['h1','h2','h3','h4','h5','h6','p','li','dt','dd','summary','figcaption'] and not self.active:self.active=t;self.parts=[];self.links=[]
  if t=='a' and a.get('href'):self.anchor={'url':urljoin(self.base,a['href']),'parts':[]}
  if t=='br' and self.active:self.parts.append(' ')
  if t=='img' and a.get('alt'):self.blocks.append({'tag':'figure','text':a['alt'],'image':urljoin(self.base,a['src'])})
 def handle_data(self,s):
  if self.skip:return
  if self.active:self.parts.append(s)
  if self.anchor:self.anchor['parts'].append(s)
 def handle_endtag(self,t):
  if t in ['script','style','svg','button','select']:
   self.skip=max(0,self.skip-1);return
  if self.skip:return
  if t=='a' and self.anchor:
   self.links.append({'label':' '.join(''.join(self.anchor['parts']).split()),'url':self.anchor['url']});self.anchor=None
  if t==self.active:
   text=' '.join(''.join(self.parts).split())
   if text and not text.startswith(('Loading ','Checking ','Preparing ')):
    block={'tag':t,'text':text}
    if self.links:block['links']=self.links
    self.blocks.append(block)
   self.active=None
 def result(self,s):self.feed(s);return self.blocks

def blocks(s,base=BASE):return Prose(base).result(s)
def html(bs):
 out=[]
 for b in bs:
  if b['tag']=='figure':out.append('<figure><img src="'+E(b['image'].replace('https://universalmind.tv',''))+'" alt="'+E(b['text'])+'" loading="lazy"><figcaption>'+E(b['text'])+'</figcaption></figure>');continue
  tag=b['tag'] if b['tag'].startswith('h') else 'p';tag='h2' if tag=='h1' else tag
  text=E(b['text'])
  for link in b.get('links',[]):
   if link['label']:text=text.replace(E(link['label']),'<a href="'+E(link['url'].replace('https://universalmind.tv',''))+'">'+E(link['label'])+'</a>',1)
  out.append('<'+tag+'>'+text+'</'+tag+'>')
 return '\n'.join(out)
def md(bs):
 out=[]
 for b in bs:
  if b['tag']=='figure':out.append('!['+b['text']+']('+b['image']+')');continue
  text=b['text']
  for link in b.get('links',[]):
   if link['label']:text=text.replace(link['label'],'['+link['label']+']('+link['url']+')',1)
  out.append(('#'*max(2,int(b['tag'][1]))+' ' if b['tag'].startswith('h') else '- ' if b['tag']=='li' else '')+text)
 return '\n\n'.join(out)
def flatten(v,p=''):
 t='null' if v is None else 'boolean' if isinstance(v,bool) else 'object' if isinstance(v,dict) else 'array' if isinstance(v,list) else 'number' if isinstance(v,(int,float)) else 'string'
 yield [p,t,'' if t in ('null','object') else len(v) if t=='array' else str(v).lower() if t=='boolean' else v]
 if isinstance(v,(dict,list)):
  for k,x in (v.items() if isinstance(v,dict) else enumerate(v)):yield from flatten(x,p+'/'+str(k).replace('~','~0').replace('/','~1'))
def section(source,start,end):return source[source.index(start):source.index(end,source.index(start)+len(start))]
def para(s,tag='p'):return {'tag':tag,'text':s}
extracted=json.loads(subprocess.check_output([NODE,str(ROOT/'tools/extract-atlas-page-narratives.mjs')],text=True))
shell=clean(read('index.html'));topics=json.loads((ROOT/'tools/atlas-topic-directory.json').read_text());byid={t['id']:t for t in topics}
guides={}
def add(id,narrative,source_paths,data=None,related=None):
 t=byid[id];downloads={f:BASE+'atlas-guides/'+id+'-atlas.'+f+'?v='+VERSION for f in ['json','csv','md']}
 guides[id]={'schema':'universal-informatics/atlas-page-guide/v1','title':t['title'],'version':VERSION,'url':t['url'],'wiki':t['wiki'],'page_narrative':narrative,'source_data':data or {},'related_data':related or [],'sources':[{'path':p,'url':BASE+p,'sha256':SHA(clean(read(p)))} for p in source_paths],'downloads':downloads}

v=blocks(section(shell,'<section class="atlas-section atlas-vision','<section class="atlas-section atlas-language'))
vs=read('vision-science.js');science=json.loads(re.search(r'insertAdjacentHTML\([^,]+,\s*("(?:[^"\\]|\\.)*")\)',vs)[1])
add('vision',v+blocks(science),['index.html','vision-science.js'],related=[{'label':'Vision research library','url':BASE+'library.html?collection=vision'}])
cv=section(shell,'<h3 id="initial-focus-heading"','</dialog>')
# Read the native focus paragraph, then the expanded research panel, without the other About topics.
focus=re.search(r'<h3 id="initial-focus-heading">[\s\S]*?</p>',cv)[0]
panel=section(shell,'<h2 id="initial-focus-title"','</dialog>')
add('computer-vision',blocks(focus+panel),['index.html'],related=[{'label':'Hyperspectral Imaging · complete chapter and source register','url':BASE+'read/hyperspectral/index.html'},{'label':'Hyperspectral source register JSON','url':BASE+'library-data/hyperspectral-register.json'},{'label':'Hyperspectral source register CSV','url':BASE+'library-data/hyperspectral-register.csv'}])
lang=section(shell,'<section class="atlas-section atlas-language','<section class="atlas-section',)
add('language',blocks(lang),['index.html'],related=[{'label':'Language research library','url':BASE+'library.html?collection=language'},{'label':'Language source collection','url':BASE+'library-data/language-source.json'},{'label':'Language research edition','url':BASE+'library-data/language-edition.json'}])
t=extracted['transcription'];catalogue=blocks(t['catalogue']);opening=catalogue[0]
comparison=blocks(t['comparison']);narrative=[opening]+blocks(t['learning'])+blocks(t['transcription'])+comparison+catalogue[1:]
add('transcription',narrative,['science.js','tfbs-geometry.js','pilot-v1/oxtr-tfbs-v1/catalogue.json','pilot-v1/oxtr-tfbs-v1/experiment-v1/manifest.json'],data={'catalogue':json.loads(read('pilot-v1/oxtr-tfbs-v1/catalogue.json')),'coordinate_experiment':json.loads(read('pilot-v1/oxtr-tfbs-v1/experiment-v1/manifest.json'))},related=[{'label':label,'url':BASE+'pilot-v1/oxtr-tfbs-v1/'+file} for file,label in [('oxtr-tfbs-json.zip','Complete source JSON'),('oxtr-tfbs-csv.zip','Complete source CSV'),('experiment-v1/methods.md','Coordinate methods'),('binding-outcomes.json','Binding evidence and priorities'),('study-additions-v1/braintf-peaks.csv','BrainTF observations')]])
research=read('research.html');m9models=extracted['geometry']['9']
geo=[para('Fibonacci sequence','h2'),para('M1–M1001 · core calculations verified'),para('M9 / P24','h2')]
for m in m9models:geo += [para(m['title'],'h2')]+[para(m[k]) for k in ['description','sequence','convention','calculation'] if m[k]]
geo+=blocks(section(research,'<section id="epsilon-hypothesis"','<div class="downloads"'))
geo+=blocks(section(research,'<section id="odom-view"','<div class="workspace"'))
geo+=blocks(section(research,'<section id="family-view"','<div class="intro"'))
geo+=blocks(section(research,'<section id="m9-comparison"','<details class="formation-details"><summary>Notable'))
geo=[b for b in geo if b['text'] not in ['M family','M9 FAMILY · COMPARATIVE GEOMETRY','MATHEMATICAL CONTEXT','PHI AND FIBONACCI']]
add('geometry',geo,['research.html','research.js','pilot-v1/index.json'],data={'record_explanations':extracted['geometry'],'records':json.loads(read('pilot-v1/index.json'))['records']},related=[{'label':label,'url':BASE+file} for file,label in [('pilot-v1/m1-m1001.json','Full M1–M1001 JSON'),('pilot-v1/m1-m1001-csv.zip','Complete CSV bundle'),('pilot-v1/m1-m1001-data.zip','Full data bundle'),('pilot-v1/m9-reduction-audit.json','Arithmetic audit')]])
mol=read('molecular/index.html');collection=section(mol,'<section id="collection-panel"','<section id="detail-panel"')
mn=blocks(collection,BASE+'molecular/')
mn+=blocks(section(mol,'<section id="representation-controls"','<section class="source-summary"'),BASE+'molecular/')
interaction=read('molecular/interaction-ui.js')
# Static explanatory paragraphs from the existing docking and orbital controls, in their native order.
for fragment in re.findall(r'<(?:h[234]|p)\b[^>]*>[\s\S]*?</(?:h[234]|p)>',interaction):
 if '${' not in fragment and not re.search(r'</?[^>]+>[^<]*[=;{]',fragment):mn+=blocks(fragment,BASE+'molecular/')
seen=set();mn=[b for b in mn if not (b['text'] in seen or seen.add(b['text']))]
add('molecular',mn,['molecular/index.html','molecular/interaction-ui.js','molecular/data/catalogue.json'],data={'collection':json.loads(read('molecular/data/catalogue.json')),'docking':json.loads(read('molecular/data/interactions/contact.json')),'calculated_orbitals':json.loads(read('molecular/data/interactions/quantum.json'))},related=[{'label':'Reference genes','url':BASE+'molecular/data/genes/index.json'}])

for id,d in guides.items():
 rel='atlas-guides/'+id+'-atlas';text=json.dumps(d,ensure_ascii=False,indent=2)+'\n';write(rel+'.json',text)
 stream=io.StringIO();w=csv.writer(stream,lineterminator='\n');w.writerow(['path','type','value']);w.writerows(flatten(d));write(rel+'.csv',stream.getvalue())
 links='<nav aria-label="Downloads">'+''.join('<a href="'+E(u.replace('https://universalmind.tv',''))+'" download="'+id+'-atlas.'+f+'">'+('Markdown' if f=='md' else f.upper())+' ↓</a>' for f,u in d['downloads'].items())+'</nav>'
 related='<h2>Source data</h2><ul>'+''.join('<li><a href="'+E(x['url'].replace('https://universalmind.tv',''))+'">'+E(x['label'])+'</a></li>' for x in d['related_data'])+'</ul>'
 body=html(d['page_narrative'])+related+links
 if id=='geometry':
  body+='<h2>Modulus records</h2><ul>'+''.join('<li><a href="m'+str(r['modulus'])+'.html">'+E(r['name'])+'</a></li>' for r in d['source_data']['records'])+'</ul>'
 else:
  for key,data in d['source_data'].items():body+='<details><summary>'+E(key.replace('_',' ').capitalize())+'</summary><pre>'+E(json.dumps(data,ensure_ascii=False,indent=2))+'</pre></details>'
 body+='<h2>Sources</h2><ul>'+''.join('<li><a href="'+E(x['url'].replace('https://universalmind.tv',''))+'">'+E(x['path'])+'</a> · SHA-256 <code>'+x['sha256']+'</code></li>' for x in d['sources'])+'</ul>'
 page='read/atlas/index.html' if id=='geometry' else 'read/'+id+'/index.html'
 write(page,'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+E(d['title'])+' · Universal Informatics</title><meta name="description" content="'+E(next(b['text'] for b in d['page_narrative'] if b['tag']=='p'))+'"><meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="'+d['wiki']+'"><link rel="stylesheet" href="../atlas-guide.css"><style>img{max-width:100%;height:auto}figure{margin:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}summary{cursor:pointer}details{margin:24px 0}</style></head><body><header><p>Universal Informatics · AI / LLM Wiki</p><nav><a href="../index.html">All research</a><a href="'+E(d['url'].replace('https://universalmind.tv',''))+'">Open '+E(d['title'])+'</a></nav></header><main><h1>'+E(d['title'])+'</h1>'+body+'</main><footer>'+links+'</footer></body></html>\n')
 markdown='# '+d['title']+'\n\n'+md(d['page_narrative'])+'\n\n## Source data\n\n'+'\n'.join('- ['+x['label']+']('+x['url']+')' for x in d['related_data'])
 markdown+='\n\n## Downloads\n\n'+' · '.join('['+f.upper()+']('+url+')' for f,url in d['downloads'].items())+'\n\n[Interactive page]('+d['url']+') · [Wiki]('+d['wiki']+')\n'
 if d['source_data']:markdown+='\n## Complete guide data\n\n```json\n'+json.dumps(d['source_data'],ensure_ascii=False,indent=2)+'\n```\n'
 markdown+='\n## Sources\n\n'+'\n'.join('- ['+x['path']+']('+x['url']+') · SHA-256: '+x['sha256'] for x in d['sources'])+'\n';write(rel+'.md',markdown)
# Static machine-readable context is present in the ordinary primary URL without changing its visual layout.
metadata=''.join('<link rel="alternate" type="'+{'json':'application/json','csv':'text/csv','md':'text/markdown'}[fmt]+'" title="'+E(d['title'])+'" href="'+url.replace('https://universalmind.tv','')+'">\n' for d in guides.values() for fmt,url in d['downloads'].items())
machine='\n'.join('<section hidden aria-hidden="true" id="'+id+'-page-narrative">'+html(d['page_narrative'])+'</section><script type="application/json" id="'+id+'-page-guide">'+json.dumps({k:v for k,v in d.items() if k!='source_data'},ensure_ascii=False).replace('<','\\u003c')+'</script>' for id,d in guides.items())
shell=shell.replace('</head>',marker('METADATA',metadata)+'</head>').replace('</body>',marker('MACHINE',machine)+'</body>');write('index.html',shell)
write('atlas-guides/.htaccess','AddType application/json .json\nAddType text/csv .csv\nAddType text/markdown .md\n')
# Shared build consumers use this source-derived prose for all 1,001 per-modulus reading pages.

print(json.dumps({'narrative_guides':len(guides),'paragraphs':{k:len(d['page_narrative']) for k,d in guides.items()},'geometry_records':len(extracted['geometry'])}))
