"""Read-only verification of the committed candidate release and approved inputs."""
from pathlib import Path
import concurrent.futures, datetime, hashlib, json, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[3]
AUDIT = Path(__file__).resolve().parent
HOST = 'https://staging.universalmind.tv/'
paths = subprocess.check_output(['git', 'ls-files', '-z', 'Informatics/review'], cwd=ROOT).decode().split('\0')
paths = [p for p in paths if p and not p.endswith('.htaccess')]
paths += ['Informatics/exports/manifest.json', 'Informatics/library-data/community-index.json',
          'Informatics/library-data/age-index.json', 'Informatics/library-model.js', 'Informatics/library.js']

def verify(path):
    remote = 'informatics/' + path.removeprefix('Informatics/')
    expected = hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
    # The host rejects Python urllib's default HTTP client. Use the same curl
    # transport already used by this repository's read-only asset checks.
    with tempfile.TemporaryDirectory(prefix='dot-dv-verify-') as temporary:
        header_path = Path(temporary) / 'headers'
        body = subprocess.check_output(['curl', '--fail', '--silent', '--show-error',
            '--max-time', '90', '-H', 'Cache-Control: no-cache', '-D', str(header_path), HOST + remote])
        actual = hashlib.sha256(body).hexdigest()
        lines = header_path.read_text().splitlines()
        lowered = {k.lower(): v.strip() for k, v in (line.split(':', 1) for line in lines if ':' in line)}
        status = int(next(line for line in reversed(lines) if line.startswith('HTTP/')).split()[1])
        assert actual == expected, (path, 'Remote content differs')
        if '/review/' in path:
            assert 'noindex' in lowered.get('x-robots-tag', ''), (path, 'Missing noindex')
            assert 'no-store' in lowered.get('cache-control', ''), (path, 'Missing no-store')
        return {'path': path, 'url': HOST + remote, 'status': status,
                'sha256': actual, 'matchesCommittedSource': True,
                'robots': lowered.get('x-robots-tag'), 'cacheControl': lowered.get('cache-control')}

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(verify, paths))
report = {'passed': True, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
          'checks': results, 'productionModified': False}
(AUDIT / 'staging-assets.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': True, 'checkedAssets': len(results), 'sourceCommit': report['sourceCommit']}))
