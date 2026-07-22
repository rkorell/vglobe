// (c) Dr. Ralf Korell
// Globe - Kugel mit Tag/Nacht-Shader. Ein ShaderMaterial, Geometrie
// wird einmalig gebacken. Sonnenrichtung und Nachthelligkeit kommen
// als Uniforms von der Orchestrierung.
// Modified: [2026-07-22 22:12] - Erstellt (AP-05)
// Modified: [2026-07-22 22:55] - sRGB-Ausgabekonvertierung im Fragment-Shader ergaenzt (Bild war zu dunkel)
// Modified: [2026-07-22 23:21] - Nachthelligkeit gamma-korrigiert (Regler-Prozente = wahrgenommene Helligkeit)
// Modified: [2026-07-22 23:42] - Tag/Nacht-Mischung in sRGB statt linear (Doppelkante am Terminator)

import * as THREE from 'three';
import { NIGHT_FACTOR_GLSL } from './shaders.mjs';

const VERTEX = `
varying vec2 vUv;
varying vec3 vNormalLocal;

void main() {
  vUv = uv;
  vNormalLocal = normal; // Objektraum: rotiert mit dem Globus mit
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = `
uniform sampler2D uDayMap;
uniform vec3 uSunDir;          // Objektraum, Einheitsvektor
uniform float uNightBrightness;
varying vec2 vUv;
varying vec3 vNormalLocal;

${NIGHT_FACTOR_GLSL}

void main() {
  vec3 day = texture2D(uDayMap, vUv).rgb;
  float sinAlt = dot(normalize(vNormalLocal), uSunDir);
  float f = nightFactor(sinAlt);
  // Erst nach sRGB wandeln, dann abdunkeln und mischen: der
  // Daemmerungsverlauf wird im wahrnehmungsbezogenen Raum gemischt,
  // sonst erscheinen ueber hellem Terrain zusaetzliche Kanten.
  gl_FragColor = vec4(day, 1.0);
  #include <colorspace_fragment>
  vec3 dayOut = gl_FragColor.rgb;
  gl_FragColor = vec4(mix(dayOut, dayOut * uNightBrightness, f), 1.0);
}
`;

// marksDeg/factors: Stuetzstellen der Daemmerungskurve (Datenschicht).
export function createGlobe({ texture, marksDeg, factors, nightBrightness }) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  const geometry = new THREE.SphereGeometry(1, 128, 64);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uDayMap: { value: texture },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uNightBrightness: { value: nightBrightness },
      uMarks: { value: new THREE.Vector4(...marksDeg) },
      uFactors: { value: new THREE.Vector4(...factors) }
    }
  });

  const mesh = new THREE.Mesh(geometry, material);

  return {
    mesh,
    setSunDirection(x, y, z) {
      material.uniforms.uSunDir.value.set(x, y, z);
    },
    setNightBrightness(v) {
      material.uniforms.uNightBrightness.value = v;
    }
  };
}
