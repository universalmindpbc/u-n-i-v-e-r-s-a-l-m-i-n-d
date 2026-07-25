(function () {
  const closeButtons = Array.from(document.querySelectorAll("[data-sex-ed-close]"));
  const episodeLinks = Array.from(document.querySelectorAll('a[href="sex-ed-episode-01.html"]'));
  const episodeVideo = document.querySelector("[data-sex-ed-episode-video]");
  const episodeStart = document.querySelector("[data-sex-ed-episode-start]");
  let episodeNeedsInitialSeek = true;

  if (window.self !== window.top) {
    document.documentElement.dataset.adaptiveFrame = "embedded";
    document.documentElement.dataset.musicTelevisionFrame = "embedded";
  }

  function returnToTelevision() {
    if (window.self !== window.top) {
      window.top.postMessage({ type: "iam:return-to-television" }, window.location.origin);
      return;
    }
    window.location.href = "index.html";
  }

  async function setSexEdProgramme(active) {
    try {
      if (!active) {
        window.top.IAMTelevisionRoom?.setProgrammeMixLevel?.(null);
        return;
      }
      window.top.IAMTelevisionRoom?.setProgrammeMixLevel?.(.15);
      const activeChannelId = window.top.IAMMusicChannels?.getState?.().broadcast?.channelId || "";
      if (activeChannelId !== "party-james-bondage") {
        await window.top.IAMMusicChannels?.joinBroadcast?.("party-james-bondage");
      }
      window.top.IAMTelevisionRoom?.setProgrammeMixLevel?.(.15);
    } catch {
      // The standalone episode remains usable without the television shell.
    }
  }

  closeButtons.forEach((button) => {
    button.addEventListener("click", returnToTelevision);
  });
  episodeLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (window.self === window.top) return;
      event.preventDefault();
      window.top.postMessage({ type: "iam:open-sex-ed-episode", episode: "01" }, window.location.origin);
    });
  });

  setSexEdProgramme(true);
  window.addEventListener("pagehide", () => setSexEdProgramme(false));
  window.addEventListener("beforeunload", () => setSexEdProgramme(false));

  if (episodeVideo) {
    const applyEpisodeStart = async () => {
      if (!episodeNeedsInitialSeek) return;
      const startTime = Math.max(0, Number(episodeVideo.dataset.sexEdStartTime || 0));
      if (episodeVideo.readyState < 1) {
        await new Promise((resolve) => {
          const timeout = window.setTimeout(resolve, 4500);
          episodeVideo.addEventListener("loadedmetadata", () => {
            window.clearTimeout(timeout);
            resolve();
          }, { once: true });
        });
      }
      try {
        episodeVideo.currentTime = startTime;
        episodeVideo.dataset.sexEdStartApplied = String(startTime);
        episodeNeedsInitialSeek = false;
      } catch {}
    };
    const requestEpisodePlayback = async () => {
      episodeVideo.dataset.streamPlayRequestedAt = String(window.performance?.now?.() || Date.now());
      await applyEpisodeStart();
      const playAttempt = window.IAMStreamController?.play?.(episodeVideo) || episodeVideo.play();
      playAttempt?.catch?.(() => {
        if (episodeStart) episodeStart.hidden = false;
      });
    };

    episodeStart?.addEventListener("click", (event) => {
      event.stopPropagation();
      requestEpisodePlayback();
    });
    episodeVideo.addEventListener("click", () => {
      if (episodeVideo.paused || episodeVideo.ended) requestEpisodePlayback();
      else episodeVideo.pause();
    });
    episodeVideo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") requestEpisodePlayback();
    });
    episodeVideo.addEventListener("play", () => {
      if (episodeStart) episodeStart.hidden = true;
    });
    episodeVideo.addEventListener("playing", () => {
      if (episodeStart) episodeStart.hidden = true;
    });
    episodeVideo.addEventListener("pause", () => {
      if (episodeStart) episodeStart.hidden = false;
    });
    episodeVideo.addEventListener("ended", () => {
      episodeNeedsInitialSeek = true;
      if (episodeStart) episodeStart.hidden = false;
    });
  }
}());
