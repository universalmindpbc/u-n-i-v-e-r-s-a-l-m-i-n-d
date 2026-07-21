(function () {
  const room = document.querySelector("[data-television-room]");
  if (!room || !window.RTCPeerConnection) return;

  const params = new URLSearchParams(window.location.search);
  const qaMode = window.location.hostname === "staging.universalmind.tv" && params.get("qa") === "realtime-voice";
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
  let peerConnection = null;
  let dataChannel = null;
  let microphoneStream = null;
  let starting = false;
  let active = false;
  let muted = false;
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
        <span class="iam-realtime-voice__signal" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>
          <strong>Universal One</strong>
          <small data-voice-status aria-live="polite">Ready when you are</small>
        </span>
      </div>
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

  root.style.setProperty("--iam-mini-planet-texture", `url("${textureUrl}")`);
  const summonButton = root.querySelector(".iam-realtime-voice__summon");
  const panel = root.querySelector(".iam-realtime-voice__panel");
  const status = root.querySelector("[data-voice-status]");
  const transcript = root.querySelector("[data-voice-transcript]");
  const muteButton = root.querySelector("[data-voice-mute]");
  const captionsButton = root.querySelector("[data-voice-captions]");
  const endButton = root.querySelector("[data-voice-end]");
  const qaButton = root.querySelector("[data-voice-qa]");
  const remoteAudio = root.querySelector("[data-voice-audio]");

  summonButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const options = qaMode
      ? {
          microphone: false,
          qaPrompt: "This is a staging voice check. Say exactly: Namaste. Universal One is here and ready to chat.",
        }
      : { microphone: true };
    startConversation(options).catch(handleStartError);
  });

  [panel, muteButton, captionsButton, endButton, qaButton].filter(Boolean).forEach((element) => {
    element.addEventListener("click", (event) => event.stopPropagation());
  });

  muteButton.addEventListener("click", () => {
    if (!active || !microphoneStream) return;
    muted = !muted;
    microphoneStream.getAudioTracks().forEach((track) => { track.enabled = !muted; });
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
    startConversation({
      microphone: false,
      qaPrompt: "This is a staging voice check. Say exactly: Namaste. Universal One is here and ready to chat.",
    }).catch(handleStartError);
  });

  window.addEventListener("pagehide", () => endConversation("", { quiet: true }));

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

    try {
      if (options.microphone !== false) {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot open a microphone.");
        microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
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
      window.IAMTelevisionAudio?.setVoiceConversationActive?.(true);
      root.dataset.pose = options.microphone === false ? "wave" : "tea-tablet";
      setState(options.microphone === false ? "thinking" : "listening", options.microphone === false ? "Running staging check…" : "I'm listening");
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
        if (active && !muted) setState("listening", "I'm listening");
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
        if (completedTranscript) {
          lastAssistantTranscript = completedTranscript;
          appendTranscript("one", completedTranscript, false, event.item_id || event.response_id || "assistant-current", true);
          selectPoseFromWords(completedTranscript);
        }
        break;
      }
      case "response.done":
        {
          const completedTranscript = transcriptFromRealtimePayload(event.response);
          if (completedTranscript) {
            lastAssistantTranscript = completedTranscript;
            appendTranscript("one", completedTranscript, false, event.response?.id || event.response_id || "assistant-current", true);
            selectPoseFromWords(completedTranscript);
          }
        }
        lastAssistantTranscript = "";
        if (!muted) setState("listening", microphoneStream ? "I'm listening" : "Staging voice check complete");
        scheduleLifestylePose();
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

  function handleStartError(error) {
    const micDenied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
    const message = micDenied
      ? "Microphone access is needed to chat"
      : (error?.code === "voice_not_configured" ? "Voice is awaiting its secure key" : (error?.message || "Voice is having a quiet moment"));
    setState("error", message);
    cleanupConnection();
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
    try { dataChannel?.close(); } catch {}
    dataChannel = null;
    try { peerConnection?.close(); } catch {}
    peerConnection = null;
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
    version: "universal_one_realtime_v1",
    end: endConversation,
    getState() {
      return {
        active,
        starting,
        muted,
        captionsVisible,
        state: root.dataset.state,
        pose: root.dataset.pose,
        transcript: transcript.textContent.trim(),
      };
    },
    startStagingCheck: qaMode
      ? () => startConversation({ microphone: false, qaPrompt: "Say exactly: Namaste. Universal One is here and ready to chat." })
      : undefined,
  };
})();
