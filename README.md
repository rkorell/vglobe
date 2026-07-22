# Globe — 3D-Erdglobus mit astronomisch korrektem Terminator (Stand: 2026-07-22)

(c) Dr. Ralf Korell

Browser-App: frei drehbarer, zoombarer 3D-Globus mit Tag-/Nacht-Grenze
(Terminator) nach dem NOAA-Solar-Position-Algorithmus. Nachtseite bleibt
durch Grundaufhellung und Küstenlinien lesbar.

## Start

```bash
python3 serve.py          # Port 8000
python3 serve.py 8080     # alternativer Port
```

Dann im Browser: `http://localhost:8000/`

`serve.py` registriert den MIME-Typ `text/javascript` für `.mjs` explizit —
Voraussetzung für native ES-Module ohne Build-Schritt.

## Tests

```bash
node --test tests/
```

## Struktur

- `src/data/` — Datenermittlung (Astronomie, Dämmerung, Geodaten, Konfiguration); browserfrei, in Node importierbar
- `src/view/` — Präsentation (Szene, Shader, Controls, DOM); keine Astronomie
- `src/main.mjs` — Orchestrierung, einziger Treffpunkt beider Schichten
- `assets/` — Erdtextur, Küstenliniendaten, Logo
- `vendor/three/` — three.js (lokal, ES-Modul)
- `tests/` — node --test
- `tools/` — einmalige Asset-Vorbereitung (Node, nicht zur Laufzeit)
- `docs/HOOKS.md` — Dokumentation des Budget-Hook-Bundles (Session-Infrastruktur)

Stand: 2026-07-22
