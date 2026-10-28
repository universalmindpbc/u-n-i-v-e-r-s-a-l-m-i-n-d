import datetime
import ftplib
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).parents[3]
environment = sys.argv[1]
assert environment in ('staging', 'production')
account = ('stagingdeploy' if environment == 'staging' else 'codexdeploy') + '@universalmind.tv'
service = 'universalmind-' + environment + '-ftp'
credential = subprocess.run(['security', 'find-generic-password', '-s', service, '-a', account, '-w'], capture_output=True, text=True, check=True).stdout.strip()
ftp = ftplib.FTP('sh00023.pa.smartservers.com.au', timeout=45)
ftp.login(account, credential)
del credential
files = subprocess.check_output(['git', 'ls-files', '-z', '--', 'index.html', 'home', 'events', 'happiness'], cwd=root).decode().strip('\0').split('\0')
checks = []
try:
    for name in files:
        digest = hashlib.sha256()
        ftp.retrbinary('RETR ' + name, digest.update)
        actual = digest.hexdigest()
        expected = hashlib.sha256((root / name).read_bytes()).hexdigest()
        assert actual == expected, name + ': deployed source differs'
        checks.append({'path': name, 'sha256': actual, 'matchesApprovedSource': True})
finally:
    ftp.quit()
out = root / 'research/qa/production-home-events-happiness-20261028'
out.mkdir(parents=True, exist_ok=True)
report = {'environment': environment, 'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'approvedSourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), 'checks': checks, 'passed': True}
(out / (environment + '-source-readback.json')).write_text(json.dumps(report, indent=2) + '\n')
print(environment + ': all ' + str(len(checks)) + ' published source files match the approved Git commit.')
