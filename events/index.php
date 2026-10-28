<?php
require_once __DIR__ . '/access.php';
$error = '';
$_SESSION['csrf'] ??= bin2hex(random_bytes(24));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
        http_response_code(403); $error = 'Please refresh and try again.';
    } elseif (($_SESSION['retry_after'] ?? 0) > time()) {
        http_response_code(429); $error = 'Please wait a moment before trying again.';
    } elseif (events_password_valid((string)($_POST['password'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['events_until'] = time() + 8 * 3600;
        unset($_SESSION['failures'], $_SESSION['retry_after']);
        if (str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')) { header('Content-Type: application/json'); echo '{"granted":true}'; exit; }
        header('Location: /events/?experience=1', true, 303); exit;
    } else {
        $_SESSION['failures'] = ($_SESSION['failures'] ?? 0) + 1;
        if ($_SESSION['failures'] >= 5) $_SESSION['retry_after'] = time() + 60;
        http_response_code(401); $error = 'Please check your invitation password.';
    }
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')) { header('Content-Type: application/json'); echo json_encode(['error'=>$error]); exit; }
$entered = events_authenticated() && ($_GET['experience'] ?? '') === '1';
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#080808">
<link rel="icon" href="/vogue/iam/favicon.png?v=iam-favicon-3">
<title>a thousand minds — Universal Mind</title>
<link rel="stylesheet" href="assets/events.css?v=1">
<?php if (!$entered): ?>
<link rel="stylesheet" href="assets/gate.css?v=1">
<script src="assets/gate-rain.js?v=1" defer></script>
<script src="assets/gate-launch.js?v=1" defer></script>
<?php endif; ?>
<?php if ($entered): ?>
<script src="https://embed.cloudflarestream.com/embed/sdk.latest.js" defer></script>
<script src="assets/events.js?v=1" defer></script>
<?php endif; ?>
</head>
<body class="<?= $entered ? 'entered' : 'invitation' ?>">
<?php if (!$entered): ?>
<canvas class="rain-canvas" aria-hidden="true" data-rain-canvas></canvas>
<div class="rain-vignette" aria-hidden="true"></div>
<main class="access-shell">
<img class="access-flower" src="/vogue/iam/a%20s%20s%20e%20t%20s/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20Logo.PNG" alt="" aria-hidden="true" fetchpriority="high">
<h1 class="access-title">u n i v e r s a l&nbsp;&nbsp;m i n d</h1>
<form method="post" class="access-form" data-access-form>
<label class="access-label" for="password">password</label>
<input class="access-input" id="password" name="password" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" required aria-describedby="gate-error">
<input name="csrf" type="hidden" value="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
<button class="access-submit" type="submit">enter</button>
<p id="gate-error" class="access-error" role="status"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
</form>
</main>
<?php else: ?>
<main class="experience" id="experience">
<section class="poster" aria-labelledby="festival-title">
<div class="backdrop" aria-hidden="true">
<img src="poster.php" alt="" fetchpriority="high">
<video id="opening-loop" loop playsinline preload="none" tabindex="-1"></video>
</div>
<header class="presenters">
<p>LIVE NATION, APPLE TV+ AND UNIVERSAL MIND</p>
<p class="present">PRESENT</p>
</header>
<div class="title-group">
<h1 id="festival-title"><span>a thousand</span><strong>minds</strong></h1>
<p class="tagline">change your emotions. change your world</p>
<button id="watch-film" class="watch-film"><span class="play-icon" aria-hidden="true">▶</span><span>Watch the film</span></button>
<p id="film-status" class="film-status" role="status"></p>
</div>
<p class="hashtags">#together #weareone</p>
<div class="venues" aria-label="Venues">
<span>SYDNEY OPERA HOUSE</span><b aria-hidden="true">|</b><span>BARBICAN LONDON</span><b aria-hidden="true">|</b><span>MADISON SQUARE GARDEN NY</span>
</div>
<p class="event-description">MULTIPLE ARENAS - A NEW INTERACTIVE MUSIC, FASHION, LIGHT FESTIVAL, EXPLORING MINDFULNESS</p>
<button id="motion-toggle" class="motion-toggle" aria-label="Pause background motion">Pause motion</button>
<button id="sound-toggle" class="sound-toggle" aria-label="Mute sound">Sound on</button>
<button id="fullscreen-toggle" class="fullscreen-toggle" aria-label="Enter fullscreen">Fullscreen</button>
<footer class="proposal-note">nb. This is a concept for a new festival by Universal Mind, pitching to Live Nation and Apple TV+, together as one. The artists and venues are ideal bookings, not confirmed and this is not an advertisement for an existing event.</footer>
</section>
<section id="film-view" class="film-view" role="dialog" aria-modal="true" aria-label="A Thousand Minds — the film" hidden>
<iframe id="film-player" title="A Thousand Minds — teaser film" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
<button id="close-film" class="close-film" aria-label="Close film">Close <span aria-hidden="true">×</span></button>
<p id="playback-status" class="playback-status" role="status"></p>
</section>
</main>
<?php endif; ?>
</body>
</html>
