"""Check review integrity, appraisal boundaries, deduplication and library isolation."""
from pathlib import Path
import csv,hashlib,importlib.util,json,subprocess
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'Informatics/review/youth-20261102';SRC=ROOT/'research/informatics/youth-20261102'
def sha(b):return hashlib.sha256(b).hexdigest()
def canon(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
i=json.loads((OUT/'index.json').read_text());raw=(OUT/i['batch']).read_bytes();assert sha(raw)==i['sha256'];b=json.loads(raw)
assert sha((OUT/i['csv']).read_bytes())==i['csvSHA256']
r=b['records'];byid={a['id']:a for a in r};assert len(byid)==len(r)
assert len({a['pmid'] for a in r})==len(r)
assert len({a['doi'].lower() for a in r if a['doi']})==sum(bool(a['doi']) for a in r)
for a in r:
 content={k:v for k,v in a.items() if k not in ['contentHash','revision']};assert sha(canon(content))==a['contentHash'],a['id'];assert a['revision']=='r1-'+a['contentHash'][:12]
 assert a['review']['status']=='pending' and a['review']['reviewer'] is None and a['review']['approvedAt'] is None
 assert a['design']['approvedCrosses'] is None and not a['productionEligible'] and not a['approvedRetrievalEligible']
 assert a['sources'] and all(s.get('url','').startswith('https://') for s in a['sources'])
 assert a['sourceAccess']['fullTextAppraisalClaim'] is False
 if a['quality']['tier'] in ['qualified','priority'] and a['reviewReady']:
  assert a['sourceAccess']['methodsInspected'] and a['sourceAccess']['scope']!='abstract' and not a['holdReason'] and not a['duplicateOf'],a['id']
 if a['design']['proposedCrosses']==3:assert a['design']['doubleBlindingVerified'] and a['design']['randomizationMethodsInspected']
 if a['design']['proposedCrosses']>=2:assert a['design']['category']=='randomized-report' and a['sourceAccess']['methodsInspected']
 if a['design']['category']=='review':assert a['design']['proposedCrosses']==1
 if a['duplicateOf']:assert a['duplicateOf'] in byid and not a['reviewReady']
 assert a['quality']['jadadScore'] is None and a['quality']['formalRiskOfBiasToolApplied'] is False
with (OUT/i['csv']).open(newline='') as f:cr=list(csv.DictReader(f))
assert len(cr)==len(r)
assert {a['id']:json.loads(a['recordJson']) for a in cr}==byid,'CSV/JSON equivalence'
q=[a for a in r if a['reviewReady'] and a['quality']['tier'] in ['priority','qualified'] and not a['duplicateOf']]
assert len(q)==105 and sum(not a['existingRepositoryMatches'] for a in q)==100
assert b['metrics']==i['metrics']==json.loads((SRC/'counts.json').read_text())
assert byid['youth-pmid-39776457']['duplicateOf']=='youth-pmid-32527236'
assert byid['youth-pmid-19798037']['studyFamilyId']==byid['youth-pmid-21559213']['studyFamilyId']
assert byid['youth-pmid-37213197']['design']['proposedCrosses']==1
assert byid['youth-pmid-29622047']['design']['proposedCrosses']==3
for k in ['38146476','38414520','40755543','39243081','41235266']:
 assert not byid['youth-pmid-'+k]['reviewReady']
assert 'youth-pmid-40421183' not in byid
guard=(ROOT/'Informatics/review/.htaccess').read_text();assert 'staging\\.universalmind\\.tv' in guard and '[F,L]' in guard and 'noindex, nofollow, noarchive' in guard
for p in OUT.glob('*.html'):assert 'noindex,nofollow,noarchive' in p.read_text()
protected=['Informatics/library-data','Informatics/library.js','Informatics/library-model.js','Informatics/library.html','Informatics/read','Informatics/exports','cloudflare','llms.txt','sitemap.xml']
releaseBaseline=json.loads((SRC/'release-baseline.json').read_text())['commit'] if (SRC/'release-baseline.json').exists() else b['baselineCommit']
subprocess.run(['git','diff','--exit-code',releaseBaseline,'--',*protected],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
for path,h in json.loads((SRC/'baseline-corpus.json').read_text())['sourceSHA256'].items():assert sha((ROOT/path).read_bytes())==h,path
spec=importlib.util.spec_from_file_location('exports',ROOT/'tools/export-informatics.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);inventory=mod.inventory()
assert not any(s['source_path'].startswith('review/') for s in inventory['sources']+inventory['assets'])
assert inventory['dataset_version']==json.loads((ROOT/'Informatics/exports/manifest.json').read_text())['dataset_version']
report={'passed':True,'immutableRecordHashes':len(r),'jsonCsvEquivalent':True,'qualifiedPapers':len(q),'qualifiedNew':sum(not a['existingRepositoryMatches'] for a in q),'approvedCorporaUnchanged':True,'releaseBaselineCommit':releaseBaseline,'reviewExcludedFromApprovedExports':True,'approvedDatasetVersion':inventory['dataset_version'],'allHumanDecisionsPending':True,'designMarkerBoundariesPassed':True}
(SRC/'source-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
