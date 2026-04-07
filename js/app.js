/**
 * ============================================================
 *  Web VTuber Pro — js/app.js
 *  Entry point & orchestration layer.
 *
 *  Depends on (must be loaded before this file):
 *    • js/facelandmark.js  → window.FaceLandmarkDetector
 *    • js/character.js     → window.VTuberCharacter
 *    • js/effects.js       → window.ParticleSystem
 *    • js/ui.js            → window.UIManager
 * ============================================================
 */

/* ─────────────────────────────────────────────
   MODULE-LEVEL STATE
───────────────────────────────────────────── */
let detector    = null;
let character   = null;
let particles   = null;
let ui          = null;

let lastTimestamp = 0;
let landmarkCount = 0;
let lastFaceTime  = 0;
let rafId         = null;

const IDLE_TIMEOUT_MS = 3000;


/* ══════════════════════════════════════════════
   PHASE 1 — INIT
══════════════════════════════════════════════ */
async function init() {
  try {
    // 1. Grab DOM elements
    const videoElement  = document.getElementById("webcam");
    const canvasElement = document.getElementById("vtube-canvas");

    if (!videoElement || !canvasElement) {
      throw new Error("Required DOM elements #webcam or #vtube-canvas not found.");
    }

    // 2. Instantiate all modules
    detector  = new window.FaceLandmarkDetector();
    character = new window.VTuberCharacter(canvasElement);
    particles = new window.ParticleSystem(canvasElement);
    ui        = new window.UIManager();

    // 3. Bootstrap the UI
    ui.init();

    // 4. Wire UI → Character events
    ui.on("skinChange", (skinId) => {
      character.setSkin(skinId);
    });

    ui.on("mirrorToggle", (isMirrored) => {
      character.setMirror(isMirrored);
    });

    ui.on("screenshot", () => {
      takeScreenshot(canvasElement);
    });

    // 5. Wire Detector → App events
    detector.on("onFaceData", (faceData) => {
      handleFaceData(faceData);
    });

    detector.on("noFace", () => {
      character.drawIdle();
    });

    // 6. Initialise the detector (loads MediaPipe models)
    await detector.init();

    // 7. Start the camera feed
    await detector.startCamera(videoElement);

    // 8. Signal the UI that loading is complete
    ui.hideLoading();

    // 9. Kick off the render loop
    rafId = requestAnimationFrame(gameLoop);

    console.log("[VTuber Pro] Initialised successfully.");

  } catch (err) {
    console.error("[VTuber Pro Error]", err);

    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError" ||
      (err.message && err.message.toLowerCase().includes("camera"))
    ) {
      alert("Camera access denied. Please allow camera and reload.");
    } else {
      alert("Failed to load MediaPipe. Check internet connection.");
    }
  }
}


/* ══════════════════════════════════════════════
   PHASE 2 — GAME LOOP
══════════════════════════════════════════════ */
function gameLoop(timestamp) {
  // 1. FPS calculation
  const fps = lastTimestamp === 0 ? 0 : 1000 / (timestamp - lastTimestamp);
  lastTimestamp = timestamp;

  // 2. Push stats to UI
  ui.updateStats(fps, landmarkCount);

  // 3. Idle animation fallback
  const timeSinceFace = Date.now() - lastFaceTime;
  if (lastFaceTime === 0 || timeSinceFace > IDLE_TIMEOUT_MS) {
    character.drawIdle();
  }

  // 4. Particle system tick
  const { x, y } = character.smoothedData || { x: 0, y: 0 };
  particles.update(x, y);
  particles.draw();

  // 5. Schedule next frame
  rafId = requestAnimationFrame(gameLoop);
}


/* ══════════════════════════════════════════════
   PHASE 3 — EVENT HANDLERS
══════════════════════════════════════════════ */

/**
 * handleFaceData
 * Invoked by the detector every time a face is successfully tracked.
 *
 * @param {Object} faceData
 */
function handleFaceData(faceData) {
  // 1. Update character pose & expression
  character.update(faceData);

  // 2. Drive particle expression
  particles.setExpression(faceData.expression);

  // 3. Reflect expression label in the UI
  ui.updateExpression(faceData.expression);

  // 4. Push raw landmark data to debug panel
  ui.updateDebug(faceData);

  // 5. Keep landmark count in sync
  landmarkCount = faceData.landmarks ? faceData.landmarks.length : 0;

  // 6. Reset idle timer
  lastFaceTime = Date.now();
}

/**
 * takeScreenshot
 * Serialises the canvas to a PNG and triggers a browser download.
 *
 * @param {HTMLCanvasElement} canvas
 */
function takeScreenshot(canvas) {
  try {
    const dataURL   = canvas.toDataURL("image/png");
    const timestamp = Date.now();
    const link      = document.createElement("a");

    link.href     = dataURL;
    link.download = `vtube-pro-${timestamp}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`[VTuber Pro] Screenshot saved: vtube-pro-${timestamp}.png`);
  } catch (err) {
    console.error("[VTuber Pro Error] Screenshot failed:", err);
  }
}


/* ══════════════════════════════════════════════
   ENTRY POINT
══════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  init();
});
