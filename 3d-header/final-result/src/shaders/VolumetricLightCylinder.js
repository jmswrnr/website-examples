import * as THREE from 'three'

export default () => ({
  lights: true,
  transparent: true,
  depthWrite: false,
  uniforms: THREE.UniformsUtils.merge([
    THREE.UniformsLib['lights'],
    {
      attenuation: { value: 25.0 },
      anglePower: { value: 10.0 },
      spotPosition: { value: new THREE.Vector3(0, 0, 0) },
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
    uniform float viewMix;

    varying vec4 vColor;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    float _punctualLightIntensityToIrradianceFactor( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
    	if( decayExponent > 0.0 ) {
    		return pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );
    	}
    	return 1.0;
    }

    void main() {
      vNormal = normalize(normalMatrix * normal);

      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;

      vec4 addedLights = vec4(0.1, 0.1, 0.1, 1.0);
      for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
        float dist = distance(pointLights[l].position, worldPosition.xyz);
        addedLights.rgb += pointLights[l].color *
          _punctualLightIntensityToIrradianceFactor(
            dist,
            pointLights[l].distance,
            pointLights[l].decay
          );
      }

      vWorldPosition = worldPosition.xyz;
      vColor = addedLights;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform vec3 spotPosition;
    uniform float attenuation;
    uniform float anglePower;
    varying vec4 vColor;

    void main() {
      float intensity;
      intensity	= distance(vWorldPosition, spotPosition)/attenuation;
      intensity	= 1.0 - clamp(intensity, 0.0, 1.0);
      vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));
      float angleIntensity	= pow(dot(normal, vec3(0.0, 0.0, 1.0)), anglePower);
      intensity	= intensity * angleIntensity;
      gl_FragColor = vec4(vColor.rgb, intensity);
    }
  `,
})
