<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

echo json_encode([
    'ok' => true,
    'clock_version' => 'broadcast_clock_v1.0',
    'server_now_ms' => (int) round(microtime(true) * 1000),
    'server_now_utc' => gmdate('Y-m-d\TH:i:s.v\Z'),
], JSON_UNESCAPED_SLASHES);
