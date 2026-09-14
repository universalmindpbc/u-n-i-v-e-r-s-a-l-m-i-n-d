<?php
declare(strict_types=1);
$studyView = ($_GET['study'] ?? '') === '1';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Cross-Origin-Opener-Policy: same-origin');
header('Cross-Origin-Embedder-Policy: require-corp');
header('Permissions-Policy: camera=(self), microphone=()');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <meta name="robots" content="noindex, nofollow">
    <meta name="description" content="Optional Universal Mind Heart Check for the I AM experience.">
    <title>Heart Check | I AM</title>
    <link rel="icon" type="image/png" sizes="32x32" href="/vogue/iam/favicon.png?v=iam-favicon-4">
    <link rel="stylesheet" href="styles.css?v=global-nav-single-shell-2-technology-submenu-133pct-normal-1">
    <link rel="stylesheet" href="research/shen-heart-rate.css?v=shen-heart-rate-css-444fb97bd4f9">
    <?php if ($studyView): ?><style>
    .study-heart-check .brand-lockup,.study-heart-check [data-heart-rate-skip]{display:none!important}
    .study-check-background img{width:100%;height:100%;object-fit:cover;opacity:.85;filter:saturate(.8)}
    .study-heart-check .scene-veil{background:linear-gradient(180deg,#080c1470,#060a12b0 48%,#050a10d9)}
    .study-heart-check .brand{top:20px;left:32px}.study-heart-check .brand-mark{width:62px;height:62px}
    </style><?php endif; ?>
  </head>
  <body class="shen-heart-rate-page<?= $studyView ? ' study-heart-check' : '' ?>">
    <main class="site-shell" aria-label="Universal Mind I AM heart-rate research">
      <section class="scene" aria-label="Heart-rate check">
        <?php if ($studyView): ?>
        <div class="background-video study-check-background" aria-hidden="true"><img crossorigin="anonymous" src="https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/fd142ca0e1672dd7a92729857db1facd/thumbnails/thumbnail.jpg?time=8s&amp;width=1920" alt=""></div>
        <?php else: ?>
        <div class="background-video" aria-hidden="true">
          <video
            data-stream-role="fashion"
            data-stream-file="a s s e t s/Homepage - Hero Background Video - Chanel 2020 Runway Show.mp4"
            data-stream-keep-alive
            data-stream-reveal="pending"
            autoplay
            muted
            playsinline
            loop
            preload="metadata"
          ></video>
        </div>
        <?php endif; ?>

        <div class="scene-veil" aria-hidden="true"></div>

        <section class="shen-heart-rate-stage" data-shen-stage data-state="loading" aria-label="Heart-rate check" hidden>
          <div class="shen-heart-rate-loader" data-heart-rate-loader aria-live="polite" aria-atomic="true">
            <span class="shen-heart-rate-loader__spinner" aria-hidden="true"></span>
            <p data-heart-rate-loading-label>Preparing your Heart Check</p>
          </div>
          <canvas id="mxcanvas" aria-label="Heart-rate measurement interface"></canvas>
          <canvas class="shen-heart-rate-shen-plane shen-heart-rate-shen-plane--upper" data-shen-visual-plane="upper" aria-hidden="true" hidden></canvas>
          <canvas class="shen-heart-rate-shen-plane shen-heart-rate-shen-plane--lower" data-shen-visual-plane="lower" aria-hidden="true" hidden></canvas>
          <div class="shen-heart-rate-deepar" data-heart-rate-deepar aria-label="Bright Glasses augmented-reality preview" aria-hidden="true" hidden>
            <div class="shen-heart-rate-deepar__preview" data-heart-rate-deepar-preview></div>
          </div>
          <video class="shen-heart-rate-deepar__source" data-heart-rate-deepar-source muted playsinline aria-hidden="true"></video>
          <div class="shen-heart-rate-live" data-heart-rate-live aria-live="polite" hidden>
            <img src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt="" decoding="async">
            <span data-heart-rate-live-value></span>
            <small>BPM</small>
          </div>
          <div class="shen-heart-rate-result" data-heart-rate-result role="status" aria-live="polite" hidden>
            <img src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt="" decoding="async">
            <p>Your heart rate</p>
            <strong><span data-heart-rate-result-value></span> <small>BPM</small></strong>
          </div>
        </section>

        <p class="shen-heart-rate-status" data-shen-status role="status" aria-live="polite" hidden></p>

        <header class="brand" aria-label="Universal Mind">
          <img class="brand-mark" src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt="" decoding="async" fetchpriority="high" data-atomic-logo data-logo-ready="false">
          <div class="brand-lockup">
            <span class="brand-name">universalmind</span>
            <span class="brand-suffix">
              <span class="brand-slash">/</span>
              <span class="brand-iam">i a m</span>
            </span>
          </div>
        </header>
      </section>
    </main>

    <section
      class="induction-permission shen-heart-rate-offer"
      data-heart-rate-offer
      role="dialog"
      aria-modal="true"
      aria-labelledby="heart-rate-offer-title"
      aria-describedby="heart-rate-offer-copy heart-rate-privacy"
    >
      <div class="induction-permission__panel" data-heart-rate-offer-panel tabindex="-1">
        <span class="induction-permission__mark" aria-hidden="true"><i></i></span>
        <h2 id="heart-rate-offer-title">What colour is your heart?</h2>
        <p id="heart-rate-offer-copy">Look into your camera for a brief moment. We will translate your live pulse into a personalized music television ecosystem.</p>
        <p id="heart-rate-privacy" class="shen-heart-rate-offer__privacy"><em>Your video stream is processed entirely on-device and is never recorded or stored.</em></p>
        <div class="induction-permission__actions">
          <button class="shen-heart-rate-offer__primary" type="button" data-heart-rate-accept>Scan my pulse</button>
          <button class="shen-heart-rate-offer__secondary" type="button" data-heart-rate-skip>Skip for now</button>
        </div>
      </div>
    </section>

    <script src="cloudflare-stream-catalogue.js?v=stream-catalogue-20ad6337934c"></script>
    <script src="cloudflare-stream-controller.js?v=stream-controller-91f344a44abb"></script>
    <script type="module" src="research/shen-heart-rate.js?v=shen-heart-rate-js-8dd9fc16dad6"></script>
  </body>
</html>
