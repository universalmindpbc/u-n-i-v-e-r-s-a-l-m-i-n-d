import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const modules=process.env.PHP_WASM_MODULE_DIR;
const {PHP}=await import(path.join(modules,'@php-wasm/universal/index.js'));
const {loadNodeRuntime}=await import(path.join(modules,'@php-wasm/node/index.js'));
const php=new PHP(await loadNodeRuntime('8.3',{emscriptenOptions:{processId:1}}));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try {
 php.mkdir('/reward');php.writeFile('/reward/study-rewards.php',await fs.readFile(path.join(root,'i  a m/api/study-rewards.php'),'utf8'));
 php.writeFile('/reward/happiness-automation.php',`<?php
 function happiness_environment_ready(){return ['ready'=>true];}
 function happiness_circle_submit($pending){$GLOBALS['submitted'][]=$pending;if(count($GLOBALS['submitted'])===1)throw new RuntimeException('uncertain transport');return ['id'=>'tx-'.$pending['action'],'state'=>'INITIATED'];}
 function happiness_circle_transaction($id){return ['id'=>$id,'state'=>'CONFIRMED','txHash'=>'0x'.str_repeat('a',64)];}
 `);
 const result=await php.run({code:`<?php
 function study_require($v,$m){if(!$v)throw new InvalidArgumentException($m);}
 function study_earned($p){return 100.0;}
 require '/reward/study-rewards.php';
 $p=['reward'=>study_reward_new(),'payments'=>[]];
 $blocked=false;try{study_reward_sync_token($p);}catch(InvalidArgumentException $e){$blocked=true;}
 $p['reward']['wallet_address']='0x'.str_repeat('b',40);
 $one=study_reward_sync_token($p);$two=study_reward_sync_token($p);$three=study_reward_sync_token($p);$again=study_reward_sync_token($p);
 $p['payments']=[['amount_aud'=>100]];
 $redeem=study_reward_sync_token($p);$redeemed=study_reward_sync_token($p);$final=study_reward_sync_token($p);
 echo json_encode(['blocked'=>$blocked,'one'=>$one,'two'=>$two,'three'=>$three,'again'=>$again,'redeem'=>$redeem,'redeemed'=>$redeemed,'final'=>$final,'submitted'=>$GLOBALS['submitted']]);
 `});
 assert.equal(result.errors,'');const r=JSON.parse(result.text);
 assert.equal(r.blocked,true);assert.match(r.one.reward.token_issue.error,/retry the same request/);
 assert.equal(r.two.reward.token_issue.state,'pending');assert.equal(r.three.reward.token_issue.state,'confirmed');
 assert.equal(r.submitted.length,3,'Confirmation retry must not issue or burn twice');
 assert.equal(r.submitted[0].idempotency_key,r.submitted[1].idempotency_key,'Uncertain requests need the identical idempotency key');
 assert.equal(r.submitted[0].operation_id,r.submitted[1].operation_id);
 assert.equal(r.submitted[0].address,'0x'+'b'.repeat(40));assert.equal(r.submitted[0].units,'100000000');
 assert.equal(r.submitted[2].action,'redeem');assert.notEqual(r.submitted[2].idempotency_key,r.submitted[1].idempotency_key);
 assert.equal(r.final.reward.token_redemption.state,'confirmed');assert.equal(r.final.reward.status,'paid');
 assert.equal(r.final.reward.token_issue.idempotency_key,undefined);
 console.log('Study ERC20 receipt adapter passed: explicit recipient, stable retry, confirmed-only state, one issue and one redemption. Transport mocked; no tokens transferred.');
} finally {php.exit();}
