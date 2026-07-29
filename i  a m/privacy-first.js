(function () {
  "use strict";

  const stage = document.querySelector("[data-privacy-stage]");
  const control = document.querySelector("[data-privacy-control]");
  if (!stage) return;

  const items = Array.from(document.querySelectorAll("[data-sequence-step]"))
    .sort((a, b) => Number(a.dataset.sequenceStep) - Number(b.dataset.sequenceStep));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timers = [];
  let cycleTimer = 0;
  let isPaused = false;
  let inView = false;

  const clearSequence = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
    window.clearTimeout(cycleTimer);
    cycleTimer = 0;
  };

  const showComplete = () => {
    clearSequence();
    stage.classList.add("is-running", "is-complete");
    items.forEach((item) => item.classList.add("is-visible"));
  };

  const resetSequence = () => {
    clearSequence();
    stage.classList.remove("is-running", "is-complete");
    items.forEach((item) => item.classList.remove("is-visible"));
  };

  const runSequence = () => {
    if (isPaused || !inView) return;
    if (reducedMotion.matches) {
      showComplete();
      return;
    }

    resetSequence();
    stage.classList.add("is-running");

    items.forEach((item, index) => {
      timers.push(window.setTimeout(() => item.classList.add("is-visible"), 650 + index * 460));
    });

    timers.push(window.setTimeout(() => stage.classList.add("is-complete"), 6500));
    cycleTimer = window.setTimeout(runSequence, 13200);
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
    const observer = new IntersectionObserver(
      (entries) => {
        inView = Boolean(entries[0]?.isIntersecting);
        if (inView && !isPaused) {
          runSequence();
        } else if (!inView) {
          clearSequence();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(stage);
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
