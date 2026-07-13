import { Vector3 } from 'three';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D } from '../room.js';
import { createFramedPhoto } from '../content.js';

export const HIST_X = 20;

const childhoodPhotos = [
  { src: '/images/dad/childhood/dadInArmchair.jpg', w: 526, h: 604, audio: '/audio/dad/dave_armchair.m4a' },
  { src: '/images/dad/childhood/daveSwings.jpg', w: 560, h: 604, audio: '/audio/dad/Dave-Swingset.m4a' },
  { src: '/images/dad/childhood/daveAndPuppy.jpg', w: 604, h: 520 },
  { src: '/images/dad/childhood/DaveBike.jpg', w: 471, h: 634 },
  { src: '/images/dad/childhood/daveDressUp.jpg', w: 814, h: 716, audio: '/audio/dad/Dave-Dressup.m4a' },
  { src: '/images/dad/childhood/DadWithFriends.jpg', w: 868, h: 680, audio: '/audio/dad/Dave-Friends.m4a' },
  { src: '/images/dad/childhood/daveWithSisters.jpg', w: 850, h: 689 },
  { src: '/images/dad/childhood/DaveWithSisters_2.jpg', w: 660, h: 698 },
  { src: '/images/dad/childhood/daveNewspaper.jpg', w: 696, h: 1269, audio: '/audio/dad/Dave-Newspaper.m4a' },
  { src: '/images/dad/childhood/daveSchoolPhoto.jpg', w: 905, h: 1332 },
  { src: '/images/dad/childhood/daveSchoolPhoto_1.jpg', w: 642, h: 924 },
  { src: '/images/dad/childhood/youngHT.jpg', w: 860, h: 698, audio: '/audio/dad/Dave-HT.m4a' },
];

export function buildDadsHistoryRoom() {
  const origin = new Vector3(HIST_X, 0, 0);

  createRoom(origin, [
    { label: 'Childhood',     x: HIST_X,              z: -ROOM_D / 2, w: ROOM_W, ry: 0 },
    { label: 'Before Laura',  x: HIST_X + ROOM_W / 2, z: 0,           w: ROOM_D, ry: -Math.PI / 2 },
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
}
