"""Load the packaged reminder catalog and select a complete message at random."""

import json
import random
from functools import lru_cache
from importlib.resources import files


@lru_cache(maxsize=1)
def load_messages() -> tuple[dict, ...]:
    path = files("finance_backend.workers").joinpath("reminder_messages.json")
    entries = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(entries, list) or not entries:
        raise ValueError("Reminder catalog must be a non-empty list")
    ids = set()
    for entry in entries:
        if not isinstance(entry, dict) or type(entry.get("id")) is not int:
            raise ValueError("Each reminder must have an integer ID")
        if entry["id"] in ids:
            raise ValueError("Reminder IDs must be unique")
        ids.add(entry["id"])
        if any(
            not isinstance(entry.get(key), str) or not entry[key].strip()
            for key in ("category", "title", "body")
        ):
            raise ValueError("Each reminder needs category, title and body")
    return tuple(entries)


def daily_message() -> dict:
    # Copy to isolate the persisted selection from the cached catalog.
    return dict(random.choice(load_messages()))
