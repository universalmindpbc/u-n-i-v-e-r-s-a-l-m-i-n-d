<?php
declare(strict_types=1);
// No public HTTP execution. cPanel cron uses this existing-host PHP CLI entry.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('SOVEREIGNTY_WORKER_LIBRARY_ONLY', true);
require_once __DIR__ . '/sovereignty-worker.php';
require_once __DIR__ . '/sovereignty-timestamps.php';

$lock = @fopen(SOVEREIGNTY_PRIVATE . '/tick.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) exit;
try {
    $config = sovereignty_config();
    $report = ['started_at'=>gmdate('c'), 'delivery'=>'pending', 'timestamps_processed'=>0];
    try { $report['delivery'] = sovereignty_worker($config); }
    catch (Throwable $error) { $report['delivery'] = 'pending_configuration_capacity_or_retry'; }
    if (($config['timestamp_enabled'] ?? false) === true) {
        $candidates = [];
        foreach ([false, true] as $testing) {
            foreach (glob(SOVEREIGNTY_PRIVATE . ($testing ? '/qa-events' : '/events') . '/*.json') ?: [] as $path) {
                try {
                    $event = json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
                    $statePath = SOVEREIGNTY_PRIVATE . ($testing ? '/qa-timestamps/' : '/timestamps/') . $event['event_id'] . '.json';
                    $state = is_file($statePath) ? json_decode((string) file_get_contents($statePath), true) : [];
                    if (($state['state'] ?? '') === 'bitcoin_confirmed' || time() - ($state['last_attempt'] ?? 0) < 600) continue;
                    $candidates[] = ['path'=>$path, 'testing'=>$testing, 'last_attempt'=>$state['last_attempt'] ?? 0];
                } catch (Throwable $error) { $report['timestamp_error'] = 'pending_retry'; }
            }
        }
        usort($candidates, static fn($a,$b)=>$a['last_attempt'] <=> $b['last_attempt']);
        foreach (array_slice($candidates, 0, 2) as $candidate) {
            try {
                [$event, $body] = sovereignty_bundle($candidate['path']);
                sovereignty_timestamp_bundle($event['event_id'], $body, $candidate['testing']);
                $report['timestamps_processed']++;
            } catch (Throwable $error) { $report['timestamp_error'] = 'pending_retry'; }
        }
    }
    $report['finished_at'] = gmdate('c');
    sovereignty_atomic(SOVEREIGNTY_PRIVATE . '/last-run.json', sovereignty_json($report));
} finally { flock($lock, LOCK_UN); fclose($lock); }
