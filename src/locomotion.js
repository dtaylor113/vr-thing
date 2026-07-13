import {
  Vector3,
  Quaternion,
  Line,
  BufferGeometry,
  LineBasicMaterial,
} from 'three';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { state } from './state.js';

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

export const RAY_MAX = 8;

/**
 * Creates hand models, controller objects, and ray lines.
 * Returns { controller0, controller1, ray0, ray1 }.
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

  const rayGeom = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0),
    new Vector3(0, 0, -RAY_MAX),
  ]);
  const rayMat = new LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.6 });

  const controller0 = renderer.xr.getController(0);
  const ray0 = new Line(rayGeom.clone(), rayMat.clone());
  controller0.add(ray0);
  dolly.add(controller0);

  const controller1 = renderer.xr.getController(1);
  const ray1 = new Line(rayGeom.clone(), rayMat.clone());
  controller1.add(ray1);
  dolly.add(controller1);

  return { controller0, controller1, ray0, ray1 };
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

  if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) move.add(forward);
  if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) move.sub(forward);
  if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) move.sub(right);
  if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) move.add(right);

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

    if (buttons[4] && buttons[4].pressed) {
      dolly.position.y += MOVE_SPEED * dt;
    }
    if (buttons[5] && buttons[5].pressed) {
      dolly.position.y -= MOVE_SPEED * dt;
    }
  }

  clampToRoom(dolly.position);
}
