import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_PATH = './assets/head.glb';
const AUDIO_PATH = './assets/song.mp3';

const mount = document.getElementById('scene-wrap');
const loadingOverlay = document.getElementById('loading-overlay');
const dotsEl = document.getElementById('dots');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 1);
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.05, 5.5);

const hemi = new THREE.HemisphereLight(0xffffff, 0x111111, 1.6);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(2.2, 1.8, 3.5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.55);
fillLight.position.set(-2.5, 0.2, 2.4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0.2, 1.6, -2.5);
scene.add(rimLight);

const headRoot = new THREE.Group();
scene.add(headRoot);

const modelHolder = new THREE.Group();
headRoot.add(modelHolder);

let currentRotX = 0;
let currentRotY = 0;
let targetRotX = 0;
let targetRotY = 0;
let isPointerDown = false;
let activePointerId = null;
let lastPointerX = 0;
let lastPointerY = 0;
let loadingDone = false;

const dragScaleX = 0.0065;
const dragScaleY = 0.0055;
const maxTiltX = 0.48;
const maxTiltY = 1.0;
const returnSpeed = 0.012;
const followSpeed = 0.11;

const clock = new THREE.Clock();

const audio = new Audio(AUDIO_PATH);
audio.loop = true;
audio.preload = 'auto';

function tryPlayAudio() {
  audio.play().catch(() => {});
}
window.addEventListener('pointerdown', tryPlayAudio, { once: true });
window.addEventListener('touchstart', tryPlayAudio, { once: true, passive: true });
window.addEventListener('click', tryPlayAudio, { once: true });

if (dotsEl) {
  let dotState = 0;
  window.setInterval(() => {
    dotState = (dotState + 1) % 4;
    dotsEl.textContent = '.'.repeat(dotState);
  }, 420);
}

function hideLoading() {
  if (loadingDone) return;
  loadingDone = true;
  if (loadingOverlay) {
    loadingOverlay.classList.add('is-hidden');
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeToward(current, target, factor) {
  return current + (target - current) * factor;
}

function setModelTransforms(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  object.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const desiredHeight = 2.2;
  const scale = desiredHeight / maxDimension;
  object.scale.setScalar(scale);

  const fittedBox = new THREE.Box3().setFromObject(object);
  const fittedSize = new THREE.Vector3();
  const fittedCenter = new THREE.Vector3();
  fittedBox.getSize(fittedSize);
  fittedBox.getCenter(fittedCenter);

  object.position.x -= fittedCenter.x;
  object.position.y -= fittedCenter.y;
  object.position.z -= fittedCenter.z;

  object.position.y -= fittedSize.y * 0.05;
  camera.position.z = 5.6;
}

function addFallbackHead() {
  const geo = new THREE.SphereGeometry(1.2, 64, 64);
  geo.scale(0.88, 1.18, 0.9);
  const mat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.68, metalness: 0.02 });
  const head = new THREE.Mesh(geo, mat);
  modelHolder.add(head);
  hideLoading();
}

const loader = new GLTFLoader();
loader.load(
  MODEL_PATH,
  (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });
    modelHolder.add(model);
    setModelTransforms(model);
    hideLoading();
  },
  undefined,
  () => {
    addFallbackHead();
  }
);

function onPointerDown(event) {
  isPointerDown = true;
  activePointerId = event.pointerId;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
}

function onPointerMove(event) {
  if (!isPointerDown || event.pointerId !== activePointerId) return;

  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;

  targetRotY = clamp(targetRotY + dx * dragScaleX, -maxTiltY, maxTiltY);
  targetRotX = clamp(targetRotX + dy * dragScaleY, -maxTiltX, maxTiltX);
}

function onPointerUp(event) {
  if (event.pointerId !== activePointerId) return;
  isPointerDown = false;
  activePointerId = null;
}

renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerup', onPointerUp, { passive: true });
window.addEventListener('pointercancel', onPointerUp, { passive: true });

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();
  const floatY = Math.sin(t * 0.7) * 0.06;
  const floatZRot = Math.sin(t * 0.42) * 0.015;

  if (!isPointerDown) {
    targetRotX = easeToward(targetRotX, 0, returnSpeed);
    targetRotY = easeToward(targetRotY, 0, returnSpeed);
  }

  currentRotX = easeToward(currentRotX, targetRotX, followSpeed);
  currentRotY = easeToward(currentRotY, targetRotY, followSpeed);

  headRoot.position.y = floatY;
  headRoot.rotation.x = currentRotX;
  headRoot.rotation.y = currentRotY;
  headRoot.rotation.z = floatZRot;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
