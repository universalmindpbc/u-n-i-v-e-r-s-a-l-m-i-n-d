<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

const WORKER_VERSION = 'broadcast_interactions_panthur_v1.4';
const BLOOM_DEMO_MODE = 'unrestricted_stakeholder_demo';
const MANTRA_DEMO_MODE = 'unrestricted_stakeholder_demo';
const DEMO_CUE_PAST_TOLERANCE_MS = 2500;
const DEMO_CUE_FUTURE_TOLERANCE_MS = 250;
const MANTRA_LIBRARY_PATH = __DIR__ . '/mantra-library.json';
const MANTRA_DEFAULT_DURATION_MS = 15000;
const MANTRA_MAX_DURATION_MS = 180000;
const EVENT_TTL_MS = 120000;

const ALLOWED_CHANNEL_IDS = [
    'video-inner-planes',
    'video-champagne-bohemia',
    'video-modul8-infinity',
    'video-james-bondage',
    'party-champagne-bohemia',
    'party-modul8-infinity',
    'party-james-bondage',
    'radio-inner-planes',
    'radio-champagne-bohemia',
    'radio-modul8-infinity',
    'radio-james-bondage',
];

const ALLOWED_BLOOM_IDS = [
    'flora',
    'daisy',
    'aboriginal',
    'trans',
    'dove',
    'medallion',
];

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function now_ms(): int
{
    return (int) round(microtime(true) * 1000);
}

function clean_id(mixed $value, string $pattern, int $maximumLength): string
{
    $id = trim((string) ($value ?? ''));
    return strlen($id) <= $maximumLength && preg_match($pattern, $id) === 1 ? $id : '';
}

function mantra_durations_ms(): array
{
    static $durations = null;
    if (is_array($durations)) return $durations;

    $raw = @file_get_contents(MANTRA_LIBRARY_PATH);
    $library = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
    $banks = is_array($library['banks'] ?? null) ? $library['banks'] : [];
    $durations = [];

    foreach ($banks as $items) {
        foreach (is_array($items) ? $items : [] as $item) {
            if (!is_array($item) || !empty($item['reserved']) || trim((string) ($item['asset'] ?? '')) === '') continue;
            $id = clean_id($item['id'] ?? '', '/^[a-z0-9][a-z0-9._-]{1,119}$/', 120);
            if ($id === '') continue;
            $start = max(0.0, (float) ($item['trim_start'] ?? 0));
            $end = max($start, (float) ($item['trim_end'] ?? 0));
            $speed = max(0.35, min(2.0, (float) ($item['speed'] ?? 1)));
            $duration = $end > $start
                ? (int) round((($end - $start) / $speed) * 1000)
                : MANTRA_DEFAULT_DURATION_MS;
            $durations[$id] = max(250, min(MANTRA_MAX_DURATION_MS, $duration));
        }
    }

    return $durations;
}

function empty_state(): array
{
    return [
        'version' => WORKER_VERSION,
        'sequence' => 0,
        'events' => [],
        'recent_event_ids' => [],
    ];
}

function prune_state(array &$state, int $now): void
{
    $state['events'] = array_values(array_filter(
        is_array($state['events'] ?? null) ? $state['events'] : [],
        static fn (array $event): bool => $now - (int) ($event['created_at_ms'] ?? 0) < EVENT_TTL_MS
    ));

    foreach ((array) ($state['recent_event_ids'] ?? []) as $eventId => $at) {
        if ($now - (int) $at >= EVENT_TTL_MS) {
            unset($state['recent_event_ids'][$eventId]);
        }
    }
}

function append_event(array &$state, array $event): void
{
    $state['sequence'] = max(0, (int) ($state['sequence'] ?? 0)) + 1;
    $event['sequence'] = $state['sequence'];
    $event['event_id'] = bin2hex(random_bytes(16));
    $event['created_at_ms'] = now_ms();
    $state['events'][] = $event;
}

function advance_state(array &$state, int $now): void
{
    prune_state($state, $now);
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'POST'], true)) {
    respond(405, ['error' => 'method_not_allowed']);
}

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$requestHost = explode(':', $host, 2)[0];
if ($requestHost !== '' && $requestHost !== 'staging.universalmind.tv') {
    respond(403, ['error' => 'staging_only']);
}

$input = $_GET;
if ($method === 'POST') {
    $decoded = json_decode((string) file_get_contents('php://input'), true);
    $input = is_array($decoded) ? $decoded : [];
}

$channelId = (string) ($input['channel_id'] ?? '');
$programmeId = clean_id($input['programme_id'] ?? '', '/^[a-z0-9][a-z0-9._-]{1,119}$/', 120);
$programmeInstanceId = clean_id($input['programme_instance_id'] ?? '', '/^[a-z0-9][a-z0-9._:-]{5,179}$/', 180);
$sessionId = clean_id($input['session_id'] ?? '', '/^[A-Za-z0-9-]{16,80}$/', 80);
$since = max(0, (int) ($input['since'] ?? 0));

