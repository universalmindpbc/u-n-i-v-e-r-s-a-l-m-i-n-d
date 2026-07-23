<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

function voice_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function voice_session(): void
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

function voice_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $originHost = $origin !== '' ? parse_url($origin, PHP_URL_HOST) : null;
    $requestHost = explode(':', $host, 2)[0];
    if (!is_string($originHost) || $requestHost === '' || !hash_equals(strtolower($requestHost), strtolower($originHost))) {
        voice_json(['error' => 'A same-origin owner request is required.'], 403);
    }
}

function voice_text(mixed $value, int $maximum): string
{
    if (!is_string($value)) return '';
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return function_exists('mb_substr') ? mb_substr($value, 0, $maximum) : substr($value, 0, $maximum);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    voice_json(['error' => 'Method not allowed.'], 405);
}

voice_session();
voice_same_origin();

if (($_SESSION['quantum_tree_owner'] ?? false) !== true) {
    voice_json(['error' => 'Owner authentication is required.'], 401);
}

$body = file_get_contents('php://input');
if ($body === false || $body === '' || strlen($body) > 8192) {
    voice_json(['error' => 'Invalid voice request.'], 400);
}
$request = json_decode($body, true);
if (!is_array($request)) {
    voice_json(['error' => 'Invalid JSON request.'], 400);
}

$csrf = voice_text($request['csrf_token'] ?? '', 96);
if (!isset($_SESSION['quantum_tree_csrf']) || !hash_equals($_SESSION['quantum_tree_csrf'], $csrf)) {
    voice_json(['error' => 'Owner session verification failed. Refresh and sign in again.'], 403);
}

$presets = [
    'human-clear' => ['voice' => 'coral', 'label' => 'Clear', 'direction' => 'Natural, contemporary and neutral. Crisp diction with calm confidence.'],
    'human-warm' => ['voice' => 'marin', 'label' => 'Warm', 'direction' => 'Warm, grounded and emotionally present. Gentle energy without breathiness.'],
    'human-deep' => ['voice' => 'onyx', 'label' => 'Deep', 'direction' => 'Deep, resonant and assured. Maintain precise consonants and an unhurried pace.'],
    'human-bright' => ['voice' => 'shimmer', 'label' => 'Bright', 'direction' => 'Bright, buoyant and clean. Energetic but never rushed or shrill.'],
    'human-calm' => ['voice' => 'sage', 'label' => 'Calm', 'direction' => 'Calm, spacious and meditative. Keep every word fully articulated.'],
    'human-intimate' => ['voice' => 'nova', 'label' => 'Intimate', 'direction' => 'Close, intimate and conversational. Soft, but still clearly audible.'],
    'robot-machine' => ['voice' => 'echo', 'label' => 'Machine', 'direction' => 'A controlled machine voice with an even cadence and subtle synthetic precision.'],
    'robot-chrome' => ['voice' => 'alloy', 'label' => 'Chrome', 'direction' => 'A polished chrome android voice: cool, clean and metallic in attitude.'],
    'robot-command' => ['voice' => 'cedar', 'label' => 'Command', 'direction' => 'A firm command-system voice with strong diction and measured authority.'],
    'robot-android' => ['voice' => 'fable', 'label' => 'Android', 'direction' => 'A friendly intelligent android: distinctly electronic in character, never caricatured.'],
    'robot-circuit' => ['voice' => 'verse', 'label' => 'Circuit', 'direction' => 'A precise circuit voice with clipped rhythm and subtle computational character.'],
    'robot-digital' => ['voice' => 'ash', 'label' => 'Digital', 'direction' => 'A modern digital assistant voice with clean transients and clear speech rhythm.'],
    'vocoder-neon' => ['voice' => 'shimmer', 'label' => 'Neon', 'direction' => 'A luminous club-vocoder character with melodic colour and immaculate pronunciation.'],
    'vocoder-oracle' => ['voice' => 'sage', 'label' => 'Oracle', 'direction' => 'A futuristic oracle with spacious electronic colour and calm, legible delivery.'],
    'vocoder-temple' => ['voice' => 'ballad', 'label' => 'Temple', 'direction' => 'A ceremonial vocoder character: resonant and devotional, with every syllable distinct.'],
    'vocoder-astral' => ['voice' => 'verse', 'label' => 'Astral', 'direction' => 'An astral synthesizer voice with floating tonal colour and sharply intelligible words.'],
    'vocoder-cosmic' => ['voice' => 'marin', 'label' => 'Cosmic', 'direction' => 'A warm cosmic vocoder character, expansive but speech-first and fully audible.'],
    'vocoder-electric' => ['voice' => 'coral', 'label' => 'Electric', 'direction' => 'An electric dance-floor voice with rhythmic voltage and clear human-language articulation.'],
];

