#!/usr/bin/env python3
"""Deterministic Adaptive Music Television selector core.

This module is the mathematical middle layer between the v5.55 citizen-needs
payload and the v1.11 music-video tensor catalogue. It deliberately avoids LLM
matching: GPT can produce the citizen state, but this file chooses the track.
"""

from __future__ import annotations

import argparse
from functools import lru_cache
import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Tuple


INFERENCE_PAYLOAD_ALIASES = ("v555_payload", "v445_payload", "v444_payload", "inference")


def unwrap_inference_payload(body: Any) -> Any:
    if not isinstance(body, Mapping):
        return body
    for alias in INFERENCE_PAYLOAD_ALIASES:
        candidate = body.get(alias)
        if isinstance(candidate, Mapping):
            return candidate
    return body

try:
    from semantic_compiler import SEMANTIC_LEXICON
except Exception:
    SEMANTIC_LEXICON = {}

from adaptive_sound_policy import resolve_adaptive_sound


CATALOGUE_VERSION = "adaptive_music_video_catalogue_v1.11"
SELECTION_SCHEMA_VERSION = "adaptive_music_video_selection_v1.11"
SELECTION_POLICY_VERSION = "tensor_uplift_rotation_v3"
DCN_RERANKER_VERSION = "adaptive_music_engagement_dcn_reranker_v0.1"
ALIGNED_NUMERIC_DIMENSIONS = 80
EXTENDED_SESSION_FORMAT_WEIGHTS = {
    "parties": 0.80,
    "radio": 0.10,
    "videos": 0.10,
}
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CATALOGUE_PATH = BASE_DIR / "adaptive-music-video-catalogue-v1.11.json"
DEFAULT_TRAJECTORY_POLICY_PATH = BASE_DIR / "adaptive-music-trajectory-policy-v2.json"
DEFAULT_BROADCAST_SCHEDULE_PATH = BASE_DIR / "broadcast-schedule-v1.json"

RADAR_DOMAINS = ["Emotion", "Social", "Cognitive", "Physiological", "Threat", "Clinical Risk"]
RADAR_SCHEMA = {
    "Emotion": ["Joy", "Calm", "Hope", "Curiosity", "Gratitude", "Awe", "Love", "Purpose", "Self-Actualisation"],
    "Social": ["Trust", "Belonging", "Connection", "Empathy", "Psychological Safety", "Self-Transcendence"],
    "Cognitive": ["Attention", "Mental Load", "Clarity", "Rumination", "Motivation", "Executive Function"],
    "Physiological": ["Arousal", "Recovery", "Stress", "Sleep Pressure", "Fatigue"],
    "Threat": ["Fear", "Anxiety", "Anger", "Shame", "Loneliness"],
    "Clinical Risk": ["Hypervigilance", "Avoidance", "Intrusions", "Emotional Numbing", "Sleep Disturbance", "Startle Sensitivity"],
}
VECTOR_KEYS = [key for domain in RADAR_DOMAINS for key in RADAR_SCHEMA[domain]]

EXTENDED_SCORECARD_GROUPS = {
    "meditative_values_applied": {
        "tensor_group": "meditative_values_applied",
        "fields": [
            "MVA 1 Anxiety to Peace Of Mind",
            "MVA 2 This Too Shall Pass",
            "MVA 3 Compassion Without Fixing",
            "MVA 4 Common Humanity via Body",
            "MVA 5 Awakening the Dreamtime",
            "MVA 6 Dadirri",
            "MVA 7 Grounded on Country",
            "MVA 8 Healing Wisdom of Nature",
        ],
    },
    "mindfulness_dadirri": {
        "tensor_group": "dadirri_mindfulness",
        "fields": [
            "DM 01 Deep Listening",
            "DM 02 Presence",
            "DM 03 Connection to Country",
            "DM 04 Awareness",
            "DM 05 Trust",
            "DM 06 Self Compassion",
            "DM 07 Integration",
            "DM 08 Intention",
            "DM 09 Clarity",
            "DM 10 Curiosity",
            "DM 11 Courage",
            "DM 12 Service",
            "DM 13 Celebration",
            "DM 14 Grounded Readiness",
            "DM 15 Embodied Peace",
        ],
    },
    "monomyth_hero_journey": {
        "tensor_group": "monomyth_hero_journey",
        "fields": [
            "MM 01 Call To Adventure",
            "MM 02 Refusal Of The Call",
            "MM 03 Supernatural Aid Mentor",
            "MM 04 Crossing First Threshold",
            "MM 05 Belly Of The Whale",
            "MM 06 Road Of Trials",
            "MM 07 Meeting With The Goddess",
            "MM 08 Temptation Distraction",
            "MM 09 Atonement With Authority",
            "MM 10 Apotheosis",
            "MM 11 Ultimate Boon",
            "MM 12 Refusal Of The Return",
            "MM 13 Magic Flight",
            "MM 14 Rescue From Without",
            "MM 15 Crossing Return Threshold",
            "MM 16 Master Of Two Worlds",
            "MM 17 Freedom To Live",
        ],
    },
    "memory_state": {
        "tensor_group": "memory",
        "fields": [
            "Memory Activation Strength",
            "Memory Specificity",
            "Nostalgia Intensity",
            "Somatic Memory Signal",
            "Agency After Listening",
            "Hope After Listening",
        ],
    },
}

TRAJECTORY_TARGETS = {
    "Anger": ["Motivation", "Executive Function", "Clarity", "Self-Actualisation", "Purpose"],
    "Heartbreak": ["Belonging", "Connection", "Trust", "Hope", "Love"],
    "Numbness": ["Clarity", "Attention", "Arousal", "Connection", "Curiosity"],
    "Emotional Numbing": ["Clarity", "Attention", "Arousal", "Connection", "Curiosity"],
    "Anxiety": ["Calm", "Psychological Safety", "Clarity", "Trust", "Recovery"],
    "Loneliness": ["Belonging", "Connection", "Love", "Gratitude", "Trust"],
    "Shame": ["Psychological Safety", "Trust", "Self-Actualisation", "Love", "Empathy"],
    "Low agency": ["Motivation", "Executive Function", "Purpose", "Hope", "Self-Actualisation"],
    "Creative blockage": ["Curiosity", "Awe", "Self-Actualisation", "Joy", "Clarity"],
    "Fatigue": ["Recovery", "Calm", "Psychological Safety", "Sleep Pressure"],
    "Overstimulation": ["Calm", "Psychological Safety", "Recovery", "Attention"],
    "Flatness": ["Joy", "Curiosity", "Connection", "Arousal", "Motivation"],
    "Fear": ["Psychological Safety", "Trust", "Calm", "Clarity"],
    "Stress": ["Calm", "Recovery", "Clarity", "Psychological Safety"],
    "Rumination": ["Clarity", "Attention", "Recovery", "Self-Actualisation"],
}

NEED_TO_SEMANTIC = {
    "Joy": ["joy", "activation", "belonging"],
    "Calm": ["calm", "recovery", "dadirri"],
    "Hope": ["hope", "purpose"],
    "Curiosity": ["curiosity", "awe"],
    "Gratitude": ["hope", "trust"],
    "Awe": ["awe", "curiosity"],
    "Love": ["love", "connection", "trust"],
    "Purpose": ["purpose", "agency"],
    "Self-Actualisation": ["self_actualisation", "identity", "agency"],
    "Self-Transcendence": ["awe", "dadirri"],
    "Trust": ["trust", "psychological_safety"],
    "Belonging": ["belonging", "connection"],
    "Connection": ["connection", "belonging", "love"],
    "Empathy": ["empathy", "connection"],
    "Psychological Safety": ["psychological_safety", "calm"],
    "Attention": ["clarity"],
    "Mental Load": ["calm", "clarity", "recovery"],
    "Clarity": ["clarity", "recovery"],
    "Rumination": ["clarity", "recovery", "calm"],
    "Motivation": ["motivation", "agency", "activation"],
    "Executive Function": ["agency", "clarity"],
    "Arousal": ["activation"],
    "Recovery": ["recovery", "calm", "psychological_safety"],
    "Stress": ["calm", "recovery", "psychological_safety"],
    "Sleep Pressure": ["calm", "recovery"],
    "Fatigue": ["recovery", "calm", "motivation"],
    "Fear": ["psychological_safety", "trust", "calm"],
    "Anxiety": ["calm", "psychological_safety", "recovery"],
    "Anger": ["anger", "agency", "clarity"],
    "Shame": ["shame", "psychological_safety", "self_actualisation"],
    "Loneliness": ["loneliness", "belonging", "connection"],
    "Hypervigilance": ["psychological_safety", "calm"],
    "Avoidance": ["agency", "clarity", "recovery"],
    "Intrusions": ["psychological_safety", "calm"],
    "Emotional Numbing": ["numbing", "clarity", "connection"],
    "Sleep Disturbance": ["calm", "recovery"],
    "Startle Sensitivity": ["calm", "psychological_safety"],
}

ACUTE_SUPPORT_LEVELS = {"high", "urgent", "crisis", "acute"}
ACUTE_FLAG_PATTERNS = (
    "acute",
    "crisis",
    "self-harm",
    "self harm",
    "suicid",
    "panic",
    "severe dysregulation",
    "trauma activation",
    "unsupported youth",
)

