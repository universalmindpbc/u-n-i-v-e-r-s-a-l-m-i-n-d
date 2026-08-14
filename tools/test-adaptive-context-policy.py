#!/usr/bin/env python3

from __future__ import annotations

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

print("adaptive context policy checks passed")
