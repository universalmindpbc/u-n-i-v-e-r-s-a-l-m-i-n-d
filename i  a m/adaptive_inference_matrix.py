#!/usr/bin/env python3
"""Compile the current-session v5.55 inference input and privacy-safe audit.

This module does not diagnose and does not select music, bands, carriers or DSP
from Heart Rate thresholds. It prepares the current self-report, one optional
30-second Heart Rate observation, and time/weather/location context for the
inference model. The model returns semantic intent; deterministic selectors
continue to resolve only approved catalogue and policy identifiers.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Mapping, Optional


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MATRIX_PATH = BASE_DIR / "adaptive-inference-matrix-v1.json"


def load_matrix(path: Path = DEFAULT_MATRIX_PATH) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _clean_text(value: Any, limit: int) -> Optional[str]:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split()).strip()
    return cleaned[:limit] if cleaned else None


def _number(value: Any) -> Optional[float]:
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number or number in (float("inf"), float("-inf")):
        return None
    return number


def classify_heart_rate_zone(heart_rate_bpm: Any, matrix: Optional[Mapping[str, Any]] = None) -> str:
    """Return an observation zone, never a physiological or mental diagnosis."""
    selected_matrix = matrix or load_matrix()
    bpm = _number(heart_rate_bpm)
    if bpm is None:
        return "not_available"
    for zone_id in ("low_observed", "mid_observed", "elevated_observed"):
        definition = selected_matrix["heart_rate_observation_zones"][zone_id]
        if float(definition["bpm_min"]) <= bpm <= float(definition["bpm_max"]):
            return zone_id
    return "not_available"


def normalize_momentary_physiology(
    value: Any,
    matrix: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    """Validate one optional 30-second Heart Rate input for this request only."""
    selected_matrix = matrix or load_matrix()
    source = value if isinstance(value, Mapping) else {}
    bpm = _number(source.get("heart_rate_bpm"))
    zone = classify_heart_rate_zone(bpm, selected_matrix)
    valid = zone != "not_available"
    contract = selected_matrix["input_contract"]["momentary_physiology"]
    return {
        "heart_rate_bpm": round(bpm) if valid and bpm is not None else None,
        "heart_rate_zone": zone,
        "measurement_duration_seconds": int(contract["measurement_duration_seconds"]),
        "measurement_timing": contract["measurement_timing"],
        "source": contract["source"],
        "baseline_available": False,
        "trend_available": False,
        "valid": valid,
        "optional_non_blocking": True,
        "scope": "current_inference_request_only",
    }


def normalize_environment_context(value: Any) -> Dict[str, Any]:
    source = value if isinstance(value, Mapping) else {}
    temperature = _number(source.get("temperature_celsius"))
    precision = _clean_text(source.get("location_precision"), 24) or "none"
    if precision not in {"none", "approximate", "precise"}:
        precision = "none"
    context = {
        "local_time": _clean_text(source.get("local_time"), 32),
        "weather_condition": _clean_text(source.get("weather_condition"), 64),
        "temperature_celsius": round(temperature, 1) if temperature is not None else None,
        "location_label": _clean_text(source.get("location_label"), 96),
        "location_precision": precision,
        "context_role": "all_adaptive_decisions_all_horizons",
    }
    if not context["location_label"]:
        context["location_precision"] = "none"
    context["context_available"] = any(
        context[field] is not None
        for field in ("local_time", "weather_condition", "temperature_celsius", "location_label")
    )
    return context


def compile_current_inference_input(
    self_report: Any,
    environment_context: Any = None,
    momentary_physiology: Any = None,
    matrix: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    """Create the model input; the raw BPM exists only in this request object."""
    selected_matrix = matrix or load_matrix()
    report = _clean_text(self_report, 180)
    if not report:
        raise ValueError("A current self-report is required for personalised inference.")
    return {
        "matrix_schema_version": selected_matrix["schema_version"],
        "self_report": report,
        "environment_context": normalize_environment_context(environment_context),
        "momentary_physiology": normalize_momentary_physiology(momentary_physiology, selected_matrix),
        "horizon_context_rule": dict(selected_matrix["horizon_context_rule"]),
        "clinical_status": "not_a_diagnosis",
        "baseline_comparison_used": False,
    }


def persistable_inference_audit(compiled_input: Mapping[str, Any]) -> Dict[str, Any]:
    """Remove the raw BPM and retain only reproducible non-diagnostic provenance."""
    physiology = compiled_input.get("momentary_physiology")
    physiology = physiology if isinstance(physiology, Mapping) else {}
    context = compiled_input.get("environment_context")
    context = context if isinstance(context, Mapping) else {}
    return {
        "matrix_schema_version": compiled_input.get("matrix_schema_version"),
        "heart_rate_role": "supporting" if physiology.get("valid") else "not_available",
        "heart_rate_zone": physiology.get("heart_rate_zone", "not_available"),
        "raw_heart_rate_retained": False,
        "baseline_comparison_used": False,
        "context_dimensions_considered": {
            "time": bool(context.get("local_time")),
            "weather": bool(context.get("weather_condition") or context.get("temperature_celsius") is not None),
            "location": bool(context.get("location_label")),
        },
        "horizons_considered": ["horizon_1", "horizon_2", "horizon_3"],
        "clinical_status": "not_a_diagnosis",
    }


def external_model_payload(compiled_input: Mapping[str, Any]) -> Dict[str, Any]:
    """Return the v5.55 model payload with all Heart Rate-derived data removed."""
    return {
        "checkin": compiled_input.get("self_report"),
        "environment_context": dict(compiled_input.get("environment_context") or {}),
    }


if __name__ == "__main__":
    import sys

    payload = json.load(sys.stdin)
    compiled = compile_current_inference_input(
        payload.get("checkin") or payload.get("self_report"),
        payload.get("environment_context"),
        payload.get("momentary_physiology"),
    )
    json.dump({
        "input": compiled,
        "external_model_payload": external_model_payload(compiled),
        "persistable_audit": persistable_inference_audit(compiled),
    }, sys.stdout, indent=2)
    sys.stdout.write("\n")
