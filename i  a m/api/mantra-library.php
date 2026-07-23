<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const MANTRA_OWNER_KEY_HASH = 'e6a9c12b1512ebc1790482dbb21854d33e4217fdcabb1e49412de6f1309d690a';
const MANTRA_LIBRARY_PATH = __DIR__ . '/mantra-library.json';
const MANTRA_UPLOAD_DIR = __DIR__ . '/../a s s e t s/m a n t r a [ u p l o a d s ]';
const MANTRA_MAX_UPLOAD_BYTES = 12582912;
const MANTRA_MAX_GAIN = 15.849;

function mantra_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function mantra_session(): void
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

function mantra_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $originHost = $origin !== '' ? parse_url($origin, PHP_URL_HOST) : null;
    $requestHost = explode(':', $host, 2)[0];
    if (!is_string($originHost) || $requestHost === '' || !hash_equals(strtolower($requestHost), strtolower($originHost))) {
        mantra_json(['error' => 'A same-origin owner request is required.'], 403);
    }
}

function mantra_read_library(): array
{
    $contents = @file_get_contents(MANTRA_LIBRARY_PATH);
    $library = $contents !== false ? json_decode($contents, true) : null;
    if (!is_array($library) || !isset($library['banks']['tibet'], $library['banks']['ibiza'])) {
        mantra_json(['error' => 'The mantra library is unavailable.'], 500);
    }
    return $library;
}

function mantra_public(array $library, bool $authenticated): array
{
    $payload = ['library' => $library, 'authenticated' => $authenticated];
    if ($authenticated && isset($_SESSION['quantum_tree_csrf'])) {
        $payload['csrf_token'] = $_SESSION['quantum_tree_csrf'];
    }
    return $payload;
}

function mantra_write_library(array $library): array
{
    $library['updated_at'] = gmdate('c');
    $json = json_encode($library, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    $temporary = MANTRA_LIBRARY_PATH . '.tmp-' . bin2hex(random_bytes(6));
    if (file_put_contents($temporary, $json, LOCK_EX) === false || !@rename($temporary, MANTRA_LIBRARY_PATH)) {
        @unlink($temporary);
        mantra_json(['error' => 'The mantra library could not be saved.'], 500);
    }
    return $library;
}

function mantra_json_request(): array
{
    $body = file_get_contents('php://input');
    if ($body === false || $body === '' || strlen($body) > 32768) {
        mantra_json(['error' => 'Invalid request.'], 400);
    }
    $request = json_decode($body, true);
    if (!is_array($request)) {
        mantra_json(['error' => 'Invalid JSON request.'], 400);
    }
    return $request;
}

function mantra_require_owner(string $csrf): void
{
    if (($_SESSION['quantum_tree_owner'] ?? false) !== true) {
        mantra_json(['error' => 'Owner authentication is required.'], 401);
    }
    if (!isset($_SESSION['quantum_tree_csrf']) || !hash_equals($_SESSION['quantum_tree_csrf'], $csrf)) {
        mantra_json(['error' => 'Owner session verification failed. Refresh and sign in again.'], 403);
    }
}

function mantra_slot(array &$library, string $bank, int $slot): array
{
    if (!in_array($bank, ['tibet', 'ibiza'], true) || $slot < 1 || $slot > 6) {
        mantra_json(['error' => 'Choose a valid bank and one of its six slots.'], 422);
    }
    foreach ($library['banks'][$bank] as $index => $item) {
        if ((int) ($item['slot'] ?? 0) === $slot) return [$index, $item];
    }
    mantra_json(['error' => 'That mantra slot does not exist.'], 404);
}

function mantra_text(mixed $value, int $maximum, string $fallback = ''): string
{
    if (!is_string($value)) return $fallback;
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $maximum);
}

function mantra_fx_number(mixed $value, float $minimum, float $maximum, float $fallback): float
{
    if ($value === null) return $fallback;
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false || $number < $minimum || $number > $maximum) {
        mantra_json(['error' => 'One or more FX controls are outside their safe range.'], 422);
    }
    return round((float) $number, 4);
}

function mantra_fx_slot(mixed $raw): array
{
    $slot = is_array($raw) ? $raw : [];
    $reverb = is_array($slot['reverb'] ?? null) ? $slot['reverb'] : [];
    $spectral = is_array($slot['spectral_delay'] ?? null) ? $slot['spectral_delay'] : [];
    return [
        'reverb' => [
            'mix' => mantra_fx_number($reverb['mix'] ?? null, 0, 0.5, 0),
            'decay' => mantra_fx_number($reverb['decay'] ?? null, 0.2, 6, 2.4),
            'predelay' => mantra_fx_number($reverb['predelay'] ?? null, 0, 0.15, 0.025),
        ],
        'spectral_delay' => [
            'mix' => mantra_fx_number($spectral['mix'] ?? null, 0, 0.5, 0),
            'time' => mantra_fx_number($spectral['time'] ?? null, 0.02, 0.6, 0.18),
            'spread' => mantra_fx_number($spectral['spread'] ?? null, 0, 1, 0.45),
            'feedback' => mantra_fx_number($spectral['feedback'] ?? null, 0, 0.65, 0.18),
        ],
    ];
}

