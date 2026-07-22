// (c) Dr. Ralf Korell
// Globe - GLSL-Bausteine. Die Daemmerungskurve spiegelt nightFactor()
// der Datenschicht: stueckweise linear ueber der Sonnenhoehe in Grad;
// Stuetzstellen (Marken und Faktoren) kommen als Uniforms herein.
// Modified: [2026-07-22 22:11] - Erstellt (AP-05)
// Modified: [2026-07-22 23:41] - Smoothstep-Interpolation analog Datenschicht

// uMarks: Sonnenhoehen der Daemmerungsgrenzen in Grad, absteigend
//         (terminator, civil, nautical, astronomical)
// uFactors: zugehoerige Nachtfaktoren, aufsteigend
export const NIGHT_FACTOR_GLSL = `
uniform vec4 uMarks;
uniform vec4 uFactors;

float segmentMix(float alt, float a, float b, float fa, float fb) {
  float t = clamp((a - alt) / (a - b), 0.0, 1.0);
  float s = t * t * (3.0 - 2.0 * t); // Smoothstep, identisch zur Datenschicht
  return mix(fa, fb, s);
}

float nightFactor(float sinAlt) {
  float alt = degrees(asin(clamp(sinAlt, -1.0, 1.0)));
  if (alt >= uMarks.x) return uFactors.x;
  if (alt >= uMarks.y) return segmentMix(alt, uMarks.x, uMarks.y, uFactors.x, uFactors.y);
  if (alt >= uMarks.z) return segmentMix(alt, uMarks.y, uMarks.z, uFactors.y, uFactors.z);
  if (alt >= uMarks.w) return segmentMix(alt, uMarks.z, uMarks.w, uFactors.z, uFactors.w);
  return uFactors.w;
}
`;
