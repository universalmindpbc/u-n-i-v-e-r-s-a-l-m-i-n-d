"""Verify the approved DOCK2 production assets and complete export bytes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'research/informatics/dock2-production-20261121'
INPUT = json.loads((OUT / 'release-input.json').read_text())
SHA = lambda data: hashlib.sha256(data).hexdigest()

def normalize_html(body):
    text = body.decode('utf-8')
    observed = []
    beacon = r'<script (?:defer|type="module") src="https://static.cloudflareinsights.com/beacon.min.js[^\"]*"[^>]*></script>\n?'
    observed.extend(re.findall(beacon, text))
    text = re.sub(beacon, '', text)
    return text.encode(), observed

def check(item):
    remote, expected = item
    local = ROOT / ('Informatics/' + remote.removeprefix('informatics/') if remote.startswith('informatics/') else remote)
    assert SHA(local.read_bytes()) == expected, remote
    query = '?embedded=1&release=dock2-20261121' if not remote.endswith('.bin') else ''
    url = 'https://universalmind.tv/' + remote + query
    try:
        body = subprocess.check_output(['curl', '-fsSL', '--retry', '2', '--max-time', '180', url])
        raw = SHA(body)
        normalized, observed = (normalize_html(body) if raw != expected and remote.endswith('.html') else (body, []))
        matched = SHA(normalized) == expected
        result = {'path': remote, 'bytes': len(body), 'rawSHA256': raw, 'expectedSHA256': expected,
                  'normalizedSHA256': SHA(normalized), 'observedHostInjections': observed, 'matched': matched}
        if not matched and remote.endswith('.html'):
            (OUT / ('unexpected-' + local.name)).write_bytes(body)
        return result
    except Exception as error:
        return {'path': remote, 'matched': False, 'error': str(error)}

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, INPUT['expectedAssetSHA256'].items()))
manifest = json.loads((ROOT / 'Informatics/exports/manifest.json').read_text())
roundtrip = json.loads((ROOT / INPUT['reusedRoundtripEvidence']).read_text())
assert roundtrip['passed'] and SHA((ROOT / 'Informatics/exports/manifest.json').read_bytes()) == INPUT['datasetManifestSHA256']
assert all(row['all_sources_reconstructed'] == len(manifest['sources']) for row in roundtrip['formats'].values())
report = {'passed': all(row['matched'] for row in results), 'assets': results,
          'completeExportParts': sum(row['path'].endswith('.bin') for row in results),
          'totalBytesVerified': sum(row.get('bytes', 0) for row in results),
          'roundtripEvidence': INPUT['reusedRoundtripEvidence'],
          'roundtripAppliesToIdenticalPublishedBytes': True, 'datasetRecords': len(manifest['sources'])}
(OUT / 'http.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'assets'}))
print(json.dumps({'failures': [row for row in results if not row['matched']]}))
raise SystemExit(0 if report['passed'] else 1)
