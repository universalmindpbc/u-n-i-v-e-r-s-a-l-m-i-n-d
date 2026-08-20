(() => {
  const video = document.querySelector("[data-induction-alternate-video]");
  if (video) {
    const initialStart = Number(video.dataset.initialStart || 0);
    let initialStartApplied = false;

    const applyInitialStart = () => {
      if (
        initialStartApplied ||
        !Number.isFinite(initialStart) ||
        initialStart <= 0 ||
        !Number.isFinite(video.duration) ||
        video.duration <= initialStart
      ) return;

      try {
        video.currentTime = initialStart;
        initialStartApplied = true;
        video.dataset.initialStartApplied = "true";
      } catch {}
    };

    video.addEventListener("loadedmetadata", applyInitialStart);
    video.addEventListener("durationchange", applyInitialStart);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) applyInitialStart();
  }

  const logo = document.querySelector("[data-induction-alternate-logo]");
  if (logo) {
    const revealLogo = async () => {
      try {
        if (logo.decode) await logo.decode();
      } catch {}
      if (logo.naturalWidth > 0) logo.dataset.logoReady = "true";
    };

    if (logo.complete) revealLogo();
    else logo.addEventListener("load", revealLogo, { once: true });
  }

  const reveal = () => {
    window.requestAnimationFrame(() => {
      document.documentElement.classList.add("is-ready");
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal, { once: true });
  } else {
    reveal();
  }
})();
