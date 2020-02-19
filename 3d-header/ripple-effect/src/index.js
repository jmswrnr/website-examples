import './styles.css'
import * as THREE from 'three'
import debounce from 'lodash.debounce'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import RippleShader from './shaders/Ripple'

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

const finalComposer = new EffectComposer(renderer)
finalComposer.addPass(new RenderPass(mainScene, mainCamera))

const ripplePass = new ShaderPass(RippleShader())
ripplePass.uniforms.tRipple.value = rippleTexture
ripplePass.needsSwap = false
finalComposer.addPass(ripplePass)

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
  requestAnimationFrame(render)

  const delta = clock.getDelta()

  renderRipples(delta)

  modelContainer.rotation.x += 0.01
  modelContainer.rotation.y += 0.01

  finalComposer.render()
}
render()
