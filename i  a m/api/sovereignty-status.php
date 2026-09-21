<?php
declare(strict_types=1);
require_once __DIR__ . '/sovereignty-lib.php';
header('Content-Type: application/json'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow');
try {
    $config = sovereignty_config();
    if (!sovereignty_admin_valid($config)) { http_response_code(403); echo '{"error":"Forbidden"}'; exit; }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if ($config['environment'] !== 'staging' || ($_SERVER['HTTP_HOST'] ?? '') !== 'staging.universalmind.tv') throw new RuntimeException('Diagnostic is staging-only.');
        $input = json_decode((string) file_get_contents('php://input', false, null, 0, 256), true, 8, JSON_THROW_ON_ERROR);
        if (($input['action'] ?? '') !== 'self_test') throw new RuntimeException('Invalid diagnostic.');
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
    $secured = 0;
    foreach (glob(SOVEREIGNTY_PRIVATE . '/delivery/*.json') ?: [] as $path) {
        $state = json_decode((string) file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
        if (count(array_filter($state['vaults'] ?? [], static fn($v):bool=>($v['state']??'')==='secured')) === 4) $secured++;
    }
    echo sovereignty_json(['section'=>'Universal Sovereignty', 'environment'=>$config['environment'],
        'recorded_entries'=>count($events), 'four_copies_secured'=>$secured,
        'configured_vaults'=>count($config['vaults'] ?? []), 'retention_configured'=>is_int($config['retention_days'] ?? null),
        'blockchain'=>'not_submitted', 'contract_execution'=>false, 'token_issuance'=>false]);
} catch (Throwable $error) { http_response_code(503); echo '{"error":"Archive unavailable"}'; }
