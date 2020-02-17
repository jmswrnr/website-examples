import "./styles.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// Constants

const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;

// Creating Scene + Camera
const mainScene = new THREE.Scene();
const modelContainer = new THREE.Group();
mainScene.add(modelContainer);
const mainCamera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
mainCamera.position.z = 10;
mainCamera.layers.set(DEFAULT_LAYER);

// Adding Point Lights
const light = new THREE.PointLight(0xffffff, 10, 100);
light.position.set(50, 50, 50);

mainScene.add(light);

// Creating Renderer

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app").appendChild(renderer.domElement);

function animate() {
  modelContainer.rotation.x += 0.01;
  modelContainer.rotation.y += 0.01;
  requestAnimationFrame(animate);
  renderer.render(mainScene, mainCamera);
}
animate();

// Loading 3D Model

const loader = new GLTFLoader();
loader.load(
  "/model/cybertruck.glb",
  gltf => {
    // Enable shadows on all child mesh objects
    gltf.scene.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = node.receiveShadow = true;
      }
    });

    // Add colored version set to default layer
    gltf.scene.layers.set(DEFAULT_LAYER);
    modelContainer.add(gltf.scene);

    // Add black version set to occlusion Layer
    const occlusionScene = gltf.scene.clone();
    const blackMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x000000)
    });
    occlusionScene.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = node.receiveShadow = true;
        node.material = blackMaterial;
      }
    });
    occlusionScene.layers.set(OCCLUSION_LAYER);
    modelContainer.add(occlusionScene);
  },
  undefined,
  console.error
);
