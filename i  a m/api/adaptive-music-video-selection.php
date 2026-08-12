<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$rawBody = file_get_contents('php://input');
$request = json_decode($rawBody ?: '', true);
if (!is_array($request)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON request.']);
    exit;
}

$inference = $request['v555_payload'] ?? $request['v445_payload'] ?? $request['v444_payload'] ?? $request['inference'] ?? $request;
if (!is_array($inference)) {
    http_response_code(400);
    echo json_encode(['error' => 'A v5.55 inference payload is required.']);
    exit;
}

$selector = dirname(__DIR__) . '/selector_core.py';
$pythonCandidates = ['/usr/bin/python3', '/usr/local/bin/python3', 'python3'];
$process = false;
$pipes = [];

foreach ($pythonCandidates as $python) {
    $command = escapeshellarg($python) . ' ' . escapeshellarg($selector) . ' --stdin';
    $process = @proc_open($command, [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes, dirname(__DIR__));
    if (is_resource($process)) {
        break;
    }
}

if (!is_resource($process)) {
    http_response_code(503);
    echo json_encode(['error' => 'The adaptive music selector is unavailable.']);
    exit;
}

fwrite($pipes[0], json_encode($inference, JSON_UNESCAPED_SLASHES));
fclose($pipes[0]);
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$exitCode = proc_close($process);

$selection = json_decode(trim($stdout), true);
if ($exitCode !== 0 || !is_array($selection)) {
    http_response_code(502);
    echo json_encode([
        'error' => 'The adaptive music selector did not return a valid recommendation.',
        'selector_detail' => trim($stderr),
    ]);
    exit;
}

echo json_encode($selection, JSON_UNESCAPED_SLASHES);
