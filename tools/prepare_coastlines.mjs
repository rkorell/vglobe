// (c) Dr. Ralf Korell
// Globe - einmalige Asset-Vorbereitung (Node, nicht zur Laufzeit der App):
// Wandelt eine oder mehrere Natural-Earth-GeoJSON-Ebenen (Kuestenlinien,
// Laendergrenzen) in ein kompaktes, gemeinsames JSON-Format fuer die App
// um. Jede Polylinie traegt eine Ebenen-Kennung (kind), damit die
// Praesentation Kueste und Grenze mit einem einzigen Linien-Material
// unterschiedlich einfaerben kann.
//
// Quellen (Public Domain), Natural Earth 1:50m:
//   ne_50m_coastline.geojson
//   ne_50m_admin_0_boundary_lines_land.geojson
// Aufruf: node tools/prepare_coastlines.mjs <ausgabe.json> <kind>:<eingabe.geojson> [...]
//   <kind> ist 0 = Kueste, 1 = Grenze
// Beispiel:
//   node tools/prepare_coastlines.mjs assets/geodata/coastlines_50m.json \
//     0:/tmp/ne_50m_coastline.geojson 1:/tmp/ne_50m_admin0.geojson
// Modified: [2026-07-22 22:00] - Erstellt (AP-04)
// Modified: [2026-07-22 23:55] - Mehrere Ebenen (Kueste/Grenze) mit kind-Kennung

import { readFileSync, writeFileSync } from 'node:fs';

const [, , outPath, ...inputs] = process.argv;
if (!outPath || inputs.length === 0) {
  console.error('Aufruf: node tools/prepare_coastlines.mjs <ausgabe.json> <kind>:<eingabe.geojson> [...]');
  process.exit(1);
}

function round(v) {
  return Math.round(v * 1000) / 1000; // 0,001 Grad ~ 110 m, reicht fuer 1:50m
}

const lines = [];
const kinds = [];
for (const spec of inputs) {
  const sep = spec.indexOf(':');
  const kind = Number(spec.slice(0, sep));
  const inPath = spec.slice(sep + 1);
  const geojson = JSON.parse(readFileSync(inPath, 'utf8'));
  let count = 0;
  for (const feature of geojson.features) {
    const geom = feature.geometry;
    const parts =
      geom.type === 'LineString' ? [geom.coordinates] :
      geom.type === 'MultiLineString' ? geom.coordinates : [];
    for (const coords of parts) {
      if (coords.length < 2) continue;
      lines.push(coords.map(([lon, lat]) => [round(lon), round(lat)]));
      kinds.push(kind);
      count++;
    }
  }
  console.log(`  Ebene kind=${kind}: ${count} Linien aus ${inPath}`);
}

const out = {
  source: 'Natural Earth 1:50m coastline + admin_0 boundary lines (Public Domain)',
  format: 'lines: Array von Polylinien, Punkt = [lon, lat] in Grad; kinds: 0=Kueste, 1=Grenze',
  lines,
  kinds
};

writeFileSync(outPath, JSON.stringify(out));
const points = lines.reduce((n, l) => n + l.length, 0);
console.log(`ok: ${lines.length} Linien, ${points} Punkte -> ${outPath}`);
