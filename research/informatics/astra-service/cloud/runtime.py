"""AWS Lambda entry point. No public function URL and no QPU permissions."""
import io,json,os,shutil,sqlite3,sys,tarfile,tempfile,hashlib
from pathlib import Path
import boto3

TASK_ROOT=Path('/tmp/astra-task')
os.environ['ASTRA_SERVICE_HOME']=str(TASK_ROOT)
os.environ['ASTRA_DATA_ROOT']='/tmp/astra-data'
os.environ['INFORMATICS_RESEARCH_ROOT']='/var/task/workspace/research-inputs'
os.environ['ASTRA_CUDAQ_PYTHON']=sys.executable
sys.path.insert(0,'/var/task/workspace/research/informatics/astra-service')

class StateArchive:
 def __init__(self,bucket,identifier,root=TASK_ROOT,client=None):
  self.client=client or boto3.client('s3');self.bucket=bucket;self.key='state/'+identifier+'/latest.tar';self.root=root
 def restore(self):
  try:response=self.client.get_object(Bucket=self.bucket,Key=self.key)
  except self.client.exceptions.NoSuchKey:return
  raw=response['Body'].read(64*1024*1024+1)
  if len(raw)>64*1024*1024:raise RuntimeError('Checkpoint exceeds the storage bound')
  if response.get('Metadata',{}).get('sha256')!=hashlib.sha256(raw).hexdigest():raise RuntimeError('Checkpoint checksum mismatch')
  with tarfile.open(fileobj=io.BytesIO(raw),mode='r:') as archive:
   for member in archive.getmembers():
    if member.name not in ['checkpoints.sqlite','usage.sqlite'] or not member.isfile():raise RuntimeError('Invalid checkpoint archive')
    (self.root/member.name).write_bytes(archive.extractfile(member).read())
 def save(self):
  data=io.BytesIO()
  with tempfile.TemporaryDirectory() as tmp,tarfile.open(fileobj=data,mode='w') as archive:
   for name in ['checkpoints.sqlite','usage.sqlite']:
    source=self.root/name
    if not source.exists():continue
    copy=Path(tmp)/name
    with sqlite3.connect(source) as src,sqlite3.connect(copy) as dest:src.backup(dest)
    archive.add(copy,arcname=name)
  raw=data.getvalue()
  if len(raw)>64*1024*1024:raise RuntimeError('Checkpoint exceeds the storage bound')
  self.client.put_object(Bucket=self.bucket,Key=self.key,Body=raw,ServerSideEncryption='AES256',Metadata={'sha256':hashlib.sha256(raw).hexdigest()})

def handler(event,context):
 # All request data comes from the authenticated broker, never model-written code.
 if TASK_ROOT.exists():shutil.rmtree(TASK_ROOT)
 TASK_ROOT.mkdir(mode=0o700)
 secret=json.loads(boto3.client('secretsmanager').get_secret_value(SecretId=os.environ['ASTRA_SECRET_ARN'])['SecretString'])
 path=TASK_ROOT/'credentials.json';path.write_text(json.dumps(secret));path.chmod(0o600)
 import runner
 broker=runner.Broker();claim=broker.call('claim')
 if not claim.get('task'):return {'status':'idle'}
 identifier=claim['task']['id'];archive=StateArchive(os.environ['ASTRA_STATE_BUCKET'],identifier)
 archive.restore()
 def sync():
  if broker.stopped.is_set():raise RuntimeError('Lease ended before durable checkpoint')
  archive.save()
 broker.run(claim,sync=sync)
 # JSON and full CSV remain downloadable in the broker; mirror both durably.
 for path in (TASK_ROOT/'results'/identifier).glob('result.*'):
  boto3.client('s3').put_object(Bucket=os.environ['ASTRA_STATE_BUCKET'],Key='results/'+identifier+'/'+path.name,Body=path.read_bytes(),ServerSideEncryption='AES256')
 return {'task_id':identifier,'execution':'aws-lambda-cpu'}
