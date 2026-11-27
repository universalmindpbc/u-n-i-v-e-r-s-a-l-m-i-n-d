import csv,json,subprocess,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];D=ROOT/'Informatics/library-data'
def historical(path,ref='0a931f233'):return json.loads(subprocess.check_output(['git','show',ref+':'+path],cwd=ROOT))
g=historical('Informatics/library-data/general-edition.json');combined=g['chapters'][-1]
old=historical('Informatics/library-data/general-edition.json','f165b4a8')['chapters'][-1]
old['title']='Oxytocin, OXTR and IL-6'
old['overview']=[
 'Oxytocin acts through OXTR, the oxytocin receptor. This chapter examines how that signalling pathway affects interleukin-6 (IL-6) and other inflammation markers, from cell experiments to animal models and human studies.',
 'The 42-source review includes positive, null and opposite-direction results. Effects vary by tissue, dose and experimental setting. Human findings are emerging and mixed; a lasting anti-inflammatory treatment benefit is not established.'
]
old['evidenceOverviewTitle']='How oxytocin and OXTR affect IL-6: what the studies show'
old['evidenceOverviewIntro']='The three summaries below all concern oxytocin or its receptor, OXTR, and their effects on inflammation. They describe different kinds of experiments, not three stages of a proven treatment.'
old['evidenceOverview']=[
 {'label':'Laboratory cell studies','finding':'Oxytocin reduced IL-6 release and other inflammation signals in some cell experiments. Several studies tested whether these effects depended on OXTR or related signalling pathways.','boundary':'Other experiments found no reduction. Responses also differed by tissue: pregnancy-related tissues sometimes showed increased inflammation.'},
 {'label':'Animal studies','finding':'Oxytocin or OXTR-related interventions reduced inflammatory signals and improved some tissue or behavioural outcomes in several animal models.','boundary':'Animal disease models, doses and biology differ from human conditions. These results do not establish a treatment benefit in people.'},
 {'label':'Human studies','finding':'Human studies report some short-term inflammation effects, alongside null findings and increases in IL-6. The findings are promising, but mixed.','boundary':'The evidence does not yet establish a lasting anti-inflammatory treatment effect or show that an OXTR-based intervention improves mental illness by lowering IL-6.'}
]
old['evidenceOverviewNote']='The detailed studies and their limitations follow below.'
old['relatedChapters']=[{'number':14,'title':'IL-6 and mental health'}]
mental={'number':14,'id':'il6-mental-health','title':'IL-6 and mental health','overview':[
 'Interleukin-6 (IL-6) is an immune signalling protein. This chapter examines its relationship with mental illness, with a separate section for each condition and related clinical outcome.',
 'The review contains 120 peer-reviewed publications: 117 directly relevant mental-health papers and three contextual substance-exposure papers. Randomized trials lead the appraisal. Positive, null and opposite-direction findings remain visible; publication counts are not counts of independent studies.',
 'An association with IL-6 does not establish that IL-6 causes a condition or that lowering it improves symptoms. The evidence varies by diagnosis, mood state, specimen and study design. ADHD is a neurodevelopmental condition; suicidal ideation and behaviour are outcomes considered separately from a diagnosis.',
 'The relationship between this literature and oxytocin/OXTR interventions is considered as a research hypothesis. The separate oxytocin, OXTR and IL-6 chapter contains the original cell, animal and human pathway review.'
 ],'researchRegister':{'json':'library-data/il6-mental-health-research-register.json','csv':'library-data/il6-mental-health-research-register.csv','reading':'read/il6-mental-health/index.html','count':120},'mentalHealthPublicationCount':117,'expansionPublicationCount':120,'relatedChapters':[{'number':13,'title':old['title']}],'topics':copy.deepcopy(combined['topics'][10:])}
titles={'mental-health-map':'IL-6 and mental health: overview','depression':'Depression','psychosis':'Schizophrenia and psychosis','bipolar':'Bipolar disorder: depression and euthymia','mania':'Mania','hypomania':'Hypomania','anxiety':'Anxiety disorders','ptsd':'PTSD and trauma','suicidality':'Suicidal ideation and behaviour','adhd':'ADHD','alcohol':'Addiction: alcohol use disorder','opioids':'Addiction: opioid use disorder','stimulants':'Addiction: stimulant use disorders','cannabis-nicotine':'Cannabis and nicotine: evidence and gaps','systems-hypothesis':'OXTR and IL-6 in mental illness: a research hypothesis','mental-health-method':'Review method and limitations'}
for i,t in enumerate(mental['topics'],1):
 key=t['id'].removeprefix('oxtr-il6-');t['id']='il6-mental-health-'+key;t['number']='14.'+str(i);t['title']=titles[key]
 t['paragraphs']=[x.replace('This expansion contains','This chapter contains') for x in t['paragraphs']]
g['chapters']=g['chapters'][:-1]+[old,mental]
oxtr=historical('Informatics/library-data/oxtr-il6-research-register.json','f165b4a8')
oxtr.update(title=old['title'],reviewedAt='2026-11-28',purpose=old['overview'],evidenceOverviewTitle=old['evidenceOverviewTitle'],evidenceOverviewIntro=old['evidenceOverviewIntro'],evidenceOverview=old['evidenceOverview'],chapterId=old['id'],chapterNumber=13)
reg=historical('Informatics/library-data/il6-mental-health-research-register.json');reg.update(title=mental['title'],chapterId=mental['id'],chapterNumber=14,purpose=mental['overview'],mentalHealthPublicationCount=117,expansionPublicationCount=120)
for name,data in [('general-edition.json',g),('oxtr-il6-research-register.json',oxtr),('il6-mental-health-research-register.json',reg)]:
 (D/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
# Preserve the existing common CSV schema and every source appraisal.
fields=next(csv.reader((D/'oxtr-il6-research-register.csv').open()))
with (D/'oxtr-il6-research-register.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader()
 for r in oxtr['records']:w.writerow({k:json.dumps(r.get(k),ensure_ascii=False) if isinstance(r.get(k),(dict,list)) else r.get(k,'') for k in fields})
print({'chapters':len(g['chapters']),'OXTR':len(oxtr['records']),'mentalIllness':len(reg['records'])})
