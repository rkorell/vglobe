// (c) Dr. Ralf Korell
// Globe - Sonnenstand nach dem NOAA Solar Position Algorithm
// (NOAA Global Monitoring Division, basierend auf Meeus, Astronomical
// Algorithms). Liefert subsolaren Punkt, Deklination und Zeitgleichung.
// Reine Rechnung, keine Browser-APIs, deterministisch.
// Modified: [2026-07-22 21:55] - Erstellt (AP-02)

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function toJulianDay(timestampMs) {
  // Unix-Epoche 1970-01-01 00:00 UTC entspricht JD 2440587.5
  return timestampMs / 86400000 + 2440587.5;
}

// Sonnenstand fuer einen JS-Date-Zeitpunkt (UTC).
export function getSolarState(date) {
  const timestamp = date.getTime();
  const jd = toJulianDay(timestamp);
  const T = (jd - 2451545.0) / 36525.0; // Julianische Jahrhunderte seit J2000

  // Geometrische mittlere Laenge der Sonne (Grad)
  let L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
  L0 = ((L0 % 360) + 360) % 360;

  // Mittlere Anomalie (Grad)
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);

  // Exzentrizitaet der Erdbahn
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  // Mittelpunktsgleichung (Grad)
  const Mrad = M * DEG2RAD;
  const C =
    Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mrad) * 0.000289;

  // Wahre und scheinbare Laenge (Grad), Nutation/Aberration korrigiert
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG2RAD);

  // Schiefe der Ekliptik (Grad), korrigiert
  const seconds = 21.448 - T * (46.815 + T * (0.00059 - T * 0.001813));
  const eps0 = 23 + (26 + seconds / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * DEG2RAD);

  // Deklination (Grad)
  const declination =
    Math.asin(Math.sin(eps * DEG2RAD) * Math.sin(lambda * DEG2RAD)) * RAD2DEG;

  // Zeitgleichung (Minuten)
  const y = Math.tan((eps / 2) * DEG2RAD) ** 2;
  const L0rad = L0 * DEG2RAD;
  const equationOfTime =
    4 *
    RAD2DEG *
    (y * Math.sin(2 * L0rad) -
      2 * e * Math.sin(Mrad) +
      4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0rad) -
      0.5 * y * y * Math.sin(4 * L0rad) -
      1.25 * e * e * Math.sin(2 * Mrad));

  // Subsolarer Punkt: Breite = Deklination; Laenge aus wahrer Sonnenzeit.
  // Wahre Sonnenzeit in Greenwich (Minuten seit Mitternacht):
  const utcMinutes =
    ((timestamp % 86400000) + 86400000) % 86400000 / 60000;
  const trueSolarMinutes = utcMinutes + equationOfTime;
  let subsolarLon = -(trueSolarMinutes - 720) / 4;
  subsolarLon = ((subsolarLon + 540) % 360) - 180; // normiert auf -180..+180

  return {
    subsolarLat: declination,
    subsolarLon,
    declination,
    equationOfTime,
    timestamp
  };
}
