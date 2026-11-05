"""Build public chapter routes and maps from the shared navigation definition."""
from pathlib import Path
from html import escape, unescape
import json,re,hashlib,xml.etree.ElementTree as ET
from urllib.parse import urljoin
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://universalmind.tv'
config=json.loads((ROOT/'site-navigation/portals.json').read_text())
portals={p['id']:p for p in config['portals']}
def write(path,text):
 p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def flat(portal):return [item for entry in portal['entries'] for item in [entry,*entry.get('children',[])]]
def plain(s):return re.sub(r'\s+',' ',unescape(re.sub('<[^>]+>',' ',s))).strip()
def page(title,body,url):
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+' · Universal Mind</title><meta name="description" content="'+escape(title)+' · pages in navigation order"><link rel="canonical" href="'+ORIGIN+url+'"><link rel="stylesheet" href="/read/wiki.css"><script src="/site-navigation/routes.js?v='+runtime_hash+'"></script></head><body><header><a href="/home/">Universal Mind</a><nav><a href="/sitemap/">Website map</a><a href="/read/">AI / LLM guide</a></nav></header><main><h1>'+escape(title)+'</h1>'+body+'</main></body></html>\n'
def items(entries):
 return '<ul>'+''.join('<li><a href="'+escape(e['url'],quote=True)+'"'+(' target="_blank" rel="noopener noreferrer"'if e.get('target')=='_blank'else'')+'>'+escape(e['label'])+'</a>'+ (items(e['children'])if e.get('children')else'')+'</li>'for e in entries)+'</ul>'
runtime='window.UniversalPortalNavigation='+json.dumps(config,ensure_ascii=False,separators=(',',':'))+';\n'+(ROOT/'site-navigation/runtime.js').read_text()
write('site-navigation/routes.js',runtime);runtime_hash=hashlib.sha256(runtime.encode()).hexdigest()[:12]
# Install the shared lookup before each portal's existing navigation controller.
for folder in ['Informatics','i  a m']:
 for path in [*(ROOT/folder).glob('*.html'), *([] if folder!='Informatics' else [*(ROOT/folder/'molecular').glob('*.html'),*(ROOT/folder/'quantum').glob('*.html')])]:
  s=path.read_text()
  if 'global-navigation.js' not in s and path.name!='index.html' and path.name not in [e.get('source') for e in flat(portals['iam'])]:continue
  s=re.sub(r'<script src="/site-navigation/routes.js[^\"]*"></script>\n?','',s)
  base='/informatics/'+('' if path.parent==ROOT/folder else path.parent.relative_to(ROOT/folder).as_posix()+'/')if folder=='Informatics'else'/vogue/iam/'
  if '<base 'not in s:s=s.replace('<head>','<head>\n<base href="'+base+'">',1)
  s=s.replace('<head>','<head><script src="/site-navigation/routes.js?v='+runtime_hash+'"></script>',1)
  # Synchronous I AM scripts appear in the body; Informatics scripts are deferred.
  path.write_text(s)
# Generate the visible menu markup from the same entries used by the maps.
def iam_nav_item(e,child=False):
 attr='data-nav-subitem'if child else'data-nav-item';cls=''if child else' class="global-nav-item"'
 extra=' target="_blank" rel="noopener noreferrer"'if e.get('target')=='_blank'else''
 if e.get('children'):extra+=' aria-expanded="false"'+(' aria-controls="global-nav-research"'if e['id']=='research'else'')
 if e['id']=='home':extra+='${shopReturn}'
 result='<a'+cls+' href="'+e['url']+'" '+attr+'="'+e['id']+'"'+extra+'>'+e['label']+'</a>'
 if e.get('children'):result+='\n<div class="global-nav-submenu"'+(' id="global-nav-research"'if e['id']=='research'else'')+' data-nav-submenu="'+e['id']+'">'+''.join(iam_nav_item(x,True)for x in e['children'])+'</div>'
 return result
p=ROOT/'i  a m/global-navigation.js';s=p.read_text();s=re.sub(r'(<nav class="global-nav-menu" aria-label="Primary">)[\s\S]*?(</nav>)',lambda m:m[1]+'\n'+ '\n'.join(iam_nav_item(x)for x in portals['iam']['entries'])+'\n'+m[2],s,count=1);p.write_text(s)
# Keep the existing content-hash convention for I AM controllers.
for name,pattern,prefix in [('global-navigation.js',r'global-navigation-canonical-14-[a-f0-9]{12}','global-navigation-canonical-14-'),('adaptive-environment-television.js',r'music-tv-[a-f0-9]{12}','music-tv-'),('script.js',r'adaptive-env-stream-[a-f0-9]{12}','adaptive-env-stream-'),('globe.js',r'globe-[a-f0-9]{12}','globe-'),('adaptive-environment.js',r'adaptive-env-[a-f0-9]{12}','adaptive-env-'),('mobile-editorial-surface.js',r'mobile-editorial-[a-f0-9]{12}','mobile-editorial-'),('shop.js',r'shop-[a-f0-9]{12}','shop-')]:
 token=prefix+hashlib.sha256((ROOT/'i  a m'/name).read_bytes()).hexdigest()[:12]
 for path in (ROOT/'i  a m').glob('*.html'):path.write_text(re.sub(pattern,token,path.read_text()))
