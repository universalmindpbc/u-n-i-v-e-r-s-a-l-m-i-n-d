#!/usr/bin/env python3
"""Regression QA for adaptive-music cold-start bias and catalogue boundaries."""

from __future__ import annotations

from collections import Counter
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
IAM_DIR = ROOT / "i  a m"
sys.path.insert(0, str(IAM_DIR))

import selector_core as selector  # noqa: E402


STATE_FIXTURES = {
    "hungry": {
        "music_room": "inner-planes",
        "highlights": ["Recovery", "Attention", "Calm", "Clarity"],
        "radar": {"Recovery": 0.34, "Attention": 0.28, "Calm": 0.24, "Clarity": 0.12},
        "maslow": {"Physiological Regulation": 0.82, "Rest": 0.18},
    },
    "full_of_food": {
        "music_room": "champagne-bohemia",
        "highlights": ["Recovery", "Calm", "Sleep Pressure", "Fatigue"],
        "radar": {"Recovery": 0.46, "Calm": 0.42, "Sleep Pressure": 0.34, "Fatigue": 0.28},
        "maslow": {"Physiological Regulation": 0.64, "Rest": 0.38},
    },
    "relaxed": {
        "music_room": "inner-planes",
        "highlights": ["Calm", "Recovery", "Psychological Safety", "Clarity"],
        "radar": {"Calm": 0.90, "Recovery": 0.76, "Psychological Safety": 0.82, "Clarity": 0.72},
        "maslow": {"Physiological Regulation": 0.72, "Rest": 0.55},
    },
    "happy": {
        "music_room": "modul8-infinity",
        "highlights": ["Joy", "Arousal", "Hope", "Motivation"],
        "radar": {"Joy": 0.90, "Arousal": 0.72, "Hope": 0.76, "Motivation": 0.68},
        "maslow": {"Physiological Regulation": 0.24, "Rest": 0.04},
    },
    "sad": {
        "music_room": "james-bondage",
        "highlights": ["Recovery", "Stress", "Loneliness", "Calm"],
        "radar": {"Recovery": 0.64, "Stress": 0.58, "Loneliness": 0.46, "Calm": 0.38},
        "maslow": {"Physiological Regulation": 0.32, "Rest": 0.22},
    },
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def payload_for(name: str, visitor_id: str, index: int = 0, history: list[str] | None = None) -> dict:
    fixture = STATE_FIXTURES[name]
    return {
        "top_needs_used": fixture["highlights"],
        "selected_music_room": fixture["music_room"],
        "needs_scorecard": {
            "human_needs_radar": fixture["radar"],
            "maslow_human_needs": fixture["maslow"],
        },
        "selection_context": {
            "visitor_id": visitor_id,
            "recent_track_ids": history or [],
            "recommendation_index": index,
        },
    }


def main() -> None:
    catalogue = selector.load_catalogue(selector.DEFAULT_CATALOGUE_PATH)
    tracks = catalogue["tracks"]
    opening_tracks = [track for track in tracks if not selector.opening_catalogue_veto(track, {})[0]]

    require(len(tracks) == 30, f"Expected the combined 30-item catalogue, found {len(tracks)}.")
    require(len(opening_tracks) == 22, f"Opening selector must expose exactly 22 safe music videos, found {len(opening_tracks)}.")
    require(all(track.get("media_class") != "long_form_dj_set" for track in opening_tracks), "A DJ set leaked into the opening selector.")
    require(all(not selector.track_safety(track).get("requires_age_gate") for track in opening_tracks), "An age-gated track leaked into the opening selector.")

    for track in tracks:
        affinities = track.get("citizen_need_affinities")
        require(isinstance(affinities, dict) and affinities, f"{track.get('id')} has no numeric affinity map.")
        require(all(key in selector.VECTOR_KEYS for key in affinities), f"{track.get('id')} has malformed affinity keys.")
        require(all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in affinities.values()), f"{track.get('id')} has non-numeric affinities.")

    visitor_count = 128
    combined = Counter()
    per_state: dict[str, Counter] = {}
    for state_name in STATE_FIXTURES:
        counts = Counter()
        for visitor_index in range(visitor_count):
            output = selector.execute_v1_11_selection(
                payload_for(state_name, f"bias-qa-{visitor_index}"),
                catalogue,
            )
            selected_id = output["selected_track_id"]
            counts[selected_id] += 1
            combined[selected_id] += 1
            selected_track = next(track for track in tracks if track.get("id") == selected_id)
            require(selected_track.get("media_class") != "long_form_dj_set", f"{state_name} selected a DJ set at cold start.")
            require(not selector.track_safety(selected_track).get("requires_age_gate"), f"{state_name} selected an age-gated track at cold start.")
        per_state[state_name] = counts
        require(len(counts) >= 2, f"{state_name} still collapses to one cold-start track.")

    total_cases = visitor_count * len(STATE_FIXTURES)
    tiny_cities_share = combined["flume-tiny-cities"] / total_cases
    most_common_track, most_common_count = combined.most_common(1)[0]
    require(tiny_cities_share < 0.32, f"Tiny Cities still owns {tiny_cities_share:.1%} of cold starts.")
    require(most_common_count / total_cases < 0.35, f"{most_common_track} still dominates {most_common_count / total_cases:.1%} of cold starts.")
    require(len(combined) >= 9, f"Cold-start QA reached only {len(combined)} opening tracks.")

    deterministic_payload = payload_for("hungry", "determinism-check")
    first_output = selector.execute_v1_11_selection(deterministic_payload, catalogue)
    second_output = selector.execute_v1_11_selection(deterministic_payload, catalogue)
    first = first_output["selected_track_id"]
    second = second_output["selected_track_id"]
    require(first == second, "The same inferred state and anonymous visitor must remain deterministic.")
    require(first_output["audit"]["selector"]["selected_music_room"] == "inner-planes", "The selected music room did not reach the selector audit.")

    happy_payload = payload_for("happy", "music-room-check")
    happy_output = selector.execute_v1_11_selection(happy_payload, catalogue)
    require(happy_output["audit"]["selector"]["selected_music_room"] == "modul8-infinity", "The selected music room did not reach the selector audit.")
    alternate_room_payload = {**happy_payload, "selected_music_room": "inner-planes"}
    alternate_room_output = selector.execute_v1_11_selection(alternate_room_payload, catalogue)
    require(
        happy_output["audit"]["selector_score_parts"]["target_activation_level"] == alternate_room_output["audit"]["selector_score_parts"]["target_activation_level"],
        "Music-room identity must not act as a calm/chill/house activation ladder.",
    )
    require(happy_output["extended_session"]["music_room"] != "safety-cushion", "Safety Cushion became playable before ready assets were attached.")
    require(
        happy_output["extended_session"]["format_policy"]["weights"] == selector.EXTENDED_SESSION_FORMAT_WEIGHTS,
        "The extended-session output lost the canonical 80/10/10 format policy.",
    )

    format_counts = Counter()
    for visitor_index in range(10000):
        extended_format, _ = selector.assigned_extended_format(
            payload_for("happy", f"format-mix-{visitor_index}")
        )
        format_counts[extended_format] += 1
    require(0.77 <= format_counts["parties"] / 10000 <= 0.83, f"Parties format drifted from 80%: {format_counts}.")
    require(0.08 <= format_counts["radio"] / 10000 <= 0.12, f"Radio format drifted from 10%: {format_counts}.")
    require(0.08 <= format_counts["videos"] / 10000 <= 0.12, f"Videos format drifted from 10%: {format_counts}.")

    history: list[str] = []
    quota_modes: list[str] = []
    sequence: list[str] = []
    for index in range(13):
        output = selector.execute_v1_11_selection(
            payload_for("hungry", "cycle-check", index, history),
            catalogue,
        )
        selected_id = output["selected_track_id"]
        require(selected_id not in history[:6], f"The six-track recency shield repeated {selected_id} at position {index}.")
        sequence.append(selected_id)
        quota_modes.append(output["audit"]["selector"]["quota_mode"])
        history = [selected_id, *[track_id for track_id in history if track_id != selected_id]][:13]

    require(quota_modes.count("uplift") == 10, f"Expected 10 uplift slots, found {quota_modes.count('uplift')}.")
    require(quota_modes.count("state_led") == 3, f"Expected 3 state-led slots, found {quota_modes.count('state_led')}.")

    print(json.dumps({
        "schema_version": "adaptive_music_selector_bias_qa_v1",
        "policy_version": selector.SELECTION_POLICY_VERSION,
        "catalogue_tracks": len(tracks),
        "opening_safe_music_videos": len(opening_tracks),
        "cold_start_cases": total_cases,
        "cold_start_unique_tracks": len(combined),
        "tiny_cities_share": round(tiny_cities_share, 4),
        "most_common": [most_common_track, most_common_count],
        "per_state": {name: counts.most_common() for name, counts in per_state.items()},
        "cycle_unique_tracks": len(set(sequence)),
        "cycle_sequence": sequence,
        "quota_modes": quota_modes,
        "extended_session_format_counts": format_counts,
    }, indent=2))


if __name__ == "__main__":
    main()
