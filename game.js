"use strict";

const IMAGE_ASSETS_ENABLED = true;
const BOARD_COLS = 9;
const BOARD_ROWS = 12;
const SLOT_LIMIT = 7;
const CLICK_SOUNDS = [
  "assets/audio/click-01.mp3",
  "assets/audio/click-02.mp3",
  "assets/audio/click-03.mp3",
  "assets/audio/click-04.mp3",
  "assets/audio/click-05.mp3"
];

const TILE_TYPES = [
  { id: "fish", name: "图案01", symbol: "🐟", color: "#9bdcff", image: "图片/0b5149c4caa69449dc0dc0fb2a7b0194.png" },
  { id: "yarn", name: "图案02", symbol: "🧶", color: "#ffb7d5", image: "图片/10.png" },
  { id: "paw", name: "图案03", symbol: "🐾", color: "#ffd37a", image: "图片/25c7ebb1b430c3db4d12d4f3bf5fea73.png" },
  { id: "bell", name: "图案04", symbol: "🔔", color: "#fff08a", image: "图片/40d5367dca768debc9d1c60284a6a79f.jpg" },
  { id: "milk", name: "图案05", symbol: "🥛", color: "#d7f5ff", image: "图片/5b363014265b56a777d4b84bbcf35c09.png" },
  { id: "can", name: "图案06", symbol: "🥫", color: "#ff9b9b", image: "图片/8646e2918dd6fdb36adb39cf524b9fc3.jpg" },
  { id: "box", name: "图案07", symbol: "📦", color: "#d6b48f", image: "图片/a2ef0de911358a27eaa74a66234fd706.jpg" },
  { id: "moon", name: "图案08", symbol: "🌙", color: "#cdd7ff", image: "图片/a6735ccd6a0b9a188988a7d5f884988c.png" },
  { id: "star", name: "图案09", symbol: "⭐", color: "#ffe57a", image: "图片/b8de8bbc653c6e46bd49639aed8697a7.jpg" },
  { id: "flower", name: "图案10", symbol: "🌼", color: "#bff2a7", image: "图片/bf2f655ffa5f722d297b6b95b53a4171.png" },
  { id: "ball", name: "图案11", symbol: "⚽", color: "#c6ecff", image: "图片/c8bb425240ec5553f7d0f2b03e96cff4.png" },
  { id: "bow", name: "图案12", symbol: "🎀", color: "#ffc1ee", image: "图片/f906bbe8b0593c0b07471d1166dfea23.jpg" },
  { id: "leaf", name: "图案13", symbol: "🍃", color: "#8ee0b0", image: "图片/fba4d9f06696f7c890d8e8b2946fa3f6.png" },
  { id: "cookie", name: "图案14", symbol: "🍪", color: "#e8c07d", image: "图片/微信图片_20250305005656.png" },
  { id: "crown", name: "图案15", symbol: "👑", color: "#ffc857", image: "图片/爱你.png" },
  { id: "mouse", name: "图案16", symbol: "🐭", color: "#d9e1ea", image: "图片/阿巴阿巴.png" },
  { id: "heart", name: "图案17", symbol: "❤", color: "#ff9aaa", image: "" },
  { id: "cloud", name: "图案18", symbol: "☁", color: "#d8edff", image: "" },
  { id: "gem", name: "图案19", symbol: "◆", color: "#bda7ff", image: "" },
  { id: "cup", name: "图案20", symbol: "☕", color: "#b9f0e6", image: "" }
];

const TILE_ASSETS = Array.isArray(globalThis.MILEGEMI_TILE_ASSETS)
  ? globalThis.MILEGEMI_TILE_ASSETS
  : [];

TILE_ASSETS.forEach((asset, index) => {
  if (!TILE_TYPES[index]) return;
  const number = String(index + 1).padStart(2, "0");
  TILE_TYPES[index].name = `图案${number}`;
  TILE_TYPES[index].image = asset;
});

const state = {
  level: 1,
  tiles: [],
  tray: [],
  score: 0,
  moves: 0,
  combo: 0,
  gameOver: false,
  won: false,
  round: 0,
  hintId: null,
  undoStack: []
};

