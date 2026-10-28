<?php
require_once __DIR__.'/gate.php';
patent_require_auth();
$path=__DIR__.'/.private/receipt.jpg';
if(!is_file($path)){http_response_code(404);exit('Receipt unavailable.');}
header('Content-Type: image/jpeg');
header('Content-Disposition: inline; filename="IP-Australia-2026908928-receipt-excerpt.jpg"');
header('Content-Length: '.filesize($path));
readfile($path);
