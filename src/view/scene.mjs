// (c) Dr. Ralf Korell
// Globe - Praesentationsschicht: Szene, Kamera, Renderer, Resize.
// Keine Kalender-, Zeitzonen- oder Astronomie-Rechnung.
// Modified: [2026-07-22 22:10] - Erstellt (AP-05)

import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;

// Erzeugt Renderer, Szene, Kamera und die Globus-Gruppe.
// baseFovDeg ist der vertikale Oeffnungswinkel im Querformat (FA-4);
// im Hochformat wird er als horizontaler Winkel gehalten und der
// vertikale aus dem Seitenverhaeltnis berechnet.
export function createScene({ canvas, startDistance, baseFovDeg }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000004);

  const camera = new THREE.PerspectiveCamera(baseFovDeg, 1, 0.1, 100);
  camera.position.set(0, 0, startDistance);
  camera.lookAt(0, 0, 0);

  const globeGroup = new THREE.Group();
  // Startorientierung: 0 Grad Laenge zeigt zur Kamera (+z), Nordpol oben.
  globeGroup.rotation.y = -Math.PI / 2;
  scene.add(globeGroup);

  function updateSize(width, height) {
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.aspect = aspect;
    if (aspect >= 1) {
      camera.fov = baseFovDeg;
    } else {
      // Hochformat: horizontalen Winkel beibehalten
      const halfH = Math.tan((baseFovDeg / 2) * DEG2RAD);
      camera.fov = (2 * Math.atan(halfH / aspect)) / DEG2RAD;
    }
    camera.updateProjectionMatrix();
  }

  return { renderer, scene, camera, globeGroup, updateSize };
}
