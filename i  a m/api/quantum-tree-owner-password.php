<?php
declare(strict_types=1);

// Deployment excludes .runtime-private; the API's .htaccess denies HTTP access.
const QUANTUM_TREE_PASSWORD_PATH = __DIR__ . '/.runtime-private/quantum-tree-owner.json';

function quantum_tree_owner_credentials(): array
{
    if (is_dir(dirname(QUANTUM_TREE_PASSWORD_PATH)) && !is_readable(dirname(QUANTUM_TREE_PASSWORD_PATH))) {
        return ['revision' => 'unavailable', 'password_hash' => ''];
    }
    if (!file_exists(QUANTUM_TREE_PASSWORD_PATH)) {
        return ['revision' => 'legacy', 'password_hash' => null];
    }
    $record = json_decode((string) @file_get_contents(QUANTUM_TREE_PASSWORD_PATH), true);
    if (!is_array($record) || !is_string($record['revision'] ?? null)
        || !is_string($record['password_hash'] ?? null)
        || ($record['revision'] ?? '') === 'legacy'
        || (password_get_info($record['password_hash'])['algoName'] ?? 'unknown') === 'unknown') {
        // A damaged custom credential must never reactivate the old access key.
        return ['revision' => 'unavailable', 'password_hash' => ''];
    }
    return $record;
}

function quantum_tree_password_valid(string $password, array $credentials): bool
{
    if ($credentials['revision'] === 'legacy') {
        $legacy = trim($password);
        return $legacy !== '' && strlen($legacy) <= 256
            && hash_equals(QUANTUM_TREE_OWNER_KEY_HASH, hash('sha256', $legacy));
    }
    return strlen($password) <= 72 && $credentials['password_hash'] !== ''
        && password_verify($password, $credentials['password_hash']);
}

function quantum_tree_owner_authenticated(): bool
{
    $credentials = quantum_tree_owner_credentials();
    return ($_SESSION['quantum_tree_owner'] ?? false) === true
        && $credentials['revision'] !== 'unavailable'
        && hash_equals($credentials['revision'], (string) ($_SESSION['quantum_tree_password_revision'] ?? 'legacy'));
}

function quantum_tree_change_password(string $password, string $expectedRevision): array
{
    $directory = dirname(QUANTUM_TREE_PASSWORD_PATH);
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Password storage is unavailable.');
    }
    $lock = @fopen($directory . '/quantum-tree-owner.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) {
        if ($lock) fclose($lock);
        throw new RuntimeException('Password storage is unavailable.');
    }
    $temporary = null;
    try {
        if (!hash_equals(quantum_tree_owner_credentials()['revision'], $expectedRevision)) {
            throw new RuntimeException('Your session changed. Sign in again before changing your password.');
        }
        $record = ['schema_version' => 1, 'revision' => bin2hex(random_bytes(24)),
            'password_hash' => password_hash($password, PASSWORD_DEFAULT), 'updated_at' => gmdate('c')];
        $json = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n";
        $temporary = QUANTUM_TREE_PASSWORD_PATH . '.tmp-' . bin2hex(random_bytes(8));
        $file = @fopen($temporary, 'x+b');
        if (!$file) throw new RuntimeException('Your password could not be saved.');
        try {
            if (!@chmod($temporary, 0600) || fwrite($file, $json) !== strlen($json) || !fflush($file)) {
                throw new RuntimeException('Your password could not be saved.');
            }
        } finally { fclose($file); }
        if (!@rename($temporary, QUANTUM_TREE_PASSWORD_PATH)) {
            throw new RuntimeException('Your password could not be saved.');
        }
        return $record;
    } finally {
        if ($temporary && file_exists($temporary)) @unlink($temporary);
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
