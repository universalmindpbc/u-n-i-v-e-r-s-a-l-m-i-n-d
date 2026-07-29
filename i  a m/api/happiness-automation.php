<?php
declare(strict_types=1);

require_once __DIR__ . '/owner-state-history.php';
require_once __DIR__ . '/happiness-secret-store.php';
require_once dirname(__DIR__) . '/apple-wallet/happiness-apple-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const HAPPINESS_OWNER_KEY_HASH = 'e6a9c12b1512ebc1790482dbb21854d33e4217fdcabb1e49412de6f1309d690a';
const HAPPINESS_LEDGER_PATH = __DIR__ . '/happiness-ledger.json';
const HAPPINESS_CONTRACT = '0x616EF64C03D79630ECA03b5Cea4ea58a252dB68a';
const HAPPINESS_CHAIN_ID = 80002;
const HAPPINESS_DECIMALS = 6;
const HAPPINESS_CITIZEN_ADDRESS = '0xA83623eF867Bb651EF8f546632fa49d51FFad5ca';
const HAPPINESS_CIRCLE_BASE = 'https://api.circle.com/v1/w3s';
const HAPPINESS_POLYGON_RPC = 'https://polygon-amoy-bor-rpc.publicnode.com';

function happiness_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function happiness_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
}

function happiness_default_ledger(): array
{
    return [
        'schema_version' => 'happiness_automated_ledger_v1',
        'mode' => 'polygon_amoy',
        'member' => [
            'display_id' => 'UM · 000 001',
            'status' => 'UNIVERSAL CITIZEN',
            'polygon_address' => HAPPINESS_CITIZEN_ADDRESS,
            'pass_serial' => 'UM-000001',
        ],
        'balance' => [
            'available_units' => '0',
            'available_display' => '0',
            'ticker' => '[ I o H ]',
        ],
        'automation' => [
            'state' => 'configuration_required',
            'last_confirmed_at' => null,
            'last_polygon_tx' => null,
            'last_apple_push_at' => null,
        ],
        'pending' => null,
        'activity' => [],
        'updated_at' => null,
    ];
}

function happiness_read_ledger(): array
{
    $contents = @file_get_contents(HAPPINESS_LEDGER_PATH);
    $decoded = is_string($contents) ? json_decode($contents, true) : null;
    return is_array($decoded) ? array_replace_recursive(happiness_default_ledger(), $decoded) : happiness_default_ledger();
}

function happiness_ensure_member_token(array $ledger): array
{
    $token = $ledger['member']['apple_authentication_token'] ?? '';
    if (!is_string($token) || strlen($token) < 32) {
        $ledger['member']['apple_authentication_token'] = bin2hex(random_bytes(32));
        happiness_write_ledger($ledger);
    }
    return $ledger;
}

function happiness_write_ledger(array $ledger): void
{
    $ledger['updated_at'] = gmdate('c');
    $json = json_encode($ledger, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    try {
        iam_owner_state_prepare_write('happiness-ledger', HAPPINESS_LEDGER_PATH, $json);
    } catch (RuntimeException $error) {
        throw new RuntimeException('happiness_audit_history_unavailable');
    }
    $temporary = HAPPINESS_LEDGER_PATH . '.tmp-' . bin2hex(random_bytes(6));
    if (@file_put_contents($temporary, $json, LOCK_EX) === false || !@rename($temporary, HAPPINESS_LEDGER_PATH)) {
        @unlink($temporary);
        throw new RuntimeException('happiness_ledger_write_failed');
    }
    @chmod(HAPPINESS_LEDGER_PATH, 0600);
}

function happiness_start_owner_session(): void
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

function happiness_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $originHost = $origin !== '' ? parse_url($origin, PHP_URL_HOST) : null;
    $requestHost = explode(':', $host, 2)[0];
    if (!is_string($originHost) || $requestHost === '' || !hash_equals(strtolower($requestHost), strtolower($originHost))) {
        happiness_json(['ok' => false, 'error' => 'same_origin_required'], 403);
    }
}

function happiness_request(): array
{
    $body = file_get_contents('php://input');
    if (!is_string($body) || $body === '' || strlen($body) > 16384) happiness_json(['ok' => false, 'error' => 'invalid_request'], 400);
    $request = json_decode($body, true);
    if (!is_array($request)) happiness_json(['ok' => false, 'error' => 'invalid_json'], 400);
    return $request;
}

