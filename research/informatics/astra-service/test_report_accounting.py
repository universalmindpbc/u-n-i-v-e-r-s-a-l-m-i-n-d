import json,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock,patch
from langgraph.checkpoint.sqlite import SqliteSaver
import runner
from reasoning_profile import STAGING,LEGACY
from workflow import Ledger
from test_reviews import Reviewer

class ReportAccountingTests(unittest.TestCase):
 def test_request_keeps_evidence_and_legacy_request(self):
  evidence={'analysis':{'difference_average_precision':.002},'prior_quantum':{},'prepared_quantum':{'cases':[]},'research_memory':{'live_literature':{'papers':[{'pmid':'12345','abstract':'Evidence'}]}}}
  before=json.dumps(evidence)
  original=runner.brief_input(evidence,'OXTR',[])
  self.assertEqual(runner.report_request(evidence,'OXTR',[],LEGACY['astra']),original)
  revised=runner.report_request(evidence,'OXTR',[],STAGING['astra'])
  self.assertEqual(revised['prompt'],original['prompt'])
  self.assertEqual(revised['schema'],original['schema'])
  self.assertLess(len(revised['instructions']),len(original['instructions']))
  self.assertEqual(json.dumps(evidence),before)

 def test_count_uses_exact_outbound_context_and_fails_closed(self):
  with tempfile.TemporaryDirectory() as d:
   secret=Path(d)/'credentials.json';secret.write_text('{"openai":"fixture"}')
   request=runner.report_request({'analysis':{},'prior_quantum':{},'prepared_quantum':{'cases':[]}},'Question',[],STAGING['astra'])
   response=Mock();response.json.return_value={'input_tokens':4000}
   with patch.object(runner,'SECRET',secret),patch.object(runner.requests,'post',return_value=response) as post:
    self.assertEqual(runner.report_token_reservation(request,STAGING['astra']),4000+16384+1024)
    sent=post.call_args.kwargs['json']
    self.assertEqual(sent['instructions'],request['instructions']);self.assertEqual(sent['input'],request['prompt'])
    self.assertEqual(sent['text']['format']['schema'],request['schema']);self.assertEqual(sent['reasoning'],{'effort':'max'})
    for invalid in [None,True,-1,'4000']:
     response.json.return_value={'input_tokens':invalid}
     with self.assertRaises(RuntimeError):runner.report_token_reservation(request,STAGING['astra'])

 def test_incomplete_response_retains_usage_without_a_narrative(self):
  response=SimpleNamespace(status='incomplete',incomplete_details=SimpleNamespace(reason='max_output_tokens'),usage=SimpleNamespace(total_tokens=18000),id='receipt-incomplete',model='gpt-6-astra')
  client=Mock();client.responses.create.return_value=response
  with tempfile.TemporaryDirectory() as d:
   secret=Path(d)/'credentials.json';secret.write_text('{"openai":"fixture"}')
   with patch.object(runner,'SECRET',secret),patch('openai.OpenAI',return_value=client):
    receipt=runner.brief({'analysis':{},'prior_quantum':{},'prepared_quantum':{'cases':[]}},'Question',model_settings=STAGING)
   self.assertEqual(receipt['tokens'],18000);self.assertEqual(receipt['provider_response_id'],'receipt-incomplete')
   self.assertEqual(receipt['incomplete_reason'],'max_output_tokens');self.assertNotIn('narrative',receipt)

 def test_incomplete_call_is_settled_and_not_repeated_or_published(self):
  with tempfile.TemporaryDirectory() as d,SqliteSaver.from_conn_string(':memory:') as cp:
   root=Path(d);secret=root/'credentials.json';secret.write_text('{"openai":"fixture"}')
   writer=Mock(return_value={'tokens':18000,'provider_response_id':'incomplete-fixture','response_status':'incomplete','incomplete_reason':'max_output_tokens'})
   ledger=Ledger(root/'usage.sqlite',64000,4)
   with patch.object(runner,'SERVICE_ROOT',root),patch.object(runner,'SECRET',secret),patch.object(runner.science,'prior_measurements',return_value={}),patch.object(runner.science,'prepare',return_value={'rows':[]}),patch.object(runner.science,'analyse',return_value={'predictions':[]}),patch.object(runner.science,'load',return_value={'cases':[]}),patch('subprocess.run'):
    graph=runner.graph(ledger,cp,lambda *a:None,lambda q:{},Reviewer(['approve'],[]),planner=lambda *a:{'plan':{'supported':True},'tokens':10},writer=writer,model_settings=STAGING)
    config={'configurable':{'thread_id':'failure'}}
    with self.assertRaisesRegex(RuntimeError,'usage receipt is saved'):graph.invoke({'id':'failure','question':'OXTR'},config)
    with self.assertRaisesRegex(RuntimeError,'usage receipt is saved'):graph.invoke(None,config)
    self.assertEqual(writer.call_count,1)
    self.assertEqual(ledger.db.execute('select sum(reserve) from actions').fetchone()[0],18010)
    self.assertFalse((root/'results/failure/result.json').exists())

if __name__=='__main__':unittest.main()
