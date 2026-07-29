<?php
declare(strict_types=1);

$filename = (isset($_GET['balance']) && $_GET['balance'] === '25')
    ? 'HAPPINESS-DEMO-25.pkpass'
    : 'HAPPINESS.pkpass';
$path = __DIR__ . DIRECTORY_SEPARATOR . $filename;

if (!is_file($path) || !is_readable($path)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'happiness_pass_unavailable']);
    exit;
}

header('Content-Type: application/vnd.apple.pkpass');
header('Content-Disposition: attachment; filename="HAPPINESS.pkpass"');
header('Content-Length: ' . (string) filesize($path));
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
readfile($path);
