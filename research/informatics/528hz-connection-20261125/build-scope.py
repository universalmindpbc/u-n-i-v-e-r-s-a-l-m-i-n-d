import pathlib,json,hashlib,subprocess
root=pathlib.Path(__file__).resolve().parents[3];out=pathlib.Path(__file__).parent
old={line.split("\t",1)[1]:line.split("\t",1)[0] for line in (root/".panthur-staging-deploy-manifest.tsv").read_text().splitlines()}
paths=set(filter(None,subprocess.check_output(["git","-C",str(root),"ls-files","-z","Informatics","research/informatics/legacy-uppercase.htaccess","sitemaps/informatics-publications.xml","sitemaps/informatics-records.xml"]).decode().split("\0")))
m=json.loads((root/"Informatics/exports/manifest.json").read_text());paths.add("Informatics/exports/manifest-"+m["dataset_version"]+".json")
for fmt in m["downloads"].values():
 for part in fmt["parts"]:paths.add("Informatics/exports/"+part["file"])
rows=[]
for path in sorted(paths):
 remote="Informatics/.htaccess" if path.endswith("legacy-uppercase.htaccess") else path if path.startswith("sitemaps/") else "informatics/"+path.removeprefix("Informatics/")
 p=root/path;digest=hashlib.sha256()
 with p.open("rb") as f:
  for chunk in iter(lambda:f.read(1024*1024),b""):digest.update(chunk)
 sha=digest.hexdigest()
 if old.get(remote)!=sha:rows.append({"source":path,"remote":remote,"sha256":sha,"bytes":p.stat().st_size})
report={"files":rows,"count":len(rows),"bytes":sum(r["bytes"] for r in rows)}
(out/"staging-scope.json").write_text(json.dumps(report,indent=2)+"\n");print({k:v for k,v in report.items() if k!="files"})
