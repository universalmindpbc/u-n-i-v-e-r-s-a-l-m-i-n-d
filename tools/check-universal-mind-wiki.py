"""Verify approved copy, discovery routes, crawler boundaries and link styling."""
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT/'tools/build-universal-mind-wiki.py'), '--check'], check=True)

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]; self.ids=[]; self.tags=[]; self.metas=[]; self.canonicals=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); self.tags.append(tag)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='a': self.links.append(a)
        if tag=='meta': self.metas.append(a)
        if tag=='link' and a.get('rel')=='canonical': self.canonicals.append(a['href'])

data=json.loads((ROOT/'read/resources.json').read_text())
html=(ROOT/'read/index.html').read_text()
llms=(ROOT/'llms.txt').read_text()
wiki=Document(); wiki.feed(html)
assert not set(wiki.tags)&{'script','iframe','video','audio','form'}, 'The wiki is readable without scripts or login.'
assert len(wiki.ids)==len(set(wiki.ids))
assert wiki.canonicals==['https://universalmind.tv/read/']
assert len(data['projects'])==4
for project in data['projects']:
    for text in project['paragraphs']+project.get('levels',[])+project['context']:
        assert text in llms and text in unescape(html), project['name']
for item in wiki.links:
    href=item.get('href','')
    assert not href.startswith(('javascript:', 'file:'))
    assert '/patent' not in href
    if href.startswith('#'): assert href[1:] in wiki.ids
for path in ['index.html','home/index.html']:
    text=(ROOT/path).read_text(); document=Document(); document.feed(text)
    links=[a for a in document.links if a.get('class')=='ai-wiki-link']
    assert links==[{'class':'ai-wiki-link','href':'/read/','target':'_top'}], path
    assert len(document.canonicals)==1
    assert any(m.get('name')=='description' and 'Ben Korbel' in m.get('content','') for m in document.metas)
    assert 'noindex' not in text and 'nofollow' not in text
    body=text.split('<body',1)[1]
    assert data['introduction'][0] not in body, 'No organisation paragraph on landing pages.'
original=(ROOT/'Informatics/style.css').read_text()
exact=''.join(re.findall(r'\.ai-wiki-link[^{}]*\{[^{}]*\}',original))
assert (ROOT/'home/ai-wiki-link.css').read_text().strip()==exact

def allowed(policy, route):
    matches=[]
    for mode, pattern in re.findall(r'^(Allow|Disallow):\s*(\S+)',policy,re.M):
        expression='^'+re.escape(pattern).replace(r'\*','.*').replace(r'\$','$')
        if re.search(expression,route): matches.append((len(pattern.replace('*','').replace('$','')),mode=='Allow'))
    return max(matches)[1] if matches else True
robots=(ROOT/'robots.txt').read_text(); staging=(ROOT/'robots-staging.txt').read_text()
routes=['/','/home/','/read/','/read/resources.json','/llms.txt','/informatics/read/','/informatics/exports/manifest.json','/vogue/iam/about.html']
for route in routes:
    assert allowed(robots,route),route
    assert not allowed(staging,route),route
for route in ['/patent/','/events/private/example.json','/vogue/iam/api/example.php','/vogue/iam/stakeholders/budget/index.html']:
    assert not allowed(robots,route),route
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls={n.text for n in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc',ns)}
for path in ['/','/home/','/read/']:
    assert 'https://universalmind.tv'+path in urls
# The retired medical dossiers remain absent from every public guide format.
from urllib.parse import unquote
for path in ['read/index.html','read/resources.json','llms.txt','sitemap.xml']:
    decoded=unquote((ROOT/path).read_text())
    assert not re.search(r'(?:EMDR|Sound|Mantra) Medical Research\.pdf',decoded,re.I), path
for collection in ['vision','sound','language']:
    url='https://universalmind.tv/informatics/library.html?collection='+collection
    assert url in urls
    assert any(item['url']==url and item['format']=='HTML' for item in data['resources'])
assert not re.search(r'\b(should|could|would)\b',html+'\n'+llms,re.I)
print(json.dumps({'passed':True,'projects':4,'resources':len(data['resources']),'sourceFidelity':'exact excerpts','linkDesign':'exact Informatics CSS','publicRoutesAllowed':len(routes),'stagingRoutesBlocked':len(routes)}))
