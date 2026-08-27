import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const controllerPath = path.join(root, "i  a m", "adaptive-environment-television.js");
const controller = fs.readFileSync(controllerPath, "utf8");

new Script(controller, { filename: controllerPath });

const functionSource = (name, nextName) => {
  const start = controller.indexOf(`function ${name}`);
  const end = controller.indexOf(`function ${nextName}`, start + 1);
  assert.ok(start >= 0 && end > start, `Could not isolate ${name}.`);
  return controller.slice(start, end);
};

const alignedHandoff = functionSource("waitForAlignedMusicVideo", "seekIncomingMusicVideo");
assert.match(alignedHandoff, /Math\.abs\(driftSeconds\) <= \.5/);
assert.match(alignedHandoff, /seekBroadcastVideo\(video, state\.offsetSeconds/);
assert.match(alignedHandoff, /broadcastHandoffState = "correcting_single_attach"/);
assert.match(alignedHandoff, /broadcastHandoffState = "aligned_single_attach"/);
assert.doesNotMatch(alignedHandoff, /detach\(|remove\(\)/);

const onDemandHandoff = functionSource("createOnDemandMusicHandoffVideo", "activateBufferedMusicHandoff");
assert.match(onDemandHandoff, /minimumBufferSeconds: 4/);
assert.match(onDemandHandoff, /timeoutMs: 9000/);

assert.match(controller, /RADIO_SEGMENT_STARTUP_BUFFER_SECONDS = 12/);
assert.match(controller, /RADIO_SEGMENT_STARTUP_COUNT = 2/);
assert.match(controller, /RADIO_SEGMENT_BUFFER_TARGET_SECONDS = 48/);
const ntsAttach = functionSource("attachBufferedNtsRadio", "bindDirectRadioPlaybackDiagnostics");
assert.match(ntsAttach, /maximumNewSegments: RADIO_SEGMENT_STARTUP_COUNT/);
assert.match(ntsAttach, /initialBuffer < RADIO_SEGMENT_STARTUP_BUFFER_SECONDS/);
assert.match(ntsAttach, /radioInitialBufferState = "ready"/);
assert.match(ntsAttach, /refreshBufferedNtsSegments\(player\)\.catch/);
const ntsRefresh = functionSource("refreshBufferedNtsSegments", "destroyContinuationSegmentPlayer");
assert.match(ntsRefresh, /const decodedSegments = await Promise\.all\(startupUrls\.map/);
assert.match(ntsRefresh, /decodedSegments\.forEach/);

const recordedAttach = functionSource("attachContinuationAudioSource", "stopContinuationAudioImmediately");
assert.match(recordedAttach, /expectedTransport = recordedProgramme[\s\S]*?"recorded-hls-vod"/);
assert.match(recordedAttach, /if \(recordedProgramme\)[\s\S]*?hlsConfig\.startPosition = startPosition/);
assert.match(recordedAttach, /else \{[\s\S]*?hlsConfig\.liveSyncDurationCount = RADIO_LIVE_SYNC_SEGMENTS/);
assert.match(recordedAttach, /radioStreamSemantics = recordedProgramme \? "recorded_programme" : "live_station"/);

const audioParty = functionSource("startAudioLedPartyAttempt", "startRadioStation");
const joinBroadcast = functionSource("joinBroadcastChannel", "switchMusicTrack");
assert.match(audioParty, /const visualStartup = options\.visualStartupPromise \|\| \(options\.visualAlreadyManaged[\s\S]*?\? Promise\.resolve\(true\)[\s\S]*?: \(async \(\) =>/);
assert.match(audioParty, /const audioStartup = primeContinuationAudio/);
assert.match(audioParty, /recordedProgramme: true/);
assert.match(audioParty, /startPositionSeconds: initialStartSeconds/);
assert.match(audioParty, /assertCurrentStart,/);
assert.match(audioParty, /await Promise\.all\(\[visualStartup, audioStartup\]\)/);
assert.match(audioParty, /const entryDriftSeconds = Number\(continuationAudio\.currentTime \|\| 0\) - Number\(state\.offsetSeconds \|\| 0\)/);
assert.match(audioParty, /Math\.abs\(entryDriftSeconds\) > RECORDED_PROGRAMME_FAST_ENTRY_DRIFT_SECONDS/);
assert.match(audioParty, /audioPartyEntryAlignment = "fast_start_tolerance"/);
assert.match(audioParty, /audioPartyEntryDriftSeconds = entryDriftSeconds\.toFixed\(3\)/);
assert.match(audioParty, /await synchronizeBroadcastMedia\(continuationAudio, state\.offsetSeconds/);
assert.match(audioParty, /await seekBroadcastVideo\(continuationAudio, state\.offsetSeconds/);
assert.match(controller, /const RECORDED_PROGRAMME_READY_BUFFER_SECONDS = 4;/);
assert.match(controller, /maxBufferLength: recordedProgramme \? RECORDED_PROGRAMME_BACKGROUND_BUFFER_SECONDS : 60/);
assert.match(joinBroadcast, /synchronizeBroadcastPlayback\(state\.mediaType !== "audio"\)/);

const radioBufferWait = functionSource("waitForRadioBuffer", "fetchRadioResource");
assert.match(radioBufferWait, /\["hls-js", "recorded-hls-vod"\]/);

console.log("Live-channel startup passed: single-attach video alignment, two-segment NTS startup, and recorded audio-party VOD semantics are enforced.");
