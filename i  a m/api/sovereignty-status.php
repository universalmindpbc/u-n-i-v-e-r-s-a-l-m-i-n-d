<?php
declare(strict_types=1);
require_once __DIR__ . '/sovereignty-lib.php';
require_once __DIR__ . '/sovereignty-operations.php';
header('Content-Type: application/json'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow');
try {
    $config = sovereignty_config();
    if (!sovereignty_admin_valid($config)) { http_response_code(403); echo '{"error":"Forbidden"}'; exit; }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if ($config['environment'] !== 'staging' || ($_SERVER['HTTP_HOST'] ?? '') !== 'staging.universalmind.tv') throw new RuntimeException('Diagnostic is staging-only.');
        $input = json_decode((string) file_get_contents('php://input', false, null, 0, 256), true, 8, JSON_THROW_ON_ERROR);
        $action = $input['action'] ?? '';
        if ($action === 'install_scheduler') { echo sovereignty_json(sovereignty_install_scheduler($config)); exit; }
        if (in_array($action, ['deliver_test','timestamp_test'], true)) {
            define('SOVEREIGNTY_WORKER_LIBRARY_ONLY', true);
            require_once __DIR__ . '/sovereignty-worker.php';
            if ($action === 'deliver_test') { echo sovereignty_json(sovereignty_worker($config, true)); exit; }
            require_once __DIR__ . '/sovereignty-timestamps.php';
            if (($config['timestamp_enabled'] ?? false) !== true) throw new RuntimeException('Timestamping not enabled.');
            $paths = glob(SOVEREIGNTY_PRIVATE . '/qa-events/*.json') ?: [];
            if (count($paths) !== 1) throw new RuntimeException('Create the isolated diagnostic first.');
            [$event, $body] = sovereignty_bundle($paths[0]);
            $state = sovereignty_timestamp_bundle($event['event_id'], $body, true);
            echo sovereignty_json(['isolated_test'=>true, 'state'=>$state['state'], 'proof_count'=>count($state['proofs'])]); exit;
        }
        if ($action !== 'self_test') throw new RuntimeException('Invalid diagnostic.');
        $digest = hash('sha256', 'isolated-staging-receipt-check');
        $first = sovereignty_record_verified_digest($digest, $config, true);
        $again = sovereignty_record_verified_digest($digest, $config, true);
        if ($again !== false) throw new RuntimeException('Duplicate diagnostic record.');
        echo sovereignty_json(['isolated_test'=>true, 'encryption_and_signing'=>true,
            'duplicate_prevented'=>true, 'created'=>$first, 'audience_entries_changed'=>false]);
        exit;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') { http_response_code(405); exit; }
    $events = glob(SOVEREIGNTY_PRIVATE . '/events/*.json') ?: [];
    $secured = 0; $expired = 0;
    foreach (glob(SOVEREIGNTY_PRIVATE . '/delivery/*.json') ?: [] as $path) {
        $state = json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
        if (count(array_filter($state['vaults'] ?? [], static fn($v):bool=>($v['state']??'')==='secured')) === 4) {
            if (strtotime($state['retained_until'] ?? '') > time()) $secured++; else $expired++;
        }
    }
    $timestampCounts = ['not_submitted'=>0, 'pending_bitcoin'=>0, 'bitcoin_confirmed'=>0];
    foreach (glob(SOVEREIGNTY_PRIVATE . '/timestamps/*.json') ?: [] as $path) {
        $timestamp = json_decode((string) file_get_contents($path), true);
        if (isset($timestampCounts[$timestamp['state'] ?? ''])) $timestampCounts[$timestamp['state']]++;
    }
    $operational = [];
    foreach (['worker-status','scheduler','last-run'] as $name) {
        $path = SOVEREIGNTY_PRIVATE . '/' . $name . '.json';
        $operational[$name] = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
    }
    echo sovereignty_json(['section'=>'Universal Sovereignty', 'environment'=>$config['environment'],
        'recorded_entries'=>count($events), 'four_copies_secured'=>$secured,
        'configured_vaults'=>count($config['vaults'] ?? []), 'retention_configured'=>is_int($config['retention_days'] ?? null),
        'blockchain'=>$timestampCounts, 'expired_locks'=>$expired,
        'hosting'=>sovereignty_hosting_status(), 'operations'=>$operational,
        'storage_plan'=>$config['storage_plan'] ?? null, 'storage_limit_bytes'=>9000000000,
        'contract_execution'=>false, 'token_issuance'=>false]);
} catch (Throwable $error) { http_response_code(503); echo '{"error":"Archive unavailable"}'; }
