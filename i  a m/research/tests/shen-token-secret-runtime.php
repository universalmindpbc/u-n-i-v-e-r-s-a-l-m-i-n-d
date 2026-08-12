<?php
declare(strict_types=1);

$protectedStoreValue = '';

function happiness_secret(string $name): string
{
    global $protectedStoreValue;
    return $name === 'SHENAI_ADMIN_KEY' ? $protectedStoreValue : '';
}

define('IAM_SHEN_TOKEN_LIBRARY_ONLY', true);
require dirname(__DIR__, 2) . '/api/shen-token.php';

function require_condition(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, $message . PHP_EOL);
        exit(1);
    }
}

putenv('SHENAI_ADMIN_KEY');
unset($_SERVER['SHENAI_ADMIN_KEY'], $_ENV['SHENAI_ADMIN_KEY']);

$protectedStoreValue = 'protected-store-test-value';
require_condition(
    shen_require_admin_key() === $protectedStoreValue,
    'The Shen token endpoint did not resolve the protected server store.'
);

$protectedStoreValue = '';
$failedClosed = false;
try {
    shen_require_admin_key();
} catch (RuntimeException $exception) {
    $failedClosed = $exception->getMessage() === 'shen_admin_key_missing';
}
require_condition($failedClosed, 'The Shen token endpoint did not fail closed when the key was absent.');

echo "Shen protected secret runtime regression passed.\n";
