<?php
declare(strict_types=1);

require_once __DIR__ . '/happiness-apple-lib.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function apple_service_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function apple_service_ledger(): array
{
    $ledger = json_decode((string) @file_get_contents(dirname(__DIR__) . '/api/happiness-ledger.json'), true);
    if (!is_array($ledger)) apple_service_json(['error' => 'ledger_unavailable'], 503);
    return $ledger;
}

function apple_service_authorized(array $ledger): bool
{
    $authorization = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    return hash_equals('ApplePass ' . happiness_apple_auth_token($ledger), $authorization);
}

$route = (string) ($_GET['route'] ?? '');
$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
$ledger = apple_service_ledger();

if ($route === 'log' && $method === 'POST') {
    http_response_code(200);
    exit;
}

if (!apple_service_authorized($ledger)) apple_service_json(['error' => 'not_authorized'], 401);

if ($route === 'register' && in_array($method, ['POST', 'DELETE'], true)) {
    $device = (string) ($_GET['device'] ?? '');
    $serial = (string) ($_GET['serial'] ?? '');
    if ($serial !== $ledger['member']['pass_serial'] || !preg_match('/^[A-Za-z0-9._-]{8,256}$/', $device)) {
        apple_service_json(['error' => 'registration_invalid'], 400);
    }
    $registrations = happiness_apple_registrations();
    $key = hash('sha256', $device . ':' . $serial);
    $exists = isset($registrations['devices'][$key]);
    if ($method === 'DELETE') {
        unset($registrations['devices'][$key]);
        happiness_apple_write_registrations($registrations);
        http_response_code(200);
        exit;
    }
    $body = json_decode((string) file_get_contents('php://input'), true);
    $pushToken = is_array($body) ? ($body['pushToken'] ?? '') : '';
    if (!is_string($pushToken) || !preg_match('/^[a-f0-9]{32,256}$/i', $pushToken)) apple_service_json(['error' => 'push_token_invalid'], 400);
    $registrations['devices'][$key] = ['device' => $device, 'serial' => $serial, 'push_token' => $pushToken, 'registered_at' => gmdate('c')];
    happiness_apple_write_registrations($registrations);
    http_response_code($exists ? 200 : 201);
    exit;
}

if ($route === 'serials' && $method === 'GET') {
    $updatedSince = (string) ($_GET['passesUpdatedSince'] ?? '');
    $updatedAt = (string) ($ledger['updated_at'] ?? gmdate('c'));
    $serials = ($updatedSince === '' || strtotime($updatedAt) > (int) $updatedSince) ? [$ledger['member']['pass_serial']] : [];
    apple_service_json(['serialNumbers' => $serials, 'lastUpdated' => (string) strtotime($updatedAt)]);
}

if ($route === 'pass' && $method === 'GET') {
    if ((string) ($_GET['serial'] ?? '') !== $ledger['member']['pass_serial']) apple_service_json(['error' => 'pass_not_found'], 404);
    require __DIR__ . '/pass.php';
    exit;
}

apple_service_json(['error' => 'not_found'], 404);