if (!in_array($channelId, ALLOWED_CHANNEL_IDS, true) || $programmeId === '' || $programmeInstanceId === '' || $sessionId === '') {
    respond(400, ['error' => 'invalid_broadcast_room']);
}

$storageRoot = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'iam-broadcast-interactions-staging-v1';
if (!is_dir($storageRoot) && !@mkdir($storageRoot, 0700, true) && !is_dir($storageRoot)) {
    respond(503, ['error' => 'interaction_storage_unavailable']);
}

$roomFile = $storageRoot . DIRECTORY_SEPARATOR . hash('sha256', $channelId . '|' . $programmeInstanceId) . '.json';
$handle = @fopen($roomFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    if (is_resource($handle)) {
        fclose($handle);
    }
    respond(503, ['error' => 'interaction_room_unavailable']);
}

$rawState = stream_get_contents($handle);
$decodedState = is_string($rawState) && $rawState !== '' ? json_decode($rawState, true) : null;
$state = array_replace(empty_state(), is_array($decodedState) ? $decodedState : []);
$now = now_ms();
advance_state($state, $now);

$outcome = '';
$kind = '';
$assetId = '';
$error = '';

if ($method === 'POST') {
    $kind = (string) ($input['type'] ?? '');
    $assetId = (string) ($input['asset_id'] ?? '');
    $eventId = clean_id($input['event_id'] ?? '', '/^[A-Za-z0-9-]{16,100}$/', 100);

    if ($eventId === '') {
        $error = 'invalid_event';
    } elseif (isset($state['recent_event_ids'][$eventId])) {
        $outcome = 'duplicate';
    } elseif ($kind === 'bloom') {
        $state['recent_event_ids'][$eventId] = $now;
        if (!in_array($assetId, ALLOWED_BLOOM_IDS, true)) {
            $error = 'unknown_asset';
        } else {
            $requestedCueAt = (int) ($input['cue_at_ms'] ?? $now);
            $cueAt = max(
                $now - DEMO_CUE_PAST_TOLERANCE_MS,
                min($now + DEMO_CUE_FUTURE_TOLERANCE_MS, $requestedCueAt)
            );
            append_event($state, [
                'type' => 'shared_bloom',
                'asset_id' => $assetId,
                'participant_count' => 1,
                'density' => 1,
                'server_play_at_ms' => $cueAt,
                'cue_at_ms' => $cueAt,
                'source_event_ids' => [$eventId],
            ]);
            $outcome = 'accepted';
        }
    } elseif ($kind === 'mantra') {
        $state['recent_event_ids'][$eventId] = $now;
        $mantraDurations = mantra_durations_ms();
        if (!array_key_exists($assetId, $mantraDurations)) {
            $error = 'unknown_asset';
        } else {
            $duration = (int) $mantraDurations[$assetId];
            $requestedCueAt = (int) ($input['cue_at_ms'] ?? $now);
            $cueAt = max(
                $now - DEMO_CUE_PAST_TOLERANCE_MS,
                min($now + DEMO_CUE_FUTURE_TOLERANCE_MS, $requestedCueAt)
            );
            $programmePosition = max(0, min(86400000, (int) ($input['programme_position_ms'] ?? 0)));
            append_event($state, [
                'type' => 'shared_mantra',
                'asset_id' => $assetId,
                'participant_count' => 1,
                'server_play_at_ms' => $cueAt,
                'cue_at_ms' => $cueAt,
                'programme_position_ms' => $programmePosition,
                'duration_ms' => $duration,
                'source_event_ids' => [$eventId],
            ]);
            $outcome = 'broadcast';
        }
    } else {
        $error = 'unsupported_interaction';
    }
}

advance_state($state, now_ms());
$events = array_values(array_filter(
    (array) ($state['events'] ?? []),
    static fn (array $event): bool => (int) ($event['sequence'] ?? 0) > $since
));
$cursor = max($since, (int) ($state['sequence'] ?? 0));

rewind($handle);
ftruncate($handle, 0);
fwrite($handle, json_encode($state, JSON_UNESCAPED_SLASHES));
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

respond(200, [
    'ok' => $error === '',
    'version' => WORKER_VERSION,
    'kind' => $kind,
    'asset_id' => $assetId,
    'outcome' => $outcome,
    'error' => $error,
    'cursor' => $cursor,
    'events' => $events,
    'server_now_ms' => now_ms(),
    'bloom_mode' => BLOOM_DEMO_MODE,
    'mantra_mode' => MANTRA_DEMO_MODE,
]);