function happiness_environment_ready(): array
{
    $required = [
        'CIRCLE_API_KEY',
        'HAPPINESS_CIRCLE_ENTITY_SECRET',
        'HAPPINESS_CIRCLE_WALLET_ID',
        'HAPPINESS_CIRCLE_ISSUER_ADDRESS',
        'HAPPINESS_APPLE_CERT_PEM',
        'HAPPINESS_APPLE_KEY_PEM',
        'HAPPINESS_APPLE_WWDR_PEM',
    ];
    $missing = [];
    foreach ($required as $name) {
        if (happiness_secret($name) === '') $missing[] = $name;
    }
    return [
        'ready' => count($missing) === 0 && happiness_apple_ready(),
        'missing' => $missing,
        'contract' => HAPPINESS_CONTRACT,
        'network' => 'Polygon Amoy',
        'chain_id' => HAPPINESS_CHAIN_ID,
        'issuer_address' => happiness_secret('HAPPINESS_CIRCLE_ISSUER_ADDRESS') ?: null,
        'apple_updates_configured' => happiness_apple_ready(),
    ];
}

function happiness_http(string $method, string $url, ?array $body = null, array $headers = []): array
{
    if (!function_exists('curl_init')) throw new RuntimeException('server_curl_unavailable');
    $curl = curl_init($url);
    $requestHeaders = array_merge(['Accept: application/json'], $headers);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 35,
        CURLOPT_HTTPHEADER => $requestHeaders,
    ]);
    if ($body !== null) {
        $payload = json_encode($body, JSON_UNESCAPED_SLASHES);
        $requestHeaders[] = 'Content-Type: application/json';
        curl_setopt($curl, CURLOPT_HTTPHEADER, $requestHeaders);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);
    }
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if (!is_string($response)) throw new RuntimeException($error !== '' ? 'upstream_transport_failed' : 'upstream_empty_response');
    $decoded = json_decode($response, true);
    if (!is_array($decoded)) throw new RuntimeException('upstream_invalid_json');
    if ($status < 200 || $status >= 300) {
        $message = $decoded['message'] ?? $decoded['error'] ?? 'upstream_request_failed';
        throw new RuntimeException('circle_' . preg_replace('/[^a-z0-9]+/i', '_', strtolower((string) $message)));
    }
    return $decoded;
}

function happiness_circle_headers(string $requestId): array
{
    return [
        'Authorization: Bearer ' . happiness_secret('CIRCLE_API_KEY'),
        'X-Request-Id: ' . $requestId,
    ];
}

function happiness_circle_ciphertext(): string
{
    $secretHex = happiness_secret('HAPPINESS_CIRCLE_ENTITY_SECRET');
    if (!preg_match('/^[a-f0-9]{64}$/i', $secretHex)) throw new RuntimeException('circle_entity_secret_invalid');
    if (!function_exists('proc_open')) throw new RuntimeException('server_process_execution_unavailable');

    $requestId = happiness_uuid();
    $publicKeyResponse = happiness_http('GET', HAPPINESS_CIRCLE_BASE . '/config/entity/publicKey', null, happiness_circle_headers($requestId));
    $publicKey = $publicKeyResponse['data']['publicKey'] ?? null;
    if (!is_string($publicKey) || !str_contains($publicKey, 'PUBLIC KEY')) throw new RuntimeException('circle_public_key_unavailable');

    $directory = sys_get_temp_dir() . '/happiness-circle-' . bin2hex(random_bytes(8));
    if (!@mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('circle_cipher_temp_unavailable');
    $keyPath = $directory . '/public.pem';
    $secretPath = $directory . '/secret.bin';
    $cipherPath = $directory . '/cipher.bin';
    @file_put_contents($keyPath, $publicKey, LOCK_EX);
    @file_put_contents($secretPath, hex2bin($secretHex), LOCK_EX);
    @chmod($keyPath, 0600);
    @chmod($secretPath, 0600);

    $command = [
        'openssl', 'pkeyutl', '-encrypt', '-pubin', '-inkey', $keyPath,
        '-in', $secretPath, '-out', $cipherPath,
        '-pkeyopt', 'rsa_padding_mode:oaep',
        '-pkeyopt', 'rsa_oaep_md:sha256',
        '-pkeyopt', 'rsa_mgf1_md:sha256',
    ];
    $pipes = [];
    $process = @proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($process)) {
        @unlink($keyPath); @unlink($secretPath); @rmdir($directory);
        throw new RuntimeException('circle_cipher_process_failed');
    }
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    $exit = proc_close($process);
    $cipher = @file_get_contents($cipherPath);
    @unlink($keyPath); @unlink($secretPath); @unlink($cipherPath); @rmdir($directory);
    if ($exit !== 0 || !is_string($cipher) || $cipher === '') throw new RuntimeException('circle_cipher_failed');
    return base64_encode($cipher);
}

