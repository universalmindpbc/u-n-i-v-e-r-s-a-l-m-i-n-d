"""Build protected, structured chapter content and drawings from frozen filing sources."""
import argparse,ast,hashlib,html,json,re,sys
from collections import defaultdict
from pathlib import Path
sys.path.insert(0,'/private/tmp/um-patent-render-libs')
import markdown,bleach
from bs4 import BeautifulSoup
from pypdf import PdfReader

ap=argparse.ArgumentParser();ap.add_argument('--package',type=Path,required=True);ap.add_argument('--runtime',type=Path,required=True);args=ap.parse_args()
base=args.package;runtime=args.runtime;src=base/'sources';doc=json.loads((runtime/'document.json').read_text());manifest=json.loads((base/'final/compilation-manifest.json').read_text());register=json.loads((base/'final/drawing-register.json').read_text())
assert hashlib.sha256((runtime/'specification.pdf').read_bytes()).hexdigest()==doc['sha256']
sections={s['title']:{**s,'end_page':doc['sections'][i+1]['page']-1 if i+1<len(doc['sections']) else 953} for i,s in enumerate(doc['sections'])}
source_map={r['title']:r for r in manifest['source_pages']}
for r in manifest['source_pages']:
 if r.get('source_sha256'):assert hashlib.sha256((src/(r['id']+'.md')).read_bytes()).hexdigest()==r['source_sha256']
images=defaultdict(list)
for r in register:images[(r['section'],Path(r['file']).stem)].append(r['number'])
used=[];gallery={};chapters=[];audit=[]
media={Path(x['file']).stem:Path(x['file']) for x in json.loads((src/'media-manifest.json').read_text())}
A=(src/'3047b9c99c5681848992d9e216d8d7b8.md').read_text();blocks=list(re.finditer(r'```([^\n]*)\n(.*?)```',A,re.S))
final_ast=ast.parse((base/'build_final.py').read_text());intro='';contributions=''
for n in final_ast.body:
 if isinstance(n,ast.Assign) and isinstance(n.value,ast.Constant):
  for target in n.targets:
   if isinstance(target,ast.Name) and target.id=='intro':intro=n.value.value
   if isinstance(target,ast.Name) and target.id=='CONTRIBUTIONS':contributions=n.value.value
reading=[]
for n in ast.walk(ast.parse('def read():\n'+intro)):
 if isinstance(n,ast.For) and isinstance(n.target,ast.Name) and n.target.id=='s' and isinstance(n.iter,ast.List):reading=ast.literal_eval(n.iter)

def raw_source(title):
 if title=='Technical contribution map':return contributions
 if title=='Reading the technical disclosure':return '\n\n'.join(reading)
 if title.startswith('Appendix L.9.'):
  parts=['These selected files and line ranges identify concrete algorithms and interfaces. They do not include credentials, private participant data, payment secrets, a complete repository or third-party libraries. SHA-256 values identify the complete source files inspected; only the indicated ranges are reproduced. Licence notices in the source remain applicable.']
  for item in manifest['current_code']:
   f=src/'current-code'/item['path'];raw=f.read_bytes();assert hashlib.sha256(raw).hexdigest()==item['sha256'];start,end=item['lines'];code='\n'.join(raw.decode().splitlines()[start-1:end]);parts+=['## '+item['path'],f'Lines {start}–{end}\n\nSHA-256: `{item["sha256"]}`','```\n'+code+'\n```']
  return '\n\n'.join(parts)
 if title.startswith('Appendix L.'):return (base/'implementation-supplement.txt').read_text()
 if title.startswith('Appendix H.'):
  return 'This is the earlier illustrative Internet of Happiness module retained from the Notion disclosure. It contains simulation fallbacks and integration placeholders. It is not a representation that its hypothetical biological inference methods or every third-party connection has been validated. The current implementation disclosure appears in Appendix L.\n\n```python\n'+blocks[8].group(2).replace('"ATGGAGGGCGGCTTCTGGCCGTGCTGCTGG"','EXAMPLE_NUCLEOTIDE_SEQUENCE')+'\n```'
 r=source_map[title];text=(src/(r['id']+'.md')).read_text()
 if title.startswith('Appendix A.') and not title.startswith('Appendix A.1.'):text=text[:text.rfind('###',0,blocks[8].start())]
 if title.startswith('Appendix C.'):
  ab=list(re.finditer(r'```([^\n]*)\n(.*?)```',text,re.S));start=text.find('# <b><span color="blue">API Architecture Implementation Wiki');text=text[max(start,0):ab[6].end()];text=re.sub(r'ATTENTION AI.*?(?=\n\s*\n)','',text,flags=re.S);text=re.sub(r'This is the compass.*?(?=\n\s*\n)','',text,flags=re.S)
  text+='\n\nThe provider-dispatch examples above are illustrative pseudocode. Placeholder device identifiers are not executable routes; gate, annealing and analog devices require distinct supported adapters. Appendix L describes the actually inspected qualification route.\n\n## C.1. Secure backend architecture and source listing\n\n'+'\n\n'.join('### Backend source segment '+str(j-8)+'\n\n```\n'+blocks[j].group(2)+'\n```' for j in range(9,16))
 return text

