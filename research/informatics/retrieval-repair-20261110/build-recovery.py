"""Small overlay on the approved worker image; no credentials or datasets."""
import hashlib,json,zipfile
from pathlib import Path
here=Path(__file__).parent
source=here.parent/'astra-service'
target=Path('/private/tmp/um-report-recovery-20261110.zip')
docker='''FROM 740168708062.dkr.ecr.us-east-1.amazonaws.com/informatics-astra-staging@sha256:710b8cff7ac5d5ff169d552695b89f67bb2508a4e2c359b2975aa19e2e9a6b42
COPY runner.py test_runner.py test_report_accounting.py /var/task/workspace/research/informatics/astra-service/
RUN cd /var/task/workspace/research/informatics/astra-service && python -m unittest test_runner test_reasoning test_reviews test_literature test_report_accounting
'''
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in [('Dockerfile',docker.encode())]+[(n,(source/n).read_bytes()) for n in ['runner.py','test_runner.py','test_report_accounting.py']]:
  info=zipfile.ZipInfo(name,date_time=(2026,11,10,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
  archive.writestr(info,data)
record={'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(here/'recovery-package.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
