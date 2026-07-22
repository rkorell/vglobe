// (c) Dr. Ralf Korell
// Globe - Tests der Datenschicht: Sonnenstand (NOAA) und Daemmerungskurve.
// Sollwerte gemaess Definition of Done der GOAL-Datei.
// Modified: [2026-07-22 21:57] - Erstellt (AP-02/AP-03)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSolarState } from '../src/data/solar.mjs';
import { TWILIGHT_MARKS, nightFactor } from '../src/data/twilight.mjs';

function stateAt(iso) {
  return getSolarState(new Date(iso));
}

test('Aequinoktium 2025-03-20 12:00 UTC: |Deklination| < 0,5 Grad', () => {
  const s = stateAt('2025-03-20T12:00:00Z');
  assert.ok(Math.abs(s.declination) < 0.5, `Deklination ${s.declination}`);
});

test('Sommersonnenwende 2025-06-21 12:00 UTC: Deklination +23,4 (+-0,3)', () => {
  const s = stateAt('2025-06-21T12:00:00Z');
  assert.ok(Math.abs(s.declination - 23.4) < 0.3, `Deklination ${s.declination}`);
});

test('Wintersonnenwende 2025-12-21 12:00 UTC: Deklination -23,4 (+-0,3)', () => {
  const s = stateAt('2025-12-21T12:00:00Z');
  assert.ok(Math.abs(s.declination + 23.4) < 0.3, `Deklination ${s.declination}`);
});

test('Zeitgleichung: 2025-06-21 ca. -1,9 min (Abweichung < 1 min)', () => {
  const s = stateAt('2025-06-21T12:00:00Z');
  assert.ok(Math.abs(s.equationOfTime - -1.9) < 1, `EoT ${s.equationOfTime}`);
});

test('Zeitgleichung: 2025-11-03 ca. +16,5 min (Abweichung < 1 min)', () => {
  const s = stateAt('2025-11-03T12:00:00Z');
  assert.ok(Math.abs(s.equationOfTime - 16.5) < 1, `EoT ${s.equationOfTime}`);
});

test('Zeitgleichung: 2025-02-11 ca. -14,2 min (Abweichung < 1 min)', () => {
  const s = stateAt('2025-02-11T12:00:00Z');
  assert.ok(Math.abs(s.equationOfTime - -14.2) < 1, `EoT ${s.equationOfTime}`);
});

test('Vorzeichenprobe subsolare Laenge: 2025-11-03 12:00 UTC negativ (-4,1 +-0,3)', () => {
  const s = stateAt('2025-11-03T12:00:00Z');
  assert.ok(s.subsolarLon < 0, `Laenge ${s.subsolarLon}`);
  assert.ok(Math.abs(s.subsolarLon - -4.1) < 0.3, `Laenge ${s.subsolarLon}`);
});

test('Vorzeichenprobe subsolare Laenge: 2025-02-11 12:00 UTC positiv (+3,6 +-0,3)', () => {
  const s = stateAt('2025-02-11T12:00:00Z');
  assert.ok(s.subsolarLon > 0, `Laenge ${s.subsolarLon}`);
  assert.ok(Math.abs(s.subsolarLon - 3.6) < 0.3, `Laenge ${s.subsolarLon}`);
});

test('Wertebereiche: Breite -90..+90, Laenge -180..+180', () => {
  for (let h = 0; h < 48; h++) {
    const s = getSolarState(new Date(Date.UTC(2025, 0, 1, h)));
    assert.ok(s.subsolarLat >= -90 && s.subsolarLat <= 90);
    assert.ok(s.subsolarLon >= -180 && s.subsolarLon <= 180);
  }
});

test('Deterministische Funktionen: gleicher Zeitpunkt, gleiches Ergebnis', () => {
  const a = stateAt('2025-07-01T06:30:00Z');
  const b = stateAt('2025-07-01T06:30:00Z');
  assert.deepEqual(a, b);
});

test('TWILIGHT_MARKS: geforderte Grenzwerte', () => {
  assert.equal(TWILIGHT_MARKS.terminator, -0.833);
  assert.equal(TWILIGHT_MARKS.civil, -6);
  assert.equal(TWILIGHT_MARKS.nautical, -12);
  assert.equal(TWILIGHT_MARKS.astronomical, -18);
});

test('nightFactor: Randwerte 0 (Tag) und 1 (volle Nacht)', () => {
  assert.equal(nightFactor(30), 0);
  assert.equal(nightFactor(TWILIGHT_MARKS.terminator), 0);
  assert.equal(nightFactor(TWILIGHT_MARKS.astronomical), 1);
  assert.equal(nightFactor(-60), 1);
});

test('nightFactor: monoton fallend in der Sonnenhoehe und stetig', () => {
  const step = 0.01;
  let prev = nightFactor(10);
  for (let alt = 10 - step; alt >= -30; alt -= step) {
    const f = nightFactor(alt);
    assert.ok(f >= prev - 1e-12, `nicht monoton bei ${alt}`);
    assert.ok(Math.abs(f - prev) < 0.01, `Sprung bei ${alt}: ${f - prev}`);
    assert.ok(f >= 0 && f <= 1);
    prev = f;
  }
});