function happiness_circle_submit(array $pending): array
{
    $action = $pending['action'];
    $signature = $action === 'issue'
        ? 'issueReward(address,uint256,bytes32,bytes32)'
        : 'redeemReward(address,uint256,bytes32)';
    $parameters = [HAPPINESS_CITIZEN_ADDRESS, $pending['units'], $pending['operation_id']];
    if ($action === 'issue') $parameters[] = '0x' . hash('sha256', 'universal-mind-owner-dashboard');
    $requestId = happiness_uuid();
    $response = happiness_http('POST', HAPPINESS_CIRCLE_BASE . '/developer/transactions/contractExecution', [
        'idempotencyKey' => $pending['idempotency_key'],
        'contractAddress' => HAPPINESS_CONTRACT,
        'entitySecretCiphertext' => happiness_circle_ciphertext(),
        'abiFunctionSignature' => $signature,
        'abiParameters' => $parameters,
        'feeLevel' => 'MEDIUM',
        'refId' => 'happiness-' . $pending['intent_id'],
        'walletId' => happiness_secret('HAPPINESS_CIRCLE_WALLET_ID'),
    ], happiness_circle_headers($requestId));
    $transaction = $response['data']['transaction'] ?? null;
    if (is_array($transaction) && is_string($transaction['id'] ?? null)) return $transaction;
    $transactionId = $response['data']['id'] ?? null;
    if (!is_string($transactionId) || $transactionId === '') throw new RuntimeException('circle_transaction_id_missing');
    return ['id' => $transactionId, 'state' => 'INITIATED'];
}

function happiness_circle_transaction(string $transactionId): array
{
    $response = happiness_http('GET', HAPPINESS_CIRCLE_BASE . '/transactions/' . rawurlencode($transactionId), null, happiness_circle_headers(happiness_uuid()));
    $transaction = $response['data']['transaction'] ?? null;
    if (!is_array($transaction)) throw new RuntimeException('circle_transaction_missing');
    return $transaction;
}

function happiness_polygon_balance(): string
{
    $address = strtolower(substr(HAPPINESS_CITIZEN_ADDRESS, 2));
    $data = '0x70a08231' . str_pad($address, 64, '0', STR_PAD_LEFT);
    $response = happiness_http('POST', HAPPINESS_POLYGON_RPC, [
        'jsonrpc' => '2.0', 'id' => 1, 'method' => 'eth_call',
        'params' => [['to' => HAPPINESS_CONTRACT, 'data' => $data], 'latest'],
    ]);
    $hex = $response['result'] ?? null;
    if (!is_string($hex) || !preg_match('/^0x[a-f0-9]+$/i', $hex)) throw new RuntimeException('polygon_balance_read_failed');
    $value = ltrim(substr($hex, 2), '0');
    if ($value === '') return '0';
    if (strlen($value) > 15) throw new RuntimeException('polygon_balance_too_large_for_runtime');
    return (string) hexdec($value);
}

function happiness_format_units(string $units): string
{
    $units = ltrim($units, '0');
    if ($units === '') return '0';
    $padded = str_pad($units, HAPPINESS_DECIMALS + 1, '0', STR_PAD_LEFT);
    $whole = substr($padded, 0, -HAPPINESS_DECIMALS);
    $fraction = rtrim(substr($padded, -HAPPINESS_DECIMALS), '0');
    return $fraction === '' ? $whole : $whole . '.' . $fraction;
}

