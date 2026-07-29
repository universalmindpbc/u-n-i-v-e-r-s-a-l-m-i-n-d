(() => {
  "use strict";

  const isStaging = window.location.hostname === "staging.universalmind.tv";
  const endpoint = "/vogue/iam/api/citizen-data/v1";
  const documentVersion = "arrival-consent-v2";
  const purposes = Object.freeze([
    "core_checkin_processing",
    "cross_session_memory",
    "universal_one_conversation_memory",
  ]);
  const sensitiveLocalKeys = Object.freeze([
    "iamLatestCheckinValue",
    "iamLatestCheckinUpdated",
    "citizenNeedsLatestCheckinValue",
    "citizenNeedsLatestCheckinUpdated",
    "iamLatestInference",
    "citizenNeedsLatestInference",
    "iamPendingCheckInPipeline",
  ]);

  function clearLegacySensitiveLocalStorage() {
    sensitiveLocalKeys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Restricted storage modes remain supported.
      }
    });
  }

  async function request(path, { method = "GET", body } = {}) {
    if (!isStaging) throw new Error("citizen_data_staging_only");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 65000);

    try {
      const response = await fetch(`${endpoint}${path}`, {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: body ? {
          "Content-Type": "application/json",
          "X-Universal-Mind-Request": "citizen-data-v1",
        } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.error || "citizen_data_unavailable");
        error.status = response.status;
        throw error;
      }
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function consentStatus() {
    if (!isStaging) return { granted: false, reason: "staging_only" };
    return request("/consent/status");
  }

  async function acceptConsent() {
    const accepted = await request("/consent/accept", {
      method: "POST",
      body: { documentVersion, purposes },
    });
    clearLegacySensitiveLocalStorage();
    return accepted;
  }

  async function recordCheckin(checkin) {
    if (typeof checkin !== "string" || !checkin.trim()) {
      throw new Error("citizen_data_checkin_required");
    }
    const session = await request("/sessions", {
      method: "POST",
      body: {
        locale: navigator.language || "en-AU",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney",
      },
    });
    return request("/checkins", {
      method: "POST",
      body: {
        sessionId: session.id,
        idempotencyKey: window.crypto.randomUUID(),
        checkin: checkin.trim(),
        clientCreatedAt: new Date().toISOString(),
      },
    });
  }

  async function requestExport() {
    return request("/data/export", { method: "POST", body: {} });
  }

  async function requestErasure() {
    const result = await request("/data", { method: "DELETE", body: {} });
    clearLegacySensitiveLocalStorage();
    try {
      window.sessionStorage.clear();
    } catch {
      // Restricted storage modes remain supported.
    }
    return result;
  }

  window.IAMCitizenData = Object.freeze({
    enabled: isStaging,
    documentVersion,
    purposes,
    consentStatus,
    acceptConsent,
    recordCheckin,
    requestExport,
    requestErasure,
    clearLegacySensitiveLocalStorage,
  });
})();
