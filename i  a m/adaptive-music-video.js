(function () {
  const form = document.querySelector("[data-adaptive-video-form]");
  const input = form?.querySelector("input[name='checkin']");
  const statusNode = document.querySelector("[data-video-status]");
  const placeholder = document.querySelector("[data-video-placeholder]");
  const heroKicker = document.querySelector("[data-hero-kicker]");
  const heroTitle = document.querySelector("[data-hero-title]");
  const heroDetail = document.querySelector("[data-hero-detail]");
  const playerMount = document.querySelector("[data-youtube-player]");
  const playButton = document.querySelector("[data-video-play]");
  const skipButton = document.querySelector("[data-video-skip]");
  const jsonPanel = document.querySelector(".adaptive-video-json");
  const jsonState = document.querySelector("[data-json-state]");
  const jsonToggle = document.querySelector("[data-json-toggle]");
  const jsonOutput = document.querySelector("[data-recommendation-json]");
  const stagingHost = window.location.hostname === "staging.universalmind.tv";
  const endpoint = stagingHost
    ? "https://realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/citizen-needs-inference"
    : document.querySelector('meta[name="iam-citizen-needs-inference-endpoint"]')?.content || "";
  const musicEndpoint = stagingHost
    ? "https://iam-adaptive-music-intelligence-staging.universalmind.workers.dev/adaptive-music-intelligence"
    : document.querySelector('meta[name="iam-adaptive-music-intelligence-endpoint"]')?.content || "";
  const searchParams = new URLSearchParams(window.location.search);
  const liveInferenceAllowed = searchParams.get("liveInference") === "1" ||
    /(^|\.)universalmind\.tv$/i.test(window.location.hostname);
  const verifyMode = searchParams.get("verify") === "1";
  const forceLiveVideoAllowed = searchParams.get("forceLiveVideo") === "1";
  const liveMusicAllowed = searchParams.get("mockMusic") !== "1";
  const MUSIC_INTELLIGENCE_VERSION = "adaptive_music_intelligence_v0.1";
  const CATALOGUE_URL = "adaptive-music-video-catalogue-v1.11.json?v=music-video-catalogue-a93d901ed795";

  const stations = {
    "inner-planes": {
      label: "Inner Planes · Radio · Cafe Del Mar — Calm",
      url: "https://streamer.radio.co/sb748f24ad/listen",
    },
    "champagne-bohemia": {
      label: "Champagne Bohemia · Radio · Cafe Del Mar — Chill",
      url: "https://streams.radio.co/se1a320b47/listen",
    },
    "modul8-infinity": {
      label: "modul8 infinity · Radio · Cafe Del Mar — House",
      url: "https://s4.radio.co/seeae9c220/listen",
    },
    "james-bondage": {
      label: "james bondage · Radio · Sanctuary — Dark Electro",
      url: "https://stream.sanctuaryradio.com/mainchannel_hq",
    },
  };

  const catalog = [
    {
      id: "rufus-innerbloom",
      artist: "RÜFÜS DU SOL",
      title: "Innerbloom",
      videoId: "Tx9zMFodNtA",
      musicRooms: ["champagne-bohemia"],
      genres: ["electronic", "deep house", "progressive house"],
      moods: ["expansive", "restorative", "beautiful", "connected"],
      needs: ["Recovery", "Awe", "Connection", "Hope"],
      visualEnergy: "immersive paint field",
      rosterFit: "world_class_seed",
      youthFit: 0.89,
      safety: "low_density_visuals",
    },
    {
      id: "bonobo-cirrus",
      artist: "Bonobo",
      title: "Cirrus",
      videoId: "WF34N4gJAKE",
      musicRooms: ["champagne-bohemia"],
      genres: ["electronic", "downtempo", "instrumental"],
      moods: ["curious", "soft", "patterned", "surreal"],
      needs: ["Curiosity", "Attention", "Clarity", "Recovery"],
      visualEnergy: "surreal archival collage",
      rosterFit: "underground_to_world_class_seed",
      youthFit: 0.78,
      safety: "non_lyrical",
    },
    {
      id: "bicep-glue",
      artist: "BICEP",
      title: "Glue",
      videoId: "A7ZxRs45tTg",
      musicRooms: ["modul8-infinity"],
      genres: ["breakbeat", "house", "electronic"],
      moods: ["nostalgic", "open", "uplifting", "communal"],
      needs: ["Belonging", "Connection", "Hope", "Motivation"],
      visualEnergy: "youthful open air movement",
      rosterFit: "underground_to_world_class_seed",
      youthFit: 0.92,
      safety: "moderate_activation",
    },
    {
      id: "jamie-xx-gosh-romain-gavras",
      artist: "Jamie xx",
      title: "Gosh",
      videoId: "hTGJfRPLe08",
      musicRooms: ["modul8-infinity"],
      genres: ["future garage", "deep house", "post-dubstep"],
      moods: ["awe", "scale", "focus", "collective"],
      needs: ["Awe", "Purpose", "Self-actualisation", "Attention"],
      visualEnergy: "large scale youth choreography",
      rosterFit: "world_class_seed",
      youthFit: 0.94,
      safety: "high_visual_scale",
    },
    {
      id: "jamie-xx-gosh-erik-wernquist",
      artist: "Jamie xx",
      title: "Gosh",
      videoId: "WjNssEVlB6M",
      musicRooms: ["modul8-infinity"],
      genres: ["future garage", "deep house", "post-dubstep"],
      moods: ["space", "wonder", "quiet momentum"],
      needs: ["Awe", "Clarity", "Purpose", "Curiosity"],
      visualEnergy: "cosmic animation",
      rosterFit: "world_class_seed",
      youthFit: 0.84,
      safety: "non_lyrical",
    },
    {
      id: "disclosure-you-and-me",
      artist: "Disclosure",
      title: "You & Me",
      videoId: "W_vM8ePGuRM",
      musicRooms: ["modul8-infinity"],
      genres: ["uk garage", "house", "dance"],
      moods: ["romantic", "kinetic", "bright", "travel"],
      needs: ["Joy", "Love", "Motivation", "Connection"],
      visualEnergy: "travel and dance",
      rosterFit: "popular_seed",
      youthFit: 0.9,
      safety: "romantic_travel",
    },
  ];

  const state = {
    recommendation: null,
    youtubePlayer: null,
    youtubeReadyPromise: null,
    cataloguePromise: null,
    prototypeTimer: null,
    prototypeTelemetryTimers: [],
    youtubeTelemetryTimer: null,
    currentVideoTelemetry: null,
    radioStartedAt: 0,
    radioTelemetryTimer: null,
    handoffStarted: false,
    extendedSessionIndex: 0,
  };

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function setStatus(value) {
    if (statusNode) statusNode.textContent = value;
  }

  function safeSet(store, key, value) {
    try {
      store?.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private or restricted modes.
    }
  }

  function analyticsRecord(eventName, params = {}) {
    return window.IAMFirstPartyAnalytics?.record?.(eventName, params);
  }

  function activeTrackId() {
    return state.recommendation?.final_output?.hero_music_video?.selected_track_id || null;
  }

  function videoAnalyticsBase(video, platform) {
    return {
      selected_track_id: video?.selected_track_id || activeTrackId(),
      artist: video?.artist || null,
      title: video?.title || null,
      platform: platform || video?.platform || (video?.local_video_file ? "local_mp4" : "youtube"),
      video_id: video?.video_id || video?.youtube_video_id || null,
      source_priority: video?.source_priority || null,
    };
  }

  function beginVideoTelemetry(video, platform) {
    const emittedProgress = new Set();
    let started = false;
    let completed = false;
    const base = videoAnalyticsBase(video, platform);

    const telemetry = {
      start(extra = {}) {
        if (started) return;
        started = true;
        analyticsRecord("video_start", { ...base, ...extra, video_percent: 0 });
      },
      progress(percent, extra = {}) {
        if (!Number.isFinite(percent)) return;
        this.start(extra);
        [10, 25, 50, 75].forEach((threshold) => {
          if (percent >= threshold && !emittedProgress.has(threshold)) {
            emittedProgress.add(threshold);
            analyticsRecord("video_progress", { ...base, ...extra, video_percent: threshold });
          }
        });
      },
      complete(extra = {}) {
        if (completed) return;
        completed = true;
        this.progress(100, extra);
        analyticsRecord("video_complete", { ...base, ...extra, video_percent: 100 });
      },
      error(extra = {}) {
        analyticsRecord("video_error", { ...base, ...extra });
      },
    };

    state.currentVideoTelemetry = telemetry;
    return telemetry;
  }

  function clearYoutubeTelemetryTimer() {
    if (state.youtubeTelemetryTimer) {
      window.clearInterval(state.youtubeTelemetryTimer);
      state.youtubeTelemetryTimer = null;
    }
  }

  function clearRadioTelemetryTimer() {
    if (state.radioTelemetryTimer) {
      window.clearInterval(state.radioTelemetryTimer);
      state.radioTelemetryTimer = null;
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function stableUnit(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967295;
  }

  function extendedSessionVisitorId() {
    const key = "iamAdaptiveMusicVisitorId";
    try {
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;
      const created = window.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(key, created);
      return created;
    } catch {
      return "anonymous";
    }
  }

  function assignedExtendedSessionFormat(index = state.extendedSessionIndex) {
    const draw = stableUnit(`extended-session-format-v1:${extendedSessionVisitorId()}:${index}`);
    if (draw < 0.8) return "parties";
    if (draw < 0.9) return "radio";
    return "videos";
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function wordsFrom(values) {
    return values
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  function localInference(checkin, context) {
    const signal = normalize(checkin);
    const has = (pattern) => pattern.test(signal);
    const downshiftSignal = has(/\b(anxious|anxiety|panic|tired|fatigue|exhausted|burnt|burned|stress|stressed|overwhelmed|scared|afraid|sleep|heavy|low|restless|hyper|unsafe)\b/);
    const joySignal = has(/\b(joy|joyful|happy|excited|celebrate|celebration|confident|euphoric|alive|love|loving|party|festival|dance|dancing|uplift|uplifting)\b/);
    const focusSignal = has(/\b(focus|focused|flow|clarity|clear|study|work|productive|attention|deep work|create|creating|coding|designing)\b/);
    const agencySignal = has(/\b(angry|anger|rage|strong|strength|courage|brave|agency|resilient|resilience|fight|fighting|determined|identity|power|powerful)\b/);
    const melancholySignal = has(/\b(sad|grief|grieving|lonely|alone|heartbroken|melancholy|reflective|lost|longing|honest|vulnerable|complex|meaning)\b/);
    const curiositySignal = has(/\b(curious|curiosity|strange|experimental|explore|exploration|weird|new|novel|edge|avant|abstract|future|beauty|beautiful|wonder|awe)\b/);
    const restorationSignal = has(/\b(grateful|gratitude|calm|soft|gentle|peaceful|restore|restoration|recovery|recover|soothe|surf|ocean|coast|beach|sunset)\b/);

    let environmentFunctionHint = "Soul + Restoration";
    if (agencySignal) environmentFunctionHint = "Grit + Agency";
    else if (joySignal && !downshiftSignal) environmentFunctionHint = "Joy + Affirmation";
    else if (focusSignal && !downshiftSignal) environmentFunctionHint = "Focus + Flow";
    else if (melancholySignal) environmentFunctionHint = "Melancholy + Honesty";
    else if (curiositySignal && !downshiftSignal) environmentFunctionHint = "Curiosity + Exploration";
    else if (restorationSignal || downshiftSignal) environmentFunctionHint = "Soul + Restoration";

    let musicRoom = "champagne-bohemia";
    if (restorationSignal || downshiftSignal) musicRoom = "inner-planes";
    if (focusSignal && !downshiftSignal && !joySignal) musicRoom = "james-bondage";
    if ((joySignal || agencySignal || curiositySignal) && !downshiftSignal) musicRoom = "modul8-infinity";

    const highlightsByFunction = {
      "Joy + Affirmation": ["Joy", "Motivation", "Connection", "Love"],
      "Melancholy + Honesty": ["Awe", "Recovery", "Clarity", "Hope"],
      "Soul + Restoration": ["Recovery", "Calm", "Fatigue", "Psychological Safety"],
      "Focus + Flow": ["Attention", "Clarity", "Executive Function", "Motivation"],
      "Grit + Agency": ["Motivation", "Purpose", "Anger", "Self-actualisation"],
      "Curiosity + Exploration": ["Curiosity", "Awe", "Self-actualisation", "Clarity"],
    };
    const highlights = highlightsByFunction[environmentFunctionHint] || ["Curiosity", "Hope", "Connection", "Awe"];

    const weather = context?.weather_condition ? `${context.weather_condition}` : "";
    const time = context?.time_of_day || "";
    const dominantDomains = musicRoom === "inner-planes"
      ? ["Physiological", "Emotion"]
      : environmentFunctionHint === "Focus + Flow"
        ? ["Cognitive", "Emotion"]
        : environmentFunctionHint === "Grit + Agency"
          ? ["Emotion", "Cognitive"]
          : ["Emotion", "Social"];

    const selectedFormat = assignedExtendedSessionFormat();
    return {
      highlights,
      confidence: 0.72,
      selected_music_room: musicRoom,
      selected_format: selectedFormat,
      source_id: null,
      catalogue_ready: true,
      music_room_confidence: 0.74,
      music_room_reason: `${environmentFunctionHint} signals with ${time || "local"} context support ${musicRoom}; the application assigned the ${selectedFormat} slot under the 80/10/10 extended-session policy.`,
      dominant_domains: dominantDomains,
      top_needs_used: highlights.slice(0, 4),
      context_modifiers_used: unique([time, weather, context?.location_label]).slice(0, 4),
      uncertainty_notes: ["Short self-report only; treat as adaptive environment mapping."],
      human_review_relevance: "not_indicated",
      interpretation_type: "language_theme_mapping",
      clinical_status: "not_a_diagnosis",
      model: "local_prototype_fallback",
      prompt_version: "adaptive-inference-engine-system-prompt-v4.44-local-prototype",
      environment_function_hint: environmentFunctionHint,
      music_function_signal: {
        joy_affirmation: joySignal,
        melancholy_honesty: melancholySignal,
        soul_restoration: restorationSignal || downshiftSignal,
        focus_flow: focusSignal,
        grit_agency: agencySignal,
        curiosity_exploration: curiositySignal,
      },
      environment_context: context?.gpt || context || {},
    };
  }

  async function getEnvironmentContext() {
    try {
      return await window.IAMLocalContext?.getContext?.();
    } catch {
      return {
        context_available: false,
        context_role: "adaptive_environment_only",
      };
    }
  }

  async function inferNeeds(checkin, environmentContext) {
    if (endpoint && liveInferenceAllowed && window.fetch) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkin,
            environment_context: environmentContext?.gpt || environmentContext || {},
          }),
        });

        if (response.ok) {
          return await response.json();
        }
      } catch {
        // Local previews usually do not have the deployed worker CORS origin.
      }
    }

    return localInference(checkin, environmentContext);
  }

  function toMusicRoomLabel(musicRoom) {
    const key = normalizeMusicRoom(musicRoom);
    return stations[key]?.label || "No extended session";
  }

  function normalizeMusicRoom(value) {
    const normalized = normalize(value);
    return stations[normalized] ? normalized : "";
  }

  function normalizeCandidate(candidate) {
    const runtimeDelivery = candidate.tensor_profile?.runtime_delivery || {};
    const musicRooms = candidate.musicRooms || candidate.music_room_fit || [candidate.music_room || runtimeDelivery.music_room].filter(Boolean);
    const needs = candidate.needs || candidate.citizen_needs_fit || candidate.top_needs || [];
    const localVideoFile = candidate.localVideoFile || candidate.local_video_file || runtimeDelivery.local_video_file || null;

    return {
      ...candidate,
      id: candidate.id || runtimeDelivery.selected_track_id,
      videoId: candidate.videoId || candidate.youtube_video_id || null,
      localVideoFile,
      local_video_file: localVideoFile,
      musicRooms: musicRooms.map((musicRoom) => normalizeMusicRoom(musicRoom)).filter(Boolean),
      genres: candidate.genres || [],
      moods: candidate.moods || [],
      needs,
      visualEnergy: candidate.visualEnergy || candidate.visual_energy || "",
      rosterFit: candidate.rosterFit || candidate.source_priority || "trusted_catalogue",
      youthFit: Number(candidate.youthFit ?? candidate.youth_relevance ?? 0.72),
      editorialConfidence: Number(candidate.editorial_confidence ?? 0.72),
      safety: candidate.safety?.youth_safety || candidate.safety || candidate.lyrical_safety || "review_required",
      youtubeEmbedStatus: candidate.youtube_embed_status || "unverified",
      sourcePriority: candidate.source_priority || candidate.rosterFit || "trusted_catalogue",
      emotionalFunctions: candidate.emotional_functions || [candidate.primary_environmental_function].filter(Boolean),
      density: candidate.density || "variable",
      intensity: candidate.energy || candidate.intensity || "variable",
      trajectory: candidate.trajectory || "stabilise",
      musicRoom: normalizeMusicRoom(candidate.music_room || runtimeDelivery.music_room || musicRooms[0]),
    };
  }

  async function loadCatalogue() {
    if (state.cataloguePromise) return state.cataloguePromise;

    state.cataloguePromise = (async () => {
      try {
        const response = await fetch(CATALOGUE_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Catalogue unavailable");
        const catalogue = await response.json();
        const heroCandidates = catalogue.hero_candidates || catalogue.tracks || [];
        return {
          ...catalogue,
          hero_candidates: heroCandidates.map(normalizeCandidate),
          artist_nodes: catalogue.artist_nodes || [],
          function_buckets: catalogue.function_buckets || {},
          source_status: "loaded_from_editable_json",
        };
      } catch {
        return {
          catalogue_version: "inline_prototype_fallback",
          hero_candidates: catalog.map(normalizeCandidate),
          artist_nodes: catalog.map((candidate) => ({ name: candidate.artist, type: "prototype_candidate" })),
          function_buckets: {},
          source_status: "inline_fallback",
        };
      }
    })();

    return state.cataloguePromise;
  }

  function getExperimentTrack() {
    const explicit = searchParams.get("track");
    if (explicit === "youtube") return "youtube_baseline";
    if (explicit === "um") return "universal_mind_music_intelligence";

    try {
      const stored = window.localStorage.getItem("iamAdaptiveMusicExperimentTrack");
      if (stored) return stored;
      const assigned = Math.random() < 0.82 ? "universal_mind_music_intelligence" : "youtube_baseline";
      window.localStorage.setItem("iamAdaptiveMusicExperimentTrack", assigned);
      return assigned;
    } catch {
      return "universal_mind_music_intelligence";
    }
  }

  function getNeeds(inference) {
    return inference.top_needs_used || inference.highlights || [];
  }

  function summarizeContext(environmentContext) {
    const gpt = environmentContext?.gpt || environmentContext || {};

    return {
      local_time: gpt.local_time || environmentContext?.local_time || environmentContext?.time_label || null,
      location_label: gpt.location_label || environmentContext?.location_label || null,
      location_precision: gpt.location_precision || environmentContext?.location_precision || "none",
      weather_condition: gpt.weather_condition || environmentContext?.weather_condition || null,
      temperature_celsius: gpt.temperature_celsius ?? environmentContext?.temperature_celsius ?? null,
      context_available: Boolean(gpt.context_available ?? environmentContext?.context_available),
      context_role: "adaptive_environment_only",
    };
  }

  function deriveEnvironmentFunction(checkin, inference, environmentContext) {
    const hintedFunction = inference.environment_function_hint;
    const hintedFunctions = {
      "Joy + Affirmation": {
        primary_function: "Joy + Affirmation",
        secondary_function: "Club Energy + Festival Activation",
        intensity: "moderate",
        density: "layered",
        trajectory: "activate",
      },
      "Melancholy + Honesty": {
        primary_function: "Melancholy + Honesty",
        secondary_function: "Soul + Restoration",
        intensity: "low_to_moderate",
        density: "open",
        trajectory: "catharsis",
      },
      "Soul + Restoration": {
        primary_function: "Soul + Restoration",
        secondary_function: "Melancholy + Honesty",
        intensity: "low_to_moderate",
        density: "open",
        trajectory: "warm_downshift",
      },
      "Focus + Flow": {
        primary_function: "Focus + Flow",
        secondary_function: "Curiosity + Exploration",
        intensity: "low_to_moderate",
        density: "open",
        trajectory: "focus",
      },
      "Grit + Agency": {
        primary_function: "Grit + Agency",
        secondary_function: "Club Energy + Festival Activation",
        intensity: "moderate",
        density: "layered",
        trajectory: "catharsis",
      },
      "Curiosity + Exploration": {
        primary_function: "Curiosity + Exploration",
        secondary_function: "Focus + Flow",
        intensity: "low_to_moderate",
        density: "open",
        trajectory: "exploration",
      },
    };

    if (hintedFunctions[hintedFunction]) {
      return hintedFunctions[hintedFunction];
    }

    const needs = getNeeds(inference);
    const needText = needs.join(" ");
    const reportText = checkin || "";
    const contextText = [
      environmentContext?.time_of_day,
      environmentContext?.weather_condition,
      environmentContext?.location_label,
    ].join(" ");
    const recoverySignal = /Recovery|Fatigue|Stress|Calm|Sleep Pressure|Anxiety|Fear|Hypervigilance|Psychological Safety|tired|exhausted|overwhelmed/i.test(`${needText} ${reportText}`);
    const joySignal = /Joy|Motivation|Love|Connection|Self-actualisation|Arousal|dance|joy|celebrate|confident/i.test(`${needText} ${reportText}`);
    const focusSignal = /Attention|Clarity|Executive Function|focus|flow|work|study|productive/i.test(`${needText} ${reportText}`);
    const curiositySignal = /Curiosity|Awe|Purpose|Self-actualisation|experimental|explore|strange|wonder/i.test(`${needText} ${reportText}`);
    const agencySignal = /Anger|Shame|Motivation|Purpose|Self-actualisation|agency|courage|resilient|strong|rage/i.test(`${needText} ${reportText}`);
    const melancholySignal = /sad|grief|melancholy|lonely|longing|honest|vulnerable|meaning/i.test(`${needText} ${reportText}`);
    const coastalDownshift = /coast|beach|surf|clear|evening|night|rain/i.test(contextText);

    if (melancholySignal) {
      return {
        primary_function: "Melancholy + Honesty",
        secondary_function: "Soul + Restoration",
        intensity: "low_to_moderate",
        density: "open",
        trajectory: "catharsis",
      };
    }

    if (recoverySignal) {
      return {
        primary_function: "Soul + Restoration",
        secondary_function: curiositySignal ? "Curiosity + Exploration" : "Melancholy + Honesty",
        intensity: "low_to_moderate",
        density: "open",
        trajectory: coastalDownshift ? "warm_downshift" : "downshift",
      };
    }

    if (joySignal) {
      return {
        primary_function: "Joy + Affirmation",
        secondary_function: "Club Energy + Festival Activation",
        intensity: "moderate",
        density: "layered",
        trajectory: "activate",
      };
    }

    if (focusSignal && !joySignal) {
      return {
        primary_function: "Focus + Flow",
        secondary_function: curiositySignal ? "Curiosity + Exploration" : null,
        intensity: "low_to_moderate",
        density: "open",
        trajectory: "focus",
      };
    }

    if (agencySignal && !recoverySignal) {
      return {
        primary_function: "Grit + Agency",
        secondary_function: curiositySignal ? "Curiosity + Exploration" : "Joy + Affirmation",
        intensity: "moderate",
        density: "layered",
        trajectory: "catharsis",
      };
    }

    return {
      primary_function: curiositySignal ? "Curiosity + Exploration" : "Soul + Restoration",
      secondary_function: curiositySignal ? "Focus + Flow" : "Joy + Affirmation",
      intensity: "low_to_moderate",
      density: "open",
      trajectory: curiositySignal ? "exploration" : "stabilise",
    };
  }

  function buildApiSearchPlan(checkin, inference, environmentContext, environmentFunction, experimentTrack) {
    const musicRoom = normalizeMusicRoom(inference.selected_music_room);
    const needs = getNeeds(inference);
    const contextTerms = [
      environmentContext?.time_of_day,
      environmentContext?.weather_condition,
      environmentContext?.location_label,
    ].filter(Boolean);
    const query = unique([
      "official music video",
      "electronic dance music",
      musicRoom,
      ...needs,
      ...contextTerms,
    ]).join(" ");

    return {
      execution_mode: "client_prototype_with_server_side_api_plan",
      experiment_track: experimentTrack,
      priority_order: [
        "universal_mind_seed_catalogue",
        "trusted_catalogue_or_partner_catalogue",
        "gracenote_metadata",
        "cyanite_metadata_fallback",
        "musixmatch_lyric_safety",
        "youtube_data_api_discovery",
        "editorial_review",
      ],
      gracenote: {
        role: "primary music metadata",
        production_status: "server_side_adapter_required",
        query: {
          genre: ["electronic", "dance"],
          mood: needs,
          style: [musicRoom, environmentFunction.primary_function].filter(Boolean),
          era: ["current", "classic"],
        },
        failure_policy: "continue_to_cyanite_if_unavailable_or_sparse",
      },
      cyanite: {
        role: "metadata contingency and audio similarity",
        production_status: "fallback_if_gracenote_unavailable",
        query: {
          mood: needs,
          movement: environmentFunction.intensity,
          energy: environmentFunction.intensity,
          density: environmentFunction.density,
        },
      },
      musixmatch: {
        role: "lyrics safety and resonance",
        production_status: "server_side_adapter_required",
        query: {
          track_pool: "candidate short list",
          avoid: ["graphic self-harm", "hate", "explicit violence"],
          prefer: ["hope", "connection", "agency", "awe", "movement_without_despair"],
        },
      },
      youtube: {
        role: "contextual playable hero video",
        production_status: "youtube_data_api_v3_required_for_live_search_and_embed_validation",
        search_list_query: {
          part: "snippet",
          type: "video",
          videoCategoryId: "10",
          videoEmbeddable: "true",
          videoSyndicated: "true",
          safeSearch: "strict",
          order: "relevance",
          relevanceLanguage: "en",
          topicId: "/m/02lkt",
          maxResults: 8,
          q: query,
        },
        videos_list_validation: {
          part: "snippet,status,contentDetails",
          required_status: {
            embeddable: true,
            privacyStatus: "public",
          },
        },
        embed_policy: {
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            controls: 1,
            enablejsapi: 1,
            iv_load_policy: 3,
            playsinline: 1,
            rel: 0,
          },
          notes: [
            "Use official IFrame API and compliant embeds.",
            "Do not scrape.",
            "Do not promise ad blocking where YouTube platform rules prevent it.",
          ],
        },
      },
      checkin_terms: wordsFrom([checkin]),
    };
  }

  async function fetchMusicIntelligenceProviderResult(checkin, inference, environmentContext, environmentFunction) {
    if (!musicEndpoint || !liveMusicAllowed || !window.fetch) {
      return {
        status: "not_requested",
        reason: liveMusicAllowed
          ? "No Music Intelligence worker endpoint is configured in the page metadata."
          : "Live Music Intelligence worker disabled by ?mockMusic=1.",
      };
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5200);

    try {
      const response = await fetch(musicEndpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkin,
          inference,
          environment_context: summarizeContext(environmentContext),
          environment_function: environmentFunction,
          max_candidates: 8,
        }),
      });
      const payload = await response.json();
      window.clearTimeout(timeout);
      return response.ok
        ? { status: "used", payload }
        : { status: "failed", reason: payload?.error || "Music Intelligence worker returned an error." };
    } catch (error) {
      window.clearTimeout(timeout);
      return {
        status: "failed",
        reason: error.name === "AbortError"
          ? "Music Intelligence worker timed out after 5.2 seconds."
          : error.message || "Music Intelligence worker unavailable.",
      };
    }
  }

  function buildProviderAudit(providerResult, embedConfirmed) {
    const payload = providerResult?.payload || null;
    const credentialAudit = payload?.provider_credential_audit || {};
    const sourceStatuses = payload?.music_metadata_sources || {};
    const failedWorkerStatus = providerResult?.status === "failed" ? "worker_unreachable" : "not_used";

    return {
      gracenote: {
        status: sourceStatuses.gracenote || credentialAudit.gracenote?.status || failedWorkerStatus,
        live_call_attempted: Boolean(payload?.gracenote_result?.call_attempted),
        reason: payload?.gracenote_result?.reason || providerResult?.reason || "Provider audit unavailable in local mock mode.",
      },
      cyanite: {
        status: sourceStatuses.cyanite || credentialAudit.cyanite?.status || failedWorkerStatus,
        live_call_attempted: Boolean(payload?.cyanite_result?.call_attempted),
        reason: payload?.cyanite_result?.reason || providerResult?.reason || "Provider audit unavailable in local mock mode.",
      },
      musixmatch: {
        status: sourceStatuses.musixmatch || credentialAudit.musixmatch?.status || failedWorkerStatus,
        live_call_attempted: Boolean(payload?.musixmatch_result?.call_attempted),
        reason: payload?.musixmatch_result?.reason || providerResult?.reason || "Provider audit unavailable in local mock mode.",
      },
      youtube_api: {
        status: sourceStatuses.youtube_api || (embedConfirmed ? "used" : failedWorkerStatus),
        live_call_attempted: Boolean(payload?.youtube_result?.status === "used" || credentialAudit.youtube_api?.call_attempted),
        reason: payload?.youtube_result?.reason || credentialAudit.youtube_api?.reason || providerResult?.reason || "YouTube API candidate search unavailable in local mock mode.",
      },
      worker: {
        endpoint: musicEndpoint || null,
        status: providerResult?.status || "not_requested",
        reason: providerResult?.reason || null,
      },
    };
  }

  function candidatesFromProviderResult(providerResult, inference, environmentFunction) {
    const candidates = providerResult?.payload?.youtube_result?.candidates || [];
    const musicRoom = normalizeMusicRoom(inference.selected_music_room);
    const needs = getNeeds(inference);

    return candidates
      .filter((candidate) => candidate.youtube_video_id && candidate.youtube_embed_status === "api_confirmed")
      .map((candidate) => normalizeCandidate({
        id: `youtube-api-${candidate.youtube_video_id}`,
        artist: candidate.channel_title || "YouTube",
        title: candidate.title || "Official music video",
        youtube_video_id: candidate.youtube_video_id,
        youtube_embed_status: "api_confirmed",
        source_priority: "youtube_search",
        music_room_fit: musicRoom ? [musicRoom] : [],
        emotional_functions: [environmentFunction.primary_function],
        genres: ["electronic", "dance"],
        moods: needs,
        citizen_needs_fit: needs,
        energy: environmentFunction.intensity,
        density: environmentFunction.density,
        trajectory: environmentFunction.trajectory,
        visual_energy: "YouTube Data API confirmed public embeddable candidate",
        youth_relevance: 0.72,
        editorial_confidence: 0.62,
        lyrical_safety: "review_required",
      }));
  }

  function scoreCandidate(candidate, inference, environmentContext, searchPlan, environmentFunction) {
    const musicRoom = normalizeMusicRoom(inference.selected_music_room);
    const needs = getNeeds(inference);
    const checkinTerms = searchPlan.checkin_terms || [];
    const candidateTerms = wordsFrom([
      candidate.artist,
      candidate.title,
      candidate.visualEnergy,
      ...candidate.genres,
      ...candidate.moods,
      ...candidate.needs,
    ]);
    const matchedTerms = unique(checkinTerms.filter((term) => candidateTerms.includes(term)));
    const matchedNeeds = needs.filter((need) => candidate.needs.includes(need));
    const matchedFunctions = candidate.emotionalFunctions.filter((emotionalFunction) => (
      emotionalFunction === environmentFunction.primary_function ||
      emotionalFunction === environmentFunction.secondary_function
    ));
    const roomScore = musicRoom && candidate.musicRooms.includes(musicRoom) ? 0.38 : 0.1;
    const primaryFunctionScore = candidate.emotionalFunctions.includes(environmentFunction.primary_function) ? 0.24 : 0;
    const secondaryFunctionScore = candidate.emotionalFunctions.includes(environmentFunction.secondary_function) ? 0.06 : 0;
    const leadFunctionScore = candidate.emotionalFunctions[0] === environmentFunction.primary_function ? 0.12 : 0;
    const functionScore = primaryFunctionScore + secondaryFunctionScore + leadFunctionScore;
    const needScore = Math.min(0.24, matchedNeeds.length * 0.08);
    const wordScore = Math.min(0.12, matchedTerms.length * 0.03);
    const contextScore = /coast|beach|clear|evening|night/i.test([
      environmentContext?.location_label,
      environmentContext?.weather_condition,
      environmentContext?.time_of_day,
    ].join(" ")) && candidate.moods.some((mood) => /open|expansive|space|beautiful|awe/.test(mood))
      ? 0.08
      : 0.04;
    const youthScore = candidate.youthFit * 0.12;
    const safetyScore = candidate.safety ? 0.1 : 0.04;
    const editorialScore = candidate.editorialConfidence * 0.12;
    const embedScore = candidate.youtubeEmbedStatus === "blocked_local_test"
      ? -0.42
      : candidate.youtubeEmbedStatus === "api_confirmed"
        ? 0.1
        : 0;
    const trajectoryScore = candidate.trajectory === environmentFunction.trajectory ? 0.08 : 0;
    const densityScore = candidate.density === environmentFunction.density ? 0.05 : 0;
    const score = roomScore + functionScore + needScore + wordScore + contextScore + youthScore + safetyScore + editorialScore + trajectoryScore + densityScore + embedScore;

    return {
      ...candidate,
      score: Math.round(score * 100) / 100,
      matched_needs: matchedNeeds,
      matched_terms: matchedTerms,
      review: [
        musicRoom && candidate.musicRooms.includes(musicRoom) ? `matches ${musicRoom}` : "music-room fit remains secondary to tensor relevance",
        matchedFunctions.length ? `matches ${matchedFunctions.join(", ")}` : `broad fit for ${environmentFunction.primary_function}`,
        matchedNeeds.length ? `supports ${matchedNeeds.join(", ")}` : "broad electronic culture fit",
        candidate.youtubeEmbedStatus === "blocked_local_test" ? "known unavailable as raw embed; do not auto-embed" : `${candidate.youtubeEmbedStatus} YouTube embed`,
        candidate.visualEnergy,
      ],
    };
  }

  async function recommendVideo(checkin, inference, environmentContext) {
    const catalogue = await loadCatalogue();
    const experimentTrack = getExperimentTrack();
    const preferredMusicRoom = normalizeMusicRoom(inference.selected_music_room);
    const environmentFunction = deriveEnvironmentFunction(checkin, inference, environmentContext);
    const searchPlan = buildApiSearchPlan(checkin, inference, environmentContext, environmentFunction, experimentTrack);
    const liveProviderResult = await fetchMusicIntelligenceProviderResult(checkin, inference, environmentContext, environmentFunction);
    const providerCandidates = candidatesFromProviderResult(liveProviderResult, inference, environmentFunction);
    const seenCandidateIds = new Set();
    const candidatePool = [...providerCandidates, ...catalogue.hero_candidates].filter((candidate) => {
      const key = candidate.videoId || candidate.id;
      if (!key || seenCandidateIds.has(key)) return false;
      seenCandidateIds.add(key);
      return true;
    });
    const reviewedCandidates = candidatePool
      .map((candidate) => scoreCandidate(candidate, inference, environmentContext, searchPlan, environmentFunction))
      .sort((first, second) => second.score - first.score);
    const winner = reviewedCandidates.find((candidate) => candidate.youtubeEmbedStatus !== "blocked_local_test") || reviewedCandidates[0];
    const fallbackVideo = reviewedCandidates.find((candidate) => candidate.id !== winner.id && candidate.youtubeEmbedStatus !== "blocked_local_test") || winner;
    const embedConfirmed = winner.youtubeEmbedStatus === "api_confirmed";
    const playbackMode = embedConfirmed || forceLiveVideoAllowed
      ? "youtube_iframe_api"
      : "prototype_stand_in_until_youtube_data_api_confirms_embeddable";
    const contextSummary = summarizeContext(environmentContext);
    const providerAudit = buildProviderAudit(liveProviderResult, embedConfirmed);
    const sourceStatuses = {
      gracenote: providerAudit.gracenote.status,
      cyanite: providerAudit.cyanite.status,
      musixmatch: providerAudit.musixmatch.status,
      youtube_api: providerAudit.youtube_api.status,
    };
    const selectedMusicRoom = preferredMusicRoom || winner.musicRoom || winner.musicRooms[0] || "";
    const selectedFormat = assignedExtendedSessionFormat();
    const extendedCatalogueReady = Boolean(selectedMusicRoom && selectedFormat && (
      (selectedMusicRoom !== "safety-cushion" || selectedFormat === "videos") &&
      (selectedFormat !== "radio" || stations[selectedMusicRoom])
    ));
    const roomLabel = toMusicRoomLabel(selectedMusicRoom);
    const selectionReason = `${winner.artist} - ${winner.title} carries ${environmentFunction.primary_function} with ${roomLabel}: ${winner.review.join("; ")}.`;
    const extendedSessionReason = inference.music_room_reason || (selectedMusicRoom ? `${roomLabel} continues the environment after the hero video.` : "No eligible extended session is available.");
    const heroMusicVideo = {
      platform: winner.localVideoFile ? "local_mp4" : "youtube",
      selected_track_id: winner.id,
      title: winner.title,
      artist: winner.artist,
      local_video_file: winner.localVideoFile,
      youtube_video_id: winner.videoId,
      video_id: winner.videoId,
      watch_url: winner.videoId ? `https://www.youtube.com/watch?v=${winner.videoId}` : null,
      embed_host: "https://www.youtube-nocookie.com",
      embed_confirmed: embedConfirmed,
      youtube_embed_status: winner.youtubeEmbedStatus,
      playback_mode: playbackMode,
      source_priority: winner.sourcePriority,
      selection_confidence: Math.max(0, Math.min(1, winner.score)),
      selection_reason: selectionReason,
      genres: winner.genres,
      moods: winner.moods,
      emotional_functions: winner.emotionalFunctions,
      density: winner.density,
      intensity: winner.intensity,
      trajectory: winner.trajectory,
    };
    const fallbackHeroVideo = {
      selected_track_id: fallbackVideo.id,
      title: fallbackVideo.title,
      artist: fallbackVideo.artist,
      local_video_file: fallbackVideo.localVideoFile,
      youtube_video_id: fallbackVideo.videoId,
      video_id: fallbackVideo.videoId,
      watch_url: fallbackVideo.videoId ? `https://www.youtube.com/watch?v=${fallbackVideo.videoId}` : null,
      youtube_embed_status: fallbackVideo.youtubeEmbedStatus,
      source_priority: fallbackVideo.sourcePriority,
      reason: fallbackVideo.id === winner.id
        ? "Use the cinematic prototype frame if no API-confirmed embeddable video is available, then preserve the assigned extended-session branch."
        : "Use if selected hero embed errors, is private, removed, or disallows embedded playback.",
    };
    const adaptiveMusicIntelligence = {
      feature_version: MUSIC_INTELLIGENCE_VERSION,
      experiment_track: experimentTrack,
      citizen_checkin: checkin,
      environment_context: contextSummary,
      citizen_needs_summary: {
        dominant_domains: inference.dominant_domains || [],
        top_needs: getNeeds(inference),
        overall_confidence: inference.confidence ?? inference.overall_confidence ?? 0,
        prompt_version: inference.prompt_version || null,
      },
      environment_function: environmentFunction,
      hero_music_video: heroMusicVideo,
      extended_streaming_session: {
        available_music_rooms: ["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"],
        music_room: selectedMusicRoom || null,
        format: extendedCatalogueReady ? selectedFormat : null,
        source_id: null,
        station_label: selectedFormat === "radio" ? roomLabel : null,
        station_url: selectedFormat === "radio" ? stations[selectedMusicRoom]?.url || null : null,
        catalogue_ready: extendedCatalogueReady,
        format_policy: {
          weights: { parties: 0.8, radio: 0.1, videos: 0.1 },
          assignment: "stable_visitor_and_recommendation_slot",
          safety_and_readiness_override: true,
        },
        music_room_confidence: inference.music_room_confidence ?? 0,
        reason: extendedSessionReason,
      },
      editorial_layer: {
        emotionally_honest: true,
        hopeful_in_trajectory: true,
        psychologically_safe: true,
        age_appropriate: true,
        artist_approved_where_relevant: winner.sourcePriority === "universal_mind_roster",
        brand_aligned: true,
        culturally_appropriate: true,
        non_extractive: true,
        editorial_notes: "Universal Mind seed catalogue and editorial rules decide the final environment; YouTube only supplies candidates until a partner/licensed catalogue is connected.",
      },
      music_metadata_sources: sourceStatuses,
      provider_audit: providerAudit,
      fallbacks: {
        fallback_video_id: fallbackHeroVideo.video_id,
        fallback_video: fallbackHeroVideo,
        fallback_music_room: null,
        fallback_reason: "Return no extended session if confidence, catalogue readiness or embed quality is insufficient.",
      },
    };

    return {
      recommendation_version: "adaptive_music_video_recommendation_v0.2",
      generated_at: new Date().toISOString(),
      input: {
        self_report: checkin,
        demographic_context: "youth electronic dance music culture",
        roster_context: `${catalogue.catalogue_version || "seed catalogue"}; ${catalogue.artist_nodes.length} editable artist, label and scene nodes loaded`,
        live_provider_candidate_count: providerCandidates.length,
      },
      needs_analysis: inference,
      adaptive_music_intelligence: adaptiveMusicIntelligence,
      api_search_plan: searchPlan,
      live_provider_result: liveProviderResult,
      gpt_review_simulation: {
        few_shot_examples_applied: [
          "Choose the music room from musical identity, stated intent and taste, constructive trajectory, context and eligible catalogue sources.",
          "Calm remains a Citizen Needs signal; chillout and house remain genres, not room categories.",
          "Safety Cushion is one ready 21-track 80s nu wave music-video feed and remains Videos only.",
        ],
        reviewed_candidate_count: reviewedCandidates.length,
        top_candidates: reviewedCandidates.slice(0, 4).map((candidate) => ({
          id: candidate.id,
          artist: candidate.artist,
          title: candidate.title,
          score: candidate.score,
          youtube_embed_status: candidate.youtubeEmbedStatus,
          source_priority: candidate.sourcePriority,
          matched_needs: candidate.matched_needs,
          review: candidate.review,
        })),
      },
      final_output: {
        hero_music_video: heroMusicVideo,
        extended_session: {
          music_room: selectedMusicRoom || null,
          format: extendedCatalogueReady ? selectedFormat : null,
          source_id: null,
          station_label: selectedFormat === "radio" ? roomLabel : null,
          station_url: selectedFormat === "radio" ? stations[selectedMusicRoom]?.url || null : null,
          catalogue_ready: extendedCatalogueReady,
          transition: extendedCatalogueReady ? `dissolve_video_then_join_${selectedFormat}_livestream` : null,
          format_policy: {
            weights: { parties: 0.8, radio: 0.1, videos: 0.1 },
            assignment: "stable_visitor_and_recommendation_slot",
            safety_and_readiness_override: true,
          },
          reason: extendedSessionReason,
        },
        safety: {
          clinical_status: "not_a_diagnosis",
          recommendation_role: "adaptive_environment_support_not_treatment",
          content_filters: ["safeSearch=strict", "embeddable video", "lyrics safety review planned"],
          youtube_delivery: "official_embed_only_no_ad_blocking_or_ad_modification",
        },
        fallbacks: adaptiveMusicIntelligence.fallbacks,
      },
    };
  }

  function persistInference(inference, checkin) {
    const enriched = {
      ...inference,
      checkin,
      updatedAt: Date.now(),
    };

    safeSet(window.sessionStorage, "iamLatestInference", enriched);
    safeSet(window.localStorage, "iamLatestInference", enriched);
    safeSet(window.sessionStorage, "citizenNeedsLatestInference", enriched);
    safeSet(window.localStorage, "citizenNeedsLatestInference", enriched);
    safeSet(window.sessionStorage, "iamLatestCheckinValue", checkin);
    safeSet(window.localStorage, "iamLatestCheckinValue", checkin);
    window.dispatchEvent(new CustomEvent("iam:inference-updated", { detail: enriched }));
  }

  function renderJson(recommendation) {
    if (jsonOutput) {
      jsonOutput.textContent = JSON.stringify(recommendation, null, 2);
    }
    if (jsonState) {
      jsonState.textContent = recommendation?.final_output?.extended_session?.station_label || "json";
    }
  }

  function updateFirstPartyEngagementSummary(recommendation = state.recommendation) {
    if (!recommendation) return null;
    const trackId = recommendation.final_output?.hero_music_video?.selected_track_id || null;
    const engagementSignals = window.IAMFirstPartyAnalytics?.summarizeForReranker?.(trackId) || {};
    recommendation.engagement_signals = engagementSignals;
    recommendation.adaptive_music_intelligence = {
      ...(recommendation.adaptive_music_intelligence || {}),
      first_party_analytics: {
        schema_version: window.IAMFirstPartyAnalytics?.version || "iam_first_party_analytics_unavailable",
        third_party_analytics: "not_used",
        storage: "localStorage",
        event_store_key: "iamFirstPartyAnalyticsEvents",
        engagement_signals: engagementSignals,
      },
    };
    safeSet(window.sessionStorage, "iamLatestMusicVideoRecommendation", recommendation);
    safeSet(window.localStorage, "iamLatestMusicVideoRecommendation", recommendation);
    return engagementSignals;
  }

  function renderRecommendation(recommendation) {
    const video = recommendation.final_output.hero_music_video;
    const radio = recommendation.final_output.extended_session;

    if (heroKicker) heroKicker.textContent = radio.station_label;
    if (heroTitle) heroTitle.textContent = `${video.artist} / ${video.title}`;
    if (heroDetail) heroDetail.textContent = video.selection_reason || video.reason || "Adaptive music intelligence selected this hero environment.";
    if (placeholder) placeholder.classList.add("is-condensed");
    if (skipButton) skipButton.hidden = false;
    if (playButton) playButton.hidden = false;
    renderJson(recommendation);
  }

  function loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (state.youtubeReadyPromise) return state.youtubeReadyPromise;

    state.youtubeReadyPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousReady === "function") previousReady();
        resolve(window.YT);
      };

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existingScript) return;

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube player API unavailable"));
      document.head.append(script);
    });

    return state.youtubeReadyPromise;
  }

  function clearPrototypeTimer() {
    if (state.prototypeTimer) {
      window.clearTimeout(state.prototypeTimer);
      state.prototypeTimer = null;
    }
    state.prototypeTelemetryTimers.forEach((timer) => window.clearTimeout(timer));
    state.prototypeTelemetryTimers = [];
  }

  function clearLocalHeroVideo() {
    const localHero = playerMount?.querySelector("video");
    if (!localHero) return;

    try {
      localHero.pause();
      localHero.removeAttribute("src");
      localHero.load();
    } catch {
      // The next mount clears the element even when the browser rejects teardown.
    }
  }

  function renderPrototypeHeroFrame(video, reason = "api-confirmed embed pending") {
    if (!playerMount || !video) return;

    clearPrototypeTimer();
    clearYoutubeTelemetryTimer();
    const telemetry = beginVideoTelemetry(video, "prototype_frame");
    telemetry.start({ playback_mode: "prototype_frame", reason });
    setStatus("hero video");
    playerMount.setAttribute("aria-hidden", "false");
    playerMount.classList.add("is-active");
    if (placeholder) placeholder.classList.add("is-behind-player");

    const params = new URLSearchParams({
      controls: "1",
      enablejsapi: "1",
      iv_load_policy: "3",
      playsinline: "1",
      rel: "0",
    });
    const verifySrc = video.video_id ? `https://www.youtube-nocookie.com/embed/${video.video_id}?${params.toString()}` : "";
    playerMount.innerHTML = [
      `<div class="adaptive-video-verify-frame" data-verify-youtube-src="${verifySrc}">`,
      "<span>adaptive music intelligence</span>",
      `<strong>${video.artist || "Universal Mind"} / ${video.title || "hero video"}</strong>`,
      `<em>${reason}</em>`,
      "</div>",
    ].join("");

    setStatus("playing");
    state.prototypeTelemetryTimers = [25, 50, 75].map((percent, index) => (
      window.setTimeout(() => telemetry.progress(percent, { playback_mode: "prototype_frame", reason }), 1800 + index * 1900)
    ));
    state.prototypeTimer = window.setTimeout(() => dissolveToRadio("ended"), 9200);
  }

  function getFallbackVideo(video) {
    const fallback = state.recommendation?.adaptive_music_intelligence?.fallbacks?.fallback_video ||
      state.recommendation?.final_output?.fallbacks?.fallback_video;

    if (!fallback || fallback.video_id === video?.video_id) return null;

    return {
      platform: "youtube",
      title: fallback.title,
      artist: fallback.artist,
      video_id: fallback.video_id || fallback.youtube_video_id,
      youtube_video_id: fallback.video_id || fallback.youtube_video_id,
      youtube_embed_status: fallback.youtube_embed_status || "unverified",
      embed_confirmed: fallback.youtube_embed_status === "api_confirmed",
      playback_mode: "prototype_stand_in_until_youtube_data_api_confirms_embeddable",
      selection_reason: fallback.reason,
    };
  }

  function handleVideoError(event, video) {
    const code = event?.data ?? "unknown";
    const fallback = getFallbackVideo(video);
    state.currentVideoTelemetry?.error?.({ error_code: String(code), playback_mode: video?.playback_mode || "youtube_iframe_api" });

    if (state.recommendation) {
      state.recommendation.playback_events = [
        ...(state.recommendation.playback_events || []),
        {
          type: "youtube_player_error",
          code,
          video_id: video?.video_id || null,
          handled_at: new Date().toISOString(),
          action: fallback ? "fallback_video" : "prototype_frame_then_radio",
        },
      ];
      renderJson(state.recommendation);
    }

    if (fallback && forceLiveVideoAllowed && fallback.embed_confirmed) {
      startHeroVideo(fallback);
      return;
    }

    renderPrototypeHeroFrame(fallback || video, `YouTube embed returned ${code}; using safe prototype handoff`);
  }

  async function startHeroVideo(video) {
    if (!playerMount || (!video?.local_video_file && !video?.video_id)) return;

    clearPrototypeTimer();
    clearYoutubeTelemetryTimer();
    clearLocalHeroVideo();
    state.handoffStarted = false;
    setStatus("hero video");
    playerMount.setAttribute("aria-hidden", "false");
    playerMount.classList.add("is-active");
    if (placeholder) placeholder.classList.add("is-behind-player");

    if (state.youtubePlayer?.destroy) {
      state.youtubePlayer.destroy();
      state.youtubePlayer = null;
    }

    if (video.local_video_file) {
      const telemetry = beginVideoTelemetry(video, "local_mp4");
      playerMount.innerHTML = "";
      const localVideo = document.createElement("video");
      localVideo.className = "adaptive-video-local-video";
      localVideo.controls = true;
      localVideo.playsInline = true;
      localVideo.preload = "auto";
      localVideo.src = video.local_video_file;
      localVideo.setAttribute("aria-label", `${video.artist} - ${video.title}`);
      localVideo.addEventListener("playing", () => {
        setStatus("playing");
        telemetry.start({ playback_mode: "local_mp4" });
        window.__iamAdaptiveEnvironment?.duckRadio?.();
      });
      localVideo.addEventListener("timeupdate", () => {
        const percent = localVideo.duration ? (localVideo.currentTime / localVideo.duration) * 100 : 0;
        telemetry.progress(percent, {
          playback_mode: "local_mp4",
          video_current_time: Math.round(localVideo.currentTime || 0),
          video_duration: Math.round(localVideo.duration || 0),
        });
      });
      localVideo.addEventListener("ended", () => {
        telemetry.complete({
          playback_mode: "local_mp4",
          video_current_time: Math.round(localVideo.currentTime || 0),
          video_duration: Math.round(localVideo.duration || 0),
        });
        dissolveToRadio("ended");
      });
      localVideo.addEventListener("error", () => {
        telemetry.error({ playback_mode: "local_mp4", error_code: "local_video_error" });
        if (video.video_id) {
          startHeroVideo({ ...video, local_video_file: null, embed_confirmed: true });
        } else {
          renderPrototypeHeroFrame(video, "local video unavailable; using safe prototype handoff");
        }
      }, { once: true });
      playerMount.append(localVideo);
      localVideo.play().catch(() => {
        setStatus("play");
        if (playButton) playButton.hidden = false;
      });
      return;
    }

    if (verifyMode || (!forceLiveVideoAllowed && !video.embed_confirmed)) {
      renderPrototypeHeroFrame(video, video.embed_confirmed ? "verified local playback frame" : "waiting for YouTube Data API embeddable confirmation");
      return;
    }

    playerMount.innerHTML = "";
    const mountId = `youtube-hero-${Date.now().toString(36)}`;
    const mount = document.createElement("div");
    mount.id = mountId;
    playerMount.append(mount);
    const telemetry = beginVideoTelemetry(video, "youtube");

    try {
      const yt = await loadYouTubeApi();
      state.youtubePlayer = new yt.Player(mountId, {
        host: "https://www.youtube-nocookie.com",
        videoId: video.video_id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady(event) {
            event.target.playVideo();
          },
          onStateChange(event) {
            if (event.data === yt.PlayerState.PLAYING) {
              setStatus("playing");
              telemetry.start({ playback_mode: "youtube_iframe_api" });
              clearYoutubeTelemetryTimer();
              state.youtubeTelemetryTimer = window.setInterval(() => {
                const duration = Number(state.youtubePlayer?.getDuration?.() || 0);
                const current = Number(state.youtubePlayer?.getCurrentTime?.() || 0);
                const percent = duration ? (current / duration) * 100 : 0;
                telemetry.progress(percent, {
                  playback_mode: "youtube_iframe_api",
                  video_current_time: Math.round(current),
                  video_duration: Math.round(duration),
                });
              }, 1500);
              window.__iamAdaptiveEnvironment?.duckRadio?.();
            }

            if (event.data === yt.PlayerState.ENDED) {
              clearYoutubeTelemetryTimer();
              telemetry.complete({ playback_mode: "youtube_iframe_api" });
              dissolveToRadio("ended");
            }
          },
          onAutoplayBlocked() {
            setStatus("play");
            if (playButton) playButton.hidden = false;
          },
          onError(event) {
            handleVideoError(event, video);
          },
        },
      });
    } catch {
      renderPrototypeHeroFrame(video, "YouTube IFrame API unavailable; using safe prototype handoff");
    }
  }

  async function dissolveToRadio(reason) {
    if (state.handoffStarted) return;
    state.handoffStarted = true;
    clearYoutubeTelemetryTimer();
    if (reason === "skip") {
      analyticsRecord("video_skip", {
        selected_track_id: activeTrackId(),
        reason,
      });
    } else if (reason === "ended" && state.currentVideoTelemetry) {
      state.currentVideoTelemetry.complete({ playback_mode: "handoff" });
    }
    setStatus(reason === "skip" ? "radio" : "dissolve");
    document.body.classList.add("adaptive-video-handoff");

    try {
      state.youtubePlayer?.stopVideo?.();
    } catch {
      // Cross-origin players can reject commands during teardown.
    }
    clearLocalHeroVideo();

    clearPrototypeTimer();

    await wait(820);
    const radio = state.recommendation?.final_output?.extended_session || {};
    if (!radio.catalogue_ready || radio.format !== "radio") {
      setStatus("no extended session");
      return;
    }
    clearRadioTelemetryTimer();
    state.radioStartedAt = Date.now();
    analyticsRecord("radio_start", {
      selected_track_id: activeTrackId(),
      music_room_id: radio.music_room || null,
      station_label: radio.station_label || null,
      transition_reason: reason,
    });
    state.radioTelemetryTimer = window.setInterval(() => {
      analyticsRecord("radio_progress", {
        selected_track_id: activeTrackId(),
        music_room_id: radio.music_room || null,
        station_label: radio.station_label || null,
        listen_seconds: Math.round((Date.now() - state.radioStartedAt) / 1000),
      });
    }, 30000);
    const radioStart = window.__iamAdaptiveEnvironment?.startRadio?.();
    if (radioStart?.catch) {
      radioStart.catch(() => {
        // The visual handoff should still complete if browser audio autoplay is delayed or blocked.
      });
    }
    if (playerMount) playerMount.setAttribute("aria-hidden", "true");
    setStatus("streaming radio");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const checkin = input?.value.trim() || "";
    if (!checkin) {
      input?.focus();
      return;
    }

    document.body.classList.remove("adaptive-video-handoff");
    if (form) form.dataset.loading = "true";
    if (playButton) playButton.hidden = true;
    if (skipButton) skipButton.hidden = true;
    if (playerMount) {
      playerMount.classList.remove("is-active");
      playerMount.setAttribute("aria-hidden", "true");
    }
    if (placeholder) {
      placeholder.classList.remove("is-behind-player");
      placeholder.classList.add("is-thinking");
    }

    setStatus("needs analysis");

    const environmentContext = await getEnvironmentContext();
    const inference = await inferNeeds(`I am ${checkin.replace(/^i\s+am\s+/i, "")}`, environmentContext);
    persistInference(inference, checkin);

    setStatus("music intelligence");
    const recommendation = await recommendVideo(checkin, inference, environmentContext);
    state.recommendation = recommendation;
    state.extendedSessionIndex += 1;
    updateFirstPartyEngagementSummary(recommendation);
    analyticsRecord("music_recommendation", {
      selected_track_id: recommendation.final_output?.hero_music_video?.selected_track_id || null,
      music_room_id: recommendation.final_output?.extended_session?.music_room || null,
      confidence: recommendation.final_output?.hero_music_video?.selection_confidence || 0,
      source_priority: recommendation.final_output?.hero_music_video?.source_priority || null,
    });
    safeSet(window.sessionStorage, "iamLatestMusicVideoRecommendation", recommendation);
    safeSet(window.localStorage, "iamLatestMusicVideoRecommendation", recommendation);
    renderRecommendation(recommendation);

    if (placeholder) placeholder.classList.remove("is-thinking");
    if (form) form.dataset.loading = "false";

    await wait(320);
    startHeroVideo(recommendation.final_output.hero_music_video);
  }

  function bindJsonToggle() {
    if (!jsonToggle || !jsonPanel) return;

    jsonToggle.addEventListener("click", () => {
      const collapsed = jsonPanel.classList.toggle("is-collapsed");
      jsonToggle.textContent = collapsed ? "show" : "hide";
      jsonToggle.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  function bindControls() {
    form?.addEventListener("submit", handleSubmit);
    playButton?.addEventListener("click", () => {
      if (state.youtubePlayer?.playVideo) {
        state.youtubePlayer.playVideo();
      } else if (state.recommendation) {
        startHeroVideo(state.recommendation.final_output.hero_music_video);
      }
    });
    skipButton?.addEventListener("click", () => dissolveToRadio("skip"));
    window.addEventListener("iam:first-party-analytics", () => {
      if (!state.recommendation) return;
      updateFirstPartyEngagementSummary(state.recommendation);
      renderJson(state.recommendation);
    });
    bindJsonToggle();
  }

  bindControls();
}());
