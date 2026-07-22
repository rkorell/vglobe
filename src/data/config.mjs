// (c) Dr. Ralf Korell
// Globe - zentrale Konfigurationskonstanten der Datenschicht.
// Modified: [2026-07-22 21:55] - Erstellt (AP-02)

// Texturpfade und maximale Aufloesungsgrenzen (bindend, FA-1).
export const TEXTURE_CONFIG = {
  defaultPath: 'assets/textures/earth_4k.jpg',
  maxResolutionWidth: 8192,
  maxResolutionHeight: 4096
};

// Pfad der aufbereiteten Kuestenliniendaten (Natural Earth 1:50m).
export const COASTLINE_CONFIG = {
  defaultPath: 'assets/geodata/coastlines_50m.json'
};

// Kamera- und Startansicht-Konstanten (FA-3, FA-4), Angaben in Erdradien.
export const VIEW_CONFIG = {
  minDistance: 2,
  maxDistance: 20,
  startDistance: 6.61,          // 42164 km geostationaer / 6371 km Erdradius
  startFovPortraitDeg: 17.94,   // vertikal im Querformat: 2 * (8.70 + 3 %)
  nightBrightnessDefault: 0.08, // FA-6 Grundaufhellung
  nightBrightnessMin: 0.03,
  nightBrightnessMax: 0.25
};
