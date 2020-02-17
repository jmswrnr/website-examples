import './styles.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// Constants

const DEFAULT_LAYER = 0
const OCCLUSION_LAYER = 1

// Create Scene, Group + Camera

const mainScene = new THREE.Scene()

const modelContainer = new THREE.Group()
mainScene.add(modelContainer)

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
backLight.layers.enable(OCCLUSION_LAYER)
mainScene.add(backLight)

const fillLight = new THREE.PointLight(0x00aaff, 0.7, 20)
fillLight.position.set(-5, 0, 5)
fillLight.layers.enable(OCCLUSION_LAYER)
mainScene.add(fillLight)

const keyLight = new THREE.PointLight(0xff00ff, 2, 20)
keyLight.position.set(5, 0, 0)
keyLight.layers.enable(OCCLUSION_LAYER)
mainScene.add(keyLight)

// Create Renderer

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.getElementById('app').appendChild(renderer.domElement)

function animate() {
  modelContainer.rotation.x += 0.01
  modelContainer.rotation.y += 0.01
  requestAnimationFrame(animate)
  renderer.render(mainScene, mainCamera)
}
animate()

// Handle Window Resize

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
}
window.addEventListener('resize', resizeRenderer)

// Load 3D Model

const loader = new GLTFLoader()
const modelFile = require('../model/cybertruck.glb')

loader.load(
  modelFile,
  gltf => {
    // Add default mesh set to default layer
    gltf.scene.layers.set(DEFAULT_LAYER)
    modelContainer.add(gltf.scene)

    // Add black mesh set to occlusion Layer
    const occlusionScene = gltf.scene.clone()
    const blackMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x000000),
    })
    occlusionScene.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node = node.clone()
        node.material = blackMaterial
      }
    })
    occlusionScene.layers.set(OCCLUSION_LAYER)
    modelContainer.add(occlusionScene)
  },
  undefined,
  console.error
)
