#!/usr/bin/env python3
"""QA exact application-owned Videos / Parties / Radio source resolution."""

from __future__ import annotations

import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
IAM_DIR = ROOT / "i  a m"
sys.path.insert(0, str(IAM_DIR))

import selector_core as selector  # noqa: E402


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def visitor_for_format(extended_format: str) -> str:
    for index in range(10000):
        visitor_id = f"exact-handoff-{extended_format}-{index}"
        assigned, _ = selector.assigned_extended_format({
            "selection_context": {"visitor_id": visitor_id, "recommendation_index": 0},
        })
        if assigned == extended_format:
            return visitor_id
    raise AssertionError(f"Could not find deterministic fixture for {extended_format}")


def payload(room: str, visitor_id: str) -> dict:
    return {
        "adaptive_environment": {"music_room": {"selected_room": room}},
        "selection_context": {"visitor_id": visitor_id, "recommendation_index": 0},
    }


def main() -> None:
    schedule = selector.load_broadcast_schedule()
    require(schedule["extended_session_format_policy"]["weights"] == selector.EXTENDED_SESSION_FORMAT_WEIGHTS, "Schedule and selector 80/10/10 weights drifted.")
    source_records = {channel["id"]: channel for channel in schedule["channels"]}
    visitor_ids = {extended_format: visitor_for_format(extended_format) for extended_format in selector.EXTENDED_SESSION_FORMAT_WEIGHTS}
    prefixes = {"videos": "video", "parties": "party", "radio": "radio"}
    rooms = ("inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage")
    track = {"music_room": "inner-planes"}
    resolved = {}

    for room in rooms:
        for extended_format, prefix in prefixes.items():
            result = selector.extended_session_contract(
                track,
                [],
                False,
                payload(room, visitor_ids[extended_format]),
                {},
            )
            expected_source = f"{prefix}-{room}"
            require(result["format"] == extended_format, f"{room} did not preserve assigned {extended_format} slot.")
            require(result["music_room"] == room, f"Nested v4.45 room did not resolve for {extended_format}.")
            require(result["source_id"] == expected_source, f"Expected {expected_source}, received {result['source_id']}.")
            require(result["catalogue_ready"] is True, f"{expected_source} was not marked ready.")
            require(source_records[expected_source]["format"] == extended_format, f"{expected_source} has the wrong registry format.")
            require(len(source_records[expected_source]["schedule"]) > 0, f"{expected_source} has no approved schedule.")
            resolved[f"{room}:{extended_format}"] = expected_source

    videos_only = selector.extended_session_contract(
        {"music_room": "safety-cushion"},
        [],
        False,
        payload("safety-cushion", visitor_ids["videos"]),
        {},
    )
    require(videos_only["source_id"] == "video-safety-cushion", "Safety Cushion video source failed.")

    for disallowed in ("parties", "radio"):
        unavailable = selector.extended_session_contract(
            {"music_room": "safety-cushion"},
            [],
            False,
            payload("safety-cushion", visitor_ids[disallowed]),
            {},
        )
        require(unavailable["source_id"] is None, f"Safety Cushion leaked into {disallowed}.")
        require(unavailable["format"] is None and unavailable["catalogue_ready"] is False, f"Safety Cushion {disallowed} did not fail closed.")

    integrated_payload = payload("inner-planes", visitor_ids["parties"])
    integrated_payload.update({
        "highlights": ["Curiosity", "Awe", "Motivation", "Joy"],
        "needs_scorecard": {
            "human_needs_radar": {"Curiosity": 0.9, "Awe": 0.8, "Motivation": 0.75, "Joy": 0.7},
        },
        "adaptive_sound_intent": {
            "relevant": True,
            "band_intent": "gamma",
            "carrier_intent": "earth_focus_reward",
            "top_needs_used": ["Curiosity", "Awe", "Motivation", "Joy"],
            "explicit_cues_used": [],
            "confidence": 0.86,
            "safety_state": "standard",
        },
    })
    integrated = selector.execute_v1_11_selection(integrated_payload, selector.load_catalogue())
    require(integrated["extended_session"]["source_id"] == "party-inner-planes", "Selector integration lost the exact source ID.")
    require(integrated["adaptive_sound"]["profile_id"] == "inspiration_gamma_80_v1", "Selector integration lost the resolved sound profile.")
    require(integrated["adaptive_sound"]["carrier_hz"] == 999, "Selector integration lost the resolved sound carrier.")

    print(json.dumps({
        "schema_version": "adaptive_music_exact_channel_handoff_qa_v1",
        "application_owned_weights": selector.EXTENDED_SESSION_FORMAT_WEIGHTS,
        "format_fixtures": visitor_ids,
        "exact_sources_tested": resolved,
        "three_formats_tested": sorted(prefixes),
        "safety_cushion_videos_only": True,
        "selector_integration": {
            "source_id": integrated["extended_session"]["source_id"],
            "adaptive_profile_id": integrated["adaptive_sound"]["profile_id"],
            "adaptive_carrier_hz": integrated["adaptive_sound"]["carrier_hz"],
        },
    }, indent=2))


if __name__ == "__main__":
    main()
