"""Verify the deployed Music Atlas data from normal unauthenticated HTTP requests."""
from pathlib import Path
import subprocess, json, hashlib, re

ROOT=Path(__file__).resolve().parents[1]
BASE='https://staging.universalmind.tv/'
OUT=ROOT/'research/informatics/music-ai-20261031'
def request(route,agent=None):
    args=['curl','--fail','--silent','--show-error','--location','--max-time','90']
    if agent:args+=['--user-agent',agent]
    return subprocess.check_output(args+[BASE+route])
files=['Informatics/index.html','Informatics/music-atlas/music-atlas.json','Informatics/music-atlas/music-atlas.csv','Informatics/music-atlas/music-atlas.md','Informatics/music-atlas/reading-links.css','Informatics/read/music/index.html','Informatics/read/index.html','Informatics/read/data.html','Informatics/llms.txt','Informatics/exports/manifest.json','read/index.html','read/resources.json','llms.txt','sitemap.xml']
checks=[]
for source in files:
    route=source.replace('Informatics/','informatics/',1)
    actual=request(route);expected=(ROOT/source).read_bytes()
    assert actual==expected,route
    checks.append({'path':route,'bytes':len(actual),'sha256':hashlib.sha256(actual).hexdigest()})
record=json.loads((ROOT/'Informatics/music-atlas/music-atlas.json').read_text())
agents=['ChatGPT-User/1.0','Googlebot','Claude-User','PerplexityBot','MusicAtlasReader/1.0']
for agent in agents:
    html=request('informatics/?entry=research&area=sound',agent).decode()
    inline=re.search(r'<script id="music-atlas-data" type="application/json">([\s\S]*?)</script>',html)
    assert inline and json.loads(inline[1])==record
    assert html.count('data-music-model=')==6
    assert html.count('<table>')==10
    for fmt in ['json','csv','md']:assert f'download="music-atlas.{fmt}"' in html
headers={}
for ext,mime in [('json','application/json'),('csv','text/csv'),('md','text/markdown')]:
    h=subprocess.check_output(['curl','--fail','--silent','--show-error','--head',BASE+'informatics/music-atlas/music-atlas.'+ext],text=True)
    assert mime in h.lower(),h
    assert 'noindex' in h.lower(),'Staging indexing exclusion changed'
    headers[ext]=mime
robots=request('robots.txt').decode();assert 'Disallow: /*' in robots
report={'passed':True,'base':BASE,'files':checks,'ordinary_page_request_user_agents':agents,'all_headers_receive_identical_music_data':True,'user_agent_checks_are_http_delivery_tests_not_external_provider_sessions':True,'models':6,'semantic_tables':10,'content_types':headers,'staging_indexing_excluded':True}
OUT.mkdir(parents=True,exist_ok=True);(OUT/'staging-http.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'files_byte_matched':len(checks),'request_user_agents':len(agents),'models':6,'semantic_tables':10,'download_content_types':headers}))
