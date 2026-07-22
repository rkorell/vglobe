// (c) Dr. Ralf Korell
// Globe - Orchestrierung: einziger Ort, an dem Datenschicht (src/data/)
// und Praesentation (src/view/) sich begegnen.
// Modified: [2026-07-22 22:16] - Erstellt (AP-06)
// Modified: [2026-07-22 22:57] - Textur und Kuestenlinien parallel laden (Ladezeit)
// Modified: [2026-07-22 23:25] - Daemmerungsfaktoren angeglichen, Kuestenlinien-Toggle

import * as THREE from 'three';
import { TEXTURE_CONFIG, COASTLINE_CONFIG, VIEW_CONFIG } from './data/config.mjs';
import { getSolarState } from './data/solar.mjs';
import { TWILIGHT_MARKS } from './data/twilight.mjs';
import { loadCoastlines } from './data/coastlines.mjs';
import { createScene } from './view/scene.mjs';
import { createGlobe } from './view/globe.mjs';
import { createCoastlines } from './view/coastlines.mjs';
import { createControls } from './view/controls.mjs';
import { createUI } from './view/ui.mjs';

const DEG2RAD = Math.PI / 180;

// Daemmerungskurve fuer die Shader: Marken (Grad) und Nachtfaktoren,
// identisch zur Kurve in src/data/twilight.mjs.
const MARKS_DEG = [
  TWILIGHT_MARKS.terminator,
  TWILIGHT_MARKS.civil,
  TWILIGHT_MARKS.nautical,
  TWILIGHT_MARKS.astronomical
];
const FACTORS = [0.0, 0.75, 0.95, 1.0];

// Subsolarer Punkt (Grad) -> Richtungsvektor im Objektraum des Globus,
// passend zum Kugel/Textur-Mapping der Praesentation.
function sunDirectionFromSubsolar(latDeg, lonDeg, target) {
  const lat = latDeg * DEG2RAD;
  const lon = lonDeg * DEG2RAD;
  const cosLat = Math.cos(lat);
  target.x = cosLat * Math.cos(lon);
  target.y = Math.sin(lat);
  target.z = -cosLat * Math.sin(lon);
  return target;
}

function loadTexture(path) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(path, resolve, undefined, () =>
      reject(new Error(`Erdtextur nicht ladbar: ${path}`)));
  });
}

async function init() {
  const canvas = document.getElementById('globe-canvas');
  let needsRender = true;
  const requestRender = () => { needsRender = true; };

  // Zeitzustand: Echtzeit oder manueller Offset (Minuten) zur Echtzeit
  let realtime = true;
  let offsetMinutes = 0;
  let currentDate = new Date();

  let globe = null;
  let coast = null;
  const sunDir = new THREE.Vector3(1, 0, 0);

  const ui = createUI({
    onTimeOffsetChange(minutes) {
      realtime = false;
      offsetMinutes = minutes;
      updateTime();
    },
    onRealtime() {
      realtime = true;
      offsetMinutes = 0;
      updateTime();
    },
    onNightBrightnessChange(v) {
      if (globe) globe.setNightBrightness(v);
      requestRender();
    },
    onCoastlineToggle(visible) {
      if (coast) coast.setVisible(visible);
      requestRender();
    }
  });

  function updateTime() {
    currentDate = realtime
      ? new Date()
      : new Date(Date.now() + offsetMinutes * 60000);
    const solar = getSolarState(currentDate);
    sunDirectionFromSubsolar(solar.subsolarLat, solar.subsolarLon, sunDir);
    if (globe) globe.setSunDirection(sunDir.x, sunDir.y, sunDir.z);
    if (coast) coast.setSunDirection(sunDir.x, sunDir.y, sunDir.z);
    ui.setTime(currentDate, realtime);
    requestRender();
  }

  ui.showLoading('Lade Erdtextur und Küstenlinien …');
  let texture;
  let coastData;
  try {
    [texture, coastData] = await Promise.all([
      loadTexture(TEXTURE_CONFIG.defaultPath),
      loadCoastlines(COASTLINE_CONFIG.defaultPath)
    ]);
  } catch (err) {
    ui.showError(`${err.message} — Assets unter assets/ vorhanden?`);
    return;
  }
  const { width, height } = texture.image;
  if (width > TEXTURE_CONFIG.maxResolutionWidth || height > TEXTURE_CONFIG.maxResolutionHeight) {
    ui.showError(
      `Erdtextur ${width}x${height} ueberschreitet die zulaessige Aufloesung ` +
      `${TEXTURE_CONFIG.maxResolutionWidth}x${TEXTURE_CONFIG.maxResolutionHeight}.`);
    return;
  }

  const { renderer, scene, camera, globeGroup, updateSize } = createScene({
    canvas,
    startDistance: VIEW_CONFIG.startDistance,
    baseFovDeg: VIEW_CONFIG.startFovPortraitDeg
  });

  globe = createGlobe({
    texture,
    marksDeg: MARKS_DEG,
    factors: FACTORS,
    nightBrightness: VIEW_CONFIG.nightBrightnessDefault
  });
  globeGroup.add(globe.mesh);

  coast = createCoastlines({
    lines: coastData.lines,
    kinds: coastData.kinds,
    marksDeg: MARKS_DEG,
    factors: FACTORS
  });
  globeGroup.add(coast.object);

  createControls({
    dom: canvas,
    camera,
    globeGroup,
    minDistance: VIEW_CONFIG.minDistance,
    maxDistance: VIEW_CONFIG.maxDistance,
    onChange: requestRender
  });

  function handleResize() {
    updateSize(window.innerWidth, window.innerHeight);
    requestRender();
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  updateTime();
  // Echtzeitmodus: Sonnenstand 1x pro Minute nachfuehren (FA-8)
  setInterval(() => { if (realtime) updateTime(); }, 60000);

  ui.hideOverlay();

  // Render-Loop: rendert nur bei Bedarf, keine Allokationen
  function animate() {
    requestAnimationFrame(animate);
    if (needsRender) {
      needsRender = false;
      renderer.render(scene, camera);
    }
  }
  animate();
}

init();
