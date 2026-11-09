import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from langgraph.checkpoint.sqlite import SqliteSaver
import runner
from workflow import Ledger
from test_reviews import Reviewer

class LiteratureTests(unittest.TestCase):
 def test_shared_evidence_reaches_design_report_and_both_reviews(self):
  record={'version':'fixture','papers':[{'pmid':'12345','title':'Public evidence','abstract':'a'*1500,'url':'https://pubmed.ncbi.nlm.nih.gov/12345/'}],'reads':[]}
  events=[]
  class CheckingReviewer(Reviewer):
   def review(inner,study,phase,material):
    self.assertEqual(material['live_literature']['papers'][0]['pmid'],'12345')
    return super().review(study,phase,material)
  with tempfile.TemporaryDirectory() as temp,SqliteSaver.from_conn_string(':memory:') as cp:
   root=Path(temp);secret=root/'credentials.json';secret.write_text('{"openai":"fixture"}')
   def planner(key,question,memory,feedback):
    self.assertEqual(memory['live_literature']['papers'][0]['pmid'],'12345')
    self.assertEqual(len(memory['live_literature']['papers'][0]['abstract']),600)
    return {'plan':{'supported':True,'stop_reason':''},'tokens':10}
   def writer(evidence,question,feedback):
    self.assertEqual(evidence['research_memory']['live_literature'],record)
    prompt=json.loads(runner.brief_input(evidence,question)['prompt'])
    self.assertEqual(prompt['calculated_evidence']['live_literature']['papers'][0]['pmid'],'12345')
    return {'narrative':{'answer':'Fixture'},'tokens':10}
   with patch.object(runner,'SERVICE_ROOT',root),patch.object(runner,'SECRET',secret),patch.object(runner.science,'prior_measurements',return_value={}),patch.object(runner.science,'prepare',return_value={'rows':[],'sources':[]}),patch.object(runner.science,'analyse',return_value={'predictions':[]}),patch.object(runner.science,'load',return_value={'cases':[]}),patch('subprocess.run'):
    g=runner.graph(Ledger(root/'usage.sqlite',64000,4),cp,lambda *a:None,lambda q:{'liveLiterature':record},CheckingReviewer(['approve','approve'],events),planner=planner,writer=writer)
    result=g.invoke({'id':'literature','question':'Evidence review'},{'configurable':{'thread_id':'literature'}})
    self.assertEqual(events,['design','final'])
    self.assertEqual(result['report']['research_memory']['live_literature'],record)
    self.assertIn('12345',(root/'results/literature/result.csv').read_text())
 def test_legacy_memory_has_no_new_field(self):
  self.assertNotIn('live_literature',runner.memory_excerpt({'schema':'legacy','memories':[]}))

if __name__=='__main__':unittest.main()
