<?php
require_once __DIR__ . '/access.php';
events_require_access();
session_write_close();
header('Content-Type: application/json');
try {
    $config = json_decode((string)file_get_contents(__DIR__.'/private/media.json'), true, 16, JSON_THROW_ON_ERROR);
    if (empty($config['film_uid'])) throw new RuntimeException('Media unavailable.');
    $base = 'https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/';
    $film = $config['film_uid'];
    echo json_encode(['film'=>$base.$film.'/iframe', 'expires'=>time()+3500], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    http_response_code(503);
    echo '{"error":"The film is temporarily unavailable. Please try again in a moment."}';
}
