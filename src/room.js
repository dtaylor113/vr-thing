import {
  Group,
  Vector3,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AmbientLight,
  PointLight,
  PlaneGeometry,
  DoubleSide,
  SpotLight,
  TextureLoader,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { state } from './state.js';
import { makeTextTexture } from './content.js';

const texLoader = new TextureLoader();

function loadTiledTexture(path, repeatX, repeatY, isSRGB = false) {
  const tex = texLoader.load(path);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isSRGB) tex.colorSpace = SRGBColorSpace;
  return tex;
}

export const ROOM_W = 10;
export const ROOM_D = 10;
export const ROOM_H = 4;

const defaultColors = { floor: 0x2a2a3a, wall: 0x3a3a4e, ceiling: 0x222233 };

/**
 * Build a room (floor, ceiling, walls, lighting, wall titles) at the given origin.
 * wallDefs: array of { label, x, z, w, ry } (positions are absolute world coords).
 * colors: optional { floor, wall, ceiling } hex colors.
 * Returns { floor }.
 */
export function createRoom(origin, wallDefs, colors = defaultColors, textures = {}) {
  const { scene } = state;
  const c = { ...defaultColors, ...colors };

  const floorMat = new MeshStandardMaterial({ color: c.floor, roughness: 0.8 });
  if (textures.floor) {
    const t = textures.floor;
    const rx = t.repeatX || 4, ry = t.repeatY || 4;
    floorMat.map = loadTiledTexture(t.color, rx, ry, true);
    if (t.normal) floorMat.normalMap = loadTiledTexture(t.normal, rx, ry);
    if (t.roughness) floorMat.roughnessMap = loadTiledTexture(t.roughness, rx, ry);
  }
  const floor = new Mesh(new PlaneGeometry(ROOM_W, ROOM_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(origin.x, origin.y, origin.z);
  floor.receiveShadow = true;
  floor.name = 'floor';
  scene.add(floor);
  state.allFloors.push(floor);

  const ceilingMat = new MeshStandardMaterial({ color: c.ceiling, roughness: 1.0 });
  const ceiling = new Mesh(new PlaneGeometry(ROOM_W, ROOM_D), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(origin.x, ROOM_H + origin.y, origin.z);
  scene.add(ceiling);

  wallDefs.forEach((d) => {
    const wallMat = new MeshStandardMaterial({ color: c.wall, roughness: 0.9, side: DoubleSide });
    if (textures.wall) {
      const t = textures.wall;
      const rx = t.repeatX || 4, ry = t.repeatY || 2;
      wallMat.map = loadTiledTexture(t.color, rx, ry, true);
      if (t.normal) wallMat.normalMap = loadTiledTexture(t.normal, rx, ry);
      if (t.roughness) wallMat.roughnessMap = loadTiledTexture(t.roughness, rx, ry);
    }
    const wall = new Mesh(new PlaneGeometry(d.w, ROOM_H), wallMat);
    wall.position.set(d.x, ROOM_H / 2 + origin.y, d.z);
    wall.rotation.y = d.ry;
    scene.add(wall);

    if (d.label) {
      const titleTex = makeTextTexture(d.label, 'transparent', '#aabbcc', 1024, 128, 72);
      const title = new Mesh(
        new PlaneGeometry(3, 0.4),
        new MeshBasicMaterial({ map: titleTex, transparent: true }),
      );
      const inward = 0.03;
      const nx = d.x === origin.x ? 0 : (d.x > origin.x ? -inward : inward);
      const nz = d.z === origin.z ? 0 : (d.z > origin.z ? -inward : inward);
      title.position.set(d.x + nx, ROOM_H - 0.35 + origin.y, d.z + nz);
      title.rotation.y = d.ry;
      scene.add(title);
    }
  });

  // Lighting
  const centerLight = new PointLight(0xffeedd, 100, 25);
  centerLight.position.set(origin.x, 3.8 + origin.y, origin.z);
  centerLight.castShadow = true;
  scene.add(centerLight);

  [-3, 3].forEach((dx) => {
    [-3, 3].forEach((dz) => {
      const l = new PointLight(0xddeeff, 20, 10);
      l.position.set(origin.x + dx, 3.5 + origin.y, origin.z + dz);
      scene.add(l);
    });
  });

  const margin = 0.3;
  state.roomBounds.push({
    minX: origin.x - ROOM_W / 2 + margin,
    maxX: origin.x + ROOM_W / 2 - margin,
    minZ: origin.z - ROOM_D / 2 + margin,
    maxZ: origin.z + ROOM_D / 2 - margin,
    minY: origin.y,
    maxY: origin.y + ROOM_H - 0.2,
  });

  return { floor };
}

const DOOR_W = 0.9;
const DOOR_H = 2.0;

export function createDoor(label, pos, rotY, teleportTarget) {
  const { scene } = state;
  const group = new Group();

  const panelMat = new MeshStandardMaterial({
    color: 0x8B5A2B,
    roughness: 0.6,
    metalness: 0.2,
    emissive: 0x8B5A2B,
    emissiveIntensity: 0.15,
  });
  const panel = new Mesh(new BoxGeometry(DOOR_W, DOOR_H, 0.08), panelMat);
  group.add(panel);

  const doorFrameMat = new MeshStandardMaterial({ color: 0x654321, roughness: 0.5 });
  const fw = 0.06;
  const topBar = new Mesh(new BoxGeometry(DOOR_W + fw * 2, fw, 0.1), doorFrameMat);
  topBar.position.set(0, DOOR_H / 2 + fw / 2, 0);
  group.add(topBar);
  const leftBar = new Mesh(new BoxGeometry(fw, DOOR_H, 0.1), doorFrameMat);
  leftBar.position.set(-DOOR_W / 2 - fw / 2, 0, 0);
  group.add(leftBar);
  const rightBar = new Mesh(new BoxGeometry(fw, DOOR_H, 0.1), doorFrameMat);
  rightBar.position.set(DOOR_W / 2 + fw / 2, 0, 0);
  group.add(rightBar);

  const handleMat = new MeshStandardMaterial({ color: 0xCCA000, roughness: 0.3, metalness: 0.7 });
  const handle = new Mesh(new BoxGeometry(0.08, 0.04, 0.06), handleMat);
  handle.position.set(0.3, 0, -0.07);
  group.add(handle);

  const labelTex = makeTextTexture(label, 'transparent', '#ffcc66', 512, 128, 48);
  const labelMesh = new Mesh(
    new PlaneGeometry(1.4, 0.3),
    new MeshBasicMaterial({ map: labelTex, transparent: true }),
  );
  labelMesh.position.set(0, DOOR_H / 2 + 0.3, -0.01);
  group.add(labelMesh);

  group.position.copy(pos);
  group.rotation.y = rotY;
  scene.add(group);

  const hoverSpot = new SpotLight(0xeeeeff, 0, 0, Math.PI / 10, 0.7, 0);
  hoverSpot.position.set(pos.x, pos.y + 2.5, pos.z);
  hoverSpot.target = group;
  scene.add(hoverSpot);
  scene.add(hoverSpot.target);

  state.doorTargets.push({ panel, group, target: teleportTarget, panelMat, hoverSpot });
  return { group, panel };
}

export function createExitButton(pos, rotY) {
  const { scene } = state;
  const mat = new MeshStandardMaterial({
    map: makeTextTexture('EXIT VR', '#cc2222', '#ffffff', 512, 256, 80),
    emissive: 0xcc2222,
    emissiveIntensity: 0.3,
    roughness: 0.4,
    metalness: 0.1,
  });
  const btn = new Mesh(new BoxGeometry(1.0, 0.5, 0.15), mat);
  btn.position.copy(pos);
  btn.rotation.y = rotY;
  btn.name = 'exitBtn';
  scene.add(btn);
  state.allExitBtns.push(btn);
  return btn;
}
