#!/usr/bin/env python3
"""Append the reviewed Nature Portfolio selection without rewriting existing passages."""
import copy, hashlib, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'Informatics/library-data'
REPORT = ROOT / 'research/informatics/nature-expansion-20261023'
DATE = '2026-10-23'
metadata = json.loads((REPORT / 'metadata-review.json').read_text())['records']
by_doi = {r['doi']: r for r in metadata}
records = []
placements = []

def add(doi, collection, topic, design, category, targets, transmitters, summary, limitation, sample, measurement, measured=(), assessment='peer-reviewed', basis=None):
    m = by_doi[doi]
    assert not m.get('existingRecordId') and not m.get('error')
    ident = 'pmid-' + m['pmid'] if m.get('pmid') else 'doi-' + hashlib.sha256(doi.encode()).hexdigest()[:16]
    urls = [m['publisherURL'], 'https://doi.org/' + doi]
    if m.get('pmcid'): urls.append('https://pmc.ncbi.nlm.nih.gov/articles/' + m['pmcid'] + '/')
    if m.get('pmid'): urls.append('https://pubmed.ncbi.nlm.nih.gov/' + m['pmid'] + '/')
    record = {k: m.get(k) for k in ['title','journal','year','authors','doi','pmid']}
    record.update(id=ident, collections=[collection], origin='update', publisherFamily='nature',
        publisherFamilyLabel='Nature Portfolio', urls=urls, design=design, categories=[category],
        targets=targets, neurotransmitters=transmitters, priority=0 if category in ['Gene expression','Epigenetics'] else 1,
        finding=summary, limitation=limitation, kind='Review' if assessment == 'review' else 'Journal article',
        citationCount=m['citations'], citationSnapshot={'count':m['citations'],'source':'Crossref','retrievedAt':DATE,'url':'https://api.crossref.org/works/'+doi},
        studyDesignAssessment={'category':assessment,'peerReviewed':True,'basis':basis or design + '. No masked human randomized trial classification is assigned.', 'sources':urls,'reviewedAt':DATE},
        evidence={'evidenceType':category,'sample':sample,'measurement':measurement,'measuredGenes':list(measured),
            'relationshipNote':limitation,'sourceURLs':urls,'checkedAt':DATE},
        jadad={'status':'unassessed','score':None})
    records.append(record); placements.append((collection,topic,record))

add('10.1038/nature05526','general','neurotransmitter-signalling','Experimental mouse study','Molecular biomarkers',['CD38','OXT'],['Oxytocin'],
    'Mice lacking CD38 had reduced oxytocin secretion and impaired maternal and social behaviour. Oxytocin administration or restoration of CD38 rescued aspects of the behavioural changes, linking CD38-dependent calcium signalling to oxytocin release.',
    'A mechanistic animal study; it does not establish a clinical treatment effect in humans.',
    'Cd38-knockout and control mice','Oxytocin secretion, calcium signalling and social behaviour')
add('10.1038/nature12518','general','neurotransmitter-signalling','Experimental mouse study','Brain & nervous system',['OXTR','HTR1B'],['Oxytocin','Serotonin'],
    'In mice, social reward required coordinated oxytocin and serotonin signalling in the nucleus accumbens. Removing oxytocin receptors from dorsal raphe inputs, or blocking accumbens serotonin 5-HT1B receptors, prevented the rewarding effect of social interaction.',
    'The experiments identify a mouse neural mechanism. They do not measure SLC6A4 gene expression or test a human therapy.',
    'Mice','Receptor deletion, pharmacology, synaptic responses and social reward')
add('10.1038/mp.2012.103','general','neurotransmitter-signalling','Laboratory receptor-interaction study; research letter','Molecular biomarkers',['DRD2','OXTR'],['Dopamine','Oxytocin'],
    'The authors report dopamine D2–oxytocin receptor complexes in the ventral and dorsal striatum, with facilitatory interactions between the receptors. The findings provide a molecular explanation to investigate alongside wider evidence linking dopamine and oxytocin to social behaviour.',
    'Receptor interactions in laboratory preparations do not establish their clinical importance or demonstrate a change in gene expression.',
    'Laboratory receptor and rat striatal preparations','Receptor proximity and functional receptor interactions')
