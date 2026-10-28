<?php
require_once __DIR__.'/gate.php';patent_require_auth();
$f=__DIR__.'/.private/specification.pdf';
if(!is_file($f)){http_response_code(503);exit('Document unavailable.');}
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="Australian-Provisional-Specification.pdf"');
header('Content-Length: '.filesize($f));
readfile($f);
