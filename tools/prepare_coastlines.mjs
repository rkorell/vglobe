// (c) Dr. Ralf Korell
// Globe - einmalige Asset-Vorbereitung (Node, nicht zur Laufzeit der App):
// Wandelt Natural Earth 1:50m Kuestenlinien (GeoJSON) in ein kompaktes
// JSON-Format fuer die App um.
//
// Quelle: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/
//         master/geojson/ne_50m_coastline.geojson (Public Domain)
// Aufruf: node tools/prepare_coastlines.mjs <eingabe.geojson> <ausgabe.json>
// Modified: [2026-07-22 22:00] - Erstellt (AP-04)

import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('Aufruf: node tools/prepare_coastlines.mjs <eingabe.geojson> <ausgabe.json>');
  process.exit(1);
}

const geojson = JSON.parse(readFileSync(inPath, 'utf8'));

function round(v) {
  return Math.round(v * 1000) / 1000; // 0,001 Grad ~ 110 m, reicht fuer 1:50m
}

const lines = [];
for (const feature of geojson.features) {
  const geom = feature.geometry;
  const parts =
    geom.type === 'LineString' ? [geom.coordinates] :
    geom.type === 'MultiLineString' ? geom.coordinates : [];
  for (const coords of parts) {
    if (coords.length < 2) continue;
    lines.push(coords.map(([lon, lat]) => [round(lon), round(lat)]));
  }
}

const out = {
  source: 'Natural Earth 1:50m coastline (Public Domain)',
  format: 'lines: Array von Polylinien, Punkt = [lon, lat] in Grad',
  lines
};

writeFileSync(outPath, JSON.stringify(out));
const points = lines.reduce((n, l) => n + l.length, 0);
console.log(`ok: ${lines.length} Linien, ${points} Punkte -> ${outPath}`);
