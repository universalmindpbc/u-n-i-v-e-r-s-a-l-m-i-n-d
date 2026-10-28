<?php
require_once __DIR__ . '/access.php';
$error = '';
$_SESSION['csrf'] ??= bin2hex(random_bytes(24));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
        http_response_code(403); $error = 'Please refresh and try again.';
    } elseif (($_SESSION['retry_after'] ?? 0) > time()) {
        http_response_code(429); $error = 'Please wait a moment before trying again.';
    } elseif (happiness_password_valid((string)($_POST['password'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['happiness_until'] = time() + 8 * 3600;
        unset($_SESSION['failures'], $_SESSION['retry_after']);
        if (str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')) {
            header('Content-Type: application/json'); echo '{"granted":true}'; exit;
        }
        header('Location: /happiness/', true, 303); exit;
    } else {
        $_SESSION['failures'] = ($_SESSION['failures'] ?? 0) + 1;
        if ($_SESSION['failures'] >= 5) $_SESSION['retry_after'] = time() + 60;
        http_response_code(401); $error = 'Please check your invitation password.';
    }
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')) {
    header('Content-Type: application/json'); echo json_encode(['error'=>$error]); exit;
}
$entered = happiness_authenticated();
$filmConfig = $entered ? (require __DIR__ . '/film-config.php') : [];
session_write_close();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#090d0a">
<link rel="icon" href="/vogue/iam/favicon.png?v=iam-favicon-3">
<title>happiness — Universal Mind</title>
<?php if (!$entered): ?>
<link rel="stylesheet" href="/events/assets/gate.css?v=4">
<script src="/events/assets/gate-rain.js?v=2" defer></script>
<script src="assets/gate-launch.js?v=1" defer></script>
<?php else: ?>
<link rel="preload" as="image" href="assets/universal-mind-flower.png">
<link rel="stylesheet" href="assets/happiness.css?v=5">
<script src="assets/network.js?v=1" defer></script>
<script src="assets/happiness.js?v=4" defer></script>
<?php endif; ?>
</head>
<body class="<?= $entered ? 'entered' : 'invitation' ?>">
<?php if (!$entered): ?>
<canvas class="rain-canvas" aria-hidden="true" data-rain-canvas></canvas>
<div class="rain-vignette" aria-hidden="true"></div>
<main class="access-shell">
<img class="access-flower" src="assets/universal-mind-flower.png" alt="" aria-hidden="true" fetchpriority="high">
<h1 class="access-title">u n i v e r s a l&nbsp;&nbsp;m i n d</h1>
<form method="post" class="access-form" data-access-form>
<label class="access-label" for="password">password</label>
<input class="access-input" id="password" name="password" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" required aria-describedby="gate-error">
<input name="csrf" type="hidden" value="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
<button class="access-submit" type="submit">launch happiness</button>
<p id="gate-error" class="access-error" role="status"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
</form>
</main>
<?php else: ?>
<svg class="symbol-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<symbol id="icon-music" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></symbol>
<symbol id="icon-light" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></symbol>
<symbol id="icon-visual" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="1"/><path d="M12 17v4M7 21h10"/></symbol>
<symbol id="icon-shield" viewBox="0 0 24 24"><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/></symbol>
<symbol id="icon-bar" viewBox="0 0 24 24"><path d="m3 3 9 11L21 3H3Zm9 11v8m-5 0h10M6 7h12"/></symbol>
<symbol id="icon-person" viewBox="0 0 24 24"><circle cx="12" cy="6" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3Z"/></symbol>
<symbol id="icon-people" viewBox="0 0 24 24"><circle cx="9" cy="6" r="4"/><path d="M2 22v-5a7 7 0 0 1 14 0v5H2ZM16 3a4 4 0 0 1 0 7m2 3a6 6 0 0 1 4 6v3"/></symbol>
<symbol id="icon-medical" viewBox="0 0 24 24"><path d="M8 2h8v6h6v8h-6v6H8v-6H2V8h6Z"/></symbol>
<symbol id="icon-police" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m12 5 2 5h5l-4 3 1.5 5-4.5-3-4.5 3L9 13l-4-3h5Z"/></symbol>
<symbol id="icon-expand" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></symbol>
<symbol id="icon-collapse" viewBox="0 0 24 24"><path d="M3 8h5V3M16 3v5h5M21 16h-5v5M8 21v-5H3"/></symbol>
</defs>
</svg>
<div class="backdrop" aria-hidden="true">
<img src="assets/festival-poster.jpg" alt="" fetchpriority="high">
<video id="opening-loop" data-src="https://rmu.universalmind.tv/rihanna-global-citizen-loop.mp4" muted loop playsinline preload="metadata" tabindex="-1" disablepictureinpicture disableremoteplayback></video>
<div class="backdrop-shade"></div>
</div>
<main class="experience" id="experience">
<header class="site-header">
<button id="global-nav-toggle" class="brand-flower" aria-label="About Happiness" aria-expanded="false" aria-controls="about-panel"><img src="assets/universal-mind-flower.png" alt="Universal Mind" width="56" height="57"><span class="flower-tooltip">About</span></button>
<div class="brand-copy"><h1>happiness</h1><p>real time public health &amp; safety index for festivals</p></div>
<div class="header-rule" aria-hidden="true"></div>
<nav class="header-actions" aria-label="Page controls"><a href="/home/" target="_top">Portal</a><button data-open-about>About</button><button id="fullscreen-toggle" class="icon-button" aria-label="Enter fullscreen" title="Enter fullscreen"><svg><use href="#icon-expand"/></svg></button></nav>
</header>

<section id="ecosystem" class="ecosystem" aria-label="Happiness festival ecosystem">
<svg id="connections" class="connections" aria-hidden="true"><g id="connection-paths"></g></svg>
<div class="scene-columns">
<section class="attendees" aria-labelledby="attendee-title">
<h2 class="section-label" id="attendee-title"><span>01</span> Attendees</h2>
<div id="watch-anchor" class="watch-object" aria-label="Apple Watch illustration">
<div class="watch-band band-top"></div><div class="watch-band band-bottom"></div><div class="watch-crown"></div>
<div class="watch-case"><div class="watch-face"><svg viewBox="0 0 150 120" aria-hidden="true"><path class="pulse-line" d="M5 64h19l8-13 9 28 10-54 14 71 10-33h20l9-12 9 13h32"/></svg><span>happiness</span></div></div>
</div>
<div class="signals"><h3>Research signals</h3><div><svg viewBox="0 0 30 20" aria-hidden="true"><path d="M1 12 8 4l7 12 6-9 8 3"/></svg><span>Cortisol</span></div><div><i class="signal-dot" aria-hidden="true"></i><span>Oxytocin</span></div><div><i class="signal-cluster" aria-hidden="true"></i><span>Dopamine</span></div></div>
</section>

<section class="collective" aria-labelledby="collective-title">
<h2 class="section-label" id="collective-title"><span>02</span> Collective index</h2>
<div id="network-field" class="network-field" data-animation-state="loading">
<canvas id="network-canvas" role="img" aria-label="Animated three-dimensional network representing the collective festival index"></canvas>
<img id="central-flower" class="central-flower" src="assets/universal-mind-flower.png" alt="Universal Mind flower" width="1352" height="1364">
</div>
<p class="index-caption">Public health &amp; safety index</p>
<span id="reward-label" class="reward-label">Happiness rewards</span>
</section>

<section class="coordination" aria-labelledby="control-title">
<h2 class="section-label"><span>03</span> Coordination</h2>
<div id="control-anchor" class="control-room">
<div class="control-heading"><span class="alert-label">Safety alert</span><h3 id="control-title">Festival control room</h3></div>
<div class="team-list">
<button data-detail="Production manager" data-description="Coordinates the festival response across production and venue teams."><svg><use href="#icon-person"/></svg><span>Production manager</span><i aria-hidden="true"></i></button>
<button data-detail="Promoter" data-description="Connects the festival organisers and the teams delivering the event."><svg><use href="#icon-people"/></svg><span>Promoter</span><i aria-hidden="true"></i></button>
<button data-detail="Medical" data-description="Keeps care and medical coordination within the festival response."><svg><use href="#icon-medical"/></svg><span>Medical</span><i aria-hidden="true"></i></button>
<button data-detail="Security" data-description="Coordinates patron comfort and safety across the festival."><svg><use href="#icon-shield"/></svg><span>Security</span><i aria-hidden="true"></i></button>
<button data-detail="Police" data-description="Connects public safety coordination with the festival control room."><svg><use href="#icon-police"/></svg><span>Police</span><i aria-hidden="true"></i></button>
<button data-detail="Resolume + AI" data-description="Connects the visual control desk with the proposed adaptive environment."><svg><use href="#icon-visual"/></svg><span>Resolume + AI</span><i aria-hidden="true"></i></button>
</div>
</div>
</section>
</div>

<section class="festival-response" aria-labelledby="response-title">
<h2 class="section-label" id="response-title"><span>04</span> Festival response</h2>
<div class="response-rail">
<button data-response="music" data-detail="Music" data-description="Music, tempo and volume form part of the proposed festival response."><i class="response-port" aria-hidden="true"></i><svg><use href="#icon-music"/></svg><span>Music</span></button>
<button data-response="lighting" data-detail="Lighting" data-description="Lighting can support the atmosphere and comfort of the crowd."><i class="response-port" aria-hidden="true"></i><svg><use href="#icon-light"/></svg><span>Lighting</span></button>
<button data-response="visuals" data-detail="Visuals" data-description="Visuals connect environmental changes with clear messages for attendees."><i class="response-port" aria-hidden="true"></i><svg><use href="#icon-visual"/></svg><span>Visuals</span></button>
<button data-response="security" data-detail="Security" data-description="Security teams remain part of a coordinated, human-led festival response."><i class="response-port" aria-hidden="true"></i><svg><use href="#icon-shield"/></svg><span>Security</span></button>
<button data-response="bar" data-detail="Bar" data-description="Bar teams join the wider health and safety response through the control room."><i class="response-port" aria-hidden="true"></i><svg><use href="#icon-bar"/></svg><span>Bar</span></button>
</div>
<p id="system-detail" class="system-detail" role="status" aria-live="polite"></p>
</section>
</section>

<footer class="experience-footer">
<p class="concept-note">Concept visualisation · research signals require validation</p>
<div class="film-actions"><button id="watch-film" class="watch-film" data-film-start="0"><svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 3 14 9-14 9Z"/></svg> Watch the presentation</button><nav class="chapters" aria-label="Presentation chapters"><button data-film-start="60">The index <span>1:00–1:37</span></button><i aria-hidden="true"></i><button data-film-start="103">The ecosystem <span>1:43–2:30</span></button></nav><p id="film-status" role="status"></p></div>
<button id="motion-toggle" class="motion-toggle" aria-label="Pause animation" aria-pressed="false"><span class="motion-symbol" aria-hidden="true">Ⅱ</span><span class="motion-text">Pause animation</span></button>
</footer>
</main>

<section id="film-view" class="film-view" aria-label="Happiness presentation player" hidden>
<div id="film-mount" data-hls="<?= htmlspecialchars($filmConfig['hls'], ENT_QUOTES, 'UTF-8') ?>" data-duration="<?= (int)$filmConfig['duration'] ?>"></div>
<button id="film-back" class="film-back" aria-label="Back to main screen"><span aria-hidden="true">←</span> Back</button>
<output id="film-timecode" class="film-timecode" aria-label="Film playback time">0:00 / 5:55</output>
<button id="film-fullscreen" class="film-fullscreen" type="button" aria-label="Enter video fullscreen" aria-pressed="false" title="Enter video fullscreen" disabled><svg aria-hidden="true" focusable="false"><use href="#icon-expand"/></svg></button>
<p id="fullscreen-status" class="fullscreen-status" role="status"></p>
<p id="playback-status" class="playback-status" role="status"></p>
</section>

<section id="about-panel" class="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title" hidden>
<article class="about-copy" tabindex="-1">
<button id="about-close" class="about-close" aria-label="Close About">×</button>
<p class="about-eyebrow">UNIVERSAL MIND / HAPPINESS</p>
<h2 id="about-title">happiness</h2>
<p>Happiness is a universal happiness currency for festivals globally, powered via Apple Watch. Attendees at festivals are rewarded when they are safe, healthy and happy, together as one.</p>
<p>Happiness also powers a real time public health &amp; safety index for festivals, mitigating risk. People own their data and ethics are via The Ethics Centre and Center for Humane Technology, in conjunction with Apple Watch, together as one.</p>
<p>Our mission is lowering the mass cancelation of festivals globally, via lowering the cost of risk mitigation for festivals, including user pays police, security, medical and insurance, while ensuring events are safe and healthy, together as one.</p>
<button id="about-return" class="about-return">Back to experience</button>
</article>
</section>
<?php endif; ?>
</body>
</html>