add('10.1038/s41583-018-0072-6','general','neurotransmitter-signalling','Narrative review','Brain & nervous system',['OXTR','DRD2','AVPR1A'],['Oxytocin','Dopamine','Vasopressin'],
    'This review describes how oxytocin, dopamine and vasopressin interact with reward and social-memory circuits during pair-bond formation and maintenance. It connects experimental work in prairie voles and other animals with questions about human attachment.',
    'A narrative synthesis with substantial animal evidence; it is not a pooled estimate of a human treatment effect.',
    'Animal studies and human attachment research','Review of neural circuits and receptor mechanisms',assessment='review')
add('10.1038/s41467-020-15659-1','general','oxytocin-sensory','Experimental developmental brain-mapping study','Gene expression',['OXTR'],['Oxytocin'],
    'Cellular-resolution maps show that oxytocin receptor expression changes across brain regions and postnatal development in mice. Reporter imaging and RNA measurements identify transient cortical expression and region-specific patterns, providing an anatomical reference for oxytocin research.',
    'Mouse developmental maps do not establish the corresponding receptor distribution or functional connections in the human brain.',
    'Postnatally developing mice','Oxytocin receptor reporter imaging and in situ RNA measurements',measured=['OXTR'])
add('10.1038/nn.3634','general','oxytocin-sensory','Experimental mouse study','Brain & nervous system',['OXT'],['Oxytocin'],
    'Early sensory deprivation altered oxytocin synthesis and release and reduced excitatory synaptic transmission across sensory cortices in mice. Oxytocin treatment restored aspects of this transmission, linking early sensory experience to oxytocin-dependent cortical plasticity.',
    'Experiments in developing mice; the study does not test EMDR, music therapy or a human clinical intervention.',
    'Developing mice exposed to sensory deprivation','Oxytocin synthesis and release; cortical synaptic transmission')
add('10.1038/s41586-019-1075-9','general','neurotransmitter-signalling','Experimental mouse study','Brain & nervous system',['OXTR','SLC6A4'],['Oxytocin','Serotonin','Dopamine'],
    'In adult mice, MDMA reopened a developmental period for social-reward learning. The effect involved oxytocin-dependent plasticity in the nucleus accumbens, connecting serotonergic drug action with oxytocin signalling and social learning.',
    'An animal mechanism study. SLC6A4 is indexed for serotonin-transporter involvement, not a measured change in its gene expression. The study does not establish human treatment efficacy.',
    'Mice','Social-reward learning, pharmacology and synaptic plasticity')
add('10.1038/s41380-023-02309-3','general','neurotransmitter-signalling','Experimental mouse molecular study','Gene expression',['OXTR','MIR132','GDF5'],['Oxytocin'],
    'Septal miR-132 contributed to social-fear extinction and oxytocin-mediated reversal of social fear in male mice. Manipulation in oxytocin-receptor-expressing neurons linked this microRNA to behavioural responses and downstream Gdf5 regulation.',
    'The molecular and behavioural findings come from male mice; they do not establish a therapy or biomarker for human social anxiety.',
    'Male mice','Septal microRNA expression and manipulation; social-fear behaviour',measured=['MIR132','GDF5'])
add('10.1038/s41386-024-01996-y','general','neurotransmitter-signalling','Double-blind randomized placebo-controlled trial','Brain & nervous system',[],['Oxytocin'],
    'In 124 healthy women, intranasal oxytocin impaired fear-extinction learning relative to placebo. The result challenges the assumption that oxytocin uniformly improves extinction and highlights the importance of timing and experimental context.',
    'Healthy participants completed a laboratory conditioning task. The trial did not test a clinical PTSD treatment or measure gene expression.',
    '124 healthy women','Fear conditioning and extinction responses',assessment='double-blind-rct',
    basis='The article reports a randomized, double-blind, placebo-controlled human experiment. Its outcome is laboratory fear extinction.')
