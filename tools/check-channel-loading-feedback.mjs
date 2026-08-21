import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM_DIR = path.join(ROOT, "i  a m");
const controller = fs.readFileSync(path.join(IAM_DIR, "adaptive-environment-television.js"), "utf8");
const styles = fs.readFileSync(path.join(IAM_DIR, "adaptive-environment-television.css"), "utf8");
const pages = ["index.html", "index-alt.html", "adaptive-environment-television.html"]
  .map((fileName) => fs.readFileSync(path.join(IAM_DIR, fileName), "utf8"));

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function shortHash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

requireCondition(controller.includes('role", "status"') && controller.includes('aria-live", "polite"'), "channel loading feedback is not exposed as an accessible live status");
requireCondition(controller.includes('const heading = "LOADING"'), "the neutral channel-loading copy is missing");
requireCondition(!controller.includes('TUNING CHANNEL') && !controller.includes('LOADING NEXT SHOW'), "the loading overlay still changes copy for manual and automatic starts");
requireCondition(!controller.includes('data-channel-loading-label') && !controller.includes('channelLoadingDestination'), "the loading overlay still exposes redundant destination details");
requireCondition(controller.includes('"STILL LOADING"') && controller.includes("}, 18000);"), "the truthful long-wait state is missing");
requireCondition(controller.includes("identity === channelLoadingIdentity") && controller.includes("return channelLoadingGeneration;"), "same-programme loading starts are not deduplicated");
requireCondition(controller.includes('document.body.dataset.channelLoadingState = "loading"') && controller.includes('document.body.dataset.channelLoadingState = "ready"') && controller.includes('document.body.dataset.channelLoadingState = "error"') && controller.includes('document.body.dataset.channelLoadingState = "idle"'), "the loading state machine is incomplete");
requireCondition(controller.includes("Math.max(0, 480 - elapsed)") && controller.includes("}, 260);") && controller.includes("}, 3600);"), "minimum visibility, fade, or error timing has changed");
requireCondition(controller.includes('video.addEventListener("playing"') && controller.includes("finishChannelLoading(loadingGeneration);"), "Videos no longer settle loading feedback from actual playback readiness");
requireCondition(controller.includes("deferChannelLoadingFinish: true") && controller.includes("const visualJoined = await joinFashionBroadcastChannel"), "Parties no longer wait for both programme audio and the paired visual");
requireCondition(
  controller.includes("async function joinFashionBroadcastChannel") &&
    controller.includes('beginChannelLoading({\n      mode: "fashion"') &&
    controller.includes("finishChannelLoading(loadingGeneration)") &&
    controller.includes("failChannelLoading(loadingGeneration)"),
  "Fashion joins are no longer bound to the shared channel-loading lifecycle",
);
requireCondition(
  controller.includes("async function prepareFashionBroadcastVideo") &&
    controller.includes('reason: "fashion_broadcast_entry_seek"') &&
    controller.includes("return waitForFashionTargetFrame(video, targetSeconds"),
  "Fashion joins no longer seek to the shared offset before waiting for the decoded target frame",
);
requireCondition(
  controller.includes("function waitForFashionTargetFrame") &&
    controller.includes('finish(true, "decoded_at_target")') &&
    controller.includes('finish(false, "timeout")') &&
    controller.includes("readinessTimeoutMs: options.readinessTimeoutMs || 9000"),
  "Fashion readiness is no longer decoded-frame-based and bounded",
);
requireCondition(
  controller.includes("const previousVideo = fashionVideo;") &&
    controller.includes("fashionVideo = incomingVideo;") &&
    controller.indexOf("previousVideo.remove();") > controller.indexOf("fashionVideo = incomingVideo;"),
  "Fashion channel changes no longer retain the outgoing image until the replacement is ready",
);
requireCondition(controller.includes("continuationAudio.play()") && controller.includes("failChannelLoading(loadingGeneration);"), "Radio loading feedback is no longer bound to playback success and failure");
requireCondition(controller.includes("let broadcastJoinSequence = 0;") && controller.includes("const joinSequence = ++broadcastJoinSequence;"), "rapid channel joins no longer invalidate stale asynchronous work");
requireCondition(controller.includes("if (broadcastSyncTimer) {") && controller.includes("joinSequence !== broadcastJoinSequence || broadcastChannelId !== channelId"), "an older sync or join can overtake current channel loading feedback");
requireCondition(controller.includes('normalizedSource !== "shop_independent"') && controller.includes('!normalizedSource.startsWith("sex_ed")'), "non-channel Shop or sex-ed playback is no longer excluded");
requireCondition(styles.includes("@keyframes adaptive-channel-loading-spin") && styles.includes(".adaptive-television-channel-loading.is-active"), "the circular loading treatment is missing");
requireCondition(styles.includes("background: radial-gradient") && styles.includes("pointer-events: none"), "the loader no longer preserves the prior image without blocking controls");
requireCondition(styles.includes("@media (prefers-reduced-motion: reduce)") && styles.includes("animation: none"), "the loader has no reduced-motion fallback");

const scriptToken = `adaptive-environment-television.js?v=music-tv-${shortHash(controller)}`;
const styleToken = `adaptive-environment-television.css?v=music-tv-css-${shortHash(styles)}`;
pages.forEach((page, index) => {
  requireCondition(page.includes(scriptToken), `page ${index + 1} has a stale television controller cache token`);
  requireCondition(page.includes(styleToken), `page ${index + 1} has a stale television stylesheet cache token`);
});

console.log("Channel loading feedback checks passed.");
