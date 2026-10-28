<?php
require_once __DIR__ . '/access.php';
events_require_access();
session_write_close();

// A small progressive MP4 on Panthur, with the byte ranges Safari requests.
$path = __DIR__ . '/private/opening-loop.mp4';
$size = filesize($path);
$start = 0;
$end = $size - 1;
header('Content-Type: video/mp4');
header('Accept-Ranges: bytes');
if (isset($_SERVER['HTTP_RANGE'])) {
    $range = trim($_SERVER['HTTP_RANGE']);
    if (!preg_match('/^bytes=(\d*)-(\d*)$/', $range, $match) || ($match[1] === '' && $match[2] === '')) {
        http_response_code(416);
        header('Content-Range: bytes */' . $size);
        exit;
    }
    if ($match[1] === '') {
        $start = max(0, $size - (int)$match[2]);
    } else {
        $start = (int)$match[1];
        if ($match[2] !== '') $end = min($end, (int)$match[2]);
    }
    if ($start > $end || $start >= $size) {
        http_response_code(416);
        header('Content-Range: bytes */' . $size);
        exit;
    }
    http_response_code(206);
    header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
}
header('Content-Length: ' . ($end - $start + 1));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') exit;
$stream = fopen($path, 'rb');
fseek($stream, $start);
$remaining = $end - $start + 1;
while ($remaining > 0 && !feof($stream)) {
    $chunk = fread($stream, min(65536, $remaining));
    if ($chunk === false || $chunk === '') break;
    echo $chunk;
    $remaining -= strlen($chunk);
}
fclose($stream);
