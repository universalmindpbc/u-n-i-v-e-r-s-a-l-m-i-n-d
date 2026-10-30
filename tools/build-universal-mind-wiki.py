"""Build the public guide from approved organisation copy and existing About text."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://universalmind.tv'
DATE = '2026-10-30'

class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)

def plain(fragment):
    parser = Text()
    parser.feed(fragment)
    return re.sub(r'\s+', ' ', ''.join(parser.parts)).strip()

def source(path):
    return (ROOT / path).read_text()

def paragraph_with(document, text):
    matches = [plain(p) for p in re.findall(r'<p\b[^>]*>(.*?)</p>', document, re.S) if text in plain(p)]
    assert len(matches) == 1, (text, len(matches))
    return matches[0]

INTRO = [
    'Universal Mind is a multidisciplinary organisation focused on electronic music and mental health. Its work connects music television, live events, festival participation and bioinformatics research—bringing cultural experiences, community participation and scientific investigation together.',
    'Universal Mind is a project of Ben Korbel. Voted Australia’s number one DJ in 2001, Ben built a career across Australia, Berlin and Ibiza. He also became one of Australia’s major electronic music festival promoters, with festival partnerships welcoming more than 60,000 patrons across two weekends.',
    'Over the past decade, Ben has increasingly turned his attention towards mental health. That focus grew from curiosity, his own lived experience, and the experiences of many people within the electronic music community. Universal Mind brings these parts of his life together: a connection to music and the people around it, and a desire to explore how those connections can support mental health.'
]
iam = source('i  a m/about.html')
events = source('events/index.php').split('<section id="about-panel"', 1)[1]
happiness = source('happiness/index.php').split('<section id="about-panel"', 1)[1]
informatics = source('Informatics/read/index.html')
channels = plain(re.search(r'<li><strong>(Watch one of 13.*?)</strong>', iam, re.S)[1])
projects = [
    dict(id='iam', name='I AM', route='Watch TV', url=ORIGIN+'/iam/', source=ORIGIN+'/vogue/iam/about.html',
         source_file='i  a m/about.html', access='The public introduction and About page are readable directly. Participation uses the existing entry and consent flows.',
         paragraphs=[paragraph_with(iam, p) for p in ['I AM is a free online mental health', 'I AM brings electronic music', 'When anxiety or crisis arrives', 'Your voluntary check-in -']] + [channels],
         context=['The full About page identifies proposed care and fulfilment partners as invitations that are not yet confirmed. The public Science record contains evidence assessments and research limitations.']),
    dict(id='events', name='athousandminds', route='Attend Events', url=ORIGIN+'/events/?experience=1', source=ORIGIN+'/events/#about-panel',
         source_file='events/index.php', access='The event experience uses the existing invitation login. These About excerpts are public.',
         paragraphs=[paragraph_with(events, p) for p in ['Welcome to athousandminds', 'The event places', 'Each level unlocks']],
         levels=[plain(p) for p in re.findall(r'<li>(.*?)</li>', events, re.S)],
         context=[paragraph_with(events, 'is a new festival by Universal Mind, pitching')]),
    dict(id='happiness', name='Happiness', route='Activate Festivals', url=ORIGIN+'/events/happiness-entry.php', source=ORIGIN+'/happiness/#about-panel',
         source_file='happiness/index.php', access='The festival experience uses the existing invitation login. These About excerpts are public.',
         paragraphs=[paragraph_with(happiness, p) for p in ['Happiness is a universal', 'Happiness also powers', 'Our mission is lowering']],
         context=['The About text describes the project and its mission. Named technologies and organisations are not, by their inclusion here, confirmation of a formal partnership or independently validated clinical performance.']),
    dict(id='informatics', name='Universal Informatics', route='Explore Research', url=ORIGIN+'/informatics/', source=ORIGIN+'/informatics/read/',
         source_file='Informatics/read/index.html', access='The research wiki, publication records and download directory are public. API and MCP access are optional.',
         paragraphs=[paragraph_with(informatics, p) for p in ['Bioinformatics platform for mental health.', 'Inspired by research into', 'Our proposed approach explores', 'An extensive, clinically searchable research index', 'Explore the published research without']],
         context=[paragraph_with(informatics, 'The project explores hypotheses')])
]

def resource(title, path, project, format='HTML', access='Public', description=''):
    return dict(title=title, url=path if path.startswith('https://') else ORIGIN+path,
                project=project, format=format, access=access, description=description)

resources = [
    resource('Universal Mind', '/', 'Universal Mind', access='Invitation entry; wiki link is public'),
    resource('Four project paths', '/home/', 'Universal Mind', access='Public directory'),
    resource('Wiki For AI / LLMs', '/read/', 'Universal Mind'),
    resource('AI reading guide', '/llms.txt', 'Universal Mind', 'Plain text'),
    resource('Structured guide and resource directory', '/read/resources.json', 'Universal Mind', 'JSON'),
    resource('I AM introduction', '/vogue/iam/induction.html', 'I AM'),
    resource('About I AM', '/vogue/iam/about.html', 'I AM'),
    resource('Programme: 13 livestream channels', '/vogue/iam/program.html', 'I AM'),
    resource('Science and evidence', '/vogue/iam/science.html', 'I AM'),
    resource('Sound prototype research record', '/vogue/iam/sound-prototype-research.html', 'I AM'),
    resource('Our Team', '/vogue/iam/our-team.html', 'I AM'),
    resource('Voluntary check-in', '/vogue/iam/vogue-self-report.html', 'I AM', access='Voluntary participation'),
    resource('Electronic music television', '/vogue/iam/index.html', 'I AM', access='Interactive experience'),
    resource('Citizen Needs technology', '/vogue/iam/technology-citizen-needs.html', 'I AM'),
    resource('Adaptive Content Matrix', '/vogue/iam/technology-inference-engine.html', 'I AM'),
    resource('athousandminds experience and About', '/events/', 'athousandminds', access='Invitation login'),
    resource('Happiness experience and About', '/happiness/', 'Happiness', access='Invitation login'),
    resource('Informatics wiki', '/informatics/read/', 'Universal Informatics'),
    resource('Publication register', '/informatics/read/publications/index.html', 'Universal Informatics'),
    resource('Hyperspectral Imaging and complete source register', '/informatics/read/hyperspectral/index.html', 'Universal Informatics'),
    resource('Geometry Atlas M1–M1001', '/informatics/read/atlas/index.html', 'Universal Informatics'),
    resource('Experiments', '/informatics/read/experiments/index.html', 'Universal Informatics'),
    resource('Data, methods and checksums', '/informatics/read/data.html', 'Universal Informatics'),
    resource('Archive and timestamp record', '/informatics/read/provenance.html', 'Universal Informatics'),
    resource('Informatics AI access and reuse', '/informatics/read/access.html', 'Universal Informatics'),
    resource('Connect and download: API, MCP, A2A, JSON and CSV', '/informatics/connect.html', 'Universal Informatics', description='Connection instructions and complete dataset exports; research scope.'),
    resource('Complete dataset manifest', '/informatics/exports/manifest.json', 'Universal Informatics', 'JSON', description='Current export files, sizes and checksums.'),
    resource('Dataset guide', '/informatics/exports/README.md', 'Universal Informatics', 'Markdown'),
    resource('Atlas JSON bundle', '/informatics/pilot-v1/m1-m1001-data.zip', 'Universal Informatics', 'ZIP / JSON'),
    resource('Atlas CSV bundle', '/informatics/pilot-v1/m1-m1001-csv.zip', 'Universal Informatics', 'ZIP / CSV'),
]
for title in ['EMDR', 'Sound', 'Mantra']:
    resources.append(resource(title+' Medical Research dossier', '/vogue/iam/a%20s%20s%20e%20t%20s/r%20e%20s%20e%20a%20r%20c%20h/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20-%20'+title+'%20Medical%20Research.pdf', 'I AM', 'PDF', description='Original Internet of Happiness research dossier. The Informatics publication register provides navigable source records.'))
resources.append(resource('Public sitemap', '/sitemap.xml', 'Universal Mind', 'XML'))

access = [
    'This is Universal Mind’s first-party guide to its projects. The project descriptions are excerpts from the existing About pages and Informatics wiki. Their source links are provided above.',
    'Universal Mind permits automated reading, navigation, search indexing, retrieval, text and data mining, and model training or fine-tuning on Universal Mind-owned public material. This includes this wiki, its structured guide and llms.txt. The Informatics access and reuse page records the detailed research permission.',
    'Third-party music, films, publications, images, software and datasets retain their own rights and licence terms. Public accessibility does not grant additional rights in that material.',
    'Invitation logins, personal data, private research files and credentials remain outside this public guide. Staging is a proofing environment and remains excluded from crawling and indexing.',
    'Universal Mind plans an open-source release. Reuse of code and datasets follows the licence published with each release.',
    'Use the source records for evidence status, dates and limitations. Research hypotheses, calculations, clinical evidence and project ambitions retain their separate meanings. Permission to access this material does not establish that a model has trained on it.'
]
data = dict(title='Universal Mind · Wiki For AI / LLMs', canonical_url=ORIGIN+'/read/', updated=DATE,
            introduction=INTRO, projects=projects, resources=resources, access_and_reuse=access)
for project in data['projects']:
    project['source_sha256'] = hashlib.sha256((ROOT/project['source_file']).read_bytes()).hexdigest()

def paragraphs(items):
    return '\n'.join('<p>'+escape(text)+'</p>' for text in items)

html = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Universal Mind · Wiki For AI / LLMs</title>
<meta name="description" content="Universal Mind, a project of Ben Korbel: electronic music, mental health, I AM, athousandminds, Happiness and Universal Informatics. Official project text, resources and AI access.">
<meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="https://universalmind.tv/read/">
<link rel="icon" href="/vogue/iam/favicon.png"><link rel="stylesheet" href="wiki.css?v=1">
<link rel="alternate" type="text/plain" href="/llms.txt" title="AI reading guide"><link rel="alternate" type="application/json" href="resources.json" title="Structured guide">
</head><body><header><a href="/home/">Universal Mind</a><p>Wiki For AI / LLMs</p>
<nav aria-label="Wiki navigation"><a href="#organisation">Organisation</a><a href="#iam">I AM</a><a href="#events">athousandminds</a><a href="#happiness">Happiness</a><a href="#informatics">Informatics</a><a href="#resources">Resources</a><a href="#access">AI access</a></nav></header>
<main><section id="organisation"><h1>Universal Mind</h1>'''+paragraphs(INTRO)+'</section>\n'
for project in projects:
    html += '<section id="'+project['id']+'"><p class="eyebrow">'+escape(project['route'])+'</p><h2>'+escape(project['name'])+'</h2>\n'
    html += paragraphs(project['paragraphs'])
    if project.get('levels'):
        html += '<ol>'+''.join('<li>'+escape(p)+'</li>' for p in project['levels'])+'</ol>'
    html += '<div class="context">'+paragraphs(project['context'])+'</div>'
    html += '<p class="source">Approved source: <a href="'+project['source'].removeprefix(ORIGIN)+'">'+escape(project['name'])+' · About / wiki</a></p>'
    html += '<p>'+escape(project['access'])+'</p><p><a href="'+project['url'].removeprefix(ORIGIN)+'">'+escape(project['route'])+' →</a></p></section>\n'
html += '<section id="resources"><h2>Resource directory</h2><p>Use the public reading pages for text, the original experiences for participation, and the Informatics connection guide for research tools and downloads.</p><dl class="resources">'
for item in resources:
    html += '<dt><a href="'+item['url'].removeprefix(ORIGIN)+'">'+escape(item['title'])+'</a></dt><dd>'+escape(item['project']+' · '+item['format']+' · '+item['access'])+(('<br>'+escape(item['description'])) if item['description'] else '')+'</dd>\n'
html += '</dl></section><section id="access"><h2>AI access and reuse</h2>'+paragraphs(access)+'</section></main><footer><p>Updated '+DATE+' · Original source pages retain their own dates and evidence assessments.</p><p><a href="/llms.txt">Plain-text guide</a> · <a href="resources.json">JSON guide</a> · <a href="/home/">Universal Mind</a></p></footer></body></html>\n'
markdown = '# Universal Mind\n\n'+'\n\n'.join(INTRO)+'\n\nOfficial wiki: '+ORIGIN+'/read/\nUpdated: '+DATE+'\n'
for project in projects:
    markdown += '\n## '+project['name']+' — '+project['route']+'\n\n'+'\n\n'.join(project['paragraphs'])+'\n\n'
    markdown += ''.join('- '+p+'\n' for p in project.get('levels', []))
    markdown += '\n\n'.join(project['context'])+'\n\nSource: '+project['source']+'\nEntry: '+project['url']+'\nAccess: '+project['access']+'\n'
markdown += '\n## Resource directory\n\n'
for item in resources:
    markdown += '- ['+item['title']+']('+item['url']+'): '+item['project']+'; '+item['format']+'; '+item['access']+'.'+((' '+item['description']) if item['description'] else '')+'\n'
markdown += '\n## AI access and reuse\n\n'+'\n\n'.join(access)+'\n'
outputs = {'read/index.html': html, 'read/resources.json': json.dumps(data, ensure_ascii=False, indent=2)+'\n', 'llms.txt': markdown}
for path, value in outputs.items():
    target = ROOT/path
    if '--check' in sys.argv:
        assert target.read_text() == value, 'Stale generated guide: '+path
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value)
print('Universal Mind wiki: approved source excerpts and all three formats match.')
