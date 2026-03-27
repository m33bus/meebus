import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('canvas');
const loadingOverlay = document.getElementById('loading-overlay');
const dots = document.getElementById('dots');

let scene, camera, renderer, model;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let isDragging = false;

// AUDIO
const audio = new Audio('assets/song.mp3');
audio.loop = true;

// try autoplay
audio.play().catch(() => {
  window.addEventListener('touchstart', () => audio.play(), { once: true });
});

// LOADING DOTS ANIMATION
let dotState = 0;
setInterval(() => {
  dotState = (dotState + 1) % 4;
  dots.textContent = '.'.repeat(dotState);
}, 400);

// SCENE
scene = new THREE.Scene();

// CAMERA (FIXED — NOT INSIDE HEAD)
camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 5);

// RENDERER
renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// LIGHTING
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// MODEL
const loader = new GLTFLoader();
const MODEL_PATH = 'assets/head.glb';

loader.load(MODEL_PATH, (gltf) => {
  model = gltf.scene;

  // 🔥 SIZE + POSITION FIX
  model.scale.set(0.18, 0.18, 0.18);
  model.position.set(0, 0, -1.5);

  scene.add(model);

  // hide loading
  loadingOverlay.style.opacity = 0;
  setTimeout(() => loadingOverlay.style.display = 'none', 500);
});

// TOUCH CONTROLS (iPhone)
let startX = 0;
let startY = 0;

canvas.addEventListener('touchstart', (e) => {
  isDragging = true;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
  if (!isDragging) return;

  const deltaX = e.touches[0].clientX - startX;
  const deltaY = e.touches[0].clientY - startY;

  targetRotationY = deltaX * 0.005;
  targetRotationX = deltaY * 0.005;
});

canvas.addEventListener('touchend', () => {
  isDragging = false;
});

// DESKTOP SUPPORT
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  targetRotationY = deltaX * 0.005;
  targetRotationX = deltaY * 0.005;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// ANIMATE
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    // smooth return
    targetRotationX *= 0.95;
    targetRotationY *= 0.95;

    currentRotationX += (targetRotationX - currentRotationX) * 0.1;
    currentRotationY += (targetRotationY - currentRotationY) * 0.1;

    model.rotation.x = currentRotationX;
    model.rotation.y = currentRotationY;

    // subtle float
    model.position.y = Math.sin(Date.now() * 0.001) * 0.1;
  }

  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
