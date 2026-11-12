<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(array $body,int $code=200): never {http_response_code($code);echo json_encode($body);exit;}
$host=strtolower(explode(':',$_SERVER['HTTP_HOST']??'')[0]);
if(!in_array($host,['staging.universalmind.tv','universalmind.tv'],true)||($_SERVER['REQUEST_METHOD']??'')!=='POST')respond(['error'=>'Not available.'],404);
$private=rtrim($_SERVER['DOCUMENT_ROOT'],'/').'/vogue/iam/api/.runtime-private';
$config=json_decode((string)@file_get_contents($private.'/informatics-astra.json'),true);
if(!is_string($config['secret']??null)||strlen($config['secret'])<48)respond(['error'=>'Notification service unavailable.'],503);
$raw=file_get_contents('php://input',false,null,0,4097);
if(strlen($raw)>4096||!hash_equals(hash_hmac('sha256',$raw,$config['secret']),$_SERVER['HTTP_X_STUDY_SIGNATURE']??''))respond(['error'=>'Notification authentication required.'],403);
$data=json_decode($raw,true);
if(($data['purpose']??'')!=='quantum-study-ready-v1'||abs(time()-($data['timestamp']??0))>120||!preg_match('/^[a-f0-9-]{36}$/',$data['eventId']??'')||!preg_match('/^[a-f0-9-]{36}$/',$data['studyId']??'')||!preg_match('/^[a-f0-9]{64}$/',$data['token']??'')||!filter_var($data['email']??'',FILTER_VALIDATE_EMAIL)||strlen($data['email'])>254)respond(['error'=>'Invalid notification.'],400);
$file=$private.'/study-mail-'.$data['eventId'].'.json';$handle=@fopen($file,'c+');
if(!$handle||!flock($handle,LOCK_EX))respond(['error'=>'Notification storage unavailable.'],503);
@chmod($file,0600);$record=json_decode(stream_get_contents($handle),true);
if(($record['accepted']??false)===true){flock($handle,LOCK_UN);fclose($handle);respond(['accepted'=>true]);}
$resultOrigin=$data['resultOrigin']??'https://'.$host;
if(!in_array($resultOrigin,['https://staging.universalmind.tv','https://universalmind.tv'],true))respond(['error'=>'Invalid results destination.'],400);
$link=$resultOrigin.'/informatics/quantum/#study='.$data['studyId'].'&result='.$data['token'];
$message="Your Quantum Agents findings are ready.\n\nRead your study:\n".$link."\n\nThis private, read-only link expires in 30 days. Anyone with the link can read this study.\n\nYou requested this notification on Universal Informatics. No new study is started by opening the link.\n\nUniversal Informatics\nhttps://universalmind.tv/informatics/\n";
$accepted=@mail($data['email'],'Your Quantum Agents findings are ready',$message,['From'=>'Universal Informatics <notifications@universalmind.tv>','Content-Type'=>'text/plain; charset=UTF-8','MIME-Version'=>'1.0','Message-ID'=>'<'.$data['eventId'].'@universalmind.tv>']);
if($accepted){rewind($handle);ftruncate($handle,0);fwrite($handle,json_encode(['accepted'=>true,'at'=>gmdate('c')]));fflush($handle);}
flock($handle,LOCK_UN);fclose($handle);
respond(['accepted'=>$accepted],$accepted?200:503);
