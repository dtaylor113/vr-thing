import {
  Group,
  Vector3,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  CanvasTexture,
  TextureLoader,
  SRGBColorSpace,
  CircleGeometry,
  ShaderMaterial,
} from 'three';
import { state } from './state.js';

const videoLoadPromises = [];
let onProgressCallback = null;

export function onVideoLoadProgress(cb) { onProgressCallback = cb; }

export function allVideosReady() {
  return Promise.all(videoLoadPromises);
}

export function makeTextTexture(text, bg, fg, w = 512, h = 128, fontSize = 56) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  return new CanvasTexture(canvas);
}

function makeNameplateTexture(text) {
  const label = `\u201C${text}\u201D`;
  const w = 1024;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ddccaa';
  ctx.font = `italic 60px Georgia, "Times New Roman", "Palatino Linotype", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, h / 2);
  return new CanvasTexture(canvas);
}

function makeNameplate(text, w) {
  const tex = makeNameplateTexture(text);
  const mesh = new Mesh(
    new PlaneGeometry(Math.min(w + 0.3, 2.4), 0.22),
    new MeshBasicMaterial({ map: tex, transparent: true }),
  );
  return mesh;
}

function filenameToLabel(src) {
  const name = src.split('/').pop().replace(/\.[^.]+$/, '');
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function makeSpeakerIcon() {
  const s = 128;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ddaa44';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(s * 0.28, s * 0.38);
  ctx.lineTo(s * 0.38, s * 0.38);
  ctx.lineTo(s * 0.52, s * 0.25);
  ctx.lineTo(s * 0.52, s * 0.75);
  ctx.lineTo(s * 0.38, s * 0.62);
  ctx.lineTo(s * 0.28, s * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(s * 0.52, s * 0.5, s * 0.12, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(s * 0.52, s * 0.5, s * 0.22, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  const tex = new CanvasTexture(canvas);
  const mesh = new Mesh(
    new CircleGeometry(0.07, 16),
    new MeshBasicMaterial({ map: tex, transparent: true }),
  );
  return mesh;
}

export function createBorderFrame(contentW, contentH, borderW) {
  const mat = new MeshStandardMaterial({
    color: 0x111111, roughness: 0.3, metalness: 0.5,
    emissive: 0x44aaff, emissiveIntensity: 0,
  });
  const g = new Group();
  g.userData.frameMat = mat;
  const hw = contentW / 2 + borderW / 2;
  const hh = contentH / 2 + borderW / 2;
  const depth = 0.02;

  const top = new Mesh(new BoxGeometry(contentW + borderW * 2, borderW, depth), mat);
  top.position.set(0, hh, depth / 2);
  g.add(top);

  const bottom = new Mesh(new BoxGeometry(contentW + borderW * 2, borderW, depth), mat);
  bottom.position.set(0, -hh, depth / 2);
  g.add(bottom);

  const left = new Mesh(new BoxGeometry(borderW, contentH, depth), mat);
  left.position.set(-hw, 0, depth / 2);
  g.add(left);

  const right = new Mesh(new BoxGeometry(borderW, contentH, depth), mat);
  right.position.set(hw, 0, depth / 2);
  g.add(right);

  return g;
}

export function createMuseumPlaque(paragraphs, displayW, pos, rotY, label, { canvasW, canvasH } = {}) {
  const pw = canvasW || 512, ph = canvasH || 900;
  const canvas = document.createElement('canvas');
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f0e8d8';
  ctx.font = 'italic 40px Garamond, "Cormorant Garamond", "Palatino Linotype", "Book Antiqua", serif';
  ctx.textBaseline = 'top';
  const margin = 40;
  const lineH = 54;
  const paraGap = 40;
  const maxW = pw - margin * 2;

  function wrapText(text, x, startY) {
    const words = text.split(' ');
    let line = '';
    let y = startY;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, y);
        line = word + ' ';
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line.trim()) { ctx.fillText(line.trim(), x, y); y += lineH; }
    return y;
  }

  let curY = margin;
  for (let i = 0; i < paragraphs.length; i++) {
    curY = wrapText(paragraphs[i], margin, curY);
    if (i < paragraphs.length - 1) curY += paraGap;
  }

  const tex = new CanvasTexture(canvas);
  const displayH = displayW * (ph / pw);
  const mesh = new Mesh(
    new PlaneGeometry(displayW, displayH),
    new MeshBasicMaterial({ map: tex, transparent: true }),
  );
  mesh.name = 'plaque:' + (label || 'museum');
  mesh.position.copy(pos);
  mesh.rotation.y = rotY;
  state.scene.add(mesh);

  const standoff = 1.5;
  const target = new Vector3(
    pos.x + Math.sin(rotY) * standoff,
    1.6,
    pos.z + Math.cos(rotY) * standoff,
  );
  state.allFrameTargets.push({
    mesh,
    borderMat: null,
    target,
    contentPos: pos.clone(),
    play: null,
    stop: null,
    isPlaying: () => false,
  });

  return mesh;
}

function registerFrame(mesh, border, contentH, contentW, pos, rotY, play, stop, isPlaying) {
  const standoff = 1.5;
  const target = new Vector3(
    pos.x + Math.sin(rotY) * standoff,
    Math.max(0, pos.y - 1.6),
    pos.z + Math.cos(rotY) * standoff,
  );
  state.allFrameTargets.push({
    mesh,
    borderMat: border.userData.frameMat,
    target,
    contentPos: pos.clone(),
    play: play || null,
    stop: stop || null,
    isPlaying: isPlaying || (() => false),
  });
}

export function createFramedPhoto(src, photoW, photoH, pos, rotY, { audioSrc } = {}) {
  const group = new Group();
  group.name = 'photo:' + src.split('/').pop();

  const border = createBorderFrame(photoW, photoH, 0.07);
  group.add(border);

  const tex = new TextureLoader().load(src);
  const photo = new Mesh(
    new PlaneGeometry(photoW, photoH),
    new MeshBasicMaterial({ map: tex }),
  );
  photo.position.z = 0.015;
  group.add(photo);

  const hitArea = new Mesh(
    new PlaneGeometry(photoW + 0.16, photoH + 0.16),
    new MeshBasicMaterial({ visible: false }),
  );
  hitArea.position.z = 0.02;
  group.add(hitArea);

  const nameplate = makeNameplate(filenameToLabel(src), photoW);
  nameplate.position.set(0, -(photoH / 2) - 0.2, 0.05);
  group.add(nameplate);

  group.position.copy(pos);
  group.rotation.y = rotY;
  state.scene.add(group);

  let play = null;
  let stop = null;
  let isPlaying = () => false;

  if (audioSrc) {
    const audio = new Audio(audioSrc);
    audio.preload = 'auto';
    play = () => {
      audio.currentTime = 0;
      audio.play().catch((e) => console.warn('Audio play failed:', audioSrc, e));
    };
    stop = () => { audio.pause(); audio.currentTime = 0; };
    isPlaying = () => !audio.paused && !audio.ended;

    const speaker = makeSpeakerIcon();
    speaker.position.set(photoW / 2 + 0.22, 0, 0.13);
    group.add(speaker);
  }

  registerFrame(hitArea, border, photoH, photoW, pos, rotY, play, stop, isPlaying);

  return group;
}

export function createVideoScreen(src, displayWidth, pos, rotY, { borderWidth } = {}) {
  const vid = document.createElement('video');
  vid.src = src;
  vid.crossOrigin = 'anonymous';
  vid.loop = true;
  vid.playsInline = true;
  vid.preload = 'metadata';
  vid.addEventListener('error', () => console.warn('Video error:', src, vid.error?.message));

  const group = new Group();
  group.name = 'video:' + src.split('/').pop();
  group.position.copy(pos);
  group.rotation.y = rotY;
  state.scene.add(group);

  const entry = { vid, playing: false, ctx: null, canvas: null, tex: null };
  state.allVideos.push(entry);

  const play = () => {
    if (vid.error || vid.readyState === 0) vid.load();
    vid.preload = 'auto';
    vid.play().catch((e) => console.warn('Video play failed:', src, e));
    entry.playing = true;
  };
  const stop = () => {
    vid.pause();
    vid.preload = 'metadata';
    entry.playing = false;
  };
  const isPlaying = () => !vid.paused && !vid.ended;

  let thumbnailDone = false;
  const ready = new Promise((resolve) => {
    vid.addEventListener('loadedmetadata', () => {
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 480;
      const aspect = vh / vw;
      const h = displayWidth * aspect;
      const texW = 512;
      const texH = Math.max(1, Math.round(texW * aspect));

      const canvas = document.createElement('canvas');
      canvas.width = texW;
      canvas.height = texH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, texW, texH);

      const tex = new CanvasTexture(canvas);
      tex.colorSpace = SRGBColorSpace;

      entry.ctx = ctx;
      entry.canvas = canvas;
      entry.tex = tex;

      const bw = borderWidth || 0.06;
      const border = createBorderFrame(displayWidth, h, bw);
      group.add(border);

      const screen = new Mesh(
        new PlaneGeometry(displayWidth, h),
        new MeshBasicMaterial({ map: tex }),
      );
      screen.position.z = 0.015;
      group.add(screen);

      const hitArea = new Mesh(
        new PlaneGeometry(displayWidth + 0.14, h + 0.14),
        new MeshBasicMaterial({ visible: false }),
      );
      hitArea.position.z = 0.02;
      group.add(hitArea);

      const nameplate = makeNameplate(filenameToLabel(src), displayWidth);
      nameplate.position.set(0, -(h / 2) - 0.2, 0.05);
      group.add(nameplate);

      registerFrame(hitArea, border, h, displayWidth, pos, rotY, play, stop, isPlaying);

      vid.currentTime = Math.min(2.0, vid.duration * 0.05);
    });

    vid.addEventListener('seeked', function grabThumbnail() {
      if (thumbnailDone || !entry.ctx) return;
      if (vid.readyState >= vid.HAVE_CURRENT_DATA) {
        entry.ctx.drawImage(vid, 0, 0, entry.canvas.width, entry.canvas.height);
        entry.tex.needsUpdate = true;
        thumbnailDone = true;
        resolve();
        if (onProgressCallback) onProgressCallback();
      }
    });

    setTimeout(() => {
      if (!thumbnailDone) { resolve(); if (onProgressCallback) onProgressCallback(); }
    }, 10000);
  });
  videoLoadPromises.push(ready);

  return entry;
}

export function createStereoPair(leftSrc, rightSrc, displayWidth, pos, rotY, label) {
  const loader = new TextureLoader();
  const leftTex = loader.load(leftSrc);
  leftTex.colorSpace = SRGBColorSpace;
  const rightTex = loader.load(rightSrc);
  rightTex.colorSpace = SRGBColorSpace;

  const img = new Image();
  img.src = leftSrc;
  img.onload = () => {
    const aspect = img.height / img.width;
    const h = displayWidth * aspect;
    const geom = new PlaneGeometry(displayWidth, h);

    const leftEye = new Mesh(geom, new MeshBasicMaterial({ map: leftTex }));
    leftEye.layers.set(1);

    const rightEye = new Mesh(geom, new MeshBasicMaterial({ map: rightTex }));
    rightEye.layers.set(2);

    // Desktop fallback shows the left image
    const flatView = new Mesh(geom, new MeshBasicMaterial({ map: leftTex }));
    flatView.layers.set(0);

    const border = createBorderFrame(displayWidth, h, 0.06);
    const nameLabel = label || leftSrc.split('/').pop().replace(/Left/i, '').replace(/\.\w+$/, '');
    const nameplate = makeNameplate(filenameToLabel(nameLabel), displayWidth);
    nameplate.position.set(0, -(h / 2) - 0.2, 0.05);

    const hitArea = new Mesh(
      new PlaneGeometry(displayWidth + 0.14, h + 0.14),
      new MeshBasicMaterial({ visible: false }),
    );
    hitArea.position.z = 0.02;

    const group = new Group();
    group.add(leftEye);
    group.add(rightEye);
    group.add(flatView);
    group.add(border);
    group.add(nameplate);
    group.add(hitArea);
    group.position.copy(pos);
    group.rotation.y = rotY;
    group.name = 'stereo_' + nameLabel;
    state.scene.add(group);

    registerFrame(hitArea, border, h, displayWidth, pos, rotY);

    function updateVisibility() {
      const inVR = state.renderer?.xr?.isPresenting;
      flatView.visible = !inVR;
      leftEye.visible = inVR;
      rightEye.visible = inVR;
    }
    updateVisibility();

    if (!state._anaglyphUpdaters) state._anaglyphUpdaters = [];
    state._anaglyphUpdaters.push(updateVisibility);
  };
}

const anaglyphVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const anaglyphLeftFragShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uTexture, vUv);
    float lum = c.r;
    gl_FragColor = vec4(lum, lum * 0.7 + c.g * 0.3, lum * 0.7 + c.b * 0.3, 1.0);
  }
`;

const anaglyphRightFragShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uTexture, vUv);
    float lum = (c.g + c.b) * 0.5;
    gl_FragColor = vec4(lum * 0.7 + c.r * 0.3, lum * 0.7 + c.g * 0.3, lum * 0.7 + c.b * 0.3, 1.0);
  }
