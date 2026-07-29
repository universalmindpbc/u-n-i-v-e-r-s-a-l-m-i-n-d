<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/happiness-secret-store.php';

const HAPPINESS_APPLE_PASS_TYPE = 'pass.tv.universalmind.happiness';
const HAPPINESS_APPLE_TEAM = '3458V3D263';
const HAPPINESS_APPLE_REGISTRATIONS = __DIR__ . '/happiness-apple-registrations.json';

function happiness_apple_credentials(): array
{
    return [
        'certificate' => happiness_secret('HAPPINESS_APPLE_CERT_PEM'),
        'key' => happiness_secret('HAPPINESS_APPLE_KEY_PEM'),
        'wwdr' => happiness_secret('HAPPINESS_APPLE_WWDR_PEM'),
    ];
}

function happiness_apple_ready(): bool
{
    $credentials = happiness_apple_credentials();
    return function_exists('proc_open') && class_exists('ZipArchive')
        && is_file($credentials['certificate']) && is_readable($credentials['certificate'])
        && is_file($credentials['key']) && is_readable($credentials['key'])
        && is_file($credentials['wwdr']) && is_readable($credentials['wwdr']);
}

function happiness_apple_registrations(): array
{
    $contents = @file_get_contents(HAPPINESS_APPLE_REGISTRATIONS);
    $decoded = is_string($contents) ? json_decode($contents, true) : null;
    return is_array($decoded) ? $decoded : ['schema_version' => 1, 'devices' => [], 'updated_at' => null];
}

function happiness_apple_write_registrations(array $registrations): void
{
    $registrations['updated_at'] = gmdate('c');
    $json = json_encode($registrations, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    $temporary = HAPPINESS_APPLE_REGISTRATIONS . '.tmp-' . bin2hex(random_bytes(5));
    if (@file_put_contents($temporary, $json, LOCK_EX) === false || !@rename($temporary, HAPPINESS_APPLE_REGISTRATIONS)) {
        @unlink($temporary);
        throw new RuntimeException('apple_registration_write_failed');
    }
    @chmod(HAPPINESS_APPLE_REGISTRATIONS, 0600);
}

function happiness_apple_auth_token(array $ledger): string
{
    $token = $ledger['member']['apple_authentication_token'] ?? '';
    if (!is_string($token) || strlen($token) < 32) throw new RuntimeException('apple_pass_authentication_token_missing');
    return $token;
}

function happiness_apple_run(array $command): void
{
    $pipes = [];
    $process = @proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($process)) throw new RuntimeException('apple_signing_process_unavailable');
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    if (proc_close($process) !== 0) throw new RuntimeException('apple_pass_signing_failed');
}

function happiness_apple_build_pass(array $ledger): string
{
    if (!happiness_apple_ready()) throw new RuntimeException('apple_pass_signing_not_configured');
    $baseArchive = __DIR__ . '/HAPPINESS.pkpass';
    if (!is_file($baseArchive)) throw new RuntimeException('apple_base_pass_missing');
    $temporary = sys_get_temp_dir() . '/happiness-pass-' . bin2hex(random_bytes(8));
    if (!@mkdir($temporary, 0700, true) && !is_dir($temporary)) throw new RuntimeException('apple_pass_temp_unavailable');
    $source = new ZipArchive();
    if ($source->open($baseArchive) !== true || !$source->extractTo($temporary)) throw new RuntimeException('apple_base_pass_invalid');
    $source->close();

    $passPath = $temporary . '/pass.json';
    $pass = json_decode((string) @file_get_contents($passPath), true);
    if (!is_array($pass)) throw new RuntimeException('apple_pass_json_invalid');
    $host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? 'staging.universalmind.tv'));
    $scheme = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')) ? 'https' : 'https';
    $pass['passTypeIdentifier'] = HAPPINESS_APPLE_PASS_TYPE;
    $pass['teamIdentifier'] = HAPPINESS_APPLE_TEAM;
    $pass['serialNumber'] = (string) $ledger['member']['pass_serial'];
    $pass['webServiceURL'] = $scheme . '://' . $host . '/vogue/iam/apple-wallet';
    $pass['authenticationToken'] = happiness_apple_auth_token($ledger);
    $pass['storeCard']['primaryFields'][0]['value'] = (string) $ledger['balance']['available_display'];
    $pass['storeCard']['auxiliaryFields'][0]['value'] = (string) $ledger['member']['display_id'];
    $pass['barcodes'][0]['altText'] = 'Redeem HAPPINESS In-store';
    @file_put_contents($passPath, json_encode($pass, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n", LOCK_EX);

    @unlink($temporary . '/manifest.json');
    @unlink($temporary . '/signature');
    $manifest = [];
    foreach (glob($temporary . '/*') ?: [] as $file) {
        if (!is_file($file)) continue;
        $manifest[basename($file)] = sha1_file($file);
    }
    $manifestPath = $temporary . '/manifest.json';
    @file_put_contents($manifestPath, json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n", LOCK_EX);
    $credentials = happiness_apple_credentials();
    happiness_apple_run([
        'openssl', 'smime', '-binary', '-sign', '-certfile', $credentials['wwdr'],
        '-signer', $credentials['certificate'], '-inkey', $credentials['key'],
        '-in', $manifestPath, '-out', $temporary . '/signature', '-outform', 'DER',
    ]);

    $output = $temporary . '/HAPPINESS.pkpass';
    $archive = new ZipArchive();
    if ($archive->open($output, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) throw new RuntimeException('apple_pass_archive_failed');
    foreach (array_keys($manifest) as $filename) $archive->addFile($temporary . '/' . $filename, $filename);
    $archive->addFile($manifestPath, 'manifest.json');
    $archive->addFile($temporary . '/signature', 'signature');
    $archive->close();
    return $output;
}

function happiness_apple_notify(array $ledger): int
{
    if (!happiness_apple_ready()) throw new RuntimeException('apple_pass_updates_not_configured');
    if (!function_exists('curl_init')) throw new RuntimeException('server_curl_unavailable');
    $registrations = happiness_apple_registrations();
    $credentials = happiness_apple_credentials();
    $tokens = [];
    foreach ($registrations['devices'] ?? [] as $device) {
        if (($device['serial'] ?? '') === $ledger['member']['pass_serial'] && is_string($device['push_token'] ?? null)) {
            $tokens[] = $device['push_token'];
        }
    }
    $accepted = 0;
    foreach (array_unique($tokens) as $token) {
        $curl = curl_init('https://api.push.apple.com/3/device/' . rawurlencode($token));
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => '{}',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
            CURLOPT_SSLCERT => $credentials['certificate'],
            CURLOPT_SSLKEY => $credentials['key'],
            CURLOPT_HTTPHEADER => ['apns-topic: ' . HAPPINESS_APPLE_PASS_TYPE, 'apns-priority: 5', 'content-type: application/json'],
        ]);
        curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($status === 200) $accepted += 1;
    }
    return $accepted;
}
