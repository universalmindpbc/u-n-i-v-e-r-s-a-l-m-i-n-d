(function () {
  const closeButtons = Array.from(document.querySelectorAll("[data-sex-ed-close]"));
  const episodeVideo = document.querySelector("[data-sex-ed-episode-video]");
  const episodeStart = document.querySelector("[data-sex-ed-episode-start]");

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

  setSexEdProgramme(true);
  window.addEventListener("pagehide", () => setSexEdProgramme(false));
  window.addEventListener("beforeunload", () => setSexEdProgramme(false));

  if (episodeVideo) {
    const requestEpisodePlayback = () => {
      episodeVideo.dataset.streamPlayRequestedAt = String(window.performance?.now?.() || Date.now());
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
      if (episodeStart) episodeStart.hidden = false;
    });
  }
}());
