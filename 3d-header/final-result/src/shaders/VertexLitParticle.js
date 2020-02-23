import { UniformsUtils, UniformsLib } from 'three'

export default () => ({
  lights: true,
  uniforms: UniformsUtils.merge([
    UniformsLib['lights'],
    {
      pointSize: { value: 2.0 },
      decayModifier: { value: 1.0 },
    },
  ]),
  vertexShader: `
    #include <common>

    struct PointLight {
      vec3 position;
      vec3 color;
      float distance;
      float decay;
      int shadow;
      float shadowBias;
      float shadowRadius;
      vec2 shadowMapSize;
      float shadowCameraNear;
      float shadowCameraFar;
    };

    uniform PointLight pointLights[NUM_POINT_LIGHTS];
    uniform float pointSize;
    uniform float decayModifier;

    varying vec4 vColor;

    float _punctualLightIntensityToIrradianceFactor( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
    	if( decayExponent > 0.0 ) {
    		return pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );
    	}
    	return 1.0;
    }

    void main()
    {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;

      gl_PointSize = pointSize;
      vec4 addedLights = vec4(0.1, 0.1, 0.1, 1.0);
      for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
        float dist = distance(pointLights[l].position, modelViewPosition.xyz);
        addedLights.rgb += pointLights[l].color *
        _punctualLightIntensityToIrradianceFactor(
            dist,
            pointLights[l].distance,
            pointLights[l].decay * decayModifier
          );
      }
      vColor = addedLights;
    }
  `,
  fragmentShader: `
    varying vec4 vColor;

    void main() {
      gl_FragColor = vColor;
    }
  `,
})
