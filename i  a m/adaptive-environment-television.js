(function () {
  const TRACK_CATALOGUE = Array.isArray(window.IAMTrackCatalogue?.tracks)
    ? window.IAMTrackCatalogue.tracks.map((track) => ({ ...track }))
    : [];
  if (!TRACK_CATALOGUE.length) throw new Error("Shared music track catalogue unavailable");
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
  const NO_CHECKIN_RANDOM_LAST_TRACK_KEY = "iamNoCheckinRandomLastTrackId";
  const NO_CHECKIN_CONTINUATION_INDEX_KEY = "iamNoCheckinContinuationIndex";
  const EXTENDED_SESSION_VISITOR_ID_KEY = "iamAdaptiveMusicVisitorId";
  const NO_CHECKIN_RANDOM_EXCLUDED_TRACK_IDS = new Set(["madonna-frozen"]);
  let noCheckinRandomTrack = null;
  let resolvedSelectionSource = "";
  const SHOP_ARRIVAL_TRACK_ID = "zip-perlon-air-festival-2007";
  const SHOP_ARRIVAL_START_SECONDS = 88 * 60;
  const SHOP_ARRIVAL_FADE_IN_MS = 2400;
  const SHOP_SHELL_VERSION = "396e412d1a8a";
  const SHOP_DAY_MODE_ROOMS = new Set([
    "inner-planes",
    "champagne-bohemia",
    "modul8-infinity",
    "safety-cushion",
  ]);
  const IOH_LOGO_SRC = "a s s e t s/Universal Mind [ I o H ] Logo.PNG";
  const DEFAULT_EDGE_SCALE = 1.12;
  const MAX_DETECTED_EDGE_SCALE = 1.85;
  const BROADCAST_FORMATS = ["videos", "parties", "radio", "fashion"];
  const MUSIC_BROADCAST_FORMATS = ["videos", "parties", "radio"];
  const MUSIC_HANDOFF_PRELOAD_LEAD_SECONDS = 45;
  const MUSIC_HANDOFF_BUFFER_SECONDS = 12;
  const MUSIC_HANDOFF_CROSSFADE_MS = 1100;
  const BROADCAST_SYNC_INTERVAL_MS = 3000;
  const HOMEPAGE_NAV_FLOWER_ROTATION_MS = 3000;
  const BROADCAST_ROLLOVER_WAIT_MS = 5000;
  const BROADCAST_ROLLOVER_POLL_MS = 80;
  const BROADCAST_LOCK_TOLERANCE_SECONDS = 1;
  const BROADCAST_REJOIN_DRIFT_SECONDS = 1.5;
  const BROADCAST_REJOIN_BUFFER_SECONDS = 12;
  const BROADCAST_REJOIN_REQUIRED_SAMPLES = 3;
  const BROADCAST_REJOIN_COOLDOWN_MS = 30000;
  const BROADCAST_REJOIN_FADE_OUT_MS = 120;
  const BROADCAST_REJOIN_FADE_IN_MS = 180;
  const BROADCAST_ENERGY_ORDER = ["restore", "social-uplift", "underground-intensity"];
  const BROADCAST_EDITORIAL_ORDER = ["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"];
  const MUSIC_CHANNEL_NAMES = Object.freeze({
    "inner-planes": "Inner Planes",
    "champagne-bohemia": "Champagne Bohemia",
    "modul8-infinity": "modul8 infinity",
    "james-bondage": "james bondage",
    "safety-cushion": "Safety Cushion",
  });
  const BROADCAST_ENERGY_PROFILES = {
    restore: {
      need_scores: { Anxiety: 1, Stress: 1, Fear: .88, Recovery: 1, Calm: 1, Attention: .78, "Psychological Safety": .92 },
      context: { work_fit: .86, group_fit: .58, high_load_fit: 1 },
    },
    "social-uplift": {
      need_scores: { Joy: 1, Belonging: 1, Connection: 1, Gratitude: .9, Trust: .82, Motivation: .68 },
      context: { work_fit: .48, group_fit: 1, high_load_fit: .54 },
    },
    "underground-intensity": {
      need_scores: { Motivation: 1, "Self-Actualisation": 1, Curiosity: .88, Anger: .78, Arousal: 1, Joy: .66 },
      context: { work_fit: .24, group_fit: .86, high_load_fit: .2 },
    },
  };
  const DEFAULT_RADIO_STATIONS = [
    { id: "cafe-del-mar-calm", musicRoomFit: ["inner-planes"], mode: "radio", provider: "Café del Mar Radio", title: "Calm", display_title: "Café del Mar — Calm", short_title: "CALM", stream_url: "https://streamer.radio.co/sb748f24ad/listen", logo_src: "a s s e t s/radio-logos/cafe-del-mar-calm.svg", brand_logo_src: "a s s e t s/radio-logos/cafe-del-mar.svg", logo_alt: "Café del Mar Calm", primary_environmental_function: "Soul + Restoration", top_needs: ["Calm", "Recovery", "Psychological Safety", "Anxiety"], card_palette: ["#506f88", "#c8d6d9"] },
    { id: "cafe-del-mar-chill", musicRoomFit: ["champagne-bohemia"], mode: "radio", provider: "Café del Mar Radio", title: "Chill", display_title: "Café del Mar — Chill", short_title: "CHILL", stream_url: "https://streams.radio.co/se1a320b47/listen", logo_src: "a s s e t s/radio-logos/cafe-del-mar-chill.svg", brand_logo_src: "a s s e t s/radio-logos/cafe-del-mar.svg", logo_alt: "Café del Mar Chill", primary_environmental_function: "Soul + Restoration", top_needs: ["Recovery", "Belonging", "Gratitude", "Trust"], card_palette: ["#99815f", "#e3ceb3"] },
    { id: "cafe-del-mar-house", musicRoomFit: ["modul8-infinity"], mode: "radio", provider: "Café del Mar Radio", title: "House", display_title: "Café del Mar — House", short_title: "HOUSE", stream_url: "https://s4.radio.co/seeae9c220/listen", logo_src: "a s s e t s/radio-logos/cafe-del-mar-house.svg", brand_logo_src: "a s s e t s/radio-logos/cafe-del-mar.svg", logo_alt: "Café del Mar House", primary_environmental_function: "Club Energy + Festival Activation", top_needs: ["Joy", "Motivation", "Connection", "Arousal"], card_palette: ["#8a4867", "#e6a99f"] },
    { id: "groove-salad", musicRoomFit: ["champagne-bohemia"], mode: "radio", provider: "SomaFM", title: "Groove Salad", display_title: "Groove Salad", short_title: "GROOVE SALAD", stream_url: "https://ice5.somafm.com/groovesalad-128-mp3", logo_src: "a s s e t s/radio-logos/groove-salad.png", logo_alt: "Groove Salad on SomaFM", primary_environmental_function: "Focus + Flow", top_needs: ["Attention", "Executive Function", "Calm", "Recovery"], card_palette: ["#526b52", "#cad4a4"] },
    { id: "groove-salad-classic", musicRoomFit: ["champagne-bohemia"], mode: "radio", provider: "SomaFM", title: "Groove Salad Classic", display_title: "Groove Salad Classic", short_title: "GS CLASSIC", stream_url: "https://ice5.somafm.com/gsclassic-128-mp3", logo_src: "a s s e t s/radio-logos/groove-salad-classic.jpg", logo_alt: "Groove Salad Classic on SomaFM", primary_environmental_function: "Soul + Restoration", top_needs: ["Belonging", "Gratitude", "Recovery", "Calm"], card_palette: ["#725f50", "#c9b896"] },
    { id: "worldwide-fm", musicRoomFit: ["champagne-bohemia"], mode: "radio", provider: "Worldwide FM", title: "Worldwide FM", display_title: "Worldwide FM", short_title: "WORLDWIDE FM", stream_url: "https://worldwide-fm.radiocult.fm/stream", fallback_station_id: "cafe-del-mar-chill", logo_src: "a s s e t s/radio-logos/worldwide-fm.svg", logo_alt: "Worldwide FM", primary_environmental_function: "Global Culture + Discovery", top_needs: ["Curiosity", "Connection", "Belonging", "Joy"], card_palette: ["#141414", "#f1eadc"] },
    { id: "sanctuary-dark-electro", musicRoomFit: ["james-bondage"], mode: "radio", provider: "Sanctuary Radio", title: "Dark Electro", display_title: "Sanctuary — Dark Electro", short_title: "DARK ELECTRO", stream_url: "https://stream.sanctuaryradio.com/mainchannel_hq", logo_src: "a s s e t s/radio-logos/sanctuary-radio.jpg", logo_alt: "Sanctuary Radio", logo_crop: "sanctuary", primary_environmental_function: "Grit + Agency", top_needs: ["Anger", "Motivation", "Self-Actualisation", "Curiosity"], card_palette: ["#312e42", "#9c6da6"] },
    { id: "sanctuary-retro", musicRoomFit: [], mode: "radio", provider: "Sanctuary Radio", title: "Retro", display_title: "Sanctuary — Retro", short_title: "RETRO", stream_url: "https://stream.sanctuaryradio.com/retrochannel_hq", logo_src: "a s s e t s/radio-logos/sanctuary-radio.jpg", logo_alt: "Sanctuary Radio", logo_crop: "sanctuary", primary_environmental_function: "Joy + Affirmation", top_needs: ["Belonging", "Joy", "Gratitude", "Connection"], card_palette: ["#355c67", "#d57c72"] },
    { id: "nts-slow-focus", musicRoomFit: ["inner-planes", "champagne-bohemia"], mode: "radio", provider: "NTS", title: "Slow Focus", display_title: "NTS — Slow Focus", short_title: "SLOW FOCUS", stream_url: "https://streams.radiomast.io/dfc76352-cda6-4a95-85dd-6f6609f83ba2", stream_transport: "Buffered HLS scheduler", logo_src: "a s s e t s/radio-logos/nts.svg", logo_alt: "NTS Radio", primary_environmental_function: "Soul + Restoration", top_needs: ["Calm", "Recovery", "Attention", "Awe"], card_palette: ["#3c4660", "#aebbd0"] },
    { id: "nts-poolside", musicRoomFit: ["champagne-bohemia"], mode: "radio", provider: "NTS", title: "Poolside", display_title: "NTS — Poolside", short_title: "POOLSIDE", stream_url: "https://streams.radiomast.io/052d2e3c-389c-44cf-a91a-8f5e1854f4c6", stream_transport: "Buffered HLS scheduler", logo_src: "a s s e t s/radio-logos/nts.svg", logo_alt: "NTS Radio", primary_environmental_function: "Joy + Affirmation", top_needs: ["Joy", "Gratitude", "Connection", "Belonging"], card_palette: ["#2f7890", "#f2c978"] },
    { id: "nts-otaku", musicRoomFit: ["modul8-infinity"], mode: "radio", provider: "NTS", title: "Otaku", display_title: "NTS — Otaku", short_title: "OTAKU", stream_url: "https://streams.radiomast.io/7481798f-063c-42a2-8048-15ff98fe309e", stream_transport: "Buffered HLS scheduler", logo_src: "a s s e t s/radio-logos/nts.svg", logo_alt: "NTS Radio", primary_environmental_function: "Curiosity + Exploration", top_needs: ["Curiosity", "Awe", "Joy", "Self-Actualisation"], card_palette: ["#392d70", "#79d5cf"] },
    { id: "nts-low-key", musicRoomFit: ["champagne-bohemia", "modul8-infinity"], mode: "radio", provider: "NTS", title: "Low Key", display_title: "NTS — Low Key", short_title: "LOW KEY", stream_url: "https://streams.radiomast.io/de114902-ee1b-441f-91bc-5468d1e77605", stream_transport: "Buffered HLS scheduler", logo_src: "a s s e t s/radio-logos/nts.svg", logo_alt: "NTS Radio", primary_environmental_function: "Soul + Restoration", top_needs: ["Calm", "Attention", "Belonging", "Connection"], card_palette: ["#53423d", "#c5ab89"] },
  ];
  const continuation = {
    videoSrc: "a s s e t s/Homepage - Hero Background Video - Chanel 2020 Runway Show.mp4",
    roomPools: {
      "inner-planes": ["cafe-del-mar-calm", "nts-slow-focus"],
      "champagne-bohemia": ["cafe-del-mar-chill", "groove-salad", "groove-salad-classic", "worldwide-fm", "nts-poolside", "nts-low-key", "nts-slow-focus"],
      "modul8-infinity": ["cafe-del-mar-house", "nts-otaku", "nts-low-key"],
      "james-bondage": ["sanctuary-dark-electro"],
      "safety-cushion": [],
    },
  };
  const playButton = document.querySelector("[data-television-play]");
  const room = document.querySelector("[data-television-room]");
  const playerMount = document.querySelector("[data-television-player]");
  const pageView = document.querySelector("[data-television-page-view]");
  const pageFrame = document.querySelector("[data-television-page-frame]");
  const pageClose = document.querySelector("[data-television-page-close]");
  const siteShell = document.querySelector(".site-shell");
  const flowerTrigger = document.querySelector(".global-nav-trigger");
  const walletOnboarding = document.querySelector("[data-wallet-onboarding]");
  const walletOnboardingWelcome = walletOnboarding?.querySelector("[data-wallet-onboarding-welcome]");
  const walletOnboardingLineOne = walletOnboarding?.querySelector('[data-wallet-onboarding-line="one"]');
  const walletOnboardingLineTwo = walletOnboarding?.querySelector('[data-wallet-onboarding-line="two"]');
  const radarClose = document.querySelector("[data-television-radar-close]");
  const fullscreenButton = document.querySelector("[data-television-fullscreen]");
  const livePill = document.querySelector("[data-television-live-pill]");
  const liveViewerCounts = Array.from(document.querySelectorAll("[data-live-viewer-count]"));
  const liveNationsActive = document.querySelector("[data-live-nations-active]");
  const liveHappinessCreated = document.querySelector("[data-live-happiness-created]");
  const liveSharedUnlock = document.querySelector("[data-live-shared-unlock]");
  const liveSharedUnlockTrack = document.querySelector("[data-live-shared-unlock-track]");
  const communityOverlay = document.querySelector("[data-community-globe-overlay]");
  const communityGlobeFrame = document.querySelector("[data-community-globe-frame]");
  const communityGlobeBackdrop = document.querySelector("[data-community-globe-backdrop]");
  const communityGlobeClose = document.querySelector("[data-community-globe-close]");
  const reactionWallet = document.querySelector("[data-reaction-wallet]");
  const reactionWalletTrigger = document.querySelector("[data-reaction-wallet-trigger]");
  const walletCategories = document.querySelector("[data-wallet-categories]");
  const walletCategoryButtons = Array.from(document.querySelectorAll("[data-wallet-category]"));
  const walletPanels = Array.from(document.querySelectorAll("[data-wallet-panel]"));
  const walletHomeButtons = Array.from(document.querySelectorAll("[data-wallet-home]"));
  const nowPlaying = document.querySelector("[data-now-playing]");
  const nowPlayingTime = document.querySelector("[data-now-playing-time]");
  const nowPlayingStatus = document.querySelector("[data-now-playing-status]");
  const nowPlayingViewport = document.querySelector("[data-now-playing-viewport]");
  const nowPlayingTrack = document.querySelector("[data-now-playing-track]");
  const nowPlayingAudio = document.querySelector("[data-now-playing-audio]");
  const nowPlayingTitle = document.querySelector("[data-now-playing-title]");
  const nowPlayingVisual = document.querySelector("[data-now-playing-visual]");
  const nowPlayingSecondaryLabel = document.querySelector("[data-now-playing-secondary-label]");
  const nowPlayingVisualTitle = document.querySelector("[data-now-playing-visual-title]");
  const nowPlayingChannel = document.querySelector("[data-now-playing-channel]");
  const nowPlayingChannelTitle = document.querySelector("[data-now-playing-channel-title]");
  const nowPlayingAnnouncement = document.querySelector("[data-now-playing-announcement]");
  const sexEdLink = document.querySelector("[data-sex-ed-link]");
  const sexEdShelf = document.querySelector("[data-sex-ed-shelf]");
  const sexEdShelfTrack = document.querySelector("[data-sex-ed-shelf-track]");
  const sexEdShelfViewport = document.querySelector("[data-sex-ed-shelf-viewport]");
  const sexEdShelfPrevious = document.querySelector("[data-sex-ed-shelf-previous]");
  const sexEdShelfNext = document.querySelector("[data-sex-ed-shelf-next]");
  const sexEdShelfCounter = document.querySelector("[data-sex-ed-shelf-counter]");
  const sexEdShelfProgress = document.querySelector("[data-sex-ed-shelf-progress]");
  const sexEdShelfCloseButtons = Array.from(document.querySelectorAll("[data-sex-ed-shelf-close]"));
  const sexEdCards = Array.from(document.querySelectorAll("[data-sex-ed-card]"));
  const sexEdWorld = document.querySelector("[data-sex-ed-world]");
  const sexEdBackground = document.querySelector("[data-sex-ed-background]");
  const sexEdEpisodeVideo = document.querySelector("[data-sex-ed-shell-video]");
  const sexEdEpisodeStart = document.querySelector("[data-sex-ed-shell-start]");
  const comedyVideo = document.querySelector("[data-comedy-video]");
  const sexEdLoopVideos = Array.from(document.querySelectorAll(".adaptive-television-sex-ed-grid video"));
  const sexEdLoopImages = Array.from(document.querySelectorAll(".adaptive-television-sex-ed-grid img"));
  const videoModeButtons = Array.from(document.querySelectorAll("[data-video-mode]"));
  const videoSoundOpen = document.querySelector("[data-video-sound-open]");
  const videoMantraOpen = document.querySelector("[data-video-mantra-open]");
  const videoMixControls = document.querySelector("[data-video-mix-controls]");
  const videoCrossfader = document.querySelector("[data-video-crossfader]");
  const emdrGifCrossfader = document.querySelector("[data-emdr-gif-crossfader]");
  const videoMixEndpoints = Array.from(document.querySelectorAll("[data-video-mix-endpoint]"));
  const fashionRunwaySelectors = Array.from(document.querySelectorAll("[data-fashion-runway-selector]"));
  const fashionRunwaySelector = fashionRunwaySelectors[0] || null;
  const fashionRunwayPreviousButtons = Array.from(document.querySelectorAll("[data-fashion-runway-previous]"));
  const fashionRunwayNextButtons = Array.from(document.querySelectorAll("[data-fashion-runway-next]"));
  const fashionRunwayLabels = Array.from(document.querySelectorAll("[data-fashion-runway-label]"));
  const fashionRunwayCounts = Array.from(document.querySelectorAll("[data-fashion-runway-count]"));
  const fashionShelf = document.querySelector("[data-fashion-shelf]");
  const fashionShelfToggles = Array.from(document.querySelectorAll("[data-fashion-shelf-toggle]"));
  const fashionShelfToggle = fashionShelfToggles[0] || null;
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
  const programOpenButtons = Array.from(document.querySelectorAll("[data-program-open]"));
  const musicModeButtons = Array.from(document.querySelectorAll("[data-music-mode]"));
  const musicSelector = document.querySelector("[data-music-selector]");
  const musicSelectorPrevious = document.querySelector("[data-music-previous]");
  const musicSelectorNext = document.querySelector("[data-music-next]");
  const musicSelectorLabel = document.querySelector("[data-music-selector-label]");
  const musicSelectorCount = document.querySelector("[data-music-selector-count]");
  const broadcastEntry = document.querySelector("[data-broadcast-entry]");
  const broadcastEntryPanel = document.querySelector(".adaptive-broadcast-entry__panel");
  const broadcastEntryCloseButtons = Array.from(document.querySelectorAll("[data-broadcast-entry-close]"));
  const broadcastEntryArtist = document.querySelector("[data-broadcast-entry-artist]");
  const broadcastEntryTitle = document.querySelector("[data-broadcast-entry-title]");
  const broadcastEntryVibe = document.querySelector("[data-broadcast-entry-vibe]");
  const broadcastEntryFormat = document.querySelector("[data-broadcast-entry-format]");
  const broadcastJoinButton = document.querySelector("[data-broadcast-join]");
  const broadcastChooseButton = document.querySelector("[data-broadcast-choose]");
  const emdrCanvas = document.querySelector("[data-emdr-canvas]");
  const emdrToggle = document.querySelector("[data-emdr-toggle]");
  const emdrStyleButtons = Array.from(document.querySelectorAll("[data-emdr-style]"));
  const emdrReact = document.querySelector("[data-emdr-react]");
  const emdrAutomate = document.querySelector("[data-emdr-automate]");
  const emdrMantraOpen = document.querySelector("[data-emdr-mantra-open]");
  const emdrIntensity = document.querySelector("[data-emdr-intensity]");
  const emdrSoundResearch = document.querySelector("[data-emdr-sound-research]");
  const researchRolloverHosts = Array.from(document.querySelectorAll(".adaptive-television-research-tooltip-host"));
  const researchDialog = document.querySelector("[data-research-dialog]");
  const researchDialogClose = document.querySelector("[data-research-dialog-close]");
  const researchDialogCopy = document.querySelector("[data-research-dialog-copy]");
  const researchDialogPrimary = document.querySelector("[data-research-dialog-primary]");
  const researchDialogPrompt = document.querySelector("[data-research-dialog-prompt]");
  const researchDialogFrequency = document.querySelector("[data-research-dialog-frequency]");
  const researchDialogScience = document.querySelector("[data-research-dialog-science]");
  const researchDialogScienceLink = document.querySelector("[data-research-dialog-science-link]");
  const researchDialogSecondary = document.querySelector("[data-research-dialog-secondary]");
  const reactionButtons = Array.from(document.querySelectorAll("[data-television-reaction]"));
  const audioModeTrigger = document.querySelector("[data-audio-mode-open]");
  const audioWalletControls = document.querySelector("[data-audio-wallet-controls]");
  const audioWalletMic = document.querySelector("[data-audio-wallet-mic]");
  const audioWalletJoin = document.querySelector("[data-audio-wallet-join]");
  const audioWalletLeave = document.querySelector("[data-audio-wallet-leave]");
  const audioWalletCount = document.querySelector("[data-audio-wallet-count]");
  const circleRoomSelector = document.querySelector("[data-circle-room-selector]");
  const heartField = document.querySelector("[data-heart-field]");
  const supportCard = document.querySelector("[data-television-support-card]");
  const supportClose = document.querySelector("[data-television-support-close]");
  const typewriterLines = Array.from(document.querySelectorAll("[data-adaptive-typewriter]"));
  const contextLines = Array.from(document.querySelectorAll("[data-local-context-line]"));
  const televisionPageTitle = document.title;
  const entryParams = new URLSearchParams(window.location.search);
  const shopShellRequested = entryParams.get("shop") === "1";
  const requestedSexEdEpisode = /^(?:0[1-9]|1[0-4])$/.test(entryParams.get("sexEdEpisode") || "")
    ? entryParams.get("sexEdEpisode")
    : "";
  const requestedSexEdShelf = entryParams.get("sexEd") === "1" || window.location.hash === "#sex-ed-shelf";
  const shopEntryScreen = document.querySelector("[data-shop-entry-screen]");
  const shopEntryButton = document.querySelector("[data-shop-entry-button]");
  const shopEntryLabel = document.querySelector("[data-shop-entry-label]");

  if (!playButton || !room || !playerMount) return;

  let track = resolveSelectedTrack();
  let musicChannelMode = track.presentation === "live_dj_set" ? "parties" : "videos";
  let musicModeManuallySelected = false;
  let musicShelfOpen = false;
  let musicShelfOffset = 0;
  let musicShelfSwipeStartX = null;
  let musicShelfPreviewVideo = null;
  let musicShelfPreviewCard = null;
  let sexEdShelfOpen = false;
  let sexEdShelfOffset = 0;
  let sexEdShelfSwipeStartX = null;
  let sexEdShelfPreviewVideo = null;
  let sexEdShelfPreviewCard = null;
  let sexEdActiveEpisode = "01";
  let sexEdStartTime = 139;
  let sexEdNeedsInitialSeek = true;
  let sexEdReturnProgramme = null;
  let sexEdOpenSequence = 0;
  let musicCatalogueRecords = [];
  let radioStationRecords = DEFAULT_RADIO_STATIONS.map((station) => ({ ...station }));
  let musicShelfOrders = { videos: [], parties: [], radio: radioStationRecords.slice(), fashion: [] };
  let musicShelfRecommendationIds = { videos: "", parties: "", radio: "", fashion: "" };
  let activeRadioStationId = "";
  let broadcastChannelId = "";
  let fashionBroadcastChannelId = "";
  let fashionBroadcastSyncTimer = 0;
  let fashionBroadcastPairingSource = "";
  let radioVisualBroadcastChannelId = "";
  let radioVisualBroadcastSyncTimer = 0;
  let radioVisualVideo = null;
  let radioVisualRunwayIndex = -1;
  let pendingBroadcastChannelId = "";
  let pendingBroadcastFormat = "videos";
  let broadcastEntryOpen = false;
  let broadcastSyncTimer = 0;
  let broadcastJoinSequence = 0;
  let audioPartyStartSequence = 0;
  let musicContinuationSequence = 0;
  let musicSwitching = false;
  let channelLoadingOverlay = null;
  let channelLoadingTitle = null;
  let channelLoadingGeneration = 0;
  let channelLoadingIdentity = "";
  let channelLoadingStartedAt = 0;
  let channelLoadingStillTimer = 0;
  let channelLoadingHideTimer = 0;
  let musicDwellTimer = 0;
  let musicRadioPreviousBlend = 100;
  let groupQueue = [];
  let selectionIsLoading = document.body.classList.contains("adaptive-music-selection-loading");
  let hasOpened = false;
  let televisionPlaybackRequested = false;
  let pageViewPreviousBlend = null;
  let shopEntryActivated = false;
  let shopEntryFrameReady = false;
  let shopEntryMediaReady = false;
  let shopEntryMediaFallbackTimer = 0;
  let walletOnboardingEngaged = false;
  let walletOnboardingWelcomeExitTimer = 0;
  let walletOnboardingLineOneTimer = 0;
  let walletOnboardingLineTwoTimer = 0;
  let walletOnboardingDismissTimer = 0;
  let localVideoFrame = null;
  let localVideo = null;
  let activeCueIdentity = "";
  let preloadedMusicVideo = null;
  let preloadedMusicTrackId = "";
  let preloadedMusicPromise = null;
  let preloadedMusicGeneration = 0;
  let musicHandoffTimer = 0;
  let musicHandoffProgrammeInstanceId = "";
  let broadcastRolloverPromise = null;
  let broadcastRolloverFromInstanceId = "";
  let fashionVideo = null;
  let fashionHeroFrame = null;
  let fashionHeroCanvas = null;
  let fashionHeroContext = null;
  let fashionHeroFallbackTimer = 0;
  let fashionHeroVideoFrame = 0;
  let fashionHeroVideoFrameSource = null;
  let fashionHeroGeneration = 0;
  let fashionHeroLastMediaTime = -1;
  let fashionHeroLastBlend = -1;
  let fashionHeroDrawCount = 0;
  let fashionRunwayIndex = 0;
  let fashionRunwaySwitching = false;
  let fashionSelectionSource = "algorithm";
  let fashionShelfOpen = false;
  let fashionShelfReturnTarget = null;
  let fashionShelfOffset = 0;
  let fashionShelfOrder = [0, 1, 2, 3, 4, 5];
  let fashionShelfPreviewVideo = null;
  let fashionShelfPreviewCard = null;
  let fashionShelfSwipeStartX = null;
  let fashionTensorRecords = [];
  let fashionDwellTimer = 0;
  const radioFashionPreloadPool = new Map();
  const broadcastMediaSyncStates = new WeakMap();
  let requestedVideoBlend = Number(videoCrossfader?.value || 100);
  let emdrGifVideoBlend = Number(emdrGifCrossfader?.value || 0);
  let fashionBroadcastJoinSequence = 0;
  let fashionRevealGeneration = 0;
  let pendingFashionRevealPromise = null;
  let pendingFashionRevealVideo = null;
  const fashionRunways = [
    {
      assetKey: "chanel-paris-rooftops",
      brand: "Chanel",
      title: "Chanel 2020",
      shortTitle: "CHANEL 2020",
      videoSrc: "a s s e t s/Chanel - Paris 2020.mp4",
      streamUid: "f6eefc5a83e53f24990a7477ecd04010",
      previewStart: 12,
    },
    {
      assetKey: "jacquemus-le-coup-de-soleil",
      brand: "Jacquemus",
      title: "Jacquemus SS20 — Le Coup de Soleil",
      shortTitle: "JACQUEMUS",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/JACQUEMUS - SS20 LE COUP DE SOLEIL.mp4",
      streamUid: "00fe2d47012a31b3b0796fcf2e544360",
      previewStart: 18,
    },
    {
      assetKey: "annies-ibiza-runway",
      brand: "Annie’s Ibiza",
      title: "Annie’s Ibiza — Runway Film",
      shortTitle: "ANNIE’S IBIZA",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/Annie's Ibiza.mp4",
      streamUid: "30b3a8a9a753d23f089f480689bd14f6",
      previewStart: 6,
    },
    {
      assetKey: "dolce-gabbana-valley-of-the-temples",
      brand: "Dolce & Gabbana",
      title: "Dolce & Gabbana 2019",
      shortTitle: "D&G 2019",
      videoSrc: "a s s e t s/Dolce & Gabbanna - Sicily 2019.mp4",
      streamUid: "b582b1bff1de6e3952f815b9e2f79ebc",
      previewStart: 14,
    },
    {
      assetKey: "mugler-fall-winter-2021",
      brand: "Mugler",
      title: "Mugler Fall Winter 2021",
      shortTitle: "MUGLER FW21",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/Mugler - Fall Winter 2021.mp4",
      streamUid: "792c884e5d63177f32dd85a2f7e97c28",
      previewStart: 9,
    },
    {
      assetKey: "wolford-sergio-rossi-capsule",
      brand: "Wolford × Sergio Rossi",
      title: "Wolford × Sergio Rossi",
      shortTitle: "WOLFORD",
      videoSrc: "a s s e t s/f a s h i o n [ r u n w a y ]/Wolford x Sergio Rossi.mp4",
      streamUid: "90c027288fe81ad915971988aafebafd",
      previewStart: 4,
    },
    {
      assetKey: "inner-planes-radio-blue-pearl",
      brand: "ISS",
      title: "ISS - The Blue Pearl",
      shortTitle: "THE BLUE PEARL",
      videoSrc: "a s s e t s/r a d i o  v i s u a l s/ISS - The Blue Pearl.mp4",
      streamUid: "08d6983ef6584f2b8659ceaf0cfa248a",
      previewStart: 8,
      privateVisual: true,
    },
  ];
  try {
    const storedFashion = JSON.parse(window.sessionStorage.getItem("iamFashionVisualStateV1") || "null");
    const storedIndex = fashionRunways.findIndex((runway) => !runway.privateVisual && runway.assetKey === storedFashion?.assetKey);
    if (storedIndex >= 0) {
      fashionRunwayIndex = storedIndex;
      fashionSelectionSource = storedFashion?.source === "manual" ? "manual" : "algorithm";
    }
  } catch {
    // The adaptive recommendation remains available when session storage is restricted.
  }
  const RADIO_HLS_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.min.js";
  const RADIO_HLS_LIBRARY_LOAD_TIMEOUT_MS = 6000;
  const FASHION_REVEAL_BUFFER_SECONDS = 8;
  const RADIO_FASHION_REVEAL_BUFFER_SECONDS = 4;
  const RECORDED_PROGRAMME_PRIME_BUFFER_SECONDS = 4;
  const RECORDED_PROGRAMME_READY_BUFFER_SECONDS = 24;
  const SEX_ED_RECORDED_PROGRAMME_READY_BUFFER_SECONDS = 4;
  const RADIO_READY_BUFFER_SECONDS = 24;
  const RADIO_LOW_BUFFER_SECONDS = 12;
  const RADIO_BUFFER_WAIT_MS = 12000;
  const AUDIO_PARTY_START_TIMEOUT_MS = 18000;
  const SEX_ED_AUDIO_PARTY_START_TIMEOUT_MS = 30000;
  const RADIO_LIVE_SYNC_SEGMENTS = 4;
  const RADIO_MAX_LIVE_LATENCY_SEGMENTS = 5;
  const RADIO_DIRECT_STALL_MS = 6000;
  const RADIO_SEGMENT_STARTUP_BUFFER_SECONDS = 12;
  const RADIO_SEGMENT_STARTUP_COUNT = 2;
  const RADIO_SEGMENT_BUFFER_TARGET_SECONDS = 48;
  const RADIO_SEGMENT_START_DELAY_SECONDS = .35;
  const RADIO_SEGMENT_CROSSFADE_SECONDS = .035;
  const RADIO_SEGMENT_POLL_MS = 3000;
  const SEX_ED_PROGRAMME_MIX_LEVEL = .15;
  const SEX_ED_BROADCAST_CHANNEL_ID = "sex-ed";
  const VOICE_ASSISTANT_PROGRAMME_MIX_LEVEL = .15;
  const SEX_ED_DEFAULT_BACKGROUND_FILE = "a s s e t s/f a s h i o n [ r u n w a y ]/Mugler - Fall Winter 2021.mp4";
  let continuationAudio = null;
  let continuationHls = null;
  let continuationSegmentPlayer = null;
  let continuationAudioSource = "";
  let radioHlsLibraryPromise = null;
  const recordedProgrammeAudioRenditions = new Map();
  let radioHlsAttachSequence = 0;
  let radioPlaybackCleanup = null;
  let radioBufferMonitor = 0;
  let radioRecoveryTimer = 0;
  let radioWaitingCount = 0;
  let radioStalledCount = 0;
  let radioRecoveryCount = 0;
  let radioLastRecoveryAt = 0;
  let voiceAssistantDuckActive = false;
  let programmeFixedMixLevel = null;
  const voiceAssistantBaseVolumes = new Map();
  const voiceAssistantVolumeFrames = new Map();
  let shopArrivalFadeTimer = 0;
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
  const SOUND_RESEARCH_COMEDY_OUTPUT_MULTIPLIER = 0.11;
  let soundResearchMaxVolume = SOUND_RESEARCH_DEFAULT_MAX_VOLUME;
  let continuationDecision = null;
  let flowerCanvasFrame = 0;
  let flowerCanvasStarting = false;
  let timecode = null;
  let edgeCropLastScanAt = 0;

  const iohLogoPreload = new Image();
  iohLogoPreload.src = IOH_LOGO_SRC;
  if (iohLogoPreload.decode) iohLogoPreload.decode().catch(() => {});
  const floraReactionToken = document.createElement("span");
  floraReactionToken.className = "adaptive-television-reaction__glyph adaptive-television-reaction__glyph--ioh-logo adaptive-television-reaction__glyph--flora-flower";
  let liveViewerInterval = 0;
  let liveViewerCountValue = 333;
  let liveNationsActiveValue = 27;
  let liveSharedUnlockValue = 77;
  let liveSimulationUpdates = 0;
  let communityPreviousFocus = null;
  let heartBurstActive = false;
  let reactionWalletPointerReadyAt = Number.POSITIVE_INFINITY;
  let reactionWalletPointerAnchorX = null;
  let reactionWalletPointerAnchorY = null;
  let reactionWalletPointerLockTimer = 0;
  let reactionWalletCollapseTimer = 0;
  let bloomWalletCloseGuard = false;
  let nowPlayingInteractiveAt = 0;
  let nowPlayingResizeObserver = null;
  let nowPlayingTickerTimer = 0;
  let nowPlayingTickerView = "audio";
  let nowPlayingTickerViews = ["audio"];
  let nowPlayingTickerStatuses = { audio: "NOW PLAYING" };
  let nowPlayingTickerContentKey = "";
  let nowPlayingAnnouncementText = "";
  const REACTION_WALLET_POINTER_LOCK_MS = 10000;
  const REACTION_WALLET_POINTER_MOVE_PX = 2;
  let audioWalletMode = false;
  let audioWalletJoined = false;
  let audioWalletMuted = false;
  let audioWalletOccupancy = 0;
  let audioWalletCircleName = "";
  let circleTooltipArmTimer = 0;
  let videoTooltipArmTimer = 0;
  let videoTooltipOpenedAt = 0;
  const researchRolloverCloseTimers = new WeakMap();
  const RESEARCH_ROLLOVER_CLOSE_DELAY_MS = 1000;
  let activeResearchHost = null;
  let researchPreviousFocus = null;
  let audioWalletInteracting = false;
  let walletView = "closed";
  let walletControlsInteractiveAt = 0;
  const WALLET_RESUMABLE_VIEWS = new Set(["categories", "emoji", "video", "video-mix", "music", "emdr", "audio", "support", "collect"]);
  let walletResumeView = "categories";
  let mantraReturnWalletView = "emdr";
  const emdrStyleNames = ["GIF", "stellar"];
  const emdrStyleValues = [7, 5];
  let emdrStyleIndex = -1;
  let emdrGifPreviousVideoBlend = null;
  let emdrGifPreviousMusicMaxHeight = null;
  let emdrGifMusicMaxHeightCaptured = false;
  let emdrIntensityJourneyCurrent = .8;
  let emdrAutomateEnabled = false;
  let emdrUserIntensity = .8;
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

  function trackDisplayMetadataAt(candidate, playbackSeconds = 0) {
    const artist = candidate?.displayArtist || candidate?.artist || "Universal Mind";
    const title = candidate?.displayTitle || candidate?.title || "Music Television";
    const cuePoints = Array.isArray(candidate?.cuePoints) ? candidate.cuePoints : [];
    const position = Math.max(0, Number(playbackSeconds) || 0);
    let cuePoint = null;
    for (const point of cuePoints) {
      if (Number(point?.startSeconds) > position + .15) break;
      cuePoint = point;
    }
    if (!cuePoint) return { artist, title, label: `${artist} — ${title}`, cueStartSeconds: null };
    const cueArtist = String(cuePoint.artist || artist);
    const cueTitle = String(cuePoint.title || title);
    return {
      artist: cueArtist,
      title: cueTitle,
      label: `${cueArtist} — ${cueTitle}`,
      cueStartSeconds: Number(cuePoint.startSeconds) || 0,
    };
  }

  function currentTrackPlaybackSeconds() {
    if (localVideo?.dataset.musicTrackId === track.id) return Math.max(0, Number(localVideo.currentTime) || 0);
    const state = broadcastChannelId ? window.IAMBroadcastClock?.stateAt?.(broadcastChannelId) : null;
    return state?.trackId === track.id ? Math.max(0, Number(state.offsetSeconds) || 0) : 0;
  }

  function currentTrackDisplayMetadata() {
    return trackDisplayMetadataAt(track, currentTrackPlaybackSeconds());
  }

  function musicItemDisplayMetadata(item) {
    const candidate = item?.trackRef || findTrack(item?.broadcastState?.trackId || item?.id);
    if (!candidate) {
      const artist = item?.artist || item?.provider || item?.broadcastChannelName || "Universal Mind";
      const title = item?.display_title || item?.title || "Music Television";
      return { artist, title, label: `${artist} — ${title}`, cueStartSeconds: null };
    }
    const isActiveProgramme = candidate.id === track.id && item?.broadcastChannelId === broadcastChannelId;
    const position = isActiveProgramme
      ? currentTrackPlaybackSeconds()
      : Math.max(0, Number(item?.broadcastState?.offsetSeconds) || 0);
    return trackDisplayMetadataAt(candidate, position);
  }

  function syncCurrentCuePresentation(force = false) {
    const metadata = currentTrackDisplayMetadata();
    const identity = `${track.id}:${metadata.cueStartSeconds ?? "programme"}`;
    if (!force && identity === activeCueIdentity) return;
    activeCueIdentity = identity;
    document.body.dataset.adaptiveCueArtist = metadata.artist;
    document.body.dataset.adaptiveCueTitle = metadata.title;
    document.body.dataset.adaptiveCueStartSeconds = metadata.cueStartSeconds === null ? "" : String(metadata.cueStartSeconds);
    syncSelectedTrackCopy();
    setMusicTelevisionMetadata();
    updateMusicSelector();
    if (musicShelfOpen) renderMusicShelf();
  }

  window.IAMCueSheet = Object.freeze({
    version: "programme_cue_sheet_v1.0",
    metadataAt(trackId, playbackSeconds = 0) {
      const candidate = findTrack(trackId);
      return candidate ? trackDisplayMetadataAt(candidate, playbackSeconds) : null;
    },
    current() {
      return { trackId: track.id, playbackSeconds: currentTrackPlaybackSeconds(), ...currentTrackDisplayMetadata() };
    },
  });

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

  function randomCatalogueIndex(length) {
    if (length <= 1) return 0;
    if (window.crypto?.getRandomValues) {
      const randomValue = new Uint32Array(1);
      window.crypto.getRandomValues(randomValue);
      return randomValue[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  function resolveRandomNoCheckinTrack() {
    if (noCheckinRandomTrack) return noCheckinRandomTrack;

    const eligibleTracks = TRACK_CATALOGUE.filter((candidate) => (
      candidate.presentation !== "live_dj_set" &&
      !candidate.cuePoints &&
      !NO_CHECKIN_RANDOM_EXCLUDED_TRACK_IDS.has(candidate.id)
    ));
    let lastTrackId = "";
    try {
      lastTrackId = window.localStorage.getItem(NO_CHECKIN_RANDOM_LAST_TRACK_KEY) || "";
    } catch {
      lastTrackId = "";
    }

    const freshTracks = eligibleTracks.filter((candidate) => candidate.id !== lastTrackId);
    const randomPool = freshTracks.length ? freshTracks : eligibleTracks;
    noCheckinRandomTrack = randomPool[randomCatalogueIndex(randomPool.length)] || TRACK_CATALOGUE[0];

    try {
      window.localStorage.setItem(NO_CHECKIN_RANDOM_LAST_TRACK_KEY, noCheckinRandomTrack.id);
    } catch {
      // The random no-check-in experience still works when device storage is unavailable.
    }
    return noCheckinRandomTrack;
  }

  function resolveSelectedTrack() {
    const params = new URLSearchParams(window.location.search);
    const explicitTrack = params.get("track") || params.get("musicVideo") || params.get("selected_track_id");
    const explicitFile = params.get("video") || params.get("local_video_file");
    const explicit = findTrack(explicitTrack) || findTrack(explicitFile);
    if (explicit) {
      resolvedSelectionSource = "explicit_url";
      return explicit;
    }

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
        if (candidate) {
          resolvedSelectionSource = "stored_checkin";
          return candidate;
        }
      }
    }

    resolvedSelectionSource = "no_checkin_random";
    return resolveRandomNoCheckinTrack();
  }

  function syncSelectedTrackCopy() {
    const artistLine = document.querySelector(".adaptive-environment__source");
    const titleLine = document.querySelector(".adaptive-environment__station");
    const display = currentTrackDisplayMetadata();
    const artistText = display.artist;
    const titleText = display.title;
    const params = new URLSearchParams(window.location.search);
    const selectionSource = params.get("selection_source") || resolvedSelectionSource || "no_checkin_random";

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

    const display = currentTrackDisplayMetadata();

    window.navigator.mediaSession.metadata = new window.MediaMetadata({
      title: display.title,
      artist: display.artist,
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
    video.dataset.streamPriority = "optional";
    video.setAttribute("aria-hidden", "true");
    return video;
  }

  function createRadioVisualVideo(runwayIndex) {
    const runway = fashionRunways[runwayIndex];
    if (!runway) return null;
    const video = createFashionVideo(runwayIndex);
    video.className = "adaptive-television-radio-visual-video";
    video.dataset.radioVisualRunwayId = runway.assetKey;
    // This is the imminent Radio picture, not an optional Fashion preview.
    // Mark it primary before Stream attachment so constrained-startup policy
    // cannot suspend the visual while the Radio join waits for its buffer.
    video.dataset.streamPriority = "primary";
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
    fashionHeroLastBlend = -1;
    if (fashionHeroFrame) fashionHeroFrame.dataset.fashionHeroMirror = "inactive";
  }

  function drawMediaCover(context, video, targetWidth, targetHeight, alpha = 1) {
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return false;
    const sourceRatio = video.videoWidth / video.videoHeight;
    const targetRatio = targetWidth / targetHeight;
    let cropX = 0;
    let cropY = 0;
    let cropWidth = video.videoWidth;
    let cropHeight = video.videoHeight;
    if (sourceRatio > targetRatio) {
      cropWidth = video.videoHeight * targetRatio;
      cropX = (video.videoWidth - cropWidth) / 2;
    } else if (sourceRatio < targetRatio) {
      cropHeight = video.videoWidth / targetRatio;
      cropY = (video.videoHeight - cropHeight) / 2;
    }
    context.globalAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
    context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    context.globalAlpha = 1;
    return true;
  }

  function drawFashionHeroFrame(mediaTime = Number(fashionVideo?.currentTime || 0)) {
    if (!fashionHeroCanvas || !fashionHeroContext) return;
    const frameWidth = fashionHeroFrame?.clientWidth || 0;
    const frameHeight = fashionHeroFrame?.clientHeight || 0;
    if (!frameWidth || !frameHeight) return;

    const pixelRatio = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    const targetWidth = Math.max(1, Math.round(frameWidth * pixelRatio));
    const targetHeight = Math.max(1, Math.round(frameHeight * pixelRatio));
    const needsResize = fashionHeroCanvas.width !== targetWidth || fashionHeroCanvas.height !== targetHeight;
    if (
      !needsResize &&
      Math.abs(Number(mediaTime) - fashionHeroLastMediaTime) < 0.0005 &&
      Math.abs(requestedVideoBlend - fashionHeroLastBlend) < 0.001
    ) return;
    if (needsResize) {
      fashionHeroCanvas.width = targetWidth;
      fashionHeroCanvas.height = targetHeight;
    }

    try {
      fashionHeroContext.globalAlpha = 1;
      fashionHeroContext.fillStyle = "#000";
      fashionHeroContext.fillRect(0, 0, targetWidth, targetHeight);
      const musicDrawn = requestedVideoBlend > 0 && drawMediaCover(fashionHeroContext, localVideo, targetWidth, targetHeight, 1);
      const fashionDrawn = requestedVideoBlend < 100 && drawMediaCover(
        fashionHeroContext,
        fashionVideo,
        targetWidth,
        targetHeight,
        1 - (requestedVideoBlend / 100)
      );
      if (!musicDrawn && !fashionDrawn) return;
      fashionHeroLastMediaTime = Number(mediaTime);
      fashionHeroLastBlend = requestedVideoBlend;
      fashionHeroDrawCount += 1;
      fashionHeroFrame.dataset.fashionHeroMirror = "ready";
      fashionHeroFrame.dataset.emdrGifMusicAmount = requestedVideoBlend.toFixed(0);
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

    const frameSource = requestedVideoBlend >= 99.5 ? localVideo : fashionVideo;
    if (frameSource?.requestVideoFrameCallback && !frameSource.paused && frameSource.readyState >= 2) {
      fashionHeroVideoFrameSource = frameSource;
      fashionHeroVideoFrame = frameSource.requestVideoFrameCallback((_now, metadata) => {
        fashionHeroVideoFrame = 0;
        drawFashionHeroFrame(metadata?.mediaTime);
        scheduleFashionHeroMirror(generation);
      });
      return;
    }

    const fallbackDelay = frameSource?.paused ? 250 : 42;
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

    localVideo = createMusicVideoElement(track);

    timecode = document.createElement("div");
    timecode.className = "adaptive-television-timecode";
    timecode.setAttribute("aria-hidden", "true");
    timecode.textContent = "0:00";

    localVideoFrame.append(localVideo);
    playerMount.append(localVideoFrame);
    radioFashionPreloadPool.forEach((entry) => {
      if (entry.video) playerMount.append(entry.video);
    });
    playerMount.append(fashionVideo);
    playerMount.append(fashionHeroFrame);
    playerMount.append(timecode);
    attachAdaptiveStream(localVideo, track.localVideoSrc, "music", {
      autoplay: shopShellRequested ? false : undefined,
    });
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

  function updateRadioFashionPreloadDiagnostics(targetCount = null) {
    const readyCount = Array.from(radioFashionPreloadPool.values())
      .filter((entry) => entry.video?.dataset.radioFashionPreload === "ready")
      .length;
    if (targetCount !== null && Number.isFinite(Number(targetCount))) {
      document.body.dataset.radioFashionPreloadTargets = String(Number(targetCount));
    }
    document.body.dataset.radioFashionPreloadReady = String(readyCount);
  }

  function preloadRadioFashionRunway(runwayIndex) {
    const runway = fashionRunways[runwayIndex];
    if (!runway) return Promise.resolve(null);
    const existing = radioFashionPreloadPool.get(runway.assetKey);
    if (existing) return existing.promise;

    const video = createRadioVisualVideo(runwayIndex);
    if (!video) return Promise.resolve(null);
    video.dataset.radioFashionPreload = "loading";
    playerMount.insertBefore(video, fashionVideo || timecode || null);
    const entry = { video, runwayIndex, promise: null };
    entry.promise = attachAdaptiveStream(video, runway.videoSrc, "fashion", {
      preload: true,
      preloadTargetSeconds: RADIO_FASHION_REVEAL_BUFFER_SECONDS,
    })
      .then(() => window.IAMStreamController?.preloadFashion(video, {
        targetSeconds: RADIO_FASHION_REVEAL_BUFFER_SECONDS,
      }))
      .then(() => {
        video.dataset.radioFashionPreload = "ready";
        updateRadioFashionPreloadDiagnostics();
        return video;
      })
      .catch((error) => {
        video.dataset.radioFashionPreload = "error";
        video.dataset.radioFashionPreloadError = String(error?.message || error).slice(0, 140);
        window.IAMStreamController?.detach(video);
        video.remove();
        radioFashionPreloadPool.delete(runway.assetKey);
        updateRadioFashionPreloadDiagnostics();
        return null;
      });
    radioFashionPreloadPool.set(runway.assetKey, entry);
    updateRadioFashionPreloadDiagnostics();
    return entry.promise;
  }

  function releaseUnusedRadioFashionRunways(allowedAssetKeys = new Set()) {
    radioFashionPreloadPool.forEach((entry, assetKey) => {
      if (allowedAssetKeys.has(assetKey) || entry.video === radioVisualVideo) return;
      window.IAMStreamController?.release?.(entry.video, "radio_visual_not_imminent");
      entry.video?.remove?.();
      radioFashionPreloadPool.delete(assetKey);
    });
    updateRadioFashionPreloadDiagnostics(allowedAssetKeys.size);
  }

  function preloadRadioFashionRunways(channelId = broadcastChannelId) {
    Promise.resolve(window.IAMBroadcastClock?.ready)
      .then(() => {
        const radioState = window.IAMBroadcastClock?.stateAt(channelId);
        const visualChannelId = radioState?.mediaType === "radio"
          ? radioState.visualChannelId
          : radioVisualBroadcastChannelId;
        const visualState = visualChannelId ? window.IAMBroadcastClock?.stateAt(visualChannelId) : null;
        const runwayIndex = fashionRunways.findIndex((runway) => runway.assetKey === visualState?.runwayId);
        if (runwayIndex < 0) {
          releaseUnusedRadioFashionRunways(new Set());
          return null;
        }
        const allowed = new Set([fashionRunways[runwayIndex].assetKey]);
        releaseUnusedRadioFashionRunways(allowed);
        return preloadRadioFashionRunway(runwayIndex);
      })
      .catch((error) => {
        document.body.dataset.radioFashionPreloadError = String(error?.message || error).slice(0, 140);
      });
  }

  function attachAdaptiveStream(video, source, role, streamOptions = {}) {
    const fileName = String(source || "").split("/").pop();
    video.dataset.televisionStreamAttach = "waiting";
    const attach = async () => {
      if (window.IAMStreamController?.assetFor(fileName)) {
        const autoplay = typeof streamOptions.autoplay === "boolean"
          ? streamOptions.autoplay
          : streamOptions.preload
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

  function createMusicVideoElement(candidate, options = {}) {
    const video = document.createElement("video");
    video.className = "adaptive-television-local-video";
    video.controls = false;
    video.crossOrigin = "anonymous";
    video.playsInline = false;
    video.preload = options.preload ? "auto" : (shouldAutoPreloadVideo() ? "auto" : "metadata");
    video.controlsList = "nodownload noplaybackrate";
    video.disablePictureInPicture = true;
    video.setAttribute("aria-label", `${candidate.artist} - ${candidate.title}`);
    video.dataset.musicTrackId = candidate.id;
    video.dataset.streamPriority = options.standby ? "handoff" : "primary";
    if (options.standby) video.setAttribute("data-stream-standby", "");

    if (options.standby) {
      video.setAttribute("aria-hidden", "true");
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      video.style.zIndex = "2";
    }

    video.addEventListener("canplay", () => {
      if (video !== localVideo) return;
      playerMount.classList.add("is-local-video-ready");
      scheduleEdgeCropScan(video, 120);
    });

    video.addEventListener("waiting", () => {
      if (video === localVideo) playerMount.classList.add("is-local-video-waiting");
    });

    video.addEventListener("playing", () => {
      if (video !== localVideo) return;
      playerMount.classList.add("is-local-video-ready");
      playerMount.classList.remove("is-local-video-waiting");
      video.dataset.televisionStreamPlay = "playing";
      delete video.dataset.televisionStreamError;
      const loadingGeneration = Number(video.dataset.channelLoadingGeneration || 0);
      if (loadingGeneration) {
        delete video.dataset.channelLoadingGeneration;
        finishChannelLoading(loadingGeneration);
      }
      scheduleEdgeCropScan(video, 480);
    });

    video.addEventListener("error", () => {
      if (video !== localVideo) {
        video.dataset.musicHandoffState = "error";
        return;
      }
      const loadingGeneration = Number(video.dataset.channelLoadingGeneration || 0);
      if (loadingGeneration) {
        delete video.dataset.channelLoadingGeneration;
        failChannelLoading(loadingGeneration);
      }
      playerMount.classList.add("is-local-video-error");
      mountYouTubeFallback();
    });

    video.addEventListener("loadedmetadata", () => {
      if (video !== localVideo) return;
      updateTimecode();
      syncCurrentCuePresentation(true);
      scheduleEdgeCropScan(video, 260);
    });
    video.addEventListener("timeupdate", () => {
      if (video !== localVideo) return;
      updateTimecode();
      syncCurrentCuePresentation();
      scheduleEdgeCropScan(video, 0);
    });
    video.addEventListener("seeked", () => {
      if (video === localVideo) syncCurrentCuePresentation(true);
    });
    video.addEventListener("ended", () => {
      if (video === localVideo) startTelevisionContinuation();
    });
    return video;
  }

  function clearMusicHandoffTimer() {
    if (musicHandoffTimer) window.clearTimeout(musicHandoffTimer);
    musicHandoffTimer = 0;
    musicHandoffProgrammeInstanceId = "";
  }

  async function synchronizeBroadcastRollover(previousProgrammeInstanceId = "") {
    if (!broadcastChannelId || !window.IAMBroadcastClock) return null;
    const channelId = broadcastChannelId;
    const previousInstanceId = String(previousProgrammeInstanceId || "");
    if (broadcastRolloverPromise && broadcastRolloverFromInstanceId === previousInstanceId) {
      return broadcastRolloverPromise;
    }

    const startedAt = window.performance?.now?.() || Date.now();
    document.body.dataset.broadcastRolloverState = "waiting";
    document.body.dataset.broadcastRolloverFromInstance = previousInstanceId;
    const rolloverPromise = (async () => {
      while (broadcastChannelId === channelId) {
        const state = window.IAMBroadcastClock?.stateAt(channelId);
        const elapsedMs = (window.performance?.now?.() || Date.now()) - startedAt;
        if (state && (!previousInstanceId || state.programmeInstanceId !== previousInstanceId)) {
          document.body.dataset.broadcastRolloverState = "ready";
          document.body.dataset.broadcastRolloverWaitMs = String(Math.round(elapsedMs));
          const synchronizedState = await synchronizeBroadcastPlayback(false);
          document.body.dataset.broadcastRolloverState = "complete";
          return synchronizedState;
        }
        if (elapsedMs >= BROADCAST_ROLLOVER_WAIT_MS) {
          document.body.dataset.broadcastRolloverState = "timeout";
          document.body.dataset.broadcastRolloverWaitMs = String(Math.round(elapsedMs));
          return synchronizeBroadcastPlayback(false);
        }
        await wait(BROADCAST_ROLLOVER_POLL_MS);
      }
      return null;
    })();
    broadcastRolloverPromise = rolloverPromise;
    broadcastRolloverFromInstanceId = previousInstanceId;
    try {
      return await rolloverPromise;
    } finally {
      if (broadcastRolloverPromise === rolloverPromise) {
        broadcastRolloverPromise = null;
        broadcastRolloverFromInstanceId = "";
      }
    }
  }

  function discardPreloadedMusicVideo(reason = "cancelled") {
    const video = preloadedMusicVideo;
    preloadedMusicGeneration += 1;
    preloadedMusicVideo = null;
    preloadedMusicTrackId = "";
    preloadedMusicPromise = null;
    delete document.body.dataset.broadcastPreloadTrackId;
    document.body.dataset.broadcastPreloadState = reason;
    if (!video || video === localVideo) return;
    try { video.pause(); } catch {}
    window.IAMStreamController?.detach(video);
    video.remove();
  }

  function waitForAlignedMusicVideo(video, channelId, trackId, options = {}) {
    const minimumBufferSeconds = Math.max(0, Number(options.minimumBufferSeconds) || 0);
    const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 12000);
    const maximumCorrections = Math.max(1, Number(options.maximumCorrections) || 3);
    const startedAt = window.performance?.now?.() || Date.now();
    return new Promise((resolve) => {
      let settled = false;
      let correctionCount = 0;
      let correctionInFlight = null;
      const finish = (ready) => {
        if (settled) return;
        settled = true;
        video.dataset.musicHandoffAlignmentCorrections = String(correctionCount);
        document.body.dataset.broadcastHandoffAlignmentCorrections = String(correctionCount);
        resolve(ready);
      };
      const sample = () => {
        if (settled || correctionInFlight) return;
        const state = window.IAMBroadcastClock?.stateAt(channelId);
        const elapsedMs = (window.performance?.now?.() || Date.now()) - startedAt;
        if (!state || state.trackId !== trackId) {
          finish(false);
          return;
        }
        const driftSeconds = Number(video.currentTime || 0) - state.offsetSeconds;
        const bufferSeconds = window.IAMStreamController?.bufferedAhead?.(video) || 0;
        const mediaReady = !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
        const bufferReady = bufferSeconds + .15 >= minimumBufferSeconds;
        document.body.dataset.broadcastHandoffDriftSeconds = driftSeconds.toFixed(3);
        document.body.dataset.broadcastHandoffCandidateBufferSeconds = bufferSeconds.toFixed(3);
        if (mediaReady && bufferReady) {
          if (Math.abs(driftSeconds) <= .5) {
            video.dataset.musicHandoffState = "aligned";
            document.body.dataset.broadcastHandoffState = "aligned_single_attach";
            finish(true);
            return;
          }
          if (!video.seeking && correctionCount < maximumCorrections) {
            correctionCount += 1;
            video.dataset.musicHandoffState = "correcting";
            document.body.dataset.broadcastHandoffState = "correcting_single_attach";
            correctionInFlight = seekBroadcastVideo(video, state.offsetSeconds, {
              reason: "handoff_alignment",
              channelId,
              programmeInstanceId: state.programmeInstanceId,
              driftSeconds,
            })
              .catch((error) => {
                video.dataset.musicHandoffAlignmentError = String(error?.message || error).slice(0, 140);
              })
              .finally(() => {
                correctionInFlight = null;
                window.setTimeout(sample, 40);
              });
            return;
          }
        }
        if (elapsedMs >= timeoutMs || video.error) {
          video.dataset.musicHandoffState = video.error ? "media_error" : "alignment_timeout";
          document.body.dataset.broadcastHandoffState = video.error ? "media_error" : "alignment_timeout";
          finish(false);
          return;
        }
        window.setTimeout(sample, 80);
      };
      sample();
    });
  }

  function seekIncomingMusicVideo(video, targetSeconds, state = null) {
    if (!video || !Number.isFinite(targetSeconds)) return;
    const seek = () => {
      window.IAMStreamController?.noteControlledSeek?.(video, {
        role: "music",
        programme_instance_id: state?.programmeInstanceId || "",
        broadcast_channel_id: state?.channelId || broadcastChannelId,
        seek_reason: "handoff_alignment",
      });
      try {
        video.currentTime = targetSeconds;
        if (state?.programmeInstanceId) video.dataset.musicHandoffAlignedInstance = state.programmeInstanceId;
      } catch {}
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
  }

  async function preloadUpcomingMusicVideo(state) {
    if (
      !state ||
      state.mediaType !== "video" ||
      state.channelId !== broadcastChannelId ||
      state.remainingSeconds > MUSIC_HANDOFF_PRELOAD_LEAD_SECONDS
    ) return null;
    const nextTrack = findTrack(state.nextTrackId);
    if (!nextTrack || nextTrack.id === track.id) return null;
    if (preloadedMusicTrackId === nextTrack.id && preloadedMusicPromise) return preloadedMusicPromise;

    discardPreloadedMusicVideo("replaced");
    const generation = ++preloadedMusicGeneration;
    const video = createMusicVideoElement(nextTrack, { standby: true, preload: true });
    preloadedMusicVideo = video;
    preloadedMusicTrackId = nextTrack.id;
    document.body.dataset.broadcastPreloadTrackId = nextTrack.id;
    document.body.dataset.broadcastPreloadState = "loading";
    localVideoFrame?.append(video);

    preloadedMusicPromise = attachAdaptiveStream(video, nextTrack.localVideoSrc, "music", {
      preload: true,
      preloadTargetSeconds: MUSIC_HANDOFF_BUFFER_SECONDS,
    })
      .then(() => window.IAMStreamController?.preloadMedia?.(video, {
        targetSeconds: MUSIC_HANDOFF_BUFFER_SECONDS,
      }))
      .then((readiness) => {
        if (generation !== preloadedMusicGeneration || video !== preloadedMusicVideo) return null;
        video.dataset.musicHandoffState = "ready";
        video.dataset.musicHandoffBufferSeconds = Number(readiness?.bufferSeconds || 0).toFixed(3);
        document.body.dataset.broadcastPreloadState = "ready";
        return video;
      })
      .catch((error) => {
        if (generation !== preloadedMusicGeneration || video !== preloadedMusicVideo) return null;
        video.dataset.musicHandoffState = "error";
        video.dataset.televisionStreamError = String(error?.message || error).slice(0, 160);
        document.body.dataset.broadcastPreloadState = "error";
        preloadedMusicPromise = null;
        return null;
      });
    return preloadedMusicPromise;
  }

  function scheduleUpcomingMusicHandoff(state) {
    if (!state || state.mediaType !== "video" || state.channelId !== broadcastChannelId) return;
    if (musicHandoffProgrammeInstanceId !== state.programmeInstanceId) {
      clearMusicHandoffTimer();
      musicHandoffProgrammeInstanceId = state.programmeInstanceId;
      musicHandoffTimer = window.setTimeout(() => {
        musicHandoffTimer = 0;
        document.body.dataset.broadcastHandoffState = "rollover_due";
        synchronizeBroadcastRollover(state.programmeInstanceId).catch((error) => {
          document.body.dataset.broadcastSyncError = String(error?.message || error).slice(0, 140);
        });
      }, Math.max(80, Math.round((state.remainingSeconds + .04) * 1000)));
    }
    preloadUpcomingMusicVideo(state).catch((error) => {
      document.body.dataset.broadcastPreloadState = "error";
      document.body.dataset.broadcastPreloadError = String(error?.message || error).slice(0, 140);
    });
  }

  async function createOnDemandMusicHandoffVideo(nextTrack, channelId) {
    discardPreloadedMusicVideo("on_demand_replaced");
    const video = createMusicVideoElement(nextTrack, { standby: true, preload: true });
    video.dataset.musicHandoffState = "on_demand_loading";
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    localVideoFrame?.append(video);
    await attachAdaptiveStream(video, nextTrack.localVideoSrc, "music", { autoplay: false });
    const state = window.IAMBroadcastClock?.stateAt(channelId);
    if (!state || state.trackId !== nextTrack.id) {
      window.IAMStreamController?.detach(video);
      video.remove();
      return null;
    }
    seekIncomingMusicVideo(video, state.offsetSeconds, state);
    video.playbackRate = 1;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.dataset.streamPlayRequestedAt = String(window.performance?.now?.() || Date.now());
    (window.IAMStreamController?.play?.(video) || video.play())?.catch?.(() => {});
    const aligned = await waitForAlignedMusicVideo(video, channelId, nextTrack.id, {
      minimumBufferSeconds: 4,
      timeoutMs: 9000,
    });
    if (aligned) return video;
    try { video.pause(); } catch {}
    window.IAMStreamController?.detach(video);
    video.remove();
    return null;
  }

  async function activateBufferedMusicHandoff(nextTrack, options = {}) {
    const channelId = options.broadcastChannelId;
    if (!channelId || !localVideo || !localVideoFrame) return null;
    let incoming = null;
    if (preloadedMusicTrackId === nextTrack.id && preloadedMusicPromise) {
      incoming = await preloadedMusicPromise;
    }
    if (!incoming) incoming = await createOnDemandMusicHandoffVideo(nextTrack, channelId);
    if (!incoming) return null;

    if (incoming === preloadedMusicVideo) {
      preloadedMusicVideo = null;
      preloadedMusicTrackId = "";
      preloadedMusicPromise = null;
      preloadedMusicGeneration += 1;
    }
    const oldVideo = localVideo;
    const state = window.IAMBroadcastClock?.stateAt(channelId);
    if (!state || state.trackId !== nextTrack.id) {
      try { incoming.pause(); } catch {}
      window.IAMStreamController?.detach(incoming);
      incoming.remove();
      return null;
    }
    const incomingDrift = Number(incoming.currentTime || 0) - state.offsetSeconds;
    if (incoming.dataset.musicHandoffAlignedInstance !== state.programmeInstanceId || Math.abs(incomingDrift) > .5) {
      seekIncomingMusicVideo(incoming, state.offsetSeconds, state);
    }
    incoming.playbackRate = 1;
    incoming.muted = true;
    incoming.defaultMuted = true;
    incoming.volume = 0;
    (window.IAMStreamController?.play?.(incoming) || incoming.play())?.catch?.(() => {});
    const aligned = await waitForAlignedMusicVideo(incoming, channelId, nextTrack.id, {
      minimumBufferSeconds: 4,
      timeoutMs: 4000,
    });
    if (!aligned) {
      try { incoming.pause(); } catch {}
      window.IAMStreamController?.detach(incoming);
      incoming.remove();
      return null;
    }

    try { oldVideo.pause(); } catch {}
    oldVideo.muted = true;
    oldVideo.setAttribute("aria-hidden", "true");
    localVideo = incoming;
    track = nextTrack;
    incoming.removeAttribute("data-stream-standby");
    window.IAMStreamController?.setPriority?.(incoming, "primary");
    window.IAMStreamController?.setPriority?.(oldVideo, "optional");
    incoming.removeAttribute("aria-hidden");
    incoming.style.pointerEvents = "";
    incoming.defaultMuted = false;
    incoming.dataset.musicHandoffState = "active";
    playerMount.classList.add("is-local-video-ready");
    playerMount.classList.remove("is-local-video-waiting", "is-local-video-error");
    playLocalVideo(incoming);
    incoming.playbackRate = 1;
    incoming.style.opacity = "";
    document.body.dataset.broadcastPreloadState = "consumed";
    document.body.dataset.broadcastHandoffState = "complete";
    document.body.dataset.broadcastHandoffTrackId = nextTrack.id;
    document.body.dataset.broadcastHandoffPlaybackRate = incoming.playbackRate.toFixed(2);
    document.body.dataset.broadcastHandoffBufferSeconds = (window.IAMStreamController?.bufferedAhead?.(incoming) || 0).toFixed(3);
    window.setTimeout(() => {
      window.IAMStreamController?.detach(oldVideo);
      oldVideo.remove();
    }, MUSIC_HANDOFF_CROSSFADE_MS + 80);
    return incoming;
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
    const source = document.body.classList.contains("television-comedy-active")
      ? comedyVideo
      : document.body.classList.contains("television-sex-ed-active")
        ? sexEdEpisodeVideo
        : localVideo;
    if (!timecode || !source) return;

    timecode.textContent = formatTime(source.currentTime);
  }

  function updateLiveCommunitySummary(total) {
    const roundedCitizens = Math.max(0, Math.round(total));
    const happinessCreated = roundedCitizens * 3.33 * 77;

    if (liveNationsActive) liveNationsActive.textContent = String(liveNationsActiveValue);
    if (liveHappinessCreated) liveHappinessCreated.textContent = `${Math.ceil(happinessCreated / 1000)}K`;
    if (liveSharedUnlock) liveSharedUnlock.textContent = `${liveSharedUnlockValue}%`;
    if (liveSharedUnlockTrack) {
      liveSharedUnlockTrack.style.setProperty("--community-unlock-progress", `${liveSharedUnlockValue}%`);
      liveSharedUnlockTrack.setAttribute("aria-valuenow", String(liveSharedUnlockValue));
    }
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
    startLiveViewerSimulation();
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

    liveViewerCountValue = 333;
    liveNationsActiveValue = 27;
    liveSharedUnlockValue = 77;
    liveSimulationUpdates = 0;
    renderLiveViewerCount();
    updateLiveCommunitySummary(liveViewerCountValue);

    liveViewerInterval = window.setInterval(() => {
      liveSimulationUpdates += 1;
      const audienceChange = Math.floor(Math.random() * 10) - 4;
      liveViewerCountValue = clamp(liveViewerCountValue + audienceChange, 318, 348);

      if (liveSimulationUpdates % 4 === 0 && Math.random() > 0.45) {
        liveNationsActiveValue = clamp(liveNationsActiveValue + Math.floor(Math.random() * 3) - 1, 24, 31);
      }

      renderLiveViewerCount();
      updateLiveCommunitySummary(liveViewerCountValue);
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

  function releaseDoveFlowerDrop({ shared = false, density = 1 } = {}) {
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

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = shared
      ? (reducedMotion ? 18 : Math.min(72, 42 + (Math.max(1, Math.min(3, density)) * 10)))
      : (reducedMotion ? 24 : 108);
    for (let index = 0; index < total; index += 1) spawnDroppedFlower(index, total);

    window.setTimeout(() => {
      heartBurstActive = false;
    }, 4300);
  }

  function releaseReactionFlood(type = "daisy", { shared = false, density = 1 } = {}) {
    if (!heartField || heartBurstActive) return;

    if (type === "dove") {
      releaseDoveFlowerDrop({ shared, density });
      return;
    }

    heartBurstActive = true;
    heartField.replaceChildren();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = shared
      ? (reducedMotion ? 12 : Math.min(52, 28 + (Math.max(1, Math.min(3, density)) * 8)))
      : (reducedMotion ? 22 : 86);
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

  function hideResearchDialog(host, restoreFocus = false) {
    if (host && activeResearchHost && host !== activeResearchHost) return;
    const previousFocus = researchPreviousFocus;
    activeResearchHost = null;
    researchPreviousFocus = null;
    document.body.classList.remove("research-details-open");
    researchDialog?.setAttribute("aria-hidden", "true");
    if (researchDialog) researchDialog.inert = true;
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }

  function showResearchDialog(host) {
    const primary = host.querySelector(".adaptive-television-research-tooltip__primary");
    const prompt = host.querySelector(".adaptive-television-research-tooltip__prompt");
    const secondary = host.querySelector(".adaptive-television-research-tooltip__secondary");
    const frequency = host.dataset.researchFrequency?.trim() || "";
    const scienceHref = host.dataset.researchScienceHref?.trim() || "";
    if (!researchDialog || !researchDialogCopy || !primary || !prompt || !secondary) return;
    activeResearchHost = host;
    researchPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (researchDialogPrimary) researchDialogPrimary.textContent = primary.textContent;
    if (researchDialogPrompt) researchDialogPrompt.textContent = prompt.textContent;
    if (researchDialogFrequency) {
      researchDialogFrequency.textContent = frequency;
      researchDialogFrequency.hidden = !frequency;
    }
    if (researchDialogScience) researchDialogScience.hidden = !scienceHref;
    if (researchDialogScienceLink && scienceHref) researchDialogScienceLink.href = scienceHref;
    if (researchDialogSecondary) researchDialogSecondary.textContent = secondary.textContent;
    researchDialog.setAttribute("aria-label", host.classList.contains("adaptive-television-research-tooltip-host--sound") ? "Sound research information" : "EMDR research information");
    researchDialog.setAttribute("aria-hidden", "false");
    researchDialog.inert = false;
    document.body.classList.add("research-details-open");
    window.requestAnimationFrame(() => researchDialogCopy.focus({ preventScroll: true }));
  }

  function closeResearchRollover(host, restoreFocus = false) {
    clearResearchTimer(researchRolloverCloseTimers, host);
    host.classList.remove(
      "is-research-rollover-open",
      "is-research-details-active",
      "is-research-details-pinned"
    );
    host.querySelector(".adaptive-television-research-tooltip__more")?.setAttribute("aria-expanded", "false");
    hideResearchDialog(host, restoreFocus);
  }

  function closeAllResearchRollovers(exceptHost = null, restoreFocus = false) {
    researchRolloverHosts.forEach((host) => {
      if (host !== exceptHost) closeResearchRollover(host, restoreFocus);
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
    host.classList.add("is-research-details-active");
    host.querySelector(".adaptive-television-research-tooltip__more")?.setAttribute("aria-expanded", "true");
    showResearchDialog(host);
  }

  function openSoundResearchDetails() {
    const host = document.querySelector("[data-sound-research-source]");
    if (!host) return;
    openResearchDetails(host);
  }

  function researchRolloverIsArmed() {
    return Boolean(reactionWallet?.classList.contains("is-video-tooltip-armed"));
  }

  function setWalletView(nextView, { remember = true } = {}) {
    if (!reactionWallet) return;
    if (nextView !== "video-mix" && fashionShelfOpen) closeFashionShelf(false);
    if (nextView !== "music" && musicShelfOpen) closeMusicShelf(false);
    if (sexEdShelfOpen) closeSexEdShelf(false);
    if (nextView !== walletView) closeAllResearchRollovers();
    walletView = nextView;
    reactionWallet.dataset.walletView = nextView;
    if (remember && WALLET_RESUMABLE_VIEWS.has(nextView)) {
      walletResumeView = nextView;
      reactionWallet.dataset.walletResumeView = nextView;
    }
    const isOpen = nextView !== "closed";
    reactionWallet.classList.toggle("is-reaction-wallet-open", isOpen && nextView !== "audio");
    reactionWallet.classList.remove("is-reaction-wallet-closing");
    reactionWalletTrigger?.setAttribute("aria-expanded", String(isOpen));
    emdrMantraOpen?.setAttribute("aria-expanded", String(document.body.classList.contains("mantra-sampler-open")));
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
    const display = currentTrackDisplayMetadata();
    return {
      mode: track.presentation === "live_dj_set" ? "parties" : "videos",
      label: display.label,
    };
  }

  function currentNowPlayingChannel(media = currentNowPlayingMedia()) {
    const broadcastState = broadcastChannelId
      ? window.IAMBroadcastClock?.stateAt?.(broadcastChannelId)
      : null;
    const station = media.mode === "radio"
      ? (radioStationRecords.find((candidate) => candidate.id === activeRadioStationId) || stationForId(activeRadioStationId))
      : null;
    const stationRooms = station?.music_room_fit || station?.musicRoomFit || [];
    const editorialId = String(
      broadcastState?.editorialId ||
      (media.mode === "radio" ? stationRooms[0] : track?.musicRoom) ||
      ""
    ).toLowerCase();
    return {
      editorialId,
      name: broadcastState?.channelName || MUSIC_CHANNEL_NAMES[editorialId] || "",
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
      const activeContent = nowPlayingTrack.querySelector(
        ".adaptive-television-now-playing__item.is-active:not([hidden]) .adaptive-television-now-playing__content"
      );
      const availableContents = Array.from(nowPlayingTrack.querySelectorAll(
        ".adaptive-television-now-playing__item:not([hidden]) .adaptive-television-now-playing__content"
      ));
      const stableWidth = Math.min(350, Math.max(0, ...availableContents.map((content) => Math.ceil(content.scrollWidth || 0))));
      nowPlayingViewport.style.width = stableWidth > 0 ? `${stableWidth}px` : "auto";
      const overflow = Math.max(0, (activeContent?.scrollWidth || 0) - nowPlayingViewport.clientWidth);
      nowPlaying.classList.toggle("is-overflowing", overflow > 4);
      nowPlaying.style.setProperty("--now-playing-overflow", `${-Math.ceil(overflow)}px`);
    });
  }

  function setNowPlayingTickerView(nextView) {
    if (!nowPlaying || !nowPlayingAudio || !nowPlayingVisual || !nowPlayingChannel) return;
    const tickerItems = {
      audio: nowPlayingAudio,
      visual: nowPlayingVisual,
      channel: nowPlayingChannel,
    };
    nowPlayingTickerView = nowPlayingTickerViews.includes(nextView)
      ? nextView
      : (nowPlayingTickerViews[0] || "audio");
    Object.entries(tickerItems).forEach(([view, item]) => {
      const active = view === nowPlayingTickerView;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-hidden", String(!active));
    });
    if (nowPlayingStatus) {
      nowPlayingStatus.textContent = nowPlayingTickerStatuses[nowPlayingTickerView] || "NOW PLAYING";
    }
    nowPlaying.dataset.nowPlayingTicker = nowPlayingTickerView;
    updateNowPlayingOverflow();
  }

  function restartNowPlayingTicker(views = ["audio"], statuses = { audio: "NOW PLAYING" }, contentKey = "") {
    const nextViews = Array.from(new Set(views)).filter((view) => ["audio", "visual", "channel"].includes(view));
    if (!nextViews.length) nextViews.push("audio");
    const nextStatuses = { audio: "NOW PLAYING", ...statuses };
    const nextContentKey = String(contentKey || "");
    const preserveCadence = nextContentKey === nowPlayingTickerContentKey
      && nextViews.length === nowPlayingTickerViews.length
      && nextViews.every((view, index) => view === nowPlayingTickerViews[index])
      && nextViews.every((view) => nextStatuses[view] === nowPlayingTickerStatuses[view])
      && nextViews.includes(nowPlayingTickerView);
    if (preserveCadence) return;

    window.clearInterval(nowPlayingTickerTimer);
    nowPlayingTickerTimer = 0;
    nowPlayingTickerViews = nextViews;
    nowPlayingTickerStatuses = nextStatuses;
    nowPlayingTickerContentKey = nextContentKey;
    setNowPlayingTickerView(nowPlayingTickerViews.includes("audio") ? "audio" : nowPlayingTickerViews[0]);
    if (nowPlayingTickerViews.length < 2) return;
    nowPlayingTickerTimer = window.setInterval(() => {
      const currentIndex = Math.max(0, nowPlayingTickerViews.indexOf(nowPlayingTickerView));
      setNowPlayingTickerView(nowPlayingTickerViews[(currentIndex + 1) % nowPlayingTickerViews.length]);
    }, 7000);
  }

  function announceNowPlaying(message) {
    if (!nowPlayingAnnouncement || !message || message === nowPlayingAnnouncementText) return;
    nowPlayingAnnouncementText = message;
    nowPlayingAnnouncement.textContent = message;
  }

  function currentSexEdNowPlaying() {
    if (!document.body.classList.contains("television-sex-ed-active")) return null;
    const episode = document.body.dataset.sexEdEpisode || "";
    const card = sexEdCards.find((candidate) => candidate.dataset.sexEdEpisode === episode);
    const title = document.body.dataset.sexEdEpisodeTitle
      || card?.querySelector(".adaptive-television-fashion-card__copy strong")?.textContent?.trim()
      || "";
    const guest = document.body.dataset.sexEdEpisodeGuest
      || card?.querySelector(".adaptive-television-fashion-card__copy > span")?.textContent?.trim()
      || "";
    if (!title) return null;
    return {
      episode,
      title,
      guest,
      label: guest ? `${title} — ${guest}` : title,
    };
  }

  function currentComedyNowPlaying() {
    if (!document.body.classList.contains("television-comedy-active")) return null;
    const programme = document.body.dataset.comedyProgrammeTitle || "";
    const segment = document.body.dataset.comedySegmentTitle || "";
    const label = document.body.dataset.comedyNowPlayingLabel || [programme, segment].filter(Boolean).join(" · ");
    if (!label) return null;
    return {
      programme,
      segment,
      artist: document.body.dataset.comedyProgrammeArtist || "",
      label,
    };
  }

  function updateNowPlaying() {
    if (!nowPlaying) return;
    const media = currentNowPlayingMedia();
    const channel = currentNowPlayingChannel(media);
    const sexEdProgramme = currentSexEdNowPlaying();
    const comedyProgramme = currentComedyNowPlaying();
    const radioState = document.body.dataset.radioPlaybackState || "stopped";
    const state = media.mode === "radio"
      ? (radioState === "error" ? "error" : radioState === "loading" ? "loading" : "live")
      : "playing";
    const modeLabel = media.mode === "parties" ? "PARTY" : media.mode === "radio" ? "RADIO" : "VIDEO";
    const activeRunway = fashionRunways[fashionRunwayIndex];
    const radioRunway = fashionRunways[radioVisualRunwayIndex];
    const radioActive = Boolean(activeRadioStationId && document.body.classList.contains("television-radio-continuation"));
    const fashionVisible = Boolean(activeRunway && requestedVideoBlend < 99.5);
    const radioVisualVisible = Boolean(radioActive && radioRunway && requestedVideoBlend >= 99.5);
    const visibleRunway = fashionVisible ? activeRunway : radioVisualVisible ? radioRunway : null;
    const primaryLabel = comedyProgramme?.label || sexEdProgramme?.label || media.label;
    const secondaryLabel = sexEdProgramme ? "MUSIC" : "FASHION";
    const secondaryTitle = sexEdProgramme ? media.label : (visibleRunway?.title || "");
    const secondaryAvailable = comedyProgramme ? false : (sexEdProgramme ? Boolean(media.label) : Boolean(visibleRunway));
    const channelAvailable = !comedyProgramme && !sexEdProgramme && Boolean(channel.name);
    const tickerViews = ["audio"];
    const tickerStatuses = {
      audio: comedyProgramme ? "COMEDY" : (media.mode === "radio" && !sexEdProgramme ? "RADIO" : "NOW PLAYING"),
    };
    if (secondaryAvailable) {
      tickerViews.push("visual");
      tickerStatuses.visual = secondaryLabel;
    }
    if (channelAvailable) {
      tickerViews.push("channel");
      tickerStatuses.channel = "CHANNEL";
    }

    if (nowPlayingTitle) nowPlayingTitle.textContent = primaryLabel;
    if (nowPlayingVisual) nowPlayingVisual.hidden = !secondaryAvailable;
    if (nowPlayingSecondaryLabel) nowPlayingSecondaryLabel.textContent = secondaryLabel;
    if (nowPlayingVisualTitle) nowPlayingVisualTitle.textContent = secondaryTitle;
    if (nowPlayingChannel) nowPlayingChannel.hidden = !channelAvailable;
    if (nowPlayingChannelTitle) nowPlayingChannelTitle.textContent = channel.name;
    nowPlaying.dataset.nowPlayingState = state;
    nowPlaying.dataset.nowPlayingMode = comedyProgramme ? "comedy" : (sexEdProgramme ? "sex-ed" : media.mode);
    nowPlaying.dataset.nowPlayingChannel = channelAvailable ? channel.editorialId : "";
    nowPlaying.setAttribute(
      "aria-label",
      comedyProgramme
        ? `Open the Comedy programme. Now playing: ${comedyProgramme.label}`
        : sexEdProgramme
        ? `Open sex-ed episodes. Now playing: ${sexEdProgramme.label}. Music: ${media.label}`
        : `Open ${modeLabel.toLowerCase()} recommendations. ${media.mode === "radio" ? "Radio" : "Now playing"}: ${media.label}${visibleRunway ? `. Fashion: ${visibleRunway.title}` : ""}${channelAvailable ? `. Channel: ${channel.name}` : ""}`
    );
    announceNowPlaying(
      comedyProgramme
        ? `Comedy now playing ${comedyProgramme.label}.`
        : sexEdProgramme
        ? `Now playing ${sexEdProgramme.label}. Music ${media.label}.`
        : `${media.mode === "radio" ? "Radio" : "Now playing"} ${media.label}.${visibleRunway ? ` Fashion ${visibleRunway.title}.` : ""}${channelAvailable ? ` Channel ${channel.name}.` : ""}`
    );
    updateNowPlayingClock();
    restartNowPlayingTicker(
      tickerViews,
      tickerStatuses,
      [comedyProgramme ? "comedy" : media.mode, primaryLabel, secondaryLabel, secondaryTitle, channel.editorialId, channel.name].join("\u241f")
    );
  }

  function openNowPlayingRecommendations(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (Date.now() < nowPlayingInteractiveAt) return;
    if (currentComedyNowPlaying()) {
      window.IAMProgrammeGuide?.open?.(event);
      return;
    }
    if (currentSexEdNowPlaying()) {
      openSexEdShelf();
      return;
    }
    const media = currentNowPlayingMedia();
    setMusicMode(media.mode, { manual: false });
    setWalletView("music");
    openMusicShelf();
  }

  window.IAMNowPlaying = {
    version: "wallet_now_playing_v1.3",
    getState() {
      const media = currentNowPlayingMedia();
      const channel = currentNowPlayingChannel(media);
      const sexEdProgramme = currentSexEdNowPlaying();
      const comedyProgramme = currentComedyNowPlaying();
      return {
        time: nowPlayingTime?.textContent || "",
        status: nowPlayingStatus?.textContent || "",
        mode: comedyProgramme ? "comedy" : (sexEdProgramme ? "sex-ed" : media.mode),
        title: comedyProgramme?.label || sexEdProgramme?.label || media.label,
        secondaryLabel: nowPlayingVisual?.hidden ? "" : (nowPlayingSecondaryLabel?.textContent || ""),
        secondary: nowPlayingVisual?.hidden ? "" : (nowPlayingVisualTitle?.textContent || ""),
        visual: nowPlayingVisual?.hidden ? "" : (nowPlayingVisualTitle?.textContent || ""),
        channelId: channel.editorialId,
        channel: channel.name,
        tickerViews: [...nowPlayingTickerViews],
        ticker: nowPlayingTickerView,
        overflow: Boolean(nowPlaying?.classList.contains("is-overflowing")),
      };
    },
    refresh: updateNowPlaying,
    setTickerView: setNowPlayingTickerView,
  };

  function fashionCardsPerView() {
    return window.matchMedia("(max-width: 720px)").matches ? 1 : 3;
  }

  function fashionSharedItems() {
    return musicShelfOrders.fashion || [];
  }

  function fashionSharedItem() {
    const order = fashionSharedItems();
    const current = order.find((item) => item.broadcastChannelId === fashionBroadcastChannelId);
    if (current) return current;
    const recommendedId = musicShelfRecommendationIds.fashion;
    return order.find((item) => item.id === recommendedId) || order[0] || null;
  }

  function fashionBroadcastOrderPosition(channelId) {
    const position = fashionSharedItems().findIndex((item) => item.broadcastChannelId === channelId);
    return position >= 0 ? position : 0;
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
    if (!runway) return;
    fashionSelectionSource = source === "manual" ? "manual" : "algorithm";
    document.body.dataset.fashionRunway = runway.assetKey;
    document.body.dataset.fashionVisualScope = runway.privateVisual ? "internal" : "public";
    document.body.dataset.fashionSelectionSource = fashionSelectionSource;
    playerMount.dataset.fashionRunway = runway.assetKey;
    playerMount.dataset.fashionVisualScope = runway.privateVisual ? "internal" : "public";
    if (runway.privateVisual) return;
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
    if (!runway || runway.privateVisual) return;
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
    fashionShelfOrder = [
      ...rankedIndexes,
      ...fashionRunways
        .map((runway, index) => ({ runway, index }))
        .filter(({ runway, index }) => !runway.privateVisual && !rankedIndexes.includes(index))
        .map(({ index }) => index),
    ];
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
    const item = fashionSharedItems().find((candidate) => candidate.broadcastChannelId === card.dataset.fashionChannelId);
    const media = card.querySelector(".adaptive-television-fashion-card__media");
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
    preview.dataset.streamRole = "fashion";
    preview.dataset.streamMaxHeight = "360";
    preview.__iamFashionSource = item.localVideoSrc;
    fashionShelfPreviewVideo = preview;
    fashionShelfPreviewCard = card;
    card.classList.add("is-previewing");
    media.append(preview);

    const previewStart = Number(item.previewStart || 8);
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
        fileName: item.localVideoSrc,
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
    const order = fashionSharedItems();
    const cardsPerView = fashionCardsPerView();
    const maximumOffset = Math.max(0, order.length - cardsPerView);
    fashionShelfOffset = Math.max(0, Math.min(maximumOffset, fashionShelfOffset));
    const items = Array.from(fashionShelfTrack.querySelectorAll("[data-fashion-shelf-item]"));
    const target = items[fashionShelfOffset];
    const distance = target?.offsetLeft || 0;
    fashionShelfTrack.style.transform = `translate3d(-${distance}px, 0, 0)`;

    const start = order.length ? fashionShelfOffset + 1 : 0;
    const end = Math.min(order.length, fashionShelfOffset + cardsPerView);
    if (fashionShelfCounter) fashionShelfCounter.textContent = start === end ? `${start} / ${order.length}` : `${start}–${end} / ${order.length}`;
    if (fashionShelfProgress) fashionShelfProgress.style.width = `${order.length ? (end / order.length) * 100 : 0}%`;
    fashionShelfPrevious?.toggleAttribute("disabled", fashionShelfOffset === 0);
    fashionShelfNext?.toggleAttribute("disabled", fashionShelfOffset >= maximumOffset);

    if (fashionShelfOpen && preview) {
      window.setTimeout(() => {
        const activePosition = fashionBroadcastOrderPosition(fashionSharedItem()?.broadcastChannelId);
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
    const order = fashionSharedItems();
    const recommendedId = musicShelfRecommendationIds.fashion;
    fashionShelfTrack.innerHTML = order.map((item, position) => {
      const current = item.broadcastChannelId === fashionBroadcastChannelId;
      const recommended = item.id === recommendedId;
      const recommendationLabel = recommended ? "Based on your check-in · LIVE" : "LIVE";
      return `
        <div class="adaptive-television-fashion-shelf__item" data-fashion-shelf-item role="listitem">
          <button class="adaptive-television-fashion-card adaptive-television-music-card${current ? " is-current-broadcast" : ""}${recommended ? " is-recommended" : ""}" type="button" data-fashion-card data-fashion-channel-id="${item.broadcastChannelId}" aria-pressed="${current}" aria-label="Open shared Fashion broadcast: ${item.broadcastChannelName} — ${item.artist} — ${item.display_title}">
            <span class="adaptive-television-fashion-card__media adaptive-television-music-card__media">
              <img src="${musicThumbnailUrl(item)}" alt="" loading="${position < 3 ? "eager" : "lazy"}">
              <span class="adaptive-television-fashion-card__preview-label">10s preview</span>
              <span class="adaptive-television-music-card__live">LIVE</span>
              <span class="adaptive-television-music-card__mode">${item.broadcastChannelName}</span>
            </span>
            <span class="adaptive-television-fashion-card__copy">
              <small>${recommendationLabel}</small>
              <strong>${item.artist}</strong>
              <span>${item.display_title}</span>
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
        const item = order.find((candidate) => candidate.broadcastChannelId === card.dataset.fashionChannelId);
        closeFashionShelf(false);
        if (item) await openBroadcastEntry(item, { source: "fashion_shelf" });
      });
    });
    window.requestAnimationFrame(() => updateFashionShelfPosition({ preview: fashionShelfOpen }));
  }

  function openFashionShelf(trigger = fashionShelfToggle) {
    if (!fashionShelf || fashionShelfOpen) return;
    if (musicShelfOpen) closeMusicShelf(false);
    if (sexEdShelfOpen) closeSexEdShelf(false);
    fashionShelfOpen = true;
    fashionShelfReturnTarget = trigger || fashionShelfToggle;
    fashionShelfOffset = 0;
    fashionShelf.setAttribute("aria-hidden", "false");
    fashionShelf.removeAttribute("inert");
    fashionShelfToggles.forEach((button) => button.setAttribute("aria-expanded", "true"));
    document.body.classList.add("fashion-shelf-open");
    renderFashionShelf();
    window.setTimeout(() => {
      updateFashionShelfPosition();
      const focusCard = fashionShelfTrack?.querySelector("[data-fashion-card].is-current-broadcast") ||
        fashionShelfTrack?.querySelector("[data-fashion-card].is-recommended") ||
        fashionShelfTrack?.querySelector("[data-fashion-card]");
      focusCard?.focus({ preventScroll: true });
    }, 90);
  }

  function closeFashionShelf(restoreFocus = true) {
    if (!fashionShelf || !fashionShelfOpen) return;
    fashionShelfOpen = false;
    fashionShelf.setAttribute("aria-hidden", "true");
    fashionShelf.setAttribute("inert", "");
    fashionShelfToggles.forEach((button) => button.setAttribute("aria-expanded", "false"));
    document.body.classList.remove("fashion-shelf-open");
    stopFashionShelfPreview();
    if (restoreFocus) (fashionShelfReturnTarget || fashionShelfToggle)?.focus({ preventScroll: true });
    fashionShelfReturnTarget = null;
  }

  function toggleFashionShelf(trigger = fashionShelfToggle) {
    if (fashionShelfOpen) closeFashionShelf();
    else openFashionShelf(trigger);
  }

  function renderFashionIdentityLabel(element, channelName, brand) {
    if (!element) return;
    const channel = document.createElement("span");
    channel.className = "adaptive-television-fashion-runway-identity adaptive-television-fashion-runway-identity--channel";
    channel.textContent = channelName || "FASHION CHANNELS";
    const runwayBrand = document.createElement("span");
    runwayBrand.className = "adaptive-television-fashion-runway-identity adaptive-television-fashion-runway-identity--brand";
    runwayBrand.textContent = brand || "LIVE RUNWAY";
    element.replaceChildren(channel, runwayBrand);
    element.title = [channelName, brand].filter(Boolean).join(" — ");
    element.setAttribute("aria-hidden", "true");
  }

  function updateFashionRunwayToggle() {
    if (!fashionRunwaySelectors.length) return;
    const order = fashionSharedItems();
    const active = fashionSharedItem();
    const position = Math.max(0, order.findIndex((item) => item.id === active?.id));
    const label = active ? `${active.broadcastChannelName} — ${active.artist}` : "FASHION CHANNELS";
    fashionRunwayLabels.forEach((element) => renderFashionIdentityLabel(
      element,
      active?.broadcastChannelName || "FASHION CHANNELS",
      active?.artist || "LIVE RUNWAY"
    ));
    fashionRunwayCounts.forEach((element) => {
      element.textContent = order.length ? `${position + 1} / ${order.length}` : "1 / 3";
    });
    fashionRunwaySelectors.forEach((selector) => {
      selector.dataset.videoTooltip = "Fashion live channels\nJoin whatever is on now, together as one.";
      selector.dataset.fashionChannelId = active?.broadcastChannelId || "";
    });
    fashionShelfToggles.forEach((button) => button.setAttribute(
      "aria-label",
      `Open Fashion live channels${active ? `. Current: ${label}` : ""}`
    ));
    fashionRunwayPreviousButtons.forEach((button) => button.setAttribute("aria-label", "Previous Fashion live channel"));
    fashionRunwayNextButtons.forEach((button) => button.setAttribute("aria-label", "Next Fashion live channel"));
    if (document.body.classList.contains("television-emdr-gif-active")) {
      playerMount.dataset.emdrGifFashionRunway = fashionRunways[fashionRunwayIndex]?.assetKey || "";
    }
    persistFashionSelection(fashionSelectionSource);
    updateNowPlaying();
  }

  async function selectAdjacentFashionBroadcastItem(direction, source = "fashion_wallet_arrow") {
    const order = fashionSharedItems();
    if (!order.length) return;
    const active = fashionSharedItem();
    const currentIndex = Math.max(0, order.findIndex((item) => item.id === active?.id));
    const next = order[(currentIndex + direction + order.length) % order.length];
    await openBroadcastEntry(next, { source });
  }

  function waitForFashionTargetFrame(video, targetSeconds, timeoutMs = 9000) {
    return new Promise((resolve) => {
      let settled = false;
      let interval = 0;
      const startedAt = window.performance?.now?.() || Date.now();
      const finish = (ready, reason) => {
        if (settled) return;
        settled = true;
        window.clearInterval(interval);
        window.clearTimeout(timeout);
        ["loadeddata", "canplay", "playing", "seeked", "timeupdate", "progress"].forEach((eventName) => {
          video.removeEventListener(eventName, check);
        });
        video.dataset.fashionEntryReadiness = reason;
        video.dataset.fashionEntryWaitMs = String(Math.round((window.performance?.now?.() || Date.now()) - startedAt));
        resolve(ready);
      };
      const check = () => {
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.seeking) return;
        const duration = Number(video.duration || 0);
        let drift = Math.abs(Number(video.currentTime || 0) - targetSeconds);
        if (Number.isFinite(duration) && duration > 0 && drift > duration / 2) drift = duration - drift;
        const bufferSeconds = Number(window.IAMStreamController?.bufferedAhead?.(video) || 0);
        if (drift <= 1.5 && (bufferSeconds >= .2 || video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)) {
          video.dataset.fashionEntryTargetSeconds = targetSeconds.toFixed(3);
          video.dataset.fashionEntryDriftSeconds = drift.toFixed(3);
          finish(true, "decoded_at_target");
        }
      };
      const timeout = window.setTimeout(() => finish(false, "timeout"), Math.max(2500, Number(timeoutMs) || 9000));
      ["loadeddata", "canplay", "playing", "seeked", "timeupdate", "progress"].forEach((eventName) => {
        video.addEventListener(eventName, check);
      });
      interval = window.setInterval(check, 120);
      check();
    });
  }

  async function prepareFashionBroadcastVideo(video, broadcastState, options = {}) {
    if (!video || !broadcastState) return false;
    await ensureFashionStreamAttached(video);
    if (!await waitForBroadcastMetadata(video)) return false;
    const duration = Number(video.duration || 0);
    if (!Number.isFinite(duration) || duration <= 0) return false;
    const targetSeconds = ((Number(broadcastState.offsetSeconds || 0) % duration) + duration) % duration;
    await seekBroadcastVideo(video, targetSeconds, {
      reason: "fashion_broadcast_entry_seek",
      channelId: options.channelId || broadcastState.channelId || "",
      programmeInstanceId: broadcastState.programmeInstanceId || "",
    });
    window.IAMStreamController?.prepareFashionReveal?.(video, {
      minimumSeconds: Math.max(4, Number(options.revealMinimumSeconds) || 4),
      firstFallbackMs: 900,
      secondFallbackMs: 1500,
    })?.catch?.(() => {});
    await playWhenStreamAttached(video, "fashion").catch(() => {});
    return waitForFashionTargetFrame(video, targetSeconds, options.readinessTimeoutMs);
  }

  async function setFashionRunway(index, options = {}) {
    if (!fashionVideo || fashionRunwaySwitching) return false;
    const nextIndex = ((index % fashionRunways.length) + fashionRunways.length) % fashionRunways.length;
    const source = options.source === "manual" ? "manual" : "algorithm";
    if (nextIndex === fashionRunwayIndex) {
      if (options.broadcastState) {
        const ready = await prepareFashionBroadcastVideo(fashionVideo, options.broadcastState, options);
        if (!ready) return false;
      }
      if (source === "manual") recordFashionSelectionFeedback(nextIndex, options.feedbackType);
      fashionSelectionSource = source;
      updateFashionRunwayToggle();
      renderFashionShelf();
      return true;
    }

    fashionRunwaySwitching = true;
    fashionRunwayPreviousButtons.forEach((button) => button.setAttribute("disabled", ""));
    fashionRunwayNextButtons.forEach((button) => button.setAttribute("disabled", ""));

    const previousVideo = fashionVideo;
    const incomingVideo = createFashionVideo(nextIndex);
    playerMount.insertBefore(incomingVideo, timecode || null);
    fashionRevealGeneration += 1;

    try {
      let ready = true;
      if (options.broadcastState) {
        ready = await prepareFashionBroadcastVideo(incomingVideo, options.broadcastState, options);
      } else if (requestedVideoBlend < 100 || document.body.classList.contains("television-emdr-gif-active")) {
        await ensureFashionStreamAttached(incomingVideo);
        await playWhenStreamAttached(incomingVideo, "fashion").catch(() => {});
        ready = await waitForFashionTargetFrame(incomingVideo, Number(incomingVideo.currentTime || 0), options.readinessTimeoutMs);
      } else {
        await ensureFashionStreamAttached(incomingVideo);
      }
      if (!ready) throw new Error("Fashion broadcast did not decode at the shared offset in time.");

      fashionRunwayIndex = nextIndex;
      fashionSelectionSource = source;
      fashionVideo = incomingVideo;
      incomingVideo.classList.add("is-fashion-active");
      previousVideo.classList.remove("is-fashion-active");
      applyVideoBlend(requestedVideoBlend);
      if (document.body.classList.contains("television-emdr-gif-active")) startFashionHeroMirror();
      updateFashionRunwayToggle();
      renderFashionShelf();
      if (source === "manual") recordFashionSelectionFeedback(nextIndex, options.feedbackType);
      else if (requestedVideoBlend < 100) scheduleFashionDwellFeedback();
      window.dispatchEvent(new CustomEvent("iam:fashion-runway-change", {
        detail: {
          assetKey: fashionRunways[fashionRunwayIndex].assetKey,
          source,
          emdrUsesCurrentFashion: true,
        },
      }));
      window.setTimeout(() => {
        window.IAMStreamController?.setFashionActive(previousVideo, false, "runway_switch_complete");
        window.IAMStreamController?.detach(previousVideo);
        previousVideo.remove();
      }, 380);
      return true;
    } catch (error) {
      window.IAMStreamController?.setFashionActive(incomingVideo, false, "runway_switch_failed");
      window.IAMStreamController?.detach(incomingVideo);
      incomingVideo.remove();
      previousVideo.classList.add("is-fashion-active");
      document.body.dataset.fashionBroadcastJoinError = String(error?.message || error).slice(0, 160);
      return false;
    } finally {
      fashionRunwaySwitching = false;
      fashionRunwayPreviousButtons.forEach((button) => button.removeAttribute("disabled"));
      fashionRunwayNextButtons.forEach((button) => button.removeAttribute("disabled"));
      updateRadioFashionPreloadDiagnostics();
      window.setTimeout(preloadRadioFashionRunways, 480);
    }
  }

  function musicModeLabel(mode = musicChannelMode) {
    return ({ videos: "Videos", parties: "Parties", radio: "Radio", fashion: "Fashion" })[mode] || "Music";
  }

  function broadcastFormatLabel(mode = musicChannelMode) {
    return ({
      videos: "MUSIC VIDEOS",
      parties: "PARTIES",
      radio: "RADIO",
      fashion: "FASHION",
    })[mode] || "LIVE CHANNEL";
  }

  function fashionRunwayForId(runwayId) {
    return fashionRunways.find((runway) => runway.assetKey === runwayId) || null;
  }

  function broadcastEditorialPosition(item) {
    const position = BROADCAST_EDITORIAL_ORDER.indexOf(item?.editorialId || item?.broadcastState?.editorialId || "");
    return position >= 0 ? position : BROADCAST_EDITORIAL_ORDER.length;
  }

  function musicCardsPerView() {
    if (window.matchMedia("(max-width: 720px)").matches) return 1;
    if (window.matchMedia("(max-width: 1100px)").matches) return 2;
    return 4;
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
      hlsVideoSrc: candidate.hlsVideoSrc,
      audioOnly: candidate.audioOnly === true,
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

  function broadcastChannelRecord(channel) {
    const state = window.IAMBroadcastClock?.stateAt(channel.id);
    if (!state && channel.available === false) {
      const energyProfile = BROADCAST_ENERGY_PROFILES[channel.energyId] || {};
      return {
        id: `broadcast-${channel.id}`,
        mode: channel.format,
        provider: channel.name,
        artist: channel.name,
        title: "Programming soon",
        display_title: "Programming soon",
        short_title: "PROGRAMMING SOON",
        broadcastChannelId: channel.id,
        broadcastChannelName: channel.name,
        broadcastDescriptor: channel.descriptor,
        broadcastDescription: channel.description,
        editorialId: channel.editorialId,
        unavailable: true,
        primary_environmental_function: channel.description,
        need_scores: energyProfile.need_scores || {},
        context: energyProfile.context || {},
      };
    }
    if (!state) return null;
    const energyProfile = BROADCAST_ENERGY_PROFILES[state.energyId] || {};
    if (state.mediaType === "radio") {
      const currentStation = stationForId(state.stationId);
      if (!currentStation) return null;
      return {
        ...currentStation,
        id: `broadcast-${channel.id}`,
        mode: channel.format,
        broadcastChannelId: channel.id,
        broadcastChannelName: channel.name,
        broadcastDescriptor: channel.descriptor,
        broadcastDescription: channel.description,
        editorialId: channel.editorialId,
        visualChannelId: channel.visualChannelId,
        broadcastState: state,
        primary_environmental_function: channel.description || currentStation.primary_environmental_function,
        need_scores: energyProfile.need_scores || currentStation.need_scores,
        context: energyProfile.context || currentStation.context,
      };
    }
    if (state.mediaType === "fashion") {
      const currentRunway = fashionRunwayForId(state.runwayId);
      const runwayIndex = fashionRunways.indexOf(currentRunway);
      if (!currentRunway || runwayIndex < 0) return null;
      return {
        id: `broadcast-${channel.id}`,
        mode: channel.format,
        provider: currentRunway.brand,
        artist: currentRunway.brand,
        title: currentRunway.title,
        display_title: currentRunway.title,
        short_title: currentRunway.shortTitle,
        localVideoSrc: currentRunway.videoSrc,
        streamUid: currentRunway.streamUid,
        previewStart: currentRunway.previewStart,
        runwayIndex,
        runwayRef: currentRunway,
        broadcastChannelId: channel.id,
        broadcastChannelName: channel.name,
        broadcastDescriptor: channel.descriptor,
        broadcastDescription: channel.description,
        editorialId: channel.editorialId,
        visualChannelId: channel.visualChannelId,
        broadcastState: state,
        primary_environmental_function: channel.description,
        need_scores: energyProfile.need_scores || {},
        context: energyProfile.context || {},
      };
    }
    const currentTrack = findTrack(state?.trackId);
    if (!currentTrack) return null;
    const record = musicTrackRecord(currentTrack);
    const pairedVisualState = state.mediaType === "audio" && state.visualChannelId
      ? window.IAMBroadcastClock?.stateAt(state.visualChannelId)
      : null;
    const pairedRunway = fashionRunwayForId(pairedVisualState?.runwayId);
    return {
      ...record,
      id: `broadcast-${channel.id}`,
      mode: channel.format,
      broadcastChannelId: channel.id,
      broadcastChannelName: channel.name,
      broadcastDescriptor: channel.descriptor,
      broadcastDescription: channel.description,
      editorialId: channel.editorialId,
      catalogue_status: "ready",
      visualChannelId: channel.visualChannelId,
      broadcastState: state,
      primary_environmental_function: channel.description || record.primary_environmental_function,
      need_scores: energyProfile.need_scores || record.need_scores,
      context: energyProfile.context || record.context,
      previewStart: pairedRunway?.previewStart || Math.max(8, Math.floor(state.offsetSeconds)),
      previewVideoSrc: pairedRunway?.videoSrc || record.localVideoSrc,
      visualStreamUid: pairedRunway?.streamUid || "",
      trackRef: currentTrack,
    };
  }

  function musicItems(mode = musicChannelMode) {
    return (window.IAMBroadcastClock?.channels?.(mode) || [])
      .map(broadcastChannelRecord)
      .filter(Boolean);
  }

  function rankMusicShelves() {
    const selector = window.IAMMusicChannelSelector;
    const taste = readMusicTasteProfile();
    const inference = readStoredCitizenInference() || {};
    const atWork = Boolean(selector?.explicitWorkContext?.(inference));
    const citizenNeeds = musicCitizenNeeds();
    BROADCAST_FORMATS.forEach((mode) => {
      const pool = musicItems(mode);
      const availablePool = pool.filter((item) => !item.unavailable);
      const result = selector?.rank
        ? selector.rank(availablePool, {
          mode,
          citizenNeeds,
          tasteAffinities: taste.affinities,
          recentIds: taste.recentIds,
          atWork,
          inGroup: audioWalletJoined,
          seed: musicRecommendationSeed(),
          limit: 4,
        })
        : { ranked: availablePool, recommendations: availablePool.slice(0, 4), context: { atWork, inGroup: audioWalletJoined } };
      musicShelfRecommendationIds[mode] = result.recommendations[0]?.id || result.ranked[0]?.id || "";
      musicShelfOrders[mode] = pool
        .slice()
        .sort((a, b) => broadcastEditorialPosition(a) - broadcastEditorialPosition(b));
      document.body.dataset[`music${mode[0].toUpperCase()}${mode.slice(1)}RecommendationCount`] = String(result.recommendations.length);
    });
    document.body.dataset.musicRecommendationSource = Object.keys(citizenNeeds).length ? "citizen_needs_tensor" : "editorial_taste_exploration";
    document.body.dataset.musicAtWorkContext = String(atWork);
    updateMusicSelector();
    updateFashionRunwayToggle();
    renderFashionShelf();
    renderMusicShelf();
    window.dispatchEvent(new CustomEvent("iam:music-channels-ready", {
      detail: { modes: BROADCAST_FORMATS.slice() },
    }));
  }

  async function loadMusicRecommendations() {
    try {
      const [catalogueResponse, stationsResponse] = await Promise.all([
        fetch("adaptive-music-video-catalogue-v1.11.json?v=music-video-catalogue-a93d901ed795", { cache: "no-store" }),
        fetch("radio-station-tensor-notion-export-v1.0.json?v=radio-stations-44bcb7e5d5b1", { cache: "no-store" }),
      ]);
      if (!catalogueResponse.ok) throw new Error(`Music Tensor fetch failed (${catalogueResponse.status})`);
      if (!stationsResponse.ok) throw new Error(`Radio Tensor fetch failed (${stationsResponse.status})`);
      const [catalogue, stations] = await Promise.all([catalogueResponse.json(), stationsResponse.json()]);
      musicCatalogueRecords = Array.isArray(catalogue.tracks) ? catalogue.tracks : [];
      const fallbacks = new Map(DEFAULT_RADIO_STATIONS.map((station) => [station.id, station]));
      const approvedStations = (Array.isArray(stations.records) ? stations.records : DEFAULT_RADIO_STATIONS)
        .filter((station) => !station.status || station.status === "Approved");
      radioStationRecords = approvedStations
        .map((station) => ({
          ...fallbacks.get(station.id),
          ...station,
          musicRoomFit: station.music_room_fit || fallbacks.get(station.id)?.musicRoomFit || [],
        }));
      rankMusicShelves();
    } catch (error) {
      document.body.dataset.musicRecommendationSource = "catalogue_fallback";
      document.body.dataset.musicRecommendationError = String(error?.message || error).slice(0, 120);
      rankMusicShelves();
    }
  }

  function musicActiveItem(mode = musicChannelMode) {
    const order = musicShelfOrders[mode] || [];
    const activeChannelId = activeBroadcastChannelIdForMode(mode);
    if (activeChannelId) {
      const activeBroadcast = order.find((item) => item.broadcastChannelId === activeChannelId);
      if (activeBroadcast) return activeBroadcast;
    }
    const recommendedId = musicShelfRecommendationIds[mode];
    return order.find((item) => item.id === recommendedId) || order[0] || null;
  }

  function activeBroadcastChannelIdForMode(mode = musicChannelMode) {
    return mode === "fashion" ? fashionBroadcastChannelId : broadcastChannelId;
  }

  function updateMusicSelector() {
    const order = musicShelfOrders[musicChannelMode] || [];
    const active = musicActiveItem();
    const position = Math.max(0, order.findIndex((item) => item.id === active?.id));
    const display = active ? musicItemDisplayMetadata(active) : null;
    const label = active
      ? `${active.broadcastChannelName} — ${musicChannelMode === "radio" ? active.display_title : display.artist}`
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
    if (!MUSIC_BROADCAST_FORMATS.includes(mode)) return;
    musicChannelMode = mode;
    if (options.manual !== false) musicModeManuallySelected = true;
    musicShelfOffset = 0;
    updateMusicSelector();
    renderMusicShelf();
    if (mode === "radio") preloadRadioFashionRunways();
    if (options.openShelf) openMusicShelf();
  }

  function musicThumbnailUrl(item) {
    const uid = item.visualStreamUid || item.streamUid || window.IAMCloudflareStream?.assetFor(String(item.previewVideoSrc || item.localVideoSrc || "").split("/").pop())?.uid;
    if (!uid) return "";
    const host = window.IAMCloudflareStream?.customerHost || "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
    return `https://${host}/${uid}/thumbnails/thumbnail.jpg?time=${item.previewStart || 8}s&height=360`;
  }

  function stopMusicShelfPreview() {
    if (!musicShelfPreviewVideo) return;
    if (musicShelfPreviewVideo.dataset.streamRole === "fashion") {
      window.IAMStreamController?.setFashionActive(musicShelfPreviewVideo, false, "shared_fashion_preview_closed");
    }
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
    const previewVideoSrc = item?.previewVideoSrc || item?.localVideoSrc;
    if (!previewVideoSrc || !media || item.unavailable || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    if (musicChannelMode === "fashion" || item.audioOnly) {
      preview.dataset.streamRole = "fashion";
      preview.__iamFashionSource = previewVideoSrc;
    }
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
        fileName: previewVideoSrc,
        role: musicChannelMode === "fashion" || item.audioOnly ? "fashion" : "music",
        autoplay: false,
        preload: true,
        preloadTargetSeconds: 10,
      });
      if (preview !== musicShelfPreviewVideo || !musicShelfOpen) return;
      resetPreview();
      if (musicChannelMode === "fashion" || item.audioOnly) {
        window.IAMStreamController?.setFashionActive(preview, true, "shared_fashion_preview");
      }
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
    if (item.unavailable) {
      return `<span class="adaptive-television-fashion-card__media adaptive-television-music-card__media adaptive-television-music-card__media--unavailable">
        <span class="adaptive-television-music-card__placeholder">${item.broadcastChannelName}</span>
        <span class="adaptive-television-music-card__soon">PROGRAMMING SOON</span>
        <span class="adaptive-television-music-card__mode">${item.broadcastChannelName}</span>
      </span>`;
    }
    if (musicChannelMode === "radio") {
      const palette = item.card_palette || ["#4c5664", "#aeb7bf"];
      return `<span class="adaptive-television-fashion-card__media adaptive-television-music-card__media" style="--station-a:${palette[0]};--station-b:${palette[1]}">
        <span class="adaptive-television-radio-art${item.logo_crop ? ` adaptive-television-radio-art--${item.logo_crop}` : ""}">
          <img class="adaptive-television-radio-art__logo" src="${item.logo_src}" alt="${item.logo_alt || item.provider}">
          ${item.brand_logo_src ? `<img class="adaptive-television-radio-art__brand" src="${item.brand_logo_src}" alt="">` : ""}
        </span>
        <span class="adaptive-television-music-card__live">LIVE</span>
        <span class="adaptive-television-music-card__mode">${item.broadcastChannelName}</span>
      </span>`;
    }
    return `<span class="adaptive-television-fashion-card__media adaptive-television-music-card__media">
      <img src="${musicThumbnailUrl(item)}" alt="" loading="${position < 4 ? "eager" : "lazy"}">
      <span class="adaptive-television-fashion-card__preview-label">10s preview</span>
      <span class="adaptive-television-music-card__live">LIVE</span>
      <span class="adaptive-television-music-card__mode">${item.broadcastChannelName}</span>
    </span>`;
  }

  function renderMusicShelf() {
    if (!musicShelfTrack) return;
    stopMusicShelfPreview();
    const order = musicShelfOrders[musicChannelMode] || [];
    if (musicShelfTitle) musicShelfTitle.textContent = `${musicModeLabel()} · live channels`;
    if (musicShelfSubtitle && !musicShelfSubtitle.dataset.temporaryStatus) {
      musicShelfSubtitle.textContent = "Join whatever is on now, together as one";
    }
    musicShelfTrack.setAttribute("aria-label", `${musicModeLabel()} live channel choices`);
    musicShelfTrack.innerHTML = order.map((item, position) => {
      const current = item.broadcastChannelId === activeBroadcastChannelIdForMode(musicChannelMode);
      const recommended = item.id === musicShelfRecommendationIds[musicChannelMode];
      const display = musicItemDisplayMetadata(item);
      const provider = musicChannelMode === "radio" ? item.provider : display.artist;
      const title = musicChannelMode === "radio" ? (item.display_title || item.title) : display.title;
      const action = item.unavailable ? "Programming soon" : "Open live channel";
      const cardTitle = item.unavailable ? item.broadcastChannelName : musicChannelMode === "radio" ? item.title : provider;
      const cardDetail = item.unavailable ? "Programming soon" : musicChannelMode === "radio" ? item.provider : title;
      return `<div class="adaptive-television-fashion-shelf__item" data-music-shelf-item role="listitem">
        <button class="adaptive-television-fashion-card adaptive-television-music-card${current ? " is-current-broadcast" : ""}${recommended ? " is-recommended" : ""}${item.unavailable ? " is-unavailable" : ""}" type="button" data-music-card data-music-item-id="${item.id}" aria-pressed="${current}" aria-label="${action}: ${provider} — ${title}"${item.unavailable ? " disabled" : ""}>
          <span class="adaptive-television-music-card__recommendation${recommended ? " is-visible" : ""}">${recommended ? "Based on your check-in" : "&nbsp;"}</span>
          ${musicCardMedia(item, position)}
          <span class="adaptive-television-fashion-card__copy">
            <small>${item.broadcastDescriptor || item.broadcastDescription}</small>
            <strong>${cardTitle}</strong>
            ${cardDetail ? `<span>${cardDetail}</span>` : ""}
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
    if (document.body.classList.contains("television-program-open")) {
      window.IAMProgrammeGuide?.close?.(null, { restoreFocus: false });
    }
    if (fashionShelfOpen) closeFashionShelf(false);
    if (sexEdShelfOpen) closeSexEdShelf(false);
    musicShelfOpen = true;
    musicShelfOffset = 0;
    musicShelf.setAttribute("aria-hidden", "false");
    musicShelf.removeAttribute("inert");
    musicShelfToggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("music-shelf-open");
    renderMusicShelf();
    window.setTimeout(() => {
      updateMusicShelfPosition();
      (musicShelfTrack?.querySelector("[data-music-card].is-current-broadcast") ||
        musicShelfTrack?.querySelector("[data-music-card].is-recommended") ||
        musicShelfTrack?.querySelector("[data-music-card]"))?.focus({ preventScroll: true });
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
        musicShelfSubtitle.textContent = "Join whatever is on now, together as one";
      }, duration);
    }
  }

  function ensureChannelLoadingOverlay() {
    if (!channelLoadingOverlay) {
      channelLoadingOverlay = document.createElement("div");
      channelLoadingOverlay.className = "adaptive-television-channel-loading";
      channelLoadingOverlay.dataset.channelLoadingOverlay = "";
      channelLoadingOverlay.setAttribute("role", "status");
      channelLoadingOverlay.setAttribute("aria-live", "polite");
      channelLoadingOverlay.setAttribute("aria-atomic", "true");
      channelLoadingOverlay.setAttribute("aria-hidden", "true");
      channelLoadingOverlay.innerHTML = `
        <span class="adaptive-television-channel-loading__ring" aria-hidden="true"></span>
        <strong class="adaptive-television-channel-loading__title" data-channel-loading-title>LOADING</strong>
      `;
      channelLoadingTitle = channelLoadingOverlay.querySelector("[data-channel-loading-title]");
    }
    if (channelLoadingOverlay.parentElement !== playerMount) playerMount.append(channelLoadingOverlay);
    return channelLoadingOverlay;
  }

  function shouldShowChannelLoading(source = "", force = false) {
    if (force) return true;
    const normalizedSource = String(source || "manual");
    return !document.body.classList.contains("television-sex-ed-active") &&
      normalizedSource !== "shop_independent" &&
      !normalizedSource.startsWith("sex_ed");
  }

  function channelLoadingKey(mode, item, channelName = "") {
    const mediaId = String(item?.id || item?.track_id || item?.station_id || item?.media_id || "").trim();
    return [String(mode || "videos"), String(channelName || item?.broadcastChannelName || "").trim(), mediaId].join(":");
  }

  function beginChannelLoading({ mode = musicChannelMode, item = null, channelName = "", source = "manual", force = false } = {}) {
    if (!shouldShowChannelLoading(source, force)) return 0;
    const overlay = ensureChannelLoadingOverlay();
    const identity = channelLoadingKey(mode, item, channelName);
    if (
      identity === channelLoadingIdentity &&
      overlay.classList.contains("is-active") &&
      ["loading", "still_tuning"].includes(document.body.dataset.channelLoadingState)
    ) {
      return channelLoadingGeneration;
    }
    const generation = ++channelLoadingGeneration;
    channelLoadingIdentity = identity;
    channelLoadingStartedAt = window.performance?.now?.() || Date.now();
    if (channelLoadingStillTimer) window.clearTimeout(channelLoadingStillTimer);
    if (channelLoadingHideTimer) window.clearTimeout(channelLoadingHideTimer);
    channelLoadingStillTimer = 0;
    channelLoadingHideTimer = 0;
    const heading = "LOADING";
    if (channelLoadingTitle) channelLoadingTitle.textContent = heading;
    overlay.classList.remove("is-error");
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    overlay.dataset.channelLoadingMode = String(mode || "videos");
    overlay.dataset.channelLoadingSource = String(source || "manual");
    document.body.dataset.channelLoadingState = "loading";
    document.body.dataset.channelLoadingMode = String(mode || "videos");
    delete document.body.dataset.channelLoadingLabel;
    document.body.dataset.channelLoadingCopy = heading;
    channelLoadingStillTimer = window.setTimeout(() => {
      if (generation !== channelLoadingGeneration || !overlay.classList.contains("is-active")) return;
      if (channelLoadingTitle) channelLoadingTitle.textContent = "STILL LOADING";
      document.body.dataset.channelLoadingState = "still_tuning";
      document.body.dataset.channelLoadingCopy = "STILL LOADING";
    }, 18000);
    return generation;
  }

  function finishChannelLoading(generation) {
    if (!generation || generation !== channelLoadingGeneration || !channelLoadingOverlay) return;
    if (channelLoadingStillTimer) window.clearTimeout(channelLoadingStillTimer);
    channelLoadingStillTimer = 0;
    const elapsed = (window.performance?.now?.() || Date.now()) - channelLoadingStartedAt;
    const delay = Math.max(0, 480 - elapsed);
    document.body.dataset.channelLoadingState = "ready";
    channelLoadingHideTimer = window.setTimeout(() => {
      if (generation !== channelLoadingGeneration || !channelLoadingOverlay) return;
      channelLoadingOverlay.classList.remove("is-active", "is-error");
      channelLoadingHideTimer = window.setTimeout(() => {
        if (generation !== channelLoadingGeneration || !channelLoadingOverlay) return;
        channelLoadingOverlay.setAttribute("aria-hidden", "true");
        document.body.dataset.channelLoadingState = "idle";
      }, 260);
    }, delay);
  }

  function failChannelLoading(generation) {
    if (!generation || generation !== channelLoadingGeneration || !channelLoadingOverlay) return;
    if (channelLoadingStillTimer) window.clearTimeout(channelLoadingStillTimer);
    if (channelLoadingHideTimer) window.clearTimeout(channelLoadingHideTimer);
    channelLoadingStillTimer = 0;
    channelLoadingHideTimer = 0;
    if (channelLoadingTitle) channelLoadingTitle.textContent = "CHANNEL UNAVAILABLE";
    channelLoadingOverlay.classList.add("is-active", "is-error");
    channelLoadingOverlay.setAttribute("aria-hidden", "false");
    document.body.dataset.channelLoadingState = "error";
    document.body.dataset.channelLoadingCopy = "CHANNEL UNAVAILABLE";
    channelLoadingHideTimer = window.setTimeout(() => {
      if (generation !== channelLoadingGeneration || !channelLoadingOverlay) return;
      channelLoadingOverlay.classList.remove("is-active", "is-error");
      channelLoadingHideTimer = window.setTimeout(() => {
        if (generation !== channelLoadingGeneration || !channelLoadingOverlay) return;
        channelLoadingOverlay.setAttribute("aria-hidden", "true");
      }, 260);
    }, 3600);
  }

  function cancelChannelLoading(reason = "cancelled") {
    channelLoadingGeneration += 1;
    channelLoadingIdentity = "";
    if (channelLoadingStillTimer) window.clearTimeout(channelLoadingStillTimer);
    if (channelLoadingHideTimer) window.clearTimeout(channelLoadingHideTimer);
    channelLoadingStillTimer = 0;
    channelLoadingHideTimer = 0;
    channelLoadingOverlay?.classList.remove("is-active", "is-error");
    channelLoadingOverlay?.setAttribute("aria-hidden", "true");
    document.body.dataset.channelLoadingState = reason;
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

  function isHlsRadioSource(source) {
    return /\.m3u8(?:$|[?#])/i.test(String(source || ""));
  }

  function isBufferedNtsRadioSource(source) {
    return continuationDecision?.stream_transport === "Buffered HLS scheduler" &&
      /^https:\/\/streams\.radiomast\.io\/[a-f0-9-]+\/?$/i.test(String(source || ""));
  }

  function loadRadioHlsLibrary() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (radioHlsLibraryPromise) return radioHlsLibraryPromise;

    radioHlsLibraryPromise = new Promise((resolve, reject) => {
      let script = document.querySelector("script[data-iam-hls-library], script[src*='hls.min.js']");
      let settled = false;
      let timeout = 0;
      const finish = (error = null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        script?.removeEventListener("load", handleLoad);
        script?.removeEventListener("error", handleError);
        if (error) {
          if (script?.dataset.iamHlsLibrary === "radio") script.remove();
          reject(error);
        } else {
          resolve(window.Hls);
        }
      };
      const handleLoad = () => window.Hls
        ? finish()
        : finish(new Error("HLS library loaded without a browser API."));
      const handleError = () => finish(new Error("HLS radio support could not be loaded."));
      timeout = window.setTimeout(() => {
        finish(new Error("HLS radio support timed out. Please try the channel again."));
      }, RADIO_HLS_LIBRARY_LOAD_TIMEOUT_MS);

      if (script) {
        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });
        window.setTimeout(() => {
          if (window.Hls) finish();
        }, 0);
        return;
      }

      script = document.createElement("script");
      script.src = RADIO_HLS_LIBRARY_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.iamHlsLibrary = "radio";
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
    }).catch((error) => {
      radioHlsLibraryPromise = null;
      throw error;
    });

    return radioHlsLibraryPromise;
  }

  function radioBufferedAhead(audio = continuationAudio) {
    if (!audio?.buffered?.length) return 0;
    const currentTime = Number(audio.currentTime) || 0;
    let fallbackRange = 0;
    for (let index = 0; index < audio.buffered.length; index += 1) {
      const start = Number(audio.buffered.start(index)) || 0;
      const end = Number(audio.buffered.end(index)) || 0;
      fallbackRange = Math.max(fallbackRange, end - start);
      if (currentTime + .12 >= start && currentTime <= end + .12) return Math.max(0, end - currentTime);
    }
    return audio.paused ? Math.max(0, fallbackRange) : 0;
  }

  function updateRadioBufferDiagnostics(audio = continuationAudio, hls = continuationHls) {
    if (!audio) return 0;
    const bufferSeconds = radioBufferedAhead(audio);
    document.body.dataset.radioBufferSeconds = bufferSeconds.toFixed(1);
    document.body.dataset.radioBufferTargetSeconds = String(RADIO_READY_BUFFER_SECONDS);
    document.body.dataset.radioPlaybackTime = (Number(audio.currentTime) || 0).toFixed(1);
    document.body.dataset.radioPaused = String(Boolean(audio.paused));
    document.body.dataset.radioMuted = String(Boolean(audio.muted));
    document.body.dataset.radioVolume = (Number(audio.volume) || 0).toFixed(2);
    document.body.dataset.radioReadyState = String(audio.readyState || 0);
    document.body.dataset.radioNetworkState = String(audio.networkState || 0);
    document.body.dataset.radioWaitingCount = String(radioWaitingCount);
    document.body.dataset.radioStalledCount = String(radioStalledCount);
    document.body.dataset.radioRecoveryCount = String(radioRecoveryCount);
    const bandwidth = Number(hls?.bandwidthEstimate);
    if (Number.isFinite(bandwidth) && bandwidth > 0) {
      document.body.dataset.radioBandwidthKbps = String(Math.round(bandwidth / 1000));
    }
    const latency = Number(hls?.latency);
    if (audio.dataset.radioTransport === "hls-js" && Number.isFinite(latency) && latency >= 0) {
      document.body.dataset.radioLiveLatencySeconds = latency.toFixed(1);
    } else {
      delete document.body.dataset.radioLiveLatencySeconds;
    }
    return bufferSeconds;
  }

  function clearRadioPlaybackDiagnostics() {
    window.clearInterval(radioBufferMonitor);
    window.clearTimeout(radioRecoveryTimer);
    radioBufferMonitor = 0;
    radioRecoveryTimer = 0;
    radioPlaybackCleanup?.();
    radioPlaybackCleanup = null;
  }

  function recoverRadioPlayback(reason = "buffer_low") {
    const audio = continuationAudio;
    const hls = continuationHls;
    if (!audio || !hls || !document.body.classList.contains("television-radio-continuation")) return;
    const now = Date.now();
    if (now - radioLastRecoveryAt < 800) return;
    radioLastRecoveryAt = now;
    radioRecoveryCount += 1;
    document.body.dataset.radioPlaybackState = "recovering";
    document.body.dataset.radioRecoveryReason = reason;
    document.body.dataset.radioRecoveryCount = String(radioRecoveryCount);
    try { hls.startLoad(-1); } catch {}
    audio.play()
      .then(() => {
        document.body.dataset.radioPlaybackState = "playing";
        delete document.body.dataset.radioPlaybackError;
      })
      .catch((error) => {
        document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
      });
  }

  function scheduleRadioRecovery(reason, delayMs = 900) {
    window.clearTimeout(radioRecoveryTimer);
    radioRecoveryTimer = window.setTimeout(() => {
      radioRecoveryTimer = 0;
      recoverRadioPlayback(reason);
    }, delayMs);
  }

  function bindRadioPlaybackDiagnostics(audio, hls, Hls) {
    clearRadioPlaybackDiagnostics();
    radioWaitingCount = 0;
    radioStalledCount = 0;
    radioRecoveryCount = 0;
    radioLastRecoveryAt = 0;
    let lastPlaybackTime = Number(audio.currentTime) || 0;
    let lastAdvanceAt = Date.now();

    const handleWaiting = () => {
      radioWaitingCount += 1;
      if (document.body.dataset.radioPlaybackState !== "loading") document.body.dataset.radioPlaybackState = "buffering";
      updateRadioBufferDiagnostics(audio, hls);
      try { hls.startLoad(-1); } catch {}
      scheduleRadioRecovery("waiting");
    };
    const handleStalled = () => {
      radioStalledCount += 1;
      if (document.body.dataset.radioPlaybackState !== "loading") document.body.dataset.radioPlaybackState = "buffering";
      updateRadioBufferDiagnostics(audio, hls);
      try { hls.startLoad(-1); } catch {}
      scheduleRadioRecovery("stalled");
    };
    const handlePlaying = () => {
      lastAdvanceAt = Date.now();
      lastPlaybackTime = Number(audio.currentTime) || 0;
      if (audio.dataset.radioTransport === "recorded-hls-vod") {
        window.clearTimeout(radioRecoveryTimer);
        radioRecoveryTimer = 0;
      }
      if (document.body.classList.contains("television-radio-continuation")) {
        document.body.dataset.radioPlaybackState = "playing";
        delete document.body.dataset.radioPlaybackError;
      }
      updateRadioBufferDiagnostics(audio, hls);
    };
    const handleProgress = () => updateRadioBufferDiagnostics(audio, hls);
    const handleMediaError = () => {
      document.body.dataset.radioLastMediaError = String(audio.error?.code || "unknown");
      scheduleRadioRecovery("media_error", 300);
    };

    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("progress", handleProgress);
    audio.addEventListener("error", handleMediaError);
    radioPlaybackCleanup = () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("progress", handleProgress);
      audio.removeEventListener("error", handleMediaError);
    };

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      document.body.dataset.radioManifestVariants = String(hls.levels?.length || 0);
      const bitrate = Number(hls.levels?.[0]?.bitrate || hls.levels?.[0]?.maxBitrate);
      if (Number.isFinite(bitrate) && bitrate > 0) document.body.dataset.radioBitrateKbps = String(Math.round(bitrate / 1000));
    });
    hls.on(Hls.Events.FRAG_BUFFERED, () => updateRadioBufferDiagnostics(audio, hls));
    hls.on(Hls.Events.ERROR, (_event, data) => {
      document.body.dataset.radioLastHlsError = `${data?.type || "unknown"}:${data?.details || "unknown"}`.slice(0, 160);
      if (data?.details?.includes?.("buffer") || data?.type === Hls.ErrorTypes.NETWORK_ERROR) {
        try { hls.startLoad(-1); } catch {}
        scheduleRadioRecovery(data?.fatal ? "fatal_network" : "hls_buffer");
      }
      if (!data?.fatal) return;
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        try { hls.recoverMediaError(); } catch {}
        scheduleRadioRecovery("fatal_media", 300);
      } else if (data.type !== Hls.ErrorTypes.NETWORK_ERROR) {
        scheduleRadioRecovery("fatal_other");
      }
    });

    radioBufferMonitor = window.setInterval(() => {
      if (audio !== continuationAudio || hls !== continuationHls) return;
      const bufferSeconds = updateRadioBufferDiagnostics(audio, hls);
      if (!document.body.classList.contains("television-radio-continuation")) return;
      const playbackState = document.body.dataset.radioPlaybackState;
      if (playbackState === "loading") return;
      const currentTime = Number(audio.currentTime) || 0;
      if (currentTime > lastPlaybackTime + .04) {
        lastPlaybackTime = currentTime;
        lastAdvanceAt = Date.now();
        if (playbackState === "buffering" || playbackState === "recovering") {
          document.body.dataset.radioPlaybackState = "playing";
        }
      } else if (!audio.paused && Date.now() - lastAdvanceAt > 3500) {
        scheduleRadioRecovery("clock_stalled", 200);
      }
      if (bufferSeconds < RADIO_LOW_BUFFER_SECONDS) {
        try { hls.startLoad(-1); } catch {}
      }
    }, 1000);
  }

  function waitForRadioBuffer(audio, minimumSeconds = RADIO_READY_BUFFER_SECONDS) {
    if (audio?.dataset.radioTransport === "buffered-hls-scheduler") {
      const bufferSeconds = Math.max(0, Number(continuationSegmentPlayer?.nextStartAt || 0) - Number(continuationSegmentPlayer?.context?.currentTime || 0));
      document.body.dataset.radioInitialBufferSeconds = bufferSeconds.toFixed(1);
      document.body.dataset.radioInitialBufferState = bufferSeconds >= minimumSeconds ? "ready" : "partial";
      return Promise.resolve(bufferSeconds);
    }
    if (!["hls-js", "recorded-hls-vod"].includes(audio?.dataset.radioTransport)) {
      return Promise.resolve(radioBufferedAhead(audio));
    }
    const startedAt = Date.now();
    document.body.dataset.radioPlaybackState = "buffering";
    return new Promise((resolve) => {
      const inspect = () => {
        if (audio !== continuationAudio) {
          resolve(0);
          return;
        }
        const bufferSeconds = updateRadioBufferDiagnostics(audio, continuationHls);
        if (bufferSeconds >= minimumSeconds || Date.now() - startedAt >= RADIO_BUFFER_WAIT_MS) {
          document.body.dataset.radioInitialBufferSeconds = bufferSeconds.toFixed(1);
          document.body.dataset.radioInitialBufferState = bufferSeconds >= minimumSeconds ? "ready" : "timeout";
          resolve(bufferSeconds);
          return;
        }
        window.setTimeout(inspect, 120);
      };
      inspect();
    });
  }

  async function fetchRadioResource(url, responseType = "text", timeoutMs = 14000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await window.fetch(url, {
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Radio segment request failed (${response.status}).`);
      return responseType === "arrayBuffer" ? response.arrayBuffer() : response.text();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function resolveHlsChildUrl(line, parentUrl) {
    try { return new URL(String(line || "").trim(), parentUrl).href; } catch { return ""; }
  }

  function resolveHlsAudioRendition(playlist, masterUrl) {
    const audioDeclaration = String(playlist || "")
      .split(/\r?\n/)
      .find((line) => line.startsWith("#EXT-X-MEDIA:") && /(?:^|,)TYPE=AUDIO(?:,|$)/.test(line));
    const uri = audioDeclaration?.match(/(?:^|,)URI="([^"]+)"/)?.[1] || "";
    return resolveHlsChildUrl(uri, masterUrl);
  }

  function loadRecordedProgrammeAudioRendition(source) {
    const cached = recordedProgrammeAudioRenditions.get(source);
    if (cached) return cached;
    const request = fetchRadioResource(source)
      .then((masterPlaylist) => {
        const audioRendition = resolveHlsAudioRendition(masterPlaylist, source);
        if (!audioRendition) throw new Error("The recorded programme has no audio rendition.");
        return audioRendition;
      });
    recordedProgrammeAudioRenditions.set(source, request);
    request.catch(() => {
      if (recordedProgrammeAudioRenditions.get(source) === request) {
        recordedProgrammeAudioRenditions.delete(source);
      }
    });
    return request;
  }

  function parseHlsSegmentUrls(playlist, mediaUrl) {
    const lines = String(playlist || "").split(/\r?\n/);
    return lines
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => resolveHlsChildUrl(line, mediaUrl))
      .filter(Boolean);
  }

  function updateBufferedNtsDiagnostics(player = continuationSegmentPlayer) {
    if (!player || player.stopped) return 0;
    const audio = player.audio;
    const bufferSeconds = Math.max(0, Number(player.nextStartAt || 0) - Number(player.context.currentTime || 0));
    document.body.dataset.radioBufferSeconds = bufferSeconds.toFixed(1);
    document.body.dataset.radioBufferTargetSeconds = String(RADIO_SEGMENT_BUFFER_TARGET_SECONDS);
    document.body.dataset.radioPlaybackTime = Number(player.context.currentTime || 0).toFixed(1);
    document.body.dataset.radioPaused = String(Boolean(audio.paused));
    document.body.dataset.radioMuted = String(Boolean(audio.muted));
    document.body.dataset.radioVolume = (Number(audio.volume) || 0).toFixed(2);
    document.body.dataset.radioReadyState = String(audio.readyState || 0);
    document.body.dataset.radioNetworkState = String(audio.networkState || 0);
    document.body.dataset.radioWaitingCount = String(radioWaitingCount);
    document.body.dataset.radioStalledCount = String(radioStalledCount);
    document.body.dataset.radioRecoveryCount = String(radioRecoveryCount);
    document.body.dataset.radioSegmentCount = String(player.scheduledCount || 0);
    document.body.dataset.radioSegmentRetryCount = String(player.retryCount || 0);
    return bufferSeconds;
  }

  function scheduleDecodedRadioSegment(player, audioBuffer, segmentUrl) {
    if (!player || player.stopped || player !== continuationSegmentPlayer) return;
    const context = player.context;
    const overlap = player.scheduledCount ? RADIO_SEGMENT_CROSSFADE_SECONDS : 0;
    const startAt = Math.max(
      Number(player.nextStartAt || 0) - overlap,
      Number(context.currentTime || 0) + (player.scheduledCount ? .05 : RADIO_SEGMENT_START_DELAY_SECONDS),
    );
    const sourceNode = context.createBufferSource();
    const gainNode = context.createGain();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(gainNode);
    gainNode.connect(player.destination);

    if (overlap) {
      gainNode.gain.setValueAtTime(0, startAt);
      gainNode.gain.linearRampToValueAtTime(1, startAt + overlap);
      if (player.previousGain) {
        player.previousGain.gain.setValueAtTime(1, startAt);
        player.previousGain.gain.linearRampToValueAtTime(0, startAt + overlap);
      }
    } else {
      gainNode.gain.setValueAtTime(1, startAt);
    }

    sourceNode.start(startAt);
    player.previousGain = gainNode;
    player.nextStartAt = startAt + audioBuffer.duration;
    player.scheduledCount += 1;
    player.lastSegmentUrl = segmentUrl;
    player.nodes.add(sourceNode);
    sourceNode.addEventListener("ended", () => {
      player.nodes.delete(sourceNode);
      try { sourceNode.disconnect(); } catch {}
      if (player.previousGain !== gainNode) {
        try { gainNode.disconnect(); } catch {}
      }
    }, { once: true });
    updateBufferedNtsDiagnostics(player);
  }

  async function refreshBufferedNtsSegments(player = continuationSegmentPlayer, forceMaster = false, options = {}) {
    if (!player || player.stopped || player !== continuationSegmentPlayer) return;
    if (player.refreshPromise) return player.refreshPromise;
    const maximumNewSegments = Number.isFinite(Number(options.maximumNewSegments))
      ? Math.max(1, Number(options.maximumNewSegments))
      : Number.POSITIVE_INFINITY;

    player.refreshPromise = (async () => {
      try {
        if (!player.mediaUrl || forceMaster || Date.now() - player.masterLoadedAt > 120000) {
          const masterUrl = `${player.baseUrl.replace(/\/$/, "")}/hls.m3u8`;
          const master = await fetchRadioResource(masterUrl);
          const variant = String(master).split(/\r?\n/).find((line) => line && !line.startsWith("#"));
          player.mediaUrl = resolveHlsChildUrl(variant, masterUrl);
          player.masterLoadedAt = Date.now();
          if (!player.mediaUrl) throw new Error("NTS HLS master has no playable variant.");
        }

        let media;
        try {
          media = await fetchRadioResource(player.mediaUrl);
        } catch (error) {
          if (forceMaster) throw error;
          const masterUrl = `${player.baseUrl.replace(/\/$/, "")}/hls.m3u8`;
          const master = await fetchRadioResource(masterUrl);
          const variant = String(master).split(/\r?\n/).find((line) => line && !line.startsWith("#"));
          player.mediaUrl = resolveHlsChildUrl(variant, masterUrl);
          player.masterLoadedAt = Date.now();
          if (!player.mediaUrl) throw new Error("NTS HLS master has no playable variant.");
          media = await fetchRadioResource(player.mediaUrl);
        }

        const segmentUrls = parseHlsSegmentUrls(media, player.mediaUrl);
        if (Number.isFinite(maximumNewSegments)) {
          const startupUrls = segmentUrls
            .filter((segmentUrl) => !player.seen.has(segmentUrl))
            .slice(0, maximumNewSegments);
          startupUrls.forEach((segmentUrl) => player.seen.add(segmentUrl));
          const decodedSegments = await Promise.all(startupUrls.map(async (segmentUrl) => {
            try {
              const encoded = await fetchRadioResource(segmentUrl, "arrayBuffer", 18000);
              if (player.stopped || player !== continuationSegmentPlayer) return null;
              const decoded = await player.context.decodeAudioData(encoded.slice(0));
              return { decoded, segmentUrl };
            } catch (error) {
              player.seen.delete(segmentUrl);
              player.retryCount += 1;
              document.body.dataset.radioSegmentLastError = String(error?.message || error).slice(0, 140);
              return null;
            }
          }));
          decodedSegments.forEach((entry) => {
            if (!entry || player.stopped || player !== continuationSegmentPlayer) return;
            scheduleDecodedRadioSegment(player, entry.decoded, entry.segmentUrl);
          });
          return;
        }
        let newSegmentCount = 0;
        for (const segmentUrl of segmentUrls) {
          if (player.stopped || player !== continuationSegmentPlayer) return;
          if (player.seen.has(segmentUrl)) continue;
          player.seen.add(segmentUrl);
          try {
            const encoded = await fetchRadioResource(segmentUrl, "arrayBuffer", 18000);
            if (player.stopped || player !== continuationSegmentPlayer) return;
            const decoded = await player.context.decodeAudioData(encoded.slice(0));
            scheduleDecodedRadioSegment(player, decoded, segmentUrl);
            newSegmentCount += 1;
            if (newSegmentCount >= maximumNewSegments) break;
          } catch (error) {
            player.seen.delete(segmentUrl);
            player.retryCount += 1;
            document.body.dataset.radioSegmentLastError = String(error?.message || error).slice(0, 140);
            break;
          }
        }
      } finally {
        player.refreshPromise = null;
      }
    })();

    return player.refreshPromise;
  }

  function destroyContinuationSegmentPlayer() {
    const player = continuationSegmentPlayer;
    continuationSegmentPlayer = null;
    if (!player) return;
    player.stopped = true;
    window.clearInterval(player.monitor);
    player.nodes.forEach((node) => {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    });
    player.nodes.clear();
    try { player.previousGain?.disconnect?.(); } catch {}
    try { player.audio.srcObject = null; } catch {}
    try { player.context.close(); } catch {}
  }

  async function attachBufferedNtsRadio(audio, source) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || !window.MediaStream) throw new Error("Buffered NTS playback is not supported by this browser.");

    const context = new AudioContextClass({ latencyHint: "playback" });
    const destination = context.createMediaStreamDestination();
    const player = {
      audio,
      baseUrl: source,
      context,
      destination,
      mediaUrl: "",
      masterLoadedAt: 0,
      nextStartAt: 0,
      previousGain: null,
      scheduledCount: 0,
      retryCount: 0,
      seen: new Set(),
      nodes: new Set(),
      refreshPromise: null,
      monitor: 0,
      playbackStarted: false,
      underrunActive: false,
      stopped: false,
    };
    continuationSegmentPlayer = player;
    audio.srcObject = destination.stream;
    audio.dataset.radioTransport = "buffered-hls-scheduler";
    document.body.dataset.radioStreamTransport = "buffered-hls-scheduler";
    radioWaitingCount = 0;
    radioStalledCount = 0;
    radioRecoveryCount = 0;

    const handleWaiting = () => {
      if (!player.playbackStarted) return;
      radioWaitingCount += 1;
      document.body.dataset.radioPlaybackState = "buffering";
      updateBufferedNtsDiagnostics(player);
    };
    const handlePlaying = () => {
      player.playbackStarted = true;
      document.body.dataset.radioPlaybackState = "playing";
      delete document.body.dataset.radioPlaybackError;
      updateBufferedNtsDiagnostics(player);
    };
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    radioPlaybackCleanup = () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };

    await refreshBufferedNtsSegments(player, false, { maximumNewSegments: RADIO_SEGMENT_STARTUP_COUNT });
    if (player !== continuationSegmentPlayer || player.scheduledCount < RADIO_SEGMENT_STARTUP_COUNT) {
      throw new Error("NTS could not build a safe audio buffer.");
    }
    const initialBuffer = updateBufferedNtsDiagnostics(player);
    if (initialBuffer < RADIO_SEGMENT_STARTUP_BUFFER_SECONDS) {
      throw new Error("NTS could not build the startup audio reservoir.");
    }
    document.body.dataset.radioInitialBufferSeconds = initialBuffer.toFixed(1);
    document.body.dataset.radioInitialBufferState = "ready";
    document.body.dataset.radioInitialSegmentCount = String(player.scheduledCount);

    refreshBufferedNtsSegments(player).catch((error) => {
      player.retryCount += 1;
      document.body.dataset.radioSegmentLastError = String(error?.message || error).slice(0, 140);
    });

    player.monitor = window.setInterval(() => {
      if (player.stopped || player !== continuationSegmentPlayer) return;
      const bufferSeconds = updateBufferedNtsDiagnostics(player);
      const running = player.context.state === "running" && player.playbackStarted;
      if (running && bufferSeconds < .12) {
        if (!player.underrunActive) {
          player.underrunActive = true;
          radioStalledCount += 1;
          radioRecoveryCount += 1;
          document.body.dataset.radioRecoveryReason = "segment_buffer_underrun";
          document.body.dataset.radioPlaybackState = "buffering";
        }
      } else if (bufferSeconds > 1) {
        player.underrunActive = false;
        if (running && !audio.paused) document.body.dataset.radioPlaybackState = "playing";
      }
      if (bufferSeconds < RADIO_SEGMENT_BUFFER_TARGET_SECONDS) {
        refreshBufferedNtsSegments(player).catch((error) => {
          player.retryCount += 1;
          document.body.dataset.radioSegmentLastError = String(error?.message || error).slice(0, 140);
        });
      }
    }, RADIO_SEGMENT_POLL_MS);
    return audio;
  }

  function bindDirectRadioPlaybackDiagnostics(audio, source) {
    clearRadioPlaybackDiagnostics();
    radioWaitingCount = 0;
    radioStalledCount = 0;
    radioRecoveryCount = 0;
    radioLastRecoveryAt = 0;
    let playbackStarted = false;
    let lastPlaybackTime = Number(audio.currentTime) || 0;
    let lastAdvanceAt = Date.now();

    const reconnect = (reason) => {
      if (audio !== continuationAudio || continuationAudioSource !== source) return;
      if (!document.body.classList.contains("television-radio-continuation")) return;
      const now = Date.now();
      if (now - radioLastRecoveryAt < 2500) return;
      radioLastRecoveryAt = now;
      radioRecoveryCount += 1;
      document.body.dataset.radioRecoveryCount = String(radioRecoveryCount);
      document.body.dataset.radioRecoveryReason = reason;
      if (radioRecoveryCount >= 3 && fallbackStationFor(continuationDecision)) {
        startScheduledRadioFallback(continuationDecision, {
          broadcastChannelId,
          source: "direct_stream_recovery",
        }, 0, new Error(reason)).catch((error) => {
          document.body.dataset.radioPlaybackState = "error";
          document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
        });
        return;
      }
      document.body.dataset.radioPlaybackState = "reconnecting";
      try {
        audio.pause();
        audio.src = source;
        audio.load();
      } catch {}
      audio.play()
        .then(() => {
          document.body.dataset.radioPlaybackState = "playing";
          delete document.body.dataset.radioPlaybackError;
        })
        .catch((error) => {
          document.body.dataset.radioPlaybackState = "error";
          document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
        });
    };
    const scheduleReconnect = (reason, delayMs = 1200) => {
      window.clearTimeout(radioRecoveryTimer);
      radioRecoveryTimer = window.setTimeout(() => {
        radioRecoveryTimer = 0;
        reconnect(reason);
      }, delayMs);
    };
    const handleWaiting = () => {
      if (!playbackStarted) return;
      radioWaitingCount += 1;
      document.body.dataset.radioPlaybackState = "buffering";
      updateRadioBufferDiagnostics(audio, null);
      scheduleReconnect("direct_waiting", 2500);
    };
    const handleStalled = () => {
      if (!playbackStarted) return;
      radioStalledCount += 1;
      document.body.dataset.radioPlaybackState = "buffering";
      updateRadioBufferDiagnostics(audio, null);
      scheduleReconnect("direct_stalled");
    };
    const handlePlaying = () => {
      playbackStarted = true;
      window.clearTimeout(radioRecoveryTimer);
      radioRecoveryTimer = 0;
      lastPlaybackTime = Number(audio.currentTime) || 0;
      lastAdvanceAt = Date.now();
      if (document.body.classList.contains("television-radio-continuation")) {
        document.body.dataset.radioPlaybackState = "playing";
        delete document.body.dataset.radioPlaybackError;
      }
      updateRadioBufferDiagnostics(audio, null);
    };
    const handleError = () => {
      document.body.dataset.radioLastMediaError = String(audio.error?.code || "unknown");
      scheduleReconnect("direct_media_error", 400);
    };
    const handleEnded = () => scheduleReconnect("direct_ended", 200);

    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);
    radioPlaybackCleanup = () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
    };

    radioBufferMonitor = window.setInterval(() => {
      if (audio !== continuationAudio || continuationAudioSource !== source) return;
      updateRadioBufferDiagnostics(audio, null);
      if (!document.body.classList.contains("television-radio-continuation")) return;
      const currentTime = Number(audio.currentTime);
      if (!Number.isFinite(currentTime)) return;
      if (currentTime > lastPlaybackTime + .04) {
        lastPlaybackTime = currentTime;
        lastAdvanceAt = Date.now();
        if (playbackStarted && !audio.paused) {
          window.clearTimeout(radioRecoveryTimer);
          radioRecoveryTimer = 0;
          const playbackState = document.body.dataset.radioPlaybackState;
          if (playbackState === "buffering" || playbackState === "reconnecting") {
            document.body.dataset.radioPlaybackState = "playing";
            delete document.body.dataset.radioPlaybackError;
          }
        }
      } else if (playbackStarted && !audio.paused && Date.now() - lastAdvanceAt > RADIO_DIRECT_STALL_MS) {
        scheduleReconnect("direct_clock_stalled", 200);
      }
    }, 1000);
  }

  function destroyContinuationHls() {
    radioHlsAttachSequence += 1;
    destroyContinuationSegmentPlayer();
    clearRadioPlaybackDiagnostics();
    try { continuationHls?.destroy?.(); } catch {}
    continuationHls = null;
    continuationAudioSource = "";
    [
      "radioStreamTransport", "radioBufferSeconds", "radioBufferTargetSeconds", "radioPlaybackTime",
      "radioPaused", "radioMuted", "radioVolume", "radioReadyState",
      "radioNetworkState", "radioBandwidthKbps", "radioLiveLatencySeconds", "radioWaitingCount",
      "radioStalledCount", "radioRecoveryCount", "radioRecoveryReason", "radioLastHlsError",
      "radioLastMediaError", "radioManifestVariants", "radioBitrateKbps", "radioLiveSyncSegments",
      "radioInitialBufferSeconds", "radioInitialBufferState", "radioInitialSegmentCount", "radioSegmentCount",
      "radioSegmentRetryCount", "radioSegmentLastError", "radioStreamSemantics", "radioRecordedRendition",
    ].forEach((key) => delete document.body.dataset[key]);
  }

  async function attachContinuationAudioSource(audio, source, options = {}) {
    if (!audio || !source) throw new Error("Radio station has no playable stream URL.");
    const recordedProgramme = Boolean(options.recordedProgramme && isHlsRadioSource(source));
    const expectedTransport = recordedProgramme
      ? "recorded-hls-vod"
      : isBufferedNtsRadioSource(source)
        ? "buffered-hls-scheduler"
        : isHlsRadioSource(source)
          ? "hls-js"
          : "direct-mp3";
    if (
      continuationAudioSource === source &&
      audio.dataset.radioTransport === expectedTransport &&
      (continuationHls || continuationSegmentPlayer || audio.getAttribute("src") || audio.srcObject)
    ) return audio;

    destroyContinuationHls();
    const attachSequence = radioHlsAttachSequence;
    continuationAudioSource = source;
    try {
      audio.pause();
      audio.srcObject = null;
      audio.removeAttribute("src");
      audio.load();
    } catch {}

    if (isBufferedNtsRadioSource(source)) {
      return attachBufferedNtsRadio(audio, source);
    }

    if (!isHlsRadioSource(source)) {
      audio.src = source;
      audio.dataset.radioTransport = "direct-mp3";
      document.body.dataset.radioStreamTransport = "direct-mp3";
      bindDirectRadioPlaybackDiagnostics(audio, source);
      return audio;
    }

    const nativeHlsSupported = Boolean(audio.canPlayType("application/vnd.apple.mpegurl"));
    let Hls;
    try {
      Hls = await loadRadioHlsLibrary();
    } catch (error) {
      if (!nativeHlsSupported) throw error;
    }
    if (attachSequence !== radioHlsAttachSequence || audio !== continuationAudio) return audio;
    if (!Hls?.isSupported?.()) {
      if (!nativeHlsSupported) throw new Error("This browser cannot play the station's HLS stream.");
      audio.src = source;
      audio.dataset.radioTransport = "hls-native";
      document.body.dataset.radioStreamTransport = "hls-native";
      return audio;
    }

    const hlsConfig = {
      enableWorker: true,
      lowLatencyMode: false,
      startFragPrefetch: true,
      startLevel: 0,
      maxBufferLength: recordedProgramme ? 30 : 60,
      maxMaxBufferLength: recordedProgramme ? 60 : 90,
      backBufferLength: 15,
      maxBufferHole: 1.5,
      highBufferWatchdogPeriod: 1,
      nudgeOffset: .1,
      nudgeMaxRetry: 5,
      manifestLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 6,
      manifestLoadingRetryDelay: 1000,
      manifestLoadingMaxRetryTimeout: 16000,
      levelLoadingTimeOut: 20000,
      levelLoadingMaxRetry: 8,
      levelLoadingRetryDelay: 1000,
      levelLoadingMaxRetryTimeout: 16000,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 8,
      fragLoadingRetryDelay: 1000,
      fragLoadingMaxRetryTimeout: 16000,
    };
    if (recordedProgramme) {
      const startPosition = Number(options.startPositionSeconds);
      if (Number.isFinite(startPosition) && startPosition >= 0) hlsConfig.startPosition = startPosition;
    } else {
      hlsConfig.liveSyncDurationCount = RADIO_LIVE_SYNC_SEGMENTS;
      hlsConfig.liveMaxLatencyDurationCount = RADIO_MAX_LIVE_LATENCY_SEGMENTS;
      hlsConfig.maxLiveSyncPlaybackRate = 1;
    }
    let playbackSource = source;
    if (recordedProgramme) {
      playbackSource = await loadRecordedProgrammeAudioRendition(source);
      document.body.dataset.radioRecordedRendition = "audio_only";
    }
    const hls = new Hls(hlsConfig);
    continuationHls = hls;
    audio.dataset.radioTransport = expectedTransport;
    document.body.dataset.radioStreamTransport = expectedTransport;
    document.body.dataset.radioStreamSemantics = recordedProgramme ? "recorded_programme" : "live_station";
    if (recordedProgramme) {
      delete document.body.dataset.radioLiveSyncSegments;
      const startPosition = Number(options.startPositionSeconds);
      if (Number.isFinite(startPosition) && startPosition >= 0) {
        audio.dataset.recordedProgrammeStartSeconds = startPosition.toFixed(3);
      }
    } else {
      document.body.dataset.radioLiveSyncSegments = String(RADIO_LIVE_SYNC_SEGMENTS);
    }
    bindRadioPlaybackDiagnostics(audio, hls, Hls);

    await new Promise((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => finish(new Error("HLS station manifest timed out.")), 12000);
      const finish = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        hls.off(Hls.Events.ERROR, handleError);
        if (error) reject(error);
        else resolve();
      };
      const handleError = (_event, data) => {
        if (data?.fatal) finish(new Error(`HLS station error: ${data.details || data.type || "fatal"}`));
      };

      hls.on(Hls.Events.ERROR, handleError);
      hls.once(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(playbackSource));
      hls.once(Hls.Events.MANIFEST_PARSED, () => finish());
      hls.attachMedia(audio);
    }).catch((error) => {
      if (continuationHls === hls) destroyContinuationHls();
      throw error;
    });

    return audio;
  }

  function stopContinuationAudioImmediately() {
    clearShopArrivalFade();
    destroyContinuationHls();
    if (continuationAudio) {
      try {
        continuationAudio.pause();
        continuationAudio.muted = true;
        continuationAudio.volume = 0;
        continuationAudio.removeAttribute("src");
        continuationAudio.load();
      } catch {}
    }
    continuationAudio = null;
    continuationDecision = null;
    document.body.dataset.radioPlaybackState = "stopped";
    document.body.dataset.radioPreloadState = "stopped";
    delete document.body.dataset.audioPartyStreamSemantics;
    delete document.body.dataset.audioPartyRevealBufferSeconds;
  }

  function closeBroadcastEntry(restoreFocus = false) {
    if (!broadcastEntry || !broadcastEntryOpen) return;
    broadcastEntryOpen = false;
    broadcastEntry.setAttribute("aria-hidden", "true");
    broadcastEntry.setAttribute("inert", "");
    document.body.classList.remove("broadcast-entry-open");
    document.body.dataset.broadcastEntryState = "closed";
    if (restoreFocus) {
      const returnTarget = pendingBroadcastFormat === "fashion" ? fashionShelfToggle : musicShelfToggle;
      returnTarget?.focus({ preventScroll: true });
    }
  }

  async function openBroadcastEntry(item, options = {}) {
    if (!item?.broadcastChannelId) return false;
    try {
      await window.IAMBroadcastClock?.ready;
    } catch {
      showMusicShelfStatus("The shared broadcast clock is temporarily unavailable.", 3600);
      return false;
    }
    const state = window.IAMBroadcastClock?.stateAt(item.broadcastChannelId);
    const currentTrack = ["video", "audio"].includes(state?.mediaType) ? findTrack(state.trackId) : null;
    const currentStation = state?.mediaType === "radio" ? stationForId(state.stationId) : null;
    const currentRunway = state?.mediaType === "fashion" ? fashionRunwayForId(state.runwayId) : null;
    const currentMedia = currentTrack || currentStation || currentRunway;
    if (!state || !currentMedia) return false;
    pendingBroadcastChannelId = item.broadcastChannelId;
    pendingBroadcastFormat = state.format;
    if (!broadcastEntry) {
      await joinBroadcastChannel(item.broadcastChannelId, { source: options.source || "broadcast_direct" });
      return true;
    }
    if (musicShelfOpen) closeMusicShelf(false);
    if (fashionShelfOpen) closeFashionShelf(false);
    if (broadcastEntryArtist) broadcastEntryArtist.textContent = currentTrack
      ? (currentTrack.displayArtist || currentTrack.artist)
      : currentStation
        ? currentStation.provider
        : currentRunway.brand;
    if (broadcastEntryTitle) broadcastEntryTitle.textContent = currentTrack
      ? (currentTrack.displayTitle || currentTrack.title)
      : currentStation
        ? currentStation.display_title
        : currentRunway.title;
    if (broadcastEntryVibe) broadcastEntryVibe.textContent = state.channelName.toUpperCase();
    if (broadcastEntryFormat) broadcastEntryFormat.textContent = broadcastFormatLabel(state.format);
    broadcastEntryOpen = true;
    broadcastEntry.setAttribute("aria-hidden", "false");
    broadcastEntry.removeAttribute("inert");
    document.body.classList.add("broadcast-entry-open");
    document.body.dataset.broadcastEntryState = "open";
    document.body.dataset.broadcastEntryChannel = item.broadcastChannelId;
    document.body.dataset.broadcastEntryFormat = state.format;
    document.body.dataset.broadcastEntryMedia = state.mediaId;
    window.setTimeout(() => broadcastEntryPanel?.focus({ preventScroll: true }), 40);
    window.IAMFirstPartyAnalytics?.record?.("broadcast_invitation_open", {
      channel_id: item.broadcastChannelId,
      format: state.format,
      media_id: state.mediaId,
      selection_source: options.source || "adaptive",
    });
    return true;
  }

  function stopBroadcastPlayback(reason = "personal_choice") {
    if (broadcastSyncTimer) {
      window.clearInterval(broadcastSyncTimer);
      broadcastSyncTimer = 0;
    }
    if (localVideo && Math.abs(Number(localVideo.playbackRate || 1) - 1) > .001) localVideo.playbackRate = 1;
    clearMusicHandoffTimer();
    discardPreloadedMusicVideo(reason);
    window.IAMBroadcastInteractions?.clear?.(reason);
    broadcastChannelId = "";
    document.body.dataset.broadcastMode = "personal";
    document.body.dataset.broadcastExitReason = reason;
    delete document.body.dataset.broadcastChannelId;
    delete document.body.dataset.broadcastTrackId;
    delete document.body.dataset.broadcastStationId;
    delete document.body.dataset.broadcastTargetSeconds;
    delete document.body.dataset.broadcastDriftSeconds;
    delete document.body.dataset.broadcastCorrection;
    delete document.body.dataset.broadcastProgrammeInstanceId;
    delete document.body.dataset.broadcastPlaybackRate;
    delete document.body.dataset.broadcastRejoinSamples;
    delete document.body.dataset.broadcastControllerSeekCount;
    delete document.body.dataset.broadcastHandoffTrackId;
    delete document.body.dataset.broadcastHandoffPlaybackRate;
    delete document.body.dataset.broadcastHandoffBufferSeconds;
  }

  function broadcastSyncNow() {
    return window.performance?.now?.() || Date.now();
  }

  function broadcastMediaBufferedAhead(media) {
    const controllerDepth = window.IAMStreamController?.bufferedAhead?.(media);
    if (Number.isFinite(controllerDepth)) return controllerDepth;
    if (!media?.buffered?.length) return 0;
    const currentTime = Number(media.currentTime || 0);
    for (let index = 0; index < media.buffered.length; index += 1) {
      if (currentTime + .12 >= media.buffered.start(index) && currentTime <= media.buffered.end(index) + .12) {
        return Math.max(0, media.buffered.end(index) - currentTime);
      }
    }
    return 0;
  }

  function broadcastMediaSyncState(media) {
    let syncState = broadcastMediaSyncStates.get(media);
    if (syncState) return syncState;
    syncState = {
      programmeInstanceId: "",
      largeDriftSamples: 0,
      lastSeekAt: 0,
      seekCount: 0,
      seekInFlight: null,
      recovering: false,
      lastCorrection: "",
    };
    const beginRecovery = () => {
      if (syncState.seekInFlight) return;
      syncState.recovering = true;
      syncState.largeDriftSamples = 0;
    };
    media.addEventListener("waiting", beginRecovery);
    media.addEventListener("stalled", beginRecovery);
    media.addEventListener("ratechange", () => {
      if (Math.abs(Number(media.playbackRate || 1) - 1) > .0001) media.playbackRate = 1;
    });
    broadcastMediaSyncStates.set(media, syncState);
    return syncState;
  }

  function setBroadcastSyncDiagnostic(scope, suffix, value) {
    const key = `${scope}${suffix}`;
    if (value === null || typeof value === "undefined" || value === "") delete document.body.dataset[key];
    else document.body.dataset[key] = String(value);
  }

  function publishBroadcastCorrection(media, syncState, options, correction, details = {}) {
    setBroadcastSyncDiagnostic(options.scope, "Correction", correction);
    setBroadcastSyncDiagnostic(options.scope, "PlaybackRate", Number(media.playbackRate || 1).toFixed(3));
    setBroadcastSyncDiagnostic(options.scope, "RejoinSamples", syncState.largeDriftSamples);
    setBroadcastSyncDiagnostic(options.scope, "ControllerSeekCount", syncState.seekCount);
    if (syncState.lastCorrection === correction && !details.forceTelemetry) return;
    syncState.lastCorrection = correction;
    window.IAMStreamController?.recordMediaEvent?.(media, "broadcast_sync_state", {
      role: options.role || media.dataset.streamRole || "music",
      programme_instance_id: options.programmeInstanceId || "",
      broadcast_channel_id: options.channelId || "",
      correction,
      playback_rate: Number(media.playbackRate || 1),
      drift_seconds: Number(details.driftSeconds || 0),
      buffer_before_correction: Number(details.bufferSeconds ?? broadcastMediaBufferedAhead(media)),
      controller_seek_count: syncState.seekCount,
      seeking: Boolean(media.seeking),
    });
  }

  async function waitForBroadcastMetadata(media) {
    if (media.readyState >= 1) return true;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ready) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        media.removeEventListener("loadedmetadata", onMetadata);
        resolve(ready);
      };
      const onMetadata = () => finish(true);
      const timeout = window.setTimeout(() => finish(false), 4500);
      media.addEventListener("loadedmetadata", onMetadata, { once: true });
    });
  }

  async function performControlledBroadcastSeek(media, targetSeconds, options, reason) {
    const syncState = broadcastMediaSyncState(media);
    if (syncState.seekInFlight) return syncState.seekInFlight;
    syncState.seekInFlight = (async () => {
      if (!await waitForBroadcastMetadata(media)) return false;
      const wasPlaying = !media.paused;
      const originalVolume = Number(media.volume || 0);
      const restoreBaseVolume = voiceAssistantDuckActive
        ? (voiceAssistantBaseVolumes.get(media) ?? originalVolume)
        : originalVolume;
      const shouldFade = wasPlaying && !media.muted && originalVolume > .001;
      const bufferBeforeCorrection = broadcastMediaBufferedAhead(media);
      media.playbackRate = 1;
      if (shouldFade) {
        animateVoiceAssistantProgramVolume(media, 0, BROADCAST_REJOIN_FADE_OUT_MS);
        await wait(BROADCAST_REJOIN_FADE_OUT_MS);
      }
      syncState.seekCount += 1;
      window.IAMStreamController?.noteControlledSeek?.(media, {
        role: options.role || media.dataset.streamRole || "music",
        programme_instance_id: options.programmeInstanceId || "",
        broadcast_channel_id: options.channelId || "",
        seek_reason: reason,
        drift_seconds: Number(options.driftSeconds || 0),
        buffer_before_correction: bufferBeforeCorrection,
        controller_seek_count: syncState.seekCount,
      });
      await new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          media.removeEventListener("seeked", finish);
          resolve();
        };
        const timeout = window.setTimeout(finish, 2500);
        media.addEventListener("seeked", finish, { once: true });
        try {
          media.currentTime = targetSeconds;
        } catch {
          finish();
        }
      });
      media.playbackRate = 1;
      if (wasPlaying && media.paused) media.play().catch(() => {});
      if (shouldFade) setVoiceAssistantProgramVolume(media, restoreBaseVolume, BROADCAST_REJOIN_FADE_IN_MS);
      syncState.lastSeekAt = broadcastSyncNow();
      syncState.largeDriftSamples = 0;
      syncState.recovering = false;
      publishBroadcastCorrection(media, syncState, options, reason, {
        driftSeconds: options.driftSeconds,
        bufferSeconds: bufferBeforeCorrection,
        forceTelemetry: true,
      });
      return true;
    })().finally(() => {
      syncState.seekInFlight = null;
    });
    return syncState.seekInFlight;
  }

  async function synchronizeBroadcastMedia(media, targetSeconds, options = {}) {
    if (!media || !Number.isFinite(targetSeconds)) return "unavailable";
    const syncState = broadcastMediaSyncState(media);
    media.playbackRate = 1;
    if (syncState.programmeInstanceId !== options.programmeInstanceId) {
      syncState.programmeInstanceId = options.programmeInstanceId || "";
      syncState.largeDriftSamples = 0;
      syncState.recovering = false;
      syncState.lastSeekAt = 0;
    }
    const driftSeconds = Number(media.currentTime || 0) - targetSeconds;
    const absoluteDrift = Math.abs(driftSeconds);
    const bufferSeconds = broadcastMediaBufferedAhead(media);
    options.driftSeconds = driftSeconds;

    if (options.forceSeek) {
      if (syncState.lastSeekAt > 0 && broadcastSyncNow() - syncState.lastSeekAt < BROADCAST_REJOIN_COOLDOWN_MS) {
        publishBroadcastCorrection(media, syncState, options, "entry_seek_cooldown", { driftSeconds, bufferSeconds });
        return "entry_seek_cooldown";
      }
      await performControlledBroadcastSeek(media, targetSeconds, options, "entry_seek");
      return "entry_seek";
    }
    if (absoluteDrift <= BROADCAST_LOCK_TOLERANCE_SECONDS) {
      syncState.largeDriftSamples = 0;
      syncState.recovering = false;
      publishBroadcastCorrection(media, syncState, options, "locked", { driftSeconds, bufferSeconds });
      return "locked";
    }
    if (absoluteDrift < BROADCAST_REJOIN_DRIFT_SECONDS) {
      syncState.largeDriftSamples = 0;
      publishBroadcastCorrection(media, syncState, options, "within_tolerance", { driftSeconds, bufferSeconds });
      return "within_tolerance";
    }
    if (
      media.paused ||
      media.seeking ||
      media.readyState < HTMLMediaElement.HAVE_FUTURE_DATA ||
      bufferSeconds < BROADCAST_REJOIN_BUFFER_SECONDS
    ) {
      syncState.recovering = true;
      syncState.largeDriftSamples = 0;
      publishBroadcastCorrection(media, syncState, options, "recovery_buffering", { driftSeconds, bufferSeconds });
      return "recovery_buffering";
    }
    if (broadcastSyncNow() - syncState.lastSeekAt < BROADCAST_REJOIN_COOLDOWN_MS) {
      publishBroadcastCorrection(media, syncState, options, "rejoin_cooldown", { driftSeconds, bufferSeconds });
      return "rejoin_cooldown";
    }
    syncState.largeDriftSamples += 1;
    if (syncState.largeDriftSamples < BROADCAST_REJOIN_REQUIRED_SAMPLES) {
      publishBroadcastCorrection(media, syncState, options, "rejoin_confirming", { driftSeconds, bufferSeconds });
      return "rejoin_confirming";
    }
    await performControlledBroadcastSeek(media, targetSeconds, options, "controlled_rejoin");
    return "controlled_rejoin";
  }

  function fashionChannelIdForEnergy(energyId) {
    return `fashion-${BROADCAST_ENERGY_ORDER.includes(energyId) ? energyId : "restore"}`;
  }

  async function seekBroadcastVideo(video, targetSeconds, options = {}) {
    return performControlledBroadcastSeek(video, targetSeconds, {
      scope: "broadcast",
      role: video?.dataset?.streamRole || "music",
      ...options,
    }, options.reason || "entry_seek");
  }

  async function synchronizeFashionBroadcastPlayback(forceSeek = false) {
    if (!fashionBroadcastChannelId || !window.IAMBroadcastClock || !fashionVideo) return null;
    const state = window.IAMBroadcastClock.stateAt(fashionBroadcastChannelId);
    const scheduledRunway = fashionRunwayForId(state?.runwayId);
    const scheduledIndex = fashionRunways.indexOf(scheduledRunway);
    if (!state || !scheduledRunway || scheduledIndex < 0) return null;
    document.body.dataset.fashionBroadcastChannelId = fashionBroadcastChannelId;
    document.body.dataset.fashionBroadcastRunwayId = state.runwayId;
    document.body.dataset.fashionBroadcastBlockRemainingSeconds = state.remainingSeconds.toFixed(3);
    if (fashionRunwayIndex !== scheduledIndex) {
      document.body.dataset.fashionBroadcastCorrection = "programme_rollover";
      await setFashionRunway(scheduledIndex, { source: "algorithm" });
      forceSeek = true;
    }
    await ensureFashionStreamAttached(fashionVideo);
    if (fashionVideo.paused) await playWhenStreamAttached(fashionVideo, "fashion").catch(() => {});
    const duration = Number(fashionVideo.duration || 0);
    if (!Number.isFinite(duration) || duration <= 0) {
      return state;
    }
    const targetSeconds = ((state.offsetSeconds % duration) + duration) % duration;
    let driftSeconds = Number(fashionVideo.currentTime || 0) - targetSeconds;
    if (Math.abs(driftSeconds) > duration / 2) driftSeconds += driftSeconds > 0 ? -duration : duration;
    document.body.dataset.fashionBroadcastTargetSeconds = targetSeconds.toFixed(3);
    document.body.dataset.fashionBroadcastDriftSeconds = driftSeconds.toFixed(3);
    await synchronizeBroadcastMedia(fashionVideo, targetSeconds, {
      forceSeek,
      scope: "fashionBroadcast",
      role: "fashion",
      channelId: fashionBroadcastChannelId,
      programmeInstanceId: state.programmeInstanceId,
    });
    return state;
  }

  function startFashionBroadcastSynchronization() {
    if (fashionBroadcastSyncTimer) window.clearInterval(fashionBroadcastSyncTimer);
    fashionBroadcastSyncTimer = window.setInterval(() => {
      synchronizeFashionBroadcastPlayback(false).catch((error) => {
        document.body.dataset.fashionBroadcastSyncError = String(error?.message || error).slice(0, 140);
      });
    }, BROADCAST_SYNC_INTERVAL_MS);
  }

  function stopFashionBroadcastPlayback(reason = "fashion_broadcast_stopped") {
    if (fashionBroadcastSyncTimer) {
      window.clearInterval(fashionBroadcastSyncTimer);
      fashionBroadcastSyncTimer = 0;
    }
    if (fashionVideo && Math.abs(Number(fashionVideo.playbackRate || 1) - 1) > .001) fashionVideo.playbackRate = 1;
    fashionBroadcastChannelId = "";
    fashionBroadcastPairingSource = "";
    document.body.dataset.fashionBroadcastMode = "personal";
    document.body.dataset.fashionBroadcastExitReason = reason;
    delete document.body.dataset.fashionBroadcastChannelId;
    delete document.body.dataset.fashionBroadcastRunwayId;
    delete document.body.dataset.fashionBroadcastTargetSeconds;
    delete document.body.dataset.fashionBroadcastDriftSeconds;
    delete document.body.dataset.fashionBroadcastCorrection;
  }

  async function setRadioVisualRunway(index, options = {}) {
    const nextIndex = ((index % fashionRunways.length) + fashionRunways.length) % fashionRunways.length;
    const nextRunway = fashionRunways[nextIndex];
    if (!nextRunway) return false;
    const nextVideo = await preloadRadioFashionRunway(nextIndex);
    if (!nextVideo) return false;
    if (nextVideo.parentElement !== playerMount) {
      playerMount.insertBefore(nextVideo, fashionVideo || timecode || null);
    }

    if (radioVisualVideo && radioVisualVideo !== nextVideo) {
      radioVisualVideo.classList.remove("is-radio-visual-active");
      window.IAMStreamController?.setFashionActive(radioVisualVideo, false, "radio_visual_switch");
      try { radioVisualVideo.pause(); } catch {}
      if (Math.abs(Number(radioVisualVideo.playbackRate || 1) - 1) > .001) radioVisualVideo.playbackRate = 1;
      window.IAMStreamController?.setPriority?.(radioVisualVideo, "optional");
    }

    radioVisualVideo = nextVideo;
    window.IAMStreamController?.setPriority?.(radioVisualVideo, "primary");
    radioVisualRunwayIndex = nextIndex;
    await ensureFashionStreamAttached(radioVisualVideo);
    const readiness = await window.IAMStreamController?.prepareFashionReveal(radioVisualVideo, {
      minimumSeconds: Number.isFinite(Number(options.revealMinimumSeconds))
        ? Math.max(4, Number(options.revealMinimumSeconds))
        : RADIO_FASHION_REVEAL_BUFFER_SECONDS,
      firstFallbackMs: 1250,
      secondFallbackMs: 2000,
    });
    if (readiness?.cancelled) return false;
    await playWhenStreamAttached(radioVisualVideo, "fashion").catch(() => {});
    radioVisualVideo.classList.add("is-radio-visual-active");
    releaseUnusedRadioFashionRunways(new Set([nextRunway.assetKey]));
    playerMount.dataset.radioVisualRunwayId = nextRunway.assetKey;
    document.body.dataset.radioVisualRunwayId = nextRunway.assetKey;
    window.IAMStreamController?.noteFashionReveal(radioVisualVideo);
    return true;
  }

  async function synchronizeRadioVisualBroadcastPlayback(forceSeek = false) {
    if (!radioVisualBroadcastChannelId || !window.IAMBroadcastClock) return null;
    const state = window.IAMBroadcastClock.stateAt(radioVisualBroadcastChannelId);
    const scheduledRunway = fashionRunwayForId(state?.runwayId);
    const scheduledIndex = fashionRunways.indexOf(scheduledRunway);
    if (!state || !scheduledRunway || scheduledIndex < 0) return null;
    document.body.dataset.radioVisualBroadcastChannelId = radioVisualBroadcastChannelId;
    document.body.dataset.radioVisualBroadcastRunwayId = state.runwayId;
    document.body.dataset.radioVisualBroadcastBlockRemainingSeconds = state.remainingSeconds.toFixed(3);
    if (radioVisualRunwayIndex !== scheduledIndex || !radioVisualVideo) {
      document.body.dataset.radioVisualBroadcastCorrection = "programme_rollover";
      const activated = await setRadioVisualRunway(scheduledIndex);
      if (!activated) return state;
      forceSeek = true;
    }

    await ensureFashionStreamAttached(radioVisualVideo);
    if (radioVisualVideo.paused) await playWhenStreamAttached(radioVisualVideo, "fashion").catch(() => {});
    const duration = Number(radioVisualVideo.duration || 0);
    if (!Number.isFinite(duration) || duration <= 0) {
      return state;
    }
    const targetSeconds = ((state.offsetSeconds % duration) + duration) % duration;
    let driftSeconds = Number(radioVisualVideo.currentTime || 0) - targetSeconds;
    if (Math.abs(driftSeconds) > duration / 2) driftSeconds += driftSeconds > 0 ? -duration : duration;
    document.body.dataset.radioVisualBroadcastTargetSeconds = targetSeconds.toFixed(3);
    document.body.dataset.radioVisualBroadcastDriftSeconds = driftSeconds.toFixed(3);
    await synchronizeBroadcastMedia(radioVisualVideo, targetSeconds, {
      forceSeek,
      scope: "radioVisualBroadcast",
      role: "fashion",
      channelId: radioVisualBroadcastChannelId,
      programmeInstanceId: state.programmeInstanceId,
    });
    return state;
  }

  function startRadioVisualBroadcastSynchronization() {
    if (radioVisualBroadcastSyncTimer) window.clearInterval(radioVisualBroadcastSyncTimer);
    radioVisualBroadcastSyncTimer = window.setInterval(() => {
      synchronizeRadioVisualBroadcastPlayback(false).catch((error) => {
        document.body.dataset.radioVisualBroadcastSyncError = String(error?.message || error).slice(0, 140);
      });
    }, BROADCAST_SYNC_INTERVAL_MS);
  }

  function stopRadioVisualBroadcastPlayback(reason = "radio_visual_stopped") {
    if (radioVisualBroadcastSyncTimer) {
      window.clearInterval(radioVisualBroadcastSyncTimer);
      radioVisualBroadcastSyncTimer = 0;
    }
    if (radioVisualVideo) {
      radioVisualVideo.classList.remove("is-radio-visual-active");
      window.IAMStreamController?.setFashionActive(radioVisualVideo, false, reason);
      try { radioVisualVideo.pause(); } catch {}
      if (Math.abs(Number(radioVisualVideo.playbackRate || 1) - 1) > .001) radioVisualVideo.playbackRate = 1;
    }
    radioVisualBroadcastChannelId = "";
    radioVisualRunwayIndex = -1;
    radioVisualVideo = null;
    releaseUnusedRadioFashionRunways(new Set());
    delete playerMount.dataset.radioVisualRunwayId;
    document.body.dataset.radioVisualBroadcastMode = "stopped";
    document.body.dataset.radioVisualBroadcastExitReason = reason;
    delete document.body.dataset.radioVisualBroadcastChannelId;
    delete document.body.dataset.radioVisualBroadcastRunwayId;
    delete document.body.dataset.radioVisualBroadcastBlockRemainingSeconds;
    delete document.body.dataset.radioVisualBroadcastTargetSeconds;
    delete document.body.dataset.radioVisualBroadcastDriftSeconds;
    delete document.body.dataset.radioVisualBroadcastCorrection;
    delete document.body.dataset.radioVisualRunwayId;
  }

  async function joinRadioVisualBroadcastChannel(channelId, options = {}) {
    try {
      await window.IAMBroadcastClock?.ready;
    } catch {
      showMusicShelfStatus("The shared Radio visual clock is temporarily unavailable.", 3600);
      return false;
    }
    const state = window.IAMBroadcastClock?.stateAt(channelId);
    const scheduledRunway = fashionRunwayForId(state?.runwayId);
    const scheduledIndex = fashionRunways.indexOf(scheduledRunway);
    if (!state || state.mediaType !== "fashion" || !scheduledRunway || scheduledIndex < 0) return false;
    radioVisualBroadcastChannelId = channelId;
    document.body.dataset.radioVisualBroadcastMode = "shared";
    const activated = await setRadioVisualRunway(scheduledIndex, {
      revealMinimumSeconds: options.revealMinimumSeconds,
    });
    if (!activated) {
      stopRadioVisualBroadcastPlayback("radio_visual_unavailable");
      return false;
    }
    setVideoBlend(100);
    startRadioVisualBroadcastSynchronization();
    await synchronizeRadioVisualBroadcastPlayback(true);
    window.IAMFirstPartyAnalytics?.record?.("radio_visual_broadcast_join", {
      channel_id: channelId,
      runway_id: state.runwayId,
      block_offset_seconds: state.offsetSeconds,
      pairing_source: options.pairingSource || options.source || "radio_visual",
    });
    return true;
  }

  async function joinFashionBroadcastChannel(channelId, options = {}) {
    const joinSequence = ++fashionBroadcastJoinSequence;
    try {
      await window.IAMBroadcastClock?.ready;
    } catch {
      showMusicShelfStatus("The shared Fashion clock is temporarily unavailable.", 3600);
      return false;
    }
    const state = window.IAMBroadcastClock?.stateAt(channelId);
    const scheduledRunway = fashionRunwayForId(state?.runwayId);
    if (!state || state.mediaType !== "fashion" || !scheduledRunway) return false;
    const loadingItem = fashionSharedItems().find((item) => item.broadcastChannelId === channelId) || {
      id: state.runwayId,
      broadcastChannelName: state.channelName,
    };
    const loadingGeneration = Number(options.channelLoadingGeneration) || beginChannelLoading({
      mode: "fashion",
      item: loadingItem,
      channelName: state.channelName,
      source: options.source || "fashion_broadcast_join",
    });
    closeBroadcastEntry(false);
    pendingBroadcastChannelId = "";
    const previousFashionBroadcastChannelId = fashionBroadcastChannelId;
    const previousFashionBroadcastPairingSource = fashionBroadcastPairingSource;
    if (fashionBroadcastSyncTimer) {
      window.clearInterval(fashionBroadcastSyncTimer);
      fashionBroadcastSyncTimer = 0;
    }
    fashionBroadcastChannelId = channelId;
    fashionBroadcastPairingSource = options.pairingSource || options.source || "fashion_broadcast";
    document.body.dataset.fashionBroadcastMode = "shared";
    document.body.dataset.fashionBroadcastPairingSource = fashionBroadcastPairingSource;
    delete document.body.dataset.fashionBroadcastJoinError;
    const ready = await setFashionRunway(fashionRunways.indexOf(scheduledRunway), {
      source: "algorithm",
      broadcastState: state,
      channelId,
      revealMinimumSeconds: options.revealMinimumSeconds || 4,
      readinessTimeoutMs: options.readinessTimeoutMs || 9000,
    });
    if (joinSequence !== fashionBroadcastJoinSequence || fashionBroadcastChannelId !== channelId) return false;
    if (!ready) {
      fashionBroadcastChannelId = previousFashionBroadcastChannelId;
      fashionBroadcastPairingSource = previousFashionBroadcastPairingSource;
      document.body.dataset.fashionBroadcastMode = previousFashionBroadcastChannelId ? "shared" : "personal";
      if (previousFashionBroadcastPairingSource) {
        document.body.dataset.fashionBroadcastPairingSource = previousFashionBroadcastPairingSource;
      } else {
        delete document.body.dataset.fashionBroadcastPairingSource;
      }
      if (!previousFashionBroadcastChannelId) {
        delete document.body.dataset.fashionBroadcastChannelId;
        delete document.body.dataset.fashionBroadcastRunwayId;
        delete document.body.dataset.fashionBroadcastBlockRemainingSeconds;
      }
      if (previousFashionBroadcastChannelId) startFashionBroadcastSynchronization();
      failChannelLoading(loadingGeneration);
      showMusicShelfStatus("The shared Fashion channel is temporarily unavailable.", 3600);
      return false;
    }
    setVideoBlend(document.body.classList.contains("television-emdr-gif-active") ? emdrGifVideoBlend : 0);
    startFashionBroadcastSynchronization();
    await synchronizeFashionBroadcastPlayback(false);
    if (joinSequence !== fashionBroadcastJoinSequence || fashionBroadcastChannelId !== channelId) return false;
    rankMusicShelves();
    window.IAMFirstPartyAnalytics?.record?.("fashion_broadcast_join", {
      channel_id: channelId,
      runway_id: state.runwayId,
      block_offset_seconds: state.offsetSeconds,
      pairing_source: fashionBroadcastPairingSource,
    });
    if (!options.deferChannelLoadingFinish) finishChannelLoading(loadingGeneration);
    return true;
  }

  async function synchronizeBroadcastPlayback(forceSeek = false) {
    if (!broadcastChannelId || !window.IAMBroadcastClock) return null;
    const state = window.IAMBroadcastClock.stateAt(broadcastChannelId);
    if (!state) return null;
    const previousProgrammeInstanceId = document.body.dataset.broadcastProgrammeInstanceId || "";
    const programmeChanged = Boolean(
      previousProgrammeInstanceId && previousProgrammeInstanceId !== state.programmeInstanceId
    );
    window.IAMBroadcastInteractions?.setBroadcast?.(state);
    document.body.dataset.broadcastChannelId = broadcastChannelId;
    document.body.dataset.broadcastRemainingSeconds = state.remainingSeconds.toFixed(3);
    document.body.dataset.broadcastProgrammeInstanceId = state.programmeInstanceId;
    if (state.mediaType !== "video") {
      clearMusicHandoffTimer();
      if (preloadedMusicVideo) discardPreloadedMusicVideo("non_video_broadcast");
    }
    if (state.mediaType === "radio") {
      const scheduledStation = stationForId(state.stationId);
      if (!scheduledStation) return null;
      document.body.dataset.broadcastStationId = state.stationId;
      delete document.body.dataset.broadcastTrackId;
      delete document.body.dataset.broadcastTargetSeconds;
      delete document.body.dataset.broadcastDriftSeconds;
      if (activeRadioStationId !== scheduledStation.id || document.body.dataset.radioPlaybackState === "stopped") {
        document.body.dataset.broadcastCorrection = "programme_rollover";
        if (!musicSwitching) {
          await startRadioStation(scheduledStation, {
            source: "broadcast_rollover",
            broadcastChannelId,
          });
          rankMusicShelves();
        }
      } else {
        document.body.dataset.broadcastCorrection = "live_station_locked";
      }
      return state;
    }
    if (state.mediaType === "audio") {
      const scheduledTrack = findTrack(state.trackId);
      if (!scheduledTrack) return null;
      document.body.dataset.broadcastTrackId = state.trackId;
      delete document.body.dataset.broadcastStationId;
      document.body.dataset.broadcastTargetSeconds = state.offsetSeconds.toFixed(3);
      if (
        continuationDecision?.track_id !== scheduledTrack.id ||
        !continuationAudio ||
        document.body.dataset.audioPartyPlaybackState === "stopped"
      ) {
        document.body.dataset.broadcastCorrection = "programme_rollover";
        if (!musicSwitching) {
          const sexEdOwnsVisuals = broadcastChannelId === SEX_ED_BROADCAST_CHANNEL_ID;
          const sexEdLoadingGeneration = sexEdOwnsVisuals ? beginChannelLoading({
            mode: "sex-ed",
            item: scheduledTrack,
            channelName: "sex-ed",
            source: "sex_ed_rollover",
            force: true,
          }) : 0;
          const visualJoined = sexEdOwnsVisuals || await joinFashionBroadcastChannel(state.visualChannelId || "fashion-underground-intensity", {
            source: "audio_party_visual_pair",
            pairingSource: `party_${state.editorialId || state.energyId}`,
          });
          if (visualJoined) {
            await startAudioLedParty(scheduledTrack, {
              source: sexEdOwnsVisuals ? "sex_ed_rollover" : "broadcast_rollover",
              broadcastChannelId,
              channelLoadingGeneration: sexEdLoadingGeneration || undefined,
              visualAlreadyManaged: sexEdOwnsVisuals,
              readyBufferSeconds: sexEdOwnsVisuals ? SEX_ED_RECORDED_PROGRAMME_READY_BUFFER_SECONDS : undefined,
              startTimeoutMs: sexEdOwnsVisuals ? SEX_ED_AUDIO_PARTY_START_TIMEOUT_MS : undefined,
            });
          }
          rankMusicShelves();
        }
        return state;
      }
      if (continuationAudio.readyState < 1) return state;
      const driftSeconds = Number(continuationAudio.currentTime || 0) - state.offsetSeconds;
      document.body.dataset.broadcastDriftSeconds = driftSeconds.toFixed(3);
      await synchronizeBroadcastMedia(continuationAudio, state.offsetSeconds, {
        forceSeek,
        scope: "broadcast",
        role: "audio",
        channelId: broadcastChannelId,
        programmeInstanceId: state.programmeInstanceId,
      });
      return state;
    }
    const scheduledTrack = findTrack(state.trackId);
    if (!scheduledTrack || !localVideo) return null;
    scheduleUpcomingMusicHandoff(state);
    document.body.dataset.broadcastTrackId = state.trackId;
    delete document.body.dataset.broadcastStationId;
    document.body.dataset.broadcastTargetSeconds = state.offsetSeconds.toFixed(3);
    if (track.id !== scheduledTrack.id || programmeChanged) {
      document.body.dataset.broadcastCorrection = programmeChanged && track.id === scheduledTrack.id
        ? "same_track_programme_rollover"
        : "programme_rollover";
      if (!musicSwitching) {
        await switchMusicTrack(scheduledTrack, {
          source: "broadcast_rollover",
          broadcastChannelId,
        });
        rankMusicShelves();
      }
      return state;
    }
    if (localVideo.readyState < 1) return state;
    const driftSeconds = Number(localVideo.currentTime || 0) - state.offsetSeconds;
    document.body.dataset.broadcastDriftSeconds = driftSeconds.toFixed(3);
    await synchronizeBroadcastMedia(localVideo, state.offsetSeconds, {
      forceSeek,
      scope: "broadcast",
      role: "music",
      channelId: broadcastChannelId,
      programmeInstanceId: state.programmeInstanceId,
    });
    return state;
  }

  function startBroadcastSynchronization() {
    if (broadcastSyncTimer) window.clearInterval(broadcastSyncTimer);
    broadcastSyncTimer = window.setInterval(() => {
      synchronizeBroadcastPlayback(false).catch((error) => {
        document.body.dataset.broadcastSyncError = String(error?.message || error).slice(0, 140);
      });
    }, BROADCAST_SYNC_INTERVAL_MS);
  }

  async function joinBroadcastChannel(channelId, options = {}) {
    if (document.body.classList.contains("television-comedy-active")) {
      await window.IAMComedyChannel?.leaveForNavigation?.();
    }
    const joinSequence = ++broadcastJoinSequence;
    const joinSource = String(options.source || "broadcast_join");
    if (!joinSource.startsWith("sex_ed")) {
      if (document.body.classList.contains("television-sex-ed-active")) {
        stopSexEdEpisode({ restoreProgramme: false });
      } else {
        releaseSexEdLoopVideos();
      }
    }
    window.IAMMantraSampler?.armSharedAudio?.();
    try {
      await window.IAMBroadcastClock?.ready;
    } catch {
      showMusicShelfStatus("The shared broadcast clock is temporarily unavailable.", 3600);
      return false;
    }
    const state = window.IAMBroadcastClock?.stateAt(channelId);
    if (state?.mediaType === "fashion") {
      return joinFashionBroadcastChannel(channelId, {
        source: options.source || "fashion_broadcast_join",
        pairingSource: options.pairingSource || "manual_fashion_channel",
      });
    }
    const scheduledTrack = ["video", "audio"].includes(state?.mediaType) ? findTrack(state.trackId) : null;
    const scheduledStation = state?.mediaType === "radio" ? stationForId(state.stationId) : null;
    if (!state || (!scheduledTrack && !scheduledStation)) return false;
    if (broadcastSyncTimer) {
      window.clearInterval(broadcastSyncTimer);
      broadcastSyncTimer = 0;
    }
    const loadingItem = scheduledTrack || scheduledStation;
    const loadingGeneration = Number(options.channelLoadingGeneration) || beginChannelLoading({
      mode: state.format,
      item: loadingItem,
      channelName: state.channelName,
      source: options.source || "broadcast_join",
    });
    closeBroadcastEntry(false);
    pendingBroadcastChannelId = "";
    broadcastChannelId = channelId;
    document.body.dataset.broadcastMode = "shared";
    document.body.dataset.broadcastClockSource = window.IAMBroadcastClock.diagnostics().clockSource;
    if (scheduledStation) {
      // The outgoing music stream must stop consuming the constrained startup
      // budget before the incoming Radio picture builds its reveal buffer.
      // Its last decoded frame stays mounted beneath the shared loader.
      const resumeOutgoingVideoOnFailure = Boolean(localVideo && !localVideo.paused);
      if (localVideo) {
        try { localVideo.pause(); } catch {}
        window.IAMStreamController?.setPriority?.(localVideo, "optional");
        window.IAMStreamController?.suspend?.(localVideo, "radio_visual_handoff");
      }
      const inactiveVisuals = new Set([
        fashionVideo,
        ...document.querySelectorAll(".background-video video"),
      ]);
      inactiveVisuals.forEach((video) => {
        if (!video) return;
        window.IAMStreamController?.setFashionActive?.(video, false, "radio_visual_handoff");
        window.IAMStreamController?.suspend?.(video, "radio_visual_handoff");
      });
      // Put the silent runway on screen before the radio transport performs its
      // larger safety-buffer fill. A slow station must never hold the picture
      // behind a 12–30 second audio startup.
      const radioVisualReady = await joinRadioVisualBroadcastChannel(state.visualChannelId || fashionChannelIdForEnergy(state.energyId), {
        source: "radio_energy_match",
        pairingSource: `radio_${state.editorialId || state.energyId}`,
        revealMinimumSeconds: RADIO_FASHION_REVEAL_BUFFER_SECONDS,
      });
      if (joinSequence !== broadcastJoinSequence || broadcastChannelId !== channelId) return false;
      if (!radioVisualReady) {
        if (localVideo) {
          window.IAMStreamController?.setPriority?.(localVideo, "primary");
          if (resumeOutgoingVideoOnFailure) playLocalVideo(localVideo);
        }
        failChannelLoading(loadingGeneration);
        showMusicShelfStatus("The shared Radio visual is temporarily unavailable.", 3600);
        return false;
      }
      await startRadioStation(scheduledStation, {
        source: options.source || "broadcast_join",
        broadcastChannelId: channelId,
        channelLoadingGeneration: loadingGeneration,
      });
      if (joinSequence !== broadcastJoinSequence || broadcastChannelId !== channelId) return false;
    } else if (state.mediaType === "audio") {
      const sexEdOwnsVisuals = channelId === SEX_ED_BROADCAST_CHANNEL_ID || options.source === "sex_ed_episode";
      if (!sexEdOwnsVisuals) {
        const visualJoined = await joinFashionBroadcastChannel(state.visualChannelId || "fashion-underground-intensity", {
          source: "audio_party_visual_pair",
          pairingSource: `party_${state.editorialId || state.energyId}`,
          channelLoadingGeneration: loadingGeneration,
          deferChannelLoadingFinish: true,
        });
        if (joinSequence !== broadcastJoinSequence || broadcastChannelId !== channelId) return false;
        if (!visualJoined) {
          failChannelLoading(loadingGeneration);
          return false;
        }
      }
      const started = await startAudioLedParty(scheduledTrack, {
        source: options.source || "broadcast_join",
        broadcastChannelId: channelId,
        channelLoadingGeneration: loadingGeneration,
        deferChannelLoadingFinish: true,
        visualAlreadyManaged: sexEdOwnsVisuals,
        readyBufferSeconds: sexEdOwnsVisuals ? SEX_ED_RECORDED_PROGRAMME_READY_BUFFER_SECONDS : undefined,
        startTimeoutMs: sexEdOwnsVisuals ? SEX_ED_AUDIO_PARTY_START_TIMEOUT_MS : undefined,
      });
      if (joinSequence !== broadcastJoinSequence || broadcastChannelId !== channelId) return false;
      if (!started) return false;
      if (!options.deferChannelLoadingFinish) finishChannelLoading(loadingGeneration);
    } else {
      stopRadioVisualBroadcastPlayback("video_broadcast_start");
      await switchMusicTrack(scheduledTrack, {
        source: options.source || "broadcast_join",
        broadcastChannelId: channelId,
        channelLoadingGeneration: loadingGeneration,
      });
      if (joinSequence !== broadcastJoinSequence || broadcastChannelId !== channelId) return false;
    }
    startBroadcastSynchronization();
    await synchronizeBroadcastPlayback(true);
    rankMusicShelves();
    window.IAMFirstPartyAnalytics?.record?.("broadcast_join", {
      channel_id: channelId,
      format: state.format,
      media_id: state.mediaId,
      offset_seconds: Number(document.body.dataset.broadcastTargetSeconds || state.offsetSeconds),
    });
    return true;
  }

  async function switchMusicTrack(nextTrack, options = {}) {
    if (!nextTrack || musicSwitching) return;
    if (document.body.classList.contains("television-comedy-active")) {
      await window.IAMComedyChannel?.leaveForNavigation?.();
    }
    const loadingGeneration = Number(options.channelLoadingGeneration) || beginChannelLoading({
      mode: nextTrack.presentation === "live_dj_set" ? "parties" : "videos",
      item: nextTrack,
      source: options.source || "manual",
    });
    musicSwitching = true;
    if (options.broadcastChannelId) {
      broadcastChannelId = options.broadcastChannelId;
      document.body.dataset.broadcastMode = "shared";
      document.body.dataset.broadcastChannelId = broadcastChannelId;
    } else {
      stopBroadcastPlayback(options.source || "track_switch");
    }
    stopContinuationAudioImmediately();
    stopRadioVisualBroadcastPlayback("track_switch");
    document.body.classList.remove("television-radio-continuation", "television-audio-party");
    document.body.dataset.audioPartyPlaybackState = "stopped";
    activeRadioStationId = "";
    delete document.body.dataset.radioStationId;
    delete document.body.dataset.radioStationProvider;
    delete document.body.dataset.radioPlaybackError;
    document.body.dataset.radioPlaybackState = "stopped";
    musicChannelMode = nextTrack.presentation === "live_dj_set" ? "parties" : "videos";
    musicModeManuallySelected = options.source !== "automatic_continuation";
    try {
      let video = localVideo || mountPlayer();
      await setVideoBlend(100);
      const bufferedHandoff = options.broadcastChannelId
        ? await activateBufferedMusicHandoff(nextTrack, options)
        : null;
      if (bufferedHandoff) {
        video = bufferedHandoff;
      } else {
        document.body.dataset.broadcastHandoffState = options.broadcastChannelId ? "fallback_attach" : "not_required";
        try { video.pause(); } catch {}
        window.IAMStreamController?.detach(video);
        delete video.__iamStreamAttachPromise;
        delete video.dataset.televisionStreamAttach;
        delete video.dataset.televisionStreamError;
        track = nextTrack;
        video.loop = false;
        video.muted = false;
        video.defaultMuted = false;
        setVoiceAssistantProgramVolume(video, 1, voiceAssistantDuckActive ? 260 : 0);
        video.setAttribute("aria-label", `${track.artist} - ${track.title}`);
        video.dataset.musicTrackId = track.id;
        video.dataset.streamPriority = "primary";
        if (loadingGeneration) video.dataset.channelLoadingGeneration = String(loadingGeneration);
        try { video.currentTime = 0; } catch {}
        await attachAdaptiveStream(video, track.localVideoSrc, "music");
        window.IAMStreamController?.setPriority?.(video, "primary");
      }
      track = nextTrack;
      syncSelectedTrackCopy();
      setMusicTelevisionMetadata();
      if (options.broadcastChannelId && !bufferedHandoff) {
        const currentBroadcastState = window.IAMBroadcastClock?.stateAt(options.broadcastChannelId);
        if (currentBroadcastState?.trackId === track.id) {
          await seekBroadcastVideo(video, currentBroadcastState.offsetSeconds, {
            reason: "entry_seek",
            channelId: options.broadcastChannelId,
            programmeInstanceId: currentBroadcastState.programmeInstanceId,
          });
        }
      } else if (Number.isFinite(Number(options.startAt))) {
        await seekBroadcastVideo(video, Math.max(0, Number(options.startAt)), { reason: "personal_restore" });
      }
      if (bufferedHandoff) {
        delete video.dataset.channelLoadingGeneration;
        finishChannelLoading(loadingGeneration);
      } else {
        playLocalVideo(video);
        if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          delete video.dataset.channelLoadingGeneration;
          finishChannelLoading(loadingGeneration);
        }
      }
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
    } catch (error) {
      failChannelLoading(loadingGeneration);
      throw error;
    } finally {
      musicSwitching = false;
    }
  }

  function stationForId(stationId) {
    return radioStationRecords.find((station) => station.id === stationId) || null;
  }

  function fallbackStationFor(station) {
    const fallbackId = String(station?.fallback_station_id || "");
    if (!fallbackId || fallbackId === station?.id) return null;
    return stationForId(fallbackId);
  }

  async function startScheduledRadioFallback(station, options = {}, loadingGeneration = 0, error = null) {
    if (options.fallbackAttempted) return false;
    const fallback = fallbackStationFor(station);
    if (!fallback) return false;
    document.body.dataset.radioFallbackFrom = station.id;
    document.body.dataset.radioFallbackTo = fallback.id;
    document.body.dataset.radioFallbackReason = String(error?.message || error || "station_unavailable").slice(0, 120);
    document.body.dataset.radioScheduledStationId = station.id;
    showMusicShelfStatus(`${station.display_title} · unavailable — ${fallback.display_title} now`, 5000);
    await startRadioStation(fallback, {
      ...options,
      channelLoadingGeneration: Number(loadingGeneration) || undefined,
      source: "scheduled_station_fallback",
      fallbackAttempted: true,
      scheduledStationId: station.id,
    });
    return true;
  }

  function markAudioLedPartyUnavailable(nextTrack, loadingGeneration, error) {
    const sexEdProgramme = broadcastChannelId === SEX_ED_BROADCAST_CHANNEL_ID;
    stopContinuationAudioImmediately();
    document.body.classList.remove("television-radio-continuation", "television-audio-party");
    document.body.dataset.audioPartyPlaybackState = "unavailable";
    document.body.dataset.audioPartyStreamSemantics = "recorded_programme";
    document.body.dataset.audioPartyPlaybackError = String(error?.message || error).slice(0, 140);
    document.body.dataset.audioPartyRecovery = sexEdProgramme ? "reopen_sex_ed_episode" : "select_james_bondage_again";
    failChannelLoading(loadingGeneration);
    const recoveryCopy = sexEdProgramme ? "reopen the sex-ed episode to retry" : "select james bondage to retry";
    showMusicShelfStatus(`${nextTrack.displayArtist || nextTrack.artist} · mix unavailable — ${recoveryCopy}`, 6000);
  }

  async function startAudioLedParty(nextTrack, options = {}) {
    if (!nextTrack?.audioOnly || musicSwitching) return false;
    const startSequence = ++audioPartyStartSequence;
    let timeout = 0;
    const startup = startAudioLedPartyAttempt(nextTrack, options, startSequence);
    const startTimeoutMs = Number.isFinite(Number(options.startTimeoutMs))
      ? Math.max(AUDIO_PARTY_START_TIMEOUT_MS, Number(options.startTimeoutMs))
      : AUDIO_PARTY_START_TIMEOUT_MS;
    const timedOut = new Promise((resolve) => {
      timeout = window.setTimeout(() => {
        if (startSequence !== audioPartyStartSequence) return;
        audioPartyStartSequence += 1;
        musicSwitching = false;
        markAudioLedPartyUnavailable(
          nextTrack,
          Number(options.channelLoadingGeneration) || channelLoadingGeneration,
          new Error("The mix did not become ready in time.")
        );
        resolve(false);
      }, startTimeoutMs);
    });
    const started = await Promise.race([startup, timedOut]);
    window.clearTimeout(timeout);
    return started;
  }

  async function startAudioLedPartyAttempt(nextTrack, options, startSequence) {
    const loadingGeneration = Number(options.channelLoadingGeneration) || beginChannelLoading({
      mode: "parties",
      item: nextTrack,
      source: options.source || "manual",
    });
    const assertCurrentStart = () => {
      if (startSequence !== audioPartyStartSequence) throw new Error("Audio party startup was cancelled.");
    };
    clearShopArrivalFade();
    clearMusicHandoffTimer();
    if (preloadedMusicVideo) discardPreloadedMusicVideo("audio_party_start");
    const shopIndependent = options.source === "shop_independent";
    const requestedStartSeconds = shopIndependent
      ? SHOP_ARRIVAL_START_SECONDS
      : Number(options.startAt);
    const hasRequestedStart = Number.isFinite(requestedStartSeconds);
    const requestedFadeInMs = Math.max(
      0,
      shopIndependent ? SHOP_ARRIVAL_FADE_IN_MS : Number(options.fadeInMs) || 0
    );
    if (!nextTrack.hlsVideoSrc && !window.IAMCloudflareStream && window.IAMStreamReady) {
      try { await window.IAMStreamReady; } catch {}
      assertCurrentStart();
    }
    const streamAsset = window.IAMCloudflareStream?.assetFor(nextTrack.localVideoSrc);
    const source = nextTrack.hlsVideoSrc || streamAsset?.hls || "";
    if (!source) {
      document.body.dataset.audioPartyPlaybackState = "encoding";
      failChannelLoading(loadingGeneration);
      showMusicShelfStatus(`${nextTrack.displayArtist || nextTrack.artist} · broadcast encoding is finishing`, 4200);
      return false;
    }
    musicSwitching = true;
    try {
      if (options.broadcastChannelId) {
        broadcastChannelId = options.broadcastChannelId;
        document.body.dataset.broadcastMode = "shared";
        document.body.dataset.broadcastChannelId = broadcastChannelId;
      } else {
        stopBroadcastPlayback(options.source || "audio_party_start");
      }
      if (localVideo) {
        try { localVideo.pause(); } catch {}
        localVideo.muted = true;
        if (options.visualAlreadyManaged) {
          window.IAMStreamController?.setPriority?.(localVideo, "optional");
          window.IAMStreamController?.suspend?.(localVideo, "sex_ed_audio_handoff");
        }
      }
      if (options.visualAlreadyManaged && fashionVideo) {
        window.IAMStreamController?.setFashionActive?.(fashionVideo, false, "sex_ed_audio_handoff");
        window.IAMStreamController?.setPriority?.(fashionVideo, "optional");
        window.IAMStreamController?.suspend?.(fashionVideo, "sex_ed_audio_handoff");
      }
      stopRadioVisualBroadcastPlayback("audio_party_start");
      activeRadioStationId = "";
      delete document.body.dataset.radioStationId;
      delete document.body.dataset.radioStationProvider;
      document.body.classList.add("television-radio-continuation", "television-audio-party");
      document.body.dataset.audioPartyPlaybackState = "loading";
      document.body.dataset.audioPartyStreamSemantics = "recorded_programme";
      document.body.dataset.audioPartyTrackId = nextTrack.id;
      delete document.body.dataset.audioPartyPlaybackError;
      delete document.body.dataset.audioPartyRecovery;
      delete document.body.dataset.audioPartyRevealBufferSeconds;
      playerMount.classList.remove("is-local-video-awaiting-gesture");
      if (!options.visualAlreadyManaged) await setVideoBlend(0);
      assertCurrentStart();
      musicChannelMode = "parties";
      musicModeManuallySelected = options.source !== "automatic_continuation";
      track = nextTrack;
      syncSelectedTrackCopy();
      setMusicTelevisionMetadata();
      const initialBroadcastState = options.broadcastChannelId
        ? window.IAMBroadcastClock?.stateAt(options.broadcastChannelId)
        : null;
      const initialStartSeconds = initialBroadcastState?.trackId === nextTrack.id
        ? Math.max(0, Number(initialBroadcastState.offsetSeconds) || 0)
        : hasRequestedStart
          ? Math.max(0, requestedStartSeconds)
          : undefined;
      const visualStartup = options.visualAlreadyManaged
        ? Promise.resolve()
        : (async () => {
          await ensureFashionStreamAttached();
          assertCurrentStart();
          if (fashionVideo?.paused) await playWhenStreamAttached(fashionVideo, "fashion").catch(() => {});
          assertCurrentStart();
        })();
      const audioStartup = primeContinuationAudio({
        id: nextTrack.id,
        track_id: nextTrack.id,
        label: nextTrack.displayTitle || nextTrack.title,
        src: source,
      }, {
        recordedProgramme: true,
        startPositionSeconds: initialStartSeconds,
      });
      await Promise.all([visualStartup, audioStartup]);
      assertCurrentStart();
      const state = options.broadcastChannelId
        ? window.IAMBroadcastClock?.stateAt(options.broadcastChannelId)
        : null;
      if (state?.trackId === nextTrack.id) {
        await seekBroadcastVideo(continuationAudio, state.offsetSeconds, {
          reason: "entry_seek",
          role: "audio",
          channelId: options.broadcastChannelId,
          programmeInstanceId: state.programmeInstanceId,
        });
        assertCurrentStart();
      } else if (hasRequestedStart) {
        await seekBroadcastVideo(continuationAudio, Math.max(0, requestedStartSeconds), {
          reason: shopIndependent ? "shop_cue" : "requested_start",
          role: "audio",
        });
        assertCurrentStart();
      }
      const readyBufferSeconds = Number.isFinite(Number(options.readyBufferSeconds))
        ? Math.max(RECORDED_PROGRAMME_PRIME_BUFFER_SECONDS, Number(options.readyBufferSeconds))
        : RECORDED_PROGRAMME_READY_BUFFER_SECONDS;
      const revealBufferSeconds = await waitForRadioBuffer(continuationAudio, readyBufferSeconds);
      assertCurrentStart();
      document.body.dataset.audioPartyRevealBufferSeconds = revealBufferSeconds.toFixed(1);
      if (revealBufferSeconds + .15 < readyBufferSeconds) {
        throw new Error("The recorded programme could not rebuild its reveal buffer.");
      }
      window.clearTimeout(radioRecoveryTimer);
      radioRecoveryTimer = 0;
      continuationAudio.loop = false;
      continuationAudio.muted = false;
      continuationAudio.playbackRate = 1;
      const targetProgrammeLevel = programmeFixedMixLevel ?? .68;
      if (requestedFadeInMs > 0) {
        continuationAudio.volume = 0;
        document.body.dataset.audioPartyFadeInMs = String(requestedFadeInMs);
      } else {
        delete document.body.dataset.audioPartyFadeInMs;
        setVoiceAssistantProgramVolume(
          continuationAudio,
          targetProgrammeLevel,
          voiceAssistantDuckActive ? 260 : 0
        );
      }
      if (state?.trackId === nextTrack.id) {
        document.body.dataset.audioPartyStartSeconds = Math.max(0, Number(state.offsetSeconds) || 0).toFixed(3);
      } else if (hasRequestedStart) {
        document.body.dataset.audioPartyStartSeconds = Math.max(0, requestedStartSeconds).toFixed(3);
      } else {
        delete document.body.dataset.audioPartyStartSeconds;
      }
      await continuationAudio.play();
      assertCurrentStart();
      if (requestedFadeInMs > 0) {
        fadeShopArrivalProgrammeVolume(continuationAudio, targetProgrammeLevel, requestedFadeInMs);
      }
      document.body.dataset.radioPlaybackState = "playing";
      document.body.dataset.audioPartyPlaybackState = "playing";
      if (!options.deferChannelLoadingFinish) finishChannelLoading(loadingGeneration);
      window.IAMEMDR?.setTimelineSource?.({ media: continuationAudio, bpm: 124, firstDownbeatSeconds: 0, fallbackBpm: 124 });
      if ("mediaSession" in window.navigator && window.MediaMetadata) {
        window.navigator.mediaSession.metadata = new window.MediaMetadata({
          title: nextTrack.displayTitle || nextTrack.title,
          artist: nextTrack.displayArtist || nextTrack.artist,
          album: "Universal Mind · james bondage",
        });
      }
      updateMusicSelector();
      renderMusicShelf();
      showMusicShelfStatus(`${nextTrack.displayArtist || nextTrack.artist} · live mix now`, 2600);
      window.IAMFirstPartyAnalytics?.record?.("audio_party_start", {
        track_id: nextTrack.id,
        channel_id: options.broadcastChannelId || "",
        visual_channel_id: options.visualAlreadyManaged ? "sex-ed-background" : "fashion-underground-intensity",
        selection_source: options.source || "adaptive",
      });
      return true;
    } catch (error) {
      if (startSequence !== audioPartyStartSequence) return false;
      markAudioLedPartyUnavailable(nextTrack, loadingGeneration, error);
      return false;
    } finally {
      if (startSequence === audioPartyStartSequence) musicSwitching = false;
    }
  }

  function bestRadioStationForTrack() {
    const ranked = musicShelfOrders.radio?.length ? musicShelfOrders.radio : radioStationRecords;
    const roomPool = continuation.roomPools[track.musicRoom] || [];
    if (!roomPool.length) return null;
    return ranked.find((station) => roomPool.includes(station.id)) || null;
  }

  async function startRadioStation(stationDecision, options = {}) {
    const station = stationForId(stationDecision?.id || stationDecision) || bestRadioStationForTrack();
    if (!station) return;
    if (!options.fallbackAttempted) {
      delete document.body.dataset.radioFallbackFrom;
      delete document.body.dataset.radioFallbackTo;
      delete document.body.dataset.radioFallbackReason;
      delete document.body.dataset.radioScheduledStationId;
    }
    const loadingGeneration = Number(options.channelLoadingGeneration) || beginChannelLoading({
      mode: "radio",
      item: station,
      source: options.source || "manual",
    });
    clearMusicHandoffTimer();
    if (preloadedMusicVideo) discardPreloadedMusicVideo("radio_start");
    if (options.broadcastChannelId) {
      broadcastChannelId = options.broadcastChannelId;
      document.body.dataset.broadcastMode = "shared";
      document.body.dataset.broadcastChannelId = broadcastChannelId;
      document.body.dataset.broadcastStationId = station.id;
      delete document.body.dataset.broadcastTrackId;
    } else {
      stopBroadcastPlayback(options.source || "radio_start");
    }
    musicRadioPreviousBlend = requestedVideoBlend;
    if (localVideo) {
      try { localVideo.pause(); } catch {}
      localVideo.muted = true;
    }
    document.body.classList.add("television-radio-continuation");
    document.body.classList.remove("television-audio-party");
    document.body.dataset.audioPartyPlaybackState = "stopped";
    delete document.body.dataset.audioPartyStreamSemantics;
    playerMount.classList.remove("is-local-video-awaiting-gesture");
    try {
      await setVideoBlend(100);
      if (radioVisualBroadcastChannelId) {
        await synchronizeRadioVisualBroadcastPlayback(true);
      }
    } catch (error) {
      failChannelLoading(loadingGeneration);
      throw error;
    }
    activeRadioStationId = station.id;
    musicChannelMode = "radio";
    continuationDecision = { ...station, label: station.display_title, src: station.stream_url };
    delete document.body.dataset.radioPlaybackError;
    document.body.dataset.radioPlaybackState = "loading";
    try {
      await primeContinuationAudio(continuationDecision);
    } catch (error) {
      if (await startScheduledRadioFallback(station, options, loadingGeneration, error)) return;
      document.body.dataset.radioPlaybackState = "error";
      document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
      failChannelLoading(loadingGeneration);
      updateNowPlaying();
      showMusicShelfStatus(`${station.display_title} · stream unavailable`, 3200);
      return;
    }
    window.IAMEMDR?.setTimelineSource?.({ media: continuationAudio, bpm: 112, firstDownbeatSeconds: 0, fallbackBpm: 112 });
    continuationAudio.muted = false;
    continuationAudio.addEventListener("playing", () => postShopMusicStatus(), { once: true });
    continuationAudio.addEventListener("error", () => postShopMusicStatus(), { once: true });
    document.body.dataset.radioPreloadState = "live";
    if (continuationSegmentPlayer) {
      continuationSegmentPlayer.playbackStarted = true;
      continuationSegmentPlayer.context.resume().catch((error) => {
        document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
      });
    }
    continuationAudio.play()
      .then(() => {
        document.body.dataset.radioPlaybackState = "playing";
        fadeContinuationAudio(programmeFixedMixLevel ?? .68, 1200);
        finishChannelLoading(loadingGeneration);
        updateNowPlaying();
      })
      .catch(async (error) => {
        if (error?.name !== "NotAllowedError" && await startScheduledRadioFallback(station, options, loadingGeneration, error)) return;
        document.body.dataset.radioPlaybackState = "error";
        document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
        failChannelLoading(loadingGeneration);
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
    window.IAMFirstPartyAnalytics?.record?.("radio_start", {
      station_id: station.id,
      provider: station.provider,
      channel_id: options.broadcastChannelId || "",
      selection_source: options.source || "adaptive",
    });
    maybeShowSupportCard();
  }

  async function selectMusicItem(item, options = {}) {
    if (!item) return;
    if (item.broadcastChannelId) {
      musicModeManuallySelected = true;
      recordMusicFeedback(item, "explicit_select");
      if (options.closeShelf) closeMusicShelf(false);
      await openBroadcastEntry(item, { source: options.source || "manual" });
      return;
    }
    if (audioWalletJoined) {
      queueMusicItem(item);
      if (options.closeShelf) window.setTimeout(() => closeMusicShelf(false), 520);
      return;
    }
    if (document.body.classList.contains("television-sex-ed-active")) {
      stopSexEdEpisode({ restoreProgramme: false });
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

  function extendedSessionVisitorId() {
    try {
      const existing = window.localStorage.getItem(EXTENDED_SESSION_VISITOR_ID_KEY);
      if (existing) return existing;
      const created = window.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(EXTENDED_SESSION_VISITOR_ID_KEY, created);
      return created;
    } catch {
      return "anonymous";
    }
  }

  function assignedNoCheckinContinuationFormat() {
    let index = 0;
    try {
      const storedIndex = Number(window.localStorage.getItem(NO_CHECKIN_CONTINUATION_INDEX_KEY));
      if (Number.isFinite(storedIndex) && storedIndex >= 0) index = Math.floor(storedIndex);
      window.localStorage.setItem(NO_CHECKIN_CONTINUATION_INDEX_KEY, String(index + 1));
    } catch {
      index = musicContinuationSequence;
    }
    const draw = stableUnit(`extended-session-format-v1:${extendedSessionVisitorId()}:${index}`);
    if (draw < .8) return "parties";
    if (draw < .9) return "radio";
    return "videos";
  }

  function noCheckinContinuationSession() {
    const selectedRoom = String(track.musicRoom || "modul8-infinity").toLowerCase();
    const assignedFormat = assignedNoCheckinContinuationFormat();
    return {
      music_room: selectedRoom,
      format: selectedRoom === "safety-cushion" ? "videos" : assignedFormat,
      source_id: "",
      catalogue_ready: true,
    };
  }

  function continuationChannelForFormat(format, selectedRoom, sourceId = "") {
    const formatPool = musicShelfOrders[format] || [];
    const recommendedId = musicShelfRecommendationIds[format];
    return formatPool.find((item) => sourceId && (
      item.id === sourceId || item.broadcastChannelId === sourceId
    )) || formatPool.find((item) => item.editorialId === selectedRoom && !item.unavailable) ||
      formatPool.find((item) => item.id === recommendedId && !item.unavailable) ||
      formatPool.find((item) => !item.unavailable) || null;
  }

  async function continueAdaptiveMusicProgramme() {
    if (broadcastChannelId) {
      await synchronizeBroadcastPlayback(true);
      return;
    }
    const storedSelection = readStoredSelection() || {};
    let extendedSession = storedSelection.extended_session ||
      storedSelection.adaptive_music_intelligence?.extended_streaming_session || {};
    let selectedFormat = ["parties", "radio", "videos"].includes(extendedSession.format)
      ? extendedSession.format
      : "";
    let selectedRoom = String(extendedSession.music_room || "").toLowerCase();
    let eligible = extendedSession.catalogue_ready === true && selectedFormat && selectedRoom;
    let selectionSource = "stored_checkin";
    const noCheckinJourney = ["no_checkin_random", "explicit_url"].includes(resolvedSelectionSource);
    if (noCheckinJourney && (!eligible || (selectedRoom === "safety-cushion" && selectedFormat !== "videos"))) {
      extendedSession = noCheckinContinuationSession();
      selectedFormat = extendedSession.format;
      selectedRoom = extendedSession.music_room;
      eligible = true;
      selectionSource = "no_checkin_80_10_10";
    }
    document.body.dataset.musicContinuationDecision = eligible ? selectedFormat : "unavailable";
    document.body.dataset.musicContinuationReason = "personal_opening_complete";
    document.body.dataset.musicContinuationSource = selectionSource;
    document.body.dataset.musicContinuationRoom = selectedRoom;
    musicContinuationSequence += 1;

    if (!eligible || (selectedRoom === "safety-cushion" && selectedFormat !== "videos")) {
      showMusicShelfStatus("No approved ready extended livestream is available for this session.", 3600);
      return;
    }

    const sourceId = String(extendedSession.source_id || "");
    const fallbackFormats = selectedRoom === "safety-cushion"
      ? ["videos"]
      : [selectedFormat, ...["parties", "radio", "videos"].filter((format) => format !== selectedFormat)];
    const formats = selectionSource === "stored_checkin" ? [selectedFormat] : fallbackFormats;
    for (const format of formats) {
      const sharedChannel = continuationChannelForFormat(format, selectedRoom, format === selectedFormat ? sourceId : "");
      if (!sharedChannel) continue;
      const opened = await openBroadcastEntry(sharedChannel, { source: "automatic_continuation" });
      if (!opened) continue;
      document.body.dataset.musicContinuationDecision = format;
      document.body.dataset.musicContinuationChannel = sharedChannel.broadcastChannelId;
      document.body.dataset.musicContinuationFallback = String(format !== selectedFormat);
      return;
    }
    document.body.dataset.musicContinuationDecision = "unavailable";
    delete document.body.dataset.musicContinuationChannel;
    showMusicShelfStatus(`The needs-matched ${selectedFormat} livestream is temporarily unavailable.`, 3600);
    if (selectionSource !== "stored_checkin") setMusicMode(selectedFormat, { manual: false, openShelf: true });
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
        broadcast: {
          mode: broadcastChannelId ? "shared" : "personal",
          channelId: broadcastChannelId,
          entryOpen: broadcastEntryOpen,
          pendingChannelId: pendingBroadcastChannelId,
          trackId: document.body.dataset.broadcastTrackId || "",
          stationId: document.body.dataset.broadcastStationId || "",
          targetSeconds: Number(document.body.dataset.broadcastTargetSeconds || 0),
          driftSeconds: Number(document.body.dataset.broadcastDriftSeconds || 0),
          correction: document.body.dataset.broadcastCorrection || "",
        },
        fashionBroadcast: {
          mode: fashionBroadcastChannelId ? "shared" : "personal",
          channelId: fashionBroadcastChannelId,
          runwayId: document.body.dataset.fashionBroadcastRunwayId || "",
          pairingSource: fashionBroadcastPairingSource,
          targetSeconds: Number(document.body.dataset.fashionBroadcastTargetSeconds || 0),
          driftSeconds: Number(document.body.dataset.fashionBroadcastDriftSeconds || 0),
          correction: document.body.dataset.fashionBroadcastCorrection || "",
        },
        radioVisualBroadcast: {
          mode: radioVisualBroadcastChannelId ? "shared" : "stopped",
          channelId: radioVisualBroadcastChannelId,
          runwayId: document.body.dataset.radioVisualBroadcastRunwayId || "",
          targetSeconds: Number(document.body.dataset.radioVisualBroadcastTargetSeconds || 0),
          driftSeconds: Number(document.body.dataset.radioVisualBroadcastDriftSeconds || 0),
          correction: document.body.dataset.radioVisualBroadcastCorrection || "",
        },
        radioPlayback: {
          state: document.body.dataset.radioPlaybackState || "stopped",
          transport: document.body.dataset.radioStreamTransport || "",
          bufferSeconds: Number(document.body.dataset.radioBufferSeconds || 0),
          initialBufferSeconds: Number(document.body.dataset.radioInitialBufferSeconds || 0),
          waitingCount: Number(document.body.dataset.radioWaitingCount || 0),
          stalledCount: Number(document.body.dataset.radioStalledCount || 0),
          recoveryCount: Number(document.body.dataset.radioRecoveryCount || 0),
          lastHlsError: document.body.dataset.radioLastHlsError || "",
        },
      };
    },
    setMode(mode) {
      setMusicMode(mode, { manual: true });
      return this.getState();
    },
    programmeItems(mode = musicChannelMode) {
      if (!MUSIC_BROADCAST_FORMATS.includes(mode)) return [];
      const liveItems = musicItems(mode)
        .slice()
        .sort((a, b) => broadcastEditorialPosition(a) - broadcastEditorialPosition(b));
      return liveItems.map((item) => {
        const display = musicItemDisplayMetadata(item);
        return {
          id: item.id,
          mode,
          broadcastChannelId: item.broadcastChannelId,
          broadcastChannelName: item.broadcastChannelName,
          broadcastDescriptor: item.broadcastDescriptor,
          broadcastDescription: item.broadcastDescription,
          editorialId: item.editorialId,
          artist: mode === "radio" ? (item.provider || item.artist) : display.artist,
          title: mode === "radio" ? (item.display_title || item.title) : display.title,
          unavailable: item.unavailable === true,
          previewVideoSrc: item.previewVideoSrc || item.localVideoSrc || "",
          previewStart: Number(item.previewStart || 8),
          thumbnailUrl: mode === "radio" ? "" : musicThumbnailUrl(item),
          radioLogoSrc: mode === "radio" ? String(item.logo_src || "") : "",
          radioLogoAlt: mode === "radio" ? String(item.logo_alt || item.provider || "") : "",
          radioBrandLogoSrc: mode === "radio" ? String(item.brand_logo_src || "") : "",
          cardPalette: mode === "radio" && Array.isArray(item.card_palette) ? item.card_palette.slice(0, 2) : [],
          audioOnly: item.audioOnly === true,
        };
      });
    },
    openChannels(mode = musicChannelMode) {
      if (MUSIC_BROADCAST_FORMATS.includes(mode)) setMusicMode(mode, { manual: true });
      openMusicShelf();
      return this.getState();
    },
    select(itemId) {
      const item = (musicShelfOrders[musicChannelMode] || []).find((candidate) => candidate.id === itemId);
      return selectMusicItem(item, { source: "runtime_api" });
    },
    openBroadcast(channelId) {
      const item = Object.values(musicShelfOrders)
        .flat()
        .find((candidate) => candidate.broadcastChannelId === channelId);
      return openBroadcastEntry(item, { source: "runtime_api" });
    },
    joinBroadcast(channelId) {
      if (document.body.classList.contains("television-sex-ed-active")) {
        stopSexEdEpisode({ restoreProgramme: false });
      }
      return joinBroadcastChannel(channelId, { source: "runtime_api" });
    },
    synchronizeBroadcast(forceSeek = true) {
      return synchronizeBroadcastPlayback(forceSeek);
    },
    synchronizeFashionBroadcast(forceSeek = true) {
      return synchronizeFashionBroadcastPlayback(forceSeek);
    },
    synchronizeRadioVisualBroadcast(forceSeek = true) {
      return synchronizeRadioVisualBroadcastPlayback(forceSeek);
    },
    continueProgramme: continueAdaptiveMusicProgramme,
    rank: rankMusicShelves,
  };

  function applyVideoBlend(value) {
    const musicAmount = Math.max(0, Math.min(100, Number(value) || 0));
    const fashionOpacity = 1 - (musicAmount / 100);
    const radioIsActiveProgramme = document.body.classList.contains("television-radio-continuation") ||
      Boolean(radioVisualBroadcastChannelId && radioVisualVideo);
    window.IAMStreamController?.setPriority?.(localVideo, radioIsActiveProgramme ? "optional" : "primary");
    window.IAMStreamController?.setPriority?.(fashionVideo, musicAmount < 99.5 ? "primary" : "optional");
    if (radioVisualVideo) {
      window.IAMStreamController?.setPriority?.(
        radioVisualVideo,
        radioIsActiveProgramme && musicAmount >= .5 ? "primary" : "optional"
      );
    }
    playerMount.style.setProperty("--fashion-video-opacity", fashionOpacity.toFixed(3));
    playerMount.dataset.videoBlend = musicAmount <= 0
      ? "fashion"
      : musicAmount >= 100
        ? radioIsActiveProgramme ? "radio-visual" : "music"
        : "mixed";
    document.body.dataset.radioVisualMixState = radioIsActiveProgramme
      ? musicAmount <= 0 ? "fashion" : musicAmount >= 100 ? "radio-visual" : "mixed"
      : "inactive";
    if (videoCrossfader) videoCrossfader.value = String(musicAmount);
    if (emdrGifCrossfader) emdrGifCrossfader.value = String(musicAmount);
    if (document.body.classList.contains("television-emdr-gif-active")) {
      playerMount.dataset.emdrGifMusicAmount = musicAmount.toFixed(0);
      drawFashionHeroFrame();
    }
    updateNowPlaying();
  }

  async function revealFashionWhenReady(video, generation, options = {}) {
    if (!video) return;
    window.IAMStreamController?.setPriority?.(video, "primary");
    await ensureFashionStreamAttached(video);
    const readiness = await window.IAMStreamController?.prepareFashionReveal(video, {
      minimumSeconds: Number.isFinite(Number(options.minimumSeconds))
        ? Math.max(4, Number(options.minimumSeconds))
        : FASHION_REVEAL_BUFFER_SECONDS,
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
    const emdrGifActive = document.body.classList.contains("television-emdr-gif-active");
    if (emdrGifActive) emdrGifVideoBlend = musicAmount;

    if (musicAmount >= 100) {
      window.clearTimeout(fashionDwellTimer);
      fashionRevealGeneration += 1;
      applyVideoBlend(100);
      if (document.body.classList.contains("television-radio-continuation") && radioVisualVideo) {
        radioVisualVideo.classList.add("is-radio-visual-active");
        playWhenStreamAttached(radioVisualVideo, "fashion").catch(() => {});
      }
      if (emdrGifActive && fashionVideo) {
        window.IAMStreamController?.setPriority?.(fashionVideo, "optional");
        playWhenStreamAttached(fashionVideo, "fashion").catch(() => {});
        return;
      }
      if (fashionVideo) {
        window.IAMStreamController?.setFashionActive(fashionVideo, false, "music_selected");
        window.IAMStreamController?.release?.(fashionVideo, "music_selected");
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
      setVideoBlend(emdrGifVideoBlend);
      playerMount.dataset.emdrGifVideoLayers = "active";
      playerMount.dataset.emdrGifMusicAmount = emdrGifVideoBlend.toFixed(0);
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
    delete playerMount.dataset.emdrGifMusicAmount;
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

  function restoreReactionWalletView() {
    const nextView = WALLET_RESUMABLE_VIEWS.has(walletResumeView) ? walletResumeView : "categories";
    walletControlsInteractiveAt = nextView === "categories" ? 0 : Date.now() + 450;
    audioWalletMode = nextView === "audio";
    setWalletView(nextView, { remember: false });
    syncAudioWallet();
    if (nextView === "music") updateMusicSelector();
  }

  function setReactionWalletOpen(isOpen) {
    if (!reactionWallet) return;
    if (!isOpen) {
      setWalletView("closed", { remember: false });
      return;
    }
    if (audioWalletMode && walletView === "audio") return;
    restoreReactionWalletView();
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

  window.addEventListener("iam:care-open", closeReactionWalletSoftly);
  window.addEventListener("iam:adaptive-sound-panel-opened", () => {
    setReactionWalletOpen(false);
  });

  function scheduleReactionWalletCollapse(delay = 1800) {
    window.clearTimeout(reactionWalletCollapseTimer);
    reactionWalletCollapseTimer = window.setTimeout(() => {
      closeReactionWalletSoftly();
    }, delay);
  }

  function releaseBloomWalletCloseGuard() {
    if (!bloomWalletCloseGuard) return;
    bloomWalletCloseGuard = false;
    window.clearTimeout(reactionWalletPointerLockTimer);
    reactionWalletPointerLockTimer = 0;
    reactionWalletPointerReadyAt = Date.now();
    reactionWalletPointerAnchorX = null;
    reactionWalletPointerAnchorY = null;
    document.body.classList.remove("television-wallet-pointer-locked");
  }

  function releaseBloomWalletCloseGuardFromPointerMove(event) {
    if (!bloomWalletCloseGuard || (event.pointerType && event.pointerType !== "mouse")) return;
    const pointerX = Number(event.clientX);
    const pointerY = Number(event.clientY);
    if (
      !Number.isFinite(pointerX) ||
      !Number.isFinite(pointerY) ||
      reactionWallet?.contains(event.target) ||
      reactionWalletPointerAnchorX === null ||
      reactionWalletPointerAnchorY === null
    ) return;
    const physicalDistance = Math.hypot(
      pointerX - reactionWalletPointerAnchorX,
      pointerY - reactionWalletPointerAnchorY
    );
    if (physicalDistance < REACTION_WALLET_POINTER_MOVE_PX) return;
    releaseBloomWalletCloseGuard();
  }

  function closeReactionWalletAfterBloom(button, event) {
    if (!reactionWallet || walletView !== "emoji") return;
    window.clearTimeout(reactionWalletCollapseTimer);
    reactionWalletCollapseTimer = 0;
    bloomWalletCloseGuard = true;
    armReactionWalletPointerLock(event);
    button?.blur?.();
    closeReactionWalletSoftly();
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
    releaseBloomWalletCloseGuard();
    setReactionWalletOpen(true);
  }

  function beginReactionWalletOpenGesture() {
    if (!document.body.classList.contains("television-room-open") || audioWalletMode) return;
    // Keep a resumed secondary panel closed until the click completes, so its
    // newly revealed control cannot inherit the flower's pointer-up gesture.
    if (walletResumeView === "categories") setReactionWalletOpen(true);
    nowPlayingInteractiveAt = Date.now() + 1400;
  }

  function blockRestoredWalletClickThrough(event) {
    if (Date.now() >= walletControlsInteractiveAt) return;
    if (event.target.closest?.("[data-reaction-wallet-trigger], [data-wallet-home]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
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
      const circleName = audioWalletCircleName || "selected";
      audioWalletJoin.textContent = audioWalletJoined ? audioWalletCircleName : "Join Circle";
      audioWalletJoin.setAttribute("aria-label", audioWalletJoined ? `Leave ${circleName} Circle` : "Join Circle");
      audioWalletJoin.setAttribute("title", audioWalletJoined ? `Leave ${circleName} Circle` : "Join Circle");
      audioWalletJoin.dataset.circleTooltip = audioWalletJoined
        ? `Leave ${circleName} Circle.`
        : "Join a live audio Circle of up to nine people. Listen, speak, or simply chill with the vibe.";
    }

    if (audioWalletMic) {
      const microphoneAction = audioWalletJoined && !audioWalletMuted ? "Mute Microphone" : "Activate Microphone";
      audioWalletMic.disabled = false;
      audioWalletMic.dataset.audioTooltip = microphoneAction;
      audioWalletMic.setAttribute("aria-label", microphoneAction);
    }

    if (audioWalletLeave) {
      const circleName = audioWalletCircleName || "selected";
      audioWalletLeave.hidden = !audioWalletJoined;
      audioWalletLeave.disabled = !audioWalletJoined;
      audioWalletLeave.setAttribute("aria-label", `Close ${circleName} audio room`);
    }

    if (audioWalletCount) {
      const occupancyWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
      const occupancy = Math.max(0, Math.min(9, Math.round(Number(audioWalletOccupancy) || 0)));
      const circleName = audioWalletCircleName || "selected";
      const occupancyLabel = `${occupancyWords[occupancy]} of nine people checked into ${circleName} Circle.`;
      audioWalletCount.textContent = `${occupancy} / 9`;
      audioWalletCount.dataset.circleTooltip = occupancyLabel;
      audioWalletCount.setAttribute("aria-label", occupancyLabel);
      audioWalletCount.setAttribute("tabindex", audioWalletJoined ? "0" : "-1");
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

  function returnToWalletHome(event) {
    event?.preventDefault();
    event?.stopPropagation();
    window.clearTimeout(reactionWalletCollapseTimer);
    reactionWalletCollapseTimer = 0;
    audioWalletMode = false;
    window.IAMCircleRooms?.close?.();
    window.clearTimeout(circleTooltipArmTimer);
    reactionWallet?.classList.remove("is-circle-tooltip-armed");
    setWalletView("categories");
    event?.currentTarget?.blur?.();
    syncAudioWallet();
  }

  function toggleAudioWalletJoin(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (audioWalletJoined) {
      window.IAMCircleRooms?.leave?.();
      return;
    }
    window.IAMCircleRooms?.open?.(audioWalletJoin);
  }

  function toggleAudioWalletMute(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!audioWalletJoined) return;
    window.IAMCircleRooms?.toggleMute?.();
  }

  function leaveAudioWalletCircle(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!audioWalletJoined) return;
    window.IAMCircleRooms?.leave?.();
  }

  function closeAudioWalletFromOutside(event) {
    if (!audioWalletMode) return;
    if (reactionWallet?.contains(event.target)) return;
    if (circleRoomSelector?.contains(event.target)) return;
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

  function beginWalletOnboarding() {
    if (!walletOnboarding || walletOnboardingEngaged) return;
    const hasMultilingualWelcome = Boolean(walletOnboardingWelcome);
    window.clearTimeout(walletOnboardingWelcomeExitTimer);
    window.clearTimeout(walletOnboardingLineOneTimer);
    window.clearTimeout(walletOnboardingLineTwoTimer);
    window.clearTimeout(walletOnboardingDismissTimer);
    walletOnboarding.classList.remove("is-welcome-visible", "is-welcome-exiting", "is-line-one-visible", "is-line-two-visible", "is-dismissed");
    walletOnboarding.setAttribute("aria-hidden", "false");
    walletOnboardingWelcome?.setAttribute("aria-hidden", "false");
    walletOnboardingLineOne?.setAttribute("aria-hidden", "true");
    walletOnboardingLineTwo?.setAttribute("aria-hidden", "true");
    if (hasMultilingualWelcome) {
      walletOnboarding.classList.add("is-welcome-visible");
      walletOnboardingWelcomeExitTimer = window.setTimeout(() => {
        if (walletOnboardingEngaged) return;
        walletOnboarding.classList.remove("is-welcome-visible");
        walletOnboarding.classList.add("is-welcome-exiting");
        walletOnboardingWelcome.setAttribute("aria-hidden", "true");
      }, 3200);
    }
    walletOnboardingLineOneTimer = window.setTimeout(() => {
      if (walletOnboardingEngaged) return;
      walletOnboarding.classList.remove("is-welcome-exiting");
      walletOnboarding.classList.add("is-line-one-visible");
      walletOnboardingLineOne?.setAttribute("aria-hidden", "false");
    }, hasMultilingualWelcome ? 4500 : 2500);
    walletOnboardingLineTwoTimer = window.setTimeout(() => {
      if (walletOnboardingEngaged) return;
      walletOnboarding.classList.add("is-line-two-visible");
      walletOnboardingLineTwo?.setAttribute("aria-hidden", "false");
    }, hasMultilingualWelcome ? 6500 : 4500);
    walletOnboardingDismissTimer = window.setTimeout(completeWalletOnboarding, hasMultilingualWelcome ? 16500 : 14500);
  }

  function completeWalletOnboarding() {
    if (walletOnboardingEngaged) return;
    walletOnboardingEngaged = true;
    window.clearTimeout(walletOnboardingWelcomeExitTimer);
    window.clearTimeout(walletOnboardingLineOneTimer);
    window.clearTimeout(walletOnboardingLineTwoTimer);
    window.clearTimeout(walletOnboardingDismissTimer);
    walletOnboarding?.classList.remove("is-welcome-visible", "is-welcome-exiting", "is-line-one-visible", "is-line-two-visible");
    walletOnboarding?.classList.add("is-dismissed");
    walletOnboardingWelcome?.setAttribute("aria-hidden", "true");
    walletOnboardingLineOne?.setAttribute("aria-hidden", "true");
    walletOnboardingLineTwo?.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      walletOnboarding?.setAttribute("aria-hidden", "true");
    }, 950);
  }

  async function startFlowerSpin(options = {}) {
    const flower = document.querySelector(".brand-mark");
    const brand = document.querySelector(".brand");
    const restart = options.restart === true;
    if (restart && flowerCanvasFrame) {
      window.cancelAnimationFrame(flowerCanvasFrame);
      flowerCanvasFrame = 0;
    }
    if (!flower || !brand || flowerCanvasFrame || flowerCanvasStarting) return;
    flowerCanvasStarting = true;

    try {
      if (flower.decode) {
        await flower.decode();
      } else if (!flower.complete) {
        await new Promise((resolve, reject) => {
          flower.addEventListener("load", resolve, { once: true });
          flower.addEventListener("error", reject, { once: true });
        });
      }
    } catch {
      flowerCanvasStarting = false;
      return;
    }
    flower.dataset.logoReady = "true";

    let canvas = brand.querySelector("canvas.television-flower-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "television-flower-canvas";
      canvas.setAttribute("aria-hidden", "true");
      brand.insertBefore(canvas, flower.nextSibling);
    }
    const context = canvas.getContext("2d");
    if (!context) {
      flowerCanvasStarting = false;
      return;
    }

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
      const angle = ((now % HOMEPAGE_NAV_FLOWER_ROTATION_MS) / HOMEPAGE_NAV_FLOWER_ROTATION_MS) * Math.PI * 2;

      context.clearRect(0, 0, size, size);
      context.save();
      context.translate(center, center);
      context.rotate(angle);
      context.drawImage(flower, -center, -center, size, size);
      context.restore();
      flowerCanvasFrame = window.requestAnimationFrame(draw);
    }

    flowerCanvasStarting = false;
    flowerCanvasFrame = window.requestAnimationFrame(draw);
  }

  function primeLocalVideo() {
    mountPlayer();
  }

  function animateVoiceAssistantProgramVolume(media, targetVolume, duration = 0) {
    if (!media) return;
    const existingFrame = voiceAssistantVolumeFrames.get(media);
    if (existingFrame) window.cancelAnimationFrame(existingFrame);

    const target = Math.max(0, Math.min(1, Number(targetVolume) || 0));
    if (!duration) {
      media.volume = target;
      voiceAssistantVolumeFrames.delete(media);
      return;
    }

    const startVolume = Number(media.volume) || 0;
    const startedAt = window.performance?.now?.() || Date.now();
    const frame = (now) => {
      const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      media.volume = Math.max(0, Math.min(1, startVolume + ((target - startVolume) * eased)));
      if (progress < 1) {
        voiceAssistantVolumeFrames.set(media, window.requestAnimationFrame(frame));
      } else {
        voiceAssistantVolumeFrames.delete(media);
      }
    };
    voiceAssistantVolumeFrames.set(media, window.requestAnimationFrame(frame));
  }

  function clearShopArrivalFade() {
    if (shopArrivalFadeTimer) window.clearInterval(shopArrivalFadeTimer);
    shopArrivalFadeTimer = 0;
  }

  function fadeShopArrivalProgrammeVolume(media, baseVolume, duration) {
    if (!media) return;
    clearShopArrivalFade();
    const baseline = Math.max(0, Math.min(1, Number(baseVolume) || 0));
    if (voiceAssistantDuckActive) voiceAssistantBaseVolumes.set(media, baseline);
    const target = baseline * (voiceAssistantDuckActive ? VOICE_ASSISTANT_PROGRAMME_MIX_LEVEL : 1);
    const startVolume = Number(media.volume) || 0;
    const startedAt = Date.now();
    const fadeDuration = Math.max(0, Number(duration) || 0);
    document.body.dataset.audioPartyFadeState = fadeDuration > 0 ? "running" : "complete";

    const applyFadeStep = () => {
      const progress = fadeDuration > 0
        ? Math.max(0, Math.min(1, (Date.now() - startedAt) / fadeDuration))
        : 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      media.volume = Math.max(0, Math.min(1, startVolume + ((target - startVolume) * eased)));
      document.body.dataset.audioPartyVolume = media.volume.toFixed(3);
      document.body.dataset.audioPartyMuted = String(media.muted);
      if (progress >= 1) {
        clearShopArrivalFade();
        document.body.dataset.audioPartyFadeState = "complete";
      }
    };

    applyFadeStep();
    if (fadeDuration > 0) shopArrivalFadeTimer = window.setInterval(applyFadeStep, 50);
  }

  function setVoiceAssistantProgramVolume(media, baseVolume, duration = 0) {
    if (!media) return;
    const baseline = Math.max(0, Math.min(1, Number(baseVolume) || 0));
    if (voiceAssistantDuckActive) voiceAssistantBaseVolumes.set(media, baseline);
    const duckFactor = voiceAssistantDuckActive ? VOICE_ASSISTANT_PROGRAMME_MIX_LEVEL : 1;
    const target = baseline * duckFactor;
    animateVoiceAssistantProgramVolume(media, target, duration);
  }

  function setVoiceAssistantDucking(active) {
    const nextActive = Boolean(active);
    voiceAssistantDuckActive = nextActive;
    const radioIsActiveProgramme = document.body.classList.contains("television-radio-continuation");
    const programmeMedia = [localVideo];
    if (radioIsActiveProgramme) programmeMedia.push(continuationAudio);
    if (sexEdEpisodeVideo && !sexEdEpisodeVideo.paused) programmeMedia.push(sexEdEpisodeVideo);

    if (nextActive) {
      programmeMedia.forEach((media) => {
        if (!media || media.muted) return;
        if (!voiceAssistantBaseVolumes.has(media)) {
          const fallback = media === continuationAudio ? .68 : 1;
          voiceAssistantBaseVolumes.set(media, Math.max(Number(media.volume) || 0, fallback));
        }
        animateVoiceAssistantProgramVolume(media, voiceAssistantBaseVolumes.get(media) * VOICE_ASSISTANT_PROGRAMME_MIX_LEVEL, 800);
      });
    } else {
      voiceAssistantBaseVolumes.forEach((baseline, media) => {
        animateVoiceAssistantProgramVolume(media, baseline, 1000);
      });
      voiceAssistantBaseVolumes.clear();
    }

    document.body.classList.toggle("television-voice-conversation-active", nextActive);
    document.body.dataset.voiceDuckedMedia = nextActive
      ? programmeMedia.filter(Boolean).map((media) => media === continuationAudio ? "radio" : "video").join(",")
      : "";
    document.body.dataset.voiceProgrammeDucked = String(nextActive);
    return voiceAssistantDuckActive;
  }

  function setProgrammeMixLevel(level) {
    const requested = level === null || level === undefined || level === ""
      ? Number.NaN
      : Number(level);
    programmeFixedMixLevel = Number.isFinite(requested)
      ? Math.max(0, Math.min(1, requested))
      : null;
    const target = programmeFixedMixLevel ?? .68;
    if (continuationAudio && !continuationAudio.muted) {
      setVoiceAssistantProgramVolume(continuationAudio, target, 420);
    }
    if (programmeFixedMixLevel === null) {
      delete document.body.dataset.programmeFixedMixLevel;
    } else {
      document.body.dataset.programmeFixedMixLevel = String(programmeFixedMixLevel);
    }
    return programmeFixedMixLevel;
  }

  function sexEdCardsPerView() {
    if (window.matchMedia("(max-width: 720px)").matches) return 1;
    if (window.matchMedia("(max-width: 1100px)").matches) return 2;
    return 4;
  }

  function updateSexEdShelfPosition({ preview = true } = {}) {
    if (!sexEdShelfTrack) return;
    const items = Array.from(sexEdShelfTrack.children);
    const cardsPerView = sexEdCardsPerView();
    const maximumOffset = Math.max(0, items.length - cardsPerView);
    sexEdShelfOffset = Math.max(0, Math.min(maximumOffset, sexEdShelfOffset));
    sexEdShelfTrack.style.setProperty(
      "transform",
      `translate3d(-${items[sexEdShelfOffset]?.offsetLeft || 0}px, 0, 0)`,
      "important"
    );
    const start = items.length ? sexEdShelfOffset + 1 : 0;
    const end = Math.min(items.length, sexEdShelfOffset + cardsPerView);
    if (sexEdShelfCounter) {
      sexEdShelfCounter.textContent = start === end ? `${start} / ${items.length}` : `${start}–${end} / ${items.length}`;
    }
    if (sexEdShelfProgress) {
      sexEdShelfProgress.style.width = `${items.length ? (end / items.length) * 100 : 0}%`;
    }
    sexEdShelfPrevious?.toggleAttribute("disabled", sexEdShelfOffset === 0);
    sexEdShelfNext?.toggleAttribute("disabled", sexEdShelfOffset >= maximumOffset);
    if (sexEdShelfOpen && preview) {
      window.setTimeout(() => startSexEdShelfPreview(items[sexEdShelfOffset]?.querySelector("[data-sex-ed-card]")), 160);
    }
  }

  function moveSexEdShelf(direction) {
    sexEdShelfOffset += direction * sexEdCardsPerView();
    stopSexEdShelfPreview();
    updateSexEdShelfPosition();
  }

  function stopSexEdShelfPreview() {
    if (!sexEdShelfPreviewVideo) return;
    try { sexEdShelfPreviewVideo.pause(); } catch {}
    window.IAMStreamController?.detach?.(sexEdShelfPreviewVideo);
    sexEdShelfPreviewVideo.remove();
    sexEdShelfPreviewCard?.classList.remove("is-previewing");
    sexEdShelfPreviewVideo = null;
    sexEdShelfPreviewCard = null;
  }

  async function startSexEdShelfPreview(card) {
    if (!sexEdShelfOpen || !card || card === sexEdShelfPreviewCard) return;
    stopSexEdShelfPreview();
    const media = card.querySelector(".adaptive-television-music-card__media");
    const fileName = card.dataset.sexEdFile || "";
    if (!media || !fileName || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const preview = document.createElement("video");
    const previewStart = Math.max(0, Number(card.dataset.sexEdStartTime || 0), 150);
    preview.className = "adaptive-television-fashion-card__preview";
    preview.muted = true;
    preview.defaultMuted = true;
    preview.volume = 0;
    preview.playsInline = true;
    preview.preload = "metadata";
    preview.setAttribute("muted", "");
    preview.setAttribute("aria-hidden", "true");
    preview.dataset.streamRole = "music-preview";
    preview.dataset.streamFile = fileName;
    sexEdShelfPreviewVideo = preview;
    sexEdShelfPreviewCard = card;
    card.classList.add("is-previewing");
    media.append(preview);
    const resetPreview = () => {
      try { preview.currentTime = Math.min(previewStart, Math.max(0, Number(preview.duration || previewStart) - .5)); } catch {}
    };
    preview.addEventListener("loadedmetadata", resetPreview, { once: true });
    preview.addEventListener("timeupdate", () => {
      if (preview.currentTime >= Math.min(Number(preview.duration || previewStart + 10), previewStart + 10) - .08) {
        resetPreview();
      }
    });
    try {
      await ensureSexEdStream(preview, "music");
      if (preview !== sexEdShelfPreviewVideo || !sexEdShelfOpen) return;
      resetPreview();
      await preview.play();
    } catch {
      if (preview === sexEdShelfPreviewVideo) stopSexEdShelfPreview();
    }
  }

  function openSexEdShelf() {
    if (!sexEdShelf || sexEdShelfOpen) return;
    if (fashionShelfOpen) closeFashionShelf(false);
    if (musicShelfOpen) closeMusicShelf(false);
    stopSexEdEpisode();
    sexEdShelfOpen = true;
    sexEdShelfOffset = 0;
    sexEdShelf.setAttribute("aria-hidden", "false");
    sexEdShelf.removeAttribute("inert");
    document.body.classList.add("sex-ed-shelf-open");
    sexEdLink?.setAttribute("aria-expanded", "true");
    prewarmSexEdAudioProgramme();
    window.setTimeout(() => {
      updateSexEdShelfPosition();
      sexEdCards[0]?.focus({ preventScroll: true });
    }, 90);
  }

  async function prewarmSexEdAudioProgramme() {
    try {
      await window.IAMStreamReady;
      await window.IAMBroadcastClock?.ready;
      const state = window.IAMBroadcastClock?.stateAt?.(SEX_ED_BROADCAST_CHANNEL_ID);
      const scheduledTrack = state?.mediaType === "audio" ? findTrack(state.trackId) : null;
      const streamAsset = scheduledTrack ? window.IAMCloudflareStream?.assetFor(scheduledTrack.localVideoSrc) : null;
      const source = scheduledTrack?.hlsVideoSrc || streamAsset?.hls || "";
      if (!source) return;
      loadRadioHlsLibrary().catch(() => {});
      loadRecordedProgrammeAudioRendition(source).catch(() => {});
    } catch {}
  }

  function closeSexEdShelf(restoreFocus = true) {
    if (!sexEdShelf || !sexEdShelfOpen) return;
    sexEdShelfOpen = false;
    sexEdShelf.setAttribute("aria-hidden", "true");
    sexEdShelf.setAttribute("inert", "");
    document.body.classList.remove("sex-ed-shelf-open");
    sexEdLink?.setAttribute("aria-expanded", "false");
    stopSexEdShelfPreview();
    if (restoreFocus) sexEdLink?.focus({ preventScroll: true });
  }

  async function ensureSexEdStream(video, role) {
    if (!video) return false;
    const fileName = video.dataset.streamFile || "";
    if (!fileName) return false;
    try {
      window.IAMStreamController?.setPriority?.(video, "primary");
      await window.IAMStreamController?.attach?.(video, {
        fileName,
        role,
        autoplay: false,
        preload: true,
        preloadTargetSeconds: role === "fashion" ? 8 : 12,
      });
      return true;
    } catch (error) {
      video.dataset.sexEdStreamError = String(error?.message || error).slice(0, 140);
      return false;
    }
  }

  function loadSexEdLoopImage(image) {
    if (!image) return Promise.resolve(false);
    if (image.complete && image.naturalWidth > 0) return Promise.resolve(true);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ready) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
        resolve(ready);
      };
      const onLoad = () => finish(image.naturalWidth > 0);
      const onError = () => finish(false);
      const timeout = window.setTimeout(() => finish(image.complete && image.naturalWidth > 0), 12000);
      image.addEventListener("load", onLoad, { once: true });
      image.addEventListener("error", onError, { once: true });
      if (!image.getAttribute("src") && image.dataset.src) image.src = image.dataset.src;
    });
  }

  function waitForSexEdMediaPlayback(media, timeoutMs = 18000) {
    if (!media) return Promise.resolve(false);
    if (!media.paused && media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve(true);
    const startedAt = Date.now();
    return new Promise((resolve) => {
      const inspect = () => {
        if (!media.paused && media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          resolve(true);
          return;
        }
        if (media.error || Date.now() - startedAt >= timeoutMs) {
          resolve(false);
          return;
        }
        window.setTimeout(inspect, 120);
      };
      inspect();
    });
  }

  async function playSexEdLoopVideo(video) {
    if (!video) return false;
    try {
      const source = video.dataset.src || "";
      if (source && !video.getAttribute("src")) {
        video.src = source;
        video.preload = "auto";
        video.load();
      }
      video.muted = true;
      video.loop = true;
      await video.play();
      return waitForSexEdMediaPlayback(video);
    } catch {
      return false;
    }
  }

  async function activateSexEdLoopVideos() {
    const readiness = await Promise.all([
      ...sexEdLoopImages.map((image) => loadSexEdLoopImage(image)),
      ...sexEdLoopVideos.map((video) => playSexEdLoopVideo(video)),
    ]);
    return readiness.every(Boolean);
  }

  async function playSexEdBackgroundVideo() {
    if (!sexEdBackground) return false;
    const attached = await ensureSexEdStream(sexEdBackground, "fashion");
    if (!attached) return false;
    sexEdBackground.muted = true;
    sexEdBackground.loop = true;
    try {
      await (window.IAMStreamController?.play?.(sexEdBackground) || sexEdBackground.play());
      return waitForSexEdMediaPlayback(sexEdBackground);
    } catch {
      return false;
    }
  }

  function waitForSexEdAudioState(stateKey, timeoutMs = AUDIO_PARTY_START_TIMEOUT_MS) {
    const startedAt = Date.now();
    return new Promise((resolve) => {
      const inspect = () => {
        if (!document.body.classList.contains("television-sex-ed-active")) {
          resolve(false);
          return;
        }
        const state = document.body.dataset[stateKey] || "";
        if (state === "playing") {
          resolve(true);
          return;
        }
        if (["error", "unavailable", "encoding"].includes(state) || Date.now() - startedAt >= timeoutMs) {
          resolve(false);
          return;
        }
        window.setTimeout(inspect, 120);
      };
      inspect();
    });
  }

  function releaseSexEdLoopVideos() {
    sexEdLoopImages.forEach((image) => image.removeAttribute("src"));
    sexEdLoopVideos.forEach((video) => {
      try {
        video.pause();
        video.removeAttribute("src");
        video.preload = "none";
        video.load();
      } catch {}
    });
  }

  function configureSexEdEpisode(episode = "01") {
    const card = sexEdCards.find((candidate) => candidate.dataset.sexEdEpisode === String(episode).padStart(2, "0")) || sexEdCards[0];
    if (!card || !sexEdEpisodeVideo) return;
    const fileName = card.dataset.sexEdFile || "";
    if (sexEdEpisodeVideo.dataset.streamFile !== fileName) {
      window.IAMStreamController?.release?.(sexEdEpisodeVideo, "sex_ed_episode_changed");
      sexEdEpisodeVideo.dataset.streamFile = fileName;
    }
    const backgroundFileName = card.dataset.sexEdBackgroundFile || SEX_ED_DEFAULT_BACKGROUND_FILE;
    if (sexEdBackground && sexEdBackground.dataset.streamFile !== backgroundFileName) {
      window.IAMStreamController?.release?.(sexEdBackground, "sex_ed_background_changed");
      sexEdBackground.dataset.streamFile = backgroundFileName;
    }
    const image = card.querySelector("img");
    const poster = image?.src || sexEdEpisodeVideo.dataset.poster || "";
    if (poster) sexEdEpisodeVideo.poster = poster.replace("height=360", "height=1080");
    const title = card.querySelector("strong")?.textContent?.trim() || "Sex-ed";
    const guest = card.querySelector(".adaptive-television-fashion-card__copy span")?.textContent?.trim() || "";
    const presentation = card.dataset.sexEdPresentation || "editorial";
    const radioStation = card.dataset.sexEdRadioStation || "";
    sexEdActiveEpisode = card.dataset.sexEdEpisode || "01";
    sexEdStartTime = Math.max(0, Number(card.dataset.sexEdStartTime || 0));
    sexEdNeedsInitialSeek = true;
    document.body.dataset.sexEdEpisode = sexEdActiveEpisode;
    document.body.dataset.sexEdEpisodeStart = String(sexEdStartTime);
    document.body.dataset.sexEdEpisodeTitle = title;
    document.body.dataset.sexEdEpisodeGuest = guest;
    document.body.dataset.sexEdPresentation = presentation;
    if (radioStation) document.body.dataset.sexEdRadioStation = radioStation;
    else delete document.body.dataset.sexEdRadioStation;
    sexEdEpisodeVideo.setAttribute("aria-label", guest ? `${title} — ${guest}` : title);
    if (timecode) timecode.textContent = formatTime(sexEdStartTime);
    document.title = `${title} | Sex-ed`;
  }

  async function seekSexEdEpisodeStart() {
    if (!sexEdEpisodeVideo || !sexEdNeedsInitialSeek) return;
    if (sexEdEpisodeVideo.readyState < 1) {
      await new Promise((resolve) => {
        const timeout = window.setTimeout(resolve, 4500);
        sexEdEpisodeVideo.addEventListener("loadedmetadata", () => {
          window.clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }
    try {
      sexEdEpisodeVideo.currentTime = sexEdStartTime;
      sexEdEpisodeVideo.dataset.sexEdStartApplied = String(sexEdStartTime);
      sexEdNeedsInitialSeek = false;
    } catch {
      sexEdEpisodeVideo.addEventListener("loadedmetadata", () => {
        try {
          sexEdEpisodeVideo.currentTime = sexEdStartTime;
          sexEdEpisodeVideo.dataset.sexEdStartApplied = String(sexEdStartTime);
          sexEdNeedsInitialSeek = false;
        } catch {}
      }, { once: true });
    }
  }

  async function playSexEdEpisode() {
    if (!sexEdEpisodeVideo) return false;
    setVoiceAssistantProgramVolume(sexEdEpisodeVideo, 1, voiceAssistantDuckActive ? 260 : 0);
    await ensureSexEdStream(sexEdEpisodeVideo, "music");
    await seekSexEdEpisodeStart();
    sexEdEpisodeVideo.muted = false;
    sexEdEpisodeVideo.controls = false;
    sexEdEpisodeVideo.dataset.streamPlayRequestedAt = String(window.performance?.now?.() || Date.now());
    try {
      await (window.IAMStreamController?.play?.(sexEdEpisodeVideo) || sexEdEpisodeVideo.play());
      if (sexEdEpisodeStart) sexEdEpisodeStart.hidden = true;
      return waitForSexEdMediaPlayback(sexEdEpisodeVideo);
    } catch {
      if (sexEdEpisodeStart) sexEdEpisodeStart.hidden = true;
      return false;
    }
  }

  function stopSexEdEpisode(options = {}) {
    const restoreProgramme = options.restoreProgramme !== false;
    const wasActive = document.body.classList.contains("television-sex-ed-active");
    sexEdOpenSequence += 1;
    document.body.classList.remove("television-sex-ed-active");
    sexEdWorld?.setAttribute("aria-hidden", "true");
    updateTimecode();
    window.IAMStreamController?.release?.(sexEdEpisodeVideo, "sex_ed_closed");
    window.IAMStreamController?.release?.(sexEdBackground, "sex_ed_closed");
    releaseSexEdLoopVideos();
    if (sexEdEpisodeStart) sexEdEpisodeStart.hidden = true;
    sexEdNeedsInitialSeek = true;
    delete document.body.dataset.sexEdEpisode;
    delete document.body.dataset.sexEdEpisodeStart;
    delete document.body.dataset.sexEdEpisodeTitle;
    delete document.body.dataset.sexEdEpisodeGuest;
    delete document.body.dataset.sexEdPresentation;
    delete document.body.dataset.sexEdRadioStation;
    delete document.body.dataset.sexEdLoadingState;
    delete document.body.dataset.sexEdLoadingForeground;
    delete document.body.dataset.sexEdLoadingBackground;
    delete document.body.dataset.sexEdLoadingTiles;
    delete document.body.dataset.sexEdLoadingAudio;
    delete document.body.dataset.sexEdLoadingElapsedMs;
    if (wasActive) {
      cancelChannelLoading("sex_ed_closed");
      setProgrammeMixLevel(null);
      updateNowPlaying();
      const returnProgramme = sexEdReturnProgramme;
      sexEdReturnProgramme = null;
      delete document.body.dataset.sexEdReturnChannel;
      delete document.body.dataset.sexEdReturnTrack;
      if (restoreProgramme && returnProgramme?.channelId && broadcastChannelId !== returnProgramme.channelId) {
        joinBroadcastChannel(returnProgramme.channelId, { source: "sex_ed_return" }).catch(() => {});
      } else if (restoreProgramme && !returnProgramme?.channelId && returnProgramme?.trackId) {
        const returnTrack = findTrack(returnProgramme.trackId);
        if (returnTrack) {
          switchMusicTrack(returnTrack, {
            source: "sex_ed_return",
            startAt: returnProgramme.currentTime,
          })
            .then(() => setVideoBlend(returnProgramme.videoBlend))
            .catch(() => {});
        }
      }
    }
  }

  async function openSexEdEpisode(episode = "01") {
    if (document.body.classList.contains("television-comedy-active")) {
      await window.IAMComedyChannel?.leaveForNavigation?.();
    }
    closeSexEdShelf(false);
    returnToTelevisionRoom({ preserveSexEd: true });
    cancelChannelLoading("sex_ed_transition");
    configureSexEdEpisode(episode);
    document.body.classList.add("television-sex-ed-active", "flower-cue-visible");
    const openSequence = ++sexEdOpenSequence;
    const loadingStartedAt = window.performance?.now?.() || Date.now();
    const loadingGeneration = beginChannelLoading({
      mode: "sex-ed",
      item: { id: `sex-ed-${sexEdActiveEpisode}` },
      channelName: "sex-ed",
      source: "sex_ed_episode",
      force: true,
    });
    document.body.dataset.sexEdLoadingState = "loading";
    document.body.dataset.sexEdLoadingForeground = "loading";
    document.body.dataset.sexEdLoadingAudio = "loading";
    updateNowPlaying();
    sexEdWorld?.setAttribute("aria-hidden", "false");
    if (!sexEdReturnProgramme) {
      sexEdReturnProgramme = {
        channelId: broadcastChannelId,
        trackId: track?.id || "",
        currentTime: Math.max(0, Number(localVideo?.currentTime || 0)),
        videoBlend: Math.max(0, Math.min(100, Number(videoCrossfader?.value || 100))),
      };
      if (sexEdReturnProgramme.channelId) {
        document.body.dataset.sexEdReturnChannel = sexEdReturnProgramme.channelId;
      } else if (sexEdReturnProgramme.trackId) {
        document.body.dataset.sexEdReturnTrack = sexEdReturnProgramme.trackId;
      }
    }
    setProgrammeMixLevel(SEX_ED_PROGRAMME_MIX_LEVEL);
    const radioStation = document.body.dataset.sexEdRadioStation || "";
    const recordReadiness = (name, promise) => Promise.resolve(promise)
      .then((ready) => {
        if (openSequence === sexEdOpenSequence) document.body.dataset[`sexEdLoading${name}`] = ready ? "ready" : "error";
        return Boolean(ready);
      })
      .catch(() => {
        if (openSequence === sexEdOpenSequence) document.body.dataset[`sexEdLoading${name}`] = "error";
        return false;
      });
    const readiness = [];
    if (radioStation) {
      readiness.push(recordReadiness("Foreground", playSexEdEpisode()));
      window.IAMStreamController?.release?.(sexEdBackground, "sex_ed_radio_presentation");
      releaseSexEdLoopVideos();
      delete document.body.dataset.sexEdLoadingBackground;
      delete document.body.dataset.sexEdLoadingTiles;
      readiness.push(recordReadiness("Audio", (async () => {
        await startRadioStation(radioStation, { source: "sex_ed_instruction" });
        const ready = await waitForSexEdAudioState("radioPlaybackState");
        if (ready) {
          if (
            document.body.classList.contains("television-sex-ed-active") &&
            document.body.dataset.sexEdRadioStation === radioStation
          ) {
            setProgrammeMixLevel(SEX_ED_PROGRAMME_MIX_LEVEL);
          }
        }
        return ready;
      })()));
    } else {
      document.body.dataset.sexEdLoadingBackground = "loading";
      document.body.dataset.sexEdLoadingTiles = "loading";
      const sexEdAudioAlreadyPlaying = broadcastChannelId === SEX_ED_BROADCAST_CHANNEL_ID &&
        document.body.dataset.audioPartyPlaybackState === "playing";
      const audioReady = recordReadiness("Audio", sexEdAudioAlreadyPlaying || joinBroadcastChannel(SEX_ED_BROADCAST_CHANNEL_ID, {
        source: "sex_ed_episode",
        channelLoadingGeneration: loadingGeneration,
        deferChannelLoadingFinish: true,
      }));
      readiness.push(audioReady);
      readiness.push(recordReadiness("Foreground", audioReady.then((ready) => ready ? playSexEdEpisode() : false)));
      readiness.push(recordReadiness("Background", audioReady.then((ready) => ready ? playSexEdBackgroundVideo() : false)));
      readiness.push(recordReadiness("Tiles", audioReady.then((ready) => ready ? activateSexEdLoopVideos() : false)));
    }
    const ready = (await Promise.all(readiness)).every(Boolean);
    if (
      openSequence !== sexEdOpenSequence ||
      !document.body.classList.contains("television-sex-ed-active") ||
      document.body.dataset.sexEdEpisode !== sexEdActiveEpisode
    ) return false;
    document.body.dataset.sexEdLoadingElapsedMs = String(Math.round((window.performance?.now?.() || Date.now()) - loadingStartedAt));
    document.body.dataset.sexEdLoadingState = ready ? "ready" : "error";
    if (ready) finishChannelLoading(loadingGeneration);
    else failChannelLoading(loadingGeneration);
    return ready;
  }

  function playLocalVideo(video) {
    televisionPlaybackRequested = true;
    video.dataset.streamPlayRequestedAt = String(window.performance?.now?.() || Date.now());
    video.preload = "auto";
    video.muted = soundResearchTestMode;
    setVoiceAssistantProgramVolume(video, soundResearchTestMode ? 0 : 1, voiceAssistantDuckActive ? 260 : 0);
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
    window.setTimeout(preloadRadioFashionRunways, 900);

    if (playAttempt?.catch) {
      playAttempt.catch(() => {
        playerMount.classList.add("is-local-video-awaiting-gesture");
      });
    }
  }

  function soundResearchActiveMedia() {
    const comedyVideo = document.querySelector("[data-comedy-video]");
    const comedyIsAudible = document.body.classList.contains("television-comedy-active")
      && comedyVideo
      && !comedyVideo.paused
      && !comedyVideo.muted
      && comedyVideo.volume > 0;
    const videoIsAudible = localVideo && !localVideo.paused && !localVideo.muted && localVideo.volume > 0;
    const radioIsAudible = continuationAudio && !continuationAudio.paused && !continuationAudio.muted && continuationAudio.volume > 0;
    if (comedyIsAudible) return { media: comedyVideo, source: "comedy" };
    return {
      media: videoIsAudible ? localVideo : (radioIsAudible ? continuationAudio : null),
      source: videoIsAudible ? "video" : (radioIsAudible ? "radio" : "none"),
    };
  }

  function soundResearchOutputMultiplier() {
    if (!document.body.classList.contains("television-comedy-active")) return 1;
    const configuredMultiplier = Number(document.body.dataset.comedySoundOutputMultiplier);
    return Number.isFinite(configuredMultiplier)
      ? clamp(configuredMultiplier, 0, 1)
      : SOUND_RESEARCH_COMEDY_OUTPUT_MULTIPLIER;
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
    const outputMultiplier = soundResearchOutputMultiplier();
    const { media: activeMedia } = soundResearchActiveMedia();
    soundResearchContinuityActive = soundResearchMediaInterrupted(activeMedia);
    if (soundResearchContinuityActive) {
      soundResearchMediaLevel = 0;
      return soundResearchMaxVolume * outputMultiplier;
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
      return soundResearchMaxVolume * Math.pow(normalizedLevel, SOUND_RESEARCH_MASKING_CURVE) * outputMultiplier;
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
      outputMultiplier: soundResearchOutputMultiplier(),
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
    const adaptivePanelAvailable = Boolean(document.querySelector("[data-adaptive-sound-panel]"));
    emdrSoundResearch?.setAttribute(
      "aria-label",
      adaptivePanelAvailable
        ? "Open Sound Research Layer controls"
        : (soundResearchEnabled ? "Turn Sound Research Layer off" : "Turn Sound Research Layer on")
    );
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
    ensurePlaying() {
      if (!soundResearchEnabled) return false;
      startSoundResearchLayer();
      return true;
    },
    setAuditionMode(enabled) {
      soundResearchAuditionMode = Boolean(enabled);
      if (soundResearchAuditionMode) startSoundResearchLayer();
      return soundResearchAuditionMode;
    },
    reloadSettings: loadSoundResearchSettings,
  };

  function startTelevisionContinuation() {
    if (!localVideo) return;
    const continuation = broadcastChannelId
      ? synchronizeBroadcastRollover(
        document.body.dataset.broadcastProgrammeInstanceId || musicHandoffProgrammeInstanceId
      )
      : continueAdaptiveMusicProgramme();
    continuation.catch((error) => {
      document.body.dataset.musicContinuationError = String(error?.message || error).slice(0, 140);
      showMusicShelfStatus("The live channels are temporarily unavailable.", 3600);
    });
  }

  function stopTelevisionMedia() {
    clearShopArrivalFade();
    cancelChannelLoading("stopped");
    window.__iamAdaptiveEnvironment?.stopRadio?.();
    stopBroadcastPlayback("television_closed");
    stopFashionBroadcastPlayback("television_closed");
    stopRadioVisualBroadcastPlayback("television_closed");
    window.clearInterval(nowPlayingTickerTimer);
    nowPlayingTickerTimer = 0;
    setSoundResearchEnabled(false, { persist: false });

    const televisionVideos = new Set([
      localVideo,
      fashionVideo,
      ...Array.from(radioFashionPreloadPool.values()).map((entry) => entry.video),
    ]);
    televisionVideos.forEach((video) => {
      if (!video) return;
      try {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
      } catch {
        // A navigating browser may already have released the media element.
      }
    });

    destroyContinuationHls();
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
    document.body.dataset.radioPreloadState = "stopped";

    window.IAMEMDR?.setActive?.(false, { canvas: emdrCanvas, video: localVideo });
    window.IAMEMDR?.setTimelineSource?.({ media: null, fallbackBpm: 112 });
    window.IAMEMDR?.setAudioSource?.(null);
    document.body.classList.remove("television-radio-continuation");
  }

  window.__iamStopAdaptiveMedia = stopTelevisionMedia;

  async function primeContinuationAudio(radioDecision = selectRadioContinuation(), options = {}) {
    continuationDecision = radioDecision;
    const source = radioDecision?.src || radioDecision?.stream_url;
    if (!source) return null;

    if (continuationAudio && continuationAudioSource && continuationAudioSource !== source) {
      const previousAudio = continuationAudio;
      destroyContinuationHls();
      try {
        previousAudio.pause();
        previousAudio.muted = true;
        previousAudio.volume = 0;
        previousAudio.removeAttribute("src");
        previousAudio.load();
      } catch {}
      window.IAMEMDR?.setAudioSource?.(null);
      continuationAudio = null;
    }

    if (!continuationAudio) {
      continuationAudio = new Audio();
      continuationAudio.crossOrigin = "anonymous";
      continuationAudio.preload = "auto";
      continuationAudio.volume = 0;
    }

    // The radio handoff is only a silent preloader at this point. Keep it hard
    // muted so voice-assistant ducking can never mistake it for live programme
    // audio and raise it alongside the selected video.
    continuationAudio.muted = true;
    if (!document.body.classList.contains("television-radio-continuation")) {
      document.body.dataset.radioPlaybackState = "primed-muted";
      document.body.dataset.radioPreloadState = "muted";
    }
    await attachContinuationAudioSource(continuationAudio, source, options);
    if (options.recordedProgramme && continuationAudio.paused) {
      await continuationAudio.play();
      continuationAudio.volume = 0;
    }
    const readyBufferSeconds = options.recordedProgramme
      ? RECORDED_PROGRAMME_PRIME_BUFFER_SECONDS
      : continuationAudio.dataset.radioTransport === "buffered-hls-scheduler"
        ? RADIO_SEGMENT_STARTUP_BUFFER_SECONDS
        : RADIO_READY_BUFFER_SECONDS;
    const initialBufferSeconds = await waitForRadioBuffer(continuationAudio, readyBufferSeconds);
    if (options.recordedProgramme && initialBufferSeconds + .15 < readyBufferSeconds) {
      throw new Error("The recorded programme could not build a safe startup buffer.");
    }
    continuationAudio.volume = 0;
    window.IAMEMDR?.setAudioSource?.(continuationAudio);

    if (!document.body.classList.contains("television-radio-continuation")) {
      const playAttempt = continuationAudio.play();
      if (playAttempt?.then) {
        playAttempt
          .then(() => {
            continuationAudio.volume = 0;
          })
          .catch(() => null);
      }
    }

    return continuationAudio;
  }

  function selectRadioContinuation() {
    const adaptive = bestRadioStationForTrack();
    if (adaptive) return { ...adaptive, label: adaptive.display_title, src: adaptive.stream_url };

    try {
      const parsed = readStoredSelection();
      const extendedSession = parsed?.extended_session || parsed?.extended_streaming_session || {};
      if (extendedSession.format !== "radio" || !extendedSession.catalogue_ready) return null;
      const roomPool = continuation.roomPools[extendedSession.music_room] || [];
      const station = radioStationRecords.find((candidate) => roomPool.includes(candidate.id));
      return station ? { ...station, label: station.display_title, src: station.stream_url } : null;
    } catch {
      return null;
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
        if (parsed?.final_output?.hero_music_video || parsed?.final_output?.extended_session) return parsed.final_output;
        if (parsed?.extended_session || parsed?.safety) return parsed;
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

  function setEmdrAutomateEnabled(enabled) {
    emdrAutomateEnabled = Boolean(enabled);
    emdrAutomate?.setAttribute("aria-pressed", String(emdrAutomateEnabled));
    emdrAutomate?.setAttribute("aria-label", emdrAutomateEnabled
      ? "Turn automatic movement off"
      : "Turn automatic movement on");

    const storedBaseline = Number(emdrUserIntensity);
    const sliderBaseline = Number(emdrIntensity?.value) / 100;
    const baseline = Math.max(0, Math.min(1,
      Number.isFinite(storedBaseline) ? storedBaseline : (Number.isFinite(sliderBaseline) ? sliderBaseline : .8)
    ));
    emdrUserIntensity = baseline;
    emdrIntensityJourneyCurrent = baseline;
    window.IAMEMDR?.setIntensity(baseline);
    if (emdrIntensity) emdrIntensity.value = String(Math.round(baseline * 100));
    return emdrAutomateEnabled;
  }

  function selectEmdrAdaptation() {
    const inference = readStoredCitizenInference() || {};
    const selection = readStoredSelection() || {};
    const needs = normalizedNeedMap(inference);
    const hasNeeds = Object.keys(needs).length > 0;
    const music = inference?.adaptive_environment?.music_intelligence ||
      inference?.adaptive_music_intelligence || selection?.adaptive_music_intelligence || {};
    const environment = music?.environment_function || selection?.environment_function || {};
    const extendedSession = inference?.adaptive_environment?.music_room ||
      music?.extended_streaming_session || selection?.extended_session || {};
    const musicRoom = String(extendedSession.selected_music_room || extendedSession.music_room || track.musicRoom || "").toLowerCase();

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
    const styleIndex = 1;

    const namedIntensity = { low: .28, low_to_moderate: .42, moderate: .58, high: .8, variable: .62 };
    const musicIntensity = namedIntensity[String(environment.intensity || "").toLowerCase()] ?? .52;
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
      factors: { load, depletion, restoration, connection, cognition, exploration, activation, music_room: musicRoom },
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
    if (reactionWallet) {
      reactionWallet.dataset.emdrControlsView = emdrStyleIndex === 1
        ? "stellar"
        : (emdrStyleIndex === 0 ? "gif" : "neutral");
    }
    const emdrActive = Boolean(window.IAMEMDR?.active);
    const hasSelectedStyle = Number.isInteger(emdrStyleIndex) && Boolean(emdrStyleValues[emdrStyleIndex]);
    if (emdrToggle) {
      emdrToggle.disabled = !emdrActive && !hasSelectedStyle;
      emdrToggle.setAttribute("aria-pressed", String(emdrActive));
      emdrToggle.textContent = emdrActive ? "on" : "off";
      emdrToggle.setAttribute(
        "aria-label",
        emdrActive
          ? "Turn EMDR off"
          : (hasSelectedStyle ? `Turn ${emdrStyleNames[emdrStyleIndex]} EMDR on` : "Choose GIF or stellar to turn EMDR on")
      );
    }
  }

  function applyEmdrAdaptation(requestedStyleIndex = null) {
    const adaptation = selectEmdrAdaptation();
    if (Number.isInteger(requestedStyleIndex) && emdrStyleValues[requestedStyleIndex]) {
      adaptation.styleIndex = requestedStyleIndex;
      adaptation.style = emdrStyleNames[requestedStyleIndex];
    }
    const startingIntensity = Number.isFinite(emdrUserIntensity) ? emdrUserIntensity : .8;
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
      minimum: startingIntensity,
      maximum: startingIntensity,
      automated: emdrAutomateEnabled,
      phraseBeats: EMDR_INTENSITY_PHRASE_BEATS,
      behavior: "fixed_manual_baseline_with_cinematic_choreography",
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
    setVoiceAssistantProgramVolume(continuationAudio, targetVolume, duration);
  }

  window.IAMTelevisionAudio = {
    version: "programme_meter_v1",
    setVoiceConversationActive: setVoiceAssistantDucking,
    getProgrammeLevel() {
      const { media, source } = soundResearchActiveMedia();
      const measuredLevel = Number(window.IAMEMDR?.getAudioLevel?.());
      const rms = media && Number.isFinite(measuredLevel) ? measuredLevel * media.volume : null;
      return {
        rms,
        source,
        mediaVolume: media?.volume ?? 0,
      };
    },
    getState() {
      const nowPlayingState = window.IAMNowPlaying?.getState?.() || {};
      return {
        conversationActive: voiceAssistantDuckActive,
        programmeDucked: document.body.dataset.voiceProgrammeDucked === "true",
        mantraSampleActive: document.body.classList.contains("television-mantra-sample-active"),
        source: document.body.classList.contains("television-radio-continuation") ? "radio" : "video",
        title: nowPlayingState.title || `${track.displayArtist || track.artist} — ${track.displayTitle || track.title}`,
        visual: nowPlayingState.visual || "",
      };
    },
  };

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

  function postShopFullscreenStatus(targetWindow = pageFrame?.contentWindow) {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    targetWindow?.postMessage({ type: "iam:shop-fullscreen-status", active }, window.location.origin);
  }

  function requestShopFullscreen(targetWindow = pageFrame?.contentWindow) {
    requestViewingFullscreen(localVideo);
    window.setTimeout(() => postShopFullscreenStatus(targetWindow), 80);
    return true;
  }

  function syncFullscreenState() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    document.body.classList.toggle("television-is-fullscreen", Boolean(fullscreenElement));
    postShopFullscreenStatus();
    if (document.body.classList.contains("television-room-open") || document.body.classList.contains("television-room-opening")) {
      startFlowerSpin({ restart: true });
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

  function openAdaptiveSoundNavigation() {
    const globalNav = document.querySelector("[data-global-nav]");
    if (globalNav && globalNav.parentElement !== document.body) document.body.append(globalNav);
    if (document.body.classList.contains("television-room-open")) {
      if (document.body.classList.contains("nav-open")) closeVideoNavigation();
      else {
        document.body.classList.add("nav-open");
        globalNav?.classList.add("is-open");
        globalNav?.setAttribute("aria-hidden", "false");
      }
      return;
    }
    flowerTrigger?.click();
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

  function beginTopLevelCheckIn(link) {
    const destination = new URL(link.getAttribute("href"), window.location.href);
    ["adaptiveFrame", "musicTelevisionFrame", "navigationShell"].forEach((parameter) => {
      destination.searchParams.delete(parameter);
    });

    document.body.dataset.repeatCheckinHandoff = "top-level";
    televisionPlaybackRequested = false;
    closeVideoNavigation();
    exitFullscreenForNavigation();
    stopTelevisionMedia();
    window.location.assign(destination.href);
  }

  function frameHref(link, options = {}) {
    const url = new URL(link.getAttribute("href"), window.location.href);
    if (/\/shop\.html$/i.test(url.pathname)) {
      url.searchParams.set("v", SHOP_SHELL_VERSION);
      const requestedTheme = options.shopTheme === "day" ? "day" : "night";
      url.searchParams.set("shopTheme", requestedTheme);
      url.searchParams.set("shopThemeSource", options.shopThemeSource === "direct" ? "direct" : "music-room");
    }
    if (/\/privacy-first\.html$/i.test(url.pathname)) {
      url.searchParams.set("privacyFrame", "single-nav-2");
    }
    url.searchParams.set("adaptiveFrame", "1");
    url.searchParams.set("musicTelevisionFrame", "1");
    url.searchParams.set("navigationShell", "1");
    return url.href;
  }

  function activeShopMusicRoom() {
    const broadcastState = broadcastChannelId
      ? window.IAMBroadcastClock?.stateAt(broadcastChannelId)
      : null;
    return String(broadcastState?.editorialId || track?.musicRoom || "").toLowerCase();
  }

  function contextualShopTheme() {
    const musicRoom = activeShopMusicRoom();
    return {
      musicRoom,
      theme: SHOP_DAY_MODE_ROOMS.has(musicRoom) ? "day" : "night",
    };
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

  function enforcePageLayerNavigationOwnership() {
    if (!pageFrame?.contentDocument) return;

    try {
      const frameDocument = pageFrame.contentDocument;
      frameDocument.documentElement.dataset.adaptiveFrame = "embedded";
      frameDocument.documentElement.dataset.musicTelevisionFrame = "embedded";
      frameDocument.body?.classList.remove("nav-open");

      let ownershipStyle = frameDocument.querySelector("style[data-television-navigation-ownership]");
      if (!ownershipStyle) {
        ownershipStyle = frameDocument.createElement("style");
        ownershipStyle.dataset.televisionNavigationOwnership = "outer-shell";
        ownershipStyle.textContent = `
          html[data-music-television-frame="embedded"] [data-nav-open],
          html[data-music-television-frame="embedded"] [data-global-nav] {
            display: none !important;
          }
        `;
        frameDocument.head?.appendChild(ownershipStyle);
      }

      frameDocument.querySelectorAll("[data-global-nav]").forEach((nav) => {
        nav.classList.remove("is-open");
        nav.setAttribute("aria-hidden", "true");
      });
    } catch {
      // All page-layer destinations are same-origin; keep the outer shell usable
      // if a future external document is deliberately introduced.
    }
  }

  function shopMusicStatus() {
    const radioPlaybackState = document.body.dataset.radioPlaybackState || "stopped";
    const audioPartyPlaying = Boolean(
      document.body.classList.contains("television-audio-party") &&
      document.body.dataset.audioPartyPlaybackState === "playing"
    );
    const radioPlaying = Boolean(
      document.body.classList.contains("television-radio-continuation") &&
      !document.body.classList.contains("television-audio-party") &&
      radioPlaybackState === "playing"
    );
    const videoPlaying = Boolean(localVideo && !localVideo.paused && !localVideo.muted);

    if (audioPartyPlaying) {
      return {
        playing: true,
        label: `${track.displayArtist || track.artist} — ${track.displayTitle || track.title}`,
        source: "party",
      };
    }

    if (radioPlaying) {
      const station = stationForId(activeRadioStationId);
      return { playing: true, label: station?.display_title || "Café del Mar — Chill", source: "radio" };
    }

    if (videoPlaying) {
      return {
        playing: true,
        label: `${track.displayArtist || track.artist} — ${track.displayTitle || track.title}`,
        source: track.presentation === "live_dj_set" ? "party" : "video",
      };
    }

    const radioLoading = document.body.classList.contains("television-radio-continuation") &&
      ["loading", "buffering", "recovering", "reconnecting"].includes(radioPlaybackState);
    return {
      playing: false,
      loading: radioLoading,
      label: "James Bondage — Parties",
      source: radioLoading ? "radio" : "quiet",
    };
  }

  function postShopMusicStatus(targetWindow = pageFrame?.contentWindow) {
    targetWindow?.postMessage({ type: "iam:shop-music-status", ...shopMusicStatus() }, window.location.origin);
  }

  function pauseShopMusic(targetWindow = pageFrame?.contentWindow) {
    clearShopArrivalFade();
    stopBroadcastPlayback("shop_pause");
    if (continuationAudio && !continuationAudio.paused) {
      continuationAudio.pause();
      continuationAudio.playbackRate = 1;
      document.body.dataset.audioPartyPlaybackState = "paused";
      document.body.dataset.radioPlaybackState = "paused";
    }
    if (localVideo && !localVideo.paused) {
      localVideo.pause();
    }
    postShopMusicStatus(targetWindow);
    return true;
  }

  async function requestShopMusic(targetWindow = pageFrame?.contentWindow, options = {}) {
    const currentStatus = shopMusicStatus();
    if (currentStatus.playing) {
      const shopMixIsPlaying = currentStatus.source === "party" && track.id === SHOP_ARRIVAL_TRACK_ID;
      if (options.ensurePlaying && shopMixIsPlaying) {
        postShopMusicStatus(targetWindow);
        return true;
      }
      if (!options.ensurePlaying) return pauseShopMusic(targetWindow);
    }

    if (
      continuationAudio &&
      document.body.classList.contains("television-audio-party") &&
      document.body.dataset.audioPartyPlaybackState === "paused" &&
      track.id === SHOP_ARRIVAL_TRACK_ID
    ) {
      try {
        continuationAudio.playbackRate = 1;
        continuationAudio.muted = false;
        await continuationAudio.play();
        document.body.dataset.audioPartyPlaybackState = "playing";
        document.body.dataset.radioPlaybackState = "playing";
      } catch (error) {
        document.body.dataset.audioPartyPlaybackState = "error";
        document.body.dataset.audioPartyPlaybackError = String(error?.message || error).slice(0, 140);
      }
      postShopMusicStatus(targetWindow);
      return true;
    }

    const shopTrack = findTrack(SHOP_ARRIVAL_TRACK_ID);

    if (shopTrack) {
      await startAudioLedParty(shopTrack, { source: "shop_independent" });
      if (continuationAudio) continuationAudio.playbackRate = 1;
    }
    postShopMusicStatus(targetWindow);
    return true;
  }

  function openInVideoPageLayer(link, options = {}) {
    if (!pageView || !pageFrame) return;

    const destination = new URL(link.href, window.location.href);
    const isHappinessWallet = /\/wallet\.html$/i.test(destination.pathname);
    const isShop = /\/shop\.html$/i.test(destination.pathname);
    const shopContext = isShop
      ? (options.shopTheme
        ? {
          musicRoom: options.shopThemeSource === "direct" ? "direct" : activeShopMusicRoom(),
          theme: options.shopTheme === "day" ? "day" : "night",
        }
        : contextualShopTheme())
      : null;

    closeSexEdShelf(false);
    stopSexEdEpisode();
    if (pageViewPreviousBlend === null) {
      pageViewPreviousBlend = Number(videoCrossfader?.value || 100);
    }
    setVideoBlend(0);
    if (shopContext) {
      document.body.dataset.shopArrivalTheme = shopContext.theme;
      document.body.dataset.shopArrivalRoom = shopContext.musicRoom || "unclassified";
    }
    pageFrame.src = frameHref(link, {
      shopTheme: shopContext?.theme,
      shopThemeSource: options.shopThemeSource,
    });
    pageView.setAttribute("aria-hidden", "false");
    document.body.classList.add("television-page-view-open");
    document.body.classList.toggle("television-wallet-page-open", isHappinessWallet);
    startFlowerSpin({ restart: true });
    closeVideoNavigation();
  }

  function bootstrapRequestedShop() {
    if (!shopShellRequested || !pageView || !pageFrame) return;
    const shopLink = document.querySelector('[data-nav-item="shop"]');
    if (!shopLink) return;

    hasOpened = true;
    televisionPlaybackRequested = false;
    setReactionWalletOpen(false);
    room.setAttribute("aria-hidden", "false");
    playButton.setAttribute("aria-expanded", "true");
    const video = mountPlayer();
    try { video.pause(); } catch {}
    video.muted = true;
    document.body.classList.add("television-room-open");
    startFlowerSpin();
    openInVideoPageLayer(shopLink, { shopTheme: "night", shopThemeSource: "direct" });
  }

  function completeShopEntry() {
    if (
      !shopEntryActivated ||
      !shopEntryFrameReady ||
      !shopEntryMediaReady ||
      document.documentElement.dataset.shopEntry === "entered"
    ) return;
    window.clearTimeout(shopEntryMediaFallbackTimer);
    document.documentElement.dataset.shopEntry = "entered";
    shopEntryScreen?.setAttribute("aria-hidden", "true");
    pageFrame?.contentWindow?.postMessage({ type: "iam:shop-masthead-start" }, window.location.origin);
    window.setTimeout(() => {
      if (shopEntryScreen) shopEntryScreen.hidden = true;
      pageFrame?.contentWindow?.postMessage({ type: "iam:shop-music-status-request" }, window.location.origin);
    }, 680);
  }

  function activateShopEntry() {
    if (!shopShellRequested || shopEntryActivated) return;
    shopEntryActivated = true;
    document.documentElement.dataset.shopEntry = "entering";
    if (shopEntryLabel) shopEntryLabel.textContent = shopEntryMediaReady ? "explore" : "loading";
    requestShopFullscreen(pageFrame?.contentWindow);
    requestShopMusic(pageFrame?.contentWindow, { ensurePlaying: true }).catch(() => {
      if (shopEntryLabel && !shopEntryMediaReady) shopEntryLabel.textContent = "loading";
    });
    completeShopEntry();
  }

  function bootstrapRequestedSexEd() {
    if (!requestedSexEdEpisode) return;
    hasOpened = true;
    televisionPlaybackRequested = true;
    room.setAttribute("aria-hidden", "false");
    playButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("television-room-open");
    startFlowerSpin();
    openSexEdEpisode(requestedSexEdEpisode).catch(() => {});
  }

  function bootstrapRequestedSexEdShelf() {
    if (!requestedSexEdShelf) return;
    hasOpened = true;
    room.setAttribute("aria-hidden", "false");
    playButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("television-room-open", "flower-cue-visible");
    startFlowerSpin();
    openSexEdShelf();
  }

  function returnToTelevisionRoom(options = {}) {
    closeSexEdShelf(false);
    if (!options.preserveSexEd) stopSexEdEpisode();
    document.title = televisionPageTitle;
    refreshOuterFavicon();
    document.body.classList.remove(
      "homepage-radar-open",
      "homepage-radar-arming",
      "television-page-view-open",
      "television-wallet-page-open",
      "flower-cue-visible"
    );
    pageView?.setAttribute("aria-hidden", "true");
    if (pageViewPreviousBlend !== null) {
      setVideoBlend(pageViewPreviousBlend);
      pageViewPreviousBlend = null;
    }
    setProgrammeMixLevel(null);
    document.querySelectorAll("[data-homepage-radar]").forEach((radar) => {
      radar.setAttribute("aria-hidden", "true");
    });
    closeVideoNavigation();
  }

  function openVideoRadar(event) {
    event.preventDefault();
    event.stopPropagation();

    document.body.classList.remove("flower-cue-visible", "television-page-view-open", "television-wallet-page-open");
    document.body.classList.add("homepage-radar-open", "homepage-radar-arming");
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
  }


  function openRoom(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (selectionIsLoading) return;

    if (window.IAMRealtimeVoiceAssistant?.shouldPreflightEntry?.()) {
      window.IAMRealtimeVoiceAssistant.showEntryPreflight?.();
      return;
    }

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
      window.IAMStreamController?.suspend?.(backgroundVideo, "television_room_open");
    });
    room.setAttribute("aria-hidden", "false");
    playButton.setAttribute("aria-expanded", "true");
    const video = mountPlayer();
    primeContinuationAudio().catch((error) => {
      document.body.dataset.radioPreloadState = "error";
      document.body.dataset.radioPlaybackError = String(error?.message || error).slice(0, 120);
    });
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
  window.IAMBroadcastClock?.ready
    ?.then(() => {
      rankMusicShelves();
      window.setTimeout(preloadRadioFashionRunways, 350);
    })
    .catch(() => showMusicShelfStatus("The shared broadcast clock is temporarily unavailable.", 3600));
  window.addEventListener("iam:broadcast-clock-ready", rankMusicShelves);
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
  window.addEventListener("iam:adaptive-sound-navigation", openAdaptiveSoundNavigation);
  window.addEventListener("iam:adaptive-sound-research-open", openSoundResearchDetails);
  fullscreenButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestViewingFullscreen(localVideo || mountPlayer());
  });
  reactionWallet?.addEventListener("pointerenter", (event) => {
    setAudioWalletInteracting(true);
    if (
      walletView === "closed" &&
      !audioWalletMode &&
      document.body.classList.contains("television-room-open") &&
      !document.body.classList.contains("television-wallet-pointer-locked") &&
      (!event.pointerType || event.pointerType === "mouse")
    ) {
      openReactionWallet();
    }
  });
  reactionWallet?.addEventListener("pointerleave", () => {
    setAudioWalletInteracting(false);
    releaseBloomWalletCloseGuard();
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
  reactionWallet?.addEventListener("click", blockRestoredWalletClickThrough, true);
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
        if (!syncActiveEmdrControls()) syncEmdrStyleButtons();
        setWalletView("emdr");
        return;
      }
      disarmVideoTooltips();
      if (mode === "music") {
        setWalletView("music");
        updateMusicSelector();
        return;
      }
      setWalletView("video-mix");
      openFashionShelf();
    });
  });
  videoSoundOpen?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    disarmVideoTooltips();
    window.dispatchEvent(new CustomEvent("iam:adaptive-sound-open"));
  });
  videoMantraOpen?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    disarmVideoTooltips();
    mantraReturnWalletView = "video";
    window.IAMMantraSampler?.open?.();
  });
  videoMixEndpoints.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const endpoint = button.dataset.videoMixEndpoint;
      const emdrGifEndpoint = Boolean(button.closest("[data-emdr-gif-mix-controls]"));
      if (emdrGifEndpoint) {
        setWalletView("emdr");
        if (endpoint === "fashion") {
          if (fashionBroadcastChannelId) setVideoBlend(0);
          else openFashionShelf(button);
        } else if (endpoint === "music") {
          setVideoBlend(100);
        }
        return;
      }
      if (endpoint === "fashion") {
        if (fashionBroadcastChannelId) setVideoBlend(0);
        else openFashionShelf();
        return;
      }
      setVideoBlend(100);
      if (endpoint === "music") {
        if (document.body.classList.contains("television-radio-continuation") && radioVisualBroadcastChannelId) {
          setWalletView("video-mix");
          return;
        }
        setWalletView("music");
        updateMusicSelector();
      }
    });
  });
  fashionRunwayPreviousButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectAdjacentFashionBroadcastItem(
      -1,
      button.closest("[data-emdr-gif-mix-controls]") ? "fashion_emdr_gif_arrow" : "fashion_wallet_arrow"
    );
  }));
  fashionRunwayNextButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectAdjacentFashionBroadcastItem(
      1,
      button.closest("[data-emdr-gif-mix-controls]") ? "fashion_emdr_gif_arrow" : "fashion_wallet_arrow"
    );
  }));
  fashionShelfToggles.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFashionShelf(button);
  }));
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
  programOpenButtons.forEach((button) => {
    button.addEventListener("click", () => closeMusicShelf(false), true);
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
  sexEdShelfCloseButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeSexEdShelf();
    });
  });
  sexEdShelfPrevious?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveSexEdShelf(-1);
  });
  sexEdShelfNext?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    moveSexEdShelf(1);
  });
  sexEdShelfViewport?.addEventListener("pointerdown", (event) => {
    sexEdShelfSwipeStartX = Number(event.clientX);
  });
  sexEdShelfViewport?.addEventListener("pointerup", (event) => {
    const start = sexEdShelfSwipeStartX;
    sexEdShelfSwipeStartX = null;
    if (!Number.isFinite(start)) return;
    const distance = Number(event.clientX) - start;
    if (Math.abs(distance) < 46) return;
    moveSexEdShelf(distance < 0 ? 1 : -1);
  });
  sexEdShelfViewport?.addEventListener("pointercancel", () => {
    sexEdShelfSwipeStartX = null;
  });
  sexEdCards.forEach((card) => {
    card.addEventListener("pointerenter", () => startSexEdShelfPreview(card));
    card.addEventListener("focus", () => startSexEdShelfPreview(card));
    card.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSexEdEpisode(card.dataset.sexEdEpisode || "01");
    });
  });
  broadcastEntryCloseButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeBroadcastEntry(true);
    });
  });
  broadcastJoinButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (document.body.classList.contains("television-sex-ed-active")) {
      stopSexEdEpisode({ restoreProgramme: false });
    }
    joinBroadcastChannel(pendingBroadcastChannelId, { source: "broadcast_invitation" });
  });
  broadcastChooseButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeBroadcastEntry(false);
    if (pendingBroadcastFormat === "fashion") {
      setWalletView("video-mix");
      openFashionShelf();
    } else {
      setMusicMode(pendingBroadcastFormat, { manual: true, openShelf: true });
    }
  });
  window.addEventListener("resize", () => {
    if (fashionShelfOpen) updateFashionShelfPosition({ preview: false });
    if (musicShelfOpen) updateMusicShelfPosition({ preview: false });
    if (sexEdShelfOpen) updateSexEdShelfPosition({ preview: false });
    updateNowPlayingOverflow();
  });
  document.addEventListener("keydown", (event) => {
    if (broadcastEntryOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeBroadcastEntry(true);
      }
      return;
    }
    if (sexEdShelfOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSexEdShelf();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveSexEdShelf(event.key === "ArrowRight" ? 1 : -1);
      }
      return;
    }
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
  emdrGifCrossfader?.addEventListener("input", () => {
    setVideoBlend(emdrGifCrossfader.value);
  });
  emdrToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const wasActive = Boolean(window.IAMEMDR?.active);
    const hasSelectedStyle = Number.isInteger(emdrStyleIndex) && Boolean(emdrStyleValues[emdrStyleIndex]);
    if (!wasActive && !hasSelectedStyle) {
      syncEmdrStyleButtons();
      return;
    }
    const active = wasActive
      ? window.IAMEMDR?.setActive(false, { canvas: emdrCanvas, video: localVideo })
      : window.IAMEMDR?.setActive(true, { canvas: emdrCanvas });
    syncEmdrStyleButtons();
    document.querySelector('[data-video-mode="emdr"]')?.setAttribute("aria-pressed", String(Boolean(active)));
    if (active) startSoundResearchLayer();
    setWalletView("emdr");
  });
  emdrStyleButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const requestedStyleIndex = Number(button.dataset.emdrStyleIndex);
    if (!Number.isInteger(requestedStyleIndex) || !emdrStyleValues[requestedStyleIndex]) return;
    const adaptation = applyEmdrAdaptation(requestedStyleIndex);
    const active = window.IAMEMDR?.setActive(true, { canvas: emdrCanvas });
    document.querySelector('[data-video-mode="emdr"]')?.setAttribute("aria-pressed", String(Boolean(active)));
    if (active) window.IAMEMDR?.setIntensity(adaptation.intensityJourney.start);
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
  emdrMantraOpen?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    disarmVideoTooltips();
    mantraReturnWalletView = "emdr";
    window.IAMMantraSampler?.open?.();
  });
  window.addEventListener("iam:mantra-close", () => {
    const returnView = mantraReturnWalletView;
    mantraReturnWalletView = "emdr";
    setWalletView(returnView);
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
    if (document.querySelector("[data-adaptive-sound-panel]")) {
      window.dispatchEvent(new CustomEvent("iam:adaptive-sound-open"));
    } else {
      setSoundResearchEnabled(!soundResearchEnabled);
    }
  });
  syncEmdrStyleButtons();
  syncSoundResearchControl();
  setSoundResearchPeakVolume(soundResearchMaxVolume, "built-in default");
  initSoundResearchMonitor();
  loadSoundResearchSettings();
  window.setInterval(loadSoundResearchSettings, 60000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadSoundResearchSettings();
      synchronizeBroadcastPlayback(false).catch(() => null);
    }
  });
  window.addEventListener("focus", () => {
    synchronizeBroadcastPlayback(false).catch(() => null);
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

    moreButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const pinned = !host.classList.contains("is-research-details-pinned");
      host.classList.toggle("is-research-details-pinned", pinned);
      if (pinned) {
        openResearchRollover(host);
        openResearchDetails(host);
      } else {
        closeResearchRollover(host, true);
      }
    });
  });
  researchDialogClose?.addEventListener("pointerdown", (event) => event.stopPropagation());
  researchDialogClose?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeAllResearchRollovers(null, true);
  });
  researchDialogCopy?.addEventListener("pointerdown", (event) => event.stopPropagation());
  researchDialogCopy?.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("pointermove", (event) => {
    releaseBloomWalletCloseGuardFromPointerMove(event);
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
    if (event.key === "Escape") closeAllResearchRollovers(null, true);
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
  window.addEventListener("iam:circle-room-state", (event) => {
    const nextState = event.detail || {};
    const joinedChanged = audioWalletJoined !== Boolean(nextState.joined);
    audioWalletJoined = Boolean(nextState.joined);
    audioWalletMuted = nextState.muted !== false;
    audioWalletOccupancy = audioWalletJoined ? Math.max(1, Number(nextState.occupancy) || 1) : 0;
    audioWalletCircleName = audioWalletJoined ? String(nextState.circleName || "Circle") : "";
    if (nextState.selectorOpen) {
      audioWalletMode = true;
      setWalletView("audio");
    }
    syncAudioWallet();
    if (joinedChanged) rankMusicShelves();
  });
  audioModeTrigger?.addEventListener("click", openAudioWallet);
  walletHomeButtons.forEach((button) => button.addEventListener("click", returnToWalletHome));
  audioWalletJoin?.addEventListener("click", toggleAudioWalletJoin);
  audioWalletJoin?.addEventListener("pointerleave", () => {
    if (audioWalletMode) reactionWallet?.classList.add("is-circle-tooltip-armed");
  });
  audioWalletMic?.addEventListener("click", toggleAudioWalletMute);
  audioWalletLeave?.addEventListener("click", leaveAudioWalletCircle);
  document.addEventListener("click", closeAudioWalletFromOutside);
  document.addEventListener("click", closeWalletFromOutside);
  reactionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const reactionType = button.dataset.televisionReaction || "daisy";
      releaseReactionFlood(reactionType);
      window.IAMBroadcastInteractions?.sendBloom?.(reactionType);
      closeReactionWalletAfterBloom(event.currentTarget, event);
    });
  });
  window.addEventListener("iam:shared-bloom", (event) => {
    const reactionType = String(event.detail?.type || "daisy");
    const density = Math.max(1, Math.min(3, Number(event.detail?.density) || 1));
    releaseReactionFlood(reactionType, { shared: true, density });
  });
  radarClose?.addEventListener("click", closeVideoRadar);
  pageClose?.addEventListener("click", () => returnToTelevisionRoom());
  supportClose?.addEventListener("click", closeSupportCard);
  playerMount.addEventListener("click", () => {
    if (channelLoadingOverlay?.classList.contains("is-active")) return;
    if (document.body.classList.contains("television-radio-continuation")) return;
    if (!localVideo?.paused) return;
    playLocalVideo(localVideo);
  });
  document.querySelectorAll("[data-happiness-wallet-category]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const category = String(button.dataset.happinessWalletCategory || "").toLowerCase();
      if (!new Set(["music", "fashion", "events", "health"]).has(category)) return;
      const walletLink = document.createElement("a");
      walletLink.setAttribute("href", `wallet.html#${category}`);
      if (!document.body.classList.contains("television-room-open")) {
        window.location.href = walletLink.href;
        return;
      }
      setReactionWalletOpen(false);
      openInVideoPageLayer(walletLink);
    }, true);
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

      const navItemName = link.dataset.navItem || "";
      if (navItemName === "check-in") {
        event.preventDefault();
        event.stopImmediatePropagation();
        beginTopLevelCheckIn(link);
        return;
      }

      const navSubmenu = navItemName
        ? document.querySelector(`[data-nav-submenu="${navItemName}"]`)
        : null;
      if (navSubmenu && !navSubmenu.hasAttribute("data-mobile-editorial-hidden")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.querySelectorAll("[data-nav-item]").forEach((item) => {
          item.classList.toggle("is-active", item === link);
          if (document.querySelector(`[data-nav-submenu="${item.dataset.navItem}"]`)) {
            item.setAttribute("aria-expanded", String(item === link));
          }
        });
        document.querySelectorAll("[data-nav-submenu]").forEach((submenu) => {
          submenu.classList.toggle("is-open", submenu === navSubmenu);
        });
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
  sexEdLink?.addEventListener("click", (event) => {
    if (!document.body.classList.contains("television-room-open")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (sexEdShelfOpen) closeSexEdShelf();
    else openSexEdShelf();
  }, true);
  researchDialogScienceLink?.addEventListener("click", (event) => {
    if (!document.body.classList.contains("television-room-open") || !isInternalPageLink(researchDialogScienceLink)) {
      exitFullscreenForNavigation();
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    closeAllResearchRollovers();
    window.dispatchEvent(new CustomEvent("iam:adaptive-sound-close"));
    openInVideoPageLayer(researchDialogScienceLink);
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
    if (event.data?.type === "iam:shop-music-status-request") {
      postShopMusicStatus(event.source);
      return;
    }
    if (event.data?.type === "iam:shop-music-request") {
      requestShopMusic(event.source);
      return;
    }
    if (event.data?.type === "iam:shop-fullscreen-status-request") {
      postShopFullscreenStatus(event.source);
      return;
    }
    if (event.data?.type === "iam:shop-fullscreen-request") {
      requestShopFullscreen(event.source);
      return;
    }
    if (event.data?.type === "iam:shop-opening-media-ready") {
      shopEntryMediaReady = true;
      if (shopEntryLabel) shopEntryLabel.textContent = "explore";
      completeShopEntry();
      return;
    }
    if (event.data?.type === "iam:shop-navigation") {
      startFlowerSpin({ restart: true });
      return;
    }
    if (event.data?.type === "iam:open-sex-ed-episode") {
      openSexEdEpisode(event.data.episode || "01");
      return;
    }
    if (event.data?.type === "iam:return-to-television") {
      returnToTelevisionRoom();
    }
  });
  sexEdEpisodeStart?.addEventListener("click", playSexEdEpisode);
  sexEdEpisodeVideo?.addEventListener("loadedmetadata", updateTimecode);
  sexEdEpisodeVideo?.addEventListener("timeupdate", updateTimecode);
  sexEdEpisodeVideo?.addEventListener("play", () => {
    if (sexEdEpisodeStart) sexEdEpisodeStart.hidden = true;
  });
  sexEdEpisodeVideo?.addEventListener("playing", () => {
    if (sexEdEpisodeStart) sexEdEpisodeStart.hidden = true;
  });
  sexEdEpisodeVideo?.addEventListener("pause", () => {
    if (sexEdEpisodeStart) sexEdEpisodeStart.hidden = true;
  });
  pageFrame?.addEventListener("load", () => {
    enforcePageLayerNavigationOwnership();
    syncPageLayerMetadata();
    postShopMusicStatus();
    if (document.body.classList.contains("television-page-view-open")) {
      startFlowerSpin({ restart: true });
    }
    let shopFrameLoaded = false;
    try {
      shopFrameLoaded = /\/shop\.html$/i.test(new URL(pageFrame.src, window.location.href).pathname);
    } catch {
      shopFrameLoaded = false;
    }
    if (
      shopFrameLoaded &&
      (!shopShellRequested || document.documentElement.dataset.shopEntry === "entered")
    ) {
      pageFrame?.contentWindow?.postMessage({ type: "iam:shop-masthead-start" }, window.location.origin);
    }
    if (shopShellRequested && shopFrameLoaded) {
      shopEntryFrameReady = true;
      pageFrame?.contentWindow?.postMessage({ type: "iam:shop-preload-opening" }, window.location.origin);
      window.clearTimeout(shopEntryMediaFallbackTimer);
      shopEntryMediaFallbackTimer = window.setTimeout(() => {
        shopEntryMediaReady = true;
        if (shopEntryLabel) shopEntryLabel.textContent = "explore";
        completeShopEntry();
      }, 4000);
      if (!shopEntryActivated) document.documentElement.dataset.shopEntry = "ready";
      completeShopEntry();
    }
  });
  shopEntryButton?.addEventListener("click", activateShopEntry, true);
  setMusicTelevisionMetadata();
  updateNowPlaying();
  if (window.ResizeObserver && nowPlayingViewport && nowPlayingTrack) {
    nowPlayingResizeObserver = new ResizeObserver(updateNowPlayingOverflow);
    nowPlayingResizeObserver.observe(nowPlayingViewport);
    if (nowPlayingTitle) nowPlayingResizeObserver.observe(nowPlayingTitle);
    if (nowPlayingVisualTitle) nowPlayingResizeObserver.observe(nowPlayingVisualTitle);
    if (nowPlayingChannelTitle) nowPlayingResizeObserver.observe(nowPlayingChannelTitle);
  }
  window.setInterval(updateNowPlayingClock, 30000);
  syncFullscreenState();
  window.IAMTelevisionRoom = {
    version: "programme_presentations_v2",
    enterFromVoicePreflight() {
      openRoom({
        preventDefault() {},
        stopImmediatePropagation() {},
      });
    },
    setProgrammeMixLevel(level) {
      return setProgrammeMixLevel(level);
    },
    requestShopMusic() {
      return requestShopMusic(pageFrame?.contentWindow);
    },
    requestShopFullscreen() {
      return requestShopFullscreen(pageFrame?.contentWindow);
    },
    refreshNavigationFlower() {
      startFlowerSpin({ restart: true });
      return true;
    },
    refreshViewingState() {
      updateTimecode();
      updateNowPlaying();
      return true;
    },
    preparePresentationEntry() {
      hasOpened = true;
      televisionPlaybackRequested = true;
      room.setAttribute("aria-hidden", "false");
      playButton.setAttribute("aria-expanded", "true");
      document.body.classList.add("television-room-open");
      startFlowerSpin();
      return true;
    },
    suspendProgrammeForPresentation(source = "presentation") {
      const returnProgramme = {
        channelId: broadcastChannelId,
        trackId: track?.id || "",
        currentTime: Math.max(0, Number(localVideo?.currentTime || 0)),
        videoBlend: Math.max(0, Math.min(100, Number(videoCrossfader?.value || 100))),
      };
      closeSexEdShelf(false);
      if (document.body.classList.contains("television-sex-ed-active")) {
        stopSexEdEpisode({ restoreProgramme: false });
      }
      try { localVideo?.pause?.(); } catch {}
      stopContinuationAudioImmediately();
      if (broadcastChannelId) stopBroadcastPlayback(`${source}_started`);
      return returnProgramme;
    },
    async resumeProgrammeFromPresentation(returnProgramme = {}) {
      if (returnProgramme.channelId) {
        return joinBroadcastChannel(returnProgramme.channelId, { source: "presentation_return" });
      }
      const returnTrack = findTrack(returnProgramme.trackId);
      if (!returnTrack) return false;
      await switchMusicTrack(returnTrack, {
        source: "presentation_return",
        startAt: Math.max(0, Number(returnProgramme.currentTime || 0)),
      });
      setVideoBlend(returnProgramme.videoBlend);
      return true;
    },
  };
  window.IAMSexEdProgramme = {
    version: "sex_ed_programme_v1",
    openEpisode(episode = "01") {
      return openSexEdEpisode(episode);
    },
    openShelf() {
      openSexEdShelf();
      return true;
    },
    getState() {
      return {
        active: document.body.classList.contains("television-sex-ed-active"),
        episode: document.body.dataset.sexEdEpisode || "",
      };
    },
  };
  window.IAMStreamReady?.then(() => {
    if (!selectionIsLoading) primeLocalVideo();
  });
  if (shopShellRequested) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrapRequestedShop, { once: true });
    else bootstrapRequestedShop();
  } else if (requestedSexEdEpisode) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrapRequestedSexEd, { once: true });
    else bootstrapRequestedSexEd();
  } else if (requestedSexEdShelf) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrapRequestedSexEdShelf, { once: true });
    else bootstrapRequestedSexEdShelf();
  }
  runIntro();
}());
