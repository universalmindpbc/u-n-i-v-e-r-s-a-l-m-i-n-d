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
  <link rel="stylesheet" href="study/style.css?v=918fedfb6c56">
</head>
<body class="study-page" data-study-state="loading">
  <canvas class="rain-canvas" aria-hidden="true" data-rain-canvas></canvas>
  <div class="rain-vignette" aria-hidden="true"></div>
  <header class="study-header" hidden>
    <a href="study.php" class="study-wordmark"><img src="a s s e t s/Universal Mind [ I o H ] Logo.PNG" alt="">universal mind <span>/ study</span></a>
    <div class="study-header-actions"><span data-preview-badge hidden>Staging walkthrough</span><button type="button" data-action="home">My sessions</button><button type="button" data-action="logout">Sign out</button></div>
  </header>
  <main id="study-app" aria-busy="true"><p class="study-loading">Opening your study…</p></main>
  <p id="study-status" role="status" aria-live="polite"></p>
  <script src="study/gate-rain.js?v=study-1" defer></script>
  <script type="module" src="study/app.js?v=eac84188390b"></script>
</body>
</html>
