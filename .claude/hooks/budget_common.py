#!/usr/bin/env python3
# budget_common.py
# Gemeinsame Logik für die Budget-Hooks.
# Created: 2026-07-21, 00:00 - Initiale Fassung

"""
Vertrag mit der Statuszeile
---------------------------
Dieses Modul liest NICHT selbst die Transcript-Dateien aus. Stattdessen
schreibt das bereits vorhandene Statuszeilen-Skript den aktuellen Stand
in eine kleine Cache-Datei. Damit gibt es genau eine Stelle, an der der
Verbrauch berechnet wird.

Erwartetes Format von ~/.claude/usage-block.json:

    {
      "percent": 62.4,                       // Verbrauch im laufenden
                                             // 5-Stunden-Block, 0..100
      "resets_at": "2026-07-21T18:00:00Z",   // optional, nur zur Anzeige
      "updated_at": "2026-07-21T14:12:03Z"   // Pflicht, für Staleness-Prüfung
    }

Grundsatz: Bei fehlender, unlesbarer oder veralteter Cache-Datei wird
NICHT gebremst. Ein kaputter Hook darf die Session nicht blockieren.
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

CACHE_PATH = Path(os.environ.get(
    "CLAUDE_USAGE_CACHE",
    Path.home() / ".claude" / "usage-block.json",
))

# Ab hier wird die Session zum geordneten Abschluss aufgefordert.
SOFT_THRESHOLD = float(os.environ.get("CLAUDE_BUDGET_SOFT", "78"))

# Ab hier werden schreibende Werkzeuge blockiert.
HARD_THRESHOLD = float(os.environ.get("CLAUDE_BUDGET_HARD", "90"))

# Cache-Einträge, die älter sind, gelten als unbrauchbar.
MAX_CACHE_AGE_SECONDS = int(os.environ.get("CLAUDE_BUDGET_MAX_AGE", "600"))

# Dateien, die auch oberhalb der harten Schwelle geschrieben werden dürfen.
# Ohne diese Ausnahme könnte die Session ihren eigenen Zustand nicht mehr
# sichern und der Bremsvorgang würde genau das zerstören, was er schützt.
ALWAYS_WRITABLE = ("PROGRESS.md", "DECISIONS.md")


def read_usage():
    """Liefert (percent, resets_at) oder (None, None), wenn unbekannt."""
    try:
        raw = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None, None

    percent = raw.get("percent")
    if not isinstance(percent, (int, float)):
        return None, None

    updated_at = raw.get("updated_at")
    if isinstance(updated_at, str):
        try:
            stamp = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            age = (datetime.now(timezone.utc) - stamp).total_seconds()
            if age > MAX_CACHE_AGE_SECONDS:
                return None, None
        except ValueError:
            return None, None
    else:
        try:
            if time.time() - CACHE_PATH.stat().st_mtime > MAX_CACHE_AGE_SECONDS:
                return None, None
        except OSError:
            return None, None

    return float(percent), raw.get("resets_at")


def is_always_writable(path):
    if not path:
        return False
    name = os.path.basename(str(path))
    return name in ALWAYS_WRITABLE


def read_event():
    """Liest das Hook-Event von stdin. Bei Fehler ein leeres Dict."""
    import sys
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}
