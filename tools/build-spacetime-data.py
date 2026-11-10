"""Build the unlisted research module from retained source snapshots."""
from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parents[1]
site=root/'Informatics/spacetime'
ref=root/'research/informatics/spacetime-20261110/reference'
rows=[]
for line in (site/'data/silso-yearly.txt').read_text().splitlines():
 p=line.split();year=int(float(p[0]));value=float(p[1])
 if year<=2025:rows.append({'date':f'{year}-07-01','year':year,'value':None if value<0 else value,'sd':float(p[2]) if float(p[2])>=0 else None,'observations':int(p[3]) if int(p[3])>=0 else None,'provisional':'*' in line})
monthly=[]
for line in (site/'data/silso-monthly.txt').read_text().splitlines():
 p=line.split();year=int(p[0]);month=int(p[1]);value=float(p[3])
 if year<=2025:monthly.append({'date':f'{year}-{month:02d}-15','year':year,'month':month,'value':None if value<0 else value,'sd':float(p[4]) if float(p[4])>=0 else None,'observations':int(p[5]) if int(p[5])>=0 else None,'provisional':'*' in line})
seed=[int(x) for x in re.findall(r'\d+', (ref/'DATA/DATA.TW1').read_text())]
assert len(seed)==384 and seed[119]==22
meta={'version':'spacetime-v1','retrieved':'2026-11-10','solar_source':'https://www.sidc.be/SILSO/datafiles','solar_license':'CC BY-NC 4.0','solar_attribution':'WDC-SILSO, Royal Observatory of Belgium, Brussels','solar_version':'2.0','solar_limit':'complete years through 2025','timewave_source':'https://github.com/kl4yfd/timewave_z3r0/blob/master/twz-point.c','timewave_seed':'Kelley DATA.TW1 (index 119 = 22)','timewave_license':'Public domain / Unlicense','hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [site/'data/silso-yearly.txt',site/'data/silso-monthly.txt',ref/'DATA/DATA.TW1',ref/'twz-point.c']}}
events=[
 {'date':'1859-09-01','label':'Carrington event','category':'Space weather','note':'Observation of a white-light solar flare; associated geomagnetic disturbance followed.','source':'https://ras.ac.uk/media/493'},
 {'date':'1945-10-24','label':'United Nations','category':'Institutions','note':'The UN Charter entered into force.','source':'https://www.un.org/en/about-us/un-charter'},
 {'date':'1969-07-20','label':'Apollo 11','category':'Exploration','note':'The first crewed lunar landing.','source':'https://www.nasa.gov/mission/apollo-11/'},
 {'date':'1989-03-01','label':'World Wide Web','category':'Communication','note':'Tim Berners-Lee submitted his first Web proposal in March 1989. Marker precision: month.','source':'https://home.cern/science/computing/the-birth-of-the-web/'},
 {'date':'2020-03-11','label':'COVID-19 pandemic','category':'Public health','note':'WHO characterised COVID-19 as a pandemic.','source':'https://www.who.int/europe/emergencies/situations/covid-19'}]
with (site/'data.mjs').open('w') as f:
 for name,value in [('META',meta),('YEARLY',rows),('MONTHLY',monthly),('KELLEY',seed),('EVENTS',events)]:f.write('export const '+name+' = '+json.dumps(value,separators=(',',':'),ensure_ascii=False)+';\n')
print(json.dumps({'annual':len(rows),'monthly':len(monthly),'seed':len(seed),'bytes':(site/'data.mjs').stat().st_size}))
