import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IAM_DIR = path.join(ROOT, 'i  a m');
const controllerPath = path.join(IAM_DIR, 'adaptive-environment-television.js');
const globeControllerPath = path.join(IAM_DIR, 'globe.js');
const streamControllerPath = path.join(IAM_DIR, 'cloudflare-stream-controller.js');
const streamCataloguePath = path.join(IAM_DIR, 'cloudflare-stream-catalogue.js');
const shellControllerPath = path.join(IAM_DIR, 'script.js');
const globalNavigationControllerPath = path.join(IAM_DIR, 'global-navigation.js');
const globalNavigationCssPath = path.join(IAM_DIR, 'global-navigation.css');
const adaptiveEnvironmentPath = path.join(IAM_DIR, 'adaptive-environment.js');
const aboutControllerPath = path.join(IAM_DIR, 'about.js');
const frameContextPath = path.join(IAM_DIR, 'music-television-frame-context.js');
const sharedStylesPath = path.join(IAM_DIR, 'styles.css');
const privacyCssPath = path.join(IAM_DIR, 'privacy-first.css');
const scienceControllerPath = path.join(IAM_DIR, 'science.js');
const scienceCssPath = path.join(IAM_DIR, 'science.css');
const djSetManifestPath = path.join(ROOT, 'cloudflare-stream-djset-upload-manifest.json');
const televisionCssPath = path.join(IAM_DIR, 'adaptive-environment-television.css');
const programmeGuidePath = path.join(IAM_DIR, 'programme-guide.js');
const programmeGuideCssPath = path.join(IAM_DIR, 'programme-guide.css');
const realtimeVoiceControllerPath = path.join(IAM_DIR, 'realtime-voice-assistant.js');
const realtimeVoiceCssPath = path.join(IAM_DIR, 'realtime-voice-assistant.css');
const realtimeVoiceEndpointPath = path.join(IAM_DIR, 'api', 'realtime-client-secret.php');
const realtimeVoicePortalGuidePath = path.join(IAM_DIR, 'universal-one-portal-guide-v1.txt');
const realtimeVoiceWellbeingGuidePath = path.join(IAM_DIR, 'universal-one-wellbeing-support-guide-v1.txt');
const mantraSamplerPath = path.join(IAM_DIR, 'mantra-sampler.js');
const mantraSamplerCssPath = path.join(IAM_DIR, 'mantra-sampler.css');
const mantraAudioFxPath = path.join(IAM_DIR, 'mantra-audio-fx.js');
const mantraSamplesPath = path.join(IAM_DIR, 'mantra-samples-v1.json');
const mantraLibraryPath = path.join(IAM_DIR, 'api', 'mantra-library.json');
const mantraLibraryEndpointPath = path.join(IAM_DIR, 'api', 'mantra-library.php');
const mantraVoiceEndpointPath = path.join(IAM_DIR, 'api', 'mantra-voice.php');
const mantraStudioPagePath = path.join(IAM_DIR, 'mantra-studio.html');
const mantraStudioScriptPath = path.join(IAM_DIR, 'mantra-studio.js');
const mantraVoiceDspPath = path.join(IAM_DIR, 'mantra-voice-dsp.js');
const mantraStudioCssPath = path.join(IAM_DIR, 'mantra-studio.css');
const originalLogoPath = path.join(IAM_DIR, 'a s s e t s', 'Universal Mind [ I o H ] Logo.PNG');
const atomicLogoPath = path.join(IAM_DIR, 'a s s e t s', 'Universal Mind [ I o H ] Logo 512.png');
const citizenNeedsWorkerPath = path.join(ROOT, 'cloudflare', 'iam-citizen-needs-worker.js');
const citizenNeedsWorkerConfigPath = path.join(ROOT, 'cloudflare', 'wrangler.toml');
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
const sharedNavigationPagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'adaptive-environment-television.html'),
  path.join(IAM_DIR, 'adaptive-music-video.html'),
  path.join(IAM_DIR, 'cafe-del-mar-home.html'),
  path.join(IAM_DIR, 'globe.html'),
  path.join(IAM_DIR, 'our-team.html'),
  path.join(IAM_DIR, 'science.html'),
  path.join(IAM_DIR, 'about.html'),
];
const adaptiveEnvironmentPagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'adaptive-environment-television.html'),
  path.join(IAM_DIR, 'adaptive-music-video.html'),
  path.join(IAM_DIR, 'cafe-del-mar-home.html'),
  path.join(IAM_DIR, 'globe.html'),
  path.join(IAM_DIR, 'our-team.html'),
  path.join(IAM_DIR, 'technology-citizen-needs.html'),
  path.join(IAM_DIR, 'vogue-self-report.html'),
];
const aboutLinkPagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'adaptive-environment-television.html'),
  path.join(IAM_DIR, 'adaptive-music-video.html'),
  path.join(IAM_DIR, 'cafe-del-mar-home.html'),
  path.join(IAM_DIR, 'our-team.html'),
  path.join(IAM_DIR, 'science.html'),
  path.join(IAM_DIR, 'technology-citizen-needs.html'),
  path.join(IAM_DIR, 'about.html'),
];
const singleShellNavigationPagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'adaptive-environment-television.html'),
  path.join(IAM_DIR, 'adaptive-music-video.html'),
  path.join(IAM_DIR, 'cafe-del-mar-home.html'),
  path.join(IAM_DIR, 'our-team.html'),
  path.join(IAM_DIR, 'science.html'),
  path.join(IAM_DIR, 'technology-citizen-needs.html'),
  path.join(IAM_DIR, 'about.html'),
];
const globalNavigationPagePaths = [
  path.join(IAM_DIR, 'index.html'),
  path.join(IAM_DIR, 'adaptive-environment-television.html'),
  path.join(IAM_DIR, 'adaptive-music-video.html'),
  path.join(IAM_DIR, 'cafe-del-mar-home.html'),
  path.join(IAM_DIR, 'about.html'),
  path.join(IAM_DIR, 'science.html'),
  path.join(IAM_DIR, 'our-team.html'),
  path.join(IAM_DIR, 'our-team-concept.html'),
  path.join(IAM_DIR, 'privacy-first.html'),
  path.join(IAM_DIR, 'technology-citizen-needs.html'),
  path.join(IAM_DIR, 'shop.html'),
  path.join(IAM_DIR, 'wallet.html'),
];

function requireCondition(condition, message) {
  if (!condition) throw new Error(`Adaptive music handoff preflight failed: ${message}`);
}

const controller = await fs.readFile(controllerPath, 'utf8');
const globeController = await fs.readFile(globeControllerPath, 'utf8');
const streamController = await fs.readFile(streamControllerPath, 'utf8');
const streamCatalogue = await fs.readFile(streamCataloguePath, 'utf8');
const shellController = await fs.readFile(shellControllerPath, 'utf8');
const globalNavigationController = await fs.readFile(globalNavigationControllerPath, 'utf8');
const globalNavigationCss = await fs.readFile(globalNavigationCssPath, 'utf8');
const adaptiveEnvironment = await fs.readFile(adaptiveEnvironmentPath, 'utf8');
const aboutController = await fs.readFile(aboutControllerPath, 'utf8');
const frameContext = await fs.readFile(frameContextPath, 'utf8');
const sharedStyles = await fs.readFile(sharedStylesPath, 'utf8');
const privacyCss = await fs.readFile(privacyCssPath, 'utf8');
const scienceController = await fs.readFile(scienceControllerPath, 'utf8');
const scienceCss = await fs.readFile(scienceCssPath, 'utf8');
const djSetManifest = JSON.parse(await fs.readFile(djSetManifestPath, 'utf8'));
const televisionCss = await fs.readFile(televisionCssPath, 'utf8');
const programmeGuide = await fs.readFile(programmeGuidePath, 'utf8');
const programmeGuideCss = await fs.readFile(programmeGuideCssPath, 'utf8');
const realtimeVoiceController = await fs.readFile(realtimeVoiceControllerPath, 'utf8');
const realtimeVoiceCss = await fs.readFile(realtimeVoiceCssPath, 'utf8');
const realtimeVoiceEndpoint = await fs.readFile(realtimeVoiceEndpointPath, 'utf8');
const realtimeVoicePortalGuide = await fs.readFile(realtimeVoicePortalGuidePath, 'utf8');
const realtimeVoiceWellbeingGuide = await fs.readFile(realtimeVoiceWellbeingGuidePath, 'utf8');
const mantraSampler = await fs.readFile(mantraSamplerPath, 'utf8');
const mantraSamplerCss = await fs.readFile(mantraSamplerCssPath, 'utf8');
const mantraAudioFx = await fs.readFile(mantraAudioFxPath, 'utf8');
const mantraSamples = JSON.parse(await fs.readFile(mantraSamplesPath, 'utf8'));
const mantraLibrary = JSON.parse(await fs.readFile(mantraLibraryPath, 'utf8'));
const mantraLibraryEndpoint = await fs.readFile(mantraLibraryEndpointPath, 'utf8');
const mantraVoiceEndpoint = await fs.readFile(mantraVoiceEndpointPath, 'utf8');
const mantraStudioPage = await fs.readFile(mantraStudioPagePath, 'utf8');
const mantraStudioScript = await fs.readFile(mantraStudioScriptPath, 'utf8');
const mantraVoiceDsp = await fs.readFile(mantraVoiceDspPath, 'utf8');
const mantraStudioCss = await fs.readFile(mantraStudioCssPath, 'utf8');
const originalLogoStat = await fs.stat(originalLogoPath);
const atomicLogoStat = await fs.stat(atomicLogoPath);
const atomicLogo = await fs.readFile(atomicLogoPath);
const citizenNeedsWorker = await fs.readFile(citizenNeedsWorkerPath, 'utf8');
const citizenNeedsWorkerConfig = await fs.readFile(citizenNeedsWorkerConfigPath, 'utf8');
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
const sharedNavigationPages = await Promise.all(sharedNavigationPagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));
const adaptiveEnvironmentPages = await Promise.all(adaptiveEnvironmentPagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));
const aboutLinkPages = await Promise.all(aboutLinkPagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));
const singleShellNavigationPages = await Promise.all(singleShellNavigationPagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));
const globalNavigationPages = await Promise.all(globalNavigationPagePaths.map(async (pagePath) => ({
  pagePath,
  source: await fs.readFile(pagePath, 'utf8'),
})));

