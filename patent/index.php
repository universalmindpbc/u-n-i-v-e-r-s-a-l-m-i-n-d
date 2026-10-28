<?php
require_once __DIR__.'/gate.php';
patent_session();
if(empty($_SESSION['patent_csrf']))$_SESSION['patent_csrf']=bin2hex(random_bytes(24));
$authenticated=patent_authenticated();
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="csrf-token" content="<?=htmlspecialchars($_SESSION['patent_csrf'],ENT_QUOTES)?>"><title>Patent | Universal Mind</title><link rel="icon" href="/vogue/iam/favicon.png?v=iam-favicon-4"><link rel="stylesheet" href="portal.css?v=9"><script src="portal.js?v=9" defer></script><script src="drawings.js?v=3" defer></script><?php if($authenticated):?>
<link rel="stylesheet" href="/vogue/iam/realtime-voice-assistant.css?v=realtime-voice-css-66ef986e1dc3">
<link rel="stylesheet" href="/informatics/universal-one.css?v=9">
<script defer src="/informatics/universal-one-character.js?v=1"></script>
<script defer src="/informatics/universal-one-audio.js?v=2"></script>
<script defer src="/informatics/universal-one-waveform.js?v=1"></script>
<script defer src="assistant.js?v=2"></script>
<script defer src="/informatics/universal-one-live.js?v=7"></script>
<script defer src="/informatics/universal-one.js?v=15"></script>
<?php endif;?></head>
<body><header class="masthead"><a href="/patent/" class="brand" aria-label="Universal Mind"><img class="brand-mark" src="/vogue/iam/a%20s%20s%20e%20t%20s/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20Logo%20512.png" alt="" width="64" height="64"><span class="brand-name">universal<span class="brand-mind">mind</span></span></a><span class="brand-context">PATENT LIBRARY</span><?php if($authenticated):?><button id="toggle-nav" class="text-button" aria-expanded="false" aria-controls="library-nav">Contents</button><button id="logout" data-logout class="text-button">Lock workspace</button><?php endif;?></header>
<?php if(!$authenticated):?>
<main class="login-wrap"><span class="eyebrow">PRIVATE WORKSPACE</span><h1>Patent</h1><p class="intro">A protected space to explore the filed provisional specification.</p><form id="login-form"><label for="access-password">I AM portal password</label><input id="access-password" type="password" autocomplete="current-password" required maxlength="1024"><button type="submit">Open workspace <span>↗</span></button><p id="login-status" role="status"></p></form><p class="small">Use any current I AM portal password. The specification remains protected.</p></main>
<?php else:?>
<div class="library-layout">
<aside id="library-nav" class="library-nav" aria-label="Patent chapters">
<form id="search-form" role="search"><label class="sr-only" for="query">Search the patent</label><input id="query" type="search" placeholder="Search the patent…" autocomplete="off"><button type="submit" aria-label="Search">↗</button></form>
<a class="nav-home" href="#overview">Overview</a><a class="nav-home" href="#drawings">Drawings &amp; descriptions</a>
<nav id="contents" aria-label="Contents"><p class="small">Loading chapters…</p></nav>
<div class="nav-footer"><span>Australian provisional</span><strong>2026908928</strong><a href="document.php" target="_blank" rel="noopener">Filed specification ↗</a><button data-logout class="text-button nav-lock">Lock workspace</button></div>
</aside>
<main id="main">
<section id="overview" class="view overview">
<div class="eyebrow">UNIVERSAL MIND · AUSTRALIAN PROVISIONAL</div><h1>The patent library.</h1>
<p class="overview-intro">System and Method for Non-Invasive Mobile Inference of Neurotransmitter-Associated Gene Expression</p>
<p class="overview-note">Read the invention chapter by chapter, explore the drawings, or ask Universal One to guide you through the specification.</p>
<div class="overview-actions"><a class="button" href="#chapter-277">Read the abstract ↗</a><a class="text-button" href="#universal-light">Universal Light →</a><a class="text-button" href="#drawings">Browse drawings →</a></div>
<section class="overview-guide"><div><div class="eyebrow">UNIVERSAL ONE</div><h2>A guide through the invention.</h2><p>Ask about a chapter, technical method, appendix or drawing. Answers link back to the filed specification.</p></div><button id="open-assistant">Ask Universal One ↗</button></section>
<section id="filing-receipt" class="filing-receipt" aria-labelledby="filing-heading"><span class="eyebrow">IP AUSTRALIA</span><h2 id="filing-heading">Filing confirmed.</h2><dl class="filing-details"><div><dt>Provisional application number</dt><dd>2026908928</dd></div><div><dt>Submission received</dt><dd>28 October 2026 · 12:34 PM</dd></div><div><dt>Transaction reference</dt><dd>APSZ-2616390071</dd></div><div><dt>Receipt / batch reference</dt><dd>AMCZ-2616390323</dd></div><div><dt>Filing fee paid</dt><dd>A$100.00</dd></div><div><dt>Applicant</dt><dd>Universal Mind TV, PBC</dd></div></dl><p class="small">IP Australia confirms receipt of the provisional application and its specification. This is a provisional application, not a granted patent. Application processing remains in progress.</p><details><summary>View official receipt excerpt</summary><a href="receipt.php" target="_blank" rel="noopener"><img src="receipt.php" alt="IP Australia official receipt showing provisional application 2026908928, transaction APSZ-2616390071 and A$100 payment on 28 October 2026" width="1416" height="564" loading="lazy"></a><p class="small">Excerpt of the official filing receipt. Card details are omitted.</p></details></section>

