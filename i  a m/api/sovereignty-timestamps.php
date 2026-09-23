<?php
declare(strict_types=1);
require_once __DIR__ . '/sovereignty-lib.php';

// Small, bounded OpenTimestamps v1 protocol adapter. No private document or
// member identifier is sent: calendars receive a randomly blinded digest.
// Format: https://github.com/opentimestamps/python-opentimestamps
const SOVEREIGNTY_OTS_MAGIC = "\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94";
const SOVEREIGNTY_CALENDARS = ['https://alice.btc.calendar.opentimestamps.org', 'https://bob.btc.calendar.opentimestamps.org'];

function sovereignty_ots_bytes(string $bytes, int &$at, int $length): string {
    if ($length < 0 || $at + $length > strlen($bytes)) throw new RuntimeException('Truncated timestamp.');
    $value = substr($bytes, $at, $length); $at += $length; return $value;
}
function sovereignty_ots_uint(string $bytes, int &$at): int {
    $value = 0;
    for ($shift = 0; $shift <= 28; $shift += 7) {
        $byte = ord(sovereignty_ots_bytes($bytes, $at, 1)); $value |= ($byte & 127) << $shift;
        if (($byte & 128) === 0) return $value;
    }
    throw new RuntimeException('Timestamp integer too large.');
}
function sovereignty_ots_varbytes(string $bytes, int &$at, int $max): string {
    $length = sovereignty_ots_uint($bytes, $at);
    if ($length > $max) throw new RuntimeException('Timestamp field too large.');
    return sovereignty_ots_bytes($bytes, $at, $length);
}
function sovereignty_ots_tree(string $bytes, int &$at, string $message, array &$leaves, string $path = '', int $depth = 0): void {
    if ($depth > 100 || strlen($message) > 4096 || count($leaves) > 64) throw new RuntimeException('Timestamp too complex.');
    do {
        if (count($leaves) >= 64) throw new RuntimeException('Timestamp too complex.');
        $tag = ord(sovereignty_ots_bytes($bytes, $at, 1)); $more = $tag === 255;
        if ($more) $tag = ord(sovereignty_ots_bytes($bytes, $at, 1));
        $start = $at - 1;
        if ($tag === 0) {
            $kind = bin2hex(sovereignty_ots_bytes($bytes, $at, 8));
            $payload = sovereignty_ots_varbytes($bytes, $at, 8192); $p = 0;
            $leaf = ['message'=>$message, 'path'=>$path, 'kind'=>$kind];
            if ($kind === '83dfe30d2ef90c8e') $leaf['uri'] = sovereignty_ots_varbytes($payload, $p, 1000);
            elseif ($kind === '0588960d73d71901') $leaf['height'] = sovereignty_ots_uint($payload, $p);
            else $p = strlen($payload); // Preserve unfamiliar attestations; never count them as Bitcoin proof.
            if ($p !== strlen($payload)) throw new RuntimeException('Invalid timestamp attestation.');
            $leaves[] = $leaf;
        } else {
            if ($tag === 240 || $tag === 241) {
                $arg = sovereignty_ots_varbytes($bytes, $at, 4096);
                if ($arg === '') throw new RuntimeException('Empty timestamp operation.');
                $next = $tag === 240 ? $message . $arg : $arg . $message;
            } else {
                $next = match ($tag) {
                    8 => hash('sha256', $message, true), 2 => hash('sha1', $message, true),
                    3 => hash('ripemd160', $message, true), 242 => strrev($message), 243 => bin2hex($message),
                    default => throw new RuntimeException('Unsupported timestamp operation.')
                };
            }
            $operation = substr($bytes, $start, $at - $start);
            sovereignty_ots_tree($bytes, $at, $next, $leaves, $path . $operation, $depth + 1);
        }
    } while ($more);
}
function sovereignty_ots_parse(string $bytes, string $digest, bool $detached = false): array {
    // A detached SHA-256 proof starts with 32 bytes. Calendar upgrades start
    // at an intermediate tree message, which may include appended/prepended
    // bytes (the public calendars commonly return 44-byte commitments).
    $length = strlen($digest);
    if (strlen($bytes) > 65536 || $length < 1 || $length > 4096
        || ($detached && $length !== 32)) throw new RuntimeException('Invalid timestamp size.');
    $at = 0;
    if ($detached) {
        $header = SOVEREIGNTY_OTS_MAGIC . "\x01\x08" . $digest;
        if (!hash_equals($header, sovereignty_ots_bytes($bytes, $at, strlen($header)))) throw new RuntimeException('Timestamp file binding mismatch.');
    }
    $leaves = []; sovereignty_ots_tree($bytes, $at, $digest, $leaves);
    if ($at !== strlen($bytes) || !$leaves) throw new RuntimeException('Invalid timestamp trailing data.');
    return $leaves;
}
function sovereignty_calendar_allowed(string $uri): bool {
    return preg_match('~\Ahttps://[a-z0-9.-]+\.calendar\.(opentimestamps\.org|eternitywall\.com|catallaxy\.com)/?\z~', $uri) === 1;
}
function sovereignty_timestamp_http(string $url, ?string $payload = null): string {
    $host = parse_url($url, PHP_URL_HOST);
    if (parse_url($url, PHP_URL_SCHEME) !== 'https'
        || (!sovereignty_calendar_allowed('https://' . $host) && !in_array($host, ['blockstream.info','mempool.space'], true))) throw new RuntimeException('Timestamp host not allowed.');
    $body = ''; $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION=>false, CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT=>4, CURLOPT_TIMEOUT=>8, CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_HTTPHEADER=>['Accept: application/vnd.opentimestamps.v1', 'Content-Type: application/octet-stream'],
        CURLOPT_USERAGENT=>'UniversalSovereignty/1',
        CURLOPT_WRITEFUNCTION=>static function($handle, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 65536) return 0;
            $body .= $chunk; return strlen($chunk);
        }]);
    if ($payload !== null) curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>$payload]);
    try {
        curl_exec($curl);
        if (curl_getinfo($curl, CURLINFO_HTTP_CODE) !== 200 || curl_errno($curl)) throw new RuntimeException('Timestamp service pending.');
        return $body;
    } finally { curl_close($curl); }
}

