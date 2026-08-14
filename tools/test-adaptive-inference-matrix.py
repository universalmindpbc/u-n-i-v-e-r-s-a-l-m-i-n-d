#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "i  a m" / "adaptive_inference_matrix.py"
MATRIX_PATH = ROOT / "i  a m" / "adaptive-inference-matrix-v1.json"

spec = importlib.util.spec_from_file_location("adaptive_inference_matrix", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(module)

matrix = json.loads(MATRIX_PATH.read_text(encoding="utf-8"))
assert matrix["name"] == "Current Inference Matrix"
assert matrix["language_rule"].startswith("Use Inference, never Scenario")
assert all("scenario" not in row["id"] for row in matrix["inferences"])
assert matrix["input_contract"]["momentary_physiology"]["baseline_available"] is False
assert matrix["input_contract"]["momentary_physiology"]["future_after_platform_and_ux_validation"]["signals"] == [
    "blood_pressure",
    "heart_rate_variability",
    "baevsky_stress_index",
    "body_mass_index",
]
assert matrix["input_contract"]["momentary_physiology"]["future_after_platform_and_ux_validation"]["target_capture_duration_seconds_max"] == 60
assert matrix["required_output_audit"]["raw_heart_rate_retained"] is False
assert set(matrix["horizon_context_rule"]) == {"horizon_1", "horizon_2", "horizon_3"}

assert module.classify_heart_rate_zone(59, matrix) == "low_observed"
assert module.classify_heart_rate_zone(60, matrix) == "mid_observed"
assert module.classify_heart_rate_zone(100, matrix) == "mid_observed"
assert module.classify_heart_rate_zone(101, matrix) == "elevated_observed"
assert module.classify_heart_rate_zone(20, matrix) == "not_available"
assert module.classify_heart_rate_zone("invalid", matrix) == "not_available"

compiled = module.compile_current_inference_input(
    "I am energised after surfing",
    {
        "local_time": "08:12",
        "weather_condition": "clear",
        "temperature_celsius": 23.4,
        "location_label": "coastal",
        "location_precision": "approximate",
    },
    {"heart_rate_bpm": 108},
    matrix,
)
assert compiled["momentary_physiology"]["heart_rate_bpm"] == 108
assert compiled["momentary_physiology"]["heart_rate_zone"] == "elevated_observed"
assert compiled["momentary_physiology"]["baseline_available"] is False
assert compiled["environment_context"]["context_role"] == "all_adaptive_decisions_all_horizons"

audit = module.persistable_inference_audit(compiled)
assert "heart_rate_bpm" not in audit
assert audit["raw_heart_rate_retained"] is False
assert audit["baseline_comparison_used"] is False
assert all(audit["context_dimensions_considered"].values())

external_payload = module.external_model_payload(compiled)
assert "momentary_physiology" not in external_payload
assert "heart_rate_bpm" not in json.dumps(external_payload)
assert "heart_rate_zone" not in json.dumps(external_payload)

without_hr = module.compile_current_inference_input("I am calm", {}, {}, matrix)
assert without_hr["momentary_physiology"]["heart_rate_bpm"] is None
assert without_hr["momentary_physiology"]["optional_non_blocking"] is True

print("adaptive inference matrix checks passed")