function happiness_public_state(array $ledger, bool $authenticated = false): array
{
    $configuration = happiness_environment_ready();
    $state = [
        'ok' => true,
        'authenticated' => $authenticated,
        'schema_version' => $ledger['schema_version'],
        'member' => $ledger['member'],
        'balance' => $ledger['balance'],
        'automation' => array_merge($ledger['automation'], [
            'configured' => $configuration['ready'],
            'network' => $configuration['network'],
            'contract' => $configuration['contract'],
        ]),
        'pending' => $ledger['pending'],
        'activity' => array_slice($ledger['activity'], 0, $authenticated ? 20 : 1),
        'updated_at' => $ledger['updated_at'],
        'apple_wallet' => [
            'status' => $configuration['apple_updates_configured']
                ? 'Apple Wallet live updates ready'
                : 'Apple Wallet live update signing requires activation',
        ],
    ];
    if ($authenticated) {
        $state['configuration'] = $configuration;
        $state['csrf_token'] = $_SESSION['quantum_tree_csrf'] ?? null;
    }
    return $state;
}

function happiness_reconcile(array $ledger): array
{
    $pending = $ledger['pending'];
    if (!is_array($pending) || !is_string($pending['circle_transaction_id'] ?? null)) return $ledger;
    $transaction = happiness_circle_transaction($pending['circle_transaction_id']);
    $state = strtoupper((string) ($transaction['state'] ?? 'UNKNOWN'));
    $ledger['pending']['circle_state'] = $state;
    $ledger['pending']['tx_hash'] = $transaction['txHash'] ?? null;
    if (in_array($state, ['COMPLETE', 'CONFIRMED'], true)) {
        $units = happiness_polygon_balance();
        $ledger['balance']['available_units'] = $units;
        $ledger['balance']['available_display'] = happiness_format_units($units);
        $ledger['automation']['state'] = 'confirmed';
        $ledger['automation']['last_confirmed_at'] = gmdate('c');
        $ledger['automation']['last_polygon_tx'] = $transaction['txHash'] ?? null;
        $ledger['automation']['state'] = 'syncing_apple_wallet';
        happiness_write_ledger($ledger);
        $notifiedDevices = happiness_apple_notify($ledger);
        $ledger['automation']['last_apple_push_at'] = gmdate('c');
        $ledger['automation']['last_apple_push_devices'] = $notifiedDevices;
        $ledger['automation']['state'] = 'confirmed';
        array_unshift($ledger['activity'], [
            'intent_id' => $pending['intent_id'],
            'action' => $pending['action'],
            'amount' => $pending['amount'],
            'reason' => $pending['reason'],
            'status' => 'confirmed',
            'polygon_tx' => $transaction['txHash'] ?? null,
            'confirmed_at' => gmdate('c'),
        ]);
        $ledger['pending'] = null;
    } elseif (in_array($state, ['FAILED', 'CANCELLED', 'DENIED', 'STUCK'], true)) {
        $ledger['automation']['state'] = 'failed';
        array_unshift($ledger['activity'], [
            'intent_id' => $pending['intent_id'],
            'action' => $pending['action'],
            'amount' => $pending['amount'],
            'reason' => $pending['reason'],
            'status' => 'failed',
            'error' => $transaction['errorReason'] ?? $state,
            'confirmed_at' => gmdate('c'),
        ]);
        $ledger['pending'] = null;
    } else {
        $ledger['automation']['state'] = 'confirming_polygon';
    }
    happiness_write_ledger($ledger);
    return $ledger;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $ledger = happiness_read_ledger();
    $public = ($_GET['public'] ?? '') === '1';
    $authenticated = false;
    if (!$public && isset($_COOKIE['iam_quantum_tree_owner'])) {
        happiness_start_owner_session();
        $authenticated = ($_SESSION['quantum_tree_owner'] ?? false) === true;
    }
    happiness_json(happiness_public_state($ledger, $authenticated));
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    happiness_json(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

happiness_start_owner_session();
happiness_same_origin();
$request = happiness_request();
$action = is_string($request['action'] ?? null) ? $request['action'] : '';

if ($action === 'login') {
    $now = time();
    if ((int) ($_SESSION['happiness_blocked_until'] ?? 0) > $now) happiness_json(['ok' => false, 'error' => 'too_many_attempts'], 429);
    $ownerKey = is_string($request['owner_key'] ?? null) ? trim($request['owner_key']) : '';
    $valid = $ownerKey !== '' && strlen($ownerKey) <= 256 && hash_equals(HAPPINESS_OWNER_KEY_HASH, hash('sha256', $ownerKey));
    if (!$valid) {
        $attempts = (int) ($_SESSION['happiness_login_attempts'] ?? 0) + 1;
        $_SESSION['happiness_login_attempts'] = $attempts;
        if ($attempts >= 5) {
            $_SESSION['happiness_blocked_until'] = $now + 60;
            $_SESSION['happiness_login_attempts'] = 0;
        }
        happiness_json(['ok' => false, 'error' => 'owner_key_not_recognised'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['quantum_tree_owner'] = true;
    $_SESSION['quantum_tree_csrf'] = bin2hex(random_bytes(24));
    unset($_SESSION['happiness_login_attempts'], $_SESSION['happiness_blocked_until']);
    happiness_json(happiness_public_state(happiness_ensure_member_token(happiness_read_ledger()), true));
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    happiness_json(['ok' => true, 'authenticated' => false]);
}

if (($_SESSION['quantum_tree_owner'] ?? false) !== true) happiness_json(['ok' => false, 'error' => 'owner_authentication_required'], 401);
$csrf = is_string($request['csrf_token'] ?? null) ? $request['csrf_token'] : '';
if (!isset($_SESSION['quantum_tree_csrf']) || !hash_equals($_SESSION['quantum_tree_csrf'], $csrf)) {
    happiness_json(['ok' => false, 'error' => 'administrator_session_verification_failed'], 403);
}

$ledger = happiness_read_ledger();
try {
    if ($action === 'reconcile') {
        happiness_json(happiness_public_state(happiness_reconcile($ledger), true));
    }
    if (!in_array($action, ['issue', 'redeem'], true)) happiness_json(['ok' => false, 'error' => 'unknown_action'], 400);
    $configuration = happiness_environment_ready();
    if (!$configuration['ready']) happiness_json(['ok' => false, 'error' => 'automation_configuration_required', 'missing' => $configuration['missing']], 503);
    if (is_array($ledger['pending'])) happiness_json(['ok' => false, 'error' => 'another_polygon_confirmation_is_pending'], 409);
    $amount = is_string($request['amount'] ?? null) ? trim($request['amount']) : (string) ($request['amount'] ?? '');
    if (!preg_match('/^[1-9][0-9]{0,5}$/', $amount)) happiness_json(['ok' => false, 'error' => 'amount_must_be_a_whole_number_between_1_and_999999'], 422);
    $reason = is_string($request['reason'] ?? null) ? trim($request['reason']) : '';
    if ($reason === '' || strlen($reason) > 160) happiness_json(['ok' => false, 'error' => 'reason_required'], 422);
    $units = (string) ((int) $amount * (10 ** HAPPINESS_DECIMALS));
    if ($action === 'redeem' && (int) $units > (int) $ledger['balance']['available_units']) {
        happiness_json(['ok' => false, 'error' => 'insufficient_happiness_balance'], 422);
    }
    $intentId = happiness_uuid();
    $ledger['pending'] = [
        'intent_id' => $intentId,
        'idempotency_key' => happiness_uuid(),
        'operation_id' => '0x' . hash('sha256', 'happiness:' . $intentId),
        'action' => $action,
        'amount' => $amount,
        'units' => $units,
        'reason' => $reason,
        'state' => 'submitting_to_circle',
        'created_at' => gmdate('c'),
    ];
    $ledger['automation']['state'] = 'submitting_to_circle';
    happiness_write_ledger($ledger);
    try {
        $transaction = happiness_circle_submit($ledger['pending']);
        $ledger['pending']['circle_transaction_id'] = $transaction['id'];
        $ledger['pending']['circle_state'] = strtoupper((string) ($transaction['state'] ?? 'INITIATED'));
        $ledger['pending']['state'] = 'confirming_polygon';
        $ledger['automation']['state'] = 'confirming_polygon';
        happiness_write_ledger($ledger);
    } catch (Throwable $submitError) {
        $ledger['pending'] = null;
        $ledger['automation']['state'] = 'failed';
        array_unshift($ledger['activity'], [
            'intent_id' => $intentId, 'action' => $action, 'amount' => $amount,
            'reason' => $reason, 'status' => 'failed', 'error' => $submitError->getMessage(),
            'confirmed_at' => gmdate('c'),
        ]);
        happiness_write_ledger($ledger);
        throw $submitError;
    }
    happiness_json(happiness_public_state($ledger, true), 202);
} catch (Throwable $error) {
    happiness_json(['ok' => false, 'error' => $error->getMessage()], 502);
}
