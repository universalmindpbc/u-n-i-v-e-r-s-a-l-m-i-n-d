const SHEN_BUILD = "3.1.9-fb17342b16ff";

export const heartCheckShenWasmUrl = new URL(
  `./vendor/shenai-sdk/shenai_sdk.wasm?v=${SHEN_BUILD}`,
  import.meta.url,
).href;

const deepARWarmupUrls = Object.freeze([
  new URL("./vendor/deepar-5.6.22/js/deepar.esm.js", import.meta.url).href,
  new URL("./vendor/deepar-5.6.22/wasm/deepar.wasm", import.meta.url).href,
  new URL("./vendor/deepar-5.6.22/js/dynamicModules/xzimg.js", import.meta.url).href,
  new URL("./vendor/deepar-5.6.22/wasm/dyXzimgMagicFace.wasm", import.meta.url).href,
  new URL("./vendor/deepar-5.6.22/models/face/models-68-extreme.bin", import.meta.url).href,
  new URL("./vendor/deepar-5.6.22/default_envmap.webp", import.meta.url).href,
  new URL("./vendor/deepar-5.6.22/split_sum.webp", import.meta.url).href,
  new URL("./effects/bright-glasses/bright-glasses.deepar?v=bright-glasses-c24e7216d54c", import.meta.url).href,
]);

let warmupPromise = null;

function announce(detail) {
  window.dispatchEvent(new CustomEvent("iam:heart-check-warmup", { detail }));
}

async function drainResponse(response) {
  if (!response.body?.getReader) {
    await response.arrayBuffer();
    return;
  }

  const reader = response.body.getReader();
  while (true) {
    const { done } = await reader.read();
    if (done) return;
  }
}

async function warmAsset(url, asset) {
  const response = await fetch(url, {
    cache: "force-cache",
    credentials: "same-origin",
    priority: "low",
  });
  if (!response.ok) throw new Error(`Heart Check warmup failed for ${asset}.`);
  await drainResponse(response);
  announce({ state: "ready", asset });
}

export function warmHeartCheckAssets() {
  if (warmupPromise || typeof window.fetch !== "function") return warmupPromise;

  announce({ state: "started", asset: "shen" });
  warmupPromise = warmAsset(heartCheckShenWasmUrl, "shen")
    .catch(() => null)
    .then(async () => {
      announce({ state: "started", asset: "bright-glasses" });
      const results = await Promise.allSettled(
        deepARWarmupUrls.map((url) => warmAsset(url, "bright-glasses")),
      );
      announce({
        state: results.every(({ status }) => status === "fulfilled") ? "ready" : "partial",
        asset: "bright-glasses",
      });
    });

  return warmupPromise;
}

function installSelfReportWarmup() {
  const destination = document.querySelector("[data-iam-next-page]")?.dataset.iamNextPage
    || document.body?.dataset.iamNextPage
    || "";
  if (!destination.includes("offer=heart-rate")) return;

  const start = () => { void warmHeartCheckAssets(); };
  document.querySelector("[data-iam-start]")?.addEventListener("pointerdown", start, { once: true });
  document.querySelector("[data-iam-control]")?.addEventListener("pointerdown", start, { once: true });
  document.querySelector("[data-iam-input]")?.addEventListener("focus", start, { once: true });
}

installSelfReportWarmup();
