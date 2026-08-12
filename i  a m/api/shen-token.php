<?php
declare(strict_types=1);

if (!function_exists('happiness_secret')) {
    require_once __DIR__ . '/happiness-secret-store.php';
}

function shen_admin_key(): string
{
    $environment = getenv('SHENAI_ADMIN_KEY');
    if (is_string($environment) && trim($environment) !== '') {
        return trim($environment);
    }

    $server = $_SERVER['SHENAI_ADMIN_KEY'] ?? '';
    if (is_string($server) && trim($server) !== '') {
        return trim($server);
    }

    $environmentArray = $_ENV['SHENAI_ADMIN_KEY'] ?? '';
    if (is_string($environmentArray) && trim($environmentArray) !== '') {
        return trim($environmentArray);
    }

    return trim(happiness_secret('SHENAI_ADMIN_KEY'));
}

function shen_require_admin_key(): string
{
    $adminKey = shen_admin_key();
    if ($adminKey === '') {
        throw new RuntimeException('shen_admin_key_missing');
    }
    return $adminKey;
}

if (defined('IAM_SHEN_TOKEN_LIBRARY_ONLY') && IAM_SHEN_TOKEN_LIBRARY_ONLY === true) {
    return;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Method not allowed.']);
}

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$requestHost = strtolower((string) preg_replace('/:\d+$/', '', $host));
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$originHost = $origin !== '' ? strtolower((string) parse_url($origin, PHP_URL_HOST)) : '';
if ($originHost !== '' && !hash_equals($requestHost, $originHost)) {
    respond(403, ['error' => 'Cross-origin requests are not allowed.']);
}

$fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'same-site', 'none'], true)) {
    respond(403, ['error' => 'Cross-site requests are not allowed.']);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 1024) {
    respond(400, ['error' => 'Invalid request.']);
}
if ($rawBody !== '' && !is_array(json_decode($rawBody, true))) {
    respond(400, ['error' => 'Invalid JSON request.']);
}

$remoteAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
$visitorHash = hash('sha256', $remoteAddress . '|' . $userAgent . '|' . $requestHost);
$rateFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'iam-shen-' . substr($visitorHash, 0, 24) . '.json';
$now = time();
$windowSeconds = 600;
$maxRequests = 6;
$rateHandle = @fopen($rateFile, 'c+');
if ($rateHandle !== false && flock($rateHandle, LOCK_EX)) {
    $existing = stream_get_contents($rateHandle);
    $timestamps = json_decode($existing ?: '[]', true);
    if (!is_array($timestamps)) $timestamps = [];
    $timestamps = array_values(array_filter(
        $timestamps,
        static fn ($value): bool => is_int($value) && $value > $now - $windowSeconds
    ));
    if (count($timestamps) >= $maxRequests) {
        flock($rateHandle, LOCK_UN);
        fclose($rateHandle);
        header('Retry-After: 600');
        respond(429, ['error' => 'Please wait before starting another heart-rate check.']);
    }
    $timestamps[] = $now;
    ftruncate($rateHandle, 0);
    rewind($rateHandle);
    fwrite($rateHandle, json_encode($timestamps));
    fflush($rateHandle);
    flock($rateHandle, LOCK_UN);
    fclose($rateHandle);
}

$adminKey = '';
try {
    $adminKey = shen_require_admin_key();
} catch (RuntimeException $exception) {
    respond(503, ['error' => 'The heart-rate check is not configured on this environment yet.']);
}

if (!function_exists('curl_init')) {
    respond(503, ['error' => 'The heart-rate check is unavailable right now.']);
}

$payload = json_encode([
    'expires_in' => 900,
    'max_measurements' => 1,
    'single_device' => true,
], JSON_UNESCAPED_SLASHES);

$curl = curl_init('https://api.shen.ai/v1/token');
if ($curl === false) {
    respond(503, ['error' => 'The heart-rate check is unavailable right now.']);
}
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $adminKey,
        'Content-Type: application/json',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
]);

$upstreamBody = curl_exec($curl);
$upstreamStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($curl);
curl_close($curl);

if ($upstreamBody === false || $upstreamStatus < 200 || $upstreamStatus >= 300) {
    error_log('Universal Mind Shen token error: status=' . $upstreamStatus . ' curl=' . $curlError);
    respond(502, ['error' => 'The heart-rate check is unavailable right now.']);
}

$upstream = json_decode($upstreamBody, true);
$token = is_array($upstream) ? trim((string) ($upstream['token'] ?? '')) : '';
if (!preg_match('/^sh_[a-f0-9]{32}$/i', $token)) {
    error_log('Universal Mind Shen token response did not contain a valid token.');
    respond(502, ['error' => 'The heart-rate check is unavailable right now.']);
}

respond(200, [
    'token' => $token,
    'expires_at' => (string) ($upstream['expires_at'] ?? ''),
]);
