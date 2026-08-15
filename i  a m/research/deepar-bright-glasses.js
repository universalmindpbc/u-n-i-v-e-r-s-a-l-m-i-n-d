const DEEPAR_LICENSE_ENDPOINT = "api/deepar-license.php";
const DEEPAR_SDK_ROOT = new URL("./vendor/deepar-5.6.22/", import.meta.url).href;
const DEEPAR_MODULE_URL = new URL("./vendor/deepar-5.6.22/js/deepar.esm.js", import.meta.url).href;
const BRIGHT_GLASSES_EFFECT_URL = new URL("./effects/bright-glasses/bright-glasses.deepar", import.meta.url).href;

export const deepARBrightGlassesContract = Object.freeze({
  sdk_version: "5.6.22",
  effect: "DeepAR Bright Glasses",
  license_endpoint: DEEPAR_LICENSE_ENDPOINT,
  default_camera_disabled: true,
  shared_raw_video_stream: true,
  recording_enabled: false,
  audio_enabled: false,
  free_plan_watermark_visible: true,
  composition: "tracked-effect-regions-only",
});

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function normalizeDeepARFaceRegion(faceRect, canvasWidth, canvasHeight) {
  if (!Array.isArray(faceRect) || faceRect.length < 4) return null;
  const [rawX, rawY, rawWidth, rawHeight] = faceRect.map(Number);
  if (![rawX, rawY, rawWidth, rawHeight, canvasWidth, canvasHeight].every(Number.isFinite)
    || rawWidth <= 0
    || rawHeight <= 0
    || canvasWidth <= 0
    || canvasHeight <= 0) {
    return null;
  }

  const normalizedCoordinates = Math.max(
    Math.abs(rawX),
    Math.abs(rawY),
    Math.abs(rawWidth),
    Math.abs(rawHeight),
  ) <= 2;
  const x = normalizedCoordinates ? rawX : rawX / canvasWidth;
  const y = normalizedCoordinates ? rawY : rawY / canvasHeight;
  const width = normalizedCoordinates ? rawWidth : rawWidth / canvasWidth;
  const height = normalizedCoordinates ? rawHeight : rawHeight / canvasHeight;

  return {
    centerX: clamp(x + (width / 2), 0.08, 0.92),
    centerY: clamp(y + (height * 0.33), 0.12, 0.84),
    radiusX: clamp(width * 0.78, 0.18, 0.48),
    radiusY: clamp(height * 0.3, 0.09, 0.3),
  };
}

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
  onFaceRegion,
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
    if (deepAR.callbacks && typeof onFaceRegion === "function") {
      let faceCoordinateWidth = 0;
      let faceCoordinateHeight = 0;
      deepAR.callbacks.onFaceTrackingInitialized = (_fovY, width, height) => {
        faceCoordinateWidth = Number(width) || 0;
        faceCoordinateHeight = Number(height) || 0;
      };
      deepAR.callbacks.onFaceTracked = (faces = []) => {
        const face = faces.find((candidate) => candidate?.detected && candidate.faceRect);
        const renderCanvas = deepAR?.getCanvas?.();
        const region = normalizeDeepARFaceRegion(
          face?.faceRect,
          faceCoordinateWidth || Number(renderCanvas?.width),
          faceCoordinateHeight || Number(renderCanvas?.height),
        );
        if (region) onFaceRegion(region);
      };
      deepAR.callbacks.onFaceVisibilityChanged = (visible) => {
        if (!visible) onFaceRegion(null);
      };
    }

    let cleaned = false;
    return {
      sdkVersion: deepAR.version || deepAR.getVersion?.() || "5.6.22",
      effectUrl: BRIGHT_GLASSES_EFFECT_URL,
      async cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (deepAR?.callbacks) {
          delete deepAR.callbacks.onFaceTrackingInitialized;
          delete deepAR.callbacks.onFaceTracked;
          delete deepAR.callbacks.onFaceVisibilityChanged;
        }
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
