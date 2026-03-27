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
let startX = 0;
let startY = 0;
let baseY = 0;

// audio
const audio = new Audio('assets/song.mp3');
audio.loop = true;

function tryPlayAudio() {
  audio.play().catch(() => {});
}
tryPlayAudio();
window.addEventListener('touchstart', tryPlayAudio, { once: true });
window.addEventListener('click', tryPlayAudio, { once: true });

// loading dots
if (dots) {
  let dotState = 0;
  setInterval(() => {
    dotState = (dotState + 1) % 4;
    dots.textContent = '.'.repeat(dotState);
  }, 400);
}

// scene
scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// pulled back so camera is not inside the head
camera.position.set(0, 0, 5);

renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// lights
const ambient = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(3, 2, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xff3333, 0.35);
fillLight.position.set(-3, 1, 3);
scene.add(fillLight);

// model
const loader = new GLTFLoader();
loader.load(
  'assets/head.glb',
  (gltf) => {
    model = gltf.scene;

    // simple fixed sizing
    model.scale.set(0.14, 0.14, 0.14);

    // push model slightly away from camera
    model.position.set(0, -0.15, -1.2);
    baseY = model.position.y;

    scene.add(model);

    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 400);
    }
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// touch controls
canvas.addEventListener('touchstart', (e) => {
  isDragging = true;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!isDragging) return;

  const deltaX = e.touches[0].clientX - startX;
  const deltaY = e.touches[0].clientY - startY;

  targetRotationY = deltaX * 0.004;
  targetRotationX = deltaY * 0.003;
}, { passive: true });

canvas.addEventListener('touchend', () => {
  isDragging = false;
});

// mouse controls
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  targetRotationY = deltaX * 0.004;
  targetRotationX = deltaY * 0.003;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// animate
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    if (!isDragging) {
      targetRotationX *= 0.96;
      targetRotationY *= 0.96;
    }

    currentRotationX += (targetRotationX - currentRotationX) * 0.08;
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;

    model.rotation.x = currentRotationX;
    model.rotation.y = currentRotationY;

    model.position.y = baseY + Math.sin(Date.now() * 0.001) * 0.05;
  }

  renderer.render(scene, camera);
}

animate();

// resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