EMOJI_NEED_AFFINITIES = {
    "heart": ["Love", "Connection", "Trust", "Belonging"],
    "trans_flag": ["Belonging", "Psychological Safety", "Self-Actualisation", "Trust"],
    "aboriginal_flag": ["Belonging", "Connection", "Self-Transcendence", "Purpose"],
    "peace_dove": ["Calm", "Hope", "Recovery", "Psychological Safety"],
    "white_dove": ["Calm", "Hope", "Recovery", "Gratitude"],
    "army_medallion": ["Purpose", "Trust", "Motivation", "Self-Actualisation"],
}


def canonical_need(value: Any) -> str:
    text = str(value or "").strip()
    aliases = {
        "self actualisation": "Self-Actualisation",
        "self-actualisation": "Self-Actualisation",
        "self-actualization": "Self-Actualisation",
        "self transcendence": "Self-Transcendence",
        "self-transcendence": "Self-Transcendence",
        "psychological safety": "Psychological Safety",
        "mental load": "Mental Load",
        "executive function": "Executive Function",
        "sleep pressure": "Sleep Pressure",
        "emotional numbing": "Emotional Numbing",
        "sleep disturbance": "Sleep Disturbance",
        "startle sensitivity": "Startle Sensitivity",
    }
    return aliases.get(text.lower().replace("_", " "), text)


def coerce_number(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    if not math.isfinite(number):
        return 0.0
    return max(0.0, min(1.0, number))


def label_key(value: Any) -> str:
    text = str(value or "").strip().lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def score_for_label(mapping: Mapping[str, Any], label: str) -> float:
    if label in mapping:
        return coerce_number(mapping.get(label))
    canonical = canonical_need(label)
    if canonical in mapping:
        return coerce_number(mapping.get(canonical))
    canonical_lookup = label_key(canonical)
    label_lookup = label_key(label)
    for key, value in mapping.items():
        key_lookup = label_key(key)
        if key_lookup in {label_lookup, canonical_lookup}:
            return coerce_number(value)
        if canonical_need(key) == canonical:
            return coerce_number(value)
    return 0.0


def coerce_ratio(value: Any, percent_ok: bool = True) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    if not math.isfinite(number):
        return 0.0
    if percent_ok and number > 1.0:
        number = number / 100.0
    return max(0.0, min(1.0, number))


def coerce_count(value: Any, cap: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    if not math.isfinite(number) or cap <= 0:
        return 0.0
    return max(0.0, min(1.0, number / cap))


def get_nested(mapping: Mapping[str, Any], path: Iterable[str], default: Any = None) -> Any:
    current: Any = mapping
    for key in path:
        if not isinstance(current, Mapping) or key not in current:
            return default
        current = current[key]
    return current


def as_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return []
        if stripped.startswith("["):
            try:
                parsed = json.loads(stripped)
                return parsed if isinstance(parsed, list) else [parsed]
            except json.JSONDecodeError:
                pass
        return [part.strip() for part in re.split(r"[,|]", stripped) if part.strip()]
    return [value]


def first_number(mapping: Mapping[str, Any], keys: Iterable[str], default: float = 0.0) -> float:
    for key in keys:
        if key in mapping:
            try:
                number = float(mapping[key])
            except (TypeError, ValueError):
                continue
            if math.isfinite(number):
                return number
    return default


def has_signal_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, Mapping):
        return any(has_signal_value(item) for item in value.values())
    if isinstance(value, list):
        return any(has_signal_value(item) for item in value)
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (int, float)):
        return math.isfinite(float(value)) and float(value) != 0.0
    return bool(value)


def merge_signal_maps(target: MutableMapping[str, Any], source: Mapping[str, Any]) -> None:
    for key, value in source.items():
        if isinstance(value, Mapping) and isinstance(target.get(key), dict):
            merge_signal_maps(target[key], value)
        elif key not in target or has_signal_value(value):
            target[key] = value


