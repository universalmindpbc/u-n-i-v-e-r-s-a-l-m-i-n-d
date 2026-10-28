<?php
require_once __DIR__ . '/access.php';
events_require_access();
session_write_close();
header('Content-Type: image/jpeg');
readfile(__DIR__ . '/private/poster.jpg');
