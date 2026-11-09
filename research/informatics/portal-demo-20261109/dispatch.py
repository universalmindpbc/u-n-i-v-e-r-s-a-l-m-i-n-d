"""Staging portal dispatcher; one-minute ticks, fixed 30-day window."""
import json,os,urllib.request
import boto3
from botocore.config import Config
URL='https://informatics-universal-one-staging.universalmind.workers.dev/agent/demo/control'
ORIGIN='https://staging.universalmind.tv'
def handler(event,context):
 config=Config(retries={'max_attempts':0},connect_timeout=2,read_timeout=3)
 secret=json.loads(boto3.client('secretsmanager',config=config).get_secret_value(SecretId=os.environ['ASTRA_SECRET_ARN'])['SecretString'])
 def call(body):
  request=urllib.request.Request(URL,data=json.dumps(body).encode(),headers={'Content-Type':'application/json','Origin':ORIGIN,'Authorization':'Bearer '+secret['worker'],'User-Agent':'Universal-Informatics-Demo-Dispatcher/1.0'})
  with urllib.request.urlopen(request,timeout=3) as response:return json.load(response)
 ready=call({'op':'ready','runtime':'quantum-portal-experiment-v1'})
 pending=call({'op':'pending'}) if not ready.get('closed') else ready
 if pending.get('closed'):
  boto3.client('events',config=config).disable_rule(Name=os.environ['DEMO_RULE']);return {'status':'demo_window_closed'}
 if not pending.get('pending'):return {'status':'idle'}
 boto3.client('lambda',config=config).invoke(FunctionName=os.environ['DEMO_WORKER'],InvocationType='Event',Payload=b'{}')
 return {'status':'dispatched'}
