#!/usr/bin/env python3
# session-context.py
# SessionStart-Hook: injiziert den Projektzustand in den Kontext.
# stdout dieses Skripts wird von Claude Code als Kontext übernommen.
# Created: 2026-07-21, 00:00 - Initiale Fassung

import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from budget_common import read_event, read_usage  # noqa: E402

MAX_PROGRESS_CHARS = 4000


def run(cmd, cwd):
    try:
        out = subprocess.run(
            cmd, cwd=cwd, capture_output=True, text=True, timeout=10,
        )
        return out.stdout.strip()
    except Exception:
        return ""


def main():
    event = read_event()
    cwd = event.get("cwd") or os.getcwd()
    source = event.get("source", "unknown")

    lines = ["## Projektzustand beim Sessionstart", ""]
    lines.append(f"Auslöser: {source}")

    percent, resets_at = read_usage()
    if percent is not None:
        note = f"Token-Block aktuell zu {percent:.0f}% verbraucht"
        if resets_at:
            note += f", Erneuerung um {resets_at}"
        lines.append(note + ".")
    lines.append("")

    branch = run(["git", "branch", "--show-current"], cwd)
    if branch:
        lines += [f"Branch: {branch}", ""]

    log = run(["git", "log", "--oneline", "-5"], cwd)
    if log:
        lines += ["### Letzte Commits", "```", log, "```", ""]

    status = run(["git", "status", "--short"], cwd)
    if status:
        lines += [
            "### Nicht committete Änderungen",
            "```", status, "```",
            "",
            "Achtung: Die letzte Session hat den Baum nicht sauber "
            "hinterlassen. Prüfe diese Dateien, bevor du weiterarbeitest.",
            "",
        ]
    else:
        lines += ["Arbeitsverzeichnis ist sauber.", ""]

    progress = Path(cwd) / "PROGRESS.md"
    if progress.exists():
        try:
            text = progress.read_text(encoding="utf-8")
        except OSError:
            text = ""
        if len(text) > MAX_PROGRESS_CHARS:
            text = text[-MAX_PROGRESS_CHARS:]
            lines.append("### PROGRESS.md (gekürzt, letzter Abschnitt)")
        else:
            lines.append("### PROGRESS.md")
        lines += ["", text, ""]
        lines.append(
            "Dies ist eine FORTSETZUNG. Führe keine Neuplanung durch. "
            "Setze bei dem in PROGRESS.md genannten nächsten Schritt an."
        )
    else:
        lines.append(
            "Kein PROGRESS.md vorhanden — das ist ein Neustart des Projekts."
        )

    print("\n".join(lines))
    sys.exit(0)


if __name__ == "__main__":
    main()
