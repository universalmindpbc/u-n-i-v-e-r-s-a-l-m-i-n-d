"""Validate the evidence map, citation relationships and source exports."""
import csv
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'Informatics/library-data'
AUDIT = ROOT / 'research/informatics/oxtr-il6-20261124'
CURRENT_AUDIT = ROOT / 'research/informatics/il6-mental-health-20261128'
edition = json.loads((DATA / 'general-edition.json').read_text())
register = json.loads((DATA / 'oxtr-il6-research-register.json').read_text())
library = json.loads((DATA / 'library.json').read_text())
chapter = edition['chapters'][-1]
assert chapter['id'] == 'oxtr-il6-inflammation' and chapter['number'] == 13
assert len(chapter['topics']) == 26
chapter = dict(chapter, topics=chapter['topics'][:10])
assert register['sourceCount'] == 162
rows = register['records'][:42]
assert len(rows) == 42
assert len({r['recordId'] for r in rows}) == 42
assert sum(r['supplied'] for r in rows) == register['suppliedUniqueSources'] == 19
assert sum(len(t['papers']) for t in chapter['topics']) == 42
ids = {r['recordId'] for r in rows}
library_ids = {r['id'] for r in library['records']}
assert ids <= library_ids
for topic in chapter['topics']:
    assert len(topic['paragraphs']) == len(topic['paragraphSources'])
    for group in topic['paragraphSources']:
        for source in group:
            assert source['recordId'] in ids
    for paper in topic['papers']:
        assert paper['recordId'] in ids and paper['quotes'] == []
        assert paper['summary'] and paper['limitation']
        assert paper['evidence']['reviewScope']
        assert all(u.startswith('https://') for u in paper['urls'])
    assert 'trustScore' not in topic
by_key = {r['key']: r for r in rows}
assert by_key['ditzen2023']['studyFamilyId'] == by_key['schneider2026']['studyFamilyId']
for key in ['boutin2025', 'oscovid19', 'sun2015', 'oxt-gene', 'oxtr-gene']:
    assert by_key[key]['paperTrustAssessment']['score'] is None
assert 'zero' in by_key['oscovid19']['summary']
assert 'did not attenuate' in by_key['ross2013']['summary']
assert 'higher IL-6' in by_key['ditzen2023']['summary']
assert 'no treatment effects' in by_key['boutin2025']['summary']
assert 'not establish first-ever priority' in ' '.join(p for t in chapter['topics'] for p in t['paragraphs'])
with (DATA / 'oxtr-il6-research-register.csv').open(newline='') as file:
    csv_rows = list(csv.DictReader(file))
assert len(csv_rows) == 162
csv_rows = csv_rows[:42]
for original, row in zip(rows, csv_rows):
    for key in ['key', 'recordId', 'title', 'year', 'doi', 'pmid', 'summary', 'limitation']:
        assert row[key] == str(original.get(key) or ''), (original['key'], key)
baseline = json.loads((AUDIT / 'baseline-chapters.json').read_text())
assert hashlib.sha256(json.dumps(edition['chapters'][:-1], sort_keys=True).encode()).hexdigest() == baseline['sha256']
text = json.dumps(chapter, ensure_ascii=False) + json.dumps(rows, ensure_ascii=False)
assert not re.search(r"\b(?:should|could|would)(?:n't|'ve)?\b|\b(?:shouldn|couldn|wouldn)[’']t\b", text, re.I)
report = {'passed': True, 'sources': 42, 'suppliedSources': 19, 'topics': 10,
          'priorChaptersPreserved': 12, 'csvJsonCoreFieldsEquivalent': True,
          'paragraphCitationsResolved': True, 'sharedTrialFamilyPreserved': True,
          'negativeFindingsRetained': True, 'languageCheck': True}
(CURRENT_AUDIT / 'original-oxtr-validation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
