<?php
require_once __DIR__ . '/access.php';
events_require_access();
session_write_close();
header('Content-Type: application/json');
try {
    echo json_encode(events_media_urls(), JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    http_response_code(503);
    echo '{"error":"The film is temporarily unavailable. Please try again in a moment."}';
}
