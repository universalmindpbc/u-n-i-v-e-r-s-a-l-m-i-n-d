from pathlib import Path
import hashlib,subprocess,json
root=Path(__file__).resolve().parents[3]
paths=['cloudflare/informatics-literature.js','cloudflare/informatics-literature-fallback.js','cloudflare/informatics-literature-agent.js']
replacements={hashlib.sha256(subprocess.check_output(['git','show','HEAD:'+p],cwd=root)).hexdigest():hashlib.sha256((root/p).read_bytes()).hexdigest() for p in paths}
changed=[]
for name in ['Informatics/index.html','Informatics/quantum/index.html','Informatics/chapters/quantum.html','Informatics/read/quantum/index.html','Informatics/quantum/reading/quantum-atlas.json','Informatics/quantum/reading/quantum-atlas.csv','Informatics/quantum/reading/quantum-atlas.md']:
 p=root/name;s=p.read_text();updated=s
 for before,after in replacements.items():updated=updated.replace(before,after)
 if updated!=s:p.write_text(updated);changed.append(name)
print(json.dumps({'sourceHashesRefreshed':paths,'generatedFilesChanged':changed}))
