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
let baseY = 0;

// ---------- audio ----------
const audio = new Audio('assets/song.mp3');
audio.loop = true;
audio.volume = 1.0;

const tryPlayAudio = () => {
  audio.play().catch(() => {});
};

tryPlayAudio();
window.addEventListener('touchstart', tryPlayAudio, { once: true });
window.addEventListener('click', tryPlayAudio, { once: true });

// ---------- loading dots ----------
if (dots) {
  let dotState = 0;
  setInterval(() => {
    dotState = (dotState + 1) % 4;
    dots.textContent = '.'.repeat(dotState);
  }, 400);
}

// ---------- scene ----------
scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// important: keep camera out in front
camera.position.set(0, 0, 8);

renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ---------- lights ----------
const ambient = new THREE.AmbientLight(0xffffff, 1.15);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
keyLight.position.set(3, 2, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xff4444, 0.45);
fillLight.position.set(-4, 1, 3);
scene.add(fillLight);

// ---------- model ----------
const loader = new GLTFLoader();
loader.load(
  'assets/head.glb',
  (gltf) => {
    model = gltf.scene;
    scene.add(model);

    // measure the model
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // center the model on its own middle
    model.position.sub(center);

    // recompute after centering
    const recenteredBox = new THREE.Box3().setFromObject(model);
    const recenteredSize = new THREE.Vector3();
    recenteredBox.getSize(recenteredSize);

    // aggressively normalize size so the head is much smaller
    const maxDim = Math.max(recenteredSize.x, recenteredSize.y, recenteredSize.z) || 1;
    const targetMaxDim = 2.2; // lower = smaller on screen
    const scale = targetMaxDim / maxDim;
    model.scale.setScalar(scale);

    // recompute after scaling
    const finalBox = new THREE.Box3().setFromObject(model);
    const finalCenter = new THREE.Vector3();
    const finalSize = new THREE.Vector3();
    finalBox.getCenter(finalCenter);
    finalBox.getSize(finalSize);

    // center once more after scaling
    model.position.sub(finalCenter);

    // nudge slightly down and back for composition
    model.position.y -= 0.15;
    model.position.z -= 1.25;

    baseY = model.position.y;

    // hide loading
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 400);
    }
  },
  undefined,
  (err) => {
    console.error('Model failed to load:', err);
  }
);

// ---------- controls ----------
let startX = 0;
let startY = 0;

function beginDrag(x, y) {
  isDragging = true;
  startX = x;
  startY = y;
}

function moveDrag(x, y) {
  if (!isDragging) return;

  const deltaX = x - startX;
  const deltaY = y - startY;

  targetRotationY = deltaX * 0.0045;
  targetRotationX = deltaY * 0.0035;
}

function endDrag() {
  isDragging = false;
}

canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  beginDrag(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  moveDrag(t.clientX, t.clientY);
}, { passive: true });

canvas.addEventListener('touchend', endDrag);

canvas.addEventListener('mousedown', (e) => {
  beginDrag(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
  moveDrag(e.clientX, e.clientY);
});

window.addEventListener('mouseup', endDrag);

// ---------- animation ----------
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    if (!isDragging) {
      targetRotationX *= 0.965;
      targetRotationY *= 0.965;
    }

    currentRotationX += (targetRotationX - currentRotationX) * 0.085;
    currentRotationY += (targetRotationY - currentRotationY) * 0.085;

    model.rotation.x = currentRotationX;
    model.rotation.y = currentRotationY;

    model.position.y = baseY + Math.sin(Date.now() * 0.00115) * 0.06;
  }

  renderer.render(scene, camera);
}

animate();

// ---------- resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
