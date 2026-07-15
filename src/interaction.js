import {
  Group,
  Vector2,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  CircleGeometry,
  Raycaster,
} from 'three';
import { state } from './state.js';
import { detectRoom } from './locomotion.js';
import { isEditMode } from './editMode.js';

const raycaster = new Raycaster();
const tempDir = new Vector3();
const tempPos = new Vector3();
const mouse = new Vector2();

let controller0, controller1;
let markerGroup;
let lastClickTime = 0;
const CLICK_COOLDOWN = 500;
let mouseDownPos = { x: 0, y: 0 };
const DRAG_THRESHOLD = 5;

function raycastFromController(ctrl) {
  ctrl.getWorldPosition(tempPos);
  ctrl.getWorldDirection(tempDir);
  tempDir.negate();
  raycaster.set(tempPos, tempDir);
}

function raycastFromMouse(event) {
  const { camera, renderer } = state;
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
}

function desktopTeleport(standPos, lookAt) {
  const { camera, controls } = state;
  camera.position.set(standPos.x, lookAt.y, standPos.z);
  controls.target.set(lookAt.x, lookAt.y, lookAt.z);
  controls.update();
}

function stopActiveFrame() {
  if (state.activeFrame && state.activeFrame.stop) {
    state.activeFrame.stop();
  }
  state.activeFrame = null;
}

function tryExitVR() {
  if (raycaster.intersectObjects(state.allExitBtns).length > 0) {
    const session = state.renderer.xr.getSession();
    if (session) session.end();
    return true;
  }
  return false;
}

function tryDoorTeleport(isDesktop) {
  const panels = state.doorTargets.map((d) => d.panel);
  const hits = raycaster.intersectObjects(panels);
  if (hits.length > 0) {
    const door = state.doorTargets.find((d) => d.panel === hits[0].object);
    if (door) {
      stopActiveFrame();
      if (isDesktop) {
        desktopTeleport(door.target, new Vector3(door.target.x, 1.5, door.target.z - 2));
      } else {
        state.dolly.position.set(door.target.x, 0, door.target.z);
      }
      detectRoom(door.target);
      return true;
    }
  }
  return false;
}

