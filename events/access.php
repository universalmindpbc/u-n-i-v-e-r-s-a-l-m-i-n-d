<?php
declare(strict_types=1);
header('Cache-Control: private, no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://embed.cloudflarestream.com; style-src 'self'; img-src 'self' data:; media-src 'self' https://*.cloudflarestream.com https://*.videodelivery.net; connect-src 'self' https://*.cloudflarestream.com https://*.videodelivery.net; frame-src 'self' https://*.cloudflarestream.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('um_events');
session_set_cookie_params(['lifetime'=>0, 'path'=>'/events/', 'secure'=>true, 'httponly'=>true, 'samesite'=>'Strict']);
session_start();
function events_authenticated(): bool {
    return isset($_SESSION['events_until']) && $_SESSION['events_until'] > time();
}
function events_require_access(): void {
    if (!events_authenticated()) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo '{"error":"Please enter your invitation password."}';
        exit;
    }
}
function events_password_valid(string $password): bool {
    // Reuse the site's existing invitation passwords without copying any credential.
    $root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    foreach ([$root . '/index.html', dirname(__DIR__) . '/index.html'] as $path) {
        $source = @file_get_contents($path);
        if (!is_string($source) || !preg_match('/const allowedPasswordHashes = new Set\\(\\[([\\s\\S]*?)\\]\\)/', $source, $block)) continue;
        preg_match_all('/[a-f0-9]{64}/', $block[1], $matches);
        foreach ($matches[0] as $hash) {
            if (hash_equals($hash, hash('sha256', $password))) return true;
        }
    }
    return false;
}
