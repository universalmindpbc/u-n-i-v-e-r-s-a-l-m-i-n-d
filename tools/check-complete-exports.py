"""Verify both complete formats reconstruct every source, plus edge values."""
import csv
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import ijson

ROOT = Path(__file__).resolve().parents[1]
def module(name, path):
    spec=importlib.util.spec_from_file_location(name,path)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
ex=module('ex',ROOT/'tools/export-informatics.py')
reader=module('reader',ROOT/'Informatics/exports/read_complete.py')
manifest=json.loads((ex.OUT/'manifest.json').read_text())
sources={r['id']:r for r in manifest['sources']}
edge={'null':None,'empty':'','object':{},'array':[],'a/b~c':['a;b','line\nbreak','"quoted"'],
      'formula':'  =2+2','spaces':'  ','apostrophe':"'=2+2",'num':-3,'bool':False}
s=io.StringIO(newline='');w=csv.writer(s);w.writerow(['record_id','field','type','value','escaped']);ex.csv_rows(w,'edge',edge);s.seek(0)
assert list(reader.records(s))==[('edge',edge)]
report={'edge_values':True,'formats':{}}
for fmt in ['json','csv']:
    descriptor=manifest['downloads'][fmt]
    with tempfile.TemporaryFile() as binary:
        for part in descriptor['parts']:
            with (ex.OUT/part['file']).open('rb') as f:
                while chunk:=f.read(1024*1024):binary.write(chunk)
        binary.seek(0)
        stream=gzip.GzipFile(fileobj=binary)
        seen=set()
        records=ijson.items(stream,'records.item',use_float=True) if fmt=='json' else (value for ident,value in reader.records(io.TextIOWrapper(stream,encoding='utf-8',newline='')) if ident!='__metadata__')
        for record in records:
            ident=record['id'];assert ident not in seen
            assert record==ex.record(sources[ident]),ident
            seen.add(ident)
        assert seen==set(sources)
        report['formats'][fmt]={'all_sources_reconstructed':len(seen),'passed':True}
    print(fmt,'complete',flush=True)
ex.verify_experiments()
report['passed']=True
out=ROOT/'research/informatics/complete-exports-20261025';out.mkdir(exist_ok=True,parents=True)
(out/'roundtrip.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
