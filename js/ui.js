/**
 * js/ui.js — Web VTuber Pro
 * ─────────────────────────────────────────────────────────────────────────────
 * Trách nhiệm DUY NHẤT của file này:
 *   • Lắng nghe user events (click, v.v.)
 *   • Gọi callback đã đăng ký qua .on()
 *   • Cập nhật DOM để phản ánh trạng thái ứng dụng
 *
 * File này KHÔNG vẽ canvas, KHÔNG xử lý MediaPipe, KHÔNG có business logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

;(function (global) {
  "use strict";

  // ─── EXPRESSION MAP ────────────────────────────────────────────────────────
  const EXPRESSION_MAP = {
    neutral:    { icon: "😊", text: "Neutral",   color: "#ffffff" },
    happy:      { icon: "😄", text: "Happy",     color: "#ffdd44" },
    sad:        { icon: "😢", text: "Sad",       color: "#88aaff" },
    surprised:  { icon: "😲", text: "Surprised", color: "#ff88aa" },
    wink_left:  { icon: "😉", text: "Wink!",     color: "#cc88ff" },
    wink_right: { icon: "😉", text: "Wink!",     color: "#cc88ff" },
  };

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = getEl(id);
    if (el) el.textContent = value;
  }

  // ─── CLASS UIManager ───────────────────────────────────────────────────────

  class UIManager {
    constructor() {
      this.callbacks    = {};
      this.isMirror     = false;
      this.isDebugOpen  = false;
      this.fpsHistory   = [];
      this.lastFrameTime = 0;
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────

    /**
     * Đăng ký callback cho event UI.
     * Events: "skinChange" | "mirrorToggle" | "screenshot"
     */
    on(eventName, callback) {
      if (typeof callback !== "function") {
        console.warn(`[UIManager] on("${eventName}"): callback phải là function.`);
        return;
      }
      this.callbacks[eventName] = callback;
    }

    _emit(eventName, ...args) {
      const cb = this.callbacks[eventName];
      if (typeof cb === "function") {
        try {
          cb(...args);
        } catch (err) {
          console.error(`[UIManager] Lỗi trong callback "${eventName}":`, err);
        }
      }
    }

    /**
     * Bind toàn bộ event listener lên DOM.
     * Phải gọi SAU khi DOM đã sẵn sàng.
     */
    init() {
      this._bindSkinButtons();
      this._bindMirrorButton();
      this._bindScreenshotButton();
      this._bindDebugToggle();

      console.log("[UIManager] initialized");
    }

    /**
     * Ẩn #loading-overlay với hiệu ứng fade out.
     */
    hideLoading() {
      const overlay = getEl("loading-overlay");
      if (!overlay) return;

      overlay.classList.add("hidden");

      setTimeout(() => {
        const el = getEl("loading-overlay");
        if (el) el.style.display = "none";
      }, 500);
    }

    /**
     * Cập nhật FPS (rolling average 30 frames) và số landmark lên DOM.
     * @param {number} fps
     * @param {number} landmarkCount
     */
    updateStats(fps, landmarkCount) {
      this.fpsHistory.push(fps);

      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }

      const sampleCount = Math.min(this.fpsHistory.length, 30);
      const recent      = this.fpsHistory.slice(-sampleCount);
      const avgFps      = recent.reduce((sum, v) => sum + v, 0) / sampleCount;

      setText("fps-value",      Math.round(avgFps));
      setText("landmark-count", landmarkCount);
    }

    /**
     * Cập nhật debug panel — chỉ khi isDebugOpen === true.
     * @param {Object} faceData
     */
    updateDebug(faceData) {
      if (!this.isDebugOpen) return;
      if (!faceData)         return;

      const fmt = (v) => (typeof v === "number" ? v.toFixed(3) : "—");

      setText("ear-left",  fmt(faceData.earLeft));
      setText("ear-right", fmt(faceData.earRight));
      setText("mar-value", fmt(faceData.mar));
      setText("tilt-value",fmt(faceData.headTilt));
      setText("nose-x",    fmt(faceData.noseX));
      setText("nose-y",    fmt(faceData.noseY));
    }

    /**
     * Cập nhật icon emoji và text biểu cảm lên HUD.
     * @param {string} expressionName
     */
    updateExpression(expressionName) {
      const expr = EXPRESSION_MAP[expressionName] || EXPRESSION_MAP["neutral"];

      const iconEl = getEl("expression-icon");
      if (iconEl) iconEl.textContent = expr.icon;

      const textEl = getEl("expression-text");
      if (textEl) {
        textEl.textContent  = expr.text;
        textEl.style.color  = expr.color;
      }
    }

    // ── PRIVATE BINDING METHODS ───────────────────────────────────────────────

    /**
     * Xử lý click trên tất cả .skin-btn.
     */
    _bindSkinButtons() {
      const skinBtns = document.querySelectorAll(".skin-btn");

      if (skinBtns.length === 0) {
        console.warn("[UIManager] Không tìm thấy .skin-btn nào trong DOM.");
        return;
      }

      skinBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          skinBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          const skin = btn.dataset.skin;
          if (!skin) {
            console.warn("[UIManager] .skin-btn thiếu data-skin attribute.", btn);
            return;
          }

          this._emit("skinChange", skin);
        });
      });
    }

    /**
     * Xử lý click trên #mirror-btn để toggle mirror mode.
     */
    _bindMirrorButton() {
      const btn = getEl("mirror-btn");
      if (!btn) {
        console.warn("[UIManager] Không tìm thấy #mirror-btn trong DOM.");
        return;
      }

      btn.addEventListener("click", () => {
        this.isMirror = !this.isMirror;

        if (this.isMirror) {
          btn.textContent = "🪞 Mirror: ON";
          btn.classList.add("active");
        } else {
          btn.textContent = "🪞 Mirror: OFF";
          btn.classList.remove("active");
        }

        this._emit("mirrorToggle", this.isMirror);
      });
    }

    /**
     * Xử lý click trên #screenshot-btn.
     */
    _bindScreenshotButton() {
      const btn = getEl("screenshot-btn");
      if (!btn) {
        console.warn("[UIManager] Không tìm thấy #screenshot-btn trong DOM.");
        return;
      }

      btn.addEventListener("click", () => {
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; }, 1000);
        this._emit("screenshot");
      });
    }

    /**
     * Xử lý click trên #debug-toggle để hiện/ẩn #debug-panel.
     */
    _bindDebugToggle() {
      const toggleBtn  = getEl("debug-toggle");
      const debugPanel = getEl("debug-panel");

      if (!toggleBtn) {
        console.warn("[UIManager] Không tìm thấy #debug-toggle trong DOM.");
        return;
      }
      if (!debugPanel) {
        console.warn("[UIManager] Không tìm thấy #debug-panel trong DOM.");
        return;
      }

      toggleBtn.addEventListener("click", () => {
        this.isDebugOpen = !this.isDebugOpen;

        if (this.isDebugOpen) {
          debugPanel.style.display = "block";
          toggleBtn.textContent    = "🔍 Debug: ON";
          toggleBtn.classList.add("active");
        } else {
          debugPanel.style.display = "none";
          toggleBtn.textContent    = "🔍 Debug: OFF";
          toggleBtn.classList.remove("active");
        }
      });
    }
  }

  // ─── EXPOSE GLOBAL ─────────────────────────────────────────────────────────
  global.UIManager = UIManager;

})(window);
