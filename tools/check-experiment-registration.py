import importlib.util,json,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('register',Path(__file__).with_name('register-informatics-experiment.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b={'schema':'universal-informatics/experiment/v1','experiment_id':'test-study','status':'completed','question':'test','methods':{'name':'test'},'measurements':[1],'field_guide':{'x':'test'},'source_sha256':'a'*64}
with tempfile.TemporaryDirectory() as d:
 m.exports.SITE=Path(d)
 one=m.register(b,'r1');assert (Path(d)/one['json']).is_file() and (Path(d)/one['csv']).is_file()
 try:m.register(b,'r1');raise AssertionError('Overwrite accepted')
 except ValueError:pass
 try:m.register({**b,'measurements':[float('nan')]},'r2');raise AssertionError('NaN accepted')
 except ValueError:pass
 assert not (Path(d)/'quantum/experiments/test-study/r2').exists()
 m.register(b,'r2');m.exports.verify_experiments()
 (Path(d)/one['csv']).write_text('changed')
 try:m.exports.verify_experiments();raise AssertionError('Changed revision accepted')
 except ValueError:pass
print('PASS: JSON/CSV registration, immutable revisions, failed-input cleanup and changed-record rejection.')
