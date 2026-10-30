"""Verify candidate provenance, study-design boundaries and corpus isolation."""
from pathlib import Path
import hashlib, importlib.util, json, subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'Informatics/review/domestic-violence-20261030'
index=json.loads((OUT/'index.json').read_text())
batch=json.loads((OUT/index['batch']).read_text())
assert index['productionEligible'] is False and batch['productionEligible'] is False
assert batch['reviewStatus']=='pending'
ids=set();dois=set();pmids=set()
for row in batch['records']:
    assert row['id'] not in ids;ids.add(row['id'])
    for field,seen in [('doi',dois),('pmid',pmids)]:
        if row.get(field):
            value=str(row[field]).lower();assert value not in seen,(field,value);seen.add(value)
    assert row['review']['status']=='pending' and row['review'].get('reviewer') is None
    assert row['provenance']=='Discovered by AI'
    saved=row['contentHash'];content={k:v for k,v in row.items() if k not in ['contentHash','revision']}
    actual=hashlib.sha256(json.dumps(content,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()
    assert saved==actual,row['id']
    assert row['revision']=='r1-'+saved[:12]
    if row['design']['crosses']==2:assert row['design'].get('doubleBlindingVerified') is True
    if row['studyDesignAssessment']['category']=='review':assert row['design']['crosses']==0
    if not row['paperTrustAssessment']['peerReviewed']:assert row['paperTrustAssessment']['score'] is None
    assert row['jadad']['score'] is None,'No unsupported numeric Jadad scores'
assert len(ids)==batch['metrics']['assessed']
assert sum(r['reviewReady'] for r in batch['records'])==batch['metrics']['reviewReady']
assert sum(not r['existingRepositoryMatches'] for r in batch['records'])==batch['metrics']['deduplicatedNew']
source=json.loads((ROOT/'research/informatics/dot-dv-20261030/candidate-assessments.json').read_text())
assert len(source['records'])==len(ids)
assert not any(r.get('screened') is False for r in json.loads((OUT/'screening.json').read_text()))
guard=(ROOT/'Informatics/review/.htaccess').read_text()
assert 'staging\\.universalmind\\.tv' in guard and '[F,L]' in guard and 'noindex, nofollow, noarchive' in guard
assert 'noindex,nofollow,noarchive' in (OUT/'index.html').read_text()
# Verify current source files, not just HEAD: review data must not alter existing
# publications, index classifications, assistant code or generated discovery.
protected=['Informatics/library-data','Informatics/library.js','Informatics/library-model.js','Informatics/library.html','Informatics/read','Informatics/exports','cloudflare','llms.txt','sitemap.xml']
subprocess.run(['git','diff','--exit-code',batch['baselineCommit'],'--',*protected],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
for p in [ROOT/'llms.txt',ROOT/'sitemap.xml',ROOT/'Informatics/llms.txt']:
    assert '/review/domestic-violence-' not in p.read_text()
spec=importlib.util.spec_from_file_location('exports',ROOT/'tools/export-informatics.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
inventory=module.inventory()
assert not any(s['source_path'].startswith('review/') for s in inventory['sources']+inventory['assets'])
manifest=json.loads((ROOT/'Informatics/exports/manifest.json').read_text())
assert inventory['dataset_version']==manifest['dataset_version'],'Approved export inventory changed'
print(json.dumps({'passed':True,'records':len(ids),'reviewReady':batch['metrics']['reviewReady'],'immutableHashes':len(ids),'approvedSourceFilesUnchanged':True,'approvedExportVersion':inventory['dataset_version'],'pendingReviewExcludedFromExports':True,'trialCrossesFollowVerifiedDesign':True}))