$presetId = voice_text($request['preset'] ?? '', 40);
if (!isset($presets[$presetId])) {
    voice_json(['error' => 'Choose one of the available voice presets.'], 422);
}

$text = voice_text($request['text'] ?? '', 220);
if ($text === '') {
    voice_json(['error' => 'Write a line for the voice first.'], 422);
}

$speed = filter_var($request['speed'] ?? null, FILTER_VALIDATE_FLOAT);
$tone = filter_var($request['tone'] ?? null, FILTER_VALIDATE_INT);
$effectAmount = filter_var($request['effect_amount'] ?? null, FILTER_VALIDATE_FLOAT);
if ($speed === false || $speed < 0.55 || $speed > 1.65
    || $tone === false || $tone < -6 || $tone > 6
    || $effectAmount === false || $effectAmount < 0 || $effectAmount > 1) {
    voice_json(['error' => 'One or more voice controls are outside their safe range.'], 422);
}

$now = time();
$windowSeconds = 600;
$maxRequests = 40;
$requests = is_array($_SESSION['mantra_voice_requests'] ?? null) ? $_SESSION['mantra_voice_requests'] : [];
$requests = array_values(array_filter($requests, static fn ($value): bool => is_int($value) && $value > $now - $windowSeconds));
if (count($requests) >= $maxRequests) {
    header('Retry-After: 600');
    voice_json(['error' => 'The private voice lab has reached its short-term generation limit. Please wait and try again.'], 429);
}
$requests[] = $now;
$_SESSION['mantra_voice_requests'] = $requests;

$apiKey = trim((string) (getenv('OPENAI_API_KEY') ?: ($_SERVER['OPENAI_API_KEY'] ?? $_ENV['OPENAI_API_KEY'] ?? '')));
if ($apiKey === '') {
    $keyFile = trim((string) (getenv('IAM_OPENAI_API_KEY_FILE') ?: ''));
    if ($keyFile !== '' && is_readable($keyFile)) {
        $apiKey = trim((string) file_get_contents($keyFile));
    }
}
if ($apiKey === '') {
    voice_json(['error' => 'Voice rendering is not configured on this environment yet.'], 503);
}

$preset = $presets[$presetId];
$toneDirection = $tone === 0
    ? 'Keep the natural tonal centre of the selected voice.'
    : ($tone > 0
        ? "Lift the perceived vocal tone by about {$tone} semitones while avoiding thinness or squeakiness."
        : 'Lower the perceived vocal tone by about ' . abs($tone) . ' semitones while avoiding muddiness.');
$effectPercent = (int) round($effectAmount * 100);
$effectDirection = $effectPercent === 0
    ? 'Use no added electronic character beyond the selected preset.'
    : "Apply the selected electronic character at roughly {$effectPercent}% intensity. It must colour the voice without masking consonants, vowels or word boundaries.";

$instructions = <<<PROMPT
Create a short, production-ready spoken mantra sample.
Say only the exact supplied text. Do not add an introduction, commentary, sound effects or extra words.
Speech intelligibility is the first priority: every word and syllable must be immediately understandable, clearly articulated and evenly audible.
{$preset['direction']}
{$toneDirection}
{$effectDirection}
Keep the recording dry, close and clean enough for later music production.
PROMPT;

$payload = json_encode([
    'model' => 'gpt-4o-mini-tts',
    'voice' => $preset['voice'],
    'input' => $text,
    'instructions' => $instructions,
    'response_format' => 'wav',
    'speed' => round((float) $speed, 2),
], JSON_UNESCAPED_SLASHES);

if ($payload === false || !function_exists('curl_init')) {
    voice_json(['error' => 'The secure voice service is unavailable.'], 503);
}

$remoteAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
$safetyIdentifier = 'mantra_' . substr(hash('sha256', $remoteAddress . '|' . $userAgent . '|' . session_id()), 0, 48);
session_write_close();

$curl = curl_init('https://api.openai.com/v1/audio/speech');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'Accept: audio/wav',
        'OpenAI-Safety-Identifier: ' . $safetyIdentifier,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
]);

$audio = curl_exec($curl);
$upstreamStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($curl);
$contentType = (string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
curl_close($curl);

if ($audio === false || $upstreamStatus < 200 || $upstreamStatus >= 300 || strlen($audio) < 44) {
    error_log('Mantra voice generation failed: status=' . $upstreamStatus . ' curl=' . $curlError);
    voice_json(['error' => 'The voice could not be generated. Please try again shortly.'], 502);
}

header_remove('Content-Type');
header('Content-Type: ' . (str_contains(strtolower($contentType), 'audio') ? $contentType : 'audio/wav'));
header('Content-Disposition: inline; filename="mantra-voice.wav"');
header('Content-Length: ' . strlen($audio));
echo $audio;
