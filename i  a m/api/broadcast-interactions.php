<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

const WORKER_VERSION = 'broadcast_interactions_panthur_v1.1';
const BLOOM_COALESCE_MS = 350;
const BLOOM_PERSON_COOLDOWN_MS = 2000;
const BLOOM_PERSON_LIMIT_PER_MINUTE = 6;
const BLOOM_GLOBAL_GAP_MS = 2000;
const DOVE_GLOBAL_GAP_MS = 6000;
const MANTRA_SCHEDULE_AHEAD_MS = 1500;
const MANTRA_PERSON_COOLDOWN_MS = 30000;
const MANTRA_QUIET_MS = 8000;
const MANTRA_GLOBAL_LIMIT_PER_MINUTE = 2;
const MANTRA_LIBRARY_PATH = __DIR__ . '/mantra-library.json';
const MANTRA_DEFAULT_DURATION_MS = 15000;
const MANTRA_MAX_DURATION_MS = 180000;
const EVENT_TTL_MS = 120000;

const ALLOWED_CHANNEL_IDS = [
    'video-restore',
    'video-social-uplift',
    'video-underground-intensity',
    'restore',
    'social-uplift',
    'underground-intensity',
    'radio-restore',
    'radio-social-uplift',
    'radio-underground-intensity',
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
        'next_bloom_at_ms' => 0,
        'bloom_flush_at_ms' => 0,
        'bloom_history_by_session' => [],
        'pending_blooms' => [],
        'next_mantra_at_ms' => 0,
        'mantra_history_by_session' => [],
        'global_mantra_history' => [],
        'current_mantra' => null,
        'queued_mantra' => null,
        'recent_event_ids' => [],
    ];
}

