<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow');

$canonicalPath = __DIR__ . DIRECTORY_SEPARATOR . 'vogue-self-report.html';
$canonical = @file_get_contents($canonicalPath);

if ($canonical === false) {
    http_response_code(503);
    echo 'The I AM check-in is temporarily unavailable.';
    exit;
}

$researchDestination = 'research.php?offer=heart-rate&selection_source=checkin';
$rendered = preg_replace(
    '/data-iam-next-page="(?:index\.html|research\.php)[^\"]*"/',
    'data-iam-next-page="' . $researchDestination . '"',
    $canonical
);

if (!is_string($rendered)) {
    http_response_code(503);
    echo 'The research check-in could not be prepared.';
    exit;
}

$rendered = str_replace(
    '<title>Check In | I Am</title>',
    '<meta name="robots" content="noindex, nofollow">' . "\n    " . '<title>Research Check In | I Am</title>',
    $rendered
);

echo $rendered;
