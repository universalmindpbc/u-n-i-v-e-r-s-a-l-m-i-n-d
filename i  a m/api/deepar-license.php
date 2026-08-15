<?php
declare(strict_types=1);

if (!function_exists('happiness_secret')) {
    require_once __DIR__ . '/happiness-secret-store.php';
}

function deepar_web_key(): string
{
    $environment = getenv('DEEPAR_WEB_KEY');
    if (is_string($environment) && trim($environment) !== '') {
        return trim($environment);
    }

    $server = $_SERVER['DEEPAR_WEB_KEY'] ?? '';
    if (is_string($server) && trim($server) !== '') {
        return trim($server);
    }

    $environmentArray = $_ENV['DEEPAR_WEB_KEY'] ?? '';
    if (is_string($environmentArray) && trim($environmentArray) !== '') {
        return trim($environmentArray);
    }

    return trim(happiness_secret('DEEPAR_WEB_KEY'));
}

function deepar_require_web_key(): string
{
    $webKey = deepar_web_key();
    if ($webKey === '') {
        throw new RuntimeException('deepar_web_key_missing');
    }
    return $webKey;
}

if (defined('IAM_DEEPAR_LICENSE_LIBRARY_ONLY') && IAM_DEEPAR_LICENSE_LIBRARY_ONLY === true) {
    return;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
header('Cross-Origin-Resource-Policy: same-origin');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');

function deepar_respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    deepar_respond(405, ['error' => 'Method not allowed.']);
}

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$requestHost = strtolower((string) preg_replace('/:\d+$/', '', $host));
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$originHost = $origin !== '' ? strtolower((string) parse_url($origin, PHP_URL_HOST)) : '';
if ($originHost !== '' && !hash_equals($requestHost, $originHost)) {
    deepar_respond(403, ['error' => 'Cross-origin requests are not allowed.']);
}

$fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'same-site', 'none'], true)) {
    deepar_respond(403, ['error' => 'Cross-site requests are not allowed.']);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 128) {
    deepar_respond(400, ['error' => 'Invalid request.']);
}
if ($rawBody !== '' && !is_array(json_decode($rawBody, true))) {
    deepar_respond(400, ['error' => 'Invalid JSON request.']);
}

try {
    $webKey = deepar_require_web_key();
} catch (RuntimeException $exception) {
    deepar_respond(503, ['error' => 'Bright Glasses is not configured on this environment yet.']);
}

deepar_respond(200, ['license_key' => $webKey]);
