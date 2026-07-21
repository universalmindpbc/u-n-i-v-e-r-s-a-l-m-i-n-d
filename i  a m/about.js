(function () {
  "use strict";

  const routingUrl = new URL(window.location.href);
  const musicTelevisionFrame = window.self !== window.top &&
    routingUrl.searchParams.get("musicTelevisionFrame") === "1";
  const invalidEmbeddedRoute = !musicTelevisionFrame && (
    window.self !== window.top ||
    routingUrl.searchParams.get("adaptiveFrame") === "1" ||
    routingUrl.searchParams.get("musicTelevisionFrame") === "1"
  );

  if (musicTelevisionFrame) {
    window.__iamMusicTelevisionFrame = true;
  }

  ["adaptiveFrame", "musicTelevisionFrame", "aboutTopLevel"].forEach((parameter) => {
    routingUrl.searchParams.delete(parameter);
  });

  if (invalidEmbeddedRoute) {
    try {
      window.top.location.replace(routingUrl.href);
    } catch {
      window.location.replace(routingUrl.href);
    }
    return;
  }

  if (window.location.href !== routingUrl.href) {
    window.history.replaceState(window.history.state, "", routingUrl.href);
  }

  const chapters = Array.from(document.querySelectorAll("[data-about-chapter]"));
  const chapterLinks = new Map(
    Array.from(document.querySelectorAll("[data-chapter-link]")).map((link) => [
      link.dataset.chapterLink,
      link,
    ])
  );

  const setActiveChapter = (chapterId) => {
    chapterLinks.forEach((link, id) => {
      const active = id === chapterId;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if ("IntersectionObserver" in window && chapters.length) {
    const visibleChapters = new Map();
    const chapterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleChapters.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleChapters.delete(entry.target.id);
          }
        });

        const active = Array.from(visibleChapters.entries()).sort((a, b) => b[1] - a[1])[0];
        if (active) setActiveChapter(active[0]);
      },
      { rootMargin: "-15% 0px -55%", threshold: [0, 0.2, 0.45, 0.7] }
    );

    chapters.forEach((chapter) => chapterObserver.observe(chapter));
  }

  const flow = document.querySelector("[data-about-flow]");
  if (!flow) return;

  const nodes = Array.from(flow.querySelectorAll("[data-flow-node]")).sort(
    (a, b) => Number(a.dataset.flowNode) - Number(b.dataset.flowNode)
  );
  const centre = flow.querySelector("[data-flow-centre]");
  const publisher = flow.querySelector("[data-flow-publisher]");
  const arrows = Array.from(flow.querySelectorAll("[data-flow-arrow]"));
  const control = flow.querySelector("[data-flow-control]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const publishers = ["VOGUE.COM/IAM", "VICE.COM/IAM", "BOILERROOM.TV/IAM", "RA.CO/IAM"];
  let timers = [];
  let cycleTimer = 0;
  let publisherTimer = 0;
  let isPaused = false;
  let inView = false;

  const clearSequence = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
    window.clearInterval(publisherTimer);
    window.clearTimeout(cycleTimer);
    publisherTimer = 0;
    cycleTimer = 0;
  };

  const showComplete = () => {
    clearSequence();
    flow.classList.add("is-running", "is-complete");
    nodes.forEach((node) => node.classList.add("is-visible"));
    centre?.classList.add("is-visible");
    arrows.forEach((arrow) => arrow.classList.add("is-visible"));
    if (publisher) publisher.textContent = publishers[0];
  };

  const resetSequence = () => {
    clearSequence();
    flow.classList.remove("is-running", "is-complete");
    nodes.forEach((node) => node.classList.remove("is-visible"));
    centre?.classList.remove("is-visible");
    arrows.forEach((arrow) => arrow.classList.remove("is-visible"));
    if (publisher) publisher.textContent = publishers[0];
  };

  const runSequence = () => {
    if (isPaused || !inView) return;
    if (reducedMotion.matches) {
      showComplete();
      return;
    }

    resetSequence();
    flow.classList.add("is-running");

    nodes.forEach((node, index) => {
      timers.push(window.setTimeout(() => node.classList.add("is-visible"), 700 + index * 1050));
    });

    timers.push(
      window.setTimeout(() => {
        centre?.classList.add("is-visible");
        let publisherIndex = 0;
        publisherTimer = window.setInterval(() => {
          publisherIndex = (publisherIndex + 1) % publishers.length;
          if (publisher) publisher.textContent = publishers[publisherIndex];
        }, 1350);
      }, 7300)
    );

    timers.push(
      window.setTimeout(() => {
        arrows.forEach((arrow) => arrow.classList.add("is-visible"));
        flow.classList.add("is-complete");
      }, 8400)
    );

    cycleTimer = window.setTimeout(runSequence, 14800);
  };

  control?.addEventListener("click", () => {
    isPaused = !isPaused;
    control.setAttribute("aria-pressed", String(isPaused));
    control.textContent = isPaused ? "play sequence" : "pause sequence";

    if (isPaused) {
      showComplete();
    } else {
      runSequence();
    }
  });

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) {
      showComplete();
    } else if (!isPaused) {
      runSequence();
    }
  });

  if ("IntersectionObserver" in window) {
    const flowObserver = new IntersectionObserver(
      (entries) => {
        inView = Boolean(entries[0]?.isIntersecting);
        if (inView && !isPaused) {
          runSequence();
        } else if (!inView) {
          clearSequence();
        }
      },
      { threshold: 0.28 }
    );
    flowObserver.observe(flow);
  } else {
    inView = true;
    runSequence();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearSequence();
    } else if (inView && !isPaused) {
      runSequence();
    }
  });
})();
