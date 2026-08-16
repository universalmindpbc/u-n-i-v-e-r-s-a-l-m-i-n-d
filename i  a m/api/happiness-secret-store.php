<?php
declare(strict_types=1);

/**
 * Resolve a private runtime value without ever placing credentials in Git.
 * Panthur may provide values as environment variables. Shared-hosting installs
 * can instead provide api/.happiness-private/config.php returning an array.
 * Restricted deployment accounts may use the separately denied
 * api/.runtime-private/config.php fallback without weakening the primary store.
 */
function happiness_secret(string $name): string
{
    $environment = getenv($name);
    if (is_string($environment) && trim($environment) !== '') return trim($environment);

    static $private = null;
    if ($private === null) {
        $private = [];
        $paths = [
            __DIR__ . '/.happiness-private/config.php',
            __DIR__ . '/.runtime-private/config.php',
        ];
        foreach ($paths as $path) {
            $loaded = is_file($path) ? require $path : [];
            if (is_array($loaded)) {
                // The original private store remains authoritative when both exist.
                $private += $loaded;
            }
        }
    }
    $value = $private[$name] ?? '';
    return is_string($value) ? trim($value) : '';
}
