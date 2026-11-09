import tempfile,unittest,threading
from pathlib import Path
from unittest.mock import patch
from langgraph.checkpoint.sqlite import SqliteSaver
import runner
from test_reviews import Reviewer
from workflow import Ledger
class RunnerTests(unittest.TestCase):
 def test_cloud_handoff_resumes_without_repeating_paid_planning(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);secret=root/'credentials.json';secret.write_text('{"openai":"fixture","gemini":"fixture","worker":"fixture"}');secret.chmod(0o600)
   remaining=[900];calls={'plan':0,'report':0};updates=[]
   def planner(*args,**kwargs):
    calls['plan']+=1;remaining[0]=200
    return {'plan':{'supported':True,'stop_reason':''},'tokens':100}
   def writer(*args,**kwargs):calls['report']+=1;return {'tokens':100,'narrative':{'answer':'Fixture evidence'}}
   claim={'task':{'id':'handoff-fixture','question':'OXTR fixture','policy':{'maxModelTokens':64000},'routing_receipt':{'total_tokens':1000,'service_tier':'default'}},'lease':'fixture'}
   with patch.object(runner,'SECRET',secret),patch.object(runner,'SERVICE_ROOT',root),patch.object(runner.science,'prior_measurements',return_value={}),patch.object(runner.science,'prepare',return_value={'rows':[],'sources':[]}),patch.object(runner.science,'analyse',return_value={'predictions':[]}),patch.object(runner.science,'load',return_value={'cases':[]}),patch('subprocess.run'),patch.object(runner,'create_plan',side_effect=planner),patch.object(runner,'brief',side_effect=writer),patch.object(runner,'GeminiReviewer',return_value=Reviewer(['approve','approve'],[])):
    broker=runner.Broker();broker.heartbeat=lambda:None;broker.call=lambda op,**kw:updates.append((op,kw));broker.memory=lambda q:{'schema':'fixture','memories':[]}
    self.assertEqual(broker.run(claim,review_ledger=object(),remaining_time=lambda:remaining[0]),'yielded')
    self.assertEqual(calls,{'plan':1,'report':0});self.assertEqual(updates[-1][1]['status'],'running')
    remaining[0]=900;broker.run(claim,review_ledger=object(),remaining_time=lambda:remaining[0])
    self.assertEqual(calls,{'plan':1,'report':1});self.assertEqual(updates[-1][1]['status'],'complete')
    report=updates[-1][1]['report'];self.assertEqual(report['model_settings']['astra']['study_token_limit'],64000)
    self.assertEqual(report['routing_receipt']['total_tokens'],1000)

 def test_resume_skips_completed_data_and_model(self):
  with tempfile.TemporaryDirectory() as d,SqliteSaver.from_conn_string(':memory:') as cp:
   cohort={'rows':[],'sources':[]};analysis={'predictions':[{'sample':'fixture','score':.1}]};prepared={'cases':[]};calls={'data':0,'analysis':0,'model':0}
   def data(progress):calls['data']+=1;return cohort
   def analyse(c):
    calls['analysis']+=1
    if calls['analysis']==1:raise RuntimeError('interruption fixture')
    return analysis
   def brief(e,q,feedback=None,model_settings=None):
    self.assertEqual(model_settings['astra']['effort'],'max')
    calls['model']+=1;return {'tokens':10,'narrative':{'answer':'Fixture only'}}
   secret=Path(d)/'credentials.json';secret.write_text('{"openai":"fixture"}')
   with patch.object(runner,'SECRET',secret),patch.object(runner,'SERVICE_ROOT',Path(d)),patch.object(runner.science,'prior_measurements',return_value={}),patch.object(runner.science,'prepare',side_effect=data),patch.object(runner.science,'analyse',side_effect=analyse),patch.object(runner.science,'load',return_value=prepared),patch('subprocess.run'),patch.object(runner,'brief',side_effect=brief):
    g=runner.graph(Ledger(Path(d)/'ledger.sqlite'),cp,lambda *a:None,lambda q:{'schema':'fixture','memories':[]},reviewer=Reviewer(['approve','approve'],[]),planner=lambda *a:{'plan':{'supported':True,'stop_reason':''},'tokens':10});cfg={'configurable':{'thread_id':'fixture'}}
    with self.assertRaises(RuntimeError):g.invoke({'id':'fixture','question':'fixture question'},cfg)
    out=g.invoke(None,cfg);self.assertIn('report',out);self.assertEqual(calls,{'data':1,'analysis':2,'model':1})
    again=g.get_state(cfg);self.assertFalse(again.next);self.assertTrue((Path(d)/'results/fixture/result.json').exists());self.assertTrue((Path(d)/'results/fixture/result.csv').exists())
if __name__=='__main__':unittest.main()
