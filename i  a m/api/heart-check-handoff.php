<?php
declare(strict_types=1);

require_once __DIR__ . '/heart-check-handoff-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function iam_heart_check_handoff_respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    iam_heart_check_handoff_respond(405, ['error' => 'method_not_allowed']);
}

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$origin = strtolower(rtrim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''), '/'));
if (
    $host === ''
    || preg_match('/^[a-z0-9.-]+(?::\d{1,5})?$/D', $host) !== 1
    || $origin === ''
    || !hash_equals('https://' . $host, $origin)
) {
    iam_heart_check_handoff_respond(403, ['error' => 'same_origin_required']);
}

$fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if ($fetchSite !== '' && $fetchSite !== 'same-origin') {
    iam_heart_check_handoff_respond(403, ['error' => 'same_origin_required']);
}

$contentType = strtolower(trim((string) ($_SERVER['CONTENT_TYPE'] ?? '')));
if (preg_match('/^application\/json(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/D', $contentType) !== 1) {
    iam_heart_check_handoff_respond(415, ['error' => 'application_json_required']);
}

$rawBody = file_get_contents('php://input');
if (!is_string($rawBody) || $rawBody === '' || strlen($rawBody) > 4096) {
    iam_heart_check_handoff_respond(400, ['error' => 'invalid_request']);
}

$body = json_decode($rawBody, true);
if (!is_array($body) || !iam_heart_check_handoff_has_exact_keys($body, ['checkin', 'momentary_physiology'])) {
    iam_heart_check_handoff_respond(400, ['error' => 'invalid_request']);
}

$checkin = iam_heart_check_handoff_normalize_checkin($body['checkin'] ?? null);
$physiology = iam_heart_check_handoff_validate_physiology($body['momentary_physiology'] ?? null);
if ($checkin === null || $physiology === null) {
    iam_heart_check_handoff_respond(400, ['error' => 'invalid_request']);
}

$key = null;
try {
    $key = iam_heart_check_handoff_key();
} catch (Throwable $exception) {
    $key = null;
}
if ($key === null) {
    iam_heart_check_handoff_respond(503, ['error' => 'handoff_unavailable']);
}

$issuedAt = time();
$identifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, null, $issuedAt);
if ($identifier === null) {
    iam_heart_check_handoff_respond(503, ['error' => 'handoff_unavailable']);
}

if (!iam_heart_check_handoff_set_cookie($identifier, $issuedAt + IAM_HEART_CHECK_HANDOFF_TTL_SECONDS)) {
    iam_heart_check_handoff_take_record($identifier, iam_heart_check_handoff_storage_directory());
    iam_heart_check_handoff_respond(503, ['error' => 'handoff_unavailable']);
}

iam_heart_check_handoff_respond(202, ['accepted' => true]);