allowed=['p','h1','h2','h3','h4','h5','h6','strong','b','em','i','s','u','span','a','ul','ol','li','pre','code','blockquote','table','thead','tbody','tr','th','td','br','hr','figure','figcaption','img','details','summary','div']
attrs={'*':['class','id'],'a':['href','title','target','rel'],'img':['src','alt','width','height','loading','data-image'],'figure':['data-image'],'ol':['start','type'],'td':['colspan','rowspan'],'th':['colspan','rowspan'],'details':['open']}

def render(text,title):
 def image_repl(m):
  ref=html.unescape(m.group(1));ids=re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',ref);queue=next((images[(title,x)] for x in reversed(ids) if images.get((title,x))),None)
  if not queue:
   attachment=next((media[x] for x in reversed(ids) if x in media),None)
   if attachment and attachment.suffix.lower() not in ['.png','.jpg','.jpeg','.gif','.webp']:return '\n\nSupporting attachment referenced in the filed specification: '+html.escape(attachment.name)+'\n\n'
   raise ValueError('Unmapped image in '+title)
  n=queue.pop(0);used.append(n)
  return f'\n\n<figure data-image="{n}"><a href="#drawing-{n}" title="Open drawing and description"><img src="drawing.php?image={n}" alt="Source image {n}" loading="lazy" data-image="{n}"></a></figure>\n\n'
 # Keep code literal while adapting Notion block wrappers.
 fences=[]
 def protect(m):fences.append(m.group(0));return f'\n\nPATENTFENCE{len(fences)-1}TOKEN\n\n'
 text=re.sub(r'```[^\n]*\n.*?```',protect,text,flags=re.S)
 text=re.sub(r'<image\b[^>]*source="([^"]+)"[^>]*(?:/>|>.*?</image>)',image_repl,text,flags=re.S)
 text=re.sub(r'<p\s*/>','\n\n',text)
 text=re.sub(r'<page\b[^>]*>.*?</page>','',text,flags=re.S)
 text=re.sub(r'<(?:table-of-contents|database|unknown)\b[^>]*(?:/>|>.*?</(?:table-of-contents|database|unknown)>)','',text,flags=re.S)
 text=re.sub(r'</?(?:columns|column|callout|quote)\b[^>]*>','\n\n',text)
 text=re.sub(r'<(?:file|video|audio|bookmark|embed)\b[^>]*(?:/>|>.*?</(?:file|video|audio|bookmark|embed)>)','',text,flags=re.S)
 for i,f in enumerate(fences):text=text.replace(f'PATENTFENCE{i}TOKEN',f)
 out=markdown.markdown(text,extensions=['fenced_code','tables','sane_lists','md_in_html'])
 out=bleach.clean(out,tags=allowed,attributes=attrs,protocols=['http','https','mailto'],strip=True)
 soup=BeautifulSoup(out,'html.parser')
 for link in soup.find_all('a'):
  if (link.get('href') or '').startswith(('https://','http://')):link['target']='_blank';link['rel']='noopener noreferrer'
 for table in soup.find_all('table'):
  wrap=soup.new_tag('div',attrs={'class':'table-scroll'});table.wrap(wrap)
  if table.find('tr') and not table.find('th'):
   for cell in table.find('tr').find_all('td'):cell.name='th'
 for p in list(soup.find_all('p')):
  if not p.get_text(strip=True) and not p.find(['img','code']):p.decompose()
 # Inline bold labels followed by prose become a separate heading and paragraph.
 for p in list(soup.find_all('p')):
  first=next((x for x in p.contents if str(x).strip()),None)
  if getattr(first,'name',None) in ['b','strong'] and 6<len(first.get_text())<150 and len(p.get_text())>len(first.get_text())+15:
   h=soup.new_tag('h3');h.string=first.get_text().rstrip('.');first.extract();p.insert_before(h)
   if p.contents and isinstance(p.contents[0],str):p.contents[0].replace_with(str(p.contents[0]).lstrip(' .:—-'))
 for fig in soup.find_all('figure',attrs={'data-image':True}):
  n=int(fig['data-image']);following=[]
  for sibling in fig.next_siblings:
   name=getattr(sibling,'name',None)
   if name in ['figure','hr','h1','h2'] or (name and sibling.find('figure')):break
   if name:following.append(sibling.get_text(' ',strip=True))
   if sum(map(len,following))>7000:break
  caption='\n\n'.join(t for t in following if t)
  if not caption:caption=title
  lines=caption.split('\n\n');heading=lines[0] if re.match(r'^(?:FIG\.|Figure)\s',lines[0],re.I) else title
  if len(heading)>230:heading=title
  gallery[n]={'number':n,'page':299+n,'section':title,'group':'main' if n>=45 else 'supplementary','title':heading,'description':caption,'context_kind':'description' if n>=45 or re.match(r'^(?:FIG\.|Figure)\s',caption,re.I) else 'context','description_pages':[]}
 for i,h in enumerate(soup.find_all(re.compile('^h[1-6]$'))):h['id']='heading-'+str(i+1)
 return soup

