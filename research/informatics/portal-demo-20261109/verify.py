"""Numerical verification only: no model API, credit or quantum hardware job."""
import json,copy
from pathlib import Path
from computation import simulate,wolfram

def verify(fresh=False):
 f=json.loads(Path(__file__).with_name('verification-fixture.json').read_text());cases=[f['action']]
 if fresh:
  a=json.loads(f['action']);a['setup']['ahs_register']['sites']=[["0","0"],["0.0000057","0"],["0","0.0000062"]];a['setup']['ahs_register']['filling']=[1,1,1]
  a['hamiltonian']['drivingFields'][0]['phase']['time_series']={'times':['0','0.000001','0.000003','0.000004'],'values':['0','0.7','1.2','0']};cases.append(json.dumps(a))
 checks=[]
 for action in cases:
  receipt=wolfram(action,f['capabilities']) if fresh else f['wolfram'];result=simulate(action,f['capabilities'],receipt);checks.append({k:v for k,v in result.items() if k!='probabilities'})
 return {'passed':all(r['passed'] for r in checks),'checks':checks,'hardware_submissions':0,'model_requests':0,'fresh_wolfram':fresh}
if __name__=='__main__':print(json.dumps(verify()))
