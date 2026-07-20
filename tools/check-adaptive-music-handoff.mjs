import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IAM_DIR = path.join(ROOT, 'i  a m');
const controllerPath = path.join(IAM_DIR, 'adaptive-environment-television.js');
const globeControllerPath = path.join(IAM_DIR, 'globe.js');
const streamControllerPath = path.join(IAM_DIR, 'cloudflare-stream-controller.js');
const streamCataloguePath = path.join(IAM_DIR, 'cloudflare-stream-catalogue.js');
const shellControllerPath = path.join(IAM_DIR, 'script.js');
const djSetManifestPath = path.join(ROOT, 'cloudflare-stream-djset-upload-manifest.json');
const televisionCssPath = path.join(IAM_DIR, 'adaptive-environment-television.css');
const inductionPagePath = path.join(IAM_DIR, 'induction.html');
const quantumTreeControlPagePath = path.join(IAM_DIR, 'quantum-tree-control.html');
const quantumTreeControlScriptPath = path.join(IAM_DIR, 'quantum-tree-control.js');
const quantumTreeAudioPath = path.join(IAM_DIR, 'a s s e t s', 'q u a n t u m [ t r e e ].m4a');
const quantumTreeSettingsEndpointPath = path.join(IAM_DIR, 'api', 'quantum-tree-settings.php');
const quantumTreeSettingsDataPath = path.join(IAM_DIR, 'api', 'quantum-tree-settings.json');
const pagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'adaptive-environment-television.html'),
];
const globeScriptPagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'vogue-self-report.html'),
  path.join(IAM_DIR, 'globe.html'),
  path.join(IAM_DIR, 'community-globe.html'),
];

function requireCondition(condition, message) {
  if (!condition) throw new Error(`Adaptive music handoff preflight failed: ${message}`);
}

const controller = await fs.readFile(controllerPath, 'utf8');
const globeController = await fs.readFile(globeControllerPath, 'utf8');
const streamController = await fs.readFile(streamControllerPath, 'utf8');
const streamCatalogue = await fs.readFile(streamCataloguePath, 'utf8');
const shellController = await fs.readFile(shellControllerPath, 'utf8');
const djSetManifest = JSON.parse(await fs.readFile(djSetManifestPath, 'utf8'));
const televisionCss = await fs.readFile(televisionCssPath, 'utf8');
const inductionPage = await fs.readFile(inductionPagePath, 'utf8');
const quantumTreeControlPage = await fs.readFile(quantumTreeControlPagePath, 'utf8');
const quantumTreeControlScript = await fs.readFile(quantumTreeControlScriptPath, 'utf8');
const quantumTreeSettingsEndpoint = await fs.readFile(quantumTreeSettingsEndpointPath, 'utf8');
const quantumTreeSettingsData = JSON.parse(await fs.readFile(quantumTreeSettingsDataPath, 'utf8'));
const quantumTreeAudioStat = await fs.stat(quantumTreeAudioPath);
const pages = await Promise.all(pagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));
const globeScriptPages = await Promise.all(globeScriptPagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));

const expectedCacheToken = `music-tv-${createHash('sha256').update(controller).digest('hex').slice(0, 12)}`;
const expectedGlobeCacheToken = `globe-${createHash('sha256').update(globeController).digest('hex').slice(0, 12)}`;
const expectedCssCacheToken = `music-tv-css-${createHash('sha256').update(televisionCss).digest('hex').slice(0, 12)}`;
const expectedStreamCatalogueToken = `stream-catalogue-${createHash('sha256').update(streamCatalogue).digest('hex').slice(0, 12)}`;
const expectedStreamControllerToken = `stream-controller-${createHash('sha256').update(streamController).digest('hex').slice(0, 12)}`;
const expectedShellControllerToken = `adaptive-env-stream-${createHash('sha256').update(shellController).digest('hex').slice(0, 12)}`;
const explicitSelectionMarker = 'params.get("selected_track_id")';
const syncCallPosition = controller.lastIndexOf('syncSelectedTrackCopy();');
const introCallPosition = controller.lastIndexOf('runIntro();');
const roomOpenPosition = controller.indexOf('document.body.classList.add("television-room-open");');
const pointerCountdownPosition = controller.indexOf('startReactionWalletPointerUnlockCountdown();');
const settlingWalletRule = televisionCss.match(/body\.television-wallet-settling \.adaptive-television-reaction-wallet(?:\[data-wallet-view="closed"\])?,[\s\S]*?\{([\s\S]*?)\}/)?.[1] ?? '';
const nowPlayingCssStart = televisionCss.indexOf('/* Fixed primary wallet with a quiet, readable programme ticker. */');
const nowPlayingCss = televisionCss.slice(
  nowPlayingCssStart,
  televisionCss.indexOf('.adaptive-television-wallet-category {', nowPlayingCssStart)
);

