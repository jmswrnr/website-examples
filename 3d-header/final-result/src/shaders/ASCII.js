import * as THREE from 'three'

export default () => ({
  uniforms: {
    tLowRes: { value: null },
    tFont: { value: null },
    tDepth: { value: null },
    fontCharTotalCount: { value: 0 },
    fontCharCount: { value: new THREE.Vector2(1, 1) },
    fontCharSize: { value: new THREE.Vector2(1, 1) },
    renderCharCount: { value: new THREE.Vector2(1, 1) },
    renderCharSize: { value: new THREE.Vector2(1, 1) },
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

    uniform float fontCharTotalCount;
    uniform vec2 fontCharSize;
    uniform vec2 fontCharCount;

    uniform vec2 renderCharCount;
    uniform vec2 renderCharSize;

    float readDepth(sampler2D depthSampler, vec2 coord) {
      float fragCoordZ = texture2D(depthSampler, coord).x;
      float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
      return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
    }

    void main()
    {
      vec2 roundedUv = vec2(
        floor(vUv.x * renderCharCount.x),
        floor(vUv.y * renderCharCount.y)
      ) * renderCharSize;

      float depth = readDepth(tDepth, roundedUv);
      vec4 color = texture2D(tLowRes, roundedUv);
    
      float charIndex = depth * fontCharTotalCount;

      vec2 fontuv = vec2(
        mod(vUv.x, renderCharSize.x),
        mod(vUv.y, renderCharSize.y)
      ) * renderCharCount * fontCharSize + vec2(
        floor(mod(charIndex, fontCharCount.x)) * fontCharSize.x,
        floor(charIndex * fontCharSize.x) * fontCharSize.y
      );
      
      gl_FragColor = texture2D(tFont, fontuv) * color;
    }
  `,
})