add('10.1038/s41598-026-38976-9','general','neurotransmitter-signalling','Experimental mouse study','Brain & nervous system',[],['Oxytocin','Dopamine'],
    'Oxytocin and dopamine interacted during socially acquired food-preference learning in mice. Oxytocin affected updating after an aversive outcome, and dopamine depletion removed this effect, indicating dependence on intact dopaminergic signalling.',
    '“Trust” is operationalised through a mouse food-learning task. The experiment does not directly measure human trust or DRD2 gene expression.',
    'Mice','Social transmission of food preference and pharmacological manipulation')
add('10.1038/s41586-023-06540-4','general','oxytocin-sensory','Experimental mouse neural-circuit study','Brain & nervous system',['OXT'],['Oxytocin'],
    'Pup calls activated a thalamus-to-hypothalamus pathway that promoted maternal oxytocin release in mice. Prolonged disinhibition of oxytocin neurons linked an auditory social cue to neuropeptide release.',
    'The study examines maternal responses to infant calls in mice. It does not test music, brain entrainment or human stress reduction.',
    'Maternal mice','Neural recordings, circuit manipulation and oxytocin release')
add('10.1038/nn.2270','general','stress-plasticity','Human postmortem observational study and laboratory assays','Epigenetics',['NR3C1'],[],
    'Hippocampal tissue from suicide victims with a history of childhood abuse showed altered glucocorticoid-receptor promoter methylation and lower receptor transcript levels. Laboratory promoter assays supported a potential regulatory link between methylation and transcription.',
    'Postmortem associations cannot establish that childhood adversity caused the molecular differences or that the pattern applies to every exposed person.',
    'Human postmortem hippocampal tissue','NR3C1 promoter methylation and messenger RNA',measured=['NR3C1'],assessment='observational')
add('10.1038/s41593-017-0010-3','general','stress-plasticity','Experimental mouse study with human postmortem comparison','Molecular biomarkers',['IL6','CLDN5'],[],
    'Chronic social stress reduced the tight-junction protein claudin-5 in susceptible mice, increasing blood–brain barrier permeability and allowing peripheral IL-6 into the brain. Reduced CLDN5 was also observed in postmortem tissue from people with depression.',
    'Causal manipulations were performed in mice. IL-6 infiltration is a protein-level finding; the human comparison is observational.',
    'Mice and human postmortem tissue','Blood–brain barrier permeability, CLDN5 expression and IL-6 protein',measured=['CLDN5'])
add('10.1038/nrn2153','general','stress-plasticity','Narrative review','Brain & nervous system',['NMDA'],[],
    'This review explains how NMDA receptor trafficking and subunit composition influence synaptic plasticity, and discusses their relevance to neuropsychiatric disorders. It provides background for interpreting activity-dependent changes in excitatory signalling.',
    'NMDA denotes a receptor family. This review does not establish a direct OXTR interaction or the efficacy of a particular intervention.',
    'Cellular, animal and neuropsychiatric literature','Review of receptor trafficking and synaptic plasticity',assessment='review')
add('10.1038/srep09506','sound','x','Controlled, non-randomized transcriptome study','Gene expression',['SNCA','FOS','DUSP1'],[],
    'Whole-blood gene expression changed after a two-hour concert performed by professional musicians. Genes including SNCA, FOS and DUSP1 contributed to the reported response, with enrichment of pathways related to neuronal activity and plasticity.',
    'Ten performers were compared with ten music-free controls. Blood transcription does not directly measure gene expression in the brain, and allocation was not randomized.',
    '10 professional performers and 10 controls','Whole-blood transcriptome before and after two hours',measured=['SNCA','FOS','DUSP1'],assessment='observational')
add('10.1038/nn.2726','sound','vii','Human PET and functional MRI study','Brain & nervous system',[],['Dopamine'],
    'Pleasurable music was associated with dopamine release in the striatum. Anticipation and peak emotional experience recruited different regions, with caudate involvement during anticipation and nucleus accumbens involvement during peak pleasure.',
    'A small laboratory study of selected listeners. Dopamine release is not a measurement of DRD2 gene expression or a music-therapy outcome.',
    'Healthy listeners selected for strong emotional responses to music','PET dopamine-sensitive radioligand imaging and fMRI',assessment='observational')
