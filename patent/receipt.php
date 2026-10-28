<?php
require_once __DIR__.'/gate.php';
patent_require_auth();
$path=__DIR__.'/.private/receipt.png';
if(!is_file($path)){http_response_code(404);exit('Receipt unavailable.');}
header('Content-Type: image/png');
header('Content-Disposition: inline; filename="IP-Australia-2026908928-receipt-excerpt.png"');
header('Content-Length: '.filesize($path));
readfile($path);
