import Foundation
import AVFoundation

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: input)
let duration = try await asset.load(.duration)
let video = try await asset.loadTracks(withMediaType: .video)
let audio = try await asset.loadTracks(withMediaType: .audio)
guard video.count == 1 else { fatalError("Expected one source video track") }
let composition = AVMutableComposition()
let target = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
try target.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: video[0], at: .zero)
target.preferredTransform = try await video[0].load(.preferredTransform)
let export = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetPassthrough)!
export.outputURL = output
export.outputFileType = .mp4
export.shouldOptimizeForNetworkUse = true
await export.export()
guard export.status == .completed else { fatalError(String(describing: export.error)) }
let result = AVURLAsset(url: output)
let resultVideo = try await result.loadTracks(withMediaType: .video)
let resultAudio = try await result.loadTracks(withMediaType: .audio)
let resultDuration = try await result.load(.duration)
guard resultVideo.count == 1 && resultAudio.isEmpty else { fatalError("Invalid exported tracks") }
print("Source video tracks: \(video.count); audio tracks: \(audio.count); duration: \(duration.seconds)")
print("Export video tracks: \(resultVideo.count); audio tracks: \(resultAudio.count); duration: \(resultDuration.seconds)")
print("Video-only passthrough export completed without playback.")
