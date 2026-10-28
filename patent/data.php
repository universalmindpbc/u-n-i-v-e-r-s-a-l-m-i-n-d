<?php
require_once __DIR__.'/gate.php';patent_require_auth();
header('Content-Type: application/json; charset=utf-8');
$f=__DIR__.'/.private/document.json';
if(!is_file($f)){http_response_code(503);exit(json_encode(['error'=>'The private document is being prepared.']));}
readfile($f);