`;

export function createAnaglyphStereo(src, displayWidth, pos, rotY) {
  const loader = new TextureLoader();
  const tex = loader.load(src);
  tex.colorSpace = SRGBColorSpace;

  const img = new Image();
  img.src = src;
  img.onload = () => {
    const aspect = img.height / img.width;
    const h = displayWidth * aspect;
    const geom = new PlaneGeometry(displayWidth, h);

    const leftMat = new ShaderMaterial({
      uniforms: { uTexture: { value: tex } },
      vertexShader: anaglyphVertexShader,
      fragmentShader: anaglyphLeftFragShader,
    });
    const rightMat = new ShaderMaterial({
      uniforms: { uTexture: { value: tex } },
      vertexShader: anaglyphVertexShader,
      fragmentShader: anaglyphRightFragShader,
    });

    // Fallback flat material for desktop (shows original anaglyph)
    const flatMat = new MeshBasicMaterial({ map: tex });

    const leftEye = new Mesh(geom, leftMat);
    leftEye.layers.set(1);

    const rightEye = new Mesh(geom, rightMat);
    rightEye.layers.set(2);

    const flatView = new Mesh(geom, flatMat);
    flatView.layers.set(0);

    const border = createBorderFrame(displayWidth, h, 0.06);
    const nameplate = makeNameplate(filenameToLabel(src), displayWidth);
    nameplate.position.set(0, -(h / 2) - 0.2, 0.05);

    const hitArea = new Mesh(
      new PlaneGeometry(displayWidth + 0.14, h + 0.14),
      new MeshBasicMaterial({ visible: false }),
    );
    hitArea.position.z = 0.02;

    const group = new Group();
    group.add(leftEye);
    group.add(rightEye);
    group.add(flatView);
    group.add(border);
    group.add(nameplate);
    group.add(hitArea);
    group.position.copy(pos);
    group.rotation.y = rotY;
    group.name = 'anaglyph_' + src.split('/').pop().replace(/\.\w+$/, '');
    state.scene.add(group);

    registerFrame(hitArea, border, h, displayWidth, pos, rotY);

    function updateVisibility() {
      const inVR = state.renderer?.xr?.isPresenting;
      flatView.visible = !inVR;
      leftEye.visible = inVR;
      rightEye.visible = inVR;
    }
    updateVisibility();

    if (!state._anaglyphUpdaters) state._anaglyphUpdaters = [];
    state._anaglyphUpdaters.push(updateVisibility);
  };
}

