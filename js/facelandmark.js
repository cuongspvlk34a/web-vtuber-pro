/**
 * js/facelandmark.js — Web VTuber Pro
 * "Bộ não" xử lý toàn bộ dữ liệu khuôn mặt từ MediaPipe FaceLandmarker.
 *
 * MediaPipe được load động bên trong init() với 3 CDN fallback.
 * Không cần <script src> CDN tĩnh trong index.html.
 *
 * Export global:
 *   window.FaceLandmarkDetector  — class chính, xem phần cuối file
 */

// ─────────────────────────────────────────────
// SECTION 1 — Utility: khoảng cách Euclidean
// ─────────────────────────────────────────────

/**
 * Tính khoảng cách Euclidean giữa 2 landmark.
 * Mỗi landmark có dạng { x, y, z } (tọa độ đã normalize 0-1).
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {number}
 */
function euclidean(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─────────────────────────────────────────────
// SECTION 2 — EAR (Eye Aspect Ratio)
// ─────────────────────────────────────────────

/**
 * Tính Eye Aspect Ratio (EAR) cho một mắt.
 *
 * Công thức Soukupová & Čech (2016):
 *   EAR = (|p2−p6| + |p3−p5|) / (2 × |p1−p4|)
 *
 * Mắt trái : [33, 160, 158, 133, 153, 144]
 * Mắt phải : [362, 385, 387, 263, 373, 380]
 *
 * EAR ≈ 0.3   → mắt mở bình thường
 * EAR < 0.2   → đang nhắm / chớp mắt
 *
 * @param {Array<{x:number,y:number}>} landmarks  — mảng 478 điểm
 * @param {number[]} eyeIndices                   — 6 index theo thứ tự p1..p6
 * @returns {number} EAR (float)
 */
function calculateEAR(landmarks, eyeIndices) {
  if (!landmarks || eyeIndices.length !== 6) return 0;

  const [i1, i2, i3, i4, i5, i6] = eyeIndices;
  const p1 = landmarks[i1];
  const p2 = landmarks[i2];
  const p3 = landmarks[i3];
  const p4 = landmarks[i4];
  const p5 = landmarks[i5];
  const p6 = landmarks[i6];

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0;

  const vertical1  = euclidean(p2, p6);
  const vertical2  = euclidean(p3, p5);
  const horizontal = euclidean(p1, p4);

  if (horizontal === 0) return 0;

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// ─────────────────────────────────────────────
// SECTION 3 — MAR (Mouth Aspect Ratio)
// ─────────────────────────────────────────────

/**
 * Tính Mouth Aspect Ratio (MAR).
 *
 * vertical   = khoảng cách landmark 13 (môi trên) và 14 (môi dưới)
 * horizontal = khoảng cách landmark 61 (góc trái) và 291 (góc phải)
 *
 * MAR > 0.3 → miệng đang há
 * MAR > 0.5 → há to (ngạc nhiên / hát)
 *
 * @param {Array<{x:number,y:number}>} landmarks
 * @returns {number} MAR (float)
 */
function calculateMAR(landmarks) {
  if (!landmarks) return 0;

  const top    = landmarks[13];
  const bottom = landmarks[14];
  const left   = landmarks[61];
  const right  = landmarks[291];

  if (!top || !bottom || !left || !right) return 0;

  const vertical   = euclidean(top, bottom);
  const horizontal = euclidean(left, right);

  if (horizontal === 0) return 0;

  return vertical / horizontal;
}

// ─────────────────────────────────────────────
// SECTION 4 — Head Tilt (góc nghiêng đầu)
// ─────────────────────────────────────────────

/**
 * Tính góc nghiêng đầu (roll) dựa trên đường nối tâm hai mắt.
 *
 * Tâm mắt trái  = trung bình landmark [33, 133]
 * Tâm mắt phải  = trung bình landmark [362, 263]
 *
 * @param {Array<{x:number,y:number}>} landmarks
 * @returns {number} góc độ (degrees, float)
 */
function calculateHeadTilt(landmarks) {
  if (!landmarks) return 0;

  const leftA  = landmarks[33];
  const leftB  = landmarks[133];
  if (!leftA || !leftB) return 0;
  const leftCenter = {
    x: (leftA.x + leftB.x) / 2,
    y: (leftA.y + leftB.y) / 2,
  };

  const rightA = landmarks[362];
  const rightB = landmarks[263];
  if (!rightA || !rightB) return 0;
  const rightCenter = {
    x: (rightA.x + rightB.x) / 2,
    y: (rightA.y + rightB.y) / 2,
  };

  const dx = rightCenter.x - leftCenter.x;
  const dy = rightCenter.y - leftCenter.y;

  return Math.atan2(dy, dx) * (180 / Math.PI);
}

// ─────────────────────────────────────────────
// SECTION 5 — Nose Position (pixel)
// ─────────────────────────────────────────────

/**
 * Trả về vị trí pixel của đầu mũi trên canvas.
 * Landmark 1 = nose tip trong MediaPipe FaceLandmarker 478 điểm.
 *
 * @param {Array<{x:number,y:number}>} landmarks
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {{x:number, y:number}} pixel position
 */
function calculateNosePosition(landmarks, canvasWidth, canvasHeight) {
  if (!landmarks) return { x: 0, y: 0 };

  const nose = landmarks[1];
  if (!nose) return { x: 0, y: 0 };

  return {
    x: nose.x * canvasWidth,
    y: nose.y * canvasHeight,
  };
}

// ─────────────────────────────────────────────
// SECTION 6 — Expression Detection
// ─────────────────────────────────────────────

/**
 * Tính Y trung bình của một nhóm eyebrow landmark (normalize [0,1]).
 *
 * @param {Array<{x:number,y:number}>} landmarks
 * @param {number[]} indices
 * @returns {number} Y trung bình
 */
function avgBrowY(landmarks, indices) {
  let sum = 0;
  let count = 0;
  for (const i of indices) {
    if (landmarks[i]) {
      sum += landmarks[i].y;
      count++;
    }
  }
  return count > 0 ? sum / count : 0.5;
}

/**
 * Nhận diện biểu cảm khuôn mặt từ các metric đã tính.
 *
 * Logic ưu tiên (từ trên xuống, match đầu tiên thắng):
 *   "surprised" — earLeft > 0.35 && earRight > 0.35 && mar > 0.5
 *   "wink_left"  — earLeft < 0.15 && earRight > 0.25
 *   "wink_right" — earRight < 0.15 && earLeft > 0.25
 *   "happy"  — mar > 0.3 && avgBrowY < 0.38
 *   "sad"    — đuôi mày ngoài thấp hơn gốc mày trong
 *   "neutral" — mặc định
 *
 * @param {number} earLeft
 * @param {number} earRight
 * @param {number} mar
 * @param {Array<{x:number,y:number}>} landmarks
 * @returns {string} tên expression
 */
function detectExpression(earLeft, earRight, mar, landmarks) {
  if (!landmarks) return 'neutral';

  if (earLeft > 0.35 && earRight > 0.35 && mar > 0.5) {
    return 'surprised';
  }

  if (earLeft < 0.15 && earRight > 0.25) {
    return 'wink_left';
  }
  if (earRight < 0.15 && earLeft > 0.25) {
    return 'wink_right';
  }

  const leftBrowIndices  = [70, 63, 105, 66, 107];
  const rightBrowIndices = [300, 293, 334, 296, 336];
  const avgLeftBrowY  = avgBrowY(landmarks, leftBrowIndices);
  const avgRightBrowY = avgBrowY(landmarks, rightBrowIndices);
  const avgAllBrowY   = (avgLeftBrowY + avgRightBrowY) / 2;

  if (mar > 0.3 && avgAllBrowY < 0.38) {
    return 'happy';
  }

  const leftBrowOuter  = landmarks[70];
  const leftBrowInner  = landmarks[107];
  const rightBrowOuter = landmarks[300];
  const rightBrowInner = landmarks[336];

  if (
    leftBrowOuter && leftBrowInner &&
    rightBrowOuter && rightBrowInner &&
    leftBrowOuter.y > leftBrowInner.y &&
    rightBrowOuter.y > rightBrowInner.y
  ) {
    return 'sad';
  }

  return 'neutral';
}

// ─────────────────────────────────────────────
// SECTION 7 — Class FaceLandmarkDetector
// ─────────────────────────────────────────────

class FaceLandmarkDetector {
  constructor() {
    this.faceLandmarker = null;
    this.lastResult     = null;
    this.isRunning      = false;
    this.callbacks      = {};
    this._detectLoop    = this._detectLoop.bind(this);

    // _visionPromise được khởi động ngay trong constructor
    // để bắt đầu tải MediaPipe càng sớm càng tốt (song song với init của app).
    // startCamera() sẽ await promise này trước khi chạy.
    this._visionPromise = this._loadMediaPipe();
  }

  // ── Private: Load MediaPipe với 3 CDN fallback ──

  /**
   * Thử load @mediapipe/tasks-vision lần lượt từ 3 CDN.
   * Trả về object { FaceLandmarker, FilesetResolver, wasmPath }.
   * Ném Error nếu tất cả CDN đều thất bại.
   *
   * Dùng dynamic import() — hoạt động trong Safari iOS 15+ mà không cần
   * type="module" trên thẻ <script> bên ngoài (các file js khác vẫn
   * dùng global window.XXX bình thường).
   *
   * @returns {Promise<{FaceLandmarker: Function, FilesetResolver: Function, wasmPath: string}>}
   */
  async _loadMediaPipe() {
    // 3 CDN fallback theo thứ tự ưu tiên
    const CDN_OPTIONS = [
      {
        name: 'esm.sh',
        module: 'https://esm.sh/@mediapipe/tasks-vision@0.10.12',
        wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm'
      },
      {
        name: 'jsDelivr',
        module: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/vision_bundle.js',
        wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm'
      },
      {
        name: 'unpkg',
        module: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.12/vision_bundle.js',
        wasm: 'https://unpkg.com/@mediapipe/tasks-vision@0.10.12/wasm'
      }
    ];

    let Vision   = null;
    let wasmPath = null;
    const errors = [];

    // Thử từng CDN cho đến khi thành công
    for (const cdn of CDN_OPTIONS) {
      try {
        console.log(`[FaceLandmarkDetector] Trying CDN: ${cdn.name}...`);
        Vision   = await import(cdn.module);
        wasmPath = cdn.wasm;
        console.log(`[FaceLandmarkDetector] Loaded from ${cdn.name}`);
        break;
      } catch (err) {
        errors.push(`${cdn.name}: ${err.message}`);
        console.warn(`[FaceLandmarkDetector] CDN ${cdn.name} failed:`, err.message);
      }
    }

    if (!Vision) {
      throw new Error(
        'Không thể load MediaPipe từ bất kỳ CDN nào:\n' + errors.join('\n')
      );
    }

    const { FaceLandmarker, FilesetResolver } = Vision;
    return { FaceLandmarker, FilesetResolver, wasmPath };
  }

  // ── Init ─────────────────────────────────────

  /**
   * Khởi tạo MediaPipe FaceLandmarker.
   * Load thư viện qua dynamic import() với 3 CDN fallback.
   * Kết quả Vision được cache trong this._visionPromise.
   *
   * @throws {Error} nếu tất cả CDN thất bại hoặc FaceLandmarker init lỗi
   */
  async init() {
    // Await promise đã được khởi động từ constructor
    const { FaceLandmarker, FilesetResolver, wasmPath } = await this._visionPromise;

    const filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);

    this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'CPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'VIDEO',
      numFaces: 1
    });

    console.log('[FaceLandmarkDetector] Initialized successfully.');
  }

  // ── Camera ───────────────────────────────────

  /**
   * Yêu cầu quyền webcam và bắt đầu vòng detect.
   *
   * @param {HTMLVideoElement} videoElement
   * @throws {Error} nếu người dùng từ chối camera hoặc không có thiết bị
   */
  async startCamera(videoElement) {
    if (!this.faceLandmarker) {
      throw new Error('[FaceLandmarkDetector] Gọi init() trước khi startCamera().');
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Người dùng từ chối quyền truy cập camera.'
          : err.name === 'NotFoundError'
          ? 'Không tìm thấy thiết bị camera.'
          : `Lỗi camera: ${err.message}`;
      throw new Error(`[FaceLandmarkDetector] ${msg}`);
    }

    videoElement.srcObject = stream;

    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = resolve;
      videoElement.onerror = () => reject(new Error('Video element lỗi khi load metadata.'));
    });

    await videoElement.play();

    this.isRunning      = true;
    this._videoElement  = videoElement;

    requestAnimationFrame(this._detectLoop);

    console.info('[FaceLandmarkDetector] Camera đã bắt đầu.');
  }

  /**
   * Dừng vòng detect và giải phóng camera stream.
   */
  stopCamera() {
    this.isRunning = false;
    if (this._videoElement && this._videoElement.srcObject) {
      this._videoElement.srcObject.getTracks().forEach((t) => t.stop());
      this._videoElement.srcObject = null;
    }
    console.info('[FaceLandmarkDetector] Camera đã dừng.');
  }

  // ── Detect loop ──────────────────────────────

  _detectLoop(timestamp) {
    if (!this.isRunning) return;
    this._detect(this._videoElement, timestamp);
  }

  _detect(videoElement, timestamp) {
    if (
      !videoElement ||
      videoElement.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
    ) {
      requestAnimationFrame(this._detectLoop);
      return;
    }

    let results;
    try {
      results = this.faceLandmarker.detectForVideo(videoElement, timestamp);
    } catch (err) {
      console.error('[FaceLandmarkDetector] detectForVideo lỗi:', err);
      this._trigger('error', { message: err.message });
      requestAnimationFrame(this._detectLoop);
      return;
    }

    this._processResults(results, videoElement);

    if (this.isRunning) {
      requestAnimationFrame(this._detectLoop);
    }
  }

  // ── Process Results ───────────────────────────

  /**
   * Xử lý kết quả từ MediaPipe, tính toán các metric và gọi callbacks.
   *
   * faceData schema:
   * {
   *   earLeft    : number
   *   earRight   : number
   *   mar        : number
   *   headTilt   : number
   *   noseX      : number
   *   noseY      : number
   *   expression : string
   *   landmarks  : Array
   *   timestamp  : number
   * }
   */
  _processResults(results, videoElement) {
    if (
      !results ||
      !results.faceLandmarks ||
      results.faceLandmarks.length === 0
    ) {
      this._trigger('noFace', null);
      return;
    }

    const landmarks = results.faceLandmarks[0];

    const canvasWidth  = videoElement.videoWidth  || 640;
    const canvasHeight = videoElement.videoHeight || 480;

    const earLeft  = calculateEAR(landmarks, [33, 160, 158, 133, 153, 144]);
    const earRight = calculateEAR(landmarks, [362, 385, 387, 263, 373, 380]);
    const mar      = calculateMAR(landmarks);
    const headTilt = calculateHeadTilt(landmarks);
    const nosePos  = calculateNosePosition(landmarks, canvasWidth, canvasHeight);
    const expression = detectExpression(earLeft, earRight, mar, landmarks);

    const faceData = {
      earLeft,
      earRight,
      mar,
      headTilt,
      noseX: nosePos.x,
      noseY: nosePos.y,
      expression,
      landmarks,
      timestamp: Date.now(),
    };

    this.lastResult = faceData;
    this._trigger('onFaceData', faceData);
  }

  // ── Event / Callback ─────────────────────────

  /**
   * Đăng ký callback cho một sự kiện.
   * Events: "onFaceData" | "noFace" | "error"
   *
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      console.warn(`[FaceLandmarkDetector] Callback cho "${eventName}" phải là function.`);
      return;
    }
    this.callbacks[eventName] = callback;
  }

  off(eventName) {
    delete this.callbacks[eventName];
  }

  _trigger(eventName, payload) {
    if (typeof this.callbacks[eventName] === 'function') {
      try {
        this.callbacks[eventName](payload);
      } catch (err) {
        console.error(`[FaceLandmarkDetector] Callback "${eventName}" ném lỗi:`, err);
      }
    }
  }
}

// ─────────────────────────────────────────────
// SECTION 8 — Expose global
// ─────────────────────────────────────────────

window.FaceLandmarkDetector = FaceLandmarkDetector;

window._faceLandmarkUtils = {
  calculateEAR,
  calculateMAR,
  calculateHeadTilt,
  calculateNosePosition,
  detectExpression,
};
