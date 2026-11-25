"""Apply the 25 November 2026 source review to the existing 528 Hz topic."""
from pathlib import Path
import json, sys, collections

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'Informatics/library-data'
sys.path.insert(0, str(ROOT / 'tools'))
from research_topic_trust import assess_topic
DATE = '2026-11-25'
def load(name): return json.loads((DATA / (name + '.json')).read_text())
def save(name, value): (DATA / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
book, library, hsi = load('sound-edition'), load('library'), load('hyperspectral-expansion')
topic = next(t for c in book['chapters'] for t in c['topics'] if t['id'] == 'ii')
assert len(topic['papers']) == 4
new = []
def record(ident, title, authors, journal, year, doi, design, summary, limitation, basis, *, rct=None, score=None, role='528 Hz intervention', urls=None, n=None, trial=None):
    urls = urls or ['https://doi.org/' + doi]
    assessment = dict(score=score, scope='Paper', status='assessed' if score else 'unassessed', randomizedControlledTrial=rct,
                      blinding='not-confirmed', peerReviewed=bool(score), basis=basis, sources=urls,
                      reviewScope='Publication-specific methods and results review; separate from a formal risk-of-bias instrument.', assessedAt=DATE)
    row = dict(id=ident, title=title, authors=authors, journal=journal, year=year, doi=doi, pmid=None, urls=urls,
               collections=['sound'], origin='update', categories=['Clinical & self-report'], targets=[], kind=design, design=design,
               finding=summary, summary=summary, limitation=limitation, quotes=[], archiveEntries=[], priority=1,
               stars=score, ratingBasis=basis, paperTrustAssessment=assessment,
               studyDesignAssessment=dict(basis=basis, sources=urls, reviewedAt=DATE),
               jadad=dict(status='unassessed', score=None), citationCount=None,
               evidence=dict(trialId=trial or doi, researchRole=role, sampleSize=n),
               sourceType='Study protocol' if 'protocol' in design.lower() else 'Conference paper' if 'conference' in design.lower() else 'Journal publication',
               sourceVerification='Full text reviewed' if ident != 'sound528-khalisha2026' else 'Crossref identity verified; full methods unavailable')
    new.append(row)
    return row

record('sound528-bozok2026', 'Acute Music-Frequency Exposure Modulates Salivary Stress and Neurotrophic Markers in Young Adults: A Randomized Controlled Trial',
       'Bozok ÜG, Böyük Özcan G, Bayraktar B, Özen D.', 'Brain and Behavior', 2026, '10.1002/brb3.71452',
       'Randomized controlled trial; 162 students; three parallel groups',
       'After 20 minutes of 528 Hz-labelled instrumental music, salivary CREB was higher and GRP78 lower than in the no-music group. Stroop performance did not differ. Table 1 gives 528 Hz and control the same BDNF significance label, despite the more positive abstract.',
       'Exploratory salivary measures do not establish brain neuroplasticity, neuroprotection or experienced stress relief. Audio calibration and masking are insufficiently described. The abstract/table disagreement and inconsistent baseline-sampling description reduce confidence.',
       'The methods report manual permuted-block allocation to 528 Hz music, 432 Hz music or no music (54 per group). All 162 completed the acute assessment. Double blinding is not established; the reported registration label is not an NCT identifier.', rct=True, score=2, n=162)

record('hsi-c2e2e55e945231', 'Effect of OM Chanting of 528Hz Frequency on Heart Rate Variability, Psychological Wellbeing, and Quality of Sleep in Patients of Hypertension: A Randomised Controlled Trial',
       'Bhoot A, Chowdhury AB, Shah H, Vaishnav B.', 'Annals of Neurosciences', 2025, '10.1177/09727531251390261',
       'Randomized controlled trial; 60 patients; 55 completed four weeks',
       'Fifteen minutes of daily listening to 528 Hz OM chanting plus standard care produced promising blood-pressure and perceived-stress results against standard care. Pulse and systolic-pressure time-by-group interactions were significant; SDNN and RMSSD interactions were not. Between-group sleep and total wellbeing differences were not significant.',
       'The study evaluates a chanting-and-listening practice. There is no matched recording at another tuning, and five participants were lost to follow-up. Multiple outcomes and differing statistical results limit a broad claim of improved autonomic function or sleep.',
       'WINPEPI software allocated 30 patients per group. Standard care was the comparator. Participant and assessor masking were not established. Full-text tables were checked alongside the abstract.', rct=True, score=2, n=60,
       urls=['https://doi.org/10.1177/09727531251390261', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12700779/'])

record('sound528-heti2024', '528Hz: The Sound Of Tranquillity And Its Effect On Anxiety',
       'Heti M, Yeshaswini V.', 'Revista Electrónica de Veterinaria', 2024, '10.69980/redvet.v25i1S.787',
       'Reported randomized controlled experiment; 48 analysed; single session',
       'A three-minute exposure described as a pure 528 Hz tone was compared with neutral reading. Mean state-anxiety scores fell by 4.63 points in the sound group and 0.83 in controls; the reported time-by-group interaction was p = .036.',
       'Random sequence generation and concealment are unspecified. Participant-flow arithmetic, outlier handling, STAI descriptions and statistical reporting contain inconsistencies. No biomarkers or sustained outcomes were measured. Treat this as a low-confidence preliminary result.',
       'The full paper explicitly reports random allocation to two groups of 24. Its design meets the library RCT category, while serious reporting weaknesses remain. The CABI link is another record for this publication, as confirmed by the supplied title.', rct=True, score=2, n=48,
       urls=['https://doi.org/10.69980/redvet.v25i1S.787', 'https://veterinaria.org/index.php/REDVET/article/download/787/500/', 'https://www.cabidigitallibrary.org/doi/full/10.5555/20240419729'])

record('sound528-ravikumar2026', 'Effects of a Sound-Based Meditative Intervention on Anxiety, Depression, Salivary Cortisol Levels, and Blood Pressure: A Randomized Controlled Trial',
       'Ravikumar H, Sathyanarayanan S.', 'Cureus', 2026, '10.7759/cureus.115693',
       'Randomized controlled trial; 100 adults; four weeks',
       'Daily sound meditation incorporating recorded 528 Hz audio and acoustic instruments outperformed remotely delivered music on anxiety, depression, salivary cortisol and blood pressure. Adjusted differences included HADS anxiety −2.55 points (95% CI −3.62 to −1.48) and cortisol −2.54 nmol/L (−2.95 to −2.13).',
       'In-person group meditation, instruments, equipment and extra home practice differed from the online control. Their contributions cannot be separated. Follow-up ended at four weeks, acoustic calibration was incomplete, and the registered POMS-SF outcome was omitted.',
       'Lottery allocation assigned 50 participants per arm; all completed follow-up. Baseline-adjusted ANCOVA and Holm correction were reported. Blood-pressure and laboratory assessors were masked; credible participant double blinding was not established.', rct=True, score=2, n=100, trial='CTRI/2025/01/078996',
       urls=['https://doi.org/10.7759/cureus.115693', 'https://assets.cureus.com/uploads/original_article/pdf/465976/20260903-1742260-urf4g2.pdf'])

record('sound528-unhale2023', 'Study On Impact of Sound Frequency on Human Well Being Using Randomized Block Design',
       'Unhale SI, Khairnar SL, Joshi MA.', 'Journal of Advanced Zoology', 2023, '10.53555/jaz.v44iS8.3467',
       'Reported randomized block experiment; RCT eligibility unresolved',
       'The report includes 57 participants aged 17–20 and exposures labelled 379, 430 and 528 Hz. Mean ratings for calmness, focus and stress relief were higher at 430 Hz than at 528 Hz. A pooled before-and-after heart-rate reduction from 80.56 to 79.25 bpm does not separate the frequencies.',
       'The allocation and repeated-exposure structure are unclear; group sizes, sequence concealment and frequency-specific heart-rate comparisons are not adequately reported. A pooled change cannot identify the effect of 528 Hz. Randomized block design is a randomization method, but the reporting is insufficient to confirm a qualifying controlled trial here.',
       'The methods state random assignment within eight blocks, while also describing three exposures per participant. Retain the author-reported design and mark RCT eligibility unresolved rather than infer an independently verified RCT.', score=1, n=57,
       urls=['https://doi.org/10.53555/jaz.v44iS8.3467', 'https://jazindia.com/index.php/jaz/article/download/3467/2917/5261'])

record('sound528-pomazan2023', "Instruments for sound therapy vs. music therapy for teenager's emotional development",
       'Pomazan VM.', 'Proceedings of ICSIE 2023 · ACM', 2023, '10.1145/3634848.3634863',
       'Author-reported randomized controlled conference study; 28 adolescents',
       'The paper describes randomized groups receiving a sound device, active music therapy or control. It reports improvements in emotional self-ratings, without a significant difference between the two therapy groups.',
       'Only eight participants received the sound device. The described frequencies are 240–500 Hz with a 410–450 Hz base; 528 Hz appears in the conceptual Solfeggio mapping, rather than as a verified delivered tone. This is related frequency-family context with uncertain transfer to 528 Hz listening.',
       'The full conference paper reports random distribution of 28 participants (8/10/10) but gives no sequence or concealment method. It is retained as an author-reported RCT, with masking unconfirmed, and separated from the four trials explicitly including 528 Hz.', rct=True, score=2, role='Related frequency-family context', n=28,
       urls=['https://doi.org/10.1145/3634848.3634863', "https://www.researchgate.net/publication/377686510_Instruments_for_sound_therapy_vs_music_therapy_for_teenager%27s_emotional_development"])

record('sound528-khalisha2026', 'Real-Time Analysis of Therapeutic Board Game and Sound Therapy Effects on Adolescent Mental Health Using Facial Emotion and Stress Detection',
       'Khalisha S, Alfarezy K, Villanda TM, Herlambang AF, Rahaman MS, Fikry M.', 'IEEE International Conference on Activity and Behavior Computing', 2026, '10.1109/ABC68169.2026.11567273',
       'Conference publication; study design awaiting full-text verification',
       'The publication identity is verified through publisher-deposited Crossref metadata. The title concerns board-game and sound interventions with facial-emotion and stress detection.',
       'Full methods were inaccessible during this review. Sample size, random allocation, delivered frequencies and treatment findings remain unverified. Retained as a research lead; no RCT or efficacy claim is assigned.',
       'Bibliographic verification establishes the publication, not its trial design. RCT eligibility remains unresolved.', role='Research lead; methods pending',
       urls=['https://doi.org/10.1109/ABC68169.2026.11567273', 'https://ieeexplore.ieee.org/abstract/document/11567273'])

record('sound528-feneberg2020', 'Efficacy, Treatment Characteristics, and Biopsychological Mechanisms of Music-Listening Interventions in Reducing Pain (MINTREP): Study Protocol of a Three-Armed Pilot Randomized Controlled Trial',
       'Feneberg AC, Kappert MB, Maidhof RM, Doering BK, Olbrich D, Nater UM.', 'Frontiers in Psychiatry', 2020, '10.3389/fpsyt.2020.518316',
       'Randomized controlled trial protocol; no outcome results in this publication',
       'This protocol plans 90 participants and ten listening sessions comparing frequency-filtered, unmodified and self-selected music. It cites the earlier 444 Hz-tuned piano study and offers useful methods for examining music, stress and pain.',
       'The proposed filtering spans 50–4,000 Hz. This publication supplies no completed outcome evidence and does not specify a 528 Hz treatment arm. Its planned randomization cannot be counted as a completed 528 Hz RCT.',
       'Publisher identifies this as a study protocol. Planned masking and allocation are clearly described; the protocol is excluded from completed-trial counts.', rct=False, score=1, role='Methods and protocol context')

# Reuse the existing Bhoot publication identity across collections.
for r in new:
    if r['id'].startswith('hsi-'):
        existing = next(x for x in hsi['records'] if x['id'] == r['id'])
        existing.update({k:v for k,v in r.items() if k not in ['collections','origin','categories','pmid']})
        existing['collections'] = sorted(set(existing['collections'] + ['sound']))
        existing['categories'] = sorted(set(existing['categories'] + r['categories']))
        r['pmid'] = existing['pmid']
    else:
        assert not any(x['id'] == r['id'] for x in library['records'])
        library['records'].append(r)
def entry(r):
    return {**r, 'id':'ii-' + r['id'], 'recordId':r['id'], 'sourcePages':[], 'quotes':[]}
original = topic['papers']
akimoto = original[0]
akimoto.update(journal='Health', year=2018, authors='Akimoto K, Hu A, Yamaguchi T, Kobayashi H.', doi='10.4236/health.2018.109088',
    summary='Nine adults heard the same piano music at standard tuning and A4 = 444 Hz on separate days. The latter places C5 near 528 Hz. Cortisol, oxytocin and some mood measures changed within that condition; chromogranin A did not change significantly.',
    limitation='The sample was nine, with eight usable ECG recordings. Randomized condition order was not reported. Significance within one condition and not another does not establish a statistically significant difference between conditions.',
    quotes=[])
# Keep the original attributed extracts in the archived source record.
akimoto['quotationReview'] = {'basis':'Original extracts remain in the archived source record; current display uses the checked summary.', 'reviewedAt':DATE}
akimoto['paperTrustAssessment'] = dict(score=1, scope='Paper', status='assessed', randomizedControlledTrial=False, blinding='participant-masked', peerReviewed=True,
    basis='Small crossover study; participants were not told the tuning. Randomized order and double blinding were not established.',
    sources=['https://doi.org/10.4236/health.2018.109088'], assessedAt=DATE)
canonical = next(r for r in library['records'] if r['id'] == akimoto['recordId'])
for key in ['journal','year','authors','doi','summary','limitation','paperTrustAssessment','design']:
    canonical[key] = akimoto[key]
canonical.update(stars=1, publicationStatus='Published', ratingBasis=akimoto['paperTrustAssessment']['basis'])
for p, design, summary, limitation in [
    (original[1], 'Preclinical rat experiment', 'Rat-brain and behavioural research examines 528 Hz exposure at different sound intensities.', 'Animal tissue and behavioural findings provide mechanistic context; they do not establish human treatment effects. The reported 100 dB condition is not a recommended human listening level.'),
    (original[2], 'In-vitro astrocyte experiment', 'Cell-culture research examines viability and oxidative-stress measures after ethanol and 528 Hz sound exposure.', 'Cultured-cell outcomes do not establish treatment efficacy for alcohol dependence or regeneration of the human brain.'),
    (original[3], 'Auditory coding reference; not a stress-reduction trial', 'This archival auditory-coding paper uses a 528 Hz reference in a pitch-comparison context.', 'Retained as auditory-science background. It supplies no evidence of therapeutic stress reduction at 528 Hz.')]:
    p.update(design=design, summary=summary, limitation=limitation)
topic['title'] = '528 Hz sound and tuning: human trials, biomarkers and preclinical research'
topic['context'] = 'The 528 Hz family includes pure tones, A4 = 444 Hz tuning with C5 near 528 Hz, music and chanting. Each intervention retains its own description.'
topic['description'] = 'A growing, preliminary evidence base across the 528 Hz tuning family. Human trials now sit alongside the earlier piano, animal, cell and auditory research.'
topic['paragraphs'] = [
    'This chapter includes 12 distinct publications: the four original references plus eight additions. The CABI and REDVET links identify one paper, and the Mental Health Daily article describes the Cureus trial. Those duplicate links add access routes, not independent studies. The radio link is not a research publication.',
    'Five completed papers describe randomized controlled designs: Bozok, Bhoot, Heti, Ravikumar and Pomazan. Four explicitly include a 528 Hz intervention; Pomazan provides related device-based frequency research. Unhale reports randomized blocks with unresolved trial classification. MINTREP is a protocol, and the IEEE paper remains a methods-verification lead.',
    'Two blue crosses reflect the library threshold of at least three distinct randomized controlled trials. Four trials explicitly including 528 Hz meet that design threshold. The badge describes study design and volume; it is separate from research quality, effect size, replication and certainty of benefit.',
    'The strongest interpretation is an expanded basis for testing short-term stress and anxiety effects across this tuning family. The literature includes self-report, cortisol, blood pressure, HRV and exploratory salivary proteins. Different outcomes offer complementary observations, but they are not interchangeable measures of one proven mechanism.',
    'The newer human trials make this a more substantial research programme than the original four references alone. Confidence remains limited by modest samples, incomplete masking, reporting inconsistencies, varied interventions and limited follow-up. Salivary biomarkers cannot establish brain changes or a durable clinical benefit. Findings apply to the studied listening or meditation programmes; the contribution of tuning remains a separate question.',
    'A useful next study can compare the same performance at standard and 444 Hz tuning, a calibrated 528 Hz tone, and an appropriate control. Match duration, loudness, setting and contact; conceal track labels and assessor allocation where feasible; preregister one primary stress outcome, collect repeated cortisol samples and respiration-aware HRV, and include follow-up. This can test the family coherently while identifying which components matter.'
]
topic['paragraphSources'] = [[], [{'recordId':r['id'],'label':r['authors'].split(',')[0].split('.')[0]+' '+str(r['year'])} for r in new[:4] + [new[5]]], [], [], [], []]
topic['papers'] = [entry(r) for r in new[:4]] + original + [entry(r) for r in new[4:]]
eligible = new[:4] + [dict(akimoto, id=akimoto['recordId'])] + [dict(p,id=p['recordId']) for p in original[1:]]
topic['trustAssessment'] = assess_topic(eligible)
topic['trustAssessment'].update(assessedAt=DATE, basis='Four distinct completed RCTs explicitly include 528 Hz. Related-device trials, protocols, uncertain designs and duplicate reports do not inflate this threshold. This design badge is separate from certainty of benefit.')
topic['trustScore'] = 2
assert topic['trustAssessment']['score'] == 2 and topic['trustAssessment']['counts']['rct'] == 4
topic['sourceAudit'] = dict(reviewedAt=DATE, publications=12, addedToTopic=8, completedAuthorReportedRCTs=5, explicitly528HzRCTs=4,
    randomizedBlockClassification='unresolved', protocolPublications=1, methodsPending=1,
    duplicateLinks=[dict(url='https://www.cabidigitallibrary.org/doi/full/10.5555/20240419729', publication='10.69980/redvet.v25i1S.787', basis='Title confirmed by Ben; CABI access blocked'),
                    dict(url='https://mentalhealthdaily.com/2026/11/05/sound-meditation-singing-bowls-anxiety-depression-cortisol-blood-pressure-trial/', publication='10.7759/cureus.115693', basis='News report cites the same trial')])
book['paperCount'] = sum(len(t['papers']) for c in book['chapters'] for t in c['topics'])
book['uniquePaperCount'] = len({p['recordId'] for c in book['chapters'] for t in c['topics'] for p in t['papers']})
library['summary']['records'] = len(library['records'])
library['summary']['ratings'] = dict(collections.Counter(str(r.get('stars')) for r in library['records']))
save('sound-edition', book); save('library', library); save('hyperspectral-expansion', hsi)
(Path(__file__).parent / 'source-review.json').write_text(json.dumps(dict(date=DATE, topic=topic, additions=new),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(topic['sourceAudit'], indent=2))
