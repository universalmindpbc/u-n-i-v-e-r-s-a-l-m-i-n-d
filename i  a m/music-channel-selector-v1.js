(function () {
  const VERSION = "music_channel_selector_v1.0";
  const DISTRESS_NEEDS = [
    "Anxiety", "Stress", "Fear", "Hypervigilance", "Startle Sensitivity",
    "Intrusions", "Mental Load", "Fatigue", "Sleep Pressure", "Sleep Disturbance",
  ];
  const MUSIC_ROOM_FORMATS = {
    "inner-planes": ["videos", "parties", "radio"],
    "champagne-bohemia": ["videos", "parties", "radio"],
    "modul8-infinity": ["videos", "parties", "radio"],
    "james-bondage": ["videos", "parties", "radio"],
    "safety-cushion": ["videos"],
  };

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function slug(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  function normalizedNeeds(needs) {
    const result = {};
    Object.entries(needs || {}).forEach(([name, value]) => {
      const number = Number(value);
      if (Number.isFinite(number)) result[slug(name)] = clamp(number);
    });
    return result;
  }

  function needFit(record, citizenNeeds) {
    const needs = normalizedNeeds(citizenNeeds);
    const scores = record?.need_scores || record?.citizen_need_scores || {};
    let weighted = 0;
    let weight = 0;
    Object.entries(scores).forEach(([name, affinity]) => {
      const citizenValue = needs[slug(name)];
      const recordValue = Number(affinity);
      if (!Number.isFinite(citizenValue) || !Number.isFinite(recordValue)) return;
      const signalWeight = .35 + citizenValue * .65;
      weighted += clamp(recordValue) * citizenValue * signalWeight;
      weight += citizenValue * signalWeight;
    });
    return weight ? weighted / weight : .5;
  }

  function sensoryLoad(citizenNeeds) {
    const needs = normalizedNeeds(citizenNeeds);
    const values = DISTRESS_NEEDS
      .map((name) => needs[slug(name)])
      .filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function contextFit(record, context) {
    const mode = record?.mode || context.mode;
    const workFit = Number(record?.context?.work_fit ?? .5);
    const groupFit = Number(record?.context?.group_fit ?? .5);
    const loadFit = Number(record?.context?.high_load_fit ?? .5);
    let score = .5;
    if (context.atWork === true) score += (workFit - .5) * .64;
    if (context.inGroup === true) score += (groupFit - .5) * .52;
    score += (loadFit - .5) * context.sensoryLoad * .48;
    if (mode === "parties" && context.atWork === true) score -= .22;
    if (mode === "radio" && context.atWork === true) score += .12;
    return clamp(score);
  }

  function rank(records, options = {}) {
    const mode = options.mode || "videos";
    const context = {
      mode,
      atWork: options.atWork === true,
      inGroup: options.inGroup === true,
      sensoryLoad: sensoryLoad(options.citizenNeeds),
    };
    const taste = options.tasteAffinities || {};
    const recent = Array.isArray(options.recentIds) ? options.recentIds : [];
    const seed = String(options.seed || "universal-mind");
    const eligibleRecords = (records || []).filter((record) => {
      const musicRoom = record.editorial_id || record.editorialId || record.music_room || record.musicRoom;
      const allowedFormats = record.allowed_formats || MUSIC_ROOM_FORMATS[musicRoom];
      if (Array.isArray(allowedFormats) && !allowedFormats.includes(mode)) return false;
      if (musicRoom === "safety-cushion" && record.catalogue_status !== "ready") return false;
      return true;
    });
    const ranked = eligibleRecords.map((record, editorialIndex) => {
      const id = String(record.id || record.station_id || record.track_id || editorialIndex);
      const tensor = needFit(record, options.citizenNeeds);
      const contextual = contextFit(record, context);
      const affinity = clamp(taste[id] ?? .5);
      const novelty = stableUnit(`${seed}:${mode}:${id}:exploration`);
      const recentIndex = recent.indexOf(id);
      const repetitionPenalty = recentIndex < 0 ? 0 : Math.max(.08, .28 - recentIndex * .04);
      const editorial = clamp(record.editorial_priority == null ? .7 : 1 - (Number(record.editorial_priority) - 1) * .08);
      const score = tensor * .42 + contextual * .2 + affinity * .16 + novelty * .12 + editorial * .1 - repetitionPenalty;
      return { ...record, recommendation_score: Number(score.toFixed(6)), recommendation_factors: { tensor, contextual, affinity, novelty, repetitionPenalty } };
    }).sort((a, b) => b.recommendation_score - a.recommendation_score);

    const limit = Math.max(1, Math.min(Number(options.limit) || 3, ranked.length));
    const recommendations = ranked.slice(0, limit);
    if (limit >= 3 && ranked.length > 4) {
      const exploreWindow = ranked.slice(3, Math.min(ranked.length, 7));
      const exploreIndex = Math.floor(stableUnit(`${seed}:${mode}:adjacent`) * exploreWindow.length);
      const explorer = exploreWindow[exploreIndex];
      if (explorer && stableUnit(`${seed}:${mode}:exploration-slot`) < .28) recommendations[2] = explorer;
    }

    const recommendationIds = new Set(recommendations.map((record) => record.id));
    return {
      version: VERSION,
      mode,
      recommendations,
      ranked: [...recommendations, ...ranked.filter((record) => !recommendationIds.has(record.id))],
      context,
      explorationRate: .28,
    };
  }

  function explicitWorkContext(inference) {
    const values = [
      inference?.environment_context?.at_work,
      inference?.adaptive_environment?.environment_context?.at_work,
      inference?.context_modifiers?.at_work,
      inference?.citizen_context?.at_work,
      inference?.at_work,
    ];
    return values.some((value) => value === true || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "at_work");
  }

  function chooseContinuationMode(options = {}) {
    const atWork = options.atWork === true;
    const inGroup = options.inGroup === true;
    const load = sensoryLoad(options.citizenNeeds);
    if (atWork) return { mode: "radio", reason: "explicit_work_context", partyPrior: .7, radioPrior: .3 };
    if (load >= .68) return { mode: "radio", reason: "lower_sensory_load", partyPrior: .7, radioPrior: .3 };
    if (inGroup) return { mode: "parties", reason: "shared_room_context", partyPrior: .7, radioPrior: .3 };
    const unit = stableUnit(`${options.seed || "universal-mind"}:party-radio:${options.sequence || 0}`);
    return {
      mode: unit < .7 ? "parties" : "radio",
      reason: unit < .7 ? "seventy_percent_party_prior" : "thirty_percent_radio_prior",
      partyPrior: .7,
      radioPrior: .3,
    };
  }

  function feedbackWeight(type) {
    return ({ explicit_select: 1, dwell_30_seconds: .45, repeat_select: .82, quick_switch: -.2, completed: .62, queued_vote: .74 })[type] ?? .25;
  }

  window.IAMMusicChannelSelector = {
    version: VERSION,
    rank,
    sensoryLoad,
    explicitWorkContext,
    chooseContinuationMode,
    feedbackWeight,
  };
}());
