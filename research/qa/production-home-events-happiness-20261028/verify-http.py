import datetime
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

root = Path.cwd()
out = Path(__file__).parent
origin = 'https://universalmind.tv'
password = os.environ['UM_QA_PASSWORD']
checks = []

def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def request(opener, route, data=None, headers=None):
    req = urllib.request.Request(origin + route, data=data, headers={'Origin': origin, 'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', **(headers or {})})
    try:
        with opener.open(req, timeout=35) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()

public = client()
for route in ['/', '/home/', '/events/', '/happiness/', '/patent/', '/vogue/iam/study.php']:
    status, body = request(public, route)
    assert status == 200, (route, status)
    if route == '/':
        assert hashlib.sha256(password.encode()).hexdigest().encode() in body
        assert password.encode() not in body
    checks.append({'route': route, 'status': status})

for directory in ['home', 'events/assets', 'happiness/assets']:
    for path in sorted((root / directory).glob('*')):
        if path.suffix not in ('.js', '.css'):
            continue
        relative = path.relative_to(root).as_posix()
        status, body = request(public, '/' + relative)
        assert status == 200 and body == path.read_bytes(), relative
        checks.append({'route': '/' + relative, 'status': status, 'sha256': hashlib.sha256(body).hexdigest(), 'matchesApprovedSource': True})

for route, expected in [('/events/media.php', 401), ('/happiness/media.php', 401), ('/events/private/media.json', 403)]:
    status, body = request(client(), route)
    assert status == expected, (route, status)
    checks.append({'route': route, 'unauthenticatedStatus': status})

for site in ['events', 'happiness']:
    session = client()
    status, body = request(session, '/' + site + '/')
    csrf = re.search(r'name="csrf"[^>]+value="([^"]+)"', body.decode()).group(1)
    for secret, expected in [('invalid-release-check', 401), (password, 200)]:
        data = urllib.parse.urlencode({'csrf': csrf, 'password': secret}).encode()
        status, response = request(session, '/' + site + '/', data, {'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'})
        assert status == expected, (site, status)
        if expected == 200:
            assert json.loads(response)['granted'] is True
    status, body = request(session, '/' + site + '/?experience=1')
    assert status == 200 and b'body class="entered"' in body
    checks.append({'gateway': site, 'invalidPasswordRejected': True, 'newPasswordAccepted': True, 'authenticatedPageLoaded': True})

portal = client()
status, body = request(portal, '/events/portal-entry.php', json.dumps({'password': 'invalid-release-check'}).encode(), {'Content-Type': 'application/json'})
assert status == 401
checks.append({'gateway': 'main server entry', 'invalidPasswordRejected': True})

patent = client()
status, body = request(patent, '/patent/')
csrf = re.search(r'name="csrf-token" content="([^"]+)"', body.decode()).group(1)
for secret, expected in [('invalid-release-check', 401), (password, 200)]:
    status, body = request(patent, '/patent/login.php', json.dumps({'password': secret, 'csrf': csrf}).encode(), {'Content-Type': 'application/json'})
    assert status == expected, ('patent', status)
status, body = request(patent, '/patent/')
assert status == 200 and b'class="library-layout"' in body
checks.append({'gateway': 'patent', 'invalidPasswordRejected': True, 'newPasswordAccepted': True, 'authenticatedPageLoaded': True})

status, body = request(client(), '/vogue/iam/api/study.php')
state = json.loads(body)
assert status == 200 and state['website_password_available'] is True
assert state['participant'] is None and state['owner'] is False and state['stakeholder'] is False
checks.append({'gateway': 'study', 'sharedWebsitePasswordAvailable': True, 'loginNotSubmittedToAvoidCreatingParticipant': True})

report = {'origin': origin, 'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'checks': checks, 'passed': True}
(out / 'http-verification.json').write_text(json.dumps(report, indent=2) + '\n')
password = ''
print('HTTP, source assets, access protection, and gateway checks passed: ' + str(len(checks)))
