import './styles.css'
import * as THREE from 'three'

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

// Placeholder 3D Cube

var geometry = new THREE.BoxGeometry()
var material = new THREE.MeshPhongMaterial({ color: 0xffffff })
var cube = new THREE.Mesh(geometry, material)
modelContainer.add(cube)
