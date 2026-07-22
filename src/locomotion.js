import {
  Vector3,
  Quaternion,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  CanvasTexture,
  DoubleSide,
} from 'three';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { state } from './state.js';
import { isEditMode } from './editMode.js';

const MOVE_SPEED = 2.5;
const tempQuat = new Quaternion();

export function detectRoom(pos) {
  for (let i = 0; i < state.roomBounds.length; i++) {
    const b = state.roomBounds[i];
    if (pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ) {
      state.currentRoomIdx = i;
      return;
    }
  }
}

export function clampToRoom(pos) {
  const room = state.roomBounds[state.currentRoomIdx];
  if (!room) return;
  pos.x = Math.max(room.minX, Math.min(room.maxX, pos.x));
  pos.z = Math.max(room.minZ, Math.min(room.maxZ, pos.z));
  pos.y = Math.max(room.minY, Math.min(room.maxY, pos.y));
}

/**
 * Creates hand models, controller objects for input.
 * Returns { controller0, controller1 }.
 */
export function setupLocomotion() {
  const { renderer, dolly } = state;

  const handModelFactory = new XRHandModelFactory();
  const hand1 = renderer.xr.getHand(0);
  hand1.add(handModelFactory.createHandModel(hand1, 'mesh'));
  dolly.add(hand1);
  const hand2 = renderer.xr.getHand(1);
  hand2.add(handModelFactory.createHandModel(hand2, 'mesh'));
  dolly.add(hand2);

  const controllerModelFactory = new XRControllerModelFactory();

  const grip0 = renderer.xr.getControllerGrip(0);
  grip0.add(controllerModelFactory.createControllerModel(grip0));
  dolly.add(grip0);

  const grip1 = renderer.xr.getControllerGrip(1);
  grip1.add(controllerModelFactory.createControllerModel(grip1));
  dolly.add(grip1);

  const controller0 = renderer.xr.getController(0);
  dolly.add(controller0);

  const controller1 = renderer.xr.getController(1);
  dolly.add(controller1);

  return { controller0, controller1 };
}

// ── Desktop keyboard movement ──
const keysDown = new Set();
window.addEventListener('keydown', (e) => keysDown.add(e.code));
window.addEventListener('keyup', (e) => keysDown.delete(e.code));

export function handleDesktopLocomotion(dt) {
  const { camera, controls } = state;
  if (!controls || keysDown.size === 0) return;

  const speed = MOVE_SPEED * dt;
  const forward = new Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();

  const move = new Vector3();

  const editActive = isEditMode();
  if (keysDown.has('KeyW') || (!editActive && keysDown.has('ArrowUp'))) move.add(forward);
  if (keysDown.has('KeyS') || (!editActive && keysDown.has('ArrowDown'))) move.sub(forward);
  if (keysDown.has('KeyA') || (!editActive && keysDown.has('ArrowLeft'))) move.sub(right);
  if (keysDown.has('KeyD') || (!editActive && keysDown.has('ArrowRight'))) move.add(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(speed);
    camera.position.add(move);
    controls.target.add(move);
  }

  if (keysDown.has('KeyQ')) {
    camera.position.y += speed;
    controls.target.y += speed;
  }
  if (keysDown.has('KeyE')) {
    camera.position.y -= speed;
    controls.target.y -= speed;
  }

  clampToRoom(camera.position);
  clampToRoom(controls.target);
}

export function handleControllerLocomotion(dt) {
  const { renderer, camera, dolly } = state;
  const session = renderer.xr.getSession();
  if (!session) return;

  for (const source of session.inputSources) {
    if (!source.gamepad) continue;
    const axes = source.gamepad.axes;
    const buttons = source.gamepad.buttons;

    const moveX = axes[2] ?? 0;
    const moveZ = axes[3] ?? 0;

    if (Math.abs(moveX) > 0.15 || Math.abs(moveZ) > 0.15) {
      camera.getWorldQuaternion(tempQuat);
      const dir = new Vector3(moveX, 0, moveZ);
      dir.applyQuaternion(tempQuat);
      dir.y = 0;
      dir.normalize().multiplyScalar(MOVE_SPEED * dt);
      dolly.position.add(dir);
    }

    if (source.handedness === 'right') {
      const rz = axes[3] ?? 0;
      if (Math.abs(rz) > 0.15) {
        dolly.position.y -= rz * MOVE_SPEED * dt;
      }
    }
  }

  clampToRoom(dolly.position);
}

export function createVRLegend() {
  const w = 512, h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const r = 20;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fill();

  const lines = [
    'Look to aim',
    'Left Stick: Move / Strafe',
    'Right Stick: Up / Down',
    'Trigger: Select / Teleport',
  ];

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textBaseline = 'top';
  const lineH = 48;
  const startY = (h - lines.length * lineH) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 32, startY + i * lineH);
  }

  const tex = new CanvasTexture(canvas);
  const geom = new PlaneGeometry(0.3, 0.15);
  const mat = new MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.7,
    side: DoubleSide,
    depthTest: false,
  });
  const mesh = new Mesh(geom, mat);
  mesh.renderOrder = 999;
  mesh.position.set(0, 0.8, -0.4);
  mesh.rotation.x = -0.45;
  mesh.visible = false;

  state.dolly.add(mesh);
  return mesh;
}
