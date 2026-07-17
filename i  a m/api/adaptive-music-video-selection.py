#!/usr/bin/env python3
import json
import os
import sys

SITE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SITE_ROOT)

from selector_core import select_from_file


def respond(status, payload):
    print(f"Status: {status}")
    print("Content-Type: application/json; charset=utf-8")
    print("Cache-Control: no-store")
    print()
    print(json.dumps(payload, ensure_ascii=True, separators=(",", ":")))


if os.environ.get("REQUEST_METHOD") != "POST":
    respond("405 Method Not Allowed", {"error": "Method not allowed."})
    raise SystemExit

try:
    content_length = int(os.environ.get("CONTENT_LENGTH") or "0")
    request = json.loads(sys.stdin.read(content_length))
    inference = request.get("v444_payload") or request.get("inference") or request
    engagement = request.get("engagement_signals")
    if not isinstance(inference, dict):
        raise ValueError("A v4.44 inference payload is required.")
    selection = select_from_file(inference, engagement_signals=engagement)
    respond("200 OK", selection)
except (ValueError, json.JSONDecodeError) as error:
    respond("400 Bad Request", {"error": str(error)})
except Exception as error:
    respond("500 Internal Server Error", {
        "error": "The adaptive music selector failed.",
        "selector_detail": f"{type(error).__name__}: {error}",
    })
