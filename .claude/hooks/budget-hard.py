#!/usr/bin/env python3
# budget-hard.py
# PreToolUse-Hook: harte Budget-Schwelle.
# Blockiert schreibende Werkzeuge, damit kein externer Stopp mitten in
# einer halb geschriebenen Datei erfolgt.
# Created: 2026-07-21, 00:00 - Initiale Fassung

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from budget_common import (  # noqa: E402
    HARD_THRESHOLD,
    is_always_writable,
    read_event,
    read_usage,
)


def main():
    event = read_event()
    percent, resets_at = read_usage()

    if percent is None or percent < HARD_THRESHOLD:
        sys.exit(0)

    # PROGRESS.md und DECISIONS.md bleiben immer schreibbar. Sonst würde
    # die Bremse verhindern, dass die Session ihren Zustand sichert.
    tool_input = event.get("tool_input") or {}
    path = tool_input.get("file_path") or tool_input.get("notebook_path")
    if is_always_writable(path):
        sys.exit(0)

    reset_note = f" Erneuerung um {resets_at}." if resets_at else ""

    sys.stderr.write(
        f"BUDGET-SPERRE: Token-Kontingent zu {percent:.0f}% verbraucht.{reset_note}\n"
        "Schreibende Werkzeuge sind ab jetzt gesperrt — mit Ausnahme von "
        "PROGRESS.md und DECISIONS.md.\n\n"
        "Schreibe den aktuellen Stand nach PROGRESS.md, committe mit Bash, "
        "und beende die Session. Versuche nicht, diese Sperre zu umgehen, "
        "etwa durch Schreiben über Bash-Umleitungen.\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
