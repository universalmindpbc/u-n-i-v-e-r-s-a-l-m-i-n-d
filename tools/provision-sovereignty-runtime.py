#!/usr/bin/env python3
"""Private provisioning helper invoked only by the existing Panthur publisher."""
import ftplib
import hashlib
import io
import json
import os
from pathlib import Path
import secrets
import ssl
import sys

RUNTIME_FILES = ['recipient-public.pem', 'signing-private.pem', 'document.encrypted.json', 'document.json', 'config.json']
ACCOUNTS = {'stagingdeploy@universalmind.tv': 'staging', 'codexdeploy@universalmind.tv': 'production'}
REMOTE = 'vogue/iam/api/.runtime-private/sovereignty'


def validate(seed, account):
    config = json.loads((seed / 'config.json').read_bytes())
    assert account in ACCOUNTS, 'Unknown Panthur account'
    assert config['environment'] == ACCOUNTS[account], 'Account/environment mismatch'
    assert config['enabled'] is True
    assert config['environment'] != 'production' or config.get('production_approved') is True
    assert not (seed / 'owner-decryption-key.pem').exists(), 'Owner decryption key must stay local'
    assert config.get('storage_plan') == 'b2-free-v1' and config.get('retention_days') == 30
    assert config.get('timestamp_enabled') is True and config.get('zero_cost_verified') is True
    vaults = config.get('vaults', [])
    assert len(vaults) == 4 and len({v['bucket'] for v in vaults}) == 4
    assert all(v['provider'] == 'backblaze' for v in vaults)
    for name in RUNTIME_FILES:
        assert (seed / name).is_file(), 'Missing runtime file'
    encrypted = (seed / 'document.encrypted.json').read_bytes()
    assert 'ciphertext' in json.loads(encrypted)
    assert json.loads((seed / 'document.json').read_bytes())['encrypted_sha256'] == hashlib.sha256(encrypted).hexdigest()
    return config


def read(ftp, name):
    result = io.BytesIO()
    ftp.retrbinary('RETR ' + name, result.write)
    return result.getvalue()


def write_verified(ftp, name, data):
    temporary = name + '.pending-' + secrets.token_hex(8)
    ftp.storbinary('STOR ' + temporary, io.BytesIO(data))
    ftp.sendcmd('SITE CHMOD 600 ' + temporary)
    assert read(ftp, temporary) == data, 'Uploaded bytes differ'
    ftp.rename(temporary, name)
    assert read(ftp, name) == data, 'Installed bytes differ'


def provision(seed, mode):
    account = os.environ['SOVEREIGNTY_FTP_USER']
    config = validate(seed, account)
    host = os.environ['SOVEREIGNTY_FTP_HOST']
    assert host in ['ftp.universalmind.tv', 'sh00023.pa.smartservers.com.au']
    assert os.environ.get('SOVEREIGNTY_REMOTE_ROOT', '') == ''
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=30) as ftp:
        # Connect to the publisher's existing account endpoint. Its certificate
        # uses the hosting server name even on the production FTP alias.
        ftp.connect(host)
        ftp.host = 'sh00023.pa.smartservers.com.au'
        ftp.login(account, os.environ['SOVEREIGNTY_FTP_PASS'])
        ftp.prot_p()
        for part in REMOTE.split('/'):
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                if mode != 'seed':
                    raise
                ftp.mkd(part)
                ftp.cwd(part)
        ftp.sendcmd('SITE CHMOD 700 .')
        # HTTP denial is installed before any secret; config is always last.
        write_verified(ftp, '.htaccess', b'Require all denied\n')
        existing = {Path(name).name for name in ftp.nlst()}
        if mode == 'configure':
            previous = read(ftp, 'config.json')
            old = json.loads(previous)
            for field in ['environment', 'identity_key', 'worker_token_sha256']:
                assert old[field] == config[field], 'Refusing identity or authentication key replacement'
            backup = seed / ('config-before-' + secrets.token_hex(5) + '.json')
            descriptor = os.open(backup, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            with os.fdopen(descriptor, 'wb') as stream:
                stream.write(previous)
            write_verified(ftp, 'config.json', (seed / 'config.json').read_bytes())
        else:
            # Check all existing immutable files before changing any of them.
            for name in RUNTIME_FILES:
                if name in existing:
                    assert read(ftp, name) == (seed / name).read_bytes(), 'Existing private runtime differs: ' + name
            for name in RUNTIME_FILES:
                data = (seed / name).read_bytes()
                if name not in existing:
                    write_verified(ftp, name, data)
                ftp.sendcmd('SITE CHMOD 600 ' + name)
                assert read(ftp, name) == data
    print(json.dumps({'environment': config['environment'], 'mode': mode, 'verified': True,
                      'transport': 'FTPS with certificate validation', 'owner_decryption_key_uploaded': False}))


if __name__ == '__main__':
    assert sys.argv[1] in ['seed', 'configure']
    provision(Path(sys.argv[2]), sys.argv[1])
