<?php
declare(strict_types=1);
require_once __DIR__ . '/access.php';
$granted = events_authenticated();
session_write_close();
if (!$granted) {
    header('Location: /happiness/', true, 303);
    exit;
}
// Carry the existing portal invitation into a separate, path-scoped session.
require_once dirname(__DIR__) . '/happiness/access.php';
session_regenerate_id(true);
$_SESSION['happiness_until'] = time() + 8 * 3600;
unset($_SESSION['failures'], $_SESSION['retry_after']);
session_write_close();
header('Location: /happiness/', true, 303);
exit;
