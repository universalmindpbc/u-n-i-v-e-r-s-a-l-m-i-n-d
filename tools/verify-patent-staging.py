"""Check private-route denial, authenticated document integrity and logout."""
import hashlib,http.cookiejar,json,os,re,urllib.request,urllib.error
from pathlib import Path
from pypdf import PdfReader

BASE='https://staging.universalmind.tv/patent/'
keyfile=Path(os.environ['PATENT_ACCESS_FILE'])
key=re.search(r'Access key:\n([a-f0-9]{64})',keyfile.read_text()).group(1)
expected_hash=hashlib.sha256((keyfile.parent/'Australian-Provisional-Specification.pdf').read_bytes()).hexdigest()
expected_pages=len(PdfReader(keyfile.parent/'Australian-Provisional-Specification.pdf').pages)
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
results={}
def call(path,data=None,origin='https://staging.universalmind.tv'):
 # The host rejects the default Python agent with Cloudflare error 1010.
 headers={'Origin':origin,'User-Agent':'curl/8.7.1'}
 if data is not None:headers['Content-Type']='application/json'
 req=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
 try:
  with client.open(req,timeout=90) as r:return r.status,r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
for path,status in [('data.php',401),('document.php',401),('receipt.php',401),('.private/receipt.jpg',403),('.private/access.json',403),('.private/document.json',403),('.private/specification.pdf',403),('.private/access-probe.txt',403)]:
 actual,body,headers=call(path);assert actual==status,(path,actual);results[path]=actual
status,body,_=call('');assert status==200
assert b'System and Method for Non-Invasive' not in body
csrf=re.search(rb'name="csrf-token" content="([a-f0-9]+)"',body).group(1).decode()
status,_,_=call('login.php',{'csrf':csrf,'key':'0'*64});assert status==401
status,_,_=call('login.php',{'csrf':csrf,'key':key},'https://example.invalid');assert status==403
status,_,_=call('login.php',{'csrf':csrf,'key':key});assert status==200
assert all(c.secure and c.has_nonstandard_attr('HttpOnly') for c in jar)
status,raw,headers=call('data.php');assert status==200
doc=json.loads(raw);assert len(doc['pages'])==expected_pages and doc['status']=='private-filed'
assert doc['filing']['application_number']=='2026908928'
assert doc['filing']['transaction_reference']=='APSZ-2616390071'
status,receipt,headers=call('receipt.php');assert status==200 and receipt.startswith(b'\xff\xd8\xff')
assert 'no-store' in headers.get('Cache-Control','')
assert hashlib.sha256(receipt).hexdigest()==hashlib.sha256((keyfile.parent/'receipt.jpg').read_bytes()).hexdigest()
results['receipt_excerpt_sha256']=hashlib.sha256(receipt).hexdigest()
status,html,_=call('');assert status==200
assert all(v in html for v in [b'2026908928',b'APSZ-2616390071',b'AMCZ-2616390323'])
assert b'Not yet filed' not in html and b'Filing receipt pending' not in html
results['filing_receipt_verified']=True
assert len({p['page'] for p in doc['pages']})==expected_pages
titles=[s['title'] for s in doc['sections']]
ordered=['15. Proposed claims, part 1','16. Proposed claims, part 2','17. Abstract','Drawings and figure descriptions','Drawing sheets','Appendix A. Universal Light algorithm and research architecture']
positions=[titles.index(t) for t in ordered]
assert positions==sorted(positions)
assert all(t.startswith('Appendix') for t in titles[positions[-1]:])
results['notion_section_order']=True
results['key_section_pages']={s['title']:s['page'] for s in doc['sections'] if s['title'] in ordered}
status,pdf,headers=call('document.php');assert status==200 and pdf.startswith(b'%PDF')
assert hashlib.sha256(pdf).hexdigest()==doc['sha256']==expected_hash
assert 'no-store' in headers.get('Cache-Control','')
results.update({'authenticated_pages':len(doc['pages']),'pdf_bytes':len(pdf),'pdf_sha256':doc['sha256'],'invalid_key':401,'cross_origin_login':403,'secure_httponly_cookie':True})
status,_,_=call('login.php',{'csrf':csrf,'action':'logout'});assert status==200
status,_,_=call('data.php');assert status==401;results['logout_denies_data']=True
dest=Path(os.environ['PATENT_QA_OUTPUT']);dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
