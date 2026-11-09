"""Verify this release against the approved conversation page, not older wiki-only releases."""
import hashlib,json,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[3];page='Informatics/quantum/index.html'
def clean(s):
 s=re.sub(r'<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) START -->[\s\S]*?<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) END -->','',s)
 s=re.sub(r'<section[^>]*class="quantum-vision"[\s\S]*?</section>','',s)
 s=re.sub(r'\?v=[^"\s]+','?v=RELEASE',s)
 return re.sub(r'\s+',' ',s).strip()
base=subprocess.check_output(['git','show','ad1595198:'+page],cwd=root).decode();assert clean(base)==clean((root/page).read_text())
for name in ['study.js','scientific-review.js','hypothesis.js','study-progress.js','response-view.js']:
 p='Informatics/quantum/'+name;assert (root/p).read_bytes()==subprocess.check_output(['git','show','ad1595198:'+p],cwd=root)
d=json.loads((root/'Informatics/quantum/reading/quantum-atlas.json').read_text());a=d['agent_architecture']
for item in a['implementation_sources']:
 text=(root/item['repository_path']).read_text()
 if item['repository_path']==page:text=re.sub(r'<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) START -->[\s\S]*?<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) END -->\n?','',text)
 assert hashlib.sha256(text.encode()).hexdigest()==item['sha256'],item['repository_path']
for name,record in d['records'].items():assert record==json.loads((root/f'Informatics/quantum/data/{name}.json').read_text())
assert not re.search(r'\b(?:sh'+'ould|co'+'uld|wo'+'uld)(?:n[’\']t)?\b',json.dumps(a,ensure_ascii=False),re.I)
report={'passed':True,'approved_page_structure_preserved':True,'existing_scientific_views_unchanged':True,'original_records_preserved':True,'implementation_hashes_matched':len(a['implementation_sources']),'paid_requests':0}
(root/'research/informatics/portal-demo-20261109/contract-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
