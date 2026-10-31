"""Verify public delivery of the exact committed guide, data and discovery paths."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import os, subprocess, hashlib, json, re
ROOT=Path(__file__).resolve().parents[1];BASE=os.environ.get('QA_BASE','https://staging.universalmind.tv').rstrip('/');MODE='staging' if 'staging.'in BASE else 'production';OUT=ROOT/'research/informatics/quantum-wiki-20261101';OUT.mkdir(parents=True,exist_ok=True)
def request(route,agent='Mozilla/5.0 AtlasReadingVerification'):
    return subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--retry','2','--max-time','60','--user-agent',agent,BASE+'/'+route])
files=['index.html','home/index.html','read/index.html','read/resources.json','llms.txt','sitemap.xml','Informatics/index.html','Informatics/llms.txt','Informatics/read/index.html','Informatics/read/reading.css','Informatics/read/atlas-guide.css','Informatics/read/quantum/index.html','Informatics/read/vision/index.html','Informatics/read/computer-vision/index.html','Informatics/quantum/index.html','Informatics/quantum/reading/links.css','Informatics/exports/manifest.json','Informatics/read/music/index.html']+[f'Informatics/quantum/reading/quantum-atlas.{x}' for x in ['json','csv','md']]+[f'Informatics/music-atlas/music-atlas.{x}'for x in ['json','csv','md']]
def verify(source):
    route=source.replace('Informatics/','informatics/',1);actual=request(route);expected=(ROOT/source).read_bytes();assert actual==expected,route
    return {'path':route,'bytes':len(actual),'sha256':hashlib.sha256(actual).hexdigest()}
with ThreadPoolExecutor(max_workers=6)as pool:checks=list(pool.map(verify,files))
d=json.loads((ROOT/'Informatics/quantum/reading/quantum-atlas.json').read_text());agents=['ChatGPT-User/1.0','Googlebot','Claude-User','PerplexityBot','AtlasReadingVerification/1.0']
def agent_check(agent):
    s=request('informatics/?entry=research&area=quantum',agent).decode();inline=re.search(r'<script id="quantum-atlas-data" type="application/json">([\s\S]*?)</script>',s);assert inline and json.loads(inline[1])==d
    assert d['instructions'][1]in s;return agent
with ThreadPoolExecutor(max_workers=5)as pool:list(pool.map(agent_check,agents))
headers={}
for ext,mime in [('json','application/json'),('csv','text/csv'),('md','text/markdown')]:
    h=subprocess.check_output(['curl','--fail','--silent','--show-error','--head',BASE+'/informatics/quantum/reading/quantum-atlas.'+ext],text=True).lower();assert mime in h,h
    assert ('noindex'in h)==(MODE=='staging'),h
    headers[ext]=mime
robots=request('robots.txt').decode();assert ('Disallow: /*'in robots)==(MODE=='staging')
protected=None
if MODE=='production':
    protected=subprocess.check_output(['curl','--silent','--output','/dev/null','--write-out','%{http_code}',BASE+'/informatics/review/domestic-violence-20261031/index.html'],text=True);assert protected=='403',protected
report={'passed':True,'base':BASE,'files':checks,'ordinary_page_request_user_agents':agents,'user_agent_checks_are_http_delivery_tests_not_external_provider_sessions':True,'topic_separation_in_initial_html':True,'download_content_types':headers,'staging_excluded':MODE=='staging','production_review_http_status':protected}
(OUT/(MODE+'-http.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':True,'base':BASE,'files_byte_matched':len(checks),'user_agents':len(agents),'content_types':headers,'protected_review':protected}))
