<?php
declare(strict_types=1);

if (!function_exists('happiness_secret')) {
    require_once __DIR__ . '/happiness-secret-store.php';
}

const IAM_HEART_CHECK_HANDOFF_COOKIE = 'iam_heart_check_handoff';
const IAM_HEART_CHECK_HANDOFF_TTL_SECONDS = 60;
const IAM_HEART_CHECK_HANDOFF_MAX_RECORD_BYTES = 4096;

function iam_heart_check_handoff_storage_directory(): string
{
    if (defined('IAM_HEART_CHECK_HANDOFF_STORAGE_DIRECTORY')) {
        return rtrim((string) constant('IAM_HEART_CHECK_HANDOFF_STORAGE_DIRECTORY'), DIRECTORY_SEPARATOR);
    }

    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'universal-mind-heart-check-handoff-v1';
}

function iam_heart_check_handoff_decode_key(string $configured): ?string
{
    if ($configured === '') return null;

    if (strlen($configured) === 32) return $configured;

    if (preg_match('/^[a-f0-9]{64}$/iD', $configured) === 1) {
        $decoded = hex2bin($configured);
        return is_string($decoded) && strlen($decoded) === 32 ? $decoded : null;
    }

    $encoded = str_starts_with($configured, 'base64:')
        ? substr($configured, strlen('base64:'))
        : $configured;
    $decoded = base64_decode($encoded, true);
    return is_string($decoded) && strlen($decoded) === 32 ? $decoded : null;
}

function iam_heart_check_handoff_key(): ?string
{
    return iam_heart_check_handoff_decode_key(happiness_secret('HEART_CHECK_HANDOFF_KEY'));
}

function iam_heart_check_handoff_normalize_checkin($value): ?string
{
    if (!is_string($value) || strlen($value) > 2048 || preg_match('//u', $value) !== 1) return null;

    $normalized = preg_replace('/\s+/u', ' ', trim($value));
    if (!is_string($normalized) || $normalized === '') return null;

    $characterCount = preg_match_all('/./us', $normalized, $characters);
    if (!is_int($characterCount) || $characterCount < 1 || $characterCount > 180) return null;

    return $normalized;
}

function iam_heart_check_handoff_validate_physiology($value): ?array
{
    if (!is_array($value)) return null;

    $expectedKeys = [
        'heart_rate_bpm',
        'measurement_duration_seconds',
        'measurement_timing',
        'source',
    ];
    if (!iam_heart_check_handoff_has_exact_keys($value, $expectedKeys)) return null;

    $heartRate = $value['heart_rate_bpm'];
    if (!is_int($heartRate) || $heartRate < 30 || $heartRate > 240) return null;
    if (!is_int($value['measurement_duration_seconds']) || $value['measurement_duration_seconds'] !== 10) return null;
    if ($value['measurement_timing'] !== 'immediately_after_current_self_report') return null;
    if ($value['source'] !== 'shen_quick_hr') return null;

    return [
        'heart_rate_bpm' => $heartRate,
        'measurement_duration_seconds' => 10,
        'measurement_timing' => 'immediately_after_current_self_report',
        'source' => 'shen_quick_hr',
    ];
}

function iam_heart_check_handoff_has_exact_keys(array $value, array $expectedKeys): bool
{
    $actualKeys = array_keys($value);
    sort($actualKeys);
    sort($expectedKeys);
    return $actualKeys === $expectedKeys;
}

