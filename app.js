import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_PATH = './assets/head.glb';
const SONG_PATH = './assets/song.mp3';

const mount = document.getElementById('scene-wrap');
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.getElementById('loading-text');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 1);
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4.8);

const hemi = new THREE.HemisphereLight(0xffffff, 0x101010, 1.55);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
keyLight.position.set(2.6, 1.8, 4.4);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
fillLight.position.set(-2.7, 0.2, 2.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xff5555, 0.45);
rimLight.position.set(0.1, 1.5, -2.6);
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
let loadingComplete = false;
let dotFrame = 0;
let audioStarted = false;

const dragScaleX = 0.006;
const dragScaleY = 0.005;
const maxTiltX = 0.48;
const maxTiltY = 1.0;
const returnSpeed = 0.03;
const followSpeed = 0.1;
const clock = new THREE.Clock();

const siteAudio = new Audio(SONG_PATH);
siteAudio.loop = true;
siteAudio.preload = 'auto';
siteAudio.volume = 0.85;

function tryStartAudio() {
  if (audioStarted) return;
  siteAudio.play().then(() => {
    audioStarted = true;
  }).catch(() => {
    // iPhone often blocks autoplay until first interaction.
  });
}

window.addEventListener('pointerdown', tryStartAudio, { passive: true });
window.addEventListener('touchstart', tryStartAudio, { passive: true });
window.addEventListener('click', tryStartAudio, { passive: true });
tryStartAudio();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeToward(current, target, factor) {
  return current + (target - current) * factor;
}

function updateLoadingText() {
  const dots = '.'.repeat(dotFrame % 4);
  loadingText.textContent = `loading${dots}`;
}

setInterval(() => {
  if (loadingComplete) return;
  dotFrame += 1;
  updateLoadingText();
}, 420);
updateLoadingText();

function finishLoading() {
  if (loadingComplete) return;
  loadingComplete = true;
  loadingText.textContent = 'loading...';
  setTimeout(() => {
    loadingScreen.classList.add('is-hidden');
  }, 180);
}

function fitModelToScene(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  object.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const desiredHeight = 1.5;
  const scale = desiredHeight / maxDimension;
  object.scale.setScalar(scale);

  const fittedBox = new THREE.Box3().setFromObject(object);
  const fittedSize = new THREE.Vector3();
  const fittedCenter = new THREE.Vector3();
  fittedBox.getSize(fittedSize);
  fittedBox.getCenter(fittedCenter);

  object.position.sub(fittedCenter);
  object.position.y -= fittedSize.y * 0.08;
  object.position.z = 0;
}

function addFallbackHead() {
  const geo = new THREE.SphereGeometry(1.2, 64, 64);
  geo.scale(0.88, 1.18, 0.9);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.72, metalness: 0.03 });
  const head = new THREE.Mesh(geo, mat);
  head.scale.setScalar(0.58);
  modelHolder.add(head);
}

const manager = new THREE.LoadingManager();
manager.onLoad = () => finishLoading();
manager.onError = () => finishLoading();

const loader = new GLTFLoader(manager);
loader.load(
  MODEL_PATH,
  (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.needsUpdate = true;
      }
    });
    modelHolder.add(model);
    fitModelToScene(model);
  },
  undefined,
  () => {
    addFallbackHead();
    finishLoading();
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
  if (activePointerId !== null && event.pointerId !== activePointerId) return;
  isPointerDown = false;
  activePointerId = null;
}

renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerup', onPointerUp, { passive: true });
window.addEventListener('pointercancel', onPointerUp, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();
  const floatY = Math.sin(t * 0.72) * 0.06;
  const floatZRot = Math.sin(t * 0.42) * 0.014;

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
