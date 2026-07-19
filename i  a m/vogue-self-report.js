const vogueLoopVideo = document.querySelector("[data-music-video][data-loop-start]");

if (vogueLoopVideo) {
  const loopStart = Number(vogueLoopVideo.dataset.loopStart) || 858;

  function resumeVogueLoopVideo() {
    if (document.hidden || !vogueLoopVideo.isConnected) return;
    vogueLoopVideo.muted = true;
    vogueLoopVideo.defaultMuted = true;
    vogueLoopVideo.setAttribute("muted", "");
    const playAttempt = window.IAMStreamController?.play(vogueLoopVideo) || vogueLoopVideo.play();
    playAttempt?.catch?.(() => {});
  }

  function seekToLoopStart() {
    if (Number.isFinite(vogueLoopVideo.duration) && vogueLoopVideo.duration > loopStart) {
      vogueLoopVideo.currentTime = loopStart;
    }
  }

  vogueLoopVideo.addEventListener("loadedmetadata", seekToLoopStart, { once: true });
  vogueLoopVideo.addEventListener("ended", () => {
    seekToLoopStart();
    resumeVogueLoopVideo();
  });
  vogueLoopVideo.addEventListener("canplay", resumeVogueLoopVideo);
  vogueLoopVideo.addEventListener("pause", () => {
    if (!document.hidden) window.setTimeout(resumeVogueLoopVideo, 120);
  });
  vogueLoopVideo.addEventListener("timeupdate", () => {
    if (vogueLoopVideo.currentTime < loopStart - 1) {
      seekToLoopStart();
    }
  });

  if (vogueLoopVideo.readyState >= 1) {
    seekToLoopStart();
  }

  window.addEventListener("pageshow", resumeVogueLoopVideo);
  window.addEventListener("focus", resumeVogueLoopVideo);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resumeVogueLoopVideo();
  });
  window.setTimeout(resumeVogueLoopVideo, 0);
  window.setTimeout(resumeVogueLoopVideo, 600);
}

const vogueIamForm = document.querySelector("[data-iam-form]");
const vogueIamDisplay = document.querySelector("[data-iam-display]");
const vogueIamInput = document.querySelector("[data-iam-input]");

if (vogueIamForm && vogueIamDisplay && vogueIamInput) {
  const exampleSequence = [
    { text: "I am anxious", hold: 1750 },
    { text: "I am alone", hold: 1650 },
    { text: "I am not enough", hold: 1850 },
    { text: "I am strong", hold: 1650 },
    { text: "I am...", hold: 0 },
  ];
  const sequenceTimers = [];
  let isExampleSequenceStopped = false;

  function clearExampleTimers() {
    while (sequenceTimers.length) {
      window.clearTimeout(sequenceTimers.pop());
    }
  }

  function stopExampleSequence() {
    isExampleSequenceStopped = true;
    clearExampleTimers();
    vogueIamForm.classList.remove("is-example-typing");
  }

  function scheduleExample(delay, callback) {
    const timer = window.setTimeout(callback, delay);
    sequenceTimers.push(timer);
  }

  function typeExample(index = 0) {
    if (isExampleSequenceStopped || vogueIamForm.dataset.state !== "idle") return;

    const example = exampleSequence[index];
    if (!example) return;

    vogueIamForm.classList.remove("is-example-typing");
    vogueIamDisplay.getBoundingClientRect();
    vogueIamDisplay.textContent = example.text;
    vogueIamDisplay.style.setProperty("--iam-example-width", `${example.text.length}ch`);
    vogueIamDisplay.style.setProperty("--iam-example-steps", String(example.text.length));
    vogueIamForm.classList.add("is-example-typing");

    if (index < exampleSequence.length - 1) {
      scheduleExample(1100 + example.hold, () => typeExample(index + 1));
    }
  }

  function isTextEntryTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true']"));
  }

  function captureFirstTypedCharacter(event) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.key.length !== 1 ||
      isTextEntryTarget(event.target) ||
      vogueIamForm.classList.contains("is-busy")
    ) {
      return;
    }

    stopExampleSequence();
    event.preventDefault();
    vogueIamInput.focus({ preventScroll: true });
    vogueIamInput.value = `${vogueIamInput.value}${event.key}`;
    vogueIamInput.setSelectionRange(vogueIamInput.value.length, vogueIamInput.value.length);
    vogueIamInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  document.addEventListener("keydown", captureFirstTypedCharacter);

  ["pointerdown", "focusin", "keydown", "input", "submit"].forEach((eventName) => {
    vogueIamForm.addEventListener(eventName, stopExampleSequence, { capture: true, once: true });
  });

  scheduleExample(3300, () => typeExample(0));
}
