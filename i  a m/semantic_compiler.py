#!/usr/bin/env python3
"""Compile natural-language song tensor fields into deterministic semantics.

The compiler is an offline authoring step. It reads the hydrated Notion export
fields preserved in each track, scans them with an explicit lexicon, and writes
a structured ``semantic_compiler`` block back into the catalogue. Runtime song
selection can then use the compiled fields without asking an LLM to reinterpret
the prose on every request.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CATALOGUE_PATH = BASE_DIR / "adaptive-music-video-catalogue-v1.11.json"
SEMANTIC_COMPILER_VERSION = "semantic_compiler_v1.0"

PROSE_FIELDS = [
    "Why This Track",
    "GPT Interpretation",
    "Ben Felt Interpretation",
    "Personal Meaning Role",
    "Subjective Feedback Hypothesis",
    "Human Variability Notes",
    "Overall Music Feeling",
    "Melody Feeling",
    "Harmony / Chords Feeling",
    "Arp / Synth Feeling",
    "Drums / Percussion Impulse",
    "Bass / Low-End Feeling",
    "Vocal Performance Feeling",
    "Energy / Body Response",
    "Suitable Citizen State",
    "Not Suitable Citizen State",
    "Editorial Notes",
    "Dadirri Mindfulness Notes",
    "MVA Notes",
    "Mono Myth Scoring Notes",
    "Music Video Core Themes",
    "Music Video Adult Themes Notes",
    "Skin Lingerie Swimwear Fetishwear Exposure Notes",
    "Sensitive Audience Use Notes",
    "Lyric Feeling",
    "Lyric Themes",
    "Lyric Emotional Trajectory",
    "Lyric Memory Triggers",
    "Autobiographical Trigger Hypothesis",
    "Memory Risk Notes",
    "Memory Interpretation Notes",
    "Place Memory Anchors",
    "Relationship Memory Anchors",
    "Sensory Memory Anchors",
]

TEXT_WEIGHT_BY_FIELD = {
    "Why This Track": 1.45,
    "GPT Interpretation": 1.35,
    "Ben Felt Interpretation": 1.45,
    "Overall Music Feeling": 1.25,
    "Energy / Body Response": 1.35,
    "Dadirri Mindfulness Notes": 1.45,
    "MVA Notes": 1.45,
    "Mono Myth Scoring Notes": 1.3,
    "Music Video Core Themes": 1.15,
    "Sensitive Audience Use Notes": 1.55,
    "Lyric Feeling": 1.1,
    "Lyric Emotional Trajectory": 1.2,
    "Not Suitable Citizen State": 1.5,
}

CONTRAINDICATION_FIELDS = {
    "Sensitive Audience Use Notes",
    "Not Suitable Citizen State",
    "Memory Risk Notes",
}

SEMANTIC_LEXICON: Dict[str, Sequence[str]] = {
    "agency": ("agency", "agentic", "self-belief", "sovereignty", "confidence", "self-possession", "power", "command", "assertion", "unapologetic"),
    "motivation": ("motivation", "motivating", "momentum", "forward motion", "drive", "activation", "activate", "vitality", "life force", "energy"),
    "purpose": ("purpose", "meaning", "future", "future-facing", "direction", "mission", "calling", "shaping the future", "intentional"),
    "self_actualisation": ("self-actualisation", "self-actualization", "becoming", "arrival", "final form", "identity", "visible", "emergence", "authentic self-expression"),
    "courage": ("courage", "brave", "shadow-facing", "confrontation", "facing", "grit", "resilience", "strength"),
    "calm": ("calm", "slowing", "low-arousal", "downshift", "peace", "stillness", "breathing", "regulation", "quiet"),
    "recovery": ("recovery", "restoration", "healing", "release", "repair", "integrate", "integration", "re-entry", "recuperation"),
    "clarity": ("clarity", "clear", "awareness", "recognition", "self-awareness", "perspective", "understood", "understanding"),
    "psychological_safety": ("psychological safety", "safe", "safety", "held", "support pathway", "guardrail", "consent", "human review"),
    "hope": ("hope", "optimism", "light", "brightness", "inner light", "possibility", "renewed", "future possibility"),
    "joy": ("joy", "celebration", "smiling", "play", "playful", "lightness", "affirmation", "uplift", "dance"),
    "love": ("love", "heart", "romance", "open-hearted", "heart-opening", "emotional availability"),
    "trust": ("trust", "trusted", "receptivity", "reassurance", "stability", "stable"),
    "belonging": ("belonging", "crowd", "community", "collective", "togetherness", "not alone", "shared", "festival", "rave"),
    "connection": ("connection", "reconnection", "relationship", "social", "together", "common humanity", "audience"),
    "empathy": ("empathy", "compassion", "witness", "witnessing", "solidarity", "humanity"),
    "curiosity": ("curiosity", "curious", "exploration", "explore", "strange", "surreal", "imagination", "symbolic", "fantasy"),
    "awe": ("awe", "transcendence", "transcendent", "spiritual", "mythic", "luminous", "dreamtime", "elemental"),
    "groundedness": ("grounded", "grounding", "groundedness", "country", "place", "rooted", "body", "embodied", "somatic"),
    "dadirri": ("dadirri", "deep listening", "presence", "listening", "stillness"),
    "service": ("service", "support", "mentor", "guide", "wisdom", "elder", "counsel"),
    "identity": ("identity", "self", "self-expression", "cultural", "cultural pride", "lineage", "visibility", "sovereignty"),
    "heartbreak": ("heartbreak", "heartbroken", "romantic pain", "rejection", "jealousy", "longing"),
    "anger": ("anger", "frustration", "frustrated", "rage", "pressure", "over it", "defiant"),
    "numbing": ("numb", "numbness", "emotional numbing", "flat", "blank", "desensitisation", "desensitization", "dulled"),
    "anxiety": ("anxiety", "anxious", "panic", "stress", "overload", "overstimulated", "dysregulating"),
    "loneliness": ("loneliness", "lonely", "alone", "isolation", "isolated", "alienation", "unseen"),
    "shame": ("shame", "taboo", "sexual trauma", "unsupported", "embarrassment"),
    "shadow": ("shadow", "dark", "darkness", "gothic", "taboo", "desire", "industrial", "confrontational", "adult intensity"),
    "activation": ("high arousal", "activation", "activated", "stimulation", "fast", "kinetic", "pulse", "dance impulse", "movement"),
    "sensory_intensity": ("rapid visuals", "fast visual", "sensory", "overload", "stimulation", "startle", "intrusion", "intense"),
    "trauma_caution": ("trauma", "acute crisis", "acute distress", "self-harm", "suicidal", "sexual trauma", "fresh trauma", "unsupported youth"),
    "youth_caution": ("youth", "younger youth", "underage", "age gating", "age gate"),
    "sensuality": ("sensuality", "sexualisation", "sexualization", "body exposure", "erotic", "desire", "fetish"),
}

NEED_TO_SEMANTIC = {
    "Joy": "joy",
    "Calm": "calm",
    "Hope": "hope",
    "Curiosity": "curiosity",
    "Gratitude": "hope",
    "Awe": "awe",
    "Love": "love",
    "Purpose": "purpose",
    "Self-Actualisation": "self_actualisation",
    "Self-Transcendence": "awe",
    "Trust": "trust",
    "Belonging": "belonging",
    "Connection": "connection",
    "Empathy": "empathy",
    "Psychological Safety": "psychological_safety",
    "Attention": "clarity",
    "Mental Load": "anxiety",
    "Clarity": "clarity",
    "Rumination": "recovery",
    "Motivation": "motivation",
    "Executive Function": "agency",
    "Arousal": "activation",
    "Recovery": "recovery",
    "Stress": "anxiety",
    "Sleep Pressure": "calm",
    "Fatigue": "recovery",
    "Fear": "psychological_safety",
    "Anxiety": "anxiety",
    "Anger": "anger",
    "Shame": "shame",
    "Loneliness": "loneliness",
    "Hypervigilance": "trauma_caution",
    "Avoidance": "recovery",
    "Intrusions": "trauma_caution",
    "Emotional Numbing": "numbing",
    "Sleep Disturbance": "calm",
    "Startle Sensitivity": "sensory_intensity",
}

THEME_GROUPS = {
    "regulation": ("calm", "recovery", "clarity", "psychological_safety", "dadirri"),
    "activation": ("motivation", "agency", "joy", "activation", "purpose"),
    "connection": ("belonging", "connection", "love", "trust", "empathy"),
    "identity": ("identity", "self_actualisation", "courage", "groundedness", "purpose"),
    "awe_exploration": ("curiosity", "awe", "shadow", "sensory_intensity"),
    "risk": ("trauma_caution", "youth_caution", "sensuality", "anxiety", "shame"),
}

SUPPORTIVE_SEMANTICS = {
    "Calm": ("calm", "recovery", "psychological_safety", "dadirri"),
    "Clarity": ("clarity", "awareness", "recovery"),
    "Recovery": ("recovery", "calm", "psychological_safety", "connection"),
    "Connection": ("connection", "belonging", "love", "empathy"),
    "Belonging": ("belonging", "connection", "common_humanity"),
    "Love": ("love", "trust", "connection"),
    "Trust": ("trust", "psychological_safety", "connection"),
    "Purpose": ("purpose", "agency", "motivation"),
    "Motivation": ("motivation", "agency", "activation"),
    "Self-Actualisation": ("self_actualisation", "identity", "agency"),
    "Curiosity": ("curiosity", "awe", "identity"),
    "Awe": ("awe", "curiosity", "self_actualisation"),
    "Joy": ("joy", "activation", "belonging"),
    "Anger": ("anger", "agency", "clarity"),
    "Emotional Numbing": ("numbing", "clarity", "connection"),
    "Shame": ("shame", "psychological_safety", "self_actualisation"),
    "Loneliness": ("loneliness", "connection", "belonging"),
    "Anxiety": ("anxiety", "calm", "psychological_safety"),
}


def normalise(text: Any) -> str:
    return str(text or "").casefold()


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
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        return [part.strip() for part in re.split(r"[,|]", stripped) if part.strip()]
    return [value]


def clean_keyword(keyword: str) -> str:
    return keyword.replace("_", " ").casefold()


def phrase_count(text: str, phrase: str) -> int:
    escaped = re.escape(clean_keyword(phrase))
    return len(re.findall(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", text))


def score_from_weight(weight: float) -> float:
    if weight <= 0:
        return 0.0
    return round(1.0 - math.exp(-weight / 2.8), 3)


def collect_prose(row: Mapping[str, Any]) -> Tuple[str, Dict[str, str]]:
    field_texts: Dict[str, str] = {}
    weighted_chunks: List[str] = []
    for field in PROSE_FIELDS:
        value = row.get(field)
        if value is None or value == "":
            continue
        if isinstance(value, list):
            text = ", ".join(str(item) for item in value)
        else:
            text = str(value)
        field_texts[field] = text
        if field in CONTRAINDICATION_FIELDS:
            continue
        weight = TEXT_WEIGHT_BY_FIELD.get(field, 1.0)
        weighted_chunks.extend([text] * max(1, round(weight)))
    return "\n".join(weighted_chunks), field_texts


def extract_matches(text: str) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
    lowered = normalise(text)
    raw_weights: Dict[str, float] = {}
    matches: Dict[str, List[str]] = {}
    for semantic, phrases in SEMANTIC_LEXICON.items():
        total = 0.0
        seen: List[str] = []
        for phrase in phrases:
            count = phrase_count(lowered, phrase)
            if count:
                total += count * (1.25 if " " in phrase else 1.0)
                seen.append(phrase)
        if total:
            raw_weights[semantic] = total
            matches[semantic] = seen[:8]
    return {key: score_from_weight(value) for key, value in raw_weights.items()}, matches


def numeric_semantic_scores(row: Mapping[str, Any]) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    for need, semantic in NEED_TO_SEMANTIC.items():
        value = row.get(need)
        if isinstance(value, (int, float)):
            scores[semantic] = max(scores.get(semantic, 0.0), float(value))
    return {key: round(max(0.0, min(1.0, value)), 3) for key, value in scores.items()}


def merge_scores(*score_maps: Mapping[str, float]) -> Dict[str, float]:
    merged: Dict[str, float] = {}
    for score_map in score_maps:
        for key, value in score_map.items():
            merged[key] = round(max(merged.get(key, 0.0), max(0.0, min(1.0, value))), 3)
    return dict(sorted(merged.items(), key=lambda item: (-item[1], item[0])))


def group_scores(semantic_scores: Mapping[str, float]) -> Dict[str, float]:
    groups: Dict[str, float] = {}
    for group, semantics in THEME_GROUPS.items():
        values = [semantic_scores.get(semantic, 0.0) for semantic in semantics]
        groups[group] = round(sum(values) / len(values), 3) if values else 0.0
    return groups


def tags_above(scores: Mapping[str, float], threshold: float = 0.42, limit: int = 12) -> List[str]:
    return [key for key, value in sorted(scores.items(), key=lambda item: (-item[1], item[0])) if value >= threshold][:limit]


def risk_markers(row: Mapping[str, Any], semantic_scores: Mapping[str, float], field_texts: Mapping[str, str]) -> List[str]:
    markers: List[str] = []
    contraindications = normalise(" ".join(
        field_texts.get(field, "") for field in CONTRAINDICATION_FIELDS
    ))
    if row.get("Memory Zone") in {"Amber", "Red"}:
        markers.append(f"memory_zone_{str(row.get('Memory Zone')).lower()}")
    if row.get("Youth Safety") in {"Review", "Caution"}:
        markers.append(f"youth_safety_{str(row.get('Youth Safety')).lower()}")
    if semantic_scores.get("trauma_caution", 0.0) >= 0.3:
        markers.append("trauma_or_crisis_caution")
    if semantic_scores.get("sensuality", 0.0) >= 0.3:
        markers.append("sensuality_or_body_exposure")
    if semantic_scores.get("sensory_intensity", 0.0) >= 0.3:
        markers.append("sensory_intensity")
    if any(phrase in contraindications for phrase in (
        "avoid acute distress",
        "acute distress",
        "acute crisis",
        "panic activation",
        "marked dissociation",
    )):
        markers.append("avoid_acute_distress")
    if any(phrase in contraindications for phrase in (
        "sensory overload",
        "overstimulated",
        "sensory intensity",
        "startle reactivity",
        "rapid visuals",
    )):
        markers.append("sensory_intensity")
    if any(phrase in contraindications for phrase in (
        "needs down-regulation",
        "quiet containment",
        "low-density containment",
        "low density containment",
    )):
        markers.append("needs_down_regulation_caution")
    return list(dict.fromkeys(markers))


def avoid_when(markers: Sequence[str], row: Mapping[str, Any], semantic_scores: Mapping[str, float]) -> List[str]:
    avoid: List[str] = []
    if "avoid_acute_distress" in markers or semantic_scores.get("trauma_caution", 0.0) >= 0.3:
        avoid.append("acute_distress")
    if row.get("Youth Safety") == "Caution":
        avoid.append("younger_youth_or_unreviewed_context")
    if "sensory_intensity" in markers or semantic_scores.get("sensory_intensity", 0.0) >= 0.55:
        avoid.append("sensory_overstimulation")
    if "needs_down_regulation_caution" in markers or (
        semantic_scores.get("activation", 0.0) >= 0.6 and semantic_scores.get("calm", 0.0) < 0.35
    ):
        avoid.append("needs_down_regulation")
    if semantic_scores.get("heartbreak", 0.0) >= 0.45:
        avoid.append("fresh_romantic_wound")
    return list(dict.fromkeys(avoid))


def supportive_for(row: Mapping[str, Any], semantic_scores: Mapping[str, float]) -> List[str]:
    support = Counter()
    for need in as_list(row.get("Top 4 Needs")):
        support[str(need)] += 4
        for semantic in SUPPORTIVE_SEMANTICS.get(str(need), ()):
            if semantic_scores.get(semantic, 0.0) >= 0.35:
                support[str(need)] += 1
    for need, semantic in NEED_TO_SEMANTIC.items():
        if semantic_scores.get(semantic, 0.0) >= 0.68:
            support[need] += 1
    return [need for need, _count in support.most_common(10)]


def archetype(row: Mapping[str, Any], semantic_scores: Mapping[str, float]) -> str:
    why = normalise(row.get("Why This Track"))
    match = re.search(r"role:\s*([^.\n]+)", why, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip().title()
    if semantic_scores.get("shadow", 0.0) >= 0.55:
        return "Shadow Integration"
    if semantic_scores.get("calm", 0.0) >= 0.55:
        return "Regulation"
    if semantic_scores.get("agency", 0.0) >= 0.55:
        return "Agency"
    if semantic_scores.get("belonging", 0.0) >= 0.55:
        return "Collective Belonging"
    return str(row.get("Primary Environmental Function") or "Unknown")


def movement_quality(row: Mapping[str, Any], semantic_scores: Mapping[str, float]) -> List[str]:
    qualities: List[str] = []
    if semantic_scores.get("groundedness", 0.0) >= 0.35:
        qualities.append("grounded")
    if semantic_scores.get("activation", 0.0) >= 0.45:
        qualities.append("activated")
    if semantic_scores.get("calm", 0.0) >= 0.45:
        qualities.append("down-regulating")
    if semantic_scores.get("connection", 0.0) >= 0.42 or semantic_scores.get("belonging", 0.0) >= 0.42:
        qualities.append("socially held")
    if semantic_scores.get("curiosity", 0.0) >= 0.45:
        qualities.append("exploratory")
    if not qualities:
        qualities.append(str(row.get("Primary Environmental Function") or "ambient").casefold())
    return qualities


def compile_track(track: Mapping[str, Any]) -> Dict[str, Any]:
    row = (track.get("notion_export") or {}).get("row") if isinstance(track.get("notion_export"), Mapping) else None
    if not isinstance(row, Mapping):
        row = {}
    prose, field_texts = collect_prose(row)
    text_scores, matches = extract_matches(prose)
    numeric_scores = numeric_semantic_scores(row)
    semantic_scores = merge_scores(text_scores, numeric_scores)
    groups = group_scores(semantic_scores)
    risks = risk_markers(row, semantic_scores, field_texts)
    return {
        "version": SEMANTIC_COMPILER_VERSION,
        "compiled_at": datetime.now(timezone.utc).isoformat(),
        "source": "notion_export.row",
        "prose_fields_used": sorted(field_texts.keys()),
        "themes": tags_above(semantic_scores, threshold=0.45, limit=16),
        "movement_quality": movement_quality(row, semantic_scores),
        "risk_markers": risks,
        "supportive_for": supportive_for(row, semantic_scores),
        "avoid_when": avoid_when(risks, row, semantic_scores),
        "archetype": archetype(row, semantic_scores),
        "primary_environmental_function": row.get("Primary Environmental Function"),
        "primary_memory_type": row.get("Primary Memory Type"),
        "memory_zone": row.get("Memory Zone"),
        "youth_safety": row.get("Youth Safety"),
        "semantic_scores": semantic_scores,
        "semantic_group_scores": groups,
        "lexicon_matches": matches,
    }


def compile_catalogue(path: Path, dry_run: bool = False) -> Dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    tracks = data.get("tracks", [])
    if not isinstance(tracks, list):
        raise ValueError("Catalogue must contain a tracks array.")
    for track in tracks:
        track["semantic_compiler"] = compile_track(track)
    data["semantic_compiler"] = {
        "version": SEMANTIC_COMPILER_VERSION,
        "compiled_at": datetime.now(timezone.utc).isoformat(),
        "track_count": len(tracks),
        "source": "track.notion_export.row natural-language fields plus numeric need scores",
        "runtime_policy": "Compiled semantics may influence deterministic scoring; runtime GPT must not reinterpret prose for song matching.",
    }
    if not dry_run:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Compile Notion prose fields into deterministic song semantics.")
    parser.add_argument("--catalogue", default=str(DEFAULT_CATALOGUE_PATH))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    path = Path(args.catalogue)
    data = compile_catalogue(path, dry_run=args.dry_run)
    tracks = data.get("tracks", [])
    print(f"compiled {len(tracks)} tracks with {SEMANTIC_COMPILER_VERSION}")
    for track in tracks[:5]:
        compiled = track.get("semantic_compiler", {})
        print(f"- {track.get('artist')} - {track.get('title')}: {', '.join(compiled.get('themes', [])[:8])}")


if __name__ == "__main__":
    main()
