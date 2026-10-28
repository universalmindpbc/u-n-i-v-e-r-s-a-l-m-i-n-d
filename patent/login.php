<?php
require_once __DIR__.'/gate.php';
patent_session();
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD']!=='POST'||!patent_same_origin()){http_response_code(403);exit(json_encode(['error'=>'Open the private portal to sign in.']));}
$body=file_get_contents('php://input',false,null,0,4097);
if(strlen($body)>4096){http_response_code(413);exit(json_encode(['error'=>'Request too large.']));}
$input=json_decode($body,true)??[];
if(!is_array($input)||!is_string($input['csrf']??null)){http_response_code(400);exit(json_encode(['error'=>'Invalid sign-in request.']));}
if(!hash_equals((string)($_SESSION['patent_csrf']??''),(string)($input['csrf']??''))||empty($_SESSION['patent_csrf'])){
    http_response_code(403);exit(json_encode(['error'=>'Refresh the page and try again.']));
}
if(($input['action']??'')==='logout'){$_SESSION=[];session_destroy();exit(json_encode(['ok'=>true]));}
if(!patent_password_hashes()){http_response_code(503);exit(json_encode(['error'=>'I AM access is temporarily unavailable.']));}
if(!is_string($input['password']??null)){http_response_code(401);exit(json_encode(['error'=>'Enter your I AM portal password.']));}
// Match the I AM portal's JavaScript trim(), including surrounding Unicode spaces.
$password=preg_replace('/\A[\s\x{FEFF}]+|[\s\x{FEFF}]+\z/u','',$input['password']);
$digest=hash('sha256',$password??'');
if(!$password||!patent_digest_allowed($digest)){
    http_response_code(401);exit(json_encode(['error'=>'The I AM portal password is not recognised.']));
}
session_regenerate_id(true);
unset($_SESSION['patent_revision']);
$_SESSION['patent_iam_digest']=$digest;$_SESSION['patent_until']=time()+28800;
exit(json_encode(['ok'=>true]));
