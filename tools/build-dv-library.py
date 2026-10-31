"""Integrate the exact human-approved, AI-audited DV summaries; no model calls."""
import argparse, copy, hashlib, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'Informatics'
SOURCE=SITE/'review/domestic-violence-20261031/audit-16f8e1d36d3f40c4.json'
OUT=SITE/'library-data/domestic-violence-expansion.json'
DATE='2026-11-01'
ALIASES={'dv-sound-52ec6bcb53a0':'src-47a527b4dc03','dv-sound-15913391':'pmid-15913391'}
def render():
    audit=json.loads(SOURCE.read_text()); approved=[r for r in audit['records'] if r['reviewReady']]
    assert len(approved)==117 and all(r['publicationRecommendation']['status']=='recommended-summary' for r in approved)
    coverage=json.loads((SOURCE.parent/'coverage.json').read_text())
    records=[]; conditions={}; ages=[]; communities=[]; access={}; classification=[]
    patterns={'anxiety':r'\banxiety\b','ptsd':r'\b(?:c?ptsd|post[ -]?traumatic stress)\b','trauma':r'\b(?:trauma-related|traumatic stress|posttraumatic|post-traumatic|posttrauma)\b','depression':r'\bdepress(?:ion|ive)\b','stress':r'(?<!traumatic )\bstress\b','sleep':r'\b(?:sleep|insomnia)\b','substance-use':r'\b(?:substance|drug use|methadone|alcohol|drinking)\b'}
    for r in approved:
        rid=ALIASES.get(r['id'],r['id']); urls=([f"https://doi.org/{r['doi']}"] if r.get('doi') else [])+([f"https://pubmed.ncbi.nlm.nih.gov/{r['pmid']}/"] if r.get('pmid') else [])
        urls=list(dict.fromkeys(urls+[s['url'] for s in r['sources']]))
        # Classification is based on retained source fields, never inferred from a therapy's name.
        fields={'title':r['title'],'population':r['relevance']['population'],'outcomes':' | '.join(o['name'] for o in r['outcomes'])}
        tags=[]
        for cid,pattern in patterns.items():
            hits=[{'field':k,'text':v,'matchedText':m.group()} for k,v in fields.items() if (m:=re.search(pattern,v,re.I))]
            if hits: tags.append({'id':cid,'evidence':hits,'scope':'Study population or investigated outcome; not a diagnosis or efficacy claim.'})
        conditions[rid]=tags
        raw=r['age']['groups']; groups=[]
        translations={'adult':'adults','preadolescent children':'children','adult parents':'adults','adult professional respondents':'adults'}
        valid={'children','adolescents','youth','adults','older-adults','not-specified'}
        for value in raw:
            v=translations.get(value,value)
            if v in valid and v not in groups:groups.append(v)
        if not groups:groups=['not-specified']
        # Eligibility/target populations alone are not observed participant ages.
        age={'recordId':rid,'collections':[r['collection']],'groups':groups,'reportedAges':r['age']['reportedRange'],'youthScope':('focus' if 'focus' in str(r['age'].get('youthScope','')).lower() else 'included') if 'youth' in groups else None,'youthSourceNote':r['age'].get('youthScope'),'sourceURL':r['access']['sourceURLs'][0],'basisType':'source-limited-ai-editorial-assessment','classificationNote':'Original age terms: '+', '.join(raw)+'. Programme targets or possible eligibility are not counted as observed ages.'}
        ages.append(age)
        matches=[{'categoryId':'domestic-violence','relation':r['relevance']['relation']}]
        # Other community memberships require explicit population/setting evidence.
        population=' '.join([r['title'],r['relevance']['population'],r['setting']])
        for cid,pattern in [('refugees',r'\brefugee'),('housing',r'\bhomeless'),('defence',r'\b(?:military|veteran)')]:
            if re.search(pattern,population,re.I): matches.append({'categoryId':cid,'relation':'direct'})
        communities.append({'recordId':rid,'matches':matches})
        categories=['Clinical & self-report']
        if r['studyDesignAssessment']['category']=='review' or re.search(r'qualitative|feasibility|experience|vignette',r['design']['type'],re.I):categories.append('Methods & context')
        if r['id']=='dv-mindbody-32969703':categories.append('Heart rate & autonomic')
        approval={'status':'approved-for-publication','approvedBy':'Ben Korbel','approvedAt':DATE,'assessment':'AI assessed; human approved for publication','scope':'Qualified research-library summaries. No professional clinical peer review or treatment recommendation is claimed.','sourceRevision':r['revision'],'sourceContentHash':r['contentHash']}
        evidence={'evidenceType':r['design']['type'],'intervention':r['intervention']['description']+' '+r['intervention']['dose'],'comparator':r['comparator'],'sample':r['sampleSize']['description'],'measurement':'; '.join(o['name'] for o in r['outcomes']),'timing':'; '.join(dict.fromkeys(o['followUp'] for o in r['outcomes'])),'trialId':', '.join(r['trialRegistration']),'relationshipNote':r['relevance']['rationale']+' '+r['relevance']['transferLimit'],'measuredGenes':[],'pathways':[],'sourceAccess':r['access'],'outcomes':r['outcomes'],'quality':r['quality'],'maskingRoles':r['design']['masking'],'population':r['relevance']}
        record={'id':rid,'aliases':[r['id']] if rid!=r['id'] else [],'title':r['title'],'authors':'; '.join(r['authors']) if isinstance(r['authors'],list) else r['authors'],'year':r['year'],'journal':r['journal'],'doi':r.get('doi'),'pmid':r.get('pmid'),'urls':urls,'collections':[r['collection']],'categories':categories,'targets':[],'neurotransmitters':[],'conditions':[t['id'] for t in tags],'conditionEvidence':tags,'ageGroups':groups,'agePopulation':age,'communityMatches':matches,'kind':'Review' if r['studyDesignAssessment']['category']=='review' else 'Journal article','design':r['design']['type'],'origin':'approved-dv-20261101','priority':1,'quotes':[],'finding':r['finding'],'summary':r['finding'],'limitation':r['limitation'],'evidence':evidence,'studyDesignAssessment':r['studyDesignAssessment'],'paperTrustAssessment':r['paperTrustAssessment'],'jadad':r['jadad'],'citationSnapshot':r['citationSnapshot'],'citationCount':None,'publicationApproval':approval,'sourceAccess':r['access'],'editorialAudit':r['editorialAudit'],'studyFamilyId':r['studyFamilyId'],'familyLinkageUncertain':r['familyLinkageUncertain'],'approaches':[g['id'] for g in coverage['groups'] if r['id'] in g['recordIds']],'assessmentRecord':copy.deepcopy(r)}
        records.append(record)
        access[rid]={'doi':r.get('doi'),'pmid':r.get('pmid'),'urls':urls,'journalLabel':r['journal']}
        classification.append({'recordId':rid,'auditId':r['id'],'sourceRevision':r['revision'],'categories':categories,'conditions':tags,'age':age,'communities':matches,'targets':[],'targetBasis':'No direct gene or molecular-target measurement established in the retained assessment.','jadad':r['jadad']})
    overview='This approved research collection contains 117 publications: 51 randomized controlled trial reports, 25 reviews or meta-analyses, and 41 other studies. These are publication counts, not independent trials or participants. Selected approaches include 10 EMDR publications, 9 on mindfulness or meditation, and 8 on music-based approaches; these groups overlap and do not cover every approach.'
    limits='AI assessed; human approved for publication. These are research summaries, not personal treatment recommendations. Evidence was assessed from 74 abstracts, 22 selected-methods sources and 21 retained full-text appraisals. No double-blind trial is verified. Benefits, null results, harms-reporting gaps and population limits remain attached to each paper.'
    chapters={}
    for collection in ['sound','vision','language']:
        book=json.loads((SITE/f'library-data/{collection}-edition.json').read_text()); number=max(c['number'] for c in book['chapters'])+1
        rows=[r for r in records if collection in r['collections']]
        n_rct=sum(r['studyDesignAssessment']['category']=='rct' for r in rows); n_review=sum(r['studyDesignAssessment']['category']=='review' for r in rows)
        local=f'{collection.title()} includes {len(rows)} publications: {n_rct} randomized trial reports, {n_review} reviews or meta-analyses, and {len(rows)-n_rct-n_review} other studies. Primary collection labels describe the research approach, not established effectiveness.'
        chapters[collection]={'number':number,'title':'AI Guided Recommendations','overview':[overview,limits],'topics':[{'id':'domestic-family-violence','title':'Domestic & Family Violence','description':local,'paragraphs':[],'trustScore':None,'trustAssessment':{'status':'not-graded','scope':'Subchapter','basis':'No aggregate efficacy grade assigned to this heterogeneous, source-limited collection. Report and study-family counts differ.'},'papers':[{**{k:copy.deepcopy(v) for k,v in r.items() if k not in ['assessmentRecord','editorialAudit']},'recordId':r['id'],'id':collection+'-dv-'+r['id'],'sourcePages':[]} for r in rows]}]}
    result={'schema':'approved-domestic-violence/v1','approvedAt':DATE,'sourceBatch':audit['batchRevision'],'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'counts':{'publications':117,'new':115,'updates':2,'rctReports':51,'reviews':25,'other':41,'verifiedDoubleBlind':0,'collections':{'sound':8,'vision':10,'language':99}},'overview':overview,'limitations':limits,'records':records,'chapters':chapters,'publicationAccess':access,'conditions':conditions,'ages':ages,'communities':communities,'classificationAudit':classification,'approaches':[{**g,'recordIds':[ALIASES.get(i,i) for i in g['recordIds']]} for g in coverage['groups']]}
    return json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args();text=render()
    if args.check:assert OUT.read_text()==text,'Approved integration differs from source audit'
    else:OUT.write_text(text)
    print(json.dumps({'passed':True,'approved':117,'new':115,'updates':2}))
