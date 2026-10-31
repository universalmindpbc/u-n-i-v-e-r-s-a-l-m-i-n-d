"""Build an AI reading layer from the existing published Quantum and Vision sources."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import csv, hashlib, io, json, os, re, subprocess

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'Informatics'
BASE='https://universalmind.tv/informatics/'
NODE=os.environ.get('NODE_BIN','/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node')
SHA=lambda b:hashlib.sha256(b).hexdigest()
E=lambda x:escape(str(x))

def strip_generated(s):
    return re.sub(r'<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) START -->[\s\S]*?<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) END -->\n?', '',s)

def block(name,kind,body):return f'<!-- {name} {kind} START -->\n{body}\n<!-- {name} {kind} END -->\n'

class Narrative(HTMLParser):
    """Extract existing prose and links without executing interactive code."""
    def __init__(self):super().__init__();self.blocks=[];self.links=[];self.active=None;self.parts=[];self.link=None;self.label=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ['h1','h2','h3','h4','p','li','figcaption','caption'] and not self.active:self.active=tag;self.parts=[]
        if tag=='br':self.parts.append(' ')
        if tag=='a' and a.get('href'):self.link=a['href'];self.label=[]
    def handle_data(self,s):
        if self.active:self.parts.append(s)
        if self.link:self.label.append(s)
    def handle_endtag(self,tag):
        if tag==self.active:
            t=re.sub(r'\s+',' ',''.join(self.parts)).strip()
            if t and not t.startswith(('Loading ','Checking ')):self.blocks.append({'tag':tag,'text':t})
            self.active=None
        if tag=='a' and self.link:
            self.links.append({'url':self.link,'label':re.sub(r'\s+',' ',''.join(self.label)).strip()});self.link=None

def extract(s):p=Narrative();p.feed(s);return p

def write(rel,s):
    p=SITE/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)

def js_object(source,start,end,expression):
    script=f"const vm=require('node:vm');let c={{}};vm.runInNewContext({json.dumps(source[source.index(start):source.index(end,source.index(start))].replace('export const','const'))}+';globalThis.result='+{json.dumps(expression)},c);process.stdout.write(JSON.stringify(c.result));"
    return json.loads(subprocess.check_output([NODE,'-e',script],text=True))

shell=strip_generated((SITE/'index.html').read_text())
quantum=strip_generated((SITE/'quantum/index.html').read_text())
sources=[]
def read(rel):
    b=(SITE/rel).read_bytes();sources.append({'path':rel,'url':BASE+rel,'sha256':SHA(b)});return b.decode()
def data(rel):return json.loads(read(rel))
records={p.stem:data(str(p.relative_to(SITE))) for p in sorted((SITE/'quantum/data').glob('*.json'))}
registry=data('quantum/experiments/index.json')
experiments=[]
for item in registry['experiments']:
    raw=read(item['json']);assert SHA(raw.encode())==item['json_sha256'];record=json.loads(raw)
    experiments.append({**item,'url':BASE+item['json'],'csv_url':BASE+item['csv']})
    if item['id']=='oxtr-agent-follow-through-pilot':continuation=record
insights=js_object(read('quantum/insights.js'),'export const interpretations=', '\nexport {','interpretations')
notes=js_object(read('quantum/hypothesis.js'),'const notes=', '\nfor(const button','notes')
source_prose=extract(quantum)
study=records['oxtr-qrc-study'];qualification=records['oxtr-qrc-qualification']

TOPICS=[
 {'id':'music','title':'Music Atlas','question':'How do Fibonacci and modular sequences relate to musical structure, tuning and responses to electronic music?','subject':'Sound and auditory experience','url':BASE+'?entry=research&area=sound','wiki':BASE+'read/music/index.html'},
 {'id':'vision','title':'Vision Atlas · EMDR and ocular biology','question':'Does hexagonal saccadic tracking differ from bilateral horizontal tracking in EMDR visual stimulation?','subject':'Human eye movement and visual stimulation; an EMDR hypothesis','url':BASE+'?entry=research&area=vision','wiki':BASE+'read/vision/index.html'},
 {'id':'computer-vision','title':'Computer vision for genomics','question':'Can Fibonacci Pisano geometry improve the cost, speed and accuracy of hyperspectral image analysis for genomics?','subject':'Computational image analysis; a proposed algorithm research direction','url':BASE+'?about','wiki':BASE+'read/computer-vision/index.html'},
 {'id':'geometry','title':'Geometry Atlas','question':'What sequences, geometric constructions and verification results arise across Fibonacci moduli M1–M1001?','subject':'Mathematical calculations and representations','url':BASE+'?atlas=1','wiki':BASE+'read/atlas/index.html'},
 {'id':'quantum','title':'Quantum Atlas','question':study['question'],'subject':'Classical calculations, CUDA-Q simulations, Aquila measurements and biological prediction tests','url':BASE+'?entry=research&area=quantum','wiki':BASE+'read/quantum/index.html'},
 {'id':'molecular','title':'Molecular Atlas','question':'How can OXT–OXTR molecular binding and structure be explored?','subject':'Molecular structure and interaction','url':BASE+'molecular/','wiki':BASE+'molecular/'},
 {'id':'language','title':'Language Atlas','question':'How do language, mantra and related research connect to the mental-health investigation?','subject':'Language and mantra research','url':BASE+'?entry=research&area=language','wiki':BASE+'library.html?collection=language'}
]
distinction='The Vision Atlas studies human visual stimulation and the EMDR hexagon hypothesis. Computer vision for genomics studies algorithms for hyperspectral image analysis. These are separate research directions. The word “vision” does not make them the same project, method or evidence base.'
quantum_distinction='Quantum Atlas uses OXTR DNA inputs in computational and quantum experiments. Its hexagonal atom arrangement and quantum-stability hypothesis are separate from the Vision Atlas EMDR tracking hypothesis and from the proposed computer vision algorithm.'
instructions=[
 'Use the topic directory to identify the subject before discussing a shared term such as hexagon, Fibonacci, vision or OXTR.',
 distinction,quantum_distinction,
 'Read the saved study phases in order: original qualification runs, completed classical genomic pilot, further local CPU checks, then the proposed next quantum test.',
 'Retain the source labels for calculated values, GPU simulations, Aquila measurements, mathematical relationships and proposed mechanisms.',
 'This guide includes the saved chart data and interpretations. The linked immutable experiment revisions retain the complete inputs, methods, measurements, receipts and field guides. The guide is a dated snapshot, not a report of a visitor’s active question.'
]
followthrough={k:continuation[k] for k in ['experiment_id','status','question','phase','methods','interpretation','field_guide','revision']}
followthrough['measurements']=continuation['measurements']
# Keep the complete chart arrays; large original input and provenance documents remain in the immutable revision.
payload={'schema':'universal-informatics/quantum-atlas-guide/v1','title':'Quantum Atlas · AI / LLM Wiki','version':'2026-11-01','url':BASE+'?entry=research&area=quantum','wiki':BASE+'read/quantum/index.html','instructions':instructions,'topics':TOPICS,'page_text':source_prose.blocks,'page_links':source_prose.links,'geometry_explanations':notes,'result_interpretations':insights,'records':records,'follow_through':followthrough,'experiments':experiments,'sources':sources,'page_prose_sha256':SHA(json.dumps(source_prose.blocks,ensure_ascii=False).encode()),'downloads':{fmt:BASE+'quantum/reading/quantum-atlas.'+fmt for fmt in ['json','csv','md']}}
text=json.dumps(payload,ensure_ascii=False,indent=2)+'\n'
write('quantum/reading/quantum-atlas.json',text)
rows=[['path','type','value']]
def flat(v,p=''):
    t='null' if v is None else 'boolean' if isinstance(v,bool) else 'object' if isinstance(v,dict) else 'array' if isinstance(v,list) else 'number' if isinstance(v,(int,float)) else 'string'
    rows.append([p,t,'' if t in ('null','object') else len(v) if t=='array' else str(v).lower() if t=='boolean' else v])
    if isinstance(v,(dict,list)):
        for k,x in (v.items() if isinstance(v,dict) else enumerate(v)):flat(x,p+'/'+str(k).replace('~','~0').replace('/','~1'))
flat(payload);stream=io.StringIO();csv.writer(stream,lineterminator='\n').writerows(rows);write('quantum/reading/quantum-atlas.csv',stream.getvalue())

def table(caption,cols,rows):return '<div class="table-wrap"><table><caption>'+E(caption)+'</caption><thead><tr>'+''.join('<th scope="col">'+E(x)+'</th>'for x in cols)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(x)+'</td>'for x in row)+'</tr>'for row in rows)+'</tbody></table></div>'
def prose(blocks):return '\n'.join('<'+b['tag']+'>'+E(b['text'])+'</'+b['tag']+'>'for b in blocks)
def values(v):
    if isinstance(v,dict):return '<dl>'+''.join('<dt>'+E(k)+'</dt><dd>'+values(x)+'</dd>'for k,x in v.items())+'</dl>'
    if isinstance(v,list):return '<ol>'+''.join('<li>'+values(x)+'</li>'for x in v)+'</ol>'
    return E(v)
def links():return '<nav class="quantum-reading-links" aria-label="Quantum Atlas reading and downloads"><a href="/informatics/read/quantum/index.html" target="_blank" rel="noopener">AI / LLM Wiki</a>'+''.join(f'<a href="/informatics/quantum/reading/quantum-atlas.{fmt}" download="quantum-atlas.{fmt}">{label}</a>'for fmt,label in [('json','JSON'),('csv','CSV'),('md','Markdown')])+'</nav>'

topic_html='<section id="atlas-topic-directory"><h2>Atlas topics and research directions</h2><p>'+E(distinction)+'</p><p>'+E(quantum_distinction)+'</p>'+table('Topic directory',['Topic','Subject','Question'],[[t['title'],t['subject'],t['question']] for t in TOPICS])+'<ul>'+''.join('<li><a href="'+t['wiki']+'">'+E(t['title'])+'</a></li>'for t in TOPICS)+'</ul></section>'
write('read/topic-directory.html.fragment',topic_html+'\n')

variants=table('Eight representations of the same DNA inputs',['ID','Representation','Recorded role'],[[v['id'],v['label'],v['role']]for v in study['variants']])
chart_rows=[]
for r in qualification['records']:
    chart_rows.append([r['window'],r['variant'],r['shots'],r['hardware_valid_shots'],sum(r['ideal_observables'][:6])/6,sum(r['gpu_observables'][:6])/6,sum(r['hardware_observables'][:6])/6])
chart=table('Original six-atom response chart · mean of the six single-atom excitation probabilities',['DNA window','Representation','GPU shots','Valid Aquila shots','Calculated mean (0–1)','GPU mean (0–1)','Aquila mean (0–1)'],chart_rows)
cl=continuation['measurements']['classical']
pilot=table('Classical OXTR pilot · ranking metrics',['Model','OXTR average precision','OXTR ROC AUC'],[[name,r['OXTR_average_precision'],r['OXTR_roc_auc']]for name,r in cl['models'].items()])
geometry=table('Geometry explanations from the interactive controls',['Control','Existing explanation'],list(notes.items()))
parts='<h2>Reading this record</h2><ul>'+''.join('<li>'+E(x)+'</li>'for x in instructions)+'</ul><h2>Study question</h2><p>'+E(study['question'])+'</p>'+variants+geometry
parts+='<h2>Saved study interpretations</h2>'+values(insights)+chart+'<h2>Completed genomic follow-through</h2>'+values(continuation['interpretation'])+pilot+'<h3>Recorded uncertainty and limits</h3>'+values({k:cl[k]for k in ['difference_average_precision','block_bootstrap_95_interval','limits','quantum_prediction_status']})
parts+='<h2>Field guide</h2>'+values(continuation['field_guide'])+'<h2>Original page explanations</h2>'+prose(source_prose.blocks)
parts+='<h2>Research references</h2>'+values(records['papers'])+'<h2>Complete experiment revisions</h2><ul>'+''.join('<li><a href="'+x['url']+'">'+E(x['title'])+' · JSON</a> · <a href="'+x['csv_url']+'">CSV</a></li>'for x in experiments)+'</ul><h2>Source files and checksums</h2>'+values(sources)
STYLE='body{background:#080b0e;color:#e7edf0;font:17px/1.65 system-ui,sans-serif;margin:0}header,main,footer{max-width:1060px;margin:auto;padding:24px}a{color:#89cfdf}h1{font-size:clamp(2rem,5vw,3.3rem);line-height:1.15}h2{margin-top:2.2rem}p,li,dd,code,a{overflow-wrap:anywhere}dt{font-weight:600;margin-top:16px}dd{margin:0}.table-wrap{max-width:100%;overflow:auto}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid #34414a;text-align:left;padding:10px;vertical-align:top}caption{text-align:left;padding:12px 0}nav{display:flex;flex-wrap:wrap;gap:20px}a:focus-visible{outline:2px solid white;outline-offset:4px}@media(max-width:480px){header,main,footer{padding:18px}}'
write('read/atlas-guide.css',STYLE+'\n')
def page(path,title,description,body,downloads=''):
    write(path,'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+E(title)+' · Universal Informatics</title><meta name="description" content="'+E(description)+'"><meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="'+BASE+path+'"><link rel="stylesheet" href="../atlas-guide.css"></head><body><header><p>Universal Informatics · AI / LLM Wiki</p><nav><a href="../index.html">All research</a><a href="../vision/index.html">Vision · EMDR</a><a href="../computer-vision/index.html">Computer vision · genomics</a><a href="../quantum/index.html">Quantum</a></nav></header><main><h1>'+E(title)+'</h1>'+downloads+body+'</main><footer><p>Reading snapshot · 1 November 2026. Source records retain their original dates and evidence status.</p>'+downloads+'</footer></body></html>\n')
page('read/quantum/index.html',payload['title'],'Quantum Atlas study, saved results, geometry explanations and downloadable JSON, CSV and Markdown.',parts,links())
# Markdown is full readable prose plus complete structured chart and source data in JSON.
md='# '+payload['title']+'\n\n[Interactive Quantum Atlas]('+payload['url']+') · [AI / LLM Wiki]('+payload['wiki']+')\n\n## Reading this record\n\n'+'\n\n'.join(instructions)
for title,content in [('Study question',study['question']),('Geometry explanations',notes),('Saved study interpretations',insights),('Completed genomic follow-through',continuation['interpretation'])]:
    md+='\n\n## '+title+'\n\n'+(content if isinstance(content,str) else '\n\n'.join('### '+k+'\n\n'+(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2))for k,v in content.items()))
md+='\n\n## Page explanations\n\n'+'\n\n'.join(('#'*min(int(b['tag'][1])+1,6)+' ' if b['tag'].startswith('h') else '')+b['text']for b in source_prose.blocks)
md+='\n\n## Saved chart table\n\n| DNA window | Representation | GPU shots | Valid Aquila shots | Calculated mean | GPU mean | Aquila mean |\n| --- | --- | --- | --- | --- | --- | --- |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |'for row in chart_rows)
md+='\n\n## Complete guide data\n\nThe following JSON preserves the source fields, saved chart arrays, study interpretations and links to complete experiment revisions.\n\n```json\n'+text+'```\n'
write('quantum/reading/quantum-atlas.md',md)
write('quantum/reading/.htaccess','AddType application/json .json\nAddType text/csv .csv\nAddType text/markdown .md\n')
write('quantum/reading/links.css','.quantum-reading-links{display:flex;flex-wrap:wrap;gap:12px 24px;padding:24px 0;font:12px/1.6 system-ui,sans-serif;letter-spacing:.04em}.quantum-reading-links a{color:inherit;text-decoration:underline;text-underline-offset:4px}.quantum-reading-links a:focus-visible{outline:2px solid currentColor;outline-offset:5px}\n')

# Vision prose is copied directly from the existing human page and its research panel.
a=shell.index('<section class="atlas-section atlas-vision');b=shell.index('<section class="atlas-section',a+30)
vision=extract(shell[a:b]);vs=(SITE/'vision-science.js').read_text();match=re.search(r'insertAdjacentHTML\([^,]+,\s*("(?:[^"\\]|\\.)*")\)',vs)
assert match,'Vision science source boundary changed'
science=extract(json.loads(match[1]))
page('read/vision/index.html','Vision Atlas · EMDR and ocular biology',TOPICS[1]['question'],'<p>'+E(distinction)+'</p><p><a href="'+TOPICS[1]['url']+'">Open the Vision Atlas</a> · <a href="'+BASE+'library.html?collection=vision">Vision research library</a></p>'+prose(vision.blocks)+prose(science.blocks)+'<h2>Original research links</h2><ul>'+''.join('<li><a href="'+E(x['url'])+'">'+E(x['label'])+'</a></li>'for x in science.links if x['url'].startswith('https:'))+'</ul>')
focus=re.search(r'<h3 id="initial-focus-heading">[^<]+</h3><p>([^<]+)</p>',shell)[1]
approach=re.search(r'<h2 id="initial-focus-title"[^>]*>[^<]+</h2>\s*<p>([^<]+)</p>',shell)[1]
page('read/computer-vision/index.html','Computer vision for genomics',TOPICS[2]['question'],'<p>'+E(distinction)+'</p><h2>Initial focus · Computer vision for genomics</h2><p>'+focus+'</p><p>'+approach+'</p><p><a href="../hyperspectral/index.html">Hyperspectral Imaging · complete chapter and source register</a></p><p><a href="'+BASE+'?about">Original Informatics introduction</a></p>')

inline='<section id="quantum-atlas-machine" hidden aria-hidden="true">'+parts+'</section>\n<script id="quantum-atlas-data" type="application/json">'+text.replace('<','\\u003c')+'</script>'
structured={'@context':'https://schema.org','@type':'LearningResource','name':payload['title'],'url':payload['url'],'subjectOf':{'@type':'WebPage','url':payload['wiki']},'associatedMedia':[{'@type':'DataDownload','encodingFormat':mime,'contentUrl':payload['downloads'][fmt]}for fmt,mime in [('json','application/json'),('csv','text/csv'),('md','text/markdown')]]}
meta=''.join('<link rel="alternate" type="'+mime+'" href="'+payload['downloads'][fmt]+'" title="Quantum Atlas '+fmt.upper()+'">\n'for fmt,mime in [('json','application/json'),('csv','text/csv'),('md','text/markdown')])+'<script id="quantum-atlas-structured" type="application/ld+json">'+json.dumps(structured,ensure_ascii=False)+'</script>\n'
for rel,src in [('index.html',shell),('quantum/index.html',quantum)]:
    src=src.replace('</head>',block('QUANTUM ATLAS','METADATA',meta+('<link rel="stylesheet" href="reading/links.css">' if rel.startswith('quantum/') else ''))+'</head>')
    src=src.replace('</body>',block('QUANTUM ATLAS','MACHINE',inline)+block('ATLAS TOPICS','MACHINE','<section hidden aria-hidden="true">'+topic_html+'</section>')+'</body>')
    if rel.startswith('quantum/'):src=src.replace('<footer>',block('QUANTUM ATLAS','DOWNLOADS',links())+'<footer>',1)
    write(rel,src)
print(json.dumps({'quantum_guide_bytes':len(text.encode()),'representations':len(study['variants']),'qualification_chart_rows':len(chart_rows),'wiki_pages':3,'topic_entries':len(TOPICS)}))