function isWorldVisible(obj) {
  let o = obj;
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

function tryFrameTeleport(isDesktop) {
  const meshes = state.allFrameTargets.filter((f) => isWorldVisible(f.mesh)).map((f) => f.mesh);
  const hits = raycaster.intersectObjects(meshes);
  if (hits.length > 0) {
    const hitFrames = hits.map((h) => state.allFrameTargets.find((f) => f.mesh === h.object)).filter(Boolean);
    const frame = hitFrames.find((f) => f.isSubControl) || hitFrames[0];
    if (frame) {
      if (state.activeFrame === frame && frame.isPlaying()) {
        stopActiveFrame();
      } else if (frame.keepActiveFrame && frame.isPlaying()) {
        if (frame.stop) frame.stop();
      } else if (frame.isSubControl && frame.isPlaying()) {
        if (frame.play) frame.play();
      } else if (!frame.target && frame.isPlaying()) {
        if (frame.stop) frame.stop();
        state.activeFrame = null;
      } else {
        if (!frame.keepActiveFrame) stopActiveFrame();
        if (frame.target) {
          if (isDesktop) {
            desktopTeleport(frame.target, frame.contentPos);
          } else {
            state.dolly.position.copy(frame.target);
          }
        }
        if (frame.play) {
          frame.play();
          if (!frame.keepActiveFrame) state.activeFrame = frame;
        }
      }
      return true;
    }
  }
  return false;
}

const EYE_HEIGHT = 1.6;

function tryTeleport() {
  const hits = raycaster.intersectObjects(state.allFloors);
  if (hits.length > 0) {
    const pt = hits[0].point;
    state.dolly.position.set(pt.x, pt.y, pt.z);
    return true;
  }
  return false;
}

function updateTeleportMarker(ctrl) {
  raycastFromController(ctrl);
  const hits = raycaster.intersectObjects(state.allFloors);
  if (hits.length > 0) {
    markerGroup.position.copy(hits[0].point);
    markerGroup.position.y += 0.01;
    markerGroup.visible = true;
  } else {
    markerGroup.visible = false;
  }
}

function onSelect(event) {
  const ctrl = event.target;
  raycastFromController(ctrl);
  if (tryExitVR()) return;
  if (tryDoorTeleport(false)) return;
  if (tryFrameTeleport(false)) return;
  tryTeleport();
}

function tryDesktopFloorTeleport() {
  const hits = raycaster.intersectObjects(state.allFloors);
  if (hits.length > 0) {
    const pt = hits[0].point;
    const { camera, controls } = state;
    const dir = new Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const eyeY = pt.y + EYE_HEIGHT;
    camera.position.set(pt.x, eyeY, pt.z);
    controls.target.set(pt.x + dir.x, eyeY, pt.z + dir.z);
    controls.update();
    return true;
  }
  return false;
}

function onMouseDown(event) {
  mouseDownPos.x = event.clientX;
  mouseDownPos.y = event.clientY;
}

function wasDrag(event) {
  const dx = event.clientX - mouseDownPos.x;
  const dy = event.clientY - mouseDownPos.y;
  return Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD;
}

function onMouseClick(event) {
  if (state.renderer.xr.isPresenting) return;
  if (isEditMode()) return;
  if (wasDrag(event)) return;
  const now = performance.now();
  if (now - lastClickTime < CLICK_COOLDOWN) return;
  lastClickTime = now;
  raycastFromMouse(event);
  if (tryDoorTeleport(true)) return;
  if (tryFrameTeleport(true)) return;
  tryDesktopFloorTeleport();
}

function onMouseMove(event) {
  if (state.renderer.xr.isPresenting) return;
  if (isEditMode()) {
    if (markerGroup) markerGroup.visible = false;
    state.renderer.domElement.style.cursor = '';
    return;
  }
  raycastFromMouse(event);

  const canvas = state.renderer.domElement;
  let hovering = false;

  for (const d of state.doorTargets) {
    const hit = raycaster.intersectObject(d.panel).length > 0;
    d.hoverSpot.intensity = hit ? 21 : 0;
    if (hit) hovering = true;
  }

  for (const f of state.allFrameTargets) {
    if (!isWorldVisible(f.mesh)) { if (f.borderMat) f.borderMat.emissiveIntensity = 0; continue; }
    const hit = raycaster.intersectObject(f.mesh).length > 0;
    if (f.borderMat) f.borderMat.emissiveIntensity = hit ? 0.7 : 0;
    if (hit) hovering = true;
  }

  // Floor teleport marker
  if (!hovering && markerGroup) {
    const floorHits = raycaster.intersectObjects(state.allFloors);
    if (floorHits.length > 0) {
      markerGroup.position.copy(floorHits[0].point);
      markerGroup.position.y += 0.01;
      markerGroup.visible = true;
      hovering = true;
    } else {
      markerGroup.visible = false;
    }
  }

  canvas.style.cursor = hovering ? 'pointer' : '';
}

export function setupInteraction(ctrl0, ctrl1) {
  controller0 = ctrl0;
  controller1 = ctrl1;

  markerGroup = new Group();
  const ring = new Mesh(
    new RingGeometry(0.25, 0.3, 32),
    new MeshBasicMaterial({ color: 0x44aaff, opacity: 0.7, transparent: true }),
  );
  ring.rotation.x = -Math.PI / 2;
  markerGroup.add(ring);
  const dot = new Mesh(
    new CircleGeometry(0.08, 16),
    new MeshBasicMaterial({ color: 0x44aaff, opacity: 0.9, transparent: true }),
  );
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = 0.001;
  markerGroup.add(dot);
  markerGroup.visible = false;
  state.scene.add(markerGroup);

  controller0.addEventListener('select', onSelect);
  controller1.addEventListener('select', onSelect);

  state.renderer.domElement.addEventListener('mousedown', onMouseDown);
  state.renderer.domElement.addEventListener('click', onMouseClick);
  state.renderer.domElement.addEventListener('mousemove', onMouseMove);
}

export function updateHoverEffects(now) {
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);

  updateTeleportMarker(controller0);

  for (const eb of state.allExitBtns) {
    eb.material.emissiveIntensity = 0.2 + 0.3 * pulse;
    raycastFromController(controller0);
    const h0 = raycaster.intersectObject(eb).length > 0;
    raycastFromController(controller1);
    const h1 = raycaster.intersectObject(eb).length > 0;
    eb.scale.setScalar(h0 || h1 ? 1.15 : 1.0);
  }

  for (const d of state.doorTargets) {
    raycastFromController(controller0);
    const dh0 = raycaster.intersectObject(d.panel).length > 0;
    raycastFromController(controller1);
    const dh1 = raycaster.intersectObject(d.panel).length > 0;
    d.hoverSpot.intensity = (dh0 || dh1) ? 21 : 0;
  }

  for (const f of state.allFrameTargets) {
    if (!f.borderMat) continue;
    if (!isWorldVisible(f.mesh)) { f.borderMat.emissiveIntensity = 0; continue; }
    raycastFromController(controller0);
    const fh0 = raycaster.intersectObject(f.mesh).length > 0;
    raycastFromController(controller1);
    const fh1 = raycaster.intersectObject(f.mesh).length > 0;
    f.borderMat.emissiveIntensity = (fh0 || fh1) ? 0.7 : 0;
  }
}

export function shortenRays(rays) {
  const rayMeshes = new Set(rays.map((r) => r.ray));
  for (const { ctrl, ray, maxLen } of rays) {
    raycastFromController(ctrl);
    const hits = raycaster.intersectObjects(state.scene.children, true)
      .filter((h) => !rayMeshes.has(h.object));
    const pos = ray.geometry.attributes.position;
    pos.setZ(1, hits.length > 0 ? -hits[0].distance : -maxLen);
    pos.needsUpdate = true;
  }
}

export function hideMarker() {
  if (markerGroup) markerGroup.visible = false;
}
