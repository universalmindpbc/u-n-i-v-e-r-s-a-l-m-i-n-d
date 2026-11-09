"""Verify the deployed E8 source and complete downloads against committed bytes."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'Informatics'
OUT = ROOT / 'research/informatics/e8-layout-restore-20261109'
manifest = json.loads((SITE / 'exports/manifest.json').read_text())
paths = [
    'e8.js', 'e8.css', 'research.html', 'research.js',
    'pilot-v1/e8-m9-p24.json', 'pilot-v1/csv-shared/e8-m9-p24.csv',
    'pilot-v1/m9.json', 'pilot-v1/csv-records/m9.csv',
    'pilot-v1/index.json', 'pilot-v1/dataset.json', 'pilot-v1/m1-m1001.json',
    'pilot-v1/m1-m1001.csv', 'pilot-v1/m1-m1001-data.zip',
    'pilot-v1/m1-m1001-csv.zip', 'atlas-guides/geometry-atlas.json',
    'atlas-guides/geometry-atlas.csv', 'read/atlas/m9.html',
    'exports/manifest.json',
    'exports/manifest-' + manifest['dataset_version'] + '.json',
]
paths += ['exports/' + part['file'] for item in manifest['downloads'].values() for part in item['parts']]


def digest(stream):
    result = hashlib.sha256()
    size = 0
    while block := stream.read(1024 * 1024):
        result.update(block)
        size += len(block)
    return result.hexdigest(), size


def verify(path):
    with (SITE / path).open('rb') as stream:
        expected, expected_size = digest(stream)
    url = 'https://staging.universalmind.tv/informatics/' + path
    query = 'embedded=1&' if path == 'research.html' else ''
    request = Request(url + '?' + query + 'e8-verify=' + manifest['dataset_version'][:12], headers={
        'Cache-Control': 'no-cache', 'User-Agent': 'UniversalInformatics-Verification/1.0'})
    with urlopen(request, timeout=180) as response:
        assert response.status == 200, (path, response.status)
        hosting_transform = None
        if path.endswith('.html'):
            body = response.read()
            body, count = re.subn(
                rb'<script[^>]*src="https://static\.cloudflareinsights\.com/beacon\.min\.js[^\"]*"[^>]*></script>\n?',
                b'', body)
            assert count <= 1, (path, 'Unexpected analytics script count')
            if count:
                hosting_transform = 'Removed the server-inserted Cloudflare analytics beacon before comparing source bytes.'
            actual, size = digest(io.BytesIO(body))
        else:
            actual, size = digest(response)
    assert (actual, size) == (expected, expected_size), path
    return {'path': path, 'bytes': size, 'sha256': actual, 'hostingTransform': hosting_transform, 'passed': True}


with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(verify, paths))
report = {'passed': True, 'origin': 'https://staging.universalmind.tv',
          'datasetVersion': manifest['dataset_version'], 'files': results}
(OUT / 'staging-downloads.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': True, 'files': len(results), 'bytes': sum(r['bytes'] for r in results),
                  'datasetVersion': manifest['dataset_version']}))
