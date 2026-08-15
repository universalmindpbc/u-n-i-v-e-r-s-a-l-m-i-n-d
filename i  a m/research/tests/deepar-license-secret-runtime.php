<?php
declare(strict_types=1);

$protectedStoreValue = '';

function happiness_secret(string $name): string
{
    global $protectedStoreValue;
    return $name === 'DEEPAR_WEB_KEY' ? $protectedStoreValue : '';
}

define('IAM_DEEPAR_LICENSE_LIBRARY_ONLY', true);
require dirname(__DIR__, 2) . '/api/deepar-license.php';

function require_deepar_condition(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, $message . PHP_EOL);
        exit(1);
    }
}

putenv('DEEPAR_WEB_KEY');
unset($_SERVER['DEEPAR_WEB_KEY'], $_ENV['DEEPAR_WEB_KEY']);

$protectedStoreValue = 'protected-domain-bound-web-key';
require_deepar_condition(
    deepar_require_web_key() === $protectedStoreValue,
    'The DeepAR licence endpoint did not resolve the protected server store.'
);

$protectedStoreValue = '';
$failedClosed = false;
try {
    deepar_require_web_key();
} catch (RuntimeException $exception) {
    $failedClosed = $exception->getMessage() === 'deepar_web_key_missing';
}
require_deepar_condition($failedClosed, 'The DeepAR licence endpoint did not fail closed when the key was absent.');

echo "DeepAR protected secret runtime regression passed.\n";
