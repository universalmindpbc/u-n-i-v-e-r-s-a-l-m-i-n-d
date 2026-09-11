<?php
declare(strict_types=1);
header('Cache-Control: no-store, max-age=0');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('Permissions-Policy: microphone=(), camera=(self)');
header('Cross-Origin-Opener-Policy: same-origin');
header('Cross-Origin-Embedder-Policy: require-corp');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <base href="/vogue/iam/">
  <title>Study | Universal Mind</title>
  <link rel="icon" href="favicon.png">
  <link rel="stylesheet" href="study/gate.css?v=study-1">
  <link rel="stylesheet" href="study/style.css?v=ba2fe1803a77">
</head>
<body class="study-page" data-study-state="loading">
  <canvas class="rain-canvas" aria-hidden="true" data-rain-canvas></canvas>
  <div class="study-backdrop" aria-hidden="true"><img crossorigin="anonymous" src="https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/fd142ca0e1672dd7a92729857db1facd/thumbnails/thumbnail.jpg?time=8s&amp;width=1920" alt=""></div>
  <div class="rain-vignette" aria-hidden="true"></div>
  <header class="study-header" hidden>
    <a href="study.php" class="study-wordmark" aria-label="Universal Mind study"><img src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt=""></a>
    <div class="study-header-actions"><span data-preview-badge hidden>Preview</span><a data-explore href="index.html" hidden>Universal Mind ↗</a><button type="button" data-action="stop" hidden>Stop</button><button type="button" data-action="logout">Sign out</button></div>
  </header>
  <main id="study-app" aria-busy="true"><p class="study-loading">Loading…</p></main>
  <p id="study-status" role="status" aria-live="polite"></p>
  <dialog id="study-privacy"><h2>Research data</h2><p>Your measurements and responses are stored under a participant code. Camera video is processed on your device and is not recorded by this study.</p><p>Researchers can review coded records. Shared findings are anonymised. Researchers remove identifying details before sending excerpts for AI analysis.</p><p>You can stop at any time. Contact the organiser to withdraw or request removal of your responses.</p><button class="study-button" data-action="closePrivacy">Close</button></dialog>
  <script src="study/gate-rain.js?v=study-1" defer></script>
  <script type="module" src="study/app.js?v=c2eeca14774e"></script>
</body>
</html>
