import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.debounce'

import VertexLitParticle from './shaders/VertexLitParticle'

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

const backLight = new THREE.PointLight(0x00aaff, 3, 10)
backLight.position.set(-5, 5, -5)
mainScene.add(backLight)

const fillLight = new THREE.PointLight(0x00aaff, 0.7, 10)
fillLight.position.set(-5, 0, 5)
mainScene.add(fillLight)

const keyLight = new THREE.PointLight(0xff00ff, 2, 10)
keyLight.position.set(5, 0, 0)
mainScene.add(keyLight)

// Create Renderer

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.getElementById('app').appendChild(renderer.domElement)

// Particles

const PARTICLE_COUNT = 200
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
particleMaterial.uniforms.pointSize.value = 8.0
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

// Mouse Move

function mousemove(e) {
  mousePositionNormalized.set(
    e.clientX / window.innerWidth,
    e.clientY / window.innerHeight
  )
}
window.addEventListener('mousemove', mousemove)

// Handle Window Resize

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  mainCamera.aspect = window.innerWidth / window.innerHeight
  mainCamera.updateProjectionMatrix()
  updateFrustumValues()
}
window.addEventListener('resize', debounce(resizeRenderer, 50))

// Render Scene

const clock = new THREE.Clock()

function render() {
  const delta = clock.getDelta()

  animateParticles(delta)

  renderer.render(mainScene, mainCamera)

  requestAnimationFrame(render)
}
render()
