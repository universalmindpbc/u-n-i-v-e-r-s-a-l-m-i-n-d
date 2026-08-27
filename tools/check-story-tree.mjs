import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const bytes = (relativePath) => readFileSync(path.join(root, relativePath));
const hash = (relativePath) => createHash("sha256").update(bytes(relativePath)).digest("hex");
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(`Story Tree check failed: ${message}`);
};

const storyJsPath = "i  a m/story-tree.js";
const storyCssPath = "i  a m/story-tree.css";
const voicePath = "i  a m/realtime-voice-assistant.js";
const televisionPath = "i  a m/adaptive-environment-television.js";
const htmlPaths = [
  "i  a m/index.html",
  "i  a m/index-alt.html",
  "i  a m/adaptive-environment-television.html",
];
const storyJs = read(storyJsPath);
const storyCss = read(storyCssPath);
const voice = read(voicePath);
const television = read(televisionPath);
const deploy = read("deploy-panthur-staging.sh");
const stages = [
  "CHALLENGE",
  "CAUSE I",
  "CAUSE II",
  "CAUSE III",
  "NERVOUS SYSTEM RESET",
  "SOLUTION I",
  "SOLUTION II",
  "SOLUTION III",
  "BEAUTIFUL NEW WORLD",
];

requireCondition(storyJs.includes("version: \"story_tree_v1\""), "the Story Tree controller version is missing");
requireCondition(storyJs.includes("Have a conversation") === false, "the wallet tooltip belongs in markup, not duplicated in the controller");
stages.forEach((stage) => requireCondition(storyJs.includes(`\"${stage}\"`), `the exact ${stage} stage is missing`));
requireCondition(storyJs.includes("Together, let's create a beautiful new world."), "the exact Beautiful New World close is missing");
requireCondition(storyJs.includes("What's the first reason that's causing this challenge?"), "CAUSE I question changed");
requireCondition(storyJs.includes("What's another reason that's causing this challenge?"), "CAUSE II question changed");
requireCondition(storyJs.includes("What's a third and final reason that's causing this challenge?"), "CAUSE III question changed");
requireCondition(storyJs.includes("What's the first thing that might improve this challenge?"), "SOLUTION I question changed");
requireCondition(storyJs.includes("What's another thing that might improve this challenge?"), "SOLUTION II question changed");
requireCondition(storyJs.includes("What's a third and final thing that might improve this challenge?"), "SOLUTION III question changed");
requireCondition(storyJs.includes("const RESET_DURATION_MS = 10 * 60 * 1000"), "the reset is no longer ten minutes");
requireCondition(storyJs.includes("const RESET_RISE_DELAY_MS = 1500"), "the reset rise delay changed");
requireCondition(storyJs.includes("const RESET_RISE_DURATION_MS = 7000"), "the reset rise duration changed");
requireCondition(storyJs.includes("const RESET_RETURN_DURATION_MS = 5500"), "the reset return duration changed");
requireCondition(storyJs.includes("const riseLeadIn = testMode ? 0 : RESET_RISE_DELAY_MS + RESET_RISE_DURATION_MS"), "the ten-minute reset no longer begins after the complete music rise");
requireCondition(storyJs.includes("Only after they agree, call story_tree_progress for NERVOUS SYSTEM RESET"), "the reset may begin before visitor agreement");
requireCondition(!/localStorage|sessionStorage|document\.cookie|sendBeacon/.test(storyJs), "Story Tree added response persistence or analytics");
requireCondition(storyJs.includes("persistedResponseData: false"), "the current-session privacy state is not explicit");
requireCondition(storyJs.includes("additionalProperties: false"), "the Story Tree tool schema is not strict");

requireCondition(!/iam-story-tree__(?:geometry|flower|ripple|stage|research)|<svg|<ellipse/.test(storyJs + storyCss), "Story Tree reintroduced competing geometry over the EMDR player");
requireCondition(!/@keyframes\s+iam-story-tree/.test(storyCss), "Story Tree reintroduced visual animation over the EMDR player");
requireCondition(!/iam-realtime-(?:voice|character)/.test(storyCss), "Story Tree restyled Universal One's existing character or panel");
requireCondition(!/television-emdr-gif|data-emdr-gif/.test(storyJs + storyCss), "Story Tree altered the existing EMDR GIF player");

