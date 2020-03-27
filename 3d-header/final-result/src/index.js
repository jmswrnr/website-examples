import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.debounce'

import { GLTFLoader } from '../three-examples/loaders/GLTFLoader'
import { EffectComposer } from '../three-examples/postprocessing/EffectComposer'
import { RenderPass } from '../three-examples/postprocessing/RenderPass'
import { ShaderPass } from '../three-examples/postprocessing/ShaderPass'

import AdditiveShader from './shaders/Additive'
import ASCIIShader from './shaders/ASCII'
import RippleShader from './shaders/Ripple'
import ScanShader from './shaders/Scan'
import VertexLitParticle from './shaders/VertexLitParticle'
import VolumetricLightScattering from './shaders/VolumetricLightScattering'
import VolumetricLightCylinder from './shaders/VolumetricLightCylinder'

// Constants

const DEFAULT_LAYER = 0
const OCCLUSION_LAYER = 1

const FONT_MAP_SIZE = new THREE.Vector2(64, 64)
const FONT_CHAR_SIZE = new THREE.Vector2(8, 8)

// Create Scene + Camera

const mainScene = new THREE.Scene()

const mainCamera = new THREE.PerspectiveCamera(
  15,
  window.innerWidth / window.innerHeight,
  8,
  15
)
mainCamera.position.z = 10

const occlusionCamera = mainCamera.clone()
occlusionCamera.layers.set(OCCLUSION_LAYER)

// Add Point Lights

const backLight = new THREE.PointLight(0x00aaff, 3, 10)
backLight.layers.enable(OCCLUSION_LAYER)
backLight.position.set(-5, 5, -5)
mainScene.add(backLight)

const fillLight = new THREE.PointLight(0x00aaff, 0.7, 10)
fillLight.layers.enable(OCCLUSION_LAYER)
fillLight.position.set(-5, 0, 5)
mainScene.add(fillLight)

const keyLight = new THREE.PointLight(0xff00ff, 2, 10)
keyLight.layers.enable(OCCLUSION_LAYER)
keyLight.position.set(5, 0, 0)
mainScene.add(keyLight)

// Create Renderer

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.getElementById('app').appendChild(renderer.domElement)

// Load 3D Model

const loader = new GLTFLoader()
const modelFile = require('../model/cybertruck.glb')

const modelContainer = new THREE.Group()
modelContainer.layers.enable(OCCLUSION_LAYER)
mainScene.add(modelContainer)

loader.load(
  modelFile,
  gltf => {
    // Add default mesh
    modelContainer.add(gltf.scene)

    // Add black mesh set to occlusion Layer
    const occlusionScene = gltf.scene.clone()
    const blackMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x000000),
    })
    occlusionScene.traverse(node => {
      if (node.material) {
        node.material = blackMaterial
      }
      if (node.layers) {
        node.layers.set(OCCLUSION_LAYER)
      }
    })
    modelContainer.add(occlusionScene)
  },
  undefined,
  console.error
)

// Generic

function getLowResSize() {
  const charCountPrecise = [
    window.innerWidth / FONT_CHAR_SIZE.x,
    window.innerHeight / FONT_CHAR_SIZE.y,
  ]

  const charCountCeil = charCountPrecise.map(Math.ceil)

  return {
    charCountPrecise,
    charCountCeil,
  }
}

const startingSizeData = getLowResSize()

const lowResRenderTarget = new THREE.WebGLRenderTarget(
  startingSizeData.charCountCeil[0] * 2,
  startingSizeData.charCountCeil[1] * 2
)

const lowResDepthTexture = new THREE.DepthTexture()
lowResDepthTexture.type = THREE.UnsignedShortType
lowResRenderTarget.depthTexture = lowResDepthTexture

const lowResEffectRenderTarget = new THREE.WebGLRenderTarget(
  startingSizeData.charCountCeil[0] * 2,
  startingSizeData.charCountCeil[1] * 2
)

