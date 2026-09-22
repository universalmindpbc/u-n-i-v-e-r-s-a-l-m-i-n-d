#!/usr/bin/env python3
"""Exercise private provisioning without credentials or a network connection."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('provision', Path(__file__).with_name('provision-sovereignty-runtime.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class FTP:
    files = {}
    operations = []
    def __init__(self, **kwargs):
        assert kwargs['context'].check_hostname
        assert kwargs['context'].verify_mode == p.ssl.CERT_REQUIRED
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def connect(self, host): assert host == 'ftp.universalmind.tv'
    def login(self, account, password):
        assert self.host == 'sh00023.pa.smartservers.com.au'
        assert account == 'codexdeploy@universalmind.tv'
    def prot_p(self): self.operations.append('encrypted-data')
    def cwd(self, name): pass
    def sendcmd(self, cmd): self.operations.append(cmd)
    def nlst(self): return list(self.files)
    def storbinary(self, cmd, stream):
        name=cmd.removeprefix('STOR ');self.files[name]=stream.read()
        self.operations.append('upload '+name.split('.pending-')[0])
    def retrbinary(self, cmd, consume): consume(self.files[cmd.removeprefix('RETR ')])
    def rename(self, src, dest): self.files[dest]=self.files.pop(src)

with tempfile.TemporaryDirectory() as tmp:
    seed=Path(tmp)
    encrypted=b'{"ciphertext":"fixture-only"}'
    config={'enabled':True,'environment':'production','production_approved':True,'storage_plan':'b2-free-v1',
        'retention_days':30,'timestamp_enabled':True,'zero_cost_verified':True,'identity_key':'fixture',
        'worker_token_sha256':'fixture','vaults':[{'bucket':f'fixture-{n}','provider':'backblaze'} for n in range(4)]}
    for name in p.RUNTIME_FILES: (seed/name).write_bytes(b'fixture')
    (seed/'document.encrypted.json').write_bytes(encrypted)
    (seed/'document.json').write_text(json.dumps({'encrypted_sha256':hashlib.sha256(encrypted).hexdigest()}))
    def write(): (seed/'config.json').write_text(json.dumps(config))
    write()
    env={'SOVEREIGNTY_FTP_HOST':'ftp.universalmind.tv','SOVEREIGNTY_FTP_USER':'codexdeploy@universalmind.tv',
         'SOVEREIGNTY_FTP_PASS':'fixture','SOVEREIGNTY_REMOTE_ROOT':''}
    with patch.dict(os.environ,env),patch.object(p.ftplib,'FTP_TLS',FTP):
        p.provision(seed,'seed')
        uploads=[x for x in FTP.operations if x.startswith('upload')]
        assert uploads[0]=='upload .htaccess' and uploads[-1]=='upload config.json'
        assert FTP.files['.htaccess']==b'Require all denied\n'
        p.provision(seed,'seed')
        snapshot=dict(FTP.files)
        (seed/'signing-private.pem').write_bytes(b'different')
        try: p.provision(seed,'seed');raise RuntimeError('Replacement was accepted')
        except AssertionError: pass
        assert FTP.files==snapshot
        (seed/'signing-private.pem').write_bytes(b'fixture')
        config['identity_key']='replacement';write()
        try: p.provision(seed,'configure');raise RuntimeError('Identity replacement was accepted')
        except AssertionError: pass
        assert FTP.files==snapshot
        config['identity_key']='fixture';config['storage_credentials_expire_at']=None;write()
        p.provision(seed,'configure')
        assert json.loads(FTP.files['config.json'])==config
        backups=list(seed.glob('config-before-*.json'));assert len(backups)==1 and backups[0].stat().st_mode&0o777==0o600
        for failure in ['approval','environment','owner_key','checksum']:
            saved=dict(config)
            if failure=='approval':config['production_approved']=False
            if failure=='environment':config['environment']='staging'
            if failure=='owner_key':(seed/'owner-decryption-key.pem').write_text('never upload')
            if failure=='checksum':(seed/'document.encrypted.json').write_bytes(b'{"ciphertext":"changed"}')
            write();count=len(FTP.operations)
            try:p.provision(seed,'seed');raise RuntimeError('Invalid configuration was accepted')
            except AssertionError:pass
            assert len(FTP.operations)==count
            config=saved
            (seed/'owner-decryption-key.pem').unlink(missing_ok=True)
            (seed/'document.encrypted.json').write_bytes(encrypted)
    print('Private provisioning guards, encrypted transport, deny-first/config-last ordering, idempotency and preserved identity: passed')
