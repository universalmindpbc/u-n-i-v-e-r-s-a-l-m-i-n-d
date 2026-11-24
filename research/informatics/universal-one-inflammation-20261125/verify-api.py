import csv, hashlib, io, json, pathlib, urllib.request

out = pathlib.Path(__file__).parent
root = out.parents[2]
base = 'https://informatics-universal-one-staging.universalmind.workers.dev'
origin = 'https://staging.universalmind.tv'

def get(path, host=base, site=origin, payload=None):
    headers = {'Origin': site, 'User-Agent': 'Mozilla/5.0'}
    if payload is not None:
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(host + path, headers=headers, data=json.dumps(payload).encode() if payload is not None else None)
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read(), dict(response.headers)

def data(path, **kwargs):
    return json.loads(get(path, **kwargs)[0])

inventory = data('/api/v1/inventory')
health = data('/health')
assert health['knowledgeVersions']['inflammation']['sourceRecords'] == 75
records, offset, pages = [], 0, 0
while offset is not None:
    page = data('/api/v1/export/publications.json?limit=100&offset=' + str(offset))
    raw, headers = get('/api/v1/export/publications.csv?limit=100&offset=' + str(offset))
    reconstructed = [json.loads(row['record_json']) for row in csv.DictReader(io.StringIO(raw.decode()))]
    assert reconstructed == page['records'], 'CSV reconstruction differs'
    records.extend(page['records'])
    offset = page['page']['nextOffset']
    pages += 1
assert len(records) == inventory['counts']['publications']
by_id = {r['id']: r for r in records}
assert len(by_id) == len(records)
coverage = {}
canonical = {r['id']: r for r in json.loads((root / 'Informatics/library-data/library.json').read_text())['records']}
for stem, chapter_id in [('dock2', 'dock2-trauma-ptsd'), ('oxtr-il6', 'oxtr-il6-inflammation')]:
    register = json.loads((root / 'Informatics/library-data' / (stem + '-research-register.json')).read_text())
    for source in register['records']:
        record = by_id[source['recordId']]
        assert record['collections'] == canonical[record['id']]['collections']
        assert record['conditions'] == (canonical[record['id']].get('conditions') or [])
        for field, value in source.items():
            assert record[field] == value, (source['recordId'], field)
    chapter = data('/api/v1/research-chapters/' + chapter_id)
    assert chapter['sourceCount'] == register['sourceCount']
    mcp = data('/mcp', payload={'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call', 'params': {'name': 'get_research_chapter', 'arguments': {'id': chapter_id}}})
    assert mcp['result']['structuredContent'] == chapter
    coverage[stem] = {'expected': register['sourceCount'], 'exactAppraisalMatches': register['sourceCount'], 'chapterRESTAndMCPAgree': True}
for identity in ['pmid-18593851', '28795405', '10.1111%2Facps.12778']:
    record = data('/api/v1/publications/' + identity)['record']
    assert record == by_id[record['id']]
before = json.loads((out / 'before.json').read_text())
production = {}
for path in ['/health', '/api/v1/inventory']:
    raw, _ = get(path, host='https://informatics-universal-one.universalmind.workers.dev', site='https://universalmind.tv')
    digest = hashlib.sha256(raw).hexdigest()
    assert digest == before['production'][path]['sha256'], 'Production changed'
    production[path] = digest
result = {'passed': True, 'inventory': inventory, 'health': health, 'coverage': coverage, 'exportPages': pages, 'jsonCSVReconstructedRecords': len(records), 'productionUnchangedSHA256': production}
(out / 'api-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['passed', 'coverage', 'exportPages', 'jsonCSVReconstructedRecords', 'productionUnchangedSHA256']}, indent=2))
