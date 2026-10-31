"""Check frozen audit integrity and exclusion of unapproved evidence."""
import hashlib
import importlib.util
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'Informatics/review/domestic-violence-20261031'
SOURCE = ROOT / 'research/informatics/dot-dv-20261031'
config = json.loads((SOURCE / 'audit-policy.json').read_text())
index = json.loads((OUT / 'index.json').read_text())
batch = json.loads((OUT / index['batch']).read_text())
rows = batch['records']
by_id = {r['id']: r for r in rows}
assert len(rows) == len(by_id) == 130
assert len({r['doi'].casefold() for r in rows}) == 130
pmids = [r['pmid'] for r in rows if r['pmid']]
assert len(pmids) == len(set(pmids))
assert not batch['productionEligible'] and not index['productionEligible']
assert {r['id'] for r in rows if not r['reviewReady']} == set(config['withheld'])
for r in rows:
    content = {k:v for k,v in r.items() if k not in ['contentHash','revision']}
    digest = hashlib.sha256(json.dumps(content, ensure_ascii=False, sort_keys=True, separators=(',',':'), allow_nan=False).encode()).hexdigest()
    assert digest == r['contentHash'] and r['revision'] == 'audit-r2-' + digest[:12], r['id']
    assert r['review'] == {'status':'pending','reviewer':None}
    assert not r['paperTrustAssessment']['humanApproval']
    assert not r['publicationRecommendation']['humanReleaseApproval']
    assert r['reviewReady'] == (r['publicationRecommendation']['status'] == 'recommended-summary')
    assert r['paperTrustAssessment']['displayCrosses'] == r['design']['crosses']
    assert r['design']['crosses'] in [0,1], 'No verified double-blind trial in this source set'
    if r['studyDesignAssessment']['category'] == 'review':
        assert r['design']['crosses'] == 0
    assert r['evidence']['outcomes'] == r['outcomes'] and r['evidence']['access'] == r['access']
    assert r['finding'] and r['limitation'] and all(s['url'].startswith('https://') for s in r['sources'])
    assert r['jadad']['score'] is None
recommended = [r for r in rows if r['reviewReady']]
assert len(recommended) == 117
assert Counter(r['access']['level'] for r in recommended) == batch['counts']['recommendedAccess']
assert sum(bool(r['existingRepositoryMatches']) for r in recommended) == 2
coverage = json.loads((OUT / 'coverage.json').read_text())
assert coverage['batchRevision'] == batch['batchRevision']
assert {g['id']:g['count'] for g in coverage['groups']} == {'emdr':10,'mindfulness':9,'music':8}
for group in coverage['groups']:
    assert len(group['recordIds']) == len(set(group['recordIds'])) == group['count']
    assert all(by_id[key]['reviewReady'] for key in group['recordIds'])
for key in ['dv-children-25596929','dv-children-35285428']:
    assert by_id[key]['design']['crosses'] == 0
    assert by_id[key]['studyDesignAssessment']['isRandomizedControlledTrial'] is None
assert by_id['dv-children-25596929']['access']['level'] == 'selected-methods'
assert '7 did not' in by_id['dv-children-25596929']['quality']['attrition']
assert by_id['dv-reviews-27599224']['access']['level'] == 'selected-methods'
assert '0.25–1.12' in by_id['dv-reviews-27599224']['finding']
assert 'separate parental-distress' in by_id['dv-children-20712147']['finding']
for key in ['dv-adult-therapy-37889918','dv-adult-therapy-34143803','dv-adult-therapy-23598181','dv-reviews-26613288','dv-mindbody-88e29294631c']:
    assert by_id[key]['editorialAudit']['appliedProposals'], key
frozen = ROOT / 'Informatics/review/domestic-violence-20261030/batch-8bd70e21e48d9a70.json'
assert hashlib.sha256(frozen.read_bytes()).hexdigest() == config['frozenSHA256']
old = json.loads(frozen.read_text())
for r in old['records']:
    assert by_id[r['id']]['editorialAudit']['priorContentHash'] == r['contentHash']
protected = ['Informatics/library-data','Informatics/library.js','Informatics/library-model.js',
             'Informatics/library.html','Informatics/read','Informatics/exports','Informatics/index.html',
             'cloudflare','llms.txt','sitemap.xml']
integration=ROOT/'Informatics/library-data/domestic-violence-expansion.json'
if integration.exists():
    published=json.loads(integration.read_text())
    assert published['sourceBatch']==batch['batchRevision']
    assert {r['publicationApproval']['sourceContentHash'] for r in published['records']}=={r['contentHash'] for r in recommended}
    assert all(r['publicationApproval']['status']=='approved-for-publication' for r in published['records'])
else:
    subprocess.run(['git','diff','--exit-code',config['baselineCommit'],'--',*protected],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
spec=importlib.util.spec_from_file_location('exports',ROOT/'tools/export-informatics.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
inventory=module.inventory()
assert not any(r['source_path'].startswith('review/') for r in inventory['sources']+inventory['assets'])
manifest=json.loads((ROOT/'Informatics/exports/manifest.json').read_text())
assert inventory['dataset_version']==manifest['dataset_version']
guard=(ROOT/'Informatics/review/.htaccess').read_text()
assert 'staging\\.universalmind\\.tv' in guard and '[F,L]' in guard
assert 'noindex,nofollow,noarchive' in (OUT/'index.html').read_text()
print(json.dumps({'passed':True,'records':130,'recommended':117,'withheld':13,'frozenHashesPreserved':120,
                  'approvedIntegration':integration.exists(),
                  'approvedExportVersion':inventory['dataset_version'],'pendingEvidenceExcluded':True}))
