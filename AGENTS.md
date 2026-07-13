# VR-Thing

A WebXR virtual reality memory room built with Three.js and served via Vite. Users enter VR on a Meta Quest headset through the browser and explore themed rooms containing family photos and videos.

## Tech Stack

- **Three.js** (v0.157) -- 3D rendering, WebXR, hand/controller tracking
- **Vite** (v8) -- dev server and bundler
- **@vitejs/plugin-basic-ssl** -- self-signed HTTPS (required for WebXR)
- **ES modules** -- `"type": "module"` in package.json, all imports are ESM

## Running

```bash
npm install
npm run dev        # starts Vite HTTPS dev server on https://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview production build
```

The `--host` flag is set in the dev script so the Quest headset can reach the server at `https://<PC-LAN-IP>:5173/`. Windows Firewall port 5173 must be open.

## File Structure

```
vr-thing/
  index.html                 Entry HTML, loads src/main.js as module
  vite.config.js             Vite config: basic-ssl plugin, host: true, media file watcher ignores
  package.json               Dependencies and scripts
  src/
    main.js                  Orchestrator (~100 lines): creates scene, wires modules, render loop
    state.js                 Shared state object (scene, dolly, camera, renderer, arrays, activeFrame, roomBounds)
    room.js                  createRoom(), createDoor(), createExitButton(), room constants
    content.js               makeTextTexture(), createBorderFrame(), createFramedPhoto(), createVideoScreen()
    interaction.js           Raycasting, click handlers, frame teleport+auto-play, hover effects, ray shortening
    locomotion.js            Joystick movement, hand models, controller setup, ray lines, camera clamping
    rooms/
      mainRoom.js            Main room: wall labels, Kids walls content, GLTF frame, door to history
      dadsHistory.js         Dad's History room: Childhood photo grid with audio, Before Laura, Wedding walls
  originals/                 Unconvertible source files (e.g. SpencerAngel.AVI)
  public/                    Single source of truth for all served media (copied to dist/ on build)
    images/                  Photos
      dad/childhood/         12 childhood photos (DaveInArmchair, DaveSwings first)
    video/                   MP4/MOV videos (H.264, Quest-compatible)
      Reese_Running.mp4
      ReeseDoraBoots.mp4
      ReeseSellingCookies.mp4
      ReeseSledingSloMo.mp4
      SpencerAngel.mp4
      Mason_Spencer_In_A_Tree.mp4
      Spencer_Mason_Wrestling.mp4
      Reese_Flying_A_Kite.MP4
      ReeseJumping.mp4
      ReeseSinging.mp4
      ReeseYouTubeVideo.MP4
      MasonCrash.MP4
      MasonCrazyNarration.MP4
    audio/                   Narration audio files
      dad/                   Per-photo narration (.m4a files)
    models/
      frame.glb              3D picture frame model (medium poly GLTF)
    gs_Dave.ply              Gaussian splat (unused -- too heavy for Quest)
```

**Important**: Browsers cannot play AVI. Raw AVIs go in `originals/`, converted MP4s go directly in `public/video/`. Portrait videos may need rotation correction with ffmpeg's `transpose` filter. All servable media lives in `public/` -- no `src/Assets/` folder.

**Vite watcher**: `vite.config.js` ignores large media file extensions and the `originals/` directory to prevent dev server crashes.

## Architecture

### Module Dependency Graph

```
main.js
  ├── state.js           (shared mutable state)
  ├── locomotion.js       (imports state; exports clampToRoom)
  ├── interaction.js      (imports state)
  ├── rooms/mainRoom.js   (imports state, room, content, dadsHistory for HIST_X)
  └── rooms/dadsHistory.js (imports room, content)
        room.js           (imports state, content for makeTextTexture)
        content.js         (imports state)
```

### state.js
Thin mutable object holding references that multiple modules need: `scene`, `dolly`, `camera`, `renderer`, `controls`, and arrays `allFloors`, `allVideos`, `doorTargets`, `allExitBtns`, `allFrameTargets`. Also holds `activeFrame` (the currently playing frame, or null) and `roomBounds[]` (registered automatically by `createRoom`).

### main.js (~100 lines)
Entry point and orchestrator. Creates the WebGLRenderer, Scene, Camera, dolly Group. Populates `state`, then calls `buildMainRoom()` and `buildDadsHistoryRoom()`. Sets up locomotion and interaction. Runs the render loop which:
1. Updates all playing video CanvasTextures (once per frame, before stereo render)
2. If in VR: runs locomotion, hover effects, ray shortening
3. If desktop: updates OrbitControls, clamps camera to room bounds

