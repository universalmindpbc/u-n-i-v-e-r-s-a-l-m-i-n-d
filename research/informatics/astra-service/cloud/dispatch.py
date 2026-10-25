"""Small scheduled dispatcher. Reserve a bounded attempt before invocation."""
import boto3,json,os,urllib.request
from datetime import datetime,timezone

def handler(event,context):
 secret=json.loads(boto3.client('secretsmanager').get_secret_value(SecretId=os.environ['ASTRA_SECRET_ARN'])['SecretString'])
 request=urllib.request.Request('https://informatics-universal-one-staging.universalmind.workers.dev/agent/control',data=b'{"op":"pending"}',headers={'Content-Type':'application/json','Origin':'https://staging.universalmind.tv','Authorization':'Bearer '+secret['worker'],'User-Agent':'Universal-Informatics-Astra/1.0'})
 with urllib.request.urlopen(request,timeout=10) as response:pending=json.load(response)
 if not pending.get('pending'):return {'status':'idle'}
 s3=boto3.client('s3');bucket=os.environ['ASTRA_STATE_BUCKET'];key='allowance/'+datetime.now(timezone.utc).strftime('%Y-%m')+'.json'
 try:count=json.loads(s3.get_object(Bucket=bucket,Key=key)['Body'].read())['attempts']
 except s3.exceptions.NoSuchKey:count=0
 # Reserved concurrency one serialises this ledger. Failed/unknown invocations retain reservations.
 if count>=120:return {'status':'monthly_hosting_allowance_reached'}
 s3.put_object(Bucket=bucket,Key=key,Body=json.dumps({'attempts':count+1,'limit':120}),ServerSideEncryption='AES256')
 boto3.client('lambda').invoke(FunctionName=os.environ['ASTRA_WORKER_NAME'],InvocationType='Event',Payload=b'{}')
 return {'status':'dispatched','attempt':count+1}
