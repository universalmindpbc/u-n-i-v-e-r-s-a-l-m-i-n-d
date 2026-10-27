<?php
require_once __DIR__.'/gate.php';
patent_session();
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD']!=='POST'||!patent_same_origin()){http_response_code(403);exit(json_encode(['error'=>'Open the private portal to sign in.']));}
$body=file_get_contents('php://input',false,null,0,4097);
if(strlen($body)>4096){http_response_code(413);exit(json_encode(['error'=>'Request too large.']));}
$input=json_decode($body,true)??[];
if(!hash_equals((string)($_SESSION['patent_csrf']??''),(string)($input['csrf']??''))||empty($_SESSION['patent_csrf'])){
    http_response_code(403);exit(json_encode(['error'=>'Refresh the page and try again.']));
}
if(($input['action']??'')==='logout'){$_SESSION=[];session_destroy();exit(json_encode(['ok'=>true]));}
$cfg=patent_config();
if(!$cfg){http_response_code(503);exit(json_encode(['error'=>'Private access is being prepared.']));}
$key=(string)($input['key']??'');
if(strlen($key)!==64||!hash_equals($cfg['key_hash'],hash('sha256',$key))){
    http_response_code(401);exit(json_encode(['error'=>'The access key is not valid.']));
}
session_regenerate_id(true);
$_SESSION['patent_revision']=$cfg['key_hash'];$_SESSION['patent_until']=time()+28800;
exit(json_encode(['ok'=>true]));
