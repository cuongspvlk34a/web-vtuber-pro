# 📦 GitHub Deployment Guide — Web VTuber Pro

Complete step-by-step guide to publish this project on GitHub and enable GitHub Pages.

---

## 📁 Final Repo Structure (before pushing)

```
web-vtuber-pro/          ← your local folder name
├── index.html
├── style.css
├── js/
│   ├── app.js
│   ├── facelandmark.js
│   ├── character.js
│   ├── effects.js
│   └── ui.js
├── assets/              ← create this folder, add demo.gif later
├── 404.html
├── .gitignore
├── LICENSE
└── README.md
```

---

## STEP 0 — Create a GitHub Account

Skip if you already have one.

1. Go to https://github.com → **Sign up**
2. Verify your email address
3. Choose the **Free** plan

---

## METHOD A — GitHub Desktop (Recommended for Beginners)

### A1 — Install GitHub Desktop

Download from: https://desktop.github.com/
Sign in with your GitHub account during setup.

### A2 — Create the repo on GitHub.com

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `web-vtuber-pro`
   - **Description:** `Real-time anime VTuber avatar driven by MediaPipe FaceLandmarker`
   - **Visibility:** ✅ Public
   - ⚠️ **Do NOT check** "Add a README file" (we already have one)
   - ⚠️ **Do NOT check** "Add .gitignore"
3. Click **Create repository**
4. Copy the repo URL (e.g. `https://github.com/YOUR-USERNAME/web-vtuber-pro.git`)

### A3 — Add existing project in GitHub Desktop

1. Open **GitHub Desktop**
2. Menu → **File → Add local repository...**
3. Browse to your project folder → Click **Add Repository**
4. If it says "not a git repo" → click **"create a repository"** link
   - Name: `web-vtuber-pro`
   - Local path: your folder
   - ✅ Initialize with README → **NO** (uncheck)
   - Click **Create Repository**

### A4 — First commit

1. In GitHub Desktop, left sidebar shows all changed files — you should see all your files listed
2. In the bottom-left:
   - **Summary:** `feat: initial commit — Web VTuber Pro`
   - **Description:** `MediaPipe face tracking, 3 anime skins, particle effects`
3. Click **Commit to main**

### A5 — Connect to GitHub and push

1. Click **Publish repository** (top bar)
2. Name: `web-vtuber-pro`
3. ✅ Keep this code private → **uncheck** (make it Public)
4. Click **Publish Repository**

Your code is now live at `https://github.com/YOUR-USERNAME/web-vtuber-pro`

---

## METHOD B — Git CLI (Terminal)

### Prerequisites

Check if Git is installed:
```bash
git --version
# Should print: git version 2.x.x
```

If not: https://git-scm.com/downloads

Configure your identity (one-time setup):
```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

### B1 — Create repo on GitHub.com (same as A2 above)

Go to https://github.com/new — create `web-vtuber-pro`, **Public**, **no files initialized**.

### B2 — Initialize local repo

```bash
# Navigate into your project folder
cd path/to/VTuber_Pro_Fixx

# Create assets folder (for demo gif later)
mkdir -p assets

# Initialize Git
git init

# Set default branch to 'main'
git branch -M main
```

### B3 — Stage all files

```bash
# Stage everything (.gitignore will auto-exclude OS junk)
git add .

# Verify what will be committed — check the list looks correct
git status
```

Expected output (should NOT include .DS_Store, node_modules, etc.):
```
new file:   .gitignore
new file:   404.html
new file:   LICENSE
new file:   README.md
new file:   index.html
new file:   js/app.js
new file:   js/character.js
new file:   js/effects.js
new file:   js/facelandmark.js
new file:   js/ui.js
new file:   style.css
```

### B4 — First commit

```bash
git commit -m "feat: initial commit — Web VTuber Pro

- MediaPipe FaceLandmarker face tracking (478 landmarks)
- EAR/MAR algorithms for blink, wink, mouth detection
- 3 anime VTuber skins: Cat, Rabbit, Fox
- Particle effects system
- Mirror mode + screenshot
- Responsive UI — glassmorphism theme"
```

### B5 — Connect to GitHub and push

```bash
# Replace YOUR-USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR-USERNAME/web-vtuber-pro.git

# Push to GitHub
git push -u origin main
```

If prompted for credentials:
- Username: your GitHub username
- Password: use a **Personal Access Token** (not your account password)
  - Create one at: https://github.com/settings/tokens → Generate new token (classic)
  - Scopes: ✅ `repo`

---

## STEP — Enable GitHub Pages

Do this **after** pushing (either method):

1. Go to your repo: `https://github.com/YOUR-USERNAME/web-vtuber-pro`
2. Click **Settings** tab (top navigation)
3. Left sidebar → scroll down to **Pages**
4. Under **Source**:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait ~60 seconds, then refresh the page
7. You'll see a green banner: **"Your site is published at https://YOUR-USERNAME.github.io/web-vtuber-pro"**

### Update README with your live URL

Open `README.md` and replace `YOUR-USERNAME` in the badges and demo link:

```
https://YOUR-USERNAME.github.io/web-vtuber-pro
```

Then commit the update:
```bash
git add README.md
git commit -m "docs: add live GitHub Pages URL"
git push
```

---

## STEP — Verify Deployment

| Check | Expected |
|---|---|
| Repo URL | `https://github.com/YOUR-USERNAME/web-vtuber-pro` |
| Pages URL | `https://YOUR-USERNAME.github.io/web-vtuber-pro` |
| index.html loads | No 404 error |
| Camera permission prompt appears | ✅ |
| Character renders on canvas | ✅ |
| 404 page | Visit any wrong URL → shows your custom 404.html |

---

## Future Updates

After any code change, push with:
```bash
git add .
git commit -m "fix: describe what you changed"
git push
```

GitHub Pages auto-deploys within ~30–60 seconds after each push.
