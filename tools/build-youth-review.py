"""Freeze the isolated, pending youth-evidence review. Never modifies the library."""
from pathlib import Path
import collections,csv,hashlib,io,json,html,re
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'research/informatics/youth-20261102'
OUT=ROOT/'Informatics/review/youth-20261102';OUT.mkdir(parents=True,exist_ok=True)
def canonical(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
source=json.loads((SRC/'candidate-assessments.json').read_text())
records=source['records']
for r in records:
 r['contentHash']=sha(canonical(r));r['revision']='r1-'+r['contentHash'][:12]
qualified=[r for r in records if r['reviewReady'] and r['quality']['tier'] in ['priority','qualified'] and not r['duplicateOf']]
unique=[r for r in records if not r['duplicateOf']]
trial_reports=[r for r in records if r['design']['randomizationMethodsInspected']]
metrics={'assessedRecords':len(records),'uniquePublications':len(unique),'duplicateReprints':len(records)-len(unique),'reviewReady':sum(r['reviewReady'] for r in records),'qualifiedPapers':len(qualified),'qualifiedNew':sum(not r['existingRepositoryMatches'] for r in qualified),'qualifiedExisting':sum(bool(r['existingRepositoryMatches']) for r in qualified),'newUniquePublications':sum(not r['existingRepositoryMatches'] for r in unique),'existingUniquePublications':sum(bool(r['existingRepositoryMatches']) for r in unique),'fullTextCached':sum(r['sourceAccess']['fullTextCached'] for r in records),'abstractOnly':sum(r['sourceAccess']['scope']=='abstract' for r in records),'webMethodsRecovered':sum(r['sourceAccess']['scope']=='selected-methods-web' for r in records),'studyFamilies':len({r['studyFamilyId'] for r in unique}),'randomizedReportsMethodsInspected':len(trial_reports),'randomizedStudyUnitsConservative':len({r['randomizedStudyUnitId'] for r in trial_reports}),'qualifiedDesigns':dict(collections.Counter(r['design']['category'] for r in qualified)),'qualifiedProposedCrosses':dict(collections.Counter(str(r['design']['proposedCrosses']) for r in qualified)),'institutionRecords':dict(collections.Counter(i for r in unique for i in r['institutions']))}
batch={k:v for k,v in source.items() if k!='records'}
batch.update({'createdAt':'2026-11-02','provenance':'AI discovery and rapid methods-based appraisal; human content sign-off pending','appraisalMethod':'Single-agent rapid review of selected methods/results and indexed metadata. Not an exhaustive systematic review, independent duplicate appraisal, or formal RoB/GRADE assessment.','qualityThreshold':'Peer-reviewed empirical study or structured review, relevant youth overlap or institutional youth need, accessible methods inspected, substantive design-specific use and limitations recorded, no unresolved material reporting problem. Preliminary pilots, context-only/framework papers, abstract-only items, reprints and held records are excluded from the qualified target. Qualified does not mean high certainty or low risk of bias.','countingMethod':'Each DOI/PMID publication counted once, reprint excluded. Cross-listing does not increase counts. Related reports share study/programme families; randomized study units conservatively collapse unresolved programme overlap. Review populations are never summed with primary trial populations.','paperMarkerScale':{'1':'Other peer-reviewed publication, including systematic reviews/meta-analyses, or reported RCT awaiting methods verification','2':'RCT with methods inspected, including single/assessor-blinded trials','3':'RCT with both participant and investigator masking verified in methods'},'markerStatus':'Proposed only. Approved crosses remain null until Ben signs off. These design markers are separate from chapter Trust Factor and evidence certainty.','metrics':metrics,'records':records})
raw=(json.dumps(batch,ensure_ascii=False,indent=2)+'\n').encode();h=sha(raw);name='batch-'+h[:16]+'.json';(OUT/name).write_bytes(raw)
fields=['id','title','authors','year','journal','doi','pmid','studyFamilyId','randomizedStudyUnitId','topics','institutions','age','ageFit','design','proposedCrosses','approvedCrosses','qualityTier','reviewReady','reviewStatus','accessScope','existingMatches','finding','limitation','labRelationship','labImplication','holdReason','duplicateOf','contentHash','revision','recordJson']
buf=io.StringIO(newline='');w=csv.DictWriter(buf,fieldnames=fields,lineterminator='\n');w.writeheader()
for r in records:
 row={k:r.get(k,'') for k in ['id','title','authors','year','journal','doi','pmid','studyFamilyId','randomizedStudyUnitId','reviewReady','holdReason','duplicateOf','contentHash','revision']}
 row.update(topics='; '.join(r['topics']),institutions='; '.join(r['institutions']),age=r['population']['age'],ageFit=r['population']['ageFit'],design=r['design']['description'],proposedCrosses=r['design']['proposedCrosses'],approvedCrosses='',qualityTier=r['quality']['tier'],reviewStatus=r['review']['status'],accessScope=r['sourceAccess']['scope'],existingMatches='; '.join(m['id'] for m in r['existingRepositoryMatches']),finding=r['findings'],limitation=r['limitations'],labRelationship=r['labRelevance']['relationship'],labImplication=r['labRelevance']['implication'],recordJson=canonical(r).decode())
 w.writerow(row)
csvraw=buf.getvalue().encode();csvname='records-'+sha(csvraw)[:16]+'.csv';(OUT/csvname).write_bytes(csvraw)
for filename in ['brief.md','methods.md','supplemental-sources.json','search-log.json']:
 if (SRC/filename).exists():(OUT/filename).write_bytes((SRC/filename).read_bytes())
def inline(s):
 s=html.escape(s)
 s=re.sub(r'\[([^\]]+)\]\((https://[^ )]+)\)',r'<a href="\2" target="_blank" rel="noopener">\1</a>',s)
 s=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)
 return re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
