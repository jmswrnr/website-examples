export default () => ({
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    scan: { value: 0 },
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

    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;

    uniform float cameraNear;
    uniform float cameraFar;

    uniform float scan;

    float readDepth(sampler2D depthSampler, vec2 coord) {
      float fragCoordZ = texture2D(depthSampler, coord).x;
      float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
      return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
    }
    
    void main()
    {
      vec4 color = texture2D(tDiffuse, vUv);
      float depth = readDepth(tDepth, vUv);

      float scanClamp = clamp(scan, 0.0, 1.0);

      color.r += pow(1.0 - abs(depth-scanClamp), 140.0) * (1.0 - pow(depth, 10.0));

      gl_FragColor = color;
    }
  `,
})
