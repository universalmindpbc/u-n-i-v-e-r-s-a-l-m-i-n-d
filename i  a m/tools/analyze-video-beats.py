#!/usr/bin/env python3
"""Offline BPM and first-downbeat analysis for the local i am video catalogue."""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import subprocess

import numpy as np


TARGET_RATE = 11025
HOP = 256
WINDOW = 1024
TEMPO_MIN = 68.0
TEMPO_MAX = 178.0

# Canonical quarter-note tempos resolve half/double-time aliases and syncopated
# tracks that onset-only analysis can misclassify. The local analysis still
# determines the beat phase and first strong downbeat for these exact videos.
CANONICAL_BPM = {
    "Björk - Hyperballad.mp4": 134.0,
    "Caroline Polachek - Welcome To My Island.mp4": 140.0,
    "Charli XCX - House featuring John Cale.mp4": 131.525,
    "Dua Lipa - Be The One.mp4": 87.0,
    "Flume - Never Be Like You feat. Kai [ Live at Laneway Festival ].mp4": 119.0,
    "Flume - Tiny Cities feat. Beck.mp4": 71.0,
    "Grimes - Genesis.mp4": 166.0,
    "Linkin Park - Numb (Live, 2024).mp4": 110.0,
    "Linkin Park - Numb.mp4": 110.0,
    "Little Simz - Gorilla.mp4": 90.0,
    "M.I.A. - Borders.mp4": 89.0,
    "Madonna - Frozen.mp4": 108.0,
    "Madonna - Ray Of Light.mp4": 128.0,
    "Nightmares On Wax - Shape The Future.mp4": 116.584,
    "PinkPantheress - Illegal ( Live at Glastonbury).mp4": 141.0,
    "Rihanna - Diamonds.mp4": 92.0,
    "Sampa The Great - Energy (feat. Nadeem Din-Gabisi).mp4": 90.0,
    "Sampa The Great - Final Form.mp4": 96.0,
    "Solange - Cranes in the Sky.mp4": 97.0,
    "Tame Impala - The Less I Know The Better.mp4": 117.0,
    "The Prodigy - Everybody In The Place.mp4": 183.727,
    "U2 - Numb.mp4": 90.0,
}


def smooth(values: np.ndarray, width: int) -> np.ndarray:
    if width <= 1:
        return values
    kernel = np.ones(width, dtype=np.float32) / width
    return np.convolve(values, kernel, mode="same")


def robust_normalize(values: np.ndarray) -> np.ndarray:
    values = np.maximum(values - np.median(values), 0)
    scale = np.percentile(values, 95)
    return values / max(float(scale), 1e-8)


def decode_audio(ffmpeg: pathlib.Path, video: pathlib.Path) -> tuple[np.ndarray, int]:
    command = [
        str(ffmpeg), "-v", "error", "-i", str(video), "-vn",
        "-ac", "1", "-ar", str(TARGET_RATE), "-f", "f32le", "pipe:1",
    ]
    completed = subprocess.run(command, check=True, capture_output=True)
    audio = np.frombuffer(completed.stdout, dtype="<f4").copy()
    audio -= np.mean(audio)
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio /= peak
    return audio, TARGET_RATE


