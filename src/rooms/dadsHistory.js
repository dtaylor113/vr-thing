import { Vector3, TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh, SRGBColorSpace } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D } from '../room.js';
import { createFramedPhoto } from '../content.js';
import { state } from '../state.js';

export const HIST_X = 20;

const childhoodPhotos = [
  { src: '/images/dad/childhood/DaveInArmchair.jpg', w: 526, h: 604, audio: '/audio/dad/dave_armchair.m4a' },
  { src: '/images/dad/childhood/DaveSwings.jpg', w: 560, h: 604, audio: '/audio/dad/Dave-Swingset.m4a' },
  { src: '/images/dad/childhood/DaveAndPuppy.jpg', w: 604, h: 520 },
  { src: '/images/dad/childhood/DaveBike.jpg', w: 471, h: 634 },
  { src: '/images/dad/childhood/DaveDressUp.jpg', w: 814, h: 716, audio: '/audio/dad/Dave-Dressup.m4a' },
  { src: '/images/dad/childhood/DaveWithFriends.jpg', w: 868, h: 680, audio: '/audio/dad/Dave-Friends.m4a' },
  { src: '/images/dad/childhood/DaveWithSisters.jpg', w: 850, h: 689 },
  { src: '/images/dad/childhood/DaveWithRonaAndApril.jpg', w: 660, h: 698 },
  { src: '/images/dad/childhood/DaveInTheNew.jpg', w: 696, h: 1269, audio: '/audio/dad/Dave-Newspaper.m4a' },
  { src: '/images/dad/childhood/DavePre-SchoolPhoto.jpg', w: 905, h: 1332 },
  { src: '/images/dad/childhood/DaveSchoolPhoto.jpg', w: 642, h: 924 },
  { src: '/images/dad/childhood/YoungHT.jpg', w: 860, h: 698, audio: '/audio/dad/Dave-HT.m4a' },
];

export function buildDadsHistoryRoom() {
  const origin = new Vector3(HIST_X, 0, 0);

  createRoom(origin, [
    { label: 'Childhood',     x: HIST_X,              z: -ROOM_D / 2, w: ROOM_W, ry: 0 },
    { label: '',               x: HIST_X + ROOM_W / 2, z: 0,           w: ROOM_D, ry: -Math.PI / 2 },
    { label: '',               x: HIST_X,              z: ROOM_D / 2,  w: ROOM_W, ry: Math.PI },
    { label: 'Wedding',       x: HIST_X - ROOM_W / 2, z: 0,           w: ROOM_D, ry: Math.PI / 2 },
  ], { floor: 0x2a3a2a, wall: 0x3a4e3a, ceiling: 0x223322 });

  // Childhood photo grid (back wall, z = -5)
  const FRAME_MAX = 0.8;
  const COLS = 4;
  const colSpacing = 2.2;
  const rowYs = [3.3, 2.1, 1.0];
  const startX = HIST_X - ((COLS - 1) / 2) * colSpacing;
  const wallZ = -ROOM_D / 2 + 0.04;

  childhoodPhotos.forEach((photo, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = startX + col * colSpacing;
    const y = rowYs[row];

    const aspect = photo.h / photo.w;
    let pw, ph;
    if (aspect > 1) { ph = FRAME_MAX; pw = FRAME_MAX / aspect; }
    else { pw = FRAME_MAX; ph = FRAME_MAX * aspect; }

    const opts = {};
    if (photo.audio) opts.audioSrc = photo.audio;
    createFramedPhoto(photo.src, pw, ph, new Vector3(x, y, wallZ), 0, opts);
  });


  // EXIT VR button (front wall)
  createExitButton(new Vector3(HIST_X, 1.2, ROOM_D / 2 - 0.15), Math.PI);

  // Door back to Main Room (front wall, next to EXIT VR)
  createDoor(
    'Main Room',
    new Vector3(HIST_X + 3, 1.0, ROOM_D / 2 - 0.05),
    Math.PI,
    new Vector3(0, 0, 0),
  );

  // GLB models — table and action figure on "Before Laura" side
  const gltfLoader = new GLTFLoader();

  gltfLoader.load('/models/mahogany_table.glb', (gltf) => {
    const table = gltf.scene;
    table.name = 'mahogany_table';
    table.scale.setScalar(0.18);
    table.position.set(24.20, -0.02, -2.25);
    table.rotation.y = 1.55;
    state.scene.add(table);
  });

  gltfLoader.load('/models/AI_Dave.glb', (gltf) => {
    const dave = gltf.scene;
    dave.name = 'AI_Dave';
    dave.scale.setScalar(0.5);
    dave.position.set(24.22, 1.64, -1.70);
    dave.rotation.y = -2.1;
    state.scene.add(dave);
  });

  // Dave portrait on east wall (plain photo, no border)
  const texLoader = new TextureLoader();
  const daveTex = texLoader.load('/images/dad/Dave.JPEG');
  daveTex.colorSpace = SRGBColorSpace;
  const photoMesh = new Mesh(
    new PlaneGeometry(1.0, 1.3),
    new MeshBasicMaterial({ map: daveTex }),
  );
  photoMesh.name = 'Dave_photo';
  photoMesh.position.set(24.96, 2.40, 2.35);
  photoMesh.rotation.y = -Math.PI / 2;
  photoMesh.scale.setScalar(1.95);
  state.scene.add(photoMesh);

  // Wooden frame around Dave photo
  gltfLoader.load('/models/simple_wooden_picture_frame.glb', (gltf) => {
    const frame = gltf.scene;
    frame.name = 'wooden_frame';
    frame.scale.setScalar(0.0266);
    frame.position.set(24.97, 2.35, 3.35);
    frame.rotation.y = -Math.PI / 2;
    frame.rotation.z = Math.PI / 2;
    state.scene.add(frame);
  }, undefined, (err) => console.warn('Frame GLB load error:', err));

  // Dave bust on table
  gltfLoader.load('/models/DaveBust.glb', (gltf) => {
    const bust = gltf.scene;
    bust.name = 'DaveBust';
    bust.scale.setScalar(0.605);
    bust.position.set(24.20, 1.75, -2.90);
    bust.rotation.y = -1.7;
    state.scene.add(bust);
  }, undefined, (err) => console.warn('DaveBust GLB load error:', err));
}
