<?php
require_once __DIR__.'/gate.php';patent_require_auth();
header('Content-Type: application/json; charset=utf-8');
$file=__DIR__.'/.private/chapters.json';
if(!is_file($file)){http_response_code(503);echo json_encode(['error'=>'The chapters are temporarily unavailable.']);exit;}
readfile($file);
