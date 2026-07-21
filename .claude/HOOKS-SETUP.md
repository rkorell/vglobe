# Hook-Setup: Budget-Bremse und Session-Kontinuität

Stand: 2026-07-21

Dieses Dokument beschreibt die Installation der Budget-Hooks im Projekt
`vglobe` und die Verdrahtung mit der bestehenden Claude-Code-Statuszeile.

## Was wurde wo installiert

| Datei | Zweck |
|---|---|
| `/home/pi/vglobe/.claude/settings.json` | Hook-Registrierung (SessionStart, PostToolUse, PreToolUse) auf Projektebene |
| `/home/pi/vglobe/.claude/hooks/budget_common.py` | Gemeinsame Logik, liest `~/.claude/usage-block.json` |
| `/home/pi/vglobe/.claude/hooks/budget-soft.py` | PostToolUse-Hook, warnt einmalig ab 78 % |
| `/home/pi/vglobe/.claude/hooks/budget-hard.py` | PreToolUse-Hook, sperrt Schreibwerkzeuge ab 90 % (Ausnahme: `PROGRESS.md`, `DECISIONS.md`) |
| `/home/pi/vglobe/.claude/hooks/session-context.py` | SessionStart-Hook, blendet Projektzustand ein |
| `/home/pi/vglobe/README.md` | Bundle-Beschreibung |

Alle Hook-Skripte sind ausführbar (`chmod +x`).

Die Budget-Hooks berechnen den Verbrauch **nicht selbst**. Sie lesen ihn aus
der Cache-Datei `~/.claude/usage-block.json`. Diese wird von der Statuszeile
geschrieben (siehe unten). Fehlt die Datei, ist sie unlesbar oder älter als
`CLAUDE_BUDGET_MAX_AGE` Sekunden, wird **nicht** gebremst.

## Geänderte Statuszeile

- **Geänderte Datei:** `/home/pi/.claude/statusline-command.sh` (Bash)
- **Sicherung:** `/home/pi/.claude/statusline-command.sh.bak-2026-07-21`

Die Statuszeile berechnet den 5-Stunden-Verbrauch bereits (`rate_pct` aus
`.rate_limits.five_hour.used_percentage`, `rate_reset` aus
`.rate_limits.five_hour.resets_at` als Unix-Epoch). Eingefügt wurde ein rein
**additiver**, gekapselter, atomarer Schreibvorgang der Cache-Datei zwischen
der 5h-Berechnung und der Ausgabe. Die bestehende Berechnung und die Ausgabe
wurden **nicht** verändert (bit-identisch verifiziert).

### Eingefügte Codepassage (Wortlaut)

```bash
# --- Budget-Cache für Budget-Hooks (additiv, darf fehlschlagen) ---
# Schreibt den 5h-Verbrauch nach ~/.claude/usage-block.json, damit die
# Budget-Hooks den Wert lesen statt ihn selbst zu berechnen. Gekapselt:
# schlaegt dieser Block fehl, laeuft die Statuszeile unveraendert weiter.
if [ -n "$rate_pct" ]; then
    _cache="${CLAUDE_USAGE_CACHE:-$HOME/.claude/usage-block.json}"
    _updated=$(date -u +'%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)
    _resets=""
    if [ -n "$rate_reset" ]; then
        _resets=$(date -u -d "@$rate_reset" +'%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)
    fi
    {
        _tmp="${_cache}.tmp.$$"
        if [ -n "$_resets" ]; then
            printf '{"percent": %s, "resets_at": "%s", "updated_at": "%s"}\n' \
                "$rate_pct" "$_resets" "$_updated" > "$_tmp" \
                && mv -f "$_tmp" "$_cache"
        else
            printf '{"percent": %s, "updated_at": "%s"}\n' \
                "$rate_pct" "$_updated" > "$_tmp" \
                && mv -f "$_tmp" "$_cache"
        fi
    } 2>/dev/null || true
fi
# --- Ende Budget-Cache ---
```

Einfügeort: unmittelbar nach dem `fi` des 5h-Blocks
(`if [ -n "$rate_pct" ]; then … fi`) und vor `# Effort-Level`.

Eigenschaften:
- **Darf fehlschlagen:** der gesamte Block ist in `{ … } 2>/dev/null || true`
  gekapselt; kein `set -e`, kein ungefangener Fehler. Schlägt er fehl, läuft
  die Statuszeile unverändert weiter.
- **Atomar:** erst in `*.tmp.$$` schreiben, dann `mv -f`. Ein Hook liest nie
  eine halb geschriebene Datei.
- **Kein Eingriff in die Anzeige:** die vorhandenen Variablen werden nur
  gelesen, nicht verändert.

## Cache-Format

```json
{
  "percent": 62.4,
  "resets_at": "2026-07-21T18:00:00Z",
  "updated_at": "2026-07-21T14:12:03Z"
}
```

- `percent` — Verbrauch im 5-Stunden-Block, 0–100 (Pflicht).
- `updated_at` — ISO-8601 UTC, für die Staleness-Prüfung (Pflicht).
- `resets_at` — ISO-8601 UTC, optional, wird nur in Meldungstexten angezeigt.

## Schwellwerte und Umgebungsvariablen

Alle Werte sind über Umgebungsvariablen überschreibbar (Default in Klammern):

| Variable | Wirkung | Default |
|---|---|---|
| `CLAUDE_BUDGET_SOFT` | weiche Schwelle (%), ab der `budget-soft.py` einmalig warnt | `78` |
| `CLAUDE_BUDGET_HARD` | harte Schwelle (%), ab der `budget-hard.py` Schreibwerkzeuge sperrt | `90` |
| `CLAUDE_BUDGET_MAX_AGE` | maximales Alter der Cache-Datei in Sekunden; ältere Einträge gelten als unbrauchbar | `600` |
| `CLAUDE_USAGE_CACHE` | Pfad der Cache-Datei (von Hooks **und** Statuszeile respektiert) | `~/.claude/usage-block.json` |

Setzen z. B. in der Shell, aus der Claude Code gestartet wird:

```bash
export CLAUDE_BUDGET_SOFT=70
export CLAUDE_BUDGET_HARD=88
```

## Ausnahmen bei der harten Sperre

Auch oberhalb der harten Schwelle bleiben schreibbar: `PROGRESS.md` und
`DECISIONS.md` (in `budget_common.py`, Konstante `ALWAYS_WRITABLE`). Ohne
diese Ausnahme könnte die Session ihren eigenen Zustand nicht mehr sichern.

## Rückbau in drei Schritten

1. **Hooks deregistrieren:** `/home/pi/vglobe/.claude/settings.json` löschen
   oder den `hooks`-Block daraus entfernen. Die Skripte unter
   `/home/pi/vglobe/.claude/hooks/` können liegen bleiben (ohne Registrierung
   wirkungslos) oder ebenfalls entfernt werden.
2. **Statuszeile zurücksetzen:** Original wiederherstellen:
   `cp /home/pi/.claude/statusline-command.sh.bak-2026-07-21 /home/pi/.claude/statusline-command.sh`
   (oder den Block zwischen `# --- Budget-Cache …` und `# --- Ende Budget-Cache ---`
   entfernen).
3. **Cache aufräumen (optional):** `rm -f ~/.claude/usage-block.json`.

Danach ist der Ursprungszustand wiederhergestellt; die Statuszeile arbeitet
wie zuvor.
