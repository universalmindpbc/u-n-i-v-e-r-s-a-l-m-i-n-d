"""Build a reproducible staging Lambda bundle and scoped CloudFormation plan."""
import hashlib,json,zipfile
from pathlib import Path
root=Path(__file__).parent
out=Path('/private/tmp/um-portal-demo-package-20261109');out.mkdir(exist_ok=True)
for name,files in [('source',['Dockerfile','worker.py','design.py','computation.py','verify.py','verification-fixture.json']),('dispatcher',['dispatch.py'])]:
 with zipfile.ZipFile(out/(name+'.zip'),'w',zipfile.ZIP_DEFLATED) as z:
  for f in files:
   info=zipfile.ZipInfo(f,date_time=(2026,11,9,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644 << 16;z.writestr(info,(root/f).read_bytes())
ref=lambda s:{'Ref':s};sub=lambda s:{'Fn::Sub':s};get=lambda s,a:{'Fn::GetAtt':[s,a]}
def stmt(actions,resources,**extra):return {'Effect':'Allow','Action':actions,'Resource':resources,**extra}
def role(statements):return {'Type':'AWS::IAM::Role','Properties':{'AssumeRolePolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Principal':{'Service':'lambda.amazonaws.com'},'Action':'sts:AssumeRole'}]},'Policies':[{'PolicyName':'PortalDemoOnly','PolicyDocument':{'Version':'2012-10-17','Statement':statements}}]}}
name='informatics-portal-demo-staging';state='informatics-astra-staging-740168708062-us-east-1';prefix='portal-demo-20261109';result='amazon-braket-quantum-lab-740168708062-us-east-1';device='arn:aws:braket:us-east-1::device/qpu/quera/Aquila';taskarn='arn:aws:braket:us-east-1:740168708062:quantum-task/*'
secret=ref('SecretArn');logs='arn:aws:logs:us-east-1:740168708062:log-group:/aws/lambda/'+name+'-*:*'
base=[stmt(['secretsmanager:GetSecretValue'],secret),stmt(['logs:CreateLogStream','logs:PutLogEvents'],logs)]
accountdevice=device.replace('us-east-1::','us-east-1:740168708062:')
workerrole=role(base+[stmt(['braket:GetDevice'],accountdevice),stmt(['braket:CreateQuantumTask'],[device,accountdevice,taskarn],Condition={'StringEquals':{'aws:RequestTag/Project':'InformaticsPortalDemo'}}),stmt(['braket:TagResource'],taskarn,Condition={'StringEquals':{'aws:RequestTag/Project':'InformaticsPortalDemo'}}),stmt(['braket:GetQuantumTask'],taskarn,Condition={'StringEquals':{'aws:ResourceTag/Project':'InformaticsPortalDemo'}}),stmt(['braket:SearchSpendingLimits'],'*'),stmt(['s3:GetObject','s3:PutObject'],['arn:aws:s3:::'+state+'/'+prefix+'/*','arn:aws:s3:::'+result+'/'+prefix+'/*']),stmt(['s3:GetBucketLocation'],['arn:aws:s3:::'+state,'arn:aws:s3:::'+result])])
dispatchrole=role(base+[stmt(['lambda:InvokeFunction'],get('Worker','Arn')),stmt(['events:DisableRule'],'arn:aws:events:us-east-1:740168708062:rule/'+name+'-dispatch')])
resources={'WorkerRole':workerrole,'DispatchRole':dispatchrole}
for key,handler,memory,timeout,zipname,rolename in [('Worker','worker.handler',2048,330,'worker','WorkerRole'),('Dispatch','dispatch.handler',128,15,'dispatcher','DispatchRole')]:
 variables={'ASTRA_SECRET_ARN':secret,'DEMO_STATE_BUCKET':state} if key=='Worker' else {'ASTRA_SECRET_ARN':secret,'DEMO_WORKER':ref('Worker'),'DEMO_RULE':name+'-dispatch'}
 resources[key]={'Type':'AWS::Lambda::Function','Properties':{'FunctionName':name+'-'+key.lower(),'Role':get(rolename,'Arn'),'Runtime':'python3.12','Handler':handler,'MemorySize':memory,'Timeout':timeout,'ReservedConcurrentExecutions':1,'Code':{'S3Bucket':state,'S3Key':ref(zipname.title()+'Key')},'Environment':{'Variables':variables}}}
 if key=='Worker':
  props=resources[key]['Properties'];props.pop('Runtime');props.pop('Handler');props['PackageType']='Image';props['Code']={'ImageUri':ref('ImageUri')}
 resources[key+'Logs']={'Type':'AWS::Logs::LogGroup','Properties':{'LogGroupName':'/aws/lambda/'+name+'-'+key.lower(),'RetentionInDays':7}}
 resources[key+'Invoke']={'Type':'AWS::Lambda::EventInvokeConfig','Properties':{'FunctionName':ref(key),'Qualifier':'$LATEST','MaximumRetryAttempts':0,'MaximumEventAgeInSeconds':60}}
resources['Tick']={'Type':'AWS::Events::Rule','Properties':{'Name':name+'-dispatch','ScheduleExpression':'rate(1 minute)','State':ref('ScheduleState'),'Targets':[{'Id':'portal-dispatch','Arn':get('Dispatch','Arn'),'RetryPolicy':{'MaximumRetryAttempts':0}}]}}
resources['TickPermission']={'Type':'AWS::Lambda::Permission','Properties':{'FunctionName':ref('Dispatch'),'Action':'lambda:InvokeFunction','Principal':'events.amazonaws.com','SourceArn':get('Tick','Arn')}}
plan={'AWSTemplateFormatVersion':'2010-09-09','Description':'Isolated staging portal demo: one credit per code, question-led Wolfram/CUDA-Q/Aquila execution, shared USD100 reservation pool. Existing production runtime untouched.','Parameters':{'SecretArn':{'Type':'String'},'ImageUri':{'Type':'String'},'DispatcherKey':{'Type':'String'},'ScheduleState':{'Type':'String','Default':'DISABLED','AllowedValues':['DISABLED','ENABLED']}},'Resources':resources}
(root/'runtime.template.json').write_text(json.dumps(plan,indent=2)+'\n')
manifest={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [out/'source.zip',out/'dispatcher.zip']};(root/'package.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest))