add('10.1038/s41398-023-02671-4','sound','vii','Narrative review','Brain & nervous system',[],['Oxytocin','Dopamine'],
    'The authors organise music and mental-health research around biological principles involving reward, rhythm, learning and social connection. The review examines neural and physiological mechanisms, including dopamine and oxytocin signalling, that may help explain responses to music.',
    'A broad mechanistic review; it does not supply one pooled treatment effect or establish that every music intervention acts through the same pathways.',
    'Human and animal literature','Review of biological mechanisms relevant to music and mental health',assessment='review')
add('10.1038/nrn3666','sound','vii','Narrative review','Brain & nervous system',[],['Dopamine'],
    'Neuroimaging research links music-evoked emotions to networks involving reward, autonomic regulation and emotional processing, including the nucleus accumbens, amygdala and hypothalamus. The review examines how musical structure and expectation engage these systems.',
    'A review of mechanisms and brain responses; it does not estimate clinical efficacy for a defined music-therapy programme.',
    'Human neuroimaging literature','Review of music-evoked emotion and brain activity',assessment='review')
add('10.1038/s41562-024-01907-7','language','mindfulness-clinical','Randomized controlled multisite study','Clinical & self-report',[],[],
    'Across 37 sites and 2,239 participants, four brief self-administered mindfulness exercises reduced immediate self-reported stress compared with an active control. The body-scan exercise produced the largest reduction among the tested exercises.',
    'The outcomes were short term and self-reported, with predominantly English-speaking participants in higher-income settings. Gene expression was not measured.',
    '2,239 participants at 37 sites','Immediate self-reported stress',assessment='rct',basis='Random assignment and an active comparison are reported. A single- or double-blind classification is not established from the reviewed methods.')
add('10.1038/tp.2016.164','language','mindfulness-rna','Randomized retreat comparison with an observational experienced-meditator group','Gene expression',[],[],
    'A six-day resort stay was associated with substantial blood gene-expression changes in both meditation and vacation groups. Experienced meditators showed additional molecular patterns, but the randomized novice-meditation comparison did not establish a gene-expression advantage over vacation.',
    'The experienced-meditator group was not randomized. Shared changes across groups cannot be attributed specifically to meditation.',
    'Healthy women: meditation-naive participants randomized to retreat or vacation, plus experienced meditators','Blood transcriptome and disease-associated molecular phenotypes',assessment='rct',basis='Novices were randomized to meditation or vacation; experienced meditators formed a separate observational group. Masked molecular superiority of meditation was not established.')
add('10.1038/tp.2016.234','language','mindfulness-epigenetics','Exploratory molecular substudy of a yoga trial','Epigenetics',['TNF','IL6'],[],
    'An exploratory substudy in chronically stressed women reported lower methylation in a TNF region following a brief yoga intervention. Comparable regional changes were not found for IL6 or CRP, and a reduction in circulating inflammatory markers was not established.',
    'The molecular sample contained 28 women. Its retrospective and uncontrolled longitudinal components limit causal interpretation, despite recruitment from a larger randomized trial.',
    '28 chronically stressed women from a larger trial','Targeted DNA methylation and inflammatory proteins',measured=['TNF','IL6','CRP'],assessment='observational')
add('10.1038/s41586-019-0931-y','vision','bilateral-mechanisms','Experimental mouse neural-circuit study','Brain & nervous system',[],[],
    'Alternating bilateral visual stimulation during fear extinction recruited a superior-colliculus–thalamus–amygdala circuit in mice and reduced the return of conditioned fear. The experiments identify a possible neural mechanism relevant to eye-movement-based approaches.',
    'A mouse model inspired by a psychotherapeutic component; it is not a trial of clinical EMDR or a self-administered treatment in humans.',
    'Mice','Circuit manipulation, neural activity and conditioned fear')
add('10.1038/srep34610','vision','bilateral-mechanisms','Human experimental neuroimaging study','Brain & nervous system',[],[],
    'During an EMDR-related procedure, healthy volunteers recalled moderately unpleasant memories while researchers measured cortical haemodynamic responses. The study examined temporal and orbitofrontal activity as possible correlates of memory processing.',
    'Participants were model volunteers, not a clinical PTSD cohort. The study does not establish treatment efficacy or a gene-expression effect.',
    'Healthy volunteers recalling moderately unpleasant memories','Functional near-infrared spectroscopy and subjective responses',assessment='observational')