def document(text):
 out=[];paragraph=[];table=[];items=[]
 def flush():
  if paragraph:out.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
  if items:out.append('<ul>'+''.join('<li>'+inline(x)+'</li>' for x in items)+'</ul>');items.clear()
  if table:
   out.append('<div class="table-wrap"><table><thead><tr>'+''.join('<th>'+inline(c.strip())+'</th>' for c in table[0].strip('|').split('|'))+'</tr></thead><tbody>')
   for row in table[2:]:out.append('<tr>'+''.join('<td>'+inline(c.strip())+'</td>' for c in row.strip('|').split('|'))+'</tr>')
   out.append('</tbody></table></div>');table.clear()
 for line in text.splitlines()+['']:
  if line.startswith('|'):table.append(line)
  elif line.startswith('- '):items.append(line[2:])
  elif line.startswith('#'):
   flush();level=len(line)-len(line.lstrip('#'));out.append(f'<h{level}>'+inline(line[level:].strip())+f'</h{level}>')
  elif not line.strip():flush()
  else:paragraph.append(line.strip())
 return ''.join(out)
for docname,title in [('brief','Evidence brief'),('methods','Methods and counting')]:
 body=document((SRC/(docname+'.md')).read_text())
 (OUT/(docname+'.html')).write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Universal Mind • '+title+'</title><link rel="stylesheet" href="review.css"></head><body><header><a class="brand" href="index.html">Universal Mind <span>Youth evidence review</span></a><span class="pending">Human sign-off pending</span></header><main class="document"><p style="margin-top:24px"><a href="index.html">← Browse the papers</a> · <a href="'+docname+'.md" download>Download Markdown</a></p>'+body+'</main></body></html>')
index={'schemaVersion':source['schemaVersion'],'batch':name,'sha256':h,'csv':csvname,'csvSHA256':sha(csvraw),'reviewStatus':'pending','productionEligible':False,'approvedRetrievalEligible':False,'baselineCommit':source['baselineCommit'],'metrics':metrics}
(OUT/'index.json').write_text(json.dumps(index,indent=2)+'\n')
(SRC/'counts.json').write_text(json.dumps(metrics,indent=2)+'\n')
print(json.dumps(metrics,indent=2));print('Frozen batch',name)
