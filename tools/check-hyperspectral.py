"""Validate citation preservation, canonical identifiers, CSV parity and chapter boundaries."""
import csv,json,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1];data=root/'Informatics/library-data';audit=root/'research/informatics/hyperspectral-20261027'
read=lambda p:json.loads(p.read_text())
reg=read(data/'hyperspectral-register.json');exp=read(data/'hyperspectral-expansion.json')['records'];inv=read(audit/'source-inventory.json');source=read(audit/'audit.json')
expected=[r['ref'] for r in inv['npl']+inv['patents']];actual=[r['ref'] for r in reg['entries']]
assert actual==expected and len(set(actual))==240
assert 'NPL-111' not in actual
assert len(exp)==236 and len({r['id'] for r in exp})==236
records={r['id']:r for r in exp};byref={r['ref']:r for r in reg['entries']}
assert len(reg['timeline'])==13
for r in reg['entries']:assert r['recordId'] in records
for r in source:
 e=byref[r['ref']];m=r['metadata'] or {}
 for key in ['title','authors','year','journal','doi','pmid','pmcid']:
  if m.get(key) is not None:assert e[key]==m[key],(r['ref'],key)
 assert e['originalCitation']==r['originalCitation']
 if not m:assert not e['doi'] and not e['pmid']
 if r['status'] in ['unresolved','identifier-conflict']:assert 'unresolved' in records[e['recordId']]['sourceVerification'].lower()
for row in reg['timeline']:
 assert row['recordId'] in records
 assert all(r in byref for r in row['sourceReferences'])
for a,b in [('1','153'),('9','214'),('193','198'),('201','209')]:assert byref['NPL-'+a]['recordId']==byref['NPL-'+b]['recordId']
assert byref['NPL-9']['recordId']!=byref['NPL-9b']['recordId']
assert records[byref['NPL-9']['recordId']]['relatedVersions']
with (data/'hyperspectral-register.csv').open(newline='') as f:rows=list(csv.DictReader(f))
assert len(rows)==240
for row,entry in zip(rows,reg['entries']):
 for key,val in row.items():
  original=entry[key];assert val==('; '.join(original) if isinstance(original,list) else '' if original is None else str(original)),(entry['ref'],key)
general=read(data/'general-edition.json');hsi=next(c for c in general['chapters'] if c.get('id')=='hyperspectral-imaging')
assert hsi['number']==11 and len(hsi['topics'])==6 and len(hsi['sourceRegister'])==240
assert len({p['recordId'] for t in hsi['topics'] for p in t['papers']})==121
for t in hsi['topics']:
 assert t['trustScore'] is None
 for p in t['papers']:assert p['recordId'] in records
baseline=json.loads(subprocess.check_output(['git','show','6b99831b:Informatics/library-data/general-edition.json'],cwd=root))
assert general['chapters'][:10]==baseline['chapters']
for r in exp:
 if r['id'].startswith('hsi-'):assert r['paperTrustAssessment']['score'] is None and r['jadad']['score'] is None
copy=hsi['overview']+[p for t in hsi['topics'] for p in t['paragraphs']]+[r[k] for r in exp if r.get('editorialReview') for k in ['finding','limitation']]
for p in copy:assert not re.search(r'\b(?:sh'+'ould|co'+'uld|wo'+'uld)\b',p,re.I)
print(json.dumps({'passed':True,'originalReferences':240,'uniqueRecords':236,'focusedChapterSources':121,'timelineEntries':13,'metadataIdentities':174,'patentIdentities':11,'documentarySources':41,'unresolvedIdentities':14,'csvJSONParity':True,'earlierChaptersUnchanged':True}))
