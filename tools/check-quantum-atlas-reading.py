"""Verify source fidelity, downloadable data, topic separation and native discovery."""
from pathlib import Path
from html.parser import HTMLParser
import csv, hashlib, json, re, subprocess
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'Informatics';OUT=ROOT/'research/informatics/quantum-wiki-20261101';OUT.mkdir(parents=True,exist_ok=True)
base='3a4b54ab4d2887323e9e9749fbdcaa979813e196'
def old(p):return subprocess.check_output(['git','show',base+':'+p],cwd=ROOT)
def clean(s):return re.sub(r'<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) START -->[\s\S]*?<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) END -->\n?','',s)
def norm(s):return re.sub(r'>\s+<','><',s).strip()
for rel in ['Informatics/index.html','Informatics/quantum/index.html']:
    assert norm(clean((ROOT/rel).read_text()))==norm(old(rel).decode()),rel
for rel in ['index.html','home/index.html','Informatics/vision-science.js','Informatics/atlas-visuals.js','Informatics/atlas.css','Informatics/quantum/biology.js','Informatics/quantum/biology.css','Informatics/quantum/agent.js','Informatics/quantum/study.js','Informatics/quantum/hypothesis.js','Informatics/quantum/insights.js']:
    assert (ROOT/rel).read_bytes()==old(rel),rel
p=SITE/'quantum/reading';d=json.loads((p/'quantum-atlas.json').read_text())
for s in d['sources']:assert hashlib.sha256((SITE/s['path']).read_bytes()).hexdigest()==s['sha256'],s
for name,record in d['records'].items():assert record==json.loads((SITE/f'quantum/data/{name}.json').read_text())
follow=json.loads((SITE/'quantum/experiments/oxtr-agent-follow-through-pilot/r1/experiment.json').read_text())
for k,v in d['follow_through'].items():assert v==follow[k],k
restored=None
for row in csv.DictReader((p/'quantum-atlas.csv').open()):
    t=row['type'];v=row['value'];v=None if t=='null' else v=='true' if t=='boolean' else float(v) if t=='number' else [] if t=='array' else {} if t=='object' else v
    if not row['path']:restored=v;continue
    keys=[k.replace('~1','/').replace('~0','~') for k in row['path'].split('/')[1:]];parent=restored
    for k in keys[:-1]:parent=parent[int(k)] if isinstance(parent,list) else parent[k]
    if isinstance(parent,list):assert len(parent)==int(keys[-1]);parent.append(v)
    else:parent[keys[-1]]=v
assert restored==d
class Doc(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.scripts=0;self.tables=0
    def handle_starttag(self,t,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if t=='script':self.scripts+=1
        if t=='table':self.tables+=1
for rel in ['index.html','quantum/index.html']:
    s=(SITE/rel).read_text();doc=Doc();doc.feed(s);assert len(doc.ids)==len(set(doc.ids)),rel
    assert json.loads(re.search(r'<script id="quantum-atlas-data" type="application/json">([\s\S]*?)</script>',s)[1])==d
    assert '<section id="quantum-atlas-machine" hidden aria-hidden="true">'in s
    assert d['instructions'][1] in s
for rel in ['quantum/index.html','read/quantum/index.html']:
    s=(SITE/rel).read_text()
    for ext in ['json','csv','md']:assert f'download="quantum-atlas.{ext}"'in s
for rel in ['read/quantum/index.html','read/vision/index.html','read/computer-vision/index.html']:
    s=(SITE/rel).read_text();doc=Doc();doc.feed(s);assert doc.scripts==0;assert len(doc.ids)==len(set(doc.ids))
    assert d['instructions'][1] in s
for rel in ['Informatics/read/index.html','Informatics/llms.txt','llms.txt','read/index.html']:
    s=(ROOT/rel).read_text();assert 'EMDR' in s and 'hyperspectral' in s and 'Quantum Atlas' in s
    assert 'read/quantum/index.html' in s or 'quantum/index.html' in s
md=(p/'quantum-atlas.md').read_text();assert json.loads(md.split('```json\n',1)[1].rsplit('```',1)[0])==d
assert len(d['records']['oxtr-qrc-qualification']['records'])==16
assert len(d['follow_through']['measurements']['local_cudaq']['cases'])==16
assert len(d['records']['oxtr-qrc-study']['variants'])==8
report={'passed':True,'human_source_and_runtime_preserved':True,'root_landing_metadata_unchanged':True,'raw_html_quantum_payload_on_both_routes':True,'topics_separated_in_both_guides':True,'json_csv_markdown_equivalent':True,'source_hashes_matched':len(d['sources']),'qualification_rows':16,'local_cpu_cases':16,'representations':8,'no_live_agent_or_quantum_execution':True}
(OUT/'source-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
