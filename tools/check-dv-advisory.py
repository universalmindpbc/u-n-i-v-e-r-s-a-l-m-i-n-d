"""Check the later advisory against the preserved review, without changing it."""
from pathlib import Path
import collections, datetime, hashlib, json, subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'Informatics/review/domestic-violence-20261030'
FROZEN='54343360948f46dfbb66f1bb4ef3179eeb2013e7'
VERSION='advisory-20261030-r1'
advisory=json.loads((OUT/(VERSION+'.json')).read_text())
batch=json.loads((OUT/(advisory['frozenBatch']+'.json')).read_text())
rows={r['id']:r for r in batch['records']}
assert len(rows)==120
assert hashlib.sha256((OUT/(advisory['frozenBatch']+'.json')).read_bytes()).hexdigest()==advisory['frozenBatchSHA256']=='afd810cdaefa6be0eeed16490fbc9b0f3a580837ea5f8994f64aa5ca9373f3c8'
for name in ['index.json','batch-8bd70e21e48d9a70.json','batch-acb62474225f0804.json','screening.json','search-log.json']:
    prior=subprocess.check_output(['git','show',FROZEN+':Informatics/review/domestic-violence-20261030/'+name],cwd=ROOT)
    assert prior==(OUT/name).read_bytes(),name
assert len({r['id'] for r in advisory['records']})==20
assert collections.Counter(r['action'] for r in advisory['records'])=={'hold':3,'amend':5,'supplement':8,'existing-hold':4}
for a in advisory['records']:
    r=rows[a['id']]
    assert a['title']==r['title'] and a['priorContentHash']==r['contentHash'] and a['priorRevision']==r['revision']
    assert a['original']==dict(reviewReady=r['reviewReady'],reviewReadiness=r['reviewReadiness'],finding=r['finding'],limitation=r['limitation'],adverseFindings=r['quality']['adverseFindings'],crosses=r['design']['crosses'],access=r['access']['level'])
    assert a['humanApproval'] is False and a['assessmentChanged'] is False
    assert a['holdCurrentRevision']==(a['action'] in ['hold','amend','existing-hold'])
    assert a['sourceURLs'] and all(u.startswith('https://') for u in a['sourceURLs'])
    assert r['review']['status']=='pending'
    if a['crossVerificationOnHold']:assert a['id'] in ['dv-children-25596929','dv-children-35285428']
assert sum(r['crossVerificationOnHold'] for r in advisory['records'])==2
assert (OUT/(VERSION+'.json')).read_bytes()==(ROOT/'research/informatics/dot-dv-20261030/continuation/approval-followup/advisory.json').read_bytes()
protected=['Informatics/library-data','Informatics/library.js','Informatics/library-model.js','Informatics/library.html','Informatics/read','Informatics/exports','cloudflare','llms.txt','sitemap.xml']
subprocess.run(['git','diff','--exit-code',FROZEN,'--',*protected],cwd=ROOT,check=True)
subprocess.run(['python3','tools/check-dv-review.py'],cwd=ROOT,check=True)
subprocess.run(['python3','tools/export-informatics.py','--check'],cwd=ROOT,check=True)
report=dict(passed=True,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),advisoryRevision=VERSION,
    originalAssessmentsAndHashesUnchanged=120,originalFilesByteIdentical=5,exactAdvisoryReferences=20,
    newHolds=3,amendmentsBeforeApproval=5,supplementaryAppraisals=8,existingHolds=4,
    pendingReviewPreserved=True,approvedCorpusUnchanged=True,sourceCopiesPublished=False)
(ROOT/'research/informatics/dot-dv-20261030/continuation/approval-followup/validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
