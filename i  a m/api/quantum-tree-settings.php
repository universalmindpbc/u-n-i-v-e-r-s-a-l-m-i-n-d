<?php
declare(strict_types=1);

require_once __DIR__ . '/owner-state-history.php';

ini_set('serialize_precision', '-1');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const QUANTUM_TREE_DEFAULT_PEAK = 0.055;
const QUANTUM_TREE_OWNER_KEY_HASH = 'e6a9c12b1512ebc1790482dbb21854d33e4217fdcabb1e49412de6f1309d690a';
const QUANTUM_TREE_CONFIG_PATH = __DIR__ . '/quantum-tree-settings.json';

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function peak_decibels(float $peak): ?float
{
    return $peak > 0 ? round(20 * log10($peak), 1) : null;
}

function read_quantum_tree_config(): array
{
    $fallback = [
        'schema_version' => 1,
        'peak_volume' => QUANTUM_TREE_DEFAULT_PEAK,
        'mantra_enabled' => true,
        'updated_at' => null,
    ];

    $contents = @file_get_contents(QUANTUM_TREE_CONFIG_PATH);
    if ($contents === false || $contents === '') {
        return $fallback;
    }

    $config = json_decode($contents, true);
    if (!is_array($config)) {
        return $fallback;
    }

    $peak = filter_var($config['peak_volume'] ?? null, FILTER_VALIDATE_FLOAT);
    if ($peak === false || $peak < 0 || $peak > 1) {
        return $fallback;
    }

    return [
        'schema_version' => 1,
        'peak_volume' => round((float) $peak, 4),
        'mantra_enabled' => ($config['mantra_enabled'] ?? true) === true,
        'updated_at' => is_string($config['updated_at'] ?? null) ? $config['updated_at'] : null,
    ];
}

function public_quantum_tree_config(array $config, bool $authenticated = false): array
{
    $peak = (float) $config['peak_volume'];
    $response = [
        'schema_version' => 1,
        'peak_volume' => $peak,
        'peak_percent' => round($peak * 100, 1),
        'mantra_enabled' => $config['mantra_enabled'],
        'mantra_gain_ratio' => 1 / 3,
        'peak_db' => peak_decibels($peak),
        'updated_at' => $config['updated_at'],
        'authenticated' => $authenticated,
    ];

    if ($authenticated && isset($_SESSION['quantum_tree_csrf'])) {
        $response['csrf_token'] = $_SESSION['quantum_tree_csrf'];
    }

    return $response;
}

function start_owner_session(): void
{
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_name('iam_quantum_tree_owner');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/vogue/iam/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function require_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($origin === '' || $host === '') {
        json_response(['error' => 'A same-origin administrator request is required.'], 403);
    }

    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = explode(':', $host, 2)[0];
    if (!is_string($originHost) || !hash_equals(strtolower($requestHost), strtolower($originHost))) {
        json_response(['error' => 'Origin verification failed.'], 403);
    }
}

function read_json_request(): array
{
    $body = file_get_contents('php://input');
    if ($body === false || $body === '' || strlen($body) > 8192) {
        json_response(['error' => 'Invalid request.'], 400);
    }

    $request = json_decode($body, true);
    if (!is_array($request)) {
        json_response(['error' => 'Invalid JSON request.'], 400);
    }

    return $request;
}

function write_quantum_tree_config(float $peak, bool $mantraEnabled): array
{
    $config = [
        'schema_version' => 1,
        'peak_volume' => round($peak, 4),
        'mantra_enabled' => $mantraEnabled,
        'updated_at' => gmdate('c'),
    ];
    $json = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    try {
        iam_owner_state_prepare_write('quantum-tree-settings', QUANTUM_TREE_CONFIG_PATH, $json);
    } catch (RuntimeException) {
        json_response(['error' => 'The protected Quantum Tree history could not be saved. No changes were made.'], 500);
    }
    $temporaryPath = QUANTUM_TREE_CONFIG_PATH . '.tmp-' . bin2hex(random_bytes(6));

    if (file_put_contents($temporaryPath, $json, LOCK_EX) === false || !@rename($temporaryPath, QUANTUM_TREE_CONFIG_PATH)) {
        @unlink($temporaryPath);
        json_response(['error' => 'The platform setting could not be saved.'], 500);
    }

    return $config;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $authenticated = false;
    if (isset($_COOKIE['iam_quantum_tree_owner'])) {
        start_owner_session();
        $authenticated = ($_SESSION['quantum_tree_owner'] ?? false) === true;
    }
    json_response(public_quantum_tree_config(read_quantum_tree_config(), $authenticated));
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    json_response(['error' => 'Method not allowed.'], 405);
}

start_owner_session();
require_same_origin();
$request = read_json_request();
$action = is_string($request['action'] ?? null) ? $request['action'] : '';

if ($action === 'login') {
    $now = time();
    $blockedUntil = (int) ($_SESSION['quantum_tree_blocked_until'] ?? 0);
    if ($blockedUntil > $now) {
        json_response(['error' => 'Too many attempts. Please wait and try again.'], 429);
    }

    $ownerKey = is_string($request['owner_key'] ?? null) ? trim($request['owner_key']) : '';
    $valid = $ownerKey !== '' && strlen($ownerKey) <= 256
        && hash_equals(QUANTUM_TREE_OWNER_KEY_HASH, hash('sha256', $ownerKey));

    if (!$valid) {
        $attempts = (int) ($_SESSION['quantum_tree_login_attempts'] ?? 0) + 1;
        $_SESSION['quantum_tree_login_attempts'] = $attempts;
        if ($attempts >= 5) {
            $_SESSION['quantum_tree_blocked_until'] = $now + 60;
            $_SESSION['quantum_tree_login_attempts'] = 0;
        }
        json_response(['error' => 'Owner key not recognised.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['quantum_tree_owner'] = true;
    $_SESSION['quantum_tree_csrf'] = bin2hex(random_bytes(24));
    unset($_SESSION['quantum_tree_login_attempts'], $_SESSION['quantum_tree_blocked_until']);
    json_response(public_quantum_tree_config(read_quantum_tree_config(), true));
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_response(['authenticated' => false]);
}

if (($_SESSION['quantum_tree_owner'] ?? false) !== true) {
    json_response(['error' => 'Owner authentication is required.'], 401);
}

$csrf = is_string($request['csrf_token'] ?? null) ? $request['csrf_token'] : '';
if (!isset($_SESSION['quantum_tree_csrf']) || !hash_equals($_SESSION['quantum_tree_csrf'], $csrf)) {
    json_response(['error' => 'Administrator session verification failed. Refresh and sign in again.'], 403);
}

if ($action === 'save_mantra') {
    if (!isset($request['mantra_enabled']) || !is_bool($request['mantra_enabled'])) {
        json_response(['error' => 'Mantra enabled must be true or false.'], 422);
    }
    $existing = read_quantum_tree_config();
    $config = write_quantum_tree_config((float) $existing['peak_volume'], $request['mantra_enabled']);
    json_response(public_quantum_tree_config($config, true));
}

if ($action !== 'save') {
    json_response(['error' => 'Unknown administrator action.'], 400);
}

$peak = filter_var($request['peak_volume'] ?? null, FILTER_VALIDATE_FLOAT);
if ($peak === false || $peak < 0 || $peak > 1) {
    json_response(['error' => 'Peak volume must be between 0 and 1.'], 422);
}

$existing = read_quantum_tree_config();
$config = write_quantum_tree_config((float) $peak, $existing['mantra_enabled']);
json_response(public_quantum_tree_config($config, true));