def topic(ident,title):
    return {'id':ident,'title':title,'papers':[],'trustScore':None}

books = {n:json.loads((DATA/(n+'-edition.json')).read_text()) for n in ['sound','language','vision','general']}
if not any(c['number']==8 for c in books['general']['chapters']):
    books['general']['chapters'].append({'number':8,'title':'Neurotransmitters, stress and synaptic plasticity','topics':[
        topic('neurotransmitter-signalling','Oxytocin, serotonin and dopamine signalling'),
        topic('oxytocin-sensory','Oxytocin receptors and sensory experience'),
        topic('stress-plasticity','Stress, inflammation and synaptic plasticity')]})
if not any(c['number']==5 for c in books['vision']['chapters']):
    books['vision']['chapters'].append({'number':5,'title':'Bilateral stimulation and neural mechanisms','topics':[
        topic('bilateral-mechanisms','Bilateral visual stimulation and memory processing')]})
for collection,topic_id,record in placements:
    t=next(t for c in books[collection]['chapters'] for t in c['topics'] if t['id']==topic_id)
    if any(p['recordId']==record['id'] for p in t['papers']): continue
    paper={k:copy.deepcopy(record[k]) for k in ['title','journal','year','authors','design','urls','doi','pmid','targets','neurotransmitters','categories','citationCount','citationSnapshot','studyDesignAssessment','evidence']}
    paper.update(id=f'{collection}-{topic_id}-{record["id"]}',recordId=record['id'],quotes=[],sourcePages=[],summary=record['finding'],limitation=record['limitation'])
    t['papers'].append(paper)
for collection in books:
    for c in books[collection]['chapters']:
        for t in c['topics']:
            if t['id'] in ['neurotransmitter-signalling','oxytocin-sensory','stress-plasticity','bilateral-mechanisms','mindfulness-epigenetics']:
                count=len({p['recordId'] for p in t['papers']}); t['trustScore']=1 if count>=3 else None
                t['trustAssessment']={'status':'assessed' if count>=3 else 'below-minimum','peerReviewedPapers':count,'basis':'At least 3 peer-reviewed journal articles' if count>=3 else 'Minimum 3 papers not yet reached','reviewedAt':DATE}
    flat=[p for c in books[collection]['chapters'] for t in c['topics'] for p in t['papers']]
    books[collection]['paperCount']=len(flat)
    books[collection]['uniquePaperCount']=len({p.get('doi') or p.get('pmid') or p['recordId'] for p in flat})
    books[collection]['topicCount']=sum(len(c['topics']) for c in books[collection]['chapters'])
    (DATA/(collection+'-edition.json')).write_text(json.dumps(books[collection],ensure_ascii=False,indent=2)+'\n')

access={}
for m in metadata:
    ident=m.get('existingRecordId') or next(r['id'] for r in records if r['doi']==m['doi'])
    access[ident]={'journalKey':re.sub(r'[^a-z0-9]','',m['journal'].lower()),'journalLabel':m['journal']}
    if m['journal']!='American Journal of Hypertension': access[ident].update(publisherFamily='nature',publisherFamilyLabel='Nature Portfolio')
frontiers=json.loads((REPORT/'frontiers-metadata-review.json').read_text())['records']
for m in frontiers:
    assert not m.get('error') and m['similarity']>.9
    access[m['existingRecordId']]={'journalKey':re.sub(r'[^a-z0-9]','',m['journal'].lower()),'journalLabel':m['journal'],'publisherFamily':'frontiers','publisherFamilyLabel':'Frontiers'}
(DATA/'nature-expansion.json').write_text(json.dumps({'reviewedAt':DATE,'records':records,'publicationAccess':access},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'newRecords':len(records),'naturePortfolio':sum(a.get('publisherFamily')=='nature' for a in access.values()),'frontiers':len(frontiers)}))
