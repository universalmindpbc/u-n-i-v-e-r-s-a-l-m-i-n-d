#!/usr/bin/env python3
"""Offline benchmark harness for GPT-shadow vs deterministic selector outputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Mapping, Optional

from selector_core import select_from_file


def load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def compare_outputs(selector_output: Mapping[str, Any], gpt_output: Optional[Mapping[str, Any]]) -> Dict[str, Any]:
    if not gpt_output:
        return {
            "gpt_shadow_available": False,
            "selector_track": selector_output.get("selected_track_id"),
            "match": None,
            "notes": "No GPT shadow output supplied. This fixture only verifies deterministic selection.",
        }

    return {
        "gpt_shadow_available": True,
        "selector_track": selector_output.get("selected_track_id"),
        "gpt_track": gpt_output.get("selected_track_id"),
        "match": selector_output.get("selected_track_id") == gpt_output.get("selected_track_id"),
        "selector_radio_handoff": selector_output.get("radio_handoff", {}).get("station"),
        "gpt_radio_handoff": gpt_output.get("radio_handoff", {}).get("station"),
        "selector_support_card_required": selector_output.get("safety", {}).get("support_card_required"),
        "gpt_support_card_required": gpt_output.get("safety", {}).get("support_card_required"),
        "selector_human_review_required": selector_output.get("audit", {}).get("human_review_required"),
        "gpt_human_review_required": gpt_output.get("audit", {}).get("human_review_required"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare deterministic selector output against optional GPT shadow output.")
    parser.add_argument("fixture", help="Path to v4.44 payload JSON fixture.")
    parser.add_argument("--gpt-shadow", help="Optional GPT shadow recommendation JSON for the same fixture.")
    parser.add_argument("--catalogue", default=str(Path(__file__).resolve().parent / "adaptive-music-video-catalogue-v1.11.json"))
    args = parser.parse_args()

    fixture = load_json(Path(args.fixture))
    gpt_shadow = load_json(Path(args.gpt_shadow)) if args.gpt_shadow else None
    selector_output = select_from_file(fixture.get("v444_payload", fixture), Path(args.catalogue))

    print(json.dumps({
        "schema_version": "adaptive_music_video_selector_benchmark_v1.11",
        "fixture": args.fixture,
        "comparison": compare_outputs(selector_output, gpt_shadow),
        "selector_output": selector_output,
        "gpt_shadow_output": gpt_shadow,
    }, indent=2))


if __name__ == "__main__":
    main()
