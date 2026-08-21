#!/usr/bin/env python3
"""Exhaustive deterministic QA for the Horizon 1 adaptive-sound policy."""

from __future__ import annotations

import itertools
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
IAM_DIR = ROOT / "i  a m"
sys.path.insert(0, str(IAM_DIR))

import adaptive_sound_policy as sound  # noqa: E402


RESEARCH_TARGETS = ("SLC6A4", "CD38", "DOCK2", "OXTR", "DRD2")
EXPECTED_BANDS = {
    "delta": ("sleep_delta_80_v1", "sleep_rest"),
    "theta": ("mindfulness_theta_80_v1", "mindfulness"),
    "alpha": ("calm_alpha_80_v1", "calm"),
    "gamma": ("inspiration_gamma_80_v1", "inspiration"),
}
EXPECTED_CARRIERS = {
    "cognition_joy": 111,
    "self_connection": 222,
    "presence": 444,
    "social_connection": 555,
    "earth_focus_reward": 999,
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def intent_payload(band: str, carrier: str, **extra: object) -> dict:
    payload = {
        "adaptive_sound_intent": {
            "relevant": True,
            "selection_basis": "current_checkin",
            "band_intent": band,
            "carrier_intent": carrier,
            "top_needs_used": ["Calm", "Connection"],
            "explicit_cues_used": [],
            "context_modifiers_used": ["time:08:00", "weather:clear", "location:coastal"],
            "horizons_considered": ["horizon_1", "horizon_2", "horizon_3"],
            "confidence": 0.82,
            "safety_state": "standard",
            "session_scope": "current_session_only",
            "research_boundary": "biological_targets_not_used_in_product_decisions",
        },
        "current_inference": {
            "inference_id": "settled_resting",
            "heart_rate_role": "supporting",
            "heart_rate_zone": "mid_observed",
        },
        "citizen_needs": {
            "Emotion": {"Calm": 0.7},
            "Social": {"Connection": 0.6},
        },
        "adaptive_support_relevance": {"level": "low"},
        "human_review_relevance": "not_indicated",
        "selection_context": {
            "visitor_id": "adaptive-sound-policy-qa",
            "adaptive_sound_preferences": {},
        },
    }
    payload.update(extra)
    return payload


def main() -> None:
    policy = sound.load_policy()
    policy_text = json.dumps(policy, sort_keys=True)
    resolver_text = (IAM_DIR / "adaptive_sound_policy.py").read_text(encoding="utf-8")
    for target in RESEARCH_TARGETS:
        require(target not in policy_text, f"Research target leaked into product policy: {target}")
        require(target not in resolver_text, f"Research target leaked into resolver source: {target}")

    research = json.loads((IAM_DIR / "adaptive-sound-research-hypotheses-v1.json").read_text(encoding="utf-8"))
    require(research["status"] == "research_hypotheses_only_not_product_algorithm", "Research registry boundary is missing.")
    require(
        {row["carrier_hz"]: row["candidate_target"] for row in research["hypotheses"]}
        == {111: "SLC6A4", 222: "CD38", 444: "DOCK2", 555: "OXTR", 999: "DRD2"},
        "Research-only hypotheses registry drifted.",
    )

    matrix = []
    for band, carrier in itertools.product(EXPECTED_BANDS, EXPECTED_CARRIERS):
        fixture = intent_payload(band, carrier)
        fixture["adaptive_sound_intent"]["explicit_cues_used"] = ["presence", *RESEARCH_TARGETS]
        result = sound.resolve_adaptive_sound(fixture, policy)
        profile_id, experience = EXPECTED_BANDS[band]
        require(result["selected"] is True, f"{band}/{carrier} did not resolve.")
        require(result["profile_id"] == profile_id, f"{band} selected the wrong profile.")
        require(result["experience"] == experience, f"{band} selected the wrong experience label.")
        require(result["carrier_hz"] == EXPECTED_CARRIERS[carrier], f"{carrier} selected the wrong frequency.")
        require(result["carrier_mode"] == "single", "Horizon 1 selected more than one carrier.")
        require(result["session_scope"] == "current_session_only", "Resolution escaped the current session.")
        require(result["automatic_mid_session_morph"] is False, "Horizon 2 morphing leaked into Horizon 1.")
        weights = result["diamond_power_weights"]
        require(abs(sum(weights.values()) + result["noise_power_weight"] + result["silence_power_weight"] - 1.0) < 1e-12, "Power allocation does not total one.")
        require(weights[band] == 0.8, f"{band} is not the 80% dominant lane.")
        require(all(value == 0.0666 for lane, value in weights.items() if lane != band), f"{band} secondary lane allocation drifted.")
        decision_text = json.dumps(result, sort_keys=True)
        for target in RESEARCH_TARGETS:
            require(target not in decision_text, f"Research target leaked into {band}/{carrier} decision: {target}")
        require(result["explicit_cues_used"] == ["presence"], "Non-experiential cue leaked into the decision audit.")
        require(result["audit"]["context_dimensions_considered"] == ["time", "weather", "location"], "Context dimensions were not audited.")
        require(result["audit"]["horizons_considered"] == ["horizon_1", "horizon_2", "horizon_3"], "All horizons were not audited.")
        require(result["audit"]["heart_rate_role"] == "supporting", "Heart Rate role was not carried safely.")
        require(result["audit"]["raw_heart_rate_retained"] is False, "Raw Heart Rate leaked into sound audit.")
        require(result["audit"]["baseline_comparison_used"] is False, "Baseline comparison was incorrectly enabled.")
        matrix.append(f"{band}:{result['carrier_hz']}")

    standard = sound.resolve_adaptive_sound(intent_payload("alpha", "presence"), policy)
    require(standard["safety"]["state"] == "standard", "Standard safety state failed.")
    require(standard["safety"]["quantum_tree_enabled"] is True, "Quantum Tree should remain available by default.")
    require(standard["safety"]["adaptive_frequencies_enabled"] is True, "Standard adaptive frequencies should be armed.")

    high_payload = intent_payload("delta", "self_connection")
    high_payload["adaptive_support_relevance"] = {"level": "urgent"}
    high_payload["human_review_relevance"] = "urgent_human_review"
    high = sound.resolve_adaptive_sound(high_payload, policy)
    require(high["safety"]["state"] == "high_concern", "High-concern safety state failed.")
    require(high["safety"]["quantum_tree_enabled"] is True, "High concern incorrectly disabled Quantum Tree.")
    require(high["safety"]["adaptive_frequencies_enabled"] is False, "High concern did not default adaptive frequencies off.")
    require(high["safety"]["human_review_required"] is True, "High concern did not require human review.")
    require(high["safety"]["notification"]["status"] == "blocked_until_consent_and_verified_contact", "Unconsented notification was not blocked.")

    high_payload["selection_context"]["adaptive_sound_preferences"] = {
        "high_concern_session_opt_in": True,
        "authorized_human_contact_consent": True,
        "authorized_contact_id": "verified-contact-fixture",
    }
    consented = sound.resolve_adaptive_sound(high_payload, policy)
    require(consented["safety"]["adaptive_frequencies_enabled"] is True, "Citizen high-concern session opt-in was not respected.")
    require(consented["safety"]["notification"]["status"] == "pending_human_review_approval", "Human approval gate was bypassed.")
    high_payload["selection_context"]["adaptive_sound_preferences"]["human_in_the_loop_approval"] = True
    authorized = sound.resolve_adaptive_sound(high_payload, policy)
    require(authorized["safety"]["notification"]["status"] == "authorized_for_human_operator_not_sent_by_model", "Authorised human-operator state failed.")
    require(authorized["safety"]["notification"]["model_must_not_contact_any_person"] is True, "Model notification boundary failed.")

    high_payload["selection_context"]["adaptive_sound_preferences"]["sound_master_enabled"] = False
    master_off = sound.resolve_adaptive_sound(high_payload, policy)
    require(master_off["safety"]["quantum_tree_enabled"] is False, "Saved master-off preference was ignored.")
    require(master_off["safety"]["adaptive_frequencies_enabled"] is False, "Master-off left adaptive frequencies enabled.")

    no_checkin = sound.resolve_adaptive_sound({}, policy)
    require(no_checkin["selected"] is False, "No-check-in state silently selected a sound condition.")
    require("carrier_hz" not in no_checkin, "No-check-in state silently defaulted a carrier.")

    insufficient = intent_payload("alpha", "presence")
    insufficient["adaptive_sound_intent"].update({
        "relevant": False,
        "selection_basis": "insufficient_context",
        "band_intent": None,
        "carrier_intent": None,
    })
    insufficient_result = sound.resolve_adaptive_sound(insufficient, policy)
    require(insufficient_result["selected"] is False, "Explicit insufficient context was overridden by fallback scores.")
    require("carrier_hz" not in insufficient_result, "Insufficient context silently selected 444 Hz.")

    skipped_biometric = json.loads(json.dumps(insufficient))
    skipped_biometric["checkin"] = "I am calm and taking this moment slowly."
    skipped_biometric["current_inference"].update({
        "heart_rate_role": "not_available",
        "heart_rate_zone": "not_available",
    })
    skipped_result = sound.resolve_adaptive_sound(skipped_biometric, policy)
    require(skipped_result["selected"] is True, "Accepted self-report was blocked when Heart Rate was skipped.")
    require(skipped_result["selection_basis"] == "deterministic_needs_scores", "Skipped-Heart-Rate fallback authority was not audited.")
    require(skipped_result["audit"]["heart_rate_role"] == "not_available", "Skipped Heart Rate was not carried as unavailable.")
    require(skipped_result["audit"]["raw_checkin_text_used"] is False, "Self-report prose was used by the deterministic resolver.")

    fused_conflict = intent_payload("gamma", "cognition_joy")
    fused_conflict["semantic_intents"] = {
        "adaptive_sound": json.loads(json.dumps(fused_conflict["adaptive_sound_intent"]))
    }
    fused_conflict["current_inference"].update({
        "inference_id": "mixed_uncertain",
        "semantic_inference_id": "active_energised",
        "heart_rate_role": "conflicting",
        "heart_rate_zone": "low_observed",
        "fusion": {
            "policy_version": "iam_current_inference_fusion_v1.0",
            "action": "bounded_conflict_downshift",
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
    })
    fused_result = sound.resolve_adaptive_sound(fused_conflict, policy)
    require(fused_result["band_intent"] == "alpha", "Local fusion did not re-rank Gamma to Alpha.")
    require(fused_result["carrier_intent"] == "presence", "Local fusion did not re-rank cognition/joy to presence.")
    require(fused_result["selection_basis"] == "fused_current_inference", "Fused sound authority was not audited.")
    require(fused_result["audit"]["fusion_policy_version"] == "iam_current_inference_fusion_v1.0", "Fusion policy version was not retained.")
    require(fused_result["audit"]["fusion_action"] == "bounded_conflict_downshift", "Fusion action was not retained.")
    require(fused_result["audit"]["raw_heart_rate_retained"] is False, "Raw Heart Rate leaked into fused sound audit.")

    manual_payload = intent_payload("delta", "cognition_joy")
    manual_payload["selection_context"]["adaptive_sound_session_choice"] = {
        "band_intent": "gamma",
        "carrier_intent": "earth_focus_reward",
    }
    manual = sound.resolve_adaptive_sound(manual_payload, policy)
    require(manual["band_intent"] == "gamma" and manual["carrier_hz"] == 999, "Citizen session override failed.")
    require(manual["selection_basis"] == "citizen_session_override", "Session override authority was not audited.")

    scored_payload = {
        "citizen_needs": {
            "Physiological": {"Sleep Pressure": 0.95, "Fatigue": 0.8},
            "Social": {"Connection": 0.9, "Belonging": 0.85},
        },
        "selection_context": {"visitor_id": "scored-fallback-fixture"},
    }
    first = sound.resolve_adaptive_sound(scored_payload, policy)
    second = sound.resolve_adaptive_sound(scored_payload, policy)
    require(first == second, "Needs-score fallback is not deterministic.")
    require(first["band_intent"] == "delta", "Sleep-pressure scoring did not select Delta.")
    require(first["carrier_intent"] == "social_connection", "Connection scoring did not select the social carrier.")

    print(json.dumps({
        "schema_version": "iam_adaptive_sound_policy_qa_v1",
        "combinations_tested": len(matrix),
        "matrix": matrix,
        "safety_states_tested": ["standard", "high_concern_default", "high_concern_opt_in", "master_off"],
        "notification_states_tested": [
            "blocked_until_consent_and_verified_contact",
            "pending_human_review_approval",
            "authorized_for_human_operator_not_sent_by_model",
        ],
        "research_targets_in_product_decisions": False,
        "no_checkin_default_carrier": False,
        "accepted_self_report_without_heart_rate_selected": True,
        "conflicting_heart_rate_re_ranked_band_and_carrier": True,
    }, indent=2))


if __name__ == "__main__":
    main()
