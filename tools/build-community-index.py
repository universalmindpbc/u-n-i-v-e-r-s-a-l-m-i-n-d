"""Publish community relevance tags from the separately retained editorial audit."""
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'research/informatics/communities-full-20261030/classification-audit.json'
TARGET = ROOT / 'Informatics/library-data/community-index.json'

def render():
    audit = json.loads(AUDIT.read_text())
    public = {
        'schemaVersion': 'communities-contexts/v2',
        'title': 'Communities and Contexts',
        'updatedAt': audit['assessedAt'],
        'recordCount': audit['recordCount'],
        'taxonomy': audit['taxonomy'],
        'records': [{'recordId': row['recordId'], 'matches': row['matches']} for row in audit['records']],
    }
    return json.dumps(public, indent=2, ensure_ascii=False) + '\n'

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = render()
    if args.check:
        assert TARGET.read_text() == expected, 'Community index differs from the editorial audit.'
    else:
        TARGET.write_text(expected)
    print(json.dumps({'passed': True, 'records': json.loads(expected)['recordCount']}))
