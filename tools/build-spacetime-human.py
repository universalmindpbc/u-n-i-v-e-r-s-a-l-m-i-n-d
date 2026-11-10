"""Build the requested global human indicators from retained publisher snapshots."""
from pathlib import Path
import csv,json,hashlib,math,statistics
root=Path(__file__).resolve().parents[1]
sources=root/'research/informatics/spacetime-20261110/human-sources'
result=[]
def rows_from_pairs(pairs):
 return [{'year':int(y),'date':f'{y}-07-01','value':float(v) if v is not None else None} for y,v in sorted(pairs)]
def add(id,label,measure,units,minimum,maximum,source_file,source_url,publisher,definition,rows,license,**extra):
 valid=[r for r in rows if r['value'] is not None]
 result.append(dict(id=id,label=label,measure=measure,units=units,min=minimum,max=maximum,geography='World',cadence='Annual',coverage=[valid[0]['year'],valid[-1]['year']],source=source_url,publisher=publisher,definition=definition,license=license,retrieved='2026-11-10',source_sha256=hashlib.sha256((sources/source_file).read_bytes()).hexdigest(),rows=rows,**extra))
gdp=json.loads((sources/'world-bank-growth.json').read_text())
add('growth','Economic growth','Real GDP growth','% per year',-5,10,'world-bank-growth.json','https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=1W','World Bank','Annual change in real global GDP. The World Bank publishes the world aggregate; this is separate from stock-market returns.',rows_from_pairs((r['date'],r['value']) for r in gdp[1] if 1961<=int(r['date'])<=2025),'CC BY 4.0',indicator_code='NY.GDP.MKTP.KD.ZG',source_updated=gdp[0]['lastupdated'])
hdi=next(r for r in csv.DictReader((sources/'undp-world.csv').read_text(encoding='utf-8').splitlines()) if r['iso3']=='ZZK.WORLD')
add('development','Human development','Human Development Index','HDI · 0–1',0,1,'undp-world.csv','https://hdr.undp.org/data-center/documentation-and-downloads','UNDP','UNDP’s published world HDI: health, education and income. The world aggregate uses UNDP’s method; it is not an average of country ranks.',rows_from_pairs((y,hdi[f'hdi_{y}'] or None) for y in range(1990,2024)),'CC BY 3.0 IGO',source_version='Human Development Report 2025')
emotions=json.loads((sources/'gallup-emotions.json').read_text())
for id,label,index,definition in [('positive','Positive experiences',1,'Gallup’s annual global Positive Experience Index summarizes daily enjoyment, laughter, respect, rest and learning.'),('negative','Negative experiences',2,'Gallup’s annual global Negative Experience Index summarizes daily pain, worry, stress, sadness and anger. Higher values mean more negative experiences.')]:
 add(id,'Emotional wellbeing',label,'Index · 0–100',0,100,'gallup-emotions.json',emotions['source'],'Gallup',definition,rows_from_pairs((r[0],r[index]) for r in emotions['rows']),'Published aggregate statistics; Gallup attribution retained',uncertainty='The published global table provides no interval estimates.')
life=json.loads((sources/'gallup-life.json').read_text())
add('satisfaction','Life satisfaction','Adults classified as thriving','% of adults',0,100,'gallup-life.json',life['source'],'Gallup','Gallup Life Evaluation Index: current life rated at least 7/10 and expected life in five years at least 8/10. This is a thriving percentage, distinct from the World Happiness Report’s mean life-evaluation score.',rows_from_pairs((r[0],r[1]) for r in life['rows']),'Published aggregate statistics; Gallup attribution retained',uncertainty='The published global table provides no interval estimates; values are rounded percentages.')
conflicts=list(csv.DictReader((sources/'ucdp-battle-deaths.csv').read_text(encoding='utf-8-sig').splitlines()))
keys=[(r['conflict_id'],r['year']) for r in conflicts];assert len(keys)==len(set(keys)), 'Duplicate conflict-year'
assert all(0<=float(r['bd_low'])<=float(r['bd_best'])<=float(r['bd_high']) for r in conflicts)
totals={}
for r in conflicts:
 y=int(r['year']);d=totals.setdefault(y,{'year':y,'date':f'{y}-07-01','value':0,'low':0,'high':0,'conflicts':0})
 for field,key in [('value','bd_best'),('low','bd_low'),('high','bd_high')]:d[field]+=int(r[key])
 d['conflicts']+=1