def envelopes(audio: np.ndarray, sample_rate: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    if len(audio) < WINDOW:
        raise ValueError("audio is too short")
    frame_count = 1 + (len(audio) - WINDOW) // HOP
    frames = np.lib.stride_tricks.as_strided(
        audio,
        shape=(frame_count, WINDOW),
        strides=(audio.strides[0] * HOP, audio.strides[0]),
        writeable=False,
    )
    spectrum = np.abs(np.fft.rfft(frames * np.hanning(WINDOW), axis=1)).astype(np.float32)
    log_spectrum = np.log1p(spectrum * 12.0)
    flux = np.maximum(np.diff(log_spectrum, axis=0, prepend=log_spectrum[:1]), 0)
    frequencies = np.fft.rfftfreq(WINDOW, 1.0 / sample_rate)

    full = flux[:, (frequencies >= 45) & (frequencies <= 5200)].mean(axis=1)
    low = flux[:, (frequencies >= 45) & (frequencies <= 190)].mean(axis=1)
    high = flux[:, (frequencies >= 1200) & (frequencies <= 5200)].mean(axis=1)
    rms = np.sqrt(np.mean(frames * frames, axis=1))

    full = robust_normalize(smooth(full, 3))
    low = robust_normalize(smooth(low, 3))
    high = robust_normalize(smooth(high, 2))
    rms = robust_normalize(smooth(rms, max(1, int(.18 * sample_rate / HOP))))
    return full, low, high, rms


def estimate_tempo(onset: np.ndarray, sample_rate: int) -> tuple[float, list[float]]:
    frame_rate = sample_rate / HOP
    min_lag = int(frame_rate * 60 / TEMPO_MAX)
    max_lag = int(frame_rate * 60 / TEMPO_MIN)
    local_scores = np.zeros(max_lag + 1, dtype=np.float64)
    local_weights = np.zeros(max_lag + 1, dtype=np.float64)
    analysis = onset[: int(frame_rate * 240)]
    window = int(frame_rate * 12)
    step = int(frame_rate * 4)
    for start in range(0, max(1, len(analysis) - window + 1), step):
        segment = analysis[start : start + window]
        segment = segment - np.mean(segment)
        energy = float(np.dot(segment, segment))
        if energy < 1e-8:
            continue
        correlation = np.correlate(segment, segment, mode="full")[len(segment) - 1 :]
        correlation /= max(correlation[0], 1e-8)
        for lag in range(min_lag, max_lag + 1):
            score = correlation[lag]
            if lag * 2 < len(correlation):
                score += correlation[lag * 2] * .46
            if lag * 3 < len(correlation):
                score += correlation[lag * 3] * .18
            local_scores[lag] += max(0.0, float(score)) * energy
            local_weights[lag] += energy
    local_scores /= np.maximum(local_weights, 1e-8)

    candidates = []
    for lag in range(min_lag, max_lag + 1):
        score = local_scores[lag]
        bpm = 60 * frame_rate / lag
        # Prefer the canonical quarter-note range only enough to resolve octave aliases.
        prior = math.exp(-0.5 * ((math.log2(bpm / 118.0)) / .55) ** 2)
        candidates.append((score * (.64 + .36 * prior), lag))
    ranked = sorted(candidates, reverse=True)
    _, best_lag = ranked[0]

    # Parabolic refinement around the best lag.
    if 1 <= best_lag < len(local_scores) - 1:
        left, centre, right = local_scores[best_lag - 1 : best_lag + 2]
        denominator = left - 2 * centre + right
        adjustment = .5 * (left - right) / denominator if abs(denominator) > 1e-12 else 0
        best_lag = best_lag + float(np.clip(adjustment, -.5, .5))
    top_bpms = []
    for _, lag in ranked:
        bpm = 60 * frame_rate / lag
        if all(abs(math.log2(bpm / existing)) > .025 for existing in top_bpms):
            top_bpms.append(float(bpm))
        if len(top_bpms) == 5:
            break
    return float(60 * frame_rate / best_lag), top_bpms


def beat_grid(onset: np.ndarray, low: np.ndarray, high: np.ndarray, rms: np.ndarray, bpm: float, sample_rate: int) -> dict:
    frame_rate = sample_rate / HOP
    period = frame_rate * 60 / bpm
    start_limit = min(len(onset), int(frame_rate * 90))
    music_threshold = max(.08, float(np.percentile(rms[:start_limit], 55)) * .72)
    active = np.flatnonzero(rms > music_threshold)
    music_start = int(active[0]) if len(active) else 0

    # Search beat phase at quarter-frame precision over the first two minutes.
    search_end = min(len(onset), music_start + int(frame_rate * 120))
    phase_candidates = np.linspace(0, period, max(16, int(round(period * 4))), endpoint=False)
    best_phase = 0.0
    best_score = -1.0
    accent = onset * .58 + low * .32 + high * .10
    for phase in phase_candidates:
        first = music_start + ((phase - music_start) % period)
        positions = np.arange(first, search_end, period)
        indices = np.clip(np.rint(positions).astype(int), 0, len(accent) - 1)
        score = float(np.mean(accent[indices])) if len(indices) else 0
        if score > best_score:
            best_score, best_phase = score, phase

    first_beat = music_start + ((best_phase - music_start) % period)
    beats = np.arange(first_beat, len(onset), period)
    beat_indices = np.clip(np.rint(beats).astype(int), 0, len(onset) - 1)
    beat_accents = onset[beat_indices] * .46 + low[beat_indices] * .44 + high[beat_indices] * .10

    # Infer the strongest four-beat phase as the downbeat class.
    phase_scores = []
    for phase_class in range(4):
        values = beat_accents[phase_class : min(len(beat_accents), 256) : 4]
        phase_scores.append(float(np.mean(values)) if len(values) else 0)
    downbeat_class = int(np.argmax(phase_scores))

    downbeats = beats[downbeat_class::4]
    downbeat_indices = beat_indices[downbeat_class::4]
    local_threshold = float(np.percentile(accent[active], 48)) if len(active) else 0
    first_major = downbeats[0] if len(downbeats) else first_beat
    for position, index in zip(downbeats[:16], downbeat_indices[:16]):
        if rms[index] >= music_threshold and accent[index] >= local_threshold:
            first_major = position
            break

    confidence = best_score / max(float(np.mean(accent[music_start:search_end])), 1e-6)
    return {
        "bpm": round(bpm, 3),
        "first_beat_seconds": round(first_beat / frame_rate, 3),
        "first_downbeat_seconds": round(first_major / frame_rate, 3),
        "beats_per_bar": 4,
        "analysis_confidence": round(float(np.clip(confidence / 3.0, 0, 1)), 3),
    }


def analyze(ffmpeg: pathlib.Path, video: pathlib.Path) -> dict:
    audio, sample_rate = decode_audio(ffmpeg, video)
    onset, low, high, rms = envelopes(audio, sample_rate)
    estimated_bpm, tempo_candidates = estimate_tempo(onset, sample_rate)
    bpm = CANONICAL_BPM.get(video.name, estimated_bpm)
    result = beat_grid(onset, low, high, rms, bpm, sample_rate)
    result.update({
        "file": video.name,
        "duration_seconds": round(len(audio) / sample_rate, 3),
        "analysis_version": "local_spectral_flux_v2_canonical_tempo",
        "estimated_bpm": round(estimated_bpm, 3),
        "tempo_candidates_bpm": [round(value, 3) for value in tempo_candidates],
    })
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("videos", nargs="+", type=pathlib.Path)
    parser.add_argument("--ffmpeg", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()

    results = []
    for index, video in enumerate(args.videos, 1):
        print(f"[{index}/{len(args.videos)}] {video.name}", flush=True)
        results.append(analyze(args.ffmpeg, video))
    payload = {"version": "video_beat_grid_v1", "tracks": results}
    encoded = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.write_text(encoded, encoding="utf-8")
    else:
        print(encoded)


if __name__ == "__main__":
    main()
