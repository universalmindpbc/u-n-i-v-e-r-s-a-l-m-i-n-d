<?php
declare(strict_types=1);

require_once __DIR__ . '/happiness-secret-store.php';

const STUDY_PRIVATE = __DIR__ . '/.runtime-private/study';
const STUDY_METRICS = ['heart_rate_bpm', 'hrv_sdnn_ms', 'hrv_lnrmssd_ms', 'systolic_blood_pressure_mmhg', 'diastolic_blood_pressure_mmhg', 'hrv_power_0_1_ms2'];

function study_protocol(): array {
    return json_decode((string) file_get_contents(__DIR__ . '/../study/protocol-v1.json'), true, 512, JSON_THROW_ON_ERROR);
}

function study_staging(): bool {
    return strtolower(explode(':', (string) ($_SERVER['HTTP_HOST'] ?? ''))[0]) === 'staging.universalmind.tv';
}

function study_defaults(): array {
    return ['revision' => 0, 'config' => ['open' => false, 'stream_uid' => '', 'video_title' => 'Empire of the Sun',
        'shen_verified' => false, 'experience_verified' => false, 'materials_approved' => false, 'contact_email' => '', 'retention_days' => null],
        'participants' => [], 'stakeholders' => [], 'analysis' => null, 'audit' => []];
}

function study_store(callable $callback, ?string $preview = null): array {
    if ($preview !== null && !preg_match('/\A[a-f0-9]{48}\z/', $preview)) throw new RuntimeException('Invalid preview session.');
    if (!is_dir(STUDY_PRIVATE) && !@mkdir(STUDY_PRIVATE, 0700, true) && !is_dir(STUDY_PRIVATE)) {
        throw new RuntimeException('Study storage is unavailable.');
    }
    $path = STUDY_PRIVATE . '/' . ($preview === null ? 'cohort' : 'preview-' . $preview) . '.json';
    $lock = @fopen($path . '.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Study storage is busy. Try again.');
    $temporary = null;
    try {
        @chmod($path . '.lock', 0600);
        $data = is_file($path) ? json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : study_defaults();
        $before = json_encode($data, JSON_THROW_ON_ERROR);
        // Retention is enforced whenever the store is opened, before any records can be returned.
        foreach ($data['participants'] as &$participant) {
            $days = $participant['consent']['retention_days'] ?? null;
            $latest = strtotime($participant['consent']['at'] ?? $participant['created_at']);
            foreach ($participant['sessions'] as $session) $latest = max($latest, strtotime($session['completed_at'] ?? $session['stopped_at'] ?? $session['created_at']));
            if ($days !== null && time() > $latest + $days * 86400) {
                foreach ($participant['sessions'] as &$session) foreach (['before_vitals','after_vitals','before_report','after_report'] as $field) $session[$field] = null;
                unset($session); $participant['responses_expired'] = true; $participant['withdrawn'] = true; $data['analysis'] = null;
            }
        }
        unset($participant);
        $result = $callback($data);
        if ($before !== json_encode($data, JSON_THROW_ON_ERROR)) {
            $data['revision']++;
            $data['updated_at'] = gmdate('c');
            $bytes = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $temporary = $path . '.tmp-' . bin2hex(random_bytes(8));
            if (file_put_contents($temporary, $bytes, LOCK_EX) !== strlen($bytes) || !chmod($temporary, 0600) || !rename($temporary, $path)) {
                throw new RuntimeException('Your response could not be saved. Please try again.');
            }
        }
        return $result;
    } finally {
        if ($temporary && is_file($temporary)) @unlink($temporary);
        flock($lock, LOCK_UN); fclose($lock);
    }
}

function study_require(bool $condition, string $message): void {
    if (!$condition) throw new InvalidArgumentException($message);
}

function study_text($value, int $maximum = 2000): string {
    study_require(is_string($value) && strlen($value) <= $maximum * 4, 'Please shorten this response.');
    $text = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return function_exists('mb_substr') ? mb_substr($text, 0, $maximum) : substr($text, 0, $maximum);
}

