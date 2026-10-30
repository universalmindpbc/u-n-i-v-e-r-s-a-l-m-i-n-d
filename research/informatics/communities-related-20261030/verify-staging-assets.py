import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import subprocess

root = pathlib.Path('/private/tmp/um-communities-related-20261030')
files = subprocess.check_output(['git', 'diff', '155f85bccb0595d722ef19e1dc413d9c924cb18f', 'HEAD', '--name-only', '--', 'Informatics'], cwd=root, text=True).splitlines()
files = [name for name in files if not name.endswith('.bin') and (root / name).exists()]
agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

def check(name):
    url = 'https://staging.universalmind.tv/informatics/' + name.removeprefix('Informatics/') + '?verification=communities-related-20261030'
    response = subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '90', '-A', agent, url])
    local = hashlib.sha256((root / name).read_bytes()).hexdigest()
    remote = hashlib.sha256(response).hexdigest()
    assert local == remote, f'Content mismatch: {name}'
    return {'path': name, 'url': url, 'bytes': len(response), 'sha256': remote, 'matched': True}

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    checks = list(pool.map(check, files))
report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceCommit': subprocess.check_output(['git','rev-parse','HEAD'], cwd=root, text=True).strip(), 'assets': checks, 'passed': True}
(root / 'research/informatics/communities-related-20261030/staging-assets.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'matchedAssets': len(checks), 'passed': True}))