const audioState = {
  context: null,
  lastPlayedAt: 0,
  clickPlayers: null,
  recentClickSoundIndexes: [],
  activeSamples: []
};

const el = {};

window.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  bindEvents();
  startLevel(1, { resetScore: true });
}

function cacheElements() {
  el.board = document.getElementById("board");
  el.tray = document.getElementById("tray");
  el.levelLabel = document.getElementById("levelLabel");
  el.remainingCount = document.getElementById("remainingCount");
  el.moveCount = document.getElementById("moveCount");
  el.scoreCount = document.getElementById("scoreCount");
  el.freeCount = document.getElementById("freeCount");
  el.slotCount = document.getElementById("slotCount");
  el.comboCount = document.getElementById("comboCount");
  el.message = document.getElementById("message");
  el.undoBtn = document.getElementById("undoBtn");
  el.shuffleBtn = document.getElementById("shuffleBtn");
  el.hintBtn = document.getElementById("hintBtn");
  el.restartBtn = document.getElementById("restartBtn");
  el.resultOverlay = document.getElementById("resultOverlay");
  el.resultTitle = document.getElementById("resultTitle");
  el.resultText = document.getElementById("resultText");
  el.resultPrimaryBtn = document.getElementById("resultPrimaryBtn");
  el.resultRestartBtn = document.getElementById("resultRestartBtn");
}

function bindEvents() {
  el.undoBtn.addEventListener("click", undoMove);
  el.shuffleBtn.addEventListener("click", shuffleBoard);
  el.hintBtn.addEventListener("click", showHint);
  el.restartBtn.addEventListener("click", () => startLevel(state.level, { resetScore: true }));
  el.resultPrimaryBtn.addEventListener("click", () => {
    if (state.won) {
      startLevel(state.level + 1, { resetScore: false });
      return;
    }
    startLevel(state.level, { resetScore: true });
  });
  el.resultRestartBtn.addEventListener("click", () => startLevel(state.level, { resetScore: true }));

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "r") startLevel(state.level, { resetScore: true });
    if (key === "u") undoMove();
    if (key === "s") shuffleBoard();
    if (key === "h") showHint();
  });
}

function startLevel(level, options = {}) {
  state.level = level;
  state.round += 1;
  state.tiles = createLevelTiles(level, state.round);
  state.tray = [];
  state.moves = 0;
  state.combo = 0;
  state.gameOver = false;
  state.won = false;
  state.hintId = null;
  state.undoStack = [];
  if (options.resetScore) state.score = 0;

  hideResult();
  setMessage(`第 ${level} 关`);
  render();
}

function createLevelTiles(level, round) {
  const rng = createRng(Date.now() + level * 4099 + round * 977);
  const playableTypes = getPlayableTileTypes();
  const difficulty = getLevelDifficulty(level, playableTypes.length);
  const selectedTypes = shuffle([...playableTypes], rng).slice(0, difficulty.typeCount);
  const tileTypeIds = [];

  for (let i = 0; i < difficulty.tripleCount; i += 1) {
    const type = selectedTypes[i % selectedTypes.length];
    tileTypeIds.push(type.id, type.id, type.id);
  }

  shuffle(tileTypeIds, rng);

  const positions = createPositions(difficulty, tileTypeIds.length, rng);
  return tileTypeIds.map((typeId, index) => ({
    id: `tile-${round}-${index}`,
    typeId,
    x: positions[index].x,
    y: positions[index].y,
    z: positions[index].z,
    removed: false
  }));
}

function getLevelDifficulty(level, playableTypeCount) {
  const safeLevel = Math.max(1, level);
  const minTypeCount = Math.min(5, playableTypeCount);
  return {
    level: safeLevel,
    layerCount: clamp(3 + Math.floor((safeLevel - 1) / 3), 3, 8),
    tripleCount: clamp(12 + safeLevel * 2, 14, 48),
    typeCount: clamp(5 + Math.floor((safeLevel - 1) / 2), minTypeCount, playableTypeCount),
    spread: Math.min(0.7, (safeLevel - 1) * 0.04)
  };
}

