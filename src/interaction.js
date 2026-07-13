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

const raycaster = new Raycaster();
const tempDir = new Vector3();
const tempPos = new Vector3();
const mouse = new Vector2();

let controller0, controller1;
let markerGroup;

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
        state.dolly.position.copy(door.target);
      }
      return true;
    }
  }
  return false;
}

function tryFrameTeleport(isDesktop) {
  const meshes = state.allFrameTargets.map((f) => f.mesh);
  const hits = raycaster.intersectObjects(meshes);
  if (hits.length > 0) {
    const frame = state.allFrameTargets.find((f) => f.mesh === hits[0].object);
    if (frame) {
      if (state.activeFrame === frame) {
        stopActiveFrame();
      } else {
        stopActiveFrame();
        if (isDesktop) {
          desktopTeleport(frame.target, frame.contentPos);
        } else {
          state.dolly.position.copy(frame.target);
        }
        if (frame.play) {
          frame.play();
          state.activeFrame = frame;
        }
      }
      return true;
    }
  }
  return false;
}

function tryTeleport() {
  const hits = raycaster.intersectObjects(state.allFloors);
  if (hits.length > 0) {
    state.dolly.position.x = hits[0].point.x;
    state.dolly.position.z = hits[0].point.z;
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

function onMouseClick(event) {
  if (state.renderer.xr.isPresenting) return;
  raycastFromMouse(event);
  if (tryDoorTeleport(true)) return;
  tryFrameTeleport(true);
}

function onMouseMove(event) {
  if (state.renderer.xr.isPresenting) return;
  raycastFromMouse(event);

  const canvas = state.renderer.domElement;
  let hovering = false;

  for (const d of state.doorTargets) {
    const hit = raycaster.intersectObject(d.panel).length > 0;
    d.panelMat.emissiveIntensity = hit ? 0.6 : 0.15;
    if (hit) hovering = true;
  }

  for (const f of state.allFrameTargets) {
    const hit = raycaster.intersectObject(f.mesh).length > 0;
    if (f.borderMat) f.borderMat.emissiveIntensity = hit ? 0.7 : 0;
    if (hit) hovering = true;
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
    d.panelMat.emissiveIntensity = (dh0 || dh1) ? 0.6 : 0.1 + 0.05 * pulse;
  }

  for (const f of state.allFrameTargets) {
    if (!f.borderMat) continue;
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
