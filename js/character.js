/**
 * ============================================================
 * js/character.js — Web VTuber Pro
 * ============================================================
 * Vẽ nhân vật VTuber anime lên Canvas 2D dựa trên dữ liệu
 * MediaPipe được xử lý ở nơi khác và truyền vào qua update().
 *
 * Export  : window.VTuberCharacter (class)
 * Nhận    : faceData { earLeft, earRight, mar, headTilt, noseX, noseY, expression }
 * app.js  : new VTuberCharacter(canvas) → .setSkin() → .setMirror() → .update(faceData) | .drawIdle()
 * ============================================================
 */

(function (global) {
  "use strict";

  // ──────────────────────────────────────────────────────────
  // SKIN DEFINITIONS
  // ──────────────────────────────────────────────────────────
  const SKINS = {
    cat: {
      earType:       "triangle",
      earPrimary:    "#ffcc88",
      earInner:      "#ff9944",
      faceBase:      "#ffe0b2",
      faceShadow:    "#ffcc99",
      irisColor:     "#66aaff",
      pupilColor:    "#1a1a2e",
      blushColor:    "rgba(255,150,150,0.35)",
      eyebrowColor:  "#8b5e3c",
      outlineColor:  "#5a3e28",
    },
    rabbit: {
      earType:       "oval",
      earPrimary:    "#ffffff",
      earInner:      "#ffaacc",
      faceBase:      "#fff0f5",
      faceShadow:    "#ffd6e7",
      irisColor:     "#ff66aa",
      pupilColor:    "#2d0022",
      blushColor:    "rgba(255,120,180,0.30)",
      eyebrowColor:  "#b07090",
      outlineColor:  "#8a5070",
    },
    fox: {
      earType:       "triangle_outlined",
      earPrimary:    "#ff7722",
      earInner:      "#ffffff",
      faceBase:      "#ffe8cc",
      faceShadow:    "#ffbb88",
      irisColor:     "#ffaa00",
      pupilColor:    "#1a0d00",
      blushColor:    "rgba(255,140,80,0.30)",
      eyebrowColor:  "#7a3800",
      outlineColor:  "#7a3800",
    },
  };

  // ──────────────────────────────────────────────────────────
  // HELPER: lerp
  // alpha = 0.2 → 80% giá trị cũ, 20% giá trị mới mỗi frame
  // ──────────────────────────────────────────────────────────
  function lerp(current, target, alpha) {
    return current * (1 - alpha) + target * alpha;
  }

  // ──────────────────────────────────────────────────────────
  // HELPER: clamp
  // ──────────────────────────────────────────────────────────
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // ──────────────────────────────────────────────────────────
  // CLASS VTuberCharacter
  // ──────────────────────────────────────────────────────────
  class VTuberCharacter {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx    = canvas.getContext("2d");

      this.currentSkin       = "cat";
      this.mirrorMode        = false;
      this.currentExpression = "neutral";

      // Smoothed (lerp-ed) values
      this.smoothedData = {
        x:    canvas.width  / 2,
        y:    canvas.height / 2,
        tilt: 0,
        earL: 0.30,
        earR: 0.30,
        mar:  0.00,
      };
    }

    // ────────────────────────────────────────────
    // PUBLIC API
    // ────────────────────────────────────────────

    setSkin(skinName) {
      if (SKINS[skinName]) this.currentSkin = skinName;
    }

    setMirror(bool) {
      this.mirrorMode = !!bool;
    }

    /**
     * Nhận faceData từ MediaPipe pipeline, lerp, rồi vẽ.
     * @param {Object} faceData
     */
    update(faceData) {
      const s = this.smoothedData;
      const α = 0.2;

      s.x    = lerp(s.x,    faceData.noseX   ?? s.x,    α);
      s.y    = lerp(s.y,    faceData.noseY   ?? s.y,    α);
      s.tilt = lerp(s.tilt, faceData.headTilt ?? 0,      α);
      s.earL = lerp(s.earL, faceData.earLeft  ?? 0.30,  α);
      s.earR = lerp(s.earR, faceData.earRight ?? 0.30,  α);
      s.mar  = lerp(s.mar,  faceData.mar      ?? 0.00,  α);

      this.currentExpression = faceData.expression ?? "neutral";

      this.draw();
    }

    /**
     * Vẽ nhân vật ở idle (không có face data).
     * Dùng Math.sin để tạo hiệu ứng thở nhẹ.
     */
    drawIdle() {
      const t       = Date.now() / 1000;
      const breathY = Math.sin(t * 1.2) * 4;
      const breathS = 1 + Math.sin(t * 1.2) * 0.008;

      const cx = this.canvas.width  / 2;
      const cy = this.canvas.height / 2 + breathY;

      const idleData = {
        x:    cx,
        y:    cy,
        tilt: Math.sin(t * 0.4) * 1.5,
        earL: 0.30,
        earR: 0.30,
        mar:  0.00,
      };

      const ctx  = this.ctx;
      const skin = SKINS[this.currentSkin];

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();

      if (this.mirrorMode) {
        ctx.translate(this.canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.translate(cx, cy);
      ctx.rotate((idleData.tilt * Math.PI) / 180);
      ctx.scale(breathS, breathS);

      this._drawCharacter(skin, idleData, "neutral");
      ctx.restore();
    }

    // ────────────────────────────────────────────
    // INTERNAL DRAW PIPELINE
    // ────────────────────────────────────────────

    draw() {
      const ctx  = this.ctx;
      const s    = this.smoothedData;
      const skin = SKINS[this.currentSkin];

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();

      if (this.mirrorMode) {
        ctx.translate(this.canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.translate(s.x, s.y);
      ctx.rotate((s.tilt * Math.PI) / 180);

      this._drawCharacter(skin, s, this.currentExpression);
      ctx.restore();
    }

    /**
     * Thứ tự vẽ: Ears → Face → Blush → Eyebrows → Eyes → Nose → Mouth
     */
    _drawCharacter(skin, data, expr) {
      this._drawEars(skin);
      this._drawFace(skin);
      this._drawBlush(skin, expr);
      this._drawEyebrows(skin, expr);
      this._drawEyes(skin, data, expr);
      this._drawNose(skin);
      this._drawMouth(skin, data, expr);
    }

    // ──────────────────────────────────────────────────────────
    // 1. EARS
    // ──────────────────────────────────────────────────────────

    _drawEars(skin) {
      switch (skin.earType) {
        case "triangle":           return this._drawCatEars(skin);
        case "oval":               return this._drawRabbitEars(skin);
        case "triangle_outlined":  return this._drawFoxEars(skin);
      }
    }

    _drawCatEars(skin) {
      const ctx  = this.ctx;
      const ears = [[-58, -110], [58, -110]];

      ears.forEach(([ex, tip]) => {
        ctx.beginPath();
        ctx.moveTo(ex - 22, -75);
        ctx.lineTo(ex + 22, -75);
        ctx.lineTo(ex,       tip);
        ctx.closePath();
        ctx.fillStyle   = skin.earPrimary;
        ctx.fill();
        ctx.strokeStyle = skin.outlineColor;
        ctx.lineWidth   = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ex - 12, -78);
        ctx.lineTo(ex + 12, -78);
        ctx.lineTo(ex,      tip + 18);
        ctx.closePath();
        ctx.fillStyle = skin.earInner;
        ctx.fill();
      });
    }

    _drawRabbitEars(skin) {
      const ctx  = this.ctx;
      const ears = [[-42, -90], [42, -90]];

      ears.forEach(([ex, ey]) => {
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(ex < 0 ? -0.15 : 0.15);

        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 46, 0, 0, Math.PI * 2);
        ctx.fillStyle   = skin.earPrimary;
        ctx.fill();
        ctx.strokeStyle = skin.outlineColor;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, 5, 7, 32, 0, 0, Math.PI * 2);
        ctx.fillStyle = skin.earInner;
        ctx.fill();

        ctx.restore();
      });
    }

    _drawFoxEars(skin) {
      const ctx  = this.ctx;
      const ears = [[-55, -115], [55, -115]];

      ears.forEach(([ex, tip]) => {
        ctx.beginPath();
        ctx.moveTo(ex - 26, -70);
        ctx.lineTo(ex + 26, -70);
        ctx.lineTo(ex,       tip);
        ctx.closePath();
        ctx.fillStyle   = skin.earPrimary;
        ctx.fill();
        ctx.strokeStyle = skin.outlineColor;
        ctx.lineWidth   = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ex - 13, -76);
        ctx.lineTo(ex + 13, -76);
        ctx.lineTo(ex,      tip + 22);
        ctx.closePath();
        ctx.fillStyle = skin.earInner;
        ctx.fill();
      });
    }

    // ──────────────────────────────────────────────────────────
    // 2. FACE
    // ──────────────────────────────────────────────────────────

    _drawFace(skin) {
      const ctx = this.ctx;
      const rx  = 72;
      const ry  = 88;

      const grad = ctx.createRadialGradient(0, -20, 10, 0, 0, 100);
      grad.addColorStop(0, skin.faceBase);
      grad.addColorStop(1, skin.faceShadow);

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle   = grad;
      ctx.fill();
      ctx.strokeStyle = skin.outlineColor;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }

    // ──────────────────────────────────────────────────────────
    // 3. BLUSH
    // ──────────────────────────────────────────────────────────

    _drawBlush(skin, expr) {
      const ctx     = this.ctx;
      const isHappy = expr === "happy" || expr === "surprised";
      const r       = isHappy ? 18 : 14;
      const alpha   = isHappy ? 0.50 : 0.30;

      const baseColor = skin.blushColor.replace(/[\d.]+\)$/, `${alpha})`);

      ctx.save();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.ellipse(-44, 28, r, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(44, 28, r, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.restore();
    }

    // ──────────────────────────────────────────────────────────
    // 4. EYEBROWS
    // ──────────────────────────────────────────────────────────

    _drawEyebrows(skin, expr) {
      const ctx = this.ctx;
      ctx.strokeStyle = skin.eyebrowColor;
      ctx.lineWidth   = 3;
      ctx.lineCap     = "round";

      let leftCfg  = { x1: -50, y1: -32, cx: -35, cy: -38, x2: -20, y2: -32 };
      let rightCfg = { x1:  20, y1: -32, cx:  35, cy: -38, x2:  50, y2: -32 };

      switch (expr) {
        case "sad":
          leftCfg.y2  = -36;
          rightCfg.y1 = -36;
          leftCfg.cy  = -34;
          rightCfg.cy = -34;
          break;
        case "happy":
          leftCfg.cy  = -44;
          rightCfg.cy = -44;
          break;
        case "surprised":
          leftCfg.y1  -= 6; leftCfg.y2  -= 6; leftCfg.cy  -= 8;
          rightCfg.y1 -= 6; rightCfg.y2 -= 6; rightCfg.cy -= 8;
          break;
      }

      [leftCfg, rightCfg].forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.x1, c.y1);
        ctx.quadraticCurveTo(c.cx, c.cy, c.x2, c.y2);
        ctx.stroke();
      });
    }

    // ──────────────────────────────────────────────────────────
    // 5. EYES
    // ──────────────────────────────────────────────────────────

    _drawEyes(skin, data, expr) {
      const leftOpen  = expr === "wink_right" ? true  : data.earL >= 0.20;
      const rightOpen = expr === "wink_left"  ? true  : data.earR >= 0.20;
      const winkLeft  = expr === "wink_left";
      const winkRight = expr === "wink_right";

      const openL = clamp((data.earL - 0.20) / 0.20, 0, 1);
      const openR = clamp((data.earR - 0.20) / 0.20, 0, 1);

      if (leftOpen && !winkLeft) {
        this._drawEyeOpen(skin, -32, -10, openL, "left", expr);
      } else {
        this._drawEyeClosed(-32, -10, "left");
      }

      if (rightOpen && !winkRight) {
        this._drawEyeOpen(skin, 32, -10, openR, "right", expr);
      } else {
        this._drawEyeClosed(32, -10, "right");
      }
    }

    _drawEyeOpen(skin, cx, cy, openAmount, side, expr) {
      const ctx = this.ctx;
      const rx  = 14;
      const ry  = 8 + openAmount * 8;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = skin.irisColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = skin.pupilColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx + 4, cy - 4, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();

      ctx.restore();

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = skin.outlineColor;
      ctx.lineWidth   = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = skin.outlineColor;
      ctx.lineWidth   = 3.5;
      ctx.stroke();
    }

    _drawEyeClosed(cx, cy, side) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy);
      ctx.quadraticCurveTo(cx, cy - 9, cx + 14, cy);
      ctx.strokeStyle = "#5a3e28";
      ctx.lineWidth   = 3;
      ctx.lineCap     = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 2);
      ctx.quadraticCurveTo(cx, cy + 6, cx + 8, cy + 2);
      ctx.strokeStyle = "rgba(90,62,40,0.4)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // ──────────────────────────────────────────────────────────
    // 6. NOSE
    // ──────────────────────────────────────────────────────────

    _drawNose(skin) {
      const ctx = this.ctx;

      ctx.beginPath();
      ctx.moveTo(-5, 15);
      ctx.lineTo( 5, 15);
      ctx.lineTo( 0, 20);
      ctx.closePath();
      ctx.fillStyle   = skin.faceShadow;
      ctx.fill();
      ctx.strokeStyle = skin.outlineColor;
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 13, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
    }

    // ──────────────────────────────────────────────────────────
    // 7. MOUTH
    // ──────────────────────────────────────────────────────────

    _drawMouth(skin, data, expr) {
      const ctx    = this.ctx;
      const mar    = data.mar ?? 0;
      const isOpen = mar >= 0.15;

      ctx.strokeStyle = skin.outlineColor;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = "round";

      if (expr === "sad") {
        this._drawMouthSad(ctx, skin);
      } else if (expr === "happy") {
        this._drawMouthHappy(ctx, skin);
      } else if (expr === "surprised" || (isOpen && mar > 0.40)) {
        this._drawMouthOpen(ctx, skin, mar);
      } else if (isOpen) {
        this._drawMouthSlightOpen(ctx, skin, mar);
      } else {
        this._drawMouthNeutral(ctx, skin);
      }
    }

    _drawMouthNeutral(ctx, skin) {
      ctx.beginPath();
      ctx.moveTo(-18, 42);
      ctx.quadraticCurveTo(0, 52, 18, 42);
      ctx.stroke();
    }

    _drawMouthHappy(ctx, skin) {
      ctx.beginPath();
      ctx.moveTo(-22, 40);
      ctx.quadraticCurveTo(0, 58, 22, 40);
      ctx.fillStyle = "rgba(200,100,100,0.25)";
      ctx.fill();
      ctx.stroke();
    }

    _drawMouthSad(ctx, skin) {
      ctx.beginPath();
      ctx.moveTo(-18, 46);
      ctx.quadraticCurveTo(0, 38, 18, 46);
      ctx.stroke();
    }

    _drawMouthSlightOpen(ctx, skin, mar) {
      const openH = clamp((mar - 0.15) / 0.25, 0, 1) * 10;

      ctx.beginPath();
      ctx.ellipse(0, 44, 14, 4 + openH, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(160,80,80,0.50)";
      ctx.fill();
      ctx.stroke();
    }

    _drawMouthOpen(ctx, skin, mar) {
      const openH = clamp((mar - 0.40) / 0.40, 0, 1) * 14 + 10;

      ctx.beginPath();
      ctx.ellipse(0, 44, 18, openH, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(140,60,60,0.60)";
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(-14, 40, 28, 5);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fill();
    }
  }

  // ──────────────────────────────────────────────────────────
  // EXPOSE TO GLOBAL SCOPE
  // ──────────────────────────────────────────────────────────
  global.VTuberCharacter = VTuberCharacter;

})(window);
