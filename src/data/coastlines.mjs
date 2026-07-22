// (c) Dr. Ralf Korell
// Globe - Laden und Validieren der aufbereiteten Kuestenliniendaten
// (Natural Earth 1:50m, siehe tools/prepare_coastlines.mjs).
// Keine Browser-APIs auf Modulebene; in Node ohne Browser importierbar.
// Modified: [2026-07-22 22:01] - Erstellt (AP-04)

import { COASTLINE_CONFIG } from './config.mjs';

export class CoastlinesError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CoastlinesError';
  }
}

// Laedt die Kuestenlinien. Standard-Ladeweg ist fetch() (Browser);
// fuer Node/Tests kann eine eigene Ladefunktion (path -> Promise<string>)
// uebergeben werden.
export async function loadCoastlines(path = COASTLINE_CONFIG.defaultPath, fetchText) {
  let text;
  if (fetchText) {
    text = await fetchText(path);
  } else {
    const response = await fetch(path);
    if (!response.ok) {
      throw new CoastlinesError(
        `Kuestenlinien nicht ladbar: ${path} (HTTP ${response.status})`);
    }
    text = await response.text();
  }
  return parseCoastlines(text, path);
}

// Parst und validiert den JSON-Text. Wirft CoastlinesError bei
// strukturellen Fehlern oder Koordinaten ausserhalb des Wertebereichs.
export function parseCoastlines(text, path = '(inline)') {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new CoastlinesError(`Kuestenlinien ${path}: kein gueltiges JSON (${err.message})`);
  }
  if (!data || !Array.isArray(data.lines) || data.lines.length === 0) {
    throw new CoastlinesError(`Kuestenlinien ${path}: Feld "lines" fehlt oder leer`);
  }
  let pointCount = 0;
  for (const line of data.lines) {
    if (!Array.isArray(line) || line.length < 2) {
      throw new CoastlinesError(`Kuestenlinien ${path}: Polylinie mit < 2 Punkten`);
    }
    for (const point of line) {
      if (!Array.isArray(point) || point.length !== 2 ||
          typeof point[0] !== 'number' || typeof point[1] !== 'number' ||
          !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        throw new CoastlinesError(`Kuestenlinien ${path}: ungueltiger Punkt`);
      }
      const [lon, lat] = point;
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new CoastlinesError(
          `Kuestenlinien ${path}: Koordinate ausserhalb des Wertebereichs (${lon}, ${lat})`);
      }
      pointCount++;
    }
  }
  return {
    source: typeof data.source === 'string' ? data.source : 'unbekannt',
    lines: data.lines,
    lineCount: data.lines.length,
    pointCount
  };
}