### room.js (~160 lines)
Exports constants `ROOM_W` (10), `ROOM_D` (10), `ROOM_H` (4).

**`createRoom(origin, wallDefs, colors)`** -- Builds floor, ceiling, walls, lighting, and wall title labels at any position. The `wallDefs` array contains `{ label, x, z, w, ry }` with absolute world coordinates. Optional `colors` object allows per-room floor/wall/ceiling color theming. Automatically registers the room's AABB in `state.roomBounds` for camera clamping. Returns `{ floor }`.

**`createDoor(label, pos, rotY, teleportTarget)`** -- Creates a door Group (brown panel, dark wood frame, gold handle, text label above). Automatically registered in `state.doorTargets`.

**`createExitButton(pos, rotY)`** -- Creates a red EXIT VR button. Automatically registered in `state.allExitBtns`.

### content.js (~210 lines)
**`makeTextTexture(text, bg, fg, w, h, fontSize)`** -- Renders text to a CanvasTexture. Used for wall titles.

**`createBorderFrame(contentW, contentH, borderW)`** -- Returns a Group of 4 BoxGeometry bars forming a picture frame. Each frame has individual `MeshStandardMaterial` with emissive properties for hover glow effects.

**`createFramedPhoto(src, photoW, photoH, pos, rotY, { audioSrc })`** -- Loads an image, wraps it in a border frame, adds a filename nameplate below. If `audioSrc` is provided, creates an HTML5 Audio object and adds a small speaker icon to the right of the frame to indicate audio is available. Clicking the frame teleports to it and auto-plays the audio.

**`createVideoScreen(src, displayWidth, pos, rotY)`** -- Creates a video player with auto-detected aspect ratio (from video metadata), manual CanvasTexture updates (prevents stereo flicker), filename nameplate below, and robust thumbnail generation. No need to specify video dimensions -- the frame sizes itself automatically. Clicking the frame teleports and auto-plays. Registered in `state.allVideos`.

**Filename nameplates**: Every frame displays a label below it derived from the filename -- underscores become spaces, camelCase is split (e.g. `ReeseDoraBoots.mp4` → `"Reese Dora Boots"`), rendered in italic serif script font with decorative curly quotes.

### interaction.js (~200 lines)
**`setupInteraction(ctrl0, ctrl1)`** -- Creates teleport marker, wires `onSelect` for VR controllers, `onClick` and `onMouseMove` for desktop.

**Click priority** (same for VR `onSelect` and desktop `onMouseClick`):
1. `tryExitVR` -- checks `state.allExitBtns`
2. `tryDoorTeleport` -- checks `state.doorTargets` panels; stops active media
3. `tryFrameTeleport` -- checks `state.allFrameTargets`:
   - Clicking the **same** playing frame → stops playback
   - Clicking a **different** frame → stops current, teleports, starts new playback
4. Floor teleport -- checks `state.allFloors`; teleports user to clicked floor spot at standing eye height (1.6m) in both VR and desktop modes

**Single-active-media pattern**: `state.activeFrame` tracks the currently playing frame. Only one video or audio can play at a time.

**`updateHoverEffects(now)`** -- Called each VR frame. Updates teleport marker, pulses exit buttons, glows doors and frame borders on controller hover.

**Desktop hover** (`onMouseMove`): Raycasts from mouse, applies emissive glow to doors and frame borders, shows floor teleport marker (blue ring), changes cursor to pointer on interactive elements.

**`shortenRays(rayEntries)`** -- Raycasts each controller against all scene children; shortens the visible Line to the hit distance. Filters out the ray Line objects themselves to prevent self-intersection.

### locomotion.js (~120 lines)
**`setupLocomotion()`** -- Creates hand models, controller objects, and ray Line meshes. Returns `{ controller0, controller1, ray0, ray1 }`.

**`handleDesktopLocomotion(dt)`** -- WASD for forward/back/strafe, Q/E for vertical movement. Clamps to room bounds after movement.

**`handleControllerLocomotion(dt)`** -- Thumbstick forward/back/strafe. Clamps dolly position to room bounds.

**`clampToRoom(pos)`** -- Finds which room the position is inside of (using `state.roomBounds`) and clamps x/y/z to stay within walls. Called after all movement updates and OrbitControls updates.

### rooms/mainRoom.js (~85 lines)
**`buildMainRoom()`** -- Calls `createRoom()` with origin (0,0,0) and four themed walls:
- **Kids** (back wall): 4 videos top row, 4 videos bottom row
- **Mom/Dad** (right wall): GLTF frame model, door to Dad's History room
- **Friends** (front wall): EXIT VR button
- **Kids** (left wall): 5 more videos (2 rows)

