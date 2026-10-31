"""Verify public research protocols without model calls or compute dispatch."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, urllib.request, datetime
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'research/informatics/quantum-agents-wiki-20261101'
out.mkdir(parents=True,exist_ok=True)
def probe(env):
 base='https://informatics-universal-one'+('-staging'if env=='staging'else '')+'.universalmind.workers.dev'
 def call(path,body=None,headers=None):
  h={'User-Agent':'Universal-Informatics-Documentation-Verification','Accept':'application/json, text/event-stream',**(headers or {})}
  if body is not None:h['Content-Type']='application/json'
  req=urllib.request.Request(base+path,data=json.dumps(body).encode()if body is not None else None,headers=h)
  with urllib.request.urlopen(req,timeout=60)as r:return json.load(r)
 def mcp(method,params={}):
  d=call('/mcp',{'jsonrpc':'2.0','id':1,'method':method,'params':params},{'MCP-Protocol-Version':'2025-11-25'});assert 'error'not in d,d;return d['result']
 init=mcp('initialize',{'protocolVersion':'2025-11-25','capabilities':{},'clientInfo':{'name':'QuantumWikiVerification','version':'1.0'}})
 tools=mcp('tools/list')['tools'];inventory=mcp('tools/call',{'name':'get_inventory','arguments':{}})
 quantum=mcp('tools/call',{'name':'get_quantum_study','arguments':{'id':'oxtr-qrc-01','section':'summary'}})
 assert not inventory.get('isError')and not quantum.get('isError')
 methods=mcp('tools/call',{'name':'get_quantum_study','arguments':{'id':'oxtr-qrc-01','section':'methods'}})
 measurements=mcp('tools/call',{'name':'get_quantum_study','arguments':{'id':'oxtr-qrc-01','section':'measurements','offset':0}})
 continuation=call('/api/v1/quantum/oxtr-qrc-01?section=continuation')
 card=call('/.well-known/agent-card.json');tasks=call('/a2a/v1',{'jsonrpc':'2.0','id':2,'method':'ListTasks','params':{}},{'A2A-Version':'1.0'})
 assert tasks['result']['tasks']==[]and card['capabilities']['streaming']is False
 result={'environment':env,'base':base,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'initialize':init,'tools':tools,'inventory':inventory,'quantum_summary':quantum,'quantum_methods':methods,'quantum_measurements_page':measurements,'continuation':continuation,'agent_card':card,'a2a_list_tasks':tasks,'health':call('/health',headers={'Origin':'https://staging.universalmind.tv'if env=='staging'else 'https://universalmind.tv'}),'no_model_requests_or_compute_jobs':True}
 (out/(env+'-protocols.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 return {'environment':env,'tools':len(tools),'inventory':inventory.get('structuredContent',{}).get('counts'),'quantum_study':quantum.get('structuredContent',{}).get('id'),'A2A':'card and ListTasks verified','new_model_calls':0}
with ThreadPoolExecutor(max_workers=2)as pool:
 for r in pool.map(probe,['staging','production']):print(json.dumps(r))
