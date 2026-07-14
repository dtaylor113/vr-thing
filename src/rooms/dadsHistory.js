import { Vector3, TextureLoader, PlaneGeometry, Box3, BoxGeometry, MeshBasicMaterial, MeshStandardMaterial, Mesh, SRGBColorSpace, CanvasTexture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import jsmediatags from 'jsmediatags';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D } from '../room.js';
import { createFramedPhoto, createAnaglyphStereo, createStereoPair } from '../content.js';
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
    { label: '3D Stereo Art', x: HIST_X - ROOM_W / 2, z: 0,           w: ROOM_D, ry: Math.PI / 2 },
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


  // Non-3D art on south wall (front wall, z = +5)
  const sz = ROOM_D / 2 - 0.04;
  createFramedPhoto('/images/dad/Art/ButterFlyFrame.jpg', 1.2, 0.8,
    new Vector3(HIST_X - 3.5, 2.8, sz), Math.PI);
  createFramedPhoto('/images/dad/Art/Ctrl-Alt-Dali.jpg', 1.0, 0.8,
    new Vector3(HIST_X - 1.5, 2.8, sz), Math.PI);
  createFramedPhoto('/images/dad/Art/ButterflyCell.png', 0.9, 0.78,
    new Vector3(HIST_X - 3.5, 1.4, sz), Math.PI);
  createFramedPhoto('/images/dad/Art/GodsWorkbench.jpg', 1.2, 0.8,
    new Vector3(HIST_X - 1.5, 1.4, sz), Math.PI);
  createFramedPhoto('/images/dad/Art/RowBoat.jpg', 1.2, 0.8,
    new Vector3(HIST_X + 1.5, 2.8, sz), Math.PI);
  createFramedPhoto('/images/dad/Art/WildLife.jpg', 1.2, 0.8,
    new Vector3(HIST_X + 1.5, 1.4, sz), Math.PI);

  // EXIT VR button (front wall)
  createExitButton(new Vector3(HIST_X + 3.5, 2.8, ROOM_D / 2 - 0.15), Math.PI);

  // Door back to Main Room (front wall)
  createDoor(
    'Main Room',
    new Vector3(HIST_X + 3.5, 1.0, ROOM_D / 2 - 0.05),
    Math.PI,
    new Vector3(0, 0, 0),
  );

  // GLB models — table and action figure on "Before Laura" side
  const gltfLoader = new GLTFLoader();

  gltfLoader.load('/models/mahogany_table.glb', (gltf) => {
    const table = gltf.scene;
    table.name = 'mahogany_table';
    table.scale.setScalar(0.18);
    table.position.set(24.20, -0.02, -1.80);
    table.rotation.y = 1.55;
    state.scene.add(table);
  });

  gltfLoader.load('/models/AI_Dave.glb', (gltf) => {
    const dave = gltf.scene;
    dave.name = 'AI_Dave';
    dave.scale.setScalar(0.5);
    dave.position.set(24.19, 1.64, -0.98);
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

  // 3D stereo art on west wall — top row (stereo pairs)
  const westX = HIST_X - ROOM_W / 2 + 0.04;
  createStereoPair('/images/dad/Art/Stereos/BridgeLeft.png', '/images/dad/Art/Stereos/BridgeRight.png', 1.5,
    new Vector3(westX, 2.8, -3.5), Math.PI / 2, 'Bridge');
  createStereoPair('/images/dad/Art/Stereos/StainedGlassLeft.png', '/images/dad/Art/Stereos/StainedGlassRight.png', 1.5,
    new Vector3(westX, 2.8, -1.2), Math.PI / 2, 'Stained Glass');
  createStereoPair('/images/dad/Art/Stereos/Kids-Dora-Left.png', '/images/dad/Art/Stereos/Kids-Dora-Right.png', 1.5,
    new Vector3(westX, 2.8, 1.2), Math.PI / 2, 'Kids Dora');
  createStereoPair('/images/dad/Art/Stereos/Scrapbook-Left.png', '/images/dad/Art/Stereos/Scrapbook-Right.png', 1.5,
    new Vector3(westX, 2.8, 3.5), Math.PI / 2, 'Scrapbook');

  // Bottom row (anaglyphs)
  createAnaglyphStereo('/images/dad/Art/Stereos/StoneBridge2Stereo.png', 1.8,
    new Vector3(westX, 1.2, -3.0), Math.PI / 2);
  createAnaglyphStereo('/images/dad/Art/Stereos/SpencerBeach.png', 0.8,
    new Vector3(westX, 1.2, -1.0), Math.PI / 2);
  createAnaglyphStereo('/images/dad/Art/Stereos/TreeOnTheBeach.png', 0.8,
    new Vector3(westX, 1.2, 1.0), Math.PI / 2);
  createAnaglyphStereo('/images/dad/Art/Stereos/MasonSpencerPool.png', 0.8,
    new Vector3(15.04, 1.20, 2.80), Math.PI / 2);

  // Dave bust on marble pedestal (near east wall)
  gltfLoader.load('/models/pedestal.glb', (gltf) => {
    const pedestal = gltf.scene;
    pedestal.name = 'dave_pedestal';
    pedestal.scale.setScalar(2.0);
    pedestal.position.set(16.49, 0, -4.20);
    state.scene.add(pedestal);
  });

  gltfLoader.load('/models/DaveBust.glb', (gltf) => {
    const bust = gltf.scene;
    bust.name = 'DaveBust';
    bust.scale.setScalar(0.605);
    bust.position.set(15.81, 1.45, -4.16);
    bust.rotation.y = 0.75;
    state.scene.add(bust);
  }, undefined, (err) => console.warn('DaveBust GLB load error:', err));

  // Stereo system on the mahogany table
  gltfLoader.load('/models/stereo_system.glb', (gltf) => {
    const stereo = gltf.scene;
    stereo.name = 'stereo_system';
    stereo.scale.setScalar(3.0);
    stereo.position.set(23.96, 1.15, -2.12);
    stereo.rotation.y = -1.58;
    state.scene.add(stereo);

    // Invisible hit box over the stereo for click detection
    const stereoHit = new Mesh(
      new BoxGeometry(0.6, 0.5, 0.5),
      new MeshBasicMaterial({ visible: false }),
    );
    stereoHit.position.copy(stereo.position);
    stereoHit.position.y += 0.25;
    stereoHit.rotation.y = stereo.rotation.y;
    state.scene.add(stereoHit);

    // Hover glow - applied to stereo meshes directly
    const glowProxy = { _ei: 0 };
    Object.defineProperty(glowProxy, 'emissiveIntensity', {
      get() { return this._ei; },
      set(v) {
        this._ei = v;
        stereo.traverse((child) => {
          if (child.isMesh && child.material) {
            if (!child.material._cloned) {
              child.material = child.material.clone();
              child.material.emissive = child.material.emissive || new (child.material.color.constructor)(0x446688);
              child.material.emissive.set(0x446688);
              child.material._cloned = true;
            }
            child.material.emissiveIntensity = v;
          }
        });
      },
    });

    state._stereoHit = stereoHit;
    state._stereoRingMat = glowProxy;
  }, undefined, (err) => console.warn('Stereo GLB load error:', err));

  // Music playlist (shuffled)
  const playlist = [
    '/audio/dad/music/05 - A Lifetime.mp3',
    '/audio/dad/music/05 New York State of Mind.mp3',
    '/audio/dad/music/05 Vienna.mp3',
    '/audio/dad/music/06 - Recognize.mp3',
    '/audio/dad/music/13 - Your Song.mp3',
    "/audio/dad/music/13 You're Only Human (Second Wind).mp3",
    '/audio/dad/music/Against The Wind.mp3',
    '/audio/dad/music/Billy Joel - The Stranger - 09. Everybody Has A Dream - The Stranger (Reprise).mp3',
    "/audio/dad/music/You'll Accomp'ny Me.mp3",
  ];

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let shuffled = shuffleArray(playlist);
  let trackIdx = 0;
  const stereoAudio = new Audio();
  stereoAudio.preload = 'auto';

  const artCanvas = document.createElement('canvas');
  artCanvas.width = 512;
  artCanvas.height = 512;
  const artCtx = artCanvas.getContext('2d');
  artCtx.fillStyle = '#222';
  artCtx.fillRect(0, 0, 512, 512);
  const artTex = new CanvasTexture(artCanvas);

  function filenameToTitle(src) {
    let name = src.split('/').pop().replace(/\.\w+$/, '');
    name = name.replace(/^\d+\s*[-.]?\s*/, '');
    name = name.replace(/^Billy Joel - The Stranger - \d+\.\s*/, '');
    return name;
  }

  let currentArtist = '';

  function drawNowPlaying(title, albumArtImg) {
    artCtx.fillStyle = '#1a1a2e';
    artCtx.fillRect(0, 0, 512, 512);

    if (albumArtImg) {
      const artSize = 280;
      const artX = (512 - artSize) / 2;
      const artY = 8;
      artCtx.drawImage(albumArtImg, artX, artY, artSize, artSize);

      artCtx.fillStyle = '#ffd700';
      artCtx.font = 'bold 26px serif';
      artCtx.textAlign = 'center';
      artCtx.fillText('♪ NOW PLAYING ♪', 256, 318);

      artCtx.fillStyle = '#ffffff';
      artCtx.font = 'bold 22px sans-serif';
      let y = 350;
      const words = title.split(' ');
      let line = '';
      for (const word of words) {
        const test = line + word + ' ';
        if (artCtx.measureText(test).width > 440 && line) {
          artCtx.fillText(line.trim(), 256, y);
          line = word + ' ';
          y += 28;
        } else {
          line = test;
        }
      }
      artCtx.fillText(line.trim(), 256, y);

      if (currentArtist) {
        y += 30;
        artCtx.fillStyle = '#aaaacc';
        artCtx.font = 'italic 20px sans-serif';
        artCtx.fillText(currentArtist, 256, y);
      }
    } else {
      artCtx.fillStyle = '#ffd700';
      artCtx.font = 'bold 36px serif';
      artCtx.textAlign = 'center';
      artCtx.fillText('♪ NOW PLAYING ♪', 256, 60);

      artCtx.fillStyle = '#ffffff';
      artCtx.font = '28px sans-serif';
      const words = title.split(' ');
      let line = '';
      let y = 220;
      for (const word of words) {
        const test = line + word + ' ';
        if (artCtx.measureText(test).width > 440 && line) {
          artCtx.fillText(line.trim(), 256, y);
          line = word + ' ';
          y += 36;
        } else {
          line = test;
        }
      }
      artCtx.fillText(line.trim(), 256, y);

      artCtx.fillStyle = '#ffd700';
      artCtx.font = '120px serif';
      artCtx.fillText('♫', 256, 430);
    }

    artTex.needsUpdate = true;
  }

  function drawStopped() {
    artCtx.fillStyle = '#1a1a2e';
    artCtx.fillRect(0, 0, 512, 512);
    artCtx.fillStyle = '#666';
    artCtx.font = 'bold 32px sans-serif';
    artCtx.textAlign = 'center';
    artCtx.fillText('STEREO', 256, 220);
    artCtx.fillText('Click to Play / Stop', 256, 270);
    artCtx.fillText('⏭ to Skip', 256, 320);
    artTex.needsUpdate = true;
  }

  let currentAlbumArt = null;

  function extractAlbumArt(url) {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        jsmediatags.read(new Blob([buf]), {
          onSuccess(tag) {
            currentArtist = tag.tags.artist || tag.tags.TPE1?.data || '';
            const picture = tag.tags.picture;
            if (picture) {
              const { data, format } = picture;
              const bytes = new Uint8Array(data);
              const blob = new Blob([bytes], { type: format });
              const artUrl = URL.createObjectURL(blob);
              const img = new Image();
              img.onload = () => {
                currentAlbumArt = img;
                drawNowPlaying(filenameToTitle(shuffled[trackIdx]), img);
                URL.revokeObjectURL(artUrl);
              };
              img.src = artUrl;
            } else {
              currentAlbumArt = null;
              drawNowPlaying(filenameToTitle(shuffled[trackIdx]), null);
            }
          },
          onError(error) {
            console.warn('Album art extraction failed:', error);
            currentAlbumArt = null;
          },
        });
      })
      .catch((err) => {
        console.warn('Album art fetch failed:', err);
        currentAlbumArt = null;
      });
  }

  function loadTrack(idx) {
    trackIdx = idx;
    stereoAudio.src = shuffled[trackIdx];
    stereoAudio.load();
    currentAlbumArt = null;
    currentArtist = '';
    extractAlbumArt(shuffled[trackIdx]);
  }

  function playTrack() {
    drawNowPlaying(filenameToTitle(shuffled[trackIdx]), currentAlbumArt);
    stereoAudio.play().catch((e) => console.warn('Stereo play failed:', e));
  }

  function nextTrack() {
    trackIdx++;
    if (trackIdx >= shuffled.length) {
      shuffled = shuffleArray(playlist);
      trackIdx = 0;
    }
    loadTrack(trackIdx);
    playTrack();
  }

  stereoAudio.addEventListener('ended', nextTrack);
  loadTrack(0);
  drawStopped();

  // Now-playing display on east wall above the stereo
  const artMesh = new Mesh(
    new PlaneGeometry(0.8, 0.8),
    new MeshBasicMaterial({ map: artTex }),
  );
  artMesh.name = 'stereo_display';
  artMesh.position.set(23.55, 1.60, -2.61);
  artMesh.rotation.y = -1.58;
  artMesh.scale.setScalar(0.386);
  state.scene.add(artMesh);

  // Skip button below the display
  const skipCanvas = document.createElement('canvas');
  skipCanvas.width = 128;
  skipCanvas.height = 128;
  const skipCtx = skipCanvas.getContext('2d');
  skipCtx.fillStyle = '#333';
  skipCtx.fillRect(0, 0, 128, 128);
  skipCtx.fillStyle = '#ffd700';
  skipCtx.font = 'bold 60px sans-serif';
  skipCtx.textAlign = 'center';
  skipCtx.textBaseline = 'middle';
  skipCtx.fillText('⏭', 64, 64);
  const skipTex = new CanvasTexture(skipCanvas);
  const skipBtn = new Mesh(
    new PlaneGeometry(0.3, 0.3),
    new MeshBasicMaterial({ map: skipTex }),
  );
  skipBtn.name = 'stereo_skip';
  skipBtn.position.set(23.55, 1.35, -2.61);
  skipBtn.rotation.y = -1.58;
  skipBtn.scale.setScalar(0.386);
  state.scene.add(skipBtn);

  // Register stereo model as clickable (delayed until GLB loads)
  const waitForStereo = setInterval(() => {
    if (state._stereoHit) {
      clearInterval(waitForStereo);
      state.allFrameTargets.push({
        mesh: state._stereoHit,
        borderMat: state._stereoRingMat,
        target: null,
        contentPos: null,
        play: () => { playTrack(); },
        stop: () => {
          stereoAudio.pause();
          stereoAudio.currentTime = 0;
          drawStopped();
        },
        isPlaying: () => !stereoAudio.paused && !stereoAudio.ended,
      });
    }
  }, 100);

  // Register display as clickable (play/stop) — no teleport (target: null)
  const stereoFrame = {
    mesh: artMesh,
    borderMat: null,
    target: null,
    contentPos: null,
    play: () => { playTrack(); },
    stop: () => {
      stereoAudio.pause();
      stereoAudio.currentTime = 0;
      drawStopped();
    },
    isPlaying: () => !stereoAudio.paused && !stereoAudio.ended,
  };
  state.allFrameTargets.push(stereoFrame);

  // Register skip button — advances track, no teleport
  state.allFrameTargets.push({
    mesh: skipBtn,
    borderMat: null,
    target: null,
    contentPos: null,
    play: () => {
      nextTrack();
      state.activeFrame = stereoFrame;
    },
    stop: () => {},
    isPlaying: () => !stereoAudio.paused && !stereoAudio.ended,
  });
}
