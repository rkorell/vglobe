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

## Bedienung

- **Drehen:** Maus ziehen — frei in allen Achsen, auch über die Pole.
- **Zoom:** Mausrad (2–20 Erdradien, Startansicht 6,61 R = Meteosat-Perspektive).
- **Zeit:** Regler für beliebigen UTC-Zeitpunkt, „Jetzt" kehrt in den Echtzeitmodus (Update 1×/min) zurück.
- **Nachtseite:** Helligkeitsregler 3–25 %, Checkbox blendet Küstenlinien/Grenzen ein/aus.

## Tests

```bash
node --test tests/          # 22 Tests: Sonnenstand, Dämmerung, Küstenlinien
tools/check_dod.sh 8000     # maschinelle DoD-Prüfungen (Server muss laufen)
```

## Assets neu aufbereiten (einmalig, nicht zur Laufzeit)

```bash
# Erdtextur: NASA Blue Marble Topography+Bathymetry, auf 4096x2048 skaliert
# (siehe DECISIONS.md E-08 für Quelle)

# Küstenlinien + Ländergrenzen aus Natural Earth 1:50m GeoJSON:
node tools/prepare_coastlines.mjs assets/geodata/coastlines_50m.json \
  0:ne_50m_coastline.geojson 1:ne_50m_admin_0_boundary_lines_land.geojson
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
