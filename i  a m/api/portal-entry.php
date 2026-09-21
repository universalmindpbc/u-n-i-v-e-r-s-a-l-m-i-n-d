<?php
declare(strict_types=1);
require_once __DIR__ . '/sovereignty-lib.php';
header('Content-Type: application/json');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

function portal_entry_response(int $status): void {
    http_response_code($status);
    // Public responses deliberately reveal neither membership nor archive state.
    echo $status === 202 ? '{"accepted":true}' : '{"accepted":false}';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); portal_entry_response(405); }
$host = (string) ($_SERVER['HTTP_HOST'] ?? '');
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if (!in_array($host, ['staging.universalmind.tv', 'universalmind.tv', 'www.universalmind.tv'], true)
    || $origin !== 'https://' . $host
    || (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') !== 'same-origin')) portal_entry_response(403);
if (strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0])) !== 'application/json') portal_entry_response(415);
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 2048) portal_entry_response(413);
try {
    $raw = file_get_contents('php://input', false, null, 0, 2049);
    if (!is_string($raw) || strlen($raw) > 2048) portal_entry_response(413);
    $input = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($input) || !is_string($input['password'] ?? null)) portal_entry_response(400);
    $config = sovereignty_config();
    $expected = $host === 'staging.universalmind.tv' ? 'staging' : 'production';
    if ($config['environment'] !== $expected) portal_entry_response(503);
    sovereignty_record($input['password'], $config);
    portal_entry_response(202);
} catch (InvalidArgumentException $error) { portal_entry_response(401);
} catch (JsonException $error) { portal_entry_response(400);
} catch (Throwable $error) { portal_entry_response(503); }
