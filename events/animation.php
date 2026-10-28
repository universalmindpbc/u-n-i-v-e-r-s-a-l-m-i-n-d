<?php
require_once __DIR__ . '/access.php';
events_require_access();
session_write_close();

// An image animation keeps the silent background moving when video autoplay is blocked.
$path = __DIR__ . '/private/opening-animation.webp';
header('Content-Type: image/webp');
header('Content-Length: ' . filesize($path));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') exit;
readfile($path);
