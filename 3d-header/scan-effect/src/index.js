import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.debounce'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import ScanShader from './shaders/Scan'

// Create Scene + Camera

const mainScene = new THREE.Scene()

const mainCamera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  8,
  11
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

// Scan Effect

const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight
)

const depthTexture = new THREE.DepthTexture()
depthTexture.type = THREE.UnsignedShortType
renderTarget.depthTexture = depthTexture

const finalComposer = new EffectComposer(renderer)

const scanPass = new ShaderPass(ScanShader())
scanPass.textureID = null
scanPass.needsSwap = false
scanPass.uniforms.tDiffuse.value = renderTarget.texture
scanPass.uniforms.tDepth.value = depthTexture
scanPass.uniforms.cameraNear.value = mainCamera.near
scanPass.uniforms.cameraFar.value = mainCamera.far
finalComposer.addPass(scanPass)

// Handle Window Resize

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderTarget.setSize(window.innerWidth, window.innerHeight)
  finalComposer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
}
window.addEventListener('resize', debounce(resizeRenderer, 50))

// Render Scene

const clock = new THREE.Clock()
function render() {
  const delta = clock.getDelta()

  modelContainer.rotation.x += delta * 0.5
  modelContainer.rotation.y += delta * 0.5
  
  scanPass.uniforms.scan.value =
    (scanPass.uniforms.scan.value + delta * 0.5) % 2

  renderer.setRenderTarget(renderTarget)
  renderer.render(mainScene, mainCamera)

  renderer.setRenderTarget(null)
  finalComposer.render()

  requestAnimationFrame(render)
}
render()