function study_number($value, float $minimum, float $maximum): ?float {
    if ($value === null || $value === '') return null;
    study_require((is_int($value) || is_float($value)) && is_finite((float) $value)
        && $value >= $minimum && $value <= $maximum, 'A measurement value is invalid. Please repeat the scan.');
    return (float) $value;
}

function study_vitals(array $input, bool $preview): array {
    $reason = $input['unavailable_reason'] ?? null;
    study_require($reason === null || in_array($reason, ['licence_unavailable','camera_denied','signal_quality','interrupted','declined','preview'], true), 'Invalid measurement status.');
    study_require($reason !== 'preview' || $preview, 'Example measurements are only permitted in preview.');
    $ranges = ['heart_rate_bpm' => [20,250], 'hrv_sdnn_ms' => [0,1000], 'hrv_lnrmssd_ms' => [-5,12],
        'systolic_blood_pressure_mmhg' => [20,300], 'diastolic_blood_pressure_mmhg' => [10,220]];
    $values = [];
    foreach ($ranges as $key => $range) $values[$key] = $reason !== null ? null : study_number($input[$key] ?? null, ...$range);
    if ($reason === null) study_require(($input['measurement_duration_seconds'] ?? null) === 60, 'The study requires a 60-second scan.');
    $quality = [];
    foreach (['average_signal_quality','ppg_quality_index','bcg_quality_index','blood_pressure_quality_index'] as $key) {
        $quality[$key] = study_number($input[$key] ?? null, 0, 100000);
    }
    return $values + ['quality' => $quality, 'unavailable_reason' => $reason, 'recorded_at' => gmdate('c'),
        'measurement_duration_seconds' => $reason === null ? 60 : null,
        'source' => $reason === null ? 'shen_rppg' : 'unavailable', 'illustrative' => $preview];
}

function study_readiness(array $config): array {
    $missing = [];
    if (!preg_match('/\A[a-f0-9]{32}\z/', $config['stream_uid'])) $missing[] = 'Study video';
    if (!$config['shen_verified']) $missing[] = 'Shen BP and HRV verification';
    if (!($config['experience_verified'] ?? false)) $missing[] = 'Ten-minute video and combined experience verification';
    if (!$config['materials_approved']) $missing[] = 'Participant materials and research review';
    if (!filter_var($config['contact_email'], FILTER_VALIDATE_EMAIL)) $missing[] = 'Study contact';
    if (!is_int($config['retention_days']) || $config['retention_days'] < 1) $missing[] = 'Data retention period';
    return ['ready' => count($missing) === 0, 'missing' => $missing, 'open' => $config['open'] && count($missing) === 0];
}

function study_participant_public(array $p): array {
    unset($p['access_hash']);
    return $p;
}

function study_dataset(array $data, ?string $participantId = null): array {
    $participants = $participantId === null ? array_values($data['participants']) : [$data['participants'][$participantId]];
    $participants = array_map('study_participant_public', $participants);
    foreach ($participants as &$p) $p['earned_aud'] = study_earned($p);
    unset($p);
    return ['summary' => study_summary($participants), 'participants' => $participants, 'config' => $data['config'],
        'readiness' => study_readiness($data['config']), 'analysis' => $participantId === null ? $data['analysis'] : null, 'revision' => $data['revision']];
}

function study_aggregate(array $data): array {
    $summary = study_summary(array_values($data['participants']));
    unset($summary['rows']);
    $analysis = $data['analysis'];
    if (!$analysis || !$analysis['reviewed_at']) $analysis = null;
    if ($analysis) {
        // Individual quotations and coded themes remain researcher-only even after review.
        $analysis = ['reviewed_at' => $analysis['reviewed_at'], 'report' => ['executive_summary' => $analysis['report']['executive_summary']]];
    }
    return ['summary' => $summary, 'analysis' => $analysis];
}

function study_new_participant(string $id, string $hash = ''): array {
    return ['id' => $id, 'access_hash' => $hash, 'created_at' => gmdate('c'), 'consent' => null,
        'withdrawn' => false, 'sessions' => [], 'payments' => [], 'onboarding_earned' => false];
}

