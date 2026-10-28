<?php
require_once __DIR__ . '/access.php';
happiness_require_access();
session_write_close();
header('Content-Type: application/json');
echo json_encode([
    'film'=>'https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/8dc27681c2ab042abf567389868cea9e/iframe',
    'duration'=>355,
    'expires'=>time()+3500
], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
