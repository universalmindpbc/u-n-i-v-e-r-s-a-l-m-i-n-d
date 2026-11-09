"""Verify outbound effort, receipt identity, resume safety and budget enforcement."""
import json,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock,patch
import runner
from review_flow import create_plan,GeminiReviewer,ReviewLedger
from reasoning_profile import LEGACY,STAGING_FIRST,STAGING,profile_for_origin,profile_for_checkpoint,profile_for_task,review_budget_for_checkpoint

class Tests(unittest.TestCase):
 def test_environment_and_checkpoint_separation(self):
  self.assertEqual(profile_for_origin('https://staging.universalmind.tv'),STAGING)
  self.assertEqual(profile_for_origin('https://universalmind.tv'),STAGING)
  self.assertEqual(profile_for_checkpoint('https://staging.universalmind.tv',{'id':'old'}),LEGACY)
  self.assertEqual(profile_for_checkpoint('https://staging.universalmind.tv',{'__start__':{'model_settings':STAGING}}),STAGING)
  self.assertEqual(profile_for_checkpoint('https://staging.universalmind.tv',{'model_settings':STAGING}),STAGING)
  with self.assertRaises(ValueError):profile_for_origin('https://untrusted.invalid')
  self.assertEqual(profile_for_checkpoint('https://universalmind.tv',{'model_settings':STAGING}),STAGING)
  with self.assertRaises(ValueError):profile_for_checkpoint('https://staging.universalmind.tv',{'model_settings':{'astra':{'effort':'low'}}})
  copy=profile_for_origin('https://staging.universalmind.tv');copy['astra']['effort']='low'
  self.assertEqual(STAGING['astra']['effort'],'max')
  self.assertEqual(profile_for_checkpoint('https://staging.universalmind.tv',{'model_settings':STAGING_FIRST}),STAGING_FIRST)
  self.assertEqual(profile_for_task('https://staging.universalmind.tv',{}, {'maxModelTokens':24000}),STAGING_FIRST)
  self.assertEqual(profile_for_task('https://staging.universalmind.tv',{}, {'maxModelTokens':64000}),STAGING)
  self.assertEqual(profile_for_task('https://universalmind.tv',{}, {'maxModelTokens':64000}),STAGING)
  self.assertEqual(profile_for_task('https://universalmind.tv',{}, {'maxModelTokens':24000}),LEGACY)
  self.assertEqual(profile_for_checkpoint('https://universalmind.tv',{'id':'old'}),LEGACY)

 def test_staging_allowance_is_separate_and_legacy_resume_retains_its_ledger(self):
  legacy=('state/shared/gemini-review-usage.sqlite',1_000_000)
  self.assertEqual(review_budget_for_checkpoint('https://universalmind.tv',{}, {'maxModelTokens':24000}),legacy)
  self.assertEqual(review_budget_for_checkpoint('https://staging.universalmind.tv',{'id':'old'}),legacy)
  funded=('state/shared/gemini-high-staging-20261109.sqlite',2_000_000)
  self.assertEqual(review_budget_for_checkpoint('https://staging.universalmind.tv',{}),funded)
  self.assertEqual(review_budget_for_checkpoint('https://universalmind.tv',{}, {'maxModelTokens':64000}),funded)
  self.assertEqual(review_budget_for_checkpoint('https://universalmind.tv',{'model_settings':LEGACY}, {'maxModelTokens':64000}),legacy)

 def test_astra_outbound_requests_and_receipts(self):
  reply=SimpleNamespace(status='completed',output_text='{"answer":"Fixture evidence"}',usage=SimpleNamespace(total_tokens=20),id='response-fixture',model='gpt-6-astra')
  client=Mock();client.responses.create.return_value=reply
  with tempfile.TemporaryDirectory() as tmp:
   secret=Path(tmp)/'credentials.json';secret.write_text('{"openai":"fixture"}')
   evidence={'analysis':{},'prior_quantum':{},'prepared_quantum':{'cases':[]}}
   for profile in [STAGING,LEGACY]:
    with patch('openai.OpenAI',return_value=client),patch.object(runner,'SECRET',secret):
     plan=create_plan('fixture','Question',{},[],model_settings=profile)
     args=client.responses.create.call_args.kwargs
     self.assertEqual(args['reasoning'],{'effort':profile['astra']['effort']})
     self.assertEqual(args['max_output_tokens'],profile['astra']['plan_output_tokens'])
     self.assertEqual(args.get('service_tier'),profile['astra'].get('service_tier'))
     self.assertEqual(plan['reasoning_effort'],profile['astra']['effort'])
     report=runner.brief(evidence,'Question',model_settings=profile)
     args=client.responses.create.call_args.kwargs
     self.assertEqual(args['reasoning'],{'effort':profile['astra']['effort']})
     self.assertEqual(args['max_output_tokens'],profile['astra']['report_output_tokens'])
     self.assertEqual(args.get('service_tier'),profile['astra'].get('service_tier'))
     self.assertEqual(report['reasoning_effort'],profile['astra']['effort'])
     client.responses.create.return_value=SimpleNamespace(status='incomplete')
     with self.assertRaises(RuntimeError):create_plan('fixture','Question',{},[],model_settings=profile)
     client.responses.create.return_value=reply

 def test_routing_usage_is_inside_the_approved_study_allowance(self):
  from workflow import Ledger
  task={'routing_receipt':{'total_tokens':1000,'service_tier':'default'}}
  self.assertEqual(runner.worker_token_limit(STAGING,task),63000)
  self.assertEqual(runner.worker_token_limit(LEGACY,task),24000)
  self.assertEqual(runner.worker_token_limit(STAGING_FIRST,task),24000)
  for routing in [{},{'total_tokens':1000,'service_tier':'priority'},{'total_tokens':-1,'service_tier':'default'}]:
   with self.assertRaises(RuntimeError):runner.worker_token_limit(STAGING,{'routing_receipt':routing})
  with tempfile.TemporaryDirectory() as tmp:
   ledger=Ledger(Path(tmp)/'usage.sqlite',token_limit=runner.worker_token_limit(STAGING,task))
   with self.assertRaisesRegex(RuntimeError,'allowance reached'):
    ledger.run('study','request',63001,lambda:self.fail('Exceeded approved total'))

 def test_long_calls_yield_before_reserving_when_invocation_time_is_short(self):
  import threading
  broker=runner.Broker.__new__(runner.Broker);broker.stopped=threading.Event()
  broker.model_settings=STAGING;broker.remaining_time=lambda:400;broker.call=Mock()
  with self.assertRaises(runner.WorkerYield):broker.progress('model','Fixture')
  broker.call.assert_not_called()
  broker.model_settings=LEGACY;broker.task={'id':'fixture'};broker.lease='fixture'
  broker.progress('model','Fixture');broker.call.assert_called_once()

 def test_gemini_high_has_distinct_receipt_and_budget_reservation(self):
  review={'decision':'approve','summary':'Fixture evidence','checks':[],'required_changes':[]}
  response=Mock(status_code=200)
  response.json.return_value={'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':json.dumps(review)}]}}],
    'usageMetadata':{'promptTokenCount':10,'totalTokenCount':30},'responseId':'gemini-fixture','modelVersion':'gemini-4-argon'}
  session=Mock();session.post.return_value=response
  with tempfile.TemporaryDirectory() as tmp:
   ledger=ReviewLedger(Path(tmp)/'ledger.sqlite')
   for level in ['LOW','HIGH']:
    reviewer=GeminiReviewer('fixture',ledger,session=session,thinking_level=level)
    receipt=reviewer.review('same-study','design',{'evidence':'same'})
    self.assertEqual(session.post.call_args.kwargs['json']['generationConfig']['thinkingConfig'],{'thinkingLevel':level})
    self.assertEqual(receipt['thinking_level'],level)
   self.assertEqual(session.post.call_count,2)
   reviewer.review('same-study','design',{'evidence':'same'})
   self.assertEqual(session.post.call_count,2)
   tiny=ReviewLedger(Path(tmp)/'tiny.sqlite',ceiling_micro_usd=100)
   with self.assertRaisesRegex(RuntimeError,'allowance reached'):
    GeminiReviewer('fixture',tiny,session=session,thinking_level='HIGH').review('new','final',{})
   self.assertEqual(session.post.call_count,2)
   with self.assertRaises(ValueError):GeminiReviewer('fixture',ledger,thinking_level='MAX')

if __name__=='__main__':unittest.main()