</section>
<section id="chapter-view" class="view" hidden>
<div class="chapter-top"><span id="chapter-group" class="eyebrow"></span><a id="chapter-pdf" class="small-link" target="_blank" rel="noopener">Filed PDF ↗</a></div>
<h1 id="chapter-title"></h1><div id="chapter-parts" class="chapter-parts"></div>
<details id="compact-toc"><summary>In this chapter</summary><nav aria-label="Chapter headings"></nav></details>
<div class="reading-layout"><article id="chapter-body" class="chapter-body"></article><nav id="on-this-page" aria-label="On this page"></nav></div>
<nav class="chapter-pagination" aria-label="Adjacent chapters"><a id="previous-chapter"></a><a id="next-chapter"></a></nav>
</section>
<section id="search-view" class="view" hidden><div class="eyebrow">SEARCH</div><h1>Find it in the patent.</h1><p id="result-status" role="status"></p><div id="results"></div></section>
<section id="drawings" class="drawing-gallery view" hidden aria-labelledby="drawings-heading"><span class="eyebrow">DRAWINGS &amp; DESCRIPTIONS</span><h2 id="drawings-heading">See the invention.</h2><p>Explore every drawing from the filed specification, with its original description or surrounding source text.</p><div class="drawing-controls"><label for="drawing-query">Find a drawing</label><input id="drawing-query" type="search" placeholder="Search a figure, subject or description…"><label for="drawing-group">Show</label><select id="drawing-group"><option value="all">All drawings</option><option value="main">Main figures</option><option value="supplementary">Supplementary drawings</option></select></div><p id="drawing-status" role="status">Drawings load when you open this chapter.</p><div id="drawing-cards"></div><button id="drawing-retry" hidden>Retry drawings</button></section><dialog id="drawing-zoom" aria-label="Enlarged drawing"><button id="drawing-zoom-close" class="text-button">Close ×</button><img alt=""><p></p></dialog>
<div id="load-error" role="alert" hidden><p>The patent chapters are temporarily unavailable.</p><button id="retry-load">Try again</button></div>
<footer>Australian provisional application 2026908928 · Filed 28 October 2026</footer>
</main></div>
<?php endif;?></body></html>
