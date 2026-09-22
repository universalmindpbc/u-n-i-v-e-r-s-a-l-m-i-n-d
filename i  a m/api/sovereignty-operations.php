<?php
declare(strict_types=1);
require_once __DIR__ . '/sovereignty-lib.php';

function sovereignty_command(array $command, string $input = ''): array {
    if (!function_exists('proc_open')) throw new RuntimeException('Hosting command access unavailable.');
    $process = proc_open($command, [['pipe','r'],['pipe','w'],['pipe','w']], $pipes);
    if (!is_resource($process)) throw new RuntimeException('Hosting command unavailable.');
    fwrite($pipes[0], $input); fclose($pipes[0]);
    stream_set_blocking($pipes[1], false); stream_set_blocking($pipes[2], false);
    $out = ''; $err = ''; $deadline = microtime(true) + 5;
    do {
        $out .= stream_get_contents($pipes[1]); $err .= stream_get_contents($pipes[2]);
        $status = proc_get_status($process);
        if (!$status['running']) break;
        if (microtime(true) >= $deadline || strlen($out) + strlen($err) > 262144) {
            proc_terminate($process); foreach ([1,2] as $p) fclose($pipes[$p]); proc_close($process);
            throw new RuntimeException('Hosting command timed out.');
        }
        usleep(20000);
    } while (true);
    $out .= stream_get_contents($pipes[1]); $err .= stream_get_contents($pipes[2]);
    foreach ([1,2] as $p) fclose($pipes[$p]); proc_close($process);
    return ['code'=>$status['exitcode'], 'stdout'=>$out, 'stderr'=>$err];
}

function sovereignty_hosting_status(): array {
    $php = [];
    foreach (['/usr/local/bin/php', '/usr/bin/php', '/opt/cpanel/ea-php83/root/usr/bin/php', '/opt/cpanel/ea-php82/root/usr/bin/php'] as $path) {
        if (is_executable($path)) $php[] = $path;
    }
    $quotaPath = SOVEREIGNTY_PRIVATE . '/hosting-quota.json';
    $quota = is_file($quotaPath) ? json_decode((string) file_get_contents($quotaPath), true) : null;
    return ['php_version'=>PHP_VERSION, 'proc_open_available'=>function_exists('proc_open'),
        'crontab_available'=>is_executable('/usr/bin/crontab'), 'php_cli_candidates'=>$php,
        'filesystem_free_bytes'=>@disk_free_space(SOVEREIGNTY_PRIVATE),
        'account_quota_verified'=>isset($quota['Quota'], $quota['StatsBar'], $quota['checked_at']),
        'account_quota_checked_at'=>$quota['checked_at'] ?? null, 'paid_services_created'=>false];
}

function sovereignty_check_hosting_quota(): array {
    $uapi = '/usr/local/cpanel/bin/uapi';
    if (!is_executable($uapi)) throw new RuntimeException('Hosting quota API unavailable.');
    $report = ['checked_at'=>gmdate('c')];
    foreach ([['Quota','get_quota_info'], ['StatsBar','get_stats','display=diskusage|bandwidthusage']] as $command) {
        $response = sovereignty_command(array_merge([$uapi, '--output=json'], $command));
        $result = json_decode($response['stdout'], true);
        if ($response['code'] !== 0 || ($result['result']['status'] ?? null) !== 1) throw new RuntimeException('Hosting quota needs account verification.');
        $report[$command[0]] = $result['result']['data'];
    }
    sovereignty_atomic(SOVEREIGNTY_PRIVATE . '/hosting-quota.json', sovereignty_json($report));
    return $report;
}

function sovereignty_install_scheduler(array $config): array {
    if (!in_array($config['environment'], ['staging','production'], true)
        || ($config['environment'] === 'production' && ($config['production_approved'] ?? false) !== true)) throw new RuntimeException('Archive environment not approved.');
    $host = sovereignty_hosting_status(); $php = null;
    if (!$host['crontab_available']) throw new RuntimeException('Hosting cron access required.');
    foreach ($host['php_cli_candidates'] as $candidate) {
        $probe = sovereignty_command([$candidate, '-r', 'echo PHP_SAPI === "cli" && PHP_VERSION_ID >= 80100 && extension_loaded("curl") && extension_loaded("openssl") ? "ready" : "unsupported";']);
        if ($probe['code'] === 0 && $probe['stdout'] === 'ready') { $php = $candidate; break; }
    }
    if ($php === null) throw new RuntimeException('A supported hosting PHP CLI is required.');
    $before = sovereignty_command(['/usr/bin/crontab', '-l']);
    if ($before['code'] !== 0 && !str_contains(strtolower($before['stderr']), 'no crontab')) throw new RuntimeException('Cannot read existing hosting schedule.');
    $marker = '# um-sovereignty-' . $config['environment'] . '-v1';
    $lines = array_filter(explode("\n", rtrim($before['stdout'], "\n")), static fn($line)=>!str_ends_with($line, $marker));
    $runner = realpath(__DIR__ . '/sovereignty-run.php');
    if ($runner === false) throw new RuntimeException('Archive runner unavailable.');
    $line = '*/5 * * * * ' . escapeshellarg($php) . ' ' . escapeshellarg($runner) . ' > /dev/null 2>&1 ' . $marker;
    $lines[] = $line; $after = implode("\n", $lines) . "\n";
    if ($after !== $before['stdout']) {
        sovereignty_atomic(SOVEREIGNTY_PRIVATE . '/cron-before.txt', $before['stdout']);
        $write = sovereignty_command(['/usr/bin/crontab', '-'], $after);
        if ($write['code'] !== 0) throw new RuntimeException('Hosting scheduler update failed.');
    }
    $check = sovereignty_command(['/usr/bin/crontab', '-l']);
    if ($check['code'] !== 0 || $check['stdout'] !== $after) throw new RuntimeException('Hosting scheduler verification failed.');
    $report = ['installed'=>true, 'interval_minutes'=>5, 'verified_at'=>gmdate('c')];
    sovereignty_atomic(SOVEREIGNTY_PRIVATE . '/scheduler.json', sovereignty_json($report));
    return $report;
}
