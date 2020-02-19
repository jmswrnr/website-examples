import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.debounce'

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

// Placeholder 3D Cube

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshPhongMaterial({ color: 0xffffff })
const cube = new THREE.Mesh(geometry, material)
mainScene.add(cube)

// Handle Window Resize

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
}
window.addEventListener('resize', debounce(resizeRenderer, 50))

// Render Scene

const clock = new THREE.Clock()

function render() {
  const delta = clock.getDelta()

  cube.rotation.x += delta * 0.5
  cube.rotation.y += delta * 0.5
  
  renderer.render(mainScene, mainCamera)
  
  requestAnimationFrame(render)
}
render()