const occlusionRenderTarget = new THREE.WebGLRenderTarget(
  startingSizeData.charCountCeil[0] * 2,
  startingSizeData.charCountCeil[1] * 2
)

// Ripple Effect

const RIPPLE_SPEED = 0.3
const RIPPLE_PEAK = 0.2

const ripples = []
const rippleCanvas = document.createElement('canvas')
rippleCanvas.width = rippleCanvas.style.width = window.innerWidth
rippleCanvas.height = rippleCanvas.style.height = window.innerHeight
const rippleContext = rippleCanvas.getContext('2d')
const rippleTexture = new THREE.Texture(rippleCanvas)
rippleTexture.minFilter = THREE.NearestFilter
rippleTexture.magFilter = THREE.NearestFilter

let rippleWasRendering = false

const linear = t => t
const easeOutQuart = t => 1 - --t * t * t * t

function renderRipples(delta) {
  if (ripples.length) {
    rippleWasRendering = true

    rippleContext.fillStyle = 'rgb(128, 128, 0)'
    rippleContext.fillRect(0, 0, rippleCanvas.width, rippleCanvas.height)

    ripples.forEach((ripple, i) => {
      ripple.age += delta * RIPPLE_SPEED

      if (ripple.age > 1) {
        ripples.splice(i, 1)
        return
      }

      const size = rippleCanvas.height * easeOutQuart(ripple.age)

      const alpha =
        ripple.age < RIPPLE_PEAK
          ? easeOutQuart(ripple.age / RIPPLE_PEAK)
          : 1 - linear((ripple.age - RIPPLE_PEAK) / (1 - RIPPLE_PEAK))

      let grd = rippleContext.createRadialGradient(
        ripple.position.x,
        ripple.position.y,
        size * 0.25,
        ripple.position.x,
        ripple.position.y,
        size
      )

      grd.addColorStop(1, `rgba(128, 128, 0, 0.5)`)
      grd.addColorStop(
        0.8,
        `rgba(${ripple.color.x}, ${ripple.color.y}, ${16 * alpha}, ${alpha})`
      )
      grd.addColorStop(0, `rgba(0, 0, 0, 0)`)

      rippleContext.beginPath()
      rippleContext.fillStyle = grd
      rippleContext.arc(
        ripple.position.x,
        ripple.position.y,
        size,
        0,
        Math.PI * 2
      )
      rippleContext.fill()
    })

    rippleTexture.needsUpdate = true
  } else if (rippleWasRendering) {
    rippleContext.fillStyle = 'rgb(128, 128, 0)'
    rippleContext.fillRect(0, 0, rippleCanvas.width, rippleCanvas.height)

    rippleWasRendering = false
    rippleTexture.needsUpdate = true
  }
}

function addRipple(event) {
  ripples.push({
    age: 0,
    position: new THREE.Vector2(event.clientX, event.clientY),
    color: new THREE.Vector2(
      (event.clientX / window.innerWidth) * 255,
      (event.clientY / window.innerHeight) * 255
    ),
  })
}
window.addEventListener('click', addRipple)

// Particles

const PARTICLE_COUNT = 60
const PARTICLE_DEPTH = 3
const PARTICLE_SPEED = 5

let frustumHeight
let frustumWidth
let frustumHeightHalf
let frustumWidthHalf

const particlesGroup = new THREE.Group()
mainScene.add(particlesGroup)

function updateFrustumValues() {
  frustumHeight =
    2.0 *
    mainCamera.position.z *
    Math.tan(mainCamera.fov * 0.5 * THREE.Math.DEG2RAD)

  frustumWidth = frustumHeight * mainCamera.aspect

  frustumHeightHalf = frustumHeight / 2
  frustumWidthHalf = frustumWidth / 2

  particlesGroup.position.x = -frustumWidthHalf
  particlesGroup.position.y = frustumHeightHalf
}
updateFrustumValues()

const particleGeometry = new THREE.BufferGeometry()
let _particlePositions = []
let _particleSpeeds = []