function mantra_fx_state(mixed $raw): array
{
    $fx = is_array($raw) ? $raw : [];
    $bypass = filter_var($fx['bypass'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($bypass === null) mantra_json(['error' => 'Choose a valid FX bypass setting.'], 422);
    return [
        'active' => ($fx['active'] ?? 'a') === 'b' ? 'b' : 'a',
        'bypass' => $bypass,
        'a' => mantra_fx_slot($fx['a'] ?? null),
        'b' => mantra_fx_slot($fx['b'] ?? null),
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
    $authenticated = false;
    if (isset($_COOKIE['iam_quantum_tree_owner'])) {
        mantra_session();
        $authenticated = ($_SESSION['quantum_tree_owner'] ?? false) === true;
    }
    mantra_json(mantra_public(mantra_read_library(), $authenticated));
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    mantra_json(['error' => 'Method not allowed.'], 405);
}

mantra_session();
mantra_same_origin();
$contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
$multipart = str_starts_with($contentType, 'multipart/form-data');
$request = $multipart ? $_POST : mantra_json_request();
$action = is_string($request['action'] ?? null) ? $request['action'] : '';

if ($action === 'login') {
    $now = time();
    $blockedUntil = (int) ($_SESSION['quantum_tree_blocked_until'] ?? 0);
    if ($blockedUntil > $now) {
        mantra_json(['error' => 'Too many attempts. Please wait and try again.'], 429);
    }
    $ownerKey = mantra_text($request['owner_key'] ?? '', 256);
    $valid = $ownerKey !== '' && hash_equals(MANTRA_OWNER_KEY_HASH, hash('sha256', $ownerKey));
    if (!$valid) {
        $attempts = (int) ($_SESSION['quantum_tree_login_attempts'] ?? 0) + 1;
        $_SESSION['quantum_tree_login_attempts'] = $attempts;
        if ($attempts >= 5) {
            $_SESSION['quantum_tree_blocked_until'] = $now + 60;
            $_SESSION['quantum_tree_login_attempts'] = 0;
        }
        mantra_json(['error' => 'Owner key not recognised.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['quantum_tree_owner'] = true;
    $_SESSION['quantum_tree_csrf'] = bin2hex(random_bytes(24));
    unset($_SESSION['quantum_tree_login_attempts'], $_SESSION['quantum_tree_blocked_until']);
    mantra_json(mantra_public(mantra_read_library(), true));
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    mantra_json(['authenticated' => false]);
}

$csrf = mantra_text($request['csrf_token'] ?? '', 96);
mantra_require_owner($csrf);
$library = mantra_read_library();
$bank = mantra_text($request['bank'] ?? '', 12);
$slot = filter_var($request['slot'] ?? null, FILTER_VALIDATE_INT);
if ($slot === false) mantra_json(['error' => 'Choose a sample slot.'], 422);
[$index, $current] = mantra_slot($library, $bank, (int) $slot);

if ($action === 'save') {
    $trimStart = filter_var($request['trim_start'] ?? null, FILTER_VALIDATE_FLOAT);
    $trimEnd = filter_var($request['trim_end'] ?? null, FILTER_VALIDATE_FLOAT);
    $gain = filter_var($request['gain'] ?? 1, FILTER_VALIDATE_FLOAT);
    $pan = filter_var($request['pan'] ?? 0, FILTER_VALIDATE_FLOAT);
    $speed = filter_var($request['speed'] ?? 1, FILTER_VALIDATE_FLOAT);
    $pitch = filter_var($request['pitch'] ?? 0, FILTER_VALIDATE_FLOAT);
    $pitchMotion = filter_var($request['pitch_motion'] ?? 0, FILTER_VALIDATE_FLOAT);
    if ($trimStart === false || $trimEnd === false || $trimStart < 0 || $trimEnd <= $trimStart || $trimEnd > 900) {
        mantra_json(['error' => 'Set a valid start and end point.'], 422);
    }
    if ($gain === false || $gain < 0 || $gain > MANTRA_MAX_GAIN || $pan === false || $pan < -1 || $pan > 1
        || $speed === false || $speed < 0.35 || $speed > 2 || $pitch === false || $pitch < -12 || $pitch > 12
        || $pitchMotion === false || $pitchMotion < 0 || $pitchMotion > 12) {
        mantra_json(['error' => 'One or more sound controls are outside their safe range.'], 422);
    }
    $pitchCurve = [];
    if (is_array($request['pitch_curve'] ?? null)) {
        foreach (array_slice($request['pitch_curve'], 0, 64) as $point) {
            $x = filter_var($point['x'] ?? null, FILTER_VALIDATE_FLOAT);
            $y = filter_var($point['y'] ?? null, FILTER_VALIDATE_FLOAT);
            if ($x === false || $y === false || $x < 0 || $x > 1 || $y < -12 || $y > 12) {
                mantra_json(['error' => 'The drawn pitch line contains an invalid point.'], 422);
            }
            $pitchCurve[] = ['x' => round((float) $x, 4), 'y' => round((float) $y, 2)];
        }
    }
    if (count($pitchCurve) < 2) $pitchCurve = [['x' => 0, 'y' => 0], ['x' => 1, 'y' => 0]];
    $ampRequest = is_array($request['amp_envelope'] ?? null) ? $request['amp_envelope'] : [];
    $attack = filter_var($ampRequest['attack'] ?? 0.02, FILTER_VALIDATE_FLOAT);
    $level = filter_var($ampRequest['level'] ?? 1, FILTER_VALIDATE_FLOAT);
    $release = filter_var($ampRequest['release'] ?? 0.08, FILTER_VALIDATE_FLOAT);
    if ($attack === false || $attack < 0 || $attack > 1 || $level === false || $level < 0 || $level > 1
        || $release === false || $release < 0 || $release > 1) {
        mantra_json(['error' => 'The amplitude envelope contains an invalid value.'], 422);
    }
    $current['label'] = mantra_text($request['label'] ?? '', 80, $current['label'] ?? 'Mantra');
    $current['phrase'] = mantra_text($request['phrase'] ?? '', 700, $current['phrase'] ?? '');
    $current['trim_start'] = round((float) $trimStart, 3);
    $current['trim_end'] = round((float) $trimEnd, 3);
    $current['gain'] = round((float) $gain, 3);
    $current['pan'] = round((float) $pan, 3);
    $current['speed'] = round((float) $speed, 3);
    $current['pitch'] = round((float) $pitch, 2);
    $current['pitch_motion'] = round((float) $pitchMotion, 2);
    $current['pitch_curve'] = $pitchCurve;
    $current['amp_envelope'] = [
        'attack' => round((float) $attack, 3),
        'level' => round((float) $level, 3),
        'release' => round((float) $release, 3),
    ];
    $current['fx'] = mantra_fx_state($request['fx'] ?? ($current['fx'] ?? []));
    $library['banks'][$bank][$index] = $current;
    mantra_json(mantra_public(mantra_write_library($library), true));
}

if ($action !== 'upload') {
    mantra_json(['error' => 'Unknown owner action.'], 400);
}

$upload = $_FILES['audio'] ?? null;
if (!is_array($upload) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    mantra_json(['error' => 'Choose an audio file to upload.'], 422);
}
if (($upload['size'] ?? 0) < 1 || $upload['size'] > MANTRA_MAX_UPLOAD_BYTES) {
    mantra_json(['error' => 'Audio files must be smaller than 12 MB.'], 422);
}
$extension = strtolower(pathinfo((string) ($upload['name'] ?? ''), PATHINFO_EXTENSION));
$allowedExtensions = ['m4a', 'mp3', 'wav', 'ogg'];
$allowedMimes = [
    'audio/mp4', 'audio/x-m4a', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
    'audio/wave', 'audio/vnd.wave', 'audio/ogg', 'application/ogg',
];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file((string) $upload['tmp_name']);
if (!in_array($extension, $allowedExtensions, true) || !in_array($mime, $allowedMimes, true)) {
    mantra_json(['error' => 'Upload an M4A, MP3, WAV, or OGG audio file.'], 422);
}
if (!is_dir(MANTRA_UPLOAD_DIR) && !mkdir(MANTRA_UPLOAD_DIR, 0755, true) && !is_dir(MANTRA_UPLOAD_DIR)) {
    mantra_json(['error' => 'The private upload directory is unavailable.'], 500);
}
$filename = sprintf('%s-%d-%s.%s', $bank, (int) $slot, gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4)), $extension);
$destination = MANTRA_UPLOAD_DIR . '/' . $filename;
if (!move_uploaded_file((string) $upload['tmp_name'], $destination)) {
    mantra_json(['error' => 'The audio file could not be stored.'], 500);
}

$current['label'] = mantra_text($request['label'] ?? '', 80, $current['label'] ?? 'Mantra');
$current['phrase'] = mantra_text($request['phrase'] ?? '', 700, $current['phrase'] ?? '');
$current['asset'] = 'a s s e t s/m a n t r a [ u p l o a d s ]/' . $filename;
$current['source_type'] = mantra_text($request['source_type'] ?? 'owner_upload', 32, 'owner_upload');
$current['rights_status'] = 'private_mockup_only';
$current['reserved'] = false;
$current['trim_start'] = 0;
$current['trim_end'] = max(0.01, round((float) ($request['duration'] ?? 1), 3));
$library['banks'][$bank][$index] = $current;
mantra_json(mantra_public(mantra_write_library($library), true));
