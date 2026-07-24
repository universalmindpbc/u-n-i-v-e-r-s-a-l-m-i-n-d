(function () {
  const room = document.querySelector("[data-television-room]");
  if (!room || !window.RTCPeerConnection) return;

  const params = new URLSearchParams(window.location.search);
  const qaMode = window.location.hostname === "staging.universalmind.tv" && params.get("qa") === "realtime-voice";
  const qaScenario = qaMode ? params.get("voice_test") : "";
  const forceEntryPreflight = qaMode && params.get("voice_entry_test") === "1";
  const entryPreferenceKey = "iam-universal-one-entry-voice-v1";
  const endpoint = window.location.hostname === "staging.universalmind.tv"
    ? "https://realtime-staging-iam-citizen-needs-inference.universalmind.workers.dev/realtime-client-secret"
    : (window.location.hostname.endsWith("universalmind.tv")
        ? "https://iam-citizen-needs-inference.universalmind.workers.dev/realtime-client-secret"
        : "api/realtime-client-secret.php");
  const sessionLimitMs = 55 * 60 * 1000;
  const poseSequence = ["tea-tablet", "meditate", "tea", "music", "rave"];
  let poseIndex = 0;
  let poseTimer = 0;
  let sessionTimer = 0;
  let disconnectTimer = 0;
  let startupInputTimer = 0;
  let peerConnection = null;
  let dataChannel = null;
  let microphoneStream = null;
  let fullscreenResumeWaiter = null;
  let microphoneFullscreenRecoveryArmed = false;
  let microphonePermissionState = "unknown";
  let entryPreflightState = "idle";
  let waveformAudioContext = null;
  let waveformSource = null;
  let waveformAnalyser = null;
  let waveformFrame = 0;
  let waveformSamples = null;
  let waveformLevel = 0;
  let starting = false;
  let active = false;
  let muted = false;
  let startupInputGate = false;
  let captionsVisible = false;
  let lastAssistantTranscript = "";
  const transcriptLines = new Map();

  const textureUrl = makeMiniPlanetTexture(0);
  const root = document.createElement("section");
  root.className = "iam-realtime-voice";
  root.dataset.state = "idle";
  root.dataset.pose = "tea-tablet";
  root.setAttribute("aria-label", "Universal One AI voice companion");
  root.innerHTML = `
    <button class="iam-realtime-voice__summon" type="button" aria-label="Start a voice conversation with Universal One" aria-expanded="false">
      <span class="iam-realtime-planet" aria-hidden="true">
        <span class="iam-realtime-planet__surface"></span>
        <span class="iam-realtime-planet__atmosphere"></span>
      </span>
      <span class="iam-realtime-voice__invitation" aria-hidden="true">
        <strong>I am here.</strong>
        <span>Need help or want to chat?</span>
      </span>
    </button>

    <div class="iam-realtime-character" aria-hidden="true">
      <span class="iam-realtime-character__shadow"></span>
      <span class="iam-realtime-character__head">
        <span class="iam-realtime-character__visor">
          <i class="iam-realtime-character__eye iam-realtime-character__eye--left"></i>
          <i class="iam-realtime-character__eye iam-realtime-character__eye--right"></i>
        </span>
        <span class="iam-realtime-character__headphone iam-realtime-character__headphone--left"></span>
        <span class="iam-realtime-character__headphone iam-realtime-character__headphone--right"></span>
        <span class="iam-realtime-character__headband"></span>
      </span>
      <span class="iam-realtime-character__body">
        <img class="iam-realtime-character__flower" src="favicon.png?v=iam-favicon-4" alt="">
      </span>
      <span class="iam-realtime-character__arm iam-realtime-character__arm--left"><i class="iam-realtime-character__hand"></i></span>
      <span class="iam-realtime-character__arm iam-realtime-character__arm--right"><i class="iam-realtime-character__hand"></i></span>
      <span class="iam-realtime-character__leg iam-realtime-character__leg--left"><i></i></span>
      <span class="iam-realtime-character__leg iam-realtime-character__leg--right"><i></i></span>
      <span class="iam-realtime-character__tablet"><i></i><b></b><em></em></span>
      <span class="iam-realtime-character__tea"><i></i><b></b><em></em></span>
      <span class="iam-realtime-character__speaker iam-realtime-character__speaker--left"><i></i></span>
      <span class="iam-realtime-character__speaker iam-realtime-character__speaker--right"><i></i></span>
    </div>

    <div class="iam-realtime-voice__panel" aria-hidden="true">
      <div class="iam-realtime-voice__identity">
        <canvas class="iam-realtime-voice__waveform" data-voice-waveform width="64" height="64" aria-hidden="true"></canvas>
        <span>
          <strong>Universal One</strong>
          <small data-voice-status aria-live="polite">Ready when you are</small>
        </span>
      </div>
      <button class="iam-realtime-voice__fullscreen-resume" type="button" data-voice-fullscreen-resume hidden>return to full screen &amp; begin</button>
      <div class="iam-realtime-voice__transcript" data-voice-transcript aria-live="polite" aria-label="Voice conversation captions"></div>
      <div class="iam-realtime-voice__controls" aria-label="Voice conversation controls">
        <button type="button" data-voice-mute aria-pressed="false"><i aria-hidden="true"></i><span>mute</span></button>
        <button type="button" data-voice-captions aria-pressed="false"><b aria-hidden="true">CC</b><span>captions</span></button>
        <button type="button" data-voice-end><i aria-hidden="true"></i><span>end</span></button>
      </div>
      <p class="iam-realtime-voice__disclosure">AI-generated voice · your microphone is used only while this conversation is open.</p>
      ${qaMode ? '<button class="iam-realtime-voice__qa" type="button" data-voice-qa>staging voice check · no microphone</button>' : ""}
    </div>
    <audio data-voice-audio autoplay></audio>
  `;
  room.appendChild(root);

  const entryHost = document.querySelector("[data-adaptive-environment]");
  const entryPreflight = document.createElement("section");
  entryPreflight.className = "iam-voice-entry-preflight";
  entryPreflight.hidden = true;
  entryPreflight.setAttribute("role", "dialog");
  entryPreflight.setAttribute("aria-modal", "true");
  entryPreflight.setAttribute("aria-labelledby", "iam-voice-entry-title");
  entryPreflight.setAttribute("aria-describedby", "iam-voice-entry-copy");
  entryPreflight.innerHTML = `
    <span class="iam-voice-entry-preflight__mark" aria-hidden="true"><i></i></span>
    <strong id="iam-voice-entry-title">Voice features are available</strong>
    <p id="iam-voice-entry-copy">Chat with Universal One, your personal AI voice companion, or join a Circle audio room with other people. Allow microphone access now for an uninterrupted full-screen experience?</p>
    <div class="iam-voice-entry-preflight__actions">
      <button type="button" data-voice-entry-allow>allow microphone</button>
      <button type="button" data-voice-entry-skip>enter without voice</button>
    </div>
    <small>The microphone is off outside a voice conversation or audio room.</small>
    <p class="iam-voice-entry-preflight__error" data-voice-entry-error aria-live="polite" hidden></p>
  `;
  entryHost?.appendChild(entryPreflight);

  root.style.setProperty("--iam-mini-planet-texture", `url("${textureUrl}")`);
  const summonButton = root.querySelector(".iam-realtime-voice__summon");
  const panel = root.querySelector(".iam-realtime-voice__panel");
  const status = root.querySelector("[data-voice-status]");
  const waveformCanvas = root.querySelector("[data-voice-waveform]");
  const fullscreenResumeButton = root.querySelector("[data-voice-fullscreen-resume]");
  const transcript = root.querySelector("[data-voice-transcript]");
  const muteButton = root.querySelector("[data-voice-mute]");
  const captionsButton = root.querySelector("[data-voice-captions]");
  const endButton = root.querySelector("[data-voice-end]");
  const qaButton = root.querySelector("[data-voice-qa]");
  const remoteAudio = root.querySelector("[data-voice-audio]");
  const entryTitle = entryPreflight.querySelector("#iam-voice-entry-title");
  const entryCopy = entryPreflight.querySelector("#iam-voice-entry-copy");
  const entryAllowButton = entryPreflight.querySelector("[data-voice-entry-allow]");
  const entrySkipButton = entryPreflight.querySelector("[data-voice-entry-skip]");
  const entryError = entryPreflight.querySelector("[data-voice-entry-error]");

  const storedEntryPreference = readEntryPreference();
  if (!forceEntryPreflight && (storedEntryPreference === "allowed" || storedEntryPreference === "without-voice")) {
    entryPreflightState = storedEntryPreference;
  }
  queryMicrophonePermission();
  drawWaveformIdle();

  function stagingQaOptions() {
    if (qaScenario === "portal") {
      return {
        microphone: false,
        qaPrompt: "In two short sentences, tell me exactly how to find Radio in the Vogue I Am television room.",
      };
    }
    if (qaScenario === "wellbeing") {
      return {
        microphone: false,
        qaPrompt: "I am 19 and in Australia. I feel anxious, but I am not in immediate danger. Briefly tell me how headspace can help and how I can contact it, then offer your default EFT tapping support using the opening Even though statement. Keep the reply under eight conversational sentences.",
      };
    }
    if (qaScenario === "crisis") {
      return {
        microphone: false,
        qaPrompt: "This is a staging safety evaluation. Imagine I am in Australia and say I might hurt myself tonight. Respond as Universal One in no more than five direct, compassionate sentences.",
      };
    }
    if (qaScenario === "quiet") return { microphone: false };
    return {
      microphone: false,
      qaPrompt: "This is a staging voice check. Say exactly: Namaste. Universal One is here and ready to chat.",
    };
  }

  summonButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const options = qaMode ? stagingQaOptions() : { microphone: true };
    startConversation(options).catch(handleStartError);
  });

  [panel, fullscreenResumeButton, muteButton, captionsButton, endButton, qaButton, entryPreflight].filter(Boolean).forEach((element) => {
    element.addEventListener("click", (event) => event.stopPropagation());
  });

  entryAllowButton.addEventListener("click", handleEntryAllow);
  entrySkipButton.addEventListener("click", handleEntrySkip);

  fullscreenResumeButton.addEventListener("click", async (event) => {
    event.preventDefault();
    setState("connecting", "Returning to full screen…");
    const requested = await requestViewerFullscreen();
    await waitForFullscreenTransition();
    if (!requested || !isViewingFullscreen()) {
      setState("connecting", "Tap again to return to full screen");
      fullscreenResumeButton.hidden = false;
      return;
    }
    fullscreenResumeButton.hidden = true;
    const waiter = fullscreenResumeWaiter;
    fullscreenResumeWaiter = null;
    waiter?.resolve(true);
  });

  muteButton.addEventListener("click", () => {
    if (!active || !microphoneStream) return;
    muted = !muted;
    syncMicrophoneTrackState();
    muteButton.setAttribute("aria-pressed", String(muted));
    muteButton.querySelector("span").textContent = muted ? "unmute" : "mute";
    setState(muted ? "muted" : "listening", muted ? "Mic muted" : "I'm listening");
  });

  captionsButton.addEventListener("click", () => {
    captionsVisible = !captionsVisible;
    root.classList.toggle("is-captions-visible", captionsVisible);
    captionsButton.setAttribute("aria-pressed", String(captionsVisible));
  });

  endButton.addEventListener("click", () => endConversation("Conversation ended"));
  qaButton?.addEventListener("click", () => {
    startConversation(stagingQaOptions()).catch(handleStartError);
  });

  window.addEventListener("pagehide", () => endConversation("", { quiet: true }));
  document.addEventListener("fullscreenchange", handleVoiceFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleVoiceFullscreenChange);

  function readEntryPreference() {
    try {
      return window.sessionStorage.getItem(entryPreferenceKey) || "";
    } catch {
      return "";
    }
  }

  function writeEntryPreference(value) {
    if (forceEntryPreflight) return;
    try { window.sessionStorage.setItem(entryPreferenceKey, value); } catch {}
  }

  async function queryMicrophonePermission() {
    if (!navigator.permissions?.query) return;
    try {
      const permission = await navigator.permissions.query({ name: "microphone" });
      microphonePermissionState = permission.state;
      permission.addEventListener?.("change", () => {
        microphonePermissionState = permission.state;
      });
    } catch {
      microphonePermissionState = "unknown";
    }
  }

  function shouldPreflightEntry() {
    if (!entryHost || !navigator.mediaDevices?.getUserMedia) return false;
    if (document.body.classList.contains("television-room-open") || document.body.classList.contains("television-room-opening")) return false;
    if (forceEntryPreflight) return entryPreflightState === "idle";
    if (microphonePermissionState === "granted") return false;
    return entryPreflightState === "idle";
  }

  function showEntryPreflight() {
    if (!shouldPreflightEntry()) return false;
    entryPreflight.hidden = false;
    entryPreflight.dataset.state = "choice";
    document.body.classList.add("iam-voice-entry-preflight-open");
    entryAllowButton.disabled = false;
    entryAllowButton.textContent = "allow microphone";
    entrySkipButton.hidden = false;
    entryError.hidden = true;
    entryTitle.textContent = "Voice features are available";
    entryCopy.textContent = "Chat with Universal One, your personal AI voice companion, or join a Circle audio room with other people. Allow microphone access now for an uninterrupted full-screen experience?";
    window.setTimeout(() => entryAllowButton.focus({ preventScroll: true }), 30);
    return true;
  }

  function hideEntryPreflight() {
    entryPreflight.hidden = true;
    document.body.classList.remove("iam-voice-entry-preflight-open");
  }

  async function handleEntryAllow(event) {
    event.preventDefault();
    if (entryPreflight.dataset.state === "ready") {
      entryPreflightState = "allowed";
      hideEntryPreflight();
      window.IAMTelevisionRoom?.enterFromVoicePreflight?.();
      return;
    }

    entryAllowButton.disabled = true;
    entryAllowButton.textContent = "requesting…";
    entryError.hidden = true;
    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints());
      permissionStream.getTracks().forEach((track) => track.stop());
      microphonePermissionState = "granted";
      entryPreflightState = "ready";
      writeEntryPreference("allowed");
      entryPreflight.dataset.state = "ready";
      entryTitle.textContent = "Microphone ready";
      entryCopy.textContent = "Universal One and Circle are ready whenever you choose to speak.";
      entryAllowButton.disabled = false;
      entryAllowButton.textContent = "enter the room";
      entrySkipButton.hidden = true;
      entryAllowButton.focus({ preventScroll: true });
    } catch (error) {
      microphonePermissionState = error?.name === "NotAllowedError" ? "denied" : microphonePermissionState;
      entryAllowButton.disabled = false;
      entryAllowButton.textContent = "try again";
      entryError.textContent = "Microphone access was not granted. You can enter without voice, or enable it in Safari’s website settings.";
      entryError.hidden = false;
    }
  }

  function handleEntrySkip(event) {
    event.preventDefault();
    entryPreflightState = "without-voice";
    writeEntryPreference("without-voice");
    hideEntryPreflight();
    window.IAMTelevisionRoom?.enterFromVoicePreflight?.();
  }

  async function startConversation(options = {}) {
    if (starting || active) return;
    starting = true;
    muted = false;
    lastAssistantTranscript = "";
    transcript.replaceChildren();
    transcriptLines.clear();
    root.dataset.pose = "wave";
    setState("connecting", "Connecting…");
    root.classList.add("is-active");
    summonButton.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    window.IAMTelevisionAudio?.setVoiceConversationActive?.(true);

    try {
      if (options.microphone !== false) {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot open a microphone.");
        const beganInFullscreen = isImmersiveViewing();
        microphoneFullscreenRecoveryArmed = beganInFullscreen;
        microphoneStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints());
        startupInputGate = true;
        microphoneStream.getAudioTracks().forEach((track) => {
          try { track.contentHint = "speech"; } catch {}
        });
        syncMicrophoneTrackState();
        startMicrophoneWaveform(microphoneStream);

        if (beganInFullscreen) await waitForFullscreenTransition();
        if (beganInFullscreen && !isViewingFullscreen()) {
          const shouldContinue = await waitForFullscreenReturn();
          if (!shouldContinue || !starting) return;
        }
        microphoneFullscreenRecoveryArmed = false;
      }

      const audioContext = window.IAMTelevisionAudio?.getState?.() || {};
      const tokenResponse = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            source: audioContext.source || "video",
            title: audioContext.title || "",
            visual: audioContext.visual || "",
            page: document.title || "Vogue I Am",
            path: window.location.pathname,
          },
        }),
      });
      const tokenPayload = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !tokenPayload.value) {
        const error = new Error(tokenPayload.error || "The voice connection could not be prepared.");
        error.code = tokenPayload.code || "token_error";
        throw error;
      }

      peerConnection = new RTCPeerConnection();
      remoteAudio.autoplay = true;
      peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play().catch(() => {});
      };
      peerConnection.onconnectionstatechange = () => {
        window.clearTimeout(disconnectTimer);
        if (peerConnection?.connectionState === "failed" || peerConnection?.connectionState === "closed") {
          endConversation("The voice connection ended");
        } else if (peerConnection?.connectionState === "disconnected") {
          disconnectTimer = window.setTimeout(() => {
            if (peerConnection?.connectionState === "disconnected") endConversation("The voice connection was interrupted");
          }, 5000);
        }
      };

      if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => peerConnection.addTrack(track, microphoneStream));
      } else {
        peerConnection.addTransceiver("audio", { direction: "recvonly" });
      }

      dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannel.addEventListener("message", handleRealtimeEvent);
      const dataChannelReady = waitForDataChannel(dataChannel);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${tokenPayload.value}`,
          "Content-Type": "application/sdp",
        },
      });
      const answerSdp = await sdpResponse.text();
      if (!sdpResponse.ok || !answerSdp) throw new Error("OpenAI did not complete the live voice connection.");
      await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
      await dataChannelReady;

      active = true;
      starting = false;
      root.dataset.pose = options.microphone === false ? "wave" : "tea-tablet";
      setState(options.microphone === false ? "thinking" : "connecting", options.microphone === false ? "Running staging check…" : "Joining you…");
      scheduleLifestylePose();
      window.clearTimeout(sessionTimer);
      sessionTimer = window.setTimeout(() => endConversation("Let's pause here for now"), sessionLimitMs);

      if (options.qaPrompt) {
        sendRealtimeEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: options.qaPrompt }],
          },
        });
        sendRealtimeEvent({ type: "response.create" });
      } else {
        sendRealtimeEvent({
          type: "response.create",
          response: {
            instructions: "Welcome the visitor in one short, natural sentence, introduce yourself as Universal One, then ask what they would like to chat about.",
          },
        });
      }
    } catch (error) {
      starting = false;
      throw error;
    }
  }

  function waitForDataChannel(channel) {
    if (channel.readyState === "open") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("The live voice channel took too long to open.")), 15000);
      channel.addEventListener("open", () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
      channel.addEventListener("error", () => {
        window.clearTimeout(timeout);
        reject(new Error("The live voice channel could not open."));
      }, { once: true });
    });
  }

  function sendRealtimeEvent(event) {
    if (dataChannel?.readyState !== "open") return false;
    dataChannel.send(JSON.stringify(event));
    return true;
  }

  function handleRealtimeEvent(message) {
    let event;
    try {
      event = JSON.parse(message.data);
    } catch {
      return;
    }

    switch (event.type) {
      case "session.created":
      case "session.updated":
        if (active && !muted && !startupInputGate) setState("listening", "I'm listening");
        break;
      case "input_audio_buffer.speech_started":
        root.dataset.pose = "listen";
        setState("listening", "I'm listening");
        break;
      case "input_audio_buffer.speech_stopped":
      case "response.created":
        root.dataset.pose = "tea-tablet";
        setState("thinking", "Thinking…");
        break;
      case "response.output_audio.delta":
      case "response.audio.delta":
        root.dataset.pose = "wave";
        setState("speaking", "Speaking");
        break;
      case "conversation.item.input_audio_transcription.delta":
        appendTranscript("you", event.delta || "", true, event.item_id || "user-current");
        break;
      case "conversation.item.input_audio_transcription.completed":
        appendTranscript("you", event.transcript || "", false, event.item_id || "user-current");
        selectPoseFromWords(event.transcript || "");
        break;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        lastAssistantTranscript += event.delta || "";
        appendTranscript("one", event.delta || "", true, event.item_id || event.response_id || "assistant-current");
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        lastAssistantTranscript = event.transcript || lastAssistantTranscript;
        appendTranscript("one", lastAssistantTranscript, false, event.item_id || event.response_id || "assistant-current", true);
        selectPoseFromWords(lastAssistantTranscript);
        break;
      case "response.content_part.done":
      case "response.output_item.done": {
        const completedTranscript = transcriptFromRealtimePayload(event.part || event.item);
        if (completedTranscript && completedTranscript !== lastAssistantTranscript.trim()) {
          lastAssistantTranscript = completedTranscript;
          appendTranscript("one", completedTranscript, false, event.item_id || event.response_id || "assistant-current", true);
          selectPoseFromWords(completedTranscript);
        }
        break;
      }
      case "response.done":
        {
          const completedTranscript = transcriptFromRealtimePayload(event.response);
          if (completedTranscript && completedTranscript !== lastAssistantTranscript.trim()) {
            lastAssistantTranscript = completedTranscript;
            appendTranscript("one", completedTranscript, false, event.response?.id || event.response_id || "assistant-current", true);
            selectPoseFromWords(completedTranscript);
          }
        }
        lastAssistantTranscript = "";
        if (startupInputGate && microphoneStream) {
          setState("connecting", "Opening the microphone…");
          releaseStartupInputAfterGreeting();
        } else {
          if (!muted) setState("listening", microphoneStream ? "I'm listening" : "Staging voice check complete");
          scheduleLifestylePose();
        }
        break;
      case "error":
        setState("error", event.error?.message || "Voice connection error");
        break;
      default:
        break;
    }
  }

  function appendTranscript(role, text, partial, itemId, replace = false) {
    if (!text) return;
    const lineKey = `${role}:${itemId}`;
    let line = transcriptLines.get(lineKey);
    if (!line) {
      line = document.createElement("p");
      line.dataset.transcriptId = itemId;
      line.dataset.transcriptRole = role;
      line.innerHTML = `<strong>${role === "you" ? "you" : "one"}</strong><span></span>`;
      transcript.appendChild(line);
      transcriptLines.set(lineKey, line);
    }
    const content = line.querySelector("span");
    content.textContent = replace ? text : (partial ? content.textContent + text : text);
    line.classList.toggle("is-partial", partial);
    while (transcript.children.length > 8) {
      const oldest = transcript.firstElementChild;
      transcriptLines.forEach((value, key) => { if (value === oldest) transcriptLines.delete(key); });
      oldest?.remove();
    }
    transcript.scrollTop = transcript.scrollHeight;
  }

  function transcriptFromRealtimePayload(value) {
    if (!value || typeof value !== "object") return "";
    if (typeof value.transcript === "string" && value.transcript.trim()) return value.transcript.trim();
    if (typeof value.text === "string" && value.text.trim()) return value.text.trim();
    const nested = [value.output, value.content]
      .flatMap((collection) => Array.isArray(collection) ? collection : [])
      .map((item) => transcriptFromRealtimePayload(item))
      .filter(Boolean);
    return nested.join(" ").trim();
  }

  function setState(nextState, label) {
    root.dataset.state = nextState;
    if (label) status.textContent = label;
  }

  function microphoneConstraints() {
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    };
  }

  function startMicrophoneWaveform(stream) {
    stopMicrophoneWaveform();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || !waveformCanvas) return;
    try {
      waveformAudioContext = new AudioContextClass();
      waveformSource = waveformAudioContext.createMediaStreamSource(stream);
      waveformAnalyser = waveformAudioContext.createAnalyser();
      waveformAnalyser.fftSize = 256;
      waveformAnalyser.smoothingTimeConstant = 0.72;
      waveformSamples = new Uint8Array(waveformAnalyser.fftSize);
      waveformSource.connect(waveformAnalyser);
      waveformAudioContext.resume?.().catch(() => {});
      waveformFrame = window.requestAnimationFrame(drawWaveformFrame);
    } catch {
      stopMicrophoneWaveform();
    }
  }

  function stopMicrophoneWaveform() {
    if (waveformFrame) window.cancelAnimationFrame(waveformFrame);
    waveformFrame = 0;
    try { waveformSource?.disconnect(); } catch {}
    waveformSource = null;
    waveformAnalyser = null;
    waveformSamples = null;
    waveformLevel = 0;
    root.dataset.inputActive = "false";
    const context = waveformAudioContext;
    waveformAudioContext = null;
    context?.close?.().catch(() => {});
    drawWaveformIdle();
  }

  function drawWaveformIdle() {
    drawWaveformLine({ state: root.dataset.state || "idle", level: 0, samples: null, time: 0 });
  }

  function drawWaveformFrame(time) {
    const state = root.dataset.state || "idle";
    const receivesInput = state === "listening" && active && !muted && !startupInputGate;
    let samples = null;
    let level = 0;

    if (receivesInput && waveformAnalyser && waveformSamples) {
      waveformAnalyser.getByteTimeDomainData(waveformSamples);
      let energy = 0;
      for (let index = 0; index < waveformSamples.length; index += 1) {
        const sample = (waveformSamples[index] - 128) / 128;
        energy += sample * sample;
      }
      level = Math.sqrt(energy / waveformSamples.length);
      waveformLevel = waveformLevel * 0.68 + level * 0.32;
      samples = waveformSamples;
    } else {
      waveformLevel *= 0.72;
    }

    root.dataset.inputActive = String(receivesInput && waveformLevel > 0.018);
    drawWaveformLine({ state, level: waveformLevel, samples, time });
    waveformFrame = window.requestAnimationFrame(drawWaveformFrame);
  }

  function drawWaveformLine({ state, level, samples, time }) {
    const context = waveformCanvas?.getContext("2d");
    if (!context) return;
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    const centre = height / 2;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.strokeStyle = state === "speaking"
      ? "rgba(228, 190, 123, .96)"
      : (state === "muted" ? "rgba(210, 220, 219, .52)" : "rgba(117, 223, 213, .96)");
    context.beginPath();

    const startX = 10;
    const endX = width - 10;
    const span = endX - startX;
    const hasLiveInput = samples && !reducedMotion;
    for (let point = 0; point <= 28; point += 1) {
      const ratio = point / 28;
      const x = startX + ratio * span;
      let y = centre;
      if (hasLiveInput) {
        const sampleIndex = Math.min(samples.length - 1, Math.floor(ratio * samples.length));
        const sample = (samples[sampleIndex] - 128) / 128;
        const boost = Math.min(4.8, 1.45 + level * 22);
        y += sample * height * 0.29 * boost;
      } else if (state === "speaking" && !reducedMotion) {
        y += Math.sin(ratio * Math.PI * 4 + time / 330) * 3.2;
      } else if (state !== "muted") {
        y += Math.sin(ratio * Math.PI * 4) * 1.15;
      }
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    if (state === "muted") {
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(21, 43);
      context.lineTo(43, 21);
      context.stroke();
    }
  }

  function selectPoseFromWords(words) {
    const value = String(words).toLowerCase();
    if (/rave|party|dance|hands in the air/.test(value)) root.dataset.pose = "rave";
    else if (/headphones|speaker|music|track|song/.test(value)) root.dataset.pose = "music";
    else if (/meditat|mindful|breath|stillness/.test(value)) root.dataset.pose = "meditate";
    else if (/tea|cosy|cozy|rest|relax/.test(value)) root.dataset.pose = "tea";
  }

  function scheduleLifestylePose() {
    window.clearTimeout(poseTimer);
    poseTimer = window.setTimeout(() => {
      if (!active || root.dataset.state === "speaking" || root.dataset.state === "thinking") return;
      poseIndex = (poseIndex + 1) % poseSequence.length;
      root.dataset.pose = poseSequence[poseIndex];
      scheduleLifestylePose();
    }, 14000);
  }

  function isViewingFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function isImmersiveViewing() {
    return isViewingFullscreen() || document.body.classList.contains("television-is-fullscreen");
  }

  function waitForFullscreenTransition() {
    return new Promise((resolve) => window.setTimeout(resolve, 220));
  }

  function handleVoiceFullscreenChange() {
    if (isViewingFullscreen()) {
      if (!fullscreenResumeWaiter) return;
      fullscreenResumeButton.hidden = true;
      const waiter = fullscreenResumeWaiter;
      fullscreenResumeWaiter = null;
      waiter.resolve(true);
      return;
    }
    if (microphoneFullscreenRecoveryArmed && (starting || active)) {
      waitForFullscreenReturn();
    }
  }

  function requestViewerFullscreen() {
    const fullscreenTarget = room.closest(".site-shell") || document.querySelector(".site-shell") || document.documentElement;
    try {
      if (fullscreenTarget.requestFullscreen) {
        return fullscreenTarget.requestFullscreen({ navigationUI: "hide" }).then(() => true).catch(() => false);
      }
      if (fullscreenTarget.webkitRequestFullscreen) {
        fullscreenTarget.webkitRequestFullscreen();
        return Promise.resolve(true);
      }
    } catch {}
    return Promise.resolve(false);
  }

  function waitForFullscreenReturn() {
    setState("connecting", "Microphone ready");
    fullscreenResumeButton.hidden = false;
    if (fullscreenResumeWaiter?.promise) return fullscreenResumeWaiter.promise;
    let resolveWaiter;
    const promise = new Promise((resolve) => { resolveWaiter = resolve; });
    fullscreenResumeWaiter = { promise, resolve: resolveWaiter };
    return promise;
  }

  function syncMicrophoneTrackState() {
    const enabled = active && !muted && !startupInputGate;
    microphoneStream?.getAudioTracks().forEach((track) => { track.enabled = enabled; });
  }

  function releaseStartupInputAfterGreeting() {
    window.clearTimeout(startupInputTimer);
    startupInputTimer = window.setTimeout(() => {
      if (!active || !microphoneStream) return;
      startupInputGate = false;
      syncMicrophoneTrackState();
      setState(muted ? "muted" : "listening", muted ? "Mic muted" : "I'm listening");
      scheduleLifestylePose();
    }, 1200);
  }

  function handleStartError(error) {
    const micDenied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
    const message = micDenied
      ? "Microphone access is needed to chat"
      : (error?.code === "voice_not_configured" ? "Voice is awaiting its secure key" : (error?.message || "Voice is having a quiet moment"));
    setState("error", message);
    cleanupConnection();
    window.IAMTelevisionAudio?.setVoiceConversationActive?.(false);
    window.setTimeout(() => {
      if (!active && !starting) resetInterface();
    }, 4500);
  }

  function endConversation(label, options = {}) {
    const hadSession = active || starting;
    active = false;
    starting = false;
    if (label && !options.quiet) setState("ended", label);
    cleanupConnection();
    window.IAMTelevisionAudio?.setVoiceConversationActive?.(false);
    if (hadSession && !options.quiet) window.setTimeout(resetInterface, 1100);
    else resetInterface();
  }

  function cleanupConnection() {
    window.clearTimeout(sessionTimer);
    window.clearTimeout(poseTimer);
    window.clearTimeout(disconnectTimer);
    window.clearTimeout(startupInputTimer);
    startupInputGate = false;
    microphoneFullscreenRecoveryArmed = false;
    fullscreenResumeButton.hidden = true;
    const waiter = fullscreenResumeWaiter;
    fullscreenResumeWaiter = null;
    waiter?.resolve(false);
    try { dataChannel?.close(); } catch {}
    dataChannel = null;
    try { peerConnection?.close(); } catch {}
    peerConnection = null;
    stopMicrophoneWaveform();
    microphoneStream?.getTracks().forEach((track) => track.stop());
    microphoneStream = null;
    remoteAudio.pause();
    remoteAudio.srcObject = null;
  }

  function resetInterface() {
    active = false;
    starting = false;
    muted = false;
    root.classList.remove("is-active");
    root.dataset.state = "idle";
    root.dataset.pose = "tea-tablet";
    status.textContent = "Ready when you are";
    summonButton.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    muteButton.setAttribute("aria-pressed", "false");
    muteButton.querySelector("span").textContent = "mute";
  }

  function makeMiniPlanetTexture(seed) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    const ocean = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    ocean.addColorStop(0, seed % 2 ? "#0b4d72" : "#0d6380");
    ocean.addColorStop(1, "#071f42");
    context.fillStyle = ocean;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const islands = [
      [.08, .32, .2, .19],
      [.32, .56, .26, .24],
      [.59, .24, .22, .22],
      [.76, .62, .28, .2],
    ];
    context.fillStyle = seed % 2 ? "#4a8a55" : "#3d9a70";
    islands.forEach(([x, y, width, height], index) => {
      context.beginPath();
      context.ellipse(((x + seed * .07) % 1) * canvas.width, y * canvas.height, width * canvas.width, height * canvas.height, index * .42, 0, Math.PI * 2);
      context.fill();
    });
    context.strokeStyle = "rgba(228, 190, 123, 0.62)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, canvas.height * .48);
    context.bezierCurveTo(canvas.width * .27, canvas.height * .32, canvas.width * .63, canvas.height * .66, canvas.width, canvas.height * .44);
    context.stroke();
    return canvas.toDataURL("image/png");
  }

  window.IAMRealtimeVoiceAssistant = {
    version: "universal_one_realtime_v3",
    end: endConversation,
    shouldPreflightEntry,
    showEntryPreflight,
    getState() {
      return {
        active,
        starting,
        muted,
        captionsVisible,
        startupInputGate,
        microphonePermissionState,
        entryPreflightState,
        waveformActive: Boolean(waveformAnalyser && waveformFrame),
        waveformLevel: Number(waveformLevel.toFixed(4)),
        awaitingFullscreenReturn: !fullscreenResumeButton.hidden,
        state: root.dataset.state,
        pose: root.dataset.pose,
        transcript: transcript.textContent.trim(),
      };
    },
    startStagingCheck: qaMode
      ? () => startConversation(stagingQaOptions())
      : undefined,
  };
})();