function createPositions(difficulty, total, rng) {
  const { layerCount, level, spread } = difficulty;
  const candidates = [];
  const centerX = (BOARD_COLS - 1) / 2;
  const centerY = (BOARD_ROWS - 1) / 2;

  for (let z = 0; z < layerCount; z += 1) {
    const offsetX = z % 2 === 0 ? 0 : 0.5;
    const offsetY = z % 3 === 0 ? 0 : 0.5;
    const radiusX = 4.15 + spread - z * 0.12;
    const radiusY = 5.75 + spread - z * 0.17;
    const edgeDropChance = Math.max(0.05, 0.16 - level * 0.006);

    for (let y = 0; y < BOARD_ROWS; y += 1) {
      for (let x = 0; x < BOARD_COLS; x += 1) {
        const px = x + offsetX;
        const py = y + offsetY;
        if (px > BOARD_COLS - 1 || py > BOARD_ROWS - 1) continue;

        const dx = Math.abs(px - centerX) / radiusX;
        const dy = Math.abs(py - centerY) / radiusY;
        const inShape = dx * dx + dy * dy <= 1;
        const softenedEdge = rng() > edgeDropChance || z === layerCount - 1;
        if (inShape && softenedEdge) candidates.push({ x: px, y: py, z });
      }
    }
  }

  if (candidates.length < total) {
    for (let z = 0; z < layerCount; z += 1) {
      for (let y = 0; y < BOARD_ROWS; y += 1) {
        for (let x = 0; x < BOARD_COLS; x += 1) {
          candidates.push({ x, y, z });
        }
      }
    }
  }

  return shuffle(candidates, rng).slice(0, total);
}

function render() {
  renderBoard();
  renderTray();
  renderStats();
  updateButtons();
}