// Confirmation uses two public chain indexes. This is deliberately labelled
// explorer verification, not independent Bitcoin full-node verification.
function sovereignty_bitcoin_verify(array $leaf): ?array {
    $height = $leaf['height'] ?? 0;
    if ($height < 1 || $height > 5000000 || strlen($leaf['message']) !== 32) return null;
    $hashes = []; $headers = []; $tips = [];
    foreach (['https://blockstream.info/api', 'https://mempool.space/api'] as $base) {
        $hash = trim(sovereignty_timestamp_http($base . '/block-height/' . $height));
        if (!preg_match('/\A[a-f0-9]{64}\z/', $hash)) return null;
        $header = trim(sovereignty_timestamp_http($base . '/block/' . $hash . '/header'));
        if (!preg_match('/\A[a-f0-9]{160}\z/', $header)) return null;
        $tip = trim(sovereignty_timestamp_http($base . '/blocks/tip/height'));
        if (!ctype_digit($tip) || (int) $tip < $height + 5) return null;
        $hashes[] = $hash; $headers[] = $header; $tips[] = (int) $tip;
    }
    if ($hashes[0] !== $hashes[1] || $headers[0] !== $headers[1]) return null;
    $raw = hex2bin($headers[0]);
    $actual = bin2hex(strrev(hash('sha256', hash('sha256', $raw, true), true)));
    if (!hash_equals($hashes[0], $actual) || !hash_equals(substr($raw, 36, 32), $leaf['message'])) return null;
    $bits = unpack('V', substr($raw, 72, 4))[1]; $exponent = $bits >> 24; $mantissa = $bits & 0x7fffff;
    if (($bits & 0x800000) || $exponent < 3 || $exponent > 32 || $mantissa === 0) return null;
    $target = str_pad(str_pad(dechex($mantissa), 6, '0', STR_PAD_LEFT) . str_repeat('00', $exponent - 3), 64, '0', STR_PAD_LEFT);
    if (strcmp($actual, $target) > 0) return null;
    return ['state'=>'bitcoin_confirmed', 'verification'=>'two_public_explorers', 'height'=>$height,
        'block_hash'=>$actual, 'block_time'=>unpack('V', substr($raw, 68, 4))[1],
        'confirmations'=>min($tips)-$height+1, 'verified_at'=>gmdate('c')];
}