for title,sec in sections.items():
 if title=='Drawing sheets':continue
 raw=raw_source(title);soup=render(raw,title)
 for n in used:
  if gallery[n]['section']==title:
   mark=f'See source image {n} in the drawing sheets.';gallery[n]['description_pages']=[p['page'] for p in doc['pages'] if mark in p['text']]
 ident='chapter-'+str(sec['page'])
 for h in soup.find_all(re.compile('^h[1-6]$')):h['id']=ident+'-'+h['id']
 headings=[{'id':h['id'],'title':h.get_text(' ',strip=True),'level':int(h.name[1])} for h in soup.find_all(re.compile('^h[1-6]$'))]
 chapter={'id':ident,'title':title,'page':sec['page'],'end_page':sec['end_page'],'html':str(soup),'text':soup.get_text(' ',strip=True),'headings':headings}
 chapters.append(chapter);audit.append({'title':title,'paragraphs':len(soup.find_all('p')),'headings':len(headings),'lists':len(soup.find_all(['ol','ul'])),'tables':len(soup.find_all('table')),'code_blocks':len(soup.find_all('pre'))})
assert sorted(used)==list(range(1,92)),('Image coverage',len(used))
pdf=PdfReader(runtime/'specification.pdf');out=runtime/'drawings';out.mkdir(exist_ok=True)
for n in range(1,92):
 imgs=pdf.pages[298+n].images;assert len(imgs)==1
 image=imgs[0];assert image.data.startswith(b'\xff\xd8\xff');f=out/f'image-{n}.jpg';f.write_bytes(image.data);f.chmod(0o600)
 gallery[n].update(width=image.image.width,height=image.image.height,sha256=hashlib.sha256(image.data).hexdigest())
# Preserve each PDF section while presenting the three Universal Light parts together.
def combine(prefix,newid,title):
 selected=[c for c in chapters if c['title'].startswith(prefix)];return selected
ul=[c for c in chapters if re.match(r'^[678]\. Universal Light',c['title'])]
claims=[c for c in chapters if re.match(r'^(15|16)\. Proposed claims',c['title'])]
for selected,ident,title in [(ul,'universal-light','Universal Light'),(claims,'proposed-claims','Proposed claims')]:
 merged={'id':ident,'title':title,'page':selected[0]['page'],'end_page':selected[-1]['end_page'],'html':'','text':'','headings':[],'parts':[]}
 for i,c in enumerate(selected,1):
  part=f'{ident}-part-{i}';merged['html']+=f'<h2 id="{part}" class="part-heading">Part {i}</h2>'+c['html'];merged['text']+=c['text']+' ';merged['headings']+=[{'id':part,'title':f'Part {i}','level':2}]+c['headings'];merged['parts'].append({'title':f'Part {i}','id':part,'page':c['page']})
 chapters=[c for c in chapters if c not in selected]+[merged]
for c in chapters:
 c['title']=re.sub(r'^\d+\.\s*','',c['title']).replace(' - detailed description','')
 c['group']='Appendices' if c['title'].startswith('Appendix') else 'Reading guides' if c['page']<8 else 'Main patent'
order=[8,277,86,11,44,99,164,174,183,187,193,203,91,278,209,4,7]
chapters.sort(key=lambda c:order.index(c['page']) if c['page'] in order else 100+c['page'])
for filename,value in [('chapters.json',{'title':doc['title'],'sha256':doc['sha256'],'chapters':chapters,'filing':doc['filing']}),('drawing-gallery.json',[gallery[n] for n in list(range(45,92))+list(range(1,45))]),('reader-build-audit.json',{'pdf_sha256':doc['sha256'],'source_hashes_verified':True,'source_sections':34,'reader_chapters':len(chapters),'drawing_count':len(gallery),'sections':audit})]:
 p=runtime/filename;p.write_text(json.dumps(value,ensure_ascii=False));p.chmod(0o600)
print(json.dumps({'chapters':len(chapters),'drawings':len(gallery),'html_bytes':sum(len(c['html']) for c in chapters),'all_frozen_source_hashes_verified':True}))
