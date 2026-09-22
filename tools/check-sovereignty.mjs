import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, generateKeyPairSync, privateDecrypt, constants, createDecipheriv, verify} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=process.env.PHP_WASM_MODULE_DIR;
if(!modules)throw Error('Set PHP_WASM_MODULE_DIR to an isolated @php-wasm runtime.');
const {PHP}=await import(path.join(modules,'@php-wasm/universal/index.js'));
const {loadNodeRuntime}=await import(path.join(modules,'@php-wasm/node/index.js'));
const php=new PHP(await loadNodeRuntime('8.3',{emscriptenOptions:{processId:1}}));
const dir='/site/vogue/iam/api/.runtime-private/sovereignty';
const report={checks:[],passed:false};
const digest=x=>createHash('sha256').update(x).digest('hex');
const keyOptions={modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}};
const owner=generateKeyPairSync('rsa',keyOptions), signer=generateKeyPairSync('rsa',keyOptions);
const config={enabled:true,environment:'staging',identity_key:'a'.repeat(64),worker_token_sha256:digest('b'.repeat(64)),vaults:[],retention_days:null};
const password='first-person-test-fixture';
const document=JSON.stringify({schema:1,ciphertext:'test-encrypted-document'});
try {
 php.mkdir(dir);
 for(const name of ['sovereignty-lib.php','portal-entry.php','sovereignty-worker.php','sovereignty-status.php','sovereignty-operations.php','sovereignty-timestamps.php','sovereignty-run.php']) {
  const source=await fs.readFile(path.join(root,'i  a m/api',name),'utf8');
  php.writeFile('/site/vogue/iam/api/'+name,source);
  const lint=await php.run({code: `<?php token_get_all(file_get_contents('/site/vogue/iam/api/${name}'), TOKEN_PARSE); echo 'valid';`});
  assert.equal(lint.errors,''); assert.equal(lint.text,'valid');
 }
 php.writeFile('/site/index.html',`const allowedPasswordHashes = new Set(["${digest(password)}","${digest('second-person-test-fixture')}"])`);
 const writeConfig=()=>php.writeFile(dir+'/config.json',JSON.stringify(config));writeConfig();
 php.writeFile(dir+'/recipient-public.pem',owner.publicKey);
 php.writeFile(dir+'/signing-private.pem',signer.privateKey);
 php.writeFile(dir+'/document.encrypted.json',document);
 php.writeFile(dir+'/document.json',JSON.stringify({version:'test-v1',sealed_sha256:digest('sealed-test'),encrypted_sha256:digest(document)}));
 async function request(payload,options={}){
  const r=await php.run({scriptPath:'/site/vogue/iam/api/'+(options.script||'portal-entry.php'),
   relativeUri:'/vogue/iam/api/'+(options.script||'portal-entry.php'),protocol:'https',method:options.method||'POST',
   headers:{Host:options.host||'staging.universalmind.tv',Origin:options.origin||'https://'+(options.host||'staging.universalmind.tv'),'Content-Type':options.type||'application/json',...(options.headers||{})},
   $_SERVER:{HTTPS:'on',DOCUMENT_ROOT:'/site'},body:new TextEncoder().encode(typeof payload==='string'?payload:JSON.stringify(payload))});
  assert.equal(r.errors,'',r.errors);return {status:r.httpStatusCode,body:JSON.parse(r.text)};
 }
 assert.equal((await request({password:'wrong'})).status,401);
 assert.equal((await request({password:digest(password)})).status,401);
 assert.equal((await request({password},{origin:'https://other.test'})).status,403);
 assert.equal((await request({password},{method:'GET'})).status,405);
 assert.equal((await request({password},{type:'text/plain'})).status,415);
 assert.equal((await request('{bad')).status,400);
 assert.equal((await request({password:'x'.repeat(3000)})).status,413);
 assert.equal((await request({password:[]})).status,400);
 assert.equal(php.fileExists(dir+'/events'),false);
 report.checks.push('Wrong passwords, submitted digests, cross-origin requests, invalid JSON, wrong method/type and oversized bodies cannot create entries');
 assert.equal((await request({password})).status,202);
 let files=php.listFiles(dir+'/events').filter(x=>x.endsWith('.json'));assert.equal(files.length,1);
 const first=php.readFileAsText(dir+'/events/'+files[0]);
 for(let i=0;i<5;i++)assert.equal((await request({password})).status,202);
 assert.equal(php.readFileAsText(dir+'/events/'+files[0]),first);
 assert.equal((await request({password:'second-person-test-fixture'})).status,202);
 assert.equal(php.listFiles(dir+'/events').filter(x=>x.endsWith('.json')).length,2);
 report.checks.push('Repeated requests preserve the exact original entry; a second credential creates one separate entry');
 const event=JSON.parse(first), e=event.envelope;
 const key=privateDecrypt({key:owner.privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha1'},Buffer.from(e.wrapped_key,'base64'));
 const decode=(value)=>{
  const cipher=createDecipheriv('aes-256-gcm',key,Buffer.from(value.iv,'base64'));
  cipher.setAAD(Buffer.from(value.aad));cipher.setAuthTag(Buffer.from(value.tag,'base64'));
  return Buffer.concat([cipher.update(Buffer.from(value.ciphertext,'base64')),cipher.final()]).toString();
 };
 const decrypted=JSON.parse(decode(e));const receipt=JSON.parse(decrypted.receipt_json);
 assert.equal(verify('sha256',Buffer.from(decrypted.receipt_json),signer.publicKey,Buffer.from(decrypted.signature,'base64')),true);
 assert.equal(receipt.event,'first_portal_entry');assert.equal(receipt.consent_recorded,false);assert.equal(receipt.contract_executed,false);assert.equal(receipt.token_issuance,'not_issued');
 for(const content of [first,decrypted.receipt_json])for(const forbidden of [password,digest(password),'REMOTE_ADDR','user_agent','email'])assert.ok(!content.includes(forbidden));
 const changed=Buffer.from(e.ciphertext,'base64');changed[0]^=1;
 assert.throws(()=>decode({...e,ciphertext:changed.toString('base64')}));
 assert.throws(()=>decode({...e,aad:'different'}));
 report.checks.push('Owner key decrypts the envelope; platform signature verifies; ciphertext or AAD tampering is rejected; no password or consent claim is archived');
 assert.equal((await request({}, {script:'sovereignty-status.php',method:'GET'})).status,403);
 const status=await request({}, {script:'sovereignty-status.php',method:'GET',headers:{Authorization:'Bearer '+'b'.repeat(64)}});
 assert.equal(status.body.recorded_entries,2);assert.equal(status.body.four_copies_secured,0);
 assert.equal(status.body.configured_vaults,0);assert.equal(status.body.blockchain.bitcoin_confirmed,0);
 const worker=await php.run({code:`<?php define('SOVEREIGNTY_WORKER_LIBRARY_ONLY',true); require '/site/vogue/iam/api/sovereignty-worker.php'; try { sovereignty_vaults(sovereignty_config()); echo 'bad'; } catch (RuntimeException $e) { echo 'blocked'; }`});
 assert.equal(worker.errors,'');assert.equal(worker.text,'blocked');
 const freePlan=await php.run({code:`<?php define('SOVEREIGNTY_WORKER_LIBRARY_ONLY',true); require '/site/vogue/iam/api/sovereignty-worker.php';
 $c=sovereignty_config(); $c['storage_plan']='b2-free-v1'; $c['retention_days']=30; $c['zero_cost_verified']=true;
 for($i=1;$i<=4;$i++) $c['vaults'][]=['id'=>'v'.$i,'provider'=>'backblaze','account_label'=>'dedicated','region'=>'us-east-005','endpoint'=>'https://s3.us-east-005.backblazeb2.com','bucket'=>'fixture-vault-'.$i,'access_key'=>'test','secret_key'=>'test'];
 $checks=[count(sovereignty_vaults($c))===4,sovereignty_budget_allows(8999999999,1),!sovereignty_budget_allows(8999999999,2),!sovereignty_budget_allows(-1,1)];
 foreach(['unverified','wrong_days','duplicate','aws','production'] as $failure){$d=$c;
 if($failure==='unverified')$d['zero_cost_verified']=false;
 if($failure==='wrong_days')$d['retention_days']=365;
 if($failure==='duplicate')$d['vaults'][3]=$d['vaults'][2];
 if($failure==='aws'){$d['vaults'][0]['provider']='aws';$d['vaults'][0]['endpoint']='https://s3.amazonaws.com';}
 if($failure==='production')$d['environment']='production';
 try{sovereignty_vaults($d);$checks[]=false;}catch(Throwable $e){$checks[]=true;}}
 $prod=$c;$prod['environment']='production';$prod['production_approved']=true;$checks[]=count(sovereignty_vaults($prod))===4;
 require '/site/vogue/iam/api/sovereignty-timestamps.php';
 $digest=hash('sha256','fixture',true);$uri='https://alice.btc.calendar.opentimestamps.org';
 $pending="\\x00".hex2bin('83dfe30d2ef90c8e').chr(strlen($uri)+1).chr(strlen($uri)).$uri;
 $proof=SOVEREIGNTY_OTS_MAGIC."\\x01\\x08".$digest.$pending;
 $leaves=sovereignty_ots_parse($proof,$digest,true);$checks[]=count($leaves)===1&&$leaves[0]['uri']===$uri;
 $checks[]=!sovereignty_calendar_allowed('https://127.0.0.1');
 $checks[]=!sovereignty_calendar_allowed('https://alice.btc.calendar.opentimestamps.org.evil.test');
 foreach([$proof.'x',substr($proof,0,-1),SOVEREIGNTY_OTS_MAGIC."\\x01\\x08".str_repeat('x',32).$pending] as $bad){try{sovereignty_ots_parse($bad,$digest,true);$checks[]=false;}catch(Throwable $e){$checks[]=true;}}
 echo json_encode(['checks'=>$checks,'proof'=>base64_encode($proof)]);`});
 assert.equal(freePlan.errors,'');const freeResult=JSON.parse(freePlan.text);assert.ok(freeResult.checks.every(Boolean));
 if(process.env.SOVEREIGNTY_OTS_FIXTURE)await fs.writeFile(process.env.SOVEREIGNTY_OTS_FIXTURE,Buffer.from(freeResult.proof,'base64'));
 report.checks.push('Only approved staging and production four-bucket free plans are accepted; the 9 GB ceiling, malformed proof rejection and calendar allowlist pass');
 // Public Bitcoin block 1 header; mock transport only, retaining the real
 // Merkle-root, header-hash, work-target and confirmation checks.
 const blockHeader='010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299';
 const timestampSource=await fs.readFile(path.join(root,'i  a m/api/sovereignty-timestamps.php'),'utf8');
 php.writeFile('/site/vogue/iam/api/timestamp-transport-fixture.php',timestampSource.replace('function sovereignty_timestamp_http(', 'function unused_timestamp_http('));
 const confirmation=await php.run({code:`<?php
 function sovereignty_timestamp_http(string $url, ?string $payload=null): string {
   global $mode, $header, $blockHash;
   if(str_ends_with($url,'/blocks/tip/height'))return $mode==='too_few'?'5':'6';
   if(str_ends_with($url,'/header'))return $mode==='corrupt_header'?substr($header,0,-2).'00':$header;
   if($mode==='disagreement'&&str_contains($url,'mempool.space'))return str_repeat('0',64);
   return $blockHash;
 }
 require '/site/vogue/iam/api/timestamp-transport-fixture.php';
 $header='${blockHeader}';$raw=hex2bin($header);
 $blockHash=bin2hex(strrev(hash('sha256',hash('sha256',$raw,true),true)));
 $leaf=['height'=>1,'message'=>substr($raw,36,32)];$checks=[];
 $mode='valid';$valid=sovereignty_bitcoin_verify($leaf);
 $checks[]=$valid['state']==='bitcoin_confirmed'&&$valid['confirmations']===6;
 foreach(['too_few','disagreement','corrupt_header'] as $mode)$checks[]=sovereignty_bitcoin_verify($leaf)===null;
 $mode='valid';$leaf['message']=str_repeat('x',32);$checks[]=sovereignty_bitcoin_verify($leaf)===null;
 echo json_encode($checks);`});
 assert.equal(confirmation.errors,'');assert.ok(JSON.parse(confirmation.text).every(Boolean));
 report.checks.push('A valid Bitcoin header with six confirmations passes; explorer disagreement, a corrupt header, wrong Merkle root and insufficient confirmations remain pending');
 config.environment='production';writeConfig();assert.equal((await request({password})).status,503);
 const prodOptions={host:'universalmind.tv'};
 assert.equal((await request({password},prodOptions)).status,503);
 config.production_approved=true;config.identity_key='c'.repeat(64);writeConfig();
 assert.equal((await request({password})).status,503);
 assert.equal((await request({password:'wrong'},prodOptions)).status,401);
 assert.equal((await request({password},{...prodOptions,origin:'https://staging.universalmind.tv'})).status,403);
 assert.equal((await request({password},prodOptions)).status,202);
 const productionFiles=php.listFiles(dir+'/events').filter(x=>x.endsWith('.json'));
 assert.equal(productionFiles.length,3);
 const savedProduction=productionFiles.map(x=>php.readFileAsText(dir+'/events/'+x));
 assert.equal((await request({password},prodOptions)).status,202);
 assert.deepEqual(productionFiles.map(x=>php.readFileAsText(dir+'/events/'+x)),savedProduction);
 const admin={...prodOptions,script:'sovereignty-status.php',headers:{Authorization:'Bearer '+'b'.repeat(64)}};
 const selfTest=await request({action:'self_test'},admin);
 assert.equal(selfTest.status,200);assert.equal(selfTest.body.encryption_and_signing,true);assert.equal(selfTest.body.duplicate_prevented,true);
 assert.equal((await request({action:'self_test'},admin)).body.created,false);
 assert.equal((await request({}, {...admin,method:'GET'})).body.diagnostics.entries,1);
 assert.equal((await request({}, {...admin,method:'GET'})).body.recorded_entries,3);
 assert.equal((await request({}, {...admin,host:'staging.universalmind.tv',method:'GET'})).status,403);
 assert.equal((await request({}, {...admin,headers:{},method:'GET'})).status,403);
 const qaFile=php.listFiles(dir+'/qa-events').find(x=>x.endsWith('.json'));
 const qaEnvelope=JSON.parse(php.readFileAsText(dir+'/qa-events/'+qaFile)).envelope;
 const qaKey=privateDecrypt({key:owner.privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha1'},Buffer.from(qaEnvelope.wrapped_key,'base64'));
 const qaCipher=createDecipheriv('aes-256-gcm',qaKey,Buffer.from(qaEnvelope.iv,'base64'));
 qaCipher.setAAD(Buffer.from(qaEnvelope.aad));qaCipher.setAuthTag(Buffer.from(qaEnvelope.tag,'base64'));
 const qaContent=JSON.parse(Buffer.concat([qaCipher.update(Buffer.from(qaEnvelope.ciphertext,'base64')),qaCipher.final()]).toString());
 assert.equal(JSON.parse(qaContent.receipt_json).environment,'production_qa');
 assert.equal(verify('sha256',Buffer.from(qaContent.receipt_json),signer.publicKey,Buffer.from(qaContent.signature,'base64')),true);
 report.checks.push('Approved production accepts real credentials once; host and origin boundaries hold; token-protected production diagnostics decrypt and verify without changing audience counts');
 config.environment='staging';config.enabled=false;writeConfig();assert.equal((await request({password})).status,503);
 php.writeFile(dir+'/config.json','bad');assert.equal((await request({password})).body.accepted,false);
 report.checks.push('Status requires the private token; missing vaults cannot report copies secured; environment mismatch, disabled and damaged configuration fail closed');
 const html=await fs.readFile(path.join(root,'index.html'),'utf8');
 const success=html.slice(html.indexOf('if (allowedPasswordHashes.has(passwordHash))'),html.indexOf('rejectAccess("password not recognised")'));
 assert.ok(success.indexOf('}, 700);')<success.indexOf('fetch('));
 assert.ok(!success.includes('await fetch'));assert.match(success,/keepalive: true/);
 report.checks.push('The existing 700ms navigation timer starts before the background fetch and never awaits it');
 report.passed=true;
}finally{php.exit();}
console.log(JSON.stringify(report,null,2));
