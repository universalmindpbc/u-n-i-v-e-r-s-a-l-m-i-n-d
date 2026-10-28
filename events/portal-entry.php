<?php
declare(strict_types=1);
require_once __DIR__ . '/access.php';
header('Content-Type: application/json');

function directory_entry_response(int $status, bool $granted = false): void {
    http_response_code($status);
    echo json_encode(['granted' => $granted]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    directory_entry_response(405);
}
$host = (string) ($_SERVER['HTTP_HOST'] ?? '');
if (!in_array($host, ['staging.universalmind.tv', 'universalmind.tv', 'www.universalmind.tv'], true)
    || ($_SERVER['HTTP_ORIGIN'] ?? '') !== 'https://' . $host
    || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') !== 'same-origin') {
    directory_entry_response(403);
}
if (strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0])) !== 'application/json') {
    directory_entry_response(415);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 2048) directory_entry_response(413);
if (($_SESSION['retry_after'] ?? 0) > time()) directory_entry_response(429);

try {
    $raw = file_get_contents('php://input', false, null, 0, 2049);
    if (!is_string($raw) || strlen($raw) > 2048) directory_entry_response(413);
    $input = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($input) || !is_string($input['password'] ?? null)) directory_entry_response(400);
    if (!events_password_valid($input['password'])) {
        $_SESSION['failures'] = ($_SESSION['failures'] ?? 0) + 1;
        if ($_SESSION['failures'] >= 5) $_SESSION['retry_after'] = time() + 60;
        directory_entry_response(401);
    }
    // Reuse the existing protected Events session; no credential is stored.
    session_regenerate_id(true);
    $_SESSION['events_until'] = time() + 8 * 3600;
    unset($_SESSION['failures'], $_SESSION['retry_after']);
    directory_entry_response(200, true);
} catch (JsonException $error) {
    directory_entry_response(400);
} catch (Throwable $error) {
    directory_entry_response(503);
}
