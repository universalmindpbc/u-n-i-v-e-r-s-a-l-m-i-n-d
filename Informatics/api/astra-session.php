<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function reply(array $body, int $status=200): never {http_response_code($status);echo json_encode($body);exit;}
$host=strtolower(explode(':',$_SERVER['HTTP_HOST']??'')[0]);
if ($host!=='staging.universalmind.tv') reply(['error'=>'Owner research access is enabled on staging.'],404);
if ($_SERVER['REQUEST_METHOD']!=='POST'||($_SERVER['HTTP_ORIGIN']??'')!=='https://'.$host) reply(['error'=>'A same-origin sign-in is required.'],403);
$root=rtrim($_SERVER['DOCUMENT_ROOT'],'/');
const QUANTUM_TREE_OWNER_KEY_HASH='e6a9c12b1512ebc1790482dbb21854d33e4217fdcabb1e49412de6f1309d690a';
require_once $root.'/vogue/iam/api/quantum-tree-owner-password.php';
$private=$root.'/vogue/iam/api/.runtime-private';
$config=json_decode((string)@file_get_contents($private.'/informatics-astra.json'),true);
if (!is_string($config['secret']??null)||strlen($config['secret'])<48) reply(['error'=>'Owner research access is awaiting configuration.'],503);
$body=json_decode(file_get_contents('php://input',false,null,0,4096),true);
$password=$body['password']??'';
if (!is_string($password)||strlen($password)>256) reply(['error'=>'Enter your existing I AM owner password.'],400);
// A shared IP record bounds failed attempts across fresh sessions.
$path=$private.'/astra-login-'.hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown').'.json';
$f=@fopen($path,'c+');if(!$f||!flock($f,LOCK_EX))reply(['error'=>'Sign-in storage unavailable.'],503);
@chmod($path,0600);$record=json_decode(stream_get_contents($f),true)??['start'=>time(),'attempts'=>0];
if(time()-($record['start']??0)>1800)$record=['start'=>time(),'attempts'=>0];
if($record['attempts']>=10){flock($f,LOCK_UN);fclose($f);reply(['error'=>'Please wait 30 minutes before another sign-in attempt.'],429);}
$valid=quantum_tree_password_valid($password,quantum_tree_owner_credentials());
$record['attempts']=$valid?0:$record['attempts']+1;rewind($f);ftruncate($f,0);fwrite($f,json_encode($record));fflush($f);flock($f,LOCK_UN);fclose($f);
if(!$valid)reply(['error'=>'The owner password did not match.'],401);
$base64=fn(string $v)=>rtrim(strtr(base64_encode($v),'+/','-_'),'=');
$payload=$base64(json_encode(['scope'=>'astra-owner','aud'=>'https://'.$host,'exp'=>time()+43200,'nonce'=>bin2hex(random_bytes(12))]));
$token=$payload.'.'.$base64(hash_hmac('sha256',$payload,$config['secret'],true));
reply(['token'=>$token,'expiresAt'=>gmdate('c',time()+43200)]);
