"""Read the approved About content and its expanded research panel verbatim."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
from urllib.parse import urljoin
import hashlib,json,re
BASE='https://universalmind.tv/informatics/'
class Node:
 def __init__(self,tag='',attrs=()):self.tag=tag;self.attrs=dict(attrs);self.children=[]
class Tree(HTMLParser):
 def __init__(self):super().__init__();self.root=Node();self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in ['img','br','meta','link','input','hr','source']:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,s):self.stack[-1].children.append(s)
def text(n):
 if isinstance(n,str):return n
 if n.attrs.get('aria-hidden')=='true' or n.tag=='img':return ''
 return ''.join(text(c)for c in n.children)
def find(n,ident):
 if isinstance(n,str):return None
 if n.attrs.get('id')==ident:return n
 for child in n.children:
  value=find(child,ident)
  if value:return value

def html(blocks,level=2):
 result=[]
 for b in blocks:
  value=escape(b['text'])
  if b['kind']=='heading':result.append(f'<h{level}>'+value+f'</h{level}>')
  elif b['kind']=='link':result.append('<p><a href="'+escape(b['url'],quote=True)+'">'+value+'</a></p>')
  else:result.append('<p>'+value+'</p>')
 return '\n'.join(result)
def markdown(blocks,level=2):
 return '\n\n'.join(('#'*level+' '+b['text'])if b['kind']=='heading'else('['+b['text']+']('+b['url']+')')if b['kind']=='link'else b['text']for b in blocks)
def build(source):
 s=Path(source).read_text();a=s.index('<section id="about"');b=s.index('</dialog>',s.index('<dialog id="initial-focus"',a))+len('</dialog>')
 fragment=s[a:b];tree=Tree();tree.feed(fragment);about=find(tree.root,'about');dialog=find(tree.root,'initial-focus');blocks=[]
 def walk(n):
  if isinstance(n,str):return
  if n.attrs.get('id')in ['about-close','about-title']or n.attrs.get('aria-hidden')=='true':return
  if n.attrs.get('class')=='atlas-page-marker':return
  value=re.sub(r'\s+',' ',text(n)).strip()
  if n.tag=='button':
   if n.attrs.get('id')=='initial-focus-open':
    for child in dialog.children:
     if not isinstance(child,str)and child.tag in ['h2','p']and child.attrs.get('class')!='atlas-page-marker':walk(child)
   elif 'data-network'in n.attrs:blocks.append({'kind':'link','text':value,'url':BASE+'?about'})
   elif 'data-library'in n.attrs:blocks.append({'kind':'link','text':value,'url':BASE+'library.html?collection='+n.attrs['data-library']})
   return
  if n.tag in ['h2','h3','p','a']and value:
   item={'kind':'heading'if n.tag.startswith('h')else'link'if n.tag=='a'else'paragraph','text':value}
   if n.tag=='a':item['url']=urljoin(BASE,n.attrs['href'])
   blocks.append(item);return
  for child in n.children:walk(child)
 walk(about)
 assert blocks[0]['text']=='Bioinformatics platform for mental health'
 intro=blocks[0]['text']+'. '+blocks[1]['text']
 return {'source':'https://universalmind.tv/informatics/?about','source_file':'Informatics/index.html','source_fragment_sha256':hashlib.sha256(fragment.encode()).hexdigest(),'intro':intro,'blocks':blocks,'html':'<p class="intro">'+escape(intro)+'</p>'+html(blocks[2:]),'markdown':intro+'\n\n'+markdown(blocks[2:])}
if __name__=='__main__':print(json.dumps(build(Path(__file__).resolve().parents[1]/'Informatics/index.html'),ensure_ascii=False))
