import { Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { state } from '../state.js';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D, ROOM_H } from '../room.js';
import { createVideoScreen } from '../content.js';
import { HIST_X } from './dadsHistory.js';

export function buildMainRoom() {
  const origin = new Vector3(0, 0, 0);

  createRoom(origin, [
    { label: '',                  x: 0,          z: -ROOM_D / 2, w: ROOM_W, ry: 0 },
    { label: 'Mom / Dad',         x: ROOM_W / 2, z: 0,           w: ROOM_D, ry: -Math.PI / 2 },
    { label: '',                  x: 0,          z: ROOM_D / 2,  w: ROOM_W, ry: Math.PI },
    { label: '',                  x: -ROOM_W / 2, z: 0,          w: ROOM_D, ry: Math.PI / 2 },
  ], { floor: 0x2a2a3a, wall: 0x3a3a4e, ceiling: 0x222233 });

  // Back wall "Kids" (z = -5)
  const kz = -ROOM_D / 2 + 0.04;

  // Top row
  createVideoScreen('/video/Reese_Running.mp4', 0.8,
    new Vector3(-3.5, 2.8, kz), 0);

  createVideoScreen('/video/ReeseDoraBoots.mp4', 1.2,
    new Vector3(-1.5, 3.0, kz), 0);

  createVideoScreen('/video/ReeseSledingSloMo.mp4', 1.2,
    new Vector3(0.5, 3.0, kz), 0);

  createVideoScreen('/video/ReeseSellingCookies.mp4', 0.8,
    new Vector3(3.5, 2.8, kz), 0);

  // Bottom row
  createVideoScreen('/video/SpencerAngel.mp4', 1.2,
    new Vector3(-3.5, 1.2, kz), 0);

  createVideoScreen('/video/Mason_Spencer_In_A_Tree.mp4', 0.8,
    new Vector3(-1.2, 1.5, kz), 0);

  createVideoScreen('/video/Spencer_Mason_Wrestling.mp4', 1.2,
    new Vector3(1.2, 1.2, kz), 0);

  createVideoScreen('/video/Reese_Flying_A_Kite.MP4', 1.2,
    new Vector3(3.2, 1.2, kz), 0);

  // Left wall "Kids" (x = -5, rotY = PI/2)
  const lx = -ROOM_W / 2 + 0.04;

  // Top row
  createVideoScreen('/video/ReeseJumping.mp4', 0.8,
    new Vector3(lx, 2.7, -3), Math.PI / 2);

  createVideoScreen('/video/ReeseSinging.mp4', 0.8,
    new Vector3(lx, 2.7, 0), Math.PI / 2);

  createVideoScreen('/video/ReeseYoutubeVideo.MP4', 1.2,
    new Vector3(lx, 3.0, 3), Math.PI / 2);

  // Bottom row
  createVideoScreen('/video/MasonCrash.MP4', 1.2,
    new Vector3(lx, 1.0, -2), Math.PI / 2);

  createVideoScreen('/video/MasonCrazyNarration.MP4', 1.2,
    new Vector3(lx, 1.0, 2), Math.PI / 2);

  // 3D Picture frame + pedestal (Mom/Dad wall)
  const gltfLoader = new GLTFLoader();

  gltfLoader.load('/models/pedestal.glb', (gltf) => {
    const pedestal = gltf.scene;
    pedestal.scale.setScalar(2.0);
    pedestal.position.set(3.55, 0.87, 0.95);
    pedestal.rotation.y = -2.35;
    state.scene.add(pedestal);
  });

  gltfLoader.load('/models/frame.glb', (gltf) => {
    const frame = gltf.scene;
    frame.scale.setScalar(0.8);
    frame.position.set(4.05, 1.84, 0.45);
    frame.rotation.y = 1.5207963;
    state.scene.add(frame);
  });

  // South wall (front, z = +5)
  const sz = ROOM_D / 2 - 0.04;

  // Top row
  createVideoScreen('/video/ReeseLeavingHospital.mp4', 1.2,
    new Vector3(-3.5, 3.0, sz), Math.PI);

  createVideoScreen('/video/MasonsGeckoBirthday.mp4', 1.2,
    new Vector3(-1.5, 3.0, sz), Math.PI);

  createVideoScreen('/video/MasonLamb.mp4', 1.2,
    new Vector3(1.5, 3.0, sz), Math.PI);

  createVideoScreen('/video/OldeHomeDayBattle.mp4', 1.2,
    new Vector3(3.5, 3.0, sz), Math.PI);

  // Bottom row
  createVideoScreen('/video/Reese1stDayHome.mp4', 1.2,
    new Vector3(-3.5, 1.2, sz), Math.PI);

  createVideoScreen('/video/ReeseDance.mp4', 1.2,
    new Vector3(-1.5, 1.2, sz), Math.PI);

  createVideoScreen('/video/SpencerMasonDisneyPool.mp4', 1.2,
    new Vector3(1.5, 1.2, sz), Math.PI);

  createVideoScreen('/video/BabyReese.mp4', 1.2,
    new Vector3(3.5, 1.2, sz), Math.PI);

  // EXIT VR button (South wall, center)
  createExitButton(new Vector3(0, 1.2, ROOM_D / 2 - 0.15), Math.PI);

  // Door to Dad's History (Mom/Dad wall, left side when facing Kids)
  createDoor(
    "Dad's History",
    new Vector3(ROOM_W / 2 - 0.05, 1.0, -3),
    -Math.PI / 2,
    new Vector3(HIST_X, 0, 0),
  );
}
