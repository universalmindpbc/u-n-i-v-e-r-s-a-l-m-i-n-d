import hashlib,json,pathlib,subprocess,datetime,re
root=pathlib.Path('/private/tmp/um-directory-20261028/repo')
checks=[]
html=(root/'home/index.html').read_text()
for rel in ['index.html','home/index.html','home/directory.css','home/directory.js','home/directory-story.js','home/directory-rain.js','home/assets/festival-loop.mp4','home/assets/festival-poster.jpg','home/entry-shell.css','home/entry-shell.js']:
 query=''
 if rel.endswith(('.css','.js')):
  query='?'+re.search(re.escape(rel.split('/')[-1])+r'\?([^\"\s]+)',html).group(1)
 if rel.endswith('festival-loop.mp4'):
  query='?'+re.search(r'festival-loop\.mp4\?([^\"\s]+)',html).group(1)
 url='https://staging.universalmind.tv/'+rel+query
 body=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','30',url],check=True,capture_output=True).stdout
 actual=hashlib.sha256(body).hexdigest();expected=hashlib.sha256((root/rel).read_bytes()).hexdigest()
 assert actual==expected,rel
 checks.append({'url':url,'sha256':actual,'matchesCommittedSource':True,'bytes':len(body)})
prod=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','30','https://universalmind.tv/'],check=True,capture_output=True).stdout
baseline=pathlib.Path('/private/tmp/um-directory-20261028/production-landing.html').read_bytes()
assert prod==baseline
hash_block=lambda text:re.search(r'const allowedPasswordHashes = new Set\(\[([\s\S]*?)\]\)',text).group(1)
staging_reference=subprocess.check_output(['git','show','origin/staging:index.html'],cwd=root,text=True)
assert hash_block(staging_reference)==hash_block((root/'index.html').read_text())
report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'assets':checks,'productionLandingUnchanged':True,'passwordAllowlistMatchesConcurrentStaging':True,'productionLandingSha256':hashlib.sha256(prod).hexdigest(),'passed':True}
pathlib.Path('/private/tmp/um-directory-20261028/entry-player-qa/http-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'matchedAssets':len(checks),'productionLandingUnchanged':True,'passwordAllowlistMatchesConcurrentStaging':True,'passed':True}))
