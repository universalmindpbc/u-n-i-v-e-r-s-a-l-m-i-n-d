<?php
declare(strict_types=1);
require_once __DIR__ . '/sovereignty-lib.php';

// This worker is invoked by a server cron (CLI) or an authenticated POST.
// It is NEVER invoked by login, and never receives a password.
function sovereignty_vaults(array $config): array {
    $vaults = $config['vaults'] ?? [];
    $days = $config['retention_days'] ?? null;
    if (count($vaults) !== 4 || !is_int($days) || $days < 1 || $days > 3000) {
        throw new RuntimeException('Four vaults and an approved retention period are required.');
    }
    $locations = []; $accounts = []; $providers = []; $ids = [];
    foreach ($vaults as $v) {
        foreach (['id','provider','account_label','region','endpoint','bucket','access_key','secret_key'] as $field) {
            if (!is_string($v[$field] ?? null) || $v[$field] === '') throw new RuntimeException('Incomplete vault configuration.');
        }
        $url = parse_url($v['endpoint']);
        $host = $url['host'] ?? '';
        if (($url['scheme'] ?? '') !== 'https' || isset($url['user']) || isset($url['pass'])
            || isset($url['port']) || isset($url['query']) || isset($url['fragment'])
            || !in_array($url['path'] ?? '', ['', '/'], true)
            || !preg_match('/\A[a-z0-9.-]+\.(amazonaws\.com|backblazeb2\.com)\z/', $host)
            || !preg_match('/\A[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]\z/', $v['bucket'])
            || !preg_match('/\A[a-zA-Z0-9_-]{1,40}\z/', $v['id'])) throw new RuntimeException('Invalid vault configuration.');
        $provider = str_ends_with($host, '.amazonaws.com') ? 'aws' : 'backblaze';
        if ($v['provider'] !== $provider) throw new RuntimeException('Vault provider mismatch.');
        $locations[] = $host . '/' . $v['bucket']; $accounts[] = $provider . '/' . $v['account_label'];
        $providers[] = $provider; $ids[] = $v['id'];
    }
    if (count(array_unique($locations)) !== 4 || count(array_unique($ids)) !== 4
        || count(array_unique($providers)) < 2 || count(array_unique($accounts)) < 2) {
        throw new RuntimeException('Vaults must span four locations and at least two providers/accounts.');
    }
    return $vaults;
}

function sovereignty_s3(array $vault, string $method, string $object, string $body = '', array $extra = [], ?string $version = null): array {
    $host = parse_url($vault['endpoint'], PHP_URL_HOST);
    $uri = '/' . rawurlencode($vault['bucket']) . '/' . implode('/', array_map('rawurlencode', explode('/', $object)));
    $query = $version === null ? '' : 'versionId=' . rawurlencode($version);
    $now = gmdate('Ymd\THis\Z'); $day = substr($now, 0, 8); $hash = hash('sha256', $body);
    $headers = ['host'=>$host, 'x-amz-content-sha256'=>$hash, 'x-amz-date'=>$now] + $extra;
    if (!empty($vault['session_token'])) $headers['x-amz-security-token'] = $vault['session_token'];
    ksort($headers); $canonical = '';
    foreach ($headers as $name=>$value) $canonical .= $name . ':' . trim($value) . "\n";
    $signed = implode(';', array_keys($headers));
    $request = $method . "\n" . $uri . "\n" . $query . "\n" . $canonical . "\n" . $signed . "\n" . $hash;
    $scope = $day . '/' . $vault['region'] . '/s3/aws4_request';
    $key = hash_hmac('sha256', $day, 'AWS4' . $vault['secret_key'], true);
    foreach ([$vault['region'], 's3', 'aws4_request'] as $part) $key = hash_hmac('sha256', $part, $key, true);
    $signature = hash_hmac('sha256', 'AWS4-HMAC-SHA256' . "\n" . $now . "\n" . $scope . "\n" . hash('sha256', $request), $key);
    $headers['authorization'] = 'AWS4-HMAC-SHA256 Credential=' . $vault['access_key'] . '/' . $scope . ', SignedHeaders=' . $signed . ', Signature=' . $signature;
    $lines = []; foreach ($headers as $name=>$value) $lines[] = $name . ': ' . $value;
    $result = (object) ['headers'=>[]];
    $curl = curl_init(rtrim($vault['endpoint'], '/') . $uri . ($query === '' ? '' : '?' . $query));
    curl_setopt_array($curl, [CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_HTTPHEADER=>$lines,
        CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>20,
        CURLOPT_FOLLOWLOCATION=>false, CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
        CURLOPT_HEADERFUNCTION=>static function($handle, string $line) use ($result): int {
            if (str_starts_with($line, 'HTTP/')) $result->headers = [];
            $colon = strpos($line, ':');
            if ($colon !== false) $result->headers[strtolower(trim(substr($line, 0, $colon)))] = trim(substr($line, $colon+1));
            return strlen($line);
        }]);
    if ($method === 'PUT') curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    if ($method === 'HEAD') curl_setopt($curl, CURLOPT_NOBODY, true);
    return [$curl, $result];
}

