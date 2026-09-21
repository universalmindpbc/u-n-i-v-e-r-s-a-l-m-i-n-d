<?php
declare(strict_types=1);
require_once __DIR__ . '/api/study-lib.php';
header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow');
if (!study_staging()) { http_response_code(404); exit('Not found.'); }
define('IAM_STUDY_ENDING_TEST', true);
require __DIR__ . '/study.php';
