(() => {
  const video = document.querySelector("[data-impact-video]");
  const chapters = Array.from(document.querySelectorAll("[data-impact-chapter]"));
  const pagination = Array.from(document.querySelectorAll(".impact-pagination a"));

  if (video) {
    const reveal = () => video.classList.add("is-ready");
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    if (video.readyState >= 2) reveal();
    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("canplay", reveal, { once: true });
    video.addEventListener("volumechange", () => {
      if (!video.muted || video.volume !== 0) {
        video.muted = true;
        video.volume = 0;
      }
    });
  }

  const activate = (chapter) => {
    const index = chapters.indexOf(chapter);
    pagination.forEach((link, linkIndex) => link.classList.toggle("is-active", linkIndex === index));
  };

  if (chapters.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible) activate(visible.target);
    }, { threshold: [0.36, 0.55, 0.72] });
    chapters.forEach((chapter) => observer.observe(chapter));
  } else if (chapters[0]) {
    activate(chapters[0]);
  }

  pagination[0]?.classList.add("is-active");
})();
