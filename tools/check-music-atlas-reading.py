"""Check source fidelity, raw HTML availability and complete music exports."""
from pathlib import Path
from html.parser import HTMLParser
import csv, io, json, re, subprocess, hashlib, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'Informatics'
data=json.loads((SITE/'music-atlas/music-atlas.json').read_text())
html=(SITE/'index.html').read_text()
baseline=subprocess.check_output(['git','show','26ca796910c25c21f98d01b74f614a57f21ec60f:Informatics/index.html'],cwd=ROOT,text=True)
clean=html
for kind in ['METADATA','MACHINE','DOWNLOADS']:
    clean=re.sub(r'<!-- MUSIC ATLAS '+kind+r' START -->[\s\S]*?<!-- MUSIC ATLAS '+kind+r' END -->\n?','',clean)
assert re.sub(r'>\s+<','><',clean).strip()==re.sub(r'>\s+<','><',baseline).strip(),'Existing human page changed'
for rel in ['atlas-visuals.js','atlas.css','music-measurement.js','music-measurement.css']:
    previous=subprocess.check_output(['git','show','26ca796910c25c21f98d01b74f614a57f21ec60f:Informatics/'+rel],cwd=ROOT)
    assert (SITE/rel).read_bytes()==previous,rel

class Document(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.tables=0;self.models=[];self.links=[];self.json_blocks={};self.current=None;self.in_machine=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if a.get('id')=='music-atlas-machine':assert 'hidden' in a and a['aria-hidden']=='true'
        if tag=='table':self.tables+=1
        if 'data-music-model' in a:self.models.append(a['data-music-model'])
        if tag=='a':self.links.append(a)
        if tag=='script' and a.get('type') in ['application/json','application/ld+json']:
            self.current=a['id'];self.json_blocks[self.current]=''
    def handle_data(self,text):
        if self.current:self.json_blocks[self.current]+=text
    def handle_endtag(self,tag):
        if tag=='script':self.current=None

d=Document();d.feed(html)
assert len(d.ids)==len(set(d.ids)),'Duplicate IDs'
assert len(d.models)==6 and d.tables>=8
assert json.loads(d.json_blocks['music-atlas-data'])==data
assert len(json.loads(d.json_blocks['music-atlas-structured'])['hasPart'])==6
assert [m['id'] for m in data['models']]==['sequence','melody','scale','chromatic','fifths','tuning']
assert data['models'][0]['table']['rows']==[[n,n//9,n%9] for n in [4,8,16,32,64,128]]
assert data['geometry']['phrase_rotation']==[4,8,7,5,1,2]
assert data['geometry']['gamma_alpha_values']==[9,3,3,9,6,6]
for ref in data['settings']['frequencies']:
    for n in ref['notes']:assert n['frequency_hz']==ref['A4_hz']*2**((n['semitones_above_C4']-9)/12)
assert len(data['measurement']['figures'])==3
for fig in data['measurement']['figures']:assert (SITE/fig['image']).exists()
assert data['source']['sha256']==hashlib.sha256((SITE/'atlas-visuals.js').read_bytes()).hexdigest()

def typed(kind,value):
    return None if kind=='null' else value=='true' if kind=='boolean' else float(value) if kind=='number' else [] if kind=='array' else {} if kind=='object' else value
restored=None
for row in csv.DictReader(io.StringIO((SITE/'music-atlas/music-atlas.csv').read_text())):
    value=typed(row['type'],row['value'])
    if not row['path']:restored=value;continue
    keys=[p.replace('~1','/').replace('~0','~') for p in row['path'].split('/')[1:]]
    parent=restored
    for key in keys[:-1]:parent=parent[int(key)] if isinstance(parent,list) else parent[key]
    if isinstance(parent,list):assert int(keys[-1])==len(parent);parent.append(value)
    else:parent[keys[-1]]=value
assert restored==data,'CSV does not reconstruct full JSON'
wiki=(SITE/'read/music/index.html').read_text()
md=(SITE/'music-atlas/music-atlas.md').read_text()
assert '|  |' not in md,'Missing Markdown table headers'
assert '| Order | Figure | Description | Image |' in md
w=Document();w.feed(wiki)
assert len(w.models)==6 and w.tables>=8
assert '<script' not in wiki
for model in data['models']:
    assert model['title'] in wiki and model['title'] in md
    assert model['description'] in md
for text in [wiki,html]:
    for fmt in ['json','csv','md']:assert f'download="music-atlas.{fmt}"' in text
assert not re.search(r'\b(?:should|could|would|shouldn’t|couldn’t|wouldn’t)\b',md,re.I)
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
old_map=subprocess.check_output(['git','show','26ca796910c25c21f98d01b74f614a57f21ec60f:sitemap.xml'],cwd=ROOT,text=True)
old_urls={n.text for n in ET.fromstring(old_map).findall('s:url/s:loc',ns)}
new_urls={n.text for n in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc',ns)}
assert old_urls<=new_urls,'Existing discovery URLs were removed'
assert data['wiki'] in new_urls
assert 'read/music/index.html' in (SITE/'llms.txt').read_text()
assert 'read/music/index.html' in (ROOT/'llms.txt').read_text()
assert 'music/index.html' in (SITE/'read/index.html').read_text()
report={'passed':True,'raw_html_models':len(d.models),'raw_html_tables':d.tables,'inline_json_matches_download':True,'structured_models':6,'csv_full_reconstruction':True,'wiki_without_javascript':True,'human_source_unchanged_except_authorized_footer':True,'existing_runtime_unchanged':True,'downloads_on_primary_and_wiki':True}
out=ROOT/'research/informatics/music-ai-20261031';out.mkdir(parents=True,exist_ok=True)
(out/'source-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
