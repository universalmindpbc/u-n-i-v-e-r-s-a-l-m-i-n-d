(function () {
  const pipeline = window.IAMCheckInPipeline;
  if (!pipeline?.readPending || !pipeline?.process) return;

  const pending = pipeline.readPending();
  if (!pending?.phrase) return;

  const queuedAt = Number(pending.queuedAt || 0);
  const isFresh = queuedAt > 0 && Date.now() - queuedAt < 5 * 60 * 1000;
  if (!isFresh) {
    pipeline.clearPending?.();
    return;
  }

  document.body.classList.remove("adaptive-music-selection-ready", "adaptive-music-selection-failed");
  document.body.classList.add("adaptive-music-selection-loading");
  document.body.dataset.adaptiveSelectionState = "loading";

  window.dispatchEvent(new CustomEvent("iam:checkin-pipeline-started", {
    detail: { phrase: pending.phrase, queuedAt },
  }));

  if (window.IAMCitizenData?.enabled) {
    window.IAMCitizenData.recordCheckin(pending.phrase).then((result) => {
      window.dispatchEvent(new CustomEvent("iam:citizen-checkin-recorded", { detail: result }));
    }).catch((error) => {
      window.dispatchEvent(new CustomEvent("iam:citizen-checkin-record-error", {
        detail: { error: String(error?.message || error || "unavailable") },
      }));
    });
  }

  pipeline.process(pending.phrase).then((result) => {
    document.body.classList.remove("adaptive-music-selection-loading", "adaptive-music-selection-failed");
    document.body.classList.add("adaptive-music-selection-ready");
    document.body.dataset.adaptiveSelectionState = "ready";
    window.dispatchEvent(new CustomEvent("iam:checkin-pipeline-complete", { detail: result }));
  }).catch((error) => {
    pipeline.clearPending?.();
    document.body.classList.remove("adaptive-music-selection-loading", "adaptive-music-selection-ready");
    document.body.classList.add("adaptive-music-selection-failed");
    document.body.dataset.adaptiveSelectionState = "fallback";
    window.dispatchEvent(new CustomEvent("iam:checkin-pipeline-error", {
      detail: { error: String(error?.message || error || "unavailable") },
    }));
  });
}());
