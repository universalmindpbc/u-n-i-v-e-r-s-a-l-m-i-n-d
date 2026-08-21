#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IAM_DIR = ROOT / "i  a m"
sys.path.insert(0, str(IAM_DIR))

import selector_core as selector  # noqa: E402


inner = {"id": "inner", "music_room": "inner-planes"}
champagne = {"id": "champagne", "music_room": "champagne-bohemia"}
modul8 = {"id": "modul8", "music_room": "modul8-infinity"}

morning = {"local_time": "08:15", "weather_condition": "clear", "location_label": "home"}
evening_coast = {"local_time": "19:15", "weather_condition": "clear", "location_label": "coastal"}
storm = {"local_time": "14:00", "weather_condition": "storm and wind", "location_label": "rural"}
urban = {"local_time": "14:00", "weather_condition": "clear", "location_label": "urban city"}

assert selector.context_fit(inner, morning) > selector.context_fit(modul8, morning)
assert selector.context_fit(champagne, evening_coast) > selector.context_fit(inner, evening_coast)
assert selector.context_fit(inner, storm) > selector.context_fit(modul8, storm)
assert selector.context_fit(modul8, urban) > selector.context_fit(inner, urban)

base = {
    "current_inference": {
        "inference_id": "active_energised",
        "heart_rate_role": "supporting",
        "heart_rate_zone": "elevated_observed",
    },
    "environment_context": evening_coast,
}
conflicting = {
    **base,
    "current_inference": {
        **base["current_inference"],
        "heart_rate_role": "conflicting",
    },
}

supporting_target = selector.build_target_trajectory(base, ["Joy", "Motivation"])
conflicting_target = selector.build_target_trajectory(conflicting, ["Joy", "Motivation"])
assert supporting_target["Joy"] > conflicting_target["Joy"]
assert conflicting_target["Calm"] >= 0.65
assert conflicting_target["Clarity"] >= 0.65

user_vector = {"Joy": 0.8, "Motivation": 0.8, "Arousal": 0.8}
assert selector.target_activation_level(base, user_vector, False) == 3
assert selector.target_activation_level(conflicting, user_vector, False) == 1

audit = selector.current_inference_audit({
    **base,
    "momentary_physiology": {"heart_rate_bpm": 112},
})
assert audit["raw_heart_rate_retained"] is False
assert "heart_rate_bpm" not in audit
assert audit["horizons_considered"] == ["horizon_1", "horizon_2", "horizon_3"]
assert all(audit["context_dimensions_considered"].values())

semantic_bundle = {
    "highlights": ["Joy", "Motivation", "Curiosity", "Arousal"],
    "top_needs_used": ["Joy", "Motivation", "Curiosity", "Arousal"],
    "needs_scorecard": {
        "human_needs_radar": {
            "Joy": 0.90,
            "Motivation": 0.85,
            "Curiosity": 0.80,
            "Arousal": 0.80,
        }
    },
    "environment_context": {
        "local_time": "10:30",
        "location_label": "Sydney",
        "location_precision": "approximate",
    },
    "semantic_intents": {
        "current_inference": {"inference_id": "active_energised"},
        "music_room": {"room": "modul8-infinity"},
        "adaptive_sound": {
            "relevant": True,
            "band_intent": "gamma",
            "carrier_intent": "cognition_joy",
        },
    },
    "adaptive_sound_intent": {
        "relevant": True,
        "band_intent": "gamma",
        "carrier_intent": "cognition_joy",
    },
    "selection_context": {
        "visitor_id": "fusion-exact-0",
        "recommendation_index": 0,
    },
}

supporting_fusion = {
    **semantic_bundle,
    "selected_music_room": "modul8-infinity",
    "current_inference": {
        "inference_id": "active_energised",
        "semantic_inference_id": "active_energised",
        "heart_rate_role": "supporting",
        "heart_rate_zone": "elevated_observed",
        "fusion": {
            "policy_version": "iam_current_inference_fusion_v1.0",
            "action": "supporting_semantic_preserved",
            "music_selection": {
                "adjustment": "supporting_semantic_preserved",
                "activation_cap": None,
                "trajectory_scale": 1,
                "trajectory_emphasis": [],
            },
            "adaptive_sound": {
                "band_intent": "gamma",
                "carrier_intent": "cognition_joy",
            },
            "outputs_changed": [],
        },
    },
}
conflicting_fusion = {
    **semantic_bundle,
    "selected_music_room": "champagne-bohemia",
    "current_inference": {
        "inference_id": "mixed_uncertain",
        "semantic_inference_id": "active_energised",
        "heart_rate_role": "conflicting",
        "heart_rate_zone": "low_observed",
        "fusion": {
            "policy_version": "iam_current_inference_fusion_v1.0",
            "action": "bounded_conflict_downshift",
            "music_selection": {
                "adjustment": "bounded_conflict_downshift",
                "activation_cap": 1,
                "trajectory_scale": 0.75,
                "trajectory_emphasis": ["Calm", "Clarity"],
            },
            "adaptive_sound": {
                "band_intent": "alpha",
                "carrier_intent": "presence",
            },
            "outputs_changed": [
                "music_room",
                "exact_music_selection",
                "adaptive_sound_band",
                "adaptive_sound_carrier",
            ],
        },
    },
}

catalogue = selector.load_catalogue()
supporting_selection = selector.execute_v1_11_selection(supporting_fusion, catalogue)
conflicting_selection = selector.execute_v1_11_selection(conflicting_fusion, catalogue)
assert supporting_selection["selected_track_id"] != conflicting_selection["selected_track_id"]
assert supporting_selection["audit"]["selector_score_parts"]["target_activation_level"] == 3
assert conflicting_selection["audit"]["selector_score_parts"]["target_activation_level"] == 1
assert supporting_selection["audit"]["selector"]["fusion_action"] == "supporting_semantic_preserved"
assert conflicting_selection["audit"]["selector"]["fusion_action"] == "bounded_conflict_downshift"
assert conflicting_selection["adaptive_sound"]["band_intent"] == "alpha"
assert conflicting_selection["adaptive_sound"]["carrier_intent"] == "presence"
assert "heart_rate_bpm" not in json.dumps(conflicting_selection)

print(json.dumps({
    "adaptive_context_policy": "passed",
    "identical_semantic_and_context_supporting_track": supporting_selection["selected_track_id"],
    "identical_semantic_and_context_conflicting_track": conflicting_selection["selected_track_id"],
    "supporting_activation_target": 3,
    "conflicting_activation_target": 1,
    "conflicting_room": "champagne-bohemia",
    "conflicting_band": "alpha",
    "conflicting_carrier": "presence",
    "raw_heart_rate_retained": False,
}, indent=2))
