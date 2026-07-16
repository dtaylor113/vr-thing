import { Vector3 } from 'three';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D } from '../room.js';
import { createVideoScreen } from '../content.js';

export const LAURA_X = -20;

export function buildLaurasRoom() {
  const origin = new Vector3(LAURA_X, 0, 0);

  createRoom(origin, [
    { label: '',               x: LAURA_X,              z: -ROOM_D / 2, w: ROOM_W, ry: 0 },
    { label: '',               x: LAURA_X + ROOM_W / 2, z: 0,           w: ROOM_D, ry: -Math.PI / 2 },
    { label: '',               x: LAURA_X,              z: ROOM_D / 2,  w: ROOM_W, ry: Math.PI },
    { label: '',               x: LAURA_X - ROOM_W / 2, z: 0,           w: ROOM_D, ry: Math.PI / 2 },
  ], { floor: 0xffffff, wall: 0xffffff, ceiling: 0x6b5a4a }, {
    floor: {
      color: '/textures/plank_flooring/plank_flooring_04_diff_1k.jpg',
      repeatX: 4, repeatY: 4,
    },
    wall: {
      color: '/textures/redish-fabric/Fabric002_1K-JPG_Color.jpg',
      normal: '/textures/redish-fabric/Fabric002_1K-JPG_NormalGL.jpg',
      roughness: '/textures/redish-fabric/Fabric002_1K-JPG_Roughness.jpg',
      repeatX: 6, repeatY: 3,
    },
  });

  // Back wall (z = -5) — the wall you face when entering
  const bz = -ROOM_D / 2 + 0.04;
  createVideoScreen('/video/FlashMob.mp4', 2.66,
    new Vector3(LAURA_X - 2, 2.0, bz), 0);

  createVideoScreen('/video/Laura/LauraTributeAward.mp4', 1.5,
    new Vector3(LAURA_X + 2, 2.0, bz), 0);

  createExitButton(new Vector3(LAURA_X + 3.5, 2.8, ROOM_D / 2 - 0.15), Math.PI);

  createDoor(
    'Main Room',
    new Vector3(LAURA_X + 3.5, 1.0, ROOM_D / 2 - 0.05),
    Math.PI,
    new Vector3(0, 1.6, 0),
  );
}
