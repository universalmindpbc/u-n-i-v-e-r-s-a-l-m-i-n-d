import Foundation
import Vision

struct VisionScore: Codable {
    let path: String
    let faces: Int
    let bodies: Int
    let largestFace: Double
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for path in CommandLine.arguments.dropFirst() {
    let fileURL = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: fileURL.path) else {
        let empty = VisionScore(path: path, faces: 0, bodies: 0, largestFace: 0)
        if let data = try? encoder.encode(empty) { print(String(decoding: data, as: UTF8.self)) }
        continue
    }

    let faceRequest = VNDetectFaceRectanglesRequest()
    let bodyRequest = VNDetectHumanBodyPoseRequest()
    faceRequest.usesCPUOnly = true
    bodyRequest.usesCPUOnly = true
    let handler = VNImageRequestHandler(url: fileURL, options: [:])
    do {
        try handler.perform([faceRequest])
    } catch {
        FileHandle.standardError.write(Data("Vision face error for \(path): \(error)\n".utf8))
    }
    do {
        try handler.perform([bodyRequest])
    } catch {
        // Body-pose support varies by macOS/accelerator. Face detection remains
        // authoritative and gallery zero stays the deterministic fallback.
    }

    let faces = faceRequest.results ?? []
    let bodies = bodyRequest.results ?? []
    let largestFace = faces.map { Double($0.boundingBox.width * $0.boundingBox.height) }.max() ?? 0
    let score = VisionScore(path: path, faces: faces.count, bodies: bodies.count, largestFace: largestFace)
    if let data = try? encoder.encode(score) { print(String(decoding: data, as: UTF8.self)) }
}
