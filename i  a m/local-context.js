(function () {
  const storageKey = "iamLocalEnvironmentContext";
  const revealDuration = 1500;
  const revealGap = 120;
  const weatherCacheMaxAge = 30 * 60 * 1000;

  const timezoneAnchors = {
    "Australia/Sydney": { label: "Sydney", lat: -33.8688, lng: 151.2093 },
    "Australia/Melbourne": { label: "Melbourne", lat: -37.8136, lng: 144.9631 },
    "Australia/Brisbane": { label: "Brisbane", lat: -27.4698, lng: 153.0251 },
    "Australia/Adelaide": { label: "Adelaide", lat: -34.9285, lng: 138.6007 },
    "Australia/Perth": { label: "Perth", lat: -31.9523, lng: 115.8613 },
    "America/New_York": { label: "New York", lat: 40.7128, lng: -74.0060 },
    "America/Los_Angeles": { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    "America/Chicago": { label: "Chicago", lat: 41.8781, lng: -87.6298 },
    "America/Denver": { label: "Denver", lat: 39.7392, lng: -104.9903 },
    "Europe/London": { label: "London", lat: 51.5072, lng: -0.1276 },
    "Europe/Paris": { label: "Paris", lat: 48.8566, lng: 2.3522 },
    "Europe/Rome": { label: "Rome", lat: 41.9028, lng: 12.4964 },
    "Asia/Tokyo": { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
    "Asia/Seoul": { label: "Seoul", lat: 37.5665, lng: 126.9780 },
    "Asia/Shanghai": { label: "Shanghai", lat: 31.2304, lng: 121.4737 },
    "Asia/Dubai": { label: "Dubai", lat: 25.2048, lng: 55.2708 },
  };

  const locationAnchors = [
    { label: "Avoca Beach", regionLabel: "Central Coast, NSW", lat: -33.4647, lng: 151.4358 },
    { label: "Bondi Beach", regionLabel: "Eastern Sydney", lat: -33.8915, lng: 151.2767 },
    { label: "Sydney", regionLabel: "Sydney region", lat: -33.8688, lng: 151.2093 },
    { label: "Byron Bay", lat: -28.6474, lng: 153.6020 },
    { label: "Uluru", lat: -25.3444, lng: 131.0369 },
    { label: "Fiji", lat: -17.7134, lng: 178.0650 },
    { label: "Bali", lat: -8.3405, lng: 115.0920 },
    { label: "Seoul", lat: 37.5665, lng: 126.9780 },
    { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { label: "Shanghai", lat: 31.2304, lng: 121.4737 },
    { label: "Dubai", lat: 25.2048, lng: 55.2708 },
    { label: "Delhi", lat: 28.6139, lng: 77.2090 },
    { label: "London", lat: 51.5072, lng: -0.1276 },
    { label: "Paris", lat: 48.8566, lng: 2.3522 },
    { label: "New York", lat: 40.7128, lng: -74.0060 },
    { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { label: "San Diego", lat: 32.7157, lng: -117.1611 },
    { label: "Fort Liberty", lat: 35.1434, lng: -78.9922 },
    { label: "Cape Town", lat: -33.9249, lng: 18.4241 },
  ];

  const weatherLabels = new Map([
    [0, "Clear"],
    [1, "Mostly Clear"],
    [2, "Partly Cloudy"],
    [3, "Cloudy"],
    [45, "Fog"],
    [48, "Fog"],
    [51, "Drizzle"],
    [53, "Drizzle"],
    [55, "Drizzle"],
    [56, "Freezing Drizzle"],
    [57, "Freezing Drizzle"],
    [61, "Rain"],
    [63, "Rain"],
    [65, "Heavy Rain"],
    [66, "Freezing Rain"],
    [67, "Freezing Rain"],
    [71, "Snow"],
    [73, "Snow"],
    [75, "Heavy Snow"],
    [77, "Snow Grains"],
    [80, "Rain Showers"],
    [81, "Rain Showers"],
    [82, "Heavy Showers"],
    [85, "Snow Showers"],
    [86, "Snow Showers"],
    [95, "Storm"],
    [96, "Storm"],
    [99, "Storm"],
  ]);

  let contextPromise = null;
  let revealRun = 0;

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function safeGet(key) {
    try {
      const stored = window.localStorage?.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private or restricted modes.
    }
  }

  function resolvedTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }

  function formatLocalTime(date) {
    const parts = new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value || "";
    const minute = parts.find((part) => part.type === "minute")?.value || "00";
    const period = (parts.find((part) => part.type === "dayPeriod")?.value || "")
      .toLowerCase()
      .replace(/\s+/g, "");

    return `${hour}:${minute}${period}`;
  }

  function timeOfDay(date) {
    const hour = date.getHours();
    if (hour < 5) return "late_night";
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
  }

  function fallbackLabelFromTimeZone(timezone) {
    const city = timezone.split("/").pop() || "";
    return city ? city.replace(/_/g, " ") : "Local";
  }

  function timeRegionLabel(anchor, timezone) {
    const label = anchor?.label || fallbackLabelFromTimeZone(timezone);
    return label ? `${label} time` : "Local time";
  }

  function permissionedLocationLabel(nearest) {
    if (!nearest) return "Nearby region";
    return nearest.regionLabel || `near ${nearest.label}`;
  }

  function roundedWeatherCoords(location) {
    return {
      lat: Number(Number(location.lat).toFixed(1)),
      lng: Number(Number(location.lng).toFixed(1)),
    };
  }

  function distanceKm(first, second) {
    const earthRadius = 6371;
    const lat1 = first.lat * Math.PI / 180;
    const lat2 = second.lat * Math.PI / 180;
    const deltaLat = (second.lat - first.lat) * Math.PI / 180;
    const deltaLng = (second.lng - first.lng) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function nearestLocation(coords) {
    return locationAnchors
      .map((anchor) => ({
        ...anchor,
        distance: distanceKm(coords, anchor),
      }))
      .sort((first, second) => first.distance - second.distance)[0];
  }

  async function grantedGeolocation() {
    if (!navigator.geolocation) return null;

    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state !== "granted") return null;
      } else {
        return null;
      }
    } catch {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        {
          enableHighAccuracy: false,
          maximumAge: 30 * 60 * 1000,
          timeout: 4200,
        }
      );
    });
  }

  async function resolveLocation() {
    const timezone = resolvedTimeZone();
    const position = await grantedGeolocation();

    if (position?.coords) {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const nearest = nearestLocation(coords);

      return {
        label: nearest?.distance <= 70 ? permissionedLocationLabel(nearest) : "Nearby region",
        precision: "approximate",
        source: "browser_geolocation_permission",
        lat: coords.lat,
        lng: coords.lng,
      };
    }

    const anchor = timezoneAnchors[timezone];
    if (anchor) {
      return {
        label: timeRegionLabel(anchor, timezone),
        precision: "none",
        source: "browser_timezone",
        lat: anchor.lat,
        lng: anchor.lng,
      };
    }

    return {
      label: timezone ? timeRegionLabel(null, timezone) : null,
      precision: "none",
      source: timezone ? "browser_timezone" : "unavailable",
      lat: null,
      lng: null,
    };
  }

  function cachedWeatherFor(location) {
    const cached = safeGet(storageKey);
    if (!cached?.weather || !location?.lat || !location?.lng) return null;
    if (Date.now() - Number(cached.weather.updatedAt || 0) > weatherCacheMaxAge) return null;

    const cachedCoords = cached.weather.coords;
    if (!cachedCoords) return null;
    const drift = distanceKm(
      { lat: location.lat, lng: location.lng },
      { lat: cachedCoords.lat, lng: cachedCoords.lng }
    );

    return drift <= 35 ? cached.weather : null;
  }

  async function fetchWeather(location) {
    if (!location?.lat || !location?.lng || !window.fetch) return null;

    const cached = cachedWeatherFor(location);
    if (cached) return cached;

    const controller = window.AbortController ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 4200) : 0;
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(Number(location.lat).toFixed(3)));
    url.searchParams.set("longitude", String(Number(location.lng).toFixed(3)));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("timezone", "auto");

    try {
      const response = await fetch(url.href, {
        signal: controller?.signal,
        cache: "no-store",
      });
      if (!response.ok) return null;

      const payload = await response.json();
      const current = payload.current || {};
      const temperature = Number(current.temperature_2m);
      const code = Number(current.weather_code);

      return {
        condition: weatherLabels.get(code) || "Current Weather",
        temperature_celsius: Number.isFinite(temperature) ? Math.round(temperature) : null,
        code: Number.isFinite(code) ? code : null,
        coords: roundedWeatherCoords(location),
        updatedAt: Date.now(),
        source: "open-meteo",
      };
    } catch {
      return null;
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  function toGPTContext(context) {
    return {
      local_time: context.local_time,
      location_label: context.location_label || null,
      location_precision: context.location_precision || "none",
      location_source: context.location_source || context.sources?.location || null,
      weather_condition: context.weather_condition || null,
      temperature_celsius: context.temperature_celsius,
      context_available: Boolean(context.context_available),
      context_role: "adaptive_environment_only",
    };
  }

  function weatherLabel(context) {
    if (context.temperature_celsius !== null && context.weather_condition) {
      return `${context.temperature_celsius}\u00b0 | ${context.weather_condition}`;
    }

    if (context.weather_condition) return context.weather_condition;
    return "Weather Unavailable";
  }

  function updateDisplays(context) {
    document.querySelectorAll("[data-local-time]").forEach((node) => {
      node.textContent = context.local_time || "";
    });

    document.querySelectorAll("[data-local-weather]").forEach((node) => {
      node.textContent = weatherLabel(context);
    });

    document.querySelectorAll("[data-local-location]").forEach((node) => {
      node.textContent = context.location_label || "Local";
    });
  }

  async function getContext(options = {}) {
    if (contextPromise && !options.refresh) return contextPromise;

    contextPromise = (async () => {
      const now = new Date();
      const timezone = resolvedTimeZone();
      const location = await resolveLocation();
      const weather = await fetchWeather(location);

      const context = {
        local_time: formatLocalTime(now),
        local_time_iso: now.toISOString(),
        timezone,
        time_of_day: timeOfDay(now),
        location_label: location.label,
        location_precision: location.precision,
        location_source: location.source,
        weather_condition: weather?.condition || null,
        temperature_celsius: weather?.temperature_celsius ?? null,
        context_available: true,
        context_role: "adaptive_environment_only",
        sources: {
          time: "browser_clock",
          location: location.source,
          weather: weather?.source || "unavailable",
        },
      };

      context.gpt = toGPTContext(context);
      safeSet(storageKey, {
        ...context,
        weather,
      });
      updateDisplays(context);
      return context;
    })();

    return contextPromise;
  }

  async function revealHomepageContext() {
    const container = document.querySelector("[data-local-context]");
    if (!container) return;

    const runId = revealRun + 1;
    revealRun = runId;
    const lines = Array.from(container.querySelectorAll("[data-local-context-line]"));

    container.classList.remove("is-context-complete");
    lines.forEach((line, index) => {
      line.style.setProperty("--context-index", String(index + 1));
      line.classList.remove("is-context-visible", "is-context-done");
      line.getBoundingClientRect();
    });

    await getContext().catch(() => null);
    await wait(revealGap);

    for (const line of lines) {
      if (runId !== revealRun) return;
      line.classList.add("is-context-visible");
      await wait(revealDuration);
      if (runId !== revealRun) return;
      line.classList.add("is-context-done");
    }

    if (runId === revealRun) {
      container.classList.add("is-context-complete");
    }
  }

  function initLocalContext(options = {}) {
    const cached = safeGet(storageKey);
    if (cached) updateDisplays(cached);

    return getContext({ refresh: Boolean(options.refresh) }).catch(() => null);
  }

  const cached = safeGet(storageKey);
  if (cached) updateDisplays(cached);

  window.IAMLocalContext = {
    getContext,
    init: initLocalContext,
    revealHomepageContext,
    toGPTContext,
  };

  initLocalContext();
}());
