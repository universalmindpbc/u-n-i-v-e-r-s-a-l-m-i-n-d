"""Apply the agreed paper and chapter Trust Factor rules to all library views."""
from pathlib import Path
from collections import defaultdict, Counter
import json
from research_paper_trust import assess_paper, POLICY
from research_topic_trust import assess_topic
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'Informatics/library-data'
AUDIT = ROOT / 'research/informatics/trust-factor-20261027'
FILES = ['library', 'mindfulness-expansion', 'vision-expansion', 'nature-expansion', 'fibonacci-expansion']
BOOKS = ['sound', 'vision', 'language', 'general']

def run():
    datasets = {n: json.loads((DATA / (n + '.json')).read_text()) for n in FILES}
    books = {n: json.loads((DATA / (n + '-edition.json')).read_text()) for n in BOOKS}
    corrections = json.loads((AUDIT / 'source-corrections.json').read_text())['records']
    access = json.loads((DATA / 'publication-access.json').read_text())
    for ident, patch in corrections.items():
        row = access['records'].setdefault(ident, {})
        for field in ['pmid', 'doi', 'urls']:
            if field in patch: row[field] = patch[field]
        if patch.get('journal'):
            row['journalLabel'] = patch['journal']
    (DATA / 'publication-access.json').write_text(json.dumps(access, ensure_ascii=False, indent=2) + '\n')
    byid = {}
    entries = defaultdict(list)
    for name, book in books.items():
        for chapter in book['chapters']:
            for topic in chapter['topics']:
                for p in topic['papers']: entries[p['recordId']].append(p)
    for data in datasets.values():
        for r in data['records']:
            previous = byid.get(r['id'], {})
            byid[r['id']] = {**previous, **r, 'collections': sorted(set(previous.get('collections', []) + r.get('collections', [])))}
    for ident, patch in corrections.items():
        r = byid[ident]
        r.update({k:v for k,v in patch.items() if k != 'evidence'})
        if patch.get('evidence'): r['evidence'] = {**(r.get('evidence') or {}), **patch['evidence']}
    for ident, r in byid.items():
        r['paperTrustAssessment'] = assess_paper(r, entries[ident])
        # The historical stars field now agrees with the canonical paper assessment.
        r.setdefault('legacyArticleStars', r.get('stars'))
        r.setdefault('legacyRatingBasis', r.get('ratingBasis'))
        r['stars'] = r['paperTrustAssessment']['score']
        r['ratingBasis'] = r['paperTrustAssessment']['basis']
    identities = defaultdict(list)
    for ident, r in byid.items():
        resolved = access['records'].get(ident, {})
        doi = resolved.get('doi') or r.get('doi')
        pmid = resolved.get('pmid') or r.get('pmid')
        key = 'doi:' + doi.lower() if doi else 'pmid:' + str(pmid) if pmid else 'id:' + ident
        identities[key].append(r)
    for group in identities.values():
        known = [r for r in group if r['paperTrustAssessment']['score'] is not None]
        if not known: continue
        scores = {r['paperTrustAssessment']['score'] for r in known}
        if len(scores) > 1: raise ValueError('Conflicting assessments for one publication: ' + ', '.join(r['id'] for r in known))
        canonical = max(known, key=lambda r: (r['id'] in corrections, bool(r.get('studyDesignAssessment'))))
        for r in group:
            if r.get('identityConflict') or r.get('retracted'): continue
            r['paperTrustAssessment'] = canonical['paperTrustAssessment']
            r['stars'] = canonical['stars']
            r['ratingBasis'] = canonical['ratingBasis']
            if (canonical.get('evidence') or {}).get('trialId'):
                r['evidence'] = {**(r.get('evidence') or {}), 'trialId': canonical['evidence']['trialId']}
    for data in datasets.values():
        for r in data['records']:
            resolved = byid[r['id']]
            for k in ['paperTrustAssessment', 'legacyArticleStars', 'legacyRatingBasis', 'stars', 'ratingBasis']:
                r[k] = resolved[k]
            if (resolved.get('evidence') or {}).get('trialId'): r['evidence'] = resolved['evidence']
            for k, v in corrections.get(r['id'], {}).items():
                r[k] = resolved[k]
    changes = []
    for name, book in books.items():
        for chapter in book['chapters']:
            for topic in chapter['topics']:
                items = []
                for p in topic['papers']:
                    r = byid[p['recordId']]
                    p['paperTrustAssessment'] = r['paperTrustAssessment']
                    if (r.get('evidence') or {}).get('trialId'): p['evidence'] = {**(p.get('evidence') or {}), 'trialId': r['evidence']['trialId']}
                    if r.get('studyDesignAssessment'): p['studyDesignAssessment'] = r['studyDesignAssessment']
                    for k in corrections.get(r['id'], {}): p[k] = r[k]
                    items.append(r)
                old = topic.get('sourceTrustScore', topic.get('trustScore'))
                if (topic.get('trustAssessment') or {}).get('status') == 'clinical-guidance': continue
                topic.setdefault('sourceTrustScore', old)
                topic['trustAssessment'] = assess_topic(items)
                topic['trustScore'] = topic['trustAssessment']['score']
                if old != topic['trustScore']:
                    changes.append({'collection': name, 'topic': topic['id'], 'title': topic['title'], 'previous': old, 'score': topic['trustScore'], 'counts': topic['trustAssessment']['counts']})
    datasets['library']['summary']['ratings'] = dict(Counter(str(r['stars']) for r in datasets['library']['records']))
    datasets['library']['policy']['articleStars'] = POLICY
    datasets['library']['policy']['topicTrustFactor'] = {'3': 'At least three distinct double-blind randomized controlled trials', '2': 'At least three distinct randomized controlled trials', '1': 'At least three distinct peer-reviewed studies'}
    datasets['library']['policy']['note'] = 'Trust Factor uses publication-specific evidence for papers and a three-study threshold for subchapters. The highest qualifying level is assigned. Missing blinding information is not classified as single-blind. Full-paper risk-of-bias appraisal remains separate.'
    for name, obj in {**datasets, **{n + '-edition': b for n, b in books.items()}}.items():
        (DATA / (name + '.json')).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
    report = {'checkedAt': '2026-10-27', 'allFullTextsReviewed': False, 'chapterChanges': changes,
              'recordCounts': {name: dict(Counter(str(r['paperTrustAssessment']['score']) for r in byid.values() if name in r.get('collections', []))) for name in BOOKS},
              'rules': POLICY, 'manualSourceCorrections': list(corrections)}
    (AUDIT / 'data-update.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'records': len(byid), 'paperScores': report['recordCounts'], 'changedChapters': len(changes)}))

if __name__ == '__main__': run()
