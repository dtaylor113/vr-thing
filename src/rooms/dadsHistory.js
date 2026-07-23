import { Group, Vector3, TextureLoader, PlaneGeometry, Box3, BoxGeometry, MeshBasicMaterial, MeshStandardMaterial, Mesh, SRGBColorSpace, CanvasTexture, SpotLight } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import jsmediatags from 'jsmediatags';
import { createRoom, createDoor, createExitButton, ROOM_W, ROOM_D } from '../room.js';
import { createFramedPhoto, createVideoScreen, createAnaglyphStereo, createStereoPair, createMuseumPlaque, makeTextTexture, createBorderFrame } from '../content.js';
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
  { src: '/images/dad/childhood/TheGang.jpg', w: 1839, h: 1839 },
  { src: '/images/dad/childhood/DaveXMass.jpg', w: 1839, h: 1840 },
  { src: '/images/dad/childhood/DaveBirthday.jpg', w: 1860, h: 1860 },
];

export function buildDadsHistoryRoom() {
  const origin = new Vector3(HIST_X, 0, 0);

  createRoom(origin, [
    { label: 'Childhood',     x: HIST_X,              z: -ROOM_D / 2, w: ROOM_W, ry: 0 },
    { label: '',               x: HIST_X + ROOM_W / 2, z: 0,           w: ROOM_D, ry: -Math.PI / 2 },
    { label: 'Digital Art',    x: HIST_X,              z: ROOM_D / 2,  w: ROOM_W, ry: Math.PI },
    { label: '3D Stereo Art', x: HIST_X - ROOM_W / 2, z: 0,           w: ROOM_D, ry: Math.PI / 2 },
  ], { floor: 0xffffff, wall: 0xffffff, ceiling: 0x223322 }, {
    floor: {
      color: '/textures/wood-flooring/WoodFloor064_1K-PNG_Color.png',
      repeatX: 4, repeatY: 4,
    },
    wall: {
      color: '/textures/book-pattern-fabric/book_pattern_col1_1k.png',
      repeatX: 6, repeatY: 3,
    },
  });

  // Childhood photo grid (back wall, z = -5)
  const FRAME_MAX = 0.8;
  const COLS = 5;
  const ROWS = 3;
  const colSpacing = 1.7;
  const rowYs = [3.1, 1.9, 0.75];
  const startX = HIST_X - 3.05;
  const wallZ = -ROOM_D / 2 + 0.04;

  childhoodPhotos.forEach((photo, i) => {
    const col = Math.floor(i / ROWS);
    const row = i % ROWS;
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

  // Museum plaque for Photoshop/KPT art (south wall, lower right)
  createMuseumPlaque([
    'These pieces were created entirely in Adobe Photoshop using KPT (Kai\u2019s Power Tools) \u2014 a suite of experimental filters and effects popular in the late 1990s. Layers of generated textures, fractals, and color manipulations were composited to produce each image.',
  ], 1.3, new Vector3(19.90, 1.40, 4.91), Math.PI, 'kpt_art');

  // EXIT VR button (front wall)
  createExitButton(new Vector3(HIST_X + 3.5, 2.8, ROOM_D / 2 - 0.15), Math.PI);

  // Door back to Main Room (front wall)
  createDoor(
    'Main Room',
    new Vector3(HIST_X + 3.5, 1.0, ROOM_D / 2 - 0.05),
    Math.PI,
    new Vector3(0, 2.2, 0),
  );

  // Titans of Tennis cartoon on east wall, above desk
  const ewx = HIST_X + ROOM_W / 2 - 0.04;
  const titansPhotoPos = new Vector3(24.96, 2.70, -1.80);
  createFramedPhoto("/images/dad/TitansOfTennisWhat'sTheScore.JPEG", 1.5, 0.72,
    titansPhotoPos, -Math.PI / 2, { hideNameplate: true, standoff: 2.2 });

  // Popup video viewer for Titans of Tennis (positioned on wall below the cartoon)
  const titansVid = document.createElement('video');
  titansVid.src = '/video/TitansOfTennis.mp4';
  titansVid.crossOrigin = 'anonymous';
  titansVid.preload = 'metadata';
  titansVid.playsInline = true;

  const titansCanvas = document.createElement('canvas');
  titansCanvas.width = 1280;
  titansCanvas.height = 720;
  const titansCtx = titansCanvas.getContext('2d');
  titansCtx.fillStyle = '#000';
  titansCtx.fillRect(0, 0, 1280, 720);
  const titansTex = new CanvasTexture(titansCanvas);

  const titansGroup = new Group();
  titansGroup.name = 'titans_viewer';
  titansGroup.visible = false;
  titansGroup.position.set(24.61, 3.05, -3.75);
  titansGroup.rotation.y = -1.2707963267948963;
  titansGroup.scale.setScalar(1.1);
  state.scene.add(titansGroup);

  const tvW = 2.0, tvH = tvW * (9 / 16);
  const tvBg = new Mesh(
    new PlaneGeometry(tvW + 0.08, tvH + 0.08),
    new MeshStandardMaterial({ color: 0x111111, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  );
  tvBg.position.z = -0.005;
  titansGroup.add(tvBg);

  const tvScreen = new Mesh(
    new PlaneGeometry(tvW, tvH),
    new MeshBasicMaterial({ map: titansTex }),
  );
  titansGroup.add(tvScreen);

  const titansVideoEntry = {
    vid: titansVid,
    canvas: titansCanvas,
    ctx: titansCtx,
    tex: titansTex,
    playing: false,
  };
  state.allVideos.push(titansVideoEntry);

  function startTitansVideo() {
    titansGroup.visible = true;
    titansVid.currentTime = 0;
    titansVid.play().catch((e) => {
      console.warn('Titans video play failed, retrying:', e);
      titansVid.addEventListener('canplay', () => titansVid.play().catch(() => {}), { once: true });
    });
    titansVideoEntry.playing = true;
  }

  function stopTitansVideo() {
    titansVid.pause();
    titansVid.currentTime = 0;
    titansVideoEntry.playing = false;
    titansGroup.visible = false;
  }

  const titansFrame = state.allFrameTargets[state.allFrameTargets.length - 1];
  titansFrame.play = startTitansVideo;
  titansFrame.stop = stopTitansVideo;
  titansFrame.isPlaying = () => titansVideoEntry.playing;

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
    dave.position.set(24.74, 0.49, 0.32);
    dave.rotation.y = -2.1;
    state.scene.add(dave);
  });

  // --- Portfolio Viewer (pre-rendered page images) ---
  const TOTAL_PAGES = 26;
  let currentPage = 1;

  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = 1440;
  pageCanvas.height = 1080;
  const pageCtx = pageCanvas.getContext('2d');
  pageCtx.fillStyle = '#222';
  pageCtx.fillRect(0, 0, 1440, 1080);
  const pdfTex = new CanvasTexture(pageCanvas);

  const pdfViewerGroup = new Group();
  pdfViewerGroup.name = 'pdf_viewer';
  pdfViewerGroup.position.set(23.30, 2.20, -0.01);
  pdfViewerGroup.rotation.y = -1.7;
  pdfViewerGroup.visible = false;

  const pdfDisplayW = 1.6;
  const pdfDisplayH = 1.2;

  const pdfBg = new Mesh(
    new PlaneGeometry(pdfDisplayW + 0.06, pdfDisplayH + 0.06),
    new MeshBasicMaterial({ color: 0x111111, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  );
  pdfBg.position.z = -0.005;
  pdfViewerGroup.add(pdfBg);

  const pdfDisplay = new Mesh(
    new PlaneGeometry(pdfDisplayW, pdfDisplayH),
    new MeshBasicMaterial({ map: pdfTex }),
  );
  pdfViewerGroup.add(pdfDisplay);

  const counterCanvas = document.createElement('canvas');
  counterCanvas.width = 256;
  counterCanvas.height = 64;
  const counterCtx = counterCanvas.getContext('2d');
  const counterTex = new CanvasTexture(counterCanvas);

  function updateCounter() {
    counterCtx.fillStyle = '#111';
    counterCtx.fillRect(0, 0, 256, 64);
    counterCtx.fillStyle = '#fff';
    counterCtx.font = 'bold 28px sans-serif';
    counterCtx.textAlign = 'center';
    counterCtx.textBaseline = 'middle';
    counterCtx.fillText(`Page ${currentPage} of ${TOTAL_PAGES}`, 128, 32);
    counterTex.needsUpdate = true;
  }

  const counterMesh = new Mesh(
    new PlaneGeometry(0.42, 0.10),
    new MeshBasicMaterial({ map: counterTex }),
  );
  counterMesh.position.set(0, pdfDisplayH / 2 + 0.16, 0.02);
  pdfViewerGroup.add(counterMesh);

  const prevCanvas = document.createElement('canvas');
  prevCanvas.width = 128;
  prevCanvas.height = 64;
  const prevCtx = prevCanvas.getContext('2d');
  prevCtx.fillStyle = '#333';
  prevCtx.fillRect(0, 0, 128, 64);
  prevCtx.fillStyle = '#ffd700';
  prevCtx.font = 'bold 22px sans-serif';
  prevCtx.textAlign = 'center';
  prevCtx.textBaseline = 'middle';
  prevCtx.fillText('\u25C0 Prev', 64, 32);
  const prevTex = new CanvasTexture(prevCanvas);
  const prevBtn = new Mesh(
    new PlaneGeometry(0.25, 0.10),
    new MeshBasicMaterial({ map: prevTex }),
  );
  prevBtn.position.set(-0.42, pdfDisplayH / 2 + 0.16, 0.02);
  pdfViewerGroup.add(prevBtn);

  const nextCanvas = document.createElement('canvas');
  nextCanvas.width = 128;
  nextCanvas.height = 64;
  const nextCtx = nextCanvas.getContext('2d');
  nextCtx.fillStyle = '#333';
  nextCtx.fillRect(0, 0, 128, 64);
  nextCtx.fillStyle = '#ffd700';
  nextCtx.font = 'bold 22px sans-serif';
  nextCtx.textAlign = 'center';
  nextCtx.textBaseline = 'middle';
  nextCtx.fillText('Next \u25B6', 64, 32);
  const nextTex = new CanvasTexture(nextCanvas);
  const nextBtn = new Mesh(
    new PlaneGeometry(0.25, 0.10),
    new MeshBasicMaterial({ map: nextTex }),
  );
  nextBtn.position.set(0.42, pdfDisplayH / 2 + 0.16, 0.02);
  pdfViewerGroup.add(nextBtn);

  const rewindCanvas = document.createElement('canvas');
  rewindCanvas.width = 128;
  rewindCanvas.height = 64;
  const rewindCtx = rewindCanvas.getContext('2d');
  rewindCtx.fillStyle = '#333';
  rewindCtx.fillRect(0, 0, 128, 64);
  rewindCtx.fillStyle = '#ffd700';
  rewindCtx.font = 'bold 22px sans-serif';
  rewindCtx.textAlign = 'center';
  rewindCtx.textBaseline = 'middle';
  rewindCtx.fillText('\u23EE Pg 1', 64, 32);
  const rewindTex = new CanvasTexture(rewindCanvas);
  const rewindBtn = new Mesh(
    new PlaneGeometry(0.25, 0.10),
    new MeshBasicMaterial({ map: rewindTex }),
  );
  rewindBtn.position.set(-0.78, pdfDisplayH / 2 + 0.16, 0.02);
  pdfViewerGroup.add(rewindBtn);

  const closeCanvas = document.createElement('canvas');
  closeCanvas.width = 64;
  closeCanvas.height = 64;
  const closeCtx = closeCanvas.getContext('2d');
  closeCtx.fillStyle = '#cc0000';
  closeCtx.fillRect(0, 0, 64, 64);
  closeCtx.fillStyle = '#fff';
  closeCtx.font = 'bold 40px sans-serif';
  closeCtx.textAlign = 'center';
  closeCtx.textBaseline = 'middle';
  closeCtx.fillText('\u2715', 32, 32);
  const closeTex = new CanvasTexture(closeCanvas);
  const closeBtn = new Mesh(
    new PlaneGeometry(0.12, 0.12),
    new MeshBasicMaterial({ map: closeTex }),
  );
  closeBtn.position.set(pdfDisplayW / 2 + 0.02, pdfDisplayH / 2 + 0.16, 0.02);
  pdfViewerGroup.add(closeBtn);

  const pcRotY = -1.7;
  state.scene.add(pdfViewerGroup);

  function renderPage(pageNum) {
    const img = new Image();
    const padded = String(pageNum).padStart(2, '0');
    img.src = `/images/dad/portfolio/page_${padded}.jpg`;
    img.onload = () => {
      pageCtx.drawImage(img, 0, 0, 1440, 1080);
      pdfTex.needsUpdate = true;
      updateCounter();
    };
    img.onerror = () => {
      pageCtx.fillStyle = '#222';
      pageCtx.fillRect(0, 0, 1440, 1080);
      pageCtx.fillStyle = '#ff4444';
      pageCtx.font = 'bold 48px sans-serif';
      pageCtx.textAlign = 'center';
      pageCtx.fillText(`Page ${pageNum} not found`, 720, 540);
      pdfTex.needsUpdate = true;
    };
  }

  // Add border frame around PDF display for hover highlighting
  const pdfBorder = createBorderFrame(pdfDisplayW, pdfDisplayH, 0.06);
  pdfViewerGroup.add(pdfBorder);

  // Invisible hit area for raycasting on the PDF viewer
  const pdfHitArea = new Mesh(
    new PlaneGeometry(pdfDisplayW + 0.12, pdfDisplayH + 0.12),
    new MeshBasicMaterial({ visible: false }),
  );
  pdfHitArea.position.z = 0.01;
  pdfViewerGroup.add(pdfHitArea);

  // --- "Work" section on east wall (toggled by computer click) ---
  // PDF viewer on the right side (lower Z = right when facing east wall)
  const workWallX = ewx;
  const pdfZ = 1.2;
  pdfViewerGroup.position.set(workWallX, 2.3, pdfZ);
  pdfViewerGroup.rotation.y = -Math.PI / 2;

  // Hackathon videos stacked vertically on the left side (higher Z = left)
  const hackZ = 3.5;
  createVideoScreen('/video/Dave/DavesHackathon_2022.mp4', 1.1,
    new Vector3(24.96, 3.05, hackZ), -Math.PI / 2, { keepActiveFrame: true });
  createVideoScreen('/video/Dave/DavesHackathon2023.mp4', 1.1,
    new Vector3(24.96, 2.05, hackZ), -Math.PI / 2, { keepActiveFrame: true });
  createVideoScreen('/video/Dave/DavesHackathon2025.mp4', 1.1,
    new Vector3(24.96, 1.10, hackZ), -Math.PI / 2, { keepActiveFrame: true });

  // "Work" wall title centered above the work content
  const workCenterZ = (pdfZ + hackZ) / 2;
  const workTitleTex = makeTextTexture('Work', 'transparent', '#aabbcc', 1024, 128, 72);
  const workTitle = new Mesh(
    new PlaneGeometry(2.0, 0.3),
    new MeshBasicMaterial({ map: workTitleTex, transparent: true }),
  );
  workTitle.position.set(workWallX - 0.02, 3.6, workCenterZ);
  workTitle.rotation.y = -Math.PI / 2;
  workTitle.visible = false;
  state.scene.add(workTitle);

  // Spotlight illuminating the Work section from above
  const workSpot = new SpotLight(0xffeedd, 0, 6, Math.PI / 10, 0.6, 1);
  workSpot.position.set(workWallX - 1.5, 3.9, workCenterZ);
  workSpot.target.position.set(workWallX, 2.0, workCenterZ);
  state.scene.add(workSpot);
  state.scene.add(workSpot.target);

  // Track hackathon video names for show/hide
  const hackathonVideoNames = ['video:DavesHackathon_2022.mp4', 'video:DavesHackathon2023.mp4', 'video:DavesHackathon2025.mp4'];


  function setWorkSectionVisible(visible) {
    pdfViewerGroup.visible = visible;
    workTitle.visible = visible;
    workSpot.intensity = visible ? 40 : 0;
    // Show/hide hackathon video frames
    for (const name of hackathonVideoNames) {
      const obj = state.scene.getObjectByName(name);
      if (obj) obj.visible = visible;
    }
    // Toggle Dave photo and wooden frame inversely
    const davePhoto = state.scene.getObjectByName('Dave_photo');
    const woodenFrame = state.scene.getObjectByName('wooden_frame');
    if (davePhoto) davePhoto.visible = !visible;
    if (woodenFrame) woodenFrame.visible = !visible;
  }

  // Hide hackathon videos initially (they appear when computer is clicked)
  setTimeout(() => {
    for (const name of hackathonVideoNames) {
      const obj = state.scene.getObjectByName(name);
      if (obj) obj.visible = false;
    }
  }, 2000);

  const pcFrame = {
    mesh: null,
    borderMat: null,
    target: null,
    contentPos: null,
    play: () => {
      setWorkSectionVisible(true);
      renderPage(currentPage);
    },
    stop: () => {
      setWorkSectionVisible(false);
    },
    isPlaying: () => pdfViewerGroup.visible,
  };

  // Register PDF viewer as a clickable frame (teleport to eye level in front of it)
  const pdfBorderMat = pdfBorder.userData.frameMat;
  state.allFrameTargets.push({
    mesh: pdfHitArea,
    borderMat: pdfBorderMat,
    target: new Vector3(workWallX - 2.0, 1.6, pdfZ),
    contentPos: new Vector3(workWallX, 2.3, pdfZ),
    keepActiveFrame: true,
    play: () => { state.activeFrame = pcFrame; },
    stop: () => {},
    isPlaying: () => false,
  });

  gltfLoader.load('/models/retro-pc.glb', (gltf) => {
    const pc = gltf.scene;
    pc.name = 'retro_pc';
    pc.scale.setScalar(0.004806);
    pc.position.set(23.95, 1.15, -1.14);
    pc.rotation.y = pcRotY;
    state.scene.add(pc);

    const pcHit = new Mesh(
      new BoxGeometry(0.6, 0.5, 0.5),
      new MeshBasicMaterial({ visible: false }),
    );
    pcHit.position.copy(pc.position);
    pcHit.position.y += 0.25;
    pcHit.rotation.y = pc.rotation.y;
    state.scene.add(pcHit);

    const pcGlowProxy = { _ei: 0 };
    Object.defineProperty(pcGlowProxy, 'emissiveIntensity', {
      get() { return this._ei; },
      set(v) {
        this._ei = v;
        pc.traverse((child) => {
          if (child.isMesh && child.material) {
            if (!child.material._cloned) {
              child.material = child.material.clone();
              child.material.emissive = child.material.emissive || new (child.material.color.constructor)(0x44aaff);
              child.material.emissive.set(0x44aaff);
              child.material._cloned = true;
            }
            child.material.emissiveIntensity = v;
          }
        });
      },
    });

    state._pcHit = pcHit;
    state._pcGlow = pcGlowProxy;
  }, undefined, (err) => console.warn('Retro PC GLB load error:', err));

  const waitForPC = setInterval(() => {
    if (state._pcHit) {
      clearInterval(waitForPC);
      pcFrame.mesh = state._pcHit;
      pcFrame.borderMat = state._pcGlow;
      state.allFrameTargets.push(pcFrame);
    }
  }, 100);

  state.allFrameTargets.push({
    mesh: prevBtn,
    borderMat: null,
    target: null,
    contentPos: null,
    isSubControl: true,
    play: () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
      state.activeFrame = pcFrame;
    },
    stop: () => {},
    isPlaying: () => pdfViewerGroup.visible,
  });

  state.allFrameTargets.push({
    mesh: nextBtn,
    borderMat: null,
    target: null,
    contentPos: null,
    isSubControl: true,
    play: () => {
      if (currentPage < TOTAL_PAGES) {
        currentPage++;
        renderPage(currentPage);
      }
      state.activeFrame = pcFrame;
    },
    stop: () => {},
    isPlaying: () => pdfViewerGroup.visible,
  });

  state.allFrameTargets.push({
    mesh: rewindBtn,
    borderMat: null,
    target: null,
    contentPos: null,
    isSubControl: true,
    play: () => {
      currentPage = 1;
      renderPage(currentPage);
      state.activeFrame = pcFrame;
    },
    stop: () => {},
    isPlaying: () => pdfViewerGroup.visible,
  });

  state.allFrameTargets.push({
    mesh: closeBtn,
    borderMat: null,
    target: null,
    contentPos: null,
    isSubControl: true,
    play: () => {
      setWorkSectionVisible(false);
      state.activeFrame = null;
    },
    stop: () => {},
    isPlaying: () => pdfViewerGroup.visible,
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
    new Vector3(15.04, 1.20, -3.10), Math.PI / 2);
  createAnaglyphStereo('/images/dad/Art/Stereos/SpencerBeach.png', 0.8,
    new Vector3(15.04, 1.20, -1.40), Math.PI / 2);
  createAnaglyphStereo('/images/dad/Art/Stereos/TreeOnTheBeach.png', 0.8,
    new Vector3(15.04, 1.20, 1.85), Math.PI / 2);
  createAnaglyphStereo('/images/dad/Art/Stereos/MasonSpencerPool.png', 0.8,
    new Vector3(15.04, 1.20, 3.25), Math.PI / 2);

  // Museum-style text plaque on west wall (3D Stereo Art)
  createMuseumPlaque([
    'These digital scenes were composed in Bryce 3D (ca.\u00A01998), where I arranged imported photos, 3D objects, and landscapes into a virtual set. A camera within the scene was then shifted left and right to capture each eye\u2019s perspective, and the two renders were colorized red and cyan in Photoshop and merged into a single anaglyph image.',
    'The photographs were captured with a digital camera mounted on a sliding dolly. Two shots, inches apart, were combined and colorized in Photoshop using the same technique.',
    'Originally viewed through cardboard 3D glasses, these images are presented here in true stereoscopic 3D through VR mode.',
  ], 1.5, new Vector3(15.04, 0.75, 0.20), Math.PI / 2, 'stereo_art', { canvasW: 800, canvasH: 1100 });
  state.scene.getObjectByName('plaque:stereo_art').scale.setScalar(1.21);

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
    stereo.position.set(23.98, 1.15, -2.28);
    stereo.rotation.y = -1.58;
    state.scene.add(stereo);

    // Invisible hit box over the entire stereo (body + speakers)
    const stereoHit = new Mesh(
      new BoxGeometry(1.6, 0.6, 1.6),
      new MeshBasicMaterial({ visible: false }),
    );
    stereoHit.position.copy(stereo.position);
    stereoHit.position.y += 0.2;
    stereoHit.rotation.y = stereo.rotation.y;
    state.scene.add(stereoHit);

    // Hover highlight — spotlight from above
    const hoverSpot = new SpotLight(0xeeeeff, 0, 0, Math.PI / 12, 0.7, 0);
    hoverSpot.position.set(stereo.position.x, stereo.position.y + 2.5, stereo.position.z);
    hoverSpot.target = stereo;
    state.scene.add(hoverSpot);
    state.scene.add(hoverSpot.target);

    const glowProxy = { _ei: 0 };
    Object.defineProperty(glowProxy, 'emissiveIntensity', {
      get() { return this._ei; },
      set(v) {
        this._ei = v;
        hoverSpot.intensity = v * 30;
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
    '/audio/dad/music/11 - Seasons in the Sun.mp3',
    '/audio/dad/music/03 - Fire and Rain.mp3',
    '/audio/dad/music/03 - Your Smiling Face - Taylor, James.mp3',
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
  stereoAudio.preload = 'none';

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
  }

  function playTrack() {
    if (!stereoAudio.src) loadTrack(trackIdx);
    extractAlbumArt(shuffled[trackIdx]);
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
  stereoAudio.addEventListener('error', () => {
    console.warn('Stereo track error, skipping:', shuffled[trackIdx]);
    nextTrack();
  });
  drawStopped();

  // Now-playing display on east wall above the stereo
  const artMesh = new Mesh(
    new PlaneGeometry(0.8, 0.8),
    new MeshBasicMaterial({ map: artTex }),
  );
  artMesh.name = 'stereo_display';
  artMesh.position.set(23.67, 1.75, -2.30);
  artMesh.rotation.y = -1.58;
  artMesh.scale.setScalar(0.514);
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
  skipBtn.position.set(23.58, 1.35, -2.21);
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
        keepActiveFrame: true,
        play: () => { shuffled = shuffleArray(playlist); trackIdx = 0; loadTrack(0); playTrack(); },
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
    keepActiveFrame: true,
    play: () => { shuffled = shuffleArray(playlist); trackIdx = 0; loadTrack(0); playTrack(); },
    stop: () => {
      stereoAudio.pause();
      stereoAudio.currentTime = 0;
      stereoAudio.src = '';
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
    isSubControl: true,
    play: () => {
      nextTrack();
      state.activeFrame = stereoFrame;
    },
    stop: () => {},
    isPlaying: () => !stereoAudio.paused && !stereoAudio.ended,
  });
}
