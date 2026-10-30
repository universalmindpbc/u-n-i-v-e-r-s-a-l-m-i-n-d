"""Build immutable, pending-review evidence separately from approved research."""
from pathlib import Path
import argparse, hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'research/informatics/dot-dv-20261030'
OUT = ROOT / 'Informatics/review/domestic-violence-20261030'

def canonical(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()

def digest(data):
    return hashlib.sha256(canonical(data)).hexdigest()

def identity(r):
    if r.get('doi'): return 'doi:' + re.sub(r'^https?://(?:dx\.)?doi.org/', '', str(r['doi']).lower()).strip().rstrip('.')
    if r.get('pmid'): return 'pmid:' + str(r['pmid'])
    return 'title:' + re.sub(r'[^a-z0-9]', '', r.get('title', '').lower())

def is_review(r):
    return bool(re.search(r'review|meta.analysis|synthesis', r['publicationType']+' '+r['design']['type'], re.I))

def validate(r):
    required=['id','title','authors','year','journal','doi','pmid','trialRegistration','collection','interventionFamily','publicationType','studyFamilyId','existingRepositoryMatches','relevance','age','country','setting','sampleSize','intervention','comparator','outcomes','finding','limitation','design','quality','access','sources','publicationStatus','recommendationRationale','review','assessmentStatus','assessmentNotes']
    assert not set(required)-r.keys(), (r.get('id'), 'missing', set(required)-r.keys())
    assert r['review']['status']=='pending' and r['review'].get('reviewer') is None, r['id']
    assert r['assessmentStatus']=='assessed', r['id']
    assert r['collection'] in ['sound','vision','language']
    assert r['relevance']['relation'] in ['direct','context','related']
    assert r['access']['level'] in ['abstract','selected-methods','full-text'], r['id']
    assert r['sources'] and all(s['url'].startswith('https://') for s in r['sources']), r['id']
    assert r['finding'] and r['limitation'] and r['relevance']['transferLimit'], r['id']
    assert r['design']['crosses'] in [0,1,2]
    if is_review(r): assert r['design']['crosses']==0, (r['id'],'review trial crosses')
    if r['design']['crosses']:
        assert r['design']['randomizationEvidence'] and r['design']['crossRationale'], r['id']
    if r['design']['crosses']==2:
        assert r['design'].get('doubleBlindingVerified') is True, (r['id'],'explicit masking verification required')
    assert not re.search(r'^(retracted|withdrawn)',r['publicationStatus']['status'],re.I),r['id']

def prepare(r):
    r=json.loads(json.dumps(r))
    validate(r)
    c=r['design']['crosses']; review=is_review(r)
    nonpeer=bool(re.search(r'thesis|dissertation|preprint|protocol',r['publicationType']+' '+r['publicationStatus']['status'],re.I))
    explicit_nontrial=review or bool(re.search(r'non.?random|single.arm|case |qualitative|observational|pre.post',r['design']['type'],re.I))
    trial=True if c else False if explicit_nontrial else None
    r.setdefault('reviewReady',True)
    r.setdefault('reviewReadiness','ready-with-access-limits' if r['access']['level']!='full-text' else 'ready')
    r['studyDesignAssessment']={
        'category':'review' if review else 'double-blind-rct' if c==2 else 'rct' if c==1 else 'nonrandomized-or-unestablished',
        'isRandomizedControlledTrial':trial,
        'basis':r['design']['randomizationEvidence'],
        'sources':[s['url'] for s in r['sources']],
        'reviewScope':r['access']['level'],
    }
    r['paperTrustAssessment']={
        'scope':'Paper','status':'not-applicable' if nonpeer else 'assessed','score':None if nonpeer else 3 if c==2 else 2 if c==1 else 1,
        'randomizedControlledTrial':trial,'peerReviewed':not nonpeer,
        'blinding':'double' if c==2 else 'not-confirmed' if c==1 else 'not-applicable',
        'basis':r['design']['crossRationale'],'sources':[s['url'] for s in r['sources']],
        'reviewScope':r['access']['level'],'humanApproval':False,
        'displayCrosses':c,'maskingRoles':r['design']['masking'],
    }
    r['jadad']={'status':'not-applicable' if review or 'not applicable' in str(r['quality']['jadad']).lower() else 'unassessed','score':None}
    r['evidence']={'population':r['relevance'],'intervention':r['intervention'],'comparator':r['comparator'],'outcomes':r['outcomes'],'access':r['access']}
    r['citationSnapshot']={'count':None,'source':None,'retrievedAt':None,'status':'not-assessed'}
    r['provenance']='Discovered by AI'
    r['contentHash']=digest(r)
    r['revision']='r1-'+r['contentHash'][:12]
    return r

def build(check=False):
    source=json.loads((SOURCE/'candidate-assessments.json').read_text())
    screening=json.loads((SOURCE/'screening.json').read_text())
    logs=json.loads((SOURCE/'search-log.json').read_text())
    records=[prepare(r) for r in source['records']]
    assert len({identity(r) for r in records})==len(records),'Duplicate publications in candidate source'
    assert len({r['id'] for r in records})==len(records)
    records.sort(key=lambda r:(-r['design']['crosses'],not is_review(r),r['collection'],-int(r['year']),r['title']))
    unique={identity(r) for r in screening if r.get('title') or r.get('doi') or r.get('pmid')}
    inspected={identity(r) for r in screening if r.get('screeningMethod')!='automated-title'}
    primary=[r for r in records if not is_review(r) and r.get('independentPrimaryStudy') is not False]
    groups={r['studyFamilyId'] for r in primary}
    uncertain={r['studyFamilyId'] for r in primary if r.get('familyLinkageUncertain') is not False}
    randomized={r['studyFamilyId'] for r in primary if r['design']['crosses']>0}
    registered={r['studyFamilyId'] for r in primary if r['design']['crosses']>0 and r.get('trialRegistration')}
    candidate_keys={identity(r) for r in records}
    screen_groups={}
    for row in screening:screen_groups.setdefault(identity(row),[]).append(row)
    # A preprint and its journal article can have different DOIs. Preserve both
    # identifier records, while disclosing provisional same-title version links.
    by_title={}
    for key,rows in screen_groups.items():
        for row in rows:
            title=re.sub(r'[^a-z0-9]','',row.get('title','').lower())
            if title:by_title.setdefault(title,{})[key]=row
    version_groups=[]
    for title,rows in by_title.items():
        if len(rows)>1 and any(re.match(r'doi:10\.(1101|21203|31234)/',key) for key in rows):
            version_groups.append({'title':next(iter(rows.values()))['title'],
                'identifiers':sorted(rows),'status':'provisional-version-link',
                'basis':'Matching normalized title across preprint/final or preprint-version identifiers; not an independent-cohort assertion.'})
    version_groups.sort(key=lambda g:g['title'])
    decisions={};screen_summary=[]
    for key,rows in screen_groups.items():
        kinds=[r.get('decision','').lower() for r in rows]
        decision='assessed' if key in candidate_keys else 'defer' if any(k.startswith('defer') for k in kinds) else 'exclude' if any(k.startswith('excl') for k in kinds) else 'existing' if 'existing' in kinds else 'other'
        decisions[key]=decision
        if decision in ['exclude','defer']:
            matches=[r for r in rows if r.get('decision','').lower().startswith(decision)]
            row=matches[0]
            screen_summary.append({**{k:row.get(k) for k in ['title','doi','pmid','sourceURL','screeningMethod']},'decision':decision,'reason':' / '.join(dict.fromkeys(r.get('reason','') for r in matches))})
    existing=sum(bool(r['existingRepositoryMatches']) for r in records)
    metrics={'screenedRaw':len(screening),'screenedUnique':len(unique),'sourceInspectedUnique':len(inspected),
        'automatedTitleScreenedUnique':len({identity(r) for r in screening if r.get('screeningMethod')=='automated-title'}),
        'assessed':len(records),'reviewReady':sum(r['reviewReady'] for r in records),'deduplicatedNew':len(records)-existing,'existingAssessed':existing,
        'primaryStudyProgramGroups':len(groups),'groupsWithUncertainLinkage':len(uncertain),
        'randomizedReportGroups':len(randomized),'registeredRandomizedReportGroups':len(registered),
        'independentStudyFamilyCount':None,'independenceStatus':'Cohort independence has not been exhaustively reconciled; group counts are provisional.',
        'reviewPublications':sum(is_review(r) for r in records),
        'excludedUnique':sum(v=='exclude' for v in decisions.values()),'deferredUnique':sum(v=='defer' for v in decisions.values()),
        'existingNotReassessed':sum(v=='existing' for v in decisions.values()),
        'otherScreeningDispositionUnique':sum(v=='other' for v in decisions.values()),'sourceClarificationNeeded':sum(not r['reviewReady'] for r in records),
        'duplicateCandidateReports':source.get('duplicateCandidateReports',0)}
    metrics.update({'screenedPublicationVersions':len(unique),
        'screenedReportGroups':len(unique)-sum(len(g['identifiers'])-1 for g in version_groups),
        'preprintVersionGroups':len(version_groups),
        'versionGroupingStatus':'Provisional normalized-title linkage; author/cohort reconciliation is not exhaustive.'})
    bundle={'schema':'universal-research/pending-review/v1','createdAt':source['createdAt'],
        'baselineCommit':source['baselineCommit'],'reviewStatus':'pending','productionEligible':False,
        'scopeNote':source['scopeNote'],'limitations':source['limitations'],'metrics':metrics,'records':records,
        'screeningSummary':screen_summary,'screeningVersionGroups':version_groups}
    revision='batch-'+digest(bundle)[:16]
    bundle['batchRevision']=revision
    outputs={OUT/(revision+'.json'):bundle,OUT/'index.json':{'schema':bundle['schema'],'batch':revision+'.json','reviewStatus':'pending','productionEligible':False},OUT/'screening.json':screening,OUT/'search-log.json':logs}
    for p,data in outputs.items():
        expected=json.dumps(data,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
        if check: assert p.read_text()==expected, f'Stale review output: {p}'
        else:
            p.parent.mkdir(parents=True,exist_ok=True)
            if p.name.startswith('batch-') and p.exists(): assert p.read_text()==expected,'Immutable batch changed'
            p.write_text(expected)
    print(json.dumps({'passed':True,'revision':revision,**metrics}))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');build(parser.parse_args().check)
