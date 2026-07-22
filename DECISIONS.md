# DECISIONS.md — Globe (vglobe)

Stand: 2026-07-22

Architektur- und Umsetzungsentscheidungen inkl. Begründung von Abweichungen
gegenüber [Ausgangswerten] der GOAL-Datei.

## Umsetzungsplan (Arbeitspakete)

- **AP-01 — Projektgerüst & Vendor:** Verzeichnisstruktur, `index.html` mit
  Importmap, three.js lokal unter `vendor/`, statischer HTTP-Server mit
  korrektem `.mjs`-MIME-Typ, Hook-README nach `docs/HOOKS.md` verschieben.
- **AP-02 — Datenschicht Solar:** `src/data/config.mjs`, `src/data/solar.mjs`
  (NOAA Solar Position Algorithm inkl. Zeitgleichung),
  `tests/solar.test.mjs` gemäß Definition of Done.
- **AP-03 — Datenschicht Dämmerung:** `src/data/twilight.mjs`
  (`TWILIGHT_MARKS`, `nightFactor()`), Tests auf Monotonie/Stetigkeit in
  `tests/solar.test.mjs`.
- **AP-04 — Assets & Küstenlinien:** Erdtextur (Blue Marble, 4096×2048,
  JPEG) unter `assets/textures/`, Natural-Earth-Küstenlinien aufbereitet
  unter `assets/geodata/`, `src/data/coastlines.mjs`,
  `tests/coastlines.test.mjs`.
- **AP-05 — Präsentation Globus:** `src/view/` — Szene, Kamera,
  Meteosat-Startansicht (FA-4), Kugel-Shader mit Tag/Nacht/Terminator,
  Küstenlinien-Shader, freie Rotation über Pole (FA-2), Zoom (FA-3),
  Resize-Behandlung.
- **AP-06 — UI & Orchestrierung:** `src/main.mjs`, UI-Dashboard im
  Korell-Stil (FA-9, Vorbild: Fleet-Webapps auf dem WebServer),
  Nachthelligkeits-Regler (FA-6), Zeitsteuerung Echtzeit + Regler (FA-8),
  Lade-/Fehlermeldungen.
- **AP-07 — Qualitätssicherung & DoD:** Maschinelle DoD-Prüfungen
  (node --test, HTTP-200-/MIME-Checks, Textsuchen, Fehlerpfad-Test),
  visuelle Prüfung, Performance-Kontrolle (keine Allokationen im
  Render-Loop, exakt 2 Shader-Materialien).
- **AP-08 — Dokumentation:** README.md (App-Beschreibung, Startbefehl,
  Struktur), DECISIONS.md finalisieren.

## Entscheidungen

### E-01 — three.js als Render-Bibliothek (Ausgangswert übernommen)
three.js als ES-Modul-Build lokal unter `vendor/three/`, eingebunden per
`<script type="importmap">`. Kein Build-Schritt, native ES-Module — erfüllt
die harten Invarianten. Es wird nur der Kern-Build verwendet
(`three.module.js`), keine Example-Module.

### E-02 — Eigene Drag-Rotation statt OrbitControls/TrackballControls
FA-2 verlangt freie Rotation über die Pole ohne fixiertes Up-Vektor-Verhalten.
OrbitControls fixiert das Up-Vektor-Verhalten (scheidet aus).
TrackballControls wäre möglich, ist aber ein Example-Modul mit eigenen
Abhängigkeiten. Stattdessen: kompakte eigene Steuerung — Maus-Drag rotiert
die Globus-Gruppe per Quaternion um bildschirmfeste Achsen, Mausrad ändert
ausschließlich den Kameraabstand (FA-3). Weniger Fremdcode, exakt das
geforderte Verhalten.

### E-03 — Terminator im Fragment-Shader
Der Tag/Nacht-Übergang wird pro Fragment aus `sin(Sonnenhöhe) =
dot(Normale, Sonnenrichtung)` berechnet; die Dämmerungsstufen aus
`TWILIGHT_MARKS` gehen als Uniforms in den Shader ein. Die Sonnenrichtung
liefert die Datenschicht als subsolare Koordinaten; die Umrechnung in einen
Richtungsvektor geschieht in der Orchestrierung (`src/main.mjs`). Die
GLSL-Dämmerungskurve spiegelt `nightFactor()` der Datenschicht.

### E-04 — Küstenlinien: Natural Earth 1:50m
Die GOAL-Datei nennt „Natural Earth coastline" ohne Maßstab. 1:110m ist bei
Zoom auf 2 Erdradien sichtbar zu grob; 1:10m unnötig schwer für die
GPU-sparsame Darstellung. 1:50m (~1 MB als aufbereitete Daten) ist der
Kompromiss. Die Rohdaten werden einmalig (Node, Asset-Vorbereitung) in ein
kompaktes JSON-Format überführt; die App lädt nur das aufbereitete Asset.

### E-05 — HTTP-Server: Python http.server mit MIME-Map
Ausgangswert übernommen: `python3 -m http.server` liefert unter Debian 13
`.mjs` bereits als `text/javascript` aus (mimetypes kennt .mjs); zur
Absicherung wird ein kleines Startskript `serve.py` beigelegt, das den
MIME-Typ für `.mjs` explizit registriert. Startbefehl in README.md.

### E-06 — Zeit-Regler
FA-8: Echtzeitmodus (Update 1×/min) plus Regler für beliebigen
UTC-Zeitpunkt. Umsetzung: `input[type="range"]` über ±366 Tage um „jetzt"
in Minutenauflösung plus Schaltfläche „Jetzt" zur Rückkehr in den
Echtzeitmodus. Anzeige über `Date.prototype.toISOString()`.

### E-07 — Hook-README verschoben
Die bestehende README.md dokumentierte das Budget-Hook-Bundle, nicht die
App. Inhalt unverändert nach `docs/HOOKS.md` verschoben; README.md
beschreibt die App (Vorgabe „README.md vollständig gepflegt").

### E-08 — Erdtextur
NASA Blue Marble (world.topo.bathy, Juli), auf 4096×2048 skaliert, JPEG —
Ausgangswert übernommen. Obergrenze 8192×4096 wird in
`src/data/config.mjs` als `maxResolutionWidth/Height` geführt und beim
Laden geprüft.

Stand: 2026-07-22