const expectedCacheToken = `music-tv-${createHash('sha256').update(controller).digest('hex').slice(0, 12)}`;
const expectedGlobeCacheToken = `globe-${createHash('sha256').update(globeController).digest('hex').slice(0, 12)}`;
const expectedCssCacheToken = `music-tv-css-${createHash('sha256').update(televisionCss).digest('hex').slice(0, 12)}`;
const expectedRealtimeVoiceToken = `realtime-voice-${createHash('sha256').update(realtimeVoiceController).digest('hex').slice(0, 12)}`;
const expectedRealtimeVoiceCssToken = `realtime-voice-css-${createHash('sha256').update(realtimeVoiceCss).digest('hex').slice(0, 12)}`;
const expectedMantraSamplerToken = `mantra-sampler-${createHash('sha256').update(mantraSampler).digest('hex').slice(0, 12)}`;
const expectedMantraSamplerCssToken = `mantra-sampler-css-${createHash('sha256').update(mantraSamplerCss).digest('hex').slice(0, 12)}`;
const expectedMantraAudioFxToken = `mantra-audio-fx-${createHash('sha256').update(mantraAudioFx).digest('hex').slice(0, 12)}`;
const expectedMantraStudioToken = `mantra-studio-${createHash('sha256').update(mantraStudioScript).digest('hex').slice(0, 12)}`;
const expectedMantraVoiceDspToken = `mantra-voice-dsp-${createHash('sha256').update(mantraVoiceDsp).digest('hex').slice(0, 12)}`;
const expectedMantraStudioCssToken = `mantra-studio-css-${createHash('sha256').update(mantraStudioCss).digest('hex').slice(0, 12)}`;
const expectedStreamCatalogueToken = `stream-catalogue-${createHash('sha256').update(streamCatalogue).digest('hex').slice(0, 12)}`;
const expectedStreamControllerToken = `stream-controller-${createHash('sha256').update(streamController).digest('hex').slice(0, 12)}`;
const expectedShellControllerToken = `adaptive-env-stream-${createHash('sha256').update(shellController).digest('hex').slice(0, 12)}`;
const expectedAdaptiveEnvironmentToken = `adaptive-env-${createHash('sha256').update(adaptiveEnvironment).digest('hex').slice(0, 12)}`;
const expectedAboutControllerToken = `about-briefing-${createHash('sha256').update(aboutController).digest('hex').slice(0, 12)}`;
const expectedFrameContextToken = `music-tv-frame-${createHash('sha256').update(frameContext).digest('hex').slice(0, 12)}`;
const explicitSelectionMarker = 'params.get("selected_track_id")';
const syncCallPosition = controller.lastIndexOf('syncSelectedTrackCopy();');
const introCallPosition = controller.lastIndexOf('runIntro();');
const roomOpenPosition = controller.indexOf('document.body.classList.add("television-room-open");');
const pointerCountdownPosition = controller.indexOf('startReactionWalletPointerUnlockCountdown();');
const settlingWalletRule = televisionCss.match(/body\.television-wallet-settling \.adaptive-television-reaction-wallet(?:\[data-wallet-view="closed"\])?,[\s\S]*?\{([\s\S]*?)\}/)?.[1] ?? '';
const safariLiveTextRule = televisionCss.match(/\.adaptive-television-player video,\s*\.adaptive-television-sex-ed-episode\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const nowPlayingCssStart = televisionCss.indexOf('/* Fixed primary wallet with a quiet, readable programme ticker. */');
const nowPlayingCss = televisionCss.slice(
  nowPlayingCssStart,
  televisionCss.indexOf('.adaptive-television-wallet-category {', nowPlayingCssStart)
);
const indexPage = pages.find(({ pagePath }) => pagePath === path.join(IAM_DIR, 'index.html'))?.source || '';

requireCondition(controller.includes(explicitSelectionMarker), 'the home controller no longer reads selected_track_id from the URL');
requireCondition(indexPage.includes('programme-guide.css?v=programme-guide-app-2'), 'the live I AM app no longer loads the subdued Program design');
requireCondition(indexPage.includes('programme-guide.js?v=programme-guide-app-1'), 'the live I AM app no longer loads the Program controller');
requireCondition(indexPage.includes('class="adaptive-television-program-button"') && indexPage.includes('data-program-open') && indexPage.includes('>PROGRAM</button>'), 'the Music wallet no longer exposes the uppercase Program control');
requireCondition(indexPage.includes('data-wallet-category="video" data-wallet-tooltip="TV" aria-label="TV — open television options"') && indexPage.includes('src="a s s e t s/TV icon.png?v=tv-wallet-1"') && !indexPage.includes('data-wallet-tooltip="mix"'), 'the wallet no longer exposes the approved TV label and icon');
requireCondition(indexPage.includes('PROGRAM <em>/ PARTIES</em>') && indexPage.includes('data-program-more'), 'the Program popup has lost the approved Parties and 24-hour controls');
requireCondition((indexPage.match(/data-room="(?:inner-planes|champagne-bohemia|modul8-infinity|james-bondage)"/g) || []).length === 4, 'the Program popup no longer exposes the four canonical Parties rooms');
requireCondition((indexPage.match(/data-zone="(?:local|Australia\/Sydney|America\/Los_Angeles|Europe\/Madrid)"/g) || []).length === 4, 'the Program popup no longer exposes Local, Sydney, Los Angeles and Ibiza time');
requireCondition(programmeGuideCss.includes('bottom: calc(var(--program-wallet-bottom) + var(--program-wallet-height) + var(--program-wallet-gap));'), 'the Program casing is no longer anchored above the wallet');
requireCondition(programmeGuideCss.includes('max-height: calc(100dvh - var(--program-top-inset) - var(--program-wallet-bottom) - var(--program-wallet-height) - var(--program-wallet-gap));'), 'the Program casing can no longer grow upward within the browser');
requireCondition(programmeGuideCss.includes('.program-scroll {') && programmeGuideCss.includes('min-height: 0;') && programmeGuideCss.includes('overflow-y: auto;'), 'the Program schedule no longer scrolls inside its fixed casing');
requireCondition(programmeGuideCss.includes('justify-content: center;') && programmeGuideCss.includes('min-height: 30px;'), 'the More / View 24 Hours label is no longer vertically centred');
requireCondition(programmeGuideCss.includes('border: 1px solid rgba(255, 255, 255, 0.22);') && programmeGuideCss.includes('color: rgba(255, 255, 255, 0.62);') && programmeGuideCss.includes('text-transform: uppercase;'), 'the Program control no longer matches the neutral Music-button casing and typography');
requireCondition(programmeGuideCss.includes('.adaptive-television-program-button:hover,') && programmeGuideCss.includes('background: rgba(255, 255, 255, 0.08);') && !programmeGuideCss.includes('border: 1px solid rgba(173, 255, 118, 0.55);'), 'the Program control has lost its standard neutral rollover or regained green emphasis');
requireCondition(programmeGuide.includes('fetch("broadcast-schedule-v1.json?v=programme-guide-app-1"') && programmeGuide.includes('cache: "no-store"'), 'the Program popup no longer reads the live no-cache broadcast schedule');
requireCondition(programmeGuide.includes('fetch("adaptive-music-video-catalogue-v1.11.json?v=programme-guide-app-1"'), 'newly catalogued DJ sets can no longer populate Program automatically');
requireCondition(programmeGuide.includes('window.IAMBroadcastClock?.nowMs?.()'), 'Program is no longer aligned to the shared live clock');
requireCondition(programmeGuide.includes('horizonHours = horizonHours === 6 ? 24 : 6;'), 'Program no longer switches between six and 24 hours');
requireCondition(programmeGuide.includes('const joinRequest = window.IAMMusicChannels.joinBroadcast(channelId);') && programmeGuide.includes('closeProgram(null, { restoreFocus: false });'), 'Enter Live no longer joins the selected shared Parties broadcast and closes Program into playback');
requireCondition(programmeGuide.includes('programPanel.addEventListener("click", (event) => event.stopPropagation());'), 'using Program can once again collapse the Music wallet underneath it');
requireCondition(shellController.includes('function bindStandaloneAboutNavigation()'), 'the shared navigation no longer forces About into a complete top-level document');
requireCondition(shellController.includes('window.top.location.href = url.href;'), 'embedded global navigation can no longer escape to the complete About page');
requireCondition(shellController.includes('document.body.classList.contains("television-room-open")'), 'About can still bypass the persistent television page layer');
requireCondition(shellController.includes('currentParams.get("musicTelevisionFrame") === "1"'), 'About links inside the television page layer no longer preserve the continuous environment');
requireCondition(shellController.includes('window.__iamMusicTelevisionFrame === true'), 'About loses its television-frame identity after cleaning routing parameters');
requireCondition(shellController.includes('url.searchParams.set("musicTelevisionFrame", "1");'), 'About cannot remain inside the playing television frame during internal navigation');
requireCondition(adaptiveEnvironment.includes('const standalonePages = new Set(["about.html"]);'), 'About is no longer classified as a standalone destination');
requireCondition(!adaptiveEnvironment.match(/const framePages = new Set\([^;]*about\.html/), 'About can still be rendered inside the undersized adaptive frame');
requireCondition(adaptiveEnvironment.includes('!standalonePages.has(pageName)'), 'standalone destinations are no longer recognised by shared navigation');
requireCondition(adaptiveEnvironment.includes('const isCurrentPageLink = url.pathname === currentUrl.pathname && !url.search && !url.hash;') && adaptiveEnvironment.includes('if (isCurrentPageLink) {\n        event.preventDefault();\n        closeGlobalNav();\n        return;\n      }'), 'the active navigation destination can still create an undersized nested frame');
requireCondition(aboutController.includes('window.top.location.replace(routingUrl.href);'), 'a framed About page can no longer promote itself to the full browser window');
requireCondition(aboutController.includes('const musicTelevisionFrame = window.self !== window.top'), 'About no longer distinguishes the persistent television frame from broken generic frames');
requireCondition(aboutController.includes('window.__iamMusicTelevisionFrame = true;'), 'About no longer retains television continuity after cleaning its URL');
requireCondition(aboutController.includes('const invalidEmbeddedRoute = !musicTelevisionFrame'), 'About can still escape the active television player');
requireCondition(aboutController.includes('["adaptiveFrame", "musicTelevisionFrame", "aboutTopLevel"]'), 'About no longer removes its temporary routing parameters');
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
requireCondition(televisionCss.includes('body.television-page-view-open .global-nav-trigger,\nbody.television-page-view-open .brand {\n  z-index: 30;\n}'), 'the persistent television navigation is no longer available above framed site pages');
requireCondition(televisionCss.includes('body.television-page-view-open .brand-lockup {\n  display: flex;\n}'), 'framed pages no longer retain the canonical television navigation identity');
requireCondition(frameContext.includes('document.documentElement.dataset.musicTelevisionFrame = "embedded";'), 'framed pages no longer share one early television context marker');
requireCondition(frameContext.includes('document.documentElement.dataset.adaptiveFrame = "embedded";'), 'framed pages can render a competing local navigation before the television shell appears');
requireCondition(sharedStyles.includes('html[data-adaptive-frame="embedded"] .about-brand,'), 'About can render a competing navigation flower inside the television shell');
requireCondition(scienceCss.includes('html[data-adaptive-frame="embedded"] .science-brand,'), 'Science can render a competing navigation flower inside the television shell');
requireCondition(!scienceController.includes('bindEmbeddedHome'), 'Science still owns a page-specific Home handler instead of the persistent television shell');
requireCondition(controller.includes('if (link.dataset.navItem === "home") {') && controller.includes('returnToTelevisionRoom();'), 'Home no longer returns to the existing playing television room');
requireCondition(controller.includes('url.searchParams.set("navigationShell", "1");'), 'framed destinations can reuse stale page-local navigation markup');
requireCondition(!controller.includes('REACTION_WALLET_OPEN_DELAY_MS'), 'the flower wallet still has an automatic hover timer');
requireCondition(controller.includes('window.IAMNowPlaying = {'), 'the primary wallet has no Now Playing diagnostic state');
requireCondition(controller.includes('hourCycle: "h23"'), 'the Now Playing clock is no longer fixed to local 24-hour time');
requireCondition(controller.includes('openNowPlayingRecommendations'), 'the Now Playing rail no longer opens the active Music shelf');
requireCondition(controller.includes('nowPlayingInteractiveAt = Date.now() + 420;'), 'the opening flower can activate Now Playing during the same pointer gesture');
requireCondition(controller.includes('nowPlaying.setAttribute("aria-hidden", String(!active));'), 'the hidden Now Playing rail remains in the accessibility tree');
requireCondition(controller.includes('nowPlayingResizeObserver = new ResizeObserver(updateNowPlayingOverflow);'), 'the Now Playing rail measures overflow before the wallet settles');
requireCondition(controller.includes('reactionWalletTrigger?.addEventListener("pointerdown", beginReactionWalletOpenGesture, true);'), 'the taller primary wallet can activate a category during its opening pointer gesture');
requireCondition(controller.includes('reactionWallet?.addEventListener("pointerenter", (event) => {') && controller.includes('openReactionWallet();'), 'the wallet can still reveal an empty casing before its hierarchy is populated');
requireCondition(controller.includes('nowPlayingInteractiveAt = Date.now() + 1400;'), 'the primary wallet opening gesture is not guarded for its full expansion transition');
requireCondition(controller.includes('requestedVideoBlend < 99.5'), 'the Now Playing rail no longer reports the visible Fashion layer');
requireCondition(controller.includes('function setNowPlayingTickerView(nextView)'), 'the music and Fashion labels no longer share a rotating ticker slot');
requireCondition(controller.includes('}, 7000);'), 'the quiet Now Playing ticker cadence has changed');
requireCondition(controller.includes('nowPlayingViewport.style.width = activeWidth > 0'), 'the clock and active title no longer centre as one complete text unit');
requireCondition(televisionCss.includes('.adaptive-television-now-playing.is-overflowing .adaptive-television-now-playing__item.is-active .adaptive-television-now-playing__content'), 'long Now Playing titles no longer receive overflow-only movement');
requireCondition(televisionCss.includes('@media (prefers-reduced-motion: reduce)'), 'the Now Playing movement no longer respects reduced-motion preferences');
requireCondition(nowPlayingCss.includes('width: min(520px, calc(100vw - 48px));'), 'the primary wallet no longer holds one ample fixed desktop width');
requireCondition(nowPlayingCss.includes('min-height: 106px;'), 'the primary wallet no longer holds the approved compact Sex-ed height');
requireCondition(nowPlayingCss.includes('padding: 2px 24px 8px;'), 'the primary wallet no longer holds the approved compact side and lower buffer');
requireCondition(nowPlayingCss.includes('background: rgba(12, 12, 14, 0.1);'), 'the primary wallet casing has not retained its original translucent opacity');
requireCondition(nowPlayingCss.includes('backdrop-filter: none;'), 'the primary wallet casing has regained the rejected dark frosting');
requireCondition(nowPlayingCss.includes('text-align: center;'), 'the Now Playing line is no longer centred');
requireCondition((nowPlayingCss.match(/#54ae32/g) || []).length === 0, 'green has returned to the Now Playing ticker');
requireCondition(nowPlayingCss.includes('.adaptive-television-now-playing__time {') && nowPlayingCss.includes('color: #fff;'), 'the 24-hour clock is no longer white');
requireCondition(nowPlayingCss.includes('.adaptive-television-now-playing__status {') && nowPlayingCss.includes('color: #fff;'), 'Now Playing is no longer white');
requireCondition((nowPlayingCss.match(/font-weight: 400;/g) || []).length >= 2, 'the time and Now Playing label are no longer as light as the active title');
requireCondition(controller.includes('preloadTargetSeconds: 12'), 'fashion no longer preloads toward a twelve-second buffer');
requireCondition(controller.includes('const FASHION_REVEAL_BUFFER_SECONDS = 8;'), 'fashion reveal no longer requires an eight-second buffer floor');
requireCondition(controller.includes('const RADIO_FASHION_REVEAL_BUFFER_SECONDS = 4;') && controller.includes('revealMinimumSeconds: RADIO_FASHION_REVEAL_BUFFER_SECONDS'), 'Radio no longer receives its faster Fashion-first visual handoff');
requireCondition(controller.includes('const radioFashionPreloadPool = new Map();') && controller.includes('releaseUnusedRadioFashionRunways'), 'Radio Fashion no longer retains only the active or imminent visual');
requireCondition(controller.includes('let radioVisualVideo = null;') && controller.includes('function createRadioVisualVideo(runwayIndex)'), 'Radio no longer owns an independent visual layer beneath public Fashion');
requireCondition(controller.includes('async function joinRadioVisualBroadcastChannel(channelId, options = {})') && controller.includes('await joinRadioVisualBroadcastChannel(state.visualChannelId'), 'Radio can once again replace the public Fashion broadcast layer');
requireCondition(controller.includes('async function synchronizeRadioVisualBroadcastPlayback(forceSeek = false)') && controller.includes('synchronizeBroadcastMedia(radioVisualVideo, targetSeconds'), 'the Radio visual no longer uses the rate-locked controlled rejoin policy');
requireCondition(controller.includes('const radioVisualVisible = Boolean(radioActive && radioRunway && requestedVideoBlend >= 99.5);'), 'Now Playing can still report the paused opening music video at the Radio endpoint');
requireCondition(controller.includes('radioIsActiveProgramme ? "radio-visual" : "music"'), 'the crossfader right endpoint can still resolve to the opening music video during Radio');
requireCondition(!controller.includes('const preloadedEntry = radioFashionPreloadPool.get(nextRunway.assetKey);'), 'public Fashion can still steal a preloaded Radio visual element');
requireCondition(televisionCss.includes('.adaptive-television-radio-visual-video') && televisionCss.includes('body.television-radio-continuation .adaptive-television-fashion-video {\n  z-index: 3;'), 'Radio and public Fashion no longer retain independent stacked visual layers');
requireCondition(safariLiveTextRule.includes('-webkit-user-select: none;') && safariLiveTextRule.includes('user-select: none;') && safariLiveTextRule.includes('-webkit-user-drag: none;') && safariLiveTextRule.includes('-webkit-touch-callout: none;'), 'Safari Live Text can cover the full-screen broadcast media');
requireCondition(televisionCss.includes('padding-top: 5px;'), 'the recommended-channel label can be clipped by the shelf rollover');
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
requireCondition(controller.includes('"https://streams.radiomast.io/052d2e3c-389c-44cf-a91a-8f5e1854f4c6"'), 'the canonical NTS Poolside Radio Mast mount is missing');
requireCondition((controller.match(/stream_transport: "Buffered HLS scheduler"/g) || []).length === 4, 'the four NTS stations are not all using the buffered scheduler');
requireCondition(controller.includes('const RADIO_SEGMENT_BUFFER_TARGET_SECONDS = 48;') && controller.includes('const RADIO_SEGMENT_CROSSFADE_SECONDS = .035;'), 'the NTS scheduler has lost its local reservoir or gap-masking crossfade');
requireCondition(controller.includes('async function refreshBufferedNtsSegments') && controller.includes('context.decodeAudioData(encoded.slice(0))'), 'NTS segments are no longer fetched and decoded ahead of playback');
requireCondition(controller.includes('scheduleDecodedRadioSegment(player, decoded, segmentUrl);') && controller.includes('audio.dataset.radioTransport = "buffered-hls-scheduler";'), 'the buffered NTS scheduler is no longer attached to the radio audio element');
requireCondition(controller.includes('document.body.dataset.radioRecoveryReason = "segment_buffer_underrun";'), 'buffered NTS playback no longer records a genuine underrun');
requireCondition(controller.includes('bindDirectRadioPlaybackDiagnostics(audio, source);') && controller.includes('const RADIO_DIRECT_STALL_MS = 6000;'), 'generic direct-stream diagnostics have regressed');
requireCondition(controller.includes('const RADIO_READY_BUFFER_SECONDS = 24;') && controller.includes('const RADIO_LIVE_SYNC_SEGMENTS = 4;'), 'the generic HLS radio fallback has lost its safety reservoir');
requireCondition(controller.includes('liveSyncDurationCount: RADIO_LIVE_SYNC_SEGMENTS') && controller.includes('fragLoadingMaxRetry: 8'), 'the generic HLS radio fallback has lost live-window or retry protection');
requireCondition(controller.includes('await waitForRadioBuffer(continuationAudio);'), 'radio starts before transport-specific readiness completes');
requireCondition(controller.includes('continuationAudioSource !== source') && controller.includes('const previousAudio = continuationAudio;'), 'radio source changes can once again inherit stale playback state from the previous station');
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
requireCondition(realtimeVoiceController.includes('<strong>I am here.</strong>'), 'the voice planet has lost its approved I am here invitation');
requireCondition(realtimeVoiceController.includes('<span>Need help or want to chat?</span>'), 'the voice planet has lost its approved chat invitation');
requireCondition(realtimeVoiceController.includes('realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/realtime-client-secret'), 'staging no longer requests credentials from the undeployed Realtime Worker preview');
requireCondition(realtimeVoiceController.includes('iam-citizen-needs-inference.universalmind.workers.dev/realtime-client-secret'), 'the production Realtime endpoint is no longer reserved for the approved Worker release');
requireCondition(!realtimeVoiceController.includes('OPENAI_API_KEY'), 'the browser voice controller contains a server credential name');
requireCondition(realtimeVoiceController.includes('navigator.mediaDevices.getUserMedia'), 'voice activation no longer requests the microphone after an explicit click');
requireCondition(realtimeVoiceController.includes('Voice features are available') && realtimeVoiceController.includes('Chat with Universal One, your personal AI voice companion, or join a Circle audio room with other people. Allow microphone access now for an uninterrupted full-screen experience?') && realtimeVoiceController.includes('allow microphone') && realtimeVoiceController.includes('enter without voice'), 'the windowed microphone preflight no longer presents the approved plain-language entry choice');
requireCondition(realtimeVoiceController.includes('permissionStream.getTracks().forEach((track) => track.stop())'), 'the entry preflight no longer releases its temporary permission stream immediately');
requireCondition(controller.includes('shouldPreflightEntry?.()') && controller.includes('enterFromVoicePreflight()'), 'the television room no longer pauses before fullscreen for the optional microphone preflight');
requireCondition(realtimeVoiceController.includes('return to full screen &amp; begin') && realtimeVoiceController.includes('waitForFullscreenReturn()'), 'the Safari microphone journey can no longer intentionally restore full screen');
requireCondition(realtimeVoiceController.includes('handleVoiceFullscreenChange') && realtimeVoiceController.includes('webkitfullscreenchange'), 'the Safari fullscreen recovery no longer observes delayed permission-driven exits');
requireCondition(realtimeVoiceController.includes('startupInputGate = true') && realtimeVoiceController.includes('releaseStartupInputAfterGreeting()'), 'the greeting can once again feed back into the live microphone');
requireCondition(realtimeVoiceController.includes('setVoiceConversationActive?.(true)') && realtimeVoiceController.indexOf('setVoiceConversationActive?.(true)') < realtimeVoiceController.indexOf('microphoneStream = await navigator.mediaDevices.getUserMedia'), 'programme audio is no longer ducked before conversation microphone activation');
requireCondition(controller.includes('const radioIsActiveProgramme = document.body.classList.contains("television-radio-continuation")') && controller.includes('if (radioIsActiveProgramme) programmeMedia.push(continuationAudio)'), 'voice ducking can once again raise the hidden radio preloader alongside video');
requireCondition(controller.includes('document.body.dataset.radioPlaybackState = "primed-muted"') && controller.includes('continuationAudio.muted = true;'), 'the future radio handoff is no longer hard-muted while the selected video plays');
requireCondition(controller.includes('document.body.dataset.voiceDuckedMedia'), 'the live browser can no longer prove which programme source Universal One is ducking');
requireCondition(realtimeVoiceController.includes('track.contentHint = "speech"'), 'the microphone track is no longer identified as speech input');
requireCondition(realtimeVoiceController.includes('data-voice-waveform') && realtimeVoiceController.includes('createMediaStreamSource(stream)') && realtimeVoiceController.includes('getByteTimeDomainData'), 'the Universal One panel no longer renders a live local microphone waveform');
requireCondition(realtimeVoiceCss.includes('.iam-realtime-voice__waveform') && realtimeVoiceCss.includes('[data-input-active="true"]'), 'the microphone waveform has lost its circular live-input treatment');
requireCondition(realtimeVoiceController.includes('qaScenario === "portal"') && realtimeVoiceController.includes('how to find Radio'), 'staging can no longer verify Universal One portal guidance without a microphone');
requireCondition(realtimeVoiceController.includes('qaScenario === "wellbeing"') && realtimeVoiceController.includes('I consent to a short EFT tapping round') && realtimeVoiceController.includes('opening Even though setup statement'), 'staging can no longer verify Universal One wellbeing guidance without a microphone');
requireCondition(realtimeVoiceController.includes('qaScenario === "crisis"') && realtimeVoiceController.includes('might hurt myself tonight'), 'staging can no longer verify Universal One crisis routing without a microphone');
requireCondition(realtimeVoiceController.includes('conversation.item.input_audio_transcription.completed'), 'voice captions no longer receive completed visitor transcripts');
requireCondition(realtimeVoiceController.includes('response.output_audio_transcript.delta'), 'voice captions no longer receive live assistant transcripts');
requireCondition(realtimeVoiceController.includes('transcriptFromRealtimePayload(event.response)'), 'voice captions no longer recover the final completed-response transcript');
requireCondition(realtimeVoiceController.includes('staging.universalmind.tv') && realtimeVoiceController.includes('staging voice check · no microphone'), 'the microphone-free Realtime QA path is not restricted to staging');
requireCondition(realtimeVoiceCss.includes('right: max(clamp(20px, 2.5vw, 42px), env(safe-area-inset-right));'), 'the assistant is no longer anchored to the lower right safe area');
requireCondition(realtimeVoiceCss.includes('@media (prefers-reduced-motion: reduce)'), 'the assistant has no reduced-motion treatment');
requireCondition(realtimeVoiceEndpoint.includes("getenv('OPENAI_API_KEY')"), 'the Realtime endpoint no longer reads its standard API key server-side');
requireCondition(realtimeVoiceEndpoint.includes("'model' => 'gpt-realtime-2.1'"), 'the Realtime endpoint no longer uses gpt-realtime-2.1');
requireCondition(realtimeVoiceEndpoint.includes("'voice' => 'marin'"), 'the Realtime endpoint no longer uses Marin');
requireCondition(realtimeVoiceEndpoint.includes("'reasoning' => ['effort' => 'low']"), 'the Realtime endpoint no longer uses low reasoning effort');
requireCondition(realtimeVoiceEndpoint.includes("'type' => 'server_vad'") && realtimeVoiceEndpoint.includes("'threshold' => 0.72") && realtimeVoiceEndpoint.includes("'silence_duration_ms' => 800"), 'the Realtime endpoint no longer rejects quieter background noise before creating a turn');
requireCondition(realtimeVoiceEndpoint.includes("'noise_reduction' => ['type' => 'near_field']"), 'the Realtime endpoint no longer filters near-field microphone noise before VAD');
requireCondition(realtimeVoiceEndpoint.includes('universal-one-portal-guide-v1.txt'), 'the Realtime endpoint no longer loads the maintained portal guide');
requireCondition(realtimeVoiceEndpoint.includes('universal-one-wellbeing-support-guide-v1.txt') && realtimeVoiceEndpoint.includes('wellbeing_support_guide_version'), 'the Realtime endpoint no longer loads and versions the maintained wellbeing support guide');
requireCondition(realtimeVoiceEndpoint.includes('OpenAI-Safety-Identifier:'), 'the Realtime endpoint no longer sends a privacy-preserving safety identifier');
requireCondition(citizenNeedsWorker.includes('handleRealtimeClientSecret(request, env)'), 'the Cloudflare Worker no longer mints Realtime client secrets');
requireCondition(citizenNeedsWorker.includes('https://api.openai.com/v1/realtime/client_secrets'), 'the Cloudflare Worker no longer uses the official Realtime client-secret endpoint');
requireCondition(citizenNeedsWorker.includes('model: "gpt-realtime-2.1"') && citizenNeedsWorker.includes('voice: "marin"'), 'the Worker Realtime session no longer locks the approved model and voice');
requireCondition(citizenNeedsWorker.includes('reasoning: { effort: "low" }'), 'the Worker Realtime session no longer uses low reasoning effort');
requireCondition(citizenNeedsWorker.includes('type: "server_vad"') && citizenNeedsWorker.includes('threshold: 0.72') && citizenNeedsWorker.includes('silence_duration_ms: 800'), 'the Worker Realtime session no longer rejects quieter background noise before creating a turn');
requireCondition(citizenNeedsWorker.includes('noise_reduction: { type: "near_field" }'), 'the Worker Realtime session no longer filters microphone noise before VAD');
requireCondition(citizenNeedsWorker.includes('UNIVERSAL_ONE_PORTAL_GUIDE'), 'the Worker Realtime session no longer receives the maintained portal guide');
requireCondition(citizenNeedsWorker.includes('UNIVERSAL_ONE_WELLBEING_SUPPORT_GUIDE') && citizenNeedsWorker.includes('wellbeing_support_guide_version'), 'the Worker Realtime session no longer receives and versions the maintained wellbeing support guide');
requireCondition(citizenNeedsWorker.includes('env.REALTIME_RATE_LIMITER.limit'), 'the Worker no longer rate-limits Realtime client-secret requests');
requireCondition(citizenNeedsWorkerConfig.includes('preview_urls = true'), 'the staging-only Worker preview URL is not explicitly enabled');
requireCondition(citizenNeedsWorkerConfig.includes('required = [ "OPENAI_API_KEY" ]'), 'the Worker does not declare its required encrypted OpenAI key');
requireCondition(citizenNeedsWorkerConfig.includes('name = "REALTIME_RATE_LIMITER"'), 'the Worker has no native Realtime rate-limit binding');
requireCondition(citizenNeedsWorkerConfig.includes('type = "Text"') && citizenNeedsWorkerConfig.includes('globs = [ "**/*.txt" ]'), 'the Worker no longer bundles the Universal One portal guide');
requireCondition(realtimeVoicePortalGuide.includes('GLOBAL NAVIGATION') && realtimeVoicePortalGuide.includes('TELEVISION ROOM'), 'the Universal One portal guide no longer covers the site and player journeys');
requireCondition(realtimeVoicePortalGuide.includes('Privacy first opens the Privacy First page') && realtimeVoicePortalGuide.includes('Go to market remains a visible roadmap label and is currently disabled'), 'Universal One can misdescribe Privacy First as inactive or Go to market as live');
requireCondition(globalNavigationController.includes('const VERSION = "global-navigation-canonical-1"'), 'the canonical global navigation version is missing');
requireCondition(globalNavigationController.includes('href="privacy-first.html" data-nav-item="privacy-first"'), 'the canonical global navigation does not expose Privacy First');
requireCondition(globalNavigationController.includes('href="shop.html" data-nav-item="shop"'), 'the canonical global navigation does not expose Shop');
requireCondition(globalNavigationController.includes('data-nav-item="go-to-market" aria-disabled="true"'), 'the canonical global navigation no longer keeps Go to market disabled');
requireCondition(globalNavigationCss.includes('font-size: clamp(28px, 2.25vw, 46px);') && globalNavigationCss.includes('font-weight: 700;') && globalNavigationCss.includes('letter-spacing: 0.46em;'), 'the canonical global navigation type scale has drifted');
requireCondition(privacyCss.includes('animation: privacy-clockwise-turn 3s linear infinite;'), 'the Privacy First flower no longer matches the canonical three-second rotation');
for (const { pagePath, source } of globalNavigationPages) {
  const label = path.relative(ROOT, pagePath);
  requireCondition((source.match(/data-global-nav-host/g) || []).length === 1, `${label} does not contain exactly one canonical global-navigation host`);
  requireCondition((source.match(/global-navigation\.js\?v=global-navigation-canonical-1/g) || []).length === 1, `${label} does not load exactly one canonical global-navigation component`);
  requireCondition(!source.includes('data-nav-item='), `${label} still contains a copied global-navigation menu`);
  requireCondition(!source.includes('data-global-nav aria-hidden='), `${label} still contains copied global-navigation markup`);
}
requireCondition(realtimeVoicePortalGuide.includes('Bloom, TV, Circle, Care and Collect') && realtimeVoicePortalGuide.includes('TV opens Music, Fashion and the optional EMDR Research Feature') && realtimeVoicePortalGuide.includes('10-minute Nervous System Reset research feature'), 'Universal One no longer knows the television wallet and research feature');
requireCondition(realtimeVoicePortalGuide.includes('Partner lists are invitations or proposed ideal partners'), 'Universal One can misstate proposed partnerships as confirmed');
requireCondition(realtimeVoiceWellbeingGuide.includes('Even though I\'m feeling [the visitor\'s own words], I choose to be kind to myself right now.'), 'Universal One no longer has the approved default Even though EFT setup statement');
requireCondition(realtimeVoiceWellbeingGuide.includes('https://headspace.org.au/services/') && realtimeVoiceWellbeingGuide.includes('1800 650 890') && realtimeVoiceWellbeingGuide.includes('young people aged 12 to 25'), 'Universal One no longer has the source-grounded headspace service and contact guide');
requireCondition(realtimeVoiceWellbeingGuide.includes('call 13 11 14') && realtimeVoiceWellbeingGuide.includes('text 0477 13 11 14') && realtimeVoiceWellbeingGuide.includes('https://www.lifeline.org.au/crisis-chat/'), 'Universal One no longer has the approved Australian Lifeline pathway');
requireCondition(realtimeVoiceWellbeingGuide.includes('Triple Zero on 000') && realtimeVoiceWellbeingGuide.includes('Universal One cannot call emergency services'), 'Universal One no longer has a clear immediate-danger boundary');
requireCondition(realtimeVoiceWellbeingGuide.includes('This is curated source-grounded knowledge, not live browsing.'), 'Universal One can no longer distinguish curated headspace knowledge from live website access');
requireCondition(controller.includes('voiceAssistantBaseVolumes.get(media) * .15, 800'), 'the television programme no longer ducks smoothly to fifteen percent for voice');
requireCondition(controller.includes('animateVoiceAssistantProgramVolume(media, baseline, 1000)') && controller.includes('const duckFactor = voiceAssistantDuckActive ? .15 : 1;'), 'the television programme no longer restores smoothly after voice');

for (const { pagePath, source } of globeScriptPages) {
  const label = path.relative(ROOT, pagePath);
  const globeScriptMatch = source.match(/globe\.js\?v=([^"']+)/);
  requireCondition(globeScriptMatch, `${label} has no versioned check-in controller`);
  requireCondition(globeScriptMatch[1] === expectedGlobeCacheToken, `${label} check-in cache token ${globeScriptMatch[1]} does not match ${expectedGlobeCacheToken}`);
}

for (const { pagePath, source } of sharedNavigationPages) {
  const label = path.relative(ROOT, pagePath);
  const sharedNavigationMatch = source.match(/script\.js\?v=([^"']+)/);
  requireCondition(sharedNavigationMatch, `${label} has no versioned shared navigation controller`);
  requireCondition(sharedNavigationMatch[1] === expectedShellControllerToken, `${label} shared-navigation cache token ${sharedNavigationMatch[1]} does not match ${expectedShellControllerToken}`);
}

for (const { pagePath, source } of singleShellNavigationPages) {
  const label = path.relative(ROOT, pagePath);
  const frameContextMatch = source.match(/music-television-frame-context\.js\?v=([^"']+)/);
  requireCondition(frameContextMatch, `${label} has no early television-frame context controller`);
  requireCondition(frameContextMatch[1] === expectedFrameContextToken, `${label} frame-context cache token ${frameContextMatch[1]} does not match ${expectedFrameContextToken}`);
}

for (const { pagePath, source } of adaptiveEnvironmentPages) {
  const label = path.relative(ROOT, pagePath);
  const adaptiveEnvironmentMatch = source.match(/adaptive-environment\.js\?v=([^"']+)/);
  requireCondition(adaptiveEnvironmentMatch, `${label} has no versioned adaptive navigation controller`);
  requireCondition(adaptiveEnvironmentMatch[1] === expectedAdaptiveEnvironmentToken, `${label} adaptive-navigation cache token ${adaptiveEnvironmentMatch[1]} does not match ${expectedAdaptiveEnvironmentToken}`);
}

for (const { pagePath, source } of aboutLinkPages) {
  const label = path.relative(ROOT, pagePath);
  requireCondition(source.includes('global-navigation.js?v=global-navigation-canonical-1'), `${label} does not load the canonical About navigation handoff`);
}
requireCondition(globalNavigationController.includes('href="about.html?aboutTopLevel=1" data-nav-item="about"'), 'the canonical navigation does not force a fresh complete About handoff');

const aboutPage = aboutLinkPages.find(({ pagePath }) => pagePath.endsWith('about.html'))?.source || '';
const aboutControllerMatch = aboutPage.match(/about\.js\?v=([^"']+)/);
requireCondition(aboutControllerMatch, 'About has no versioned page controller');
requireCondition(aboutControllerMatch[1] === expectedAboutControllerToken, `About controller cache token ${aboutControllerMatch[1]} does not match ${expectedAboutControllerToken}`);

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
requireCondition(musicBufferManager.includes('setAuxiliaryLoadingSuspended(state, true'), 'low primary buffer no longer suspends optional Fashion loading');
requireCondition(streamController.includes('state.video.dataset.streamPriority === "primary"'), 'visible primary Fashion can be suspended as optional media');
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
requireCondition(streamController.includes('hls.js@1.6.16') && streamController.includes('maxLiveSyncPlaybackRate: 1'), 'HLS.js is not on the rate-locked maintenance version');
requireCondition(streamController.includes('playback_rate:') && streamController.includes('hidden_loading_media_count') && streamController.includes('controller_seek_count'), 'broadcast correction and inactive-media telemetry is incomplete');
requireCondition(streamController.includes('if (video.hasAttribute("data-stream-deferred")) return;'), 'deferred hidden media can still auto-attach at page load');
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
requireCondition(
  streamCatalogue.includes('"Max Richter live at Cercle Odyssey, Paris, France.mp4": "2519e10718345a02e793736dde912307"'),
  "Max Richter is not connected to the verified Cloudflare Stream UID"
);
requireCondition(controller.includes('id: "max-richter-cercle-odyssey-paris"'), "Max Richter is not selectable in Inner Planes Parties");
requireCondition(
  streamCatalogue.includes('"Ólafur Arnalds live from Hafursey, in Iceland for Cercle.mp4": "ab3bad1d63041842c5a485b0e6f04381"'),
  "Ólafur Arnalds is not connected to the verified Cloudflare Stream UID"
);
requireCondition(controller.includes('id: "olafur-arnalds-hafursey-iceland-cercle"'), "Ólafur Arnalds is not selectable in Inner Planes Parties");
requireCondition(
  streamCatalogue.includes('"ISS - The Blue Pearl.mp4": "08d6983ef6584f2b8659ceaf0cfa248a"'),
  "Pearl is not connected to the verified Cloudflare Stream UID"
);
requireCondition(controller.includes('assetKey: "inner-planes-radio-blue-pearl"'), "Pearl is not available to the private Inner Planes Radio visual channel");
requireCondition(controller.includes('privateVisual: true'), "Pearl is not marked private from the public Fashion experience");
requireCondition(controller.includes('if (runway.privateVisual) return;'), "Private Radio visuals can leak into persisted public Fashion selection");

for (const { pagePath, source } of pages) {
  const label = path.relative(ROOT, pagePath);
  const scriptMatch = source.match(/adaptive-environment-television\.js\?v=([^"']+)/);
  const shellScriptMatch = source.match(/script\.js\?v=([^"']+)/);
  const cssMatch = source.match(/adaptive-environment-television\.css\?v=([^"']+)/);
  const realtimeVoiceMatch = source.match(/realtime-voice-assistant\.js\?v=([^"']+)/);
  const realtimeVoiceCssMatch = source.match(/realtime-voice-assistant\.css\?v=([^"']+)/);
  const sourceLine = source.match(/class="adaptive-environment__source[^"]*"[^>]*>([^<]*)<\/p>/)?.[1] ?? null;
  const titleLine = source.match(/class="adaptive-environment__station[^"]*"[^>]*>([^<]*)<\/p>/)?.[1] ?? null;

  requireCondition(scriptMatch, `${label} has no versioned television controller`);
  requireCondition(shellScriptMatch, `${label} has no versioned shared controller`);
  requireCondition(shellScriptMatch[1] === expectedShellControllerToken, `${label} shared-controller cache token ${shellScriptMatch[1]} does not match ${expectedShellControllerToken}`);
  requireCondition(scriptMatch[1] === expectedCacheToken, `${label} cache token ${scriptMatch[1]} does not match controller content ${expectedCacheToken}`);
  requireCondition(cssMatch, `${label} has no versioned television stylesheet`);
  requireCondition(cssMatch[1] === expectedCssCacheToken, `${label} stylesheet cache token ${cssMatch[1]} does not match stylesheet content ${expectedCssCacheToken}`);
  requireCondition(realtimeVoiceMatch, `${label} has no versioned Realtime voice controller`);
  requireCondition(realtimeVoiceMatch[1] === expectedRealtimeVoiceToken, `${label} Realtime voice cache token ${realtimeVoiceMatch[1]} does not match ${expectedRealtimeVoiceToken}`);
  requireCondition(realtimeVoiceCssMatch, `${label} has no versioned Realtime voice stylesheet`);
  requireCondition(realtimeVoiceCssMatch[1] === expectedRealtimeVoiceCssToken, `${label} Realtime voice stylesheet token ${realtimeVoiceCssMatch[1]} does not match ${expectedRealtimeVoiceCssToken}`);
  requireCondition(sourceLine === '' && titleLine === '', `${label} contains stale hard-coded track copy`);
  requireCondition(!source.includes('data-adaptive-typewriter-text="Charli XCX"'), `${label} can still display Charli XCX before selection resolves`);
  requireCondition(source.includes('name="iam-playback-telemetry-endpoint"'), `${label} does not publish playback telemetry to Cloudflare`);
  requireCondition(source.includes('<strong>explore</strong>') && source.includes('<span>learn about Universal Mind</span>'), `${label} has lost the approved global navigation hover label`);
  requireCondition(source.includes('Universal Mind [ I o H ] Logo 512.png') && source.includes('data-atomic-logo data-logo-ready="false"'), `${label} no longer uses the decoded 512px navigation flower`);
  requireCondition(source.includes('if (logo.decode) await logo.decode();') && source.includes('logo.dataset.logoReady = "true";'), `${label} can reveal a partially decoded navigation flower`);
}

requireCondition(atomicLogo.readUInt32BE(16) === 512 && atomicLogo.readUInt32BE(20) === 512, 'the optimized navigation flower is not exactly 512 by 512 pixels');
requireCondition(atomicLogoStat.size < originalLogoStat.size * 0.25, 'the optimized navigation flower is not materially lighter than the approved master PNG');
requireCondition(sharedStyles.includes('.brand-mark[data-logo-ready="false"]') && sharedStyles.includes('visibility: hidden;'), 'the navigation flower can paint before its full decode completes');
requireCondition(controller.includes('await flower.decode();') && controller.includes('let flowerCanvasStarting = false;'), 'the rotating navigation canvas can start from a partially decoded flower');
requireCondition(televisionCss.includes('@media (hover: hover) and (pointer: fine)') && televisionCss.includes('.global-nav-trigger:hover .global-nav-trigger__label'), 'the global navigation label is no longer restricted to intentional computer hover');

const televisionPage = pages.find(({ pagePath }) => pagePath.endsWith('index.html'))?.source || '';
const restoredEmdrPanelStart = televisionPage.indexOf('<div class="adaptive-television-emdr-controls" data-wallet-panel="emdr"');
const restoredEmdrPanelEnd = televisionPage.indexOf('<div class="adaptive-television-audio-controls"', restoredEmdrPanelStart);
const restoredEmdrPanel = restoredEmdrPanelStart >= 0 && restoredEmdrPanelEnd > restoredEmdrPanelStart
  ? televisionPage.slice(restoredEmdrPanelStart, restoredEmdrPanelEnd)
  : '';
requireCondition((televisionPage.match(/data-wallet-home/g) || []).length === 8, 'every secondary wallet branch must retain its wallet-home flower');
requireCondition((televisionPage.match(/data-wallet-tooltip="wallet home"/g) || []).length === 8, 'the wallet-home flowers no longer expose the approved rollover');
requireCondition((televisionPage.match(/aria-label="Return to wallet home"/g) || []).length === 8, 'the wallet-home flowers no longer expose the approved accessible label');
requireCondition(televisionPage.includes('data-wallet-resume-view="categories"'), 'the wallet no longer exposes its session resume state for verification');
requireCondition(!televisionPage.includes('adaptive-television-audio-back'), 'Circle still uses the superseded close symbol instead of wallet home');
requireCondition(televisionPage.includes('data-audio-wallet-leave'), 'Circle no longer exposes its dedicated leave control');
requireCondition(controller.includes('audioWalletLeave?.addEventListener("click", leaveAudioWalletCircle);'), 'the dedicated Circle leave control is not wired');
requireCondition(controller.includes('const WALLET_RESUMABLE_VIEWS = new Set(["categories", "emoji", "video", "video-mix", "music", "emdr", "audio", "support", "collect"]);'), 'the safe wallet hierarchy is no longer resumable');
requireCondition(controller.includes('let walletResumeView = "categories";') && controller.includes('function restoreReactionWalletView()'), 'the wallet no longer remembers and restores the last meaningful panel');
requireCondition(controller.includes('setWalletView("closed", { remember: false });'), 'closing the wallet can overwrite its remembered panel');
requireCondition(controller.includes('walletHomeButtons.forEach((button) => button.addEventListener("click", returnToWalletHome));'), 'the wallet-home flowers no longer share one state-preserving route home');
requireCondition(controller.includes('if (walletResumeView === "categories") setReactionWalletOpen(true);'), 'a resumed panel can open during pointer-down and inherit the flower click');
requireCondition(controller.includes('reactionWallet?.addEventListener("click", blockRestoredWalletClickThrough, true);'), 'a restored panel can inherit the completed flower click');
requireCondition(!controller.includes('WALLET_RESUME_TIMEOUT'), 'wallet resume has regained an arbitrary time expiry');
requireCondition(televisionCss.includes('.adaptive-television-wallet-home::after {\n  content: attr(data-wallet-tooltip) !important;'), 'the wallet-home rollover is no longer rendered from its metadata');
requireCondition((televisionPage.match(/data-emdr-style-index=/g) || []).length === 2, 'the restored EMDR wallet does not expose both GIF and stellar buttons');
requireCondition(televisionPage.includes('data-emdr-tooltip="Choose the editorial animated GIF experience."'), 'the approved GIF rollover has not been restored');
requireCondition(televisionPage.includes('data-emdr-tooltip="Choose the stellar geometric experience."'), 'the approved stellar rollover has not been restored');
requireCondition(televisionPage.includes('data-emdr-tooltip="Play one-shot mantra samples."'), 'the Mantra rollover has not been restored for one-shot playback');
requireCondition(televisionPage.includes('data-wallet-panel="emdr" data-emdr-controls') && !televisionPage.includes('data-wallet-panel="emdr-active"'), 'the approved single-panel EMDR hierarchy has not been restored');
requireCondition(!televisionPage.includes('adaptive-television-emdr-menu') && !televisionPage.includes('nothing starts until you choose'), 'the superseded neutral EMDR hierarchy is still present');
requireCondition(restoredEmdrPanel.includes('data-wallet-home') && restoredEmdrPanel.includes('aria-label="Return to wallet home"'), 'the restored EMDR wallet has lost its mandatory home flower');
requireCondition(restoredEmdrPanel.includes('data-emdr-off') && restoredEmdrPanel.includes('data-emdr-react') && restoredEmdrPanel.includes('data-emdr-automate') && restoredEmdrPanel.includes('data-emdr-mantra-open') && restoredEmdrPanel.includes('data-emdr-intensity') && restoredEmdrPanel.includes('data-emdr-sound-research'), 'the restored EMDR wallet no longer contains the complete approved control hierarchy');
requireCondition(televisionPage.includes('adaptive-television-research-tooltip-host--sound') && televisionPage.includes('adaptive-television-research-tooltip--sound'), 'the approved two-stage Sound research rollover has not been restored');
requireCondition(controller.includes('window.IAMEMDR?.setActive(false, { canvas: emdrCanvas, video: localVideo });') && controller.includes('emdrStyleIndex = -1;') && controller.includes('setSoundResearchEnabled(true);') && controller.includes('setWalletView("emdr");'), 'opening EMDR no longer follows the approved neutral entry path with Sound on');
requireCondition(controller.includes('localStorage.getItem("iamSoundResearchLayer") !== "off"'), 'the established Sound persistence behavior has not been restored');
requireCondition(televisionPage.includes('Isochronic tone: 7.38088 Hz, carried on a 111.011 Hz sine wave, plus a separate constant 528.088 Hz sine wave, together as one.'), 'the Sound research lightbox no longer describes the approved frequencies exactly');
requireCondition(!televisionPage.includes('constant 528.08 Hz sine wave'), 'the Sound research lightbox has regressed to the superseded 528.08 Hz value');
requireCondition(televisionPage.includes('To learn more about the scientific research behind these selected frequencies, <a href="science.html#research-sound"'), 'the Sound research lightbox no longer links to its Science evidence');
requireCondition(controller.includes('researchDialogFrequency.hidden = !frequency;') && controller.includes('researchDialogScience.hidden = !scienceHref;'), 'the shared research dialog no longer keeps frequency evidence exclusive to Sound');
requireCondition(controller.includes('researchDialogScienceLink?.addEventListener("click"') && controller.includes('openInVideoPageLayer(researchDialogScienceLink);'), 'the Sound research Science link no longer preserves the full-screen television page layer');
requireCondition(scienceController.includes('function openLayerFromHash()') && scienceController.includes('toggleLayer(layerId, true);'), 'the Science page no longer opens a directly linked research layer');
requireCondition(televisionCss.includes('border-top: 1px solid rgba(211, 216, 222, 0.3);') && televisionCss.includes('border-bottom: 1px solid rgba(211, 216, 222, 0.3);'), 'the Sound frequency evidence is no longer framed by the approved grey hairlines');

const mantraScriptMatch = televisionPage.match(/mantra-sampler\.js\?v=([^"']+)/);
const mantraCssMatch = televisionPage.match(/mantra-sampler\.css\?v=([^"']+)/);
const mantraAudioFxMatch = televisionPage.match(/mantra-audio-fx\.js\?v=([^"']+)/);
requireCondition(mantraScriptMatch, 'the television page no longer loads the mantra sampler');
requireCondition(mantraScriptMatch[1] === expectedMantraSamplerToken, `the mantra sampler cache token ${mantraScriptMatch[1]} does not match ${expectedMantraSamplerToken}`);
requireCondition(mantraCssMatch, 'the television page no longer loads the mantra sampler design');
requireCondition(mantraCssMatch[1] === expectedMantraSamplerCssToken, `the mantra sampler stylesheet token ${mantraCssMatch[1]} does not match ${expectedMantraSamplerCssToken}`);
requireCondition(mantraAudioFxMatch?.[1] === expectedMantraAudioFxToken, `the shared Mantra FX token does not match ${expectedMantraAudioFxToken}`);
requireCondition(televisionPage.includes('data-emdr-mantra-open'), 'the EMDR wallet no longer opens the mantra sampler');
requireCondition(televisionPage.includes('data-mantra-sampler') && televisionPage.includes('data-mantra-nodes'), 'the full-screen mantra orbit is missing');
requireCondition(!televisionPage.includes('data-wallet-panel="mantra"'), 'the mantra sampler has regressed into the wallet overlay');
requireCondition(televisionPage.includes('data-mantra-bank="tibet"') && televisionPage.includes('data-mantra-bank="ibiza"'), 'the Tibet and Ibiza banks are no longer selectable');
requireCondition(!televisionPage.includes('data-mantra-mode="loop"') && !televisionPage.includes('data-mantra-stop'), 'loop or stop-all controls have returned to the one-hit sampler');
requireCondition(mantraLibrary.banks.tibet.length === 6 && mantraLibrary.banks.ibiza.length === 6, 'each mantra collection must contain exactly six visible nodes');
requireCondition(mantraLibrary.banks.tibet.filter((item) => item.reserved).length === 3, 'the three undecided Tibet nodes are no longer reserved');
requireCondition(mantraLibrary.banks.ibiza.filter((item) => item.source_type === 'reference_sample').length === 3, 'Ibiza must retain exactly the three approved reference samples');
requireCondition(mantraLibrary.banks.ibiza.filter((item) => item.source_type === 'vocoder').length === 3, 'Ibiza must contain the three original vocoder samples');
requireCondition(
  mantraSampler.includes('const sources = sourceById.get(item.id) || new Set();')
    && mantraSampler.includes('sources.add(source);')
    && mantraSampler.includes('source.start(scheduledContextTime, trimStart, sampleDuration);'),
  'a mantra pad can no longer retrigger polyphonically before its earlier voices finish'
);
requireCondition(mantraSampler.includes('source.detune.linearRampToValueAtTime') && mantraSampler.includes('item.pitch_curve'), 'saved drawn pitch lines no longer shape sampler playback');
requireCondition(mantraSampler.includes('document.body.classList.remove("mantra-sampler-open")') && controller.includes('window.addEventListener("iam:mantra-close"') && controller.includes('setWalletView("emdr");'), 'closing the full-screen sampler no longer returns to the restored EMDR wallet');
requireCondition(controller.includes('emdrMantraOpen?.addEventListener("click"') && controller.includes('window.IAMMantraSampler?.open?.();') && !controller.includes('deactivateVisualEmdr();'), 'the Mantra extension no longer opens independently from the restored EMDR controls');
requireCondition(controller.includes('emdrStyleIndex = -1;') && controller.includes('setSoundResearchEnabled(true);') && controller.includes('applyEmdrAdaptation(requestedStyleIndex)'), 'EMDR entry no longer waits for a manual GIF or stellar selection with Sound on');
requireCondition(televisionCss.includes('width: min(960px, calc(100vw - 38px)) !important;'), 'the stellar EMDR wallet is no longer wide enough to contain its home and Sound controls');
requireCondition(televisionPage.includes('data-emdr-controls-view="neutral"'), 'the EMDR wallet no longer starts in its compact neutral state');
requireCondition(controller.includes('reactionWallet.dataset.emdrControlsView = emdrStyleIndex === 1') && controller.includes('? "stellar"') && controller.includes('emdrStyleIndex === 0 ? "gif" : "neutral"'), 'the EMDR wallet no longer discloses controls according to the selected experience');
requireCondition(televisionCss.includes('[data-emdr-controls-view="neutral"] .adaptive-television-emdr-off') && televisionCss.includes('[data-emdr-controls-view="neutral"] .adaptive-television-emdr-react') && televisionCss.includes('[data-emdr-controls-view="gif"] .adaptive-television-emdr-react'), 'neutral and GIF EMDR views no longer keep unrelated advanced controls hidden');
requireCondition(controller.includes('emdrStyleIndex = -1;\n    syncEmdrStyleButtons();\n    document.querySelector(\'[data-video-mode="emdr"]\')?.setAttribute("aria-pressed", "false");\n    setWalletView("emdr");'), 'the EMDR off button no longer returns to the compact EMDR picker');
requireCondition(mantraSampler.includes('television-mantra-sample-active') && !mantraSampler.includes('iam:mantra-playback-change'), 'mantra playback state must remain visible without requesting programme ducking');
requireCondition(!controller.includes('setMantraSamplerDucking') && !controller.includes('mantraSamplerDuckActive') && !controller.includes('mantraDuckedMedia'), 'Mantra playback can still lower the programme volume');
requireCondition(controller.includes('getProgrammeLevel()') && controller.includes('measuredLevel * media.volume'), 'the Mantra sampler no longer receives a read-only programme loudness measurement');
requireCondition(mantraSampler.includes('PROGRAMME_WINDOW_MS = 3000') && mantraSampler.includes('Math.floor(sorted.length * 0.75)') && mantraSampler.includes('PROGRAMME_MAX_ATTENUATION_DB = -3'), 'Mantra adaptation no longer uses a stable three-second loudness window capped at minus three decibels');
requireCondition(mantraSampler.includes('const programmeGain = adaptiveProgrammeGain();') && mantraSampler.includes('* programmeGain') && !mantraSampler.includes('.volume ='), 'algorithmic Mantra balance can change programme volume or is no longer latched per trigger');
requireCondition(controller.includes('Math.max(0, Math.min(1, (now - startedAt) / duration))'), 'voice-assistant volume animation can once again overrun the media volume range');
requireCondition(mantraSamplerCss.includes('.mantra-orbit__node') && mantraSamplerCss.includes('border-radius: 50%;'), 'the Audio Rooms-inspired circular sampler nodes are missing');
requireCondition(!mantraSamplerCss.includes('clip-path: polygon'), 'hexagonal sampler artwork has returned');
requireCondition(mantraSamplerCss.includes('color: #fff;') && mantraSamplerCss.includes('color: rgba(255, 255, 255, 0.72);'), 'active Mantra circle labels are no longer white');
requireCondition(mantraSamplerCss.includes('top: max(14px, env(safe-area-inset-top));') && mantraSamplerCss.includes('min-width: 80px;') && mantraSamplerCss.includes('height: 30px;'), 'the Tibet and Ibiza selector no longer clears the top Mantra circle');
requireCondition(!televisionPage.includes('one hit · retrigger anytime') && !televisionPage.includes('class="mantra-orbit__studio"') && !televisionPage.includes('data-mantra-status'), 'the Mantra centre contains copy beyond the flower and bank name');
requireCondition(mantraStudioPage.includes('data-editor-tab="pad"') && mantraStudioPage.includes('data-editor-tab="sample"') && mantraStudioPage.includes('data-editor-tab="pitch"') && mantraStudioPage.includes('data-editor-tab="amp"') && mantraStudioPage.includes('data-editor-tab="fx"'), 'the owner studio no longer exposes Pad, Sample, Pitch, Amp and FX editing');
requireCondition(mantraStudioScript.includes('pitchCanvas?.addEventListener("pointermove"') && mantraStudioScript.includes('pitchCurve = simplifyCurve(pitchCurve);'), 'the pitch editor is no longer directly drawable');
requireCondition(mantraStudioScript.includes('getByteTimeDomainData') && mantraStudioPage.includes('data-vu-meter'), 'the owner preview no longer has a live VU meter');
const mantraGainInput = mantraStudioPage.match(/<input type="range" min="0" max="([^"]+)" value="1" step="0\.001" data-sample-gain>/);
requireCondition(mantraGainInput && Math.abs(20 * Math.log10(Number(mantraGainInput[1])) - 24) < 0.01, 'the Mantra Studio Gain control no longer reaches +24 dB');
requireCondition(mantraStudioPage.includes('data-sample-normalise') && mantraStudioPage.includes('>normalise sample</button>'), 'the Pad editor no longer exposes the requested normalise button');
requireCondition(mantraStudioScript.includes('const NORMALISE_TARGET_DB = -12;') && mantraStudioScript.includes('function trimmedRms(buffer)') && mantraStudioScript.includes('NORMALISE_TARGET_RMS / average'), 'normalise no longer raises the current trim toward a strong average level');
requireCondition(mantraStudioScript.includes('function createPeakLimiter(ctx)') && mantraStudioScript.includes('limiter.threshold.value = -1;') && mantraStudioScript.includes('limiter.connect(analyser).connect(ctx.destination)'), 'the Studio preview no longer contains high-gain peaks');
requireCondition(
  mantraSampler.includes('Math.min(15.849, itemGain)')
    && mantraSampler.includes('function outputLimiter(ctx)')
    && mantraSampler.includes('masterLimiter.connect(ctx.destination)'),
  'saved +24 dB polyphonic Mantra gain no longer reaches protected master-limited playback'
);
requireCondition(mantraLibraryEndpoint.includes('const MANTRA_MAX_GAIN = 15.849;') && mantraLibraryEndpoint.includes('$gain > MANTRA_MAX_GAIN'), 'the owner API no longer accepts the Studio +24 dB gain range safely');
requireCondition(!mantraStudioScript.includes('currentBank !== "ibiza"') && mantraStudioScript.includes('await uploadAudio(file, "vocoder", renderedVocoderDuration, target);'), 'Voice Lab can no longer save a render to a selected Tibet pad');
requireCondition(mantraStudioScript.includes('bank: currentBank') && mantraStudioScript.includes('slot: currentSlot') && mantraStudioPage.includes('select any pad, choose a voice'), 'Voice Lab no longer preserves the selected bank and pad through rendering');
const mantraStudioScriptMatch = mantraStudioPage.match(/mantra-studio\.js\?v=([^"']+)/);
const mantraVoiceDspMatch = mantraStudioPage.match(/mantra-voice-dsp\.js\?v=([^"']+)/);
const mantraStudioCssMatch = mantraStudioPage.match(/mantra-studio\.css\?v=([^"']+)/);
const mantraStudioAudioFxMatch = mantraStudioPage.match(/mantra-audio-fx\.js\?v=([^"']+)/);
requireCondition(mantraStudioScriptMatch?.[1] === expectedMantraStudioToken, `the Mantra Studio cache token does not match ${expectedMantraStudioToken}`);
requireCondition(mantraVoiceDspMatch?.[1] === expectedMantraVoiceDspToken, `the Mantra Voice DSP cache token does not match ${expectedMantraVoiceDspToken}`);
requireCondition(mantraStudioCssMatch?.[1] === expectedMantraStudioCssToken, `the Mantra Studio stylesheet token does not match ${expectedMantraStudioCssToken}`);
requireCondition(mantraStudioAudioFxMatch?.[1] === expectedMantraAudioFxToken, `the Studio shared FX token does not match ${expectedMantraAudioFxToken}`);
requireCondition(mantraStudioPage.includes('data-fx-slot="a"') && mantraStudioPage.includes('data-fx-slot="b"') && mantraStudioPage.includes('data-fx-bypass'), 'Mantra FX no longer exposes A/B comparison and explicit bypass');
requireCondition(mantraStudioPage.includes('data-fx-reverb-mix') && mantraStudioPage.includes('data-fx-spectral-feedback') && mantraStudioPage.includes('original audio stays untouched'), 'Mantra FX no longer exposes the non-destructive reverb and spectral delay controls');
requireCondition(mantraStudioScript.includes('fx: fxState') && mantraStudioScript.includes('if (!raw && fxEngine?.connect)') && mantraStudioScript.includes('fxState = fxEngine?.normaliseState?.(selected.fx)'), 'Mantra FX settings are no longer saved and reproduced without processing Voice Lab previews');
requireCondition(mantraAudioFx.includes('ctx.createConvolver()') && mantraAudioFx.includes('ctx.createBiquadFilter()') && mantraAudioFx.includes('const bands = [') && mantraAudioFx.includes('feedback.gain.value'), 'the shared FX graph no longer contains a reverb and multi-band feedback delay');
requireCondition(mantraAudioFx.includes('reverb: { mix: 0') && mantraAudioFx.includes('spectral_delay: { mix: 0') && mantraAudioFx.includes('if (normalised.bypass)'), 'legacy pads no longer default dry or FX bypass is not implemented in the graph');
requireCondition(mantraSampler.includes('state: item.fx') && mantraSampler.includes('window.IAMMantraAudioFX.connect'), 'saved Mantra FX are no longer reproduced by the six-node sampler');
requireCondition(mantraLibraryEndpoint.includes("mantra_fx_state($request['fx']") && mantraLibraryEndpoint.includes("'feedback' => mantra_fx_number") && mantraLibraryEndpoint.includes('0, 0.65, 0.18'), 'the owner API no longer validates and persists the non-destructive FX state');
requireCondition(mantraStudioCss.includes('grid-template-columns: repeat(5, 1fr);') && mantraStudioCss.includes('.mantra-fx__groups') && mantraStudioCss.includes('.mantra-fx.is-bypassed'), 'the Studio FX editor no longer fits the established editing interface');
const voicePresetIds = Array.from(mantraStudioPage.matchAll(/data-vocoder-voice="([^"]+)"/g), (match) => match[1]);
requireCondition(voicePresetIds.length === 18 && new Set(voicePresetIds).size === 18, 'Voice Lab must expose 18 distinct human, robot and vocoder presets');
requireCondition(['Fred', 'Trinoids', 'Zarvox'].every((voice) => mantraStudioPage.includes(`>${voice}</button>`)), 'Voice Lab is missing one of the three supplied Speaking of Witch reference voices');
requireCondition(voicePresetIds.filter((id) => id.startsWith('human-')).length === 6 && voicePresetIds.filter((id) => id.startsWith('robot-')).length === 6 && voicePresetIds.filter((id) => id.startsWith('vocoder-')).length === 6, 'Voice Lab must retain six options in each voice family');
requireCondition(!mantraStudioScript.includes('synthesizeVocoder') && !mantraStudioScript.includes('phonemeMap') && mantraStudioScript.includes('fetch(voiceEndpoint'), 'the unusable browser phoneme oscillator has not been fully replaced');
requireCondition(mantraStudioScript.includes('processor.processVoice({') && mantraStudioScript.includes('speechBuffer') && mantraStudioScript.includes('effectAmount: request.effect_amount'), 'Robot and Vocoder presets no longer process the rendered speech through the carrier DSP');
requireCondition(mantraVoiceDsp.includes('function applyRobotDsp(') && mantraVoiceDsp.includes('function applyVocoderDsp(') && mantraVoiceDsp.includes('function bandpassCoefficients('), 'the actual robot ring modulation or filter-bank vocoder engine is missing');
requireCondition(voicePresetIds.every((id) => mantraVoiceEndpoint.includes(`'${id}' =>`)), 'the secure voice endpoint does not implement every visible Voice Lab preset');
requireCondition(mantraVoiceEndpoint.includes("($_SESSION['quantum_tree_owner'] ?? false) !== true") && mantraVoiceEndpoint.includes("hash_equals($_SESSION['quantum_tree_csrf'], $csrf)"), 'the voice endpoint no longer requires the owner session and CSRF token');
requireCondition(mantraVoiceEndpoint.includes('realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/mantra-voice') && mantraVoiceEndpoint.includes("($_SESSION['quantum_tree_owner'] ?? false) !== true"), 'Voice Lab no longer routes authenticated staging requests through the configured speech Worker');
requireCondition(citizenNeedsWorker.includes('handleMantraVoice(request, env)') && citizenNeedsWorker.includes('https://api.openai.com/v1/audio/speech'), 'the configured Worker no longer renders Mantra speech');
requireCondition(citizenNeedsWorker.includes('model: "gpt-4o-mini-tts"') && citizenNeedsWorker.includes('response_format: "wav"'), 'the Mantra Worker no longer requests the supported speech model and WAV output');
requireCondition(citizenNeedsWorker.includes('Speech intelligibility is the first priority') && citizenNeedsWorker.includes('Say only the exact supplied text.'), 'Voice Lab no longer protects intelligibility or exact script delivery');
requireCondition(voicePresetIds.every((id) => citizenNeedsWorker.includes(`"${id}"`)), 'the configured speech Worker does not implement every visible Voice Lab preset');
requireCondition(mantraLibraryEndpoint.includes('MANTRA_OWNER_KEY_HASH') && mantraLibraryEndpoint.includes('move_uploaded_file'), 'the mantra library endpoint no longer protects owner uploads');
requireCondition(mantraLibraryEndpoint.includes("hash_equals($_SESSION['quantum_tree_csrf'], $csrf)") && mantraLibraryEndpoint.includes('file_put_contents($temporary, $json, LOCK_EX)'), 'the mantra library endpoint has lost CSRF verification or atomic writes');
requireCondition(mantraSamples.scope.includes('Private password-gated concept mockup only'), 'the mantra sample manifest no longer limits these references to the private mockup');
requireCondition(mantraSamples.replacementRule.includes('replace every reference asset with a licensed master or newly commissioned recording'), 'the mantra sample manifest no longer requires licensed public replacements');
requireCondition(mantraSamples.samples.length === 9, 'the mantra source manifest must contain exactly nine current reference samples');
requireCondition(mantraSamples.reserved.length === 3, 'the source manifest must retain three reserved Tibet positions');
requireCondition(mantraSamples.samples.every((sample) => sample.rightsStatus === 'uncleared_reference'), 'every private reference sample must be marked uncleared');
requireCondition(new Set(mantraSamples.samples.map((sample) => sample.id)).size === mantraSamples.samples.length, 'the mantra source manifest contains duplicate sample ids');
const handledSampleDurations = new Map([
  ['tibet-universe', 13.95],
  ['tibet-one-life', 18],
  ['tibet-multiplicity', 21.7],
  ['ibiza-mind-body-soul', 12.05],
  ['ibiza-open-mind', 11.16],
  ['ibiza-glowing', 13.8],
]);
for (const [sampleId, expectedDuration] of handledSampleDurations) {
  const source = mantraSamples.samples.find((sample) => sample.id === sampleId);
  const libraryItem = [...mantraLibrary.banks.tibet, ...mantraLibrary.banks.ibiza].find((item) => item.id === sampleId);
  requireCondition(source?.phraseWindow && source?.editHandles?.afterSeconds === 5, `${sampleId} no longer records the original phrase and five-second trailing edit handle`);
  requireCondition(source?.editHandles?.beforeSeconds === 5 || source?.editHandles?.beforeLimitedBySourceStart === true, `${sampleId} no longer records its five-second leading handle or source-start limit`);
  requireCondition(Math.abs(Number(libraryItem?.trim_end) - expectedDuration) < 0.001, `${sampleId} does not expose the complete longer source recording to the waveform editor`);
}

await import(`${pathToFileURL(mantraVoiceDspPath).href}?preflight=${expectedMantraVoiceDspToken}`);
const voiceDsp = globalThis.IAMMantraVoiceDSP;
const nonHumanPresetIds = voicePresetIds.filter((id) => !id.startsWith('human-'));
requireCondition(nonHumanPresetIds.every((id) => voiceDsp?.ROBOT_PRESETS?.[id] || voiceDsp?.VOCODER_PRESETS?.[id]), 'one or more visible Robot or Vocoder presets has no real DSP configuration');
const dspSampleRate = 24000;
const dspProbeData = Float32Array.from({ length: dspSampleRate }, (_, index) => {
  const time = index / dspSampleRate;
  const syllable = 0.24 + 0.76 * Math.max(0, Math.sin(time * Math.PI * 5));
  return syllable * (
    Math.sin(time * Math.PI * 2 * 118) * 0.45
    + Math.sin(time * Math.PI * 2 * 236) * 0.2
    + Math.sin(time * Math.PI * 2 * 944) * 0.12
  );
});
const dspProbeBuffer = {
  numberOfChannels: 1,
  length: dspProbeData.length,
  sampleRate: dspSampleRate,
  getChannelData: () => dspProbeData,
};
const robotProbe = voiceDsp.processVoice({ audioBuffer: dspProbeBuffer, preset: 'robot-machine', effectAmount: 0.75 });
const vocoderProbe = voiceDsp.processVoice({ audioBuffer: dspProbeBuffer, preset: 'vocoder-neon', effectAmount: 0.75 });
const probeDifference = (output) => Math.sqrt(output.reduce((sum, sample, index) => sum + (sample - dspProbeData[index]) ** 2, 0) / output.length);
requireCondition(robotProbe.mode === 'robot' && robotProbe.blob.size > 44 && probeDifference(robotProbe.samples) > 0.08, 'the Robot path does not produce an audibly transformed WAV');
requireCondition(vocoderProbe.mode === 'vocoder' && vocoderProbe.blob.size > 44 && probeDifference(vocoderProbe.samples) > 0.08, 'the Vocoder path does not produce an audibly transformed WAV');
for (const sample of mantraSamples.samples) {
  const assetStat = await fs.stat(path.join(IAM_DIR, sample.asset));
  requireCondition(assetStat.size > 15000, `${sample.id} reference audio is missing or unexpectedly small`);
  requireCondition(assetStat.size < 500000, `${sample.id} reference audio is unexpectedly large for a sampler pad`);
}

console.log(`Adaptive music handoff preflight passed (${expectedCacheToken}).`);
