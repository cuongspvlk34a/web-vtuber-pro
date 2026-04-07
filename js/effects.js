/**
 * js/effects.js — Web VTuber Pro
 * Particle effects overlay system, drawn on top of the VTuber character canvas.
 *
 * Called by app.js each frame AFTER the character has been rendered.
 * app.js controls the animation loop; this file never calls requestAnimationFrame.
 *
 * Expression → Particle mapping:
 *   "happy"                   → Hearts   (pink/red, float upward)
 *   "surprised"               → Stars    (yellow, spin and burst outward)
 *   "sad"                     → Teardrops (light blue, fall downward)
 *   "wink_left" | "wink_right"→ Sparkles (purple/white, flicker quickly)
 *   "neutral"                 → No new particles; existing ones fade out naturally
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  heart: [
    '#FF6B9D',
    '#FF3B6B',
    '#FF85A1',
    '#E91E63',
  ],
  star: [
    '#FFD700',
    '#FFF176',
    '#FFCA28',
    '#FFE57F',
  ],
  teardrop: [
    '#90CAF9',
    '#64B5F6',
    '#81D4FA',
    '#B3E5FC',
  ],
  sparkle: [
    '#CE93D8',
    '#E1BEE7',
    '#FFFFFF',
    '#B39DDB',
  ],
};

const SPAWN_SPREAD = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Particle factories
// ─────────────────────────────────────────────────────────────────────────────

function createHeart(cx, cy) {
  return {
    x: cx + rand(-SPAWN_SPREAD, SPAWN_SPREAD),
    y: cy + rand(-10, 20),
    vx: rand(-0.6, 0.6),
    vy: rand(-1.8, -1.0),
    life: 1.0,
    decay: rand(0.008, 0.013),
    size: rand(10, 20),
    rotation: 0,
    rotationSpeed: rand(-0.03, 0.03),
    color: pick(COLORS.heart),
    type: 'heart',
  };
}

function createStar(cx, cy) {
  const angle = rand(0, Math.PI * 2);
  const speed = rand(0.8, 2.2);
  return {
    x: cx + rand(-SPAWN_SPREAD, SPAWN_SPREAD),
    y: cy + rand(-SPAWN_SPREAD, SPAWN_SPREAD),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.0,
    decay: rand(0.012, 0.018),
    size: rand(10, 22),
    rotation: rand(0, Math.PI * 2),
    rotationSpeed: rand(-0.12, 0.12),
    color: pick(COLORS.star),
    type: 'star',
  };
}

function createTeardrop(cx, cy) {
  return {
    x: cx + rand(-SPAWN_SPREAD * 0.4, SPAWN_SPREAD * 0.4),
    y: cy + rand(-20, 10),
    vx: rand(-0.2, 0.2),
    vy: rand(0.5, 1.2),
    life: 1.0,
    decay: rand(0.010, 0.015),
    size: rand(8, 16),
    rotation: 0,
    rotationSpeed: 0,
    color: pick(COLORS.teardrop),
    type: 'teardrop',
  };
}

function createSparkle(cx, cy) {
  return {
    x: cx + rand(-SPAWN_SPREAD * 1.2, SPAWN_SPREAD * 1.2),
    y: cy + rand(-SPAWN_SPREAD, SPAWN_SPREAD * 0.5),
    vx: rand(-0.5, 0.5),
    vy: rand(-0.5, 0.5),
    life: 1.0,
    decay: rand(0.025, 0.040),
    size: rand(6, 16),
    rotation: rand(0, Math.PI / 4),
    rotationSpeed: rand(-0.15, 0.15),
    color: pick(COLORS.sparkle),
    type: 'sparkle',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Particle drawers
// ─────────────────────────────────────────────────────────────────────────────

function drawHeart(ctx, p) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.scale(s / 20, s / 20);

  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-12, 0, -12, -10, 0, -6);
  ctx.bezierCurveTo(12, -10, 12, 0, 0, 8);
  ctx.closePath();
  ctx.fillStyle = p.color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-3, -3);
  ctx.bezierCurveTo(-7, -7, -7, -10, -3, -8);
  ctx.bezierCurveTo(-1, -7, 0, -5, -2, -3);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();

  ctx.restore();
}

function drawStar(ctx, p) {
  const s      = p.size;
  const outerR = s;
  const innerR = s * 0.42;
  const points = 5;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r     = i % 2 === 0 ? outerR : innerR;
    const px    = Math.cos(angle) * r;
    const py    = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle   = p.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,200,0.5)';
  ctx.lineWidth   = 1.2;
  ctx.stroke();

  ctx.restore();
}

function drawTeardrop(ctx, p) {
  const s    = p.size;
  const r    = s * 0.5;
  const tipY = s * 0.9;

  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.bezierCurveTo(-r * 0.6, r * 0.6, -r * 0.15, tipY * 0.8, 0, tipY);
  ctx.bezierCurveTo(r * 0.15, tipY * 0.8, r * 0.6, r * 0.6, r * Math.cos(Math.PI * 0.15), r * Math.sin(Math.PI * 0.15));
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -r, 0, tipY);
  grad.addColorStop(0, p.color);
  grad.addColorStop(1, 'rgba(179,229,252,0.5)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.2, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  ctx.restore();
}

function drawSparkle(ctx, p) {
  const s     = p.size;
  const long  = s;
  const short = s * 0.4;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  ctx.shadowColor = p.color;
  ctx.shadowBlur  = s * 0.8;
  ctx.strokeStyle = p.color;
  ctx.lineCap     = 'round';

  for (let i = 0; i < 4; i++) {
    const armAngle = (i * Math.PI) / 4;
    const isLong   = i % 2 === 0;
    const len      = isLong ? long : short;

    ctx.lineWidth = isLong ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(armAngle) * len, -Math.sin(armAngle) * len);
    ctx.lineTo( Math.cos(armAngle) * len,  Math.sin(armAngle) * len);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// ParticleSystem class
// ─────────────────────────────────────────────────────────────────────────────

class ParticleSystem {
  /**
   * @param {HTMLCanvasElement} canvas — The canvas shared with the VTuber character.
   */
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.particles   = [];
    this.currentExpression = 'neutral';
    this.spawnTimer  = 0;
    this.spawnInterval  = 8;   // spawn every 8 frames
    this.maxParticles   = 30;  // hard cap
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  setExpression(expressionName) {
    this.currentExpression = expressionName;
  }

  spawnParticle(centerX, centerY) {
    let particle;

    switch (this.currentExpression) {
      case 'happy':
        particle = createHeart(centerX, centerY);
        break;
      case 'surprised':
        particle = createStar(centerX, centerY);
        break;
      case 'sad':
        particle = createTeardrop(centerX, centerY);
        break;
      case 'wink_left':
      case 'wink_right':
        particle = createSparkle(centerX, centerY);
        break;
      default:
        return;
    }

    this.particles.push(particle);
  }

  /**
   * Advances the simulation by one frame.
   * Must be called BEFORE draw() each frame.
   */
  update(centerX, centerY) {
    // Spawning
    this.spawnTimer++;

    if (
      this.spawnTimer >= this.spawnInterval &&
      this.currentExpression !== 'neutral' &&
      this.particles.length < this.maxParticles
    ) {
      const count = Math.random() < 0.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        if (this.particles.length < this.maxParticles) {
          this.spawnParticle(centerX, centerY);
        }
      }
      this.spawnTimer = 0;
    }

    // Physics & lifecycle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'teardrop') p.vy += 0.03;  // gravity
      if (p.type === 'heart')    p.vy -= 0.008; // buoyancy

      p.rotation += p.rotationSpeed;
      p.life     -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Renders all live particles onto the canvas.
   * Must be called AFTER update() and AFTER the character has been drawn.
   */
  draw() {
    const ctx = this.ctx;

    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life * p.life * 2);

      switch (p.type) {
        case 'heart':    drawHeart(ctx, p);    break;
        case 'star':     drawStar(ctx, p);     break;
        case 'teardrop': drawTeardrop(ctx, p); break;
        case 'sparkle':  drawSparkle(ctx, p);  break;
      }
    }

    ctx.globalAlpha = 1;
  }

  clearAll() {
    this.particles = [];
  }

  get particleCount() {
    return this.particles.length;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global export
// ─────────────────────────────────────────────────────────────────────────────

window.ParticleSystem = ParticleSystem;
