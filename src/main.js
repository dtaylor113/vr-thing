import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Color,
  Group,
  AmbientLight,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { state } from './state.js';
import { setupLocomotion, handleControllerLocomotion, handleDesktopLocomotion, clampToRoom, RAY_MAX, createVRLegend } from './locomotion.js';
import { setupInteraction, updateHoverEffects, shortenRays } from './interaction.js';
import { allVideosReady, onVideoLoadProgress } from './content.js';
import { buildMainRoom } from './rooms/mainRoom.js';
import { buildDadsHistoryRoom } from './rooms/dadsHistory.js';
import { buildLaurasRoom } from './rooms/laurasRoom.js';
import { setupEditMode } from './editMode.js';

// ── Renderer ──
const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const scene = new Scene();
scene.background = new Color(0x1a1a2e);

const dolly = new Group();
dolly.add(camera);
scene.add(dolly);

scene.add(new AmbientLight(0xffffff, 0.5));

// ── Initialize shared state ──
state.scene = scene;
state.dolly = dolly;
state.camera = camera;
state.renderer = renderer;

// ── Build rooms ──
buildMainRoom();
buildDadsHistoryRoom();
buildLaurasRoom();

// ── Input ──
const { controller0, controller1, ray0, ray1 } = setupLocomotion();
setupInteraction(controller0, controller1);

// ── Edit mode (desktop only) ──
setupEditMode();

// ── VR controller legend ──
const vrLegend = createVRLegend();

// ── Desktop controls ──
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.0, -2);
controls.enableDamping = true;
controls.maxDistance = 6;
controls.maxPolarAngle = Math.PI * 0.85;
camera.position.set(0, 2.2, 3);
controls.update();
state.controls = controls;

// ── Resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const info = document.getElementById('info');
const overlay = document.getElementById('loading-overlay');
const loadingStatus = document.getElementById('loading-status');
const loadingBar = document.getElementById('loading-bar');

let loaded = 0;
const total = state.allVideos.length;
onVideoLoadProgress(() => {
  loaded++;
  const pct = Math.round((loaded / total) * 100);
  loadingStatus.textContent = `Loading videos\u2026 ${loaded} / ${total}`;
  loadingBar.style.width = `${pct}%`;
});

allVideosReady().then(() => {
  renderer.xr.enabled = true;
  const vrBtn = VRButton.createButton(renderer, { optionalFeatures: ['hand-tracking'] });
  document.body.appendChild(vrBtn);
  function checkVrSupport() {
    if (vrBtn.textContent.includes('NOT SUPPORTED')) {
      vrBtn.classList.add('vr-not-supported');
    }
  }
  checkVrSupport();
  new MutationObserver(checkVrSupport).observe(vrBtn, { childList: true, characterData: true, subtree: true });
  overlay.classList.add('fade-out');
  setTimeout(() => overlay.remove(), 700);
  info.textContent = 'Ready \u2013 click "Enter VR" on your headset!';
});

// ── Render loop ──
const rayEntries = [
  { ctrl: controller0, ray: ray0, maxLen: RAY_MAX },
  { ctrl: controller1, ray: ray1, maxLen: RAY_MAX },
];
const controlsHUD = document.getElementById('controls');
let lastTime = performance.now();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  for (const entry of state.allVideos) {
    if (entry.playing && entry.ctx && entry.vid.readyState >= entry.vid.HAVE_CURRENT_DATA) {
      entry.ctx.drawImage(entry.vid, 0, 0, entry.canvas.width, entry.canvas.height);
      entry.tex.needsUpdate = true;
    }
  }

  const inVR = renderer.xr.isPresenting;
  for (const eb of state.allExitBtns) eb.visible = inVR;
  if (vrLegend) vrLegend.visible = inVR;
  if (state._anaglyphUpdaters) for (const fn of state._anaglyphUpdaters) fn();

  if (inVR) {
    handleControllerLocomotion(dt);
    updateHoverEffects(now);
    shortenRays(rayEntries);
    if (controlsHUD) controlsHUD.style.display = 'none';
  } else {
    handleDesktopLocomotion(dt);
    controls.update();
    clampToRoom(camera.position);
    clampToRoom(controls.target);
    if (controlsHUD) controlsHUD.style.display = '';
  }

  renderer.render(scene, camera);
});
