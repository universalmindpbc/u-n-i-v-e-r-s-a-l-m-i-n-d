"""Human-readable CSV summary plus lossless JSON inside the complete export bundle."""
import csv,json,io,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/m1-m24-v1';d=json.loads((OUT/'dataset.json').read_text());records=d['records']
def write(name,rows):
 fields=list(dict.fromkeys(k for r in rows for k in r));buf=io.StringIO(newline='');w=csv.DictWriter(buf,fieldnames=fields);w.writeheader();w.writerows(rows);(OUT/name).write_text('\ufeff'+buf.getvalue(),encoding='utf-8')
def js(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
summary=[];alpha=[];beta=[];gamma=[];epsilon=[];shapes=[];formations=[];formation_beta=[];routes=[]
for r in records:
 m,p=r['modulus'],r['pisano_period'];b=r['beta'];base={'record_id':r['id'],'modulus':m,'pisano_period':p,'dataset_version':d['dataset_version']}
 row={**base,'alpha_display':js(r['alpha']['display_values']),'alpha_raw':js(r['alpha']['residues']),'beta_display':js(b['display_cycle']) if b else '', 'beta_start':b['start_value'] if b else '', 'beta_minimal_raw':js(b['minimal_cycle']) if b else '', 'native_doubling':b['native_doubling'] if b else '', 'm9_doubling_values':b['m9_doubling_cycle_present'] if b else '', 'gamma_display':js(r['gamma']['clockwise_values']),'gamma_clock_positions':js(r['gamma']['clock_positions']),'epsilon_display':js(r['epsilon']['traversal_values']) if r['epsilon'] else '', 'epsilon_clock_route':js(r['epsilon']['clock_positions']) if r['epsilon'] else '', 'python_status':r['verification']['python'],'wolfram_status':r['verification']['wolfram'],'wolfram_scope':r['verification']['wolfram_scope'],'biological_significance':'Not yet assessed','statistical_significance':'Not yet assessed','geometry_scope':r['geometry_summary']['scope']}
 for s in r['geometry_summary']['shapes']:
  row[s['name']+'_count']=s['count'];shapes.append({**base,**{k:js(v) if isinstance(v,list) else v for k,v in s.items()}})
 summary.append(row)
 for i,(raw,label) in enumerate(zip(r['alpha']['residues'],r['alpha']['display_values'])):alpha.append({**base,'index':i,'clock_position':i or p,'raw_residue':raw,'display_value':label})
 if b:
  for i,x in enumerate(b['intervals']):beta.append({**base,'interval_order':i+1,**{k:js(v) if isinstance(v,list) else v for k,v in x.items()},'display_value':b['display_cycle'][i]})
 for order,i in enumerate(r['gamma']['alpha_indices'],1):gamma.append({**base,'node_order':order,'alpha_index':i,'clock_position':i or p,'raw_residue':r['alpha']['residues'][i],'display_value':r['alpha']['display_values'][i]})
 if r['epsilon']:
  for order,i in enumerate(r['epsilon']['alpha_indices'],1):epsilon.append({**base,'visit_order':order,'alpha_index':i,'clock_position':i or p,'display_value':r['alpha']['display_values'][i]})
 for f in r['formation_catalogue']:
  formations.append({**base,**{k:js(v) if isinstance(v,(dict,list)) else v for k,v in f.items() if k not in ['beta','epsilon_routes']}})
  for i,x in enumerate(f['beta']['intervals']):formation_beta.append({**base,'formation_id':f['id'],'interval_order':i+1,**{k:js(v) if isinstance(v,list) else v for k,v in x.items()}})
  for route in f.get('epsilon_routes',[]):routes.append({**base,**{k:js(v) if isinstance(v,list) else v for k,v in route.items()}})
for name,rows in [('records',summary),('alpha',alpha),('beta_intervals',beta),('gamma',gamma),('epsilon',epsilon),('geometry_summary',shapes),('formation_catalogue',formations),('formation_intervals',formation_beta),('epsilon_routes',routes)]:write(name+'.csv',rows)
(OUT/'CSV-README.txt').write_text('Universal Informatics M1–M24\n\nrecords.csv: one row per modulus. Other CSVs separate observations, interval sums and geometry candidates. Lists within cells use JSON array notation. Empty Epsilon/Beta fields mean absent/not defined, not zero. Raw residues and display values are separate. Clock position P is north; machine indices start at zero. Original Beta order is preserved.\n\nThe included dataset.json is the complete lossless source, including conventions, candidates, verification and unassessed research-tier metadata. CSVs are analytical tables derived from it, not a replacement schema. No biological significance or WSS score is assigned.\n')
with zipfile.ZipFile(OUT/'m1-m24-data.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(OUT.glob('*.csv'))+[OUT/'CSV-README.txt',OUT/'dataset.json',OUT/'verify_core.wl',OUT/'wolfram-core-result.json']:z.write(p,p.name)
assert len(list(csv.DictReader((OUT/'records.csv').open(encoding='utf-8-sig'))))==24
print('24-row CSV and complete export bundle generated.')
