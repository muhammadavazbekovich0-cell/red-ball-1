/**
 * Red Ball — 90 ta Asosiy Daraja, 3 ta Dunyo, 3 ta Boss va 10 ta Yashirin Portal Darajasi
 * Barcha darajalar boshidan ochiq (unlocked).
 * Vanilla ES6+ & HTML5 Canvas (tashqi kutubxonalarsiz).
 */

(() => {
  "use strict";

  // =========================================================================
  // 1. OVOZ SINTEZATORI (Web Audio API)
  // =========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem("redball90_muted") === "true";
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem("redball90_muted", String(this.muted));
      if (!this.muted) {
        this.ensureContext();
        this.playTone(520, 0.08, "sine", 0.08);
      }
      return this.muted;
    }

    playTone(freq, duration, type = "sine", gainVal = 0.12, endFreq = null) {
      if (this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    }

    jump() {
      this.playTone(230, 0.16, "sine", 0.13, 520);
    }

    stomp() {
      this.playTone(180, 0.12, "square", 0.11, 440);
    }

    bossHit() {
      this.playTone(140, 0.18, "sawtooth", 0.15, 70);
      setTimeout(() => this.playTone(320, 0.14, "square", 0.11, 640), 70);
    }

    star() {
      this.playTone(660, 0.09, "triangle", 0.12, 990);
      setTimeout(() => this.playTone(990, 0.14, "triangle", 0.11, 1320), 65);
    }

    checkpoint() {
      this.playTone(440, 0.1, "sine", 0.11, 554);
      setTimeout(() => this.playTone(554, 0.1, "sine", 0.11, 659), 90);
      setTimeout(() => this.playTone(659, 0.18, "sine", 0.12, 880), 180);
    }

    portal() {
      this.playTone(300, 0.25, "sine", 0.14, 1100);
      setTimeout(() => this.playTone(500, 0.28, "triangle", 0.12, 1500), 90);
    }

    hurt() {
      this.playTone(240, 0.25, "sawtooth", 0.14, 75);
    }

    win() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        setTimeout(() => this.playTone(n, 0.18, "triangle", 0.12), idx * 105);
      });
    }

    gameOver() {
      const notes = [392.0, 349.23, 311.13, 261.63];
      notes.forEach((n, idx) => {
        setTimeout(() => this.playTone(n, 0.22, "sawtooth", 0.1), idx * 135);
      });
    }
  }

  // =========================================================================
  // 2. 90 TA BOSQICH, 3 DUNYO, 3 BOSS VA 10 TA YASHIRIN PORTAL DARAJASI
  // =========================================================================
  const SECRET_TRIGGER_MAIN_LEVELS = [5, 13, 22, 30, 38, 47, 56, 65, 76, 86];

  function createSeededRng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function getWorldIdForMainLevel(levelNum) {
    if (levelNum <= 30) return 1;
    if (levelNum <= 60) return 2;
    return 3;
  }

  function getWorldLabel(worldId, isSecret = false) {
    if (isSecret) return "✦ Yashirin Dunyo";
    if (worldId === 1) return "1-Dunyo: Yashil Vodiy";
    if (worldId === 2) return "2-Dunyo: Qizil Kanyon";
    return "3-Dunyo: Tungi Dunyo";
  }

  function buildBossLevel(levelNum) {
    const worldId = getWorldIdForMainLevel(levelNum);
    const bossIndex = levelNum === 30 ? 1 : levelNum === 60 ? 2 : 3;
    const maxHp = 4 + bossIndex * 2;
    const arenaW = 1040;
    const height = 620;
    const floorY = 470;

    const names = {
      1: "Vodiy Qo‘riqchisi (Boss 1)",
      2: "Kanyon Vayronachisi (Boss 2)",
      3: "Tungi Soyalar Hukmdori (Boss 3)",
    };

    const platforms = [
      { x: 0, y: floorY, w: arenaW, h: 150, type: "ground" },
      { x: 110, y: 365, w: 170, h: 24, type: "wood" },
      { x: arenaW - 280, y: 365, w: 170, h: 24, type: "wood" },
      { x: arenaW / 2 - 95, y: 285, w: 190, h: 24, type: "stone" },
    ];

    const movingPlatforms = bossIndex >= 2
      ? [
          {
            x: 330,
            y: 385,
            w: 115,
            h: 22,
            type: "wood",
            axis: "x",
            range: 55,
            speed: 1.7 + bossIndex * 0.25,
            phase: 0,
          },
          {
            x: 595,
            y: 385,
            w: 115,
            h: 22,
            type: "wood",
            axis: "x",
            range: 55,
            speed: 1.7 + bossIndex * 0.25,
            phase: Math.PI,
          },
        ]
      : [];

    const hazards = bossIndex === 3
      ? [
          { x: 470, y: floorY - 22, w: 40, h: 22, kind: "spike" },
          { x: 530, y: floorY - 22, w: 40, h: 22, kind: "spike" },
        ]
      : [];

    const secretIdx = SECRET_TRIGGER_MAIN_LEVELS.indexOf(levelNum);
    const portal = secretIdx >= 0
      ? { x: 145, y: 365, targetSecretKey: `secret_${secretIdx + 1}` }
      : null;

    return {
      key: `main_${levelNum}`,
      id: levelNum,
      numberLabel: `${levelNum}`,
      title: `${levelNum}-bosqich: ${names[bossIndex]}`,
      worldId,
      isSecret: false,
      isBoss: true,
      width: arenaW,
      height,
      spawn: { x: 120, y: 410 },
      waterY: 590,
      platforms,
      movingPlatforms,
      hazards,
      enemies: [],
      boss: {
        name: names[bossIndex],
        x: arenaW - 210,
        y: floorY - 84,
        w: 84,
        h: 84,
        vx: (135 + bossIndex * 35) * -1,
        vy: 0,
        minX: 190,
        maxX: arenaW - 110,
        hp: maxHp,
        maxHp,
        alive: true,
        hitCooldown: 0,
        jumpTimer: 1.8,
        floorY,
      },
      stars: [
        { x: 195, y: 310 },
        { x: arenaW / 2, y: 230 },
        { x: arenaW - 195, y: 310 },
      ],
      checkpoints: [],
      portal,
      goal: { x: arenaW - 110, y: floorY, unlocked: false },
    };
  }

  function buildStandardLevel(levelNum, isSecret = false, secretIndex = 0) {
    const rng = createSeededRng(isSecret ? secretIndex * 997 + 42 : levelNum * 7919 + 13);
    const worldId = isSecret ? ((secretIndex % 3) + 1) : getWorldIdForMainLevel(levelNum);

    const progressRatio = isSecret
      ? 0.45 + secretIndex * 0.05
      : ((levelNum - 1) % 30) / 29 + (worldId - 1) * 0.15;

    const segmentsCount = isSecret
      ? 5 + Math.floor(secretIndex / 3)
      : Math.min(9, 5 + Math.floor(progressRatio * 4.5));

    const platforms = [];
    const movingPlatforms = [];
    const hazards = [];
    const enemies = [];
    const stars = [];
    const checkpoints = [];

    let cursorX = 0;
    let currentY = 440;
    const height = 620;
    const waterY = worldId === 2 ? 535 : worldId === 3 ? 545 : 570;

    const startW = 360;
    platforms.push({ x: 0, y: currentY, w: startW, h: height - currentY + 40, type: "ground" });
    cursorX = startW;

    for (let i = 0; i < segmentsCount; i++) {
      const gap = Math.round(70 + rng() * (65 + Math.min(60, progressRatio * 55)));
      const deltaY = Math.round((rng() - 0.48) * 95);
      currentY = Math.max(290, Math.min(465, currentY + deltaY));

      const useMoving = !isSecret && progressRatio > 0.15 && i % 3 === 1 && rng() > 0.35;

      if (useMoving) {
        const mpW = Math.round(125 - Math.min(25, progressRatio * 20));
        const axis = rng() > 0.45 ? "x" : "y";
        const range = axis === "x" ? Math.round(55 + rng() * 55) : Math.round(45 + rng() * 40);
        const speed = Number((1.5 + progressRatio * 1.3 + rng() * 0.5).toFixed(2));
        const mpX = cursorX + gap;

        movingPlatforms.push({
          x: mpX,
          y: currentY,
          w: mpW,
          h: 24,
          type: "wood",
          axis,
          range,
          speed,
          phase: rng() * Math.PI * 2,
        });

        if (rng() > 0.35) {
          stars.push({
            x: mpX + mpW / 2 + (axis === "x" ? range * 0.4 : 0),
            y: currentY - 62,
          });
        }

        cursorX = mpX + mpW + (axis === "x" ? range * 0.45 : 15);
      }

      const platW = Math.round(280 + rng() * 210);
      const platType = i % 3 === 2 ? "stone" : "ground";
      const platX = cursorX + (useMoving ? 45 : gap);

      platforms.push({
        x: platX,
        y: currentY,
        w: platW,
        h: height - currentY + 40,
        type: platType,
      });

      if (platW > 250 && rng() < 0.35 + progressRatio * 0.4) {
        const spikeW = rng() > 0.65 ? 64 : 48;
        const spikeX = platX + Math.round(platW * 0.42);
        hazards.push({
          x: spikeX,
          y: currentY - 22,
          w: spikeW,
          h: 22,
          kind: "spike",
        });

        if (stars.length < 3 && rng() > 0.4) {
          stars.push({
            x: spikeX + spikeW / 2,
            y: currentY - 82,
          });
        }
      }

      if (platW > 240 && (isSecret || progressRatio > 0.08) && rng() < 0.45 + progressRatio * 0.4) {
        const margin = 24;
        const eW = 36;
        const eH = 36;
        const minX = platX + margin;
        const maxX = platX + platW - margin;
        if (maxX - minX > 70) {
          const eSpeed = Math.round(75 + progressRatio * 85 + rng() * 35);
          enemies.push({
            x: minX + 12,
            y: currentY - eH,
            w: eW,
            h: eH,
            minX,
            maxX,
            speed: eSpeed,
          });
        }
      }

      if (!isSecret && i === Math.floor(segmentsCount / 2)) {
        checkpoints.push({
          x: platX + 55,
          y: currentY,
        });
      }

      cursorX = platX + platW;
    }

    const endGap = 85;
    const endY = Math.max(310, Math.min(445, currentY - 15));
    const endW = 340;
    const endX = cursorX + endGap;

    platforms.push({
      x: endX,
      y: endY,
      w: endW,
      h: height - endY + 40,
      type: "ground",
    });

    while (stars.length < 3) {
      const idx = stars.length;
      const targetPlat = platforms[Math.min(platforms.length - 1, 1 + idx * 2)];
      stars.push({
        x: targetPlat.x + targetPlat.w * 0.5,
        y: targetPlat.y - 65,
      });
    }
    if (stars.length > 3) {
      stars.length = 3;
    }

    let portal = null;
    if (!isSecret) {
      const secretIdx = SECRET_TRIGGER_MAIN_LEVELS.indexOf(levelNum);
      if (secretIdx >= 0) {
        const portalPlat = platforms[Math.max(1, platforms.length - 2)];
        portal = {
          x: portalPlat.x + portalPlat.w * 0.72,
          y: portalPlat.y,
          targetSecretKey: `secret_${secretIdx + 1}`,
        };
      }
    }

    const levelNumber = isSecret ? secretIndex + 1 : levelNum;
    const key = isSecret ? `secret_${levelNumber}` : `main_${levelNumber}`;
    const title = isSecret
      ? `Yashirin ${levelNumber}-bosqich: Portal Sirlari`
      : `${levelNumber}-bosqich (${getWorldLabel(worldId).split(": ")[1]})`;

    return {
      key,
      id: levelNumber,
      numberLabel: isSecret ? `S-${levelNumber}` : `${levelNumber}`,
      title,
      worldId,
      isSecret,
      isBoss: false,
      width: endX + endW,
      height,
      spawn: { x: 110, y: 370 },
      waterY,
      platforms,
      movingPlatforms,
      hazards,
      enemies,
      boss: null,
      stars,
      checkpoints,
      portal,
      goal: { x: endX + endW - 115, y: endY, unlocked: true },
    };
  }

  function generateAllLevels() {
    const mainLevels = [];
    for (let n = 1; n <= 90; n++) {
      if (n === 30 || n === 60 || n === 90) {
        mainLevels.push(buildBossLevel(n));
      } else {
        mainLevels.push(buildStandardLevel(n, false, 0));
      }
    }

    const secretLevels = [];
    for (let s = 1; s <= 10; s++) {
      secretLevels.push(buildStandardLevel(s, true, s));
    }

    return { mainLevels, secretLevels };
  }

  const { mainLevels: MAIN_LEVELS, secretLevels: SECRET_LEVELS } = generateAllLevels();

  function findLevelByKey(key) {
    if (typeof key === "string" && key.startsWith("secret_")) {
      const idx = parseInt(key.replace("secret_", ""), 10) - 1;
      return SECRET_LEVELS[Math.max(0, Math.min(SECRET_LEVELS.length - 1, idx))];
    }
    if (typeof key === "string" && key.startsWith("main_")) {
      const idx = parseInt(key.replace("main_", ""), 10) - 1;
      return MAIN_LEVELS[Math.max(0, Math.min(MAIN_LEVELS.length - 1, idx))];
    }
    return MAIN_LEVELS[0];
  }

  // =========================================================================
  // 3. PROGRESSNI SAQLASH (localStorage) — BARCHA DARAJALAR OCHIQ
  // =========================================================================
  const STORAGE_KEY = "redball90_all_unlocked_v1";

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          starsByKey: parsed.starsByKey && typeof parsed.starsByKey === "object" ? parsed.starsByKey : {},
        };
      }
    } catch (_) {}
    return { starsByKey: {} };
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (_) {}
  }

  // =========================================================================
  // 4. ASOSIY O'YIN DVIGATELI
  // =========================================================================
  class RedBallGame {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.sound = new SoundEngine();
      this.progress = loadProgress();

      this.ui = {
        hudLevel: document.getElementById("hudLevel"),
        hudWorldBadge: document.getElementById("hudWorldBadge"),
        hudLives: document.getElementById("hudLives"),
        hudStars: document.getElementById("hudStars"),
        hudTotalStars: document.getElementById("hudTotalStars"),
        levelBanner: document.getElementById("levelBanner"),
        bannerTitle: document.getElementById("bannerTitle"),
        levelSelectBtn: document.getElementById("levelSelectBtn"),
        levelModal: document.getElementById("levelModal"),
        closeLevelModalBtn: document.getElementById("closeLevelModalBtn"),
        levelGrid: document.getElementById("levelGrid"),
        worldTabs: Array.from(document.querySelectorAll(".world-tab")),
        winModal: document.getElementById("winModal"),
        winBadgeText: document.getElementById("winBadgeText"),
        winSubtitle: document.getElementById("winSubtitle"),
        winStarsDisplay: document.getElementById("winStarsDisplay"),
        replayWinBtn: document.getElementById("replayWinBtn"),
        nextLevelBtn: document.getElementById("nextLevelBtn"),
        loseModal: document.getElementById("loseModal"),
        loseSubtitle: document.getElementById("loseSubtitle"),
        loseLevelSelectBtn: document.getElementById("loseLevelSelectBtn"),
        retryBtn: document.getElementById("retryBtn"),
        restartBtn: document.getElementById("restartBtn"),
        soundBtn: document.getElementById("soundBtn"),
        btnLeft: document.getElementById("btnLeft"),
        btnRight: document.getElementById("btnRight"),
        btnJump: document.getElementById("btnJump"),
      };

      this.physics = {
        gravity: 1580,
        moveAccel: 2700,
        airAccel: 1800,
        maxSpeed: 345,
        groundFriction: 2250,
        airFriction: 420,
        jumpSpeed: -645,
        enemyBounceSpeed: -490,
        bossBounceSpeed: -560,
        coyoteTimeMax: 0.11,
        jumpBufferMax: 0.12,
        maxLives: 3,
      };

      this.input = {
        left: false,
        right: false,
        jumpHeld: false,
        jumpBufferTimer: 0,
      };

      this.activeTab = "w1";
      this.returnLevelKey = null;
      this.state = "playing";
      this.time = 0;
      this.portalCooldown = 0;
      this.bannerTimeout = null;

      this.camera = { x: 0, y: 0 };
      this.particles = [];
      this.floatingTexts = [];
      this.clouds = this.createClouds();

      this.bindEvents();
      this.updateSoundButton();

      this.loadLevelByKey("main_1", true, false);

      this.lastTimestamp = performance.now();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    createClouds() {
      return [
        { x: 110, y: 78, scale: 1.0, speed: 10 },
        { x: 450, y: 120, scale: 0.78, speed: 7 },
        { x: 810, y: 68, scale: 1.15, speed: 12 },
        { x: 1160, y: 108, scale: 0.85, speed: 8 },
        { x: 1520, y: 82, scale: 1.05, speed: 11 },
      ];
    }

    loadLevelByKey(key, fullReset = true, fromPortal = false) {
      const cfg = findLevelByKey(key);

      if (!fromPortal && !cfg.isSecret) {
        this.returnLevelKey = null;
      }

      this.level = {
        ...cfg,
        movingPlatforms: cfg.movingPlatforms.map((mp) => ({
          ...mp,
          baseX: mp.x,
          baseY: mp.y,
          prevX: mp.x,
          prevY: mp.y,
          dx: 0,
          dy: 0,
        })),
        enemies: cfg.enemies.map((en) => ({
          ...en,
          dir: 1,
          alive: true,
        })),
        boss: cfg.boss ? { ...cfg.boss } : null,
        stars: cfg.stars.map((st, idx) => ({
          ...st,
          id: idx,
          collected: false,
          bobPhase: idx * 1.1,
        })),
        checkpoints: cfg.checkpoints.map((cp, idx) => ({
          ...cp,
          id: idx,
          activated: false,
        })),
        portal: cfg.portal ? { ...cfg.portal } : null,
        goal: { ...cfg.goal },
      };

      if (fullReset) {
        this.lives = this.physics.maxLives;
        this.respawnPoint = { x: cfg.spawn.x, y: cfg.spawn.y };
      }

      this.portalCooldown = fromPortal ? 1.0 : 0.25;
      this.particles = [];
      this.floatingTexts = [];
      this.resetBallToRespawn();

      this.camera.x = Math.max(0, Math.min(this.level.width - this.canvas.width, this.ball.x - this.canvas.width * 0.35));
      this.camera.y = 0;

      this.state = "playing";
      this.hideAllModals();
      this.showBanner(cfg.title);
      this.updateHUD();
    }

    resetBallToRespawn() {
      const rp = this.respawnPoint;
      this.ball = {
        x: rp.x,
        y: rp.y,
        r: 20,
        vx: 0,
        vy: 0,
        angle: 0,
        onGround: false,
        groundPlatform: null,
        coyoteTimer: 0,
        invulnTimer: 1.1,
        scaleX: 1,
        scaleY: 1,
        targetScaleX: 1,
        targetScaleY: 1,
      };
    }

    showBanner(text) {
      this.ui.bannerTitle.textContent = text;
      this.ui.levelBanner.classList.add("visible");
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.ui.levelBanner.classList.remove("visible");
      }, 2200);
    }

    hideAllModals() {
      this.ui.levelModal.classList.add("hidden");
      this.ui.winModal.classList.add("hidden");
      this.ui.loseModal.classList.add("hidden");
    }

    getTotalStars() {
      return Object.values(this.progress.starsByKey).reduce((sum, n) => sum + (Number(n) || 0), 0);
    }

    updateHUD() {
      const collectedCount = this.level.stars.filter((s) => s.collected).length;
      const totalInLevel = this.level.stars.length;

      if (this.level.isSecret) {
        this.ui.hudLevel.textContent = `Yashirin ${this.level.id}/10`;
      } else {
        this.ui.hudLevel.textContent = `${this.level.id} / 90`;
      }

      this.ui.hudWorldBadge.textContent = getWorldLabel(this.level.worldId, this.level.isSecret);
      this.ui.hudWorldBadge.className = "world-badge";
      if (this.level.isSecret) {
        this.ui.hudWorldBadge.classList.add("secret");
      } else if (this.level.worldId === 2) {
        this.ui.hudWorldBadge.classList.add("world-2");
      } else if (this.level.worldId === 3) {
        this.ui.hudWorldBadge.classList.add("world-3");
      }

      this.ui.hudLives.textContent = String(Math.max(0, this.lives));
      this.ui.hudStars.textContent = `${collectedCount} / ${totalInLevel}`;
      this.ui.hudTotalStars.textContent = `(Jami: ${this.getTotalStars()})`;
    }

    updateSoundButton() {
      this.ui.soundBtn.textContent = this.sound.muted ? "🔇" : "🔊";
    }

    // =========================================================================
    // 5. BOSHQARUV VA HODISALAR
    // =========================================================================
    bindEvents() {
      window.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", " "].includes(e.key)) {
          e.preventDefault();
        }
        this.sound.ensureContext();

        const k = e.key.toLowerCase();
        if (k === "arrowleft" || k === "a") this.input.left = true;
        if (k === "arrowright" || k === "d") this.input.right = true;
        if (k === "arrowup" || k === "w" || e.code === "Space") {
          if (!this.input.jumpHeld) {
            this.input.jumpBufferTimer = this.physics.jumpBufferMax;
          }
          this.input.jumpHeld = true;
        }
        if (k === "r") {
          this.loadLevelByKey(this.level.key, true, Boolean(this.returnLevelKey));
        }
        if (k === "escape" && !this.ui.levelModal.classList.contains("hidden")) {
          this.closeLevelModal();
        }
      });

      window.addEventListener("keyup", (e) => {
        const k = e.key.toLowerCase();
        if (k === "arrowleft" || k === "a") this.input.left = false;
        if (k === "arrowright" || k === "d") this.input.right = false;
        if (k === "arrowup" || k === "w" || e.code === "Space") {
          this.input.jumpHeld = false;
          if (this.ball && this.ball.vy < -180) {
            this.ball.vy *= 0.65;
          }
        }
      });

      const bindHoldButton = (el, prop) => {
        const press = (ev) => {
          ev.preventDefault();
          this.sound.ensureContext();
          this.input[prop] = true;
          el.classList.add("active");
        };
        const release = (ev) => {
          ev.preventDefault();
          this.input[prop] = false;
          el.classList.remove("active");
        };
        el.addEventListener("pointerdown", press);
        el.addEventListener("pointerup", release);
        el.addEventListener("pointerleave", release);
        el.addEventListener("pointercancel", release);
      };

      bindHoldButton(this.ui.btnLeft, "left");
      bindHoldButton(this.ui.btnRight, "right");

      const pressJump = (ev) => {
        ev.preventDefault();
        this.sound.ensureContext();
        if (!this.input.jumpHeld) {
          this.input.jumpBufferTimer = this.physics.jumpBufferMax;
        }
        this.input.jumpHeld = true;
        this.ui.btnJump.classList.add("active");
      };
      const releaseJump = (ev) => {
        ev.preventDefault();
        this.input.jumpHeld = false;
        if (this.ball && this.ball.vy < -180) {
          this.ball.vy *= 0.65;
        }
        this.ui.btnJump.classList.remove("active");
      };
      this.ui.btnJump.addEventListener("pointerdown", pressJump);
      this.ui.btnJump.addEventListener("pointerup", releaseJump);
      this.ui.btnJump.addEventListener("pointerleave", releaseJump);
      this.ui.btnJump.addEventListener("pointercancel", releaseJump);

      this.ui.restartBtn.addEventListener("click", () => {
        this.loadLevelByKey(this.level.key, true, Boolean(this.returnLevelKey));
      });

      this.ui.soundBtn.addEventListener("click", () => {
        this.sound.toggleMute();
        this.updateSoundButton();
      });

      this.ui.worldTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          this.activeTab = tab.dataset.tab;
          this.ui.worldTabs.forEach((t) => t.classList.toggle("active", t === tab));
          this.renderLevelGrid();
        });
      });

      this.ui.levelSelectBtn.addEventListener("click", () => this.openLevelModal());
      this.ui.closeLevelModalBtn.addEventListener("click", () => this.closeLevelModal());
      this.ui.levelModal.addEventListener("click", (e) => {
        if (e.target === this.ui.levelModal) this.closeLevelModal();
      });

      this.ui.replayWinBtn.addEventListener("click", () => {
        this.loadLevelByKey(this.level.key, true, Boolean(this.returnLevelKey));
      });

      this.ui.nextLevelBtn.addEventListener("click", () => {
        if (this.level.isSecret && this.returnLevelKey) {
          const retKey = this.returnLevelKey;
          this.returnLevelKey = null;
          this.loadLevelByKey(retKey, false, false);
          return;
        }

        if (this.level.id < MAIN_LEVELS.length) {
          this.loadLevelByKey(`main_${this.level.id + 1}`, true, false);
        } else {
          this.loadLevelByKey("main_1", true, false);
        }
      });

      this.ui.retryBtn.addEventListener("click", () => {
        this.loadLevelByKey(this.level.key, true, Boolean(this.returnLevelKey));
      });

      this.ui.loseLevelSelectBtn.addEventListener("click", () => {
        this.hideAllModals();
        this.openLevelModal();
      });
    }

    openLevelModal() {
      if (this.state === "playing") {
        this.state = "paused";
      }
      if (this.level.isSecret) {
        this.activeTab = "secret";
      } else if (this.level.id <= 30) {
        this.activeTab = "w1";
      } else if (this.level.id <= 60) {
        this.activeTab = "w2";
      } else {
        this.activeTab = "w3";
      }
      this.ui.worldTabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === this.activeTab));
      this.renderLevelGrid();
      this.ui.levelModal.classList.remove("hidden");
    }

    closeLevelModal() {
      this.ui.levelModal.classList.add("hidden");
      if (this.state === "paused") {
        this.state = "playing";
        this.lastTimestamp = performance.now();
      }
    }

    renderLevelGrid() {
      this.ui.levelGrid.innerHTML = "";

      if (this.activeTab === "secret") {
        SECRET_LEVELS.forEach((lvl) => {
          const earned = Number(this.progress.starsByKey[lvl.key] || 0);

          const tile = document.createElement("button");
          tile.type = "button";
          tile.className = `level-tile secret-tile ${this.level.key === lvl.key ? "current" : ""}`;

          const starsHtml = [1, 2, 3]
            .map((n) => `<span class="${n <= earned ? "" : "dim"}">★</span>`)
            .join("");

          tile.innerHTML = `
            <div class="level-tile-top">
              <span>${lvl.numberLabel}</span>
              <span>🌀</span>
            </div>
            <div class="level-tile-sub">Yashirin Portal</div>
            <div class="level-tile-stars">${starsHtml}</div>
          `;

          tile.addEventListener("click", () => {
            this.closeLevelModal();
            this.loadLevelByKey(lvl.key, true, false);
          });

          this.ui.levelGrid.appendChild(tile);
        });
        return;
      }

      const rangeMap = {
        w1: [1, 30],
        w2: [31, 60],
        w3: [61, 90],
      };
      const [startNum, endNum] = rangeMap[this.activeTab] || [1, 30];

      for (let num = startNum; num <= endNum; num++) {
        const lvl = MAIN_LEVELS[num - 1];
        const earned = Number(this.progress.starsByKey[lvl.key] || 0);

        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = `level-tile ${lvl.isBoss ? "boss-tile" : ""} ${this.level.key === lvl.key ? "current" : ""}`;

        const starsHtml = [1, 2, 3]
          .map((n) => `<span class="${n <= earned ? "" : "dim"}">★</span>`)
          .join("");

        tile.innerHTML = `
          <div class="level-tile-top">
            <span>${lvl.isBoss ? `👑 ${num}` : `${num}-bosqich`}</span>
            <span>${lvl.isBoss ? "⚔" : "▶"}</span>
          </div>
          <div class="level-tile-sub">${lvl.isBoss ? "BOSS JANGI" : getWorldLabel(lvl.worldId).split(": ")[1]}</div>
          <div class="level-tile-stars">${starsHtml}</div>
        `;

        tile.addEventListener("click", () => {
          this.closeLevelModal();
          this.loadLevelByKey(lvl.key, true, false);
        });

        this.ui.levelGrid.appendChild(tile);
      }
    }

    // =========================================================================
    // 6. O'YIN SIKLI VA FIZIKA
    // =========================================================================
    loop(timestamp) {
      const rawDt = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;
      const dt = Math.min(0.033, Math.max(0.001, rawDt));

      if (this.state === "playing") {
        this.time += dt;
        if (this.portalCooldown > 0) {
          this.portalCooldown = Math.max(0, this.portalCooldown - dt);
        }
        this.update(dt);
      } else {
        this.time += dt * 0.4;
        this.updateParticles(dt);
      }

      this.render();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
      this.updateMovingPlatforms(dt);
      this.updateBall(dt);
      this.updateEnemies(dt);
      this.updateBoss(dt);
      this.updateCollectiblesCheckpointsAndPortal();
      this.updateGoal();
      this.updateParticles(dt);
      this.updateCamera(dt);
    }

    updateMovingPlatforms(dt) {
      for (const mp of this.level.movingPlatforms) {
        mp.prevX = mp.x;
        mp.prevY = mp.y;

        const offset = Math.sin(this.time * mp.speed + mp.phase) * mp.range;
        if (mp.axis === "x") {
          mp.x = mp.baseX + offset;
          mp.y = mp.baseY;
        } else {
          mp.x = mp.baseX;
          mp.y = mp.baseY + offset;
        }

        mp.dx = mp.x - mp.prevX;
        mp.dy = mp.y - mp.prevY;
      }
    }

    updateBall(dt) {
      const b = this.ball;
      const p = this.physics;

      if (b.invulnTimer > 0) {
        b.invulnTimer = Math.max(0, b.invulnTimer - dt);
      }

      if (b.onGround && b.groundPlatform && b.groundPlatform.dx !== undefined) {
        b.x += b.groundPlatform.dx;
        b.y += b.groundPlatform.dy;
      }

      const moveDir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
      if (moveDir !== 0) {
        const accel = b.onGround ? p.moveAccel : p.airAccel;
        b.vx += moveDir * accel * dt;
        if (Math.abs(b.vx) > p.maxSpeed) {
          b.vx = Math.sign(b.vx) * p.maxSpeed;
        }
      } else {
        const friction = b.onGround ? p.groundFriction : p.airFriction;
        if (Math.abs(b.vx) <= friction * dt) {
          b.vx = 0;
        } else {
          b.vx -= Math.sign(b.vx) * friction * dt;
        }
      }

      if (b.onGround) {
        b.coyoteTimer = p.coyoteTimeMax;
      } else {
        b.coyoteTimer = Math.max(0, b.coyoteTimer - dt);
      }

      if (this.input.jumpBufferTimer > 0) {
        this.input.jumpBufferTimer = Math.max(0, this.input.jumpBufferTimer - dt);
      }

      if (this.input.jumpBufferTimer > 0 && b.coyoteTimer > 0) {
        b.vy = p.jumpSpeed;
        b.onGround = false;
        b.groundPlatform = null;
        b.coyoteTimer = 0;
        this.input.jumpBufferTimer = 0;

        b.targetScaleX = 0.82;
        b.targetScaleY = 1.22;
        this.spawnParticles(b.x, b.y + b.r, 7, "#86efac", "dust");
        this.sound.jump();
      }

      b.vy += p.gravity * dt;
      if (b.vy > 980) b.vy = 980;

      const wasOnGround = b.onGround;
      b.onGround = false;
      b.groundPlatform = null;

      b.x += b.vx * dt;
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = 0;
      } else if (b.x + b.r > this.level.width) {
        b.x = this.level.width - b.r;
        b.vx = 0;
      }

      const allPlatforms = [...this.level.platforms, ...this.level.movingPlatforms];
      for (const plat of allPlatforms) {
        this.resolveCircleRectHorizontal(b, plat);
      }

      b.y += b.vy * dt;
      for (const plat of allPlatforms) {
        const landed = this.resolveCircleRectVertical(b, plat);
        if (landed) {
          b.onGround = true;
          b.groundPlatform = plat;
        }
      }

      if (!wasOnGround && b.onGround) {
        b.targetScaleX = 1.22;
        b.targetScaleY = 0.8;
        this.spawnParticles(b.x, b.y + b.r, 5, "#86efac", "dust");
      }

      b.scaleX += (b.targetScaleX - b.scaleX) * Math.min(1, dt * 16);
      b.scaleY += (b.targetScaleY - b.scaleY) * Math.min(1, dt * 16);
      b.targetScaleX += (1 - b.targetScaleX) * Math.min(1, dt * 12);
      b.targetScaleY += (1 - b.targetScaleY) * Math.min(1, dt * 12);

      b.angle += (b.vx * dt) / b.r;
      this.checkHazards();
    }

    resolveCircleRectHorizontal(ball, rect) {
      const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < ball.r * ball.r) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = ball.r - dist;
        const nx = dx / dist;
        if (Math.abs(nx) > 0.55) {
          ball.x += nx * overlap;
          ball.vx = 0;
        }
      }
    }

    resolveCircleRectVertical(ball, rect) {
      const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < ball.r * ball.r) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = ball.r - dist;
        const ny = dy / dist;

        if (ny < 0 && ball.vy >= 0) {
          ball.y -= overlap;
          ball.vy = 0;
          return true;
        } else if (ny > 0 && ball.vy < 0) {
          ball.y += overlap;
          ball.vy = 0;
        } else {
          ball.x += dx * 0.25;
          ball.y += dy * 0.25;
        }
      }
      return false;
    }

    updateEnemies(dt) {
      const b = this.ball;

      for (const en of this.level.enemies) {
        if (!en.alive) continue;

        en.x += en.dir * en.speed * dt;
        if (en.x <= en.minX) {
          en.x = en.minX;
          en.dir = 1;
        } else if (en.x + en.w >= en.maxX) {
          en.x = en.maxX - en.w;
          en.dir = -1;
        }

        const closestX = Math.max(en.x, Math.min(b.x, en.x + en.w));
        const closestY = Math.max(en.y, Math.min(b.y, en.y + en.h));
        const dx = b.x - closestX;
        const dy = b.y - closestY;

        if (dx * dx + dy * dy < b.r * b.r) {
          const stompingFromAbove = b.vy > 0 && b.y + b.r * 0.45 < en.y + en.h * 0.55;

          if (stompingFromAbove) {
            en.alive = false;
            b.vy = this.physics.enemyBounceSpeed;
            b.onGround = false;
            b.targetScaleX = 1.25;
            b.targetScaleY = 0.78;
            this.spawnParticles(en.x + en.w / 2, en.y + en.h / 2, 16, "#ef233c", "burst");
            this.addFloatingText(en.x + en.w / 2, en.y - 6, "+100", "#fde047");
            this.sound.stomp();
          } else {
            this.damagePlayer(Math.sign(b.x - (en.x + en.w / 2)) || -1);
          }
        }
      }
    }

    updateBoss(dt) {
      const boss = this.level.boss;
      if (!boss || !boss.alive) return;

      const b = this.ball;
      if (boss.hitCooldown > 0) {
        boss.hitCooldown = Math.max(0, boss.hitCooldown - dt);
      }

      boss.x += boss.vx * dt;
      if (boss.x <= boss.minX) {
        boss.x = boss.minX;
        boss.vx = Math.abs(boss.vx);
      } else if (boss.x + boss.w >= boss.maxX) {
        boss.x = boss.maxX - boss.w;
        boss.vx = -Math.abs(boss.vx);
      }

      boss.jumpTimer -= dt;
      if (boss.jumpTimer <= 0 && boss.y >= boss.floorY - boss.h - 2) {
        boss.vy = -420;
        boss.jumpTimer = 2.4;
      }

      boss.vy += 1200 * dt;
      boss.y += boss.vy * dt;
      if (boss.y > boss.floorY - boss.h) {
        boss.y = boss.floorY - boss.h;
        boss.vy = 0;
      }

      const closestX = Math.max(boss.x, Math.min(b.x, boss.x + boss.w));
      const closestY = Math.max(boss.y, Math.min(b.y, boss.y + boss.h));
      const dx = b.x - closestX;
      const dy = b.y - closestY;

      if (dx * dx + dy * dy < b.r * b.r) {
        const stompingBoss = b.vy > 0 && b.y + b.r * 0.4 < boss.y + boss.h * 0.45;
        if (stompingBoss && boss.hitCooldown <= 0) {
          boss.hp -= 1;
          boss.hitCooldown = 0.65;
          b.vy = this.physics.bossBounceSpeed;
          b.onGround = false;
          b.targetScaleX = 1.28;
          b.targetScaleY = 0.75;
          this.sound.bossHit();
          this.spawnParticles(boss.x + boss.w / 2, boss.y, 20, "#f97316", "burst");
          this.addFloatingText(boss.x + boss.w / 2, boss.y - 14, `BOSS -1 HP (${boss.hp})`, "#fb923c");

          if (boss.hp <= 0) {
            boss.alive = false;
            this.level.goal.unlocked = true;
            this.spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, 36, "#facc15", "burst");
            this.addFloatingText(boss.x + boss.w / 2, boss.y - 24, "BOSS YENGILDI! FINISH OCHILDI", "#4ade80");
            this.sound.win();
          }
        } else if (boss.hitCooldown <= 0) {
          this.damagePlayer(Math.sign(b.x - (boss.x + boss.w / 2)) || -1);
        }
      }
    }

    checkHazards() {
      const b = this.ball;

      if (b.y - b.r > this.level.height + 40) {
        this.handleFallOrHazard(true);
        return;
      }

      if (b.y + b.r > this.level.waterY + 10) {
        this.spawnParticles(b.x, this.level.waterY + 4, 14, "#7dd3fc", "splash");
        this.handleFallOrHazard(true);
        return;
      }

      for (const hz of this.level.hazards) {
        const hx = hz.x + 5;
        const hy = hz.y + 6;
        const hw = hz.w - 10;
        const hh = hz.h - 6;

        const closestX = Math.max(hx, Math.min(b.x, hx + hw));
        const closestY = Math.max(hy, Math.min(b.y, hy + hh));
        const dx = b.x - closestX;
        const dy = b.y - closestY;

        if (dx * dx + dy * dy < (b.r - 2) * (b.r - 2)) {
          this.handleFallOrHazard(false);
          return;
        }
      }
    }

    handleFallOrHazard(isPitOrWater) {
      this.lives -= 1;
      this.sound.hurt();
      this.spawnParticles(this.ball.x, Math.min(this.ball.y, this.level.waterY), 18, "#ef233c", "burst");
      this.updateHUD();

      if (this.lives <= 0) {
        this.state = "lost";
        this.sound.gameOver();
        this.ui.loseSubtitle.textContent = isPitOrWater
          ? "Jarlik yoki suvga tushib ketdingiz. Qayta urinib ko‘ring!"
          : "O‘tkir tikanlar yoki dushmanlar barcha jonlarni oldi.";
        this.ui.loseModal.classList.remove("hidden");
      } else {
        this.resetBallToRespawn();
        this.addFloatingText(this.ball.x, this.ball.y - 34, "-1 ♥", "#f87171");
      }
    }

    damagePlayer(knockDir) {
      if (this.ball.invulnTimer > 0) return;

      this.lives -= 1;
      this.sound.hurt();
      this.spawnParticles(this.ball.x, this.ball.y, 16, "#ef233c", "burst");
      this.updateHUD();

      if (this.lives <= 0) {
        this.state = "lost";
        this.sound.gameOver();
        this.ui.loseSubtitle.textContent = "Dushman yoki boss bilan to‘qnashuvda jonlaringiz tugadi.";
        this.ui.loseModal.classList.remove("hidden");
        return;
      }

      this.ball.invulnTimer = 1.35;
      this.ball.vx = knockDir * 280;
      this.ball.vy = -340;
      this.ball.onGround = false;
      this.addFloatingText(this.ball.x, this.ball.y - 32, "-1 ♥", "#f87171");
    }

    updateCollectiblesCheckpointsAndPortal() {
      const b = this.ball;

      for (const st of this.level.stars) {
        if (st.collected) continue;
        const bobY = st.y + Math.sin(this.time * 3.5 + st.bobPhase) * 6;
        const dx = b.x - st.x;
        const dy = b.y - bobY;
        if (dx * dx + dy * dy < (b.r + 18) * (b.r + 18)) {
          st.collected = true;
          this.sound.star();
          this.spawnParticles(st.x, bobY, 14, "#facc15", "burst");
          this.addFloatingText(st.x, bobY - 14, "★", "#facc15");
          this.updateHUD();
        }
      }

      for (const cp of this.level.checkpoints) {
        if (cp.activated) continue;
        if (Math.abs(b.x - cp.x) < b.r + 24 && Math.abs(b.y - (cp.y - 30)) < 55) {
          cp.activated = true;
          this.respawnPoint = { x: cp.x, y: cp.y - b.r - 2 };
          this.sound.checkpoint();
          this.spawnParticles(cp.x, cp.y - 45, 14, "#4ade80", "burst");
          this.addFloatingText(cp.x, cp.y - 65, "CHECKPOINT", "#4ade80");
        }
      }

      if (this.level.portal && this.portalCooldown <= 0) {
        const pt = this.level.portal;
        const portalCenterY = pt.y - 34;
        if (Math.hypot(b.x - pt.x, b.y - portalCenterY) < b.r + 24) {
          this.sound.portal();
          this.returnLevelKey = this.level.key;
          this.loadLevelByKey(pt.targetSecretKey, false, true);
        }
      }
    }

    updateGoal() {
      if (!this.level.goal.unlocked) return;
      const g = this.level.goal;
      const b = this.ball;
      const dx = b.x - g.x;
      const dy = b.y - (g.y - 36);

      if (Math.hypot(dx, dy) < b.r + 30) {
        this.completeLevel();
      }
    }

    completeLevel() {
      if (this.state === "won") return;
      this.state = "won";
      this.sound.win();

      const earnedStars = this.level.stars.filter((s) => s.collected).length;
      const prevBest = Number(this.progress.starsByKey[this.level.key] || 0);
      if (earnedStars > prevBest) {
        this.progress.starsByKey[this.level.key] = earnedStars;
      }

      saveProgress(this.progress);
      this.updateHUD();

      const starEls = this.ui.winStarsDisplay.querySelectorAll(".showcase-star");
      starEls.forEach((el, idx) => {
        el.classList.toggle("earned", idx < earnedStars);
      });

      if (this.level.isSecret && this.returnLevelKey) {
        this.ui.winBadgeText.textContent = "YASHIRIN DARAJA YAKUNLANDI";
        this.ui.winSubtitle.textContent = `Yashirin ${this.level.id}-bosqichni o‘tdingiz (${earnedStars}/3 ★)! Asosiy bosqichga qaytishingiz mumkin.`;
        this.ui.nextLevelBtn.textContent = "Asosiy bosqichga qaytish →";
      } else if (this.level.id === MAIN_LEVELS.length) {
        this.ui.winBadgeText.textContent = "90-BOSQICH VA YAKUNIY BOSS YENGILDI!";
        this.ui.winSubtitle.textContent = `Tabriklaymiz! Barcha 90 ta asosiy daraja va 3 ta bossni yengdingiz!`;
        this.ui.nextLevelBtn.textContent = "1-bosqichdan boshlash ↻";
      } else {
        this.ui.winBadgeText.textContent = this.level.isBoss ? "BOSS YENGILDI!" : "BOSQICH YAKUNLANDI";
        this.ui.winSubtitle.textContent = `${this.level.id}-bosqich muvaffaqiyatli yakunlandi (${earnedStars}/3 ★).`;
        this.ui.nextLevelBtn.textContent = "Keyingi bosqich →";
      }

      this.ui.winModal.classList.remove("hidden");
    }

    updateCamera(dt) {
      const targetX = this.ball.x - this.canvas.width * 0.36;
      const maxCamX = Math.max(0, this.level.width - this.canvas.width);
      const clampedX = Math.max(0, Math.min(maxCamX, targetX));
      this.camera.x += (clampedX - this.camera.x) * Math.min(1, dt * 7.5);
    }

    // =========================================================================
    // 7. ZARRALAR VA SUZUVCHI MATNLAR
    // =========================================================================
    spawnParticles(x, y, count, color, mode = "burst") {
      for (let i = 0; i < count; i++) {
        const angle = mode === "dust"
          ? -Math.PI * Math.random()
          : Math.PI * 2 * Math.random();
        const speed = mode === "dust"
          ? 35 + Math.random() * 85
          : 60 + Math.random() * 190;

        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (mode === "splash" ? 110 : 40),
          size: 3 + Math.random() * 4.5,
          color,
          life: 0.35 + Math.random() * 0.3,
          maxLife: 0.65,
        });
      }
    }

    addFloatingText(x, y, text, color) {
      this.floatingTexts.push({
        x,
        y,
        text,
        color,
        vy: -55,
        life: 0.85,
      });
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        pt.vy += 520 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }
        ft.y += ft.vy * dt;
      }
    }

    // =========================================================================
    // 8. CHIZISH (RENDERING) — 3 XIL DUNYO, BOSS VA PORTALLAR
    // =========================================================================
    getWorldPalette() {
      if (this.level.worldId === 2) {
        return {
          skyTop: "#f97316",
          skyMid: "#fdba74",
          skyBot: "#ffedd5",
          sunColor: "#fef08a",
          farHill: "#ea580c",
          nearHill: "#c2410c",
          soilTop: "#9a3412",
          soilBot: "#431407",
          grassMain: "#f59e0b",
          grassLight: "#fde047",
          waterColor: "rgba(234, 88, 12, 0.52)",
          waterLine: "rgba(254, 215, 170, 0.85)",
        };
      }
      if (this.level.worldId === 3) {
        return {
          skyTop: "#090d16",
          skyMid: "#1e1b4b",
          skyBot: "#312e81",
          sunColor: "#e2e8f0",
          farHill: "#1e293b",
          nearHill: "#0f172a",
          soilTop: "#334155",
          soilBot: "#090d16",
          grassMain: "#38bdf8",
          grassLight: "#bae6fd",
          waterColor: "rgba(56, 189, 248, 0.35)",
          waterLine: "rgba(125, 211, 252, 0.85)",
        };
      }
      return {
        skyTop: "#38bdf8",
        skyMid: "#bae6fd",
        skyBot: "#e0f2fe",
        sunColor: "#fef08a",
        farHill: "#86efac",
        nearHill: "#4ade80",
        soilTop: "#7c4a2d",
        soilBot: "#4a2916",
        grassMain: "#22c55e",
        grassLight: "#86efac",
        waterColor: "rgba(14, 165, 233, 0.45)",
        waterLine: "rgba(224, 242, 254, 0.85)",
      };
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const pal = this.getWorldPalette();

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, pal.skyTop);
      skyGrad.addColorStop(0.65, pal.skyMid);
      skyGrad.addColorStop(1, pal.skyBot);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      if (this.level.worldId === 3) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
        for (let i = 0; i < 36; i++) {
          const sx = ((i * 97 + Math.floor(this.time * 4)) % w);
          const sy = ((i * 53) % 240) + 18;
          ctx.fillRect(sx, sy, 2, 2);
        }
      }

      ctx.save();
      ctx.fillStyle = pal.sunColor;
      ctx.beginPath();
      ctx.arc(w - 135, 90, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      this.renderClouds(ctx);
      this.renderParallaxHills(ctx, w, h, pal);

      ctx.save();
      ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

      for (const plat of this.level.platforms) {
        this.renderPlatform(ctx, plat, false, pal);
      }
      for (const mp of this.level.movingPlatforms) {
        this.renderPlatform(ctx, mp, true, pal);
      }

      for (const hz of this.level.hazards) {
        if (hz.kind === "spike") {
          this.renderSpikes(ctx, hz);
        }
      }

      if (this.level.portal) {
        this.renderPortal(ctx, this.level.portal);
      }

      for (const cp of this.level.checkpoints) {
        this.renderFlag(ctx, cp.x, cp.y, cp.activated ? "#22c55e" : "#f59e0b", cp.activated ? "CP ✓" : "CP");
      }
      if (this.level.goal.unlocked) {
        this.renderFlag(ctx, this.level.goal.x, this.level.goal.y, "#ef233c", "FINISH", true);
      } else {
        this.renderFlag(ctx, this.level.goal.x, this.level.goal.y, "#64748b", "BOSS 🔒", true);
      }

      for (const st of this.level.stars) {
        if (!st.collected) {
          this.renderStar(ctx, st);
        }
      }

      for (const en of this.level.enemies) {
        if (en.alive) {
          this.renderEnemy(ctx, en);
        }
      }

      if (this.level.boss && this.level.boss.alive) {
        this.renderBoss(ctx, this.level.boss);
      }

      this.renderRedBall(ctx, this.ball);
      this.renderWater(ctx, w, pal);
      this.renderParticlesAndTexts(ctx);

      ctx.restore();
    }

    renderClouds(ctx) {
      for (const c of this.clouds) {
        const span = this.canvas.width + 260;
        const parallaxX = (((c.x - this.camera.x * 0.18 + this.time * c.speed) % span) + span) % span - 130;
        ctx.save();
        ctx.translate(parallaxX, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.fillStyle = this.level.worldId === 3 ? "rgba(148, 163, 184, 0.25)" : "rgba(255, 255, 255, 0.86)";
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.arc(22, -8, 28, 0, Math.PI * 2);
        ctx.arc(48, -2, 22, 0, Math.PI * 2);
        ctx.arc(24, 10, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    renderParallaxHills(ctx, viewW, viewH, pal) {
      ctx.fillStyle = pal.farHill;
      ctx.beginPath();
      ctx.moveTo(0, viewH);
      for (let x = 0; x <= viewW + 60; x += 60) {
        const worldX = x + this.camera.x * 0.28;
        const y = viewH - 130 - Math.sin(worldX * 0.0045) * 48 - Math.cos(worldX * 0.009) * 22;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(viewW, viewH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pal.nearHill;
      ctx.beginPath();
      ctx.moveTo(0, viewH);
      for (let x = 0; x <= viewW + 50; x += 50) {
        const worldX = x + this.camera.x * 0.5;
        const y = viewH - 85 - Math.cos(worldX * 0.0065 + 1.4) * 34;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(viewW, viewH);
      ctx.closePath();
      ctx.fill();
    }

    renderPlatform(ctx, plat, isMoving, pal) {
      ctx.save();

      if (plat.type === "ground") {
        const soilGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.h);
        soilGrad.addColorStop(0, pal.soilTop);
        soilGrad.addColorStop(1, pal.soilBot);
        ctx.fillStyle = soilGrad;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        const grassH = 16;
        ctx.fillStyle = pal.grassMain;
        ctx.fillRect(plat.x, plat.y, plat.w, grassH);
        ctx.fillStyle = pal.grassLight;
        ctx.fillRect(plat.x, plat.y, plat.w, 4);

        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      } else if (plat.type === "wood") {
        ctx.fillStyle = isMoving ? "#d97706" : "#b45309";
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 7);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    renderSpikes(ctx, hz) {
      const spikeW = 16;
      const count = Math.max(1, Math.floor(hz.w / spikeW));
      const actualW = hz.w / count;

      ctx.save();
      for (let i = 0; i < count; i++) {
        const sx = hz.x + i * actualW;
        const sy = hz.y + hz.h;
        ctx.fillStyle = "#e2e8f0";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + actualW * 0.5, hz.y);
        ctx.lineTo(sx + actualW, sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    renderPortal(ctx, pt) {
      ctx.save();
      const cx = pt.x;
      const cy = pt.y - 36;
      const pulse = 1 + Math.sin(this.time * 6) * 0.08;

      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = "rgba(192, 132, 252, 0.3)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
      grad.addColorStop(0, "#f5d0fe");
      grad.addColorStop(0.55, "#a855f7");
      grad.addColorStop(1, "#3b0764");

      ctx.fillStyle = grad;
      ctx.strokeStyle = "#e9d5ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = "800 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#f5d0fe";
      ctx.fillText("PORTAL", 0, -40);

      ctx.restore();
    }

    renderEnemy(ctx, en) {
      ctx.save();
      const cx = en.x + en.w / 2;
      const cy = en.y + en.h / 2;
      ctx.translate(cx, cy);

      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(-en.w / 2, -en.h / 2, en.w, en.h, 6);
      ctx.fill();
      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const lookOffset = en.dir * 3;
      ctx.fillStyle = "#ef233c";
      ctx.beginPath();
      ctx.arc(-7 + lookOffset, -2, 4.5, 0, Math.PI * 2);
      ctx.arc(7 + lookOffset, -2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12 + lookOffset, -9);
      ctx.lineTo(-3 + lookOffset, -5);
      ctx.moveTo(12 + lookOffset, -9);
      ctx.lineTo(3 + lookOffset, -5);
      ctx.stroke();

      ctx.restore();
    }

    renderBoss(ctx, boss) {
      ctx.save();
      const cx = boss.x + boss.w / 2;
      const cy = boss.y + boss.h / 2;

      ctx.translate(cx, cy);
      ctx.fillStyle = boss.hitCooldown > 0 ? "#ffffff" : "#1e1b4b";
      ctx.beginPath();
      ctx.roundRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h, 12);
      ctx.fill();
      ctx.strokeStyle = "#ef233c";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.fillStyle = "#ef233c";
      ctx.beginPath();
      ctx.arc(-16, -6, 8, 0, Math.PI * 2);
      ctx.arc(16, -6, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-26, -22);
      ctx.lineTo(-10, -14);
      ctx.moveTo(26, -22);
      ctx.lineTo(10, -14);
      ctx.stroke();

      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18, 16);
      ctx.lineTo(18, 16);
      ctx.stroke();

      ctx.restore();

      const barW = 100;
      const barH = 10;
      const bx = cx - barW / 2;
      const by = boss.y - 20;
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(bx, by, barW, barH);
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = "#ef233c";
      ctx.fillRect(bx + 1, by + 1, (barW - 2) * ratio, barH - 2);
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, barW, barH);
      ctx.restore();
    }

    renderStar(ctx, st) {
      const bobY = st.y + Math.sin(this.time * 3.5 + st.bobPhase) * 6;
      ctx.save();
      ctx.translate(st.x, bobY);
      ctx.rotate(Math.sin(this.time * 2 + st.bobPhase) * 0.15);

      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spikes = 5;
      const outerR = 14;
      const innerR = 6.5;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / spikes - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    renderFlag(ctx, x, groundY, color, label, isFinish = false) {
      ctx.save();
      const poleH = isFinish ? 78 : 62;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY - poleH);
      ctx.stroke();

      const wave = Math.sin(this.time * 6) * 4;
      ctx.fillStyle = color;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, groundY - poleH + 4);
      ctx.quadraticCurveTo(x + 22, groundY - poleH + 2 + wave, x + 42, groundY - poleH + 14 + wave);
      ctx.lineTo(x + 2, groundY - poleH + 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.font = "700 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = this.level.worldId === 3 ? "#f8fafc" : "#0f172a";
      ctx.fillText(label, x, groundY - poleH - 10);
      ctx.restore();
    }

    renderRedBall(ctx, b) {
      if (b.invulnTimer > 0 && Math.floor(b.invulnTimer * 16) % 2 === 0) {
        return;
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.scaleX, b.scaleY);
      ctx.rotate(b.angle);

      const grad = ctx.createRadialGradient(-b.r * 0.35, -b.r * 0.35, b.r * 0.15, 0, 0, b.r);
      grad.addColorStop(0, "#ff6b6b");
      grad.addColorStop(0.45, "#ef233c");
      grad.addColorStop(1, "#9b1122");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#18080c";
      ctx.lineWidth = 2.8;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.ellipse(-b.r * 0.36, -b.r * 0.42, b.r * 0.26, b.r * 0.13, -0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-2, -2, 4.2, 5.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#18080c";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(9, -2, 4.2, 5.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const pupilShift = Math.max(-1.5, Math.min(1.5, b.vx * 0.004));
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(-1.2 + pupilShift, -1.5, 2.2, 0, Math.PI * 2);
      ctx.arc(9.8 + pupilShift, -1.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#18080c";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (Math.abs(b.vy) > 460) {
        ctx.arc(4, 7.5, 2.6, 0, Math.PI * 2);
      } else {
        ctx.arc(4, 5.5, 5.2, 0.15 * Math.PI, 0.85 * Math.PI);
      }
      ctx.stroke();

      ctx.restore();
    }

    renderWater(ctx, viewW, pal) {
      const wy = this.level.waterY;
      const totalW = this.level.width;

      ctx.save();
      ctx.fillStyle = pal.waterColor;
      ctx.fillRect(0, wy, totalW, this.level.height - wy + 120);

      ctx.strokeStyle = pal.waterLine;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const startX = Math.max(0, Math.floor(this.camera.x / 20) * 20 - 20);
      const endX = Math.min(totalW, this.camera.x + viewW + 40);
      for (let x = startX; x <= endX; x += 20) {
        const y = wy + Math.sin(x * 0.04 + this.time * 4) * 3.5;
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    renderParticlesAndTexts(ctx) {
      for (const pt of this.particles) {
        const alpha = Math.max(0, pt.life / pt.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const ft of this.floatingTexts) {
        const alpha = Math.min(1, ft.life / 0.4);
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.font = "800 15px sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    new RedBallGame();
  });
})();