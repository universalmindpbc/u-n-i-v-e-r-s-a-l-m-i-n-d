<?php
declare(strict_types=1);

const IAM_OWNER_STATE_HISTORY_ROOT = __DIR__ . '/.owner-state-history';
const IAM_OWNER_STATE_HISTORY_LIMIT = 120;

function iam_owner_state_history_directory(string $namespace): string
{
    if (!preg_match('/^[a-z0-9-]{3,48}$/', $namespace)) {
        throw new RuntimeException('Invalid owner-state history namespace.');
    }

    $root = IAM_OWNER_STATE_HISTORY_ROOT;
    if (!is_dir($root) && !@mkdir($root, 0700, true) && !is_dir($root)) {
        throw new RuntimeException('Owner-state history is unavailable.');
    }

    $denyFile = $root . '/.htaccess';
    if (!is_file($denyFile)) {
        $deny = "Options -Indexes\n<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n";
        if (@file_put_contents($denyFile, $deny, LOCK_EX) === false) {
            throw new RuntimeException('Owner-state history protection could not be created.');
        }
        @chmod($denyFile, 0644);
    }

    $directory = $root . '/' . $namespace;
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Owner-state history directory is unavailable.');
    }

    return $directory;
}

function iam_owner_state_archive_json(string $namespace, string $json, string $label): void
{
    if (!in_array($label, ['previous', 'candidate', 'recovery'], true)) {
        throw new RuntimeException('Invalid owner-state history label.');
    }
    if (!is_array(json_decode($json, true))) {
        throw new RuntimeException('Owner-state history rejected invalid JSON.');
    }

    $directory = iam_owner_state_history_directory($namespace);
    $hash = hash('sha256', $json);
    $filename = sprintf('%s-%s-%s.json', gmdate('Ymd-His'), $label, substr($hash, 0, 16));
    $destination = $directory . '/' . $filename;

    if (!is_file($destination)) {
        $temporary = $destination . '.tmp-' . bin2hex(random_bytes(4));
        if (@file_put_contents($temporary, $json, LOCK_EX) === false || !@rename($temporary, $destination)) {
            @unlink($temporary);
            throw new RuntimeException('Owner-state history could not be written.');
        }
        @chmod($destination, 0600);
    }

    $files = glob($directory . '/*.json') ?: [];
    sort($files, SORT_STRING);
    $removeCount = max(0, count($files) - IAM_OWNER_STATE_HISTORY_LIMIT);
    for ($index = 0; $index < $removeCount; $index += 1) {
        @unlink($files[$index]);
    }
}

function iam_owner_state_prepare_write(string $namespace, string $livePath, string $candidateJson): void
{
    $existing = @file_get_contents($livePath);
    if (is_string($existing) && $existing !== '') {
        iam_owner_state_archive_json($namespace, $existing, 'previous');
    }
    iam_owner_state_archive_json($namespace, $candidateJson, 'candidate');
}
