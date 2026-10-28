<?php
declare(strict_types=1);
header('Cache-Control: no-store, private, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src 'self'; connect-src 'self' https://informatics-universal-one-staging.universalmind.workers.dev https://api.openai.com; media-src 'self' blob:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
if (strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]) !== 'staging.universalmind.tv') {
    http_response_code(404); exit('Unavailable.');
}
function patent_config(): array {
    $r=json_decode((string)@file_get_contents(__DIR__.'/.private/access.json'),true);
    return is_array($r) && preg_match('/\A[a-f0-9]{64}\z/',(string)($r['key_hash']??'')) ? $r : [];
}
function patent_session(): void {
    if(session_status()===PHP_SESSION_ACTIVE)return;
    ini_set('session.use_strict_mode','1');
    session_name('um_patent_private');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/patent/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
    session_start();
}
function patent_authenticated(): bool {
    patent_session();$cfg=patent_config();
    return isset($cfg['key_hash']) && hash_equals($cfg['key_hash'],(string)($_SESSION['patent_revision']??''))
        && (int)($_SESSION['patent_until']??0)>time();
}
function patent_require_auth(): void {
    if(!patent_authenticated()){
        http_response_code(401);header('Content-Type: application/json');
        echo json_encode(['error'=>'Private access is required.']);exit;
    }
}
function patent_same_origin(): bool {
    return ($_SERVER['HTTP_ORIGIN']??'')==='https://staging.universalmind.tv';
}
