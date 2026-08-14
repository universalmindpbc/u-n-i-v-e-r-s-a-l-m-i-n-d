<?php
declare(strict_types=1);

require_once __DIR__ . '/heart-check-handoff-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$body = file_get_contents('php://input');
if ($body === false || $body === '' || strlen($body) > 65536) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request.']);
    exit;
}

$decodedBody = json_decode($body, true);
$checkin = is_array($decodedBody) && is_string($decodedBody['checkin'] ?? null)
    ? $decodedBody['checkin']
    : null;
$handoffIdentifier = $_COOKIE[IAM_HEART_CHECK_HANDOFF_COOKIE] ?? null;
$momentaryPhysiology = null;

if (is_string($handoffIdentifier) && $handoffIdentifier !== '') {
    iam_heart_check_handoff_expire_cookie();
    $handoffKey = null;
    try {
        $handoffKey = iam_heart_check_handoff_key();
    } catch (Throwable $exception) {
        $handoffKey = null;
    }
    $momentaryPhysiology = iam_heart_check_handoff_consume(
        $handoffIdentifier,
        $checkin,
        $handoffKey
    );
} else {
    iam_heart_check_handoff_purge_expired(iam_heart_check_handoff_storage_directory());
}

$body = iam_heart_check_handoff_prepare_worker_body($body, $momentaryPhysiology);

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$isStaging = str_starts_with($host, 'staging.universalmind.tv');
$endpoint = $isStaging
    ? 'https://realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/citizen-needs-inference'
    : 'https://iam-citizen-needs-inference.universalmind.workers.dev/citizen-needs-inference';

if (function_exists('curl_init')) {
    $curl = curl_init($endpoint);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60,
    ]);

    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    if ($response === false || $status < 100) {
        http_response_code(502);
        echo json_encode(['error' => 'The inference engine is unavailable.']);
        exit;
    }

    http_response_code($status);
    echo $response;
    exit;
}

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $body,
        'ignore_errors' => true,
        'timeout' => 60,
    ],
]);
$response = file_get_contents($endpoint, false, $context);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'The inference engine is unavailable.']);
    exit;
}

$status = 200;
foreach ($http_response_header ?? [] as $header) {
    if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches) === 1) {
        $status = (int) $matches[1];
    }
}

http_response_code($status);
echo $response;