requireCondition(voice.includes("const baseInstructions = typeof session.instructions"), "Universal One does not capture the server-issued effective prompt");
requireCondition(voice.includes("const existingTools = Array.isArray(session.tools)"), "Universal One does not capture existing server-issued tools");
requireCondition(voice.includes("const mergedInstructions = `${baseInstructions}\\n\\n${additions}`"), "Story Tree no longer appends to the effective base prompt");
requireCondition(voice.includes("instructions.includes(expected.baseInstructions) && instructions.includes(expected.additions)"), "the session.updated prompt-preservation proof is missing");
requireCondition(voice.includes("existingTools.concat(storyTools)"), "Story Tree no longer merges tools additively");
requireCondition(voice.includes("realtimeToolIdentity"), "server-issued non-function tools are not included in the merge proof");
requireCondition(voice.includes("already has a conflicting Story Tree tool"), "a server-issued Story Tree tool collision is not rejected");
requireCondition(voice.includes("storyTreeToolNames = new Set([\"story_tree_progress\"])"), "the Story Tree function allowlist changed");
requireCondition(voice.includes("keys.length === 1 && keys[0] === \"stage\""), "raw or additional tool arguments are no longer rejected");
requireCondition(voice.includes('type: "function_call_output"'), "the Realtime function output bridge is missing");
requireCondition(voice.includes("storyTreeFunctionCallsHandled"), "live Story Tree function dispatch proof is unavailable");
requireCondition(!voice.includes("console.log(effectiveSession"), "the effective prompt may be logged");
requireCondition(voice.includes("experienceMicrophoneSnapshot = new Map"), "pre-reset microphone track state is not captured");
requireCondition(voice.includes("experienceMicrophoneSnapshot?.get(track) === true"), "pre-reset microphone track state is not restored");

requireCondition(television.includes("const VOICE_ASSISTANT_PROGRAMME_MIX_LEVEL = .15"), "ordinary Universal One ducking changed");
requireCondition(television.includes("VOICE_ASSISTANT_PROGRAMME_MIX_LEVEL, 800"), "ordinary 800ms ducking changed");
requireCondition(television.includes("animateVoiceAssistantProgramVolume(media, baseline, 1000)"), "ordinary 1000ms restoration changed");
requireCondition(television.includes("function setStoryTreeConversationMix(options = {})"), "the separate Story Tree programme envelope is missing");
requireCondition(television.includes("voiceAssistantBaseVolumes.get(media)"), "the Story Tree envelope does not use the unducked baseline map");
requireCondition(television.includes("cancelStoryTreeConversationMix"), "the Story Tree envelope cannot be cancelled");

const tokenExpectations = {
  storyCss: `story-tree-css-${hash(storyCssPath).slice(0, 12)}`,
  storyJs: `story-tree-js-${hash(storyJsPath).slice(0, 12)}`,
  voice: `realtime-voice-${hash(voicePath).slice(0, 12)}`,
  television: `music-tv-${hash(televisionPath).slice(0, 12)}`,
};
htmlPaths.forEach((htmlPath) => {
  const html = read(htmlPath);
  Object.entries(tokenExpectations).forEach(([name, token]) => requireCondition(html.includes(token), `${htmlPath} does not consume the current ${name} token ${token}`));
});
const entryHtml = htmlPaths.slice(0, 2).map(read);
entryHtml.forEach((html, index) => {
  requireCondition((html.match(/data-story-tree-start/g) || []).length === 1, `${htmlPaths[index]} does not have exactly one Story Tree entry`);
  requireCondition(html.includes(">STORYTREE</button>"), `${htmlPaths[index]} does not use the exact STORYTREE wallet label`);
  requireCondition(html.includes("Have a conversation with Universal One and reflect on today's challenges."), `${htmlPaths[index]} does not use the exact Story Tree tooltip`);
});
requireCondition((read(htmlPaths[2]).match(/data-story-tree-start/g) || []).length === 0, "the minimal legacy room invented a duplicate EMDR wallet");
requireCondition(deploy.includes('"$NODE_BIN" "$ROOT_DIR/tools/check-story-tree.mjs"'), "the Panthur preflight does not retain the Story Tree contract");

const repositoryText = htmlPaths.map(read).join("\n") + read("i  a m/music-track-catalogue-v1.js");
requireCondition(repositoryText.includes("Caroline Chang (Techno Llama)"), "the Caroline correction was not preserved");
requireCondition(!repositoryText.includes("Caroline Chase"), "the rejected Caroline name returned");
requireCondition(!repositoryText.includes("The Techno Llama"), "the rejected Caroline channel returned");
requireCondition(!repositoryText.includes("caroline-chase-"), "the rejected Caroline IDs returned");

console.log("Story Tree source, privacy, integration, token and protected-byte checks passed.");
