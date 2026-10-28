<?php
require_once __DIR__ . '/access.php';
happiness_require_access();
session_write_close();
header('Content-Type: application/json');
$media = require __DIR__ . '/film-config.php';
$media['expires'] = time() + 3500;
echo json_encode($media, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
