# PROGRESS.md — Globe (vglobe)

Stand: 2026-07-22

## Status der Arbeitspakete

| AP | Titel | Status |
|---|---|---|
| AP-01 | Projektgerüst & Vendor | Erledigt |
| AP-02 | Datenschicht Solar | Erledigt |
| AP-03 | Datenschicht Dämmerung | Erledigt |
| AP-04 | Assets & Küstenlinien | Erledigt |
| AP-05 | Präsentation Globus | Erledigt |
| AP-06 | UI & Orchestrierung | Erledigt |
| AP-07 | Qualitätssicherung & DoD | Erledigt |
| AP-08 | Dokumentation | Erledigt |

## Notizen

- 2026-07-22: Erststart. DECISIONS.md und PROGRESS.md angelegt.
- 2026-07-22: AP-01 erledigt — Struktur, three.js r178 unter vendor/, serve.py, Hook-Doku nach docs/HOOKS.md, neue README.
- 2026-07-22: AP-02/AP-03 erledigt — solar.mjs (NOAA), config.mjs, twilight.mjs; 13 Tests grün (Deklination, Zeitgleichung, subsolare Länge, nightFactor).
- 2026-07-22: AP-04 erledigt — earth_4k.jpg (Blue Marble 4096×2048), coastlines_50m.json (Natural Earth 1:50m, 1429 Linien/60416 Punkte), coastlines.mjs, Tests 20/20 grün. Logo folgt in AP-06.
- 2026-07-22: AP-05/AP-06 erledigt — Szene/Kamera (FA-4), Globus- und Küstenlinien-Shader (2 ShaderMaterials), freie Quaternion-Rotation, Zoom, UI-Dashboard im Korell-Design (Logo/Farbschema von WebServer:/var/www/html/galerist/app/static/), Zeitsteuerung, Fehler-Overlay.
- 2026-07-22: AP-07 laufend — tools/check_dod.sh: alle maschinellen Prüfungen bestanden; visuelle Prüfung per Headless-Chromium läuft.
- 2026-07-22: Nachbesserungen aus visueller Prüfung — three.core.js nachgeladen (Ladehänger behoben), sRGB-Ausgabe in beiden Shadern, Terminator-Doppelkante behoben (Smoothstep + Mischung im sRGB-Raum), Nachthelligkeit korrekt, parallel-Laden der Assets.
- 2026-07-22: Erweiterungen auf Nutzerwunsch — Ländergrenzen (Natural Earth admin_0) ins Asset gemischt (kinds-Kennung, ein Linien-Material, zwei Grautöne), Checkbox Küstenlinien/Grenzen, Erdtextur auf Blue Marble Topography+Bathymetry (Juli) umgestellt.
- 2026-07-22: AP-07/AP-08 erledigt — Fehlerpfad-Test im DoD-Skript, README (Bedienung/Tests/Asset-Aufbereitung) und DECISIONS finalisiert. 22 Tests grün, alle DoD-Prüfungen bestanden.

Stand: 2026-07-22
