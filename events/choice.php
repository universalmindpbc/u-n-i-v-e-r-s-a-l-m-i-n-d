<?php
require_once __DIR__ . '/access.php';
events_require_access();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#080c0c">
<link rel="icon" href="/vogue/iam/favicon.png?v=iam-favicon-3">
<title>Events — Universal Mind</title>
<link rel="stylesheet" href="/events/assets/choice.css?v=4">
<script src="/events/assets/choice-nav.js?v=3"></script>
</head>
<body class="event-choice">
<canvas class="choice-rain" data-rain-canvas aria-hidden="true"></canvas><div class="choice-shade" aria-hidden="true"></div>
<header class="choice-header">
<a class="choice-home" href="/home/" data-event-route><span aria-hidden="true">←</span> Home</a>
<button class="choice-fullscreen" type="button" data-events-fullscreen aria-label="Enter fullscreen" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></svg></button>
</header>
<main class="choice-main">
<h1>Events</h1>
<nav class="event-options" aria-label="Choose an event experience">
<a class="event-option event-option--lab" href="/lab/?launch=1" data-event-route aria-label="Explore Universal Mind Lab">

<div class="event-copy">
<h2 class="lab-wordmark">universalmind[lab]</h2>
<p>Electronic music and fashion as mindfulness.</p>
<span class="event-action">Explore the festival pop-up</span>
</div>
</a>
<img class="choice-flower" src="/lab/assets/landing-flower.png" alt="Universal Mind" width="94" height="94">
<a class="event-option event-option--festival" href="/events/?experience=1&amp;event=athousandminds" data-event-route aria-label="Explore A Thousand Minds">

<div class="event-copy">
<h2 class="festival-wordmark">a thousand minds</h2>
<p>Change your emotions. Transform your world.</p>
<span class="event-action">Explore the festival</span>
</div>
</a>
</nav>
</main>
<script src="/lab/landing-rain.js?v=20261103orbit1" defer></script>
</body>
</html>
