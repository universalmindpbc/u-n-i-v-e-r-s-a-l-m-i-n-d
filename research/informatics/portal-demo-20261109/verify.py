"""Numerical verification only: no model API, credit or quantum hardware job."""
import json
from pathlib import Path
from computation import simulate,wolfram

def verify(fresh=False):
 f=json.loads(Path(__file__).with_name('verification-fixture.json').read_text());receipt=wolfram(f['action'],f['capabilities']) if fresh else f['wolfram'];result=simulate(f['action'],f['capabilities'],receipt)
 return {k:v for k,v in result.items() if k!='probabilities'}|{'hardware_submissions':0,'fresh_wolfram':fresh}
if __name__=='__main__':print(json.dumps(verify()))
