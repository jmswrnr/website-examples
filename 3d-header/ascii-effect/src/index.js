import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.debounce'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import ASCIIShader from './shaders/ASCII'

// Create Scene + Camera

const mainScene = new THREE.Scene()

const mainCamera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  8,
  12
)
mainCamera.position.z = 10

// Add Point Lights

const backLight = new THREE.PointLight(0x00aaff, 3, 20)
backLight.position.set(-5, 5, -5)
mainScene.add(backLight)

const fillLight = new THREE.PointLight(0x00aaff, 0.7, 20)
fillLight.position.set(-5, 0, 5)
mainScene.add(fillLight)

const keyLight = new THREE.PointLight(0xff00ff, 2, 20)
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
mainScene.add(modelContainer)

loader.load(
  modelFile,
  gltf => {
    modelContainer.add(gltf.scene)
  },
  undefined,
  console.error
)

// ASCII Effect

const FONT_MAP_SIZE = new THREE.Vector2(64, 64)
const FONT_CHAR_SIZE = new THREE.Vector2(8, 8)

const fontLoader = new THREE.TextureLoader()
const fontFile = require('../font.png')
const tFont = fontLoader.load(fontFile)
tFont.minFilter = THREE.NearestFilter
tFont.magFilter = THREE.NearestFilter

function getLowResSize() {
  const charCount = [
    Math.ceil(window.innerWidth / FONT_CHAR_SIZE.x),
    Math.ceil(window.innerHeight / FONT_CHAR_SIZE.y),
  ]

  const roundedScaleDifference = [
    (charCount[0] * FONT_CHAR_SIZE.x) / window.innerWidth,
    (charCount[1] * FONT_CHAR_SIZE.y) / window.innerHeight,
  ]

  return {
    charCount,
    roundedScaleDifference,
  }
}

const startingSizeData = getLowResSize()
const lowResRenderTarget = new THREE.WebGLRenderTarget(
  startingSizeData.charCount[0] * 2,
  startingSizeData.charCount[1] * 2
)

const lowResDepthTexture = new THREE.DepthTexture()
lowResDepthTexture.type = THREE.UnsignedShortType
lowResRenderTarget.depthTexture = lowResDepthTexture

const finalComposer = new EffectComposer(renderer)

const asciiPass = new ShaderPass(ASCIIShader())
asciiPass.uniforms.tLowRes.value = lowResRenderTarget.texture
asciiPass.uniforms.tDepth.value = lowResDepthTexture
asciiPass.uniforms.cameraNear.value = mainCamera.near
asciiPass.uniforms.cameraFar.value = mainCamera.far
asciiPass.uniforms.tFont.value = tFont

asciiPass.uniforms.fontCharUv.value.set(
  1 / (FONT_MAP_SIZE.x / FONT_CHAR_SIZE.x),
  1 / (FONT_MAP_SIZE.y / FONT_CHAR_SIZE.y)
)
asciiPass.uniforms.fontCharSize.value.set(
  1 / Math.floor(FONT_MAP_SIZE.x / FONT_CHAR_SIZE.x),
  1 / Math.floor(FONT_MAP_SIZE.y / FONT_CHAR_SIZE.y)
)
asciiPass.uniforms.fontMapSize.value.set(
  Math.floor(FONT_MAP_SIZE.x / FONT_CHAR_SIZE.x),
  Math.floor(FONT_MAP_SIZE.y / FONT_CHAR_SIZE.y)
)

function updateAsciiRenderSize() {
  const size = getLowResSize()

  asciiPass.uniforms.renderCharSize.value.set(
    size.charCount[0],
    size.charCount[1]
  )

  asciiPass.uniforms.renderCharUv.value.set(
    size.roundedScaleDifference[0] / size.charCount[0],
    size.roundedScaleDifference[1] / size.charCount[1]
  )

  lowResRenderTarget.setSize(
    size.charCount[0] * 2,
    size.charCount[1] * 2
  )
}

updateAsciiRenderSize()

finalComposer.addPass(asciiPass)

// Handle Window Resize

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
  updateAsciiRenderSize()
}
window.addEventListener('resize', debounce(resizeRenderer, 50))

// Render Scene

function render() {
  requestAnimationFrame(render)

  modelContainer.rotation.x += 0.01
  modelContainer.rotation.y += 0.01

  renderer.setRenderTarget(lowResRenderTarget)
  renderer.render(mainScene, mainCamera)

  renderer.setRenderTarget(null)
  finalComposer.render()
}
render()
