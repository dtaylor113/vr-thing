import { Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { state } from '../state.js';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D, ROOM_H } from '../room.js';
import { createVideoScreen } from '../content.js';
import { HIST_X } from './dadsHistory.js';

export function buildMainRoom() {
  const origin = new Vector3(0, 0, 0);

  createRoom(origin, [
    { label: 'Kids',              x: 0,          z: -ROOM_D / 2, w: ROOM_W, ry: 0 },
    { label: 'Mom / Dad',         x: ROOM_W / 2, z: 0,           w: ROOM_D, ry: -Math.PI / 2 },
    { label: 'Friends',           x: 0,          z: ROOM_D / 2,  w: ROOM_W, ry: Math.PI },
    { label: 'Kids',              x: -ROOM_W / 2, z: 0,          w: ROOM_D, ry: Math.PI / 2 },
  ], { floor: 0x2a2a3a, wall: 0x3a3a4e, ceiling: 0x222233 });

  // Kids wall content (back wall, z = -5)
  const kz = -ROOM_D / 2 + 0.04;

  // Top row
  createVideoScreen('/video/Reese_Running.mp4', 0.8, 1280, 720,
    new Vector3(-3.5, 3.0, kz), 0);

  createVideoScreen('/video/ReeseDoraBoots.mp4', 1.2, 480, 640,
    new Vector3(-1.5, 3.0, kz), 0);

  createVideoScreen('/video/ReeseSledingSloMo.mp4', 1.2, 720, 1280,
    new Vector3(0.5, 3.0, kz), 0);

  createVideoScreen('/video/ReeseSellingCookies.mp4', 0.8, 1920, 1080,
    new Vector3(3.5, 3.0, kz), 0);

  // Bottom row
  createVideoScreen('/video/SpencerAngel.mp4', 1.2, 480, 640,
    new Vector3(-3.5, 1.2, kz), 0);

  createVideoScreen('/video/Mason_Spencer_In_A_Tree.MOV', 1.2, 720, 1280,
    new Vector3(-1.2, 1.2, kz), 0);

  createVideoScreen('/video/Spencer_Mason_Wrestling.mp4', 1.2, 480, 640,
    new Vector3(1.2, 1.2, kz), 0);

  createVideoScreen('/video/Reese_Flying_A_Kite.MP4', 1.2, 720, 1280,
    new Vector3(3.2, 1.2, kz), 0);

  // Left "Kids" wall content (x = -5, rotY = PI/2)
  const lx = -ROOM_W / 2 + 0.04;

  createVideoScreen('/video/ReeseJumping.MOV', 1.2, 720, 1280,
    new Vector3(lx, 3.0, -3), Math.PI / 2);

  createVideoScreen('/video/ReeseSinging.MOV', 1.2, 720, 1280,
    new Vector3(lx, 3.0, 0), Math.PI / 2);

  createVideoScreen('/video/ReeseYouTubeVideo.MP4', 1.2, 480, 640,
    new Vector3(lx, 3.0, 3), Math.PI / 2);

  createVideoScreen('/video/MasonCrash.MP4', 1.2, 480, 640,
    new Vector3(lx, 1.2, -2), Math.PI / 2);

  createVideoScreen('/video/MasonCrazyNarration.MP4', 1.2, 480, 640,
    new Vector3(lx, 1.2, 2), Math.PI / 2);

  // 3D Picture frame model (Mom/Dad wall)
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('/models/frame.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(1.0);
    model.position.set(ROOM_W / 2 - 1.0, 1.0, 0);
    model.rotation.y = Math.PI / 2;
    state.scene.add(model);
  });

  // EXIT VR button (Friends/front wall)
  createExitButton(new Vector3(0, 1.2, ROOM_D / 2 - 0.15), Math.PI);

  // Door to Dad's History (Mom/Dad wall, left side when facing Kids)
  createDoor(
    "Dad's History",
    new Vector3(ROOM_W / 2 - 0.05, 1.0, -3),
    -Math.PI / 2,
    new Vector3(HIST_X, 0, 0),
  );
}
