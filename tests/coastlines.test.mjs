// (c) Dr. Ralf Korell
// Globe - Tests: Laden und Validierung der Kuestenliniendaten sowie
// Importierbarkeit der Datenschicht ohne Browser-Globals.
// Modified: [2026-07-22 22:02] - Erstellt (AP-04)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  loadCoastlines,
  parseCoastlines,
  CoastlinesError
} from '../src/data/coastlines.mjs';
import { COASTLINE_CONFIG, TEXTURE_CONFIG } from '../src/data/config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const nodeLoader = (path) => readFile(new URL(path, `file://${repoRoot}`), 'utf8');

test('Kuestenlinien-Asset laedt und validiert (Natural Earth 1:50m)', async () => {
  const c = await loadCoastlines(COASTLINE_CONFIG.defaultPath, nodeLoader);
  assert.ok(c.lineCount > 1000, `nur ${c.lineCount} Linien`);
  assert.ok(c.pointCount > 50000, `nur ${c.pointCount} Punkte`);
  assert.match(c.source, /Natural Earth/);
});

test('parseCoastlines: kaputtes JSON wird abgewiesen', () => {
  assert.throws(() => parseCoastlines('{kein json'), CoastlinesError);
});

test('parseCoastlines: fehlendes lines-Feld wird abgewiesen', () => {
  assert.throws(() => parseCoastlines('{"lines": []}'), CoastlinesError);
  assert.throws(() => parseCoastlines('{"foo": 1}'), CoastlinesError);
});

test('parseCoastlines: Koordinaten ausserhalb des Wertebereichs werden abgewiesen', () => {
  const bad = JSON.stringify({ lines: [[[190, 0], [0, 0]]] });
  assert.throws(() => parseCoastlines(bad), CoastlinesError);
  const bad2 = JSON.stringify({ lines: [[[0, -91], [0, 0]]] });
  assert.throws(() => parseCoastlines(bad2), CoastlinesError);
});

test('parseCoastlines: Polylinie mit < 2 Punkten wird abgewiesen', () => {
  const bad = JSON.stringify({ lines: [[[0, 0]]] });
  assert.throws(() => parseCoastlines(bad), CoastlinesError);
});

test('TEXTURE_CONFIG: Pfad und bindende Aufloesungsgrenzen', () => {
  assert.equal(TEXTURE_CONFIG.defaultPath, 'assets/textures/earth_4k.jpg');
  assert.equal(TEXTURE_CONFIG.maxResolutionWidth, 8192);
  assert.equal(TEXTURE_CONFIG.maxResolutionHeight, 4096);
});

test('Datenschicht ohne Browser-Globals importierbar', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof globalThis.window, 'undefined');
  await import('../src/data/config.mjs');
  await import('../src/data/solar.mjs');
  await import('../src/data/twilight.mjs');
  await import('../src/data/coastlines.mjs');
});
