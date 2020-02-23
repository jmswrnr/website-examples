import { Vector2 } from 'three'

export default () => ({
  uniforms: {
    tDiffuse: { value: null },
    tRipple: { value: null },
    distort: { value: new Vector2(0.001, 0.001) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;

    uniform sampler2D tDiffuse;
    uniform sampler2D tRipple;

    uniform vec2 distort;
    
    void main()
    {
      vec3 ripple = texture2D(tRipple, vUv).rgb;

      vec2 distortOffset = normalize(vUv.xy - ripple.xy) * ripple.b + distort;

      gl_FragColor = vec4(
        ripple.b + texture2D(tDiffuse, vUv + distortOffset).r ,
        ripple.b + texture2D(tDiffuse, vUv).g,
        ripple.b + texture2D(tDiffuse, vUv - distortOffset).b,
        1.0
      );
    }
  `,
})