function iam_heart_check_handoff_issue(
    array $physiology,
    string $checkin,
    string $key,
    ?string $storageDirectory = null,
    ?int $now = null
): ?string {
    if (strlen($key) !== 32 || !function_exists('openssl_encrypt')) return null;

    $normalizedCheckin = iam_heart_check_handoff_normalize_checkin($checkin);
    $validatedPhysiology = iam_heart_check_handoff_validate_physiology($physiology);
    if ($normalizedCheckin === null || $validatedPhysiology === null) return null;

    $issuedAt = $now ?? time();
    $directory = $storageDirectory ?? iam_heart_check_handoff_storage_directory();
    if (!iam_heart_check_handoff_prepare_storage($directory)) return null;
    iam_heart_check_handoff_purge_expired($directory, $issuedAt);

    $payload = json_encode([
        'schema' => 'heart_check_handoff_v1',
        'momentary_physiology' => $validatedPhysiology,
        'issued_at' => $issuedAt,
        'checkin_sha256' => hash('sha256', $normalizedCheckin),
    ], JSON_UNESCAPED_SLASHES);
    if (!is_string($payload)) return null;

    for ($attempt = 0; $attempt < 3; $attempt += 1) {
        try {
            $identifier = bin2hex(random_bytes(32));
            $nonce = random_bytes(12);
        } catch (Throwable $exception) {
            return null;
        }

        $tag = '';
        $ciphertext = @openssl_encrypt(
            $payload,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            iam_heart_check_handoff_aad($identifier),
            16
        );
        if (!is_string($ciphertext) || strlen($tag) !== 16) return null;

        $record = json_encode([
            'version' => 1,
            'nonce' => base64_encode($nonce),
            'tag' => base64_encode($tag),
            'ciphertext' => base64_encode($ciphertext),
        ], JSON_UNESCAPED_SLASHES);
        if (!is_string($record) || strlen($record) > IAM_HEART_CHECK_HANDOFF_MAX_RECORD_BYTES) return null;

        $path = iam_heart_check_handoff_record_path($identifier, $directory);
        $handle = @fopen($path, 'x+b');
        if ($handle === false) continue;

        if (!@chmod($path, 0600)) {
            fclose($handle);
            @unlink($path);
            return null;
        }
        $stored = false;
        if (flock($handle, LOCK_EX)) {
            $stored = iam_heart_check_handoff_write_all($handle, $record)
                && fflush($handle)
                && @touch($path, $issuedAt);
            flock($handle, LOCK_UN);
        }
        fclose($handle);

        if ($stored) return $identifier;
        @unlink($path);
    }

    return null;
}

function iam_heart_check_handoff_consume(
    string $identifier,
    $checkin,
    ?string $key,
    ?string $storageDirectory = null,
    ?int $now = null
): ?array {
    $directory = $storageDirectory ?? iam_heart_check_handoff_storage_directory();
    $record = iam_heart_check_handoff_take_record($identifier, $directory);
    if ($record === null || $key === null || strlen($key) !== 32 || !function_exists('openssl_decrypt')) return null;

    $normalizedCheckin = iam_heart_check_handoff_normalize_checkin($checkin);
    if ($normalizedCheckin === null) return null;

    $envelope = json_decode($record, true);
    if (!is_array($envelope) || !iam_heart_check_handoff_has_exact_keys(
        $envelope,
        ['version', 'nonce', 'tag', 'ciphertext']
    )) return null;
    if ($envelope['version'] !== 1) return null;

    $nonce = is_string($envelope['nonce']) ? base64_decode($envelope['nonce'], true) : false;
    $tag = is_string($envelope['tag']) ? base64_decode($envelope['tag'], true) : false;
    $ciphertext = is_string($envelope['ciphertext']) ? base64_decode($envelope['ciphertext'], true) : false;
    if (!is_string($nonce) || strlen($nonce) !== 12) return null;
    if (!is_string($tag) || strlen($tag) !== 16) return null;
    if (!is_string($ciphertext) || $ciphertext === '') return null;

    $plaintext = @openssl_decrypt(
        $ciphertext,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $nonce,
        $tag,
        iam_heart_check_handoff_aad($identifier)
    );
    if (!is_string($plaintext)) return null;

    $payload = json_decode($plaintext, true);
    if (!is_array($payload) || !iam_heart_check_handoff_has_exact_keys(
        $payload,
        ['schema', 'momentary_physiology', 'issued_at', 'checkin_sha256']
    )) return null;
    if ($payload['schema'] !== 'heart_check_handoff_v1' || !is_int($payload['issued_at'])) return null;

    $consumedAt = $now ?? time();
    $age = $consumedAt - $payload['issued_at'];
    if ($age < 0 || $age >= IAM_HEART_CHECK_HANDOFF_TTL_SECONDS) return null;

    $expectedDigest = hash('sha256', $normalizedCheckin);
    if (!is_string($payload['checkin_sha256']) || !hash_equals($payload['checkin_sha256'], $expectedDigest)) return null;

    return iam_heart_check_handoff_validate_physiology($payload['momentary_physiology'] ?? null);
}

