<?php
require_once __DIR__.'/gate.php';patent_require_auth();
$number=filter_input(INPUT_GET,'image',FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>91]]);
if(!$number){http_response_code(404);exit('Drawing unavailable.');}
$file=__DIR__.'/.private/drawings/image-'.$number.'.jpg';
if(!is_file($file)){http_response_code(404);exit('Drawing unavailable.');}
header('Content-Type: image/jpeg');header('Content-Length: '.filesize($file));readfile($file);
