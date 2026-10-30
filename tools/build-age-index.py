"""Publish age filters from the retained source and editorial assessment."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
AUDIT=ROOT/'research/informatics/communities-related-20261030/age-assessments.json'
TARGET=ROOT/'Informatics/library-data/age-index.json'
def render():
    audit=json.loads(AUDIT.read_text())
    fields=['recordId','collections','groups','reportedAges','youthScope','sourceURL','basisType']
    public={'schemaVersion':'research-age-groups/v1','updatedAt':audit['assessedAt'],'recordCount':audit['recordCount'],'taxonomy':audit['taxonomy'],'records':[{k:r[k] for k in fields} for r in audit['records']]}
    return json.dumps(public,indent=2,ensure_ascii=False)+'\n'
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args();text=render()
    if args.check:assert TARGET.read_text()==text,'Age index differs from its retained audit'
    else:TARGET.write_text(text)
    print(json.dumps({'passed':True,'records':json.loads(text)['recordCount']}))