for (let i = 0; i < PARTICLE_COUNT; i++) {
  let x = Math.random() * frustumWidth
  let y = -(Math.random() * frustumHeight)
  let z = (Math.random() * 2 - 1) * (PARTICLE_DEPTH / 2)
  _particlePositions.push(x, y, z)
  _particleSpeeds.push(1 + Math.random() * PARTICLE_SPEED)
}

const particleSpeeds = new Float32Array(_particleSpeeds)
const particleStartPositions = new Float32Array(_particlePositions)
const particlePositions = new THREE.Float32BufferAttribute(
  _particlePositions,
  3
)
particleGeometry.setAttribute('position', particlePositions)

const particleMaterial = new THREE.ShaderMaterial(VertexLitParticle())
particleMaterial.uniforms.pointSize.value = 2.0
particleMaterial.uniforms.decayModifier.value = 2.5
const particles = new THREE.Points(particleGeometry, particleMaterial)
particlesGroup.add(particles)

const mousePositionNormalized = new THREE.Vector2(0, 0)

function animateParticles(delta) {
  let i = 0
  for (let p = 0; p < PARTICLE_COUNT; p++) {
    particlePositions.array[i] =
      (particleStartPositions[i] * frustumWidthHalf +
        particleSpeeds[p] * (1.0 + mousePositionNormalized.x * 4.0) * 0.2) %
      frustumWidth

    particlePositions.array[i + 1] =
      (particleStartPositions[i + 1] * frustumHeightHalf +
        particleSpeeds[p] * (1.0 - mousePositionNormalized.y * 4.0) * 0.1) %
      frustumHeight

    i += 3
  }

  particlePositions.needsUpdate = true
}

// Volumetric Lighting

const lightGeometry = new THREE.CylinderGeometry(3, 6, 15, 32, 6, true)
lightGeometry.applyMatrix4(
  new THREE.Matrix4().makeTranslation(
    0,
    -lightGeometry.parameters.height / 2,
    0
  )
)
lightGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))

const lightCylinderMaterial = new THREE.ShaderMaterial(
  VolumetricLightCylinder()
)
const lightConeTarget = new THREE.Vector3(0, 0, -8)
const lightCone = new THREE.Mesh(lightGeometry, lightCylinderMaterial)
lightCone.position.set(-5, 5, -8)
lightCone.layers.set(OCCLUSION_LAYER)
lightCylinderMaterial.uniforms.spotPosition.value = lightCone.position
mainScene.add(lightCone)

// ASCII Effect

const fontLoader = new THREE.TextureLoader()
const fontFile = require('../font.png')
const tFont = fontLoader.load(fontFile)
tFont.minFilter = THREE.NearestFilter
tFont.magFilter = THREE.NearestFilter

const asciiPass = new ShaderPass(ASCIIShader())
asciiPass.needsSwap = false
asciiPass.uniforms.tLowRes.value = lowResEffectRenderTarget.texture
asciiPass.uniforms.tDepth.value = lowResRenderTarget.depthTexture
asciiPass.uniforms.cameraNear.value = mainCamera.near
asciiPass.uniforms.cameraFar.value = mainCamera.far * 0.35
asciiPass.uniforms.tFont.value = tFont

const fontCountX = FONT_MAP_SIZE.x / FONT_CHAR_SIZE.x
const fontCountY = FONT_MAP_SIZE.y / FONT_CHAR_SIZE.y

asciiPass.uniforms.fontCharTotalCount.value =
  Math.floor(fontCountX) * Math.floor(fontCountY)

asciiPass.uniforms.fontCharSize.value.set(1 / fontCountX, 1 / fontCountY)

asciiPass.uniforms.fontCharCount.value.set(fontCountX, fontCountY)

// Occlusion Composer

const occlusionComposer = new EffectComposer(renderer, occlusionRenderTarget)
occlusionComposer.renderToScreen = false

occlusionComposer.addPass(new RenderPass(mainScene, occlusionCamera))

