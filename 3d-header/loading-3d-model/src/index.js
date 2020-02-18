import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.throttle'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


// Create Scene + Camera

const mainScene = new THREE.Scene()

const mainCamera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  0.1,
  20
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

// Handle Window Resize

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
}
window.addEventListener('resize', debounce(resizeRenderer, 50))

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

// Render Scene

function render() {
  requestAnimationFrame(render)

  modelContainer.rotation.x += 0.01
  modelContainer.rotation.y += 0.01

  renderer.render(mainScene, mainCamera)
}
render()