def extract_engagement_signals(
    inference_payload: Mapping[str, Any],
    explicit_signals: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    bundle: Dict[str, Any] = {}
    if isinstance(explicit_signals, Mapping):
        merge_signal_maps(bundle, explicit_signals)

    for key in (
        "engagement_signals",
        "passive_signals",
        "analytics",
        "web_analytics",
        "ga4",
        "survey_feedback",
        "emoji_engagement",
    ):
        value = inference_payload.get(key)
        if not isinstance(value, Mapping):
            continue
        if key in {"survey_feedback", "emoji_engagement"} and key not in value:
            bundle[key] = value
        else:
            merge_signal_maps(bundle, value)
    return bundle


def extract_highlights(inference_payload: Mapping[str, Any]) -> List[str]:
    candidates = (
        inference_payload.get("top_highlights")
        or inference_payload.get("highlights")
        or inference_payload.get("top_needs_used")
        or get_nested(inference_payload, ["citizen_needs", "top_highlights"])
        or get_nested(inference_payload, ["citizen_needs", "top_needs_used"])
        or []
    )
    highlights: List[str] = []
    for item in as_list(candidates):
        value = item.get("label") if isinstance(item, Mapping) else item
        need = canonical_need(value)
        if need in VECTOR_KEYS and need not in highlights:
            highlights.append(need)

    return highlights[:8]


def extract_safety_flags(inference_payload: Mapping[str, Any]) -> List[str]:
    flags = []
    for path in (
        ["safety_flags"],
        ["safety", "flags"],
        ["citizen_needs", "safety_flags"],
        ["clinical_risk", "safety_flags"],
        ["adaptive_support_relevance", "flags"],
    ):
        flags.extend(str(item) for item in as_list(get_nested(inference_payload, path)))

    human_review = inference_payload.get("human_review_relevance")
    if human_review:
        flags.append(str(human_review))

    support_level = get_nested(inference_payload, ["adaptive_support_relevance", "level"])
    if support_level:
        flags.append(str(support_level))

    return [flag.strip() for flag in flags if flag and flag.strip()]


def extract_needs_scorecard(inference_payload: Mapping[str, Any]) -> Mapping[str, Any]:
    candidates = (
        get_nested(inference_payload, ["citizen_needs", "needs_scorecard"], {}),
        inference_payload.get("needs_scorecard") if isinstance(inference_payload.get("needs_scorecard"), Mapping) else {},
        get_nested(inference_payload, ["citizen_needs", "full_needs_scorecard"], {}),
        inference_payload.get("full_needs_scorecard") if isinstance(inference_payload.get("full_needs_scorecard"), Mapping) else {},
    )
    for candidate in candidates:
        if isinstance(candidate, Mapping) and candidate:
            return candidate
    return {}


def vectorise_state(inference_payload: Mapping[str, Any]) -> Dict[str, float]:
    needs = inference_payload.get("citizen_needs") if isinstance(inference_payload.get("citizen_needs"), Mapping) else {}
    radar_scores = inference_payload.get("radar_scores") if isinstance(inference_payload.get("radar_scores"), Mapping) else {}
    scorecard = extract_needs_scorecard(inference_payload)
    scorecard_radar = scorecard.get("human_needs_radar") if isinstance(scorecard.get("human_needs_radar"), Mapping) else {}
    source = needs or radar_scores or inference_payload
    vector = {key: 0.0 for key in VECTOR_KEYS}

    for domain in RADAR_DOMAINS:
        domain_map = source.get(domain) if isinstance(source, Mapping) else None
        if isinstance(domain_map, Mapping):
            for key in RADAR_SCHEMA[domain]:
                vector[key] = coerce_number(domain_map.get(key, domain_map.get(key.replace("-", " "))))

    for key in VECTOR_KEYS:
        if isinstance(source, Mapping) and key in source:
            vector[key] = max(vector[key], coerce_number(source[key]))
        if isinstance(radar_scores, Mapping):
            vector[key] = max(vector[key], score_for_label(radar_scores, key))
        if isinstance(scorecard_radar, Mapping):
            vector[key] = max(vector[key], score_for_label(scorecard_radar, key))

    for highlight in extract_highlights(inference_payload):
        vector[highlight] = max(vector[highlight], 1.0)

    return vector


def vector_from_track(track: Mapping[str, Any]) -> Dict[str, float]:
    tensor_scores = get_nested(track, ["tensor_profile", "citizen_needs_scores"], {}) or {}
    affinities = track.get("citizen_need_affinities") if isinstance(track.get("citizen_need_affinities"), Mapping) else {}
    vector = {key: 0.0 for key in VECTOR_KEYS}
    for key in VECTOR_KEYS:
        vector[key] = max(coerce_number(tensor_scores.get(key)), coerce_number(affinities.get(key)))
    for need in as_list(track.get("top_needs")):
        need = canonical_need(need)
        if need in vector:
            vector[need] = max(vector[need], 0.82)
    return vector


def cosine(left: Mapping[str, float], right: Mapping[str, float]) -> float:
    dot = sum(left.get(key, 0.0) * right.get(key, 0.0) for key in VECTOR_KEYS)
    left_norm = math.sqrt(sum(left.get(key, 0.0) ** 2 for key in VECTOR_KEYS))
    right_norm = math.sqrt(sum(right.get(key, 0.0) ** 2 for key in VECTOR_KEYS))
    if not left_norm or not right_norm:
        return 0.0
    return max(0.0, min(1.0, dot / (left_norm * right_norm)))


def detect_named_trajectories(inference_payload: Mapping[str, Any], highlights: List[str]) -> List[str]:
    text = " ".join(structured_summary_fragments(inference_payload) + [" ".join(highlights)]).lower()
    trajectories = []
    keyword_map = {
        "Heartbreak": ("heartbreak", "heartbroken", "breakup", "romantic pain"),
        "Numbness": ("numb", "flat", "blank", "nothing", "dulled"),
        "Low agency": ("low agency", "stuck", "powerless", "can't move", "cannot move"),
        "Creative blockage": ("creative block", "blocked", "uninspired", "can't create", "cannot create"),
        "Overstimulation": ("overstimulated", "too much", "sensory", "overloaded"),
        "Flatness": ("flat", "bored", "empty"),
    }
    for need in highlights:
        if need in TRAJECTORY_TARGETS:
            trajectories.append(need)
    for name, words in keyword_map.items():
        if any(word in text for word in words):
            trajectories.append(name)
    return list(dict.fromkeys(trajectories))


def build_target_trajectory(inference_payload: Mapping[str, Any], highlights: List[str]) -> Dict[str, float]:
    target = {key: 0.0 for key in VECTOR_KEYS}
    trajectories = detect_named_trajectories(inference_payload, highlights)
    current_inference = inference_payload.get("current_inference")
    current_inference = current_inference if isinstance(current_inference, Mapping) else {}
    inference_targets = {
        "settled_resting": ["Calm", "Clarity", "Recovery", "Gratitude"],
        "active_energised": ["Joy", "Motivation", "Arousal", "Curiosity"],
        "strained_activated": ["Calm", "Recovery", "Clarity", "Psychological Safety"],
        "low_energy_withdrawn": ["Hope", "Connection", "Motivation", "Trust"],
        "fatigued_recovering": ["Recovery", "Calm", "Psychological Safety", "Sleep Pressure"],
        "mixed_uncertain": ["Calm", "Clarity", "Psychological Safety"],
        "high_concern_support_first": ["Psychological Safety", "Calm", "Trust"],
    }
    for key in inference_targets.get(str(current_inference.get("inference_id") or ""), []):
        if key in target:
            target[key] = max(target[key], 0.7)
    if not trajectories:
        for highlight in highlights:
            if highlight in target:
                target[highlight] = 0.55
        if str(current_inference.get("heart_rate_role") or "") == "conflicting":
            target = {key: value * 0.75 for key, value in target.items()}
            target["Calm"] = max(target.get("Calm", 0.0), 0.65)
            target["Clarity"] = max(target.get("Clarity", 0.0), 0.65)
        return target

    for trajectory in trajectories:
        for key in TRAJECTORY_TARGETS.get(trajectory, []):
            if key in target:
                target[key] = max(target[key], 1.0)
    if str(current_inference.get("heart_rate_role") or "") == "conflicting":
        target = {key: value * 0.75 for key, value in target.items()}
        target["Calm"] = max(target.get("Calm", 0.0), 0.65)
        target["Clarity"] = max(target.get("Clarity", 0.0), 0.65)
    return target


def explicit_need_intensity(inference_payload: Mapping[str, Any], label: str) -> float:
    """Read numeric intensity without promoting a categorical highlight to 1.0."""
    needs = inference_payload.get("citizen_needs") if isinstance(inference_payload.get("citizen_needs"), Mapping) else {}
    radar_scores = inference_payload.get("radar_scores") if isinstance(inference_payload.get("radar_scores"), Mapping) else {}
    scorecard = extract_needs_scorecard(inference_payload)
    scorecard_radar = scorecard.get("human_needs_radar") if isinstance(scorecard.get("human_needs_radar"), Mapping) else {}
    values = [score_for_label(radar_scores, label), score_for_label(scorecard_radar, label)]
    if isinstance(needs, Mapping):
        values.append(score_for_label(needs, label))
        for domain in RADAR_DOMAINS:
            domain_map = needs.get(domain)
            if isinstance(domain_map, Mapping):
                values.append(score_for_label(domain_map, label))
    return max(values, default=0.0)


def is_acute_distress(inference_payload: Mapping[str, Any], user_vector: Mapping[str, float], safety_flags: List[str]) -> bool:
    scorecard = extract_needs_scorecard(inference_payload)
    safety_domain = scorecard.get("mental_health_safety") if isinstance(scorecard.get("mental_health_safety"), Mapping) else {}
    if score_for_label(safety_domain, "Acute Distress") >= 0.75:
        return True
    if score_for_label(safety_domain, "Human Review Need") >= 0.80:
        return True
    if score_for_label(safety_domain, "Dissociation Risk") >= 0.85:
        return True
    support_level = str(get_nested(inference_payload, ["adaptive_support_relevance", "level"], "")).lower()
    if support_level in ACUTE_SUPPORT_LEVELS:
        return True
    flag_text = " ".join(safety_flags).lower()
    return any(pattern in flag_text for pattern in ACUTE_FLAG_PATTERNS)


def track_safety(track: Mapping[str, Any]) -> Mapping[str, Any]:
    return track.get("safety") if isinstance(track.get("safety"), Mapping) else {}


def semantic_compiler(track: Mapping[str, Any]) -> Mapping[str, Any]:
    return track.get("semantic_compiler") if isinstance(track.get("semantic_compiler"), Mapping) else {}


def playable_media_available(track: Mapping[str, Any]) -> bool:
    local_video = (
        track.get("local_video_file")
        or get_nested(track, ["tensor_profile", "runtime_delivery", "local_video_file"])
        or ""
    )
    if local_video and (BASE_DIR / str(local_video)).exists():
        return True
    if local_video:
        stream_catalogue = BASE_DIR / "cloudflare-stream-catalogue.js"
        try:
            stream_marker = f'"{Path(str(local_video)).name}":'
            if stream_marker in stream_catalogue.read_text(encoding="utf-8"):
                return True
        except OSError:
            pass
    youtube_id = track.get("youtube_id") or get_nested(track, ["tensor_profile", "runtime_delivery", "youtube_id"])
    return bool(youtube_id)


def hard_veto_track(track: Mapping[str, Any], highlights: List[str], acute: bool, safety_flags: List[str]) -> Tuple[bool, str]:
    safety = track_safety(track)
    semantics = semantic_compiler(track)
    avoid_when = set(str(item) for item in as_list(semantics.get("avoid_when")))
    risk_markers = set(str(item) for item in as_list(semantics.get("risk_markers")))
    title = str(track.get("title", "")).lower()
    artist = str(track.get("artist", "")).lower()
    if not playable_media_available(track):
        return True, "media_unavailable_veto"
    if acute and safety.get("avoid_for_acute_distress"):
        return True, "acute_distress_veto"
    if acute and "acute_distress" in avoid_when:
        return True, "semantic_acute_distress_veto"
    if acute and "trauma_or_crisis_caution" in risk_markers:
        return True, "semantic_trauma_caution_veto"
    if acute and safety.get("requires_age_gate"):
        return True, "age_gate_acute_veto"
    if acute and "closer" in title:
        return True, "known_high_intensity_acute_veto"

    not_suitable = " ".join(
        str(value or "").lower()
        for value in [
            safety.get("not_suitable_citizen_state"),
            get_nested(track, ["tensor_profile", "human_review_flow", "Not Suitable Citizen State"]),
            get_nested(track, ["tensor_profile", "memory", "Not Suitable Citizen State"]),
        ]
    )
    for highlight in highlights:
        label = re.escape(highlight.casefold())
        if re.search(rf"(?<![a-z0-9]){label}(?![a-z0-9])", not_suitable):
            return True, "not_suitable_highlight_veto"

    flag_text = " ".join(safety_flags).lower()
    if safety.get("requires_age_gate") and ("youth" in flag_text or "underage" in flag_text):
        return True, "youth_age_gate_veto"

    return False, ""


def selection_context(inference_payload: Mapping[str, Any]) -> Mapping[str, Any]:
    context = inference_payload.get("selection_context")
    return context if isinstance(context, Mapping) else {}


def opening_catalogue_veto(track: Mapping[str, Any], inference_payload: Mapping[str, Any]) -> Tuple[bool, str]:
    """Keep the opening recommendation inside its requested media and safety surface."""
    context = selection_context(inference_payload)
    media_class = str(
        track.get("media_class")
        or get_nested(track, ["tensor_profile", "runtime_delivery", "media_class"])
        or "music_video"
    )
    requested_media_class = str(
        context.get("requested_media_class")
        or context.get("media_class")
        or "music_video"
    )
    if media_class != requested_media_class:
        return True, "opening_media_class_veto"

    age_gate_confirmed = context.get("age_gate_confirmed") is True
    if track_safety(track).get("requires_age_gate") and not age_gate_confirmed:
        return True, "opening_age_gate_veto"
    return False, ""


def safety_fit(track: Mapping[str, Any], acute: bool) -> float:
    safety = track_safety(track)
    score = 1.0
    if safety.get("requires_support_card"):
        score -= 0.12
    if safety.get("avoid_for_acute_distress"):
        score -= 0.18
    if safety.get("requires_age_gate"):
        score -= 0.38
    if str(safety.get("memory_zone", "")).lower() == "red":
        score -= 0.32
    if acute:
        score -= 0.18
    return max(0.0, min(1.0, score))


def presentation_fit(track: Mapping[str, Any], highlights: List[str]) -> float:
    presentation = str(track.get("presentation", "")).lower()
    social_highlights = {"Belonging", "Connection", "Love", "Joy", "Arousal"}
    if "live" in presentation and social_highlights.intersection(highlights):
        return 1.0
    if "official" in presentation and {"Clarity", "Curiosity", "Self-Actualisation", "Awe"}.intersection(highlights):
        return 0.92
    if "live" in presentation:
        return 0.82
    return 0.86


def semantic_fit(track: Mapping[str, Any], highlights: List[str]) -> float:
    return semantic_fit_for_intent(track, highlights, {})


def semantic_intent_from_payload(inference_payload: Mapping[str, Any], highlights: List[str]) -> Dict[str, float]:
    text_fragments = structured_summary_fragments(inference_payload)
    text = " ".join(text_fragments + [" ".join(highlights)]).casefold()
    if not text.strip():
        return {}

    scores: Dict[str, float] = {}
    for semantic, phrases in SEMANTIC_LEXICON.items():
        weight = 0.0
        for phrase in phrases:
            escaped = re.escape(str(phrase).replace("_", " ").casefold())
            count = len(re.findall(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", text))
            if count:
                weight += count * (1.25 if " " in str(phrase) else 1.0)
        if weight:
            scores[semantic] = max(0.0, min(1.0, 1.0 - math.exp(-weight / 2.8)))
    return scores


def structured_summary_fragments(inference_payload: Mapping[str, Any]) -> List[str]:
    """Return only GPT-produced summaries, never the raw citizen check-in."""
    fragments = [
        inference_payload.get("interpretation_summary"),
        inference_payload.get("music_room_reason"),
        get_nested(inference_payload, ["citizen_needs", "interpretation_summary"]),
        get_nested(inference_payload, ["citizen_needs", "summary"]),
        get_nested(inference_payload, ["adaptive_music", "why_music"]),
    ]
    return [str(fragment or "").strip() for fragment in fragments if str(fragment or "").strip()]


def extract_recent_track_ids(inference_payload: Mapping[str, Any]) -> List[str]:
    candidates = (
        get_nested(inference_payload, ["selection_context", "recent_track_ids"], [])
        or inference_payload.get("recent_track_ids")
        or []
    )
    recent: List[str] = []
    for item in as_list(candidates):
        track_id = str(item.get("track_id") if isinstance(item, Mapping) else item or "").strip()
        if track_id and track_id not in recent:
            recent.append(track_id)
    return recent[:13]




def semantic_cosine(left: Mapping[str, float], right: Mapping[str, Any]) -> float:
    keys = sorted(set(left.keys()) | set(right.keys()))
    if not keys:
        return 0.0
    dot = sum(coerce_number(left.get(key)) * coerce_number(right.get(key)) for key in keys)
    left_norm = math.sqrt(sum(coerce_number(left.get(key)) ** 2 for key in keys))
    right_norm = math.sqrt(sum(coerce_number(right.get(key)) ** 2 for key in keys))
    if not left_norm or not right_norm:
        return 0.0
    return max(0.0, min(1.0, dot / (left_norm * right_norm)))


def scorecard_domain_cosine(human_domain: Mapping[str, Any], track_domain: Mapping[str, Any], fields: Iterable[str]) -> float:
    left: Dict[str, float] = {}
    right: Dict[str, float] = {}
    for field in fields:
        left[field] = score_for_label(human_domain, field)
        right[field] = score_for_label(track_domain, field)
    active_fields = [field for field in fields if left.get(field, 0.0) > 0.0 or right.get(field, 0.0) > 0.0]
    if not active_fields:
        return 0.5
    dot = sum(left.get(field, 0.0) * right.get(field, 0.0) for field in active_fields)
    left_norm = math.sqrt(sum(left.get(field, 0.0) ** 2 for field in active_fields))
    right_norm = math.sqrt(sum(right.get(field, 0.0) ** 2 for field in active_fields))
    if not left_norm or not right_norm:
        return 0.0
    return max(0.0, min(1.0, dot / (left_norm * right_norm)))


def extended_scorecard_fit(track: Mapping[str, Any], inference_payload: Mapping[str, Any]) -> float:
    scorecard = extract_needs_scorecard(inference_payload)
    if not scorecard:
        return 0.5

    weighted_scores: List[Tuple[float, float]] = []
    tensor_profile = track.get("tensor_profile") if isinstance(track.get("tensor_profile"), Mapping) else {}
    for scorecard_domain, config in EXTENDED_SCORECARD_GROUPS.items():
        human_domain = scorecard.get(scorecard_domain)
        track_domain = tensor_profile.get(config["tensor_group"]) if isinstance(tensor_profile, Mapping) else {}
        if not isinstance(human_domain, Mapping) or not isinstance(track_domain, Mapping):
            continue
        domain_weight = math.sqrt(sum(score_for_label(human_domain, field) ** 2 for field in config["fields"]))
        if domain_weight <= 0:
            continue
        weighted_scores.append((
            scorecard_domain_cosine(human_domain, track_domain, config["fields"]),
            domain_weight,
        ))

    if not weighted_scores:
        return 0.5
    numerator = sum(score * weight for score, weight in weighted_scores)
    denominator = sum(weight for _, weight in weighted_scores)
    return max(0.0, min(1.0, numerator / denominator)) if denominator else 0.5


def semantic_fit_for_intent(track: Mapping[str, Any], highlights: List[str], intent_scores: Mapping[str, float]) -> float:
    semantics = semantic_compiler(track)
    if not semantics:
        return 0.5

    supportive = {str(item) for item in as_list(semantics.get("supportive_for"))}
    semantic_scores = semantics.get("semantic_scores") if isinstance(semantics.get("semantic_scores"), Mapping) else {}
    group_scores = semantics.get("semantic_group_scores") if isinstance(semantics.get("semantic_group_scores"), Mapping) else {}
    avoid_when = {str(item) for item in as_list(semantics.get("avoid_when"))}

    if not highlights:
        base = coerce_number(group_scores.get("regulation", 0.5)) or 0.5
        return max(base, semantic_cosine(intent_scores, semantic_scores))

    score = 0.0
    weight = 0.0
    for highlight in highlights[:6]:
        weight += 1.0
        if highlight in supportive:
            score += 1.0
            continue
        semantic_keys = NEED_TO_SEMANTIC.get(highlight, [])
        if semantic_keys:
            score += max(coerce_number(semantic_scores.get(key)) for key in semantic_keys)

    highlight_result = score / weight if weight else 0.5
    intent_result = semantic_cosine(intent_scores, semantic_scores) if intent_scores else 0.0
    result = (0.62 * highlight_result + 0.38 * intent_result) if intent_scores else highlight_result
    if "needs_down_regulation" in avoid_when and {"Anxiety", "Stress", "Hypervigilance", "Startle Sensitivity"}.intersection(highlights):
        result -= 0.18
    if "fresh_romantic_wound" in avoid_when and {"Love", "Loneliness", "Belonging"}.intersection(highlights):
        result -= 0.12
    return max(0.0, min(1.0, result))


def context_fit(track: Mapping[str, Any], environment_context: Mapping[str, Any]) -> float:
    score = 0.5
    room = str(track.get("music_room") or get_nested(track, ["tensor_profile", "runtime_delivery", "music_room"], "")).lower()
    time_text = str(environment_context.get("local_time") or environment_context.get("time_of_day") or "").lower()
    weather = str(environment_context.get("weather_condition") or "").lower()
    location = str(environment_context.get("location_label") or environment_context.get("location_type") or "").lower()
    temp = environment_context.get("temperature_celsius")
    time_fit_text = str(
        track.get("Time Context Fit")
        or track.get("time_context_fit")
        or get_nested(track, ["tensor_profile", "current_inference_context_fit", "time"], "")
    ).lower()
    weather_fit_text = str(
        track.get("Weather Context Fit")
        or track.get("weather_context_fit")
        or get_nested(track, ["tensor_profile", "current_inference_context_fit", "weather"], "")
    ).lower()
    location_fit_text = str(
        track.get("Location Context Fit")
        or track.get("location_context_fit")
        or get_nested(track, ["tensor_profile", "current_inference_context_fit", "location"], "")
    ).lower()

    hour_match = re.search(r"(?:^|\D)([01]?\d|2[0-3]):[0-5]\d", time_text)
    hour = int(hour_match.group(1)) if hour_match else None
    is_morning = any(word in time_text for word in ("sunrise", "early", "morning")) or (hour is not None and 5 <= hour < 12)
    is_afternoon = "afternoon" in time_text or (hour is not None and 12 <= hour < 17)
    is_evening = any(word in time_text for word in ("sunset", "evening")) or (hour is not None and 17 <= hour < 22)
    is_night = any(word in time_text for word in ("night", "late")) or (hour is not None and (hour >= 22 or hour < 5))

    if is_morning and (room == "inner-planes" or "morning" in time_fit_text or "sunrise" in time_fit_text):
        score += 0.12
    if is_afternoon and (room in {"modul8-infinity", "james-bondage"} or "afternoon" in time_fit_text):
        score += 0.08
    if is_evening and (room == "champagne-bohemia" or "evening" in time_fit_text or "sunset" in time_fit_text):
        score += 0.12
    if is_night and (room in {"inner-planes", "champagne-bohemia"} or "night" in time_fit_text):
        score += 0.08
    if any(word in weather for word in ("rain", "storm", "wind")) and room in {"inner-planes", "champagne-bohemia"}:
        score += 0.12
    if any(word in weather for word in ("rain", "storm", "wind", "clear", "sun", "cloud", "snow")) and any(
        word in weather_fit_text for word in weather.split()
    ):
        score += 0.08
    if isinstance(temp, (int, float)) and temp >= 30 and room == "champagne-bohemia":
        score += 0.1
    if any(word in location for word in ("coast", "beach", "ocean", "sea")) and room == "champagne-bohemia":
        score += 0.12
    if any(word in location for word in ("city", "urban", "club")) and room in {"modul8-infinity", "james-bondage"}:
        score += 0.1
    if any(word in location for word in ("home", "private", "bedroom")) and room == "inner-planes":
        score += 0.1
    if location and any(word in location_fit_text for word in location.split() if len(word) > 2):
        score += 0.08
    return max(0.0, min(1.0, score))


def current_inference_audit(inference_input: Mapping[str, Any]) -> Dict[str, Any]:
    current = inference_input.get("current_inference")
    current = current if isinstance(current, Mapping) else {}
    environment = inference_input.get("environment_context")
    environment = environment if isinstance(environment, Mapping) else {}
    heart_rate_role = str(current.get("heart_rate_role") or "not_available")
    if heart_rate_role not in {"supporting", "conflicting", "not_available", "invalid"}:
        heart_rate_role = "invalid"
    heart_rate_zone = str(current.get("heart_rate_zone") or "not_available")
    if heart_rate_zone not in {"low_observed", "mid_observed", "elevated_observed", "not_available"}:
        heart_rate_zone = "not_available"
    return {
        "matrix_schema_version": "iam_adaptive_inference_matrix_v1",
        "inference_id": str(current.get("inference_id") or "insufficient_context"),
        "heart_rate_role": heart_rate_role,
        "heart_rate_zone": heart_rate_zone,
        "raw_heart_rate_retained": False,
        "baseline_comparison_used": False,
        "context_dimensions_considered": {
            "time": bool(environment.get("local_time") or environment.get("time_of_day")),
            "weather": bool(environment.get("weather_condition") or environment.get("temperature_celsius") is not None),
            "location": bool(environment.get("location_label") or environment.get("location_type")),
        },
        "horizons_considered": ["horizon_1", "horizon_2", "horizon_3"],
    }


def track_engagement_signals(track: Mapping[str, Any], bundle: Mapping[str, Any]) -> Dict[str, Any]:
    track_id = str(track.get("id") or get_nested(track, ["tensor_profile", "runtime_delivery", "selected_track_id"], ""))
    if not track_id:
        return {}

    for key in ("track_engagement", "track_feedback", "per_track", "items"):
        value = bundle.get(key)
        if isinstance(value, Mapping):
            item = value.get(track_id)
            if isinstance(item, Mapping):
                return dict(item)
        if isinstance(value, list):
            for item in value:
                if isinstance(item, Mapping) and str(item.get("track_id") or item.get("id") or "") == track_id:
                    return dict(item)
    return {}


def emoji_need_fit(track: Mapping[str, Any], bundle: Mapping[str, Any]) -> float:
    emoji_map = bundle.get("emoji_engagement") if isinstance(bundle.get("emoji_engagement"), Mapping) else bundle.get("emojis")
    if not isinstance(emoji_map, Mapping):
        return 0.5

    song_vector = vector_from_track(track)
    weighted_total = 0.0
    weight = 0.0
    for emoji_id, needs in EMOJI_NEED_AFFINITIES.items():
        raw = emoji_map.get(emoji_id) or emoji_map.get(emoji_id.replace("_", "-")) or emoji_map.get(emoji_id.replace("_", " "))
        emoji_strength = coerce_count(raw, 12.0)
        if not emoji_strength:
            continue
        need_match = max(song_vector.get(need, 0.0) for need in needs)
        weighted_total += emoji_strength * need_match
        weight += emoji_strength
    if not weight:
        return 0.5
    return max(0.0, min(1.0, weighted_total / weight))


def voluntary_survey_fit(bundle: Mapping[str, Any]) -> float:
    survey = bundle.get("survey_feedback") if isinstance(bundle.get("survey_feedback"), Mapping) else bundle
    if not isinstance(survey, Mapping):
        return 0.5

    positive = [
        coerce_ratio(survey.get("felt_seen")),
        coerce_ratio(survey.get("helped")),
        coerce_ratio(survey.get("settled")),
        coerce_ratio(survey.get("supportive")),
        coerce_ratio(survey.get("safety_after")),
        coerce_ratio(survey.get("would_continue")),
    ]
    negative = [
        coerce_ratio(survey.get("too_intense")),
        coerce_ratio(survey.get("not_for_me")),
        coerce_ratio(survey.get("felt_worse")),
        coerce_ratio(survey.get("unsafe")),
    ]
    if not any(positive) and not any(negative):
        return 0.5
    return max(0.0, min(1.0, 0.5 + 0.5 * (sum(positive) / max(1, len(positive))) - 0.45 * (sum(negative) / max(1, len(negative)))))


def engagement_feature_snapshot(track: Mapping[str, Any], bundle: Mapping[str, Any]) -> Dict[str, float]:
    track_bundle = track_engagement_signals(track, bundle)
    combined: Dict[str, Any] = dict(bundle)
    merge_signal_maps(combined, track_bundle)

    video_completion = max(
        coerce_ratio(first_number(combined, ("video_completion_ratio", "video_watch_ratio", "watch_ratio", "completion_ratio"))),
        coerce_ratio(first_number(combined, ("video_percent_watched", "percent_watched", "video_completion_percent"))),
    )
    extended_session_listen = max(
        coerce_ratio(first_number(combined, (
            "extended_session_listen_ratio",
            "extended_session_completion_ratio",
            "parties_listen_ratio",
            "videos_livestream_ratio",
            "radio_listen_ratio",
            "radio_completion_ratio",
            "streaming_radio_ratio",
        ))),
        coerce_count(first_number(combined, (
            "extended_session_listen_seconds",
            "parties_listen_seconds",
            "videos_livestream_seconds",
            "radio_listen_seconds",
            "streaming_radio_seconds",
            "audio_seconds",
        )), 20 * 60),
        coerce_count(first_number(combined, (
            "extended_session_listen_minutes",
            "parties_listen_minutes",
            "videos_livestream_minutes",
            "radio_listen_minutes",
            "streaming_radio_minutes",
        )), 20),
    )
    dwell = max(
        coerce_count(first_number(combined, ("engaged_seconds", "dwell_seconds", "session_seconds", "time_on_page_seconds")), 240),
        coerce_count(first_number(combined, ("engaged_minutes", "dwell_minutes", "session_minutes")), 4),
    )
    click_count = first_number(combined, ("click_count", "outbound_click_count", "navigation_click_count", "total_clicks"), 0.0)
    low_click = 1.0 if click_count <= 1 else max(0.0, 1.0 - min(click_count, 8.0) / 8.0)
    return_visits = coerce_count(first_number(combined, ("return_visits", "sessions_7d", "repeat_sessions")), 5)
    skips = coerce_count(first_number(combined, ("skip_count", "early_skip_count", "video_skip_count")), 4)
    friction = max(
        skips,
        coerce_count(first_number(combined, ("rage_clicks", "rapid_clicks")), 4),
        coerce_ratio(combined.get("bounce_rate") or combined.get("bounce")),
    )

    music_room, _ = infer_music_room(track, [])
    room_continuity = 1.0 if music_room else 0.0

    return {
        "video_completion": video_completion,
        "extended_session_listening": extended_session_listen,
        "soft_dwell": dwell * low_click,
        "returning_interest": return_visits,
        "emoji_need_fit": emoji_need_fit(track, combined),
        "survey_fit": voluntary_survey_fit(combined),
        "friction": friction,
        "video_x_soft_dwell": video_completion * dwell * low_click,
        "extended_session_x_room_continuity": extended_session_listen * room_continuity,
        "emoji_x_track_needs": emoji_need_fit(track, combined) * max(video_completion, dwell, return_visits),
        "music_room_return_fit": room_continuity * max(video_completion, return_visits) * (1.0 - friction),
    }


def dcn_reranker_score(
    track: Mapping[str, Any],
    bundle: Mapping[str, Any],
    base_score: float,
) -> Tuple[float, Dict[str, float]]:
    if not has_signal_value(bundle):
        return base_score, {"signal_strength": 0.0}

    features = engagement_feature_snapshot(track, bundle)
    signal_strength = max(
        features["video_completion"],
        features["extended_session_listening"],
        features["soft_dwell"],
        features["returning_interest"],
        abs(features["survey_fit"] - 0.5) * 2.0,
        max(0.0, features["emoji_need_fit"] - 0.5) * 2.0,
    )
    engagement_score = (
        0.23 * features["video_completion"]
        + 0.18 * features["extended_session_listening"]
        + 0.15 * features["soft_dwell"]
        + 0.10 * features["returning_interest"]
        + 0.12 * features["emoji_need_fit"]
        + 0.12 * features["survey_fit"]
        + 0.10 * features["video_x_soft_dwell"]
        + 0.06 * features["extended_session_x_room_continuity"]
        + 0.06 * features["emoji_x_track_needs"]
        + 0.03 * features["music_room_return_fit"]
        - 0.15 * features["friction"]
    )
    engagement_score = max(0.0, min(1.0, engagement_score))
    blend = min(0.18, 0.06 + 0.12 * signal_strength)
    reranked_score = (1.0 - blend) * base_score + blend * engagement_score
    features.update({
        "engagement_score": engagement_score,
        "base_selector_score": base_score,
        "rerank_blend": blend,
        "signal_strength": signal_strength,
    })
    return max(0.0, min(1.0, reranked_score)), features


def infer_music_room(track: Mapping[str, Any], highlights: List[str]) -> Tuple[str, str]:
    room = str(track.get("music_room") or get_nested(track, ["tensor_profile", "runtime_delivery", "music_room"], "")).lower()
    allowed_rooms = {"inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"}
    if room not in allowed_rooms:
        return "", "No eligible music room is assigned; do not force an extended session."
    reasons = {
        "inner-planes": "The extended session continues through the ambient, sleep and sunrise identity of inner planes.",
        "champagne-bohemia": "The extended session continues through the Balearic, sunset and chillout identity of champagne bohemia.",
        "modul8-infinity": "The extended session continues through the rave, house, techno, future bass and future psychedelic hiphop identity of modul8 infinity.",
        "james-bondage": "The extended session continues through the minimal, electro and EBM identity of james bondage.",
        "safety-cushion": "The extended session continues through 80s nu wave music videos in safety cushion.",
    }
    return room, reasons[room]


def assigned_extended_format(inference_input: Mapping[str, Any]) -> Tuple[str, float]:
    """Assign the 80/10/10 traffic slot outside GPT with a stable session key."""
    context = selection_context(inference_input)
    visitor_id = str(context.get("visitor_id") or "anonymous")
    index = recommendation_index(inference_input, extract_recent_track_ids(inference_input))
    draw = stable_hash_fraction("extended-session-format-v1", visitor_id, index)
    if draw < EXTENDED_SESSION_FORMAT_WEIGHTS["parties"]:
        return "parties", draw
    if draw < EXTENDED_SESSION_FORMAT_WEIGHTS["parties"] + EXTENDED_SESSION_FORMAT_WEIGHTS["radio"]:
        return "radio", draw
    return "videos", draw


def extended_session_contract(
    track: Mapping[str, Any],
    highlights: List[str],
    acute: bool,
    inference_input: Mapping[str, Any],
    catalogue: Mapping[str, Any],
) -> Dict[str, Any]:
    assigned_format, format_draw = assigned_extended_format(inference_input)
    track_room, track_room_reason = infer_music_room(track, highlights)
    requested_room = selected_music_room(inference_input) or track_room
    broadcast_schedule = load_broadcast_schedule()
    room_definitions = {
        str(definition.get("id") or ""): definition
        for definition in as_list(broadcast_schedule.get("music_rooms"))
        if isinstance(definition, Mapping)
    }
    channels = {
        str(channel.get("id") or ""): channel
        for channel in as_list(broadcast_schedule.get("channels"))
        if isinstance(channel, Mapping)
    }

    def source_for(room: str, extended_format: str) -> Optional[str]:
        matches = [
            source_id
            for source_id, channel in channels.items()
            if channel.get("editorial_id") == room
            and channel.get("format") == extended_format
            and as_list(channel.get("schedule"))
        ]
        return matches[0] if len(matches) == 1 else None

    def room_ready(room: str, extended_format: str) -> bool:
        definition = room_definitions.get(room) if isinstance(room_definitions.get(room), Mapping) else {}
        return bool(
            room
            and definition.get("catalogue_status") == "ready"
            and extended_format in as_list(definition.get("allowed_formats"))
            and source_for(room, extended_format)
        )

    user_vector = vectorise_state(inference_input)
    peak_anxiety = max(
        coerce_number(user_vector.get("Anxiety")),
        coerce_number(user_vector.get("Fear")),
        coerce_number(user_vector.get("Hypervigilance")),
        coerce_number(user_vector.get("Startle Sensitivity")),
    ) >= 0.70

    selected_room = requested_room
    if assigned_format == "videos" and peak_anxiety and not acute and room_ready("safety-cushion", "videos"):
        selected_room = "safety-cushion"
    elif not room_ready(selected_room, assigned_format):
        selected_room = track_room if room_ready(track_room, assigned_format) else ""

    source_id = source_for(selected_room, assigned_format) if room_ready(selected_room, assigned_format) else None
    catalogue_ready = bool(source_id)
    reason = track_room_reason
    if selected_room == "safety-cushion":
        reason = "The Videos slot and peak anxiety signals support an approved Ready 80s nu wave continuation in safety cushion."
    elif selected_room:
        reason = f"{reason} The application assigned the {assigned_format} slot under the 80/10/10 extended-session policy."
    else:
        reason = "No approved Ready source is compatible with the assigned extended-session format; do not force a fallback."

    return {
        "music_room": selected_room or None,
        "format": assigned_format if catalogue_ready else None,
        "source_id": source_id,
        "catalogue_ready": catalogue_ready,
        "why_this_session": reason,
        "format_policy": {
            "weights": EXTENDED_SESSION_FORMAT_WEIGHTS,
            "assignment": "stable_visitor_and_recommendation_slot",
            "draw": round(format_draw, 6),
            "safety_and_readiness_override": True,
        },
    }


def why_this_video(track: Mapping[str, Any], highlights: List[str], score_parts: Mapping[str, float]) -> str:
    summary = str(track.get("editorial_summary") or get_nested(track, ["tensor_profile", "human_review_flow", "Why This Track"], "")).strip()
    used = ", ".join(highlights[:4]) if highlights else "the current needs profile"
    return (
        f"{summary} It was selected because the current check-in emphasises {used}, "
        f"and the deterministic selector found the strongest balance of need fit, constructive trajectory, safety and variety."
    ).strip()


def output_contract(
    track: Mapping[str, Any],
    confidence: float,
    highlights: List[str],
    score_parts: Mapping[str, float],
    acute: bool,
    inference_input: Mapping[str, Any],
    catalogue: Mapping[str, Any],
) -> Dict[str, Any]:
    safety = track_safety(track)
    extended_session = extended_session_contract(track, highlights, acute, inference_input, catalogue)
    adaptive_sound = resolve_adaptive_sound(inference_input)
    return {
        "schema_version": SELECTION_SCHEMA_VERSION,
        "selected_track_id": track.get("id") or get_nested(track, ["tensor_profile", "runtime_delivery", "selected_track_id"], ""),
        "artist": track.get("artist"),
        "title": track.get("title"),
        "presentation": track.get("presentation") or get_nested(track, ["tensor_profile", "runtime_delivery", "presentation"], ""),
        "local_video_file": track.get("local_video_file") or get_nested(track, ["tensor_profile", "runtime_delivery", "local_video_file"], ""),
        "youtube_id": track.get("youtube_id") or get_nested(track, ["tensor_profile", "runtime_delivery", "youtube_id"]),
        "confidence": round(max(0.0, min(1.0, confidence)), 3),
        "why_this_video": why_this_video(track, highlights, score_parts),
        "citizen_needs_used": highlights[:4],
        "trajectory": track.get("trajectory") or get_nested(track, ["tensor_profile", "musicianship_emotion", "Lyric Emotional Trajectory"], ""),
        "primary_environmental_function": track.get("primary_environmental_function") or get_nested(track, ["tensor_profile", "human_review_flow", "Primary Environmental Function"], ""),
        "extended_session": extended_session,
        "adaptive_sound": adaptive_sound,
        "safety": {
            "support_card_required": bool(acute or safety.get("requires_support_card")),
            "age_gate_required": bool(safety.get("requires_age_gate")),
            "avoid_for_acute_distress": bool(safety.get("avoid_for_acute_distress")),
            "sensitive_use_note": str(
                get_nested(track, ["tensor_profile", "musicianship_emotion", "Sensitive Audience Use Notes"], "")
                or safety.get("sensitive_use_note")
                or ""
            ),
        },
        "audit": {
            "catalogue_version": CATALOGUE_VERSION,
            "source": "Ben Gold Standard V1.11",
            "not_a_diagnosis": True,
            "human_review_required": bool(acute or safety.get("requires_age_gate")),
            "current_inference": current_inference_audit(inference_input),
            "selector": {
                "version": SELECTION_POLICY_VERSION,
                "ranking_authority": "tensor_first",
                "aligned_numeric_dimensions": ALIGNED_NUMERIC_DIMENSIONS,
                "raw_checkin_text_used": False,
                "trajectory_policy": str(score_parts.get("trajectory_policy") or SELECTION_POLICY_VERSION),
                "quota_mode": str(score_parts.get("quota_mode") or "state_led"),
                "selected_trajectory_mode": str(score_parts.get("selected_trajectory_mode") or "unclassified"),
                "selected_music_room": str(score_parts.get("selected_music_room") or ""),
                "recency_policy": "hard_exclude_6_tracks_2_artists_then_relax_if_pool_exhausted",
            },
            "selector_score_parts": {key: round(value, 3) for key, value in score_parts.items() if isinstance(value, (int, float))},
            "reranker": {
                "version": DCN_RERANKER_VERSION,
                "mode": "explicit_cross_features_dependency_free_mvp",
                "signal_strength": round(float(score_parts.get("signal_strength", 0.0)), 3),
                "blend": round(float(score_parts.get("rerank_blend", 0.0)), 3),
            },
        },
    }


def attach_inference_provenance(result: Dict[str, Any], inference_payload: Mapping[str, Any]) -> Dict[str, Any]:
    provenance = inference_payload.get("inference_provenance")
    if isinstance(provenance, Mapping):
        result.setdefault("audit", {})["inference_provenance"] = {
            "model": str(provenance.get("model") or ""),
            "prompt_version": str(provenance.get("prompt_version") or ""),
            "prompt_sha256": str(provenance.get("prompt_sha256") or ""),
        }
    return result


def load_catalogue(path: Path = DEFAULT_CATALOGUE_PATH) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_broadcast_schedule(path: Path = DEFAULT_BROADCAST_SCHEDULE_PATH) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_trajectory_policy(path: Path = DEFAULT_TRAJECTORY_POLICY_PATH) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def trajectory_profile(track: Mapping[str, Any], policy: Mapping[str, Any]) -> Dict[str, Any]:
    track_id = str(track.get("id") or get_nested(track, ["tensor_profile", "runtime_delivery", "selected_track_id"], ""))
    profiles = policy.get("tracks") if isinstance(policy.get("tracks"), Mapping) else {}
    profile = profiles.get(track_id) if isinstance(profiles.get(track_id), Mapping) else {}
    return {
        "mode": str(profile.get("mode") or "state_led"),
        "activation_level": max(0, min(3, int(profile.get("activation_level", 1)))),
        "counts_as_uplift": bool(profile.get("counts_as_uplift")),
    }


def recommendation_index(inference_input: Mapping[str, Any], recent_track_ids: List[str]) -> int:
    raw = get_nested(inference_input, ["selection_context", "recommendation_index"], len(recent_track_ids))
    try:
        return max(0, int(float(raw)))
    except (TypeError, ValueError):
        return len(recent_track_ids)


def stable_hash_fraction(*parts: Any) -> float:
    digest = hashlib.sha256("\u241f".join(str(part) for part in parts).encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / float((1 << 64) - 1)


def inferred_state_fingerprint(inference_input: Mapping[str, Any]) -> str:
    """Hash GPT-produced tensor state only; the raw citizen phrase is deliberately excluded."""
    state = {
        "highlights": extract_highlights(inference_input),
        "needs_scorecard": extract_needs_scorecard(inference_input),
    }
    serialized = json.dumps(state, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def recommendation_cycle(
    inference_input: Mapping[str, Any],
    index: int,
    acute: bool,
    policy: Mapping[str, Any],
) -> Tuple[str, int, int]:
    if acute:
        return "regulation", 0, 0
    quota = policy.get("uplift_quota") if isinstance(policy.get("uplift_quota"), Mapping) else {}
    window_size = max(1, int(quota.get("window_size", 13)))
    state_led_slots = {
        int(slot)
        for slot in as_list(quota.get("state_led_slots_zero_indexed"))
    }
    diversity = policy.get("cold_start_diversity") if isinstance(policy.get("cold_start_diversity"), Mapping) else {}
    visitor_id = str(selection_context(inference_input).get("visitor_id") or "")
    cycle_offset = 0
    if diversity.get("visitor_seeded_cycle_offset") and visitor_id:
        cycle_offset = int(stable_hash_fraction("quota-cycle", visitor_id) * window_size) % window_size
    cycle_position = (index + cycle_offset) % window_size
    quota_mode = "state_led" if cycle_position in state_led_slots else "uplift"
    return quota_mode, cycle_position, cycle_offset


def choose_relevance_bounded_candidate(
    candidates: List[Tuple[float, float, Mapping[str, Any], Dict[str, Any]]],
    inference_input: Mapping[str, Any],
    selection_index: int,
    policy: Mapping[str, Any],
) -> Tuple[Tuple[float, float, Mapping[str, Any], Dict[str, Any]], int, float]:
    """Rotate only among near-equal tensor fits so variety never outranks relevance."""
    if not candidates:
        raise ValueError("No relevance-bounded candidates are available.")
    diversity = policy.get("cold_start_diversity") if isinstance(policy.get("cold_start_diversity"), Mapping) else {}
    max_score_gap = max(0.0, min(0.12, float(diversity.get("fit_band_max_score_gap", 0.0))))
    best_post_fit = max(item[1] for item in candidates)
    fit_band = [item for item in candidates if item[1] >= best_post_fit - max_score_gap]
    if len(fit_band) == 1:
        return fit_band[0], 1, 0.0

    context = selection_context(inference_input)
    visitor_id = str(context.get("visitor_id") or "anonymous")
    state_fingerprint = inferred_state_fingerprint(inference_input)
    selected = max(
        fit_band,
        key=lambda item: (
            stable_hash_fraction(
                "fit-band",
                visitor_id,
                state_fingerprint,
                selection_index,
                str(item[2].get("id") or ""),
            ),
            item[1],
            item[0],
        ),
    )
    return selected, len(fit_band), max(0.0, best_post_fit - selected[1])


def selected_music_room(inference_input: Mapping[str, Any]) -> str:
    room = str(
        inference_input.get("selected_music_room")
        or get_nested(inference_input, ["citizen_needs", "selected_music_room"])
        or get_nested(inference_input, ["adaptive_environment", "music_room", "selected_room"])
        or ""
    ).strip().lower()
    return room if room in {"inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"} else ""


def target_activation_level(inference_input: Mapping[str, Any], user_vector: Mapping[str, float], acute: bool) -> int:
    if acute:
        return 0
    depletion = max(
        coerce_number(user_vector.get("Fatigue")),
        coerce_number(user_vector.get("Sleep Pressure")),
        coerce_number(user_vector.get("Emotional Numbing")),
        coerce_number(user_vector.get("Sleep Disturbance")),
        coerce_number(user_vector.get("Loneliness")),
    )
    threat = max(
        coerce_number(user_vector.get("Anxiety")),
        coerce_number(user_vector.get("Fear")),
        coerce_number(user_vector.get("Stress")),
        coerce_number(user_vector.get("Hypervigilance")),
    )
    anger = coerce_number(user_vector.get("Anger"))
    positive_activation = max(
        coerce_number(user_vector.get("Joy")),
        coerce_number(user_vector.get("Motivation")),
        coerce_number(user_vector.get("Arousal")),
        coerce_number(user_vector.get("Self-Actualisation")),
    )
    if depletion >= 0.52 or threat >= 0.62:
        target = 1
    elif anger >= 0.55:
        target = 2
    elif positive_activation >= 0.58:
        target = 3
    else:
        target = 2

    current_inference = inference_input.get("current_inference")
    current_inference = current_inference if isinstance(current_inference, Mapping) else {}
    if str(current_inference.get("heart_rate_role") or "") == "conflicting":
        target = min(target, 1)

    return target


def constructive_trajectory_fit(
    track: Mapping[str, Any],
    policy: Mapping[str, Any],
    quota_mode: str,
    activation_target: int,
) -> float:
    profile = trajectory_profile(track, policy)
    level = int(profile["activation_level"])
    intensity_fit = max(0.0, 1.0 - abs(level - activation_target) / 3.0)
    if quota_mode == "regulation":
        return intensity_fit if level <= 1 else intensity_fit * 0.15
    if quota_mode == "uplift" and not profile["counts_as_uplift"]:
        return intensity_fit * 0.25
    return intensity_fit


def execute_v1_11_selection(
    inference_input: Mapping[str, Any],
    catalogue: Mapping[str, Any],
    engagement_signals: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    tracks = catalogue.get("tracks") if isinstance(catalogue, Mapping) else catalogue
    if not isinstance(tracks, list):
        raise ValueError("Catalogue must contain a tracks array.")

    user_vector = vectorise_state(inference_input)
    highlights = extract_highlights(inference_input)
    safety_flags = extract_safety_flags(inference_input)
    acute = is_acute_distress(inference_input, user_vector, safety_flags)
    target_vector = build_target_trajectory(inference_input, highlights)
    semantic_intent = semantic_intent_from_payload(inference_input, highlights)
    environment_context = inference_input.get("environment_context") if isinstance(inference_input.get("environment_context"), Mapping) else {}
    engagement_bundle = extract_engagement_signals(inference_input, engagement_signals)
    recent_track_ids = extract_recent_track_ids(inference_input)
    trajectory_policy = load_trajectory_policy()
    selection_index = recommendation_index(inference_input, recent_track_ids)
    quota_mode, quota_cycle_position, quota_cycle_offset = recommendation_cycle(
        inference_input,
        selection_index,
        acute,
        trajectory_policy,
    )
    activation_target = target_activation_level(inference_input, user_vector, acute)
    music_room = selected_music_room(inference_input)
    input_scorecard = extract_needs_scorecard(inference_input)
    input_scorecard_dimensions = sum(
        1
        for domain in input_scorecard.values()
        if isinstance(domain, Mapping)
        for value in domain.values()
        if isinstance(value, (int, float)) and not isinstance(value, bool)
    )

    scored: List[Tuple[float, float, Mapping[str, Any], Dict[str, Any]]] = []
    vetoed: List[Dict[str, str]] = []

    for track in tracks:
        veto, reason = opening_catalogue_veto(track, inference_input)
        if veto:
            vetoed.append({"track": str(track.get("id")), "reason": reason})
            continue
        veto, reason = hard_veto_track(track, highlights, acute, safety_flags)
        if veto:
            vetoed.append({"track": str(track.get("id")), "reason": reason})
            continue

        song_vector = vector_from_track(track)
        need_score = cosine(user_vector, song_vector)
        trajectory_score = cosine(target_vector, song_vector) if any(target_vector.values()) else 0.5
        safety_score = safety_fit(track, acute)
        context_score = context_fit(track, environment_context)
        presentation_score = presentation_fit(track, highlights)
        semantic_score = semantic_fit_for_intent(track, highlights, semantic_intent)
        scorecard_score = extended_scorecard_fit(track, inference_input)
        constructive_score = constructive_trajectory_fit(
            track,
            trajectory_policy,
            quota_mode,
            activation_target,
        )
        base_total = (
            0.25 * need_score
            + 0.20 * scorecard_score
            + 0.24 * trajectory_score
            + 0.18 * constructive_score
            + 0.06 * semantic_score
            + 0.04 * safety_score
            + 0.015 * context_score
            + 0.015 * presentation_score
        )
        reranked_total, dcn_parts = dcn_reranker_score(track, engagement_bundle, base_total)
        scored.append((
            base_total,
            reranked_total,
            track,
            {
                "needs_fit": need_score,
                "trajectory_fit": trajectory_score,
                "constructive_trajectory_fit": constructive_score,
                "target_activation_level": float(activation_target),
                "safety_fit": safety_score,
                "context_fit": context_score,
                "presentation_fit": presentation_score,
                "semantic_fit": semantic_score,
                "extended_scorecard_fit": scorecard_score,
                **dcn_parts,
            },
        ))

    if not scored:
        fallback = next(
            (
                track for track in tracks
                if not opening_catalogue_veto(track, inference_input)[0]
                and playable_media_available(track)
                and not track_safety(track).get("requires_age_gate")
            ),
            None,
        )
        if not fallback:
            raise ValueError("No tracks cleared current safety criteria.")
        return attach_inference_provenance(output_contract(fallback, 0.0, highlights, {}, True, inference_input, catalogue), inference_input)

    # Tensor fit establishes eligibility. Engagement and recency can only choose
    # within this bounded pool; they can never introduce a lower-fit track.
    scored.sort(key=lambda item: item[0], reverse=True)
    recent_set = set(recent_track_ids)
    best_tensor_score = scored[0][0]
    strict_fit_floor = max(best_tensor_score - 0.16, best_tensor_score * 0.78)
    fit_floor = strict_fit_floor
    eligible_pool = [item for item in scored if item[0] >= strict_fit_floor][:10]
    fit_band_expanded = False
    if len(eligible_pool) < min(6, len(scored)):
        diversity_fit_floor = max(best_tensor_score - 0.22, best_tensor_score * 0.70)
        expanded_pool = [item for item in scored if item[0] >= diversity_fit_floor][:12]
        if len(expanded_pool) > len(eligible_pool):
            eligible_pool = expanded_pool
            fit_floor = diversity_fit_floor
            fit_band_expanded = True

    activation_candidates = [
        item for item in eligible_pool
        if abs(int(trajectory_profile(item[2], trajectory_policy)["activation_level"]) - activation_target) <= 1
    ]
    mode_pool = activation_candidates or eligible_pool
    if quota_mode == "uplift":
        uplift_candidates = [
            item for item in mode_pool
            if trajectory_profile(item[2], trajectory_policy)["counts_as_uplift"]
        ]
        if uplift_candidates:
            mode_pool = uplift_candidates
    elif quota_mode == "regulation":
        regulation_candidates = [
            item for item in mode_pool
            if int(trajectory_profile(item[2], trajectory_policy)["activation_level"]) <= 1
        ]
        if regulation_candidates:
            mode_pool = regulation_candidates

    recency_config = trajectory_policy.get("recency") if isinstance(trajectory_policy.get("recency"), Mapping) else {}
    track_exclusion_count = max(1, int(recency_config.get("hard_track_exclusion_count", 6)))
    artist_exclusion_count = max(1, int(recency_config.get("hard_artist_exclusion_count", 2)))
    hard_recent_ids = set(recent_track_ids[:track_exclusion_count])
    track_by_id = {str(track.get("id") or ""): track for track in tracks}
    recent_artists: List[str] = []
    for track_id in recent_track_ids:
        artist = str(track_by_id.get(track_id, {}).get("artist") or "").casefold()
        if artist and artist not in recent_artists:
            recent_artists.append(artist)
        if len(recent_artists) >= artist_exclusion_count:
            break

    fresh_candidates = [item for item in mode_pool if str(item[2].get("id") or "") not in hard_recent_ids]
    artist_repeat_avoided = False
    recency_relaxed = False
    if fresh_candidates:
        choice_pool = fresh_candidates
        different_artist_candidates = [
            item for item in fresh_candidates
            if str(item[2].get("artist") or "").casefold() not in recent_artists
        ]
        if recent_artists and different_artist_candidates:
            choice_pool = different_artist_candidates
            artist_repeat_avoided = len(choice_pool) != len(fresh_candidates)
        selected_candidate, fit_band_rotation_size, fit_band_score_gap = choose_relevance_bounded_candidate(
            choice_pool,
            inference_input,
            selection_index,
            trajectory_policy,
        )
        best_score, post_fit_score, best_track, score_parts = selected_candidate
    elif recent_track_ids:
        recency_relaxed = True
        recency = {track_id: index for index, track_id in enumerate(recent_track_ids)}
        recycled_candidates = sorted(
            mode_pool,
            key=lambda item: (
                recency.get(str(item[2].get("id") or ""), len(recent_track_ids)),
                item[1],
                item[0],
            ),
            reverse=True,
        )
        best_score, post_fit_score, best_track, score_parts = recycled_candidates[0]
        fit_band_rotation_size = 1
        fit_band_score_gap = 0.0
    else:
        best_score, post_fit_score, best_track, score_parts = eligible_pool[0]
        fit_band_rotation_size = 1
        fit_band_score_gap = 0.0
    score_parts = {
        **score_parts,
        "trajectory_policy": str(trajectory_policy.get("policy_version") or SELECTION_POLICY_VERSION),
        "quota_mode": quota_mode,
        "selected_trajectory_mode": str(trajectory_profile(best_track, trajectory_policy)["mode"]),
        "selected_music_room": music_room,
        "tensor_selector_score": float(best_score),
        "post_fit_reranker_score": float(post_fit_score),
        "input_scorecard_dimensions": float(input_scorecard_dimensions),
        "recent_tracks_excluded": float(len(mode_pool) - len(fresh_candidates)),
        "recent_artists_excluded": float(len(recent_artists)),
        "repeat_avoided": 1.0 if fresh_candidates and recent_track_ids else 0.0,
        "artist_repeat_avoided": 1.0 if artist_repeat_avoided else 0.0,
        "recency_relaxed": 1.0 if recency_relaxed else 0.0,
        "uplift_slot": 1.0 if quota_mode == "uplift" else 0.0,
        "quota_cycle_position": float(quota_cycle_position),
        "quota_cycle_offset": float(quota_cycle_offset),
        "fit_band_rotation_size": float(fit_band_rotation_size),
        "fit_band_score_gap": float(fit_band_score_gap),
        "fit_band_expanded": 1.0 if fit_band_expanded else 0.0,
        "selection_history_size": float(len(recent_track_ids)),
        "tensor_candidate_count": float(len(scored)),
        "eligible_candidate_count": float(len(eligible_pool)),
        "policy_candidate_count": float(len(mode_pool)),
        "fit_floor": float(fit_floor),
    }
    return attach_inference_provenance(output_contract(best_track, best_score, highlights, score_parts, acute, inference_input, catalogue), inference_input)


def select_from_file(
    inference_input: Mapping[str, Any],
    catalogue_path: Path = DEFAULT_CATALOGUE_PATH,
    engagement_signals: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    return execute_v1_11_selection(inference_input, load_catalogue(catalogue_path), engagement_signals)


def lambda_handler(event: Mapping[str, Any], context: Any = None) -> Dict[str, Any]:
    body = event.get("body", event) if isinstance(event, Mapping) else event
    if isinstance(body, str):
        body = json.loads(body or "{}")
    payload = unwrap_inference_payload(body)
    engagement = body.get("engagement_signals") if isinstance(body, Mapping) and isinstance(body.get("engagement_signals"), Mapping) else None
    result = select_from_file(payload, engagement_signals=engagement)
    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json; charset=utf-8"},
        "body": json.dumps(result),
    }


try:
    from fastapi import FastAPI
    from pydantic import BaseModel

    class SelectionRequest(BaseModel):
        v555_payload: Optional[Dict[str, Any]] = None
        v445_payload: Optional[Dict[str, Any]] = None
        v444_payload: Optional[Dict[str, Any]] = None
        inference: Optional[Dict[str, Any]] = None
        engagement_signals: Optional[Dict[str, Any]] = None

    app = FastAPI(title="Universal Mind Adaptive Music Television Selector")

    @app.post("/adaptive-music-video-selection")
    def adaptive_music_video_selection(request: SelectionRequest) -> Dict[str, Any]:
        request_body = request.model_dump() if hasattr(request, "model_dump") else request.dict()
        payload = unwrap_inference_payload(request_body)
        if payload is request_body:
            raise ValueError("A v5.55 inference payload is required.")
        return select_from_file(payload, engagement_signals=request.engagement_signals)

except Exception:
    app = None


def main() -> None:
    parser = argparse.ArgumentParser(description="Run deterministic v1.11 adaptive music selection.")
    parser.add_argument("--catalogue", default=str(DEFAULT_CATALOGUE_PATH))
    parser.add_argument("--engagement", help="Optional engagement/survey analytics JSON payload for DCN re-ranking.")
    parser.add_argument("--stdin", action="store_true", help="Read a v5.55 inference payload JSON from stdin.")
    parser.add_argument("payload", nargs="?", help="Inline v5.55 inference payload JSON.")
    args = parser.parse_args()

    if args.stdin:
        import sys

        payload = json.loads(sys.stdin.read() or "{}")
    elif args.payload:
        payload = json.loads(args.payload)
    else:
        payload = {}

    unwrapped_payload = unwrap_inference_payload(payload)
    if unwrapped_payload is not payload:
        wrapper_engagement = payload.get("engagement_signals") if isinstance(payload.get("engagement_signals"), Mapping) else None
        payload = unwrapped_payload
    else:
        wrapper_engagement = None

    engagement = json.loads(Path(args.engagement).read_text(encoding="utf-8")) if args.engagement else wrapper_engagement

    result = select_from_file(payload, Path(args.catalogue), engagement)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
