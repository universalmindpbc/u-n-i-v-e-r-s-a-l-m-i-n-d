(function () {
  const room = document.querySelector("[data-television-room]");
  const buttons = Array.from(document.querySelectorAll("[data-story-tree-start]"));
  if (!room || !buttons.length) return;

  const STAGES = Object.freeze([
    "CHALLENGE",
    "CAUSE I",
    "CAUSE II",
    "CAUSE III",
    "NERVOUS SYSTEM RESET",
    "SOLUTION I",
    "SOLUTION II",
    "SOLUTION III",
    "BEAUTIFUL NEW WORLD",
  ]);
  const RESET_DURATION_MS = 10 * 60 * 1000;
  const RESET_RISE_DELAY_MS = 1500;
  const RESET_RISE_DURATION_MS = 7000;
  const RESET_RETURN_DURATION_MS = 5500;
  const testMode = window.__IAM_STORY_TREE_TEST__ === true;
  let active = false;
  let starting = false;
  let currentStageIndex = -1;
  let completedStages = new Set();
  let resetTimer = 0;
  let resetReturnTimer = 0;
  let resetStartTimer = 0;
  let resetActive = false;

  const STORY_TREE_INSTRUCTIONS = `# Story Tree experience
You are guiding the visitor through Universal Mind's Story Tree as one natural, emotionally present voice conversation. This is not a survey. Do not announce stage numbers, read a list, or sound clinical. Listen and respond briefly to what the visitor actually says, then let the conversation grow organically through the exact nine-stage framework below.

The work is for a current challenge or irritation, not a life-or-death experience. At the beginning, say naturally: “I know you might have a few things on your mind today, but let's just gently focus on one. Something that isn't going to make you feel entirely uncomfortable, but something you'd like to grow past and resolve today.” If the visitor brings an acute safety concern or a traumatic event they are not comfortable holding, do not process it through Story Tree; follow the existing Universal One wellbeing support guide and invite them to pause this experience.

The exact order and questions are:
1. CHALLENGE — “What's the challenge you'd like to focus on today?”
2. CAUSE I — “What's the first reason that's causing this challenge?”
3. CAUSE II — “What's another reason that's causing this challenge?”
4. CAUSE III — “What's a third and final reason that's causing this challenge?”
5. NERVOUS SYSTEM RESET — after the visitor answers CAUSE III, while that stage is still active, briefly reflect the shape of what they have shared without claiming to fix or neutralise it. Explain in one natural sentence that Universal One will become quiet while the music, brain entrainment and current visual experience come forward for the ten-minute Nervous System Reset, then ask whether they are ready. Only after they agree, call story_tree_progress for NERVOUS SYSTEM RESET. The application will then begin the reset without another spoken response.
6. SOLUTION I — “What's the first thing that might improve this challenge?”
7. SOLUTION II — “What's another thing that might improve this challenge?”
8. SOLUTION III — “What's a third and final thing that might improve this challenge?”
9. BEAUTIFUL NEW WORLD — bring the three solutions together into one coherent Beautiful New World in the visitor's own language. Do not invent details or reduce it to a tiny percentage change. Close with these exact words: “Together, let's create a beautiful new world.”

Before beginning each stage, call story_tree_progress with its exact stage name. Do not say the tool name or stage machinery aloud. After the function result, continue the conversation, except for NERVOUS SYSTEM RESET: ask for readiness first as directed above, call that stage only after the visitor agrees, and then remain quiet. The application will pause the microphone and your voice for the ten-minute reset and invite you back for SOLUTION I when it completes.

This is an experimental research experience. Do not diagnose, prescribe treatment, promise healing, or claim a guaranteed clinical benefit. Do not dilute the visitor's challenge, the exact questions, nervous system reset, brain entrainment, or Beautiful New World into generic wellness language.`;

  const STORY_TREE_TOOLS = Object.freeze([
    {
      type: "function",
      name: "story_tree_progress",
      description: "Advance the active Story Tree conversation to the next exact stage. Call once before speaking each stage. Never include or repeat the visitor's answer in the arguments.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          stage: {
            type: "string",
            enum: STAGES,
            description: "The exact Story Tree stage that is beginning.",
          },
        },
        required: ["stage"],
      },
    },
  ]);

  buttons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (active || starting) return;
    start().catch(handleStartError);
  }));
  window.addEventListener("pagehide", () => end({ endVoice: true }));

  async function start(options = {}) {
    if (active || starting) return false;
    const voice = window.IAMRealtimeVoiceAssistant;
    if (!voice?.start) throw new Error("Universal One is still getting ready.");
    if (voice.getState?.().active || voice.getState?.().starting) {
      throw new Error("Finish the current Universal One conversation before beginning Story Tree.");
    }

    starting = true;
    window.clearTimeout(resetStartTimer);
    window.clearTimeout(resetTimer);
    window.clearTimeout(resetReturnTimer);
    currentStageIndex = -1;
    completedStages = new Set();
    resetActive = false;
    setButtonsActive(true);
    document.body.classList.add("story-tree-active");
    document.body.dataset.storyTreeActive = "true";
    document.body.dataset.storyTreePhase = "conversation";
    window.dispatchEvent(new CustomEvent("iam:story-tree-open"));

    const started = await voice.start({
      microphone: options.microphone !== false,
      experience: "story_tree",
      instructions: STORY_TREE_INSTRUCTIONS,
      tools: STORY_TREE_TOOLS,
      initialResponse: {
        instructions: "Begin the Story Tree now. Follow the exact Story Tree instructions, call story_tree_progress for CHALLENGE before speaking, and make the opening feel like a human conversation rather than a survey.",
      },
      onFunctionCall: handleFunctionCall,
      onEvent: handleVoiceEvent,
      onEnd: handleVoiceEnd,
    });
    if (started === false) throw new Error("Universal One is already in another conversation.");
    active = true;
    starting = false;
    return true;
  }

  function handleFunctionCall(call) {
    if (!active || call?.name !== "story_tree_progress") {
      return { accepted: false, code: "story_tree_inactive" };
    }
    let args = {};
    try { args = JSON.parse(call.arguments || "{}"); } catch {}
    if (!args || typeof args !== "object" || Array.isArray(args) || Object.keys(args).length !== 1 || !("stage" in args)) {
      return { accepted: false, code: "invalid_story_tree_arguments" };
    }
    const stage = String(args.stage || "");
    const requestedIndex = STAGES.indexOf(stage);
    const expectedIndex = currentStageIndex + 1;
    if (requestedIndex < 0) {
      return { accepted: false, code: "invalid_story_tree_stage" };
    }
    if (requestedIndex !== expectedIndex) {
      return { accepted: false, code: "unexpected_story_tree_stage" };
    }

    setStage(stage);
    if (stage === "NERVOUS SYSTEM RESET") {
      resetActive = true;
      document.body.dataset.storyTreePhase = "reset-pending";
      return {
        accepted: true,
        stage,
        continueResponse: false,
      };
    }
    return {
      accepted: true,
      stage,
      continueResponse: true,
    };
  }

  function handleVoiceEvent(detail = {}) {
    if (!active) return;
    if (resetActive && document.body.dataset.storyTreePhase === "reset-pending" && detail.type === "assistant_audio_stopped") {
      beginReset();
    } else if (
      resetActive
      && document.body.dataset.storyTreePhase === "reset-pending"
      && detail.type === "function_call_completed"
      && detail.stage === "NERVOUS SYSTEM RESET"
    ) {
      window.clearTimeout(resetStartTimer);
      resetStartTimer = window.setTimeout(() => beginReset(), 250);
    }
  }

  function handleVoiceEnd() {
    if (active || starting) end({ endVoice: false });
  }

  function setStage(stage) {
    const nextIndex = STAGES.indexOf(stage);
    if (currentStageIndex >= 0) completedStages.add(STAGES[currentStageIndex]);
    currentStageIndex = nextIndex;
    document.body.dataset.storyTreeStage = stage;
    if (stage === "BEAUTIFUL NEW WORLD") {
      completedStages.add(stage);
      document.body.dataset.storyTreePhase = "complete";
    }
  }

  function beginReset(options = {}) {
    if (!active || !resetActive) return false;
    window.clearTimeout(resetStartTimer);
    window.clearTimeout(resetTimer);
    window.clearTimeout(resetReturnTimer);
    document.body.dataset.storyTreePhase = "reset";
    window.IAMRealtimeVoiceAssistant?.setMicrophonePaused?.(true, { label: "Nervous System Reset" });
    window.IAMTelevisionAudio?.setStoryTreeConversationMix?.({
      ducked: false,
      delayMs: RESET_RISE_DELAY_MS,
      durationMs: RESET_RISE_DURATION_MS,
    });
    const duration = testMode && Number.isFinite(options.durationMs) ? Math.max(0, options.durationMs) : RESET_DURATION_MS;
    const riseLeadIn = testMode ? 0 : RESET_RISE_DELAY_MS + RESET_RISE_DURATION_MS;
    resetTimer = window.setTimeout(completeReset, riseLeadIn + duration);
    return true;
  }

  function completeReset() {
    if (!active || !resetActive) return false;
    window.clearTimeout(resetTimer);
    resetTimer = 0;
    document.body.dataset.storyTreePhase = "reset-return";
    window.IAMTelevisionAudio?.setStoryTreeConversationMix?.({
      ducked: true,
      delayMs: 0,
      durationMs: RESET_RETURN_DURATION_MS,
    });
    const returnDelay = testMode ? 0 : RESET_RETURN_DURATION_MS;
    resetReturnTimer = window.setTimeout(() => {
      if (!active) return;
      resetActive = false;
      document.body.dataset.storyTreePhase = "conversation";
      window.IAMRealtimeVoiceAssistant?.requestResponse?.({
        instructions: "The ten-minute Nervous System Reset has completed. Return gently, acknowledge the music without analysing it, then continue the exact Story Tree sequence by calling story_tree_progress for SOLUTION I before asking its exact question.",
      });
      window.IAMRealtimeVoiceAssistant?.setMicrophonePaused?.(false, { label: "I'm listening" });
    }, returnDelay);
    return true;
  }

  function end(options = {}) {
    if (!active && !starting) return false;
    window.clearTimeout(resetTimer);
    window.clearTimeout(resetReturnTimer);
    window.clearTimeout(resetStartTimer);
    resetStartTimer = 0;
    resetTimer = 0;
    resetReturnTimer = 0;
    const shouldEndVoice = options.endVoice !== false;
    active = false;
    starting = false;
    resetActive = false;
    currentStageIndex = -1;
    completedStages.clear();
    window.IAMTelevisionAudio?.cancelStoryTreeConversationMix?.();
    if (shouldEndVoice) window.IAMRealtimeVoiceAssistant?.end?.("Story Tree complete", { quiet: true });
    setButtonsActive(false);
    document.body.classList.remove("story-tree-active");
    delete document.body.dataset.storyTreeActive;
    delete document.body.dataset.storyTreeStage;
    delete document.body.dataset.storyTreePhase;
    return true;
  }

  function setButtonsActive(isActive) {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("is-active", isActive);
    });
  }

  function handleStartError(error) {
    void error;
    window.setTimeout(() => end({ endVoice: true }), 1800);
  }

  window.IAMStoryTree = {
    version: "story_tree_v1",
    stages: STAGES,
    start,
    end,
    getState() {
      return {
        active,
        starting,
        stage: STAGES[currentStageIndex] || "",
        stageIndex: currentStageIndex,
        completedStages: Array.from(completedStages),
        resetActive,
        resetDurationMs: RESET_DURATION_MS,
        resetRiseDelayMs: RESET_RISE_DELAY_MS,
        resetRiseDurationMs: RESET_RISE_DURATION_MS,
        resetReturnDurationMs: RESET_RETURN_DURATION_MS,
        persistedResponseData: false,
      };
    },
    test: testMode ? {
      progress(stage) {
        return handleFunctionCall({ name: "story_tree_progress", arguments: JSON.stringify({ stage }) });
      },
      beginReset(durationMs = 0) {
        return beginReset({ durationMs });
      },
      completeReset,
    } : undefined,
  };
}());