function iam_heart_check_handoff_prepare_worker_body(string $body, ?array $trustedPhysiology): string
{
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) return $body;

    // Physiology reaching the Worker must come only from a consumed server record.
    unset($decoded['momentary_physiology'], $decoded['momentaryPhysiology']);
    if ($trustedPhysiology !== null) {
        $validated = iam_heart_check_handoff_validate_physiology($trustedPhysiology);
        if ($validated !== null) $decoded['momentary_physiology'] = $validated;
    }

    $encoded = json_encode($decoded, JSON_UNESCAPED_SLASHES);
    return is_string($encoded) ? $encoded : $body;
}

function iam_heart_check_handoff_take_record(string $identifier, string $storageDirectory): ?string
{
    if (preg_match('/^[a-f0-9]{64}$/D', $identifier) !== 1 || !is_dir($storageDirectory)) return null;

    $path = iam_heart_check_handoff_record_path($identifier, $storageDirectory);
    $handle = @fopen($path, 'r+b');
    if ($handle === false) return null;

    $record = null;
    if (flock($handle, LOCK_EX)) {
        $contents = stream_get_contents($handle, IAM_HEART_CHECK_HANDOFF_MAX_RECORD_BYTES + 1);
        ftruncate($handle, 0);
        fflush($handle);
        @unlink($path);
        if (is_string($contents) && $contents !== '' && strlen($contents) <= IAM_HEART_CHECK_HANDOFF_MAX_RECORD_BYTES) {
            $record = $contents;
        }
        flock($handle, LOCK_UN);
    }
    fclose($handle);

    return $record;
}

function iam_heart_check_handoff_purge_expired(string $storageDirectory, ?int $now = null): void
{
    if (!is_dir($storageDirectory) || is_link($storageDirectory)) return;

    $expiredBefore = ($now ?? time()) - IAM_HEART_CHECK_HANDOFF_TTL_SECONDS;
    $paths = glob($storageDirectory . DIRECTORY_SEPARATOR . '*.handoff');
    if (!is_array($paths)) return;

    foreach ($paths as $path) {
        if (preg_match('/^[a-f0-9]{64}\.handoff$/D', basename($path)) !== 1) continue;
        $modifiedAt = @filemtime($path);
        if (!is_int($modifiedAt) || $modifiedAt > $expiredBefore) continue;

        $handle = @fopen($path, 'r+b');
        if ($handle === false || !flock($handle, LOCK_EX | LOCK_NB)) {
            if (is_resource($handle)) fclose($handle);
            continue;
        }
        $lockedModifiedAt = @filemtime($path);
        if (is_int($lockedModifiedAt) && $lockedModifiedAt <= $expiredBefore) {
            ftruncate($handle, 0);
            fflush($handle);
            @unlink($path);
        }
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function iam_heart_check_handoff_prepare_storage(string $directory): bool
{
    if ($directory === '' || is_link($directory)) return false;
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) return false;
    if (is_link($directory)) return false;
    if (!@chmod($directory, 0700)) return false;
    $permissions = @fileperms($directory);
    return is_int($permissions) && (($permissions & 0777) === 0700) && is_writable($directory);
}

function iam_heart_check_handoff_record_path(string $identifier, string $storageDirectory): string
{
    return rtrim($storageDirectory, DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . hash('sha256', $identifier)
        . '.handoff';
}

function iam_heart_check_handoff_aad(string $identifier): string
{
    return 'universal-mind-heart-check-handoff-v1|' . $identifier;
}

function iam_heart_check_handoff_write_all($handle, string $contents): bool
{
    $remaining = $contents;
    while ($remaining !== '') {
        $written = fwrite($handle, $remaining);
        if (!is_int($written) || $written < 1) return false;
        $remaining = substr($remaining, $written);
    }
    return true;
}

function iam_heart_check_handoff_set_cookie(string $identifier, int $expiresAt): bool
{
    return setcookie(IAM_HEART_CHECK_HANDOFF_COOKIE, $identifier, [
        'expires' => $expiresAt,
        'path' => '/vogue/iam/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function iam_heart_check_handoff_expire_cookie(): void
{
    setcookie(IAM_HEART_CHECK_HANDOFF_COOKIE, '', [
        'expires' => 1,
        'path' => '/vogue/iam/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}
