"""Build a separately versioned AI editorial audit; preserve the frozen review."""
import argparse
import csv
import hashlib
import importlib.util
import io
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIOR = ROOT / 'research/informatics/dot-dv-20261030'
SOURCE = ROOT / 'research/informatics/dot-dv-20261031'
OUT = ROOT / 'Informatics/review/domestic-violence-20261031'
FROZEN = ROOT / 'Informatics/review/domestic-violence-20261030/batch-8bd70e21e48d9a70.json'
spec = importlib.util.spec_from_file_location('dv', ROOT / 'tools/build-dv-review.py')
dv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dv)


def read(path):
    return json.loads(path.read_text())


def set_path(record, path, value):
    keys = path.split('.')
    parent = record
    for key in keys[:-1]:
        parent = parent.setdefault(key, {})
    parent[keys[-1]] = value


def build(check=False):
    config = read(SOURCE / 'audit-policy.json')
    frozen = read(FROZEN)
    assert hashlib.sha256(FROZEN.read_bytes()).hexdigest() == config['frozenSHA256']
    original = {r['id']: r for r in frozen['records']}
    for lane in ['adult-therapy', 'reviews-prevention']:
        for r in read(PRIOR / 'continuation' / lane / 'candidates.json'):
            assert r['id'] not in original
            original[r['id']] = r
    records = json.loads(json.dumps(original))
    applied = {key: [] for key in records}

    def prior_check(proposal, key):
        assert original[key]['contentHash'] == proposal['priorContentHash'], key

    for p in read(PRIOR / 'continuation/methods-adult/proposed-candidates.json'):
        key = p['id']
        prior_check(p, key)
        records[key] = p
        applied[key].append('methods-adult/proposed-candidates.json')
    for p in read(PRIOR / 'continuation/methods-mindbody/proposed-fields.json'):
        key = p['originalID']
        prior_check(p, key)
        records[key].update(p['proposedFields'])
        applied[key].append('methods-mindbody/proposed-fields.json')
    for p in read(PRIOR / 'continuation/methods-prevention/proposed-revisions.json'):
        key = p['originalID']
        prior_check(p, key)
        # The couples proposal predates the subsequently recovered VA paper.
        # Its access limitation and results are replaced by explicit audit patches.
        if key == 'dv-reviews-27599224':
            continue
        for delta in p['fieldChanges']:
            set_path(records[key], delta['path'], delta['after'])
        applied[key].append('methods-prevention/proposed-revisions.json')
    for p in read(PRIOR / 'continuation/methods-children/proposed-deltas.json'):
        key = p['id']
        prior_check(p, key)
        # Earlier 2015 proposal contains a superseded access statement and a
        # misread nonrecipient count. Use the later original-paper evidence.
        if key == 'dv-children-25596929':
            continue
        for delta in p['exactDeltas']:
            set_path(records[key], delta['field'], delta['proposedAfter'])
        if p.get('relatedFamilyEvidence'):
            records[key]['relatedFamilyEvidence'] = p['relatedFamilyEvidence']
        if p.get('sourceAccess'):
            s = p['sourceAccess']
            records[key]['sources'].append({'url': s['url'], 'type': 'Primary methods evidence',
                'retrievedAt': s['retrievedAt'], 'identityVerified': True, 'notes': s.get('location', '')})
        applied[key].append('methods-children/proposed-deltas.json')
    for key, patch in config['patches'].items():
        for path, value in patch.items():
            set_path(records[key], path, value)
        applied[key].append('audit-policy.json: explicit adjudicated amendment')
    advisory = {r['id']: r for r in read(PRIOR / 'continuation/approval-followup/advisory.json')['records']}
    metadata = {r['id']: r for r in read(SOURCE / 'source-verification.json')['records']}
    final = []
    ledger = []
    derived = ['contentHash', 'revision', 'studyDesignAssessment', 'paperTrustAssessment', 'jadad',
               'evidence', 'citationSnapshot', 'provenance', 'priorContentHash', 'priorRevision',
               'proposalStatus', 'proposedAt', 'sourceBatchRevision']
    for key, record in records.items():
        old = original[key]
        decision = config['withheld'].get(key)
        status = decision['status'] if decision else 'recommended-summary'
        reason = decision['reason'] if decision else (
            'Suitable as a qualified research-library summary at the stated source-access level. '
            'This is not a conclusion that the intervention is effective or safe.')
        if key in advisory:
            record['laterReviewEvidence'] = advisory[key]
        record['review'] = {'status': 'pending', 'reviewer': None}
        record['reviewReady'] = status == 'recommended-summary'
        record['reviewReadiness'] = 'ai-editorial-audit-complete-release-pending' if record['reviewReady'] else status
        record['publicationRecommendation'] = {'status': status, 'reason': reason,
            'scope': 'Research summary only; no treatment recommendation', 'humanReleaseApproval': False}
        record['editorialAudit'] = {
            'auditor': 'Codex (AI)', 'completedAt': config['completedAt'],
            'priorContentHash': old.get('contentHash'), 'priorRevision': old.get('revision'),
            'priorSource': 'frozen-120' if old.get('contentHash') else 'continuation-10',
            'sourceVerification': metadata[key], 'appliedProposals': applied[key],
            'method': config['method'], 'limitations': config['limitations'],
        }
        # Do not silently elevate abstract access, tentative family links, or
        # registry procedures into a full-publication verification claim.
        for field in derived:
            record.pop(field, None)
        row = dv.prepare(record)
        row.pop('contentHash')
        row.pop('revision')
        if key in ['dv-children-25596929', 'dv-children-35285428']:
            row['studyDesignAssessment']['category'] = 'randomization-unverified'
            row['studyDesignAssessment']['isRandomizedControlledTrial'] = None
            row['paperTrustAssessment']['randomizedControlledTrial'] = None
        row['contentHash'] = dv.digest(row)
        row['revision'] = 'audit-r2-' + row['contentHash'][:12]
        final.append(row)
        ledger.append({'id': key, 'title': row['title'], 'decision': status, 'reason': reason,
            'revision': row['revision'], 'contentHash': row['contentHash'],
            'sourceAccess': row['access']['level'], 'originalReady': old.get('reviewReady', True),
            'appliedProposals': applied[key], 'sources': [s['url'] for s in row['sources']]})
    final.sort(key=lambda r: (r['publicationRecommendation']['status'] != 'recommended-summary',
                            -r['design']['crosses'], not dv.is_review(r), r['collection'], -r['year'], r['title']))
    recommended = [r for r in final if r['reviewReady']]
    counts = {'assessed': len(final), 'recommendedSummaries': len(recommended),
              'withheld': len(final) - len(recommended),
              'holds': sum(r['publicationRecommendation']['status'] == 'hold' for r in final),
              'greyLiterature': sum(r['publicationRecommendation']['status'] == 'grey-literature' for r in final),
              'newRecommended': sum(not r['existingRepositoryMatches'] for r in recommended),
              'existingRecommended': sum(bool(r['existingRepositoryMatches']) for r in recommended),
              'randomizedReports': sum(r['design']['crosses'] == 1 for r in recommended),
              'verifiedDoubleBlindReports': sum(r['design']['crosses'] == 2 for r in recommended),
              'reviews': sum(dv.is_review(r) for r in recommended),
              'otherDesigns': sum(not dv.is_review(r) and not r['design']['crosses'] for r in recommended),
              'recommendedAccess': dict(Counter(r['access']['level'] for r in recommended)),
              'recommendedCollections': dict(Counter(r['collection'] for r in recommended)),
              'recommendedRelevance': dict(Counter(r['relevance']['relation'] for r in recommended)),
              'independentStudyFamilyCount': None,
              'independenceStatus': 'Publication counts only. Cohort independence and review overlap are not fully reconciled.'}
    assert len(final) == len({r['id'] for r in final}) == len({dv.identity(r) for r in final}) == 130
    assert counts['recommendedSummaries'] == 117, counts
    assert counts['holds'] == 11 and counts['greyLiterature'] == 2
    bundle = {'schema': 'universal-research/ai-editorial-audit/v1', 'createdAt': config['completedAt'],
              'baselineCommit': config['baselineCommit'], 'frozenBatch': frozen['batchRevision'],
              'productionEligible': False, 'reviewStatus': 'ai-audited-awaiting-release-approval',
              'method': config['method'], 'limitations': config['limitations'], 'counts': counts,
              'records': final}
    bundle['batchRevision'] = 'audit-' + dv.digest(bundle)[:16]
    outputs = {
        OUT / (bundle['batchRevision'] + '.json'): bundle,
        OUT / 'index.json': {'batch': bundle['batchRevision'] + '.json', 'productionEligible': False},
        SOURCE / 'decision-ledger.json': {'batchRevision': bundle['batchRevision'], 'counts': counts, 'records': ledger},
    }
    recommended_ids = {r['id'] for r in recommended}
    groups = []
    for group in config['approachGroups']:
        assert set(group['recordIds']) <= recommended_ids
        assert len(group['recordIds']) == len(set(group['recordIds']))
        groups.append({**group, 'count': len(group['recordIds'])})
    outputs[OUT / 'coverage.json'] = {
        'batchRevision': bundle['batchRevision'], 'recommendedPublications': len(recommended),
        'groups': groups,
        'countingNote': 'Selected topic counts within the recommended set, not a complete partition. '
                        'A publication can cover more than one approach. These are publication counts, '
                        'not independent trials or proof of treatment efficacy.',
    }
    for path, data in outputs.items():
        expected = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
        if check:
            assert path.read_text() == expected, f'Stale audit: {path}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            if path.name.startswith('audit-') and path.exists():
                assert path.read_text() == expected, 'Immutable audited batch changed'
            path.write_text(expected)
    fields = ['id', 'revision', 'contentHash', 'decision', 'title', 'sourceAccess', 'reason']
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(ledger)
    csv_path = OUT / 'decisions.csv'
    if check:
        assert csv_path.read_text() == output.getvalue().replace('\r\n', '\n')
    else:
        csv_path.write_text(output.getvalue())
    print(json.dumps({'passed': True, 'batchRevision': bundle['batchRevision'], **counts}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
