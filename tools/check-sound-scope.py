#!/usr/bin/env python3
"""Check retained Sound citations against the independent original archive."""
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'Informatics/library-data'
library=json.loads((DATA/'library.json').read_text())
edition=json.loads((DATA/'sound-edition.json').read_text())
original=json.loads((DATA/'sound-source.json').read_text())
pages={p['page']:p for p in original['pages']}
# Explicit topic exclusions from the conversation, after the Schumann correction.
excluded_pages={22,44,48,76,79,81,83}
deferred_pages={109,110,111,112,113,130,137,138,141,142}
original_topics=[('i',6),('ii',15),('iii',17),('iv',22),('v',44),('vi',48),('vii',51),('viii',61),('ix',62),('x',70),('xi',72),('xii',75),('xiii',76),('xiv',77),('xv',79),('xvi',81),('xvii',83),('xviii',84),('xix',89),('xx',90),('xxi',92),('xxii',106),('xxiii',107),('xxiv',109),('xxv',110),('xxvi',111),('xxvii',112),('xxviii',113),('xxix',116),('xxx',120),('xxxi',126),('xxxii',130),('xxxiii',138),('xxxiv',142),('xxxv',None),('xxxvi',None)]
section_aliases={137:130,141:138}
topics={t['id']:t for c in edition['chapters'] for t in c['topics']}
papers=[p for c in edition['chapters'] for t in c['topics'] for p in t['papers']]
source_entries=[(r,a) for r in library['records'] for a in r.get('archiveEntries',[]) if a['collection']=='sound']
expected=[]
for r,a in source_entries:
 if a['sectionPage'] in excluded_pages|deferred_pages:continue
 topic_start=section_aliases.get(a['sectionPage'],a['sectionPage'])
 topic_id=next(name for name,page in original_topics if page==topic_start)
 matches=[p for p in topics[topic_id]['papers'] if p['recordId']==r['id'] and p['sourcePages']==a['pages']]
 assert len(matches)==1,(topic_id,r['id'],a['pages'])
 paper=matches[0]
 quotes='\n\n'.join(''.join(span['text'] for span in q) for q in paper['quotes'])
 assert quotes==a.get('originalNote',''),('Quotation changed',topic_id,r['id'])
 count=re.search(r'citations:\s*(\d[\d,]*)',a.get('historicalCitationCount') or '',re.I)
 assert paper['citationCount']==(int(count[1].replace(',','')) if count else None)
 expected.append(paper['id'])
assert len(expected)==len(set(expected))
assert len(expected)==len([p for p in papers if p['sourcePages']])
for name,page in original_topics:
 included=page is not None and page not in excluded_pages|deferred_pages
 assert (name in topics)==included,name
 if included:assert topics[name]['trustScore']==pages[page]['sectionGrade'],name
assert any(p['recordId']=='pmid-17994268' for p in topics['xxx']['papers'])
assert edition['topicCount']==19 and len(edition['chapters'])==6
assert [c['number'] for c in edition['chapters']]==list(range(1,7))
deferred=json.loads((ROOT/'research/informatics/library/deferred-placement-20261022.json').read_text())
assert sum(len(t['entries']) for t in deferred['topics'])==sum(a['sectionPage'] in deferred_pages for r,a in source_entries)
report={'originalSubchapters':36,'retainedSubchapters':19,'awaitingPlacementSubchapters':8,'excludedOrSeparateCollectionSubchapters':9,'retainedOriginalEntries':len(expected),'deferredOriginalEntries':sum(a['sectionPage'] in deferred_pages for r,a in source_entries),'portalAddedEntries':len([p for p in papers if not p['sourcePages']]),'selectedQuotationsMatchExactly':True,'originalTopicTrustScoresMatch':True,'unaccountedOriginalEntries':0,'topics':[]}
for name,page in original_topics:
 reason='Retained'
 if name in ['iv','v','vi']:reason='Excluded: Fibonacci, black-hole and DNA-tetrahedron chapter, explicitly requested.'
 elif name=='xiii':reason='Excluded: DMT hypothesis recommendation accepted with the heading review.'
 elif name in ['xv','xvi','xvii']:reason='Excluded: non-TMS electromagnetism sections; later correction restores iii, xviii and xix.'
 elif name in ['xxxv','xxxvi']:reason='Separate collection; Sound cross-link explicitly declined.'
 elif page in deferred_pages:reason='Recorded outside Sound pending placement, as explicitly clarified by Ben on 22 October 2026.'
 report['topics'].append({'originalSubchapter':name,'sourcePage':page,'status':reason,'entryCount':len(topics[name]['papers']) if name in topics else 0,'heading':topics[name]['title'] if name in topics else None})
(ROOT/'research/informatics/library/sound-scope-audit-20261022.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='topics'},indent=2))
