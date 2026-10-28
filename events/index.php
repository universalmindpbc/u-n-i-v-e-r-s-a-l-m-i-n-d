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
$filmHls = '';
if ($entered) {
    try { $filmHls = events_media_urls()['hls']; } catch (Throwable $e) { /* Keep the entry screen available if media configuration is unavailable. */ }
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#080808">
<link rel="icon" href="/vogue/iam/favicon.png?v=iam-favicon-3">
<title>athousandminds — Universal Mind</title>
<link rel="stylesheet" href="assets/events.css?v=13">
<?php if (!$entered): ?>
<link rel="stylesheet" href="assets/gate.css?v=5">
<script src="assets/gate-rain.js?v=2" defer></script>
<script src="assets/gate-launch.js?v=3" defer></script>
<?php endif; ?>
<?php if ($entered): ?>
<script src="assets/events.js?v=12" defer></script>
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
<div class="backdrop" aria-hidden="true">
<video id="opening-loop" src="loop.php?v=2" poster="poster.php" autoplay muted loop playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto" tabindex="-1"></video>
<picture id="opening-animation" class="opening-animation">
<source media="(prefers-reduced-motion: reduce)" srcset="poster.php">
<img src="animation.php?v=1" alt="" fetchpriority="high">
</picture>
</div>
<button id="global-nav-toggle" class="global-nav-toggle" aria-label="About" aria-expanded="false" aria-controls="about-panel">
<img src="/vogue/iam/a%20s%20s%20e%20t%20s/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20Logo%20512.png" alt="" aria-hidden="true">
<span class="flower-label" aria-hidden="true">About</span>
</button>
<button id="fullscreen-toggle" class="maximise" aria-label="Enter fullscreen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></svg></button>
<section class="poster" aria-labelledby="festival-title">
<header class="presenters">
<p>LIVE NATION, APPLE TV+ AND <span class="presenter-brand"><img src="/vogue/iam/a%20s%20s%20e%20t%20s/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20Logo%20512.png" alt="" aria-hidden="true"><span>UNIVERSAL MIND</span></span></p>
<p class="present">PRESENT</p>
</header>
<div class="title-group">
<h1 id="festival-title" aria-label="athousandminds"><span>athousand</span><strong>minds</strong></h1>
<p class="tagline"><span class="tagline-phrase">change your emotions.</span> <span class="tagline-phrase">transform your world</span></p>
<button id="watch-film" class="watch-film"><span class="play-icon" aria-hidden="true"><svg viewBox="0 0 12 12" focusable="false"><path d="M2 1.4v9.2L10.2 6z"/></svg></span><span>Watch the film</span></button>
<p id="film-status" class="film-status" role="status"></p>
</div>
<p class="event-description"><span class="event-format">Multiple arenas</span><span class="event-divider"> - </span><span class="event-summary">A new interactive music, fashion, light festival, exploring mindfulness</span></p>
<div class="venues" aria-label="Venues">
<span>Sydney Opera House</span><b aria-hidden="true">|</b><span>Barbican London</span><b aria-hidden="true">|</b><span>Madison Square Garden NY</span>
</div>
<p class="hashtags">#together #weareone</p>
<footer class="proposal-label"><button id="proposal-about">Proposal</button></footer>
</section>
<section id="film-view" class="film-view" aria-label="athousandminds — the film" hidden>
<div id="film-mount"></div>
<video id="native-film" data-hls="<?= htmlspecialchars($filmHls, ENT_QUOTES, 'UTF-8') ?>" playsinline webkit-playsinline preload="none" tabindex="-1" hidden></video>
<button id="film-back" class="film-back" aria-label="Back to main screen"><span aria-hidden="true">←</span> Back</button>
<button id="film-retry" class="film-retry" hidden>Play film</button>
<output id="film-timecode" class="film-timecode" aria-label="Film playback time">0:00 / 2:22</output>
<p id="playback-status" class="playback-status" role="status"></p>
</section>
<section id="about-panel" class="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title" hidden>
<article class="about-copy" tabindex="-1">
<p class="about-eyebrow">UNIVERSAL MIND / EVENTS</p>
<h2 id="about-title">athousand<strong>minds</strong></h2>
<p class="about-tagline">Change your emotions. Transform your world.</p>
<p>Welcome to <strong>athousandminds</strong> is a new interactive music, fashion and light festival exploring mindfulness.</p>
<p>The event places the audience inside a responsive environment, gamifying mindfulness and authentic human connection through an electronic music experience.</p>
<ol class="about-levels">
<li>Connect to yourself (level one)</li>
<li>Connect with each other (level two)</li>
<li>Together, Transform your world (level three)</li>
</ol>
<p>Each level unlocks rewards that can be redeemed at the event, whether interactive digital experiences, physical items such as fashion and merch, or exclusive live performances on the night.</p>
<p><strong>athousandminds</strong> attendees wear an Apple Watch, and their neurotransmitters shape the music, fashion and lighting around them in real time. As the audience’s mind-state evolves, the environment changes with it. This is the future of mindfulness.</p>
<p>The <strong>athousandminds</strong> experience uses Apple Watch signals to infer emotional connection through oxytocin health and psychological safety through cortisol health. Real time hormone and neurotransmitter inference is possible via wearables in 2026. Check out <a href="https://your6.com" target="_blank" rel="noopener noreferrer">SIX</a> / <a href="https://www.getimmersion.com" target="_blank" rel="noopener noreferrer">IMMERSION</a> to learn more.</p>
<p class="about-proposal"><strong>athousandminds</strong> is a new festival by Universal Mind, pitching to Live Nation and Apple TV+, together as one. The artists and venues are ideal bookings, not confirmed and this is not an advertisement for an existing event.</p>
<button id="about-return" class="about-return">Back to experience</button>
</article>
</section>
</main>
<?php endif; ?>
</body>
</html>
