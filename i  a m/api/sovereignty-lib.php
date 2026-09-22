<?php
declare(strict_types=1);

// All runtime material is excluded from Git/deployment and denied by .htaccess.
// The server has an encryption PUBLIC key only; the owner's decryption key
// and the clear document are never uploaded.
const SOVEREIGNTY_PRIVATE = __DIR__ . '/.runtime-private/sovereignty';

function sovereignty_json(array $value): string {
    return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}

function sovereignty_config(): array {
    $path = SOVEREIGNTY_PRIVATE . '/config.json';
    $raw = @file_get_contents($path);
    if (!is_string($raw)) throw new RuntimeException('Archive unavailable.');
    $config = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($config) || ($config['enabled'] ?? false) !== true
        || !preg_match('/\A[a-f0-9]{64}\z/', (string) ($config['identity_key'] ?? ''))
        || !in_array($config['environment'] ?? '', ['staging', 'production'], true)
        || (($config['environment'] ?? '') === 'production' && ($config['production_approved'] ?? false) !== true)) {
        throw new RuntimeException('Archive unavailable.');
    }
    return $config;
}

function sovereignty_request_environment_matches(array $config): bool {
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    return $config['environment'] === 'staging' ? $host === 'staging.universalmind.tv'
        : in_array($host, ['universalmind.tv', 'www.universalmind.tv'], true);
}

function sovereignty_atomic(string $path, string $bytes): void {
    $temp = $path . '.tmp-' . bin2hex(random_bytes(8));
    try {
        if (file_put_contents($temp, $bytes, LOCK_EX) !== strlen($bytes)
            || !chmod($temp, 0600) || !rename($temp, $path)) {
            throw new RuntimeException('Archive write failed.');
        }
    } finally { if (is_file($temp)) @unlink($temp); }
}

function sovereignty_encrypt(string $plaintext): array {
    $public = @file_get_contents(SOVEREIGNTY_PRIVATE . '/recipient-public.pem');
    if (!is_string($public)) throw new RuntimeException('Encryption unavailable.');
    $key = random_bytes(32); $iv = random_bytes(12); $tag = '';
    $aad = 'universal-sovereignty/envelope/v1';
    $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, $aad, 16);
    $wrapped = '';
    if ($ciphertext === false || !openssl_public_encrypt($key, $wrapped, $public, OPENSSL_PKCS1_OAEP_PADDING)) {
        throw new RuntimeException('Encryption failed.');
    }
    return ['schema'=>1, 'algorithm'=>'AES-256-GCM+RSA-OAEP-SHA1', 'aad'=>$aad,
        'wrapped_key'=>base64_encode($wrapped), 'iv'=>base64_encode($iv),
        'tag'=>base64_encode($tag), 'ciphertext'=>base64_encode($ciphertext)];
}

function sovereignty_password_digest(string $password): ?string {
    if ($password === '' || strlen($password) > 512) return null;
    // Reuse the current portal allowlist; never trust a digest submitted by a client.
    $root = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    $paths = array_unique(array_filter([$root !== '' ? $root . '/index.html' : null,
        dirname(__DIR__, 3) . '/index.html', dirname(__DIR__, 2) . '/index.html']));
    $digest = hash('sha256', $password);
    foreach ($paths as $path) {
        $source = @file_get_contents($path);
        if (!is_string($source) || !preg_match('/const allowedPasswordHashes = new Set\(\[([\s\S]*?)\]\)/', $source, $block)) continue;
        preg_match_all('/[a-f0-9]{64}/', $block[1], $matches);
        foreach ($matches[0] as $allowed) if (hash_equals($allowed, $digest)) return $digest;
        return null;
    }
    return null;
}

function sovereignty_record(string $password, array $config): bool {
    $digest = sovereignty_password_digest($password);
    if ($digest === null) throw new InvalidArgumentException('Invalid credential.');
    return sovereignty_record_verified_digest($digest, $config);
}

// The HTTP entry handler can reach this only after password verification.
// Token-protected diagnostics use a separate namespace in each environment.
function sovereignty_record_verified_digest(string $digest, array $config, bool $testing = false): bool {
    if (!preg_match('/\A[a-f0-9]{64}\z/', $digest)) throw new RuntimeException('Invalid archive scope.');
    $member = hash_hmac('sha256', $digest, hex2bin($config['identity_key']));
    $directory = SOVEREIGNTY_PRIVATE . ($testing ? '/qa-events' : '/events');
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Archive unavailable.');
    $path = $directory . '/' . $member . '.json';
    $lock = @fopen(SOVEREIGNTY_PRIVATE . '/entry.lock', 'c');
    // A contended lock never consumes an unbounded PHP worker. The browser
    // retries only in memory; any later login safely retries the same member.
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        if ($lock) fclose($lock);
        throw new RuntimeException('Archive busy.');
    }
    try {
        @chmod(SOVEREIGNTY_PRIVATE . '/entry.lock', 0600);
        if (is_file($path)) {
            $existing = json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
            if (!is_array($existing) || !isset($existing['event_id'], $existing['envelope'])) throw new RuntimeException('Archive damaged.');
            return false;
        }
        $document = @file_get_contents(SOVEREIGNTY_PRIVATE . '/document.encrypted.json');
        $metadata = json_decode((string) @file_get_contents(SOVEREIGNTY_PRIVATE . '/document.json'), true, 16, JSON_THROW_ON_ERROR);
        if (!is_string($document) || !is_array($metadata)
            || !hash_equals((string) ($metadata['encrypted_sha256'] ?? ''), hash('sha256', $document))) {
            throw new RuntimeException('Document unavailable.');
        }
        $id = bin2hex(random_bytes(24));
        $receipt = ['schema'=>1, 'section'=>'Universal Sovereignty', 'event'=>'first_portal_entry',
            'environment'=>$config['environment'] . ($testing ? '_qa' : ''), 'test_record'=>$testing,
            'event_id'=>$id, 'member_id'=>$member,
            'recorded_at'=>gmdate('Y-m-d\TH:i:s\Z'), 'document_version'=>$metadata['version'],
            'document_sha256'=>$metadata['sealed_sha256'], 'consent_recorded'=>false,
            'contract_executed'=>false, 'token_issuance'=>'not_issued'];
        $receiptBytes = sovereignty_json($receipt);
        $signing = @file_get_contents(SOVEREIGNTY_PRIVATE . '/signing-private.pem');
        $signature = '';
        if (!is_string($signing) || !openssl_sign($receiptBytes, $signature, $signing, OPENSSL_ALGO_SHA256)) throw new RuntimeException('Signing unavailable.');
        $envelope = sovereignty_encrypt(sovereignty_json(['receipt_json'=>$receiptBytes,
            'signature'=>base64_encode($signature), 'signature_algorithm'=>'RSA-SHA256']));
        // One atomic record is both the once-only marker and durable work queue.
        // No plaintext password, password digest, name, email, IP or user-agent.
        sovereignty_atomic($path, sovereignty_json(['schema'=>1, 'event_id'=>$id,
            'document_encrypted_sha256'=>$metadata['encrypted_sha256'],
            'envelope'=>$envelope]));
        return true;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}

function sovereignty_admin_valid(array $config): bool {
    $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    return preg_match('/\ABearer ([a-f0-9]{64})\z/', $header, $match) === 1
        && isset($config['worker_token_sha256'])
        && hash_equals($config['worker_token_sha256'], hash('sha256', $match[1]));
}
