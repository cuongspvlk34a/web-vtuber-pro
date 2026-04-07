# 🎭 Web VTuber Pro

<div align="center">

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?style=for-the-badge&logo=github)](https://YOUR-USERNAME.github.io/web-vtuber-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev/)

**Real-time anime VTuber avatar controlled by your face — runs entirely in the browser, no install needed.**

[🚀 Live Demo](#) · [📖 How It Works](#-how-it-works) · [🛠 Tech Stack](#-tech-stack) · [🐛 Report Bug](../../issues)

</div>

---

## 📸 Demo

> **How to record your own demo GIF:**
> 1. Run the app → open browser DevTools → set canvas size to 1280×720
> 2. Use [ScreenToGif](https://www.screentogif.com/) (Windows) or [Kap](https://getkap.co/) (macOS) to record
> 3. Trim to ~5 seconds, export as GIF ≤ 5MB
> 4. Drop the file into `/assets/demo.gif` and replace the placeholder below

<div align="center">
  <img src="assets/demo.gif" alt="Web VTuber Pro Demo" width="640"/>
  <br/>
  <em>↑ Replace this placeholder with your own recording</em>
</div>

---

## ✨ Features

| Category | Feature | Details |
|---|---|---|
| 🎭 **Characters** | 3 Anime Skins | 🐱 Cat · 🐰 Rabbit · 🦊 Fox |
| 👁 **Eye Tracking** | Blink & Wink Detection | EAR algorithm — Soukupová & Čech (2016) |
| 👄 **Mouth Tracking** | Open / Close Detection | MAR (Mouth Aspect Ratio) |
| 🗣 **Expressions** | 5 States | Neutral · Happy · Sad · Surprised · Wink |
| 🙂 **Head Pose** | Tilt Detection | Left / Right head tilt tracking |
| ✨ **Effects** | Particle System | 💕 Hearts · ⭐ Stars · 💧 Teardrops · ✨ Sparkles |
| 🪞 **Utility** | Mirror Mode | Flip canvas horizontally |
| 📸 **Utility** | Screenshot | Export current frame as PNG |
| 📊 **Debug** | Live Stats | FPS counter · Landmark count · EAR/MAR/Tilt values |
| 📱 **Layout** | Responsive | Desktop and mobile friendly |

---

## 🚀 Quick Start

### Option A — Open locally (fastest)

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/web-vtuber-pro.git
cd web-vtuber-pro

# Open directly in browser (no server needed)
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

> ⚠️ **Camera access note:** Some browsers block `getUserMedia` on `file://` URLs.
> If the webcam does not start, use Option B or serve locally with:
> ```bash
> npx serve .          # requires Node.js
> python -m http.server 8080  # Python 3
> ```

### Option B — GitHub Pages (recommended)

1. Fork this repo → `Settings` → `Pages`
2. Source: **Deploy from branch** → `main` → `/ (root)` → **Save**
3. Visit `https://YOUR-USERNAME.github.io/web-vtuber-pro` in ~60 seconds

No build step. No dependencies to install. Pure browser.

---

## 🔬 How It Works

### Face Landmark Detection
Uses **MediaPipe FaceLandmarker** (loaded via CDN) to detect **478 3D facial landmarks** at ~30 FPS directly in the browser via WebAssembly.

### EAR — Eye Aspect Ratio
Detects blinks and winks using the formula from Soukupová & Čech (2016):

```
EAR = (|p2−p6| + |p3−p5|) / (2 × |p1−p4|)

EAR ≈ 0.30  →  eye open (normal)
EAR < 0.20  →  eye closed / blinking
```

Landmarks used: Left eye `[33, 160, 158, 133, 153, 144]` · Right eye `[362, 385, 387, 263, 373, 380]`

### MAR — Mouth Aspect Ratio
Detects mouth opening using the vertical-to-horizontal ratio of lip landmarks:

```
MAR = |p13−p14| / |p61−p291|

MAR > 0.5   →  mouth open (surprised / talking)
```

### Head Tilt
Computed from the roll angle between the two eye center points. A signed angle beyond ±10° triggers left/right tilt state.

### Expression State Machine
Five states resolved in priority order:
`wink → surprised → happy → sad → neutral`

---

## 📁 Project Structure

```
web-vtuber-pro/
├── index.html              # App shell & layout (3-column: hidden webcam | canvas | controls)
├── style.css               # Full UI styles — glassmorphism theme, responsive grid
├── js/
│   ├── facelandmark.js     # MediaPipe wrapper + EAR / MAR / tilt calculations
│   ├── character.js        # Canvas renderer — draws VTuber character per frame
│   ├── effects.js          # Particle system — hearts, stars, teardrops, sparkles
│   ├── ui.js               # UI event handlers — skin picker, mirror, screenshot
│   └── app.js              # Entry point — init, game loop, module orchestration
├── assets/
│   └── demo.gif            # (add your own demo recording here)
├── .gitignore
├── LICENSE
└── README.md
```

**Load order (enforced via `defer`):**
```
facelandmark.js → character.js → effects.js → ui.js → app.js
```

---

## 🛠 Tech Stack

| Technology | Role |
|---|---|
| **HTML5 Canvas** | 2D character rendering at 60 FPS |
| **MediaPipe Tasks Vision 0.10.3** | Face landmark inference (WASM, CDN) |
| **Vanilla JavaScript (ES6+)** | All logic — no frameworks |
| **CSS3** | Glassmorphism UI, CSS Grid, animations |
| **Web APIs** | `getUserMedia`, `requestAnimationFrame`, `Canvas2D` |

> **Zero dependencies** to install. MediaPipe is loaded from `cdn.jsdelivr.net` at runtime.

---

## 🌐 Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15.4+ | ✅ Full |
| Mobile Chrome (Android) | ✅ Works |
| Mobile Safari (iOS 15+) | ✅ Works |

> MediaPipe requires WebAssembly support. All modern browsers qualify.

---

## 🔒 Privacy

- **No data ever leaves your device.** All face processing runs locally in the browser via WebAssembly.
- No server, no backend, no analytics, no tracking.
- Camera stream is processed in-memory and never stored or transmitted.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full text.

---

<div align="center">

Made with ❤️ · Powered by [MediaPipe](https://mediapipe.dev/) · Runs on [GitHub Pages](https://pages.github.com/)

</div>
