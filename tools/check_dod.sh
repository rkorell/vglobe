#!/usr/bin/env bash
# (c) Dr. Ralf Korell
# Globe - maschinelle DoD-Pruefungen (Auslieferung & Struktur).
# Aufruf: tools/check_dod.sh [port]   (Server muss laufen, Default 8123)
# Modified: [2026-07-22 22:30] - Erstellt (AP-07)
# Modified: [2026-07-23 00:20] - Fehlerpfad-Test (fehlende Textur) ergaenzt

set -u
cd "$(dirname "$0")/.."
PORT="${1:-8123}"
BASE="http://localhost:${PORT}"
FAIL=0

note() { echo "[$1] $2"; }
bad()  { FAIL=1; note "FEHLER" "$1"; }

# 1) node --test
if node --test tests/ >/tmp/dod_tests.log 2>&1; then
  note OK "node --test tests/ ($(grep -c '^ok' /tmp/dod_tests.log) ok)"
else
  bad "node --test schlaegt fehl (siehe /tmp/dod_tests.log)"
fi

# 2) HTTP 200 fuer alle Ressourcen
RESOURCES="index.html css/style.css src/main.mjs vendor/three/three.module.js
assets/textures/earth_4k.jpg assets/geodata/coastlines_50m.json assets/logo/rk_wolf.png
$(find src -name '*.mjs')"
for f in $RESOURCES; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$f")
  [ "$code" = "200" ] || bad "HTTP $code fuer $f"
done
note OK "HTTP 200 fuer alle Ressourcen"

# 3) MIME-Typ aller .mjs
for f in $(find src -name '*.mjs'); do
  ct=$(curl -sI "$BASE/$f" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2}')
  case "$ct" in
    text/javascript*|application/javascript*) ;;
    *) bad "MIME $ct fuer $f" ;;
  esac
done
note OK "MIME-Typ text/javascript fuer alle .mjs"

# 4) Textsuche: keine Browser-Globals/Render-Lib in src/data/
if grep -rnE "from 'three'|from \"three\"|\bdocument\.|\bwindow\.|\.css" src/data/ ; then
  bad "Browser-Globals oder Render-Lib in src/data/"
else
  note OK "src/data/ frei von Browser-Globals und Render-Lib"
fi

# 5) Textsuche: keine Kalender-/Astronomie-Rechnung in src/view/
if grep -rnE "getMonth|getFullYear|getUTC|julian" src/view/ ; then
  bad "Kalender-/Astronomie-Rechnung in src/view/"
else
  note OK "src/view/ frei von Kalender-Rechnung"
fi

# 6) Zentrale Texturkonfiguration
if grep -q "maxResolutionWidth" src/data/config.mjs && \
   ! grep -rn "assets/textures" src/view/ src/main.mjs | grep -v config >/dev/null; then
  note OK "Texturpfad/Grenzen zentral in src/data/config.mjs"
else
  bad "Texturpfad/Grenzen nicht zentral in config.mjs"
fi

# 7) Kein new / .clone( im Render-Loop (function animate in main.mjs)
LOOP=$(sed -n '/function animate/,/^  animate();/p' src/main.mjs)
if echo "$LOOP" | grep -qE "new |\.clone\("; then
  bad "Allokation im Render-Loop"
else
  note OK "Render-Loop ohne new/.clone("
fi

# 8) Exakt 2 ShaderMaterial-Instanzen
COUNT=$(grep -rn "new THREE.ShaderMaterial" src/ | wc -l)
if [ "$COUNT" = "2" ]; then
  note OK "Exakt 2 Shader-Materialien"
else
  bad "ShaderMaterial-Anzahl ist $COUNT (erwartet 2)"
fi

# 9) Fehlerpfad: fehlende Textur liefert kein HTTP 200 und die App
#    besitzt einen Fehlerpfad (showError am Textur-Ladefehler)
TEX="assets/textures/earth_4k.jpg"
if [ -f "$TEX" ]; then
  mv "$TEX" "$TEX.bak"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$TEX")
  mv "$TEX.bak" "$TEX"
  if [ "$code" != "200" ] && grep -q "showError" src/main.mjs; then
    note OK "Fehlerpfad Textur (HTTP $code + showError vorhanden)"
  else
    bad "Fehlerpfad Textur unvollstaendig (HTTP $code)"
  fi
else
  bad "Textur $TEX nicht vorhanden"
fi

echo
if [ "$FAIL" = "0" ]; then echo "DoD-Pruefungen: ALLE BESTANDEN"; else echo "DoD-Pruefungen: FEHLER"; fi
exit $FAIL
