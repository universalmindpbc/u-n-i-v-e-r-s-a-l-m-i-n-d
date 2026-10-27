"""Verify the exact approved Informatics release on production without changing it."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import hashlib,json,subprocess,re,html
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'research/informatics/hyperspectral-production-20261027'
BASE='https://universalmind.tv/'
inputs=json.loads((OUT/'release-inputs.json').read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(url):
 raw=subprocess.check_output(['curl','--silent','--show-error','--location','--retry','2','--max-time','180','--write-out','\n%{http_code}',url]);body,status=raw.rsplit(b'\n',1);return body,int(status)
def reverse_email_obfuscation(body):
 text=body.decode('utf-8')
 def decode(match):
  raw=bytes.fromhex(match[1]);return html.escape(bytes(c^raw[0] for c in raw[1:]).decode('utf-8'),quote=False)
 text=re.sub(r'<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]</a>',decode,text)
 text=re.sub(r'<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]</span>',decode,text)
 text=re.sub(r'href="/cdn-cgi/l/email-protection#([0-9a-f]+)"',lambda m:'href="mailto:'+decode(m)+'"',text)
 text=re.sub(r'<script data-cfasync="false" src="/cdn-cgi/scripts/[0-9a-f]+/cloudflare-static/email-decode.min.js"></script>','',text)
 return text.encode('utf-8')
def check(name):
 remote='informatics/'+name[len('Informatics/'):] if name.startswith('Informatics/') else name
 if name in ['Informatics/library.js','Informatics/library-model.js','Informatics/library.css']:remote+='?v=hsi-20261027'
 elif name.startswith('Informatics/library-data/') and name.endswith('.json'):remote+='?v=hyperspectral-20261027'
 body,status=fetch(BASE+remote);digest=sha(body);expected=sha((ROOT/name).read_bytes())
 transform=None;normalized=digest
 if digest!=expected and name.endswith('.html') and b'data-cfemail=' in body:
  normalized=sha(reverse_email_obfuscation(body));transform='Cloudflare email obfuscation; decoded text and all remaining bytes match the committed file'
 assert status==200 and normalized==expected,(name,status,digest,expected)
 return {'path':name,'url':BASE+remote,'status':status,'bytes':len(body),'sha256':digest,'committedSHA256':expected,'edgeTransformation':transform}
changed=subprocess.check_output(['git','diff','--name-only',inputs['productionBefore'],inputs['approvedStaging'],'--','Informatics','sitemap.xml','llms.txt'],cwd=ROOT,text=True).splitlines()
small=[p for p in changed if not p.endswith('.bin')];parts=[p for p in changed if p.endswith('.bin')]
with ThreadPoolExecutor(max_workers=6) as ex:assets=list(ex.map(check,small))
print('Production web/data assets verified:',len(assets),'Host-transformed HTML:',sum(bool(a['edgeTransformation']) for a in assets),flush=True)
(OUT/'http-assets-checkpoint.json').write_text(json.dumps(assets,indent=2)+'\n')
with ThreadPoolExecutor(max_workers=3) as ex:binary=list(ex.map(check,parts))
(OUT/'http-parts-checkpoint.json').write_text(json.dumps(binary,indent=2)+'\n')
print('Complete export parts verified:',len(binary),flush=True)
preflight=json.loads((OUT/'preflight.json').read_text());unrelated=[]
for row,source in zip(preflight['unrelatedProductionBaseline'],['i  a m/index.html','i  a m/research.html','index.html']):
 body,status=fetch(row['url']);previous=subprocess.check_output(['git','show',inputs['productionBefore']+':'+source],cwd=ROOT)
 decoded=reverse_email_obfuscation(body) if b'data-cfemail=' in body else body
 assert status==200 and decoded==previous,row['url']
 unrelated.append({**row,'rawResponseUnchanged':sha(body)==row['sha256'],'priorProductionSourceSHA256':sha(previous),'matchesPriorProductionSource':True,'hostEmailTransformation':b'data-cfemail=' in body})
robots,status=fetch(BASE+'robots.txt');assert status==200 and robots==(ROOT/'robots.txt').read_bytes()
stage_robots,status=fetch('https://staging.universalmind.tv/robots.txt');assert status==200 and stage_robots==(ROOT/'robots-staging.txt').read_bytes()
production_headers=subprocess.check_output(['curl','--fail','--silent','--show-error','--head',BASE+'informatics/read/hyperspectral/index.html'],text=True)
staging_headers=subprocess.check_output(['curl','--fail','--silent','--show-error','--head','https://staging.universalmind.tv/informatics/read/hyperspectral/index.html'],text=True)
assert 'noindex' not in production_headers.lower();assert 'noindex' in staging_headers.lower()
result={'passed':True,'verifiedAt':datetime.now(timezone.utc).isoformat(),**inputs,'assets':assets,'fullExportParts':binary,'hostTransformedHTML':[a['path'] for a in assets if a['edgeTransformation']],'exportBytesVerified':sum(r['bytes'] for r in binary),'unrelatedProductionUnchanged':unrelated,'productionRobotsMatch':True,'stagingRobotsMatch':True,'productionIndexingEnabled':True,'stagingIndexingDisabled':True}
(OUT/'http-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'verifiedWebDataAssets':len(assets),'byteExactAssets':sum(not a['edgeTransformation'] for a in assets),'hostTransformedHTML':sum(bool(a['edgeTransformation']) for a in assets),'completeExportParts':len(binary),'exportBytesVerified':result['exportBytesVerified'],'unrelatedProductionPagesUnchanged':len(unrelated),'productionAndStagingCrawlerBoundariesVerified':True}))
