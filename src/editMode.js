import {
  Raycaster, Vector2, Vector3, BoxHelper, Color, Group,
} from 'three';
import { state } from './state.js';

let active = false;
let selected = null;
let helper = null;
let wallTangent = null;
let hudEl = null;
let bannerEl = null;
let navEl = null;
let editEl = null;

const raycaster = new Raycaster();
const mouse = new Vector2();

export function isEditMode() { return active; }

function findTopGroup(obj) {
  let current = obj;
  while (current.parent && current.parent !== state.scene) {
    current = current.parent;
  }
  return current;
}

function isDescendant(child, ancestor) {
  let c = child;
  while (c) {
    if (c === ancestor) return true;
    c = c.parent;
  }
  return false;
}

function detectWallMounted(group) {
  for (const f of state.allFrameTargets) {
    if (isDescendant(f.mesh, group)) return true;
  }
  for (const d of state.doorTargets) {
    if (d.group === group || isDescendant(d.panel, group)) return true;
  }
  return false;
}

function selectObject(obj) {
  deselectObject();
  selected = obj;
  helper = new BoxHelper(obj, new Color(0x00ff88));
  state.scene.add(helper);

  if (detectWallMounted(obj)) {
    const ry = obj.rotation.y;
    wallTangent = new Vector3(Math.cos(ry), 0, -Math.sin(ry));
  } else {
    wallTangent = null;
  }

  updateHUD();
}

function deselectObject() {
  if (helper) {
    state.scene.remove(helper);
    helper.dispose();
    helper = null;
  }
  selected = null;
  wallTangent = null;
  updateHUD();
}

function updateHUD() {
  if (!selected) {
    hudEl.style.display = 'none';
    return;
  }
  hudEl.style.display = 'block';
  const p = selected.position;
  const ry = selected.rotation.y;
  hudEl.innerHTML =
    `<b>Selected Object</b><br>` +
    `x: ${p.x.toFixed(3)}<br>` +
    `y: ${p.y.toFixed(3)}<br>` +
    `z: ${p.z.toFixed(3)}<br>` +
    `rotY: ${ry.toFixed(7)}<br>` +
    `<span style="color:#888">${wallTangent ? 'wall-mounted' : 'free-standing'}</span>`;
}

function moveSelected(dx, dy, dz) {
  if (!selected) return;
  selected.position.x += dx;
  selected.position.y += dy;
  selected.position.z += dz;
  if (helper) helper.update();
  updateHUD();
}

function onEditClick(event) {
  if (!active || state.renderer.xr.isPresenting) return;

  mouse.x = (event.clientX / state.renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / state.renderer.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, state.camera);

  const hits = raycaster.intersectObjects(state.scene.children, true);

  for (const hit of hits) {
    if (helper && isDescendant(hit.object, helper)) continue;
    if (isDescendant(hit.object, state.dolly)) continue;

    const top = findTopGroup(hit.object);
    if (top === state.dolly || top === helper) continue;

    selectObject(top);
    return;
  }

  deselectObject();
}

function onKeyDown(event) {
  if (event.code === 'KeyP' && !event.ctrlKey && !event.altKey && !event.metaKey) {
    active = !active;
    bannerEl.style.display = active ? 'block' : 'none';
    if (navEl) navEl.style.display = active ? 'none' : '';
    if (editEl) editEl.style.display = active ? '' : 'none';
    if (!active) deselectObject();
    return;
  }

  if (!active) return;

  if (event.code === 'Escape') {
    deselectObject();
    event.preventDefault();
    return;
  }

  if (event.code === 'Enter' && selected) {
    const p = selected.position;
    const ry = selected.rotation.y;
    console.log(
      `new Vector3(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})  // rotY: ${ry}`,
    );
    event.preventDefault();
    return;
  }

  if (!selected) return;

  if (event.code === 'BracketLeft' || event.code === 'BracketRight') {
    event.preventDefault();
    const rotSpeed = event.shiftKey ? 0.01 : 0.05;
    selected.rotation.y += event.code === 'BracketLeft' ? rotSpeed : -rotSpeed;
    if (helper) helper.update();
    updateHUD();
    return;
  }

  if (!event.code.startsWith('Arrow')) return;

  event.preventDefault();
  const fine = event.shiftKey;
  const speed = fine ? 0.01 : 0.05;

  if (wallTangent) {
    switch (event.code) {
      case 'ArrowLeft':
        moveSelected(-wallTangent.x * speed, 0, -wallTangent.z * speed);
        break;
      case 'ArrowRight':
        moveSelected(wallTangent.x * speed, 0, wallTangent.z * speed);
        break;
      case 'ArrowUp':
        moveSelected(0, speed, 0);
        break;
      case 'ArrowDown':
        moveSelected(0, -speed, 0);
        break;
    }
  } else {
    switch (event.code) {
      case 'ArrowLeft':
        moveSelected(-speed, 0, 0);
        break;
      case 'ArrowRight':
        moveSelected(speed, 0, 0);
        break;
      case 'ArrowUp':
        if (fine) moveSelected(0, 0.01, 0);
        else moveSelected(0, 0, -speed);
        break;
      case 'ArrowDown':
        if (fine) moveSelected(0, -0.01, 0);
        else moveSelected(0, 0, speed);
        break;
    }
  }
}

export function setupEditMode() {
  hudEl = document.createElement('div');
  hudEl.id = 'edit-hud';
  hudEl.style.display = 'none';
  document.body.appendChild(hudEl);

  bannerEl = document.createElement('div');
  bannerEl.id = 'edit-banner';
  bannerEl.textContent = 'EDIT MODE';
  bannerEl.style.display = 'none';
  document.body.appendChild(bannerEl);

  navEl = document.getElementById('controls-nav');
  editEl = document.getElementById('controls-edit');

  window.addEventListener('keydown', onKeyDown);
  state.renderer.domElement.addEventListener('click', onEditClick);
}
