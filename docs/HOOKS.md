# Hook-Bundle: Budget-Bremse und Session-Kontinuität

Drei Hooks, die verhindern, dass eine autark laufende Claude-Code-Session
beim Erschöpfen des 5-Stunden-Kontingents mitten in einer Datei abbricht.

## Grundgedanke

Das Modell kann seinen eigenen Tokenverbrauch nicht einsehen. Eine Anweisung
im Prompt („stoppe bei 80%") führt deshalb zu geraten­er Einhaltung. Die
Schwelle muss von außen kommen.

Die Aufgabenteilung:

| Hook | Ereignis | Wirkung |
|---|---|---|
| `budget-soft.py` | `PostToolUse` | Ab ~78%: blendet einmalig die Aufforderung zum geordneten Abschluss in den Kontext ein. Kein Abbruch. |
| `budget-hard.py` | `PreToolUse` (Schreibwerkzeuge) | Ab ~90%: blockiert Schreibzugriffe. `PROGRESS.md` und `DECISIONS.md` bleiben ausgenommen. |
| `session-context.py` | `SessionStart` | Injiziert Branch, letzte Commits, `git status` und `PROGRESS.md` in den Kontext der neuen Session. |

Bewusst **kein** `Stop`-Hook: ein Stop-Hook, der blockiert, kann die Session
in eine Endlosschleife schicken.

## Installation

```bash
cp -r .claude <PROJEKTWURZEL>/
chmod +x <PROJEKTWURZEL>/.claude/hooks/*.py
```

Prüfen mit `/hooks` in Claude Code, ob alle drei registriert sind.

## Der eine Punkt, der noch anzupassen ist

Die Hooks berechnen den Verbrauch **nicht selbst**. Sie lesen ihn aus einer
Cache-Datei, die von deinem bestehenden Statuszeilen-Skript geschrieben wird.
So gibt es genau eine Stelle, an der gerechnet wird, und die Hooks müssen das
Transcript-Format nicht kennen.

Erwartet wird `~/.claude/usage-block.json`:

```json
{
  "percent": 62.4,
  "resets_at": "2026-07-21T18:00:00Z",
  "updated_at": "2026-07-21T14:12:03Z"
}
```

- `percent` — Verbrauch im laufenden 5-Stunden-Block, 0–100. Pflicht.
- `updated_at` — ISO-8601 UTC. Pflicht, dient der Staleness-Prüfung.
- `resets_at` — optional, wird nur in den Meldungstexten angezeigt.

In deinem Statuszeilen-Skript genügt am Ende ein Schreibvorgang mit den
Werten, die du ohnehin schon berechnest.

**Verhalten bei fehlenden Daten:** Fehlt die Datei, ist sie unlesbar oder
älter als 10 Minuten, greift keine der beiden Bremsen. Ein defekter Hook darf
die Session nicht blockieren — der Preis dafür ist, dass ein defektes
Statuszeilen-Skript die Bremse still deaktiviert. Nach dem Einrichten also
einmal prüfen, dass die Datei tatsächlich aktualisiert wird.

## Schwellwerte anpassen

Über Umgebungsvariablen, ohne die Skripte zu ändern:

| Variable | Standard | Bedeutung |
|---|---|---|
| `CLAUDE_BUDGET_SOFT` | `78` | Prozent, ab denen gewarnt wird |
| `CLAUDE_BUDGET_HARD` | `90` | Prozent, ab denen Schreibzugriffe gesperrt werden |
| `CLAUDE_BUDGET_MAX_AGE` | `600` | Sekunden, ab denen der Cache als veraltet gilt |
| `CLAUDE_USAGE_CACHE` | `~/.claude/usage-block.json` | Pfad der Cache-Datei |

Die Lücke zwischen weicher und harter Schwelle ist der Puffer für den
geordneten Abschluss. 12 Prozentpunkte sind ein Startwert — wenn die Session
den Abschluss regelmäßig nicht schafft, weiche Schwelle senken statt harte
anheben.

## Test ohne echten Verbrauch

```bash
# Weiche Schwelle simulieren
cat > ~/.claude/usage-block.json <<EOF
{"percent": 80, "resets_at": "2026-07-21T18:00:00Z",
 "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF

# Harte Schwelle simulieren: percent auf 95 setzen und einen Edit versuchen.
# Erwartung: Edit wird abgelehnt, Schreiben von PROGRESS.md geht durch.

# Einzelnen Hook direkt prüfen
echo '{"session_id":"test","cwd":"'$PWD'","source":"startup"}' \
  | .claude/hooks/session-context.py
```

Danach `~/.claude/usage-block.json` wieder löschen oder vom Statuszeilen-Skript
überschreiben lassen.

## Bekannte Grenze

`budget-hard.py` hängt an `PreToolUse` mit Matcher auf die Schreibwerkzeuge.
Ein Schreibvorgang über eine Bash-Umleitung (`cat > datei`) läuft daran vorbei.
Der Hinweistext weist das Modell ausdrücklich darauf hin, das nicht zu tun;
wer es dicht haben will, ergänzt einen zweiten Matcher auf `Bash` mit einer
Prüfung des Kommandos.