requireCondition(controller.includes(explicitSelectionMarker), 'the home controller no longer reads selected_track_id from the URL');
requireCondition(controller.includes('id: "the-prodigy-everybody-in-the-place"'), 'the Prodigy track is missing from the television catalogue');
requireCondition(controller.includes('document.body.dataset.adaptiveTrackId = track.id;'), 'the resolved track is not exposed for staging verification');
requireCondition(controller.includes('function showRecommendationUnavailable()'), 'selector failures can silently present the default track again');
requireCondition(!controller.includes('useRecommendationFallback'), 'selector failures still use a default-track fallback');
requireCondition(globeController.includes('const persistedSelection = persistMusicTelevisionSelection(selection);'), 'the check-in pipeline does not validate persisted selector output');
requireCondition(globeController.includes('const isAdaptiveFrame = currentParams.get("adaptiveFrame") === "1";'), 'embedded repeat check-ins no longer detect their frame context');
requireCondition(globeController.includes('(isAdaptiveFrame || isMusicTelevisionFrame)'), 'embedded repeat check-ins no longer return to the top-level homepage');
requireCondition(!globeController.includes('if (window.location.hostname === "staging.universalmind.tv") return null;'), 'staging can still turn selector errors into a successful default-track result');
requireCondition(syncCallPosition >= 0 && introCallPosition > syncCallPosition, 'track copy must resolve before the animated intro starts');
requireCondition(controller.includes('const REACTION_WALLET_POINTER_LOCK_MS = 10000;'), 'the flower wallet no longer ignores mouse activation for a full ten seconds');
requireCondition(controller.includes('const REACTION_WALLET_POINTER_MOVE_PX = 2;'), 'the flower wallet no longer requires physical pointer travel');
requireCondition(controller.includes('armReactionWalletPointerLock(event);'), 'room expansion no longer records the pointer position while arming the lock');
requireCondition(roomOpenPosition >= 0 && pointerCountdownPosition > roomOpenPosition, 'the ten-second mouse lock must begin only after the room becomes visibly open');
requireCondition(controller.includes('document.body.classList.add("television-wallet-pointer-locked");'), 'room expansion no longer locks the stylesheet hover state');
requireCondition(controller.includes('document.body.classList.remove("television-wallet-pointer-locked");'), 'the stylesheet hover lock no longer releases after ten seconds');
requireCondition(controller.includes('openReactionWalletFromPointerMove(event);'), 'the flower wallet no longer checks the new pointer coordinates before opening');
requireCondition(controller.includes('const physicalDistance = Math.hypot('), 'the flower wallet no longer distinguishes real movement from Safari layout events');
requireCondition(controller.includes('reactionWallet?.addEventListener("focusin", () => {\n    setAudioWalletInteracting(true);\n  });'), 'passive focus can open the flower wallet again');
requireCondition(controller.includes('reactionWalletTrigger?.addEventListener("click", openReactionWalletFromTrigger, true);'), 'keyboard click activation no longer opens the flower immediately');
requireCondition(controller.includes('if (!document.body.classList.contains("television-room-open")) return;'), 'the room launch gesture can open the flower before the room is visibly open');
requireCondition(controller.includes('hasOpened = true;\n    setReactionWalletOpen(false);\n    armReactionWalletPointerLock(event);'), 'room expansion no longer resets the wallet to the single closed flower');
requireCondition(settlingWalletRule.includes('pointer-events: auto !important;'), 'the settling animation blocks deliberate flower clicks');
requireCondition(televisionCss.includes('body:not(.television-wallet-pointer-locked) .adaptive-television-reaction-wallet:hover'), 'the stylesheet hover state no longer respects the ten-second lock');
requireCondition(!/^\s*\.adaptive-television-reaction-wallet:(?:hover|focus-within)/m.test(televisionCss), 'an ungated stylesheet hover path can still open the flower early');
requireCondition(!/^\s*\.adaptive-television-reaction-wallet\[data-wallet-view="closed"\]:(?:hover|focus-within)/m.test(televisionCss), 'a later wallet hierarchy rule can still expand the closed flower during the ten-second lock');
requireCondition(televisionCss.includes('body.television-wallet-pointer-locked .adaptive-television-reaction-wallet[data-wallet-view="closed"] .adaptive-television-reaction-trigger'), 'the locked room entry no longer guarantees one visible flower');
requireCondition(!controller.includes('REACTION_WALLET_OPEN_DELAY_MS'), 'the flower wallet still has an automatic hover timer');
requireCondition(controller.includes('window.IAMNowPlaying = {'), 'the primary wallet has no Now Playing diagnostic state');
requireCondition(controller.includes('hourCycle: "h23"'), 'the Now Playing clock is no longer fixed to local 24-hour time');
requireCondition(controller.includes('openNowPlayingRecommendations'), 'the Now Playing rail no longer opens the active Music shelf');
requireCondition(controller.includes('nowPlayingInteractiveAt = Date.now() + 420;'), 'the opening flower can activate Now Playing during the same pointer gesture');
requireCondition(controller.includes('nowPlaying.setAttribute("aria-hidden", String(!active));'), 'the hidden Now Playing rail remains in the accessibility tree');
requireCondition(controller.includes('nowPlayingResizeObserver = new ResizeObserver(updateNowPlayingOverflow);'), 'the Now Playing rail measures overflow before the wallet settles');
requireCondition(controller.includes('reactionWalletTrigger?.addEventListener("pointerdown", beginReactionWalletOpenGesture, true);'), 'the taller primary wallet can activate a category during its opening pointer gesture');
requireCondition(controller.includes('nowPlayingInteractiveAt = Date.now() + 1400;'), 'the primary wallet opening gesture is not guarded for its full expansion transition');
requireCondition(controller.includes('requestedVideoBlend < 99.5'), 'the Now Playing rail no longer reports the visible Fashion layer');
requireCondition(controller.includes('function setNowPlayingTickerView(nextView)'), 'the music and Fashion labels no longer share a rotating ticker slot');
requireCondition(controller.includes('}, 7000);'), 'the quiet Now Playing ticker cadence has changed');
requireCondition(controller.includes('nowPlayingViewport.style.width = activeWidth > 0'), 'the clock and active title no longer centre as one complete text unit');
requireCondition(televisionCss.includes('.adaptive-television-now-playing.is-overflowing .adaptive-television-now-playing__item.is-active .adaptive-television-now-playing__content'), 'long Now Playing titles no longer receive overflow-only movement');
requireCondition(televisionCss.includes('@media (prefers-reduced-motion: reduce)'), 'the Now Playing movement no longer respects reduced-motion preferences');
requireCondition(nowPlayingCss.includes('width: min(520px, calc(100vw - 48px));'), 'the primary wallet no longer holds one ample fixed desktop width');
requireCondition(nowPlayingCss.includes('padding: 4px 24px 16px;'), 'the primary wallet has lost its generous side and lower buffer');
requireCondition(nowPlayingCss.includes('background: rgba(12, 12, 14, 0.1);'), 'the primary wallet casing has not retained its original translucent opacity');
requireCondition(nowPlayingCss.includes('backdrop-filter: none;'), 'the primary wallet casing has regained the rejected dark frosting');
requireCondition(nowPlayingCss.includes('text-align: center;'), 'the Now Playing line is no longer centred');
requireCondition((nowPlayingCss.match(/#54ae32/g) || []).length === 0, 'green has returned to the Now Playing ticker');
requireCondition(nowPlayingCss.includes('.adaptive-television-now-playing__time {') && nowPlayingCss.includes('color: #fff;'), 'the 24-hour clock is no longer white');
requireCondition(nowPlayingCss.includes('.adaptive-television-now-playing__status {') && nowPlayingCss.includes('color: #fff;'), 'Now Playing is no longer white');
requireCondition((nowPlayingCss.match(/font-weight: 400;/g) || []).length >= 2, 'the time and Now Playing label are no longer as light as the active title');
requireCondition(controller.includes('preloadTargetSeconds: 12'), 'fashion no longer preloads toward a twelve-second buffer');
requireCondition(controller.includes('minimumSeconds: 8'), 'fashion reveal no longer requires an eight-second buffer floor');
requireCondition(controller.includes('firstFallbackMs: 1250'), 'fashion reveal no longer falls to 480p after 1.25 seconds');
requireCondition(controller.includes('secondFallbackMs: 2000'), 'fashion reveal no longer falls progressively to 360p');
requireCondition(controller.includes('window.IAMStreamController?.noteFashionReveal(video);'), 'fashion crossfade telemetry is missing');
requireCondition(televisionCss.includes('transition: opacity 300ms cubic-bezier(0.22, 0.72, 0.18, 1);'), 'fashion crossfade is no longer 300 milliseconds');
requireCondition(controller.includes('const SOUND_RESEARCH_DEFAULT_MAX_VOLUME = 0.055;'), 'the approved 5.5 percent Quantum Tree default ceiling has changed');
requireCondition(controller.includes('const SOUND_RESEARCH_SETTINGS_ENDPOINT = "api/quantum-tree-settings.php";'), 'the Quantum Tree player no longer reads the platform-wide setting');
requireCondition(controller.includes('async function loadSoundResearchSettings()'), 'the Quantum Tree platform setting loader is missing');
requireCondition(!controller.includes('iamQuantumTreePeakVolume'), 'a browser-specific Quantum Tree peak override has returned');
requireCondition(controller.includes('const radioIsAudible = continuationAudio && !continuationAudio.paused'), 'the Quantum Tree layer no longer detects active radio playback');
requireCondition(controller.includes('media: videoIsAudible ? localVideo : (radioIsAudible ? continuationAudio : null),'), 'the Quantum Tree layer no longer selects the audible video or radio source');
requireCondition(controller.includes('measuredLevel * activeMedia.volume'), 'the Quantum Tree layer no longer follows the measured level of the active media source');
requireCondition(!controller.includes('return radioLevel * SOUND_RESEARCH_MAX_VOLUME;'), 'radio playback has returned to a fixed Quantum Tree gain');
requireCondition(controller.includes('window.IAMQuantumTree = {'), 'the live Quantum Tree diagnostic interface is missing');
requireCondition(controller.includes('soundResearchParams.get("quantumTreeMonitor") === "1"'), 'the stakeholder live monitor can no longer be opened');
requireCondition(controller.includes('const verifiedOutput = verifiedPlaying && diagnostics.currentVolume > 0.0001;'), 'the live monitor can report success at zero Quantum Tree gain');
requireCondition(controller.includes('data-quantum-monitor-toggle'), 'the live monitor has no Quantum Tree A/B control');
requireCondition(controller.includes('data-quantum-monitor-audition'), 'the live monitor has no silence-gate audition control');
requireCondition(controller.includes('soundResearchTestMode || soundResearchAuditionMode'), 'the administrator cannot audition the configured peak through the live monitor');
requireCondition(controller.includes('q u a n t u m [ t r e e ].m4a'), 'the live Quantum Tree layer is not wired to the AAC source');
requireCondition(controller.includes('soundResearchMediaInterrupted(activeMedia)'), 'the active EMDR session has no Quantum Tree media-interruption continuity');
requireCondition(controller.includes('return soundResearchMaxVolume;'), 'the Quantum Tree interruption continuity no longer respects the platform peak');
requireCondition(quantumTreeControlPage.includes('data-quantum-preview'), 'the owner dashboard has no isolated Quantum Tree player');
requireCondition(quantumTreeControlPage.includes('q u a n t u m [ t r e e ].m4a'), 'the owner dashboard isolated test is not wired to the same AAC source');
requireCondition(quantumTreeAudioStat.size > 900000 && quantumTreeAudioStat.size < 1200000, 'the Quantum Tree AAC asset does not match the expected 192 kbps build size');
requireCondition(quantumTreeControlPage.includes('id="quantum-peak-slider"'), 'the owner dashboard has no peak slider');
requireCondition(quantumTreeControlPage.includes('data-owner-login'), 'the administrator dashboard is not access-controlled');
requireCondition(quantumTreeControlScript.includes('action: "save"'), 'the administrator dashboard no longer publishes the platform peak');
requireCondition(quantumTreeControlScript.includes('credentials: "same-origin"'), 'the administrator dashboard no longer uses its protected server session');
requireCondition(quantumTreeControlScript.includes('const verified = fileReady && playing && advancing && audio.volume > 0;'), 'the owner dashboard no longer verifies decoded and advancing playback');
requireCondition(quantumTreeSettingsEndpoint.includes('QUANTUM_TREE_OWNER_KEY_HASH'), 'the platform settings endpoint has no owner authentication');
requireCondition(quantumTreeSettingsEndpoint.includes('hash_equals($_SESSION[\'quantum_tree_csrf\'], $csrf)'), 'the platform settings endpoint has no CSRF verification');
requireCondition(quantumTreeSettingsEndpoint.includes('file_put_contents($temporaryPath, $json, LOCK_EX)'), 'the platform setting is not written atomically');
requireCondition(quantumTreeSettingsData.peak_volume === 0.055, 'the deployed Quantum Tree platform setting is not 5.5 percent');

for (const { pagePath, source } of globeScriptPages) {
  const label = path.relative(ROOT, pagePath);
  const globeScriptMatch = source.match(/globe\.js\?v=([^"']+)/);
  requireCondition(globeScriptMatch, `${label} has no versioned check-in controller`);
  requireCondition(globeScriptMatch[1] === expectedGlobeCacheToken, `${label} check-in cache token ${globeScriptMatch[1]} does not match ${expectedGlobeCacheToken}`);
}

const homePage = pages.find(({ pagePath }) => pagePath.endsWith('index.html'))?.source || '';
requireCondition(homePage.includes('data-now-playing'), 'the primary wallet has no Now Playing rail');
requireCondition(homePage.includes('data-now-playing-time'), 'the primary wallet has no 24-hour Now Playing clock');
requireCondition(homePage.includes('data-now-playing-visual-title'), 'the primary wallet cannot name the visible Fashion runway');
requireCondition(homePage.includes('data-now-playing-audio'), 'the primary wallet has no dedicated music ticker item');
requireCondition(homePage.includes('adaptive-television-now-playing__separator--content'), 'the compact divider between Now Playing and the active title is missing');
requireCondition(homePage.includes('EMDR Research Feature - 10min Nervous System Reset. Investigating whether an optional visual layer modulates short term transcriptional pathways, relevant to mental health.'), 'the EMDR rollover is missing the ten-minute nervous-system-reset terminology');
requireCondition(inductionPage.includes('as electronic music and fashion, for young people, primarily aged 16-24.'), 'the Induction welcome copy has not adopted electronic music and fashion');
requireCondition(inductionPage.includes('while electronic music, fashion and culture become everyday pathways to better mental health.'), 'the Induction ambition copy has not adopted electronic music first');
requireCondition(inductionPage.includes('with a deliberate focus on electronic music and fashion culture, industries we have spent our careers helping build.'), 'the Induction prototype copy has not adopted electronic music and fashion culture');

for (const pagePath of [path.join(IAM_DIR, 'index.html'), path.join(IAM_DIR, 'vogue-self-report.html')]) {
  const source = await fs.readFile(pagePath, 'utf8');
  const label = path.relative(ROOT, pagePath);
  requireCondition(source.includes('content="/vogue/iam/api/adaptive-music-video-selection.php"'), `${label} does not use the working PHP selector route`);
  requireCondition(!source.includes('content="/vogue/iam/api/adaptive-music-video-selection.py"'), `${label} still points at the failing Python CGI selector route`);
}

const musicBufferManager = streamController.slice(
  streamController.indexOf('function manageFashionQualityFromMusic'),
  streamController.indexOf('function beginFreeze')
);
requireCondition(!streamController.includes('deprioritizeFashion'), 'the retired music-triggered fashion pause path has returned');
requireCondition(!musicBufferManager.includes('pauseFashion') && !musicBufferManager.includes('.pause('), 'low music buffer can still pause fashion');
requireCondition(!streamController.includes('outside_viewport') && !streamController.includes('document_hidden'), 'a visibility change can still automatically pause fashion');
requireCondition(streamController.includes('const FASHION_PRELOAD_TARGET_SECONDS = 12;'), 'stream controller preload target is no longer twelve seconds');
requireCondition(streamController.includes('const FASHION_REVEAL_MINIMUM_SECONDS = 8;'), 'stream controller reveal floor is no longer eight seconds');
requireCondition(streamController.includes('maxBufferLength: role === "fashion" ? 24 : 30'), 'fashion playback no longer carries its expanded twenty-four-second buffer window');
requireCondition(streamController.includes('function manageFashionBuffer(state, trigger = "fashion_buffer_sample")'), 'fashion playback no longer responds to its own buffer depth');
requireCondition(streamController.includes('manageFashionBuffer(state, "waiting")'), 'fashion waiting events no longer trigger immediate buffer recovery');
requireCondition(streamController.includes('bufferedAhead(video) + 0.15 >= state.preloadTargetSeconds'), 'fashion preload no longer stops on the fragment that reaches its target');
requireCondition(streamController.includes('state.bufferedSegments.size >= 2'), 'two completed fashion segments no longer unlock reveal');
requireCondition(streamController.includes('setFashionQualityCap(state, 480'), 'the progressive 480p fashion fallback is missing');
requireCondition(streamController.includes('setFashionQualityCap(state, 360'), 'the progressive 360p fashion fallback is missing');
requireCondition(streamController.includes('setFashionQualityCap(state, 720'), 'the 720p fashion recovery path is missing');
requireCondition(streamController.includes('buffer_depth: bufferedAhead(state.video)'), 'buffer-depth telemetry is missing');
requireCondition(streamController.includes('pause_source: pauseSource'), 'pause-source telemetry is missing');
requireCondition(streamController.includes('freeze_duration_ms:'), 'freeze-duration telemetry is missing');
requireCondition(streamController.includes('const HLS_ERROR_TELEMETRY_THROTTLE_MS = 15000;'), 'repeating HLS errors can flood Cloudflare telemetry');
requireCondition(streamController.includes('window.location.hostname !== "staging.universalmind.tv"'), 'the deliberate network throttle is not restricted to staging');
requireCondition(streamController.includes('hlsConfig.fLoader = createQaThrottledFragmentLoader'), 'the staging throttle no longer controls HLS fragment delivery');
requireCondition(streamController.includes('video.dataset.streamStartupMs'), 'music startup timing diagnostics are missing');
requireCondition(streamController.includes('video.dataset.streamWaitingCount'), 'music waiting diagnostics are missing');
requireCondition(streamController.includes('video.dataset.streamStalledCount'), 'music stalled diagnostics are missing');
requireCondition(streamController.includes('video.dataset.streamLastFreezeDurationMs'), 'music freeze-duration diagnostics are missing');
requireCondition(streamController.includes('function setMaxHeight(video, maximumHeight = null'), 'the stream controller has no runtime quality cap');
requireCondition(controller.includes('controller.setMaxHeight(localVideo, 360, "emdr_gif_active")'), 'GIF mode no longer caps the hidden music stream at 360p');
requireCondition(controller.includes('video.dataset.streamMaxHeight = "720";'), 'the fashion runway no longer retains its 720p ceiling');
requireCondition(shellController.includes(`cloudflare-stream-catalogue.js?v=${expectedStreamCatalogueToken}`), 'the shared script does not cache-bust the current Stream catalogue');
requireCondition(shellController.includes(`cloudflare-stream-controller.js?v=${expectedStreamControllerToken}`), 'the shared script does not cache-bust the current Stream controller');

const djSetFiles = Object.values(djSetManifest.files || {});
requireCondition(djSetFiles.length === 7, `expected seven DJ Stream records, found ${djSetFiles.length}`);
for (const djSet of djSetFiles) {
  requireCondition(djSet.readyToStream === true, `${djSet.fileName} is not marked readyToStream`);
  requireCondition(Boolean(djSet.uid), `${djSet.fileName} has no Cloudflare Stream UID`);
  requireCondition(
    streamCatalogue.includes(`${JSON.stringify(djSet.fileName)}: ${JSON.stringify(djSet.uid)}`),
    `${djSet.fileName} is not connected to its Cloudflare Stream UID`
  );
  requireCondition(controller.includes(djSet.fileName), `${djSet.fileName} is not selectable in the television catalogue`);
}

for (const { pagePath, source } of pages) {
  const label = path.relative(ROOT, pagePath);
  const scriptMatch = source.match(/adaptive-environment-television\.js\?v=([^"']+)/);
  const shellScriptMatch = source.match(/script\.js\?v=([^"']+)/);
  const cssMatch = source.match(/adaptive-environment-television\.css\?v=([^"']+)/);
  const sourceLine = source.match(/class="adaptive-environment__source[^"]*"[^>]*>([^<]*)<\/p>/)?.[1] ?? null;
  const titleLine = source.match(/class="adaptive-environment__station[^"]*"[^>]*>([^<]*)<\/p>/)?.[1] ?? null;

  requireCondition(scriptMatch, `${label} has no versioned television controller`);
  requireCondition(shellScriptMatch, `${label} has no versioned shared controller`);
  requireCondition(shellScriptMatch[1] === expectedShellControllerToken, `${label} shared-controller cache token ${shellScriptMatch[1]} does not match ${expectedShellControllerToken}`);
  requireCondition(scriptMatch[1] === expectedCacheToken, `${label} cache token ${scriptMatch[1]} does not match controller content ${expectedCacheToken}`);
  requireCondition(cssMatch, `${label} has no versioned television stylesheet`);
  requireCondition(cssMatch[1] === expectedCssCacheToken, `${label} stylesheet cache token ${cssMatch[1]} does not match stylesheet content ${expectedCssCacheToken}`);
  requireCondition(sourceLine === '' && titleLine === '', `${label} contains stale hard-coded track copy`);
  requireCondition(!source.includes('data-adaptive-typewriter-text="Charli XCX"'), `${label} can still display Charli XCX before selection resolves`);
  requireCondition(source.includes('name="iam-playback-telemetry-endpoint"'), `${label} does not publish playback telemetry to Cloudflare`);
}

const televisionPage = pages.find(({ pagePath }) => pagePath.endsWith('index.html'))?.source || '';
requireCondition((televisionPage.match(/data-emdr-style-index=/g) || []).length === 2, 'the EMDR wallet does not expose both GIF and stellar buttons');
requireCondition(televisionPage.includes('data-emdr-style-index="0"') && televisionPage.includes('data-emdr-style-index="1"'), 'the explicit GIF and stellar controls are not addressable independently');

console.log(`Adaptive music handoff preflight passed (${expectedCacheToken}).`);
