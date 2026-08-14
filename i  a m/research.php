<?php
declare(strict_types=1);

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
    <link rel="stylesheet" href="research/shen-heart-rate.css?v=shen-heart-rate-css-bc71eff45110">
  </head>
  <body class="shen-heart-rate-page">
    <main class="site-shell" aria-label="Universal Mind I AM heart-rate research">
      <section class="scene" aria-label="Heart-rate check">
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

        <div class="scene-veil" aria-hidden="true"></div>

        <section class="shen-heart-rate-stage" data-shen-stage data-state="loading" aria-label="Heart-rate check" hidden>
          <div class="shen-heart-rate-loader" data-heart-rate-loader aria-live="polite">
            <img src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt="" decoding="async">
            <p data-heart-rate-loading-label>Loading</p>
            <div class="shen-heart-rate-loader__track" data-heart-rate-loading-track role="progressbar" aria-label="Loading Heart Check" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <span data-heart-rate-loading-progress></span>
            </div>
          </div>
          <canvas id="mxcanvas" aria-label="Heart-rate measurement interface"></canvas>
          <div class="shen-heart-rate-ar-glasses" data-heart-rate-ar-glasses data-tracking="guide" aria-hidden="true" hidden>
            <svg viewBox="0 0 360 150" focusable="false">
              <defs>
                <linearGradient id="heart-check-glasses-lens" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#d8ff99" stop-opacity="0.58"></stop>
                  <stop offset="0.48" stop-color="#72f3bb" stop-opacity="0.44"></stop>
                  <stop offset="1" stop-color="#f5b9a5" stop-opacity="0.38"></stop>
                </linearGradient>
                <linearGradient id="heart-check-glasses-frame" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stop-color="#f5d9aa"></stop>
                  <stop offset="0.5" stop-color="#fff4ce"></stop>
                  <stop offset="1" stop-color="#d5b77f"></stop>
                </linearGradient>
                <filter id="heart-check-glasses-glow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="2.5" result="blur"></feGaussianBlur>
                  <feMerge>
                    <feMergeNode in="blur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                  </feMerge>
                </filter>
              </defs>
              <path class="shen-heart-rate-ar-glasses__lens" d="M14 31 Q180 -10 346 31 L338 104 Q334 132 304 138 L225 132 Q202 128 188 104 L180 89 L172 104 Q158 128 135 132 L56 138 Q26 132 22 104 Z"></path>
              <path class="shen-heart-rate-ar-glasses__frame" d="M14 31 Q180 -10 346 31 L338 104 Q334 132 304 138 L225 132 Q202 128 188 104 L180 89 L172 104 Q158 128 135 132 L56 138 Q26 132 22 104 Z"></path>
              <g class="shen-heart-rate-ar-glasses__lights" filter="url(#heart-check-glasses-glow)">
                <circle cx="31" cy="45" r="3"></circle><circle cx="54" cy="34" r="3"></circle>
                <circle cx="80" cy="27" r="3"></circle><circle cx="108" cy="20" r="3"></circle>
                <circle cx="138" cy="15" r="3"></circle><circle cx="169" cy="12" r="3"></circle>
                <circle cx="200" cy="13" r="3"></circle><circle cx="231" cy="17" r="3"></circle>
                <circle cx="261" cy="22" r="3"></circle><circle cx="289" cy="29" r="3"></circle>
                <circle cx="315" cy="38" r="3"></circle><circle cx="335" cy="51" r="3"></circle>
                <circle cx="334" cy="82" r="3"></circle><circle cx="324" cy="112" r="3"></circle>
                <circle cx="293" cy="131" r="3"></circle><circle cx="239" cy="126" r="3"></circle>
                <circle cx="121" cy="127" r="3"></circle><circle cx="67" cy="132" r="3"></circle>
                <circle cx="36" cy="114" r="3"></circle><circle cx="25" cy="82" r="3"></circle>
              </g>
              <path class="shen-heart-rate-ar-glasses__shine" d="M41 49 Q131 15 233 24"></path>
            </svg>
          </div>
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
      aria-describedby="heart-rate-offer-copy heart-rate-privacy heart-rate-disclaimer"
    >
      <div class="induction-permission__panel" data-heart-rate-offer-panel tabindex="-1">
        <span class="induction-permission__mark" aria-hidden="true"><i></i></span>
        <h2 id="heart-rate-offer-title">What Colour Is Your Heart?</h2>
        <p id="heart-rate-offer-copy">This optional Heart Check uses a brief video selfie to measure your heart rate and help us recommend the best experience for you.</p>
        <p id="heart-rate-privacy">Your video is processed live on this device and is never recorded or stored. Your heart-rate reading is used momentarily for the recommendation, then discarded.</p>
        <p id="heart-rate-disclaimer" class="shen-heart-rate-disclaimer"><strong>General wellness and research information only.</strong> This Heart Check is not a medical or mental-health diagnosis and should not replace professional care.</p>
        <div class="induction-permission__actions">
          <button type="button" data-heart-rate-accept>Measure heart rate</button>
          <button type="button" data-heart-rate-skip>Not now</button>
        </div>
      </div>
    </section>

    <script src="cloudflare-stream-catalogue.js?v=stream-catalogue-20ad6337934c"></script>
    <script src="cloudflare-stream-controller.js?v=stream-controller-e6ed1b827651"></script>
    <script type="module" src="research/shen-heart-rate.js?v=shen-heart-rate-js-dba3b221c7ba"></script>
  </body>
</html>
