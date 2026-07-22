// (c) Dr. Ralf Korell
// Globe - Eingabesteuerung: Maus-Drag rotiert die Globus-Gruppe frei um
// bildschirmfeste Achsen (Quaternion, kein Up-Vektor-Zwang, ueber die
// Pole hinweg, FA-2). Mausrad aendert ausschliesslich den Kameraabstand
// (FA-3). Alle Arbeitsobjekte sind vorab allokiert.
// Modified: [2026-07-22 22:14] - Erstellt (AP-05)

import * as THREE from 'three';

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

export function createControls({ dom, camera, globeGroup, minDistance, maxDistance, onChange }) {
  const tmpQuat = new THREE.Quaternion();
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function rotSpeed() {
    // Feinere Steuerung bei nahem Zoom: Winkel pro Pixel skaliert mit
    // dem Abstand der Kamera zur Kugeloberflaeche.
    return 0.0009 * Math.max(camera.position.z - 1, 0.15);
  }

  dom.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    dom.setPointerCapture(e.pointerId);
  });

  dom.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const s = rotSpeed();
    tmpQuat.setFromAxisAngle(AXIS_Y, dx * s);
    globeGroup.quaternion.premultiply(tmpQuat);
    tmpQuat.setFromAxisAngle(AXIS_X, dy * s);
    globeGroup.quaternion.premultiply(tmpQuat);
    onChange();
  });

  dom.addEventListener('pointerup', (e) => {
    dragging = false;
    dom.releasePointerCapture(e.pointerId);
  });

  dom.addEventListener('pointercancel', () => {
    dragging = false;
  });

  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.001);
    const z = camera.position.z * factor;
    camera.position.z = Math.min(Math.max(z, minDistance), maxDistance);
    onChange();
  }, { passive: false });
}
