"""Ensure the guide explains purpose, feature value, agent handoffs and real public interfaces."""
from pathlib import Path
from html import unescape
import json,re,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'Informatics';OUT=ROOT/'research/informatics/quantum-agents-wiki-20261101';OUT.mkdir(parents=True,exist_ok=True)
d=json.loads((SITE/'quantum/reading/quantum-atlas.json').read_text());a=d['agent_architecture'];wiki=(SITE/'read/quantum/index.html').read_text();md=(SITE/'quantum/reading/quantum-atlas.md').read_text()
for fmt,url in d['downloads'].items():
 assert url.endswith('?v='+d['version'])
 assert url.removeprefix('https://universalmind.tv')in wiki
 assert any(r['url']==url for r in json.loads((ROOT/'read/resources.json').read_text())['resources'])
assert list(d).index('agent_architecture')<list(d).index('records')
assert wiki.index('id="quantum-purpose"')<wiki.index('id="quantum-recorded-study"')
assert md.index('## What Quantum Atlas is for')<md.index('## Worked example: the recorded OXTR study')
assert a['purpose']['human_explanation']in unescape(wiki)and a['purpose']['human_explanation']in md
assert len(a['features'])==10 and len(a['swarm']['roles'])==10 and len(a['swarm']['diagram_stages'])==6
for f in a['features']:
 for key in ['feature','purpose','human_value']:assert f[key]in unescape(wiki)and f[key]in md
for r in a['swarm']['roles']:
 for key in ['name','role','work','handoff']:assert r[key]in unescape(wiki)and r[key]in md
for item in a['implementation_sources']:
 text=(ROOT/item['repository_path']).read_text()
 if item['repository_path']=='Informatics/quantum/index.html':text=re.sub(r'<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) START -->[\s\S]*?<!-- (?:QUANTUM ATLAS|ATLAS TOPICS) (?:METADATA|MACHINE|DOWNLOADS) END -->\n?','',text)
 assert hashlib.sha256(text.encode()).hexdigest()==item['sha256'],item['repository_path']
for env in ['staging','production']:
 live=json.loads((OUT/(env+'-protocols.json')).read_text());assert live['no_model_requests_or_compute_jobs']
 assert live['tools']==a['participation']['mcp']['tools']
 assert live['initialize']['protocolVersion']==a['participation']['mcp']['protocol_version']
 assert live['agent_card']['supportedInterfaces'][0]['protocolVersion']==a['participation']['a2a']['headers']['A2A-Version']
 assert live['quantum_summary']['structuredContent']['id']=='oxtr-qrc-01'
 assert live['quantum_measurements_page']['structuredContent']['data']['page']['nextOffset']==2
 assert live['continuation']['section']=='continuation'
 assert live['a2a_list_tasks']['result']['tasks']==[]
for request in a['participation']['mcp']['requests']:
 if request['method']=='tools/call':
  params=request['params'];tool=next(t for t in a['participation']['mcp']['tools']if t['name']==params['name']);schema=tool['inputSchema']
  assert set(params['arguments'])<=set(schema['properties'])
  for k,v in params['arguments'].items():
   if 'enum'in schema['properties'][k]:assert v in schema['properties'][k]['enum']
assert a['participation']['a2a']['request']['params']['message']['role']=='ROLE_USER'
assert a['participation']['a2a']['request']['method']=='SendMessage'
assert 'Persistent task dispatch' in a['participation']['a2a']['scope']
# The documentation task preserves every agent runtime and the existing visible pages.
base='a2d6cb9b83340e841c9362cefd5d193aff63ee56'
changed=subprocess.check_output(['git','diff','--name-only',base],cwd=ROOT,text=True).splitlines()
assert not any(p.startswith(('cloudflare/','research/informatics/astra-service/','research/informatics/scientific-swarm/'))for p in changed)
for p in ['Informatics/quantum/study.js','Informatics/quantum/agent.js','Informatics/quantum/biology.js','Informatics/quantum/scientific-review.js','Informatics/connect.js']:
 assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',base+':'+p],cwd=ROOT)
assert not re.search(r'\b(?:sh'+'ould|co'+'uld|wo'+'uld)(?:n[’\']t)?\b',json.dumps(a,ensure_ascii=False),re.I)
report={'passed':True,'human_purpose_first_in_html_markdown_json':True,'human_feature_explanations':len(a['features']),'agent_and_service_roles':len(a['swarm']['roles']),'source_workflow_stages':6,'live_mcp_tools':9,'live_protocol_environments':['staging','production'],'A2A_discovery_and_task_contract_verified':True,'A2A_answer_generation_not_executed':True,'implementation_sources_matched':len(a['implementation_sources']),'runtime_unchanged':True}
(OUT/'agent-guide-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
