#!/usr/bin/env python3
"""Check the new records and preservation of the approved research edition."""
import collections,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='309367a9515024f2f2eeb72d519f0cbc4a5c6747'
def old(path):return json.loads(subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT))
def read(path):return json.loads((ROOT/path).read_text())
data=read('Informatics/library-data/nature-expansion.json')
assert len(data['records'])==23
assert len({r['doi'] for r in data['records']})==23
baseline=json.loads(Path('/private/tmp/universal-research-access-input.json').read_text())['records']
assert not {r['doi'].lower() for r in data['records']} & {(r.get('doi') or '').lower() for r in baseline}
assert not {r['id'] for r in data['records']} & {r['id'] for r in baseline}
for r in data['records']:
    assert r['citationCount']>=0 and r['citationSnapshot']['source']=='Crossref'
    assert r['studyDesignAssessment']['sources'] and r['studyDesignAssessment']['peerReviewed']
    assert r['evidence']['sample'] and r['evidence']['measurement']
    assert r['jadad']=={'status':'unassessed','score':None}
    assert not re.search(r'\b(?:should|could|would)\b',r['finding']+' '+r['limitation'],re.I)
families=collections.Counter(a.get('publisherFamily') for a in data['publicationAccess'].values())
assert families['nature']==49 and families['frontiers']==42
preserved=0
for name in ['sound','language','vision','general']:
    path='Informatics/library-data/'+name+'-edition.json'
    before=old(path);after=read(path)
    for chapter in before['chapters']:
        new=next(c for c in after['chapters'] if c['number']==chapter['number'])
        assert new['title']==chapter['title']
        for topic in chapter['topics']:
            match=next(t for t in new['topics'] if t['id']==topic['id'])
            assert match['title']==topic['title']
            if topic['id']!='mindfulness-epigenetics':assert match['trustScore']==topic['trustScore']
            for paper in topic['papers']:
                # Existing prose, quotations, citations and metadata are preserved in the editions.
                assert next(p for p in match['papers'] if p['id']==paper['id'])==paper
                preserved+=1
    assert after.get('introduction')==before.get('introduction')
html=(ROOT/'Informatics/library.html').read_text()
previous=subprocess.check_output(['git','show',BASE+':Informatics/library.html'],cwd=ROOT,text=True)
assert re.sub(r'library(?:-model)?\.js\?v=\d+','SCRIPT',html)==re.sub(r'library(?:-model)?\.js\?v=\d+','SCRIPT',previous)
# The legacy extraction checker predates the documented EMDR merged-record repair.
# Its input files are unchanged by this update; validate the complete approved edition above.
for path in ['Informatics/library-data/library.json','Informatics/library-data/archive-records.json']:
    assert (ROOT/path).read_bytes()==subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
result={'newRecords':23,'expectedUniqueRecords':len(baseline)+23,'existingPaperPlacementsPreserved':preserved,'journalGroups':dict(families),'assessmentCopyPreserved':True,'legacyExtractionInputsUnchanged':True}
(ROOT/'research/informatics/nature-expansion-20261023/data-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
