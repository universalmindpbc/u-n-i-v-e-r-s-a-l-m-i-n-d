<?php
declare(strict_types=1);
require_once __DIR__ . '/study-lib.php';
require_once __DIR__ . '/quantum-tree-owner-password.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');

function study_respond(array $result, int $code = 200): void {
    http_response_code($code); echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit;
}

function study_rate(string $operation, int $maximum): void {
    $hash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . ($_SERVER['HTTP_HOST'] ?? '') . '|' . $operation);
    $file = @fopen(sys_get_temp_dir() . '/um-study-rate-' . $hash, 'c+');
    if (!$file || !flock($file, LOCK_EX)) study_respond(['error' => 'Please try again shortly.'], 503);
    $times = json_decode(stream_get_contents($file) ?: '[]', true);
    $times = array_values(array_filter(is_array($times) ? $times : [], static fn($t): bool => is_int($t) && $t > time()-600));
    if (count($times) >= $maximum) { flock($file, LOCK_UN); fclose($file); study_respond(['error' => 'Please wait a few minutes before trying again.'], 429); }
    $times[] = time(); rewind($file); ftruncate($file, 0); fwrite($file, json_encode($times)); flock($file, LOCK_UN); fclose($file);
}

$secure = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
ini_set('session.use_strict_mode', '1');
$owner = false;
if (isset($_COOKIE['iam_quantum_tree_owner'])) {
    session_name('iam_quantum_tree_owner'); session_start();
    $owner = quantum_tree_owner_authenticated(); session_write_close();
}
session_name('iam_study');
$studyCookie = (string) ($_COOKIE['iam_study'] ?? '');
session_id(preg_match('/\A[a-zA-Z0-9,-]{16,128}\z/', $studyCookie) ? $studyCookie : '');
session_set_cookie_params(['lifetime' => 0, 'path' => '/vogue/iam/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
if (isset($_SESSION['last_seen']) && $_SESSION['last_seen'] < time()-28800) { $_SESSION = []; session_regenerate_id(true); }
$_SESSION['last_seen'] = time();
$_SESSION['csrf'] ??= bin2hex(random_bytes(24));
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $result = study_store(function(array &$data) use ($owner): array {
            $id = $_SESSION['participant_id'] ?? '';
            $p = $data['participants'][$id] ?? null;
            return ['csrf' => $_SESSION['csrf'], 'protocol' => study_protocol(), 'preview_available' => study_staging(),
                'preview' => isset($_SESSION['preview']), 'owner' => $owner, 'stakeholder' => isset($_SESSION['stakeholder_id']),
                'analysis_configured' => happiness_secret('OPENAI_API_KEY') !== '' || is_readable(happiness_secret('IAM_OPENAI_API_KEY_FILE')),
                'participant' => $p ? study_participant_public($p) + ['earned_aud' => study_earned($p)] : null,
                'server_now' => microtime(true), 'config' => study_public_config($data['config']), 'readiness' => study_readiness($data['config'])];
        }, $_SESSION['preview'] ?? null);
        study_respond($result);
    }
    if ($method !== 'POST') { header('Allow: GET, POST'); study_respond(['error' => 'Method not allowed.'], 405); }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $expectedOrigin = ($secure ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
    if ($origin !== $expectedOrigin || (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') !== 'same-origin')) {
        study_respond(['error' => 'Please use the study website to submit this request.'], 403);
    }
    if (!hash_equals($_SESSION['csrf'], (string) ($_SERVER['HTTP_X_STUDY_CSRF'] ?? ''))) study_respond(['error' => 'Refresh this page and try again.'], 403);
    $raw = file_get_contents('php://input');
    study_require(is_string($raw) && strlen($raw) <= 131072, 'Request is too large.');
    $request = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    study_require(is_array($request), 'Invalid request.');
    $action = $request['action'] ?? '';
    study_require(is_string($action), 'Invalid request.');

    if ($action === 'logout') {
        $_SESSION = []; session_regenerate_id(true); study_respond(['ok' => true]);
    }
    if ($action === 'preview') {
        if (!study_staging()) study_respond(['error' => 'Preview is available only on staging.'], 403);
        study_rate('preview', 20);
        session_regenerate_id(true);
        unset($_SESSION['stakeholder_id']); $_SESSION['preview'] = bin2hex(random_bytes(24)); $_SESSION['participant_id'] = 'PREVIEW';
        study_store(function(array &$data): array { $data['participants']['PREVIEW'] = study_new_participant('PREVIEW'); return []; }, $_SESSION['preview']);
        study_respond(['ok' => true]);
    }
    if ($action === 'login') {
        study_rate('login', 25);
        $code = strtoupper(preg_replace('/[\s-]+/', '', study_text($request['code'] ?? '', 100)) ?? '');
        $id = study_store(function(array &$data) use ($code): array {
            foreach ($data['participants'] as $p) if ($p['access_hash'] !== '' && hash_equals($p['access_hash'], hash('sha256', $code))) return ['id' => $p['id']];
            foreach ($data['stakeholders'] ?? [] as $id => $hash) if (hash_equals($hash, hash('sha256', $code))) return ['stakeholder' => $id];
            return [];
        });
        if (!$id) study_respond(['error' => 'That study access code was not recognised.'], 401);
        session_regenerate_id(true); unset($_SESSION['preview'], $_SESSION['participant_id'], $_SESSION['stakeholder_id']);
        if (isset($id['id'])) $_SESSION['participant_id'] = $id['id'];
        else $_SESSION['stakeholder_id'] = $id['stakeholder'];
        study_respond(['ok' => true]);
    }

    if ($action === 'stakeholder.dataset') {
        if (!isset($_SESSION['stakeholder_id'])) study_respond(['error' => 'Stakeholder sign-in is required.'], 403);
        study_respond(study_store(static function(array &$data): array {
            study_require(isset($data['stakeholders'][$_SESSION['stakeholder_id']]), 'This access code is no longer active.');
            return study_aggregate($data);
        }));
    }
    if ($action === 'preview.analysis') {
        if (!study_staging() || !isset($_SESSION['preview'])) study_respond(['error' => 'A staging preview session is required.'], 403);
        if (!$owner) study_respond(['error' => 'Owner sign-in is required to run the paid analysis service, including for preview data.'], 403);
        study_rate('analysis', 10);
        require_once __DIR__ . '/study-analysis.php';
        study_respond(study_generate_analysis($request, $_SESSION['preview']));
    }

    if (str_starts_with($action, 'admin.')) {
        if (!$owner) study_respond(['error' => 'Researcher access requires your existing owner sign-in.'], 403);
        if ($action === 'admin.analysis') {
            study_rate('analysis', 10);
            require_once __DIR__ . '/study-analysis.php';
            $result = study_generate_analysis($request);
            study_respond($result);
        }
        $result = study_store(function(array &$data) use ($request, $action): array {
            if ($action === 'admin.dataset') {
                return study_dataset($data);
            }
            if ($action === 'admin.config') {
                $c = $data['config'];
                $c['stream_uid'] = strtolower(study_text($request['stream_uid'] ?? '', 32));
                study_require($c['stream_uid'] === '' || preg_match('/\A[a-f0-9]{32}\z/', $c['stream_uid']) === 1, 'Use the uploaded study video’s Stream ID.');
                $c['video_title'] = study_text($request['video_title'] ?? 'Empire of the Sun', 120);
                $c['contact_email'] = study_text($request['contact_email'] ?? '', 160);
                study_require($c['contact_email'] === '' || filter_var($c['contact_email'], FILTER_VALIDATE_EMAIL) !== false, 'Enter a valid study contact email.');
                $days = $request['retention_days'] ?? null;
                study_require($days === null || (is_int($days) && $days >= 1 && $days <= 3650), 'Choose a retention period in days.');
                $c['retention_days'] = $days;
                foreach (['open','shen_verified','experience_verified','materials_approved','bp_active'] as $key) $c[$key] = ($request[$key] ?? false) === true;
                if (isset($request['events'])) {
                    study_require(is_array($request['events']) && count($request['events']) === 3, 'Set the three event dates.');
                    $epochs = [];
                    foreach (['Sunrise','Sunset','Midnight'] as $i => $label) {
                        $start = $request['events'][$i]['starts_at'] ?? null;
                        study_require($start === null || (is_string($start) && preg_match('/(Z|[+-][0-9]{2}:[0-9]{2})$/', $start) && strtotime($start) !== false), 'Include the time zone in each event date.');
                        $c['events'][$i] = ['label'=>$label,'starts_at'=>$start === null ? null : gmdate('c',strtotime($start))];
                        if ($start !== null) $epochs[] = strtotime($start);
                    }
                    if (count($epochs) === 3) study_require($epochs[0] < $epochs[1] && $epochs[1] < $epochs[2] && max($epochs)-min($epochs) <= 7*86400, 'Set three events in order within one week.');
                }
                if ($c['open']) study_require(study_readiness($c)['ready'], 'Complete study preparation before opening enrolment.');
                if (count(array_filter($data['participants'], static fn($p): bool => $p['consent'] !== null && !$p['withdrawn']))) {
                    foreach (['stream_uid','retention_days','video_title','events','bp_active'] as $locked) study_require($c[$locked] === $data['config'][$locked], 'The consented study configuration is locked while participants are enrolled.');
                }
                $data['config'] = $c;
            } elseif ($action === 'admin.invite') {
                study_require(count($data['participants']) < 10, 'This pilot has ten participant places.');
                $id = 'P' . str_pad((string) (count($data['participants'])+1), 2, '0', STR_PAD_LEFT);
                $code = strtoupper(bin2hex(random_bytes(12)));
                $data['participants'][$id] = study_new_participant($id, hash('sha256', $code));
                $data['audit'][] = ['action' => 'invite_created', 'participant' => $id, 'at' => gmdate('c')];
                return ['id' => $id, 'code' => implode('-', str_split($code, 4))];
            } elseif ($action === 'admin.stakeholder') {
                study_require(count($data['stakeholders'] ?? []) < 10, 'Ten stakeholder access codes are already available.');
                $code = strtoupper(bin2hex(random_bytes(12)));
                $data['stakeholders'][bin2hex(random_bytes(8))] = hash('sha256', $code);
                return ['code' => implode('-', str_split($code, 4))];
            } elseif ($action === 'admin.payment') {
                $id = study_text($request['participant_id'] ?? '', 8);
                study_require(isset($data['participants'][$id]), 'Participant not found.');
                $amount = study_number($request['amount_aud'] ?? null, 0.01, 100);
                study_require($amount === 100.0 && study_earned($data['participants'][$id]) === 100.0, 'The $100 reward is available after all three sessions.');
                $paymentId = study_text($request['request_id'] ?? '', 64);
                study_require($paymentId !== '', 'A payment request identifier is required.');
                foreach ($data['participants'][$id]['payments'] as $payment) if (($payment['request_id'] ?? '') === $paymentId) return ['ok' => true];
                $paid = array_sum(array_column($data['participants'][$id]['payments'], 'amount_aud'));
                study_require($amount + $paid <= 100.001, 'Recorded payment exceeds the A$100 pilot amount.');
                $data['participants'][$id]['payments'][] = ['amount_aud' => $amount, 'at' => gmdate('c'), 'request_id' => $paymentId];
            } elseif ($action === 'admin.approve_analysis') {
                study_require(is_array($data['analysis']) && ($request['analysis_id'] ?? '') === $data['analysis']['id'], 'Generate and review the current analysis first.');
                study_require($data['analysis']['dataset_hash'] === hash('sha256', json_encode(study_summary(array_values($data['participants'])))), 'The dataset changed. Generate an updated analysis before approval.');
                $data['analysis']['reviewed_at'] = gmdate('c');
            } else throw new InvalidArgumentException('Unknown researcher action.');
            $data['audit'][] = ['action' => $action, 'at' => gmdate('c')];
            $data['audit'] = array_slice($data['audit'], -200);
            return ['ok' => true];
        });
        study_respond($result);
    }

    $previewKey = $_SESSION['preview'] ?? null;
    $participantId = $_SESSION['participant_id'] ?? '';
    if ($participantId === '') study_respond(['error' => 'Please sign in to your study.'], 401);
    $result = study_store(function(array &$data) use ($request, $action, $previewKey, $participantId): array {
        study_require(isset($data['participants'][$participantId]), 'Please sign in again.');
        $p =& $data['participants'][$participantId];
        $preview = $previewKey !== null;
        if ($action === 'summary') return study_dataset($data, $preview ? null : $participantId);
        if ($action === 'export') return ['participant' => study_participant_public($p), 'protocol' => study_protocol()];
        if ($action === 'withdraw') {
            $p['withdrawn'] = true; $p['withdrawn_at'] = gmdate('c');
            $p['earned_before_withdrawal_aud'] = study_earned($p);
            foreach ($p['sessions'] as &$s) {
                if (!in_array($s['state'], ['complete','stopped'], true)) { $s['state'] = 'stopped'; $s['stopped_at_epoch'] = time(); }
                if (($request['erase_responses'] ?? false) === true) foreach (['before_vitals','after_vitals','before_report','after_report'] as $key) $s[$key] = null;
            }
            unset($s); $data['analysis'] = null;
            return ['ok' => true];
        }
        study_require(!$p['withdrawn'], 'You have withdrawn from this study. Your payment record remains available.');
        if ($action === 'consent') {
            study_require($preview || study_readiness($data['config'])['open'], 'The study is being prepared. Enrolment is not open yet.');
            study_require(($request['version'] ?? '') === study_protocol()['version'], 'The participant information changed. Please read it again.');
            foreach (['adult_woman','equipment','participation','research_data'] as $key) study_require(($request[$key] ?? false) === true, 'Please confirm each research agreement.');
            $p['consent'] = ['version' => $request['version'], 'at' => gmdate('c'), 'research_data' => true,
                'ai_analysis' => true, 'retention_days' => $data['config']['retention_days'], 'preview' => $preview];
            $p['onboarding_earned'] = false; return ['ok' => true];
        }
        study_require($p['consent'] !== null, 'Please read and agree to the participant information first.');
        if ($action === 'session.start') {
            study_require($preview || study_readiness($data['config'])['open'], 'The study is currently paused.');
            foreach ($p['sessions'] as $s) if (!in_array($s['state'], ['complete','stopped'], true)) return ['session_id' => $s['id']];
            study_require(count($p['sessions']) < 3, 'Your three study sessions are recorded.');
            $event = $data['config']['events'][count($p['sessions'])];
            $window = strtolower($event['label']);
            $eventStart = $preview ? null : strtotime($event['starts_at'] ?? '');
            if (!$preview) study_require($eventStart && time() >= $eventStart-300 && time() < $eventStart+600, 'This livestream is not open. Please return at the scheduled time.');
            $id = bin2hex(random_bytes(16));
            $p['sessions'][] = ['id' => $id, 'number' => count($p['sessions'])+1, 'state' => 'before_vitals',
                'event_starts_at' => $preview ? null : $event['starts_at'], 'window' => $window, 'timezone' => study_text($request['timezone'] ?? '', 80),
                'created_at' => gmdate('c'), 'created_at_epoch' => time(), 'config_hash' => hash('sha256', json_encode($data['config'])),
                'protocol_version' => study_protocol()['version'], 'before_vitals' => null, 'before_report' => null,
                'after_vitals' => null, 'after_report' => null, 'exposure_seconds' => 0, 'interruptions' => 0,
                'last_heartbeat' => null, 'last_media_time' => null, 'last_mutation' => null];
            return ['session_id' => $id];
        }
        $sessionId = $request['session_id'] ?? '';
        $index = array_search($sessionId, array_column($p['sessions'], 'id'), true);
        study_require($index !== false, 'This session does not belong to your study account.');
        $s =& $p['sessions'][$index];
        $mutation = study_text($request['request_id'] ?? '', 64);
        if ($mutation !== '' && $s['last_mutation'] === $mutation) return ['ok' => true, 'state' => $s['state']];
        if ($action === 'session.stop') {
            study_require(!in_array($s['state'], ['complete','stopped'], true), 'This session has already ended.');
            $s['state'] = 'stopped'; $s['stopped_at_epoch'] = time(); $s['stopped_at'] = gmdate('c');
        } elseif ($action === 'vitals') {
            study_require(in_array($s['state'], ['before_vitals','after_vitals'], true), 'This measurement step has already been saved.');
            $phase = $s['state'];
            $s[$phase] = study_vitals($request['values'] ?? [], $preview, ($data['config']['bp_active'] ?? false) ? 60 : 10);
            require_once __DIR__ . '/study-spectrum.php';
            $s[$phase]['spectrum'] = study_spectrum($s[$phase]['unavailable_reason'] === null && $s[$phase]['measurement_duration_seconds'] === 60 ? ($request['values']['heartbeats'] ?? []) : []);
            $s[$phase]['hrv_power_0_1_ms2'] = $s[$phase]['spectrum']['power_0_1_ms2'] ?? null;
            $s['state'] = $phase === 'before_vitals' ? 'before_report' : 'after_report';
        } elseif ($action === 'answer') {
            study_require(in_array($s['state'], ['before_report','after_report'], true), 'This step has already been saved.');
            $phase = $s['state']; $report = $s[$phase] ?? [];
            $next = null;
            foreach (['happiness','stress','connection','text'] as $question) if (!array_key_exists($question, $report)) { $next = $question; break; }
            study_require(($request['question'] ?? '') === $next && $next !== null, 'Please answer the current question.');
            if ($next === 'text') $report[$next] = study_text($request['value'] ?? '',2000);
            else {
                $value = $request['value'] ?? null;
                study_require(is_int($value) && $value >= 1 && $value <= 10, 'Choose a rating to continue.');
                $report[$next] = $value;
            }
            $report['recorded_at'] = gmdate('c'); $report['scale_id'] = study_protocol()['scale']['id'];
            $s[$phase] = $report;
            if ($next === 'text') {
                $s['state'] = $phase === 'before_report' ? 'experience' : 'complete';
                if ($s['state'] === 'complete') $s['completed_at'] = gmdate('c');
            }
        } elseif ($action === 'report') {
            study_require(in_array($s['state'], ['before_report','after_report'], true), 'This feelings step has already been saved.');
            $report = [];
            foreach (['happiness','stress','connection'] as $key) {
                $value = $request[$key] ?? null;
                study_require(is_int($value) && $value >= 1 && $value <= 10, 'Choose a number from 1 to 10 for each question.'); $report[$key] = $value;
            }
            $report['text'] = study_text($request['text'] ?? '', 2000); $report['recorded_at'] = gmdate('c');
            $report['scale_id'] = study_protocol()['scale']['id'];
            $phase = $s['state']; $s[$phase] = $report; $s['state'] = $phase === 'before_report' ? 'experience' : 'complete';
            if ($s['state'] === 'complete') $s['completed_at'] = gmdate('c');
        } elseif ($action === 'exposure.tick') {
            study_require($s['state'] === 'experience', 'No research video is running for this session.');
            $now = microtime(true); $media = study_number($request['media_time'] ?? null, 0, 700);
            study_require($media !== null, 'Playback timing is unavailable.');
            $playing = ($request['playing'] ?? false) === true;
            $s['exposure_started_epoch'] ??= $now;
            $s['fidelity'] = ['preset' => study_text($request['preset'] ?? '', 20),
                'carrier_hz' => $request['carrier_hz'] ?? null, 'profile_id' => study_text($request['profile_id'] ?? '', 80),
                'quantum_tree_enabled' => ($request['quantum_tree_enabled'] ?? false) === true,
                'mantra_enabled' => ($request['mantra_enabled'] ?? false) === true,
                'sound_running' => ($request['sound_running'] ?? false) === true];
            $valid = $s['fidelity']['preset'] === 'm8' && $s['fidelity']['carrier_hz'] === 444
                && $s['fidelity']['profile_id'] === 'inspiration_gamma_80_v1' && $s['fidelity']['quantum_tree_enabled'] && $s['fidelity']['mantra_enabled'] && $s['fidelity']['sound_running'];
            if ($s['last_heartbeat'] !== null && $s['last_media_time'] !== null) {
                $elapsed = $now-$s['last_heartbeat']; $advance = $media-$s['last_media_time'];
                if ($playing && $elapsed > 0 && $elapsed <= 8 && $advance > 0 && $advance <= $elapsed+1
                    && $s['exposure_seconds']+$advance <= $now-$s['exposure_started_epoch']+1) {
                    $s['exposure_seconds'] += $advance;
                    if ($valid && ($s['last_fidelity_valid'] ?? false)) $s['fidelity_seconds'] = ($s['fidelity_seconds'] ?? 0) + $advance;
                }
                elseif ($elapsed > 8 || $advance < 0 || $advance > $elapsed+1 || !$playing || !$valid) $s['interruptions']++;
            }
            $s['last_heartbeat'] = $now; $s['last_media_time'] = $media; $s['last_fidelity_valid'] = $valid;
            if (!$valid) { $s['interruptions']++; $s['fidelity_warning'] = true; }
            // End the ten-minute viewing window even if a heartbeat was lost; retain the measured exposure separately.
            if (($media >= 599 && $now-$s['exposure_started_epoch'] >= 599) || (!empty($s['event_starts_at']) && $now >= strtotime($s['event_starts_at'])+600)) { $s['state'] = 'after_vitals'; $s['exposure_completed_at'] = gmdate('c'); }
        } elseif ($action === 'preview.experience') {
            study_require($preview && study_staging() && $s['state'] === 'experience', 'This action is only available in the staging walkthrough.');
            $s['state'] = 'after_vitals'; $s['preview_exposure_skipped'] = true;
        } else throw new InvalidArgumentException('Unknown study action.');
        $s['last_mutation'] = $mutation;
        $data['analysis'] = null;
        return ['ok' => true, 'state' => $s['state'], 'exposure_seconds' => $s['exposure_seconds']];
    }, $previewKey);
    study_respond($result);
} catch (InvalidArgumentException $e) { study_respond(['error' => $e->getMessage()], 422); }
catch (JsonException $e) { study_respond(['error' => 'The study data could not be read. Please contact the study organiser.'], 400); }
catch (Throwable $e) { error_log('Study API: ' . get_class($e)); study_respond(['error' => 'The study service is temporarily unavailable. Your last saved response is preserved.'], 503); }