# Content-address the modified Informatics controllers and Science collection links.
for folder,names in [('Informatics',['app.js','atlas.css','global-navigation.js','shared-experience.js','library.js','molecular-entry.js','quantum-entry.js']),('i  a m',['science-research-data-v1.js','science.js'])]:
 for name in names:
  token=hashlib.sha256((ROOT/folder/name).read_bytes()).hexdigest()[:12]
  for path in (ROOT/folder).rglob('*.html') if folder=='Informatics' else (ROOT/folder).glob('*.html'):
   if '/read/' in str(path) or '/chapters/' in str(path):continue
   pattern=r'((?:src|href)="(?:\.\./)*'+re.escape(name)+r')(?:(?:\?v=)[^" ]*)?("[^>]*>)'
   path.write_text(re.sub(pattern,lambda m:m[1]+'?v='+token+m[2],path.read_text()))
# Readable top-level and portal maps, retaining the approved landing copy.
body=''
for p in config['portals']:
 body+='<section><h2><a href="'+escape(p['url'],quote=True)+'">'+escape(p['label'])+'</a></h2><p>'+escape(p['description'])+'</p>'
 if p['id']=='events':body+=items([{'label':'Universal Mind Lab','url':'/lab/'},{'label':'Youth Research','url':'/lab/research.html'}])
 if p.get('map'):body+='<p><a href="'+p['map']+'">'+escape(p['title'])+' sitemap</a></p>'
 body+='</section>'
write('sitemap/index.html',page('Website sitemap',body,'/sitemap/'))
for name in ['informatics','iam']:
 p=portals[name];body=items(p['entries'])
 guide='/informatics/read/'if name=='informatics'else'/read/#iam'
 body+='<p><a href="'+guide+'">AI / LLM guide</a></p>'
 write(('Informatics'if name=='informatics'else'iam')+'/sitemap/index.html',page(p['title']+' sitemap',body,p['map']))
# Every chapter is a direct HTTP document using the original interactive source.
def chapter(source,e,base,explanation=''):
 s=source
 if base=='/informatics/':s=re.sub(r'<!-- (MUSIC ATLAS|QUANTUM ATLAS|ATLAS TOPICS|ATLAS NARRATIVE) (METADATA|MACHINE) START -->[\s\S]*?<!-- \1 \2 END -->\n?', '', s)
 s=re.sub(r'<base[^>]*>','',s)
 s=s.replace('<head>','<head><base href="'+base+'">',1)
 title=e['label']+(' · Universal Informatics'if base=='/informatics/'else' · I AM')
 s=re.sub(r'<title>[\s\S]*?</title>','<title>'+escape(title)+'</title>',s,count=1)
 s=re.sub(r'<link\b(?=[^>]*rel="canonical")[^>]*>','',s)
 s=re.sub(r'<meta\b(?=[^>]*(?:name="description"|property="og:(?:title|description|url)"))[^>]*>','',s)
 description=plain(explanation)[:280]if explanation else plain(re.search(r'<main\b[^>]*>([\s\S]*?)</main>',source)[1])[:220]if re.search(r'<main\b[^>]*>([\s\S]*?)</main>',source)else title
 metadata='<link rel="canonical" href="'+ORIGIN+e['url']+'"><meta name="description" content="'+escape(description,quote=True)+'"><meta property="og:title" content="'+escape(title,quote=True)+'"><meta property="og:url" content="'+ORIGIN+e['url']+'">'
 if base=='/informatics/':
  guide=ROOT/'Informatics'/({'sound':'music-atlas/music-atlas.json','quantum':'quantum/reading/quantum-atlas.json'}.get(e['id'],'atlas-guides/'+e['id']+'-atlas.json'))
  if guide.exists():
   payload=json.loads(guide.read_text())
   metadata+='<script type="application/json" id="chapter-guide-data">'+json.dumps(payload,ensure_ascii=False).replace('<','\\u003c')+'</script>'
   for fmt,url in payload.get('downloads',{}).items():
    metadata+='<link rel="alternate" type="'+{'json':'application/json','csv':'text/csv','markdown':'text/markdown','md':'text/markdown'}.get(fmt,'text/plain')+'" href="'+escape(url,quote=True)+'">'
 s=s.replace('</head>',metadata+'</head>',1)
 if explanation:
  article='<noscript><style>#landing,#experience{display:none!important}body{overflow:auto!important}</style><main style="max-width:1000px;margin:40px auto;padding:20px;color:#eee"><h1>'+escape(e['label'])+'</h1>'+explanation+'<p><a href="'+e.get('wiki','/informatics/read/')+'">AI / LLM guide</a> · <a href="/informatics/sitemap/">Informatics sitemap</a></p></main></noscript>'
  s=re.sub(r'(<body\b[^>]*>)',lambda m:m[1]+article,s,count=1)
 return re.sub(r'(?m)^[ \t]+$', '', s)
