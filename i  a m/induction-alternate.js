(() => {
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
