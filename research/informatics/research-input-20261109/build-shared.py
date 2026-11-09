"""Prepare the existing worker image overlay; deployment is a separate action."""
import hashlib,json,zipfile
from pathlib import Path
here=Path(__file__).parent
out=Path('/private/tmp/um-live-literature-shared-20261109.zip')
source=here.parent/'astra-service'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,path in [('Dockerfile',here/'Dockerfile.shared')]+[(n,source/n) for n in ['runner.py','test_runner.py','test_reasoning.py','test_reviews.py','test_literature.py']]:
  info=zipfile.ZipInfo(name,date_time=(2026,11,9,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,path.read_bytes())
record={'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
(here/'shared-package.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
