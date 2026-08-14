<?php
declare(strict_types=1);

require_once __DIR__ . '/../i  a m/api/heart-check-handoff-lib.php';

function require_handoff_condition(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

require_handoff_condition(function_exists('openssl_encrypt'), 'OpenSSL encryption is required.');
require_handoff_condition(function_exists('openssl_decrypt'), 'OpenSSL decryption is required.');

$storageDirectory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR
    . 'iam-heart-check-handoff-test-'
    . bin2hex(random_bytes(8));
require_handoff_condition(mkdir($storageDirectory, 0700), 'Could not create the isolated test store.');

$key = random_bytes(32);
$wrongKey = random_bytes(32);
$now = 1786752000;
$checkin = 'I am calm and ready for music';
$physiology = [
    'heart_rate_bpm' => 72,
    'measurement_duration_seconds' => 10,
    'measurement_timing' => 'immediately_after_current_self_report',
    'source' => 'shen_quick_hr',
];

try {
    require_handoff_condition(iam_heart_check_handoff_decode_key('') === null, 'An absent key must fail closed.');
    require_handoff_condition(iam_heart_check_handoff_decode_key('not-a-256-bit-key') === null, 'A weak key must fail closed.');
    require_handoff_condition(iam_heart_check_handoff_decode_key(bin2hex($key)) === $key, 'Hex keys must decode exactly.');
    require_handoff_condition(iam_heart_check_handoff_decode_key('base64:' . base64_encode($key)) === $key, 'Base64 keys must decode exactly.');

    $identifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
    require_handoff_condition(is_string($identifier), 'A valid handoff must be issued.');
    require_handoff_condition(preg_match('/^[a-f0-9]{64}$/D', $identifier) === 1, 'The cookie identifier must contain 256 random bits.');

    $recordPath = iam_heart_check_handoff_record_path($identifier, $storageDirectory);
    $encryptedRecord = file_get_contents($recordPath);
    require_handoff_condition(is_string($encryptedRecord) && $encryptedRecord !== '', 'The encrypted record must exist.');
    require_handoff_condition(strpos($encryptedRecord, $checkin) === false, 'Raw check-in text must not be stored.');
    require_handoff_condition(strpos($encryptedRecord, 'heart_rate_bpm') === false, 'Raw physiology keys must not be stored outside ciphertext.');
    $envelope = json_decode($encryptedRecord, true);
    require_handoff_condition(
        is_array($envelope) && iam_heart_check_handoff_has_exact_keys($envelope, ['version', 'nonce', 'tag', 'ciphertext']),
        'The server record must expose only the authenticated-encryption envelope.'
    );

    $consumed = iam_heart_check_handoff_consume($identifier, $checkin, $key, $storageDirectory, $now + 1);
    require_handoff_condition($consumed === $physiology, 'A matching current check-in must receive the exact physiology shape.');
    require_handoff_condition(!is_file($recordPath), 'The record must be deleted before upstream work.');
    require_handoff_condition(
        iam_heart_check_handoff_consume($identifier, $checkin, $key, $storageDirectory, $now + 1) === null,
        'A consumed handoff must not replay.'
    );

    $expiredIdentifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
    require_handoff_condition(is_string($expiredIdentifier), 'The TTL fixture must issue.');
    require_handoff_condition(
        iam_heart_check_handoff_consume($expiredIdentifier, $checkin, $key, $storageDirectory, $now + 60) === null,
        'The handoff must be unavailable at 60 seconds.'
    );

    $mismatchIdentifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
    require_handoff_condition(is_string($mismatchIdentifier), 'The digest-mismatch fixture must issue.');
    require_handoff_condition(
        iam_heart_check_handoff_consume($mismatchIdentifier, 'I am a different check-in', $key, $storageDirectory, $now + 1) === null,
        'A different check-in digest must not receive physiology.'
    );
    require_handoff_condition(
        iam_heart_check_handoff_consume($mismatchIdentifier, $checkin, $key, $storageDirectory, $now + 1) === null,
        'A digest mismatch must still consume the handoff.'
    );

    $wrongKeyIdentifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
    require_handoff_condition(is_string($wrongKeyIdentifier), 'The authentication fixture must issue.');
    require_handoff_condition(
        iam_heart_check_handoff_consume($wrongKeyIdentifier, $checkin, $wrongKey, $storageDirectory, $now + 1) === null,
        'A different key must fail authenticated decryption.'
    );

    $tamperedIdentifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
    require_handoff_condition(is_string($tamperedIdentifier), 'The ciphertext-tampering fixture must issue.');
    $tamperedPath = iam_heart_check_handoff_record_path($tamperedIdentifier, $storageDirectory);
    $tamperedEnvelope = json_decode((string) file_get_contents($tamperedPath), true);
    $ciphertext = base64_decode((string) $tamperedEnvelope['ciphertext'], true);
    require_handoff_condition(is_string($ciphertext) && $ciphertext !== '', 'The tampering fixture must contain ciphertext.');
    $ciphertext[0] = chr(ord($ciphertext[0]) ^ 1);
    $tamperedEnvelope['ciphertext'] = base64_encode($ciphertext);
    file_put_contents($tamperedPath, json_encode($tamperedEnvelope, JSON_UNESCAPED_SLASHES), LOCK_EX);
    require_handoff_condition(
        iam_heart_check_handoff_consume($tamperedIdentifier, $checkin, $key, $storageDirectory, $now + 1) === null,
        'Modified ciphertext must fail GCM authentication.'
    );

    $missingKeyIdentifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
    require_handoff_condition(is_string($missingKeyIdentifier), 'The missing-key fixture must issue.');
    require_handoff_condition(
        iam_heart_check_handoff_consume($missingKeyIdentifier, $checkin, null, $storageDirectory, $now + 1) === null,
        'An unavailable secret must fail closed.'
    );
    require_handoff_condition(
        !is_file(iam_heart_check_handoff_record_path($missingKeyIdentifier, $storageDirectory)),
        'A missing secret must not leave the one-use record available.'
    );

    $normalBody = json_encode([
        'checkin' => $checkin,
        'environment_context' => ['local_time' => '2026-08-15T10:00:00+10:00'],
    ], JSON_UNESCAPED_SLASHES);
    $normalPrepared = iam_heart_check_handoff_prepare_worker_body((string) $normalBody, null);
    require_handoff_condition(json_decode($normalPrepared, true) === json_decode((string) $normalBody, true), 'The no-HR request must remain semantically unchanged.');

    $spoofedBody = json_encode([
        'checkin' => $checkin,
        'momentary_physiology' => ['heart_rate_bpm' => 240],
    ], JSON_UNESCAPED_SLASHES);
    $spoofedPrepared = json_decode(iam_heart_check_handoff_prepare_worker_body((string) $spoofedBody, null), true);
    require_handoff_condition(!array_key_exists('momentary_physiology', $spoofedPrepared), 'Untrusted browser physiology must be stripped.');

    $trustedPrepared = json_decode(iam_heart_check_handoff_prepare_worker_body((string) $spoofedBody, $physiology), true);
    require_handoff_condition($trustedPrepared['momentary_physiology'] === $physiology, 'Only trusted consumed physiology may reach the Worker.');

    if (function_exists('pcntl_fork') && function_exists('pcntl_waitpid')) {
        $concurrentIdentifier = iam_heart_check_handoff_issue($physiology, $checkin, $key, $storageDirectory, $now);
        require_handoff_condition(is_string($concurrentIdentifier), 'The concurrency fixture must issue.');
        $barrier = $storageDirectory . DIRECTORY_SEPARATOR . 'concurrency.barrier';
        touch($barrier);
        $children = [];
        for ($index = 0; $index < 2; $index += 1) {
            $pid = pcntl_fork();
            require_handoff_condition($pid >= 0, 'Could not fork the concurrency fixture.');
            if ($pid === 0) {
                while (is_file($barrier)) usleep(1000);
                $result = iam_heart_check_handoff_consume($concurrentIdentifier, $checkin, $key, $storageDirectory, $now + 1);
                file_put_contents($storageDirectory . DIRECTORY_SEPARATOR . 'child-' . getmypid(), $result === null ? '0' : '1');
                exit(0);
            }
            $children[] = $pid;
        }
        unlink($barrier);
        foreach ($children as $pid) pcntl_waitpid($pid, $status);
        $acceptedCount = 0;
        foreach ($children as $pid) {
            $resultPath = $storageDirectory . DIRECTORY_SEPARATOR . 'child-' . $pid;
            $acceptedCount += (int) file_get_contents($resultPath);
            unlink($resultPath);
        }
        require_handoff_condition($acceptedCount === 1, 'Concurrent consumers must allow exactly one use.');
    }

    echo "heart_check_handoff=passed\n";
} finally {
    foreach (glob($storageDirectory . DIRECTORY_SEPARATOR . '*') ?: [] as $path) {
        if (is_file($path)) unlink($path);
    }
    rmdir($storageDirectory);
}