function sovereignty_timestamp_bundle(string $eventId, string $body, bool $testing = false): array {
    $directory = SOVEREIGNTY_PRIVATE . ($testing ? '/qa-timestamps' : '/timestamps');
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Timestamp storage unavailable.');
    if (!preg_match('/\A[a-f0-9]{48}\z/', $eventId)) throw new RuntimeException('Invalid timestamp event.');
    $lock = fopen($directory . '/' . $eventId . '.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        if ($lock) fclose($lock);
        throw new RuntimeException('Timestamp already running.');
    }
    try { return sovereignty_timestamp_locked($directory, $eventId, $body); }
    finally { flock($lock, LOCK_UN); fclose($lock); }
}

function sovereignty_timestamp_locked(string $directory, string $eventId, string $body): array {
    $path = $directory . '/' . $eventId . '.json'; $digest = hash('sha256', $body, true);
    $state = is_file($path) ? json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR)
        : ['event_id'=>$eventId, 'bundle_sha256'=>bin2hex($digest), 'nonce'=>bin2hex(random_bytes(32)), 'state'=>'not_submitted', 'proofs'=>[]];
    if (!hash_equals($state['bundle_sha256'], bin2hex($digest))) throw new RuntimeException('Timestamp bundle changed.');
    if ($state['state'] === 'bitcoin_confirmed') return $state;
    if (isset($state['last_attempt']) && time() - $state['last_attempt'] < 600) return $state;
    $state['last_attempt'] = time(); sovereignty_atomic($path, sovereignty_json($state));
    $nonce = hex2bin($state['nonce']); $prefix = "\xf0\x20" . $nonce . "\x08";
    $blinded = hash('sha256', $digest . $nonce, true);
    $header = SOVEREIGNTY_OTS_MAGIC . "\x01\x08" . $digest;
    foreach (SOVEREIGNTY_CALENDARS as $calendar) {
        try {
            if (!isset($state['proofs'][$calendar])) {
                $response = sovereignty_timestamp_http($calendar . '/digest', $blinded);
                sovereignty_ots_parse($response, $blinded);
                $proof = $header . $prefix . $response;
                $state['proofs'][$calendar] = base64_encode($proof);
                $state['state'] = 'pending_bitcoin';
                sovereignty_atomic($path, sovereignty_json($state));
            }
            $proof = base64_decode($state['proofs'][$calendar], true);
            $leaves = sovereignty_ots_parse($proof, $digest, true); $upgrades = 0;
            foreach ($leaves as $leaf) {
                if (isset($leaf['height'])) {
                    $verified = sovereignty_bitcoin_verify($leaf);
                    if ($verified !== null) { $state = array_merge($state, $verified); break; }
                } elseif (isset($leaf['uri']) && sovereignty_calendar_allowed($leaf['uri']) && $upgrades++ < 2) {
                    try {
                        $response = sovereignty_timestamp_http(rtrim($leaf['uri'], '/') . '/timestamp/' . bin2hex($leaf['message']));
                        $upgraded = sovereignty_ots_parse($response, $leaf['message']);
                        foreach ($upgraded as $candidate) {
                            if (!isset($candidate['height'])) continue;
                            $newProof = $header . $leaf['path'] . $response;
                            sovereignty_ots_parse($newProof, $digest, true);
                            $state['proofs'][$calendar] = base64_encode($newProof);
                            $verified = sovereignty_bitcoin_verify($candidate);
                            if ($verified !== null) { $state = array_merge($state, $verified); break; }
                        }
                    } catch (Throwable $error) { /* Keep the existing proof and retry later. */ }
                }
                if ($state['state'] === 'bitcoin_confirmed') break;
            }
        } catch (Throwable $error) { /* Independent calendar; bounded retry on the next scheduled run. */ }
        if ($state['state'] === 'bitcoin_confirmed') break;
    }
    if ($state['state'] === 'bitcoin_confirmed') {
        // Standalone standard-format proof, retained privately for owner export.
        sovereignty_atomic($directory . '/' . $eventId . '.ots', base64_decode($state['proofs'][$calendar], true));
    }
    sovereignty_atomic($path, sovereignty_json($state)); return $state;
}
