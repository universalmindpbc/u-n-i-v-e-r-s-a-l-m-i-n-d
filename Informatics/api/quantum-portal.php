<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function portal_reply(array $data,int $status=200): never {http_response_code($status);echo json_encode($data);exit;}
$host=strtolower(explode(':',$_SERVER['HTTP_HOST']??'')[0]);
if(!in_array($host,['staging.universalmind.tv','universalmind.tv'],true))portal_reply(['error'=>'Portal access is unavailable on this host.'],404);
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'||($_SERVER['HTTP_ORIGIN']??'')!=='https://'.$host)portal_reply(['error'=>'Open portal access on Quantum Atlas.'],403);
$root=rtrim($_SERVER['DOCUMENT_ROOT'],'/');$private=$root.'/vogue/iam/api/.runtime-private';
$config=json_decode((string)@file_get_contents($private.'/informatics-astra.json'),true);
if(!is_string($config['secret']??null)||strlen($config['secret'])<48)portal_reply(['error'=>'Portal verification is temporarily unavailable.'],503);
$raw=file_get_contents('php://input',false,null,0,2049);
if(strlen($raw)>2048)portal_reply(['error'=>'Enter your I AM portal password.'],400);
$data=json_decode($raw,true);$password=$data['password']??null;
if(!is_string($password)||strlen($password)>512||$password==='')portal_reply(['error'=>'Enter your I AM portal password.'],400);
// Throttle every attempt, including successful logins. Never store the password.
$path=$private.'/quantum-portal-rate-'.hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'unknown',$config['secret']).'.json';
$lock=@fopen($path,'c+');if(!$lock||!flock($lock,LOCK_EX))portal_reply(['error'=>'Portal verification is temporarily unavailable.'],503);
@chmod($path,0600);$rate=json_decode(stream_get_contents($lock),true)??['start'=>time(),'count'=>0];
if(time()-($rate['start']??0)>900)$rate=['start'=>time(),'count'=>0];
if(($rate['count']??0)>=10){flock($lock,LOCK_UN);fclose($lock);portal_reply(['error'=>'Please wait 15 minutes before another portal sign-in attempt.'],429);}
$rate['count']++;rewind($lock);ftruncate($lock,0);fwrite($lock,json_encode($rate));fflush($lock);flock($lock,LOCK_UN);fclose($lock);
require_once $root.'/vogue/iam/api/sovereignty-lib.php';
$digest=sovereignty_password_digest($password);unset($password,$data,$raw);
if($digest===null)portal_reply(['error'=>'That portal password was not recognised.'],403);
$code=hash_hmac('sha256','quantum-portal-credit-v1:'.$digest,$config['secret']);
$b64=fn(string $s)=>rtrim(strtr(base64_encode($s),'+/','-_'),'=');
$claims=$b64(json_encode(['scope'=>'quantum-demo','code'=>$code,'aud'=>'https://'.$host,'exp'=>time()+43200]));
portal_reply(['token'=>$claims.'.'.$b64(hash_hmac('sha256',$claims,$config['secret'],true)),'expiresAt'=>gmdate('c',time()+43200)]);
