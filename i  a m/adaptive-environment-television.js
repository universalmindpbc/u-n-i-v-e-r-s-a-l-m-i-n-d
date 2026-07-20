(function () {
  const TRACK_CATALOGUE = [
    { id: "madonna-frozen", artist: "Madonna", title: "Frozen", localVideoSrc: "a s s e t s/Madonna - Frozen.mp4", radioHandoff: "chill", edgeScale: 1.2 },
    { id: "madonna-ray-of-light", artist: "Madonna", title: "Ray Of Light", localVideoSrc: "a s s e t s/Madonna - Ray Of Light.mp4", radioHandoff: "house", edgeScale: 1.2 },
    { id: "rihanna-diamonds", artist: "Rihanna", title: "Diamonds", localVideoSrc: "a s s e t s/Rihanna - Diamonds.mp4", radioHandoff: "chill" },
    { id: "bjork-hyperballad", artist: "Björk", title: "Hyperballad", localVideoSrc: "a s s e t s/Björk - Hyperballad.mp4", radioHandoff: "chill" },
    { id: "tame-impala-the-less-i-know-the-better", artist: "Tame Impala", title: "The Less I Know The Better", localVideoSrc: "a s s e t s/Tame Impala - The Less I Know The Better.mp4", radioHandoff: "chill" },
    { id: "flume-tiny-cities", artist: "Flume feat. Beck", title: "Tiny Cities", localVideoSrc: "a s s e t s/Flume - Tiny Cities feat. Beck.mp4", radioHandoff: "chill" },
    { id: "flume-never-be-like-you-laneway", artist: "Flume feat. Kai", title: "Never Be Like You [Live at Laneway Festival]", localVideoSrc: "a s s e t s/Flume - Never Be Like You feat. Kai [ Live at Laneway Festival ].mp4", radioHandoff: "house" },
    { id: "grimes-genesis", artist: "Grimes", title: "Genesis", localVideoSrc: "a s s e t s/Grimes - Genesis.mp4", radioHandoff: "house" },
    { id: "solange-cranes-in-the-sky", artist: "Solange", title: "Cranes in the Sky", localVideoSrc: "a s s e t s/Solange - Cranes in the Sky.mp4", radioHandoff: "calm" },
    { id: "little-simz-gorilla", artist: "Little Simz", title: "Gorilla", localVideoSrc: "a s s e t s/Little Simz - Gorilla.mp4", radioHandoff: "house" },
    { id: "the-prodigy-everybody-in-the-place", artist: "The Prodigy", title: "Everybody In The Place", localVideoSrc: "a s s e t s/The Prodigy - Everybody In The Place.mp4", radioHandoff: "house", edgeScale: 1.16 },
    { id: "nightmares-on-wax-shape-the-future", artist: "Nightmares On Wax", title: "Shape The Future", localVideoSrc: "a s s e t s/Nightmares On Wax - Shape The Future.mp4", radioHandoff: "calm" },
    { id: "mia-borders", artist: "M.I.A.", title: "Borders", localVideoSrc: "a s s e t s/M.I.A. - Borders.mp4", radioHandoff: "house" },
    { id: "sampa-the-great-energy", artist: "Sampa The Great feat. Nadeem Din-Gabisi", title: "Energy", localVideoSrc: "a s s e t s/Sampa The Great - Energy (feat. Nadeem Din-Gabisi).mp4", radioHandoff: "house" },
    { id: "sampa-the-great-final-form", artist: "Sampa The Great", title: "Final Form", localVideoSrc: "a s s e t s/Sampa The Great - Final Form.mp4", radioHandoff: "house" },
    { id: "dua-lipa-be-the-one-glastonbury-2017", artist: "Dua Lipa", title: "Be The One", localVideoSrc: "a s s e t s/Dua Lipa - Be The One.mp4", radioHandoff: "house" },
    { id: "charli-xcx-house-john-cale", artist: "Charli XCX feat. John Cale", title: "House", displayArtist: "Charli XCX", displayTitle: "House feat. John Cale", localVideoSrc: "a s s e t s/Charli XCX - House featuring John Cale.mp4", youtubeVideoId: "Xgp7wlBfASA", radioHandoff: "house" },
    { id: "pinkpantheress-illegal-glastonbury-2025", artist: "PinkPantheress", title: "Illegal [Live at Glastonbury]", localVideoSrc: "a s s e t s/PinkPantheress - Illegal ( Live at Glastonbury).mp4", radioHandoff: "house" },
    { id: "caroline-polachek-welcome-to-my-island", artist: "Caroline Polachek", title: "Welcome To My Island", localVideoSrc: "a s s e t s/Caroline Polachek - Welcome To My Island.mp4", radioHandoff: "house" },
    { id: "u2-numb", artist: "U2", title: "Numb", localVideoSrc: "a s s e t s/U2 - Numb.mp4", radioHandoff: "chill", edgeScale: 1.16 },
    { id: "linkin-park-numb-official", artist: "Linkin Park", title: "Numb", localVideoSrc: "a s s e t s/Linkin Park - Numb.mp4", radioHandoff: "chill" },
    { id: "linkin-park-numb-live-2024", artist: "Linkin Park", title: "Numb [Live, 2024]", localVideoSrc: "a s s e t s/Linkin Park - Numb (Live, 2024).mp4", radioHandoff: "chill" },
    { id: "sasha-ibiza-boat-at-sunset-freqways", artist: "Sasha", title: "Sasha - Ibiza Boat at Sunset (Freqways)", displayTitle: "Ibiza Boat at Sunset (Freqways)", localVideoSrc: "a s s e t s/d j  s e t s/ Sasha - Ibiza Boat at Sunset - Freqways.mp4", radioHandoff: "chill", presentation: "live_dj_set" },
    { id: "ben-bohmer-cappadocia-cercle", artist: "Ben Böhmer", title: "Ben Böhmer live above Cappadocia, Turkey (Cercle)", displayTitle: "Cappadocia, Turkey (Cercle)", localVideoSrc: "a s s e t s/d j  s e t s/Ben Böhmer live - Cappadocia, Turkey - Cercle.mp4", radioHandoff: "chill", presentation: "live_dj_set" },
    { id: "peggy-gou-palais-des-beaux-arts-cercle", artist: "Peggy Gou", title: "Peggy Gou at Palais des Beaux-Arts, Lille (Cercle)", displayTitle: "Palais des Beaux-Arts, Lille (Cercle)", localVideoSrc: "a s s e t s/d j  s e t s/Peggy Gou - Cercle - Palais des Beaux - Cercle.mp4", radioHandoff: "house", presentation: "live_dj_set" },
    { id: "miss-monique-biosphere-montreal-cercle", artist: "Miss Monique", title: "Miss Monique at the Biosphere, Montreal (Cercle)", displayTitle: "Biosphere, Montreal (Cercle)", localVideoSrc: "a s s e t s/d j  s e t s/Miss Monique - Biosphere Museum in Montreal, Canada - Cercle.mp4", radioHandoff: "house", presentation: "live_dj_set" },
    { id: "nina-kraviz-eiffel-tower-cercle", artist: "Nina Kraviz", title: "Nina Kraviz at the Eiffel Tower, Paris (Cercle)", displayTitle: "Eiffel Tower, Paris (Cercle)", localVideoSrc: "a s s e t s/d j  s e t s/Nina Kraviz - Eiffel Tower, Paris, France - Cercle.mp4", radioHandoff: "house", presentation: "live_dj_set" },
    { id: "nastia-drum-bass-sunset-the-lab-ibiza", artist: "NASTIA", title: "NASTIA - Drum & Bass Sunset Set at The Lab Ibiza", displayTitle: "Drum & Bass Sunset Set at The Lab Ibiza", localVideoSrc: "a s s e t s/d j  s e t s/NASTIA - Ibiza at Sunset - The Lab.mp4", radioHandoff: "house", presentation: "live_dj_set" },
    { id: "carl-cox-chateau-de-chambord-cercle", artist: "Carl Cox", title: "Carl Cox at Château de Chambord, France (Cercle)", displayTitle: "Château de Chambord, France (Cercle)", localVideoSrc: "a s s e t s/d j  s e t s/Carl Cox - Château de Chambord, France - Cercle.mp4", radioHandoff: "house", presentation: "live_dj_set" },

  ];
  const VIDEO_BEAT_GRID = {
    "Björk - Hyperballad.mp4": { bpm: 134, firstDownbeatSeconds: 9.595, beatsPerBar: 4, beatAnalysisConfidence: .377 },
    "Caroline Polachek - Welcome To My Island.mp4": { bpm: 140, firstDownbeatSeconds: 45.197, beatsPerBar: 4, beatAnalysisConfidence: .389 },
    "Charli XCX - House featuring John Cale.mp4": { bpm: 131.525, firstDownbeatSeconds: 23.86, beatsPerBar: 4, beatAnalysisConfidence: .417 },
    "Dua Lipa - Be The One.mp4": { bpm: 87, firstDownbeatSeconds: 44.735, beatsPerBar: 4, beatAnalysisConfidence: .442 },
    "Flume - Never Be Like You feat. Kai [ Live at Laneway Festival ].mp4": { bpm: 119, firstDownbeatSeconds: 46.607, beatsPerBar: 4, beatAnalysisConfidence: .411 },
    "Flume - Tiny Cities feat. Beck.mp4": { bpm: 71, firstDownbeatSeconds: 29.676, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Grimes - Genesis.mp4": { bpm: 166, firstDownbeatSeconds: 78.778, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Linkin Park - Numb (Live, 2024).mp4": { bpm: 110, firstDownbeatSeconds: 11.24, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Linkin Park - Numb.mp4": { bpm: 110, firstDownbeatSeconds: 15.789, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Little Simz - Gorilla.mp4": { bpm: 90, firstDownbeatSeconds: 1.148, beatsPerBar: 4, beatAnalysisConfidence: .368 },
    "M.I.A. - Borders.mp4": { bpm: 89, firstDownbeatSeconds: 45.575, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Madonna - Frozen.mp4": { bpm: 108, firstDownbeatSeconds: 54.462, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Madonna - Ray Of Light.mp4": { bpm: 128, firstDownbeatSeconds: 17.193, beatsPerBar: 4, beatAnalysisConfidence: .394 },
    "Nightmares On Wax - Shape The Future.mp4": { bpm: 116.584, firstDownbeatSeconds: 47.238, beatsPerBar: 4, beatAnalysisConfidence: .414 },
    "PinkPantheress - Illegal ( Live at Glastonbury).mp4": { bpm: 141, firstDownbeatSeconds: 8.557, beatsPerBar: 4, beatAnalysisConfidence: .429 },
    "Rihanna - Diamonds.mp4": { bpm: 92, firstDownbeatSeconds: 49.915, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Sampa The Great - Energy (feat. Nadeem Din-Gabisi).mp4": { bpm: 90, firstDownbeatSeconds: 16.371, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Sampa The Great - Final Form.mp4": { bpm: 96, firstDownbeatSeconds: .619, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Solange - Cranes in the Sky.mp4": { bpm: 97, firstDownbeatSeconds: .081, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "Tame Impala - The Less I Know The Better.mp4": { bpm: 117, firstDownbeatSeconds: 41.871, beatsPerBar: 4, beatAnalysisConfidence: 1 },
    "The Prodigy - Everybody In The Place.mp4": { bpm: 183.727, firstDownbeatSeconds: 8.765, beatsPerBar: 4, beatAnalysisConfidence: .36 },
    "U2 - Numb.mp4": { bpm: 90, firstDownbeatSeconds: 2.429, beatsPerBar: 4, beatAnalysisConfidence: .496 },
  };
  TRACK_CATALOGUE.forEach((candidate) => {
    const fileName = candidate.localVideoSrc.split("/").pop();
    if (VIDEO_BEAT_GRID[fileName]) Object.assign(candidate, VIDEO_BEAT_GRID[fileName]);
    const streamAsset = window.IAMCloudflareStream?.assetFor(fileName);
    if (streamAsset) Object.assign(candidate, { streamUid: streamAsset.uid, hlsVideoSrc: streamAsset.hls });
  });
  const DEFAULT_TRACK_ID = "madonna-frozen";
  const IOH_LOGO_SRC = "a s s e t s/Universal Mind [ I o H ] Logo.PNG";
  const DEFAULT_EDGE_SCALE = 1.12;
  const MAX_DETECTED_EDGE_SCALE = 1.85;
  const DEFAULT_RADIO_STATIONS = [
    { id: "cafe-del-mar-calm", stageGate: "calm", mode: "radio", provider: "Café del Mar Radio", title: "Calm", display_title: "Café del Mar — Calm", short_title: "CALM", stream_url: "https://streamer.radio.co/sb748f24ad/listen", primary_environmental_function: "Soul + Restoration", top_needs: ["Calm", "Recovery", "Psychological Safety", "Anxiety"], card_palette: ["#506f88", "#c8d6d9"] },
    { id: "cafe-del-mar-chill", stageGate: "chill", mode: "radio", provider: "Café del Mar Radio", title: "Chill", display_title: "Café del Mar — Chill", short_title: "CHILL", stream_url: "https://streams.radio.co/se1a320b47/listen", primary_environmental_function: "Soul + Restoration", top_needs: ["Recovery", "Belonging", "Gratitude", "Trust"], card_palette: ["#99815f", "#e3ceb3"] },
    { id: "cafe-del-mar-house", stageGate: "house", mode: "radio", provider: "Café del Mar Radio", title: "House", display_title: "Café del Mar — House", short_title: "HOUSE", stream_url: "https://s4.radio.co/seeae9c220/listen", primary_environmental_function: "Club Energy + Festival Activation", top_needs: ["Joy", "Motivation", "Connection", "Arousal"], card_palette: ["#8a4867", "#e6a99f"] },
    { id: "groove-salad", stageGate: "calm", mode: "radio", provider: "SomaFM", title: "Groove Salad", display_title: "Groove Salad", short_title: "GROOVE SALAD", stream_url: "https://ice5.somafm.com/groovesalad-128-mp3", primary_environmental_function: "Focus + Flow", top_needs: ["Attention", "Executive Function", "Calm", "Recovery"], card_palette: ["#526b52", "#cad4a4"] },
    { id: "groove-salad-classic", stageGate: "chill", mode: "radio", provider: "SomaFM", title: "Groove Salad Classic", display_title: "Groove Salad Classic", short_title: "GS CLASSIC", stream_url: "https://ice5.somafm.com/gsclassic-128-mp3", primary_environmental_function: "Soul + Restoration", top_needs: ["Belonging", "Gratitude", "Recovery", "Calm"], card_palette: ["#725f50", "#c9b896"] },
    { id: "sanctuary-dark-electro", stageGate: "house", mode: "radio", provider: "Sanctuary Radio", title: "Dark Electro", display_title: "Sanctuary — Dark Electro", short_title: "DARK ELECTRO", stream_url: "https://stream.sanctuaryradio.com/mainchannel_hq", primary_environmental_function: "Grit + Agency", top_needs: ["Anger", "Motivation", "Self-Actualisation", "Curiosity"], card_palette: ["#312e42", "#9c6da6"] },
    { id: "sanctuary-retro", stageGate: "chill", mode: "radio", provider: "Sanctuary Radio", title: "Retro", display_title: "Sanctuary — Retro", short_title: "RETRO", stream_url: "https://stream.sanctuaryradio.com/retrochannel_hq", primary_environmental_function: "Joy + Affirmation", top_needs: ["Belonging", "Joy", "Gratitude", "Connection"], card_palette: ["#355c67", "#d57c72"] },
  ];
  const continuation = {
    videoSrc: "a s s e t s/Homepage - Hero Background Video - Chanel 2020 Runway Show.mp4",
    defaultStation: "cafe-del-mar-chill",
    stagePools: {
      calm: ["cafe-del-mar-calm", "groove-salad", "groove-salad-classic"],
      chill: ["cafe-del-mar-chill", "groove-salad", "groove-salad-classic", "sanctuary-retro"],
      house: ["cafe-del-mar-house", "sanctuary-dark-electro", "sanctuary-retro"],
    },
  };
  const playButton = document.querySelector("[data-television-play]");
  const room = document.querySelector("[data-television-room]");
  const playerMount = document.querySelector("[data-television-player]");
  const pageView = document.querySelector("[data-television-page-view]");
  const pageFrame = document.querySelector("[data-television-page-frame]");
  const siteShell = document.querySelector(".site-shell");
  const flowerTrigger = document.querySelector(".global-nav-trigger");
  const learnCue = document.querySelector("[data-homepage-radar-trigger]");
  const walletOnboarding = document.querySelector("[data-wallet-onboarding]");
  const radarClose = document.querySelector("[data-television-radar-close]");
  const fullscreenButton = document.querySelector("[data-television-fullscreen]");
  const livePill = document.querySelector("[data-television-live-pill]");
  const liveViewerCounts = Array.from(document.querySelectorAll("[data-live-viewer-count]"));
  const liveRegionCounts = Array.from(document.querySelectorAll("[data-live-region-count]"));
  const communityOverlay = document.querySelector("[data-community-globe-overlay]");
  const communityGlobeFrame = document.querySelector("[data-community-globe-frame]");
  const communityGlobeBackdrop = document.querySelector("[data-community-globe-backdrop]");
  const communityGlobeClose = document.querySelector("[data-community-globe-close]");
  const reactionWallet = document.querySelector("[data-reaction-wallet]");
  const reactionWalletTrigger = document.querySelector("[data-reaction-wallet-trigger]");
  const walletCategories = document.querySelector("[data-wallet-categories]");
  const walletCategoryButtons = Array.from(document.querySelectorAll("[data-wallet-category]"));
  const walletPanels = Array.from(document.querySelectorAll("[data-wallet-panel]"));
  const nowPlaying = document.querySelector("[data-now-playing]");
  const nowPlayingTime = document.querySelector("[data-now-playing-time]");
  const nowPlayingStatus = document.querySelector("[data-now-playing-status]");
  const nowPlayingViewport = document.querySelector("[data-now-playing-viewport]");
  const nowPlayingTrack = document.querySelector("[data-now-playing-track]");
  const nowPlayingMode = document.querySelector("[data-now-playing-mode]");
  const nowPlayingTitle = document.querySelector("[data-now-playing-title]");
  const nowPlayingVisual = document.querySelector("[data-now-playing-visual]");
  const nowPlayingVisualTitle = document.querySelector("[data-now-playing-visual-title]");
  const videoModeButtons = Array.from(document.querySelectorAll("[data-video-mode]"));
  const videoMixControls = document.querySelector("[data-video-mix-controls]");
  const videoCrossfader = document.querySelector("[data-video-crossfader]");
  const videoMixEndpoints = Array.from(document.querySelectorAll("[data-video-mix-endpoint]"));
  const fashionRunwaySelector = document.querySelector("[data-fashion-runway-selector]");
  const fashionRunwayPrevious = document.querySelector("[data-fashion-runway-previous]");
  const fashionRunwayNext = document.querySelector("[data-fashion-runway-next]");
  const fashionRunwayLabel = document.querySelector("[data-fashion-runway-label]");
  const fashionRunwayCount = document.querySelector("[data-fashion-runway-count]");
  const fashionShelf = document.querySelector("[data-fashion-shelf]");
  const fashionShelfToggle = document.querySelector("[data-fashion-shelf-toggle]");
  const fashionShelfTrack = document.querySelector("[data-fashion-shelf-track]");
  const fashionShelfViewport = document.querySelector("[data-fashion-shelf-viewport]");
  const fashionShelfPrevious = document.querySelector("[data-fashion-shelf-previous]");
  const fashionShelfNext = document.querySelector("[data-fashion-shelf-next]");
  const fashionShelfCounter = document.querySelector("[data-fashion-shelf-counter]");
  const fashionShelfProgress = document.querySelector("[data-fashion-shelf-progress]");
  const fashionShelfCloseButtons = Array.from(document.querySelectorAll("[data-fashion-shelf-close]"));
  const musicShelf = document.querySelector("[data-music-shelf]");
  const musicShelfToggle = document.querySelector("[data-music-shelf-toggle]");
  const musicShelfTrack = document.querySelector("[data-music-shelf-track]");
  const musicShelfViewport = document.querySelector("[data-music-shelf-viewport]");
  const musicShelfPrevious = document.querySelector("[data-music-shelf-previous]");
  const musicShelfNext = document.querySelector("[data-music-shelf-next]");
  const musicShelfCounter = document.querySelector("[data-music-shelf-counter]");
  const musicShelfProgress = document.querySelector("[data-music-shelf-progress]");
  const musicShelfTitle = document.querySelector("[data-music-shelf-title]");
  const musicShelfSubtitle = document.querySelector("[data-music-shelf-subtitle]");
  const musicShelfStatus = document.querySelector("[data-music-shelf-status]");
  const musicShelfCloseButtons = Array.from(document.querySelectorAll("[data-music-shelf-close]"));
  const musicModeButtons = Array.from(document.querySelectorAll("[data-music-mode]"));
  const musicSelector = document.querySelector("[data-music-selector]");
  const musicSelectorPrevious = document.querySelector("[data-music-previous]");
  const musicSelectorNext = document.querySelector("[data-music-next]");
  const musicSelectorLabel = document.querySelector("[data-music-selector-label]");
  const musicSelectorCount = document.querySelector("[data-music-selector-count]");
  const emdrCanvas = document.querySelector("[data-emdr-canvas]");
  const emdrOff = document.querySelector("[data-emdr-off]");
  const emdrStyleButtons = Array.from(document.querySelectorAll("[data-emdr-style]"));
  const emdrReact = document.querySelector("[data-emdr-react]");
  const emdrAutomate = document.querySelector("[data-emdr-automate]");
  const emdrIntensity = document.querySelector("[data-emdr-intensity]");
  const emdrSoundResearch = document.querySelector("[data-emdr-sound-research]");
  const researchRolloverHosts = Array.from(document.querySelectorAll(".adaptive-television-research-tooltip-host"));
  const reactionButtons = Array.from(document.querySelectorAll("[data-television-reaction]"));
  const audioModeTrigger = document.querySelector("[data-audio-mode-open]");
  const audioModeClose = document.querySelector("[data-audio-mode-close]");
  const audioWalletControls = document.querySelector("[data-audio-wallet-controls]");
  const audioWalletMic = document.querySelector("[data-audio-wallet-mic]");
  const audioWalletJoin = document.querySelector("[data-audio-wallet-join]");
  const audioWalletCount = document.querySelector("[data-audio-wallet-count]");
  const heartField = document.querySelector("[data-heart-field]");
  const supportCard = document.querySelector("[data-television-support-card]");
  const supportClose = document.querySelector("[data-television-support-close]");
  const typewriterLines = Array.from(document.querySelectorAll("[data-adaptive-typewriter]"));
  const contextLines = Array.from(document.querySelectorAll("[data-local-context-line]"));
  const televisionPageTitle = document.title;

  if (!playButton || !room || !playerMount) return;

  let track = resolveSelectedTrack();
  let musicChannelMode = track.presentation === "live_dj_set" ? "parties" : "videos";
  let musicModeManuallySelected = false;
  let musicShelfOpen = false;
  let musicShelfOffset = 0;
  let musicShelfSwipeStartX = null;
  let musicShelfPreviewVideo = null;
  let musicShelfPreviewCard = null;
  let musicCatalogueRecords = [];
  let radioStationRecords = DEFAULT_RADIO_STATIONS.map((station) => ({ ...station }));
  let musicShelfOrders = { videos: [], parties: [], radio: radioStationRecords.slice() };
  let activeRadioStationId = "";
  let musicContinuationSequence = 0;
  let musicSwitching = false;
  let musicDwellTimer = 0;
  let musicRadioPreviousBlend = 100;
  let groupQueue = [];
  let selectionIsLoading = document.body.classList.contains("adaptive-music-selection-loading");
  let hasOpened = false;
  let televisionPlaybackRequested = false;
  let pageViewPreviousBlend = null;
  let learnCueShown = false;
  let learnCueUnlocked = false;
  let walletOnboardingEngaged = false;
  let walletOnboardingLineOneTimer = 0;
  let walletOnboardingLineTwoTimer = 0;
  let walletOnboardingDismissTimer = 0;
  let learnCueAfterWalletTimer = 0;
  let localVideoFrame = null;
  let localVideo = null;
  let fashionVideo = null;
  let fashionHeroFrame = null;
  let fashionHeroCanvas = null;
  let fashionHeroContext = null;
  let fashionHeroFallbackTimer = 0;
  let fashionHeroVideoFrame = 0;
  let fashionHeroVideoFrameSource = null;
  let fashionHeroGeneration = 0;
  let fashionHeroLastMediaTime = -1;
  let fashionHeroDrawCount = 0;
  let fashionRunwayIndex = 0;
  let fashionRunwaySwitching = false;
  let fashionSelectionSource = "algorithm";
  let fashionShelfOpen = false;
  let fashionShelfOffset = 0;
  let fashionShelfOrder = [0, 1, 2, 3, 4, 5];
  let fashionShelfPreviewVideo = null;
  let fashionShelfPreviewCard = null;
  let fashionShelfSwipeStartX = null;
  let fashionTensorRecords = [];
  let fashionDwellTimer = 0;
  let requestedVideoBlend = Number(videoCrossfader?.value || 100);
  let fashionRevealGeneration = 0;
  let pendingFashionRevealPromise = null;
  let pendingFashionRevealVideo = null;
  const fashionRunways = [
    {
      assetKey: "chanel-paris-rooftops",
      title: "Chanel 2020",
      shortTitle: "CHANEL 2020",
      videoSrc: "a s s e t s/Chanel - Paris 2020.mp4",
      streamUid: "f6eefc5a83e53f24990a7477ecd04010",
      previewStart: 12,
    },
    {
      assetKey: "jacquemus-le-coup-de-soleil",
      title: "Jacquemus SS20 — Le Coup de Soleil",
      shortTitle: "JACQUEMUS",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/JACQUEMUS - SS20 LE COUP DE SOLEIL.mp4",
      streamUid: "00fe2d47012a31b3b0796fcf2e544360",
      previewStart: 18,
    },
    {
      assetKey: "annies-ibiza-runway",
      title: "Annie’s Ibiza — Runway Film",
      shortTitle: "ANNIE’S IBIZA",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/Annie's Ibiza.mp4",
      streamUid: "30b3a8a9a753d23f089f480689bd14f6",
      previewStart: 6,
    },
    {
      assetKey: "dolce-gabbana-valley-of-the-temples",
      title: "Dolce & Gabbana 2019",
      shortTitle: "D&G 2019",
      videoSrc: "a s s e t s/Dolce & Gabbanna - Sicily 2019.mp4",
      streamUid: "b582b1bff1de6e3952f815b9e2f79ebc",
      previewStart: 14,
    },
    {
      assetKey: "mugler-fall-winter-2021",
      title: "Mugler Fall Winter 2021",
      shortTitle: "MUGLER FW21",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/Mugler - Fall Winter 2021.mp4",
      streamUid: "792c884e5d63177f32dd85a2f7e97c28",
      previewStart: 9,
    },
    {
      assetKey: "wolford-sergio-rossi-capsule",
      title: "Wolford × Sergio Rossi",
      shortTitle: "WOLFORD",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/Wolford x Sergio Rossi.mp4",
      streamUid: "90c027288fe81ad915971988aafebafd",
      previewStart: 4,
    },
  ];
  try {
    const storedFashion = JSON.parse(window.sessionStorage.getItem("iamFashionVisualStateV1") || "null");
    const storedIndex = fashionRunways.findIndex((runway) => runway.assetKey === storedFashion?.assetKey);
    if (storedIndex >= 0) {
      fashionRunwayIndex = storedIndex;
      fashionSelectionSource = storedFashion?.source === "manual" ? "manual" : "algorithm";
    }
  } catch {
    // The adaptive recommendation remains available when session storage is restricted.
  }
  let continuationAudio = null;
  let soundResearchAudio = null;
  let soundResearchGainFrame = 0;
  let soundResearchMediaLevel = 0;
  let soundResearchTargetLevel = 0;
  let soundResearchDiagnosticAt = 0;
  let soundResearchPlaybackObservedAt = 0;
  let soundResearchPlaybackTime = 0;
  let soundResearchPlaybackAdvancing = false;
  let soundResearchRetryAt = 0;
  let soundResearchMonitor = null;
  let soundResearchAuditionMode = false;
  let soundResearchSettingsLoaded = false;
  let soundResearchContinuityActive = false;
  let soundResearchLastError = "";
  let soundResearchLastPlayReason = "";
  let soundResearchWatchdog = 0;
  const soundResearchParams = new URLSearchParams(window.location.search);
  const soundResearchTestMode = soundResearchParams.get("soundResearchTest") === "1";
  const soundResearchMonitorMode = soundResearchParams.get("quantumTreeMonitor") === "1";
  let soundResearchEnabled = soundResearchTestMode || localStorage.getItem("iamSoundResearchLayer") !== "off";
  const SOUND_RESEARCH_DEFAULT_MAX_VOLUME = 0.055;
  const SOUND_RESEARCH_SETTINGS_ENDPOINT = "api/quantum-tree-settings.php";
  const SOUND_RESEARCH_AUDIO_SRC = "a s s e t s/q u a n t u m [ t r e e ].m4a";
  const SOUND_RESEARCH_SILENCE_FLOOR = 0.012;
  const SOUND_RESEARCH_FULL_MASK_LEVEL = 0.12;
  const SOUND_RESEARCH_MASKING_CURVE = 0.75;
  const SOUND_RESEARCH_ATTACK_SMOOTHING = 0.05;
  const SOUND_RESEARCH_RELEASE_SMOOTHING = 0.12;
  let soundResearchMaxVolume = SOUND_RESEARCH_DEFAULT_MAX_VOLUME;
  let continuationDecision = null;
  let flowerCanvasFrame = 0;
  let timecode = null;
  let edgeCropLastScanAt = 0;

  const iohLogoPreload = new Image();
  iohLogoPreload.src = IOH_LOGO_SRC;
  if (iohLogoPreload.decode) iohLogoPreload.decode().catch(() => {});
  const floraReactionToken = document.createElement("span");
  floraReactionToken.className = "adaptive-television-reaction__glyph adaptive-television-reaction__glyph--ioh-logo adaptive-television-reaction__glyph--flora-flower";
  let liveViewerInterval = 0;
  let liveViewerCountValue = 6;
  let communityPreviousFocus = null;
  let heartBurstActive = false;
  let reactionWalletPointerReadyAt = Number.POSITIVE_INFINITY;
  let reactionWalletPointerAnchorX = null;
  let reactionWalletPointerAnchorY = null;
  let reactionWalletPointerLockTimer = 0;
  let reactionWalletCollapseTimer = 0;
  let nowPlayingInteractiveAt = 0;
  let nowPlayingResizeObserver = null;
  const REACTION_WALLET_POINTER_LOCK_MS = 10000;
  const REACTION_WALLET_POINTER_MOVE_PX = 2;
  let audioWalletMode = false;
  let audioWalletJoined = false;
  let audioWalletMuted = false;
  let audioWalletOccupancy = 0;
  let circleTooltipArmTimer = 0;
  let videoTooltipArmTimer = 0;
  let videoTooltipOpenedAt = 0;
  const researchRolloverCloseTimers = new WeakMap();
  const researchDetailsCloseTimers = new WeakMap();
  const RESEARCH_ROLLOVER_CLOSE_DELAY_MS = 1000;
  let audioWalletInteracting = false;
  let walletView = "closed";
  const emdrStyleNames = ["GIF", "stellar"];
  const emdrStyleValues = [7, 5];
  let emdrStyleIndex = 0;
  let emdrGifPreviousVideoBlend = null;
  let emdrGifPreviousMusicMaxHeight = null;
  let emdrGifMusicMaxHeightCaptured = false;
  let emdrIntensityFrame = 0;
  let emdrIntensityJourneyStartedAt = 0;
  let emdrIntensityJourneyLastAt = 0;
  let emdrIntensityJourneyCurrent = .22;
  let emdrIntensityJourneyMinimum = .22;
  let emdrAutomateEnabled = true;
  let emdrUserIntensity = null;
  const EMDR_INTENSITY_CYCLE_MS = 32000;
  const EMDR_INTENSITY_PHRASE_BEATS = 64;

  function shouldShowAudioWalletMock() {
    const params = new URLSearchParams(window.location.search);
    return params.get("audioWallet") === "1" || params.get("audioRoomMock") === "1";
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function normalizeSlug(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizePath(value) {
    return String(value || "").replace(/^\.\//, "");
  }

  function findTrack(value) {
    const needle = normalizeSlug(value);
    const pathNeedle = normalizePath(value);
    if (!needle && !pathNeedle) return null;

    return TRACK_CATALOGUE.find((candidate) => (
      candidate.id === value ||
      normalizeSlug(candidate.id) === needle ||
      normalizeSlug(`${candidate.artist} ${candidate.title}`) === needle ||
      normalizePath(candidate.localVideoSrc) === pathNeedle ||
      candidate.youtubeVideoId === value
    )) || null;
  }

  function readJsonStorage(key) {
    try {
      const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function selectionTrackFields(selection) {
    const hero = selection?.hero_music_video || selection?.final_output?.hero_music_video || selection?.adaptive_music_intelligence?.hero_music_video || {};
    const runtime = selection?.tensor_profile?.runtime_delivery || selection?.runtime_delivery || {};
    return [
      selection?.selected_track_id,
      selection?.track_id,
      selection?.id,
      selection?.local_video_file,
      selection?.localVideoSrc,
      runtime.selected_track_id,
      runtime.local_video_file,
      hero.selected_track_id,
      hero.track_id,
      hero.local_video_file,
      hero.localVideoSrc,
      hero.video_id,
      hero.youtube_video_id,
      hero.youtubeVideoId,
      [hero.artist, hero.title].filter(Boolean).join(" "),
    ].filter(Boolean);
  }

  function resolveSelectedTrack() {
    const params = new URLSearchParams(window.location.search);
    const explicitTrack = params.get("track") || params.get("musicVideo") || params.get("selected_track_id");
    const explicitFile = params.get("video") || params.get("local_video_file");
    const explicit = findTrack(explicitTrack) || findTrack(explicitFile);
    if (explicit) return explicit;

    const storageKeys = [
      "iamMusicTelevisionSelection",
      "iamLatestMusicVideoSelection",
      "iamMusicTelevisionRecommendation",
      "iamLatestMusicVideoRecommendation",
    ];

    for (const key of storageKeys) {
      const stored = readJsonStorage(key);
      for (const field of selectionTrackFields(stored)) {
        const candidate = findTrack(field);
        if (candidate) return candidate;
      }
    }

    return findTrack(DEFAULT_TRACK_ID) || TRACK_CATALOGUE[0];
  }

  function syncSelectedTrackCopy() {
    const artistLine = document.querySelector(".adaptive-environment__source");
    const titleLine = document.querySelector(".adaptive-environment__station");
    const artistText = track.displayArtist || track.artist;
    const titleText = track.displayTitle || track.title;
    const params = new URLSearchParams(window.location.search);
    const selectionSource = params.get("selection_source") || (params.get("selected_track_id") ? "explicit_url" : "stored_or_default");

    if (artistLine) {
      artistLine.dataset.adaptiveTypewriterText = artistText;
      artistLine.textContent = artistText;
    }

    if (titleLine) {
      titleLine.dataset.adaptiveTypewriterText = titleText;
      titleLine.textContent = titleText;
    }

    document.body.dataset.adaptiveTrackId = track.id;
    document.body.dataset.adaptiveSelectionSource = selectionSource;
    document.body.classList.add("adaptive-music-selection-ready");
    playButton.dataset.selectedTrackId = track.id;
    playButton.setAttribute("aria-label", `Expand the room and play ${artistText} - ${titleText}`);
    updateNowPlaying();
  }

  function setRecommendationLoading(isLoading) {
    selectionIsLoading = Boolean(isLoading);
    document.body.classList.toggle("adaptive-music-selection-loading", selectionIsLoading);
    playButton.disabled = selectionIsLoading;
    playButton.setAttribute("aria-busy", String(selectionIsLoading));

    if (selectionIsLoading) {
      document.body.classList.remove("adaptive-music-selection-ready");
      playButton.removeAttribute("data-selected-track-id");
      playButton.setAttribute("aria-label", "Tuning your experience");
    }
  }

  function updateRecommendationFromStorage() {
    track = resolveSelectedTrack();
    musicChannelMode = track.presentation === "live_dj_set" ? "parties" : "videos";
    musicModeManuallySelected = false;
    activeRadioStationId = "";
    document.body.classList.remove("adaptive-music-selection-failed");
    setRecommendationLoading(false);
    syncSelectedTrackCopy();
    setMusicTelevisionMetadata();
    rankMusicShelves();
    window.IAMStreamReady?.then(() => primeLocalVideo());
  }

  function showRecommendationUnavailable() {
    const basisLine = document.querySelector(".adaptive-environment__basis");
    const artistLine = document.querySelector(".adaptive-environment__source");
    const titleLine = document.querySelector(".adaptive-environment__station");
    if (basisLine) {
      const unavailableText = "Music selection is unavailable. Please check in again.";
      basisLine.dataset.adaptiveTypewriterText = unavailableText;
      basisLine.textContent = unavailableText;
    }
    if (artistLine) {
      artistLine.dataset.adaptiveTypewriterText = "";
      artistLine.textContent = "";
    }
    if (titleLine) {
      titleLine.dataset.adaptiveTypewriterText = "";
      titleLine.textContent = "";
    }

    setRecommendationLoading(false);
    document.body.classList.remove("adaptive-music-selection-ready");
    document.body.classList.add("adaptive-music-selection-failed");
    document.body.dataset.adaptiveSelectionSource = "pipeline_error";
    delete document.body.dataset.adaptiveTrackId;
    playButton.disabled = true;
    playButton.removeAttribute("data-selected-track-id");
    playButton.setAttribute("aria-label", "Music selection unavailable. Please check in again.");
  }

  function shouldAutoPreloadVideo() {
    const connection = window.navigator.connection || window.navigator.mozConnection || window.navigator.webkitConnection;
    if (!connection) return true;
    if (connection.saveData) return false;
    return !/2g|slow-2g/i.test(connection.effectiveType || "");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setSoundResearchPeakVolume(value, source = "runtime") {
    soundResearchMaxVolume = clamp(Number(value) || 0, 0, 1);
    document.body.dataset.quantumTreePeakVolume = soundResearchMaxVolume.toFixed(4);
    document.body.dataset.quantumTreeConfigSource = source;
    window.dispatchEvent(new CustomEvent("iam:quantum-tree-peak-changed", {
      detail: { peakVolume: soundResearchMaxVolume, source },
    }));
    if (soundResearchMonitor) updateSoundResearchMonitor(soundResearchDiagnostics());
    return soundResearchMaxVolume;
  }

  async function loadSoundResearchSettings() {
    try {
      const response = await fetch(SOUND_RESEARCH_SETTINGS_ENDPOINT, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`settings ${response.status}`);
      const settings = await response.json();
      const peak = Number(settings?.peak_volume);
      if (!Number.isFinite(peak) || peak < 0 || peak > 1) throw new Error("invalid settings");
      soundResearchSettingsLoaded = true;
      return setSoundResearchPeakVolume(peak, "platform");
    } catch {
      soundResearchSettingsLoaded = false;
      return setSoundResearchPeakVolume(SOUND_RESEARCH_DEFAULT_MAX_VOLUME, "built-in fallback");
    }
  }

  function baseEdgeScale() {
    return clamp(Number(track.edgeScale || DEFAULT_EDGE_SCALE), 1, MAX_DETECTED_EDGE_SCALE);
  }

  function applyEdgeCropScale(scale, source) {
    const resolvedScale = clamp(Number(scale) || baseEdgeScale(), 1, MAX_DETECTED_EDGE_SCALE);
    if (!playerMount) return;
    playerMount.style.setProperty("--adaptive-video-edge-scale", resolvedScale.toFixed(3));
    playerMount.dataset.edgeCropScale = resolvedScale.toFixed(3);
    playerMount.dataset.edgeCropSource = source;
  }

  function detectEdgeMatteScale(video) {
    if (!video?.videoWidth || !video?.videoHeight) return baseEdgeScale();

    const sampleWidth = 320;
    const sampleHeight = Math.max(120, Math.round(sampleWidth * (video.videoHeight / video.videoWidth)));
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return baseEdgeScale();

    try {
      context.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const frame = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const yStart = Math.floor(sampleHeight * 0.18);
      const yEnd = Math.ceil(sampleHeight * 0.82);
      const lumaByX = [];
      const lumaByY = [];

      for (let x = 0; x < sampleWidth; x += 1) {
        let total = 0;
        let count = 0;
        for (let y = yStart; y < yEnd; y += 2) {
          const index = ((y * sampleWidth) + x) * 4;
          total += (frame[index] * 0.2126) + (frame[index + 1] * 0.7152) + (frame[index + 2] * 0.0722);
          count += 1;
        }
        lumaByX.push(total / Math.max(1, count));
      }

      for (let y = 0; y < sampleHeight; y += 1) {
        let total = 0;
        let count = 0;
        for (let x = Math.floor(sampleWidth * 0.18); x < Math.ceil(sampleWidth * 0.82); x += 2) {
          const index = ((y * sampleWidth) + x) * 4;
          total += (frame[index] * 0.2126) + (frame[index + 1] * 0.7152) + (frame[index + 2] * 0.0722);
          count += 1;
        }
        lumaByY.push(total / Math.max(1, count));
      }

      const average = (values, start, end) => {
        const sample = values.slice(start, end);
        return sample.reduce((sum, value) => sum + value, 0) / Math.max(1, sample.length);
      };

      const detectActiveBounds = (values, threshold, stride = 4) => {
        let start = 0;
        let end = values.length - 1;
        for (let index = 0; index < values.length; index += 1) {
          if (average(values, index, Math.min(values.length, index + stride)) > threshold) {
            start = index;
            break;
          }
        }
        for (let index = values.length - 1; index >= 0; index -= 1) {
          if (average(values, Math.max(0, index - stride + 1), index + 1) > threshold) {
            end = index;
            break;
          }
        }
        return { start, end, ratio: (end - start + 1) / values.length };
      };

      const edgeBand = Math.max(8, Math.floor(sampleWidth * 0.035));
      const centerStart = Math.floor(sampleWidth * 0.42);
      const centerEnd = Math.ceil(sampleWidth * 0.58);
      const verticalEdgeBand = Math.max(6, Math.floor(sampleHeight * 0.055));
      const verticalCenterStart = Math.floor(sampleHeight * 0.42);
      const verticalCenterEnd = Math.ceil(sampleHeight * 0.58);
      const leftEdge = average(lumaByX, 0, edgeBand);
      const rightEdge = average(lumaByX, sampleWidth - edgeBand, sampleWidth);
      const topEdge = average(lumaByY, 0, verticalEdgeBand);
      const bottomEdge = average(lumaByY, sampleHeight - verticalEdgeBand, sampleHeight);
      const center = average(lumaByX, centerStart, centerEnd);
      const verticalCenter = average(lumaByY, verticalCenterStart, verticalCenterEnd);

      if (center < 28 && verticalCenter < 28) return baseEdgeScale();

      const activeThreshold = Math.max(24, center * 0.18);
      const activeVerticalThreshold = Math.max(24, verticalCenter * 0.18);
      const widthBounds = leftEdge <= 24 || rightEdge <= 24 ? detectActiveBounds(lumaByX, activeThreshold) : { ratio: 1 };
      const heightBounds = topEdge <= 24 || bottomEdge <= 24 ? detectActiveBounds(lumaByY, activeVerticalThreshold, 3) : { ratio: 1 };
      const sideScale = widthBounds.ratio < 0.95 ? (1 / widthBounds.ratio) + 0.035 : baseEdgeScale();
      const letterboxScale = heightBounds.ratio < 0.985 ? (1 / heightBounds.ratio) + 0.12 : baseEdgeScale();
      const detectedScale = Math.max(sideScale, letterboxScale, baseEdgeScale());
      return clamp(detectedScale, baseEdgeScale(), MAX_DETECTED_EDGE_SCALE);
    } catch {
      return baseEdgeScale();
    }
  }

  function scheduleEdgeCropScan(video, delay = 360) {
    if (!video) return;
    window.setTimeout(() => {
      if (!video || video.readyState < 2) return;
      const now = window.performance?.now?.() || Date.now();
      if (delay === 0 && now - edgeCropLastScanAt < 320) return;
      edgeCropLastScanAt = now;
      const detectedScale = detectEdgeMatteScale(video);
      const currentScale = Number(playerMount.dataset.edgeCropScale || baseEdgeScale());
      if (detectedScale > currentScale + 0.006 || !playerMount.dataset.edgeCropScale) {
        applyEdgeCropScale(detectedScale, detectedScale > baseEdgeScale() ? "detected-edge-matte" : "baseline");
      }
    }, delay);
  }

  function setMusicTelevisionMetadata() {
    if (!("mediaSession" in window.navigator) || !window.MediaMetadata) return;

    window.navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || "Adaptive Environment Music Television",
    });
  }

  async function typeLine(line) {
    const text = line.dataset.adaptiveTypewriterText || line.textContent || "";
    const glyphs = Array.from(text);
    const duration = Number(line.dataset.adaptiveTypewriterDuration || 1500);
    const speed = glyphs.length ? duration / glyphs.length : duration;

    line.textContent = "";
    line.classList.add("is-typing");
    line.classList.remove("is-typed");

    for (const glyph of glyphs) {
      line.textContent += glyph;
      await wait(speed);
    }

    line.classList.remove("is-typing");
    line.classList.add("is-typed");
    await wait(320);
  }

  async function runIntro() {
    document.body.classList.remove("adaptive-typewriter-complete");

    typewriterLines.forEach((line) => {
      line.textContent = "";
      line.classList.remove("is-typing", "is-typed");
    });

    await wait(620);

    contextLines.forEach((line, index) => {
      window.setTimeout(() => line.classList.add("is-context-visible"), index * 230);
    });

    await wait(900);

    for (const line of typewriterLines) {
      await typeLine(line);
    }

    document.body.classList.add("adaptive-typewriter-complete");
  }

  function createFashionVideo(runwayIndex) {
    const runway = fashionRunways[runwayIndex];
    const video = document.createElement("video");
    video.className = "adaptive-television-fashion-video";
    video.controls = false;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.preload = "auto";
    video.__iamFashionSource = runway.videoSrc;
    video.dataset.streamMaxHeight = "720";
    video.dataset.streamPreloadTarget = "12";
    video.setAttribute("aria-hidden", "true");
    return video;
  }

  function stopFashionHeroMirror() {
    fashionHeroGeneration += 1;
    if (fashionHeroFallbackTimer) {
      window.clearTimeout(fashionHeroFallbackTimer);
      fashionHeroFallbackTimer = 0;
    }
    if (fashionHeroVideoFrame && fashionHeroVideoFrameSource?.cancelVideoFrameCallback) {
      try { fashionHeroVideoFrameSource.cancelVideoFrameCallback(fashionHeroVideoFrame); } catch {}
    }
    fashionHeroVideoFrame = 0;
    fashionHeroVideoFrameSource = null;
    fashionHeroLastMediaTime = -1;
    if (fashionHeroFrame) fashionHeroFrame.dataset.fashionHeroMirror = "inactive";
  }

  function drawFashionHeroFrame(mediaTime = Number(fashionVideo?.currentTime || 0)) {
    if (!fashionHeroCanvas || !fashionHeroContext || !fashionVideo || fashionVideo.readyState < 2) return;
    const sourceWidth = fashionVideo.videoWidth;
    const sourceHeight = fashionVideo.videoHeight;
    const frameWidth = fashionHeroFrame?.clientWidth || 0;
    const frameHeight = fashionHeroFrame?.clientHeight || 0;
    if (!sourceWidth || !sourceHeight || !frameWidth || !frameHeight) return;

    const pixelRatio = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    const targetWidth = Math.max(1, Math.round(frameWidth * pixelRatio));
    const targetHeight = Math.max(1, Math.round(frameHeight * pixelRatio));
    const needsResize = fashionHeroCanvas.width !== targetWidth || fashionHeroCanvas.height !== targetHeight;
    if (!needsResize && Math.abs(Number(mediaTime) - fashionHeroLastMediaTime) < 0.0005) return;
    if (needsResize) {
      fashionHeroCanvas.width = targetWidth;
      fashionHeroCanvas.height = targetHeight;
    }

    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;
    let cropX = 0;
    let cropY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      cropX = (sourceWidth - cropWidth) / 2;
    } else if (sourceRatio < targetRatio) {
      cropHeight = sourceWidth / targetRatio;
      cropY = (sourceHeight - cropHeight) / 2;
    }

    try {
      fashionHeroContext.clearRect(0, 0, targetWidth, targetHeight);
      fashionHeroContext.drawImage(
        fashionVideo,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );
      fashionHeroLastMediaTime = Number(mediaTime);
      fashionHeroDrawCount += 1;
      fashionHeroFrame.dataset.fashionHeroMirror = "ready";
      fashionHeroFrame.dataset.fashionHeroPixelRatio = pixelRatio.toFixed(2);
      fashionHeroFrame.dataset.fashionHeroDrawCount = String(fashionHeroDrawCount);
      fashionHeroFrame.dataset.fashionHeroMediaTime = fashionHeroLastMediaTime.toFixed(3);
      delete fashionHeroFrame.dataset.fashionHeroError;
    } catch (error) {
      fashionHeroFrame.dataset.fashionHeroMirror = "error";
      fashionHeroFrame.dataset.fashionHeroError = String(error?.message || error).slice(0, 160);
    }
  }

  function scheduleFashionHeroMirror(generation) {
    if (generation !== fashionHeroGeneration || !document.body.classList.contains("television-emdr-gif-active")) return;

    if (fashionVideo?.requestVideoFrameCallback && !fashionVideo.paused && fashionVideo.readyState >= 2) {
      fashionHeroVideoFrameSource = fashionVideo;
      fashionHeroVideoFrame = fashionVideo.requestVideoFrameCallback((_now, metadata) => {
        fashionHeroVideoFrame = 0;
        drawFashionHeroFrame(metadata?.mediaTime);
        scheduleFashionHeroMirror(generation);
      });
      return;
    }

    const fallbackDelay = fashionVideo?.paused ? 250 : 42;
    fashionHeroFallbackTimer = window.setTimeout(() => {
      fashionHeroFallbackTimer = 0;
      drawFashionHeroFrame();
      scheduleFashionHeroMirror(generation);
    }, fallbackDelay);
  }

  function startFashionHeroMirror() {
    stopFashionHeroMirror();
    if (fashionHeroFrame) fashionHeroFrame.dataset.fashionHeroMirror = "starting";
    const generation = fashionHeroGeneration;
    drawFashionHeroFrame();
    scheduleFashionHeroMirror(generation);
  }

  function mountPlayer() {
    if (localVideo) return localVideo;

    playerMount.classList.remove("is-embed-blocked");
    playerMount.innerHTML = "";
    edgeCropLastScanAt = 0;
    applyEdgeCropScale(baseEdgeScale(), "initial");

    fashionVideo = createFashionVideo(fashionRunwayIndex);
    fashionVideo.classList.add("is-fashion-active");
    updateFashionRunwayToggle();

    fashionHeroFrame = document.createElement("div");
    fashionHeroFrame.className = "adaptive-television-fashion-hero-frame";
    fashionHeroCanvas = document.createElement("canvas");
    fashionHeroCanvas.className = "adaptive-television-fashion-hero-canvas";
    fashionHeroCanvas.setAttribute("aria-hidden", "true");
    fashionHeroContext = fashionHeroCanvas.getContext("2d", { alpha: false });
    fashionHeroFrame.append(fashionHeroCanvas);

    localVideoFrame = document.createElement("div");
    localVideoFrame.className = "adaptive-television-local-video-frame";

    localVideo = document.createElement("video");
    localVideo.className = "adaptive-television-local-video";
    localVideo.controls = false;
    localVideo.crossOrigin = "anonymous";
    localVideo.playsInline = false;
    localVideo.preload = shouldAutoPreloadVideo() ? "auto" : "metadata";
    localVideo.controlsList = "nodownload noplaybackrate";
    localVideo.disablePictureInPicture = true;
    localVideo.setAttribute("aria-label", `${track.artist} - ${track.title}`);

    localVideo.addEventListener("canplay", () => {
      playerMount.classList.add("is-local-video-ready");
      scheduleEdgeCropScan(localVideo, 120);
    }, { once: true });

    localVideo.addEventListener("waiting", () => {
      playerMount.classList.add("is-local-video-waiting");
    });

    localVideo.addEventListener("playing", () => {
      playerMount.classList.add("is-local-video-ready");
      playerMount.classList.remove("is-local-video-waiting");
      localVideo.dataset.televisionStreamPlay = "playing";
      delete localVideo.dataset.televisionStreamError;
      scheduleEdgeCropScan(localVideo, 480);
    });

    localVideo.addEventListener("error", () => {
      playerMount.classList.add("is-local-video-error");
      mountYouTubeFallback();
    });

    localVideo.addEventListener("loadedmetadata", () => {
      updateTimecode();
      scheduleEdgeCropScan(localVideo, 260);
    });
    localVideo.addEventListener("timeupdate", () => {
      updateTimecode();
      scheduleEdgeCropScan(localVideo, 0);
    });
    localVideo.addEventListener("timeupdate", revealLearnCueWhenReady);
    localVideo.addEventListener("ended", startTelevisionContinuation);

    timecode = document.createElement("div");
    timecode.className = "adaptive-television-timecode";
    timecode.setAttribute("aria-hidden", "true");
    timecode.textContent = "0:00";

    localVideoFrame.append(localVideo);
    playerMount.append(localVideoFrame);
    playerMount.append(fashionVideo);
    playerMount.append(fashionHeroFrame);
    playerMount.append(timecode);
    attachAdaptiveStream(localVideo, track.localVideoSrc, "music");
    if (televisionPlaybackRequested) ensureFashionStreamAttached();
    return localVideo;
  }

  function ensureFashionStreamAttached(video = fashionVideo) {
    if (!video) return Promise.resolve(null);
    if (video.__iamStreamAttachPromise) return video.__iamStreamAttachPromise;
    return attachAdaptiveStream(video, video.__iamFashionSource || continuation.videoSrc, "fashion", {
      preload: true,
      preloadTargetSeconds: 12,
    });
  }

  function attachAdaptiveStream(video, source, role, streamOptions = {}) {
    const fileName = String(source || "").split("/").pop();
    video.dataset.televisionStreamAttach = "waiting";
    const attach = async () => {
      if (window.IAMStreamController?.assetFor(fileName)) {
        const autoplay = streamOptions.preload
          ? false
          : video.autoplay ||
            televisionPlaybackRequested ||
            document.body.classList.contains("television-room-opening") ||
            document.body.classList.contains("television-room-open");
        await window.IAMStreamController.attach(video, {
          fileName,
          role,
          autoplay,
          preload: Boolean(streamOptions.preload),
          preloadTargetSeconds: streamOptions.preloadTargetSeconds,
        });
      } else {
        video.src = source;
        video.load();
      }
      video.dataset.televisionStreamAttach = "attached";
      return video;
    };
    video.__iamStreamAttachPromise = window.IAMStreamReady?.then
      ? window.IAMStreamReady.then(attach)
      : Promise.resolve(attach());
    video.__iamStreamAttachPromise.catch((error) => {
      video.dataset.televisionStreamAttach = "error";
      video.dataset.televisionStreamError = String(error?.message || error).slice(0, 160);
    });
    return video.__iamStreamAttachPromise;
  }

  function playWhenStreamAttached(video, role) {
    if (!video) return Promise.resolve();

    const playAttachedVideo = () => {
      if (role === "fashion") {
        window.IAMStreamController?.setFashionActive(video, true);
      }
      const playAttempt = window.IAMStreamController?.play(video) || video.play();
      playAttempt?.catch?.((error) => {
        video.dataset.televisionStreamPlay = "blocked";
        video.dataset.televisionStreamError = String(error?.message || error).slice(0, 160);
      });
      video.dataset.televisionStreamPlay = "requested";
      return playAttempt;
    };

    // Keep the music play() call inside the original click gesture whenever
    // preloading has already completed; Safari otherwise rejects the deferred
    // microtask even though the viewer just pressed play.
    if (video.dataset.televisionStreamAttach === "attached") {
      return playAttachedVideo();
    }

    const attached = video.__iamStreamAttachPromise || Promise.resolve(video);
    return attached.then(playAttachedVideo);
  }

  function mountYouTubeFallback() {
    if (!track.youtubeVideoId || playerMount.querySelector("iframe")) return;

    const iframe = document.createElement("iframe");
    iframe.className = "adaptive-television-youtube-fallback";
    iframe.title = `${track.artist} - ${track.title}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(track.youtubeVideoId)}?autoplay=1&controls=1&playsinline=1&rel=0`;
    playerMount.append(iframe);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const wholeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(wholeSeconds / 60);
    const remainingSeconds = String(wholeSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }

  function updateTimecode() {
    if (!timecode || !localVideo) return;

    timecode.textContent = formatTime(localVideo.currentTime);
  }

  function updateLiveRegionCounts(total) {
    if (!liveRegionCounts.length) return;

    const roundedTotal = Math.max(0, Math.round(total));
    const rawCounts = liveRegionCounts.map((count, index) => {
      const baseWeight = Number(count.dataset.regionWeight || 0.1);
      const shimmer = 0.88 + (Math.random() * 0.24);
      const weighted = Math.max(0, Math.round(roundedTotal * baseWeight * shimmer));
      return { count, index, value: weighted };
    });

    let runningTotal = rawCounts.reduce((sum, item) => sum + item.value, 0);

    while (runningTotal !== roundedTotal) {
      const needsIncrease = runningTotal < roundedTotal;
      const candidate = rawCounts
        .slice()
        .sort((a, b) => needsIncrease ? b.value - a.value : a.value - b.value)
        .find((item) => needsIncrease || item.value > 0) || rawCounts[0];

      candidate.value += needsIncrease ? 1 : -1;
      runningTotal += needsIncrease ? 1 : -1;
    }

    rawCounts
      .sort((a, b) => a.index - b.index)
      .forEach((item) => {
        item.count.textContent = String(item.value);
      });
  }

  function renderLiveViewerCount() {
    liveViewerCounts.forEach((count) => {
      count.textContent = String(Math.round(liveViewerCountValue));
    });
  }

  function ensureCommunityGlobeLoaded() {
    if (!communityGlobeFrame || communityGlobeFrame.getAttribute("src")) return;
    const source = communityGlobeFrame.dataset.src;
    if (source) communityGlobeFrame.setAttribute("src", source);
  }

  function openCommunityGlobe(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!communityOverlay) return;
    ensureCommunityGlobeLoaded();
    communityPreviousFocus = document.activeElement;
    setReactionWalletOpen(false);
    communityOverlay.setAttribute("aria-hidden", "false");
    livePill?.setAttribute("aria-expanded", "true");
    document.body.classList.add("community-globe-open");
    window.setTimeout(() => communityGlobeClose?.focus({ preventScroll: true }), 80);
  }

  function closeCommunityGlobe(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!communityOverlay) return;
    communityOverlay.setAttribute("aria-hidden", "true");
    livePill?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("community-globe-open");
    if (communityPreviousFocus?.focus) {
      communityPreviousFocus.focus({ preventScroll: true });
    } else {
      livePill?.focus({ preventScroll: true });
    }
  }

  function startLiveViewerSimulation() {
    if (!liveViewerCounts.length || liveViewerInterval) return;

    liveViewerCountValue = 6;
    renderLiveViewerCount();
    updateLiveRegionCounts(liveViewerCountValue);

    liveViewerInterval = window.setInterval(() => {
      const distanceToCap = 333 - liveViewerCountValue;
      const growth = distanceToCap > 70 ? 5 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 7);
      const ebb = liveViewerCountValue > 42 && Math.random() < 0.28 ? Math.floor(Math.random() * 5) : 0;
      const shimmer = Math.random() < 0.18 ? -1 : 0;
      liveViewerCountValue = clamp(liveViewerCountValue + growth - ebb + shimmer, 6, 333);

      if (liveViewerCountValue >= 333 && Math.random() < 0.42) {
        liveViewerCountValue = 330 + Math.floor(Math.random() * 4);
      }

      renderLiveViewerCount();
      updateLiveRegionCounts(liveViewerCountValue);
    }, 2400);
  }

  function reactionToken(type) {
    if (type === "flora") return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--ioh-logo adaptive-television-reaction__glyph--flora-flower"></span>';
    if (type === "daisy") return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--flower adaptive-television-reaction__glyph--daisy"></span>';
    if (type === "aboriginal") return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--flower adaptive-television-reaction__glyph--aboriginal-flower"></span>';
    if (type === "trans") return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--flower adaptive-television-reaction__glyph--trans-flower"></span>';
    if (type === "dove") return '<svg class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--peace-dove-icon" viewBox="0 0 64 40" aria-hidden="true" focusable="false"><path class="peace-dove-icon__wing-back" d="M34 17C42 8 51 4 60 5C53 14 46 20 37 24Z" /><path class="peace-dove-icon__wing-front" d="M31 18C36 6 45 1 55 0C50 12 43 20 34 28Z" /><path class="peace-dove-icon__body" d="M10 23C18 12 31 11 43 19C49 23 56 22 62 17C59 25 52 30 43 30C33 31 23 30 14 34C16 30 15 26 10 23Z" /><path class="peace-dove-icon__head" d="M7 17C10 11 17 10 21 15C17 16 14 18 11 22Z" /><path class="peace-dove-icon__beak" d="M7 17L1 15L6 20Z" /><path class="peace-dove-icon__branch" d="M8 21C4 24 2 27 0 31M4 25L2 22M5 25L7 23" /></svg>';
    if (type === "lily") return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--flower adaptive-television-reaction__glyph--lily-flower"></span>';
    if (type === "medallion") return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--flower adaptive-television-reaction__glyph--service-flower"></span>';
    return '<span class="adaptive-television-reaction__glyph adaptive-television-reaction__glyph--flower adaptive-television-reaction__glyph--daisy"></span>';
  }

  function appendReactionToken(heart, type) {
    if (type === "flora") {
      heart.append(floraReactionToken.cloneNode(false));
      return;
    }

    heart.innerHTML = reactionToken(type);
  }

  function reactionPalette(type) {
    if (type === "flora") return ["#2f9dff", "#52d767", "#ff4aa3", "#ffe34f"];
    if (type === "daisy") return ["#52d767", "#2f9dff", "#ffe34f", "#ff4aa3"];
    if (type === "aboriginal") return ["#ffd338", "#c62426", "#111111", "#ffe48a"];
    if (type === "trans") return ["#5bcffa", "#f5a9b8", "#ffffff", "#d7f4ff"];
    if (type === "dove" || type === "lily") return ["#ffffff", "#e8f1ff", "#dfe8ff", "#fff7fb"];
    if (type === "medallion") return ["#f4d47d", "#d8ac3f", "#fff0b8", "#b8892c"];
    return ["#fff064", "#ff4aa3", "#45c7ff", "#ffffff", "#7cff73"];
  }

  function createReaction(index, total, type) {
    const heart = document.createElement("span");
    const clusterCenters = [18, 50, 82];
    const cluster = index % clusterCenters.length;
    const lane = clusterCenters[cluster] + ((Math.random() - 0.5) * 24);
    const palette = reactionPalette(type);
    const size = 10 + Math.random() * 16;
    const rise = 54 + Math.random() * 50;
    const drift = (Math.random() - 0.5) * (22 + Math.random() * 36);
    const duration = 3600 + Math.random() * 2300;
    const delay = type === "flora" ? Math.floor(index / clusterCenters.length) * 2 : Math.floor(index / clusterCenters.length) * (18 + Math.random() * 16);

    heart.className = `adaptive-television-floating-reaction adaptive-television-floating-reaction--${type || "daisy"}`;
    appendReactionToken(heart, type);
    heart.style.setProperty("--heart-x", `${clamp(lane, 3, 97).toFixed(2)}vw`);
    heart.style.setProperty("--heart-y", `${(type === "flora" ? -10 - Math.random() * 6 : -4 - Math.random() * 10).toFixed(2)}vh`);
    heart.style.setProperty("--heart-size", `${size.toFixed(1)}px`);
    heart.style.setProperty("--heart-rise", `${rise.toFixed(1)}vh`);
    heart.style.setProperty("--heart-drift", `${drift.toFixed(1)}vw`);
    heart.style.setProperty("--heart-scale", (0.82 + Math.random() * 0.92).toFixed(2));
    heart.style.setProperty("--heart-rotate", `${(-34 + Math.random() * 68).toFixed(1)}deg`);
    heart.style.setProperty("--heart-spin", `${(-28 + Math.random() * 56).toFixed(1)}deg`);
    heart.style.setProperty("--heart-duration", `${duration.toFixed(0)}ms`);
    heart.style.setProperty("--heart-spin-duration", `${(type === "flora" ? 3600 + Math.random() * 1800 : 760 + Math.random() * 1280).toFixed(0)}ms`);
    heart.style.setProperty("--heart-opacity", (0.5 + Math.random() * 0.38).toFixed(2));
    heart.style.setProperty("--heart-color", palette[Math.floor(Math.random() * palette.length)]);
    heart.style.animationDelay = `${delay.toFixed(0)}ms`;
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
    return heart;
  }

  function spawnReaction(index, total, type) {
    if (!heartField) return;
    heartField.append(createReaction(index, total, type));
  }

  function spawnDroppedFlower(index, total) {
    if (!heartField) return;

    const flower = document.createElement("span");
    const sweep = total > 1 ? index / (total - 1) : 0.5;
    const x = 96 - (sweep * 94) + ((Math.random() - 0.5) * 7);
    const y = 10 + (Math.sin(sweep * Math.PI) * 18) + (Math.random() * 11);
    const size = 10 + Math.random() * 12;
    const delay = 420 + (index * (28 + Math.random() * 10));

    flower.className = "adaptive-television-dropped-flower adaptive-television-dropped-flower--lily";
    flower.innerHTML = reactionToken("lily");
    flower.style.setProperty("--drop-x", `${clamp(x, 8, 92).toFixed(2)}vw`);
    flower.style.setProperty("--drop-y", `${y.toFixed(2)}vh`);
    flower.style.setProperty("--drop-size", `${size.toFixed(1)}px`);
    flower.style.setProperty("--drop-drift", `${((Math.random() - 0.5) * 22).toFixed(1)}vw`);
    flower.style.setProperty("--drop-fall", `${(44 + Math.random() * 38).toFixed(1)}vh`);
    flower.style.setProperty("--drop-scale", (0.7 + Math.random() * 0.55).toFixed(2));
    flower.style.setProperty("--drop-rotate", `${(-40 + Math.random() * 80).toFixed(1)}deg`);
    flower.style.setProperty("--drop-spin", `${(-160 + Math.random() * 320).toFixed(1)}deg`);
    flower.style.setProperty("--drop-duration", `${(3900 + Math.random() * 1600).toFixed(0)}ms`);
    flower.style.setProperty("--drop-spin-duration", `${(680 + Math.random() * 1040).toFixed(0)}ms`);
    flower.style.animationDelay = `${delay.toFixed(0)}ms`;
    flower.addEventListener("animationend", () => flower.remove(), { once: true });
    heartField.append(flower);
  }

  function releaseDoveFlowerDrop() {
    if (!heartField || heartBurstActive) return;

    heartBurstActive = true;
    heartField.replaceChildren();

    const dove = document.createElement("span");
    dove.className = "adaptive-television-dove-sweep";
    dove.setAttribute("aria-hidden", "true");
    dove.innerHTML = `
      <svg class="adaptive-television-dove-sweep__svg" viewBox="0 0 190 92" aria-hidden="true" focusable="false">
        <g class="adaptive-television-dove-sweep__bird">
          <path class="adaptive-television-dove-sweep__tail" d="M155 48 C171 38 183 34 189 32 C181 43 172 51 159 56 C174 58 183 64 190 72 C173 71 159 66 147 57 Z"></path>
          <path class="adaptive-television-dove-sweep__body" d="M39 50 C53 34 83 30 112 39 C130 44 145 52 160 53 C142 65 117 69 88 65 C65 62 47 57 39 50 Z"></path>
          <path class="adaptive-television-dove-sweep__neck" d="M44 49 C37 42 32 39 24 39 C31 33 43 33 52 40 C54 43 53 47 49 51 Z"></path>
          <path class="adaptive-television-dove-sweep__head" d="M18 39 C11 35 7 29 9 23 C18 27 26 31 30 39 C26 43 21 43 18 39 Z"></path>
          <path class="adaptive-television-dove-sweep__beak" d="M9 25 L0 20 L10 18 Z"></path>
          <circle class="adaptive-television-dove-sweep__eye" cx="18" cy="30" r="1.7"></circle>
          <g class="adaptive-television-dove-sweep__wing adaptive-television-dove-sweep__wing--far">
            <path d="M72 43 C85 17 116 8 143 13 C130 26 109 39 81 50 Z"></path>
            <path d="M84 43 C101 31 119 23 139 17"></path>
          </g>
          <g class="adaptive-television-dove-sweep__wing adaptive-television-dove-sweep__wing--near">
            <path d="M66 45 C78 8 116 -6 154 8 C136 29 108 48 76 58 Z"></path>
            <path d="M80 45 C101 28 122 16 149 8"></path>
            <path d="M75 53 C99 45 120 34 140 19"></path>
          </g>
          <g class="adaptive-television-dove-sweep__branch">
            <path d="M4 22 C-8 21 -16 25 -25 30"></path>
            <path d="M-12 26 C-16 20 -21 18 -26 17"></path>
            <path d="M-11 26 C-16 30 -21 32 -27 33"></path>
            <circle cx="-29" cy="32" r="4"></circle>
            <circle cx="-29" cy="24" r="4"></circle>
            <circle cx="-36" cy="28" r="4"></circle>
            <circle cx="-22" cy="28" r="4"></circle>
          </g>
        </g>
      </svg>
    `;
    dove.addEventListener("animationend", () => dove.remove(), { once: true });
    heartField.append(dove);

    const total = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 24 : 108;
    for (let index = 0; index < total; index += 1) spawnDroppedFlower(index, total);

    window.setTimeout(() => {
      heartBurstActive = false;
    }, 4300);
  }

  function releaseReactionFlood(type = "daisy") {
    if (!heartField || heartBurstActive) return;

    if (type === "dove") {
      releaseDoveFlowerDrop();
      return;
    }

    heartBurstActive = true;
    heartField.replaceChildren();

    const total = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 22 : 86;
    const burst = document.createDocumentFragment();
    for (let index = 0; index < total; index += 1) burst.append(createReaction(index, total, type));
    heartField.append(burst);

    window.setTimeout(() => {
      heartBurstActive = false;
    }, 1900);
  }

  function clearResearchTimer(timerMap, host) {
    const timer = timerMap.get(host);
    if (timer) window.clearTimeout(timer);
    timerMap.delete(host);
  }

  function closeResearchRollover(host) {
    clearResearchTimer(researchRolloverCloseTimers, host);
    clearResearchTimer(researchDetailsCloseTimers, host);
    host.classList.remove(
      "is-research-rollover-open",
      "is-research-details-active",
      "is-research-details-pinned"
    );
    host.querySelector(".adaptive-television-research-tooltip__more")?.setAttribute("aria-expanded", "false");
  }

  function closeAllResearchRollovers(exceptHost = null) {
    researchRolloverHosts.forEach((host) => {
      if (host !== exceptHost) closeResearchRollover(host);
    });
  }

  function openResearchRollover(host) {
    clearResearchTimer(researchRolloverCloseTimers, host);
    closeAllResearchRollovers(host);
    host.classList.add("is-research-rollover-open");
  }

  function scheduleResearchRolloverClose(host) {
    clearResearchTimer(researchRolloverCloseTimers, host);
    if (host.classList.contains("is-research-details-pinned")) return;
    host.classList.add("is-research-rollover-open");
    const timer = window.setTimeout(() => {
      closeResearchRollover(host);
    }, RESEARCH_ROLLOVER_CLOSE_DELAY_MS);
    researchRolloverCloseTimers.set(host, timer);
  }

  function openResearchDetails(host) {
    clearResearchTimer(researchDetailsCloseTimers, host);
    host.classList.add("is-research-details-active");
    host.querySelector(".adaptive-television-research-tooltip__more")?.setAttribute("aria-expanded", "true");
  }

  function scheduleResearchDetailsClose(host) {
    clearResearchTimer(researchDetailsCloseTimers, host);
    if (host.classList.contains("is-research-details-pinned")) return;
    const timer = window.setTimeout(() => {
      host.classList.remove("is-research-details-active");
      host.querySelector(".adaptive-television-research-tooltip__more")?.setAttribute("aria-expanded", "false");
    }, RESEARCH_ROLLOVER_CLOSE_DELAY_MS);
    researchDetailsCloseTimers.set(host, timer);
  }

  function researchRolloverIsArmed() {
    return Boolean(reactionWallet?.classList.contains("is-video-tooltip-armed"));
  }

  function setWalletView(nextView) {
    if (!reactionWallet) return;
    if (nextView !== "video-mix" && fashionShelfOpen) closeFashionShelf(false);
    if (nextView !== "music" && musicShelfOpen) closeMusicShelf(false);
    if (nextView !== walletView) closeAllResearchRollovers();
    walletView = nextView;
    reactionWallet.dataset.walletView = nextView;
    const isOpen = nextView !== "closed";
    reactionWallet.classList.toggle("is-reaction-wallet-open", isOpen && nextView !== "audio");
    reactionWallet.classList.remove("is-reaction-wallet-closing");
    reactionWalletTrigger?.setAttribute("aria-expanded", String(isOpen));
    walletCategories?.setAttribute("aria-hidden", String(nextView !== "categories"));
    walletCategoryButtons.forEach((button) => {
      const active = button.dataset.walletCategory === nextView;
      button.setAttribute("aria-expanded", String(active));
      button.tabIndex = nextView === "categories" ? 0 : -1;
    });
    walletPanels.forEach((panel) => {
      const active = panel.dataset.walletPanel === nextView;
      panel.setAttribute("aria-hidden", String(!active));
    });
    if (nowPlaying) {
      const active = nextView === "categories";
      nowPlaying.setAttribute("aria-hidden", String(!active));
      nowPlaying.tabIndex = active ? 0 : -1;
      if (active) nowPlayingInteractiveAt = Date.now() + 420;
    }
    reactionButtons.forEach((button) => {
      button.tabIndex = nextView === "emoji" ? 0 : -1;
    });
    if (nextView === "categories") updateNowPlayingOverflow();
  }

  function currentNowPlayingMedia() {
    const radioActive = Boolean(activeRadioStationId && document.body.classList.contains("television-radio-continuation"));
    if (radioActive) {
      const station = radioStationRecords.find((candidate) => candidate.id === activeRadioStationId) || stationForId(activeRadioStationId);
      return {
        mode: "radio",
        label: station?.display_title || station?.title || "Universal Mind Radio",
      };
    }
    return {
      mode: track.presentation === "live_dj_set" ? "parties" : "videos",
      label: `${track.displayArtist || track.artist} — ${track.displayTitle || track.title}`,
    };
  }

  function updateNowPlayingClock() {
    if (!nowPlayingTime) return;
    const now = new Date();
    nowPlayingTime.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    nowPlayingTime.dateTime = now.toISOString();
  }

  function updateNowPlayingOverflow() {
    if (!nowPlaying || !nowPlayingViewport || !nowPlayingTrack) return;
    window.requestAnimationFrame(() => {
      const overflow = Math.max(0, nowPlayingTrack.scrollWidth - nowPlayingViewport.clientWidth);
      nowPlaying.classList.toggle("is-overflowing", overflow > 4);
      nowPlaying.style.setProperty("--now-playing-overflow", `${-Math.ceil(overflow)}px`);
    });
  }

  function updateNowPlaying() {
    if (!nowPlaying) return;
    const media = currentNowPlayingMedia();
    const radioState = document.body.dataset.radioPlaybackState || "stopped";
    const status = media.mode === "radio"
      ? (radioState === "error" ? "RADIO OFFLINE" : radioState === "loading" ? "TUNING" : "LIVE RADIO")
      : "NOW PLAYING";
    const state = media.mode === "radio"
      ? (radioState === "error" ? "error" : radioState === "loading" ? "loading" : "live")
      : "playing";
    const modeLabel = media.mode === "parties" ? "PARTY" : media.mode === "radio" ? "RADIO" : "VIDEO";
    const activeRunway = fashionRunways[fashionRunwayIndex];
    const fashionVisible = Boolean(activeRunway && requestedVideoBlend < 99.5);

    if (nowPlayingStatus) nowPlayingStatus.textContent = status;
    if (nowPlayingMode) nowPlayingMode.textContent = modeLabel;
    if (nowPlayingTitle) nowPlayingTitle.textContent = media.label;
    if (nowPlayingVisual) nowPlayingVisual.hidden = !fashionVisible;
    if (nowPlayingVisualTitle) nowPlayingVisualTitle.textContent = fashionVisible ? activeRunway.title : "";
    nowPlaying.dataset.nowPlayingState = state;
    nowPlaying.dataset.nowPlayingMode = media.mode;
    nowPlaying.setAttribute(
      "aria-label",
      `Open ${modeLabel.toLowerCase()} recommendations. ${status}: ${media.label}${fashionVisible ? `. Visual: ${activeRunway.title}` : ""}`
    );
    updateNowPlayingClock();
    updateNowPlayingOverflow();
  }

  function openNowPlayingRecommendations(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (Date.now() < nowPlayingInteractiveAt) return;
    const media = currentNowPlayingMedia();
    setMusicMode(media.mode, { manual: false });
    setWalletView("music");
    openMusicShelf();
  }

  window.IAMNowPlaying = {
    version: "wallet_now_playing_v1.0",
    getState() {
      const media = currentNowPlayingMedia();
      return {
        time: nowPlayingTime?.textContent || "",
        status: nowPlayingStatus?.textContent || "",
        mode: media.mode,
        title: media.label,
        visual: nowPlayingVisual?.hidden ? "" : (nowPlayingVisualTitle?.textContent || ""),
        overflow: Boolean(nowPlaying?.classList.contains("is-overflowing")),
      };
    },
    refresh: updateNowPlaying,
  };

  function fashionCardsPerView() {
    return window.matchMedia("(max-width: 720px)").matches ? 1 : 3;
  }

  function fashionRunwayOrderPosition(index) {
    const position = fashionShelfOrder.indexOf(index);
    return position >= 0 ? position : index;
  }

  function fashionThumbnailUrl(runway) {
    const host = window.IAMCloudflareStream?.customerHost || "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
    return `https://${host}/${runway.streamUid}/thumbnails/thumbnail.jpg?time=${runway.previewStart}s&height=360`;
  }

  function readFashionTasteProfile() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("iamFashionVisualTasteV1") || "null");
      if (parsed && typeof parsed === "object") {
        return {
          affinities: parsed.affinities && typeof parsed.affinities === "object" ? parsed.affinities : {},
          recentAssetKeys: Array.isArray(parsed.recentAssetKeys) ? parsed.recentAssetKeys : [],
          lastAssetKey: String(parsed.lastAssetKey || ""),
          lastSelectedAt: Number(parsed.lastSelectedAt || 0),
        };
      }
    } catch {
      // Use a fresh local preference profile when storage is unavailable.
    }
    return { affinities: {}, recentAssetKeys: [], lastAssetKey: "", lastSelectedAt: 0 };
  }

  function writeFashionTasteProfile(profile) {
    try {
      window.localStorage.setItem("iamFashionVisualTasteV1", JSON.stringify(profile));
    } catch {
      // Selection still works when local storage is unavailable.
    }
  }

  function persistFashionSelection(source = fashionSelectionSource) {
    const runway = fashionRunways[fashionRunwayIndex];
    fashionSelectionSource = source === "manual" ? "manual" : "algorithm";
    document.body.dataset.fashionRunway = runway.assetKey;
    document.body.dataset.fashionSelectionSource = fashionSelectionSource;
    playerMount.dataset.fashionRunway = runway.assetKey;
    try {
      window.sessionStorage.setItem("iamFashionVisualStateV1", JSON.stringify({
        assetKey: runway.assetKey,
        source: fashionSelectionSource,
        selectedAt: new Date().toISOString(),
      }));
    } catch {
      // The active visual remains available in memory when storage is restricted.
    }
  }

  function scheduleFashionDwellFeedback() {
    window.clearTimeout(fashionDwellTimer);
    const assetKey = fashionRunways[fashionRunwayIndex]?.assetKey;
    fashionDwellTimer = window.setTimeout(() => {
      if (fashionRunways[fashionRunwayIndex]?.assetKey !== assetKey) return;
      const selector = window.IAMFashionVisualSelector;
      const weight = Number(selector?.feedbackWeight?.({ type: "dwell_30_seconds" }) || .45);
      const profile = readFashionTasteProfile();
      profile.affinities[assetKey] = Math.max(0, Math.min(1, Number(profile.affinities[assetKey] || 0) + .08 * weight));
      writeFashionTasteProfile(profile);
    }, 30000);
  }

  function recordFashionSelectionFeedback(index, feedbackType = "explicit_select") {
    const runway = fashionRunways[index];
    if (!runway) return;
    const selector = window.IAMFashionVisualSelector;
    const profile = readFashionTasteProfile();
    const now = Date.now();
    const repeat = profile.lastAssetKey === runway.assetKey;
    const type = repeat ? "repeat_select" : feedbackType;
    const weight = Number(selector?.feedbackWeight?.({ type }) || (repeat ? .85 : 1));
    profile.affinities[runway.assetKey] = Math.max(0, Math.min(1, Number(profile.affinities[runway.assetKey] || 0) + .18 * weight));
    if (!repeat && profile.lastAssetKey && now - profile.lastSelectedAt < 4500) {
      const quickSwitchWeight = Math.abs(Number(selector?.feedbackWeight?.({ type: "quick_switch" }) || -.2));
      profile.affinities[profile.lastAssetKey] = Math.max(0, Number(profile.affinities[profile.lastAssetKey] || 0) - .12 * quickSwitchWeight);
    }
    profile.recentAssetKeys = [runway.assetKey, ...profile.recentAssetKeys.filter((key) => key !== runway.assetKey)].slice(0, 2);
    profile.lastAssetKey = runway.assetKey;
    profile.lastSelectedAt = now;
    writeFashionTasteProfile(profile);
    scheduleFashionDwellFeedback();
  }

  function fashionCitizenNeeds(records) {
    const normalized = normalizedNeedMap(readStoredCitizenInference() || {});
    const result = {};
    const dimensions = new Set();
    records.forEach((record) => Object.keys(record.need_scores || {}).forEach((name) => dimensions.add(name)));
    dimensions.forEach((name) => {
      const value = normalized[normalizeSlug(name)];
      if (Number.isFinite(value)) result[name] = value;
    });
    return result;
  }

  async function rankFashionShelf(options = {}) {
    const selector = window.IAMFashionVisualSelector;
    if (!selector || !fashionTensorRecords.length) return;
    const taste = readFashionTasteProfile();
    const result = selector.rank(fashionTensorRecords, {
      citizenNeeds: fashionCitizenNeeds(fashionTensorRecords),
      tasteAffinities: taste.affinities,
      recentAssetKeys: taste.recentAssetKeys,
      limit: 3,
    });
    const rankedIndexes = result.ranked
      .map((record) => fashionRunways.findIndex((runway) => runway.assetKey === record.asset_key))
      .filter((index) => index >= 0);
    fashionShelfOrder = [...rankedIndexes, ...fashionRunways.map((_runway, index) => index).filter((index) => !rankedIndexes.includes(index))];
    document.body.dataset.fashionRecommendationCount = String(result.recommendations.length);
    document.body.dataset.fashionRecommendationSource = Object.keys(result.supportGoals || {}).length
      ? "citizen_needs"
      : "editorial_and_taste";

    const recommendedIndex = fashionShelfOrder[0] ?? 0;
    if (!options.preserveSelection && fashionSelectionSource !== "manual" && recommendedIndex !== fashionRunwayIndex) {
      if (fashionVideo) await setFashionRunway(recommendedIndex, { source: "algorithm" });
      else {
        fashionRunwayIndex = recommendedIndex;
        persistFashionSelection("algorithm");
      }
    }
    updateFashionRunwayToggle();
    renderFashionShelf();
  }

  async function loadFashionRecommendations() {
    if (!fashionRunwaySelector || !window.IAMFashionVisualSelector) return;
    try {
      const response = await fetch("fashion-visual-tensor-notion-export-v1.0.json?v=fashion-tensor-1", { cache: "no-store" });
      if (!response.ok) throw new Error(`Fashion Tensor fetch failed (${response.status})`);
      const catalogue = await response.json();
      fashionTensorRecords = Array.isArray(catalogue.records) ? catalogue.records : [];
      await rankFashionShelf();
    } catch (error) {
      document.body.dataset.fashionRecommendationSource = "catalogue_fallback";
      document.body.dataset.fashionRecommendationError = String(error?.message || error).slice(0, 120);
      updateFashionRunwayToggle();
      renderFashionShelf();
    }
  }

  function stopFashionShelfPreview() {
    if (!fashionShelfPreviewVideo) return;
    window.IAMStreamController?.setFashionActive(fashionShelfPreviewVideo, false, "fashion_shelf_preview_closed");
    try { fashionShelfPreviewVideo.pause(); } catch {}
    window.IAMStreamController?.detach(fashionShelfPreviewVideo);
    fashionShelfPreviewVideo.remove();
    fashionShelfPreviewCard?.classList.remove("is-previewing");
    fashionShelfPreviewVideo = null;
    fashionShelfPreviewCard = null;
  }

  async function startFashionShelfPreview(card) {
    if (!fashionShelfOpen || !card || card === fashionShelfPreviewCard) return;
    stopFashionShelfPreview();
    const index = Number(card.dataset.fashionRunwayIndex);
    const runway = fashionRunways[index];
    const media = card.querySelector(".adaptive-television-fashion-card__media");
    if (!runway || !media || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const preview = document.createElement("video");
    preview.className = "adaptive-television-fashion-card__preview";
    preview.muted = true;
    preview.defaultMuted = true;
    preview.volume = 0;
    preview.playsInline = true;
    preview.preload = "metadata";
    preview.setAttribute("muted", "");
    preview.setAttribute("aria-hidden", "true");
    preview.dataset.streamRole = "fashion";
    preview.dataset.streamMaxHeight = "360";
    preview.__iamFashionSource = runway.videoSrc;
    fashionShelfPreviewVideo = preview;
    fashionShelfPreviewCard = card;
    card.classList.add("is-previewing");
    media.append(preview);

    const previewStart = runway.previewStart;
    const applyPreviewStart = () => {
      try { preview.currentTime = Math.min(previewStart, Math.max(0, Number(preview.duration || previewStart) - .5)); } catch {}
    };
    preview.addEventListener("loadedmetadata", applyPreviewStart, { once: true });
    preview.addEventListener("timeupdate", () => {
      const end = Math.min(Number(preview.duration || previewStart + 10), previewStart + 10);
      if (preview.currentTime >= end - .08) applyPreviewStart();
    });

    try {
      await window.IAMStreamController?.attach(preview, {
        fileName: runway.videoSrc,
        role: "fashion",
        autoplay: false,
        preload: true,
        preloadTargetSeconds: 10,
      });
      if (preview !== fashionShelfPreviewVideo || !fashionShelfOpen) return;
      applyPreviewStart();
      window.IAMStreamController?.setFashionActive(preview, true, "fashion_shelf_preview");
      await preview.play();
    } catch {
      if (preview === fashionShelfPreviewVideo) stopFashionShelfPreview();
    }
  }

  function updateFashionShelfPosition({ preview = true } = {}) {
    if (!fashionShelfTrack) return;
    const cardsPerView = fashionCardsPerView();
    const maximumOffset = Math.max(0, fashionShelfOrder.length - cardsPerView);
    fashionShelfOffset = Math.max(0, Math.min(maximumOffset, fashionShelfOffset));
    const items = Array.from(fashionShelfTrack.querySelectorAll("[data-fashion-shelf-item]"));
    const target = items[fashionShelfOffset];
    const distance = target?.offsetLeft || 0;
    fashionShelfTrack.style.transform = `translate3d(-${distance}px, 0, 0)`;

    const start = fashionShelfOffset + 1;
    const end = Math.min(fashionShelfOrder.length, fashionShelfOffset + cardsPerView);
    if (fashionShelfCounter) fashionShelfCounter.textContent = start === end ? `${start} / ${fashionShelfOrder.length}` : `${start}–${end} / ${fashionShelfOrder.length}`;
    if (fashionShelfProgress) fashionShelfProgress.style.width = `${(end / fashionShelfOrder.length) * 100}%`;
    fashionShelfPrevious?.toggleAttribute("disabled", fashionShelfOffset === 0);
    fashionShelfNext?.toggleAttribute("disabled", fashionShelfOffset >= maximumOffset);

    if (fashionShelfOpen && preview) {
      window.setTimeout(() => {
        const activePosition = fashionRunwayOrderPosition(fashionRunwayIndex);
        const previewPosition = activePosition >= fashionShelfOffset && activePosition < end ? activePosition : fashionShelfOffset;
        startFashionShelfPreview(items[previewPosition]?.querySelector("[data-fashion-card]"));
      }, 160);
    }
  }

  function moveFashionShelf(direction) {
    const cardsPerView = fashionCardsPerView();
    fashionShelfOffset += direction * cardsPerView;
    stopFashionShelfPreview();
    updateFashionShelfPosition();
  }

  function renderFashionShelf() {
    if (!fashionShelfTrack) return;
    stopFashionShelfPreview();
    const recordsByAsset = new Map(fashionTensorRecords.map((record) => [record.asset_key, record]));
    fashionShelfTrack.innerHTML = fashionShelfOrder.map((runwayIndex, position) => {
      const runway = fashionRunways[runwayIndex];
      const record = recordsByAsset.get(runway.assetKey);
      const recommendationLabel = position < 3 ? `Recommended ${String(position + 1).padStart(2, "0")}` : `Explore ${String(position + 1).padStart(2, "0")}`;
      const context = record?.primary_environmental_function || "Fashion visual";
      const selected = runwayIndex === fashionRunwayIndex;
      return `
        <div class="adaptive-television-fashion-shelf__item" data-fashion-shelf-item role="listitem">
          <button class="adaptive-television-fashion-card${selected ? " is-active" : ""}" type="button" data-fashion-card data-fashion-runway-index="${runwayIndex}" aria-pressed="${selected}" aria-label="Switch visual to ${runway.title}">
            <span class="adaptive-television-fashion-card__media">
              <img src="${fashionThumbnailUrl(runway)}" alt="" loading="${position < 3 ? "eager" : "lazy"}">
              <span class="adaptive-television-fashion-card__preview-label">10s preview</span>
            </span>
            <span class="adaptive-television-fashion-card__copy">
              <small>${recommendationLabel}</small>
              <strong>${runway.shortTitle}</strong>
              <span>${context}</span>
            </span>
          </button>
        </div>`;
    }).join("");

    fashionShelfTrack.querySelectorAll("[data-fashion-card]").forEach((card) => {
      card.addEventListener("pointerenter", () => startFashionShelfPreview(card));
      card.addEventListener("focus", () => startFashionShelfPreview(card));
      card.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const index = Number(card.dataset.fashionRunwayIndex);
        await setFashionRunway(index, { source: "manual", feedbackType: "explicit_select" });
        closeFashionShelf(false);
        fashionShelfToggle?.focus({ preventScroll: true });
      });
    });
    window.requestAnimationFrame(() => updateFashionShelfPosition({ preview: fashionShelfOpen }));
  }

  function openFashionShelf() {
    if (!fashionShelf || fashionShelfOpen) return;
    fashionShelfOpen = true;
    const cardsPerView = fashionCardsPerView();
    fashionShelfOffset = 0;
    fashionShelf.setAttribute("aria-hidden", "false");
    fashionShelf.removeAttribute("inert");
    fashionShelfToggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("fashion-shelf-open");
    renderFashionShelf();
    window.setTimeout(() => {
      updateFashionShelfPosition();
      const activePosition = fashionRunwayOrderPosition(fashionRunwayIndex);
      const focusCard = activePosition < cardsPerView
        ? fashionShelfTrack?.querySelector(`[data-fashion-runway-index="${fashionRunwayIndex}"]`)
        : fashionShelfTrack?.querySelector("[data-fashion-card]");
      focusCard?.focus({ preventScroll: true });
    }, 90);
  }

  function closeFashionShelf(restoreFocus = true) {
    if (!fashionShelf || !fashionShelfOpen) return;
    fashionShelfOpen = false;
    fashionShelf.setAttribute("aria-hidden", "true");
    fashionShelf.setAttribute("inert", "");
    fashionShelfToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("fashion-shelf-open");
    stopFashionShelfPreview();
    if (restoreFocus) fashionShelfToggle?.focus({ preventScroll: true });
  }

  function toggleFashionShelf() {
    if (fashionShelfOpen) closeFashionShelf();
    else openFashionShelf();
  }

  function updateFashionRunwayToggle() {
    if (!fashionRunwaySelector) return;
    const activeRunway = fashionRunways[fashionRunwayIndex];
    const previousRunway = fashionRunways[(fashionRunwayIndex - 1 + fashionRunways.length) % fashionRunways.length];
    const nextRunway = fashionRunways[(fashionRunwayIndex + 1) % fashionRunways.length];
    if (fashionRunwayLabel) fashionRunwayLabel.textContent = activeRunway.shortTitle;
    if (fashionRunwayCount) fashionRunwayCount.textContent = `${fashionRunwayIndex + 1} / ${fashionRunways.length}`;
    fashionRunwaySelector.dataset.videoTooltip = `${activeRunway.title}\nClick for more recommendations.`;
    fashionShelfToggle?.setAttribute("aria-label", `Click for more recommendations. Current runway: ${activeRunway.title}`);
    fashionRunwayPrevious?.setAttribute("aria-label", `Previous runway: ${previousRunway.title}`);
    fashionRunwayNext?.setAttribute("aria-label", `Next runway: ${nextRunway.title}`);
    fashionRunwaySelector.dataset.fashionRunway = activeRunway.assetKey;
    if (document.body.classList.contains("television-emdr-gif-active")) {
      playerMount.dataset.emdrGifFashionRunway = activeRunway.assetKey;
    }
    persistFashionSelection(fashionSelectionSource);
    updateNowPlaying();
  }

  async function setFashionRunway(index, options = {}) {
    if (!fashionVideo || fashionRunwaySwitching) return;
    const nextIndex = ((index % fashionRunways.length) + fashionRunways.length) % fashionRunways.length;
    const source = options.source === "manual" ? "manual" : "algorithm";
    if (nextIndex === fashionRunwayIndex) {
      if (source === "manual") recordFashionSelectionFeedback(nextIndex, options.feedbackType);
      fashionSelectionSource = source;
      updateFashionRunwayToggle();
      renderFashionShelf();
      return;
    }

    fashionRunwaySwitching = true;
    fashionRunwayPrevious?.setAttribute("disabled", "");
    fashionRunwayNext?.setAttribute("disabled", "");

    const previousVideo = fashionVideo;
    const shouldPlay = requestedVideoBlend < 100;
    const revealGeneration = ++fashionRevealGeneration;
    previousVideo.classList.remove("is-fashion-active");

    await new Promise((resolve) => window.setTimeout(resolve, 300));

    window.IAMStreamController?.setFashionActive(previousVideo, false, "runway_switch");
    try { previousVideo.pause(); } catch {}
    window.IAMStreamController?.detach(previousVideo);
    try {
      previousVideo.removeAttribute("src");
      previousVideo.load();
    } catch {}
    previousVideo.remove();

    fashionRunwayIndex = nextIndex;
    fashionSelectionSource = source;
    fashionVideo = createFashionVideo(fashionRunwayIndex);
    playerMount.insertBefore(fashionVideo, timecode || null);
    if (document.body.classList.contains("television-emdr-gif-active")) startFashionHeroMirror();
    updateFashionRunwayToggle();
    if (source === "manual") recordFashionSelectionFeedback(nextIndex, options.feedbackType);
    else if (requestedVideoBlend < 100) scheduleFashionDwellFeedback();
    window.dispatchEvent(new CustomEvent("iam:fashion-runway-change", {
      detail: {
        assetKey: fashionRunways[fashionRunwayIndex].assetKey,
        source,
        emdrUsesCurrentFashion: true,
      },
    }));

    try {
      await ensureFashionStreamAttached(fashionVideo);
      if (shouldPlay) {
        await revealFashionWhenReady(fashionVideo, revealGeneration);
      } else {
        window.IAMStreamController?.preloadFashion(fashionVideo, { targetSeconds: 12 });
        fashionVideo.classList.add("is-fashion-active");
      }
    } catch {
      fashionVideo.classList.add("is-fashion-active");
    } finally {
      fashionRunwaySwitching = false;
      fashionRunwayPrevious?.removeAttribute("disabled");
      fashionRunwayNext?.removeAttribute("disabled");
    }
  }

  function musicModeLabel(mode = musicChannelMode) {
    return ({ videos: "Videos", parties: "Parties", radio: "Radio" })[mode] || "Music";
  }

  function musicCardsPerView() {
    return window.matchMedia("(max-width: 720px)").matches ? 1 : 3;
  }

  function readMusicTasteProfile() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("iamMusicChannelTasteV1") || "null");
      if (parsed && typeof parsed === "object") {
        return {
          affinities: parsed.affinities && typeof parsed.affinities === "object" ? parsed.affinities : {},
          recentIds: Array.isArray(parsed.recentIds) ? parsed.recentIds : [],
          lastId: String(parsed.lastId || ""),
          lastSelectedAt: Number(parsed.lastSelectedAt || 0),
        };
      }
    } catch {
      // A fresh taste profile is safe when storage is unavailable.
    }
    return { affinities: {}, recentIds: [], lastId: "", lastSelectedAt: 0 };
  }

  function writeMusicTasteProfile(profile) {
    try {
      window.localStorage.setItem("iamMusicChannelTasteV1", JSON.stringify(profile));
    } catch {
      // Explicit playback remains available without preference persistence.
    }
  }

  function musicCitizenNeeds() {
    return normalizedNeedMap(readStoredCitizenInference() || {});
  }

  function musicRecommendationSeed() {
    const inference = readStoredCitizenInference() || {};
    return inference.citizen_id || inference.inference_id || inference.interpretation_summary ||
      JSON.stringify(inference.top_highlights || []) || track.id;
  }

  function musicTensorRecord(trackId) {
    return musicCatalogueRecords.find((record) => record.id === trackId) || null;
  }

  function musicTrackContext(candidate, tensor) {
    const primary = String(tensor?.primary_environmental_function || "");
    const isParty = candidate.presentation === "live_dj_set";
    const restorative = /restoration|focus|melancholy/i.test(primary);
    const activating = /club energy|grit|joy/i.test(primary);
    return {
      work_fit: isParty ? (restorative ? .58 : .28) : (activating ? .42 : .7),
      group_fit: isParty ? .92 : (activating ? .78 : .54),
      high_load_fit: restorative ? .82 : (activating ? .28 : .52),
    };
  }

  function musicTrackRecord(candidate) {
    const tensor = musicTensorRecord(candidate.id);
    const needScores = tensor?.tensor_profile?.citizen_needs_scores || tensor?.citizen_need_affinities || {};
    const displayTitle = candidate.displayTitle || candidate.title;
    return {
      id: candidate.id,
      mode: candidate.presentation === "live_dj_set" ? "parties" : "videos",
      artist: candidate.displayArtist || candidate.artist,
      provider: candidate.displayArtist || candidate.artist,
      title: displayTitle,
      display_title: displayTitle,
      short_title: displayTitle,
      localVideoSrc: candidate.localVideoSrc,
      streamUid: candidate.streamUid,
      presentation: candidate.presentation || "official_video",
      editorial_priority: tensor?.priority || 2,
      primary_environmental_function: tensor?.primary_environmental_function || "Adaptive music",
      top_needs: tensor?.top_needs || [],
      need_scores: needScores,
      context: musicTrackContext(candidate, tensor),
      trackRef: candidate,
      previewStart: candidate.presentation === "live_dj_set" ? 36 : 8,
    };
  }

  function musicItems(mode = musicChannelMode) {
    if (mode === "radio") return radioStationRecords.slice();
    return TRACK_CATALOGUE
      .filter((candidate) => mode === "parties" ? candidate.presentation === "live_dj_set" : candidate.presentation !== "live_dj_set")
      .map(musicTrackRecord);
  }

  function rankMusicShelves() {
    const selector = window.IAMMusicChannelSelector;
    const taste = readMusicTasteProfile();
    const inference = readStoredCitizenInference() || {};
    const atWork = Boolean(selector?.explicitWorkContext?.(inference));
    const citizenNeeds = musicCitizenNeeds();
    ["videos", "parties", "radio"].forEach((mode) => {
      const pool = musicItems(mode);
      const result = selector?.rank
        ? selector.rank(pool, {
          mode,
          citizenNeeds,
          tasteAffinities: taste.affinities,
          recentIds: taste.recentIds,
          atWork,
          inGroup: audioWalletJoined,
          seed: musicRecommendationSeed(),
          limit: 3,
        })
        : { ranked: pool, recommendations: pool.slice(0, 3), context: { atWork, inGroup: audioWalletJoined } };
      musicShelfOrders[mode] = result.ranked;
      document.body.dataset[`music${mode[0].toUpperCase()}${mode.slice(1)}RecommendationCount`] = String(result.recommendations.length);
    });
    document.body.dataset.musicRecommendationSource = Object.keys(citizenNeeds).length ? "citizen_needs_tensor" : "editorial_taste_exploration";
    document.body.dataset.musicAtWorkContext = String(atWork);
    updateMusicSelector();
    renderMusicShelf();
  }

  async function loadMusicRecommendations() {
    try {
      const [catalogueResponse, stationsResponse] = await Promise.all([
        fetch("adaptive-music-video-catalogue-v1.11.json?v=music-channel-tensor-1", { cache: "no-store" }),
        fetch("radio-station-tensor-notion-export-v1.0.json?v=radio-stations-1", { cache: "no-store" }),
      ]);
      if (!catalogueResponse.ok) throw new Error(`Music Tensor fetch failed (${catalogueResponse.status})`);
      if (!stationsResponse.ok) throw new Error(`Radio Tensor fetch failed (${stationsResponse.status})`);
      const [catalogue, stations] = await Promise.all([catalogueResponse.json(), stationsResponse.json()]);
      musicCatalogueRecords = Array.isArray(catalogue.tracks) ? catalogue.tracks : [];
      const fallbacks = new Map(DEFAULT_RADIO_STATIONS.map((station) => [station.id, station]));
      radioStationRecords = (Array.isArray(stations.records) ? stations.records : DEFAULT_RADIO_STATIONS)
        .map((station) => ({ ...fallbacks.get(station.id), ...station, stageGate: fallbacks.get(station.id)?.stageGate || station.stageGate || "chill" }));
      rankMusicShelves();
    } catch (error) {
      document.body.dataset.musicRecommendationSource = "catalogue_fallback";
      document.body.dataset.musicRecommendationError = String(error?.message || error).slice(0, 120);
      rankMusicShelves();
    }
  }

  function musicActiveItem(mode = musicChannelMode) {
    const order = musicShelfOrders[mode] || [];
    if (mode === "radio") return order.find((item) => item.id === activeRadioStationId) || order[0] || null;
    const currentMode = track.presentation === "live_dj_set" ? "parties" : "videos";
    return currentMode === mode ? order.find((item) => item.id === track.id) || order[0] || null : order[0] || null;
  }

  function updateMusicSelector() {
    const order = musicShelfOrders[musicChannelMode] || [];
    const active = musicActiveItem();
    const position = Math.max(0, order.findIndex((item) => item.id === active?.id));
    const label = active
      ? (musicChannelMode === "radio" ? active.display_title : `${active.artist} — ${active.display_title}`)
      : musicModeLabel().toUpperCase();
    if (musicSelectorLabel) musicSelectorLabel.textContent = label;
    if (musicSelectorCount) musicSelectorCount.textContent = order.length ? `${position + 1} / ${order.length}` : "0 / 0";
    if (musicSelector) {
      musicSelector.dataset.videoTooltip = `${musicModeLabel()}\nClick for more recommendations.`;
      musicSelector.dataset.musicMode = musicChannelMode;
      musicSelector.dataset.musicItemId = active?.id || "";
    }
    musicShelfToggle?.setAttribute("aria-label", `Click for more recommendations. Current ${musicModeLabel().toLowerCase()}: ${label}`);
    musicModeButtons.forEach((button) => button.setAttribute("aria-selected", String(button.dataset.musicMode === musicChannelMode)));
    document.body.dataset.musicChannelMode = musicChannelMode;
    document.body.dataset.musicChannelItem = active?.id || "";
    updateNowPlaying();
  }

  function setMusicMode(mode, options = {}) {
    if (!["videos", "parties", "radio"].includes(mode)) return;
    musicChannelMode = mode;
    if (options.manual !== false) musicModeManuallySelected = true;
    musicShelfOffset = 0;
    updateMusicSelector();
    renderMusicShelf();
    if (options.openShelf) openMusicShelf();
  }

  function musicThumbnailUrl(item) {
    const uid = item.streamUid || window.IAMCloudflareStream?.assetFor(String(item.localVideoSrc || "").split("/").pop())?.uid;
    if (!uid) return "";
    const host = window.IAMCloudflareStream?.customerHost || "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
    return `https://${host}/${uid}/thumbnails/thumbnail.jpg?time=${item.previewStart || 8}s&height=360`;
  }

  function stopMusicShelfPreview() {
    if (!musicShelfPreviewVideo) return;
    try { musicShelfPreviewVideo.pause(); } catch {}
    window.IAMStreamController?.detach(musicShelfPreviewVideo);
    musicShelfPreviewVideo.remove();
    musicShelfPreviewCard?.classList.remove("is-previewing");
    musicShelfPreviewVideo = null;
    musicShelfPreviewCard = null;
  }

  async function startMusicShelfPreview(card) {
    if (!musicShelfOpen || !card || card === musicShelfPreviewCard || musicChannelMode === "radio") return;
    stopMusicShelfPreview();
    const item = (musicShelfOrders[musicChannelMode] || []).find((candidate) => candidate.id === card.dataset.musicItemId);
    const media = card.querySelector(".adaptive-television-music-card__media");
    if (!item?.localVideoSrc || !media || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const preview = document.createElement("video");
    preview.className = "adaptive-television-fashion-card__preview";
    preview.muted = true;
    preview.defaultMuted = true;
    preview.volume = 0;
    preview.playsInline = true;
    preview.preload = "metadata";
    preview.setAttribute("muted", "");
    preview.setAttribute("aria-hidden", "true");
    preview.dataset.streamRole = "music-preview";
    preview.dataset.streamMaxHeight = "360";
    musicShelfPreviewVideo = preview;
    musicShelfPreviewCard = card;
    card.classList.add("is-previewing");
    media.append(preview);
    const previewStart = Number(item.previewStart || 8);
    const resetPreview = () => {
      try { preview.currentTime = Math.min(previewStart, Math.max(0, Number(preview.duration || previewStart) - .5)); } catch {}
    };
    preview.addEventListener("loadedmetadata", resetPreview, { once: true });
    preview.addEventListener("timeupdate", () => {
      if (preview.currentTime >= Math.min(Number(preview.duration || previewStart + 10), previewStart + 10) - .08) resetPreview();
    });
    try {
      await window.IAMStreamController?.attach(preview, {
        fileName: item.localVideoSrc,
        role: "music",
        autoplay: false,
        preload: true,
        preloadTargetSeconds: 10,
      });
      if (preview !== musicShelfPreviewVideo || !musicShelfOpen) return;
      resetPreview();
      await preview.play();
    } catch {
      if (preview === musicShelfPreviewVideo) stopMusicShelfPreview();
    }
  }

  function updateMusicShelfPosition({ preview = true } = {}) {
    const order = musicShelfOrders[musicChannelMode] || [];
    if (!musicShelfTrack) return;
    const cardsPerView = musicCardsPerView();
    const maximumOffset = Math.max(0, order.length - cardsPerView);
    musicShelfOffset = Math.max(0, Math.min(maximumOffset, musicShelfOffset));
    const items = Array.from(musicShelfTrack.querySelectorAll("[data-music-shelf-item]"));
    musicShelfTrack.style.setProperty(
      "transform",
      `translate3d(-${items[musicShelfOffset]?.offsetLeft || 0}px, 0, 0)`,
      "important"
    );
    const start = order.length ? musicShelfOffset + 1 : 0;
    const end = Math.min(order.length, musicShelfOffset + cardsPerView);
    if (musicShelfCounter) musicShelfCounter.textContent = start === end ? `${start} / ${order.length}` : `${start}–${end} / ${order.length}`;
    if (musicShelfProgress) musicShelfProgress.style.width = `${order.length ? (end / order.length) * 100 : 0}%`;
    musicShelfPrevious?.toggleAttribute("disabled", musicShelfOffset === 0);
    musicShelfNext?.toggleAttribute("disabled", musicShelfOffset >= maximumOffset);
    if (musicShelfOpen && preview && musicChannelMode !== "radio") {
      window.setTimeout(() => startMusicShelfPreview(items[musicShelfOffset]?.querySelector("[data-music-card]")), 160);
    }
  }

  function moveMusicShelf(direction) {
    musicShelfOffset += direction * musicCardsPerView();
    stopMusicShelfPreview();
    updateMusicShelfPosition();
  }

  function musicCardMedia(item, position) {
    if (musicChannelMode === "radio") {
      const palette = item.card_palette || ["#4c5664", "#aeb7bf"];
      return `<span class="adaptive-television-fashion-card__media adaptive-television-music-card__media" style="--station-a:${palette[0]};--station-b:${palette[1]}">
        <span class="adaptive-television-radio-art"><strong>${item.display_title}</strong></span>
        <span class="adaptive-television-music-card__live">live</span>
        <span class="adaptive-television-music-card__mode">radio</span>
      </span>`;
    }
    return `<span class="adaptive-television-fashion-card__media adaptive-television-music-card__media">
      <img src="${musicThumbnailUrl(item)}" alt="" loading="${position < 3 ? "eager" : "lazy"}">
      <span class="adaptive-television-fashion-card__preview-label">10s preview</span>
      <span class="adaptive-television-music-card__mode">${musicChannelMode === "parties" ? "party" : "video"}</span>
    </span>`;
  }

  function renderMusicShelf() {
    if (!musicShelfTrack) return;
    stopMusicShelfPreview();
    const order = musicShelfOrders[musicChannelMode] || [];
    const active = musicActiveItem();
    if (musicShelfTitle) musicShelfTitle.textContent = `${musicModeLabel()} for you`;
    if (musicShelfSubtitle && !musicShelfSubtitle.dataset.temporaryStatus) musicShelfSubtitle.textContent = "Recommended for you based on your current needs";
    musicShelfTrack.setAttribute("aria-label", `${musicModeLabel()} choices`);
    musicShelfTrack.innerHTML = order.map((item, position) => {
      const selected = item.id === active?.id;
      const recommendationLabel = position < 3 ? `Recommended ${String(position + 1).padStart(2, "0")}` : `Explore ${String(position + 1).padStart(2, "0")}`;
      const provider = musicChannelMode === "radio" ? item.provider : item.artist;
      const title = item.display_title || item.title;
      const action = audioWalletJoined ? "Vote to play next" : "Play now";
      return `<div class="adaptive-television-fashion-shelf__item" data-music-shelf-item role="listitem">
        <button class="adaptive-television-fashion-card adaptive-television-music-card${selected ? " is-active" : ""}" type="button" data-music-card data-music-item-id="${item.id}" aria-pressed="${selected}" aria-label="${action}: ${provider} — ${title}">
          ${musicCardMedia(item, position)}
          <span class="adaptive-television-fashion-card__copy">
            <small>${recommendationLabel}</small>
            <strong>${title}</strong>
            <span>${provider} · ${item.primary_environmental_function || "Adaptive music"}</span>
          </span>
        </button>
      </div>`;
    }).join("");
    musicShelfTrack.querySelectorAll("[data-music-card]").forEach((card) => {
      card.addEventListener("pointerenter", () => startMusicShelfPreview(card));
      card.addEventListener("focus", () => startMusicShelfPreview(card));
      card.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const item = order.find((candidate) => candidate.id === card.dataset.musicItemId);
        if (item) await selectMusicItem(item, { source: "shelf", closeShelf: true });
      });
    });
    window.requestAnimationFrame(() => updateMusicShelfPosition({ preview: musicShelfOpen }));
  }

  function openMusicShelf() {
    if (!musicShelf || musicShelfOpen) return;
    if (fashionShelfOpen) closeFashionShelf(false);
    musicShelfOpen = true;
    musicShelfOffset = 0;
    musicShelf.setAttribute("aria-hidden", "false");
    musicShelf.removeAttribute("inert");
    musicShelfToggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("music-shelf-open");
    renderMusicShelf();
    window.setTimeout(() => {
      updateMusicShelfPosition();
      musicShelfTrack?.querySelector("[data-music-card]")?.focus({ preventScroll: true });
    }, 90);
  }

  function closeMusicShelf(restoreFocus = true) {
    if (!musicShelf || !musicShelfOpen) return;
    musicShelfOpen = false;
    musicShelf.setAttribute("aria-hidden", "true");
    musicShelf.setAttribute("inert", "");
    musicShelfToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("music-shelf-open");
    stopMusicShelfPreview();
    if (restoreFocus) musicShelfToggle?.focus({ preventScroll: true });
  }

  function showMusicShelfStatus(message, duration = 3600) {
    if (musicShelfStatus) musicShelfStatus.textContent = message;
    if (musicShelfSubtitle) {
      musicShelfSubtitle.dataset.temporaryStatus = "true";
      musicShelfSubtitle.textContent = message;
      window.setTimeout(() => {
        if (musicShelfSubtitle.textContent !== message) return;
        delete musicShelfSubtitle.dataset.temporaryStatus;
        musicShelfSubtitle.textContent = "Recommended for you based on your current needs";
      }, duration);
    }
  }

  function recordMusicFeedback(item, type = "explicit_select") {
    const profile = readMusicTasteProfile();
    const weight = Number(window.IAMMusicChannelSelector?.feedbackWeight?.(type) ?? 1);
    const id = item.id;
    profile.affinities[id] = Math.max(0, Math.min(1, Number(profile.affinities[id] || 0) + .16 * weight));
    profile.recentIds = [id, ...profile.recentIds.filter((recentId) => recentId !== id)].slice(0, 8);
    profile.lastId = id;
    profile.lastSelectedAt = Date.now();
    writeMusicTasteProfile(profile);
    window.clearTimeout(musicDwellTimer);
    musicDwellTimer = window.setTimeout(() => {
      const latest = readMusicTasteProfile();
      latest.affinities[id] = Math.max(0, Math.min(1, Number(latest.affinities[id] || 0) + .06));
      writeMusicTasteProfile(latest);
    }, 30000);
    window.IAMFirstPartyAnalytics?.record?.("music_channel_select", {
      selected_item_id: id,
      music_mode: item.mode || musicChannelMode,
      feedback_type: type,
      in_group: audioWalletJoined,
    });
  }

  function queueMusicItem(item) {
    const existing = groupQueue.find((queued) => queued.id === item.id);
    if (!existing) groupQueue.push({ id: item.id, mode: musicChannelMode, votes: 1, queuedAt: new Date().toISOString() });
    try { window.localStorage.setItem("iamMusicGroupQueueV1", JSON.stringify(groupQueue)); } catch {}
    document.body.dataset.musicGroupQueueLength = String(groupQueue.length);
    document.body.dataset.musicGroupQueueNext = groupQueue[0]?.id || "";
    const message = `${item.display_title || item.title} queued for the Chillout Circle · 1 vote`;
    showMusicShelfStatus(message);
    recordMusicFeedback(item, "queued_vote");
    window.IAMFirstPartyAnalytics?.record?.("music_group_queue_vote", { selected_item_id: item.id, music_mode: musicChannelMode, votes: 1 });
  }

  function stopContinuationAudioImmediately() {
    if (!continuationAudio) return;
    try {
      continuationAudio.pause();
      continuationAudio.muted = true;
      continuationAudio.volume = 0;
      continuationAudio.removeAttribute("src");
      continuationAudio.load();
    } catch {}
    continuationAudio = null;
    continuationDecision = null;
    document.body.dataset.radioPlaybackState = "stopped";
  }

  async function switchMusicTrack(nextTrack, options = {}) {
    if (!nextTrack || musicSwitching) return;
    musicSwitching = true;
    stopContinuationAudioImmediately();
    document.body.classList.remove("television-radio-continuation");
    activeRadioStationId = "";
    delete document.body.dataset.radioStationId;
    delete document.body.dataset.radioStationProvider;
    delete document.body.dataset.radioPlaybackError;
    document.body.dataset.radioPlaybackState = "stopped";
    musicChannelMode = nextTrack.presentation === "live_dj_set" ? "parties" : "videos";
    musicModeManuallySelected = options.source !== "automatic_continuation";
    try {
      const video = localVideo || mountPlayer();
      try { video.pause(); } catch {}
      window.IAMStreamController?.detach(video);
      delete video.__iamStreamAttachPromise;
      delete video.dataset.televisionStreamAttach;
      delete video.dataset.televisionStreamError;
      track = nextTrack;
      video.loop = false;
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.setAttribute("aria-label", `${track.artist} - ${track.title}`);
      try { video.currentTime = 0; } catch {}
      syncSelectedTrackCopy();
      setMusicTelevisionMetadata();
      await setVideoBlend(100);
      await attachAdaptiveStream(video, track.localVideoSrc, "music");
      playLocalVideo(video);
      window.IAMEMDR?.setTimelineSource?.({
        media: video,
        bpm: Number(track.bpm) || 112,
        firstDownbeatSeconds: Number.isFinite(Number(track.firstDownbeatSeconds)) ? Number(track.firstDownbeatSeconds) : 0,
        fallbackBpm: 112,
      });
      try {
        window.localStorage.setItem("iamMusicChannelStateV1", JSON.stringify({ mode: musicChannelMode, selected_item_id: track.id, selected_at: new Date().toISOString() }));
      } catch {}
      updateMusicSelector();
      renderMusicShelf();
      window.IAMFirstPartyAnalytics?.record?.("music_channel_start", { selected_item_id: track.id, music_mode: musicChannelMode, selection_source: options.source || "manual" });
    } finally {
      musicSwitching = false;
    }
  }

  function stationForId(stationId) {
    return radioStationRecords.find((station) => station.id === stationId) || radioStationRecords.find((station) => station.id === continuation.defaultStation) || radioStationRecords[0];
  }

  function bestRadioStationForTrack() {
    const ranked = musicShelfOrders.radio?.length ? musicShelfOrders.radio : radioStationRecords;
    const stagePool = continuation.stagePools[track.radioHandoff] || [];
    return ranked.find((station) => stagePool.includes(station.id)) || ranked[0] || stationForId(continuation.defaultStation);
  }

  async function startRadioStation(stationDecision, options = {}) {
    const station = stationForId(stationDecision?.id || stationDecision) || bestRadioStationForTrack();
    if (!station) return;
    musicRadioPreviousBlend = requestedVideoBlend;
    if (localVideo) {
      try { localVideo.pause(); } catch {}
      localVideo.muted = true;
    }
    document.body.classList.add("television-radio-continuation");
    playerMount.classList.remove("is-local-video-awaiting-gesture");
    await setVideoBlend(0);
    await ensureFashionStreamAttached();
    if (fashionVideo?.paused) await playWhenStreamAttached(fashionVideo, "fashion").catch(() => {});
    activeRadioStationId = station.id;
    musicChannelMode = "radio";
    continuationDecision = { ...station, label: station.display_title, src: station.stream_url };
    delete document.body.dataset.radioPlaybackError;
    document.body.dataset.radioPlaybackState = "loading";
    primeContinuationAudio(continuationDecision);
    window.IAMEMDR?.setTimelineSource?.({ media: continuationAudio, bpm: 112, firstDownbeatSeconds: 0, fallbackBpm: 112 });
    continuationAudio.muted = false;
    continuationAudio.play()
      .then(() => {
        document.body.dataset.radioPlaybackState = "playing";
        fadeContinuationAudio(.68, 1200);
        updateNowPlaying();
      })
      .catch((error) => {
        document.body.dataset.radioPlaybackState = "error";
        document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
        updateNowPlaying();
      });
    if ("mediaSession" in window.navigator && window.MediaMetadata) {
      window.navigator.mediaSession.metadata = new window.MediaMetadata({ title: station.display_title, artist: station.provider, album: "Universal Mind · 24/7 Radio" });
    }
    document.body.dataset.radioStationId = station.id;
    document.body.dataset.radioStationProvider = station.provider;
    updateMusicSelector();
    renderMusicShelf();
    showMusicShelfStatus(`${station.display_title} · live now`, 2600);
    window.IAMFirstPartyAnalytics?.record?.("radio_start", { station_id: station.id, provider: station.provider, selection_source: options.source || "adaptive" });
    maybeShowSupportCard();
  }

  async function selectMusicItem(item, options = {}) {
    if (!item) return;
    if (audioWalletJoined) {
      queueMusicItem(item);
      if (options.closeShelf) window.setTimeout(() => closeMusicShelf(false), 520);
      return;
    }
    musicModeManuallySelected = true;
    recordMusicFeedback(item, "explicit_select");
    if (item.mode === "radio" || musicChannelMode === "radio") await startRadioStation(item, { source: options.source || "manual" });
    else await switchMusicTrack(item.trackRef || findTrack(item.id), { source: options.source || "manual" });
    rankMusicShelves();
    if (options.closeShelf) closeMusicShelf(false);
  }

  async function selectAdjacentMusicItem(direction) {
    const order = musicShelfOrders[musicChannelMode] || [];
    if (!order.length) return;
    const active = musicActiveItem();
    const currentIndex = Math.max(0, order.findIndex((item) => item.id === active?.id));
    const next = order[(currentIndex + direction + order.length) % order.length];
    await selectMusicItem(next, { source: "wallet_arrow" });
  }

  async function continueAdaptiveMusicProgramme() {
    if (track.presentation === "live_dj_set") {
      await startRadioStation(bestRadioStationForTrack(), { source: "party_complete" });
      return;
    }
    if (musicChannelMode === "videos" && musicModeManuallySelected) {
      const order = musicShelfOrders.videos || [];
      const position = Math.max(0, order.findIndex((item) => item.id === track.id));
      const next = order[(position + 1) % Math.max(1, order.length)];
      if (next) await switchMusicTrack(next.trackRef || findTrack(next.id), { source: "automatic_continuation" });
      return;
    }
    const selector = window.IAMMusicChannelSelector;
    const inference = readStoredCitizenInference() || {};
    const decision = selector?.chooseContinuationMode?.({
      citizenNeeds: musicCitizenNeeds(),
      atWork: Boolean(selector?.explicitWorkContext?.(inference)),
      inGroup: audioWalletJoined,
      seed: musicRecommendationSeed(),
      sequence: musicContinuationSequence++,
    }) || { mode: "parties", reason: "fallback_party_prior" };
    document.body.dataset.musicContinuationDecision = decision.mode;
    document.body.dataset.musicContinuationReason = decision.reason;
    if (decision.mode === "parties") {
      const party = musicShelfOrders.parties?.[0];
      if (party) await switchMusicTrack(party.trackRef || findTrack(party.id), { source: "automatic_continuation" });
      else await startRadioStation(bestRadioStationForTrack(), { source: "party_pool_unavailable" });
      return;
    }
    await startRadioStation(bestRadioStationForTrack(), { source: "adaptive_continuation" });
  }

  window.IAMMusicChannels = {
    version: "music_channel_selector_v1.0",
    getState() {
      return {
        mode: musicChannelMode,
        activeItemId: musicActiveItem()?.id || "",
        activeRadioStationId,
        shelfOpen: musicShelfOpen,
        recommendations: Object.fromEntries(Object.entries(musicShelfOrders).map(([mode, items]) => [mode, items.slice(0, 3).map((item) => item.id)])),
        radioStationCount: radioStationRecords.length,
        groupQueue: groupQueue.slice(),
        inGroup: audioWalletJoined,
        atWork: document.body.dataset.musicAtWorkContext === "true",
      };
    },
    setMode(mode) {
      setMusicMode(mode, { manual: true });
      return this.getState();
    },
    select(itemId) {
      const item = (musicShelfOrders[musicChannelMode] || []).find((candidate) => candidate.id === itemId);
      return selectMusicItem(item, { source: "runtime_api" });
    },
    continueProgramme: continueAdaptiveMusicProgramme,
    rank: rankMusicShelves,
  };

  function applyVideoBlend(value) {
    const musicAmount = Math.max(0, Math.min(100, Number(value) || 0));
    const fashionOpacity = 1 - (musicAmount / 100);
    playerMount.style.setProperty("--fashion-video-opacity", fashionOpacity.toFixed(3));
    playerMount.dataset.videoBlend = musicAmount <= 0 ? "fashion" : musicAmount >= 100 ? "music" : "mixed";
    if (videoCrossfader) videoCrossfader.value = String(musicAmount);
    updateNowPlaying();
  }

  async function revealFashionWhenReady(video, generation) {
    if (!video) return;
    await ensureFashionStreamAttached(video);
    const readiness = await window.IAMStreamController?.prepareFashionReveal(video, {
      minimumSeconds: 8,
      firstFallbackMs: 1250,
      secondFallbackMs: 2000,
    });
    if (readiness?.cancelled || video !== fashionVideo || generation !== fashionRevealGeneration || requestedVideoBlend >= 100) return;

    await playWhenStreamAttached(video, "fashion");
    if (video !== fashionVideo || generation !== fashionRevealGeneration || requestedVideoBlend >= 100) {
      window.IAMStreamController?.setFashionActive(video, false, "reveal_cancelled");
      return;
    }
    video.classList.add("is-fashion-active");
    applyVideoBlend(requestedVideoBlend);
    window.IAMStreamController?.noteFashionReveal(video);
  }

  function setVideoBlend(value) {
    const musicAmount = Math.max(0, Math.min(100, Number(value) || 0));
    requestedVideoBlend = musicAmount;

    if (musicAmount >= 100) {
      window.clearTimeout(fashionDwellTimer);
      fashionRevealGeneration += 1;
      applyVideoBlend(100);
      if (fashionVideo) {
        window.IAMStreamController?.setFashionActive(fashionVideo, false, "music_selected");
        ensureFashionStreamAttached(fashionVideo)
          .then(() => window.IAMStreamController?.preloadFashion(fashionVideo, { targetSeconds: 12 }))
          .catch(() => {});
      }
      return;
    }

    scheduleFashionDwellFeedback();
    if (fashionVideo && !fashionVideo.paused && fashionVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      applyVideoBlend(musicAmount);
      return;
    }

    if (!pendingFashionRevealPromise || pendingFashionRevealVideo !== fashionVideo) {
      const revealGeneration = ++fashionRevealGeneration;
      pendingFashionRevealVideo = fashionVideo;
      pendingFashionRevealPromise = revealFashionWhenReady(fashionVideo, revealGeneration)
        .catch(() => {})
        .finally(() => {
          if (pendingFashionRevealVideo === fashionVideo) {
            pendingFashionRevealPromise = null;
            pendingFashionRevealVideo = null;
          }
        });
    }
  }

  function setEmdrGifPresentationActive(active) {
    if (active) {
      if (emdrGifPreviousVideoBlend === null) emdrGifPreviousVideoBlend = requestedVideoBlend;
      if (!emdrGifMusicMaxHeightCaptured && localVideo) {
        emdrGifPreviousMusicMaxHeight = localVideo.dataset.streamMaxHeight || null;
        emdrGifMusicMaxHeightCaptured = true;
      }
      if (localVideo) {
        const controller = window.IAMStreamController;
        const effectiveMaximum = controller?.setMaxHeight
          ? controller.setMaxHeight(localVideo, 360, "emdr_gif_active")
          : 360;
        if (!controller?.setMaxHeight) localVideo.dataset.streamMaxHeight = "360";
        localVideo.dataset.emdrGifQualityCap = String(effectiveMaximum);
      }
      setVideoBlend(0);
      playerMount.dataset.emdrGifVideoLayers = "active";
      playerMount.dataset.emdrGifFashionRunway = fashionRunways[fashionRunwayIndex]?.assetKey || "";
      playerMount.dataset.emdrGifFashionSelectionSource = fashionSelectionSource;
      startFashionHeroMirror();
      startSoundResearchLayer();
      return;
    }

    stopFashionHeroMirror();
    if (localVideo && emdrGifMusicMaxHeightCaptured) {
      const controller = window.IAMStreamController;
      if (controller?.setMaxHeight) {
        controller.setMaxHeight(localVideo, emdrGifPreviousMusicMaxHeight, "emdr_gif_inactive");
      } else if (emdrGifPreviousMusicMaxHeight) {
        localVideo.dataset.streamMaxHeight = emdrGifPreviousMusicMaxHeight;
      } else {
        delete localVideo.dataset.streamMaxHeight;
      }
      delete localVideo.dataset.emdrGifQualityCap;
    }
    emdrGifPreviousMusicMaxHeight = null;
    emdrGifMusicMaxHeightCaptured = false;
    if (emdrGifPreviousVideoBlend !== null) {
      const previousBlend = emdrGifPreviousVideoBlend;
      emdrGifPreviousVideoBlend = null;
      setVideoBlend(previousBlend);
    }
    delete playerMount.dataset.emdrGifVideoLayers;
    delete playerMount.dataset.emdrGifFashionRunway;
    delete playerMount.dataset.emdrGifFashionSelectionSource;
  }

  window.addEventListener("iam:emdr-gif-presentation", (event) => {
    setEmdrGifPresentationActive(Boolean(event.detail?.active));
  });

  function disarmVideoTooltips() {
    window.clearTimeout(videoTooltipArmTimer);
    reactionWallet?.classList.remove("is-video-tooltip-armed");
    videoTooltipOpenedAt = window.performance?.now?.() || Date.now();
    videoTooltipArmTimer = window.setTimeout(() => {
      reactionWallet?.classList.add("is-video-tooltip-armed");
    }, 2200);
  }

  function setReactionWalletOpen(isOpen) {
    if (!reactionWallet) return;
    if (audioWalletMode) return;
    setWalletView(isOpen ? "categories" : "closed");
  }

  function closeReactionWalletSoftly() {
    if (audioWalletMode) return;

    if (!reactionWallet || walletView === "closed") {
      setReactionWalletOpen(false);
      return;
    }
    if (reactionWallet?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    setWalletView("closed");
  }

  function scheduleReactionWalletCollapse(delay = 1800) {
    window.clearTimeout(reactionWalletCollapseTimer);
    reactionWalletCollapseTimer = window.setTimeout(() => {
      closeReactionWalletSoftly();
    }, delay);
  }

  function armReactionWalletPointerLock(event) {
    window.clearTimeout(reactionWalletPointerLockTimer);
    reactionWalletPointerReadyAt = Number.POSITIVE_INFINITY;
    document.body.classList.add("television-wallet-pointer-locked");
    const pointerX = Number(event?.clientX);
    const pointerY = Number(event?.clientY);
    reactionWalletPointerAnchorX = Number.isFinite(pointerX) ? pointerX : null;
    reactionWalletPointerAnchorY = Number.isFinite(pointerY) ? pointerY : null;
  }

  function startReactionWalletPointerUnlockCountdown() {
    reactionWalletPointerReadyAt = Date.now() + REACTION_WALLET_POINTER_LOCK_MS;
    window.clearTimeout(reactionWalletPointerLockTimer);
    reactionWalletPointerLockTimer = window.setTimeout(() => {
      reactionWalletPointerLockTimer = 0;
      document.body.classList.remove("television-wallet-pointer-locked");
    }, REACTION_WALLET_POINTER_LOCK_MS);
  }

  function openReactionWalletFromPointerMove(event) {
    if (audioWalletMode || walletView !== "closed") return;
    if (event.pointerType && event.pointerType !== "mouse") return;

    const pointerX = Number(event.clientX);
    const pointerY = Number(event.clientY);
    if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) return;

    if (
      !document.body.classList.contains("television-room-open") ||
      Date.now() < reactionWalletPointerReadyAt
    ) {
      reactionWalletPointerAnchorX = pointerX;
      reactionWalletPointerAnchorY = pointerY;
      return;
    }

    if (reactionWalletPointerAnchorX === null || reactionWalletPointerAnchorY === null) {
      reactionWalletPointerAnchorX = pointerX;
      reactionWalletPointerAnchorY = pointerY;
      return;
    }

    const physicalDistance = Math.hypot(
      pointerX - reactionWalletPointerAnchorX,
      pointerY - reactionWalletPointerAnchorY
    );
    if (physicalDistance < REACTION_WALLET_POINTER_MOVE_PX) return;

    reactionWalletPointerAnchorX = pointerX;
    reactionWalletPointerAnchorY = pointerY;
    openReactionWallet();
  }

  function openReactionWallet() {
    if (audioWalletMode) return;

    window.clearTimeout(reactionWalletCollapseTimer);
    setReactionWalletOpen(true);
  }

  function openReactionWalletFromTrigger(event) {
    if (!document.body.classList.contains("television-room-open")) return;
    event.preventDefault();
    event.stopPropagation();
    setReactionWalletOpen(true);
  }

  function beginReactionWalletOpenGesture() {
    if (!document.body.classList.contains("television-room-open") || audioWalletMode) return;
    setReactionWalletOpen(true);
    nowPlayingInteractiveAt = Date.now() + 1400;
  }

  function syncAudioWallet() {
    if (!reactionWallet) return;

    reactionWallet.classList.toggle("is-audio-wallet-mode", audioWalletMode);
    reactionWallet.classList.toggle("is-audio-wallet-joined", audioWalletJoined);
    reactionWallet.classList.toggle("is-audio-wallet-muted", audioWalletMuted);
    reactionWallet.classList.toggle("is-audio-wallet-listening", audioWalletJoined && audioWalletMuted);
    reactionWallet.classList.toggle("is-audio-wallet-on-air", audioWalletJoined && !audioWalletMuted);
    audioModeTrigger?.setAttribute("aria-expanded", String(audioWalletMode));
    audioWalletControls?.setAttribute("aria-hidden", String(!audioWalletMode));
    document.body.dataset.audioWalletJoined = String(audioWalletJoined);

    if (audioWalletJoin) {
      audioWalletJoin.textContent = audioWalletJoined ? "Chillout Circle" : "Join Chillout Circle";
      audioWalletJoin.setAttribute("aria-label", audioWalletJoined ? "Leave Chillout Circle" : "Join Chillout Circle");
      audioWalletJoin.setAttribute("title", audioWalletJoined ? "Leave Chillout Circle" : "Join Chillout Circle");
    }

    if (audioWalletMic) {
      audioWalletMic.disabled = false;
      audioWalletMic.setAttribute(
        "aria-label",
        audioWalletJoined
          ? (audioWalletMuted ? "Unmute microphone" : "Mute microphone")
          : "Return to reactions"
      );
    }

    if (audioModeClose) {
      audioModeClose.disabled = false;
      audioModeClose.textContent = "×";
      audioModeClose.setAttribute("aria-label", "Return to wallet");
    }

    if (audioWalletCount) {
      audioWalletCount.textContent = `${audioWalletOccupancy}/9`;
      audioWalletCount.setAttribute("aria-label", `${audioWalletOccupancy} of 9 people in Chillout Circle`);
    }
  }

  function openAudioWallet(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (Date.now() < nowPlayingInteractiveAt) return;
    window.clearTimeout(reactionWalletCollapseTimer);
    reactionWallet?.classList.remove("is-reaction-wallet-open", "is-reaction-wallet-closing");
    reactionWallet?.classList.remove("is-circle-tooltip-armed");
    window.clearTimeout(circleTooltipArmTimer);
    circleTooltipArmTimer = window.setTimeout(() => {
      reactionWallet?.classList.add("is-circle-tooltip-armed");
    }, 2200);
    audioWalletMode = true;
    setWalletView("audio");
    syncAudioWallet();
  }

  function closeAudioWallet(event) {
    event?.preventDefault();
    event?.stopPropagation();
    audioWalletMode = false;
    window.clearTimeout(circleTooltipArmTimer);
    reactionWallet?.classList.remove("is-circle-tooltip-armed");
    setWalletView("categories");
    syncAudioWallet();
  }

  function toggleAudioWalletJoin(event) {
    event?.preventDefault();
    event?.stopPropagation();
    audioWalletJoined = !audioWalletJoined;
    audioWalletMuted = false;
    audioWalletOccupancy = audioWalletJoined ? 1 : 0;
    audioWalletMode = true;
    syncAudioWallet();
    rankMusicShelves();
  }

  function toggleAudioWalletMute(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!audioWalletJoined) return;
    audioWalletMuted = !audioWalletMuted;
    syncAudioWallet();
  }

  function closeAudioWalletFromOutside(event) {
    if (!audioWalletMode) return;
    if (reactionWallet?.contains(event.target)) return;
    audioWalletMode = false;
    window.clearTimeout(circleTooltipArmTimer);
    reactionWallet?.classList.remove("is-circle-tooltip-armed");
    setWalletView("closed");
    syncAudioWallet();
  }

  function closeWalletFromOutside(event) {
    if (reactionWallet?.contains(event.target) || fashionShelf?.contains(event.target) || musicShelf?.contains(event.target) || walletView === "closed") return;
    window.clearTimeout(reactionWalletCollapseTimer);
    if (audioWalletMode) return;
    setWalletView("closed");
  }

  function setAudioWalletInteracting(isInteracting) {
    audioWalletInteracting = isInteracting;
  }

  function revealLearnCueWhenReady() {
    if (learnCueShown || !walletOnboardingEngaged || !learnCueUnlocked) return;
    if (document.body.classList.contains("nav-open") || document.body.classList.contains("homepage-radar-open")) return;
    if (document.body.classList.contains("television-page-view-open")) return;

    learnCueShown = true;
    learnCue?.setAttribute("aria-hidden", "false");
    document.body.classList.add("flower-cue-visible");
  }

  function beginWalletOnboarding() {
    if (!walletOnboarding || walletOnboardingEngaged) return;
    window.clearTimeout(walletOnboardingLineOneTimer);
    window.clearTimeout(walletOnboardingLineTwoTimer);
    window.clearTimeout(walletOnboardingDismissTimer);
    walletOnboarding.classList.remove("is-line-one-visible", "is-line-two-visible", "is-dismissed");
    walletOnboarding.setAttribute("aria-hidden", "false");
    walletOnboardingLineOneTimer = window.setTimeout(() => {
      if (walletOnboardingEngaged) return;
      walletOnboarding.classList.add("is-line-one-visible");
    }, 2500);
    walletOnboardingLineTwoTimer = window.setTimeout(() => {
      if (walletOnboardingEngaged) return;
      walletOnboarding.classList.add("is-line-two-visible");
    }, 4500);
    walletOnboardingDismissTimer = window.setTimeout(completeWalletOnboarding, 14500);
  }

  function completeWalletOnboarding() {
    if (walletOnboardingEngaged) return;
    walletOnboardingEngaged = true;
    window.clearTimeout(walletOnboardingLineOneTimer);
    window.clearTimeout(walletOnboardingLineTwoTimer);
    window.clearTimeout(walletOnboardingDismissTimer);
    walletOnboarding?.classList.remove("is-line-one-visible", "is-line-two-visible");
    walletOnboarding?.classList.add("is-dismissed");
    window.setTimeout(() => {
      walletOnboarding?.setAttribute("aria-hidden", "true");
    }, 950);
    window.clearTimeout(learnCueAfterWalletTimer);
    learnCueAfterWalletTimer = window.setTimeout(() => {
      learnCueUnlocked = true;
      revealLearnCueWhenReady();
    }, 5000);
  }

  function showPersistentLearnCue() {
    if (!learnCueShown) return;
    if (document.body.classList.contains("nav-open") || document.body.classList.contains("homepage-radar-open")) return;
    if (document.body.classList.contains("television-page-view-open")) return;

    learnCue?.setAttribute("aria-hidden", "false");
    document.body.classList.add("flower-cue-visible");
  }

  function startFlowerSpin() {
    const flower = document.querySelector(".brand-mark");
    const brand = document.querySelector(".brand");
    if (!flower || !brand || flowerCanvasFrame) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.className = "television-flower-canvas";
    canvas.setAttribute("aria-hidden", "true");
    brand.insertBefore(canvas, flower.nextSibling);

    function syncCanvasSize() {
      const size = Math.max(1, Math.round(flower.getBoundingClientRect().width || 90));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      return size;
    }

    function draw(now) {
      const size = syncCanvasSize();
      const center = size / 2;
      const angle = ((now % 3000) / 3000) * Math.PI * 2;

      context.clearRect(0, 0, size, size);
      context.save();
      context.translate(center, center);
      context.rotate(angle);
      context.drawImage(flower, -center, -center, size, size);
      context.restore();
      flowerCanvasFrame = window.requestAnimationFrame(draw);
    }

    if (flower.complete) {
      flowerCanvasFrame = window.requestAnimationFrame(draw);
    } else {
      flower.addEventListener("load", () => {
        if (!flowerCanvasFrame) flowerCanvasFrame = window.requestAnimationFrame(draw);
      }, { once: true });
    }
  }

  function primeLocalVideo() {
    mountPlayer();
  }

  function playLocalVideo(video) {
    televisionPlaybackRequested = true;
    video.dataset.streamPlayRequestedAt = String(window.performance?.now?.() || Date.now());
    video.preload = "auto";
    video.muted = soundResearchTestMode;
    video.volume = soundResearchTestMode ? 0 : 1;
    playerMount.classList.remove("is-local-video-awaiting-gesture");

    // Attach the EMDR analyser before playback begins. Claiming an already
    // playing media element with createMediaElementSource() reroutes its live
    // audio and can produce an audible click or stutter on EMDR activation.
    window.IAMEMDR?.setAudioSource?.(video);

    // Invoke play synchronously inside the viewer's click. This preserves the
    // Safari user gesture while HLS.js finishes attaching in the background.
    const playAttempt = window.IAMStreamController?.play(video) || video.play();
    video.dataset.televisionStreamPlay = "requested";
    video.__iamStreamAttachPromise?.then(() => {
      if (video.paused) playWhenStreamAttached(video, "music").catch(() => {});
    });
    startSoundResearchLayer();
    ensureFashionStreamAttached()
      .then(() => window.IAMStreamController?.preloadFashion(fashionVideo, { targetSeconds: 12 }))
      .catch(() => {});

    if (playAttempt?.catch) {
      playAttempt.catch(() => {
        playerMount.classList.add("is-local-video-awaiting-gesture");
      });
    }
  }

  function soundResearchActiveMedia() {
    const videoIsAudible = localVideo && !localVideo.paused && !localVideo.muted && localVideo.volume > 0;
    const radioIsAudible = continuationAudio && !continuationAudio.paused && !continuationAudio.muted && continuationAudio.volume > 0;
    return {
      media: videoIsAudible ? localVideo : (radioIsAudible ? continuationAudio : null),
      source: videoIsAudible ? "video" : (radioIsAudible ? "radio" : "none"),
    };
  }

  function soundResearchMediaInterrupted(activeMedia) {
    if (!window.IAMEMDR?.active) return false;
    if (!activeMedia) return true;
    return Boolean(
      activeMedia.ended ||
      activeMedia.readyState < HTMLMediaElement.HAVE_FUTURE_DATA ||
      activeMedia.dataset?.streamFreezeState
    );
  }

  function soundResearchTargetVolume() {
    if (soundResearchTestMode || soundResearchAuditionMode) {
      soundResearchContinuityActive = false;
      return soundResearchMaxVolume;
    }
    const { media: activeMedia } = soundResearchActiveMedia();
    soundResearchContinuityActive = soundResearchMediaInterrupted(activeMedia);
    if (soundResearchContinuityActive) {
      soundResearchMediaLevel = 0;
      return soundResearchMaxVolume;
    }
    if (activeMedia) {
      const measuredLevel = Number(window.IAMEMDR?.getAudioLevel?.());
      soundResearchMediaLevel = Number.isFinite(measuredLevel) ? measuredLevel * activeMedia.volume : 0;
      const normalizedLevel = clamp(
        (soundResearchMediaLevel - SOUND_RESEARCH_SILENCE_FLOOR) /
          (SOUND_RESEARCH_FULL_MASK_LEVEL - SOUND_RESEARCH_SILENCE_FLOOR),
        0,
        1
      );
      return soundResearchMaxVolume * Math.pow(normalizedLevel, SOUND_RESEARCH_MASKING_CURVE);
    }
    soundResearchMediaLevel = 0;
    return 0;
  }

  function soundResearchDiagnostics() {
    const { source: activeSource } = soundResearchActiveMedia();
    return {
      enabled: soundResearchEnabled,
      activeSource,
      sourceFile: SOUND_RESEARCH_AUDIO_SRC,
      codec: "AAC 192 kbps",
      fileLoaded: Boolean(soundResearchAudio && soundResearchAudio.readyState >= 2),
      playing: Boolean(soundResearchAudio && !soundResearchAudio.paused && !soundResearchAudio.ended),
      advancing: soundResearchPlaybackAdvancing,
      currentTime: Number(soundResearchAudio?.currentTime || 0),
      duration: Number(soundResearchAudio?.duration || 0),
      readyState: Number(soundResearchAudio?.readyState || 0),
      mediaLevel: soundResearchMediaLevel,
      targetVolume: soundResearchTargetLevel,
      currentVolume: Number(soundResearchAudio?.volume || 0),
      peakVolume: soundResearchMaxVolume,
      auditionMode: soundResearchAuditionMode,
      continuityActive: soundResearchContinuityActive,
      lastError: soundResearchLastError,
      lastPlayReason: soundResearchLastPlayReason,
      settingsLoaded: soundResearchSettingsLoaded,
      silenceFloor: SOUND_RESEARCH_SILENCE_FLOOR,
      fullMaskLevel: SOUND_RESEARCH_FULL_MASK_LEVEL,
    };
  }

  function initSoundResearchMonitor() {
    if (!soundResearchMonitorMode || soundResearchMonitor) return;
    const monitor = document.createElement("aside");
    monitor.setAttribute("aria-label", "Quantum Tree live monitor");
    monitor.style.cssText = "position:fixed;right:18px;top:18px;z-index:2147483000;width:min(340px,calc(100vw - 36px));padding:16px 18px;border:1px solid rgba(255,255,255,.22);border-radius:18px;background:rgba(8,8,13,.88);box-shadow:0 18px 50px rgba(0,0,0,.45);backdrop-filter:blur(18px);color:#fff;font:500 12px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;letter-spacing:.02em";
    monitor.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
        <strong style="font-size:14px;letter-spacing:.08em;text-transform:uppercase">Quantum Tree</strong>
        <span data-quantum-monitor-status style="padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.1)">waiting</span>
      </div>
      <dl style="display:grid;grid-template-columns:1fr auto;gap:6px 14px;margin:0">
        <dt style="opacity:.62">Audio source</dt><dd data-quantum-monitor-source style="margin:0">none</dd>
        <dt style="opacity:.62">File</dt><dd data-quantum-monitor-file style="margin:0">not loaded</dd>
        <dt style="opacity:.62">Encoding</dt><dd data-quantum-monitor-codec style="margin:0">AAC 192 kbps</dd>
        <dt style="opacity:.62">Signal</dt><dd data-quantum-monitor-signal style="margin:0">stopped</dd>
        <dt style="opacity:.62">Continuity</dt><dd data-quantum-monitor-continuity style="margin:0">normal masking</dd>
        <dt style="opacity:.62">Media RMS</dt><dd data-quantum-monitor-media style="margin:0">0.000</dd>
        <dt style="opacity:.62">Current gain</dt><dd data-quantum-monitor-current style="margin:0">0%</dd>
        <dt style="opacity:.62">Target gain</dt><dd data-quantum-monitor-target style="margin:0">0%</dd>
        <dt style="opacity:.62">Platform peak</dt><dd data-quantum-monitor-peak style="margin:0">0%</dd>
        <dt style="opacity:.62">Platform setting</dt><dd data-quantum-monitor-setting style="margin:0">loading</dd>
      </dl>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
        <button type="button" data-quantum-monitor-toggle style="min-height:38px;padding:8px 10px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.08);color:#fff;font:inherit;cursor:pointer">Quantum Tree: on</button>
        <button type="button" data-quantum-monitor-audition style="min-height:38px;padding:8px 10px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.08);color:#fff;font:inherit;cursor:pointer">Gate: normal</button>
      </div>
      <p style="margin:9px 2px 0;opacity:.62;font-size:10px;line-height:1.45">Gate bypass auditions the saved peak while the music is paused. It affects this QA tab only.</p>
      <a href="quantum-tree-control.html" target="_blank" rel="noopener" style="display:block;margin-top:14px;padding:9px 12px;border:1px solid rgba(255,255,255,.24);border-radius:999px;color:#fff;text-align:center;text-decoration:none">Open calibration dashboard</a>
    `;
    document.body.append(monitor);
    soundResearchMonitor = monitor;
    monitor.querySelector("[data-quantum-monitor-toggle]")?.addEventListener("click", () => {
      setSoundResearchEnabled(!soundResearchEnabled, { persist: false });
    });
    monitor.querySelector("[data-quantum-monitor-audition]")?.addEventListener("click", () => {
      soundResearchAuditionMode = !soundResearchAuditionMode;
      if (soundResearchAuditionMode && !soundResearchEnabled) {
        setSoundResearchEnabled(true, { persist: false });
      } else if (soundResearchAuditionMode) {
        startSoundResearchLayer();
      }
      updateSoundResearchMonitor(soundResearchDiagnostics());
    });
    updateSoundResearchMonitor(soundResearchDiagnostics());
  }

  function updateSoundResearchMonitor(diagnostics) {
    if (!soundResearchMonitor) return;
    const setText = (selector, value) => {
      const element = soundResearchMonitor.querySelector(selector);
      if (element) element.textContent = value;
    };
    const verifiedPlaying = diagnostics.playing && diagnostics.advancing;
    const verifiedOutput = verifiedPlaying && diagnostics.currentVolume > 0.0001;
    let status = diagnostics.playing ? "starting" : "stopped";
    if (verifiedPlaying) status = "playing · gated silent";
    if (verifiedOutput) status = "verified output";
    if (diagnostics.auditionMode && verifiedOutput) status = "auditioning peak";
    if (diagnostics.continuityActive && verifiedOutput) status = "continuity at peak";
    if (diagnostics.lastError) status = "playback blocked";
    if (!diagnostics.enabled) status = "disabled";
    const statusElement = soundResearchMonitor.querySelector("[data-quantum-monitor-status]");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.background = verifiedOutput ? "rgba(70,207,126,.24)" : "rgba(255,255,255,.1)";
      statusElement.style.color = verifiedOutput ? "#9effbf" : "#fff";
    }
    setText("[data-quantum-monitor-source]", diagnostics.activeSource);
    setText("[data-quantum-monitor-file]", diagnostics.fileLoaded ? "Quantum Tree AAC loaded" : "Quantum Tree AAC loading");
    setText("[data-quantum-monitor-codec]", diagnostics.codec);
    setText("[data-quantum-monitor-signal]", diagnostics.advancing ? `${diagnostics.currentTime.toFixed(1)}s advancing` : "not advancing");
    setText("[data-quantum-monitor-continuity]", diagnostics.continuityActive ? "saved peak during media interruption" : "normal waveform masking");
    setText("[data-quantum-monitor-media]", diagnostics.mediaLevel.toFixed(4));
    setText("[data-quantum-monitor-current]", `${(diagnostics.currentVolume * 100).toFixed(1)}%`);
    setText("[data-quantum-monitor-target]", `${(diagnostics.targetVolume * 100).toFixed(1)}%`);
    setText("[data-quantum-monitor-peak]", `${(diagnostics.peakVolume * 100).toFixed(1)}%`);
    setText("[data-quantum-monitor-setting]", diagnostics.settingsLoaded ? "server verified" : "safe fallback");
    const toggleButton = soundResearchMonitor.querySelector("[data-quantum-monitor-toggle]");
    if (toggleButton) {
      toggleButton.textContent = `Quantum Tree: ${diagnostics.enabled ? "on" : "off"}`;
      toggleButton.style.borderColor = diagnostics.enabled ? "rgba(143,242,177,.56)" : "rgba(255,255,255,.24)";
      toggleButton.style.color = diagnostics.enabled ? "#9effbf" : "#fff";
    }
    const auditionButton = soundResearchMonitor.querySelector("[data-quantum-monitor-audition]");
    if (auditionButton) {
      auditionButton.textContent = diagnostics.auditionMode ? "Gate: bypassed" : "Gate: normal";
      auditionButton.style.borderColor = diagnostics.auditionMode ? "rgba(216,200,119,.7)" : "rgba(255,255,255,.24)";
      auditionButton.style.color = diagnostics.auditionMode ? "#f2df82" : "#fff";
    }
  }

  function publishSoundResearchDiagnostics(now) {
    if (now - soundResearchDiagnosticAt < 250) return;
    soundResearchDiagnosticAt = now;
    const currentTime = Number(soundResearchAudio?.currentTime || 0);
    if (soundResearchAudio && !soundResearchAudio.paused && Math.abs(currentTime - soundResearchPlaybackTime) > 0.001) {
      soundResearchPlaybackObservedAt = now;
    }
    soundResearchPlaybackTime = currentTime;
    soundResearchPlaybackAdvancing = Boolean(
      soundResearchAudio &&
      !soundResearchAudio.paused &&
      now - soundResearchPlaybackObservedAt < 1000
    );
    const diagnostics = soundResearchDiagnostics();
    if (emdrSoundResearch) {
      emdrSoundResearch.dataset.soundResearchMediaLevel = diagnostics.mediaLevel.toFixed(5);
      emdrSoundResearch.dataset.soundResearchTargetVolume = diagnostics.targetVolume.toFixed(5);
      emdrSoundResearch.dataset.soundResearchVolume = diagnostics.currentVolume.toFixed(5);
      emdrSoundResearch.dataset.soundResearchPeakVolume = diagnostics.peakVolume.toFixed(5);
      emdrSoundResearch.dataset.soundResearchPlaying = String(diagnostics.playing);
      emdrSoundResearch.dataset.soundResearchAdvancing = String(diagnostics.advancing);
      emdrSoundResearch.dataset.soundResearchCurrentTime = diagnostics.currentTime.toFixed(3);
      emdrSoundResearch.dataset.soundResearchActiveSource = diagnostics.activeSource;
      emdrSoundResearch.dataset.soundResearchSourceFile = diagnostics.sourceFile;
      emdrSoundResearch.dataset.soundResearchCodec = diagnostics.codec;
      emdrSoundResearch.dataset.soundResearchContinuityActive = String(diagnostics.continuityActive);
      emdrSoundResearch.dataset.soundResearchLastError = diagnostics.lastError;
      emdrSoundResearch.dataset.soundResearchLastPlayReason = diagnostics.lastPlayReason;
    }
    updateSoundResearchMonitor(diagnostics);
  }

  function requestSoundResearchPlayback(reason = "runtime") {
    if (!soundResearchAudio || !soundResearchEnabled) return Promise.resolve(false);
    soundResearchLastPlayReason = reason;
    const attempt = soundResearchAudio.play();
    if (!attempt?.then) return Promise.resolve(true);
    return attempt.then(() => {
      soundResearchLastError = "";
      return true;
    }).catch((error) => {
      soundResearchLastError = `${error?.name || "PlaybackError"}: ${error?.message || "Quantum Tree playback was blocked"}`.slice(0, 180);
      return false;
    });
  }

  function ensureSoundResearchAudio() {
    if (soundResearchAudio) return soundResearchAudio;
    soundResearchAudio = new Audio(SOUND_RESEARCH_AUDIO_SRC);
    soundResearchAudio.loop = true;
    soundResearchAudio.preload = "auto";
    soundResearchAudio.playsInline = true;
    soundResearchAudio.volume = 0;
    soundResearchPlaybackObservedAt = window.performance?.now?.() || Date.now();
    soundResearchAudio.addEventListener("playing", () => {
      soundResearchLastError = "";
      soundResearchPlaybackObservedAt = window.performance?.now?.() || Date.now();
    });
    soundResearchAudio.addEventListener("error", () => {
      const code = Number(soundResearchAudio?.error?.code || 0);
      soundResearchLastError = `MediaError ${code || "unknown"}: Quantum Tree AAC could not be decoded`;
    });
    if (!soundResearchWatchdog) {
      soundResearchWatchdog = window.setInterval(() => {
        if (!soundResearchEnabled || !soundResearchAudio || document.hidden) return;
        const watchdogNow = window.performance?.now?.() || Date.now();
        const clockStalled = !soundResearchAudio.paused && watchdogNow - soundResearchPlaybackObservedAt > 2500;
        if (soundResearchAudio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || clockStalled) {
          soundResearchAudio.load();
          soundResearchPlaybackObservedAt = watchdogNow;
          requestSoundResearchPlayback(clockStalled ? "clock_stall_recovery" : "decode_recovery");
        } else if (soundResearchAudio.paused || soundResearchAudio.ended) {
          requestSoundResearchPlayback("pause_recovery");
        }
      }, 1000);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && soundResearchEnabled) requestSoundResearchPlayback("visibility_recovery");
      });
    }
    return soundResearchAudio;
  }

  function updateSoundResearchGain(now = 0) {
    soundResearchGainFrame = 0;
    if (!soundResearchAudio || !soundResearchEnabled) return;
    const target = soundResearchTargetVolume();
    soundResearchTargetLevel = target;
    const smoothing = target > soundResearchAudio.volume
      ? SOUND_RESEARCH_ATTACK_SMOOTHING
      : SOUND_RESEARCH_RELEASE_SMOOTHING;
    soundResearchAudio.volume += (target - soundResearchAudio.volume) * smoothing;
    if (target === 0 && soundResearchAudio.volume < 0.0001) soundResearchAudio.volume = 0;
    const diagnosticNow = Number(now) || window.performance?.now?.() || Date.now();
    if (target > 0 && soundResearchAudio.paused && diagnosticNow - soundResearchRetryAt > 1000) {
      soundResearchRetryAt = diagnosticNow;
      requestSoundResearchPlayback("gain_recovery");
    }
    publishSoundResearchDiagnostics(diagnosticNow);
    soundResearchGainFrame = window.requestAnimationFrame(updateSoundResearchGain);
  }

  function startSoundResearchLayer() {
    if (!soundResearchEnabled) return;
    ensureSoundResearchAudio();
    requestSoundResearchPlayback("layer_start");
    if (!soundResearchGainFrame) soundResearchGainFrame = window.requestAnimationFrame(updateSoundResearchGain);
  }

  function syncSoundResearchControl() {
    emdrSoundResearch?.setAttribute("aria-pressed", String(soundResearchEnabled));
    emdrSoundResearch?.setAttribute("aria-label", soundResearchEnabled ? "Turn Sound Research Layer off" : "Turn Sound Research Layer on");
  }

  function setSoundResearchEnabled(enabled, { persist = true } = {}) {
    soundResearchEnabled = Boolean(enabled);
    if (persist) localStorage.setItem("iamSoundResearchLayer", soundResearchEnabled ? "on" : "off");
    syncSoundResearchControl();
    if (soundResearchEnabled) {
      startSoundResearchLayer();
    } else if (soundResearchAudio) {
      soundResearchAudio.pause();
      soundResearchAudio.volume = 0;
      soundResearchTargetLevel = 0;
      soundResearchMediaLevel = 0;
      soundResearchContinuityActive = false;
      window.cancelAnimationFrame(soundResearchGainFrame);
      soundResearchGainFrame = 0;
    }
    if (soundResearchMonitor) updateSoundResearchMonitor(soundResearchDiagnostics());
    return soundResearchEnabled;
  }

  window.IAMQuantumTree = {
    diagnostics: soundResearchDiagnostics,
    getPeakVolume() {
      return soundResearchMaxVolume;
    },
    setPeakVolume(value) {
      return setSoundResearchPeakVolume(value, "runtime QA");
    },
    setEnabled: setSoundResearchEnabled,
    setAuditionMode(enabled) {
      soundResearchAuditionMode = Boolean(enabled);
      if (soundResearchAuditionMode) startSoundResearchLayer();
      return soundResearchAuditionMode;
    },
    reloadSettings: loadSoundResearchSettings,
  };

  function startTelevisionContinuation() {
    if (!localVideo) return;
    continueAdaptiveMusicProgramme().catch((error) => {
      document.body.dataset.musicContinuationError = String(error?.message || error).slice(0, 140);
      startRadioStation(bestRadioStationForTrack(), { source: "continuation_error_fallback" }).catch(() => null);
    });
  }

  function stopTelevisionMedia() {
    window.__iamAdaptiveEnvironment?.stopRadio?.();

    [localVideo, fashionVideo].forEach((video) => {
      if (!video) return;
      try {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
      } catch {
        // A navigating browser may already have released the media element.
      }
    });

    if (continuationAudio) {
      try {
        continuationAudio.pause();
        continuationAudio.muted = true;
        continuationAudio.volume = 0;
        continuationAudio.removeAttribute("src");
        continuationAudio.load();
      } catch {
        // The important outcome is that playback has been halted.
      }
      continuationAudio = null;
    }

    window.IAMEMDR?.setActive?.(false, { canvas: emdrCanvas, video: localVideo });
    window.IAMEMDR?.setTimelineSource?.({ media: null, fallbackBpm: 112 });
    stopEmdrIntensityJourney();
    window.IAMEMDR?.setAudioSource?.(null);
    document.body.classList.remove("television-radio-continuation");
  }

  window.__iamStopAdaptiveMedia = stopTelevisionMedia;

  function primeContinuationAudio(radioDecision = selectRadioContinuation()) {
    continuationDecision = radioDecision;
    const source = radioDecision?.src || radioDecision?.stream_url;

    if (!continuationAudio) {
      continuationAudio = new Audio();
      continuationAudio.crossOrigin = "anonymous";
      continuationAudio.src = source;
      continuationAudio.preload = "auto";
      continuationAudio.volume = 0;
    } else if (continuationAudio.src !== source) {
      continuationAudio.src = source;
      continuationAudio.volume = 0;
    }

    continuationAudio.muted = false;
    window.IAMEMDR?.setAudioSource?.(continuationAudio);

    const playAttempt = continuationAudio.play();
    if (playAttempt?.then) {
      playAttempt
        .then(() => {
          continuationAudio.volume = 0;
        })
        .catch(() => null);
    }

    return continuationAudio;
  }

  function selectRadioContinuation() {
    const fallback = stationForId(continuation.defaultStation);
    const adaptive = bestRadioStationForTrack();
    if (adaptive) return { ...adaptive, label: adaptive.display_title, src: adaptive.stream_url };

    try {
      const parsed = readStoredSelection();
      const stationName = parsed?.radio_handoff?.station ||
        parsed?.streaming_radio_handoff?.station ||
        parsed?.radio_continuation?.station;
      const station = stationForId(stationName);
      return station ? { ...station, label: station.display_title, src: station.stream_url } : fallback;
    } catch {
      return fallback;
    }
  }

  function readStoredSelection() {
    const keys = [
      "iamMusicTelevisionSelection",
      "iamLatestMusicVideoSelection",
      "iamMusicTelevisionRecommendation",
      "iamLatestMusicVideoRecommendation",
    ];

    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.schema_version === "adaptive_music_video_selection_v1.11") return parsed;
        if (parsed?.final_output?.hero_music_video || parsed?.final_output?.streaming_radio_handoff) return parsed.final_output;
        if (parsed?.radio_handoff || parsed?.safety) return parsed;
      } catch {
        // Continue searching other storage keys.
      }
    }

    return null;
  }

  function readStoredCitizenInference() {
    const keys = ["iamLatestInference", "citizenNeedsLatestInference"];
    for (const key of keys) {
      for (const store of [window.localStorage, window.sessionStorage]) {
        try {
          const raw = store.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") return parsed;
        } catch {
          // Keep looking when storage is unavailable or a legacy value is malformed.
        }
      }
    }
    return null;
  }

  function normalizedNeedMap(inference) {
    const result = {};
    const groups = inference?.citizen_needs || inference?.citizenNeeds || {};
    Object.values(groups).forEach((group) => {
      if (!group || typeof group !== "object" || Array.isArray(group)) return;
      Object.entries(group).forEach(([name, value]) => {
        const number = Number(value);
        if (Number.isFinite(number)) result[normalizeSlug(name)] = Math.max(0, Math.min(1, number));
      });
    });
    const radar = inference?.radar_scores || inference?.citizen_needs?.radar_scores;
    if (radar && typeof radar === "object") {
      Object.entries(radar).forEach(([name, value]) => {
        const number = Number(value);
        if (Number.isFinite(number)) result[normalizeSlug(name)] = Math.max(0, Math.min(1, number));
      });
    }
    return result;
  }

  function meanNeed(needs, names) {
    const values = names.map((name) => needs[normalizeSlug(name)]).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function stableUnit(value) {
    let hash = 2166136261;
    const text = String(value || "universal-mind");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967295;
  }

  function stopEmdrIntensityJourney() {
    window.cancelAnimationFrame(emdrIntensityFrame);
    emdrIntensityFrame = 0;
  }

  function emdrIntensityTimeline(now) {
    const bpm = Number(track.bpm);
    const downbeat = Number(track.firstDownbeatSeconds);
    const videoTimed = localVideo &&
      !document.body.classList.contains("television-radio-continuation") &&
      Number.isFinite(bpm) && bpm > 0 &&
      Number.isFinite(downbeat) && downbeat >= 0;

    if (videoTimed) {
      const relativeSeconds = Number(localVideo.currentTime) - downbeat;
      const phraseSeconds = EMDR_INTENSITY_PHRASE_BEATS * 60 / bpm;
      if (relativeSeconds <= 0) return { cycle: 0, phase: 0, source: "video_bpm_downbeat" };
      return {
        cycle: Math.floor(relativeSeconds / phraseSeconds),
        phase: (relativeSeconds % phraseSeconds) / phraseSeconds,
        source: "video_bpm_downbeat",
      };
    }

    const elapsed = Math.max(0, now - emdrIntensityJourneyStartedAt);
    return {
      cycle: Math.floor(elapsed / EMDR_INTENSITY_CYCLE_MS),
      phase: (elapsed % EMDR_INTENSITY_CYCLE_MS) / EMDR_INTENSITY_CYCLE_MS,
      source: "cinematic_fallback",
    };
  }

  function updateEmdrIntensityJourney(now) {
    if (!window.IAMEMDR?.active || !emdrAutomateEnabled) {
      emdrIntensityFrame = 0;
      return;
    }

    const delta = Math.min(64, Math.max(0, now - emdrIntensityJourneyLastAt));
    emdrIntensityJourneyLastAt = now;

    const { cycle, phase } = emdrIntensityTimeline(now);
    const humanArc = Math.sin(Math.PI * phase) ** 2;
    const cyclePeak = .72 + stableUnit(`${track.id}:emdr-intensity:${cycle}`) * .05;
    const target = emdrIntensityJourneyMinimum + (cyclePeak - emdrIntensityJourneyMinimum) * humanArc;
    const glide = 1 - Math.exp(-delta / 680);
    emdrIntensityJourneyCurrent += (target - emdrIntensityJourneyCurrent) * glide;

    const intensity = Math.max(.22, Math.min(.77, emdrIntensityJourneyCurrent));
    window.IAMEMDR.setIntensity(intensity);
    if (emdrIntensity) emdrIntensity.value = String(Math.round(intensity * 100));
    emdrIntensityFrame = window.requestAnimationFrame(updateEmdrIntensityJourney);
  }

  function startEmdrIntensityJourney(initialIntensity = .22, preserveCurrent = false) {
    stopEmdrIntensityJourney();
    if (!emdrAutomateEnabled) return;
    const now = window.performance?.now?.() || Date.now();
    if (!preserveCurrent) {
      emdrIntensityJourneyMinimum = Math.max(.22, Math.min(.3, Number(initialIntensity) || .22));
    }
    emdrIntensityJourneyCurrent = preserveCurrent
      ? Math.max(.22, Math.min(.77, Number(initialIntensity) || emdrIntensityJourneyMinimum))
      : emdrIntensityJourneyMinimum;
    const firstPeak = .72 + stableUnit(`${track.id}:emdr-intensity:0`) * .05;
    const normalized = Math.max(0, Math.min(1, (emdrIntensityJourneyCurrent - emdrIntensityJourneyMinimum) / Math.max(.01, firstPeak - emdrIntensityJourneyMinimum)));
    const phase = preserveCurrent ? Math.asin(Math.sqrt(normalized)) / Math.PI : 0;
    emdrIntensityJourneyStartedAt = now - phase * EMDR_INTENSITY_CYCLE_MS;
    emdrIntensityJourneyLastAt = now;
    window.IAMEMDR?.setIntensity(emdrIntensityJourneyCurrent);
    if (emdrIntensity) emdrIntensity.value = String(Math.round(emdrIntensityJourneyCurrent * 100));
    emdrIntensityFrame = window.requestAnimationFrame(updateEmdrIntensityJourney);
  }

  function setEmdrAutomateEnabled(enabled) {
    emdrAutomateEnabled = Boolean(enabled);
    emdrAutomate?.setAttribute("aria-pressed", String(emdrAutomateEnabled));
    emdrAutomate?.setAttribute("aria-label", emdrAutomateEnabled
      ? "Turn automatic intensity movement off"
      : "Turn automatic intensity movement on");

    const current = Math.max(.22, Math.min(.77, Number(emdrIntensity?.value) / 100 || emdrIntensityJourneyCurrent));
    if (!emdrAutomateEnabled) {
      emdrUserIntensity = current;
      emdrIntensityJourneyCurrent = current;
      stopEmdrIntensityJourney();
      window.IAMEMDR?.setIntensity(current);
      return false;
    }

    emdrUserIntensity = null;
    if (window.IAMEMDR?.active) startEmdrIntensityJourney(current, true);
    return true;
  }

  function selectEmdrAdaptation() {
    const inference = readStoredCitizenInference() || {};
    const selection = readStoredSelection() || {};
    const needs = normalizedNeedMap(inference);
    const hasNeeds = Object.keys(needs).length > 0;
    const music = inference?.adaptive_environment?.music_intelligence ||
      inference?.adaptive_music_intelligence || selection?.adaptive_music_intelligence || {};
    const environment = music?.environment_function || selection?.environment_function || {};
    const soundtrack = inference?.adaptive_environment?.soundtrack ||
      music?.streaming_radio_continuation || selection?.streaming_radio_handoff || {};
    const station = String(soundtrack.selected_mode || soundtrack.station || track.radioHandoff || "chill").toLowerCase();

    const load = meanNeed(needs, ["Anxiety", "Stress", "Fear", "Hypervigilance", "Startle Sensitivity", "Intrusions", "Mental Load"]);
    const depletion = meanNeed(needs, ["Fatigue", "Sleep Pressure", "Sleep Disturbance", "Emotional Numbing"]);
    const restoration = meanNeed(needs, ["Calm", "Recovery", "Psychological Safety", "Trust"]);
    const connection = meanNeed(needs, ["Connection", "Belonging", "Love", "Empathy", "Trust"]);
    const cognition = meanNeed(needs, ["Attention", "Clarity", "Executive Function", "Motivation"]);
    const exploration = meanNeed(needs, ["Awe", "Curiosity", "Self-Actualisation", "Self-Transcendence", "Hope"]);
    const activation = meanNeed(needs, ["Joy", "Motivation", "Arousal", "Connection", "Belonging"]);

    const identitySeed = inference?.citizen_id || inference?.checkin || inference?.interpretation_summary ||
      selection?.citizen_checkin || JSON.stringify(inference?.top_highlights || []) || track.id;
    const seed = stableUnit(identitySeed);

    const supportLevel = String(inference?.adaptive_support_relevance?.level || selection?.safety?.support_level || "none").toLowerCase();
    const reviewLevel = String(inference?.human_review_relevance?.level || "none").toLowerCase();
    const highConcern = ["high", "urgent"].includes(supportLevel) || ["recommended", "urgent"].includes(reviewLevel);
    const styleIndex = 0;

    const namedIntensity = { low: .28, low_to_moderate: .42, moderate: .58, high: .8, variable: .62 };
    const stationIntensity = { calm: .34, chill: .52, house: .72 };
    const musicIntensity = namedIntensity[String(environment.intensity || "").toLowerCase()] ?? stationIntensity[station] ?? .52;
    const readiness = (activation + exploration + cognition) / 3;
    let intensity = musicIntensity * .58 + readiness * .32 + .1 - load * .22 - depletion * .1;
    intensity += (seed - .5) * .06;
    intensity = Math.max(.22, Math.min(.9, intensity));
    if (highConcern) intensity = Math.min(intensity, .32);

    return {
      version: "emdr_adaptation_v0.1",
      styleIndex,
      style: emdrStyleNames[styleIndex],
      intensity: Math.round(intensity * 100) / 100,
      source: hasNeeds ? "citizen_needs_plus_music" : "music_context_fallback",
      factors: { load, depletion, restoration, connection, cognition, exploration, activation, station },
      experimental_status: "visual_research_hypothesis_not_clinical_treatment",
    };
  }

  function syncEmdrStyleButtons() {
    emdrStyleButtons.forEach((button) => {
      const buttonIndex = Number(button.dataset.emdrStyleIndex);
      const styleName = emdrStyleNames[buttonIndex] || "EMDR";
      const selected = buttonIndex === emdrStyleIndex;
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", `Use ${styleName} EMDR style${selected ? " (selected)" : ""}`);
    });
  }

  function applyEmdrAdaptation() {
    const adaptation = selectEmdrAdaptation();
    const adaptiveStartingIntensity = Math.max(.22, Math.min(.3, adaptation.intensity));
    const startingIntensity = !emdrAutomateEnabled && Number.isFinite(emdrUserIntensity)
      ? emdrUserIntensity
      : adaptiveStartingIntensity;
    emdrStyleIndex = adaptation.styleIndex;
    window.IAMEMDR?.setTimelineSource?.({
      media: localVideo && !document.body.classList.contains("television-radio-continuation") ? localVideo : continuationAudio,
      bpm: Number(track.bpm) || 112,
      firstDownbeatSeconds: Number.isFinite(Number(track.firstDownbeatSeconds)) ? Number(track.firstDownbeatSeconds) : 0,
      fallbackBpm: 112,
    });
    window.IAMEMDR?.setStyle(emdrStyleValues[emdrStyleIndex]);
    window.IAMEMDR?.setIntensity(startingIntensity);
    syncEmdrStyleButtons();
    if (emdrIntensity) emdrIntensity.value = String(Math.round(startingIntensity * 100));
    adaptation.intensityJourney = {
      start: startingIntensity,
      minimum: adaptiveStartingIntensity,
      maximum: .77,
      automated: emdrAutomateEnabled,
      phraseBeats: EMDR_INTENSITY_PHRASE_BEATS,
      timingSource: Number.isFinite(Number(track.bpm)) ? "video_bpm_downbeat" : "cinematic_fallback",
      bpm: Number(track.bpm) || null,
      firstDownbeatSeconds: Number.isFinite(Number(track.firstDownbeatSeconds)) ? Number(track.firstDownbeatSeconds) : null,
    };
    try {
      window.sessionStorage.setItem("iamLatestEmdrAdaptation", JSON.stringify(adaptation));
    } catch {
      // Adaptation remains available in memory when storage is restricted.
    }
    return adaptation;
  }

  function syncActiveEmdrControls() {
    if (!window.IAMEMDR?.active) return false;
    const runtimeStyle = Math.round(Number(window.IAMEMDR.style) || 0);
    const currentStyleValue = runtimeStyle === 4 ? 2 : runtimeStyle;
    const currentStyleIndex = emdrStyleValues.indexOf(currentStyleValue);
    emdrStyleIndex = currentStyleIndex >= 0 ? currentStyleIndex : 0;
    const intensity = Math.max(0, Math.min(1, Number(window.IAMEMDR.intensity) || 0));
    syncEmdrStyleButtons();
    if (emdrIntensity) emdrIntensity.value = String(Math.round(intensity * 100));
    emdrReact?.setAttribute("aria-pressed", String(Boolean(window.IAMEMDR.reactionEnabled)));
    emdrAutomate?.setAttribute("aria-pressed", String(emdrAutomateEnabled));
    return true;
  }

  function supportCardRequired() {
    const selection = readStoredSelection();
    return Boolean(
      selection?.safety?.support_card_required ||
      selection?.safety?.supportCardRequired ||
      selection?.support_card_required
    );
  }

  function maybeShowSupportCard() {
    if (!supportCard || !supportCardRequired()) return;

    supportCard.setAttribute("aria-hidden", "false");
    document.body.classList.add("television-support-card-open");
  }

  function closeSupportCard() {
    supportCard?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("television-support-card-open");
  }

  function fadeContinuationAudio(targetVolume, duration) {
    if (!continuationAudio) return;

    const startVolume = continuationAudio.volume;
    const startedAt = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      continuationAudio.volume = startVolume + ((targetVolume - startVolume) * progress);
      if (progress < 1) window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  function requestViewingFullscreen(video) {
    const fullscreenTarget = siteShell || document.documentElement;

    try {
      if (fullscreenTarget.requestFullscreen) {
        fullscreenTarget.requestFullscreen({ navigationUI: "hide" }).catch(() => null);
      } else if (fullscreenTarget.webkitRequestFullscreen) {
        fullscreenTarget.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch {
      // Fullscreen availability varies by browser and embedding context.
    }
  }

  function syncFullscreenState() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    document.body.classList.toggle("television-is-fullscreen", Boolean(fullscreenElement));
    if (document.body.classList.contains("television-room-open") || document.body.classList.contains("television-room-opening")) {
      startFlowerSpin();
    }
  }

  function exitFullscreenForNavigation() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => null);
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch {
      // Navigation can proceed even if the browser owns fullscreen exit timing.
    }
  }

  function openVideoNavigation(event) {
    if (!document.body.classList.contains("television-room-open")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const globalNav = document.querySelector("[data-global-nav]");
    if (!globalNav) return;

    if (document.body.classList.contains("nav-open")) {
      closeVideoNavigation();
      return;
    }

    document.body.classList.add("nav-open");
    globalNav.classList.add("is-open");
    globalNav.setAttribute("aria-hidden", "false");
  }

  function closeVideoNavigation() {
    document.body.classList.remove("nav-open");
    document.querySelectorAll("[data-global-nav]").forEach((nav) => {
      nav.classList.remove("is-open");
      nav.setAttribute("aria-hidden", "true");
    });
  }

  function isInternalPageLink(link) {
    if (!link || link.target === "_blank") return false;

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin && url.pathname.endsWith(".html");
    } catch {
      return false;
    }
  }

  function frameHref(link) {
    const url = new URL(link.getAttribute("href"), window.location.href);
    url.searchParams.set("adaptiveFrame", "1");
    url.searchParams.set("musicTelevisionFrame", "1");
    return url.href;
  }

  function refreshOuterFavicon() {
    window.__iamAdaptiveEnvironment?.refreshFavicon?.({ force: true });
  }

  function syncPageLayerMetadata() {
    if (!document.body.classList.contains("television-page-view-open")) return;

    try {
      const nextTitle = pageFrame?.contentDocument?.title?.trim();
      if (nextTitle) document.title = nextTitle;
    } catch {
      // The frame remains usable if browser security blocks title access.
    }

    refreshOuterFavicon();
  }

  function openInVideoPageLayer(link) {
    if (!pageView || !pageFrame) return;

    if (pageViewPreviousBlend === null) {
      pageViewPreviousBlend = Number(videoCrossfader?.value || 100);
    }
    setVideoBlend(0);
    pageFrame.src = frameHref(link);
    pageView.setAttribute("aria-hidden", "false");
    document.body.classList.add("television-page-view-open");
    closeVideoNavigation();
  }

  function returnToTelevisionRoom() {
    document.title = televisionPageTitle;
    refreshOuterFavicon();
    document.body.classList.remove(
      "homepage-radar-open",
      "homepage-radar-arming",
      "television-page-view-open",
      "flower-cue-visible"
    );
    pageView?.setAttribute("aria-hidden", "true");
    if (pageViewPreviousBlend !== null) {
      setVideoBlend(pageViewPreviousBlend);
      pageViewPreviousBlend = null;
    }
    learnCue?.setAttribute("aria-hidden", "true");
    document.querySelectorAll("[data-homepage-radar]").forEach((radar) => {
      radar.setAttribute("aria-hidden", "true");
    });
    closeVideoNavigation();
    showPersistentLearnCue();
  }

  function openVideoRadar(event) {
    event.preventDefault();
    event.stopPropagation();

    document.body.classList.remove("flower-cue-visible", "television-page-view-open");
    document.body.classList.add("homepage-radar-open", "homepage-radar-arming");
    learnCue?.setAttribute("aria-hidden", "true");
    pageView?.setAttribute("aria-hidden", "true");

    document.querySelectorAll("[data-homepage-radar]").forEach((radar) => {
      radar.setAttribute("aria-hidden", "false");
    });

    document.querySelectorAll(".homepage-radar-frame").forEach((frame) => {
      frame.contentWindow?.postMessage({ type: "iam:homepage-radar-disable" }, window.location.origin);
    });

    window.setTimeout(() => {
      document.body.classList.remove("homepage-radar-arming");
      document.querySelectorAll(".homepage-radar-frame").forEach((frame) => {
        frame.contentWindow?.postMessage({ type: "iam:homepage-radar-enable" }, window.location.origin);
      });
    }, 900);
  }

  function closeVideoRadar() {
    document.body.classList.remove("homepage-radar-open", "homepage-radar-arming");

    document.querySelectorAll("[data-homepage-radar]").forEach((radar) => {
      radar.setAttribute("aria-hidden", "true");
    });

    document.querySelectorAll(".homepage-radar-frame").forEach((frame) => {
      frame.contentWindow?.postMessage({ type: "iam:homepage-radar-disable" }, window.location.origin);
    });
    showPersistentLearnCue();
  }


  function openRoom(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (selectionIsLoading) return;

    if (hasOpened) {
      if (localVideo?.paused) playLocalVideo(localVideo);
      return;
    }

    hasOpened = true;
    setReactionWalletOpen(false);
    armReactionWalletPointerLock(event);
    televisionPlaybackRequested = true;
    if (shouldShowAudioWalletMock()) {
      audioWalletMode = true;
      syncAudioWallet();
    }
    document.body.classList.add("television-room-opening", "television-wallet-settling");
    document.querySelectorAll(".background-video video").forEach((backgroundVideo) => {
      window.IAMStreamController?.setFashionActive(backgroundVideo, false);
    });
    room.setAttribute("aria-hidden", "false");
    playButton.setAttribute("aria-expanded", "true");
    const video = mountPlayer();
    primeContinuationAudio();
    startFlowerSpin();
    startLiveViewerSimulation();
    window.setTimeout(ensureCommunityGlobeLoaded, 1200);
    requestViewingFullscreen(video);
    playLocalVideo(video);

    window.setTimeout(() => {
      document.body.classList.add("television-room-open");
      startReactionWalletPointerUnlockCountdown();
      document.body.classList.remove("television-room-opening");
    }, 1800);

    window.setTimeout(() => {
      document.body.classList.remove("television-wallet-settling");
      beginWalletOnboarding();
    }, 3200);
  }

  playButton.setAttribute("aria-expanded", "false");
  setReactionWalletOpen(false);
  syncAudioWallet();
  setRecommendationLoading(selectionIsLoading);
  updateFashionRunwayToggle();
  renderFashionShelf();
  loadFashionRecommendations();
  updateMusicSelector();
  renderMusicShelf();
  loadMusicRecommendations();
  if (!selectionIsLoading) {
    if (document.body.classList.contains("adaptive-music-selection-failed")) {
      showRecommendationUnavailable();
    } else {
      syncSelectedTrackCopy();
    }
  }
  if (flowerTrigger) {
    flowerTrigger.setAttribute("aria-label", "Open global navigation");
    flowerTrigger.addEventListener("click", openVideoNavigation, true);
  }
  fullscreenButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestViewingFullscreen(localVideo || mountPlayer());
  });
  reactionWallet?.addEventListener("pointerenter", () => {
    setAudioWalletInteracting(true);
  });
  reactionWallet?.addEventListener("pointerleave", () => {
    setAudioWalletInteracting(false);
    if (walletView === "emoji") scheduleReactionWalletCollapse(3000);
  });
  reactionWallet?.addEventListener("focusin", () => {
    setAudioWalletInteracting(true);
  });
  reactionWallet?.addEventListener("focusout", (event) => {
    if (event.relatedTarget && reactionWallet.contains(event.relatedTarget)) return;
    setAudioWalletInteracting(false);
    if (walletView === "emoji") scheduleReactionWalletCollapse(120);
  });
  reactionWalletTrigger?.addEventListener("pointerdown", beginReactionWalletOpenGesture, true);
  reactionWalletTrigger?.addEventListener("click", openReactionWalletFromTrigger, true);
  nowPlaying?.addEventListener("click", openNowPlayingRecommendations);
  walletCategoryButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() < nowPlayingInteractiveAt) return;
      const category = button.dataset.walletCategory;
      if (category === "audio") return;
      window.clearTimeout(reactionWalletCollapseTimer);
      if (category === "video") disarmVideoTooltips();
      setWalletView(category || "categories");
    });
  });
  videoModeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const mode = button.dataset.videoMode;
      if (mode === "emdr") {
        disarmVideoTooltips();
        if (syncActiveEmdrControls()) {
          button.setAttribute("aria-pressed", "true");
          setWalletView("emdr");
          startSoundResearchLayer();
          return;
        }
        const adaptation = applyEmdrAdaptation();
        // The playing audio source is connected before playback starts; EMDR
        // activation must remain a visual-only state change.
        const active = window.IAMEMDR?.active || window.IAMEMDR?.setActive(true, { canvas: emdrCanvas });
        button.setAttribute("aria-pressed", String(Boolean(active)));
        if (active) {
          setWalletView("emdr");
          startSoundResearchLayer();
          if (emdrAutomateEnabled) startEmdrIntensityJourney(adaptation.intensityJourney.minimum);
          else window.IAMEMDR?.setIntensity(adaptation.intensityJourney.start);
        }
        return;
      }
      disarmVideoTooltips();
      if (mode === "music") {
        setWalletView("music");
        updateMusicSelector();
        return;
      }
      setVideoBlend(0);
      setWalletView("video-mix");
    });
  });
  videoMixEndpoints.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const endpoint = button.dataset.videoMixEndpoint;
      setVideoBlend(endpoint === "fashion" ? 0 : 100);
      if (endpoint === "music") {
        setWalletView("music");
        updateMusicSelector();
      }
    });
  });
  fashionRunwayPrevious?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setFashionRunway(fashionRunwayIndex - 1, { source: "manual", feedbackType: "explicit_select" });
  });
  fashionRunwayNext?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setFashionRunway(fashionRunwayIndex + 1, { source: "manual", feedbackType: "explicit_select" });
  });
  fashionShelfToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFashionShelf();
  });
  fashionShelfCloseButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeFashionShelf();
    });
  });
  fashionShelfPrevious?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveFashionShelf(-1);
  });
  fashionShelfNext?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveFashionShelf(1);
  });
  fashionShelfViewport?.addEventListener("pointerdown", (event) => {
    fashionShelfSwipeStartX = Number(event.clientX);
  });
  fashionShelfViewport?.addEventListener("pointerup", (event) => {
    const start = fashionShelfSwipeStartX;
    fashionShelfSwipeStartX = null;
    if (!Number.isFinite(start)) return;
    const distance = Number(event.clientX) - start;
    if (Math.abs(distance) < 46) return;
    moveFashionShelf(distance < 0 ? 1 : -1);
  });
  fashionShelfViewport?.addEventListener("pointercancel", () => {
    fashionShelfSwipeStartX = null;
  });
  musicModeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMusicMode(button.dataset.musicMode, { manual: true, openShelf: true });
    });
  });
  musicSelectorPrevious?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectAdjacentMusicItem(-1);
  });
  musicSelectorNext?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectAdjacentMusicItem(1);
  });
  musicShelfToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (musicShelfOpen) closeMusicShelf();
    else openMusicShelf();
  });
  musicShelfCloseButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMusicShelf();
    });
  });
  musicShelfPrevious?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveMusicShelf(-1);
  });
  musicShelfNext?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveMusicShelf(1);
  });
  musicShelfViewport?.addEventListener("pointerdown", (event) => {
    musicShelfSwipeStartX = Number(event.clientX);
  });
  musicShelfViewport?.addEventListener("pointerup", (event) => {
    const start = musicShelfSwipeStartX;
    musicShelfSwipeStartX = null;
    if (!Number.isFinite(start)) return;
    const distance = Number(event.clientX) - start;
    if (Math.abs(distance) < 46) return;
    moveMusicShelf(distance < 0 ? 1 : -1);
  });
  musicShelfViewport?.addEventListener("pointercancel", () => {
    musicShelfSwipeStartX = null;
  });
  window.addEventListener("resize", () => {
    if (fashionShelfOpen) updateFashionShelfPosition({ preview: false });
    if (musicShelfOpen) updateMusicShelfPosition({ preview: false });
    updateNowPlayingOverflow();
  });
  document.addEventListener("keydown", (event) => {
    if (fashionShelfOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFashionShelf();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveFashionShelf(event.key === "ArrowRight" ? 1 : -1);
      }
      return;
    }
    if (musicShelfOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMusicShelf();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveMusicShelf(event.key === "ArrowRight" ? 1 : -1);
      }
    }
  });
  videoCrossfader?.addEventListener("input", () => {
    setVideoBlend(videoCrossfader.value);
  });
  emdrOff?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.IAMEMDR?.setActive(false, { canvas: emdrCanvas, video: localVideo });
    stopEmdrIntensityJourney();
    document.querySelector('[data-video-mode="emdr"]')?.setAttribute("aria-pressed", "false");
    setWalletView("video");
  });
  emdrStyleButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const requestedStyleIndex = Number(button.dataset.emdrStyleIndex);
    if (!Number.isInteger(requestedStyleIndex) || !emdrStyleValues[requestedStyleIndex]) return;
    emdrStyleIndex = requestedStyleIndex;
    window.IAMEMDR?.setStyle(emdrStyleValues[emdrStyleIndex]);
    syncEmdrStyleButtons();
    startSoundResearchLayer();
  }));
  emdrReact?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const enabled = window.IAMEMDR?.setReactionEnabled(!window.IAMEMDR.reactionEnabled) || false;
    emdrReact.setAttribute("aria-pressed", String(enabled));
    emdrReact.setAttribute("aria-label", enabled ? "Turn music reaction off" : "Turn music reaction on");
  });
  emdrAutomate?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setEmdrAutomateEnabled(!emdrAutomateEnabled);
  });
  emdrIntensity?.addEventListener("input", () => {
    const intensity = Number(emdrIntensity.value) / 100;
    emdrIntensityJourneyCurrent = intensity;
    emdrUserIntensity = intensity;
    setEmdrAutomateEnabled(false);
    window.IAMEMDR?.setIntensity(intensity);
  });
  emdrSoundResearch?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSoundResearchEnabled(!soundResearchEnabled);
  });
  syncEmdrStyleButtons();
  syncSoundResearchControl();
  setSoundResearchPeakVolume(soundResearchMaxVolume, "built-in default");
  initSoundResearchMonitor();
  loadSoundResearchSettings();
  window.setInterval(loadSoundResearchSettings, 60000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadSoundResearchSettings();
  });
  researchRolloverHosts.forEach((host) => {
    const moreButton = host.querySelector(".adaptive-television-research-tooltip__more");

    host.addEventListener("pointerenter", () => {
      if (researchRolloverIsArmed()) openResearchRollover(host);
    });
    host.addEventListener("pointermove", () => {
      if (researchRolloverIsArmed()) openResearchRollover(host);
    });
    host.addEventListener("pointerleave", () => {
      if (researchRolloverIsArmed() || host.classList.contains("is-research-rollover-open")) {
        scheduleResearchRolloverClose(host);
      }
    });
    host.addEventListener("focusin", () => openResearchRollover(host));
    host.addEventListener("focusout", (event) => {
      if (event.relatedTarget && host.contains(event.relatedTarget)) return;
      scheduleResearchRolloverClose(host);
    });

    moreButton?.addEventListener("pointerenter", () => openResearchDetails(host));
    moreButton?.addEventListener("pointermove", () => openResearchDetails(host));
    moreButton?.addEventListener("pointerleave", () => scheduleResearchDetailsClose(host));
    moreButton?.addEventListener("focusin", () => openResearchDetails(host));
    moreButton?.addEventListener("focusout", () => scheduleResearchDetailsClose(host));
    moreButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const pinned = !host.classList.contains("is-research-details-pinned");
      host.classList.toggle("is-research-details-pinned", pinned);
      if (pinned) {
        openResearchRollover(host);
        openResearchDetails(host);
      } else {
        scheduleResearchDetailsClose(host);
        scheduleResearchRolloverClose(host);
      }
    });
  });
  document.addEventListener("pointermove", (event) => {
    researchRolloverHosts.forEach((host) => {
      if (!host.classList.contains("is-research-rollover-open")) return;
      if (host.contains(event.target) || researchRolloverCloseTimers.has(host)) return;
      scheduleResearchRolloverClose(host);
    });
  });
  document.addEventListener("pointerdown", (event) => {
    researchRolloverHosts.forEach((host) => {
      if (!host.contains(event.target)) closeResearchRollover(host);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllResearchRollovers();
  });
  reactionWallet?.addEventListener("pointermove", (event) => {
    openReactionWalletFromPointerMove(event);
    if (walletView !== "video" && walletView !== "video-mix" && walletView !== "music" && walletView !== "emdr") return;
    const now = window.performance?.now?.() || Date.now();
    if (now - videoTooltipOpenedAt < 160) return;
    reactionWallet.classList.add("is-video-tooltip-armed");
  });
  livePill?.addEventListener("pointerenter", ensureCommunityGlobeLoaded);
  livePill?.addEventListener("focus", ensureCommunityGlobeLoaded);
  livePill?.addEventListener("click", openCommunityGlobe);
  communityGlobeBackdrop?.addEventListener("click", closeCommunityGlobe);
  communityGlobeClose?.addEventListener("click", closeCommunityGlobe);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.body.classList.contains("community-globe-open")) return;
    closeCommunityGlobe(event);
  });
  audioModeTrigger?.addEventListener("click", openAudioWallet);
  audioModeClose?.addEventListener("click", closeAudioWallet);
  audioWalletJoin?.addEventListener("click", toggleAudioWalletJoin);
  audioWalletJoin?.addEventListener("pointerleave", () => {
    if (audioWalletMode) reactionWallet?.classList.add("is-circle-tooltip-armed");
  });
  audioWalletMic?.addEventListener("click", toggleAudioWalletMute);
  document.addEventListener("click", closeAudioWalletFromOutside);
  document.addEventListener("click", closeWalletFromOutside);
  reactionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      releaseReactionFlood(button.dataset.televisionReaction || "daisy");
      const walletIsActive =
        audioWalletInteracting ||
        reactionWallet?.matches(":hover") ||
        reactionWallet?.contains(document.activeElement);
      if (!walletIsActive) {
        button.blur();
        scheduleReactionWalletCollapse(120);
      }
    });
  });
  learnCue?.addEventListener("click", openVideoRadar);
  radarClose?.addEventListener("click", closeVideoRadar);
  supportClose?.addEventListener("click", closeSupportCard);
  playerMount.addEventListener("click", () => {
    if (document.body.classList.contains("television-radio-continuation")) return;
    if (!localVideo?.paused) return;
    playLocalVideo(localVideo);
  });
  document.querySelectorAll(".global-nav a").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!document.body.classList.contains("television-room-open")) {
        exitFullscreenForNavigation();
        return;
      }

      if (link.dataset.navItem === "home") {
        event.preventDefault();
        event.stopImmediatePropagation();
        returnToTelevisionRoom();
        return;
      }

      if (link.dataset.navItem === "technology") {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.querySelectorAll("[data-nav-item]").forEach((item) => {
          item.classList.toggle("is-active", item === link);
        });
        link.setAttribute("aria-expanded", "true");
        document.querySelector('[data-nav-submenu="technology"]')?.classList.add("is-open");
        return;
      }

      if (link.dataset.navItem === "go-to-market") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (link.classList.contains("global-nav-brand") && event.target.closest(".global-nav-mark")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeVideoNavigation();
        return;
      }

      if (!isInternalPageLink(link)) {
        exitFullscreenForNavigation();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      openInVideoPageLayer(link);
    }, true);
  });
  document.querySelectorAll("[data-nav-close]").forEach((button) => {
    button.addEventListener("click", closeVideoNavigation);
  });
  playButton.addEventListener("pointerenter", primeLocalVideo);
  playButton.addEventListener("focus", primeLocalVideo);
  playButton.addEventListener("touchstart", primeLocalVideo, { passive: true });
  playButton.addEventListener("click", openRoom, true);
  window.addEventListener("iam:music-television-selection-updated", updateRecommendationFromStorage);
  window.addEventListener("iam:checkin-pipeline-complete", updateRecommendationFromStorage);
  window.addEventListener("iam:checkin-pipeline-error", showRecommendationUnavailable);
  document.addEventListener("fullscreenchange", syncFullscreenState);
  document.addEventListener("webkitfullscreenchange", syncFullscreenState);
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "iam:return-to-television") return;
    returnToTelevisionRoom();
  });
  pageFrame?.addEventListener("load", syncPageLayerMetadata);
  setMusicTelevisionMetadata();
  updateNowPlaying();
  if (window.ResizeObserver && nowPlayingViewport && nowPlayingTrack) {
    nowPlayingResizeObserver = new ResizeObserver(updateNowPlayingOverflow);
    nowPlayingResizeObserver.observe(nowPlayingViewport);
    nowPlayingResizeObserver.observe(nowPlayingTrack);
  }
  window.setInterval(updateNowPlayingClock, 30000);
  syncFullscreenState();
  window.IAMStreamReady?.then(() => {
    if (!selectionIsLoading) primeLocalVideo();
  });
  runIntro();
}());
