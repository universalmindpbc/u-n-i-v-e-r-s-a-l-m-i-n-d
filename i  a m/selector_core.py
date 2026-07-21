#!/usr/bin/env python3
"""Deterministic Adaptive Music Television selector core.

This module is the mathematical middle layer between the v4.44 citizen-needs
payload and the v1.11 music-video tensor catalogue. It deliberately avoids LLM
matching: GPT can produce the citizen state, but this file chooses the track.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Tuple

try:
    from semantic_compiler import SEMANTIC_LEXICON
except Exception:
    SEMANTIC_LEXICON = {}


CATALOGUE_VERSION = "adaptive_music_video_catalogue_v1.11"
SELECTION_SCHEMA_VERSION = "adaptive_music_video_selection_v1.11"
SELECTION_POLICY_VERSION = "tensor_uplift_rotation_v3"
DCN_RERANKER_VERSION = "adaptive_music_engagement_dcn_reranker_v0.1"
ALIGNED_NUMERIC_DIMENSIONS = 80
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CATALOGUE_PATH = BASE_DIR / "adaptive-music-video-catalogue-v1.11.json"
DEFAULT_TRAJECTORY_POLICY_PATH = BASE_DIR / "adaptive-music-trajectory-policy-v2.json"

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
    v444_payload: Mapping[str, Any],
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
        value = v444_payload.get(key)
        if not isinstance(value, Mapping):
            continue
        if key in {"survey_feedback", "emoji_engagement"} and key not in value:
            bundle[key] = value
        else:
            merge_signal_maps(bundle, value)
    return bundle


def extract_highlights(v444_payload: Mapping[str, Any]) -> List[str]:
    candidates = (
        v444_payload.get("top_highlights")
        or v444_payload.get("highlights")
        or v444_payload.get("top_needs_used")
        or get_nested(v444_payload, ["citizen_needs", "top_highlights"])
        or get_nested(v444_payload, ["citizen_needs", "top_needs_used"])
        or []
    )
    highlights: List[str] = []
    for item in as_list(candidates):
        value = item.get("label") if isinstance(item, Mapping) else item
        need = canonical_need(value)
        if need in VECTOR_KEYS and need not in highlights:
            highlights.append(need)

    return highlights[:8]


def extract_safety_flags(v444_payload: Mapping[str, Any]) -> List[str]:
    flags = []
    for path in (
        ["safety_flags"],
        ["safety", "flags"],
        ["citizen_needs", "safety_flags"],
        ["clinical_risk", "safety_flags"],
        ["adaptive_support_relevance", "flags"],
    ):
        flags.extend(str(item) for item in as_list(get_nested(v444_payload, path)))

    human_review = v444_payload.get("human_review_relevance")
    if human_review:
        flags.append(str(human_review))

    support_level = get_nested(v444_payload, ["adaptive_support_relevance", "level"])
    if support_level:
        flags.append(str(support_level))

    return [flag.strip() for flag in flags if flag and flag.strip()]


def extract_needs_scorecard(v444_payload: Mapping[str, Any]) -> Mapping[str, Any]:
    candidates = (
        get_nested(v444_payload, ["citizen_needs", "needs_scorecard"], {}),
        v444_payload.get("needs_scorecard") if isinstance(v444_payload.get("needs_scorecard"), Mapping) else {},
        get_nested(v444_payload, ["citizen_needs", "full_needs_scorecard"], {}),
        v444_payload.get("full_needs_scorecard") if isinstance(v444_payload.get("full_needs_scorecard"), Mapping) else {},
    )
    for candidate in candidates:
        if isinstance(candidate, Mapping) and candidate:
            return candidate
    return {}


def vectorise_state(v444_payload: Mapping[str, Any]) -> Dict[str, float]:
    needs = v444_payload.get("citizen_needs") if isinstance(v444_payload.get("citizen_needs"), Mapping) else {}
    radar_scores = v444_payload.get("radar_scores") if isinstance(v444_payload.get("radar_scores"), Mapping) else {}
    scorecard = extract_needs_scorecard(v444_payload)
    scorecard_radar = scorecard.get("human_needs_radar") if isinstance(scorecard.get("human_needs_radar"), Mapping) else {}
    source = needs or radar_scores or v444_payload
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

    for highlight in extract_highlights(v444_payload):
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


def detect_named_trajectories(v444_payload: Mapping[str, Any], highlights: List[str]) -> List[str]:
    text = " ".join(structured_summary_fragments(v444_payload) + [" ".join(highlights)]).lower()
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


def build_target_trajectory(v444_payload: Mapping[str, Any], highlights: List[str]) -> Dict[str, float]:
    target = {key: 0.0 for key in VECTOR_KEYS}
    trajectories = detect_named_trajectories(v444_payload, highlights)
    if not trajectories:
        for highlight in highlights:
            if highlight in target:
                target[highlight] = 0.55
        return target

    for trajectory in trajectories:
        for key in TRAJECTORY_TARGETS.get(trajectory, []):
            if key in target:
                target[key] = max(target[key], 1.0)
    return target


def explicit_need_intensity(v444_payload: Mapping[str, Any], label: str) -> float:
    """Read numeric intensity without promoting a categorical highlight to 1.0."""
    needs = v444_payload.get("citizen_needs") if isinstance(v444_payload.get("citizen_needs"), Mapping) else {}
    radar_scores = v444_payload.get("radar_scores") if isinstance(v444_payload.get("radar_scores"), Mapping) else {}
    scorecard = extract_needs_scorecard(v444_payload)
    scorecard_radar = scorecard.get("human_needs_radar") if isinstance(scorecard.get("human_needs_radar"), Mapping) else {}
    values = [score_for_label(radar_scores, label), score_for_label(scorecard_radar, label)]
    if isinstance(needs, Mapping):
        values.append(score_for_label(needs, label))
        for domain in RADAR_DOMAINS:
            domain_map = needs.get(domain)
            if isinstance(domain_map, Mapping):
                values.append(score_for_label(domain_map, label))
    return max(values, default=0.0)


def is_acute_distress(v444_payload: Mapping[str, Any], user_vector: Mapping[str, float], safety_flags: List[str]) -> bool:
    scorecard = extract_needs_scorecard(v444_payload)
    safety_domain = scorecard.get("mental_health_safety") if isinstance(scorecard.get("mental_health_safety"), Mapping) else {}
    if score_for_label(safety_domain, "Acute Distress") >= 0.75:
        return True
    if score_for_label(safety_domain, "Human Review Need") >= 0.80:
        return True
    if score_for_label(safety_domain, "Dissociation Risk") >= 0.85:
        return True
    support_level = str(get_nested(v444_payload, ["adaptive_support_relevance", "level"], "")).lower()
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


def selection_context(v444_payload: Mapping[str, Any]) -> Mapping[str, Any]:
    context = v444_payload.get("selection_context")
    return context if isinstance(context, Mapping) else {}


def opening_catalogue_veto(track: Mapping[str, Any], v444_payload: Mapping[str, Any]) -> Tuple[bool, str]:
    """Keep the opening recommendation inside its requested media and safety surface."""
    context = selection_context(v444_payload)
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


def semantic_intent_from_payload(v444_payload: Mapping[str, Any], highlights: List[str]) -> Dict[str, float]:
    text_fragments = structured_summary_fragments(v444_payload)
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


def structured_summary_fragments(v444_payload: Mapping[str, Any]) -> List[str]:
    """Return only GPT-produced summaries, never the raw citizen check-in."""
    fragments = [
        v444_payload.get("interpretation_summary"),
        v444_payload.get("soundtrack_reason"),
        get_nested(v444_payload, ["citizen_needs", "interpretation_summary"]),
        get_nested(v444_payload, ["citizen_needs", "summary"]),
        get_nested(v444_payload, ["adaptive_music", "why_music"]),
    ]
    return [str(fragment or "").strip() for fragment in fragments if str(fragment or "").strip()]


def extract_recent_track_ids(v444_payload: Mapping[str, Any]) -> List[str]:
    candidates = (
        get_nested(v444_payload, ["selection_context", "recent_track_ids"], [])
        or v444_payload.get("recent_track_ids")
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


def extended_scorecard_fit(track: Mapping[str, Any], v444_payload: Mapping[str, Any]) -> float:
    scorecard = extract_needs_scorecard(v444_payload)
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
    station = str(track.get("radio_handoff") or get_nested(track, ["tensor_profile", "runtime_delivery", "radio_handoff"], "")).lower()
    time_text = str(environment_context.get("local_time") or environment_context.get("time_of_day") or "").lower()
    weather = str(environment_context.get("weather_condition") or "").lower()
    temp = environment_context.get("temperature_celsius")

    if ("pm" in time_text or "night" in time_text or "evening" in time_text) and station == "calm":
        score += 0.16
    if ("late" in time_text or "night" in time_text) and station == "house":
        score -= 0.16
    if any(word in weather for word in ("rain", "storm", "wind")) and station in {"calm", "chill"}:
        score += 0.12
    if isinstance(temp, (int, float)) and temp >= 30 and station == "house":
        score -= 0.1
    return max(0.0, min(1.0, score))


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
    radio_listen = max(
        coerce_ratio(first_number(combined, ("radio_listen_ratio", "radio_completion_ratio", "streaming_radio_ratio"))),
        coerce_count(first_number(combined, ("radio_listen_seconds", "streaming_radio_seconds", "audio_seconds")), 20 * 60),
        coerce_count(first_number(combined, ("radio_listen_minutes", "streaming_radio_minutes")), 20),
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

    station, _ = infer_radio_handoff(track, [])
    calm_or_chill = 1.0 if station in {"calm", "chill"} else 0.0
    house = 1.0 if station == "house" else 0.0

    return {
        "video_completion": video_completion,
        "radio_listening": radio_listen,
        "soft_dwell": dwell * low_click,
        "returning_interest": return_visits,
        "emoji_need_fit": emoji_need_fit(track, combined),
        "survey_fit": voluntary_survey_fit(combined),
        "friction": friction,
        "video_x_soft_dwell": video_completion * dwell * low_click,
        "radio_x_handoff": radio_listen * (0.65 + 0.35 * calm_or_chill),
        "emoji_x_track_needs": emoji_need_fit(track, combined) * max(video_completion, dwell, return_visits),
        "house_activation_fit": house * max(video_completion, return_visits) * (1.0 - friction),
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
        features["radio_listening"],
        features["soft_dwell"],
        features["returning_interest"],
        abs(features["survey_fit"] - 0.5) * 2.0,
        max(0.0, features["emoji_need_fit"] - 0.5) * 2.0,
    )
    engagement_score = (
        0.23 * features["video_completion"]
        + 0.18 * features["radio_listening"]
        + 0.15 * features["soft_dwell"]
        + 0.10 * features["returning_interest"]
        + 0.12 * features["emoji_need_fit"]
        + 0.12 * features["survey_fit"]
        + 0.10 * features["video_x_soft_dwell"]
        + 0.06 * features["radio_x_handoff"]
        + 0.06 * features["emoji_x_track_needs"]
        + 0.03 * features["house_activation_fit"]
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


def infer_radio_handoff(track: Mapping[str, Any], highlights: List[str]) -> Tuple[str, str]:
    station = str(track.get("radio_handoff") or get_nested(track, ["tensor_profile", "runtime_delivery", "radio_handoff"], "chill")).lower()
    if station not in {"calm", "chill", "house"}:
        station = "chill"
    reasons = {
        "calm": "The radio handoff downshifts the room after the video and supports regulation, recovery and lower density.",
        "chill": "The radio handoff keeps the room warm and spacious so the video can integrate without dropping the citizen abruptly.",
        "house": "The radio handoff carries the video into embodied momentum, agency and social energy.",
    }
    return station, reasons[station]


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
) -> Dict[str, Any]:
    safety = track_safety(track)
    station, station_reason = infer_radio_handoff(track, highlights)
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
        "radio_handoff": {
            "station": station,
            "why_this_handoff": station_reason,
        },
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
            "selector": {
                "version": SELECTION_POLICY_VERSION,
                "ranking_authority": "tensor_first",
                "aligned_numeric_dimensions": ALIGNED_NUMERIC_DIMENSIONS,
                "raw_checkin_text_used": False,
                "trajectory_policy": str(score_parts.get("trajectory_policy") or SELECTION_POLICY_VERSION),
                "quota_mode": str(score_parts.get("quota_mode") or "state_led"),
                "selected_trajectory_mode": str(score_parts.get("selected_trajectory_mode") or "unclassified"),
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


def attach_inference_provenance(result: Dict[str, Any], v444_payload: Mapping[str, Any]) -> Dict[str, Any]:
    provenance = v444_payload.get("inference_provenance")
    if isinstance(provenance, Mapping):
        result.setdefault("audit", {})["inference_provenance"] = {
            "model": str(provenance.get("model") or ""),
            "prompt_version": str(provenance.get("prompt_version") or ""),
            "prompt_sha256": str(provenance.get("prompt_sha256") or ""),
        }
    return result


def load_catalogue(path: Path = DEFAULT_CATALOGUE_PATH) -> Dict[str, Any]:
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


def recommendation_index(v444_input: Mapping[str, Any], recent_track_ids: List[str]) -> int:
    raw = get_nested(v444_input, ["selection_context", "recommendation_index"], len(recent_track_ids))
    try:
        return max(0, int(float(raw)))
    except (TypeError, ValueError):
        return len(recent_track_ids)


def stable_hash_fraction(*parts: Any) -> float:
    digest = hashlib.sha256("\u241f".join(str(part) for part in parts).encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") / float((1 << 64) - 1)


def inferred_state_fingerprint(v444_input: Mapping[str, Any]) -> str:
    """Hash GPT-produced tensor state only; the raw citizen phrase is deliberately excluded."""
    state = {
        "highlights": extract_highlights(v444_input),
        "needs_scorecard": extract_needs_scorecard(v444_input),
    }
    serialized = json.dumps(state, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def recommendation_cycle(
    v444_input: Mapping[str, Any],
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
    visitor_id = str(selection_context(v444_input).get("visitor_id") or "")
    cycle_offset = 0
    if diversity.get("visitor_seeded_cycle_offset") and visitor_id:
        cycle_offset = int(stable_hash_fraction("quota-cycle", visitor_id) * window_size) % window_size
    cycle_position = (index + cycle_offset) % window_size
    quota_mode = "state_led" if cycle_position in state_led_slots else "uplift"
    return quota_mode, cycle_position, cycle_offset


def choose_relevance_bounded_candidate(
    candidates: List[Tuple[float, float, Mapping[str, Any], Dict[str, Any]]],
    v444_input: Mapping[str, Any],
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

    context = selection_context(v444_input)
    visitor_id = str(context.get("visitor_id") or "anonymous")
    state_fingerprint = inferred_state_fingerprint(v444_input)
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


def target_activation_level(user_vector: Mapping[str, float], acute: bool) -> int:
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
        return 1
    if anger >= 0.55:
        return 2
    if positive_activation >= 0.58:
        return 3
    return 2


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
    v444_input: Mapping[str, Any],
    catalogue: Mapping[str, Any],
    engagement_signals: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    tracks = catalogue.get("tracks") if isinstance(catalogue, Mapping) else catalogue
    if not isinstance(tracks, list):
        raise ValueError("Catalogue must contain a tracks array.")

    user_vector = vectorise_state(v444_input)
    highlights = extract_highlights(v444_input)
    safety_flags = extract_safety_flags(v444_input)
    acute = is_acute_distress(v444_input, user_vector, safety_flags)
    target_vector = build_target_trajectory(v444_input, highlights)
    semantic_intent = semantic_intent_from_payload(v444_input, highlights)
    environment_context = v444_input.get("environment_context") if isinstance(v444_input.get("environment_context"), Mapping) else {}
    engagement_bundle = extract_engagement_signals(v444_input, engagement_signals)
    recent_track_ids = extract_recent_track_ids(v444_input)
    trajectory_policy = load_trajectory_policy()
    selection_index = recommendation_index(v444_input, recent_track_ids)
    quota_mode, quota_cycle_position, quota_cycle_offset = recommendation_cycle(
        v444_input,
        selection_index,
        acute,
        trajectory_policy,
    )
    activation_target = target_activation_level(user_vector, acute)
    input_scorecard = extract_needs_scorecard(v444_input)
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
        veto, reason = opening_catalogue_veto(track, v444_input)
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
        scorecard_score = extended_scorecard_fit(track, v444_input)
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
                if not opening_catalogue_veto(track, v444_input)[0]
                and playable_media_available(track)
                and not track_safety(track).get("requires_age_gate")
            ),
            None,
        )
        if not fallback:
            raise ValueError("No tracks cleared current safety criteria.")
        return attach_inference_provenance(output_contract(fallback, 0.0, highlights, {}, True), v444_input)

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
            v444_input,
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
    return attach_inference_provenance(output_contract(best_track, best_score, highlights, score_parts, acute), v444_input)


def select_from_file(
    v444_input: Mapping[str, Any],
    catalogue_path: Path = DEFAULT_CATALOGUE_PATH,
    engagement_signals: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    return execute_v1_11_selection(v444_input, load_catalogue(catalogue_path), engagement_signals)


def lambda_handler(event: Mapping[str, Any], context: Any = None) -> Dict[str, Any]:
    body = event.get("body", event) if isinstance(event, Mapping) else event
    if isinstance(body, str):
        body = json.loads(body or "{}")
    payload = body.get("v444_payload") if isinstance(body, Mapping) and isinstance(body.get("v444_payload"), Mapping) else body
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
        v444_payload: Dict[str, Any]
        engagement_signals: Optional[Dict[str, Any]] = None

    app = FastAPI(title="Universal Mind Adaptive Music Television Selector")

    @app.post("/adaptive-music-video-selection")
    def adaptive_music_video_selection(request: SelectionRequest) -> Dict[str, Any]:
        return select_from_file(request.v444_payload, engagement_signals=request.engagement_signals)

except Exception:
    app = None


def main() -> None:
    parser = argparse.ArgumentParser(description="Run deterministic v1.11 adaptive music selection.")
    parser.add_argument("--catalogue", default=str(DEFAULT_CATALOGUE_PATH))
    parser.add_argument("--engagement", help="Optional engagement/survey analytics JSON payload for DCN re-ranking.")
    parser.add_argument("--stdin", action="store_true", help="Read v4.44 payload JSON from stdin.")
    parser.add_argument("payload", nargs="?", help="Inline v4.44 payload JSON.")
    args = parser.parse_args()

    if args.stdin:
        import sys

        payload = json.loads(sys.stdin.read() or "{}")
    elif args.payload:
        payload = json.loads(args.payload)
    else:
        payload = {}

    if isinstance(payload, Mapping) and isinstance(payload.get("v444_payload"), Mapping):
        wrapper_engagement = payload.get("engagement_signals") if isinstance(payload.get("engagement_signals"), Mapping) else None
        payload = payload["v444_payload"]
    else:
        wrapper_engagement = None

    engagement = json.loads(Path(args.engagement).read_text(encoding="utf-8")) if args.engagement else wrapper_engagement

    result = select_from_file(payload, Path(args.catalogue), engagement)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
