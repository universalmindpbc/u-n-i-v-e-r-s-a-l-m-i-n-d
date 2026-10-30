"""Verify the separate continuation without applying it to the frozen review."""
from pathlib import Path
import datetime, hashlib, importlib.util, json, subprocess

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
FROZEN='54343360948f46dfbb66f1bb4ef3179eeb2013e7'
BATCH='batch-8bd70e21e48d9a70'
batch=json.loads((ROOT/'Informatics/review/domestic-violence-20261030'/f'{BATCH}.json').read_text())
originals={r['id']:r for r in batch['records']}
subprocess.run(['git','diff','--exit-code',FROZEN,'--','Informatics'],cwd=ROOT,check=True)
spec=importlib.util.spec_from_file_location('review_builder',ROOT/'tools/build-dv-review.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
new=[]
for lane in ['adult-therapy','reviews-prevention']:
    new.extend(json.loads((HERE/lane/'candidates.json').read_text()))
for row in new:builder.validate(row)
for field in ['id','doi','pmid']:
    values=[str(r[field]).lower() for r in batch['records']+new if r.get(field)]
    assert len(values)==len(set(values)),field

def value(row,path):
    for key in path.split('.'):row=row.get(key) if isinstance(row,dict) else None
    return row

identifiers=set();checked=set()
files=[('methods-children','proposed-deltas.json'),('methods-mindbody','field-deltas.json'),
       ('methods-adult','field-deltas.json'),('methods-prevention','proposed-revisions.json')]
for lane,name in files:
    for row in json.loads((HERE/lane/name).read_text()):
        identifier=row.get('id') or row['originalID'];original=originals[identifier]
        assert row['priorContentHash']==original['contentHash'],identifier
        identifiers.add(identifier)
        deltas=row.get('exactDeltas') or row.get('changes') or row.get('fieldChanges') or [row]
        for delta in deltas:
            field=delta.get('field') or delta['path']
            before=delta['before'] if 'before' in delta else delta['oldValue']
            assert value(original,field)==before,(identifier,field)
            checked.add((identifier,field))
for row in json.loads((HERE/'methods-adult/proposed-candidates.json').read_text()):
    builder.validate(row)
    assert row['review']['status']=='pending' and row['design']['crosses']<=1
for receipt in json.loads((HERE/'receipts.json').read_text())['files']:
    data=(HERE/receipt['lane']/receipt['file']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==receipt['sha256'],receipt
assert not list(HERE.rglob('private'))
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'frozenBatch':BATCH,'frozenWebsiteUnchanged':True,'frozenRecords':len(originals),
    'newAssessed':len(new),'newReviewReady':sum(r['reviewReady'] for r in new),
    'newHeld':sum(not r['reviewReady'] for r in new),'newIdentityCollisions':0,
    'existingRecordsReappraised':len(identifiers),'exactBeforeFieldsValidated':len(checked),
    'newPublicationAccess':{level:sum(r['access']['level']==level for r in new) for level in ['full-text','selected-methods','abstract']},
    'humanApproved':0,'continuationDeployed':False,'proposedChangesApplied':False}
(HERE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
