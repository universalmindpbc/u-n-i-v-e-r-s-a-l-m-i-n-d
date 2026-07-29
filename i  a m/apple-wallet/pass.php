<?php
declare(strict_types=1);

require_once __DIR__ . '/happiness-apple-lib.php';

$ledgerPath = dirname(__DIR__) . '/api/happiness-ledger.json';
$ledger = json_decode((string) @file_get_contents($ledgerPath), true);
$path = __DIR__ . '/HAPPINESS.pkpass';
if (is_array($ledger) && happiness_apple_ready()) {
    try {
        $path = happiness_apple_build_pass($ledger);
    } catch (Throwable $error) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $error->getMessage()]);
        exit;
    }
}

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
if (str_starts_with($path, sys_get_temp_dir() . '/happiness-pass-')) {
    $directory = dirname($path);
    foreach (glob($directory . '/*') ?: [] as $file) @unlink($file);
    @rmdir($directory);
}
