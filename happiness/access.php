<?php
declare(strict_types=1);
header('Cache-Control: private, no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://embed.cloudflarestream.com https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; media-src 'self' https://rmu.universalmind.tv https://*.cloudflarestream.com https://*.videodelivery.net; connect-src 'self' https://*.cloudflarestream.com https://*.videodelivery.net https://cloudflareinsights.com https://*.cloudflareinsights.com; frame-src 'self' https://*.cloudflarestream.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('um_happiness');
session_set_cookie_params(['lifetime'=>0, 'path'=>'/happiness/', 'secure'=>true, 'httponly'=>true, 'samesite'=>'Strict']);
session_start();

function happiness_authenticated(): bool {
    return isset($_SESSION['happiness_until']) && $_SESSION['happiness_until'] > time();
}
function happiness_require_access(): void {
    if (!happiness_authenticated()) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo '{"error":"Please enter your invitation password."}';
        exit;
    }
}
function happiness_password_valid(string $password): bool {
    // Read the established invitation digest list; no credential is copied.
    $root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    foreach ([$root . '/index.html', dirname(__DIR__) . '/index.html'] as $path) {
        $source = @file_get_contents($path);
        if (!is_string($source) || !preg_match('/const allowedPasswordHashes = new Set\\(\\[([\\s\\S]*?)\\]\\)/', $source, $block)) continue;
        preg_match_all('/[a-f0-9]{64}/', $block[1], $matches);
        foreach ($matches[0] as $hash) {
            if (hash_equals($hash, hash('sha256', trim($password)))) return true;
        }
    }
    return false;
}