### rooms/dadsHistory.js (~66 lines)
Exports `HIST_X = 20` (imported by mainRoom.js for door targeting).

**`buildDadsHistoryRoom()`** -- Calls `createRoom()` at offset x=20 with green-themed colors. Three themed walls:
- **Childhood** (back wall): 12 photos in a 4x3 grid, `dadInArmchair` and `daveSwings` first. Photos with narration audio show an ear icon and auto-play when clicked.
- **Before Laura** (right wall): Title only, content TBD.
- **Wedding** (left wall): Title only, content TBD.
Adds an exit button and a door back to the main room on the front wall.

## Key Patterns

### Video Flicker Prevention
Never use `VideoTexture` directly. The render loop draws video frames to a `<canvas>` once per frame, then marks the `CanvasTexture` as `needsUpdate`. This ensures both eyes see the same frame.

### Video Thumbnail Generation
Seeks to ~2 seconds into the video (or 5% of duration, whichever is shorter) to skip past black/fade-in frames. Uses `loadedmetadata` → seek, `seeked` event for capture, plus a 10-second fallback timeout.

### Multi-Room via Offset
Rooms exist in the same scene at different x offsets (main at 0, history at 20). Teleporting between rooms sets `dolly.position`. Floor teleport and markers work across rooms via `state.allFloors`.

### Camera Room Clamping
Each room registers an AABB in `state.roomBounds` when created. `state.currentRoomIdx` tracks which room the user is in (updated by `detectRoom()` after door teleports). `clampToRoom()` constrains x/y/z to the current room's bounds. Applied after WASD movement, controller locomotion, OrbitControls orbit/pan, and teleportation. `OrbitControls.maxDistance` (6) and `maxPolarAngle` (0.85π) further prevent camera escape in desktop mode.

### Click-to-Play Frames
Clicking any frame teleports the user eye-level in front of it. If the frame has media (video or audio narration), it auto-plays. Clicking a different frame stops the current media and switches. Clicking the same playing frame stops playback. The active frame is tracked via `state.activeFrame`.

### Frame Hover Effects
Frame borders glow blue (`emissiveIntensity`) when hovered by VR controller ray or desktop mouse. Doors also glow on hover. Desktop cursor changes to pointer on interactive elements.

### Controller Ray Shortening
Each frame, both controller rays are raycasted against all scene children. The visible Line geometry's endpoint is set to `-hitDistance` (or `-RAY_MAX` if no hit), so rays stop at surfaces. Ray meshes are filtered from hit results to prevent self-intersection.

### Self-Registering Factories
`createRoom()`, `createDoor()`, `createExitButton()`, `createVideoScreen()`, and `createFramedPhoto()` all automatically register their objects into the appropriate `state` arrays. Room/content code never needs to manually manage these arrays.

### Adding New Content
1. Place media directly in `public/` (images in `public/images/`, video in `public/video/`, audio in `public/audio/`). Convert AVI to MP4 first.
2. In the room file (e.g., `rooms/mainRoom.js`), call `createFramedPhoto()` or `createVideoScreen()`
3. For narration audio, add `audioSrc: '/audio/dad/filename.m4a'` to the options -- the speaker icon appears automatically and audio plays on frame click
4. Filenames are auto-formatted into nameplates: underscores → spaces, camelCase → split words, wrapped in decorative quotes
5. Wall rotations: Back=0, Right=-PI/2, Front=PI, Left=PI/2

### Adding a New Room
1. Create `src/rooms/newRoom.js`
2. Export an offset constant (e.g., `export const NEW_X = 40`)
3. Call `createRoom()` with the offset origin, wall definitions, and optional room-specific colors
4. Call `createExitButton()` and `createDoor()` for navigation
5. Import and call `buildNewRoom()` from `src/main.js`

## Quest-Specific Notes

- Quest 2 browser requires HTTPS for WebXR (hence the basic-ssl plugin)
- Gaussian splats (`.ply`) are too heavy for Quest standalone rendering
- Videos must be H.264 MP4 for Quest browser compatibility; `.MOV` with H.264 also works
- Portrait videos from phones often have rotation metadata that needs correcting with ffmpeg
- The left controller handles locomotion; right controller is for pointing/clicking
- Hand tracking is supported but controllers provide much better locomotion
- Videos use `preload="metadata"` initially (to avoid network congestion), switching to `preload="auto"` only when actively playing
- `index.html` includes a controls legend (bottom-left) showing WASD/Q/E/scroll/click bindings; auto-hidden in VR mode
- Desktop floor teleport: hovering the mouse over the floor shows a blue ring marker; clicking teleports to that spot at standing eye height