rows=[totals[y] for y in sorted(totals)]
add('conflict','Conflict','Battle-related deaths','Deaths per year',0,math.ceil(max(r['high'] for r in rows)/50000)*50000,'ucdp-battle-deaths.csv','https://ucdp.uu.se/downloads/','UCDP','Global sum of battle-related deaths in UCDP state-based conflicts. Excludes separate non-state and one-sided violence datasets. The vertical ranges sum UCDP low and high estimates; they are not confidence intervals.',rows,'CC BY 4.0',source_version='26.1',citation='Davies, Pettersson and Öberg (2026), Organized violence 1989–2025, and violent political protests. Journal of Peace Research. doi:10.1093/jopres/xjag046',source_rows=len(conflicts))
prices=list(csv.DictReader((sources/'shiller-prices.csv').read_text().splitlines()))
market=[]
for i,r in enumerate(prices):
 y=int(r['year']);m=int(r['month']);price=float(r['price'])
 if i:assert y*12+m==int(prices[i-1]['year'])*12+int(prices[i-1]['month'])+1
 market.append({'date':r['date'],'year':y,'month':m,'price':price,'value':None if i==0 else 100*(price/float(prices[i-1]['price'])-1)})
for id,measure,units,values,definition in [
 ('market-return','Monthly average-price change','% per month',market,'100 × (current monthly average price / prior monthly average price − 1). Nominal price change excludes dividends. Monthly averages are distinct from month-end closes.'),
 ('market-price','Monthly average price','Index points',[{**r,'value':r['price']} for r in market],'Nominal S&P Composite monthly average price. The early history uses predecessor equity series before the modern S&P 500 launched in March 1957.'),
 ('market-volatility','Trailing 12-month volatility','% annualized',[{**r,'value':statistics.stdev([v['value'] for v in market[i-11:i+1]])*math.sqrt(12) if i>=12 else None} for i,r in enumerate(market)],'Sample standard deviation of 12 monthly average-price percentage changes, multiplied by √12. Requires 12 valid prior changes. This measures monthly variation, distinct from volatility calculated from daily returns.')]:
  valid=[r['value'] for r in values if r['value'] is not None];minimum=min(0,math.floor(min(valid)/5)*5);maximum=math.ceil(max(valid)/(1000 if id=='market-price' else 5))*(1000 if id=='market-price' else 5)
  add(id,'S&P 500',measure,units,minimum,maximum,'shiller-prices.csv','https://shillerdata.com/','Robert J. Shiller',definition,values,'Public research data; Robert J. Shiller attribution retained',source_version='October 2026 workbook; clipped through 2025',provenance=json.loads((sources/'shiller-provenance.json').read_text()),historical_note='S&P Composite predecessors before March 1957. Trading volume is absent from this source.')
  result[-1]['geography']='United States';result[-1]['cadence']='Monthly'
  result[-1]['coverage_months']=[next(r['date'][:7] for r in values if r['value'] is not None),values[-1]['date'][:7]]
for series in result:
 assert len({r['date'] for r in series['rows']})==len(series['rows'])
 assert all(r['value'] is None or series['min']<=r['value']<=series['max'] for r in series['rows'])
path=root/'Informatics/spacetime/human.mjs'
path.write_text('export const HUMAN = '+json.dumps(result,separators=(',',':'),ensure_ascii=False)+';\n')
print(json.dumps([{'id':s['id'],'coverage':s['coverage'],'rows':len(s['rows'])} for s in result]))
