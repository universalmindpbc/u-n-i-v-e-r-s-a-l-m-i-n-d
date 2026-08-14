#!/usr/bin/env python3
"""Deterministic current-session adaptive-sound policy resolver.

The inference model provides a semantic intent and scored citizen-needs state.
This module owns the auditable band/carrier decision and safety gating. It does
not read raw check-in text or the separate research-hypotheses registry.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, Optional, Tuple


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_POLICY_PATH = BASE_DIR / "adaptive-sound-intent-policy-v1.json"
CONTEXT_DIMENSIONS = ("time", "weather", "location")
HORIZONS = ("horizon_1", "horizon_2", "horizon_3")


def _nested(value: Mapping[str, Any], path: Iterable[str], default: Any = None) -> Any:
    current: Any = value
    for key in path:
        if not isinstance(current, Mapping) or key not in current:
            return default
        current = current[key]
    return current


def _normalize_label(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


def _number(value: Any) -> float:
    try:
        if isinstance(value, bool):
            return 0.0
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return 0.0


def _flatten_scores(value: Any, scores: Dict[str, float]) -> None:
    if not isinstance(value, Mapping):
        return
    for label, child in value.items():
        if isinstance(child, Mapping):
            _flatten_scores(child, scores)
        elif isinstance(child, (int, float)) and not isinstance(child, bool):
            key = _normalize_label(label)
            scores[key] = max(scores.get(key, 0.0), _number(child))


def collect_need_scores(payload: Mapping[str, Any]) -> Dict[str, float]:
    """Collect structured scores and explicit highlights, never raw prose."""
    scores: Dict[str, float] = {}
    for field in ("citizen_needs", "needs_scorecard", "radar_scores"):
        _flatten_scores(payload.get(field), scores)
    for field in ("top_highlights", "highlights", "top_needs_used"):
        for label in payload.get(field) or []:
            key = _normalize_label(label)
            if key:
                scores[key] = max(scores.get(key, 0.0), 0.82)
    return scores


def _score_options(options: Mapping[str, Any], need_scores: Mapping[str, float]) -> Dict[str, float]:
    results: Dict[str, float] = {}
    for option_id, definition in options.items():
        weights = definition.get("need_weights") if isinstance(definition, Mapping) else {}
        weighted_sum = sum(
            need_scores.get(_normalize_label(label), 0.0) * float(weight)
            for label, weight in (weights or {}).items()
        )
        weight_sum = sum(float(weight) for weight in (weights or {}).values()) or 1.0
        results[option_id] = weighted_sum / weight_sum
    return results


def _state_fingerprint(payload: Mapping[str, Any], need_scores: Mapping[str, float]) -> str:
    semantic_intent = payload.get("adaptive_sound_intent")
    state = {
        "needs": need_scores,
        "intent": semantic_intent if isinstance(semantic_intent, Mapping) else {},
        "visitor": str(_nested(payload, ["selection_context", "visitor_id"], "anonymous")),
    }
    encoded = json.dumps(state, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _choose_scored(scores: Mapping[str, float], fingerprint: str, namespace: str) -> Optional[str]:
    if not scores or max(scores.values(), default=0.0) <= 0.0:
        return None
    best = max(scores.values())
    tied = sorted(option_id for option_id, score in scores.items() if abs(score - best) <= 1e-12)
    if len(tied) == 1:
        return tied[0]
    digest = hashlib.sha256(f"{namespace}\u241f{fingerprint}".encode("utf-8")).digest()
    return tied[int.from_bytes(digest[:8], "big") % len(tied)]


def _explicit_selection(payload: Mapping[str, Any], valid_bands: set[str], valid_carriers: set[str]) -> Tuple[Optional[str], Optional[str], str]:
    session_choice = _nested(payload, ["selection_context", "adaptive_sound_session_choice"], {})
    if isinstance(session_choice, Mapping):
        band = str(session_choice.get("band_intent") or "").casefold()
        carrier = str(session_choice.get("carrier_intent") or "").casefold()
        if band in valid_bands and carrier in valid_carriers:
            return band, carrier, "citizen_session_override"

    intent = payload.get("adaptive_sound_intent")
    if isinstance(intent, Mapping) and intent.get("relevant") is not False:
        band = str(intent.get("band_intent") or "").casefold()
        carrier = str(intent.get("carrier_intent") or "").casefold()
        if band in valid_bands and carrier in valid_carriers:
            return band, carrier, "inference_semantic_intent"
    return None, None, "deterministic_needs_scores"


def _safety_state(payload: Mapping[str, Any], policy: Mapping[str, Any]) -> Dict[str, Any]:
    safety_policy = policy["safety_policy"]
    support_level = str(_nested(payload, ["adaptive_support_relevance", "level"], "none")).casefold()
    review_value = payload.get("human_review_relevance", "not_indicated")
    if isinstance(review_value, Mapping):
        review_level = str(review_value.get("level") or "none").casefold()
    else:
        review_level = str(review_value).casefold()
    intent_safety = str(_nested(payload, ["adaptive_sound_intent", "safety_state"], "standard")).casefold()
    flags = payload.get("safety_flags") or []
    flag_text = " ".join(str(flag).casefold() for flag in flags)
    high_concern = (
        support_level in set(safety_policy["high_concern_support_levels"])
        or review_level in set(safety_policy["high_concern_human_review_levels"])
        or intent_safety == "high_concern"
        or any(token in flag_text for token in ("acute", "crisis", "immediate danger", "urgent"))
    )

    preferences = _nested(payload, ["selection_context", "adaptive_sound_preferences"], {})
    preferences = preferences if isinstance(preferences, Mapping) else {}
    master_enabled = preferences.get("sound_master_enabled") is not False
    quantum_tree_preference = preferences.get("quantum_tree_enabled") is not False
    frequency_preference = preferences.get("adaptive_frequencies_enabled") is not False
    high_concern_opt_in = preferences.get("high_concern_session_opt_in") is True

    contact_consent = preferences.get("authorized_human_contact_consent") is True
    verified_contact = bool(str(preferences.get("authorized_contact_id") or "").strip())
    human_approval = preferences.get("human_in_the_loop_approval") is True
    if not high_concern:
        notification_status = "not_applicable"
    elif contact_consent and verified_contact and human_approval:
        notification_status = "authorized_for_human_operator_not_sent_by_model"
    elif contact_consent and verified_contact:
        notification_status = "pending_human_review_approval"
    else:
        notification_status = "blocked_until_consent_and_verified_contact"

    adaptive_enabled = master_enabled and frequency_preference
    if high_concern:
        adaptive_enabled = adaptive_enabled and high_concern_opt_in

    return {
        "state": "high_concern" if high_concern else "standard",
        "quantum_tree_enabled": master_enabled and quantum_tree_preference,
        "quantum_tree_policy": safety_policy["quantum_tree"],
        "adaptive_frequencies_enabled": adaptive_enabled,
        "adaptive_frequencies_default": False if high_concern else True,
        "citizen_session_opt_in_required": high_concern,
        "human_review_required": high_concern,
        "notification": {
            "status": notification_status,
            "authority": safety_policy["notification_authority"],
            "model_must_not_contact_any_person": True,
        },
    }


def _inference_audit(payload: Mapping[str, Any]) -> Dict[str, Any]:
    """Carry privacy-safe inference provenance; never retain raw Heart Rate."""
    intent = payload.get("adaptive_sound_intent")
    intent = intent if isinstance(intent, Mapping) else {}
    current = payload.get("current_inference")
    current = current if isinstance(current, Mapping) else {}
    modifiers = [
        str(value).strip()[:80]
        for value in intent.get("context_modifiers_used") or []
        if str(value).strip()
    ][:6]
    considered = [
        str(value)
        for value in intent.get("horizons_considered") or HORIZONS
        if str(value) in HORIZONS
    ]
    heart_rate_role = str(current.get("heart_rate_role") or "not_available")
    if heart_rate_role not in {"supporting", "conflicting", "not_available", "invalid"}:
        heart_rate_role = "invalid"
    heart_rate_zone = str(current.get("heart_rate_zone") or "not_available")
    if heart_rate_zone not in {"low_observed", "mid_observed", "elevated_observed", "not_available"}:
        heart_rate_zone = "not_available"
    return {
        "context_modifiers_used": modifiers,
        "context_dimensions_considered": list(CONTEXT_DIMENSIONS),
        "horizons_considered": considered or list(HORIZONS),
        "heart_rate_role": heart_rate_role,
        "heart_rate_zone": heart_rate_zone,
        "raw_heart_rate_retained": False,
        "baseline_comparison_used": False,
    }


def load_policy(path: Path = DEFAULT_POLICY_PATH) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_adaptive_sound(payload: Mapping[str, Any], policy: Optional[Mapping[str, Any]] = None) -> Dict[str, Any]:
    selected_policy = dict(policy or load_policy())
    bands = selected_policy["bands"]
    carriers = selected_policy["carriers"]
    need_scores = collect_need_scores(payload)
    fingerprint = _state_fingerprint(payload, need_scores)
    band_id, carrier_id, basis = _explicit_selection(payload, set(bands), set(carriers))
    semantic_intent = payload.get("adaptive_sound_intent")
    explicit_insufficient_context = (
        isinstance(semantic_intent, Mapping)
        and semantic_intent.get("relevant") is False
        and basis != "citizen_session_override"
    )

    band_scores = _score_options(bands, need_scores)
    carrier_scores = _score_options(carriers, need_scores)
    if not band_id and not explicit_insufficient_context:
        band_id = _choose_scored(band_scores, fingerprint, "band")
    if not carrier_id and not explicit_insufficient_context:
        carrier_id = _choose_scored(carrier_scores, fingerprint, "carrier")

    safety = _safety_state(payload, selected_policy)
    inference_audit = _inference_audit(payload)
    if not band_id or not carrier_id:
        safety["adaptive_frequencies_enabled"] = False
        return {
            "schema_version": "iam_adaptive_sound_session_resolution_v1",
            "policy_version": selected_policy["policy_version"],
            "selected": False,
            "reason": "no_structured_checkin_intent_or_need_scores",
            "session_scope": "current_session_only",
            "carrier_mode": "single",
            "safety": safety,
            "research_boundary": "biological_targets_not_loaded_or_used_by_product_resolver",
            "audit": {
                "raw_checkin_text_used": False,
                "automatic_mid_session_morph": False,
                **inference_audit,
            },
        }

    band = bands[band_id]
    carrier = carriers[carrier_id]
    ranked_needs = sorted(need_scores.items(), key=lambda item: (-item[1], item[0]))
    semantic_intent = semantic_intent if isinstance(semantic_intent, Mapping) else {}
    reported_top_needs = [
        str(label).strip()
        for label in semantic_intent.get("top_needs_used") or []
        if str(label).strip()
    ][:4]
    allowed_cue_keys = {
        _normalize_label(cue)
        for definition in carriers.values()
        for cue in definition.get("experience") or []
    } | {
        _normalize_label(definition.get("experience"))
        for definition in bands.values()
    }
    explicit_cues = [
        str(cue).strip()[:80]
        for cue in semantic_intent.get("explicit_cues_used") or []
        if str(cue).strip() and _normalize_label(cue) in allowed_cue_keys
    ][:4]
    inferred_confidence = _number(semantic_intent.get("confidence"))
    return {
        "schema_version": "iam_adaptive_sound_session_resolution_v1",
        "policy_version": selected_policy["policy_version"],
        "selected": True,
        "selection_basis": basis,
        "session_scope": "current_session_only",
        "automatic_mid_session_morph": False,
        "band_intent": band_id,
        "experience": band["experience"],
        "profile_id": band["profile_id"],
        "carrier_intent": carrier_id,
        "carrier_hz": carrier["carrier_hz"],
        "carrier_mode": "single",
        "diamond_power_weights": band["diamond_power_weights"],
        "isochronic_hz": selected_policy["isochronic_hz"],
        "noise_power_weight": selected_policy["allocation"]["noise_power"],
        "silence_power_weight": selected_policy["allocation"]["silence_power"],
        "top_needs_used": reported_top_needs or [label for label, score in ranked_needs[:4] if score > 0],
        "explicit_cues_used": explicit_cues,
        "confidence": inferred_confidence or round(max(band_scores.get(band_id, 0.0), carrier_scores.get(carrier_id, 0.0)), 6),
        "scores": {
            "selected_band": round(band_scores.get(band_id, 0.0), 6),
            "selected_carrier": round(carrier_scores.get(carrier_id, 0.0), 6),
        },
        "safety": safety,
        "research_boundary": "biological_targets_not_loaded_or_used_by_product_resolver",
        "claim_boundary": selected_policy["claim_boundary"],
        "audit": {
            "raw_checkin_text_used": False,
            "research_hypotheses_registry_loaded": False,
            "current_session_only": True,
            **inference_audit,
        },
    }


if __name__ == "__main__":
    import sys

    source = json.load(sys.stdin)
    json.dump(resolve_adaptive_sound(source), sys.stdout, indent=2)
    sys.stdout.write("\n")