function prune_state(array &$state, int $now): void
{
    $state['events'] = array_values(array_filter(
        is_array($state['events'] ?? null) ? $state['events'] : [],
        static fn (array $event): bool => $now - (int) ($event['created_at_ms'] ?? 0) < EVENT_TTL_MS
    ));

    foreach ((array) ($state['bloom_history_by_session'] ?? []) as $sessionId => $history) {
        $recent = array_values(array_filter(
            array_map('intval', is_array($history) ? $history : []),
            static fn (int $at): bool => $now - $at < 60000
        ));
        if ($recent) {
            $state['bloom_history_by_session'][$sessionId] = $recent;
        } else {
            unset($state['bloom_history_by_session'][$sessionId]);
        }
    }

    foreach ((array) ($state['mantra_history_by_session'] ?? []) as $sessionId => $at) {
        if ($now - (int) $at >= MANTRA_PERSON_COOLDOWN_MS) {
            unset($state['mantra_history_by_session'][$sessionId]);
        }
    }

    $state['global_mantra_history'] = array_values(array_filter(
        array_map('intval', (array) ($state['global_mantra_history'] ?? [])),
        static fn (int $at): bool => $now - $at < 60000
    ));
    sort($state['global_mantra_history'], SORT_NUMERIC);

    foreach ((array) ($state['recent_event_ids'] ?? []) as $eventId => $at) {
        if ($now - (int) $at >= EVENT_TTL_MS) {
            unset($state['recent_event_ids'][$eventId]);
        }
    }

    if (is_array($state['current_mantra'] ?? null) && (int) ($state['current_mantra']['ends_at_ms'] ?? 0) <= $now) {
        $state['current_mantra'] = null;
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

function mantra_eligible_at(array $state, int $now): int
{
    $eligibleAt = max($now, (int) ($state['next_mantra_at_ms'] ?? 0));
    $history = array_values((array) ($state['global_mantra_history'] ?? []));
    if (count($history) >= MANTRA_GLOBAL_LIMIT_PER_MINUTE) {
        $eligibleAt = max($eligibleAt, (int) $history[0] + 60000);
    }
    return $eligibleAt;
}

function schedule_mantra(array &$state, string $mantraId, int $participantCount, int $now, int $duration): void
{
    $playAt = max($now, mantra_eligible_at($state, $now)) + MANTRA_SCHEDULE_AHEAD_MS;
    $state['global_mantra_history'][] = $playAt;
    sort($state['global_mantra_history'], SORT_NUMERIC);
    $state['next_mantra_at_ms'] = $playAt + $duration + MANTRA_QUIET_MS;
    $state['current_mantra'] = [
        'id' => $mantraId,
        'ends_at_ms' => $playAt + $duration,
        'participant_count' => max(1, $participantCount),
    ];
    append_event($state, [
        'type' => 'shared_mantra',
        'asset_id' => $mantraId,
        'participant_count' => max(1, $participantCount),
        'server_play_at_ms' => $playAt,
        'duration_ms' => $duration,
    ]);
}

function advance_state(array &$state, int $now): void
{
    prune_state($state, $now);

    $pendingBlooms = array_values((array) ($state['pending_blooms'] ?? []));
    $bloomEligibleAt = max((int) ($state['next_bloom_at_ms'] ?? 0), (int) ($state['bloom_flush_at_ms'] ?? 0));
    if ($pendingBlooms && $now >= $bloomEligibleAt) {
        $counts = [];
        $contributors = [];
        foreach ($pendingBlooms as $entry) {
            $assetId = (string) ($entry['asset_id'] ?? '');
            $counts[$assetId] = ($counts[$assetId] ?? 0) + 1;
            $contributors[(string) ($entry['session_id'] ?? '')] = true;
        }
        $winner = (string) ($pendingBlooms[0]['asset_id'] ?? 'flora');
        foreach ($counts as $assetId => $count) {
            if ($count > ($counts[$winner] ?? 0)) {
                $winner = (string) $assetId;
            }
        }
        $participantCount = max(1, count($contributors));
        $playAt = $now + 900;
        append_event($state, [
            'type' => 'shared_bloom',
            'asset_id' => $winner,
            'participant_count' => $participantCount,
            'density' => min(3, $participantCount),
            'server_play_at_ms' => $playAt,
        ]);
        $state['next_bloom_at_ms'] = $now + ($winner === 'dove' ? DOVE_GLOBAL_GAP_MS : BLOOM_GLOBAL_GAP_MS);
        $state['pending_blooms'] = [];
        $state['bloom_flush_at_ms'] = 0;
    }

    if (is_array($state['queued_mantra'] ?? null) && mantra_eligible_at($state, $now) <= $now) {
        $queued = $state['queued_mantra'];
        $state['queued_mantra'] = null;
        schedule_mantra(
            $state,
            (string) $queued['id'],
            max(1, (int) ($queued['participant_count'] ?? 1)),
            $now,
            max(250, min(MANTRA_MAX_DURATION_MS, (int) ($queued['duration_ms'] ?? MANTRA_DEFAULT_DURATION_MS)))
        );
    }
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
            $history = array_values((array) ($state['bloom_history_by_session'][$sessionId] ?? []));
            $lastAt = $history ? (int) end($history) : 0;
            if ($now - $lastAt < BLOOM_PERSON_COOLDOWN_MS || count($history) >= BLOOM_PERSON_LIMIT_PER_MINUTE) {
                $error = 'personal_cadence';
            } else {
                $history[] = $now;
                $state['bloom_history_by_session'][$sessionId] = $history;
                $state['pending_blooms'][] = [
                    'asset_id' => $assetId,
                    'session_id' => $sessionId,
                    'received_at_ms' => $now,
                ];
                $state['bloom_flush_at_ms'] = max(
                    $now + BLOOM_COALESCE_MS,
                    (int) ($state['next_bloom_at_ms'] ?? 0)
                );
                $outcome = 'accepted';
            }
        }
    } elseif ($kind === 'mantra') {
        $state['recent_event_ids'][$eventId] = $now;
        $mantraDurations = mantra_durations_ms();
        if (!array_key_exists($assetId, $mantraDurations)) {
            $error = 'unknown_asset';
        } else {
            $duration = (int) $mantraDurations[$assetId];
            $lastAt = (int) ($state['mantra_history_by_session'][$sessionId] ?? 0);
            if ($now - $lastAt < MANTRA_PERSON_COOLDOWN_MS) {
                $error = 'personal_cadence';
            } else {
                $state['mantra_history_by_session'][$sessionId] = $now;
                $current = is_array($state['current_mantra'] ?? null) ? $state['current_mantra'] : null;
                if ($current && ($current['id'] ?? '') === $assetId && (int) ($current['ends_at_ms'] ?? 0) > $now) {
                    $state['current_mantra']['participant_count'] = max(1, (int) ($current['participant_count'] ?? 1)) + 1;
                    $outcome = 'coalesced';
                } elseif (mantra_eligible_at($state, $now) <= $now && !is_array($state['queued_mantra'] ?? null)) {
                    schedule_mantra($state, $assetId, 1, $now, $duration);
                    $outcome = 'scheduled';
                } elseif (!is_array($state['queued_mantra'] ?? null)) {
                    $state['queued_mantra'] = [
                        'id' => $assetId,
                        'duration_ms' => $duration,
                        'participant_count' => 1,
                        'requested_at_ms' => $now,
                    ];
                    $outcome = 'queued';
                } elseif (($state['queued_mantra']['id'] ?? '') === $assetId) {
                    $state['queued_mantra']['participant_count'] = max(1, (int) ($state['queued_mantra']['participant_count'] ?? 1)) + 1;
                    $outcome = 'coalesced';
                } else {
                    $error = 'shared_queue_full';
                }
            }
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
]);
