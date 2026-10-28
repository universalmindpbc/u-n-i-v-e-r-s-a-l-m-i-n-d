<?php
declare(strict_types=1);
$patentHosts=['staging.universalmind.tv'=>['https://staging.universalmind.tv','https://informatics-universal-one-staging.universalmind.workers.dev'],'universalmind.tv'=>['https://universalmind.tv','https://informatics-universal-one.universalmind.workers.dev']];
$patentHost=strtolower(explode(':',$_SERVER['HTTP_HOST']??'')[0]);
if(!isset($patentHosts[$patentHost])){http_response_code(404);exit('Unavailable.');}
define('PATENT_ORIGIN',$patentHosts[$patentHost][0]);
define('PATENT_SERVICE_ORIGIN',$patentHosts[$patentHost][1]);
function patent_origin(): string {return PATENT_ORIGIN;}
function patent_service_origin(): string {return PATENT_SERVICE_ORIGIN;}
header('Cache-Control: no-store, private, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src 'self'; connect-src 'self' ".patent_service_origin()." https://api.openai.com; media-src 'self' blob:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
function patent_password_hashes(): array {
    // Read the live I AM access list so password additions and removals stay aligned.
    static $hashes = null;
    if ($hashes !== null) return $hashes;
    $hashes = [];
    $source = @file_get_contents(dirname(__DIR__).'/index.html');
    if (!is_string($source) || !preg_match('/const\s+allowedPasswordHashes\s*=\s*new\s+Set\s*\(\s*\[([\s\S]*?)\]\s*\)/', $source, $block)) return $hashes;
    preg_match_all('/[\"\']([a-f0-9]{64})[\"\']/', $block[1], $matches);
    $hashes = array_values(array_unique($matches[1]));
    return $hashes;
}
function patent_digest_allowed(string $digest): bool {
    foreach (patent_password_hashes() as $hash) {
        if (hash_equals($hash, $digest)) return true;
    }
    return false;
}
function patent_session(): void {
    if(session_status()===PHP_SESSION_ACTIVE)return;
    ini_set('session.use_strict_mode','1');
    ini_set('session.use_only_cookies','1');
    session_name('um_patent_private');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/patent/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
    session_start();
}
function patent_authenticated(): bool {
    patent_session();
    return patent_digest_allowed((string)($_SESSION['patent_iam_digest']??''))
        && (int)($_SESSION['patent_until']??0)>time();
}
function patent_require_auth(): void {
    if(!patent_authenticated()){
        http_response_code(401);header('Content-Type: application/json');
        echo json_encode(['error'=>'Private access is required.']);exit;
    }
}
function patent_same_origin(): bool {
    return ($_SERVER['HTTP_ORIGIN']??'')===patent_origin();
}
