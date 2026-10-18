"""Exercise existing FTP uploader ordering and manifest failure handling, offline."""
from pathlib import Path
import subprocess,tempfile,os
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'deploy-panthurlive.sh').read_text().split('deploy_informatics() {',1)[1].split('\nDEPLOY_MODE=',1)[0]
with tempfile.TemporaryDirectory(prefix='atlas-deploy-test-') as temp:
 root=Path(temp);(root/'Informatics/pilot-v1').mkdir(parents=True)
 for name in ['m1.json','m2.json','index.json']:(root/'Informatics/pilot-v1'/name).write_text(name)
 (root/'Informatics/index.html').write_text('entry')
 subprocess.run(['git','init','-q',temp],check=True);subprocess.run(['git','-C',temp,'add','Informatics'],check=True);subprocess.run(['git','-C',temp,'-c','user.name=Test','-c','user.email=test@invalid','commit','-qm','fixture'],check=True)
 script=root/'test.sh';script.write_text('set -euo pipefail\nROOT_DIR='+repr(temp)+'\nMANIFEST_FILE="$ROOT_DIR/manifest.tsv"\nput_file() { printf "%s\\n" "$2" >> "$ROOT_DIR/uploads"; if [[ "${FAIL_UPLOAD:-}" == "$2" ]]; then return 1; fi; }\ndeploy_informatics() {'+source+'\ndeploy_informatics\n')
 def run(env=None):
  r=subprocess.run(['bash',str(script)],env=env,capture_output=True,text=True)
  if r.returncode: print(r.stdout,r.stderr)
  return r
 assert run().returncode==0
 uploaded=(root/'uploads').read_text().splitlines();assert len(uploaded)==4;assert uploaded.index('informatics/pilot-v1/m2.json')<uploaded.index('informatics/pilot-v1/index.json')
 (root/'uploads').write_text('');assert run().returncode==0;assert not (root/'uploads').read_text()
 (root/'manifest.tsv').write_text('old\tunrelated/file\n');before=(root/'manifest.tsv').read_bytes()
 assert run({**os.environ,'FAIL_UPLOAD':'informatics/pilot-v1/m2.json'}).returncode!=0;assert (root/'manifest.tsv').read_bytes()==before
 # A dirty tracked asset blocks the entire batch, before any upload.
 (root/'uploads').write_text('');(root/'Informatics/index.html').write_text('dirty')
 assert run().returncode!=0;assert not (root/'uploads').read_text()
 print('Panthur upload checks passed: changed-only, data before entry points, failed upload preserves manifest, dirty source blocked.')
