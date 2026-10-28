<?php
require_once __DIR__.'/gate.php';patent_require_auth();
require_once __DIR__.'/knowledge.php';
header('Content-Type: application/json; charset=utf-8');
$drawings=patent_drawings();
if(count($drawings)!==91){http_response_code(503);echo json_encode(['error'=>'The drawing collection is temporarily unavailable.']);exit;}
echo json_encode(['drawings'=>$drawings],JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);
