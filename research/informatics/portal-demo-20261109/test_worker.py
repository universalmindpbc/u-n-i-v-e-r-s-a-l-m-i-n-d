import io,json,os,sys,types,unittest
from pathlib import Path
from unittest.mock import Mock
sys.modules['boto3']=types.ModuleType('boto3');sys.modules['botocore']=types.ModuleType('botocore');config=types.ModuleType('botocore.config');config.Config=Mock();sys.modules['botocore.config']=config
import worker as w
from design import compile_program,validate_plan
fixture=json.loads((Path(__file__).parent/'verification-fixture.json').read_text());caps=fixture['capabilities']
def program(identifier='test',shots=30):
 return {'id':identifier,'purpose':'Synthetic interaction comparison','shots':shots,'sites_nm':[[0,0],[5700,0]],'amplitude':{'times_ns':[0,100,3900,4000],'values':[0,6300000,6300000,0]},'detuning':{'times_ns':[0,100,3900,4000],'values':[-31500000,-31500000,31500000,31500000]},'phase':{'times_ns':[0,4000],'values':[0,0]}}
class Missing(Exception):pass
class S3:
 exceptions=types.SimpleNamespace(NoSuchKey=Missing)
 def __init__(self):self.data={}
 def get_object(self,Bucket,Key):
  if (Bucket,Key) not in self.data:raise Missing()
  return {'Body':io.BytesIO(self.data[Bucket,Key])}
 def put_object(self,Bucket,Key,Body,**kw):self.data[Bucket,Key]=Body
class Tests(unittest.TestCase):
 def run_object(self):
  os.environ['DEMO_STATE_BUCKET']='test';return w.Run({'id':'10000000-0000-4000-8000-000000000000','question':'Compare interactions between atoms','confirmedPlanDigest':'a'*64},'lease',{},S3(),Mock())
 def prepared(self):
  r=self.run_object();r.state['plan']={'programs':[program('control',30),program('comparison',45)]};r.state['compiled']={p['id']:compile_program(p,caps) for p in r.state['plan']['programs']};r.state['proposal']={'digest':'a'*64,'cost':{'prices':{'taskUSD':'.3','shotUSD':'.01'}}};r.state['phase']='submit';r.preflight=Mock();r.update=Mock();return r
 def test_variable_programs(self):
  rates={'taskUSD':'.3','shotUSD':'.01'};p={'device_arn':w.DEVICE,'programs':[program('one',30),program('two',45)]};compiled,cost=validate_plan(p,caps,rates,.2);self.assertEqual(len(compiled),2);self.assertAlmostEqual(cost['hardwareUSD'],1.35)
  p['programs'][0]['sites_nm'][1]=[1,0]
  with self.assertRaises(ValueError):validate_plan(p,caps,rates,.2)
 def test_over_budget(self):
  with self.assertRaises(ValueError):validate_plan({'device_arn':w.DEVICE,'programs':[program(str(i),1000) for i in range(3)]},caps,{'taskUSD':'.3','shotUSD':'.01'},.2)
 def test_measurements(self):
  rows=[{'shotMetadata':{'shotStatus':'Success'},'shotResult':{'preSequence':[1,1],'postSequence':[0,1]}} for _ in range(28)]+[{'shotMetadata':{'shotStatus':'Failure'}},{'shotMetadata':{'shotStatus':'Success'},'shotResult':{'preSequence':[0,1],'postSequence':[1,1]}}]
  result=w.observations({'measurements':rows},2,30);self.assertEqual(result['fully_occupied_shots'],28);self.assertEqual(result['failed_shots'],1);self.assertEqual(result['initially_empty_shots'],1);self.assertEqual(result['observables'][0]['mean'],1)
  with self.assertRaises(AssertionError):w.observations({'measurements':rows[:-1]},2,30)
 def test_no_model_retry_after_unknown_outcome(self):
  r=self.run_object();r.state['calls']['0:plan']={'provider':'astra','cost_micro_usd':900000,'token_reserve':20000}
  with self.assertRaisesRegex(RuntimeError,'uncertain'):r.model('astra','plan',{},w.PLAN_SCHEMA,'test')
 def test_model_cap(self):
  r=self.run_object();r.state['calls']['old']={'provider':'gemini','cost_micro_usd':490000,'token_reserve':12000,'tokens':12000}
  with self.assertRaisesRegex(RuntimeError,'allowance'):r.model('gemini','final',{},w.REVIEW_SCHEMA,'test')
 def test_confirmation_required(self):
  r=self.prepared();r.task['confirmedPlanDigest']='b'*64;r.advance();r.braket.create_quantum_task.assert_not_called()
 def test_hardware_submission_idempotency(self):
  r=self.prepared();r.braket.create_quantum_task.side_effect=lambda **kw:{'quantumTaskArn':'arn:'+kw['clientToken']};r.advance();self.assertEqual(r.braket.create_quantum_task.call_count,2)
  self.assertEqual([c.kwargs['shots'] for c in r.braket.create_quantum_task.call_args_list],[30,45]);r.state['phase']='submit';r.advance();self.assertEqual(r.braket.create_quantum_task.call_count,2)
 def test_unknown_hardware_stops(self):
  r=self.prepared();r.state['submissions']['control']={'request_token':'fixed'}
  with self.assertRaisesRegex(RuntimeError,'uncertain'):r.advance()
  r.braket.create_quantum_task.assert_not_called()
 def test_invocation_bound(self):
  r=self.run_object();r.state['invocations']=150
  with self.assertRaisesRegex(RuntimeError,'monitoring allowance'):r.advance()
if __name__=='__main__':unittest.main()
