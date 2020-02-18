import * as THREE from 'three'

export default () => ({
  uniforms: {
    tLowRes: { value: null },
    tFont: { value: null },
    tDepth: { value: null },
    fontCharUv: { value: new THREE.Vector2(1, 1) },
    fontCharSize: { value: new THREE.Vector2(1, 1) },
    fontMapSize: { value: new THREE.Vector2(1, 1) },
    renderCharSize: { value: new THREE.Vector2(1, 1) },
    renderCharUv: { value: new THREE.Vector2(1, 1) },
    cameraNear: { value: 0 },
    cameraFar: { value: 1 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
   #include <packing>

    varying vec2 vUv;
    uniform sampler2D tLowRes;
    uniform sampler2D tDepth;
    uniform sampler2D tFont;

    uniform float cameraNear;
    uniform float cameraFar;

    uniform vec2 fontCharUv;
    uniform vec2 fontCharSize;
    uniform vec2 fontMapSize;
    uniform vec2 renderCharSize;
    uniform vec2 renderCharUv;

    float readDepth(sampler2D depthSampler, vec2 coord) {
      float fragCoordZ = texture2D(depthSampler, coord).x;
      float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
      return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
    }

    void main()
    {
      float depth = readDepth(tDepth, vUv);

      vec2 roundedUv = vec2(
        floor(vUv.x * renderCharSize.x),
        floor(vUv.y * renderCharSize.y)
      ) * renderCharUv;

      vec4 color = texture2D(tLowRes, roundedUv);
    
      float charIndex = (depth) * 80.0;

      vec2 fontuv = vec2(
        mod(vUv.x, renderCharUv.x),
        mod(vUv.y, renderCharUv.y)
      ) * renderCharSize * fontCharUv + vec2(
        floor(mod(charIndex, fontMapSize[0])) * fontCharUv[0],
        floor(charIndex * fontCharSize[0]) * fontCharUv[0]
      );
      
      gl_FragColor = texture2D(tFont, fontuv) * color;
    }
  `,
})