function study_statistics(array $values): array {
    $values = array_values(array_filter($values, static fn($x): bool => $x !== null));
    sort($values, SORT_NUMERIC); $n = count($values);
    if (!$n) return ['n' => 0, 'min' => null, 'median' => null, 'mean' => null, 'max' => null];
    $middle = intdiv($n, 2);
    return ['n' => $n, 'min' => $values[0], 'median' => $n % 2 ? $values[$middle] : ($values[$middle-1]+$values[$middle])/2,
        'mean' => array_sum($values)/$n, 'max' => $values[$n-1]];
}

function study_summary(array $participants): array {
    $metrics = array_merge(STUDY_METRICS, ['happiness','stress','connection']);
    $rows = []; $participantChanges = array_fill_keys($metrics, []);
    $distribution = ['increased' => 0, 'unchanged' => 0, 'decreased' => 0, 'unavailable' => 0];
    $completed = 0; $interrupted = 0; $withdrawn = 0;
    foreach ($participants as $p) {
        if ($p['withdrawn']) $withdrawn++;
        $individual = array_fill_keys($metrics, []);
        foreach ($p['sessions'] as $s) {
            if ($s['state'] === 'complete') $completed++;
            if ($s['state'] === 'stopped') $interrupted++;
            $row = ['participant_id' => $p['id'], 'session' => $s['number'], 'state' => $s['state'],
                'window' => $s['window'], 'started_at' => $s['created_at'], 'timezone' => $s['timezone'],
                'exposure_seconds' => $s['exposure_seconds'], 'fidelity_seconds' => $s['fidelity_seconds'] ?? 0,
                'fidelity_warning' => $s['fidelity_warning'] ?? false, 'interruptions' => $s['interruptions'],
                'preview_exposure_skipped' => $s['preview_exposure_skipped'] ?? false, 'changes' => [], 'before' => [], 'after' => []];
            foreach ($metrics as $key) {
                $kind = in_array($key, STUDY_METRICS, true) ? 'vitals' : 'report';
                $pre = $s['before_' . $kind][$key] ?? null;
                $post = $s['after_' . $kind][$key] ?? null;
                $delta = $pre !== null && $post !== null ? $post - $pre : null;
                $row['before'][$key] = $pre; $row['after'][$key] = $post; $row['changes'][$key] = $delta;
                if ($delta !== null) $individual[$key][] = $delta;
            }
            $delta = $row['changes']['happiness'];
            $distribution[$delta === null ? 'unavailable' : ($delta > 0 ? 'increased' : ($delta < 0 ? 'decreased' : 'unchanged'))]++;
            $row['before_text'] = $s['before_report']['text'] ?? '';
            $row['after_text'] = $s['after_report']['text'] ?? '';
            $row['before_vitals_status'] = $s['before_vitals']['unavailable_reason'] ?? null;
            $row['after_vitals_status'] = $s['after_vitals']['unavailable_reason'] ?? null;
            $rows[] = $row;
        }
        foreach ($metrics as $key) if (count($individual[$key])) $participantChanges[$key][] = array_sum($individual[$key])/count($individual[$key]);
    }
    $statistics = [];
    foreach ($metrics as $key) $statistics[$key] = study_statistics($participantChanges[$key]);
    return ['participants' => count($participants), 'planned_sessions' => count($participants)*3, 'completed_sessions' => $completed,
        'stopped_sessions' => $interrupted, 'withdrawn_participants' => $withdrawn, 'rows' => $rows,
        'statistics' => $statistics, 'happiness_distribution' => $distribution,
        'analysis_unit' => 'Each participant contributes their mean paired change across available sessions. Missing pairs are excluded per metric; n is shown.'];
}

function study_earned(array $p): float {
    $earned = $p['onboarding_earned'] ? 25.0 : 0.0;
    foreach ($p['sessions'] as $s) {
        if ($s['state'] === 'complete') $earned += 25;
        elseif ($s['state'] === 'stopped') $earned += min(25, max(0, ($s['stopped_at_epoch'] - $s['created_at_epoch']) / 60) * (100 / 60));
    }
    return round(min(100, $earned), 2);
}