function sovereignty_locked_copy(array $vault, string $object, string $hash, int $bytes, string $retainUntil, ?string $version = null): ?array {
    [$curl, $result] = sovereignty_s3($vault, 'HEAD', $object, '', [], $version);
    try {
        curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_HTTP_CODE); $h = $result->headers;
        if ($status !== 200 || ($h['x-amz-meta-sha256'] ?? '') !== $hash
            || (int) ($h['content-length'] ?? 0) !== $bytes
            || ($h['x-amz-object-lock-mode'] ?? '') !== 'COMPLIANCE'
            || strtotime($h['x-amz-object-lock-retain-until-date'] ?? '') < strtotime($retainUntil)
            || !is_string($h['x-amz-version-id'] ?? null) || in_array($h['x-amz-version-id'], ['', 'null'], true)) return null;
        return ['state'=>'secured', 'version_id'=>$h['x-amz-version-id'],
            'retained_until'=>$h['x-amz-object-lock-retain-until-date'], 'verified_at'=>gmdate('c'), 'sha256'=>$hash];
    } finally { curl_close($curl); }
}

function sovereignty_deliver(array $config, array $vaults, string $path): array {
    $event = json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
    $document = (string) file_get_contents(SOVEREIGNTY_PRIVATE . '/document.encrypted.json');
    if (!hash_equals($event['document_encrypted_sha256'], hash('sha256', $document))) throw new RuntimeException('Document version mismatch.');
    $body = sovereignty_json(['schema'=>1, 'entry'=>$event, 'document'=>json_decode($document, true, 16, JSON_THROW_ON_ERROR)]);
    $hash = hash('sha256', $body);
    $object = 'universal-sovereignty/' . $config['environment'] . '/' . $event['event_id'] . '.json';
    $statePath = SOVEREIGNTY_PRIVATE . '/delivery/' . $event['event_id'] . '.json';
    $state = is_file($statePath) ? json_decode((string) file_get_contents($statePath), true, 32, JSON_THROW_ON_ERROR)
        : ['event_id'=>$event['event_id'], 'retained_until'=>gmdate('Y-m-d\TH:i:s\Z', time()+$config['retention_days']*86400),
            'vaults'=>[], 'blockchain'=>'not_submitted'];
    $retention = $state['retained_until'];
    // Preserve the approved period even if a queued event waited for a long time.
    if (strtotime($retention) <= time()) throw new RuntimeException('Retention expired before delivery; owner review required.');
    $multi = curl_multi_init(); $uploads = [];
    try {
        foreach ($vaults as $vault) {
            $previous = $state['vaults'][$vault['id']]['version_id'] ?? null;
            $verified = sovereignty_locked_copy($vault, $object, $hash, strlen($body), $retention, $previous);
            if ($verified !== null) { $state['vaults'][$vault['id']] = $verified; continue; }
            $state['vaults'][$vault['id']] = ['state'=>'pending'];
            [$curl, $response] = sovereignty_s3($vault, 'PUT', $object, $body, [
                'content-type'=>'application/json', 'content-md5'=>base64_encode(md5($body, true)),
                'x-amz-meta-sha256'=>$hash, 'x-amz-object-lock-mode'=>'COMPLIANCE',
                'x-amz-object-lock-retain-until-date'=>$retention]);
            $uploads[] = [$vault, $curl, $response]; curl_multi_add_handle($multi, $curl);
        }
        // All outstanding writes start together, wholly outside the login path.
        do { $code = curl_multi_exec($multi, $running); if ($running) curl_multi_select($multi, 0.5); }
        while ($running && $code === CURLM_OK);
        foreach ($uploads as [$vault, $curl, $response]) {
            $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            if ($status >= 200 && $status < 300) {
                $verified = sovereignty_locked_copy($vault, $object, $hash, strlen($body), $retention,
                    $response->headers['x-amz-version-id'] ?? null);
                if ($verified !== null) $state['vaults'][$vault['id']] = $verified;
            }
        }
    } finally {
        foreach ($uploads as [$vault, $curl, $response]) { curl_multi_remove_handle($multi, $curl); curl_close($curl); }
        curl_multi_close($multi);
        sovereignty_atomic($statePath, sovereignty_json($state));
    }
    return $state;
}

function sovereignty_worker(array $config): array {
    $vaults = sovereignty_vaults($config);
    if (!function_exists('curl_multi_init')) throw new RuntimeException('cURL unavailable.');
    $dir = SOVEREIGNTY_PRIVATE . '/delivery';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('Delivery storage unavailable.');
    $lock = fopen(SOVEREIGNTY_PRIVATE . '/worker.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Worker already running.');
    try {
        $processed = 0; $secured = 0;
        foreach (glob(SOVEREIGNTY_PRIVATE . '/events/*.json') ?: [] as $path) {
            $event = json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
            $stateFile = $dir . '/' . $event['event_id'] . '.json';
            $existing = is_file($stateFile) ? json_decode((string) file_get_contents($stateFile), true) : [];
            $ids = array_column($vaults, 'id');
            $done = array_filter($existing['vaults'] ?? [], static fn($v,$id):bool=>in_array($id,$ids,true)&&($v['state']??'')==='secured', ARRAY_FILTER_USE_BOTH);
            if (count($done) === 4) continue;
            $state = sovereignty_deliver($config, $vaults, $path); $processed++;
            if (count(array_filter($state['vaults'], static fn($v):bool=>($v['state']??'')==='secured')) === 4) $secured++;
            if ($processed >= 5) break;
        }
        return ['processed'=>$processed, 'four_copies_secured'=>$secured];
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}

if (defined('SOVEREIGNTY_WORKER_LIBRARY_ONLY')) return;
header('Content-Type: application/json'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow');
try {
    $config = sovereignty_config();
    if (PHP_SAPI !== 'cli' && (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !sovereignty_admin_valid($config))) {
        http_response_code(403); echo '{"error":"Forbidden"}'; exit;
    }
    echo sovereignty_json(sovereignty_worker($config));
} catch (Throwable $error) { http_response_code(503); echo '{"error":"Archive delivery pending configuration or retry"}'; }
