<?php
require_once __DIR__.'/gate.php';
patent_require_auth();
$format=$_GET['format']??'image';
if(!is_string($format)||!in_array($format,['image','pdf'],true)){
    http_response_code(400);exit('Invalid filing notice format.');
}
$pdf=$format==='pdf';
$name=$pdf?'filing-notice.pdf':'filing-notice-page-1.jpg';
$path=__DIR__.'/.private/'.$name;
if(!is_file($path)){http_response_code(404);exit('Filing notice unavailable.');}
header('Content-Type: '.($pdf?'application/pdf':'image/jpeg'));
header('Content-Disposition: inline; filename="IP-Australia-2026908928-'.$name.'"');
header('Content-Length: '.filesize($path));
readfile($path);
