// (c) Dr. Ralf Korell
// Globe - Kuestenlinien als LineSegments ueber der Kugel. Ein
// ShaderMaterial; nachtseitig sichtbar, tagseitig ausgeblendet.
// Geometrie wird einmalig aus den Polylinien der Datenschicht gebacken.
// Modified: [2026-07-22 22:13] - Erstellt (AP-05)
// Modified: [2026-07-22 22:56] - sRGB-Ausgabekonvertierung im Fragment-Shader ergaenzt
// Modified: [2026-07-22 23:22] - Farbe dunkles Grau, Deckkraft 0.9, setVisible() ergaenzt
// Modified: [2026-07-23 00:00] - Ebenen-Kennung (Kueste/Grenze) als Pro-Vertex-Attribut, zwei Grautoene

import * as THREE from 'three';
import { NIGHT_FACTOR_GLSL } from './shaders.mjs';

const DEG2RAD = Math.PI / 180;
const LINE_RADIUS = 1.002; // knapp ueber der Kugeloberflaeche

const VERTEX = `
attribute float aKind;      // 0 = Kueste, 1 = Grenze
varying vec3 vDirLocal;
varying float vKind;

void main() {
  vDirLocal = normalize(position); // Kugel um Ursprung: Richtung = Normale
  vKind = aKind;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = `
uniform vec3 uSunDir;
uniform vec3 uCoastColor;
uniform vec3 uBorderColor;
uniform float uMaxOpacity;
varying vec3 vDirLocal;
varying float vKind;

${NIGHT_FACTOR_GLSL}

void main() {
  float sinAlt = dot(normalize(vDirLocal), uSunDir);
  float alpha = nightFactor(sinAlt) * uMaxOpacity;
  if (alpha < 0.01) discard;
  vec3 color = mix(uCoastColor, uBorderColor, step(0.5, vKind));
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;

// Laenge/Breite in Grad -> Punkt auf der Kugel (Objektraum).
// Mapping passend zur Equirektangular-Textur der SphereGeometry.
function latLonToVec3(latDeg, lonDeg, radius, target) {
  const lat = latDeg * DEG2RAD;
  const lon = lonDeg * DEG2RAD;
  const cosLat = Math.cos(lat);
  target[0] = radius * cosLat * Math.cos(lon);
  target[1] = radius * Math.sin(lat);
  target[2] = -radius * cosLat * Math.sin(lon);
  return target;
}

export function createCoastlines({ lines, kinds, marksDeg, factors }) {
  // Segmentanzahl vorab bestimmen, Buffer einmalig fuellen
  let segmentCount = 0;
  for (const line of lines) segmentCount += line.length - 1;

  const positions = new Float32Array(segmentCount * 2 * 3);
  const kindAttr = new Float32Array(segmentCount * 2);
  const a = [0, 0, 0];
  const b = [0, 0, 0];
  let o = 0;
  let k = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const kind = kinds ? kinds[li] : 0;
    for (let i = 0; i < line.length - 1; i++) {
      latLonToVec3(line[i][1], line[i][0], LINE_RADIUS, a);
      latLonToVec3(line[i + 1][1], line[i + 1][0], LINE_RADIUS, b);
      positions[o++] = a[0]; positions[o++] = a[1]; positions[o++] = a[2];
      positions[o++] = b[0]; positions[o++] = b[1]; positions[o++] = b[2];
      kindAttr[k++] = kind;
      kindAttr[k++] = kind;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aKind', new THREE.BufferAttribute(kindAttr, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uCoastColor: { value: new THREE.Color(0x8a8a8a) },
      uBorderColor: { value: new THREE.Color(0x4a4a52) },
      uMaxOpacity: { value: 0.9 },
      uMarks: { value: new THREE.Vector4(...marksDeg) },
      uFactors: { value: new THREE.Vector4(...factors) }
    }
  });

  const object = new THREE.LineSegments(geometry, material);

  return {
    object,
    setSunDirection(x, y, z) {
      material.uniforms.uSunDir.value.set(x, y, z);
    },
    setVisible(v) {
      object.visible = v;
    }
  };
}
