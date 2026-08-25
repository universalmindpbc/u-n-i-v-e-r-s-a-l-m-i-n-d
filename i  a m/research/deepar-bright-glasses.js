const DEEPAR_LICENSE_ENDPOINT = "api/deepar-license.php";
const DEEPAR_SDK_ROOT = new URL("./vendor/deepar-5.6.22/", import.meta.url).href;
const DEEPAR_MODULE_URL = new URL("./vendor/deepar-5.6.22/js/deepar.esm.js", import.meta.url).href;
const BRIGHT_GLASSES_EFFECT_URL = new URL("./effects/bright-glasses/bright-glasses.deepar?v=bright-glasses-c24e7216d54c", import.meta.url).href;

export const deepARBrightGlassesContract = Object.freeze({
  sdk_version: "5.6.22",
  effect: "DeepAR Bright Glasses",
  license_endpoint: DEEPAR_LICENSE_ENDPOINT,
  default_camera_disabled: true,
  shared_raw_video_stream: true,
  recording_enabled: false,
  audio_enabled: false,
  free_plan_watermark_visible: true,
  composition: "full-frame-with-live-shen-pixel-planes",
});

function assertVideoOnlyStream(stream) {
  const videoTracks = stream?.getVideoTracks?.() || [];
  const audioTracks = stream?.getAudioTracks?.() || [];
  if (videoTracks.length !== 1 || audioTracks.length !== 0) {
    throw new Error("Bright Glasses requires the existing video-only Heart Check camera stream.");
  }
}
async function requestDomainBoundLicense(fetchImpl) {
  const response = await fetchImpl(DEEPAR_LICENSE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok
    || typeof payload.license_key !== "string"
    || payload.license_key.trim().length < 16
    || Object.keys(payload).some((key) => key !== "license_key")) {
    throw new Error("Bright Glasses is unavailable right now.");
  }
  const licenseKey = payload.license_key.trim();
  payload.license_key = "";
  return licenseKey;
}

export async function createDeepARBrightGlasses({
  previewElement,
  videoElement,
  stream,
  fetchImpl = (...args) => fetch(...args),
  loadSdk = () => import(DEEPAR_MODULE_URL),
} = {}) {
  if (!(previewElement instanceof HTMLElement) || !(videoElement instanceof HTMLVideoElement)) {
    throw new Error("Bright Glasses preview elements are unavailable.");
  }
  assertVideoOnlyStream(stream);

  let deepAR = null;
  let licenseKey = await requestDomainBoundLicense(fetchImpl);
  try {
    const sdk = await loadSdk();
    if (typeof sdk?.initialize !== "function") {
      throw new Error("Bright Glasses SDK is unavailable.");
    }
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.srcObject = stream;
    await videoElement.play();

    deepAR = await sdk.initialize({
      licenseKey,
      previewElement,
      rootPath: DEEPAR_SDK_ROOT,
      effect: BRIGHT_GLASSES_EFFECT_URL,
      additionalOptions: {
        cameraConfig: {
          disableDefaultCamera: true,
        },
        hint: "faceInit",
      },
    });
    licenseKey = "";
    deepAR.muteSound?.(true);
    deepAR.setFps?.(24);
    deepAR.setVideoElement(videoElement, true);

    let cleaned = false;
    return {
      sdkVersion: deepAR.version || deepAR.getVersion?.() || "5.6.22",
      effectUrl: BRIGHT_GLASSES_EFFECT_URL,
      async cleanup() {
        if (cleaned) return;
        cleaned = true;
        try { deepAR?.muteSound?.(true); } catch {}
        try { deepAR?.stopVideo?.(); } catch {}
        try { deepAR?.shutdown?.(); } catch {}
        deepAR = null;
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.srcObject = null;
        previewElement.replaceChildren();
      },
    };
  } catch (error) {
    licenseKey = "";
    try { deepAR?.muteSound?.(true); } catch {}
    try { deepAR?.stopVideo?.(); } catch {}
    try { deepAR?.shutdown?.(); } catch {}
    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.srcObject = null;
    previewElement.replaceChildren();
    throw error;
  }
}
