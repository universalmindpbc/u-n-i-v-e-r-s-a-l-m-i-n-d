(function () {
  const EVENT_STORE_KEY = "iamFirstPartyAnalyticsEvents";
  const SESSION_KEY = "iamFirstPartyAnalyticsSession";
  const MAX_EVENTS = 700;
  const SCHEMA_VERSION = "iam_first_party_analytics_v0.1";
  const now = () => Date.now();
  const pageStartedAt = now();
  const emittedScrollDepths = new Set();

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function safeRead(key, fallback) {
    try {
      return safeJsonParse(window.localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // First-party analytics should never interrupt the citizen experience.
    }
  }

  function randomId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }

  function getSession() {
    const existing = safeRead(SESSION_KEY, null);
    if (existing?.id && now() - Number(existing.started_at || 0) < 30 * 60 * 1000) {
      return existing;
    }

    const session = {
      id: randomId("session"),
      started_at: now(),
      schema_version: SCHEMA_VERSION,
    };
    safeWrite(SESSION_KEY, session);
    return session;
  }

  function sanitizeParams(params) {
    const allowed = {};
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || typeof value === "function") return;
      if (/checkin|self_report|free_text|email|phone|name|message/i.test(key)) return;
      if (typeof value === "string") {
        allowed[key] = value.slice(0, 160);
        return;
      }
      if (typeof value === "number" || typeof value === "boolean" || value === null) {
        allowed[key] = value;
        return;
      }
      if (Array.isArray(value)) {
        allowed[key] = value.map((item) => String(item).slice(0, 80)).slice(0, 12);
      }
    });
    return allowed;
  }

  function readEvents() {
    const events = safeRead(EVENT_STORE_KEY, []);
    return Array.isArray(events) ? events : [];
  }

  function writeEvents(events) {
    safeWrite(EVENT_STORE_KEY, events.slice(-MAX_EVENTS));
  }

  function record(name, params = {}) {
    if (!name) return null;
    const session = getSession();
    const event = {
      schema_version: SCHEMA_VERSION,
      event_id: randomId("event"),
      event_name: String(name).slice(0, 80),
      event_time: new Date().toISOString(),
      event_time_ms: now(),
      session_id: session.id,
      page_path: window.location.pathname,
      page_title: document.title,
      params: sanitizeParams(params),
    };
    writeEvents([...readEvents(), event]);
    window.dispatchEvent(new CustomEvent("iam:first-party-analytics", { detail: event }));
    return event;
  }

  function latestSessionEvents() {
    const session = getSession();
    return readEvents().filter((event) => event.session_id === session.id);
  }

  function summarizeForReranker(trackId) {
    const events = latestSessionEvents();
    const trackEvents = trackId
      ? events.filter((event) => !event.params?.selected_track_id || event.params.selected_track_id === trackId)
      : events;
    const videoPercents = trackEvents
      .filter((event) => /^video_/.test(event.event_name))
      .map((event) => Number(event.params?.video_percent || 0))
      .filter(Number.isFinite);
    const radioSeconds = trackEvents
      .filter((event) => /^radio_/.test(event.event_name))
      .map((event) => Number(event.params?.listen_seconds || 0))
      .filter(Number.isFinite);
    const emojiEngagement = {};

    trackEvents
      .filter((event) => event.event_name === "emoji_reaction" && event.params?.emoji_type)
      .forEach((event) => {
        const key = event.params.emoji_type;
        emojiEngagement[key] = (emojiEngagement[key] || 0) + 1;
      });

    return {
      video_completion_ratio: Math.max(0, ...videoPercents) / 100,
      radio_listen_seconds: Math.max(0, ...radioSeconds),
      dwell_seconds: Math.round((now() - pageStartedAt) / 1000),
      click_count: trackEvents.filter((event) => event.event_name === "click").length,
      skip_count: trackEvents.filter((event) => event.event_name === "video_skip").length,
      return_visits: readEvents().filter((event) => event.event_name === "page_view" && event.page_path === window.location.pathname).length,
      emoji_engagement: emojiEngagement,
    };
  }

  function bindPassivePageSignals() {
    record("page_view", {
      referrer_host: document.referrer ? new URL(document.referrer).host : "",
    });

    document.addEventListener("click", (event) => {
      const target = event.target?.closest?.("a, button, [role='button']");
      if (!target) return;
      const isVideoSkip = target.getAttribute("data-video-skip") !== null;
      record("click", {
        control: isVideoSkip ? "video_skip" : target.getAttribute("data-nav-item") || target.type || target.tagName?.toLowerCase(),
        outbound: target.tagName === "A" && target.host && target.host !== window.location.host,
      });
    }, { capture: true });

    window.addEventListener("scroll", () => {
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const depth = Math.round((window.scrollY / scrollable) * 100);
      [25, 50, 75, 90].forEach((threshold) => {
        if (depth >= threshold && !emittedScrollDepths.has(threshold)) {
          emittedScrollDepths.add(threshold);
          record("scroll", { percent_scrolled: threshold });
        }
      });
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        record("engagement_tick", {
          dwell_seconds: Math.round((now() - pageStartedAt) / 1000),
        });
      }
    });
  }

  window.IAMFirstPartyAnalytics = {
    version: SCHEMA_VERSION,
    record,
    readEvents,
    latestSessionEvents,
    summarizeForReranker,
    clear() {
      writeEvents([]);
    },
  };

  bindPassivePageSignals();
}());
