// (c) Dr. Ralf Korell
// Globe - Daemmerungsstufung. Bildet die Sonnenhoehe auf einen
// Nachtfaktor 0 (voller Tag) .. 1 (volle Nacht) ab, gestuft nach den
// buergerlichen/nautischen/astronomischen Daemmerungsgrenzen.
// Monoton fallend in der Sonnenhoehe, stetig, deterministisch.
// Modified: [2026-07-22 21:56] - Erstellt (AP-03)

export const TWILIGHT_MARKS = {
  terminator: -0.833,
  civil: -6,
  nautical: -12,
  astronomical: -18
};

// Stuetzstellen: [Sonnenhoehe Grad, Nachtfaktor], monoton.
// Zwischen den Stuetzstellen wird linear interpoliert.
const NIGHT_CURVE = [
  [TWILIGHT_MARKS.terminator, 0.0],
  [TWILIGHT_MARKS.civil, 0.45],
  [TWILIGHT_MARKS.nautical, 0.8],
  [TWILIGHT_MARKS.astronomical, 1.0]
];

export function nightFactor(sunAltitudeDeg) {
  if (sunAltitudeDeg >= NIGHT_CURVE[0][0]) return 0;
  const last = NIGHT_CURVE[NIGHT_CURVE.length - 1];
  if (sunAltitudeDeg <= last[0]) return 1;
  for (let i = 1; i < NIGHT_CURVE.length; i++) {
    const [a1, f1] = NIGHT_CURVE[i - 1];
    const [a2, f2] = NIGHT_CURVE[i];
    if (sunAltitudeDeg > a2) {
      const t = (a1 - sunAltitudeDeg) / (a1 - a2);
      return f1 + (f2 - f1) * t;
    }
  }
  return 1;
}