function renderBoard() {
  el.board.textContent = "";
  const fragment = document.createDocumentFragment();
  const activeTiles = state.tiles
    .filter((tile) => !tile.removed)
    .sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);

  activeTiles.forEach((tile) => {
    const meta = getTileMeta(tile.typeId);
    const free = isTileFree(tile);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tile ${free ? "is-free" : "is-blocked"}${state.hintId === tile.id ? " is-hint" : ""}`;
    button.style.left = `${(tile.x / BOARD_COLS) * 100}%`;
    button.style.top = `${(tile.y / BOARD_ROWS) * 100}%`;
    button.style.zIndex = String(tile.z * 20 + Math.round(tile.y * 2));
    button.style.setProperty("--lift-x", `${tile.z * 2}px`);
    button.style.setProperty("--lift-y", `${tile.z * -2}px`);
    button.style.setProperty("--tile-color", meta.color);
    button.setAttribute("aria-label", `${meta.name}${free ? "" : "，被遮挡"}`);
    button.setAttribute("aria-disabled", free ? "false" : "true");
    button.addEventListener("click", () => pickTile(tile.id));
    fillTileFace(button, meta);
    fragment.appendChild(button);
  });

  el.board.appendChild(fragment);
}

function renderTray() {
  el.tray.textContent = "";
  for (let i = 0; i < SLOT_LIMIT; i += 1) {
    const slot = document.createElement("div");
    slot.className = "tray-slot";
    const item = state.tray[i];

    if (item) {
      const meta = getTileMeta(item.typeId);
      slot.classList.add("filled");
      slot.style.setProperty("--tile-color", meta.color);
      fillTileFace(slot, meta);
    }

    el.tray.appendChild(slot);
  }
}

function renderStats() {
  const activeCount = state.tiles.filter((tile) => !tile.removed).length;
  const freeCount = state.tiles.filter((tile) => !tile.removed && isTileFree(tile)).length;
  el.levelLabel.textContent = `第 ${state.level} 关`;
  el.remainingCount.textContent = String(activeCount + state.tray.length);
  el.moveCount.textContent = String(state.moves);
  el.scoreCount.textContent = String(state.score);
  el.freeCount.textContent = String(freeCount);
  el.slotCount.textContent = `${state.tray.length} / ${SLOT_LIMIT}`;
  el.comboCount.textContent = String(state.combo);
}

function updateButtons() {
  const noActiveTiles = state.tiles.every((tile) => tile.removed);
  el.undoBtn.disabled = state.undoStack.length === 0;
  el.shuffleBtn.disabled = state.gameOver || noActiveTiles;
  el.hintBtn.disabled = state.gameOver || noActiveTiles;
}

function pickTile(tileId) {
  if (state.gameOver) return;
  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.removed) return;

  if (!isTileFree(tile)) {
    shakeBoard();
    setMessage("这块还被压着");
    return;
  }

  pushSnapshot();
  playClickSound();
  tile.removed = true;
  addTrayItem({ tileId: tile.id, typeId: tile.typeId });
  state.moves += 1;
  state.hintId = null;

  const removedTriples = resolveMatches();
  if (removedTriples > 0) {
    playMatchSound(removedTriples);
    state.combo += removedTriples;
    state.score += removedTriples * 90 + state.combo * 10;
    setMessage(`消除 ${removedTriples} 组`);
  } else {
    state.combo = 0;
    setMessage(getTileMeta(tile.typeId).name);
  }

  if (state.tiles.every((item) => item.removed) && state.tray.length === 0) {
    winLevel();
  } else if (state.tray.length >= SLOT_LIMIT) {
    loseLevel();
  }

  render();
}

function addTrayItem(item) {
  const lastSameIndex = state.tray.reduce((lastIndex, trayItem, index) => (
    trayItem.typeId === item.typeId ? index : lastIndex
  ), -1);

  if (lastSameIndex === -1) {
    state.tray.push(item);
    return;
  }

  state.tray.splice(lastSameIndex + 1, 0, item);
}

function resolveMatches() {
  const groups = new Map();
  state.tray.forEach((item) => {
    if (!groups.has(item.typeId)) groups.set(item.typeId, []);
    groups.get(item.typeId).push(item.tileId);
  });

  const removeIds = new Set();
  groups.forEach((ids) => {
    if (ids.length >= 3) ids.slice(0, 3).forEach((id) => removeIds.add(id));
  });

  if (removeIds.size === 0) return 0;
  state.tray = state.tray.filter((item) => !removeIds.has(item.tileId));
  return removeIds.size / 3;
}

function shuffleBoard() {
  if (state.gameOver) return;
  const activeTiles = state.tiles.filter((tile) => !tile.removed);
  if (activeTiles.length < 2) return;

  pushSnapshot();
  const positions = shuffle(
    activeTiles.map((tile) => ({ x: tile.x, y: tile.y, z: tile.z })),
    Math.random
  );

  activeTiles.forEach((tile, index) => {
    tile.x = positions[index].x;
    tile.y = positions[index].y;
    tile.z = positions[index].z;
  });

  state.moves += 1;
  state.combo = 0;
  state.hintId = null;
  setMessage("牌面已打散");
  render();
}

function showHint() {
  if (state.gameOver) return;
  const freeTiles = state.tiles.filter((tile) => !tile.removed && isTileFree(tile));
  if (freeTiles.length === 0) return;

  const trayCounts = countBy(state.tray, "typeId");
  let target = freeTiles.find((tile) => trayCounts.get(tile.typeId) >= 2);
  if (!target) target = freeTiles.find((tile) => trayCounts.get(tile.typeId) >= 1);

  if (!target) {
    const freeCounts = countBy(freeTiles, "typeId");
    target = freeTiles.find((tile) => freeCounts.get(tile.typeId) >= 2) || freeTiles[0];
  }

  state.hintId = target.id;
  setMessage(`试试 ${getTileMeta(target.typeId).name}`);
  render();

  window.clearTimeout(showHint.timer);
  showHint.timer = window.setTimeout(() => {
    if (state.hintId === target.id) {
      state.hintId = null;
      render();
    }
  }, 2400);
}

function undoMove() {
  const snapshot = state.undoStack.pop();
  if (!snapshot) return;

  const tileState = new Map(snapshot.tiles.map((tile) => [tile.id, tile]));
  state.tiles.forEach((tile) => {
    const saved = tileState.get(tile.id);
    if (!saved) return;
    tile.x = saved.x;
    tile.y = saved.y;
    tile.z = saved.z;
    tile.removed = saved.removed;
  });

  state.tray = snapshot.tray.map((item) => ({ ...item }));
  state.score = snapshot.score;
  state.moves = snapshot.moves;
  state.combo = snapshot.combo;
  state.gameOver = snapshot.gameOver;
  state.won = snapshot.won;
  state.hintId = null;
  hideResult();
  setMessage("已撤回");
  render();
}

function pushSnapshot() {
  state.undoStack.push({
    tiles: state.tiles.map((tile) => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      z: tile.z,
      removed: tile.removed
    })),
    tray: state.tray.map((item) => ({ ...item })),
    score: state.score,
    moves: state.moves,
    combo: state.combo,
    gameOver: state.gameOver,
    won: state.won
  });

  if (state.undoStack.length > 24) state.undoStack.shift();
}

function isTileFree(tile) {
  return !state.tiles.some((other) => {
    if (other.id === tile.id || other.removed || other.z <= tile.z) return false;
    return overlaps(tile, other);
  });
}

function overlaps(a, b) {
  const size = 0.92;
  return a.x < b.x + size && a.x + size > b.x && a.y < b.y + size && a.y + size > b.y;
}

function winLevel() {
  state.gameOver = true;
  state.won = true;
  state.score += 300 + state.level * 50;
  showResult("过关", `分数 ${state.score}，用了 ${state.moves} 步。`, "下一关");
}

function loseLevel() {
  state.gameOver = true;
  state.won = false;
  state.combo = 0;
  showResult("槽位满了", "换个顺序再试一次。", "重来");
}

function showResult(title, text, primaryText) {
  el.resultTitle.textContent = title;
  el.resultText.textContent = text;
  el.resultPrimaryBtn.textContent = primaryText;
  el.resultOverlay.hidden = false;
}

function hideResult() {
  el.resultOverlay.hidden = true;
}

function setMessage(text) {
  el.message.textContent = text;
}

function playClickSound() {
  const now = Date.now();
  if (now - audioState.lastPlayedAt < 90) return;
  audioState.lastPlayedAt = now;

  if (playClickSample()) return;
  playSynthClickSound();
}

function playClickSample() {
  if (CLICK_SOUNDS.length === 0) return false;

  if (!audioState.clickPlayers) {
    audioState.clickPlayers = CLICK_SOUNDS.map((src) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = 0.55;
      return audio;
    });
  }

  const soundIndex = pickRandomClickSoundIndex(audioState.clickPlayers.length);
  const baseSample = audioState.clickPlayers[soundIndex];
  rememberClickSoundIndex(soundIndex);

  try {
    const sample = baseSample.cloneNode(true);
    sample.volume = 0.55;
    sample.currentTime = 0;
    audioState.activeSamples.push(sample);

    const removeSample = () => {
      audioState.activeSamples = audioState.activeSamples.filter((item) => item !== sample);
    };
    sample.addEventListener("ended", removeSample, { once: true });
    sample.addEventListener("error", removeSample, { once: true });

    const promise = sample.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {
        removeSample();
        playSynthClickSound();
      });
    }
    return true;
  } catch (error) {
    return false;
  }
}

function pickRandomClickSoundIndex(count) {
  if (count <= 1) return 0;

  const recentIndexes = audioState.recentClickSoundIndexes.slice(-2);
  const candidates = [];
  for (let index = 0; index < count; index += 1) {
    if (!recentIndexes.includes(index)) candidates.push(index);
  }

  const pool = candidates.length > 0 ? candidates : Array.from({ length: count }, (_, index) => index);
  return pool[Math.floor(Math.random() * pool.length)];
}

function rememberClickSoundIndex(index) {
  audioState.recentClickSoundIndexes.push(index);
  if (audioState.recentClickSoundIndexes.length > 2) {
    audioState.recentClickSoundIndexes.shift();
  }
}

function playSynthClickSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioState.context) audioState.context = new AudioContextClass();

  const context = audioState.context;
  if (context.state === "suspended") context.resume();

  const start = context.currentTime + 0.01;
  const pattern = [
    { time: 0, frequency: 392, duration: 0.09, gain: 0.12 },
    { time: 0.055, frequency: 523, duration: 0.08, gain: 0.1 },
    { time: 0.13, frequency: 440, duration: 0.07, gain: 0.09 },
    { time: 0.195, frequency: 659, duration: 0.11, gain: 0.11 }
  ];

  pattern.forEach((note) => {
    playPluck(context, start + note.time, note.frequency, note.duration, note.gain);
  });
  playHandDrum(context, start + 0.015, 170, 0.075, 0.055);
  playHandDrum(context, start + 0.145, 220, 0.06, 0.04);
}

function playPluck(context, start, frequency, duration, gainValue) {
  const oscillator = context.createOscillator();
  const secondOscillator = context.createOscillator();
  const toneGain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.92, start + duration);

  secondOscillator.type = "sine";
  secondOscillator.frequency.setValueAtTime(frequency * 1.5, start);
  secondOscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, start + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, start);
  filter.frequency.exponentialRampToValueAtTime(620, start + duration);
  filter.Q.setValueAtTime(5, start);

  toneGain.gain.setValueAtTime(0.0001, start);
  toneGain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  secondOscillator.connect(filter);
  filter.connect(toneGain);
  toneGain.connect(context.destination);

  oscillator.start(start);
  secondOscillator.start(start);
  oscillator.stop(start + duration + 0.03);
  secondOscillator.stop(start + duration + 0.03);
}

function playHandDrum(context, start, frequency, duration, gainValue) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(72, start + duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(260, start);
  filter.Q.setValueAtTime(8, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playMatchSound(multiplier = 1) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioState.context) audioState.context = new AudioContextClass();

  const context = audioState.context;
  if (context.state === "suspended") context.resume();

  const start = context.currentTime + 0.02;
  const notes = [660, 880, 1180];
  notes.forEach((frequency, index) => {
    const noteStart = start + index * 0.07;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, noteStart + 0.12);

    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.16, 0.1 + multiplier * 0.015), noteStart + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.2);
  });
}

function shakeBoard() {
  el.board.classList.remove("shake");
  void el.board.offsetWidth;
  el.board.classList.add("shake");
}

function fillTileFace(target, meta) {
  target.textContent = "";

  if (IMAGE_ASSETS_ENABLED && meta.image) {
    const image = document.createElement("img");
    image.className = "tile-img";
    image.src = meta.image;
    image.alt = meta.name;
    image.draggable = false;
    image.addEventListener("error", () => {
      image.remove();
      addSymbolFace(target, meta);
    }, { once: true });
    target.appendChild(image);
    return;
  }

  addSymbolFace(target, meta);
}

function addSymbolFace(target, meta) {
  const symbol = document.createElement("span");
  symbol.className = "tile-symbol";
  symbol.textContent = meta.symbol;

  const label = document.createElement("span");
  label.className = "tile-label";
  label.textContent = meta.name;

  target.append(symbol, label);
}

function getTileMeta(typeId) {
  return TILE_TYPES.find((type) => type.id === typeId) || TILE_TYPES[0];
}

function getPlayableTileTypes() {
  if (TILE_ASSETS.length >= 3) {
    return TILE_TYPES.slice(0, Math.min(TILE_ASSETS.length, TILE_TYPES.length));
  }
  return TILE_TYPES;
}

function countBy(items, key) {
  const result = new Map();
  items.forEach((item) => {
    const value = item[key];
    result.set(value, (result.get(value) || 0) + 1);
  });
  return result;
}

function shuffle(items, rng = Math.random) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createRng(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}