const lightScatteringPass = new ShaderPass(VolumetricLightScattering())
lightScatteringPass.needsSwap = false
occlusionComposer.addPass(lightScatteringPass)

// Effect Composer

const effectComposer = new EffectComposer(renderer, lowResEffectRenderTarget)
effectComposer.renderToScreen = false

const additivePass = new ShaderPass(AdditiveShader())
additivePass.textureID = null
additivePass.uniforms.tDiffuse.value = lowResRenderTarget.texture
additivePass.uniforms.tAdd.value = occlusionRenderTarget.texture
effectComposer.addPass(additivePass)

const scanPass = new ShaderPass(ScanShader())
scanPass.uniforms.tDepth.value = lowResDepthTexture
scanPass.uniforms.cameraNear.value = mainCamera.near
scanPass.uniforms.cameraFar.value = mainCamera.far
effectComposer.addPass(scanPass)

const ripplePass = new ShaderPass(RippleShader())
ripplePass.uniforms.tRipple.value = rippleTexture
ripplePass.needsSwap = false
effectComposer.addPass(ripplePass)

// Final Composer

const finalComposer = new EffectComposer(renderer)
finalComposer.addPass(asciiPass)

// Mouse Move

function mousemove(e) {
  lightCone.position.x = 5 * ((e.clientX / window.innerWidth) * 2 - 1)
  backLight.position.x = lightCone.position.x
  mousePositionNormalized.set(
    e.clientX / window.innerWidth,
    e.clientY / window.innerHeight
  )
}
window.addEventListener('mousemove', mousemove)

// Handle Window Resize

function updateAsciiRenderSize() {
  const size = getLowResSize()

  asciiPass.uniforms.renderCharSize.value.set(
    1 / size.charCountPrecise[0],
    1 / size.charCountPrecise[1]
  )

  asciiPass.uniforms.renderCharCount.value.set(
    size.charCountPrecise[0],
    size.charCountPrecise[1]
  )

  lowResRenderTarget.setSize(
    size.charCountCeil[0] * 2,
    size.charCountCeil[1] * 2
  )

  effectComposer.setSize(
    size.charCountCeil[0] * 2,
    size.charCountCeil[1] * 2
  )

  occlusionComposer.setSize(
    size.charCountCeil[0] * 2,
    size.charCountCeil[1] * 2
  )
}

function resizeRenderer() {
  rippleCanvas.width = rippleCanvas.style.width = window.innerWidth
  rippleCanvas.height = rippleCanvas.style.height = window.innerHeight
  updateAsciiRenderSize()
  renderer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
  occlusionCamera.aspect = mainCamera.aspect
  occlusionCamera.updateProjectionMatrix()
}
window.addEventListener('resize', debounce(resizeRenderer, 50))


// Render Scene

const clock = new THREE.Clock()

resizeRenderer()

function render() {
  const delta = clock.getDelta()

  modelContainer.rotation.y += delta * 0.5

  animateParticles(delta)

  // Scan
  
  scanPass.uniforms.scan.value =
  (scanPass.uniforms.scan.value + delta * 0.5) % 2

  // Volumetric Lighting

  lightCone.lookAt(lightConeTarget)
  lightCylinderMaterial.uniforms.spotPosition.value = lightCone.position
  const lightConePosition = lightCone.position.clone()
  const vector = lightConePosition.project(occlusionCamera)
  lightScatteringPass.uniforms.lightPosition.value.set(
    (vector.x + 1) / 2,
    (vector.y + 1) / 2
  )

  // Render

  renderRipples(delta)

  renderer.setRenderTarget(lowResRenderTarget)
  renderer.render(mainScene, mainCamera)
  
  renderer.setRenderTarget(occlusionRenderTarget)
  occlusionComposer.render()

  renderer.setRenderTarget(lowResEffectRenderTarget)
  effectComposer.render()

  renderer.setRenderTarget(null)
  finalComposer.render()

  requestAnimationFrame(render)
}
render()
