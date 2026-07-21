#!/usr/bin/env python3
# budget-soft.py
# PostToolUse-Hook: weiche Budget-Schwelle.
# Blendet EINMAL pro Session eine Aufforderung zum geordneten Abschluss ein.
# Created: 2026-07-21, 00:00 - Initiale Fassung

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from budget_common import SOFT_THRESHOLD, read_event, read_usage  # noqa: E402


def main():
    event = read_event()
    percent, resets_at = read_usage()

    if percent is None or percent < SOFT_THRESHOLD:
        sys.exit(0)

    # Nur einmal pro Session melden. Ohne diese Sperre würde die Warnung
    # nach jedem einzelnen Werkzeugaufruf erneut in den Kontext geschrieben
    # und dort mehr Tokens verbrauchen, als sie einspart.
    session_id = event.get("session_id", "unknown")
    marker = Path(os.environ.get("TMPDIR", "/tmp")) / f"claude-budget-soft-{session_id}"
    if marker.exists():
        sys.exit(0)
    try:
        marker.touch()
    except OSError:
        pass

    reset_note = f" Das Kontingent erneuert sich um {resets_at}." if resets_at else ""

    message = (
        f"BUDGET-WARNUNG: Das Token-Kontingent des laufenden 5-Stunden-Blocks "
        f"ist zu {percent:.0f}% verbraucht.{reset_note}\n\n"
        "Beginne jetzt KEIN neues Arbeitspaket. Gehe stattdessen so vor:\n"
        "1. Bringe das aktuelle Arbeitspaket in einen konsistenten Zustand — "
        "lieber unfertig und lauffähig als vollständig und kaputt.\n"
        "2. Aktualisiere PROGRESS.md: erledigte Pakete, laufendes Paket mit "
        "genauem Stand, nächster Schritt.\n"
        "3. Trage offene Entscheidungen in DECISIONS.md ein.\n"
        "4. Committe alles mit einer aussagekräftigen Nachricht.\n"
        "5. Beende die Session mit einem kurzen Statusbericht.\n\n"
        "Die Arbeit wird nach der Kontingenterneuerung fortgesetzt. "
        "Der Zustand in PROGRESS.md ist die einzige Übergabe."
    )

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": message,
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    main()
