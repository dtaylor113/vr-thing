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
  const depth = 0.12;

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

  const border = createBorderFrame(photoW, photoH, 0.07);
  group.add(border);

  const tex = new TextureLoader().load(src);
  const photo = new Mesh(
    new PlaneGeometry(photoW, photoH),
    new MeshBasicMaterial({ map: tex }),
  );
  photo.position.z = 0.1;
  group.add(photo);

  const hitArea = new Mesh(
    new PlaneGeometry(photoW + 0.16, photoH + 0.16),
    new MeshBasicMaterial({ visible: false }),
  );
  hitArea.position.z = 0.12;
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

export function createVideoScreen(src, displayWidth, pos, rotY) {
  const vid = document.createElement('video');
  vid.src = src;
  vid.crossOrigin = 'anonymous';
  vid.loop = true;
  vid.playsInline = true;
  vid.preload = 'metadata';

  const group = new Group();
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
      const vw = vid.videoWidth;
      const vh = vid.videoHeight;
      const h = displayWidth * (vh / vw);
      const texW = 512;
      const texH = Math.round(texW * (vh / vw));

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

      const border = createBorderFrame(displayWidth, h, 0.06);
      group.add(border);

      const screen = new Mesh(
        new PlaneGeometry(displayWidth, h),
        new MeshBasicMaterial({ map: tex }),
      );
      screen.position.z = 0.1;
      group.add(screen);

      const hitArea = new Mesh(
        new PlaneGeometry(displayWidth + 0.14, h + 0.14),
        new MeshBasicMaterial({ visible: false }),
      );
      hitArea.position.z = 0.12;
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
