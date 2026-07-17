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
const quantumTreeControlPagePath = path.join(IAM_DIR, 'quantum-tree-control.html');
const quantumTreeControlScriptPath = path.join(IAM_DIR, 'quantum-tree-control.js');
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
const quantumTreeControlPage = await fs.readFile(quantumTreeControlPagePath, 'utf8');
const quantumTreeControlScript = await fs.readFile(quantumTreeControlScriptPath, 'utf8');
const quantumTreeSettingsEndpoint = await fs.readFile(quantumTreeSettingsEndpointPath, 'utf8');
const quantumTreeSettingsData = JSON.parse(await fs.readFile(quantumTreeSettingsDataPath, 'utf8'));
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
requireCondition(controller.includes('const activeMedia = videoIsAudible ? localVideo : (radioIsAudible ? continuationAudio : null);'), 'the Quantum Tree layer no longer selects the audible video or radio source');
requireCondition(controller.includes('measuredLevel * activeMedia.volume'), 'the Quantum Tree layer no longer follows the measured level of the active media source');
requireCondition(!controller.includes('return radioLevel * SOUND_RESEARCH_MAX_VOLUME;'), 'radio playback has returned to a fixed Quantum Tree gain');
requireCondition(controller.includes('window.IAMQuantumTree = {'), 'the live Quantum Tree diagnostic interface is missing');
requireCondition(controller.includes('soundResearchParams.get("quantumTreeMonitor") === "1"'), 'the stakeholder live monitor can no longer be opened');
requireCondition(controller.includes('const verifiedOutput = verifiedPlaying && diagnostics.currentVolume > 0.0001;'), 'the live monitor can report success at zero Quantum Tree gain');
requireCondition(controller.includes('data-quantum-monitor-toggle'), 'the live monitor has no Quantum Tree A/B control');
requireCondition(controller.includes('data-quantum-monitor-audition'), 'the live monitor has no silence-gate audition control');
requireCondition(controller.includes('soundResearchTestMode || soundResearchAuditionMode'), 'the administrator cannot audition the configured peak through the live monitor');
requireCondition(quantumTreeControlPage.includes('data-quantum-preview'), 'the owner dashboard has no isolated Quantum Tree player');
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
requireCondition(streamController.includes('maxBufferLength: role === "fashion" ? 16 : 30'), 'fashion preload no longer has a bounded buffer window');
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

console.log(`Adaptive music handoff preflight passed (${expectedCacheToken}).`);
