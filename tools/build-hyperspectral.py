"""Build the approved chapter and retain every patent-bibliography reference."""
import json,re,html,hashlib,copy,csv,io
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
AUDIT=ROOT/'research/informatics/hyperspectral-20261027'
DATA=ROOT/'Informatics/library-data'
SOURCE='https://www.notion.so/3807b9c99c5680599be7d8337c817b15'
def read(p):return json.loads(p.read_text())
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def plain(s):return html.unescape(re.sub(r'<[^>]+>','',re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',s))).replace('\\','').strip()
def norm(s):return re.sub(r'[^a-z0-9]','',plain(s).lower())
inventory=read(AUDIT/'source-inventory.json');audit=read(AUDIT/'audit.json');patents=read(AUDIT/'patent-audit.json')
assert len(audit)==229 and len(patents)==11
base=[]
for name in ['library','mindfulness-expansion','vision-expansion','nature-expansion','fibonacci-expansion']:
 base.extend(read(DATA/(name+'.json'))['records'])
existing={r['id']:r for r in base}
identities={}
for r in base:
 for k in ['doi','pmid']:
  if r.get(k):identities[k+':'+str(r[k]).lower()]=r
identities.update({'title:'+norm(r['title']):r for r in base})
groups={};register=[];refmap={}
editorial={
 'NPL-1':('Computational photography spectrometry combines a physical spectral colour chart with an algorithm to reconstruct visible-range spectra from RGB photographs. The study tests transmission and reflection modes.', 'The method depends on a reference chart and its optical acquisition conditions. It does not establish unrestricted infrared recovery from an uncalibrated photograph.'),
 'NPL-151':('A smartphone-based hyperspectral instrument was deployed at supraglacial and proglacial sites in Greenland to collect visible and near-infrared environmental data.', 'This is a field-imaging instrument study; its findings do not establish biological or clinical measurements from a standard phone camera.'),
 'NPL-152':('The laboratory system combines quantum-dot filters, a digital micromirror device and a single-pixel detector to reconstruct near-infrared spectral images.', 'The demonstrated performance belongs to this optical hardware and reconstruction method; it is not an unmodified smartphone RGB camera.'),
 'NPL-9b':('SpectralSeq combines hyperspectral autofluorescence imaging and transcriptomics from the same MCF-7 cell. The study relates optical and morphological features to gene-expression variation in this breast-cancer cell system.', 'The evidence concerns paired laboratory assays in individual cells. Facial imaging and gene-specific inference in people remain unvalidated extensions.'),
 'NPL-165':('A smartphone camera measures colour reactions in an oxytocin ELISA using an LED-linked optical unit. The reported results compare the image-derived measure with conventional ELISA.', 'The method uses immunoassay reagents and a prepared sample. It does not measure circulating oxytocin from an ordinary facial photograph.'),
 'NPL-221':('The study compares white-light, narrowband and reconstructed endoscopic images in an esophageal-cancer image dataset using colour-difference, entropy and structural-similarity measures.', 'Image-quality comparisons do not by themselves establish prospective patient-level diagnostic accuracy. The setting is endoscopy, with distinct acquisition and validation requirements.')
}
editorial['NPL-153']=editorial['NPL-1']
def topic(r):
 n=int(re.search(r'\d+',r['ref'])[0]);s=r['section']
 if n in [1,2,3,153,154,155]:return 'spectral-reconstruction'
 if 145<=n<=152:return 'imaging-evolution'
 if s in ['Remote Photoplethysmography','OXTR Influence on Facial Microcirculation','Baroreflex Modulation by Oxytocin','Detectability by HSI / Optical Imaging','RGB Measurement of Fluorescence and Blood Distributions in Skin'] or n in [221,222]:return 'optical-physiology'
 if 165<=n<=199 or n==215:return 'autofluorescence-sensing'
 if s in ['Hyper-Seq / Transcriptomics','TeLIS Framework'] or 200<=n<=220:return 'imaging-transcriptomics'
 return None
def source_type(r,m):
 if r['ref'].startswith('PAT'):return 'Patent document'
 text=r['originalCitation'].lower();types=' '.join(m.get('publicationTypes',[])).lower()
 if 'posted-content' in types or (not m.get('journal') and 'preprint' in text):return 'Preprint'
 if any(x in types for x in ['review','meta-analysis']):return 'Review'
 if 'proceedings' in types or 'conference' in text or 'workshop' in text:return 'Conference publication'
 if 'book' in types or any(x in text for x in ['3rd ed.','springer. ch.','principles of fluorescence']):return 'Book or chapter'
 if m and ('journal' in types or m.get('journal')):return 'Journal publication'
 if r['citedURLs']:return 'Institutional, commercial or web source'
 return 'Bibliographic source'
for r in audit:
 m=r.get('metadata') or {};title=m.get('title') or r['title'];doi=m.get('doi');pmid=m.get('pmid')
 key='doi:'+doi.lower() if doi else 'pmid:'+str(pmid) if pmid else 'title:'+norm(title)
 # A source identifier that points to a different title never becomes a canonical ID.
 old=identities.get(key) or identities.get('title:'+norm(title))
 rid=old['id'] if old else 'hsi-'+hashlib.sha256(key.encode()).hexdigest()[:14]
 kind=source_type(r,m);t=topic(r)
 if rid not in groups:
  urls=[]
  if pmid:urls.append('https://pubmed.ncbi.nlm.nih.gov/'+str(pmid)+'/')
  if doi:urls.append('https://doi.org/'+doi)
  if m.get('pmcid'):urls.append('https://pmc.ncbi.nlm.nih.gov/articles/'+m['pmcid']+'/')
  if not m:urls+=r['citedURLs']
  urls=list(dict.fromkeys(urls)) or [SOURCE]
  status='Bibliographic metadata matched; scientific claims await appraisal.' if m else 'Citation identity unresolved; original bibliography retained for review.' if r['status'] in ['unresolved','identifier-conflict'] else 'Documentary source retained; publication status and claims await appraisal.'
  year=re.search(r'\((19\d\d|20\d\d)',r['originalCitation'])
  rec=copy.deepcopy(old) if old else {'id':rid,'title':title,'authors':m.get('authors') or r['originalCitation'].split(' (',1)[0] if year else m.get('authors',''),'journal':m.get('journal',''),'year':m.get('year') or (int(year[1]) if year else None),'doi':doi,'pmid':pmid,'urls':urls,'collections':['general'],'categories':['Hyperspectral Imaging'],'targets':[],'origin':'hyperspectral-bibliography','design':kind,'kind':kind,'finding':'Reference associated with '+r['section']+'.','limitation':status,'quotes':[],'archiveEntries':[],'citationCount':None,'priority':1,'paperTrustAssessment':{'scope':'Paper','status':'unassessed','score':None,'basis':'Bibliographic identity checks do not establish study design, blinding or evidential strength.'},'jadad':{'status':'unassessed','score':None}}
  rec['collections']=list(dict.fromkeys(rec.get('collections',[])+['general']))
  rec['sourceReferences']=[];rec['sourceCollection']='Hyperspectral Imaging · patent section 2.4'
  rec['sourceVerification']=status;rec['sourceType']=kind
  if r['ref'] in editorial and not old:
   rec['finding'],rec['limitation']=editorial[r['ref']]
   rec['editorialReview']={'scope':'Method and context summary from primary abstract or full text','reviewedAt':'2026-10-27','sourceURL':urls[0],'claimValidation':'No independent replication or clinical-validation assessment'}
  groups[rid]=rec
 rec=groups[rid]
 entry={'ref':r['ref'],'recordId':rid,'sourceType':kind,'title':title,'authors':m.get('authors'),'year':m.get('year'),'journal':m.get('journal'),'doi':doi,'pmid':pmid,'pmcid':m.get('pmcid'),'patentNumber':None,'originalAssignee':None,'originalCitation':r['originalCitation'],'originalSection':r['section'],'metadataStatus':r['status'],'claimReview':r['claimReview'],'sourceURL':SOURCE,'publicationURL':rec['urls'][0],'metadataURL':m.get('metadataURL'),'corrections':list(r.get('manualNotes',[])),'topicId':t,'role':'Focused chapter source' if t else 'Related context in complete bibliography'}
 if m:
  if norm(r['title'])!=norm(title):entry['corrections'].append('Published title reconciled with the metadata record.')
  if r['identifierConflicts'] and not r.get('manualNotes'):entry['corrections'].append('A supplied identifier resolved to another title; the accepted record was matched separately by title.')
 if m:
  cited_author=re.split(r'[, (]',r['originalCitation'])[0]
  if cited_author and norm(cited_author) not in norm(m.get('authors','')):entry['corrections'].append('Author attribution differs from the public metadata; canonical authors are shown in source details.')
  corrections=m.get('retractionOrConcern',{})
  corrections=corrections.get('commentCorrection',[]) if isinstance(corrections,dict) else corrections
  for notice in corrections:
   if re.search(r'erratum|retract|expression of concern',str(notice.get('type','')),re.I):entry['corrections'].append('Publication notice: '+str(notice.get('type'))+'; '+str(notice.get('id') or notice.get('DOI') or 'see metadata record'))
 if r['identifierConflicts'] and not m:entry['corrections'].append('Supplied identifier and cited title conflict. No replacement publication has been accepted.')
 rec['sourceReferences'].append(entry);register.append(entry);refmap[r['ref']]=rid
for p in patents:
 rid='hsi-patent-'+re.sub(r'[^a-zA-Z0-9]','',p['patentNumber'].split(' / ')[0]).lower();title=p.get('resolvedTitle') or p['originalDescription']
 status='Public patent identifier resolved; the bibliography description and assignee require comparison with the patent record.' if p['status']=='identifier-resolved' else 'Patent identifier not resolved; original citation retained.'
 if p.get('relevanceConflict'):status=p['relevanceConflict']
 entry={'ref':p['ref'],'recordId':rid,'sourceType':'Patent document','title':title,'authors':None,'year':None,'journal':None,'doi':None,'pmid':None,'pmcid':None,'patentNumber':p['patentNumber'],'originalAssignee':p.get('assignees',[]),'originalCitation':plain(p['patentNumber']+' · '+p['citedAssignee']+' · '+p['originalDescription']),'originalSection':'Patent citations','metadataStatus':p['status'],'claimReview':'No legal-status, novelty or claim-scope opinion','sourceURL':SOURCE,'publicationURL':p['url'],'metadataURL':p['url'],'corrections':[p[k] for k in ['relevanceConflict','comparisonNote'] if p.get(k)],'topicId':'patent-landscape','role':'Patent bibliography source'}
 groups[rid]={'id':rid,'title':title,'authors':'; '.join(p.get('assignees',[])) or plain(p['citedAssignee']),'journal':'','year':None,'urls':[p['url']],'collections':['general'],'categories':['Hyperspectral Imaging','Patent bibliography'],'targets':[],'origin':'hyperspectral-bibliography','design':'Patent document','kind':'Patent document','finding':status,'limitation':'A patent citation is an engineering or invention disclosure. Its inclusion does not establish experimental performance, clinical validity or current legal status.','quotes':[],'archiveEntries':[],'citationCount':None,'priority':1,'sourceType':'Patent document','sourceVerification':status,'sourceCollection':'Hyperspectral Imaging · patent section 2.4','sourceReferences':[entry],'paperTrustAssessment':{'scope':'Paper','status':'unassessed','score':None,'basis':'Patent documents do not receive a clinical-study badge.'},'jadad':{'status':'not-applicable','score':None}}
 register.append(entry);refmap[p['ref']]=rid
def related(ids):return [{'ref':i,'recordId':refmap[i]} for i in ids]
# Publication versions remain separate, connected records; repeated citations merge.
for ids in [['NPL-9','NPL-9b','NPL-214']]:
 for i in ids:groups[refmap[i]]['relatedVersions']=related([x for x in ids if refmap[x]!=refmap[i]])
descriptions=[
 ('imaging-evolution','Evolution of Hyperspectral, Smartphone and Infrared Technologies',[
  'The source timeline traces several routes to portable optical sensing: external camera attachments, embedded spectrometers, tunable filters and computational reconstruction. These routes solve different acquisition problems. A device that measures a spectrum at one point, a depth camera and a thermal imager each capture different information from a hyperspectral image cube.',
  'Read the historical milestones alongside their source type. Manufacturer pages document products and stated specifications; research papers document particular experimental systems. The timeline retains the original 13 entries, with overlapping publications linked to the same citation records. Dates describe the source chronology, not a current product-availability survey.'
 ]),
 ('spectral-reconstruction','Computational Imaging and Spectral Reconstruction',[
  'Spectral reconstruction estimates wavelength-dependent information from camera measurements. The inversion depends on calibration, illumination, sensor response and model assumptions. The research spans sparse recovery, neural networks and methods using a physical colour reference chart. Reconstructed channels carry the conditions of the method that produced them.',
  'The Purdue study, repeated as NPL-1 and NPL-153, uses a specially designed spectral colour chart with a computational method. Its reported framework operates in the visible range. It does not establish unrestricted recovery of near-infrared information from any ordinary RGB photograph. For each approach, the research question is how accurately spectra transfer to new devices, lighting conditions, samples and acquisition settings.'
 ]),
 ('optical-physiology','Optical Physiology and Tissue Imaging',[
  'Optical physiology studies connect image variation with quantities such as blood volume, perfusion and oxygenation. The source collection brings rPPG, tissue hyperspectral imaging, skin fluorescence and endoscopic reconstruction into one reading path. Each method retains its own hardware, tissue and reference measurement.',
  'The endoscopy study at NPL-221 examines hyperspectral conversion and CycleGAN-generated narrowband images in an esophageal imaging setting. Its clinical context is distinct from a smartphone facial measurement. Oxytocin and baroreflex papers provide physiological context for potential optical associations; they do not, by themselves, establish gene-specific measurement from facial images. Validation needs paired reference assays and controls for motion, lighting, skin pigmentation and vascular state.'
 ]),
 ('autofluorescence-sensing','Autofluorescence and Molecular Sensing',[
  'Autofluorescence describes light emitted by endogenous molecules after excitation. The cited work covers metabolic coenzymes, proteins, tissue fluorescence and image analysis. Interpretation depends on excitation and emission bands, optical depth, background signals and the mixture of fluorophores in the sample.',
  'The bibliography also includes chemical probes, immunoassays and genetically encoded sensors. These methods need explicit labels for reagents, sample preparation, instrumentation and biological setting. A smartphone-linked assay and an unmodified phone camera observing intact skin are different experimental systems. Fractal descriptions and molecular geometry remain research frameworks to test against measured data.'
 ]),
 ('imaging-transcriptomics','Imaging, Transcriptomics and Gene Regulation',[
  'SpectralSeq pairs hyperspectral autofluorescence microscopy and RNA sequencing from the same individual cells. The published study connects optical and morphological features with transcriptomic variation in the tested cell system. NPL-9b records the publication; NPL-9 and NPL-214 retain its HyperSeq preprint provenance.',
  'This supplies an experimental route for studying relationships between optical phenotype and molecular state. The proposed extension to facial imaging and gene-specific inference remains a hypothesis. The next questions concern paired ground truth, cell and tissue specificity, confounding, repeatability and independent validation. TFBS, chromatin and protein-structure publications provide supporting molecular context, with their distinct methods and scales retained.'
 ]),
 ('patent-landscape','Patent Landscape and Related Technologies',[
  'The original list contains 11 patent entries spanning imaging, physiological sensing and related identity or reward systems. Each number is retained exactly as cited, alongside its resolved public title when available. Disagreements between the bibliography description and the public record remain visible.',
  'Patent documents establish what an applicant disclosed or claimed in that document. Experimental support, publication status and current legal status require separate checks. This chapter records provenance and technology relationships; it makes no novelty, infringement or freedom-to-operate assessment.'
 ])]
general=read(DATA/'general-edition.json');general['chapters']=[c for c in general['chapters'] if c.get('id')!='hyperspectral-imaging']
number=max(c['number'] for c in general['chapters'])+1
topics=[]
for i,(tid,title,paragraphs) in enumerate(descriptions,1):
 ids=list(dict.fromkeys(e['recordId'] for e in register if e['topicId']==tid))
 pp=[]
 for rid in ids:
  r=groups[rid]
  pp.append({'id':'general-'+tid+'-'+rid,'recordId':rid,'title':r['title'],'journal':r.get('journal',''),'year':r.get('year'),'authors':r.get('authors',''),'design':r.get('design',''),'urls':r['urls'],'quotes':[],'summary':r.get('finding',''),'relatedVersions':r.get('relatedVersions',[]),'limitation':r.get('limitation',''),'citationCount':r.get('citationCount'),'sourcePages':[],'doi':r.get('doi'),'pmid':r.get('pmid'),'targets':r.get('targets',[]),'categories':r.get('categories',[]),'sourceReferences':r['sourceReferences'],'sourceType':r['sourceType'],'sourceVerification':r['sourceVerification']})
 topics.append({'id':tid,'number':str(number)+'.'+str(i),'title':title,'trustScore':None,'trustAssessment':{'scope':'Subchapter','status':'not-assessed','score':None,'basis':'The source inventory is complete. Unresolved identities remain flagged, and topic evidence thresholds have not been assigned.'},'paragraphs':paragraphs,'papers':pp})
timeline=[]
timeline_refs=[['NPL-149'],['NPL-147'],['NPL-145'],['NPL-146'],['NPL-154','NPL-155'],['NPL-147'],['NPL-148'],['NPL-150'],['NPL-151'],['NPL-152'],['NPL-1','NPL-153'],['NPL-221'],['NPL-222']]
types=['Thermal imaging','Point NIR spectroscopy','Tunable-filter imaging','Tunable-filter platform','Image-processing platform','Embedded NIR spectroscopy','NIR depth sensing','Smartphone HSI attachment','Field imaging','Laboratory infrared HSI','RGB spectral reconstruction','Endoscopic reconstruction','Commercial medical imaging']
for row,refs,kind in zip(inventory['timeline'],timeline_refs,types):
 timeline.append({'sourceOrder':len(timeline)+1,'year':row['year'],'entity':row['entity'],'technologyClass':kind,'description':plain(row['technology']),'reportedSpectralBand':plain(row['spectralBand']),'reportedApplication':plain(row['application']),'sourceReferences':refs,'recordId':refmap[refs[0]],'status':'Historical source description; capability appraisal pending'})
for row in timeline:
 if 'NPL-1' in row['sourceReferences']:
  row['spectralBand']='Visible 400–720 nm'
  row['description']='Spectral colour-chart and computational reconstruction from RGB photographs'
  row['correctionNote']='The original timeline labels this Vis–NIR. The cited study describes visible-range reconstruction using a physical reference chart; the original band and application wording are retained as source claims.'
  row['status']='Method and wavelength range checked against the primary article; application claims need separate sources.'
 if 'NPL-221' in row['sourceReferences']:
  row['correctionNote']='The study compares image-quality measures. Prospective clinical diagnostic accuracy is not established by those comparisons alone.'
timeline.sort(key=lambda r:9999 if 'present' in r['year'] else int(r['year'][:4]))
chapter={'number':number,'id':'hyperspectral-imaging','title':'Hyperspectral Imaging','overview':[
 'Hyperspectral imaging connects spatial information with wavelength-dependent measurements. This chapter follows the development of cameras and reconstruction methods, then examines optical physiology, molecular sensing and links to transcriptomics.',
 'The collection reconciles 229 non-patent citation entries and 11 patent entries from patent section 2.4. Original reference IDs remain intact. Repeated citations share source records; preprints and published versions retain explicit relationships. The 13 timeline entries overlap the bibliography and are not counted as additional publications.',
 'Bibliographic identity and scientific evidence are separate assessments. Matched metadata confirms the cited work, while source annotations, proposed mechanisms and commercial claims retain their stated review status.'
 ],'topics':topics,'timeline':timeline,'sourceRegister':register,'registerDownloads':{'json':'library-data/hyperspectral-register.json','csv':'library-data/hyperspectral-register.csv'},'sourcePages':inventory['sourcePages']}
general['chapters'].append(chapter)
general['paperCount']=sum(len(t['papers']) for c in general['chapters'] for t in c['topics'])
general['topicCount']=sum(len(c['topics']) for c in general['chapters'])
general['uniquePaperCount']=len({p.get('doi') or p.get('pmid') or p['recordId'] for c in general['chapters'] for t in c['topics'] for p in t['papers']})
save(DATA/'general-edition.json',general)
save(DATA/'hyperspectral-expansion.json',{'reviewedAt':'2026-10-27','scope':'Bibliographic reconciliation; claim-level appraisal is recorded separately.','records':list(groups.values())})
stats={'originalNPLRows':229,'originalPatentRows':11,'originalTimelineRows':13,'uniqueSourceRecords':len(groups),'focusedChapterRecords':len({p['recordId'] for t in topics for p in t['papers']}),'reusedLibraryRecords':sum(r in existing for r in groups),'sourceStatusCounts':dict(__import__('collections').Counter(e['metadataStatus'] for e in register))}
reg={'title':'Hyperspectral Imaging — complete source register','reviewedAt':'2026-10-27','counts':stats,'numberingNote':inventory['numberingNote'],'sourcePages':inventory['sourcePages'],'entries':register,'timeline':timeline,'publicationVersions':related(['NPL-9','NPL-9b','NPL-214'])}
save(DATA/'hyperspectral-register.json',reg)
fields=['ref','recordId','sourceType','title','authors','year','journal','doi','pmid','pmcid','patentNumber','originalAssignee','originalCitation','originalSection','metadataStatus','claimReview','sourceURL','publicationURL','metadataURL','corrections','topicId','role']
with (DATA/'hyperspectral-register.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
 for e in register:w.writerow({k:'; '.join(e[k]) if isinstance(e[k],list) else e[k] for k in fields})
save(AUDIT/'reconciliation-report.json',{**stats,'duplicateReferences':[{'recordId':rid,'refs':[e['ref'] for e in r['sourceReferences']]} for rid,r in groups.items() if len(r['sourceReferences'])>1],'unresolved':[e['ref'] for e in register if e['metadataStatus'] in ['unresolved','identifier-conflict']],'retainedContextReferences':[e['ref'] for e in register if not e['topicId']],'numberingNote':inventory['numberingNote']})
print(json.dumps(stats,indent=2))