ip=ROOT/'Informatics/index.html';inf_source=ip.read_text()
static_nav=''.join('<a href="'+e['url']+'" role="menuitem" '+('data-about'if e['id']=='about'else'data-area="'+e['id']+'"')+'>'+escape(e['label'])+'</a>'for e in portals['informatics']['entries'])
inf_source=re.sub(r'(<div[^>]*data-global-menu="main"[^>]*>)[\s\S]*?</div>',lambda m:m[1]+static_nav+'</div>',inf_source,count=1);ip.write_text(inf_source)
for e in portals['informatics']['entries']:
 wiki=ROOT/e['wiki'].replace('/informatics/','Informatics/').lstrip('/')
 if wiki.is_dir():wiki=wiki/'index.html'
 text=wiki.read_text()if wiki.exists()else''
 match=re.search(r'<main\b[^>]*>([\s\S]*?)</main>',text)
 explanation=match[1]if match else '<p>'+escape(e['label'])+'</p>'
 # Use only each chapter's source explanation; auxiliary pages use their native content.
 if e['id']in ['about','partners']:
  if e['id']=='about':explanation=re.search(r'<section id="wiki-about">([\s\S]*?)</section>',(ROOT/'Informatics/read/index.html').read_text())[1]
  else:
   m=re.search(r'<section[^>]+id="area-partners"[\s\S]*?</section>',inf_source);explanation=m[0]if m else'<h2>Partners</h2>'
 if e['id']in ['research','connect']:
  t=(ROOT/'Informatics'/e['source']).read_text();m=re.search(r'<main\b[^>]*>([\s\S]*?)</main>',t);explanation=m[1]if m else '<p>'+escape(e['label'])+'</p>'
 explanation=re.sub(r'(href|src)="([^"]+)"',lambda m:m[0]if m[2].startswith(('#','data:'))else m[1]+'="'+escape(urljoin(ORIGIN+e['wiki'],unescape(m[2])).removeprefix(ORIGIN),quote=True)+'"',explanation).replace(' hidden','')
 write('Informatics/chapters/'+e['id']+'.html',chapter(inf_source,e,'/informatics/',explanation))
seen=set()
for e in flat(portals['iam']):
 if not e.get('source')or e['url']in seen:continue
 seen.add(e['url']);write(e['url'].strip('/')+'/index.html',chapter((ROOT/'i  a m'/e['source']).read_text(),e,'/vogue/iam/'))
# Sitemap index separates navigation pages from research records.
ns='http://www.sitemaps.org/schemas/sitemap/0.9'
def xml_urls(paths):return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="'+ns+'">\n'+''.join('  <url><loc>'+escape(u if u.startswith('http')else ORIGIN+u)+'</loc></url>\n'for u in dict.fromkeys(paths))+'</urlset>\n'
write('sitemaps/portals.xml',xml_urls(['/sitemap/','/home/','/read/',*[p['url']for p in config['portals']]]))
for name in ['iam','informatics']:
 p=portals[name];urls=[e['url']for e in flat(p)if e['url'].startswith('/')]+[p['map'],'/informatics/read/'if name=='informatics'else'/read/#iam']
 urls=[u for u in urls if '#'not in u]
 if name=='informatics':urls += ['/informatics/research/?collection='+collection for collection in ['vision','sound','language']]
 write('sitemaps/'+name+'.xml',xml_urls(urls))
records=json.loads((ROOT/'research/informatics/discovery-20261026/build.json').read_text())['canonicalPaths']
write('sitemaps/informatics-records.xml',xml_urls(['/informatics/'+p for p in records if p.startswith('read/')and '/publications/'not in p]))
write('sitemaps/informatics-publications.xml',xml_urls(['/informatics/'+p for p in records if '/publications/'in p]))
extra=json.loads((ROOT/'tools/website-extra-urls.json').read_text())
write('sitemaps/other-public-pages.xml',xml_urls(extra))
files=['portals','informatics','iam','informatics-records','informatics-publications','other-public-pages']
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="'+ns+'">\n'+''.join('  <sitemap><loc>'+ORIGIN+'/sitemaps/'+name+'.xml</loc></sitemap>\n'for name in files)+'</sitemapindex>\n')
print(json.dumps({'maps':3,'informatics_chapters':len(portals['informatics']['entries']),'iam_chapters':len(seen),'sitemap_files':len(files),'runtime_version':runtime_hash}))
