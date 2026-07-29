<?php
declare(strict_types=1);

/**
 * Resolve a private runtime value without ever placing credentials in Git.
 * Panthur may provide values as environment variables. Shared-hosting installs
 * can instead provide api/.happiness-private/config.php returning an array.
 */
function happiness_secret(string $name): string
{
    $environment = getenv($name);
    if (is_string($environment) && trim($environment) !== '') return trim($environment);

    static $private = null;
    if ($private === null) {
        $path = __DIR__ . '/.happiness-private/config.php';
        $loaded = is_file($path) ? require $path : [];
        $private = is_array($loaded) ? $loaded : [];
    }
    $value = $private[$name] ?? '';
    return is_string($value) ? trim($value) : '';
}
