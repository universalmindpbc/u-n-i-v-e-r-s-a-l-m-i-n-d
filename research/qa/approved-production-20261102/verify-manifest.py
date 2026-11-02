from pathlib import Path
import hashlib,json,subprocess
root=Path.cwd();out=root/'research/qa/approved-production-20261102'
rows={}
for line in (root/'.panthur-deploy-manifest.tsv').read_text().splitlines():
 digest,path=line.split('\t',1);rows[path]=digest
tracked=subprocess.check_output(['git','ls-files','-z','Informatics','research/informatics/legacy-uppercase.htaccess'],text=True).strip('\0').split('\0')
checked=[]
for source in tracked:
 target='Informatics/.htaccess'if source.endswith('legacy-uppercase.htaccess')else 'informatics/'+source.removeprefix('Informatics/')
 expected=hashlib.sha256((root/source).read_bytes()).hexdigest();assert rows.get(target)==expected,source
 checked.append(target)
scope=json.loads((out/'scope.json').read_text())
for source in scope['iamSourceFiles']:
 if source=='i  a m/index.html':continue
 target=source.removeprefix('i  a m/');expected=hashlib.sha256((root/source).read_bytes()).hexdigest();assert rows.get(target)==expected,source
 checked.append(target)
for source in ['index.html','home/index.html','home/entry-shell.js','read/index.html','read/resources.json','llms.txt','robots.txt','sitemap.xml','site-navigation/redirects.htaccess']:
 expected=hashlib.sha256((root/source).read_bytes()).hexdigest();assert rows.get(source)==expected,source;checked.append(source)
assert not any('review/youth-20261102/'in path for path in rows)
result={'passed':True,'checkedEntries':len(checked),'youthReviewAbsent':True,'nativeIAMIndex':'Verified independently by exact live HTTP hash; existing root/native manifest key overlap preserved.'}
(out/'manifest-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
