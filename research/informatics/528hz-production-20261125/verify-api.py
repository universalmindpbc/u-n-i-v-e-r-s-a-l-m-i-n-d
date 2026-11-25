import csv, hashlib, io, json, pathlib, urllib.request
out=pathlib.Path(__file__).parent
root=out.parents[2]
base='https://informatics-universal-one.universalmind.workers.dev'
origin='https://universalmind.tv'
def get(route,host=base,site=origin,payload=None):
 headers={'Origin':site,'User-Agent':'Mozilla/5.0'}
 if payload is not None:headers['Content-Type']='application/json'
 request=urllib.request.Request(host+route,headers=headers,data=json.dumps(payload).encode() if payload is not None else None)
 return urllib.request.urlopen(request,timeout=60).read()
def data(route,**kw):return json.loads(get(route,**kw))
inventory=data('/api/v1/inventory');health=data('/health')
register=json.loads((root/'Informatics/library-data/528hz-research-register.json').read_text())
assert health['knowledgeVersions']['sound528']['sourceRecords']==12
assert health['knowledgeVersions']['sound528']['sourceSHA256']=='5704b741bbc4132e8e271fb8cd0c9c913a7d91ab574a8588e15b0e6957c130ec'
records=[];offset=0;pages=0
while offset is not None:
 page=data('/api/v1/export/publications.json?limit=100&offset='+str(offset))
 raw=get('/api/v1/export/publications.csv?limit=100&offset='+str(offset))
 reconstructed=[json.loads(row['record_json']) for row in csv.DictReader(io.StringIO(raw.decode()))]
 assert reconstructed==page['records']
 records.extend(page['records']);offset=page['page']['nextOffset'];pages+=1
assert len(records)==inventory['counts']['publications']
by_id={r['id']:r for r in records};assert len(by_id)==len(records)
for record in register['records']:assert by_id[record['id']]==record,record['id']
chapter=data('/api/v1/research-chapters/528hz-sound-tuning')
assert chapter['sourceCount']==12 and chapter['sourceAudit']['explicitly528HzRCTs']==4
mcp=data('/mcp',payload={'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'get_research_chapter','arguments':{'id':'528hz-sound-tuning'}}})
assert mcp['result']['structuredContent']==chapter
second=data('/api/v1/research-chapters/528hz-sound-tuning?offset=6')
assert chapter['records']+second['records']==register['records']
for identity in ['sound528-bozok2026','10.7759%2Fcureus.115693','hsi-c2e2e55e945231']:
 record=data('/api/v1/publications/'+identity)['record'];assert record==by_id[record['id']]
before=json.loads((out/'service-before.json').read_text());staging={}
for route in ['health','api/v1/inventory']:
 raw=get('/'+route,host='https://informatics-universal-one-staging.universalmind.workers.dev',site='https://staging.universalmind.tv')
 digest=hashlib.sha256(raw).hexdigest();assert digest==before['staging'][route]['sha256'],'Staging service changed'
 staging[route]=digest
result={'passed':True,'inventory':inventory,'health':health,'exactAppraisalMatches':12,'RESTAndMCPAgree':True,'chapterPaginationComplete':True,'exportPages':pages,'jsonCSVReconstructedRecords':len(records),'stagingUnchangedSHA256':staging}
(out/'api-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['passed','exactAppraisalMatches','RESTAndMCPAgree','exportPages','jsonCSVReconstructedRecords','stagingUnchangedSHA256']}))
